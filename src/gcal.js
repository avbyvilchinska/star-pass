/* ================= Google Calendar sync =================
   Справи з днем пишуться в окремий календар «Зоряний шлях» у Google користувача.
   Дозволи: calendar.app.created (лише календарі, створені сайтом) і calendar.freebusy (лише «зайнято/вільно»).
   Працює прямо з браузера: Google Identity Services видає токен на 1 годину, сервер не потрібен. */
const GCID = (window.GOOGLE_CLIENT_ID || '').trim();
const GSCOPES = 'https://www.googleapis.com/auth/calendar.app.created https://www.googleapis.com/auth/calendar.freebusy';
const GAPI = 'https://www.googleapis.com/calendar/v3';
const TZ = (() => {
  let z = 'Europe/Kiev';
  try { z = Intl.DateTimeFormat().resolvedOptions().timeZone || z; } catch (e) {}
  return z === 'Europe/Kyiv' ? 'Europe/Kiev' : z; // Google Calendar API не знає нової назви
})();
let gtok = null, gSyncing = false, gAgain = false, gTimer = null, gStatus = '', gBusy = {}, gErr = '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
// локальний час з явним зсувом: 2026-10-06T16:00:00+03:00 — не залежить від назви часового поясу
function rfc(day, hm) {
  const [y, mo, d] = day.split('-').map(Number), [h, mi] = hm.split(':').map(Number);
  const off = -new Date(y, mo - 1, d, h, mi).getTimezoneOffset(), a = Math.abs(off);
  return `${day}T${hm}:00${off >= 0 ? '+' : '-'}${z(Math.floor(a / 60))}:${z(a % 60)}`;
}
const gOn = () => !!(GCID && state.gcal && state.gcal.on);
const gReady = () => !!(gtok && gtok.exp > Date.now() + 60000);

