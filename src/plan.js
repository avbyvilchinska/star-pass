/* ================= тиждень, регулярні справи, ролі =================
   Регулярна справа — один шаблон на тиждень (напр. «Склянка води»): відмічаєш по днях,
   а зірки (2–4★ у базовому режимі) нараховуються один раз, коли виконано норму тижня.
   Зірки не зберігаються окремо — їх щоразу рахує calc() з журналу відміток, тож подвійних нарахувань не буває.
   Налаштування регулярної справи мають історію (hist): зміна діє з поточного тижня, минулі тижні не перераховуються. */
const WEEK_IDX = [1, 2, 3, 4, 5, 6, 0]; // Пн..Нд у термінах getDay()
const DAY_PREFIX = { пн: 0, вт: 1, ср: 2, чт: 3, пт: 4, сб: 5, нд: 6 };
const roleById = id => (state.roles || []).find(r => r.id === id);
const HABIT_STARS_BASIC = [2, 3, 4];

function hcfg(h, w) {
  let c = h.hist[0];
  for (const x of h.hist) if (x.from <= w) c = x;
  return c;
}
function habitSched(h, w) {
  const c = hcfg(h, w), from = h.createdAt;
  return [...Array(7)].map((_, i) => addDays(w, i)).filter(d => c.days.includes(parse(d).getDay()) && d >= from);
}
function habitWeek(h, w) {
  const c = hcfg(h, w), sched = habitSched(h, w), log = state.habitLog[h.id] || {};
  const done = Object.keys(log).filter(d => weekOf(d) === w).sort();
  const need = Math.min(c.target, sched.length);
  return { c, sched, done, need, ok: need > 0 && done.length >= need };
}
// зірки за регулярні справи — для calc()
function habitEvents() {
  const ev = [];
  for (const h of state.habits || []) {
    const weeks = new Set(Object.keys(state.habitLog[h.id] || {}).map(weekOf));
    for (const w of weeks) {
      const i = habitWeek(h, w);
      if (i.ok) ev.push({ date: i.done[i.need - 1], stars: i.c.stars, cat: 'habit', label: h.text, sub: `регулярна · ${i.done.length}/${i.need} за тиждень`, role: h.role || null });
    }
  }
  return ev;
}
const activeHabits = () => (state.habits || []).filter(h => !h.archived);
const habitsOn = d => activeHabits().filter(h => d >= h.createdAt && hcfg(h, weekOf(d)).days.includes(parse(d).getDay()));

/* ---------- регулярні в календарі ---------- */
const habitColor = h => { const s = sphereById(h.sphere); return s ? `var(--s${s.c % 8})` : 'var(--s6)'; };
function habitCalAllDay(day) {
  return habitsOn(day).filter(h => !h.time).map(h => {
    const on = !!(state.habitLog[h.id] || {})[day];
    return `<button class="ctask hev ${on ? 'done' : ''}" data-a="hab-cal" data-id="${h.id}" data-d="${day}" style="--c:${habitColor(h)}" type="button"><span class="t">🔁 ${esc(h.text)}</span>${on ? '<span class="chip">✓</span>' : ''}</button>`;
  }).join('');
}
function habitCalTimed(day) {
  return habitsOn(day).filter(h => h.time).map(h => {
    const on = !!(state.habitLog[h.id] || {})[day], dur = h.dur || 30;
    const top = (toMin(h.time) - CAL_START * 60) / 60, hgt = Math.max(0.5, dur / 60);
    return `<button class="ev hev ${on ? 'done' : ''}" data-a="hab-cal" data-id="${h.id}" data-d="${day}" type="button" style="--c:${habitColor(h)};top:calc(${top} * var(--row) + 1px);height:calc(${hgt} * var(--row) - 3px)" title="${esc(h.text)} · ${h.time}–${fmtHM(Math.min(24 * 60, toMin(h.time) + dur))}"><span class="t">🔁 ${esc(h.text)}</span><b>${h.time}</b></button>`;
  }).join('');
}
function openHabitDay(id, d) {
  const h = state.habits.find(x => x.id === id); if (!h) return;
  const i = habitWeek(h, weekOf(d)), on = !!(state.habitLog[h.id] || {})[d], future = d > today();
  openSheet(`<div class="stack" style="gap:12px"><div><span class="tag">регулярна справа</span><h3 style="margin-top:6px">${esc(h.text)}</h3>
      <p class="sub" style="margin:0">${DOW[parse(d).getDay()]}, ${fmtShort(d)}${h.time ? ' · ' + h.time : ''} · норма тижня ${i.done.length}/${i.need} · ${i.c.stars}${STAR} за норму</p></div>
    ${future ? '<p class="hint" style="margin:0">Відмітити можна в сам день або пізніше, наперед — ні.</p>' : ''}
    <div class="row">${future ? '' : `<button class="btn ${on ? '' : 'primary'}" data-a="habit" data-id="${h.id}" data-d="${d}">${on ? 'Зняти відмітку' : 'Виконано'}</button>`}<button class="btn ghost" data-a="habit-edit" data-id="${h.id}">Налаштування</button></div></div>`);
}

