/* Fuel — stage 1: Today, gym log, Body (weigh-ins, calorie advice, InBody), backup.
   Everything is stored only on this phone (localStorage). */
(() => {
'use strict';
const KEY = 'fuel.v1';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// ---------- dates (local time, ISO yyyy-mm-dd) ----------
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => iso(window.__now ? new Date(window.__now) : new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const weekday = s => parse(s).getDay();
const mondayOf = s => addDays(s, -((weekday(s) + 6) % 7));
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = s => { const d = parse(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const shortDate = s => { const d = parse(s); return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };

// ---------- state ----------
const blank = () => ({v: 1, start: null, kcal: PLAN.kcal, kcalChanges: [], weights: {}, eaten: {}, juice: {}, supp: {}, logs: {}, done: {}, scans: [], tab: 'today'});
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1) return Object.assign(blank(), s); } catch (e) { /* private mode or blocked storage */ }
  return blank();
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
  catch (e) { toast('Could not save on this phone (storage blocked).'); return false; }
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => (t.style.display = 'none'), 2600); }

// ---------- derived ----------
const dayNo = d => S.start ? daysBetween(S.start, d) + 1 : 0;
const weekNo = d => S.start ? Math.floor((dayNo(d) - 1) / 7) + 1 : 0;
const inBreak = d => PLAN.dietBreaks.some(([a, b]) => d >= a && d <= b);
const targetKcal = d => inBreak(d) ? PLAN.dietBreakKcal : S.kcal;
const r0 = n => Math.round(n);
const r1 = n => Math.round(n * 10) / 10;
function weekEntries(monday) {
  const out = [];
  for (let i = 0; i < 7; i++) { const d = addDays(monday, i); if (S.weights[d] != null) out.push(S.weights[d]); }
  return out;
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
function juicesThisWeek(d) { const m = mondayOf(d); let n = 0; for (let i = 0; i < 7; i++) if (S.juice[addDays(m, i)]) n++; return n; }
function topOf(reps) { const m = String(reps).match(/(\d+)\s*$/); return m ? Number(m[1]) : null; }
function lastLog(exName, before) {
  const L = S.logs[exName] || {};
  const dates = Object.keys(L).filter(d => d < before).sort();
  return dates.length ? Object.assign({date: dates[dates.length - 1]}, L[dates[dates.length - 1]]) : null;
}

// ---------- calorie advice (the 2-week rule from the plan) ----------
function advice(d) {
  if (!S.start) return {state: 'wait', text: 'Press Start on the Today tab first. From then on, weigh in most mornings.'};
  if (inBreak(d)) return {state: 'break', text: `Maintenance week (${PLAN.dietBreaks.map(([a, b]) => shortDate(a) + ' – ' + shortDate(b)).join(', ')}): eat about ${PLAN.dietBreakKcal} kcal. No judgement on the scale this week.`};
  if (weekNo(d) <= 2) return {state: 'wait', text: 'Weeks 1–2: the first kilos are water and stored carbs, not fat. Weigh in most mornings and change nothing yet.'};
  const thisMon = mondayOf(d), oldMon = addDays(thisMon, -14);
  const now = weekEntries(thisMon), old = weekEntries(oldMon);
  if (now.length < 3 || old.length < 3) return {state: 'wait', text: `Need at least 3 weigh-ins this week (have ${now.length}) and in the week two weeks ago (have ${old.length}) to judge the trend.`};
  if (PLAN.dietBreaks.some(([a, b]) => (oldMon <= b && addDays(oldMon, 6) >= a))) return {state: 'wait', text: 'The comparison week was a maintenance week. Judge again next week.'};
  const rate = (avg(old) - avg(now)) / 2;
  const last = S.kcalChanges[S.kcalChanges.length - 1];
  const tooSoon = last && daysBetween(last.date, d) < 14;
  const base = `Average ${r1(avg(now))} kg this week vs ${r1(avg(old))} kg two weeks ago: ${rate >= 0 ? 'losing' : 'gaining'} ${r1(Math.abs(rate))} kg a week.`;
  if (rate < 0.5) return {state: tooSoon ? 'wait' : 'down', rate, text: base + (tooSoon ? ` Slower than 0.5 kg a week, but you changed calories on ${shortDate(last.date)}: give it until ${shortDate(addDays(last.date, 14))}.` : ' Slower than 0.5 kg a week: eat 100 kcal less (rice 120 → 80 g cooked) OR add 20 min of incline walking. One change only.')};
  if (rate > 1.1) return {state: tooSoon ? 'wait' : 'up', rate, text: base + (tooSoon ? ` Faster than 1.1 kg a week; you changed calories on ${shortDate(last.date)}, so wait until ${shortDate(addDays(last.date, 14))}.` : ' Faster than 1.1 kg a week: eat 100 kcal more so you keep your muscle.')};
  return {state: 'ok', rate, text: base + ' Right on track (0.5–1.1 kg a week). Change nothing.'};
}

// ---------- views ----------
const header = () => `<div class="top"><div class="eyebrow">Fuel · ${S.start ? `Day ${dayNo(todayISO())} · Week ${weekNo(todayISO())}` : 'Not started'}</div></div>`;

function exerciseRow(ex, d) {
  const key = ex.n, cur = (S.logs[key] || {})[d] || {}, last = lastLog(key, d);
  const top = topOf(ex.reps);
  let hint = '';
  if (last && top && Array.isArray(last.reps) && last.reps.length >= ex.sets && last.reps.slice(0, ex.sets).every(r => Number(r) >= top)) hint = '<span class="pill ok">↑ add a little weight today</span>';
  const lastTxt = last ? `Last ${shortDate(last.date)}: ${last.kg ? esc(last.kg) + ' kg · ' : ''}${(last.reps || []).filter(x => x !== '').join(' / ') || '—'}` : 'First time: find a weight that leaves 2 reps in the tank.';
  const showKg = !ex.unit;
  let sets = '';
  for (let i = 0; i < ex.sets; i++) sets += `<input type="number" inputmode="numeric" aria-label="Set ${i + 1}" placeholder="${ex.reps === 'max' ? 'reps' : esc(String(ex.reps).split('–').pop())}" data-log="${esc(key)}" data-set="${i}" value="${esc((cur.reps || [])[i] ?? '')}">`;
  return `<div class="ex"><div class="head"><h3>${esc(ex.n)}</h3><span class="kc">${ex.sets} × ${esc(ex.reps)}${ex.unit === 's' ? ' s' : ''}</span></div>
    <div class="small muted">${lastTxt} · rest ${ex.rest >= 120 ? '2 min' : ex.rest + ' s'} ${hint}</div>
    <div class="sets">${showKg ? `<input class="kg" type="text" inputmode="decimal" autocomplete="off" step="0.5" aria-label="Weight in kg" placeholder="kg" data-log="${esc(key)}" data-kg="1" value="${esc(cur.kg ?? '')}">` : ''}${sets}</div></div>`;
}

function dayCard(d) {
  const w = WEEK[weekday(d)];
  if (w.type === 'gym') {
    const s = SESSIONS[w.session], done = S.done[d];
    return `<div class="card"><div class="label">Gym day · ${esc(s.name)}</div><h2>${esc(s.name)}</h2>
      <p class="small muted">${esc(w.when)} · ${esc(s.focus)} · about 60 min + ${s.cardio} min incline walk</p>
      <details><summary>How to train (tap)</summary><ul class="plain small">${GYM_RULES.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>
      ${s.ex.map(ex => exerciseRow(ex, d)).join('')}
      <div class="ex"><div class="head"><h3>Incline walk</h3><span class="kc">${s.cardio} min</span></div><div class="small muted">10–12 % incline, 5–5.5 km/h, a pace you could talk at.</div></div>
      <button class="btn ${done ? 'ghost' : ''}" data-act="sessionDone" style="width:100%;margin-top:6px">${done ? '✓ Session done (tap to undo)' : 'Mark session done'}</button></div>`;
  }
  const extra = w.type === 'work' ? `<div class="label" style="margin-top:10px">Posture drills · 10 min</div><ul class="plain small">${POSTURE.map(p => `<li>${esc(p)}</li>`).join('')}</ul><p class="note" style="margin-top:10px">Take your work box and snack box in the insulated bag with 2 frozen ice packs. There is no fridge at work.</p>` : '';
  return `<div class="card"><div class="label">${w.type === 'work' ? 'Work day' : 'Rest day'}</div><h2>${esc(w.label)}</h2><p class="small">${esc(w.note)}</p><p class="small muted">Steps: 8,000–10,000 today.</p>${extra}</div>`;
}

function foodCard(d) {
  const eaten = S.eaten[d] || {}, tgt = targetKcal(d);
  let kcal = 0, p = 0;
  MEALS.forEach(m => { if (eaten[m.id]) { kcal += m.kcal; p += m.p; } });
  if (S.juice[d]) kcal += JUICE.kcal;
  const pct = Math.min(100, kcal / tgt * 100);
  return `<div class="card"><div class="row"><h2 class="grow" style="margin:0">Today’s food</h2><span class="counter">${r0(kcal)} / ${tgt} kcal · ${r0(p)} / ${PLAN.protein} g P</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${inBreak(d) ? `<p class="note small">Maintenance week: same meals with bigger rice and potato portions, about ${PLAN.dietBreakKcal} kcal.</p>` : ''}
    ${MEALS.map(m => `<div class="tick ${eaten[m.id] ? 'on' : ''}" role="checkbox" tabindex="0" aria-checked="${!!eaten[m.id]}" data-act="eat" data-id="${m.id}"><span class="box">${eaten[m.id] ? '✓' : ''}</span><span class="grow"><span class="label" style="margin:0">${esc(m.label)}</span><div class="t">${esc(m.name)}</div></span><span class="kc">${m.kcal} kcal · ${m.p} g</span></div>`).join('')}
    <p class="small muted" style="margin-top:8px">Recipes with exact grams arrive in stage 2.</p></div>`;
}

function juiceCard(d) {
  if (WEEK[weekday(d)].type !== 'gym') return '';
  const used = juicesThisWeek(d), had = !!S.juice[d];
  const full = used >= JUICE.limit && !had;
  return `<div class="card"><div class="label">Before the gym</div><div class="row"><h2 class="grow" style="margin:0">${esc(JUICE.name)}</h2><span class="pill ${full ? 'warn' : ''}">${used} / ${JUICE.limit} this week</span></div>
    <p class="small">${esc(JUICE.how)}</p><p class="small muted">${esc(JUICE.note)}</p>
    ${full ? '<p class="note small">You already had 3 this week. Skip it today: more is not better.</p>' : `<button class="btn ${had ? 'ghost' : ''} sm" data-act="juice">${had ? '✓ Had it (tap to undo)' : 'I had it (+170 kcal)'}</button>`}</div>`;
}

function suppCard(d) {
  const items = SUPPLEMENTS.filter(s => s.day === weekday(d));
  if (!items.length) return '';
  return `<div class="card"><div class="label">Supplements</div>${items.map(s => { const on = (S.supp[d] || {})[s.id]; return `<div class="tick ${on ? 'on' : ''}" role="checkbox" tabindex="0" aria-checked="${!!on}" data-act="supp" data-id="${s.id}"><span class="box">${on ? '✓' : ''}</span><span class="grow"><div class="t">${esc(s.name)}</div><div class="small muted">${esc(s.when)} · ${esc(s.note)}</div></span></div>`; }).join('')}</div>`;
}

function weighCard(d) {
  const v = S.weights[d];
  return `<div class="card"><div class="label">Morning weigh-in</div>
    <div class="row"><input class="grow" type="text" inputmode="decimal" autocomplete="off" step="0.1" id="wtoday" aria-label="Weight in kg" placeholder="kg" value="${v ?? ''}" style="max-width:140px"><button class="btn sm" data-act="weighToday">${v != null ? 'Update' : 'Save'}</button>${v != null ? `<span class="pill ok">✓ ${v} kg saved</span>` : ''}</div>
    <p class="small muted" style="margin-top:6px">After the toilet, before eating or drinking, same spot. The weekly average is what counts.</p></div>`;
}

function vToday() {
  const d = todayISO();
  let h = header() + `<h1>${longDate(d)}</h1>`;
  if (!S.start) h += `<div class="card hi"><h2>Press Start on the day you begin</h2><p class="small">Nothing is counting yet. When you press Start, that day is <b>day 1</b>: the week count and the calorie advice count from it.</p><button class="btn" data-act="start">Press Start — this is day 1</button></div>`;
  if (inBreak(d)) h += `<div class="card hi"><div class="label">Maintenance week</div><p>Eat about ${PLAN.dietBreakKcal} kcal this week: same food, bigger carb portions. Training stays the same. It is planned, not a cheat.</p></div>`;
  h += dayCard(d) + juiceCard(d) + weighCard(d) + foodCard(d) + suppCard(d);
  h += `<div class="card"><h2>Kitchen</h2><ul class="plain">${(KITCHEN[weekday(d)] || []).map(k => `<li>${esc(k)}</li>`).join('')}</ul></div>`;
  return h;
}

function vEat() {
  return header() + `<h1>Eat</h1>
  <div class="card hi"><div class="label">Coming in stage 2</div><h2>Your 8-week recipe rotation</h2><p class="small">International, German/European and Asian dishes, cooked in two batches a week (Sunday afternoon and Thursday) with your air fryer and hob. Exact grams, steps, fridge/freezer rules, cold-friendly work boxes, rotating breakfasts and snacks.</p></div>
  <div class="card"><h2>The targets</h2><p><b>${PLAN.kcal} kcal · ${PLAN.protein} g protein a day</b>: about ${r0((1 - PLAN.kcal / PLAN.maintenance) * 100)} % below your estimated maintenance of ~${PLAN.maintenance} kcal. Expect about 0.75 kg a week.</p>
  <p class="small muted">Maintenance week: ${PLAN.dietBreaks.map(([a, b]) => shortDate(a) + ' – ' + shortDate(b)).join(', ')} (~${PLAN.dietBreakKcal} kcal). Goal: ${esc(PLAN.goal)}.</p></div>
  <div class="card"><div class="label">Rules that always apply</div><ul class="plain small"><li>Protein first at every meal.</li><li>No juice, soda or sugary drinks (the pre-gym beetroot juice is the planned exception).</li><li>Kitchen closes after the night quark.</li><li>Still hungry? Vegetables and water, never more rice.</li></ul></div>`;
}

function vShop() {
  return header() + `<h1>Shop</h1>
  <div class="card hi"><div class="label">Coming in stage 3</div><h2>Weekly list with real prices</h2><p class="small">Kaufland · Aldi Nord · Lidl · Rewe / Netto / Penny, your nearest branches, the weekly cost against your €170–200 budget, and what is left from last week. Main shop on Saturday, small top-up on Thursday.</p></div>
  <div class="card"><div class="label">Buy once, before the first work day</div>
  <ul class="plain small"><li><b>Insulated lunch bag + 2 ice packs</b> (~€8–12, Kaufland or Rossmann). There is no fridge at work: without cooling, cooked chicken and rice are not safe after a few hours.</li><li><b>Glass meal-prep boxes</b>: IKEA 365+ 1.0 l, 3-pack, €12.99.</li><li><b>Beetroot direct juice</b> (Rote Bete Direktsaft, 1 l) for the gym days.</li></ul></div>`;
}

function chart() {
  const days = Object.keys(S.weights).sort();
  if (days.length < 2) return '<p class="small muted">The chart appears after 2 weigh-ins.</p>';
  const last = days.slice(-42), vals = last.map(d => S.weights[d]);
  const min = Math.min(...vals) - 0.5, max = Math.max(...vals) + 0.5, W = 320, H = 120, P = 26;
  // x follows the calendar (a 5-day gap looks like 5 days), y the weight
  const span = Math.max(1, daysBetween(last[0], last[last.length - 1]));
  const x = i => P + daysBetween(last[0], last[i]) * (W - P - 8) / span, y = v => 8 + (max - v) * (H - 24) / (max - min);
  const dots = last.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(S.weights[d]).toFixed(1)}" r="2.6" fill="var(--muted)"/>`).join('');
  // 7-day rolling average line
  const roll = last.map((d, i) => { const win = last.filter(e => e <= d && e > addDays(d, -7)).map(e => S.weights[e]); return [x(i), y(avg(win))]; });
  const path = roll.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
  return `<svg class="svgchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
    <text x="2" y="12" fill="var(--muted)" font-size="10" font-family="ui-monospace,monospace">${r1(max - 0.5)}</text>
    <text x="2" y="${H - 14}" fill="var(--muted)" font-size="10" font-family="ui-monospace,monospace">${r1(min + 0.5)}</text>
    ${dots}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linejoin="round"/></svg>
    <p class="small muted">Dots: single mornings. Orange line: 7-day average, the number that matters.</p>`;
}

function vBody() {
  const d = todayISO(), mon = mondayOf(d);
  const now = weekEntries(mon), prev = weekEntries(addDays(mon, -7));
  const a = advice(d);
  const btn = a.state === 'down' ? `<button class="btn sm" data-act="kcal" data-delta="-100">Apply −100 kcal (→ ${S.kcal - 100})</button>` : a.state === 'up' ? `<button class="btn sm" data-act="kcal" data-delta="100">Apply +100 kcal (→ ${S.kcal + 100})</button>` : '';
  const entries = Object.keys(S.weights).sort().reverse().slice(0, 14);
  const next = INBODY.dates.find(x => x >= d);
  let h = header() + `<h1>Body</h1>
  <div class="card"><div class="label">Weigh-in · mornings, after the toilet</div>
    <div class="row"><input type="date" id="wdate" value="${d}" max="${d}" style="max-width:170px" aria-label="Date"><input type="text" inputmode="decimal" autocomplete="off" step="0.1" id="wkg" placeholder="kg" style="max-width:110px" aria-label="Weight in kg" value="${S.weights[d] ?? ''}"><button class="btn sm" data-act="weigh">Save</button></div>
    <div class="grid2" style="margin-top:12px"><div class="stat"><div class="label">This week</div><div class="big">${now.length ? r1(avg(now)) : '—'}</div><div class="small muted">${now.length} weigh-in${now.length === 1 ? '' : 's'}</div></div>
    <div class="stat"><div class="label">Last week</div><div class="big">${prev.length ? r1(avg(prev)) : '—'}</div><div class="small muted">${now.length && prev.length ? (avg(now) <= avg(prev) ? '−' : '+') + r1(Math.abs(avg(now) - avg(prev))) + ' kg' : prev.length + ' weigh-ins'}</div></div></div>
    <div style="margin-top:12px">${chart()}</div></div>
  <div class="card"><div class="label">Calories</div><div class="row"><span class="big">${targetKcal(d)}</span><span class="muted">kcal a day now · ${PLAN.protein} g protein</span></div>
    <p class="note small" style="margin-top:10px">${esc(a.text)}</p>${btn}
    ${S.kcalChanges.length ? `<p class="small muted" style="margin-top:8px">Changes: ${S.kcalChanges.map(c => `${shortDate(c.date)} ${c.delta > 0 ? '+' : ''}${c.delta} → ${c.to}`).join(' · ')} <button class="btn ghost sm" data-act="undoKcal">Undo last</button></p>` : ''}</div>
  ${entries.length ? `<div class="card"><details><summary>All weigh-ins (${Object.keys(S.weights).length})</summary><table><tr><th>Date</th><th class="num">kg</th><th></th></tr>${entries.map(e => `<tr><td>${shortDate(e)}</td><td class="num">${S.weights[e]}</td><td class="num"><button class="btn ghost sm" data-act="delW" data-d="${e}" aria-label="Delete ${shortDate(e)}">✕</button></td></tr>`).join('')}</table></details></div>` : ''}
  <div class="card"><h2>InBody scans</h2>
    ${S.scans.length ? `<table><tr><th>Date</th><th class="num">kg</th><th class="num">Fat %</th><th class="num">Muscle kg</th></tr>${S.scans.slice().sort((x, y) => x.date < y.date ? 1 : -1).map(s => `<tr><td>${shortDate(s.date)}</td><td class="num">${esc(s.kg)}</td><td class="num">${esc(s.fat)}</td><td class="num">${esc(s.muscle)}</td></tr>`).join('')}</table>` : '<p class="small muted">No scans yet. Your first one is the baseline.</p>'}
    <details style="margin-top:8px"><summary>+ Add a scan</summary>
      <div class="grid2" style="margin-top:8px"><label class="small">Date<input type="date" id="sdate" value="${d}"></label><label class="small">Weight kg<input type="text" inputmode="decimal" id="skg"></label><label class="small">Body fat %<input type="text" inputmode="decimal" id="sfat"></label><label class="small">Muscle kg (SMM)<input type="text" inputmode="decimal" id="smus"></label><label class="small">Visceral level<input type="number" step="1" id="svis"></label></div>
      <button class="btn sm" data-act="addScan" style="margin-top:10px">Save scan</button></details>
    <div class="note small" style="margin-top:12px"><b>Next scan: ${next ? longDate(next) : 'plan the next one'}</b><br>${esc(INBODY.place)} · ${esc(INBODY.phone)} (book a week ahead)<br>${INBODY.rules.map(esc).join(' ')}</div>
    <p class="small muted" style="margin-top:8px">Planned: ${INBODY.dates.map(shortDate).join(' · ')}</p></div>
  <div class="card"><h2>Backup</h2><p class="small muted">Everything lives only on this phone. Export a file now and then (for example to Drive).</p>
    <div class="row"><button class="btn sm" data-act="export">Export</button><label class="btn ghost sm">Import<input type="file" accept="application/json" id="importf" hidden></label></div></div>`;
  return h;
}

const VIEWS = {today: vToday, eat: vEat, shop: vShop, body: vBody};
function render() {
  if (!VIEWS[S.tab]) S.tab = 'today';
  $('#app').innerHTML = VIEWS[S.tab]();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
}

// ---------- actions ----------
function setWeight(d, v) {
  const kg = parseFloat(String(v).replace(',', '.'));
  if (!(kg > 30 && kg < 250)) { toast('Enter your weight in kg, for example 84.6'); return false; }
  S.weights[d] = r1(kg); save(); return true;
}
const H = {
  start() { S.start = todayISO(); save(); toast('Day 1 starts today. Good luck!'); render(); },
  eat(el) { const d = todayISO(), id = el.dataset.id; S.eaten[d] = S.eaten[d] || {}; S.eaten[d][id] = !S.eaten[d][id]; save(); render(); },
  juice() { const d = todayISO(); if (S.juice[d]) delete S.juice[d]; else S.juice[d] = true; save(); render(); },
  supp(el) { const d = todayISO(); S.supp[d] = S.supp[d] || {}; S.supp[d][el.dataset.id] = !S.supp[d][el.dataset.id]; save(); render(); },
  sessionDone() { const d = todayISO(); if (S.done[d]) delete S.done[d]; else { S.done[d] = WEEK[weekday(d)].session; toast('Session saved. Well done.'); } save(); render(); },
  weighToday() { if (setWeight(todayISO(), $('#wtoday').value)) { toast('Saved'); render(); } },
  weigh() { const d = $('#wdate').value || todayISO(); if (d > todayISO()) return toast('That date is in the future'); if (setWeight(d, $('#wkg').value)) { toast(`Saved for ${shortDate(d)}`); render(); } },
  delW(el) { delete S.weights[el.dataset.d]; save(); render(); },
  kcal(el) { const delta = Number(el.dataset.delta), to = S.kcal + delta; if (to < 1600 || to > PLAN.maintenance) return toast('That would go outside the safe range'); S.kcal = to; S.kcalChanges.push({date: todayISO(), delta, to}); save(); toast(`New target: ${to} kcal`); render(); },
  undoKcal() { const c = S.kcalChanges.pop(); if (c) S.kcal -= c.delta; save(); render(); },
  addScan() {
    const n = id => { const v = parseFloat(String($(id).value).replace(',', '.')); return isNaN(v) ? null : v; };
    const s = {date: $('#sdate').value, kg: n('#skg'), fat: n('#sfat'), muscle: n('#smus'), visceral: n('#svis')};
    if (!s.date || s.kg == null) return toast('Enter at least the date and the weight');
    S.scans = S.scans.filter(x => x.date !== s.date).concat([s]); save(); toast('Scan saved'); render();
  },
  export() {
    const blob = new Blob([JSON.stringify(Object.assign({}, S, {exported: new Date().toISOString()}), null, 1)], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `fuel-backup-${todayISO()}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Backup file created');
  },
};
document.addEventListener('click', e => {
  const tab = e.target.closest('#tabs button');
  if (tab) { S.tab = tab.dataset.tab; save(); render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-act]');
  if (el && H[el.dataset.act]) H[el.dataset.act](el);
});
document.addEventListener('keydown', e => {
  const el = e.target.closest('[role=checkbox][data-act]');
  if (el && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); H[el.dataset.act](el); }
});
// gym log: save as you type (no button needed)
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.log) {
    const d = todayISO(), k = el.dataset.log;
    S.logs[k] = S.logs[k] || {}; const cur = S.logs[k][d] = S.logs[k][d] || {reps: []};
    if (el.dataset.kg) cur.kg = el.value === '' ? null : parseFloat(String(el.value).replace(',', '.'));
    else { cur.reps = cur.reps || []; cur.reps[Number(el.dataset.set)] = el.value === '' ? '' : Number(el.value); }
    save();
  }
  if (el.id === 'importf' && el.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || data.v !== 1 || typeof data.weights !== 'object') throw new Error('not a Fuel backup');
        S = Object.assign(blank(), data); delete S.exported; save(); toast('Backup restored'); render();
      } catch (err) { toast('That file is not a Fuel backup.'); }
    };
    r.readAsText(el.files[0]);
  }
});

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__fuel = {get S() { return S; }, set S(v) { S = v; }, render, advice, H, save, todayISO, mondayOf, addDays};
})();
