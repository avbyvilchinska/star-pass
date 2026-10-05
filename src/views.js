/* ================= header ================= */
function renderHeader() {
  document.getElementById('balance').textContent = C.balance;
  const fl = document.getElementById('flame');
  fl.classList.toggle('on', C.todayCredited);
  fl.querySelector('b').textContent = C.streak;
  fl.title = C.todayCredited ? `Вогник горить: серія ${dayWord(C.streak)}` : C.streak ? `Виконай денну мету, щоб вогник не згас (серія ${dayWord(C.streak)})` : 'Виконай денну мету, щоб запалити вогник';
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === ui.tab));
  const ac = document.getElementById('acct');
  ac.hidden = !(CLOUD && account);
  if (account) { ac.querySelector('.av').textContent = (account.email || '?')[0].toUpperCase(); ac.querySelector('span:last-child').textContent = account.email; }
}

/* ================= shared bits ================= */
const sphereById = id => state.spheres.find(s => s.id === id);
const colorOf = t => { const s = sphereById(t.sphere); return s ? `var(--s${s.c % 8})` : t.bonus ? 'var(--s5)' : t.stars >= 3 ? 'var(--s1)' : t.stars === 2 ? 'var(--s0)' : 'var(--s2)'; };
function starsField(id, val) {
  if (isHard()) return `<input type="number" id="${id}" value="${val || 1}" min="1" max="10" aria-label="Зірки за справу" title="Зірки за справу">`;
  return `<select id="${id}" aria-label="Складність">${Object.entries(DIFF).map(([k, d]) => `<option value="${k}" ${k === (val || 'easy') ? 'selected' : ''}>${d.name} · ${d.stars}${STAR}</option>`).join('')}</select>`;
}
function readStars(id) {
  const el = document.getElementById(id);
  if (isHard()) { const n = Math.min(10, Math.max(1, parseInt(el.value, 10) || 1)); return { diff: n >= 3 ? 'hard' : n === 2 ? 'med' : 'easy', stars: n }; }
  return { diff: el.value, stars: DIFF[el.value].stars };
}
function taskRow(t, opt = {}) {
  const s = sphereById(t.sphere);
  return `<li class="task ${t.done ? 'done' : ''}" style="--c:${colorOf(t)}">
    <button class="chk" data-a="task" data-id="${t.id}" aria-label="${t.done ? 'Зняти позначку' : 'Позначити виконаним'}">${CHECK}</button>
    <span class="t">${esc(t.text)}${s ? ` <span class="date">· ${esc(s.name)}</span>` : ''}${t.bonus ? ' <span class="tag">бонус</span>' : ''}</span>
    ${t.time ? `<span class="tchip">${t.time}</span>` : ''}
    ${opt.toToday ? `<button class="btn ghost" data-a="settoday" data-id="${t.id}" style="padding:2px 6px;font-size:.78rem">на сьогодні</button>` : ''}
    <button class="chip ${isHard() ? '' : 'static'}" data-a="${isHard() ? 'stars' : 'edit'}" data-id="${t.id}" title="${isHard() ? 'Змінити кількість зірок' : 'Деталі справи'}">${t.stars}${STAR}</button>
    <button class="icon-btn" data-a="edit" data-id="${t.id}" aria-label="Редагувати">⋯</button>
  </li>`;
}
function ring(done, goal, ok) {
  const r = 34, c = 2 * Math.PI * r, p = Math.min(1, done / goal);
  return `<svg class="ring ${ok ? 'ok' : ''}" viewBox="0 0 84 84" role="img" aria-label="Виконано ${done} з ${goal}"><circle class="bg" cx="42" cy="42" r="${r}"/><circle class="fg" cx="42" cy="42" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p)).toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle">${Math.min(done, 99)}/${goal}</text></svg>`;
}