function loadGis() {
  return new Promise((res, rej) => {
    if (window.google && google.accounts && google.accounts.oauth2) return res();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
    s.onload = () => res(); s.onerror = () => rej(new Error('Не вдалося завантажити вхід Google. Перевір інтернет.'));
    document.head.appendChild(s);
  });
}
async function gToken(interactive) {
  if (gReady()) return gtok.token;
  if (!interactive) return null;
  await loadGis();
  return new Promise((res, rej) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GCID, scope: GSCOPES, hint: account && account.email ? account.email : undefined,
      callback: r => {
        if (r.error) return rej(new Error(r.error_description || r.error));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, 'https://www.googleapis.com/auth/calendar.app.created')) return rej(new Error('Без дозволу на календар «Зоряний шлях» синхронізація не працюватиме.'));
        gtok = { token: r.access_token, exp: Date.now() + (r.expires_in || 3600) * 1000, busy: google.accounts.oauth2.hasGrantedAllScopes(r, 'https://www.googleapis.com/auth/calendar.freebusy') };
        res(gtok.token);
      },
      error_callback: e => rej(new Error(e && e.type === 'popup_closed' ? 'Вікно Google закрито — синхронізацію не підключено.' : e && e.type === 'popup_failed_to_open' ? 'Браузер заблокував вікно Google. Дозволь спливні вікна для цього сайту.' : 'Google: ' + ((e && (e.message || e.type)) || 'помилка')))
    });
    client.requestAccessToken({ prompt: state.gcal && state.gcal.calendarId ? '' : 'consent' });
  });
}
async function gapi(method, path, body, tries = 0) {
  const r = await fetch(GAPI + path, { method, headers: { Authorization: 'Bearer ' + gtok.token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) { gtok = null; throw Object.assign(new Error('Сесія Google закінчилась — натисни «Синхронізувати».'), { code: 401 }); }
  if (r.status === 204) return null;
  const j = await r.json().catch(() => null);
  if ((r.status === 429 || (r.status === 403 && /rate|quota|limit/i.test(JSON.stringify(j || '')))) && tries < 4) { await sleep(800 * 2 ** tries); return gapi(method, path, body, tries + 1); }
  if (!r.ok) throw Object.assign(new Error((j && j.error && j.error.message) || 'HTTP ' + r.status), { code: r.status });
  return j;
}
async function ensureCalendar() {
  const g = state.gcal;
  if (g.calendarId) {
    try { await gapi('GET', `/calendars/${encodeURIComponent(g.calendarId)}`); return; }
    catch (e) { if (e.code !== 404 && e.code !== 410) throw e; g.calendarId = null; g.map = {}; }
  }
  const cal = await gapi('POST', '/calendars', { summary: 'Зоряний шлях', description: 'Справи з «Зоряного шляху». Редагуй їх на сайті — тут вони оновлюються автоматично.', timeZone: TZ });
  g.calendarId = cal.id; g.map = {};
}
function gEventBody(t) {
  const s = sphereById(t.sphere);
  const body = {
    summary: (t.done ? '✓ ' : '') + t.text + ' · ' + t.stars + '★',
    description: `Справа із «Зоряного шляху»${s ? ' · ' + s.name : ''}${t.done ? ' · виконано' : ''}`,
    extendedProperties: { private: { zsTask: t.id } }
  };
  if (t.time) {
    const end = Math.min(toMin(t.time) + (t.dur || 60), 24 * 60 - 1);
    body.start = { dateTime: rfc(t.day, t.time) };
    body.end = { dateTime: rfc(t.day, fmtHM(end)) };
  } else {
    body.start = { date: t.day }; body.end = { date: addDays(t.day, 1) };
  }
  return body;
}
const gSig = t => JSON.stringify([t.text, t.done, t.stars, t.day, t.time, t.dur, t.sphere]);
function gSchedule() {
  if (!gOn() || gSyncing || !gReady()) return;
  clearTimeout(gTimer); gTimer = setTimeout(() => gSync(false), 1500);
}
async function gSync(interactive) {
  if (!gOn()) return;
  if (gSyncing) { gAgain = true; return; }
  let tok = null;
  try { tok = await gToken(interactive); } catch (e) { if (interactive) toast(e.message); }
  if (!tok) { gStatus = 'need'; render(); return; }
  gSyncing = true; gStatus = 'sync'; renderGStatus();
  let n = 0;
  try {
    await ensureCalendar();
    const g = state.gcal, cal = encodeURIComponent(g.calendarId);
    const from = addDays(today(), -14), to = addDays(today(), 90);
    const want = state.tasks.filter(t => t.day && t.day >= from && t.day <= to);
    const wantIds = new Set(want.map(t => t.id));
    for (const [tid, m] of Object.entries(g.map)) {
      const t = state.tasks.find(x => x.id === tid);
      if (wantIds.has(tid) || (t && t.day && (t.day < from || t.day > to))) continue;
      await gapi('DELETE', `/calendars/${cal}/events/${encodeURIComponent(m.id)}`).catch(e => { if (e.code !== 404 && e.code !== 410) throw e; });
      delete g.map[tid]; n++;
    }
    let fail = 0, firstErr = '';
    for (const t of want) {
      const s = gSig(t); let m = g.map[t.id];
      if (m && m.sig === s) continue;
      try {
        if (m) {
          try { await gapi('PUT', `/calendars/${cal}/events/${encodeURIComponent(m.id)}`, gEventBody(t)); m.sig = s; n++; continue; }
          catch (e) { if (e.code !== 404 && e.code !== 410) throw e; }
        }
        const ev = await gapi('POST', `/calendars/${cal}/events`, gEventBody(t));
        g.map[t.id] = { id: ev.id, sig: s }; n++;
      } catch (e) {
        if (e.code === 401) throw e;
        fail++; if (!firstErr) firstErr = `«${t.text}»: ${e.message}`;
      }
    }
    g.last = Date.now();
    if (state.gcal !== g) state.gcal = g; // стан міг оновитися з іншого пристрою під час синхронізації
    persist();
    if (fail) { gStatus = 'err'; gErr = `Не вдалося передати ${fail} ${plural(fail, 'справу', 'справи', 'справ')}. ${firstErr}`; toast('Google Календар: ' + gErr); return; }
    gStatus = 'ok'; gErr = '';
    if (interactive) toast(n ? `Google Календар оновлено: ${n} ${plural(n, 'зміна', 'зміни', 'змін')}` : 'Google Календар уже актуальний');
  } catch (e) {
    gStatus = e.code === 401 ? 'need' : 'err';
    gErr = e.message;
    toast('Google Календар: ' + e.message);
  } finally {
    gSyncing = false; renderGStatus();
    if (gAgain) { gAgain = false; gSync(false); }
  }
}
async function gConnect() {
  state.gcal = Object.assign({ on: true, calendarId: null, map: {}, last: 0, busy: true }, state.gcal || {}, { on: true });
  try { await gToken(true); } catch (e) { state.gcal.on = false; toast(e.message); render(); return; }
  persist(); await gSync(false);
  if (gStatus === 'ok') { const k = Object.keys(state.gcal.map || {}).length; toast(`Google Календар підключено: ${k} ${plural(k, 'справа', 'справи', 'справ')} у календарі «Зоряний шлях»`); }
  gBusy = {}; render();
}
async function gDisconnect(removeCal) {
  gErr = '';
  if (removeCal && state.gcal && state.gcal.calendarId) {
    try { await gToken(true); await gapi('DELETE', `/calendars/${encodeURIComponent(state.gcal.calendarId)}`); }
    catch (e) { if (e.code !== 404) { toast('Не вдалося видалити календар: ' + e.message); return; } }
    state.gcal.calendarId = null; state.gcal.map = {};
  }
  if (gtok && window.google && google.accounts) { try { google.accounts.oauth2.revoke(gtok.token, () => {}); } catch (e) {} }
  gtok = null; gBusy = {}; state.gcal.on = false; gStatus = ''; commit();
  toast(removeCal ? 'Календар «Зоряний шлях» видалено з Google' : 'Google Календар відключено. Події, що вже там є, лишились');
}
/* busy blocks from the user's main Google calendar (only free/busy, no titles) */
async function gLoadBusy(week) {
  if (!gOn() || !state.gcal.busy || !gReady() || !gtok.busy) return;
  const c = gBusy[week];
  if (c && (c.loading || Date.now() - c.at < 5 * 60 * 1000)) return;
  gBusy[week] = { loading: true, at: Date.now(), list: c ? c.list : [] };
  try {
    const tmin = parse(week), tmax = parse(addDays(week, 7));
    const r = await gapi('POST', '/freeBusy', { timeMin: tmin.toISOString(), timeMax: tmax.toISOString(), timeZone: TZ, items: [{ id: 'primary' }] });
    const busy = (r && r.calendars && r.calendars.primary && r.calendars.primary.busy) || [];
    gBusy[week] = { at: Date.now(), list: busy.map(b => ({ s: new Date(b.start), e: new Date(b.end) })) };
    if (ui.tab === 'calendar' && ui.week === week && !drag) render();
  } catch (e) { gBusy[week] = { at: Date.now(), list: [] }; }
}
function gBusyHtml(day) {
  if (!gOn() || !state.gcal.busy) return '';
  const c = gBusy[weekOf(day)]; if (!c || !c.list) return '';
  const d0 = parse(day), d1 = parse(addDays(day, 1));
  return c.list.filter(b => b.e > d0 && b.s < d1).map(b => {
    const s = Math.max(CAL_START * 60, b.s < d0 ? 0 : b.s.getHours() * 60 + b.s.getMinutes());
    const e = Math.min(CAL_END * 60, b.e >= d1 ? 24 * 60 : b.e.getHours() * 60 + b.e.getMinutes());
    if (e <= s) return '';
    return `<div class="busy" style="top:calc(${(s - CAL_START * 60) / 60} * var(--row));height:calc(${(e - s) / 60} * var(--row))" title="Зайнято в Google Календарі ${fmtHM(s)}–${fmtHM(e)}"><span>Google · зайнято</span></div>`;
  }).join('');
}
function gStatusText() {
  if (!gOn()) return '';
  if (gStatus === 'sync') return 'Синхронізую з Google…';
  if (!gReady() || gStatus === 'need') return 'Google: натисни, щоб синхронізувати';
  if (gStatus === 'err') return 'Google: помилка — спробувати ще';
  return state.gcal.last ? 'Google ✓ ' + fmtHM(new Date(state.gcal.last).getHours() * 60 + new Date(state.gcal.last).getMinutes()) : 'Google: синхронізувати';
}
function renderGStatus() { document.querySelectorAll('[data-gstatus]').forEach(el => { el.textContent = gStatusText(); el.classList.toggle('warn', gStatus !== 'ok' || !gReady()); }); }
function gCalendarPill() { return gOn() ? `<button class="gpill ${gStatus === 'ok' && gReady() ? '' : 'warn'}" data-a="g-sync" data-gstatus>${gStatusText()}</button>` : ''; }
function gProfileSection() {
  if (!GCID) return '';
  const g = state.gcal || {};
  if (!g.on) return `<section class="card stack" style="gap:10px"><h3>Google Календар ${tipI('gcal')}</h3>
    <p class="sub" style="margin:0">Справи з днем і часом зʼявлятимуться в окремому календарі «Зоряний шлях» у твоєму Google і оновлюватимуться, коли ти їх переносиш чи відмічаєш. Його видно і в Notion Calendar, якщо там підключений цей Google-акаунт. За бажанням твоя зайнятість з Google показуватиметься сірими блоками в нашому календарі — лише «зайнято», без назв подій.</p>
    <p class="hint" style="margin:0">Сайт отримує доступ тільки до календаря, який сам створить. Інші твої календарі він не бачить і не змінює.</p>
    <div class="row"><button class="btn primary" data-a="g-connect">Підключити Google Календар</button></div></section>`;
  const n = Object.keys(g.map || {}).length;
  return `<section class="card stack" style="gap:12px"><h3>Google Календар ${tipI('gcal')}</h3>
    <p class="sub" style="margin:0">Підключено · календар «Зоряний шлях» · ${n} ${plural(n, 'подія', 'події', 'подій')}${g.last ? ' · остання синхронізація ' + fmtShort(iso(new Date(g.last))) + ' о ' + fmtHM(new Date(g.last).getHours() * 60 + new Date(g.last).getMinutes()) : ''}</p>
    ${gErr ? `<div class="note warn"><span class="grow"><b>Остання помилка:</b> ${esc(gErr)}</span></div>` : ''}
    <label class="check-row"><input type="checkbox" data-c="g-busy" ${g.busy ? 'checked' : ''}><span>Показувати мою зайнятість з Google в календарі «Зоряного шляху»</span></label>
    <div class="row"><button class="btn primary" data-a="g-sync">Синхронізувати зараз</button><button class="btn" data-a="g-off">Відключити</button>
    <button class="btn ghost ${ui.armed.gdel ? 'danger' : ''}" data-a="g-off-del">${ui.armed.gdel ? 'Точно видалити календар з Google?' : 'Відключити й видалити календар з Google'}</button></div>
    <p class="hint" style="margin:0">Синхронізація йде в один бік: із сайту в Google. Зміни, зроблені прямо в Google Календарі, сайт не підхоплює й перезапише при наступній синхронізації.</p></section>`;
}
