/* ================= gate: landing / auth / onboarding ================= */
const LOGO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
function showGate(kind) {
  ui.gate = kind;
  document.getElementById('app').hidden = true;
  document.getElementById('gate').hidden = false;
  renderGate();
  window.scrollTo({ top: 0 });
}
function showApp() {
  document.getElementById('gate').hidden = true;
  document.getElementById('app').hidden = false;
  render();
}
function landing() {
  return `<div class="land">
    <nav class="land-nav"><div class="gate-brand">${LOGO}<span>Зоряний шлях</span></div><button class="btn" data-g="auth" data-m="login">Увійти</button></nav>
    <section class="hero"><div>
      <h1>Заробляй свої <em>винагороди</em></h1>
      <p>Ти сам вирішуєш, скільки коштує кіно чи вечір без справ. Виконуєш 3 справи на день, збираєш зірки і забираєш нагороду без почуття провини.</p>
      <div class="land-cta"><button class="btn primary big" data-g="auth" data-m="register">Почати безкоштовно</button><span class="sub">+5${STAR} за реєстрацію</span></div>
      <p class="sub" style="margin-top:14px">Вже є акаунт? <button class="link" data-g="auth" data-m="login">Увійти</button></p></div>
      <div class="hero-demo" aria-hidden="true">
        <div class="mock"><span class="label">Головна винагорода</span><div style="font-family:var(--f-display);font-size:1.15rem;margin:2px 0 10px">Кіно з друзями</div><div class="bar"><i style="width:78%"></i></div><div class="row" style="justify-content:space-between;margin-top:8px"><span class="num">31 / 40${STAR}</span><span class="hint">≈ 2 дні</span></div></div>
        <div class="mock"><div class="goal">${ring(2, 3, false)}<div><h3>Денна мета: 3 справи</h3><p class="sub">Ще 1 — і отримаєш +2${STAR}</p></div></div></div>
        <div class="mock"><ul class="tasks"><li class="task done" style="--c:var(--s2)"><span class="chk">${CHECK}</span><span class="t">Прогулянка 20 хв</span><span class="chip">1${STAR}</span></li><li class="task done" style="--c:var(--s0)"><span class="chk">${CHECK}</span><span class="t">Розділ з економіки</span><span class="chip">2${STAR}</span></li><li class="task" style="--c:var(--s1)"><span class="chk">${CHECK}</span><span class="t">Тренування</span><span class="chip">3${STAR}</span></li></ul></div>
      </div></section>
    <section class="steps">
      <div class="card step"><span class="step-n">01</span><h3>Обери винагороду</h3><p>Кава, кіно, вечір без справ — і її ціна в зірках. Сайт підкаже, за скільки днів ти її заробиш.</p></div>
      <div class="card step"><span class="step-n">02</span><h3>Виконуй 3 справи на день</h3><p>Кожна справа дає зірки, виконана денна мета — бонус і вогник серії. Розклади тиждень у календарі.</p></div>
      <div class="card step"><span class="step-n">03</span><h3>Забери нагороду</h3><p>Насолоджуйся без почуття провини і поділися перемогою в сторіс.</p></div>
    </section>
    <section style="margin-top:36px"><h2>Два режими гри</h2><div class="modes">${modeCard('basic', false, '')}${modeCard('hard', false, '')}</div></section>
    <div class="land-cta" style="justify-content:center;margin-top:36px"><button class="btn primary big" data-g="auth" data-m="register">Почати безкоштовно</button></div>
    <p class="land-foot">Зоряний шлях · гра у власне життя</p></div>`;
}
function authView() {
  const m = ui.authMode;
  return `<div class="gate-c"><div class="gate-card stack" style="gap:16px">
    <div class="row" style="justify-content:space-between"><div class="gate-brand">${LOGO}<span>Зоряний шлях</span></div><button class="link" data-g="landing">← Назад</button></div>
    ${m !== 'reset' ? `<div class="auth-tabs" role="tablist"><button class="${m === 'register' ? 'on' : ''}" data-g="mode-auth" data-m="register" role="tab">Реєстрація</button><button class="${m === 'login' ? 'on' : ''}" data-g="mode-auth" data-m="login" role="tab">Вхід</button></div>` : '<h2>Відновлення пароля</h2>'}
    ${m === 'register' ? `<p class="sub" style="margin:0">Створи акаунт і отримай перші 5${STAR} для старту.</p>` : ''}
    <form class="stack" style="gap:12px" data-f="auth" novalidate>
      <label class="field auth"><span class="label">Пошта</span><input type="email" id="auth-email" autocomplete="email" inputmode="email" required></label>
      ${m !== 'reset' ? `<label class="field auth"><span class="label">Пароль</span><span class="pw"><input type="password" id="auth-pass" autocomplete="${m === 'login' ? 'current-password' : 'new-password'}" minlength="6" required><button type="button" class="link" data-g="showpw">показати</button></span>${m === 'register' ? '<small class="sub">Мінімум 6 символів</small>' : ''}</label>` : '<p class="sub" style="margin:0">Надішлемо лист із посиланням для нового пароля.</p>'}
      <p class="err" id="auth-err" role="alert">${esc(ui.authErr)}</p><p class="ok">${esc(ui.authMsg)}</p>
      <button class="btn primary big" type="submit" id="auth-submit">${m === 'login' ? 'Увійти' : m === 'register' ? 'Створити акаунт' : 'Надіслати лист'}</button>
    </form>
    ${m === 'login' ? '<button class="link" data-g="mode-auth" data-m="reset">Забув пароль?</button>' : m === 'reset' ? '<button class="link" data-g="mode-auth" data-m="login">Повернутися до входу</button>' : ''}
  </div></div>`;
}
function startOnboarding() {
  ui.onb = { step: 1, mode: null, picks: ['coffee'], custom: '', customCost: 30, tasks: ['', '', ''], newsletter: false, modeOnly: false };
  showGate('onboard');
}
function onboardView() {
  const o = ui.onb, dots = `<div class="steps-dots">${[1, 2, 3].map(i => `<i class="${i <= o.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const head = `<div class="row" style="justify-content:space-between"><div class="gate-brand">${LOGO}<span>Зоряний шлях</span></div>${o.modeOnly ? '' : dots}</div>`;
  let body = '';
  if (o.step === 1) {
    const loc = CLOUD ? readLocal() : null;
    body = `<div><h2>${o.modeOnly ? 'Новий вибір: режим гри' : 'Обери складність'}</h2><p class="sub">Від режиму залежать правила. Змінити можна будь-коли в профілі.</p></div>
      <div class="grid2">${modeCard('basic', o.mode === 'basic', 'onb-mode')}${modeCard('hard', o.mode === 'hard', 'onb-mode')}</div>
      <div class="row" style="justify-content:space-between"><span class="hint">${o.mode ? '' : 'Обери один із режимів'}</span><button class="btn primary big" data-g="onb-next" ${o.mode ? '' : 'disabled'}>${o.modeOnly ? 'Готово' : 'Далі'}</button></div>
      ${o.modeOnly ? '' : `<div class="row" style="gap:16px">${loc && (loc.tasks.length || loc.rewards.length) ? '<button class="link" data-g="onb-local">Перенести прогрес з цього браузера</button>' : ''}<label class="link" for="onb-file">Відновити з резервної копії</label><input type="file" id="onb-file" accept="application/json,.json" hidden></div>`}
      <p class="err" id="onb-err"></p>`;
  } else if (o.step === 2) {
    body = `<div><h2>Що тебе порадує?</h2><p class="sub">Обери 1–3 винагороди. Перша стане головною, ціни можна змінити пізніше.</p></div>
      <div class="pick">${REWARD_PRESETS.map(r => `<button type="button" class="${o.picks.includes(r.key) ? 'on' : ''}" data-g="onb-pick" data-k="${r.key}"><span>${r.name}</span><span class="price">${r.cost}${STAR}</span></button>`).join('')}</div>
      <div class="row"><input type="text" id="onb-custom" placeholder="Своя винагорода" value="${esc(o.custom)}" style="flex:1 1 180px" aria-label="Своя винагорода"><label class="row" style="gap:6px"><span class="sub">ціна</span><input type="number" id="onb-custom-cost" value="${o.customCost}" min="1" max="9999"></label></div>
      <div class="row" style="justify-content:space-between"><button class="btn ghost" data-g="onb-back">Назад</button><button class="btn primary big" data-g="onb-next">Далі</button></div>`;
  } else {
    const ph = ['Наприклад: прогулянка 20 хв', 'Наприклад: 10 сторінок книги', 'Наприклад: розібрати конспект'];
    body = `<div><h2>Три справи на сьогодні</h2><p class="sub">Це твоя денна мета. Виконаєш усі три — день зараховано і запалиться вогник.</p></div>
      <div class="stack" style="gap:8px">${[0, 1, 2].map(i => `<div class="row"><input type="text" id="onb-t${i}" value="${esc(o.tasks[i])}" placeholder="${ph[i]}" style="flex:1 1 200px" aria-label="Справа ${i + 1}">${o.mode === 'hard' ? `<input type="number" id="onb-s${i}" value="${i === 1 ? 2 : 1}" min="1" max="10" aria-label="Зірки">` : `<select id="onb-s${i}" aria-label="Складність">${Object.entries(DIFF).map(([k, d]) => `<option value="${k}" ${k === (i === 1 ? 'med' : 'easy') ? 'selected' : ''}>${d.name} · ${d.stars}${STAR}</option>`).join('')}</select>`}</div>`).join('')}</div>
      <label class="check-row"><input type="checkbox" id="onb-news" ${o.newsletter ? 'checked' : ''}><span>Надсилати мені новини про оновлення (не частіше ніж раз на місяць)</span></label>
      <p class="err" id="onb-err"></p>
      <div class="row" style="justify-content:space-between"><button class="btn ghost" data-g="onb-back">Назад</button><button class="btn star big" data-g="onb-finish">Почати гру · +5${STAR}</button></div>`;
  }
  return `<div class="gate-c"><div class="gate-card wide stack" style="gap:18px">${head}${body}</div></div>`;
}
function renderGate() {
  const g = document.getElementById('gate');
  if (ui.gate === 'loading') { g.innerHTML = `<div class="gate-c"><div class="gate-card"><div class="gate-brand">${LOGO}<span>Зоряний шлях</span></div><p class="sub">Завантаження…</p></div></div>`; return; }
  if (ui.gate === 'error') { g.innerHTML = `<div class="gate-c"><div class="gate-card stack" style="gap:14px"><div class="gate-brand">${LOGO}<span>Зоряний шлях</span></div><h2>Не вдалося відкрити акаунт</h2><p class="err">${esc(ui.authErr)}</p><div class="row"><button class="btn primary" data-g="retry">Спробувати ще</button><button class="btn ghost" data-g="logout">Вийти</button></div></div></div>`; return; }
  if (ui.gate === 'landing') { g.innerHTML = landing(); return; }
  if (ui.gate === 'auth') {
    g.innerHTML = authView();
    const em = document.getElementById('auth-email');
    if (em) { em.value = ui.lastEmail || ''; (em.value ? document.getElementById('auth-pass') || em : em).focus(); }
    return;
  }
  if (ui.gate === 'onboard') g.innerHTML = onboardView();
}
function saveOnbInputs() {
  const o = ui.onb, v = id => document.getElementById(id);
  if (v('onb-custom')) { o.custom = v('onb-custom').value.trim(); o.customCost = Math.max(1, parseInt(v('onb-custom-cost').value, 10) || 30); }
  if (v('onb-t0')) { o.tasks = [0, 1, 2].map(i => v('onb-t' + i).value.trim()); o.stars = [0, 1, 2].map(i => v('onb-s' + i).value); o.newsletter = v('onb-news').checked; }
}
function finishOnboarding() {
  saveOnbInputs();
  const o = ui.onb;
  if (!o.tasks.some(Boolean)) { document.getElementById('onb-err').textContent = 'Додай хоча б одну справу на сьогодні.'; return; }
  const s = emptyState();
  s.mode = o.mode; s.onboarded = true; s.welcome = 5; s.joinedAt = today(); s.newsletter = o.newsletter;
  o.picks.forEach(k => { const r = REWARD_PRESETS.find(x => x.key === k); if (r) s.rewards.push({ id: uid(), name: r.name, cost: r.cost, createdAt: today(), lockedUntil: addDays(today(), 7) }); });
  if (o.custom) s.rewards.unshift({ id: uid(), name: o.custom, cost: o.customCost, createdAt: today(), lockedUntil: addDays(today(), 7) });
  s.mainReward = s.rewards[0] ? s.rewards[0].id : null;
  state = s;
  o.tasks.forEach((text, i) => {
    if (!text) return;
    const raw = o.stars[i];
    const st = o.mode === 'hard' ? { stars: Math.min(10, Math.max(1, parseInt(raw, 10) || 1)) } : { diff: raw, stars: DIFF[raw].stars };
    state.tasks.push(newTask({ text, day: today(), ...st, diff: st.diff || (st.stars >= 3 ? 'hard' : st.stars === 2 ? 'med' : 'easy') }));
  });
  ui.onb = null; ui.tab = 'today';
  lastSaved = null; loaded = true; flush();
  startApp(false);
  toast(`+5${STAR} за старт. Виконай 3 справи — і день зараховано`);
}
function adoptState(s) {
  state = migrate(s).s; state.onboarded = true; if (!state.welcome) state.welcome = 5;
  lastSaved = null; loaded = true;
  if (!state.mode) { ui.onb.step = 1; ui.onb.modeOnly = true; ui.onb.mode = null; renderGate(); return; }
  flush(); startApp(false);
}
function startApp(changed) {
  loaded = true;
  if (!state.mode) { ui.onb = { step: 1, mode: null, modeOnly: true }; showGate('onboard'); return; }
  watchRemote();
  showApp();
  setSave(!CLOUD ? 'Лише в цьому браузері' : pending ? 'Зберігаю…' : 'Збережено');
  if (changed) persist();
  const p = checkInactivity();
  if (p) { render(); openPenalty(p); }
  else if (ui.justRegistered) { ui.justRegistered = false; toast('Лист для підтвердження пошти надіслано. Перевір і «Спам».'); }
}

