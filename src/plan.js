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
const habitColor = h => roleColor(h.role) || 'var(--s6)';
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
  openSheet(`<div class="stack" style="gap:12px"><div><span class="tag">рутина</span><h3 style="margin-top:6px">${esc(h.text)}</h3>
      <p class="sub" style="margin:0">${DOW[parse(d).getDay()]}, ${fmtShort(d)}${h.time ? ' · ' + h.time : ''} · норма тижня ${i.done.length}/${i.need} · ${i.c.stars}${STAR} за норму</p></div>
    ${future ? '<p class="hint" style="margin:0">Відмітити можна в сам день або пізніше, наперед — ні.</p>' : ''}
    <div class="row">${future ? '' : `<button class="btn ${on ? '' : 'primary'}" data-a="habit" data-id="${h.id}" data-d="${d}">${on ? 'Зняти відмітку' : 'Виконано'}</button>`}<button class="btn ghost" data-a="habit-edit" data-id="${h.id}">Налаштування</button></div></div>`);
}

/* ---------- маленькі поля для форм ---------- */
const roleOptions = sel => `<option value="">Без ролі</option>` + (state.roles || []).map(r => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
function tagFields(prefix, role, goal) {
  return (state.roles || []).length ? `<select id="${prefix}-role" aria-label="Роль">${roleOptions(role)}</select>${goalField(prefix, role, goal)}` : '';
}
function readTags(prefix) {
  const r = document.getElementById(prefix + '-role'), role = r ? r.value || null : null;
  return { role, goal: readGoal(prefix, role) };
}
function colorField(name, sel) {
  return `<div class="sw">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<label class="swr"><input type="radio" name="${name}" value="${i}" ${i === sel ? 'checked' : ''}><span style="background:var(--s${i})"></span></label>`).join('')}</div>`;
}
const readColor = (name, d) => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? +el.value : d; };
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
  const w = d ? weekOf(d) : wk, i = habitWeek(h, w), on = !!(d && (state.habitLog[h.id] || {})[d]), r = roleById(h.role);
  const can = d && i.sched.includes(d) && d <= today();
  return `<li class="task habit ${on ? 'done' : ''}" style="--c:${habitColor(h)}">
    <button class="chk ${on ? 'on' : ''}" data-a="habit" data-id="${h.id}" data-d="${d || ''}" ${can ? '' : 'disabled'} aria-label="${on ? 'Зняти позначку' : 'Відмітити сьогодні'}">${CHECK}</button>
    <span class="t">${esc(h.text)} <span class="tag">рутина</span>${r ? ` <span class="rtag" style="--rc:${roleColor(r.id) || 'var(--ink)'}">${esc(r.name)}</span>` : ''}</span>
    <span class="hprog ${i.ok ? 'ok' : ''}" data-tip="Норма тижня: ${i.need} ${plural(i.need, 'раз', 'рази', 'разів')}. Зірки нараховуються один раз, коли її виконано.">${i.done.length}/${i.need}</span>
    <span class="chip static">${i.ok ? '✓ ' : ''}${i.c.stars}${STAR}/тиж</span>
    <button class="icon-btn" data-a="habit-edit" data-id="${h.id}" aria-label="Редагувати">⋯</button>
  </li>`;
}
// тижнева сітка відміток
function habitWeekCard(h, w) {
  const i = habitWeek(h, w), log = state.habitLog[h.id] || {}, T = today(), r = roleById(h.role);
  const cells = [...Array(7)].map((_, k) => {
    const d = addDays(w, k), sch = i.sched.includes(d);
    return `<button class="day ${log[d] ? 'on' : ''} ${d === T ? 'today' : ''}" data-a="habit" data-id="${h.id}" data-d="${d}" ${!sch || d > T ? 'disabled' : ''} title="${DOW_S[parse(d).getDay()]}, ${fmtShort(d)}">${DOW_S[parse(d).getDay()]}</button>`;
  }).join('');
  return `<div class="hcard" style="--c:${habitColor(h)}"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><div style="min-width:0;flex:1"><b>${esc(h.text)}</b>
      <p class="sub" style="margin:0">${i.done.length}/${i.need} · ${i.ok ? `<span class="goal-ok">норму виконано, +${i.c.stars}${STAR}</span>` : `${i.c.stars}${STAR} за норму тижня`}${r ? ' · ' + esc(r.name) : ''}</p></div>
      <button class="icon-btn" data-a="habit-edit" data-id="${h.id}" aria-label="Редагувати">⋯</button></div>
    <div class="days hdays">${cells}</div></div>`;
}

/* ================= розділ «Тиждень» ================= */
function weekSwitch(cur) {
  return `<div class="auth-tabs seg" role="tablist"><button class="${cur === 'week' ? 'on' : ''}" data-a="go" data-tab="week">Список</button><button class="${cur === 'calendar' ? 'on' : ''}" data-a="go" data-tab="calendar">Календар</button></div>`;
}
function challengeCard(c, T) {
  const end = addDays(c.start, c.days - 1), n = Object.keys(c.checks).length, armed = ui.armed[c.id];
  let cells = '';
  for (let k = 0; k < c.days; k++) { const d = addDays(c.start, k); cells += `<button class="day ${c.checks[d] ? 'on' : ''} ${d === T ? 'today' : ''}" data-a="chday" data-id="${c.id}" data-d="${d}" ${d > T ? 'disabled' : ''} title="${fmtShort(d)}">${parse(d).getDate()}</button>`; }
  return `<article class="hcard" style="--c:var(--s4)"><div class="row" style="align-items:flex-start;gap:8px"><div style="flex:1;min-width:0"><b>${esc(c.name)}</b><p class="sub" style="margin:0">${fmtShort(c.start)} – ${fmtShort(end)} · ${n}/${c.days} днів · ${c.stars}${STAR} за день · зароблено ${n * c.stars}${STAR}</p></div>
    <button class="btn ghost ${armed ? 'danger' : ''}" data-a="delch" data-id="${c.id}">${armed ? 'Точно?' : 'Видалити'}</button></div><div class="days">${cells}</div></article>`;
}
function openChallengeSheet() {
  openSheet(`<form class="stack" style="gap:14px" data-f="addch">
    <div><h3>Новий челендж</h3><p class="sub" style="margin:0">Випробування на певний строк: місяць без солодкого, 30 днів спорту. На відміну від рутини, у нього є старт і фініш. Кожен відмічений день дає зірки.</p></div>
    <label class="field"><span class="label">Назва</span><input type="text" id="ch-name" placeholder="Напр.: місяць без солодкого"></label>
    <div class="fields"><label class="field"><span class="label">Скільки днів</span><input type="number" id="ch-days" value="30" min="1" max="366"></label>
      <label class="field"><span class="label">${STAR} за день</span><input type="number" id="ch-stars" value="1" min="1" max="${isHard() ? 10 : 3}"></label></div>
    <button class="btn primary" type="submit">Почати з сьогодні</button></form>`, '#ch-name');
}
function notebookRow(t, w) {
  const r = roleById(t.role), T = today();
  return `<li class="task nb-item ${t.done ? 'done' : ''}" style="--c:${colorOf(t)}">
    <button class="chk" data-a="task" data-id="${t.id}" aria-label="${t.done ? 'Зняти позначку' : 'Позначити виконаним'}">${CHECK}</button>
    <div class="nb-main"><span class="t">${esc(t.text)}${r ? ` <span class="rtag" style="--rc:${roleColor(r.id) || 'var(--ink)'}">${esc(r.name)}</span>` : ''}</span>
      <div class="nb-days" role="group" aria-label="Перенести в день">${[...Array(7)].map((_, k) => { const d = addDays(w, k); return `<button class="nbd ${d === T ? 'today' : ''}" data-a="setday" data-id="${t.id}" data-d="${d}" title="${DOW[parse(d).getDay()]}, ${fmtShort(d)}">${DOW_S[parse(d).getDay()]}</button>`; }).join('')}</div></div>
    <button class="chip ${isHard() ? '' : 'static'}" data-a="${isHard() ? 'stars' : 'edit'}" data-id="${t.id}">${t.stars}${STAR}</button>
    <button class="icon-btn" data-a="edit" data-id="${t.id}" aria-label="Редагувати">⋯</button></li>`;
}
function viewWeek() {
  const w = ui.week, T = today(), isCur = w === weekOf(T);
  const tasks = state.tasks.filter(t => t.week === w), pool = tasks.filter(t => !t.day);
  const habits = activeHabits().filter(h => habitWeek(h, w).sched.length);
  const g = ui.group === 'roles' ? 'roles' : 'days';
  const byTime = (a, b) => (a.time || '99') < (b.time || '99') ? -1 : (a.time || '99') > (b.time || '99') ? 1 : 0;
  let h = `<div class="stack">
    <div class="cal-tools"><button class="icon-btn" data-a="wk" data-d="-7" aria-label="Попередній тиждень">‹</button>
      <div><h2>${fmtRange(w)}</h2><p class="sub">${isCur ? 'Поточний тиждень' : parse(w) < parse(weekOf(T)) ? 'Минулий тиждень' : 'Наступний тиждень'} · ${tasks.filter(t => t.done).length}/${tasks.length} ${plural(tasks.length, 'справа', 'справи', 'справ')} виконано</p></div>
      <button class="icon-btn" data-a="wk" data-d="7" aria-label="Наступний тиждень">›</button></div>
    <div class="row" style="justify-content:space-between">${weekSwitch('week')}${isCur ? '' : '<button class="btn" data-a="wk0">До поточного тижня</button>'}</div>`;

  // блокнот тижня
  h += `<section class="card nb"><div class="row" style="justify-content:space-between"><h3>Блокнот тижня ${tipI('notebook')}</h3>${pool.length ? `<span class="sub">${pool.length} без дня</span>` : ''}</div>
    <form class="nb-form" data-f="nb"><textarea id="nb-text" rows="1" placeholder="Запиши справу й натисни Enter"></textarea>
      <div class="nb-opts">${starsField('nb-stars')}${tagFields('nb', ui.nbRole || null, ui.nbGoal || null)}<button class="btn primary" type="submit">Записати</button></div></form>
    <ul class="tasks nb-list">${pool.map(t => notebookRow(t, w)).join('') || `<li class="empty">${tasks.length ? 'Усе розкладено по днях.' : 'Поки порожньо. Запиши, що треба зробити цього тижня.'}</li>`}</ul>
    <p class="hint" style="margin:6px 0 0">${pool.length ? 'Натисни день біля справи — вона переїде в розклад. Точний час — у календарі. ' : ''}Можна вставити одразу список, а рядки з «Пн:», «Ср:»… підуть у свій день.</p></section>`;

  // розклад
  h += `<div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">Розклад</h3>
    <div class="auth-tabs seg sm"><button class="${g === 'days' ? 'on' : ''}" data-a="group" data-g2="days">За днями</button><button class="${g === 'roles' ? 'on' : ''}" data-a="group" data-g2="roles">За ролями</button></div></div>`;
  if (g === 'days') {
    const days = [...Array(7)].map((_, k) => addDays(w, k)).filter(d => tasks.some(t => t.day === d));
    if (!days.length) h += `<p class="empty" style="margin:0">Ще нічого не розкладено. Натисни день біля справи в блокноті.</p>`;
    else h += `<section class="card sched">${days.map(d => {
      const dd = parse(d), list = tasks.filter(t => t.day === d).sort(byTime);
      return `<div class="sday"><div class="sday-h"><b>${DOW[dd.getDay()][0].toUpperCase() + DOW[dd.getDay()].slice(1)}, ${fmtShort(d)}</b>${d === T ? ' <span class="tag">сьогодні</span>' : ''}${C.credited[d] ? ' <span class="goal-ok" style="font-size:.82rem">✓ зараховано</span>' : ''}<span class="sub" style="margin-left:auto">${list.filter(t => t.done).length}/${list.length}</span></div>
        <ul class="tasks">${list.map(t => taskRow(t, { toPool: true })).join('')}</ul></div>`;
    }).join('')}</section>`;
  } else {
    const roles = state.roles || [];
    if (!roles.length) h += `<div class="note"><span class="grow">Ролей ще немає. Створи першу в розділі «Ролі» — і справи тут згрупуються за ними.</span><button class="btn primary" data-a="go" data-tab="roles">До ролей</button></div>`;
    const grp = (title, list, hs, rid) => `<section class="card"><div class="row" style="justify-content:space-between"><h3>${title}</h3><span class="sub">${list.filter(t => t.done).length}/${list.length}</span></div>
      <ul class="tasks" style="margin-top:6px">${list.sort((a, b) => (a.day || '9') < (b.day || '9') ? -1 : 1).map(t => taskRow(t, { dayTag: true })).join('')}${hs.map(x => habitRow(x, isCur ? T : null, w)).join('')}</ul>
      ${rid ? `<form class="addf compact" data-f="addplan" data-role="${rid}" data-key="${rid}"><input type="text" id="ap-${rid}" placeholder="Додати в блокнот для цієї ролі" aria-label="Нова справа">${starsField('ap-' + rid + '-stars')}<button class="btn" type="submit">+</button></form>` : ''}</section>`;
    for (const r of roles) h += grp(`<span class="sdot" style="background:${roleColor(r.id) || 'var(--line)'}"></span>${esc(r.name)}`, tasks.filter(t => t.role === r.id), habits.filter(x => x.role === r.id), r.id);
    const rest = tasks.filter(t => !t.role || !roleById(t.role)), restH = habits.filter(x => !x.role || !roleById(x.role));
    if (rest.length || restH.length) h += grp('Без ролі', rest, restH, null);
  }

  // рутина і челенджі
  const chAct = state.challenges.filter(c => addDays(c.start, c.days - 1) >= T), chOld = state.challenges.filter(c => addDays(c.start, c.days - 1) < T);
  h += `<section class="card stack" style="gap:12px"><div class="row" style="justify-content:space-between"><h3>Рутина ${tipI('habits')}</h3><button class="btn" data-a="habit-new">+ Рутина</button></div>
    ${habits.length ? `<div class="grid">${habits.map(x => habitWeekCard(x, w)).join('')}</div>` : '<p class="empty" style="margin:0">Те, що робиш постійно: склянка води, 10 слів, зарядка. Записуєш один раз — відмічаєш по днях, а зірки за тиждень отримуєш разом, коли виконаєш норму.</p>'}</section>`;
  h += `<section class="card stack" style="gap:12px"><div class="row" style="justify-content:space-between"><h3>Челенджі ${tipI('chProfile')}</h3><button class="btn" data-a="ch-new">+ Челендж</button></div>
    ${chAct.length ? `<div class="grid">${chAct.map(c => challengeCard(c, T)).join('')}</div>` : '<p class="empty" style="margin:0">Випробування на певний строк: місяць без солодкого, 30 днів спорту. Кожен відмічений день дає зірки.</p>'}
    ${chOld.length ? `<details><summary>Завершені (${chOld.length})</summary><div class="grid" style="margin-top:10px">${chOld.map(c => challengeCard(c, T)).join('')}</div></details>` : ''}</section>`;
  return h + '</div>';
}

/* ---------- лист регулярної справи ---------- */
function openHabitSheet(id) {
  const h = id ? state.habits.find(x => x.id === id) : null;
  const c = h ? hcfg(h, weekOf(today())) : { days: [1, 2, 3, 4, 5, 6, 0], target: 5, stars: 3 };
  const hasLog = h && Object.keys(state.habitLog[h.id] || {}).length;
  openSheet(`<form class="stack" style="gap:14px" data-f="habit" data-id="${h ? h.id : ''}">
    <div><h3>${h ? 'Рутина' : 'Нова рутина'}</h3><p class="sub" style="margin:0">Те, що робиш постійно. Записуєш один раз — відмічаєш у потрібні дні. Зірки за тиждень нараховуються разом, коли виконано норму.</p></div>
    <label class="field"><span class="label">Справа</span><input type="text" id="hb-text" value="${h ? esc(h.text) : ''}" placeholder="Напр.: склянка води зранку"></label>
    <div class="field"><span class="label">Дні</span>${dayChips('hb', c.days)}</div>
    <div class="fields"><label class="field"><span class="label">Час <span class="sub">(для календаря)</span></span><select id="hb-time">${timeOptions(h ? h.time : '')}</select></label>
      <label class="field"><span class="label">Тривалість</span><select id="hb-dur">${durOptions(h ? h.dur || 30 : 30)}</select></label></div>
    <div class="fields"><label class="field"><span class="label">Норма на тиждень</span><select id="hb-target">${targetOptions(7, c.target)}</select></label>
      <label class="field"><span class="label">Нагорода</span>${habitStarsField('hb-stars', c.stars)}</label></div>
    ${(state.roles || []).length ? `<div class="fields"><label class="field"><span class="label">Роль</span><select id="hb-role">${roleOptions(h ? h.role : '')}</select></label></div>` : ''}
    ${h ? '<p class="hint" style="margin:0">Зміни діють з цього тижня. Минулі тижні й уже зароблені зірки не перераховуються.</p>' : ''}
    <div class="row"><button class="btn primary" type="submit">${h ? 'Зберегти' : 'Додати'}</button>
      ${h ? `<button class="btn ghost danger" type="button" data-a="habit-del" data-id="${h.id}">${ui.armed['hd' + h.id] ? (hasLog ? 'Точно? Історія збережеться' : 'Точно видалити?') : (hasLog ? 'Прибрати з плану' : 'Видалити')}</button>` : ''}</div></form>`, '#hb-text');
}

/* ================= розділ «Ролі» ================= */
// усі виконання в межах ролі: виконані справи + кожна відмітка регулярної справи окремо
function roleDone(rid) {
  const out = [];
  for (const t of state.tasks) if (t.role === rid && t.done && t.doneAt) out.push({ date: t.doneAt, text: t.text, stars: t.stars, kind: t.bonus ? 'бонусна' : 'справа' });
  for (const h of state.habits || []) if (h.role === rid) for (const d of Object.keys(state.habitLog[h.id] || {})) out.push({ date: d, text: h.text, stars: null, kind: 'рутина' });
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
      ${roles.length ? '' : `<p class="sub" style="margin:4px 0 0">У житті ти водночас студент, друг, спортсмен, брат, майбутній дипломат. Роль допомагає зрозуміти, ким ти хочеш бути в кожній із цих сфер і які конкретні дії тебе туди ведуть.</p>`}
      <div class="chain"><div><b>Роль</b><span>ким я хочу бути</span><i>Водій</i></div><div><b>Ціль</b><span>що і до коли</span><i>Скласти іспит до 1 грудня</i></div><div><b>Справи</b><span>що робити зараз</span><i>Пройти тест з ПДР</i></div></div>
      <p class="sub" style="margin:6px 0 0">${roles.length ? 'Відкрий роль, щоб поставити в ній ціль з терміном і нагородою. Плануючи справу, вибери роль і ціль — прогрес порахується сам.' : 'Створи роль, а в ній — цілі з терміном і нагородою, яку сам собі обереш. Плануючи справу, вибери роль і ціль — і кожне виконання автоматично зарахується в прогрес. Окремо нічого відмічати не треба.'}</p></div></div></section>`;
  const hz = goalsByHorizon();
  if (hz.length) h += `<section class="card stack" style="gap:10px"><h3>Цілі за термінами ${tipI('goals')}</h3>${hz.map(([t, gs]) => `<div><p class="label" style="margin:4px 0 8px">${t}</p><div class="grid">${gs.map(g => goalCard(g, { showRole: true })).join('')}</div></div>`).join('')}</section>`;
  let form = `<form class="card stack" style="gap:12px" data-f="addrole"><h3>${roles.length ? 'Ще одна роль' : 'Нова роль'}</h3>
    <label class="field"><span class="label">Назва ролі</span><input type="text" id="rl-name" placeholder="Напр.: Водій, Студент, Друг" maxlength="60"></label>
    <label class="field"><span class="label">Ким ти хочеш бути в цій ролі</span><textarea id="rl-desc" rows="3" placeholder="Напр.: впевнений і відповідальний водій, який добре знає ПДР і безпечно керує автомобілем"></textarea></label>
    <label class="field"><span class="label">Принципи <span class="sub">(необовʼязково)</span></span><textarea id="rl-goal" rows="2" placeholder="Напр.: не сідаю за кермо втомленим; щотижня 2 практичні заняття"></textarea></label>
    <p class="hint" style="margin:0">Цілі з терміном і нагородою додаси на сторінці ролі одразу після створення.</p>
    <div class="field"><span class="label">Колір у календарі</span>${colorField('rl-c', roles.length % 8)}</div>
    <div class="row"><button class="btn primary" type="submit">Створити роль</button></div></form>`;
  if (!roles.length) h += form + `<p class="empty">Ролей поки немає. Ти сам вирішуєш, ким хочеш стати — почни з однієї.</p>`;
  else h += `<div class="grid">${roles.map(r => {
    const all = roleDone(r.id).length, wk = roleWeek(r.id, W), pct = wk.planned ? Math.round(wk.done / wk.planned * 100) : 0;
    return `<button class="card role-card" data-a="role-open" data-id="${r.id}" type="button" style="--c:${roleColor(r.id) || 'var(--line)'}"><h3><span class="sdot" style="background:var(--c)"></span>${esc(r.name)}</h3>
      ${r.desc ? `<p class="sub role-desc">${esc(r.desc)}</p>` : ''}
      ${(() => { const gs = activeGoals(r.id).sort((a, b) => a.deadline.localeCompare(b.deadline)); return gs.length ? `<p class="sub role-goal">🎯 ${esc(gs[0].title)} · ${goalLeft(gs[0])}${gs.length > 1 ? ` · ще ${gs.length - 1}` : ''}</p>` : '<p class="sub role-goal muted">Цілей ще немає</p>'; })()}
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
      <label class="field"><span class="label">Принципи</span><textarea id="re-goal" rows="2">${esc(r.goal)}</textarea></label>
      <div class="field"><span class="label">Колір у календарі</span>${colorField('re-c', r.c)}</div>
      <div class="row"><button class="btn primary" type="submit">Зберегти</button><button class="btn" type="button" data-a="role-edit">Скасувати</button></div></form>`
    : `<section class="card stack" style="gap:8px"><div class="row" style="justify-content:space-between;align-items:flex-start"><h2 style="margin:0">${esc(r.name)}</h2>
      <div class="row"><button class="btn" data-a="role-edit" data-id="${r.id}">Редагувати</button><button class="btn ghost danger" data-a="role-del" data-id="${r.id}">${ui.armed['rd' + r.id] ? 'Точно видалити?' : 'Видалити'}</button></div></div>
      ${r.desc ? `<p style="margin:0">${esc(r.desc)}</p>` : '<p class="sub" style="margin:0">Опису ще немає.</p>'}
      ${r.goal ? `<p class="sub" style="margin:0"><b>Принципи:</b> ${esc(r.goal)}</p>` : ''}
      ${ui.armed['rd' + r.id] ? '<p class="hint" style="margin:0">Справи цієї ролі залишаться, просто без привʼязки до ролі. Цілі ролі видаляться. Зароблені зірки не зміняться.</p>' : ''}</section>`;
  const ga = activeGoals(r.id).sort((a, b) => a.deadline.localeCompare(b.deadline)), gOld = goalsOf(r.id).filter(g => g.doneAt || g.closed);
  h += `<section class="card stack goals-sec" style="gap:12px"><div class="row" style="justify-content:space-between"><h3>Цілі ${tipI('goals')}</h3><button class="btn primary" data-a="goal-new" data-role="${r.id}">+ Ціль</button></div>
    ${ga.length ? `<div class="grid">${ga.map(g => goalCard(g)).join('')}</div>` : `<div class="goal-empty"><p style="margin:0"><b>Чого конкретно ти хочеш досягти як ${esc(r.name)}?</b></p><p class="sub" style="margin:4px 0 0">Постав ціль з терміном — на місяць, 3 місяці чи рік. Справи, привʼязані до неї, рахуються в прогрес, а коли досягнеш — отримаєш нагороду, яку сам собі вибереш.</p></div>`}
    ${gOld.length ? `<details><summary>Досягнуті й закриті (${gOld.length})</summary><div class="grid" style="margin-top:10px">${gOld.map(g => goalCard(g)).join('')}</div></details>` : ''}</section>`;
  h += `<div class="kpis"><span class="kpi">Усього виконань <b>${done.length}</b></span><span class="kpi">Цей тиждень <b>${wk.done}/${wk.planned}</b></span><span class="kpi">Зароблено <b>${stars}${STAR}</b></span><span class="kpi">Відкритих справ <b>${openTasks.length}</b></span></div>`;
  h += `<section class="card"><h3>Прогрес за тижнями</h3><p class="sub">Виконано з запланованого за останні 8 тижнів</p>
    <div class="wbars">${per.map(p => `<div class="wbar ${p.w === W ? 'cur' : ''}" title="${fmtRange(p.w)}: ${p.done} з ${p.planned}"><div class="wb-col"><i class="pl" style="height:${p.planned / mx * 100}%"></i><i class="dn" style="height:${p.done / mx * 100}%"></i></div><b>${p.done}</b><small>${fmtShort(p.w).replace(' ', '&nbsp;')}</small></div>`).join('')}</div>
    <p class="hint" style="margin:6px 0 0"><span class="lg dn"></span> виконано · <span class="lg pl"></span> заплановано</p></section>`;
  h += `<section class="card"><h3>Зараз у цій ролі</h3>
    <ul class="tasks" style="margin-top:8px">${openTasks.map(t => taskRow(t, { dayTag: true })).join('')}${hs.map(x => habitRow(x, T)).join('')}</ul>
    ${!openTasks.length && !hs.length ? '<p class="empty">Немає відкритих справ. Додай справу і вибери для неї цю роль.</p>' : ''}
    <form class="addf" data-f="addplan" data-role="${r.id}" data-key="role"><input type="text" id="ap-role" placeholder="Справа для ролі «${esc(r.name)}» на цей тиждень">${starsField('ap-role-stars')}${goalField('ap-role', r.id, ga.length === 1 ? ga[0].id : '')}<button class="btn primary" type="submit">Додати</button></form></section>`;
  h += `<section class="card"><h3>Історія виконань</h3>
    ${done.length ? `<ul class="hist">${done.slice(0, 60).map(x => `<li><span class="date">${fmtShort(x.date)}</span><span class="t">${esc(x.text)} <span class="tag">${x.kind}</span></span>${x.stars ? `<span class="chip static">+${x.stars}${STAR}</span>` : ''}</li>`).join('')}</ul>${done.length > 60 ? `<p class="hint">Показано останні 60 з ${done.length}.</p>` : ''}` : '<p class="empty">Ще нічого не виконано в цій ролі.</p>'}</section>`;
  return h + '</div>';
}

/* ================= цілі в межах ролей =================
   Роль (ким я хочу бути) → Ціль (що і до коли) → Справи (що робити).
   Прогрес цілі рахується з привʼязаних справ. За досягнуту ціль — власна нагорода, яку людина вписує сама (зірок не дає). */
const goalById = id => (state.goals || []).find(g => g.id === id);
const goalsOf = rid => (state.goals || []).filter(g => g.role === rid);
const activeGoals = rid => goalsOf(rid).filter(g => !g.doneAt && !g.closed);
function goalProg(g) { const ts = state.tasks.filter(t => t.goal === g.id); return { done: ts.filter(t => t.done).length, all: ts.length }; }
const endOfMonth = d => { const x = parse(d); return iso(new Date(x.getFullYear(), x.getMonth() + 1, 0)); };
const addMonths = (d, n) => { const x = parse(d); return iso(new Date(x.getFullYear(), x.getMonth() + n, x.getDate())); };
const endOfYear = d => d.slice(0, 4) + '-12-31';
function goalLeft(g) { const n = daysBetween(today(), g.deadline); return n < 0 ? `термін минув ${fmtShort(g.deadline)}` : n === 0 ? 'термін — сьогодні' : `до ${fmtShort(g.deadline)} · ${n} ${plural(n, 'день', 'дні', 'днів')}`; }
function goalCard(g, opt = {}) {
  const p = goalProg(g), T = today(), over = !g.doneAt && !g.closed && g.deadline < T, r = roleById(g.role);
  const pct = g.doneAt ? 100 : g.target ? Math.min(100, p.done / g.target * 100) : p.all ? p.done / p.all * 100 : 0;
  const reached = g.target && p.done >= g.target;
  return `<div class="goal-card ${g.doneAt ? 'won' : ''} ${over ? 'over' : ''} ${g.closed ? 'closed' : ''}" style="--c:${roleColor(g.role) || 'var(--ink)'}">
    <div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><div style="flex:1;min-width:0">
      ${opt.showRole && r ? `<span class="rtag" style="--rc:${roleColor(r.id) || 'var(--ink)'}">${esc(r.name)}</span> ` : ''}<b class="g-title">🎯 ${esc(g.title)}</b>
      <p class="sub" style="margin:2px 0 0">${g.doneAt ? `досягнуто ${fmtShort(g.doneAt)}` : g.closed ? 'закрито без досягнення' : goalLeft(g)}${g.reward ? ` · нагорода: <b>${esc(g.reward)}</b>` : ''}</p></div>
      <button class="icon-btn" data-a="goal-edit" data-id="${g.id}" aria-label="Редагувати ціль">⋯</button></div>
    <div class="bar ${g.doneAt ? 'good' : ''}" style="margin-top:8px"><i style="width:${pct}%"></i></div>
    <div class="row" style="justify-content:space-between;margin-top:6px;gap:8px"><span class="sub">${g.target ? `${p.done} з ${g.target}` : `${p.done} ${plural(p.done, 'крок', 'кроки', 'кроків')} зроблено${p.all > p.done ? ` · ще ${p.all - p.done} заплановано` : ''}`}</span>
      ${g.doneAt ? `<button class="link" data-a="goal-undo" data-id="${g.id}">Повернути в роботу</button>` : g.closed ? `<button class="link" data-a="goal-reopen" data-id="${g.id}">Відкрити знову</button>` : `<button class="btn ${reached ? 'star' : ''}" data-a="goal-done" data-id="${g.id}">${reached ? 'Число досягнуто — позначити' : 'Ціль досягнута'}</button>`}</div>
    ${over ? `<div class="row g-over"><span class="sub" style="flex:1;min-width:160px">Термін минув. Продовж його або закрий ціль.</span><button class="btn" data-a="goal-edit" data-id="${g.id}">Продовжити</button><button class="btn ghost" data-a="goal-close" data-id="${g.id}">Закрити</button></div>` : ''}
  </div>`;
}
function openGoalSheet(id, roleId) {
  const g = id ? goalById(id) : null, rid = g ? g.role : roleId, r = roleById(rid), T = today();
  const presets = [['Кінець місяця', endOfMonth(T)], ['3 місяці', addMonths(T, 3)], ['Пів року', addMonths(T, 6)], ['Кінець року', endOfYear(T)]];
  openSheet(`<form class="stack" style="gap:14px" data-f="goal" data-id="${g ? g.id : ''}" data-role="${rid}">
    <div><h3>${g ? 'Ціль' : 'Нова ціль'}${r ? ` · ${esc(r.name)}` : ''}</h3><p class="sub" style="margin:0">Що конкретно ти хочеш досягти в цій ролі і до коли. Справи, привʼязані до цілі, рахуються в її прогрес.</p></div>
    <label class="field"><span class="label">Ціль</span><input type="text" id="gl-title" value="${g ? esc(g.title) : ''}" placeholder="Напр.: скласти іспит з ПДР" maxlength="100"></label>
    <div class="field"><span class="label">Термін</span><div class="row" style="gap:6px">${presets.map(([l, d]) => `<button type="button" class="btn" data-a="goal-preset" data-d="${d}">${l}</button>`).join('')}</div>
      <input type="date" id="gl-deadline" value="${g ? g.deadline : endOfMonth(T)}" style="margin-top:6px;max-width:220px"></div>
    <label class="field"><span class="label">Число <span class="sub">— необовʼязково, для цілей на кшталт «12 книг»</span></span><input type="number" id="gl-target" min="1" max="9999" value="${g && g.target ? g.target : ''}" placeholder="Без числа" style="max-width:160px"></label>
    <label class="field"><span class="label">Чим себе нагородиш, коли досягнеш</span><input type="text" id="gl-reward" value="${g ? esc(g.reward || '') : ''}" placeholder="Напр.: нові кросівки, вихідні в горах" maxlength="80"></label>
    <div class="row"><button class="btn primary" type="submit">${g ? 'Зберегти' : 'Додати ціль'}</button>${g ? `<button class="btn ghost danger" type="button" data-a="goal-del" data-id="${g.id}">${ui.armed['gd' + g.id] ? 'Точно? Справи залишаться' : 'Видалити ціль'}</button>` : ''}</div></form>`, '#gl-title');
}
function openGoalWon(g) {
  openSheet(`<div class="won"><div class="goal-won-ico">🎯</div><span class="label">Ціль досягнута</span><h2>${esc(g.title)}</h2>
    ${g.reward ? `<p class="sub">Твоя нагорода: <b>${esc(g.reward)}</b>. Ти її заслужив — забирай без почуття провини.</p>` : '<p class="sub">Можна ставити наступну ціль у цій ролі.</p>'}
    <div class="row" style="justify-content:center"><button class="btn primary" data-sheet-close>Готово</button></div></div>`);
}
// вибір цілі у формах справ: показується, лише коли в обраної ролі є цілі
function goalOptions(rid, sel) {
  const gs = activeGoals(rid), cur = sel && goalById(sel);
  if (cur && cur.role === rid && !gs.includes(cur)) gs.push(cur);
  return `<option value="">Без цілі</option>` + gs.map(g => `<option value="${g.id}" ${g.id === sel ? 'selected' : ''}>🎯 ${esc(g.title)}</option>`).join('');
}
function goalField(prefix, rid, sel) {
  const show = rid && (activeGoals(rid).length || sel);
  return `<select id="${prefix}-goal" aria-label="Ціль" ${show ? '' : 'hidden'}>${rid ? goalOptions(rid, sel) : '<option value="">Без цілі</option>'}</select>`;
}
function readGoal(prefix, rid) {
  const el = document.getElementById(prefix + '-goal'), g = el && el.value ? goalById(el.value) : null;
  return g && g.role === rid ? g.id : null;
}
function refreshGoalSelect(roleEl) {
  const p = roleEl.id.slice(0, -5), gs = document.getElementById(p + '-goal'); if (!gs) return;
  const rid = roleEl.value; gs.innerHTML = rid ? goalOptions(rid, '') : '<option value="">Без цілі</option>';
  gs.hidden = !(rid && activeGoals(rid).length);
}
function goalsByHorizon() {
  const T = today(), m = endOfMonth(T), q = addMonths(T, 3), y = endOfYear(T);
  const act = (state.goals || []).filter(g => !g.doneAt && !g.closed && roleById(g.role)).sort((a, b) => a.deadline.localeCompare(b.deadline));
  return [['Цей місяць', act.filter(g => g.deadline <= m)], ['Найближчі 3 місяці', act.filter(g => g.deadline > m && g.deadline <= q)], ['Цей рік', act.filter(g => g.deadline > q && g.deadline <= y)], ['Пізніше', act.filter(g => g.deadline > y)]].filter(x => x[1].length);
}