/* ---------- маленькі поля для форм ---------- */
const roleOptions = sel => `<option value="">Без ролі</option>` + (state.roles || []).map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
function tagFields(prefix, sphere, role) {
  let h = '';
  if (state.spheres.length) h += `<select id="${prefix}-sphere" aria-label="Сфера">${sphereOptions(sphere)}</select>`;
  if ((state.roles || []).length) h += `<select id="${prefix}-role" aria-label="Роль">${roleOptions(role)}</select>`;
  return h;
}
function readTags(prefix) {
  const s = document.getElementById(prefix + '-sphere'), r = document.getElementById(prefix + '-role');
  return { sphere: s ? s.value || null : null, role: r ? r.value || null : null };
}
function habitStarsField(id, val) {
  if (isHard()) return `<input type="number" id="${id}" value="${val || 3}" min="1" max="10" aria-label="Зірок за тиждень">`;
  return `<select id="${id}" aria-label="Зірок за тиждень">${HABIT_STARS_BASIC.map(n => `<option value="${n}" ${n === (val || 3) ? 'selected' : ''}>${n}${STAR} за тиждень</option>`).join('')}</select>`;
}
function readHabitStars(id) {
  const n = parseInt(document.getElementById(id).value, 10) || 3;
  return isHard() ? Math.min(10, Math.max(1, n)) : (HABIT_STARS_BASIC.includes(n) ? n : 3);
}
function dayChips(prefix, sel) {
  return `<div class="dchips">${WEEK_IDX.map(g => `<label><input type="checkbox" name="${prefix}-d" value="${g}" ${sel.includes(g) ? 'checked' : ''}><span>${DOW_S[g]}</span></label>`).join('')}</div>`;
}
const readDays = prefix => [...document.querySelectorAll(`input[name="${prefix}-d"]:checked`)].map(i => +i.value);
function targetOptions(n, sel) { return [...Array(7)].map((_, i) => i + 1).map(k => `<option value="${k}" ${k === sel ? 'selected' : ''} ${k > n ? 'disabled' : ''}>${k} ${plural(k, 'раз', 'рази', 'разів')}</option>`).join(''); }