/* ================= drag & drop (pointer-based: works with mouse and touch) ================= */
let drag = null, autoRaf = null, suppressClick = false;
function colTarget(col, clientY, offY) {
  const r = col.getBoundingClientRect(), row = r.height / (CAL_END - CAL_START);
  let mins = CAL_START * 60 + Math.round(((clientY - offY - r.top) / row) * 2) * 30;
  return Math.max(CAL_START * 60, Math.min(CAL_END * 60 - 30, mins));
}
function clearDropUI() {
  document.querySelectorAll('.drop-prev').forEach(x => x.remove());
  document.querySelectorAll('.hover').forEach(x => x.classList.remove('hover'));
}
function startDrag(e) {
  drag.started = true;
  const r = drag.el.getBoundingClientRect();
  drag.offY = drag.el.classList.contains('ev') ? Math.min(e.clientY - r.top, 20) : 0;
  const g = document.createElement('div');
  g.className = 'ctask drag-ghost'; g.style.setProperty('--c', drag.el.style.getPropertyValue('--c'));
  const t = state.tasks.find(x => x.id === drag.id);
  g.innerHTML = `<span class="t">${esc(t ? t.text : '')}</span>`;
  document.body.appendChild(g); drag.ghost = g;
  drag.el.classList.add('dragging'); document.body.classList.add('is-dragging');
  const loop = () => {
    if (!drag || !drag.started) return;
    const sc = document.getElementById('cal-scroll');
    if (sc) { const r2 = sc.getBoundingClientRect(); if (drag.x < r2.left + 40) sc.scrollLeft -= 12; else if (drag.x > r2.right - 40) sc.scrollLeft += 12; }
    if (drag.y < 70) window.scrollBy(0, -12); else if (drag.y > innerHeight - 70) window.scrollBy(0, 12);
    autoRaf = requestAnimationFrame(loop);
  };
  autoRaf = requestAnimationFrame(loop);
}
function moveDrag(e) {
  drag.x = e.clientX; drag.y = e.clientY;
  drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
  clearDropUI();
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  const zone = hit && hit.closest('[data-drop]');
  drag.target = null;
  if (!zone) return;
  if (zone.dataset.drop === 'col') {
    const mins = colTarget(zone, e.clientY, drag.offY);
    const t = state.tasks.find(x => x.id === drag.id), dur = (t && t.dur) || 60;
    const p = document.createElement('div');
    p.className = 'drop-prev';
    p.style.top = `calc(${(mins - CAL_START * 60) / 60} * var(--row))`; p.style.height = `calc(${dur / 60} * var(--row) - 2px)`;
    p.textContent = fmtHM(mins);
    zone.appendChild(p);
    drag.target = { type: 'col', day: zone.dataset.day, mins };
  } else { zone.classList.add('hover'); drag.target = { type: zone.dataset.drop, day: zone.dataset.day || null }; }
}
function endDrag() {
  cancelAnimationFrame(autoRaf);
  const t = state.tasks.find(x => x.id === drag.id), tg = drag.target;
  drag.ghost.remove(); drag.el.classList.remove('dragging'); document.body.classList.remove('is-dragging'); clearDropUI();
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 50);
  if (!t || !tg) return;
  if (tg.type === 'col') { t.day = tg.day; t.time = fmtHM(tg.mins); t.week = weekOf(tg.day); t.dur = t.dur || 60; }
  else if (tg.type === 'allday') { t.day = tg.day; t.time = null; t.week = weekOf(tg.day); }
  else if (tg.type === 'pool') { t.day = null; t.time = null; t.week = ui.week; }
  commit();
}
document.addEventListener('pointerdown', e => {
  if (e.button > 0 || document.getElementById('app').hidden) return;
  const el = e.target.closest('.drag'), col = !el && e.target.closest('.cal-col');
  if (el) drag = { id: el.dataset.id, el, x0: e.clientX, y0: e.clientY, started: false };
  else if (col) drag = { col, x0: e.clientX, y0: e.clientY, started: false };
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    if (!drag.el) { drag = null; return; } // moving on empty grid = scroll, not a tap
    startDrag(e);
  }
  moveDrag(e); e.preventDefault();
}, { passive: false });
document.addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag; drag = null;
  if (d.started) { drag = d; endDrag(); drag = null; return; }
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 50);
  if (d.el) openTaskSheet(d.id);
  else if (d.col) openQuickAdd(d.col.dataset.day, colTarget(d.col, e.clientY, 0));
});
document.addEventListener('pointercancel', () => {
  if (drag && drag.started) { cancelAnimationFrame(autoRaf); drag.ghost.remove(); drag.el.classList.remove('dragging'); document.body.classList.remove('is-dragging'); clearDropUI(); }
  drag = null;
});