/* ================= today ================= */
function viewToday() {
  const T = today(), dt = parse(T), w = weekOf(T);
  const list = state.tasks.filter(t => t.day === T).sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : (a.time || '99') > (b.time || '99') ? 1 : 0);
  const pool = state.tasks.filter(t => t.week === w && !t.day && !t.done);
  const active = state.challenges.filter(c => T >= c.start && T <= addDays(c.start, c.days - 1));
  const mr = mainReward();
  const minimalNow = state.minimal.find(p => T >= p.from && T <= p.to);
  const rep = repairState();
  const bonusToday = state.tasks.filter(t => t.bonus && t.doneAt === T).length;
  let h = `<div class="stack">
    <div class="day-head"><div><h2>${DOW[dt.getDay()][0].toUpperCase() + DOW[dt.getDay()].slice(1)}, ${dt.getDate()} ${MON_G[dt.getMonth()]}</h2>
      <p class="sub">${isHard() ? 'Важкий режим' : 'Базовий режим'}${minimalNow ? ' · мінімальний план до ' + fmtShort(minimalNow.to) : ''}</p></div></div>`;
  if (rep === 'need') h += `<div class="note fire"><span class="grow"><b>Учора вогник згас.</b> Виконай денну мету і ще одну справу понад неї — і серія повернеться.</span></div>`;
  if (rep === 'ready') h += `<div class="note fire"><span class="grow"><b>Можна повернути вогник.</b> Ти виконав денну мету з запасом — учорашній пропуск буде прощено.</span><button class="btn star" data-a="repair">Повернути вогник</button></div>`;
  if (rep === 'used') h += `<div class="note fire"><span class="grow">Учора вогник згас. Повернути серію можна раз на тиждень — цього разу вже не вийде.</span></div>`;
  if (rep === 'hard') h += `<div class="note fire"><span class="grow">Учора вогник згас. У важкому режимі серію не повернути — починаємо нову.</span></div>`;

  // main reward + goal
  h += `<div class="grid2">`;
  if (mr) {
    const pct = Math.min(100, Math.max(0, C.balance) / mr.cost * 100);
    h += `<section class="card main-rw"><span class="label">Головна винагорода</span><div class="name">${esc(mr.name)}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="row" style="justify-content:space-between;margin-top:8px"><span class="num">${Math.max(0, C.balance)} / ${mr.cost}${STAR}</span><span class="hint">${etaText(mr.cost)}</span></div>
      ${C.balance >= mr.cost ? `<button class="btn star" style="margin-top:10px" data-a="buy" data-id="${mr.id}">Забрати винагороду</button>` : ''}</section>`;
  } else h += `<section class="card main-rw"><span class="label">Головна винагорода</span><p class="sub">Обери, заради чого збираєш зірки.</p><button class="btn primary" data-a="go" data-tab="rewards" style="margin-top:8px">Додати винагороду</button></section>`;
  const ok = C.todayCredited;
  h += `<section class="card"><div class="goal">${ring(C.todayDone, C.goal, ok)}<div style="min-width:0">
      <h3>${ok ? '<span class="goal-ok">День зараховано</span>' : `Денна мета: ${C.goal} ${plural(C.goal, 'справа', 'справи', 'справ')}`}</h3>
      <p class="sub">${ok ? `+${minimalNow ? 1 : 2}${STAR} за день · вогник горить` : `Ще ${C.goal - C.todayDone} — і отримаєш +${minimalNow ? 1 : 2}${STAR}`}</p></div></div>
      ${ok ? (state.lucky[T] ? `<div class="lucky open">${STAR_SVG.replace('star-svg', '')} Зірка дня: +${state.lucky[T]}${STAR}</div>` : `<button class="lucky" data-a="lucky">${STAR_SVG.replace('star-svg', '')} Відкрити зірку дня</button>`) : ''}
    </section></div>`;

  // tasks
  h += `<section class="card"><div class="row" style="justify-content:space-between"><h3>Справи на сьогодні</h3><button class="link" data-a="go" data-tab="calendar">Календар →</button></div>
    <ul class="tasks" style="margin-top:8px">${list.map(t => taskRow(t)).join('') || '<li class="empty">Поки порожньо. Додай 3 справи — це і є денна мета.</li>'}</ul>
    <form class="addf" data-f="addtoday"><input type="text" id="today-text" placeholder="Що зробити сьогодні" aria-label="Нова справа">${starsField('today-stars')}<button class="btn primary" type="submit">Додати</button></form></section>`;
  if (pool.length) h += `<section class="card"><h3>З плану тижня</h3><p class="sub">Ще не розкладені по днях</p><ul class="tasks" style="margin-top:6px">${pool.map(t => taskRow(t, { toToday: true })).join('')}</ul></section>`;
  if (active.length) h += `<section class="card"><h3>Челенджі</h3><div class="stack" style="gap:8px;margin-top:10px">${active.map(c => {
    const on = !!c.checks[T];
    return `<div class="row"><button class="chk ${on ? 'on' : ''}" style="--c:var(--s4)" data-a="chday" data-id="${c.id}" data-d="${T}" aria-label="Відмітити день">${CHECK}</button><span style="flex:1;min-width:0">${esc(c.name)} <span class="date">· день ${daysBetween(c.start, T) + 1}/${c.days}</span></span><span class="chip static">+${c.stars}${STAR}</span></div>`;
  }).join('')}</div></section>`;
  h += `<section class="card"><h3>Бонусна справа</h3><p class="sub">Зробив щось понад план — запиши і забери зірки.${isHard() ? '' : ` До ${BASIC_BONUS_LIMIT} на день (сьогодні: ${bonusToday}).`}</p>
    <form class="addf" data-f="addbonus"><input type="text" id="bonus-text" placeholder="Що зробив" aria-label="Бонусна справа">${starsField('bonus-stars')}<button class="btn star" type="submit" ${!isHard() && bonusToday >= BASIC_BONUS_LIMIT ? 'disabled' : ''}>Забрати</button></form></section>`;
  h += `<div class="row">${minimalNow ? `<span class="sub">Мінімальний план діє до ${fmtShort(minimalNow.to)}: денна мета — 1 справа.</span><button class="link" data-a="minimal-off">Вимкнути</button>` : `<button class="link" data-a="minimal">Хворію або завал — увімкнути мінімальний план</button>`}</div>`;
  return h + '</div>';
}