/* ---------- рядок регулярної справи ---------- */
function habitRow(h, d, wk) {
  const w = d ? weekOf(d) : wk, i = habitWeek(h, w), on = !!(d && (state.habitLog[h.id] || {})[d]), s = sphereById(h.sphere), r = roleById(h.role);
  const can = d && i.sched.includes(d) && d <= today();
  return `<li class="task habit ${on ? 'done' : ''}" style="--c:${s ? `var(--s${s.c % 8})` : 'var(--s6)'}">
    <button class="chk ${on ? 'on' : ''}" data-a="habit" data-id="${h.id}" data-d="${d || ''}" ${can ? '' : 'disabled'} aria-label="${on ? 'Зняти позначку' : 'Відмітити сьогодні'}">${CHECK}</button>
    <span class="t">${esc(h.text)} <span class="tag">щотижня</span>${s ? ` <span class="date">· ${esc(s.name)}</span>` : ''}${r ? ` <span class="date">· ${esc(r.name)}</span>` : ''}</span>
    <span class="hprog ${i.ok ? 'ok' : ''}" data-tip="Норма тижня: ${i.need} ${plural(i.need, 'раз', 'рази', 'разів')}. Зірки нараховуються один раз, коли її виконано.">${i.done.length}/${i.need}</span>
    <span class="chip static">${i.ok ? '✓ ' : ''}${i.c.stars}${STAR}/тиж</span>
    <button class="icon-btn" data-a="habit-edit" data-id="${h.id}" aria-label="Редагувати">⋯</button>
  </li>`;
}
// тижнева сітка відміток
function habitWeekCard(h, w) {
  const i = habitWeek(h, w), log = state.habitLog[h.id] || {}, T = today(), s = sphereById(h.sphere), r = roleById(h.role);
  const cells = [...Array(7)].map((_, k) => {
    const d = addDays(w, k), sch = i.sched.includes(d);
    return `<button class="day ${log[d] ? 'on' : ''} ${d === T ? 'today' : ''}" data-a="habit" data-id="${h.id}" data-d="${d}" ${!sch || d > T ? 'disabled' : ''} title="${DOW_S[parse(d).getDay()]}, ${fmtShort(d)}">${DOW_S[parse(d).getDay()]}</button>`;
  }).join('');
  return `<div class="hcard"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><div style="min-width:0;flex:1"><b>${esc(h.text)}</b>
      <p class="sub" style="margin:0">${i.done.length}/${i.need} · ${i.ok ? `<span class="goal-ok">норму виконано, +${i.c.stars}${STAR}</span>` : `${i.c.stars}${STAR} за норму тижня`}${s ? ' · ' + esc(s.name) : ''}${r ? ' · ' + esc(r.name) : ''}</p></div>
      <button class="icon-btn" data-a="habit-edit" data-id="${h.id}" aria-label="Редагувати">⋯</button></div>
    <div class="days hdays">${cells}</div></div>`;
}