/* ================= feedback ================= */
function burst(el, n) {
  if (!el || n <= 0) return;
  const r = el.getBoundingClientRect();
  const b = document.createElement('span');
  b.className = 'burst'; b.textContent = '+' + n + STAR;
  b.style.left = (r.left + r.width / 2 - 18) + 'px'; b.style.top = (r.top - 6) + 'px';
  document.body.appendChild(b); setTimeout(() => b.remove(), 1000);
}
function arm(key) {
  if (ui.armed[key]) { delete ui.armed[key]; return true; }
  ui.armed = { [key]: true };
  setTimeout(() => { if (ui.armed[key]) { delete ui.armed[key]; render(); } }, 4000);
  render(); return false;
}
function afterDone(wasCredited) {
  const now = calc();
  if (!wasCredited && now.todayCredited) toast(`День зараховано! +${isMinimal(today()) ? 1 : 2}${STAR} і вогник горить. Відкрий зірку дня`);
}

/* ================= import helpers ================= */
function parsePlan(text) {
  const out = []; let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const head = line.match(/^\d+[.)]\s*(.+?)\s*\+?\s*$/) || line.match(/^(.+?):\s*$/);
    if (head) { cur = { name: head[1].trim(), tasks: [] }; out.push(cur); continue; }
    if (!cur) continue;
    line.split(/\s\+\s|\s\+$/).map(s => s.trim()).filter(Boolean).forEach(t => cur.tasks.push(t));
  }
  return out;
}
const norm = s => s.toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi, '');
function findSphere(name) { const n = norm(name); return state.spheres.find(s => norm(s.name) === n) || state.spheres.find(s => { const m = norm(s.name); return m.startsWith(n.slice(0, 4)) || n.startsWith(m.slice(0, 4)); }); }
function readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { try { const s = JSON.parse(r.result); if (!s || !Array.isArray(s.tasks) || !Array.isArray(s.rewards)) throw 0; res(migrate(s).s); } catch (e) { rej(new Error('Це не схоже на резервну копію Зоряного шляху.')); } };
    r.onerror = () => rej(new Error('Не вдалося прочитати файл.'));
    r.readAsText(file);
  });
}
function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'zoryanyi-shlyakh-' + today() + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ================= events ================= */
document.getElementById('tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  goTab(b.dataset.tab);
});
function goTab(t) { ui.tab = t; ui.armed = {}; ui.editPrice = null; try { localStorage.setItem(LKEY + ':tab', t); } catch (er) {} render(); window.scrollTo({ top: 0 }); }