/* ================= calendar ================= */
function viewCalendar() {
  const w = ui.week, T = today(), isCur = w === weekOf(T), rows = CAL_END - CAL_START;
  const days = [...Array(7)].map((_, i) => addDays(w, i));
  const pool = state.tasks.filter(t => t.week === w && !t.day);
  const chip = t => `<div class="ctask drag ${t.done ? 'done' : ''}" data-id="${t.id}" style="--c:${colorOf(t)}"><span class="t">${esc(t.text)}</span><span class="chip">${t.stars}${STAR}</span></div>`;
  let h = `<div class="stack">
    <div class="cal-tools"><button class="icon-btn" data-a="wk" data-d="-7" aria-label="Попередній тиждень">‹</button>
      <div><h2>${fmtRange(w)}</h2><p class="sub">${isCur ? 'Поточний тиждень' : parse(w) < parse(weekOf(T)) ? 'Минулий тиждень' : 'Наступний тиждень'} · перетягуй справи в потрібний день і час</p></div>
      <button class="icon-btn" data-a="wk" data-d="7" aria-label="Наступний тиждень">›</button></div>
    ${isCur ? '' : '<div><button class="btn" data-a="wk0">До поточного тижня</button></div>'}
    <section class="card"><div class="row" style="justify-content:space-between"><h3>Справи тижня без дати</h3><span class="hint">Тягни в календар · торкнись, щоб відкрити</span></div>
      <div class="pool" data-drop="pool" style="margin-top:8px">${pool.map(chip).join('') || '<span class="empty">Додай справи на тиждень — потім розклади їх по днях.</span>'}</div>
      <form class="addf" data-f="addweek"><input type="text" id="week-text" placeholder="Справа на цей тиждень" aria-label="Справа на тиждень">${starsField('week-stars')}<button class="btn primary" type="submit">Додати</button></form></section>
    <div class="cal-scroll" id="cal-scroll"><div class="cal" style="--rows:${rows}">
      <div class="cal-h"></div>${days.map(d => { const dd = parse(d); return `<div class="cal-h ${d === T ? 'today' : ''}"><small>${DOW_S[dd.getDay()]}</small><b>${dd.getDate()}</b><span class="credit">${C.credited[d] ? '✓ зараховано' : ''}</span></div>`; }).join('')}
      <div class="cal-lab">весь день</div>${days.map(d => `<div class="cal-ad" data-drop="allday" data-day="${d}">${state.tasks.filter(t => t.day === d && !t.time).map(chip).join('')}</div>`).join('')}
      <div class="cal-times">${[...Array(rows)].map((_, i) => i ? `<span style="top:calc(${i} * var(--row))">${z(CAL_START + i)}:00</span>` : '').join('')}</div>
      ${days.map(d => {
        const evs = state.tasks.filter(t => t.day === d && t.time).map(t => {
          const top = (toMin(t.time) - CAL_START * 60) / 60, hgt = Math.max(0.5, (t.dur || 60) / 60);
          return `<div class="ev drag ${t.done ? 'done' : ''}" data-id="${t.id}" style="--c:${colorOf(t)};top:calc(${top} * var(--row) + 1px);height:calc(${hgt} * var(--row) - 3px)"><b>${t.time}–${fmtHM(Math.min(24 * 60, toMin(t.time) + (t.dur || 60)))}</b><span class="t">${esc(t.text)}</span></div>`;
        }).join('');
        let now = '';
        if (d === T) { const n = new Date(), m = n.getHours() * 60 + n.getMinutes(); if (m >= CAL_START * 60) now = `<div class="now-line" style="top:calc(${(m - CAL_START * 60) / 60} * var(--row))"></div>`; }
        return `<div class="cal-col ${d === T ? 'today' : ''}" data-drop="col" data-day="${d}">${evs}${now}</div>`;
      }).join('')}
    </div></div>
    <p class="hint">Порада: торкнись порожнього місця в календарі, щоб одразу створити справу на цей час.</p>
  </div>`;
  return h;
}