/* ================= розділ «Тиждень» ================= */
function weekSwitch(cur) {
  return `<div class="auth-tabs seg" role="tablist"><button class="${cur === 'week' ? 'on' : ''}" data-a="go" data-tab="week">Список</button><button class="${cur === 'calendar' ? 'on' : ''}" data-a="go" data-tab="calendar">Календар</button></div>`;
}
function viewWeek() {
  const w = ui.week, T = today(), isCur = w === weekOf(T);
  const tasks = state.tasks.filter(t => t.week === w);
  const habits = activeHabits().filter(h => habitWeek(h, w).sched.length);
  const g = ui.group || 'days';
  const doneN = tasks.filter(t => t.done).length;
  let h = `<div class="stack">
    <div class="cal-tools"><button class="icon-btn" data-a="wk" data-d="-7" aria-label="Попередній тиждень">‹</button>
      <div><h2>${fmtRange(w)}</h2><p class="sub">${isCur ? 'Поточний тиждень' : parse(w) < parse(weekOf(T)) ? 'Минулий тиждень' : 'Наступний тиждень'} · ${doneN}/${tasks.length} ${plural(tasks.length, 'справа', 'справи', 'справ')} виконано</p></div>
      <button class="icon-btn" data-a="wk" data-d="7" aria-label="Наступний тиждень">›</button></div>
    <div class="row" style="justify-content:space-between">${weekSwitch('week')}${isCur ? '' : '<button class="btn" data-a="wk0">До поточного тижня</button>'}</div>`;

  // швидке заповнення тижня
  h += `<details class="card" ${ui.bulkOpen ? 'open' : ''} data-bulk><summary><b>Заповнити план на тиждень</b> <span class="sub">— кілька справ за раз</span></summary>
    <form class="stack" style="gap:10px;margin-top:12px" data-f="bulk">
      <textarea id="bulk-text" rows="6" placeholder="Одна справа в рядку. Можна вказати день:&#10;Пн: тренування&#10;Ср: повторити ПДР&#10;Пт: розділ курсової&#10;Прибрати кімнату"></textarea>
      <div class="fields"><label class="field"><span class="label">День за замовчуванням</span><select id="bulk-day">${dayOptions(w, '')}</select></label>
        <label class="field"><span class="label">${isHard() ? 'Зірки' : 'Складність'}</span>${starsField('bulk-stars')}</label>
        ${state.spheres.length ? `<label class="field"><span class="label">Сфера</span><select id="bulk-sphere">${sphereOptions('')}</select></label>` : ''}
        ${(state.roles || []).length ? `<label class="field"><span class="label">Роль</span><select id="bulk-role">${roleOptions('')}</select></label>` : ''}</div>
      <p class="hint" style="margin:0">Рядки з «Пн:», «Вт:» … «Нд:» потраплять у свій день, решта — у день за замовчуванням.</p>
      <div class="row"><button class="btn primary" type="submit">Додати в тиждень</button><span class="sub" id="bulk-msg"></span></div></form></details>`;

  // регулярні
  h += `<section class="card stack" style="gap:12px"><div class="row" style="justify-content:space-between"><h3>Регулярні справи ${tipI('habits')}</h3><button class="btn" data-a="habit-new">+ Регулярна справа</button></div>
    ${habits.length ? `<div class="grid">${habits.map(x => habitWeekCard(x, w)).join('')}</div>` : '<p class="empty" style="margin:0">Те, що робиш майже щодня: склянка води, 10 слів, зарядка. Записуєш один раз — відмічаєш по днях, а зірки за тиждень отримуєш разом, коли виконаєш норму.</p>'}</section>`;

  // групування
  h += `<div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">Справи тижня</h3>
    <div class="auth-tabs seg sm"><button class="${g === 'days' ? 'on' : ''}" data-a="group" data-g2="days">За днями</button><button class="${g === 'spheres' ? 'on' : ''}" data-a="group" data-g2="spheres">За сферами</button><button class="${g === 'roles' ? 'on' : ''}" data-a="group" data-g2="roles">За ролями</button></div></div>`;
  const sortT = (a, b) => (a.day || '9') < (b.day || '9') ? -1 : (a.day || '9') > (b.day || '9') ? 1 : (a.time || '99') < (b.time || '99') ? -1 : 1;
  const group = (title, list, hs, add, extra = '') => `<section class="card"><div class="row" style="justify-content:space-between"><h3>${title}</h3><span class="sub">${list.filter(t => t.done).length}/${list.length}${hs.length ? ` · ${hs.length} ${plural(hs.length, 'регулярна', 'регулярні', 'регулярних')}` : ''}</span></div>${extra}
      <ul class="tasks" style="margin-top:6px">${list.sort(sortT).map(t => taskRow(t, { dayTag: g !== 'days' })).join('')}${hs.map(x => habitRow(x, isCur ? T : null, w)).join('')}</ul>${add}</section>`;
  const addForm = (key, o) => `<form class="addf compact" data-f="addplan" data-day="${o.day || ''}" data-sphere="${o.sphere || ''}" data-role="${o.role || ''}" data-key="${key}">
      <input type="text" id="ap-${key}" placeholder="Додати справу" aria-label="Нова справа">${starsField('ap-' + key + '-stars')}${o.tags ? tagFields('ap-' + key, o.sphere, o.role) : ''}<button class="btn" type="submit">+</button></form>`;
  if (g === 'days') {
    for (let i = 0; i < 7; i++) {
      const d = addDays(w, i), dd = parse(d), list = tasks.filter(t => t.day === d);
      h += group(`${DOW[dd.getDay()][0].toUpperCase() + DOW[dd.getDay()].slice(1)}, ${fmtShort(d)}${d === T ? ' <span class="tag">сьогодні</span>' : ''}${C.credited[d] ? ' <span class="goal-ok" style="font-size:.85rem">✓ день зараховано</span>' : ''}`, list, [], addForm(d, { day: d, tags: true }), '');
    }
    h += group('Без дня', tasks.filter(t => !t.day), [], addForm('nod', { tags: true }), '<p class="sub" style="margin:0">Розклади пізніше — у календарі або кнопкою «на сьогодні».</p>');
  } else {
    const isS = g === 'spheres', items = isS ? state.spheres : (state.roles || []), key = isS ? 'sphere' : 'role';
    if (!items.length) h += `<div class="note"><span class="grow">${isS ? 'Сфер ще немає. Створи їх у Профілі → Сфери: навчання, спорт, англійська…' : 'Ролей ще немає. Створи першу в розділі «Ролі».'}</span><button class="btn primary" data-a="go" data-tab="${isS ? 'profile' : 'roles'}">${isS ? 'До сфер' : 'До ролей'}</button></div>`;
    for (const it of items) {
      const list = tasks.filter(t => t[key] === it.id), hs = habits.filter(x => x[key] === it.id);
      h += group(`${isS ? `<span class="sdot" style="background:var(--s${it.c % 8})"></span>` : ''}${esc(it.name)}`, list, hs, addForm(it.id, { [key]: it.id }));
    }
    const rest = tasks.filter(t => !t[key] || !items.some(x => x.id === t[key])), restH = habits.filter(x => !x[key]);
    if (rest.length || restH.length) h += group(isS ? 'Без сфери' : 'Без ролі', rest, restH, '');
  }
  return h + '</div>';
}

