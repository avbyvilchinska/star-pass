/* ================= helpers ================= */
const STAR = '★';
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const z = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const weekOf = s => { const d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); };
const today = () => iso(new Date());
const MON = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
const MON_G = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
const DOW = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'];
const DOW_S = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const fmtShort = s => { const d = parse(s); return d.getDate() + ' ' + MON[d.getMonth()]; };
const fmtRange = w => fmtShort(w) + ' – ' + fmtShort(addDays(w, 6));
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtHM = m => z(Math.floor(m / 60)) + ':' + z(m % 60);
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
const dayWord = n => n + ' ' + plural(n, 'день', 'дні', 'днів');
const CHECK = '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
const STAR_PATH = 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z';
const STAR_SVG = `<svg class="star-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
const FLAME_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 1.5s.9 3.1-1.4 6.1C10 10.3 7 12 7 16a5 5 0 0 0 10 0c0-2.3-1-3.9-1-3.9s2.5 1 2.5 4.4A6.5 6.5 0 0 1 5.5 16C5.5 9 13.5 7.8 13.5 1.5z"/></svg>';
const DIFF = { easy: { name: 'Легко', stars: 1 }, med: { name: 'Середньо', stars: 2 }, hard: { name: 'Важко', stars: 3 } };
const CAL_START = 6, CAL_END = 24; // hours shown in the calendar
const BASIC_BONUS_LIMIT = 2;

/* ================= state ================= */
function emptyState() {
  return {
    v: 2, mode: null, onboarded: false, joinedAt: today(), welcome: 0, newsletter: false,
    settings: { sphereBonus: 2 }, spheres: [], tasks: [], sphereDone: {}, challenges: [], rewards: [],
    extras: [], purchases: [], penalties: [], lucky: {}, repairs: {}, minimal: [], mainReward: null
  };
}
const REWARD_PRESETS = [
  { key: 'coffee', name: 'Кава в кавʼярні', cost: 10 },
  { key: 'food', name: 'Улюблена їжа', cost: 25 },
  { key: 'rest', name: 'Вечір без справ', cost: 25 },
  { key: 'movie', name: 'Кіно', cost: 40 },
  { key: 'thing', name: 'Нова річ для себе', cost: 60 }
];
function exampleState() {
  const s = emptyState();
  const w = weekOf(today());
  s.mode = 'basic'; s.onboarded = true; s.welcome = 5;
  s.rewards = REWARD_PRESETS.slice(0, 4).map(r => ({ id: uid(), name: r.name, cost: r.cost, createdAt: today() }));
  s.mainReward = s.rewards[0].id;
  ['Прогулянка 20 хв', 'Прочитати 10 сторінок', 'Розібрати пошту'].forEach((text, i) =>
    s.tasks.push(newTask({ text, diff: i === 1 ? 'med' : 'easy', day: today(), week: w })));
  return s;
}
function newTask(o) {
  const diff = o.diff || 'easy';
  return { id: uid(), text: o.text, diff, stars: o.stars ?? DIFF[diff].stars, week: o.week || weekOf(o.day || today()), day: o.day || null, time: o.time || null, dur: o.dur || 60, sphere: o.sphere || null, done: !!o.done, doneAt: o.done ? today() : null, bonus: !!o.bonus };
}
function migrate(s) {
  const d = emptyState();
  for (const k of Object.keys(d)) if (s[k] === undefined) s[k] = d[k];
  s.settings = Object.assign({ sphereBonus: 2 }, s.settings);
  let changed = false;
  if (!s.v || s.v < 2) {
    s.v = 2; changed = true;
    if (s.tasks.length || s.rewards.length || s.spheres.length) { s.onboarded = true; s.joinedAt = today(); if (!s.welcome) s.welcome = 5; }
  }
  s.rewards.forEach(r => { if (!r.createdAt) r.createdAt = s.joinedAt; });
  s.tasks.forEach(t => { if (!t.dur) t.dur = 60; if (t.time === undefined) t.time = null; });
  if (s.mainReward && !s.rewards.some(r => r.id === s.mainReward)) s.mainReward = null;
  return { s, changed };
}

/* ================= rules ================= */
const isMinimal = d => state.minimal.some(p => d >= p.from && d <= p.to);
const goalOf = d => isMinimal(d) ? 1 : 3;
const isHard = () => state.mode === 'hard';

let C = null; // computed snapshot, rebuilt each render
function calc() {
  const T = today(), cnt = {}, ev = [];
  const sph = Object.fromEntries(state.spheres.map(s => [s.id, s.name]));
  for (const t of state.tasks) if (t.done && t.doneAt) {
    cnt[t.doneAt] = (cnt[t.doneAt] || 0) + 1;
    if (t.stars) ev.push({ date: t.doneAt, stars: t.stars, cat: t.bonus ? 'bonus' : 'tasks', label: t.text, sub: sph[t.sphere] || (t.bonus ? 'бонусна справа' : 'справа') });
  }
  for (const [w, map] of Object.entries(state.sphereDone || {})) for (const [sid, v] of Object.entries(map)) {
    if (sid === '__b' || !v) continue;
    ev.push({ date: typeof v === 'string' ? v : v.date, stars: typeof v === 'string' ? state.settings.sphereBonus : v.stars, cat: 'legacy', label: 'Сфера закрита: ' + (sph[sid] || '—'), sub: fmtRange(w) });
  }
  for (const c of state.challenges) for (const d of Object.keys(c.checks)) ev.push({ date: d, stars: c.stars, cat: 'challenge', label: c.name, sub: 'день челенджу' });
  for (const x of state.extras) ev.push({ date: x.date, stars: x.stars, cat: 'bonus', label: x.text, sub: 'бонусна справа' });
  if (state.welcome) ev.push({ date: state.joinedAt, stars: state.welcome, cat: 'welcome', label: 'Стартові зірки', sub: 'за реєстрацію' });

  const credited = {};
  let streak = 0, best = 0, d = state.joinedAt;
  const first = Object.keys(cnt).sort()[0];
  if (first && first < d) d = first;
  if (d > T) d = T;
  for (let guard = 0; d <= T && guard < 5000; guard++) {
    const c = (cnt[d] || 0) >= goalOf(d);
    credited[d] = c;
    if (c) {
      ev.push({ date: d, stars: isMinimal(d) ? 1 : 2, cat: 'day', label: 'День зараховано', sub: isMinimal(d) ? 'мінімальний план' : 'денна мета' });
      if (state.lucky[d]) ev.push({ date: d, stars: state.lucky[d], cat: 'lucky', label: 'Зірка дня', sub: 'випадковий бонус' });
      streak++; best = Math.max(best, streak);
      if (streak % 7 === 0) ev.push({ date: d, stars: 5, cat: 'streak', label: `Серія ${dayWord(streak)}`, sub: 'бонус за вогник' });
    } else if (!state.repairs[d] && d !== T) streak = 0;
    d = addDays(d, 1);
  }
  const earned = ev.reduce((a, e) => a + e.stars, 0);
  const spent = state.purchases.reduce((a, p) => a + p.cost, 0);
  const burned = state.penalties.reduce((a, p) => a + p.stars, 0);
  return { ev, cnt, credited, streak, best, earned, spent, burned, balance: earned - spent - burned, todayDone: cnt[T] || 0, goal: goalOf(T), todayCredited: !!credited[T] };
}
const CATS = {
  tasks: ['Справи', 'var(--ink)'], day: ['Денна мета', 'var(--good)'], lucky: ['Зірка дня', 'var(--star)'], streak: ['Вогник', 'var(--flame)'],
  challenge: ['Челенджі', 'var(--s4)'], bonus: ['Бонусні справи', 'var(--s5)'], welcome: ['Старт', 'var(--s7)'], legacy: ['Сфери (стара версія)', 'var(--s3)']
};

function repairState() {
  const T = today(), y = addDays(T, -1), yy = addDays(T, -2);
  if (C.credited[y] || state.repairs[y]) return null;
  if (!(C.credited[yy] || state.repairs[yy])) return null;
  if (isHard()) return 'hard';
  if (Object.keys(state.repairs).some(k => k !== y && daysBetween(k, T) <= 7)) return 'used';
  if (!C.todayCredited || C.todayDone < C.goal + 1) return 'need';
  return 'ready';
}
function pace() {
  const T = today(), days = Math.min(7, daysBetween(state.joinedAt, T) + 1), from = addDays(T, -6);
  const sum = C.ev.filter(e => e.cat !== 'welcome' && e.date >= from && e.date <= T).reduce((a, e) => a + e.stars, 0);
  const p = sum / Math.max(1, days);
  return days < 3 || p < 1 ? 5 : p;
}
const daysTo = cost => { const need = cost - Math.max(0, C.balance); return need <= 0 ? 0 : Math.ceil(need / pace()); };
const etaText = cost => { const n = daysTo(cost); return n === 0 ? 'Можна забирати' : '≈ ' + dayWord(n) + ' за твоїм темпом'; };
const mainReward = () => state.rewards.find(r => r.id === state.mainReward) || [...state.rewards].sort((a, b) => a.cost - b.cost)[0] || null;

function forecast() {
  const T = today(), span = Math.min(28, daysBetween(state.joinedAt, T));
  if (span < 7) return { need: 7 - span };
  const by = {};
  for (const e of C.ev) if (e.cat !== 'welcome') by[e.date] = (by[e.date] || 0) + e.stars;
  const daily = [];
  for (let i = span; i >= 1; i--) daily.push(by[addDays(T, -i)] || 0);
  const m = daily.reduce((a, b) => a + b, 0) / daily.length;
  const s = Math.sqrt(daily.reduce((a, b) => a + (b - m) ** 2, 0) / daily.length);
  const last7 = daily.slice(-7).reduce((a, b) => a + b, 0) / 7, prev7 = daily.length >= 14 ? daily.slice(-14, -7).reduce((a, b) => a + b, 0) / 7 : null;
  const band = k => 1.28 * s * Math.sqrt(k);
  return { span, daily, m, s, band, proj: Math.round(30 * m), lo: Math.max(0, Math.round(30 * m - band(30))), hi: Math.round(30 * m + band(30)), trend: prev7 && prev7 > 0 ? (last7 - prev7) / prev7 : null };
}

/* inactivity: 7+ days without any action burns stars (basic: half, hard: all) */
function checkInactivity() {
  if (!loaded || !state.onboarded || !state.mode) return null;
  const T = today();
  let last = state.joinedAt;
  const bump = d => { if (d && d > last && d <= T) last = d; };
  state.tasks.forEach(t => bump(t.doneAt));
  state.challenges.forEach(c => Object.keys(c.checks).forEach(bump));
  state.purchases.forEach(p => bump(p.date));
  state.penalties.forEach(p => bump(p.date));
  state.extras.forEach(x => bump(x.date));
  state.minimal.forEach(p => bump(p.from));
  const gap = daysBetween(last, T);
  if (gap < 7) return null;
  C = calc();
  const bal = Math.max(0, C.balance);
  const stars = isHard() ? bal : Math.floor(bal / 2);
  const p = { id: uid(), date: T, stars, days: gap, mode: state.mode };
  state.penalties.push(p);
  persist();
  return p;
}

/* ================= storage ================= */
const LKEY = 'zoryanyi-shlyakh-v1';
const FB_VER = '10.12.2';
const CFG = window.FIREBASE_CONFIG || {};
const CLOUD = !!(CFG.apiKey && CFG.projectId && !String(CFG.apiKey).includes('ВСТАВ'));
const DEVICE = uid() + uid();
let state = emptyState();
let loaded = false, fb = null, account = null, unwatch = null;
let lastSaved = null, rev = 0, pending = 0, saveTimer = null;
let ui = { tab: 'today', week: weekOf(today()), armed: {}, gate: 'loading', authMode: 'register', authMsg: '', authErr: '', pendingImport: null, editPrice: null, onb: null };
try { const t = localStorage.getItem(LKEY + ':tab'); if (['today', 'calendar', 'rewards', 'profile'].includes(t)) ui.tab = t; } catch (e) {}

function setSave(t) { const el = document.getElementById('save'); if (el) el.textContent = t; }
function readLocal() {
  try { const l = localStorage.getItem(LKEY); if (l) { const s = migrate(JSON.parse(l)).s; if (Array.isArray(s.spheres)) return s; } } catch (e) {}
  return null;
}
function toast(text) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3800);
}
function splitState(s) {
  const { tasks, ...rest } = s;
  const out = { main: JSON.stringify(rest), weeks: {} }, by = {};
  for (const t of tasks) (by[t.week] = by[t.week] || []).push(t);
  for (const [w, list] of Object.entries(by)) out.weeks[w] = JSON.stringify(list);
  return out;
}
async function loadFirebase() {
  const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
  const [app, auth, fs] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const a = app.initializeApp(CFG);
  const au = auth.getAuth(a);
  au.languageCode = 'uk';
  let db;
  try { db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) }); }
  catch (e) { db = fs.getFirestore(a); }
  if (window.ZS_EMULATOR) { auth.connectAuthEmulator(au, 'http://127.0.0.1:9099', { disableWarnings: true }); fs.connectFirestoreEmulator(db, '127.0.0.1', 8085); }
  fb = { auth, fs, au, db };
}
const mainRef = () => fb.fs.doc(fb.db, 'users', account.uid);
const weeksCol = () => fb.fs.collection(fb.db, 'users', account.uid, 'weeks');
async function fetchRemote(data) {
  const snap = await fb.fs.getDocs(weeksCol());
  const s = JSON.parse(data.main);
  s.tasks = [];
  snap.docs.forEach(d => { try { s.tasks.push(...JSON.parse(d.data().tasks)); } catch (e) {} });
  const m = migrate(s);
  state = m.s;
  lastSaved = splitState(state);
  rev = data.rev || 0;
  return m.changed;
}
async function openAccount() {
  showGate('loading');
  const snap = await fb.fs.getDoc(mainRef());
  if (!snap.exists()) { state = emptyState(); startOnboarding(); return; }
  const changed = await fetchRemote(snap.data());
  if (!state.onboarded) { startOnboarding(); return; }
  startApp(changed);
}
function watchRemote() {
  if (!CLOUD || !account) return;
  if (unwatch) unwatch();
  unwatch = fb.fs.onSnapshot(mainRef(), async snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    if (d.device === DEVICE || d.rev === rev || saveTimer || pending) return;
    try { await fetchRemote(d); render(); toast('Оновлено з іншого пристрою'); } catch (e) {}
  }, () => {});
}
function persist() {
  if (!loaded) return;
  setSave('Зберігаю…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 600);
}
function flush() {
  clearTimeout(saveTimer); saveTimer = null;
  if (!CLOUD) {
    try { localStorage.setItem(LKEY, JSON.stringify(state)); setSave('Лише в цьому браузері'); } catch (e) { setSave('Не збереглося'); }
    return;
  }
  if (account) flushCloud();
}
async function flushCloud() {
  const { fs, db } = fb, u = account.uid;
  const cur = splitState(state);
  let known = lastSaved ? Object.keys(lastSaved.weeks) : null;
  if (!known) { try { known = (await fs.getDocs(weeksCol())).docs.map(d => d.id); } catch (e) { known = []; } }
  const batch = fs.writeBatch(db);
  for (const [w, j] of Object.entries(cur.weeks)) if (!lastSaved || lastSaved.weeks[w] !== j) batch.set(fs.doc(db, 'users', u, 'weeks', w), { tasks: j });
  for (const w of known) if (!(w in cur.weeks)) batch.delete(fs.doc(db, 'users', u, 'weeks', w));
  rev = Date.now();
  batch.set(mainRef(), { main: cur.main, rev, device: DEVICE, updatedAt: fs.serverTimestamp(), newsletter: !!state.newsletter, email: state.newsletter ? (account.email || null) : null });
  lastSaved = cur;
  pending++;
  setSave(navigator.onLine === false ? 'Офлайн — збережу пізніше' : 'Зберігаю…');
  batch.commit().then(() => { pending--; if (!pending && !saveTimer) setSave('Збережено'); })
    .catch(e => { pending--; lastSaved = null; setSave('Не збереглося'); toast('Не вдалося зберегти: ' + authError(e)); setTimeout(persist, 5000); });
}
function commit() { persist(); render(); }
window.addEventListener('pagehide', () => { if (saveTimer) flush(); });

/* ================= auth ================= */
const AUTH_ERR = {
  'auth/invalid-email': 'Пошта записана з помилкою.', 'auth/missing-email': 'Введи пошту.', 'auth/missing-password': 'Введи пароль.',
  'auth/weak-password': 'Пароль закороткий — мінімум 6 символів.', 'auth/email-already-in-use': 'Акаунт з такою поштою вже є. Спробуй увійти.',
  'auth/invalid-credential': 'Неправильна пошта або пароль.', 'auth/invalid-login-credentials': 'Неправильна пошта або пароль.',
  'auth/wrong-password': 'Неправильна пошта або пароль.', 'auth/user-not-found': 'Неправильна пошта або пароль.', 'auth/user-disabled': 'Цей акаунт вимкнено.',
  'auth/too-many-requests': 'Забагато спроб. Зачекай кілька хвилин і спробуй ще.', 'auth/network-request-failed': 'Немає звʼязку з сервером. Перевір інтернет.',
  'auth/operation-not-allowed': 'Вхід через пошту не увімкнено у Firebase.', 'auth/configuration-not-found': 'Firebase Authentication ще не увімкнено.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Неправильний apiKey у config.js.',
  'permission-denied': 'Немає доступу до бази. Перевір правила Firestore.', 'unavailable': 'Немає звʼязку з базою. Перевір інтернет.'
};
function authError(e) { return AUTH_ERR[e && e.code] || (e && e.message ? e.message.replace(/^Firebase:\s*/, '') : 'Щось пішло не так.'); }
async function submitAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const passEl = document.getElementById('auth-pass');
  const pass = passEl ? passEl.value : '';
  ui.lastEmail = email; ui.authErr = ''; ui.authMsg = '';
  const btn = document.getElementById('auth-submit'), errEl = document.getElementById('auth-err');
  if (!email) { errEl.textContent = 'Введи пошту.'; return; }
  if (ui.authMode !== 'reset' && pass.length < 6) { errEl.textContent = ui.authMode === 'register' ? 'Пароль закороткий — мінімум 6 символів.' : 'Введи пароль.'; return; }
  btn.disabled = true; btn.textContent = 'Зачекай…'; errEl.textContent = '';
  const A = fb.auth;
  try {
    if (ui.authMode === 'login') await A.signInWithEmailAndPassword(fb.au, email, pass);
    else if (ui.authMode === 'register') {
      const cred = await A.createUserWithEmailAndPassword(fb.au, email, pass);
      A.sendEmailVerification(cred.user).catch(() => {});
      ui.justRegistered = true;
    } else {
      await A.sendPasswordResetEmail(fb.au, email);
      ui.authMode = 'login'; ui.authMsg = 'Якщо акаунт з такою поштою існує, лист уже в дорозі. Перевір і папку «Спам».';
      renderGate();
    }
  } catch (e) { ui.authErr = authError(e); renderGate(); }
}