/* ================= rewards ================= */
function viewRewards() {
  const list = [...state.rewards].sort((a, b) => a.cost - b.cost);
  const mr = mainReward();
  const hist = [...state.purchases.map(p => ({ ...p, kind: 'buy' })), ...state.penalties.map(p => ({ ...p, kind: 'burn' }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  return `<div class="stack">
    <div class="day-head" style="justify-content:space-between"><div><h2>Винагороди</h2><p class="sub">Визнач ціну заздалегідь — потім заробляй і забирай без почуття провини</p></div>
      <div class="kpis"><span class="kpi">На рахунку <b>${C.balance}${STAR}</b></span><span class="kpi">Темп <b>≈${Math.round(pace())}${STAR}/день</b></span></div></div>
    <form class="card stack" data-f="addrw" style="gap:10px"><h3>Нова винагорода</h3>
      <div class="row"><input type="text" id="rw-name" placeholder="Наприклад: кіно з друзями" aria-label="Назва винагороди" style="flex:1 1 200px">
      <label class="row" style="gap:6px"><span class="sub">ціна</span><input type="number" id="rw-cost" value="25" min="1" max="9999"></label>
      <button class="btn primary" type="submit">Додати</button></div>
      <span class="hint" id="rw-eta">${etaText(25)}</span></form>
    <div class="grid">${list.map(r => {
      const ready = C.balance >= r.cost, armed = ui.armed[r.id], armedDel = ui.armed['d' + r.id], isMain = mr && mr.id === r.id;
      const locked = !isHard() && r.lockedUntil && today() < r.lockedUntil;
      return `<article class="card reward ${ready ? 'ready' : ''} ${isMain ? 'main-on' : ''}">
        <div class="top-r"><h3>${esc(r.name)}</h3><span class="price">${r.cost}${STAR}</span></div>
        <div><div class="bar"><i style="width:${Math.min(100, Math.max(0, C.balance) / r.cost * 100)}%"></i></div>
        <p class="hint" style="margin-top:4px">${etaText(r.cost)}</p></div>
        ${ui.editPrice === r.id ? `<form class="row" data-f="price" data-id="${r.id}"><input type="number" id="price-${r.id}" value="${r.cost}" min="1" max="9999"><button class="btn primary" type="submit">Зберегти</button><button class="btn ghost" type="button" data-a="price-cancel">Скасувати</button>${locked ? `<span class="hint">Знизити можна з ${fmtShort(r.lockedUntil)}</span>` : ''}</form>` : ''}
        <div class="row">
          <button class="btn ${armed ? 'star' : 'primary'}" data-a="buy" data-id="${r.id}" ${ready ? '' : 'disabled'}>${armed ? `Підтвердити −${r.cost}${STAR}` : 'Отримати'}</button>
          <button class="btn ghost" data-a="main" data-id="${r.id}" ${isMain ? 'disabled' : ''}>${isMain ? 'Головна' : 'Зробити головною'}</button>
          <span style="margin-left:auto" class="row"><button class="icon-btn" data-a="price-edit" data-id="${r.id}" title="Змінити ціну" aria-label="Змінити ціну">✎</button>
          <button class="btn ghost ${armedDel ? 'danger' : ''}" data-a="delrw" data-id="${r.id}">${armedDel ? 'Точно?' : 'Видалити'}</button></span>
        </div></article>`;
    }).join('') || '<p class="empty">Додай першу винагороду</p>'}</div>
    <section class="card"><h3>Історія</h3><ul class="hist" style="margin-top:6px">${hist.map(p => p.kind === 'buy'
      ? `<li><span class="date">${fmtShort(p.date)}</span><span class="t">${esc(p.name)}</span><span class="minus">−${p.cost}${STAR}</span><button class="icon-btn" data-a="delbuy" data-id="${p.id}" title="Скасувати покупку" aria-label="Скасувати покупку">↺</button></li>`
      : `<li><span class="date">${fmtShort(p.date)}</span><span class="t">Згоріло: ${dayWord(p.days)} без активності</span><span class="minus">−${p.stars}${STAR}</span></li>`).join('') || '<li class="empty">Поки нічого не куплено</li>'}</ul></section>
  </div>`;
}

/* ================= profile ================= */
function forecastChart(F) {
  const W = 640, H = 230, L = 44, R = 70, Tp = 16, B = 30, iw = W - L - R, ih = H - Tp - B;
  const cum = []; let acc = 0; F.daily.forEach(v => { acc += v; cum.push(acc); });
  const startV = acc, endHi = startV + 30 * F.m + F.band(30), maxV = Math.max(10, endHi, startV);
  const step = Math.pow(10, Math.floor(Math.log10(maxV))) * (maxV / Math.pow(10, Math.floor(Math.log10(maxV))) > 5 ? 2 : 1);
  const top = Math.ceil(maxV / step) * step, n = F.span + 30;
  const x = i => L + (i / n) * iw, y = v => Tp + ih - v / top * ih;
  const past = cum.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`);
  past.unshift(`${x(0).toFixed(1)},${y(0).toFixed(1)}`);
  const mid = [], hi = [], lo = [];
  for (let k = 0; k <= 30; k++) { const xi = x(F.span + k).toFixed(1); mid.push(`${xi},${y(startV + k * F.m).toFixed(1)}`); hi.push(`${xi},${y(startV + k * F.m + F.band(k)).toFixed(1)}`); lo.push(`${xi},${y(Math.max(startV, startV + k * F.m - F.band(k))).toFixed(1)}`); }
  let g = '';
  for (let v = 0; v <= top; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="JetBrains Mono, monospace">${v}</text>`;
  const xT = x(F.span);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Накопичені зірки: факт за ${dayWord(F.span)} і прогноз на 30 днів">${g}
    <polygon points="${hi.join(' ')} ${lo.reverse().join(' ')}" fill="var(--ink)" opacity=".12"/>
    <line x1="${xT}" x2="${xT}" y1="${Tp}" y2="${Tp + ih}" stroke="var(--muted)" stroke-dasharray="2 4"/>
    <text x="${xT}" y="${H - 10}" text-anchor="middle" font-size="11" fill="var(--fg)" font-weight="700">сьогодні</text>
    <text x="${x(0)}" y="${H - 10}" font-size="11" fill="var(--muted)">−${F.span} дн.</text>
    <text x="${x(n)}" y="${H - 10}" text-anchor="end" font-size="11" fill="var(--muted)">+30 дн.</text>
    <polyline points="${past.join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
    <polyline points="${mid.join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 5"/>
    <circle cx="${xT}" cy="${y(startV)}" r="4" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"/>
    <text x="${x(n) + 6}" y="${y(startV + 30 * F.m) + 4}" font-size="12" font-weight="700" fill="var(--fg)" font-family="JetBrains Mono, monospace">+${F.proj}</text>
    <text x="${x(n) + 6}" y="${y(startV + 30 * F.m) + 18}" font-size="10" fill="var(--muted)">прогноз</text>
    <rect id="fc-hit" x="${L}" y="${Tp}" width="${iw}" height="${ih}" fill="transparent" data-span="${F.span}" data-n="${n}" data-l="${L}" data-iw="${iw}" data-w="${W}"/>
  </svg>`;
}
function viewProfile() {
  const T = today(), w = weekOf(T), F = forecast();
  const minimalNow = state.minimal.find(p => T >= p.from && T <= p.to);
  const wk = [...Array(7)].map((_, i) => addDays(w, i));
  const wkEarn = C.ev.filter(e => e.date >= w && e.date <= addDays(w, 6)).reduce((a, e) => a + e.stars, 0);
  const wkDone = state.tasks.filter(t => t.done && t.doneAt >= w && t.doneAt <= addDays(w, 6)).length;
  const afford = F.need ? [] : [...state.rewards].sort((a, b) => a.cost - b.cost).filter(r => r.cost <= Math.max(0, C.balance) + F.proj).slice(0, 4);
  const loc = CLOUD ? readLocal() : null;
  let h = `<div class="stack"><div><h2>Профіль</h2><p class="sub">Прогноз, режим гри, челенджі та налаштування</p></div>`;
  h += CLOUD && account ? `<section class="card stack" style="gap:12px"><div class="row"><span class="av big-av">${esc((account.email || '?')[0].toUpperCase())}</span><div style="min-width:0;flex:1"><b style="overflow-wrap:anywhere">${esc(account.email)}</b>
      <p class="sub" style="margin:0">${account.emailVerified ? 'Пошту підтверджено' : 'Пошту не підтверджено — лист міг потрапити в «Спам»'}</p></div></div>
      <div class="row">${account.emailVerified ? '' : '<button class="btn" data-a="verify">Надіслати лист ще раз</button>'}<button class="btn" data-a="pwreset">Змінити пароль</button><button class="btn danger" data-a="logout">Вийти</button></div></section>`
    : `<section class="card"><h3>Акаунт</h3><p class="sub">Вхід через пошту не налаштовано: прогрес живе лише в цьому браузері. Заповни config.js за інструкцією з README.</p></section>`;

  // forecast
  h += `<section class="card stack" style="gap:10px"><h3>Прогноз на наступні 30 днів</h3>`;
  if (F.need) h += `<p class="sub">Прогноз зʼявиться, коли буде тиждень даних. Ще ${dayWord(F.need)}.</p>`;
  else h += `<div class="row" style="gap:18px;align-items:flex-end"><div><div class="big-num num">≈ ${F.proj}${STAR}</div><p class="sub" style="margin:0">реалістично від ${F.lo} до ${F.hi}${STAR}</p></div>
      <div class="sub" style="margin:0">Твій темп: <b>${F.m.toFixed(1)}${STAR}</b> на день за ${dayWord(F.span)}${F.trend !== null ? ` · останній тиждень ${F.trend >= 0 ? 'краще' : 'гірше'} на ${Math.abs(Math.round(F.trend * 100))}%` : ''}</div></div>
      <div class="chart-wrap" id="fc-wrap">${forecastChart(F)}<div class="tip" id="fc-tip" hidden></div></div>
      <p class="hint">Суцільна лінія — скільки ти заробив, пунктир — прогноз, якщо збережеш темп, смуга — реалістичний діапазон.${afford.length ? ` Цього вистачить на: ${afford.map(r => esc(r.name)).join(', ')}.` : ''}</p>`;
  h += `</section>`;

  // week summary
  h += `<section class="card stack" style="gap:10px"><h3>Цей тиждень</h3>
    <div class="week-dots">${wk.map(d => `<span class="${C.credited[d] ? 'ok' : state.repairs[d] ? 'fix' : ''}" title="${fmtShort(d)}">${DOW_S[parse(d).getDay()]}</span>`).join('')}</div>
    <div class="kpis"><span class="kpi">Зараховано днів <b>${wk.filter(d => C.credited[d]).length}/7</b></span><span class="kpi">Справ <b>${wkDone}</b></span><span class="kpi">Зароблено <b>${wkEarn}${STAR}</b></span><span class="kpi">Найдовша серія <b>${C.best}</b></span></div></section>`;

  // mode
  h += `<section class="card stack" style="gap:12px"><h3>Режим гри</h3><div class="grid2">
    ${modeCard('basic', state.mode === 'basic', 'set-mode')}${modeCard('hard', state.mode === 'hard', 'set-mode')}</div>
    <p class="hint">Режим можна змінити будь-коли. Зароблені зірки зберігаються.</p></section>`;

  // minimal plan
  h += `<section class="card stack" style="gap:10px"><h3>Мінімальний план</h3>
    <p class="sub" style="margin:0">Для днів, коли хворієш, маєш сесію чи повний завал. Денна мета — 1 справа замість 3, за день +1${STAR}, вогник не згасає. Повністю зникати не треба: одна маленька справа на день зберігає прогрес.</p>
    ${minimalNow ? `<div class="row"><span class="tag">Діє до ${fmtShort(minimalNow.to)}</span><button class="btn" data-a="minimal-off">Вимкнути</button></div>` : `<div class="row"><button class="btn" data-a="minimal-on" data-n="3">На 3 дні</button><button class="btn" data-a="minimal-on" data-n="7">На 7 днів</button></div>`}</section>`;

  // challenges
  h += `<section class="card stack" style="gap:12px"><h3>Челенджі</h3><p class="sub" style="margin:0">Звичка на кілька тижнів: кожен відмічений день дає зірки.</p>
    <form class="row" data-f="addch"><input type="text" id="ch-name" placeholder="Наприклад: без солодкого" aria-label="Назва челенджу" style="flex:1 1 200px">
      <label class="row" style="gap:6px"><span class="sub">днів</span><input type="number" id="ch-days" value="21" min="1" max="366"></label>
      <label class="row" style="gap:6px"><span class="sub">${STAR}/день</span><input type="number" id="ch-stars" value="1" min="1" max="${isHard() ? 10 : 3}"></label>
      <button class="btn primary" type="submit">Почати</button></form>
    <div class="grid">${state.challenges.map(c => {
      const end = addDays(c.start, c.days - 1), n = Object.keys(c.checks).length, armed = ui.armed[c.id];
      let cells = '';
      for (let i = 0; i < c.days; i++) { const d = addDays(c.start, i); cells += `<button class="day ${c.checks[d] ? 'on' : ''} ${d === T ? 'today' : ''}" data-a="chday" data-id="${c.id}" data-d="${d}" ${d > T ? 'disabled' : ''} title="${fmtShort(d)}">${parse(d).getDate()}</button>`; }
      return `<article class="card" style="box-shadow:none"><div class="row" style="align-items:flex-start"><div style="flex:1;min-width:0"><h3>${esc(c.name)}</h3><p class="sub">${fmtShort(c.start)} – ${fmtShort(end)} · ${n}/${c.days} днів · ${n * c.stars}${STAR}</p></div>
        <button class="btn ghost ${armed ? 'danger' : ''}" data-a="delch" data-id="${c.id}">${armed ? 'Точно?' : 'Видалити'}</button></div><div class="days">${cells}</div></article>`;
    }).join('') || '<p class="empty">Поки немає челенджів</p>'}</div></section>`;

  // spheres
  h += `<section class="card"><h3>Сфери</h3><p class="sub">Необовʼязкові мітки для справ — колір у календарі.</p>
    ${state.spheres.map(s => `<div class="srow"><input type="text" id="sname-${s.id}" value="${esc(s.name)}" data-c="rename" data-id="${s.id}" aria-label="Назва сфери">
      <div class="sw">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<button class="${s.c === i ? 'on' : ''}" style="background:var(--s${i})" data-a="color" data-id="${s.id}" data-c="${i}" aria-label="Колір ${i + 1}"></button>`).join('')}</div>
      <button class="btn ghost ${ui.armed[s.id] ? 'danger' : ''}" data-a="delsph" data-id="${s.id}">${ui.armed[s.id] ? 'Точно?' : 'Видалити'}</button></div>`).join('')}
    <form class="addf" data-f="addsph"><input type="text" id="new-sph" placeholder="Нова сфера, напр. Англійська" aria-label="Нова сфера"><button class="btn" type="submit">Додати</button></form></section>`;

  // newsletter + backup + advanced
  h += `<section class="card stack" style="gap:12px"><h3>Новини</h3>
    <label class="check-row"><input type="checkbox" id="newsletter" data-c="newsletter" ${state.newsletter ? 'checked' : ''}><span>Надсилати мені листи про оновлення «Зоряного шляху» (не частіше ніж раз на місяць)</span></label></section>
    <section class="card stack" style="gap:12px"><h3>Резервна копія</h3>
    ${ui.pendingImport ? `<div class="note">Замінити поточні дані копією з файлу? Там ${ui.pendingImport.tasks.length} справ і ${ui.pendingImport.rewards.length} винагород.<span class="row" style="margin-left:auto"><button class="btn primary" data-a="imp-yes">Замінити</button><button class="btn" data-a="imp-no">Скасувати</button></span></div>` : ''}
    <div class="row"><button class="btn" data-a="export">Завантажити копію</button><label class="btn" for="import-file">Відновити з файлу</label><input type="file" id="import-file" accept="application/json,.json" hidden>
    ${loc && loc.tasks.length ? '<button class="btn" data-a="import-local">Перенести прогрес з цього браузера</button>' : ''}</div>
    <details><summary>Вставити план текстом (формат Telegram)</summary><div class="stack" style="gap:8px;margin-top:10px">
      <textarea id="import-text" placeholder="1. Англ мова&#10;1 грам тема + дз сам + 10 слів&#10;&#10;2. Книги&#10;10 сторінок щодня"></textarea>
      <div class="row"><button class="btn primary" data-a="doimport">Додати в план цього тижня</button><span class="sub" id="import-msg"></span></div></div></details></section>
    <section class="card stack" style="gap:10px"><h3>Почати з нуля</h3><p class="sub" style="margin:0">Видалить усі справи, винагороди, челенджі та історію. Спершу завантаж копію.</p>
      <div class="row"><button class="btn ${ui.armed.reset ? 'danger' : ''}" data-a="reset">${ui.armed.reset ? 'Так, стерти все' : 'Очистити все'}</button></div></section>`;
  return h + '</div>';
}
function modeCard(m, on, action) {
  const d = m === 'basic'
    ? ['Базовий', 'Правила, що не дають обдурити себе.', ['Ціна справи: легко 1★ · середньо 2★ · важко 3★', 'Ціну винагороди не можна знизити 7 днів', 'До 2 бонусних справ на день', 'Пропустив день — вогник можна повернути раз на тиждень', '7 днів без активності — згорає половина зірок']]
    : ['Важкий', 'Жодних обмежень — тільки ти і твоя дисципліна.', ['Будь-яка ціна справи (1–10★) і винагороди', 'Бонусні справи без ліміту', 'Пропущений день — серія обнуляється, без повернень', '7 днів без активності — згорають усі зірки']];
  return `<button class="mode-card ${on ? 'on' : ''}" data-a="${action}" data-m="${m}" type="button"><h3>${d[0]}${on ? ' · обрано' : ''}</h3><span class="sub" style="margin:0">${d[1]}</span><ul>${d[2].map(x => `<li>${x}</li>`).join('')}</ul></button>`;
}

const VIEWS = { today: viewToday, calendar: viewCalendar, rewards: viewRewards, profile: viewProfile };
function render(focusId) {
  if (!loaded) return;
  C = calc();
  renderHeader();
  const sc = document.getElementById('cal-scroll'), sx = sc ? sc.scrollLeft : null;
  document.getElementById('view').innerHTML = (VIEWS[ui.tab] || viewToday)();
  const sc2 = document.getElementById('cal-scroll');
  if (sc2) {
    if (sx !== null) sc2.scrollLeft = sx;
    else if (ui.week === weekOf(today())) { const col = sc2.querySelector('.cal-col.today'); if (col) sc2.scrollLeft = Math.max(0, col.offsetLeft - 60); }
  }
  if (focusId) { const el = document.getElementById(focusId); if (el) el.focus(); }
}

/* ================= sheets (modals) ================= */
function openSheet(html, focusSel) {
  const s = document.getElementById('sheet');
  s.querySelector('.sheet-card').innerHTML = `<button class="icon-btn x" data-sheet-close aria-label="Закрити">×</button>` + html;
  s.hidden = false;
  const f = focusSel && s.querySelector(focusSel);
  (f || s.querySelector('.sheet-card button, .sheet-card input')).focus();
}
function closeSheet() { document.getElementById('sheet').hidden = true; }
function timeOptions(sel) {
  let o = `<option value="">Без часу</option>`;
  for (let m = CAL_START * 60; m < CAL_END * 60; m += 30) o += `<option value="${fmtHM(m)}" ${fmtHM(m) === sel ? 'selected' : ''}>${fmtHM(m)}</option>`;
  return o;
}
const durOptions = sel => [30, 60, 90, 120, 180, 240].map(m => `<option value="${m}" ${m === (sel || 60) ? 'selected' : ''}>${m < 60 ? m + ' хв' : (m / 60) + ' год'}</option>`).join('');
function dayOptions(week, sel) {
  return `<option value="">Без дня</option>` + [...Array(7)].map((_, i) => { const d = addDays(week, i), dd = parse(d); return `<option value="${d}" ${d === sel ? 'selected' : ''}>${DOW_S[dd.getDay()]}, ${fmtShort(d)}</option>`; }).join('');
}
const sphereOptions = sel => `<option value="">Без сфери</option>` + state.spheres.map(s => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
function openTaskSheet(id) {
  const t = state.tasks.find(x => x.id === id); if (!t) return;
  const lockPrice = !isHard() && t.done;
  const priceField = isHard() ? `<label class="field"><span class="label">Зірки</span><input type="number" id="te-stars" value="${t.stars}" min="1" max="10"></label>`
    : `<label class="field"><span class="label">Складність</span><select id="te-stars" ${lockPrice ? 'disabled' : ''}>${Object.entries(DIFF).map(([k, d]) => `<option value="${k}" ${k === t.diff ? 'selected' : ''}>${d.name} · ${d.stars}${STAR}</option>`).join('')}</select></label>`;
  openSheet(`<form class="stack" style="gap:14px" data-f="task-edit" data-id="${t.id}">
    <label class="field"><span class="label">Справа</span><input type="text" id="te-text" value="${esc(t.text)}"></label>
    <label class="check-row"><input type="checkbox" id="te-done" ${t.done ? 'checked' : ''}><span>Виконано</span></label>
    <div class="fields"><label class="field"><span class="label">День</span><select id="te-day">${dayOptions(t.week, t.day)}</select></label>
      <label class="field"><span class="label">Час</span><select id="te-time">${timeOptions(t.time)}</select></label>
      <label class="field"><span class="label">Тривалість</span><select id="te-dur">${durOptions(t.dur)}</select></label></div>
    <div class="fields">${priceField}<label class="field"><span class="label">Сфера</span><select id="te-sphere">${sphereOptions(t.sphere)}</select></label></div>
    ${lockPrice ? '<p class="hint" style="margin:0">У базовому режимі ціну виконаної справи змінити не можна.</p>' : ''}
    <div class="row"><button class="btn primary" type="submit">Зберегти</button><button class="btn ghost danger" type="button" data-a="sheet-del" data-id="${t.id}">Видалити справу</button></div></form>`, '#te-text');
}
function openQuickAdd(day, mins) {
  openSheet(`<form class="stack" style="gap:14px" data-f="quick" data-day="${day}">
    <div><h3>Нова справа</h3><p class="sub">${DOW[parse(day).getDay()]}, ${fmtShort(day)}</p></div>
    <label class="field"><span class="label">Справа</span><input type="text" id="qa-text" placeholder="Що зробити"></label>
    <div class="fields"><label class="field"><span class="label">Час</span><select id="qa-time">${timeOptions(mins !== null ? fmtHM(mins) : '')}</select></label>
      <label class="field"><span class="label">Тривалість</span><select id="qa-dur">${durOptions(60)}</select></label>
      <label class="field"><span class="label">${isHard() ? 'Зірки' : 'Складність'}</span>${starsField('qa-stars')}</label></div>
    <button class="btn primary" type="submit">Додати в календар</button></form>`, '#qa-text');
}
function openPurchase(p) {
  const prev = state.purchases.filter(x => x.id !== p.id && x.date <= p.date).map(x => x.date).sort().pop() || state.joinedAt;
  const n = state.tasks.filter(t => t.done && t.doneAt >= prev && t.doneAt <= p.date).length;
  const d = Math.max(1, daysBetween(prev, p.date) + 1);
  p.stat = `${n} ${plural(n, 'справа', 'справи', 'справ')} за ${dayWord(d)}`;
  openSheet(`<div class="won"><svg class="big-star" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}"/></svg>
    <span class="label">Ти заробив</span><h2>${esc(p.name)}</h2><p class="sub">${p.cost}${STAR} · ${p.stat}</p>
    <p class="sub">Насолоджуйся без почуття провини — ти це заслужив.</p>
    <div class="row" style="justify-content:center"><button class="btn star" data-a="share" data-id="${p.id}">Поділитися</button><button class="btn" data-sheet-close>Готово</button></div></div>`);
}
function openPenalty(p) {
  openSheet(`<div class="stack" style="gap:12px"><h3>Тебе не було ${dayWord(p.days)}</h3>
    <p class="sub" style="margin:0">За правилами ${p.mode === 'hard' ? 'важкого' : 'базового'} режиму згоріло <b>${p.stars}${STAR}</b>${p.mode === 'hard' ? ' — усі зірки' : ' — половина зірок'}. Вогник погас.</p>
    <p class="sub" style="margin:0">Якщо зараз важко, увімкни мінімальний план: одна маленька справа на день — і такого більше не станеться.</p>
    <div class="row"><button class="btn primary" data-a="minimal-on" data-n="7">Мінімальний план на 7 днів</button><button class="btn" data-sheet-close>Почати знову</button></div></div>`);
}
function openMinimal() {
  openSheet(`<div class="stack" style="gap:12px"><h3>Мінімальний план</h3>
    <p class="sub" style="margin:0">Для хвороби, сесії чи повного завалу. Денна мета — 1 справа замість 3 (за день +1${STAR}), вогник не згасає, нічого не згорає.</p>
    <div class="row"><button class="btn primary" data-a="minimal-on" data-n="3">На 3 дні</button><button class="btn" data-a="minimal-on" data-n="7">На 7 днів</button></div></div>`);
}

/* ================= share card ================= */
async function shareCard(p) {
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920;
  const g = cv.getContext('2d');
  try { await document.fonts.ready; } catch (e) {}
  const grd = g.createLinearGradient(0, 0, 0, 1920); grd.addColorStop(0, '#151A2D'); grd.addColorStop(1, '#2E3ECF');
  g.fillStyle = grd; g.fillRect(0, 0, 1080, 1920);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc((i * 397) % 1080, (i * 613) % 1920, (i % 3) + 2, 0, 7); g.fill(); }
  g.save(); g.translate(540, 640); g.scale(14, 14); g.translate(-12, -12); g.fillStyle = '#FFC23D'; g.fill(new Path2D(STAR_PATH)); g.restore();
  g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 44px Manrope, sans-serif'; g.fillText('Я ЗАРОБИВ', 540, 960);
  g.fillStyle = '#fff'; g.font = '700 92px Unbounded, Manrope, sans-serif';
  const words = p.name.split(' '); let line = '', yy = 1090; const lines = [];
  for (const w of words) { const test = line ? line + ' ' + w : w; if (g.measureText(test).width > 900 && line) { lines.push(line); line = w; } else line = test; }
  lines.push(line); lines.slice(0, 3).forEach(l => { g.fillText(l, 540, yy); yy += 110; });
  g.fillStyle = '#FFC23D'; g.font = '700 56px "JetBrains Mono", monospace'; g.fillText(`${p.cost} ★ · ${p.stat || ''}`, 540, yy + 30);
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '600 40px Manrope, sans-serif'; g.fillText('Зоряний шлях — гра у власне життя', 540, 1780);
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const file = new File([blob], 'zoryanyi-shlyakh.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: `Я заробив: ${p.name}` }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'zoryanyi-shlyakh.png';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  toast('Картинку збережено — додай її в сторіс');
}