/* ---------- лист регулярної справи ---------- */
function openHabitSheet(id) {
  const h = id ? state.habits.find(x => x.id === id) : null;
  const c = h ? hcfg(h, weekOf(today())) : { days: [1, 2, 3, 4, 5, 6, 0], target: 5, stars: 3 };
  const hasLog = h && Object.keys(state.habitLog[h.id] || {}).length;
  openSheet(`<form class="stack" style="gap:14px" data-f="habit" data-id="${h ? h.id : ''}">
    <div><h3>${h ? 'Регулярна справа' : 'Нова регулярна справа'}</h3><p class="sub" style="margin:0">Записуєш один раз — відмічаєш у потрібні дні. Зірки за тиждень нараховуються разом, коли виконано норму.</p></div>
    <label class="field"><span class="label">Справа</span><input type="text" id="hb-text" value="${h ? esc(h.text) : ''}" placeholder="Напр.: склянка води зранку"></label>
    <div class="field"><span class="label">Дні</span>${dayChips('hb', c.days)}</div>
    <div class="fields"><label class="field"><span class="label">Час <span class="sub">(для календаря)</span></span><select id="hb-time">${timeOptions(h ? h.time : '')}</select></label>
      <label class="field"><span class="label">Тривалість</span><select id="hb-dur">${durOptions(h ? h.dur || 30 : 30)}</select></label></div>
    <div class="fields"><label class="field"><span class="label">Норма на тиждень</span><select id="hb-target">${targetOptions(7, c.target)}</select></label>
      <label class="field"><span class="label">Нагорода</span>${habitStarsField('hb-stars', c.stars)}</label></div>
    <div class="fields">${state.spheres.length ? `<label class="field"><span class="label">Сфера</span><select id="hb-sphere">${sphereOptions(h ? h.sphere : '')}</select></label>` : ''}
      ${(state.roles || []).length ? `<label class="field"><span class="label">Роль</span><select id="hb-role">${roleOptions(h ? h.role : '')}</select></label>` : ''}</div>
    ${h ? '<p class="hint" style="margin:0">Зміни діють з цього тижня. Минулі тижні й уже зароблені зірки не перераховуються.</p>' : ''}
    <div class="row"><button class="btn primary" type="submit">${h ? 'Зберегти' : 'Додати'}</button>
      ${h ? `<button class="btn ghost danger" type="button" data-a="habit-del" data-id="${h.id}">${ui.armed['hd' + h.id] ? (hasLog ? 'Точно? Історія збережеться' : 'Точно видалити?') : (hasLog ? 'Прибрати з плану' : 'Видалити')}</button>` : ''}</div></form>`, '#hb-text');
}