document.addEventListener('click', async e => {
  if (e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
  const g = e.target.closest('[data-g]');
  if (g) {
    const k = g.dataset.g;
    if (k === 'auth' || k === 'mode-auth') { ui.authMode = g.dataset.m; ui.authErr = ''; ui.authMsg = ''; const em = document.getElementById('auth-email'); if (em) ui.lastEmail = em.value.trim(); showGate('auth'); }
    else if (k === 'landing') showGate('landing');
    else if (k === 'showpw') { const p = document.getElementById('auth-pass'); p.type = p.type === 'password' ? 'text' : 'password'; g.textContent = p.type === 'password' ? 'показати' : 'сховати'; }
    else if (k === 'logout') { if (fb) fb.auth.signOut(fb.au); }
    else if (k === 'retry') { ui.authErr = ''; try { await openAccount(); } catch (er) { ui.authErr = authError(er); showGate('error'); } }
    else if (k === 'onb-next') {
      const o = ui.onb; saveOnbInputs();
      if (o.modeOnly) { state.mode = o.mode; ui.onb = null; flush(); startApp(false); toast(o.mode === 'hard' ? 'Режим: важкий' : 'Режим: базовий'); return; }
      if (o.step === 2 && !o.picks.length && !o.custom) { toast('Обери хоча б одну винагороду'); return; }
      o.step++; renderGate();
    }
    else if (k === 'onb-back') { saveOnbInputs(); ui.onb.step--; renderGate(); }
    else if (k === 'onb-pick') { saveOnbInputs(); const o = ui.onb, i = o.picks.indexOf(g.dataset.k); if (i >= 0) o.picks.splice(i, 1); else if (o.picks.length < 3) o.picks.push(g.dataset.k); else toast('Максимум 3 — решту додаси потім'); renderGate(); }
    else if (k === 'onb-finish') finishOnboarding();
    else if (k === 'onb-local') adoptState(readLocal());
    return;
  }
  const b = e.target.closest('[data-a]');
  if (!b) return;
  const a = b.dataset.a, id = b.dataset.id;
  if (a === 'onb-mode') { saveOnbInputs(); ui.onb.mode = b.dataset.m; renderGate(); return; }
  if (!loaded) return;
  const task = id && state.tasks.find(t => t.id === id);
  const T = today();
  switch (a) {
    case 'task': {
      const was = C.todayCredited;
      task.done = !task.done; task.doneAt = task.done ? T : null;
      if (task.done) { burst(b, task.stars); if (!task.day) { task.day = T; task.week = weekOf(T); } }
      commit(); if (task.done) afterDone(was); return;
    }
    case 'stars': { const seq = [1, 2, 3, 5, 10]; task.stars = seq[(seq.indexOf(task.stars) + 1) % seq.length]; return commit(); }
    case 'edit': return openTaskSheet(id);
    case 'settoday': task.day = T; task.week = weekOf(T); return commit();
    case 'go': return goTab(b.dataset.tab);
    case 'acct': return goTab('profile');
    case 'lucky': {
      if (!C.todayCredited || state.lucky[T]) return;
      const n = [1, 1, 1, 1, 1, 1, 2, 2, 2, 3][Math.floor(Math.random() * 10)];
      state.lucky[T] = n; burst(b, n); commit(); return;
    }
    case 'repair': { if (repairState() !== 'ready') return; state.repairs[addDays(T, -1)] = true; commit(); toast('Вогник повернувся — серія триває'); return; }
    case 'buy': {
      const r = state.rewards.find(x => x.id === id);
      if (!r || C.balance < r.cost) return;
      if (ui.tab !== 'rewards' || arm(id)) {
        const p = { id: uid(), rewardId: r.id, name: r.name, cost: r.cost, date: T };
        state.purchases.push(p); ui.armed = {}; commit(); openPurchase(p);
      }
      return;
    }
    case 'share': { const p = state.purchases.find(x => x.id === id); if (p) { if (!p.stat) openPurchase(p); shareCard(p); } return; }
    case 'main': state.mainReward = id; commit(); toast('Головну винагороду змінено'); return;
    case 'price-edit': ui.editPrice = ui.editPrice === id ? null : id; render('price-' + id); return;
    case 'price-cancel': ui.editPrice = null; render(); return;
    case 'delrw': if (arm('d' + id)) { state.rewards = state.rewards.filter(r => r.id !== id); if (state.mainReward === id) state.mainReward = null; commit(); } return;
    case 'delbuy': state.purchases = state.purchases.filter(p => p.id !== id); return commit();
    case 'wk': ui.week = addDays(ui.week, +b.dataset.d); return render();
    case 'wk0': ui.week = weekOf(T); return render();
    case 'chday': { const c = state.challenges.find(x => x.id === id), d = b.dataset.d; if (c.checks[d]) delete c.checks[d]; else { c.checks[d] = true; burst(b, c.stars); } return commit(); }
    case 'delch': if (arm(id)) { state.challenges = state.challenges.filter(c => c.id !== id); commit(); } return;
    case 'minimal': return openMinimal();
    case 'minimal-on': {
      const n = +b.dataset.n || 3;
      state.minimal = state.minimal.filter(p => p.to < T);
      state.minimal.push({ from: T, to: addDays(T, n - 1) });
      closeSheet(); commit(); toast(`Мінімальний план до ${fmtShort(addDays(T, n - 1))}: денна мета — 1 справа`); return;
    }
    case 'minimal-off': state.minimal = state.minimal.map(p => (T >= p.from && T <= p.to) ? { ...p, to: addDays(T, -1) } : p).filter(p => p.to >= p.from); commit(); toast('Мінімальний план вимкнено'); return;
    case 'set-mode': if (state.mode !== b.dataset.m) { state.mode = b.dataset.m; commit(); toast(state.mode === 'hard' ? 'Режим: важкий — тільки ти і твоя дисципліна' : 'Режим: базовий'); } return;
    case 'verify': try { await fb.auth.sendEmailVerification(account); toast('Лист надіслано на ' + account.email); } catch (er) { toast(authError(er)); } return;
    case 'pwreset': try { await fb.auth.sendPasswordResetEmail(fb.au, account.email); toast('Посилання для зміни пароля надіслано на ' + account.email); } catch (er) { toast(authError(er)); } return;
    case 'logout': if (saveTimer) flush(); ui.tab = 'today'; await fb.auth.signOut(fb.au); return;
    case 'export': return exportBackup();
    case 'imp-yes': state = ui.pendingImport; state.onboarded = true; if (!state.mode) state.mode = 'basic'; ui.pendingImport = null; commit(); toast('Дані відновлено з файлу'); return;
    case 'imp-no': ui.pendingImport = null; return render();
    case 'import-local': { const l = readLocal(); if (l) { ui.pendingImport = l; render(); } return; }
    case 'doimport': {
      const blocks = parsePlan(document.getElementById('import-text').value); let n = 0;
      for (const bl of blocks) {
        let s = findSphere(bl.name);
        if (!s) { s = { id: uid(), name: bl.name.replace(/^./, c => c.toUpperCase()), c: state.spheres.length % 8 }; state.spheres.push(s); }
        for (const text of bl.tasks) { state.tasks.push(newTask({ text, week: weekOf(T), sphere: s.id })); n++; }
      }
      if (!n) { document.getElementById('import-msg').textContent = 'Не знайшов жодної справи. Назви сфер мають бути пронумеровані: «1. Книги».'; return; }
      commit(); toast(`Додано ${n} ${plural(n, 'справу', 'справи', 'справ')} у план тижня — розклади їх у календарі`); return;
    }
    case 'reset': if (arm('reset')) { const m = state.mode; state = emptyState(); state.mode = m; state.onboarded = true; commit(); } return;
    case 'color': { const s = sphereById(id); s.c = +b.dataset.c; return commit(); }
    case 'delsph': if (arm(id)) { state.spheres = state.spheres.filter(s => s.id !== id); state.tasks.forEach(t => { if (t.sphere === id) t.sphere = null; }); commit(); } return;
    case 'sheet-del': state.tasks = state.tasks.filter(t => t.id !== id); closeSheet(); return commit();
  }
});

document.addEventListener('submit', e => {
  const f = e.target.closest('[data-f]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.f === 'auth') { submitAuth(); return; }
  if (!loaded) return;
  const T = today();
  const val = id => document.getElementById(id).value.trim();
  const num = (id, d) => { const n = parseInt(document.getElementById(id).value, 10); return isNaN(n) ? d : Math.max(0, n); };
  switch (f.dataset.f) {
    case 'addtoday': { const text = val('today-text'); if (!text) return; state.tasks.push(newTask({ text, day: T, ...readStars('today-stars') })); persist(); render('today-text'); return; }
    case 'addweek': { const text = val('week-text'); if (!text) return; state.tasks.push(newTask({ text, week: ui.week, ...readStars('week-stars') })); persist(); render('week-text'); return; }
    case 'addbonus': {
      const text = val('bonus-text'); if (!text) return;
      if (!isHard() && state.tasks.filter(t => t.bonus && t.doneAt === T).length >= BASIC_BONUS_LIMIT) { toast(`У базовому режимі — до ${BASIC_BONUS_LIMIT} бонусних справ на день`); return; }
      const was = C.todayCredited, t = newTask({ text, day: T, done: true, bonus: true, ...readStars('bonus-stars') });
      state.tasks.push(t); burst(f.querySelector('button'), t.stars); persist(); render(); afterDone(was); return;
    }
    case 'addrw': {
      const name = val('rw-name'); if (!name) return;
      const r = { id: uid(), name, cost: Math.max(1, num('rw-cost', 25)), createdAt: T, lockedUntil: addDays(T, 7) };
      state.rewards.push(r); if (!state.mainReward) state.mainReward = r.id; commit(); return;
    }
    case 'price': {
      const r = state.rewards.find(x => x.id === f.dataset.id), n = Math.max(1, num('price-' + r.id, r.cost));
      if (!isHard() && n < r.cost && r.lockedUntil && T < r.lockedUntil) { toast(`У базовому режимі знизити ціну можна з ${fmtShort(r.lockedUntil)}`); return; }
      r.cost = n; if (!isHard()) r.lockedUntil = addDays(T, 7); ui.editPrice = null; commit(); return;
    }
    case 'addch': {
      const name = val('ch-name'); if (!name) return;
      state.challenges.push({ id: uid(), name, start: T, days: Math.max(1, num('ch-days', 21)), stars: Math.min(isHard() ? 10 : 3, Math.max(1, num('ch-stars', 1))), checks: {} });
      return commit();
    }
    case 'addsph': { const name = val('new-sph'); if (!name) return; state.spheres.push({ id: uid(), name, c: state.spheres.length % 8 }); persist(); render('new-sph'); return; }
    case 'task-edit': {
      const t = state.tasks.find(x => x.id === f.dataset.id); if (!t) return;
      const was = C.todayCredited;
      t.text = val('te-text') || t.text;
      const done = document.getElementById('te-done').checked;
      if (done !== t.done) { t.done = done; t.doneAt = done ? T : null; }
      const day = document.getElementById('te-day').value || null;
      t.day = day; if (day) t.week = weekOf(day);
      t.time = day ? (document.getElementById('te-time').value || null) : null;
      t.dur = +document.getElementById('te-dur').value || 60;
      t.sphere = document.getElementById('te-sphere').value || null;
      if (isHard()) { const st = readStars('te-stars'); t.stars = st.stars; t.diff = st.diff; }
      else if (!t.done) { const st = readStars('te-stars'); t.stars = st.stars; t.diff = st.diff; }
      closeSheet(); commit(); if (t.done) afterDone(was); return;
    }
    case 'quick': {
      const text = val('qa-text'); if (!text) { document.getElementById('qa-text').focus(); return; }
      const day = f.dataset.day;
      state.tasks.push(newTask({ text, day, time: document.getElementById('qa-time').value || null, dur: +document.getElementById('qa-dur').value || 60, ...readStars('qa-stars') }));
      closeSheet(); commit(); return;
    }
  }
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'onb-file' || el.id === 'import-file') {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      const s = await readFile(f);
      if (el.id === 'onb-file') adoptState(s); else { ui.pendingImport = s; render(); }
    } catch (er) { if (el.id === 'onb-file') { const x = document.getElementById('onb-err'); if (x) x.textContent = er.message; } else toast(er.message); }
    el.value = ''; return;
  }
  if (!loaded) return;
  if (el.dataset.c === 'rename') { const s = sphereById(el.dataset.id), v = el.value.trim(); if (s && v) { s.name = v; commit(); } }
  if (el.dataset.c === 'newsletter') { state.newsletter = el.checked; persist(); toast(el.checked ? 'Підписка на новини увімкнена' : 'Підписку вимкнено'); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'rw-cost' && loaded) { const n = parseInt(e.target.value, 10); const el = document.getElementById('rw-eta'); if (el && n > 0) el.textContent = etaText(n); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('sheet').hidden) closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('drag')) { e.preventDefault(); openTaskSheet(e.target.dataset.id); }
});
document.addEventListener('mousemove', e => {
  const hit = e.target.id === 'fc-hit' ? e.target : null, tip = document.getElementById('fc-tip');
  if (!tip) return;
  if (!hit) { tip.hidden = true; return; }
  const F = forecast(); if (F.need) return;
  const svg = hit.ownerSVGElement, r = svg.getBoundingClientRect(), W = +hit.dataset.w, L = +hit.dataset.l, iw = +hit.dataset.iw, n = +hit.dataset.n;
  const xv = (e.clientX - r.left) * (W / r.width);
  const i = Math.round(((xv - L) / iw) * n);
  let cum = 0; const cums = F.daily.map(v => (cum += v));
  const total = cum;
  let text;
  if (i <= F.span) { const back = F.span - i; text = back === 0 ? `Сьогодні: ${total}${STAR} за ${dayWord(F.span)}` : `${dayWord(back)} тому: ${i ? cums[i - 1] : 0}${STAR}`; }
  else { const k = i - F.span; text = `Через ${dayWord(k)}: ≈ +${Math.round(k * F.m)}${STAR} (${Math.max(0, Math.round(k * F.m - F.band(k)))}–${Math.round(k * F.m + F.band(k))})`; }
  const wr = document.getElementById('fc-wrap').getBoundingClientRect();
  tip.hidden = false; tip.textContent = text; tip.style.left = (e.clientX - wr.left) + 'px'; tip.style.top = (e.clientY - wr.top) + 'px';
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !loaded || document.getElementById('app').hidden) return;
  render();
  const p = checkInactivity(); if (p) { render(); openPenalty(p); }
});
setInterval(() => { if (loaded && !document.getElementById('app').hidden && !drag && document.getElementById('sheet').hidden && ui.tab === 'calendar') render(); }, 5 * 60 * 1000);

/* ================= boot ================= */
async function boot() {
  if (!CLOUD) {
    const l = readLocal();
    if (!l || !l.onboarded) { state = emptyState(); startOnboarding(); return; }
    state = l; startApp(false); return;
  }
  showGate('loading');
  try { await loadFirebase(); }
  catch (e) { ui.authErr = 'Не вдалося завантажити Firebase. Перевір інтернет і онови сторінку.'; showGate('error'); return; }
  fb.auth.onAuthStateChanged(fb.au, async user => {
    if (unwatch) { unwatch(); unwatch = null; }
    account = user; loaded = false; lastSaved = null; ui.authErr = ''; closeSheet();
    if (!user) { state = emptyState(); showGate('landing'); return; }
    try { await openAccount(); } catch (e) { ui.authErr = authError(e); showGate('error'); }
  });
}
boot();