/* ================= розділ «Ролі» ================= */
// усі виконання в межах ролі: виконані справи + кожна відмітка регулярної справи окремо
function roleDone(rid) {
  const out = [];
  for (const t of state.tasks) if (t.role === rid && t.done && t.doneAt) out.push({ date: t.doneAt, text: t.text, stars: t.stars, kind: t.bonus ? 'бонусна' : 'справа' });
  for (const h of state.habits || []) if (h.role === rid) for (const d of Object.keys(state.habitLog[h.id] || {})) out.push({ date: d, text: h.text, stars: null, kind: 'регулярна' });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
function roleWeek(rid, w) {
  const tasks = state.tasks.filter(t => t.role === rid && t.week === w);
  let planned = tasks.length, done = tasks.filter(t => t.done).length;
  for (const h of state.habits || []) if (h.role === rid) {
    const i = habitWeek(h, w);
    planned += h.archived ? i.done.length : Math.max(i.sched.length, i.done.length); done += i.done.length;
  }
  return { planned, done };
}
function roleStars(rid) {
  return state.tasks.filter(t => t.role === rid && t.done && t.doneAt).reduce((a, t) => a + (t.stars || 0), 0)
    + C.ev.filter(e => e.cat === 'habit' && e.role === rid).reduce((a, e) => a + e.stars, 0);
}
function viewRoles() {
  if (ui.role && roleById(ui.role)) return viewRole(roleById(ui.role));
  const roles = state.roles || [], W = weekOf(today());
  let h = `<div class="stack"><div><h2>Ролі</h2><p class="sub">Ким ти хочеш бути — і що конкретно для цього робиш</p></div>`;
  h += `<section class="card role-intro"><div class="row" style="align-items:flex-start;gap:14px"><div class="role-ico">${STAR_SVG.replace('star-svg', '')}</div><div style="flex:1;min-width:220px">
      <h3>Як працюють ролі</h3>
      <p class="sub" style="margin:4px 0 0">У житті ти водночас студент, друг, спортсмен, брат, майбутній дипломат. Роль допомагає зрозуміти, ким ти хочеш бути в кожній із цих сфер і які конкретні дії тебе туди ведуть.</p>
      <p class="sub" style="margin:6px 0 0">Створи роль і опиши, яким ти хочеш у ній бути. Потім, плануючи справу, обери для неї роль — і кожне виконання автоматично зарахується в її прогрес. Окремо нічого відмічати не треба.</p></div></div></section>`;
  let form = `<form class="card stack" style="gap:12px" data-f="addrole"><h3>${roles.length ? 'Ще одна роль' : 'Нова роль'}</h3>
    <label class="field"><span class="label">Назва ролі</span><input type="text" id="rl-name" placeholder="Напр.: Водій, Студент, Друг" maxlength="60"></label>
    <label class="field"><span class="label">Ким ти хочеш бути в цій ролі</span><textarea id="rl-desc" rows="3" placeholder="Напр.: впевнений і відповідальний водій, який добре знає ПДР і безпечно керує автомобілем"></textarea></label>
    <label class="field"><span class="label">Ціль або принципи <span class="sub">(необовʼязково)</span></span><textarea id="rl-goal" rows="2" placeholder="Напр.: скласти іспит до грудня; щотижня 2 практичні заняття"></textarea></label>
    <div class="row"><button class="btn primary" type="submit">Створити роль</button></div></form>`;
  if (!roles.length) h += form + `<p class="empty">Ролей поки немає. Ти сам вирішуєш, ким хочеш стати — почни з однієї.</p>`;
  else h += `<div class="grid">${roles.map(r => {
    const all = roleDone(r.id).length, wk = roleWeek(r.id, W), pct = wk.planned ? Math.round(wk.done / wk.planned * 100) : 0;
    return `<button class="card role-card" data-a="role-open" data-id="${r.id}" type="button"><h3>${esc(r.name)}</h3>
      ${r.desc ? `<p class="sub role-desc">${esc(r.desc)}</p>` : ''}
      <div class="bar" style="margin-top:10px"><i style="width:${pct}%"></i></div>
      <div class="row" style="justify-content:space-between;margin-top:8px"><span class="sub">Цей тиждень: <b>${wk.done}/${wk.planned}</b></span><span class="sub">Усього виконань: <b>${all}</b></span></div></button>`;
  }).join('')}</div>` + form;
  return h + '</div>';
}
function viewRole(r) {
  const T = today(), W = weekOf(T), done = roleDone(r.id), wk = roleWeek(r.id, W), stars = roleStars(r.id);
  const weeks = [...Array(8)].map((_, i) => addDays(W, -7 * (7 - i)));
  const per = weeks.map(w => ({ w, ...roleWeek(r.id, w) }));
  const mx = Math.max(1, ...per.map(p => Math.max(p.done, p.planned)));
  const openTasks = state.tasks.filter(t => t.role === r.id && !t.done).sort((a, b) => (a.day || a.week) < (b.day || b.week) ? -1 : 1);
  const hs = activeHabits().filter(h => h.role === r.id);
  const ed = ui.editRole === r.id;
  let h = `<div class="stack"><div><button class="link" data-a="role-back">← Усі ролі</button></div>`;
  h += ed ? `<form class="card stack" style="gap:12px" data-f="editrole" data-id="${r.id}">
      <label class="field"><span class="label">Назва ролі</span><input type="text" id="re-name" value="${esc(r.name)}" maxlength="60"></label>
      <label class="field"><span class="label">Ким ти хочеш бути в цій ролі</span><textarea id="re-desc" rows="3">${esc(r.desc)}</textarea></label>
      <label class="field"><span class="label">Ціль або принципи</span><textarea id="re-goal" rows="2">${esc(r.goal)}</textarea></label>
      <div class="row"><button class="btn primary" type="submit">Зберегти</button><button class="btn" type="button" data-a="role-edit">Скасувати</button></div></form>`
    : `<section class="card stack" style="gap:8px"><div class="row" style="justify-content:space-between;align-items:flex-start"><h2 style="margin:0">${esc(r.name)}</h2>
      <div class="row"><button class="btn" data-a="role-edit" data-id="${r.id}">Редагувати</button><button class="btn ghost danger" data-a="role-del" data-id="${r.id}">${ui.armed['rd' + r.id] ? 'Точно видалити?' : 'Видалити'}</button></div></div>
      ${r.desc ? `<p style="margin:0">${esc(r.desc)}</p>` : '<p class="sub" style="margin:0">Опису ще немає.</p>'}
      ${r.goal ? `<p class="sub" style="margin:0"><b>Ціль і принципи:</b> ${esc(r.goal)}</p>` : ''}
      ${ui.armed['rd' + r.id] ? '<p class="hint" style="margin:0">Справи цієї ролі залишаться, просто без привʼязки до ролі. Зароблені зірки не зміняться.</p>' : ''}</section>`;
  h += `<div class="kpis"><span class="kpi">Усього виконань <b>${done.length}</b></span><span class="kpi">Цей тиждень <b>${wk.done}/${wk.planned}</b></span><span class="kpi">Зароблено <b>${stars}${STAR}</b></span><span class="kpi">Відкритих справ <b>${openTasks.length}</b></span></div>`;
  h += `<section class="card"><h3>Прогрес за тижнями</h3><p class="sub">Виконано з запланованого за останні 8 тижнів</p>
    <div class="wbars">${per.map(p => `<div class="wbar ${p.w === W ? 'cur' : ''}" title="${fmtRange(p.w)}: ${p.done} з ${p.planned}"><div class="wb-col"><i class="pl" style="height:${p.planned / mx * 100}%"></i><i class="dn" style="height:${p.done / mx * 100}%"></i></div><b>${p.done}</b><small>${fmtShort(p.w).replace(' ', '&nbsp;')}</small></div>`).join('')}</div>
    <p class="hint" style="margin:6px 0 0"><span class="lg dn"></span> виконано · <span class="lg pl"></span> заплановано</p></section>`;
  h += `<section class="card"><h3>Зараз у цій ролі</h3>
    <ul class="tasks" style="margin-top:8px">${openTasks.map(t => taskRow(t, { dayTag: true })).join('')}${hs.map(x => habitRow(x, T)).join('')}</ul>
    ${!openTasks.length && !hs.length ? '<p class="empty">Немає відкритих справ. Додай справу і вибери для неї цю роль.</p>' : ''}
    <form class="addf" data-f="addplan" data-role="${r.id}" data-key="role"><input type="text" id="ap-role" placeholder="Справа для ролі «${esc(r.name)}» на цей тиждень">${starsField('ap-role-stars')}${state.spheres.length ? `<select id="ap-role-sphere" aria-label="Сфера">${sphereOptions('')}</select>` : ''}<button class="btn primary" type="submit">Додати</button></form></section>`;
  h += `<section class="card"><h3>Історія виконань</h3>
    ${done.length ? `<ul class="hist">${done.slice(0, 60).map(x => `<li><span class="date">${fmtShort(x.date)}</span><span class="t">${esc(x.text)} <span class="tag">${x.kind}</span></span>${x.stars ? `<span class="chip static">+${x.stars}${STAR}</span>` : ''}</li>`).join('')}</ul>${done.length > 60 ? `<p class="hint">Показано останні 60 з ${done.length}.</p>` : ''}` : '<p class="empty">Ще нічого не виконано в цій ролі.</p>'}</section>`;
  return h + '</div>';
}
