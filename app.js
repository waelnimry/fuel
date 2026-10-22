/* Fuel — Today, Eat (recipe rotation), gym log, Body (weigh-ins, calorie advice, InBody), backup.
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
const blank = () => ({v: 1, start: null, kcal: PLAN.kcal, kcalChanges: [], weights: {}, eaten: {}, juice: {}, supp: {}, logs: {}, done: {}, scans: [], tab: 'today', store: 'kaufland', basket: {}});
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

// ---------- food plan (foods.js + recipes.js) ----------
// Where each meal comes from. Sunday batch (cooked the Sunday BEFORE the week) and Thursday batch.
const ROLE = {
  breakfast: {label: 'Breakfast', makes: 1}, snack: {label: 'Snack', makes: 1},
  sunLunch: {label: 'Lunch', makes: 3, when: 'Mon, Tue and Thu lunch'},
  sunDinner: {label: 'Dinner', makes: 4, when: 'Sunday, Mon, Tue and Wed dinner'},
  thuDinner: {label: 'Dinner', makes: 3, when: 'Thu, Fri and Sat dinner'},
  thuLunch: {label: 'Lunch', makes: 2, when: 'Sat and Sun lunch'},
  wedBox: {label: 'Work box', makes: 1, when: 'Wednesday at work'},
  friBox: {label: 'Work box', makes: 1, when: 'Friday at work'},
};
const LUNCH = {1: 'sunLunch', 2: 'sunLunch', 3: 'wedBox', 4: 'sunLunch', 5: 'friBox', 6: 'thuLunch', 0: 'thuLunch'};
const DINNER = {1: 'sunDinner', 2: 'sunDinner', 3: 'sunDinner', 4: 'thuDinner', 5: 'thuDinner', 6: 'thuDinner', 0: 'sunDinner'};
const COOK_DAY = {sunLunch: 0, sunDinner: 0, thuDinner: 4, thuLunch: 4};
const EAT_DAYS = {sunLunch: [1, 2, 4], sunDinner: [0, 1, 2, 3], thuDinner: [4, 5, 6], thuLunch: [6, 0]};
const daysAfterCook = (role, wd) => (wd - COOK_DAY[role] + 7) % 7;
const fridgeDays = id => RECIPES[id].fridge ?? 2;
const nW = WEEKS.length, rot = i => ((i % nW) + nW) % nW;
const sumIngs = ings => ings.reduce((m, i) => { const F = FOODS[i.f]; m.kcal += F.k * i.g / 100; m.p += F.p * i.g / 100; m.c += F.c * i.g / 100; m.f += F.f * i.g / 100; return m; }, {kcal: 0, p: 0, c: 0, f: 0});
const MAC = {};
const macros = id => MAC[id] || (MAC[id] = sumIngs(RECIPES[id].ings));
function amt(f, g) {
  const F = FOODS[f];
  if (!F) return `${Math.round(g)} ${f === 'juice' ? 'ml' : 'g'}`;
  if (F.piece) { const n = g / F.piece; if (n >= 0.95 && Math.abs(n - Math.round(n)) < 0.05) { const k = Math.round(n); return `${k} ${F.unit}${k > 1 ? 's' : ''}`; } }
  return `${Math.round(g)} g`;
}
// {food} → batch amount in brackets, {=food*2} → plain number rounded to 5 (water in ml)
function fillStep(t, r) {
  const g = Object.fromEntries(r.ings.map(i => [i.f, i.g * r.makes]));
  return t.replace(/\{=(\w+)\*([\d.]+)\}/g, (m, f, k) => g[f] == null ? m : String(Math.round(g[f] * Number(k) / 5) * 5))
    .replace(/\{(\w+)\}/g, (m, f) => g[f] == null ? m : `(${amt(f, g[f])})`);
}
// Monday of food week 1: the week Start was pressed in (a Sunday start belongs to the week after).
// Before Start: the coming Monday, because the plan is "shop Saturday, cook Sunday, start Monday".
function planBase() {
  if (S.start) return weekday(S.start) === 0 ? addDays(S.start, 1) : mondayOf(S.start);
  const t = todayISO(); return weekday(t) === 1 ? t : addDays(mondayOf(t), 7);
}
const weekIdx = d => Math.floor(daysBetween(planBase(), mondayOf(d)) / 7);
function roleOf(id) {
  if (id === 'nightquark') return {role: 'night'};
  for (let w = 0; w < nW; w++) for (const k in WEEKS[w]) if (WEEKS[w][k] === id) return {week: w, role: k};
  return null;
}
// The 5 meals of weekday wd in food week wk (wk < 0 only on a start-Sunday: the plan begins with tonight's dinner).
function planFor(wk, wd) {
  const W = WEEKS[rot(Math.max(wk, 0))], dinW = wd === 0 ? WEEKS[rot(wk + 1)] : W;
  const out = [{slot: 'breakfast', label: 'Breakfast', id: W.breakfast}];
  if (wk >= 0) out.push({slot: 'lunch', label: ROLE[LUNCH[wd]].label, id: W[LUNCH[wd]], role: LUNCH[wd]});
  out.push({slot: 'snack', label: 'Snack', id: W.snack}, {slot: 'dinner', label: 'Dinner', id: dinW[DINNER[wd]], role: DINNER[wd], fresh: wd === 0}, {slot: 'night', label: 'Night', id: 'nightquark'});
  return out.map(m => Object.assign(m, {name: RECIPES[m.id].name}, macros(m.id)));
}
const EXTRAS = sumIngs(BREAK_EXTRAS);
function dayMeals(d) {
  const out = planFor(weekIdx(d), weekday(d));
  if (inBreak(d)) out.push(Object.assign({slot: 'extras', label: 'Maintenance extras', name: BREAK_EXTRAS.map(i => `${i.note || amt(i.f, i.g)} ${FOODS[i.f].n.toLowerCase()}`).join(' · ')}, EXTRAS));
  return out;
}
const total = ms => ms.reduce((a, m) => ({kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f}), {kcal: 0, p: 0, c: 0, f: 0});
const link = id => `<a class="lnk" href="#" data-act="recipe" data-id="${esc(id)}">${esc(RECIPES[id].name)}</a>`;
function freezerLine(W, roles) {
  const parts = roles.map(role => { const id = W[role], days = EAT_DAYS[role].filter(wd => daysAfterCook(role, wd) > fridgeDays(id)); return days.length ? `${esc(RECIPES[id].name)} for ${days.map(x => DAYS[x]).join(' and ')}` : ''; }).filter(Boolean);
  return parts.length ? `Straight into the freezer once cool: ${parts.join('; ')}. Everything else in the fridge.` : 'Everything goes in the fridge once cool.';
}
// Evening kitchen jobs for weekday wd of food week wk.
function kitchen(wk, wd) {
  const out = [], W = WEEKS[rot(Math.max(wk, 0))];
  const twd = (wd + 1) % 7, twk = wd === 0 ? wk + 1 : wk, TW = WEEKS[rot(Math.max(twk, 0))];
  if (wd === 0) {
    const N = WEEKS[rot(wk + 1)];
    out.push(`<b>Batch cook #1</b>, from about 15:00: ${link(N.sunDinner)} ×4 (tonight’s dinner, then Mon–Wed) and ${link(N.sunLunch)} ×3 (Mon, Tue and Thu lunch).`, freezerLine(N, ['sunDinner', 'sunLunch']));
    [N.breakfast, N.snack].forEach(id => { if (RECIPES[id].sundayPrep) out.push(esc(RECIPES[id].sundayPrep)); });
  }
  if (wd === 2 && wk >= 0) out.push(`Make Wednesday’s work box: ${link(W.wedBox)}. Fridge overnight.`);
  if (wd === 4 && wk >= 0) out.push(`<b>Batch cook #2</b>, after the gym: ${link(W.thuDinner)} ×3 (tonight’s dinner, then Fri and Sat) and ${link(W.thuLunch)} ×2 (Sat and Sun lunch).`, freezerLine(W, ['thuDinner', 'thuLunch']), `Make Friday’s work box: ${link(W.friBox)}. Fridge overnight.`);
  // frozen raw fish/meat for tomorrow's batch
  const nextBatch = twd === 0 ? [WEEKS[rot(twk + 1)], ['sunDinner', 'sunLunch']] : twd === 4 && twk >= 0 ? [TW, ['thuDinner', 'thuLunch']] : null;
  if (nextBatch) nextBatch[1].forEach(role => { const id = nextBatch[0][role], r = RECIPES[id]; (r.thaw || []).forEach(f => { const i = r.ings.find(x => x.f === f); out.push(`Move the frozen ${esc(FOODS[f].n.toLowerCase().replace(/ \(.*\)$/, ''))} (${amt(f, i.g * r.makes)}) to the fridge: it thaws overnight for tomorrow’s ${link(id)}.`); }); });
  // cooked portions that are in the freezer
  if (twk >= 0) for (const [slot, role] of [['lunch', LUNCH[twd]], ['dinner', DINNER[twd]]]) {
    if (!COOK_DAY.hasOwnProperty(role) || (twd === 0 && slot === 'dinner')) continue;
    const id = TW[role];
    if (daysAfterCook(role, twd) > fridgeDays(id)) out.push(`Move tomorrow’s ${slot} (${link(id)}) from the freezer to the fridge.`);
  }
  if (twk >= 0 && RECIPES[TW.breakfast].prep === 'night') out.push(`Make tomorrow’s breakfast: ${link(TW.breakfast)} (5 min, fridge overnight).`);
  (KITCHEN[wd] || []).forEach(k => out.push(esc(k)));
  return out;
}
function kitchenOn(d) {
  const wd = weekday(d);
  if (!S.start && wd !== 6 && wd !== 0) return ['Best start: shop on Saturday, batch cook on Sunday, press Start on Monday morning. Week 1 is in the Eat tab.'];
  return kitchen(weekIdx(d), wd);
}
function storageText(id) {
  const r = RECIPES[id], ro = roleOf(id);
  if (ro && (ro.role === 'wedBox' || ro.role === 'friBox')) return 'Made the night before, fridge overnight. In the morning it goes in the insulated bag with 2 frozen ice packs. Eat it on your break; anything you bring home goes in the bin.';
  if (ro && COOK_DAY.hasOwnProperty(ro.role)) {
    const lim = fridgeDays(id), days = EAT_DAYS[ro.role];
    const cook = DAYS[COOK_DAY[ro.role]], fresh = days.filter(wd => daysAfterCook(ro.role, wd) === 0);
    const fr = days.filter(wd => { const a = daysAfterCook(ro.role, wd); return a > 0 && a <= lim; }), fz = days.filter(wd => daysAfterCook(ro.role, wd) > lim);
    return `Cooked on ${cook}. ${fresh.length ? 'One portion tonight. ' : ''}${fr.length ? `Fridge: ${fr.map(x => DAYS[x]).join(', ')}. ` : ''}${fz.length ? `Freezer: ${fz.map(x => DAYS[x]).join(', ')} (moved to the fridge the night before; the app reminds you). ` : ''}${lim === 1 ? 'Cooked rice is only safe 1 day in the fridge, so later portions are frozen.' : 'Cooked food keeps 2 days in the fridge; later portions are frozen.'}`;
  }
  if (r.prep === 'night') return 'Made the night before in a closed jar, fridge overnight.';
  return '';
}
const promptFor = r => `Realistic food photo for a recipe app: ${r.look}. Home-cooked, a natural portion for one person, on a dark wooden table, warm soft side light, shot from about 45 degrees, shallow depth of field, landscape 4:3. No text, no labels, no logos, no hands, no people.`;

// ---------- shop (shop.js): what to buy on each trip ----------
// Saturday main shop pays for Sun–Sat of long-life food and Sun–Wed of short-life food (fresh meat, bananas, salad).
// The Thursday top-up buys the short-life food for Thu–Sat. Leftovers carry over while they are still good.
const JUICE_DAYS = [1, 2, 4], JUICE_ML = 450;
const isShort = f => SHOP_INFO[f].life < 7;
const foodName = f => (FOODS[f] || SHOP_INFO[f]).n;
const firstDay = () => S.start || planBase();
function useOn(d) {
  const out = [], wd = weekday(d), wk = weekIdx(d), first = firstDay();
  const add = (id, mult) => RECIPES[id].ings.forEach(i => out.push({f: i.f, g: i.g * mult, id}));
  if (d >= first) {
    const W = WEEKS[rot(Math.max(wk, 0))];
    add(W.breakfast, 1); add(W.snack, 1); add('nightquark', 1);
    if (JUICE_DAYS.includes(wd)) out.push({f: 'juice', g: JUICE_ML, id: 'juice'});
    if (inBreak(d)) BREAK_EXTRAS.forEach(i => out.push({f: i.f, g: i.g, id: 'extras'}));
  }
  if (addDays(d, 1) >= first) {
    if (wd === 0) { const N = WEEKS[rot(wk + 1)]; add(N.sunDinner, RECIPES[N.sunDinner].makes); add(N.sunLunch, RECIPES[N.sunLunch].makes); }
    if (wk >= 0 && wd === 2) add(WEEKS[rot(wk)].wedBox, 1);
    if (wk >= 0 && wd === 4) { const W = WEEKS[rot(wk)]; add(W.thuDinner, RECIPES[W.thuDinner].makes); add(W.thuLunch, RECIPES[W.thuLunch].makes); add(W.friBox, 1); }
  }
  return out;
}
function trips(n) { const P = planBase(), out = []; for (let w = 0; w < n; w++) { const M = addDays(P, 7 * w); out.push({date: addDays(M, -2), kind: 'main', wk: w}, {date: addDays(M, 3), kind: 'top', wk: w}); } return out; }
// day i after the trip: does this trip pay for food f used that day?
const inWindow = (t, f, i) => t.kind === 'main' ? i >= 1 && i <= (isShort(f) ? 4 : 7) : isShort(f) && i <= 2;
function offerFor(f, store) {
  const O = OFFERS[f];
  if (O[store]) return Object.assign({store}, O[store]);
  const alt = Object.keys(O).filter(s => s !== 'est').map(s => Object.assign({store: s, fallback: true}, O[s])).sort((a, b) => a.price / a.pack_g - b.price / b.pack_g)[0];
  return alt || Object.assign({store: 'est', fallback: true}, O.est);
}
// Simulates every trip from the first one, so leftovers (and what has gone off) are known. Assumes each list was bought.
function shopPlan(store, upto) {
  const T = trips(Math.floor(upto / 2) + 1).slice(0, upto + 1), lots = {}, memo = {};
  const use = d => memo[d] || (memo[d] = useOn(d));
  const take = (L, e) => { let g = e.g; for (const l of L) { if (l.exp < e.d || l.g <= 0) continue; const x = Math.min(l.g, g); l.g -= x; g -= x; if (g <= 1e-9) break; } return Math.max(0, g); };
  return T.map(t => {
    const need = {};
    for (let i = 0; i <= 7; i++) { const d = addDays(t.date, i); for (const u of use(d)) if (inWindow(t, u.f, i)) { const n = need[u.f] = need[u.f] || {ev: [], ids: new Set()}; n.ev.push({d, g: u.g}); n.ids.add(u.id); } }
    const items = Object.keys(need).map(f => {
      const o = offerFor(f, store), L = (lots[f] || []).filter(l => l.g > 0.5 && l.exp >= t.date).sort((a, b) => a.exp < b.exp ? -1 : 1);
      const ev = need[f].ev, total = ev.reduce((s, e) => s + e.g, 0);
      const trial = L.map(l => Object.assign({}, l)); let short = 0; ev.forEach(e => { short += take(trial, e); });
      const packs = short > 0.5 ? Math.max(1, Math.ceil(short / o.pack_g - 0.02)) : 0;
      L.forEach(l => { l.mine = false; });
      if (packs) L.push({g: packs * o.pack_g, exp: addDays(t.date, SHOP_INFO[f].life), mine: true});
      L.sort((a, b) => a.exp < b.exp ? -1 : 1); ev.forEach(e => take(L, e));
      lots[f] = L;
      return {f, need: total, fromHome: total - short, packs, o, cost: packs * o.price, eaten: total * o.price / o.pack_g, left: L.filter(l => l.mine).reduce((s, l) => s + l.g, 0), ids: [...need[f].ids]};
    });
    return {t, items, cost: items.reduce((s, x) => s + x.cost, 0), eaten: items.reduce((s, x) => s + x.eaten, 0)};
  });
}
function tripNow() { if (!S.start) return 0; const t = todayISO(), T = trips(weekIdx(t) + 3), i = T.findIndex(x => x.date >= t); return i < 0 ? 0 : i; }

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
  if (!S.start) return `<div class="card"><div class="label">Food</div><h2>Your food plan starts on day 1</h2><p class="small">Week 1 is ready in the Eat tab, every recipe with exact grams. Best order: shop on Saturday, batch cook on Sunday, press Start on Monday morning.</p><button class="btn sm" data-act="goEat">Open week 1</button></div>`;
  const meals = dayMeals(d), eaten = S.eaten[d] || {}, tgt = targetKcal(d), plan = total(meals);
  let kcal = 0, p = 0;
  meals.forEach(m => { if (eaten[m.slot]) { kcal += m.kcal; p += m.p; } });
  if (S.juice[d]) kcal += JUICE.kcal;
  const pct = Math.min(100, kcal / tgt * 100);
  return `<div class="card"><div class="row"><h2 class="grow" style="margin:0">Today’s food</h2><span class="counter">${r0(kcal)} / ${tgt} kcal · ${r0(p)} / ${PLAN.protein} g P</span></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    ${inBreak(d) ? `<p class="note small">Maintenance week: the normal meals plus the extras below, about ${PLAN.dietBreakKcal} kcal.</p>` : ''}
    ${weekIdx(d) < 0 ? '<p class="note small">Lunch today is your own: the plan starts with tonight’s dinner from the Sunday batch.</p>' : ''}
    ${meals.map(m => { const on = !!eaten[m.slot]; return `<div class="meal"><div class="tick ${on ? 'on' : ''}" role="checkbox" tabindex="0" aria-checked="${on}" data-act="eat" data-id="${m.slot}"><span class="box">${on ? '✓' : ''}</span><span class="grow"><span class="label" style="margin:0">${esc(m.label)}</span><div class="t">${esc(m.name)}</div><span class="kc">${r0(m.kcal)} kcal · ${r0(m.p)} g P</span></span></div>${RECIPES[m.id] ? `<button class="btn ghost sm" data-act="recipe" data-id="${m.id}" aria-label="Recipe: ${esc(m.name)}">Recipe</button>` : ''}</div>`; }).join('')}
    <p class="small muted" style="margin-top:8px">Planned today: ${r0(plan.kcal)} kcal · ${r0(plan.p)} g protein · ${r0(plan.c)} g carbs · ${r0(plan.f)} g fat.</p></div>`;
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
  if (!S.start) h += `<div class="card hi"><h2>Press Start on the day you begin</h2><p class="small">Nothing is counting yet. When you press Start, that day is <b>day 1</b>: the week count, the food plan and the calorie advice count from it.</p><p class="small muted">Best: shop on Saturday, batch cook week 1 on Sunday, press Start on Monday morning.</p><button class="btn" data-act="start">Press Start — this is day 1</button></div>`;
  if (inBreak(d)) h += `<div class="card hi"><div class="label">Maintenance week</div><p>Eat about ${PLAN.dietBreakKcal} kcal this week: the normal meals plus the extras in the food list. Training stays the same. It is planned, not a cheat.</p></div>`;
  h += dayCard(d) + juiceCard(d) + weighCard(d) + foodCard(d) + suppCard(d);
  const jobs = kitchenOn(d);
  if (jobs.length) h += `<div class="card"><div class="label">${weekday(d) === 0 ? 'Kitchen today' : 'Tonight in the kitchen'}</div><ul class="tasks">${jobs.map(k => `<li>${k}</li>`).join('')}</ul></div>`;
  return h;
}

const ui = {week: null, day: null, recipe: null, trip: null};
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const KIND = {breakfast: 'Breakfast', snack: 'Snack', night: 'Night', sunLunch: 'Lunch', thuLunch: 'Lunch', sunDinner: 'Dinner', thuDinner: 'Dinner', wedBox: 'Work box', friBox: 'Work box'};
const thumb = id => PICS.includes(id) ? `<img src="pics/${esc(id)}.jpg" alt="" loading="lazy">` : '📷';
function recipeRow(id) {
  const r = RECIPES[id], m = macros(id), ro = roleOf(id);
  return `<button class="rc" data-act="recipe" data-id="${esc(id)}"><span class="thumb">${thumb(id)}</span><span class="grow"><span class="label" style="margin:0">${esc(KIND[ro && ro.role] || '')} · ${r.minutes} min · makes ${r.makes}</span><div class="t">${esc(r.name)}</div><span class="small muted">${esc(r.tagline)}</span><div class="kc">${r0(m.kcal)} kcal · ${r0(m.p)} g P per portion</div></span></button>`;
}
function vEat() {
  const today = todayISO(), nowW = S.start ? rot(Math.max(weekIdx(today), 0)) : 0;
  const wk = ui.week ?? nowW, wd = ui.day ?? weekday(today), W = WEEKS[wk];
  const meals = planFor(wk, wd), t = total(meals), jobs = kitchen(wk, wd);
  let weeks = '';
  for (let i = 0; i < PLAN_WEEKS; i++) weeks += i < nW ? `<button class="chip ${i === wk ? 'on' : ''}" data-act="eatWeek" data-w="${i}">Week ${i + 1}${S.start && i === nowW ? ' · now' : ''}</button>` : `<button class="chip" disabled>Week ${i + 1}</button>`;
  const days = WEEK_ORDER.map(x => `<button class="chip ${x === wd ? 'on' : ''}" data-act="eatDay" data-d="${x}">${DAYS[x].slice(0, 3)}</button>`).join('');
  return header() + `<h1>Eat</h1>
  <div class="chips" role="group" aria-label="Week">${weeks}</div>
  ${nW < PLAN_WEEKS ? `<p class="small muted" style="margin:-4px 0 12px">Weeks ${nW + 1}–${PLAN_WEEKS} are being written. Until then the plan repeats weeks 1–${nW}.</p>` : ''}
  <div class="chips" role="group" aria-label="Day">${days}</div>
  <div class="card"><h2>${DAYS[wd]} · week ${wk + 1}</h2><p class="kc" style="margin:0 0 4px">${r0(t.kcal)} kcal · P ${r0(t.p)} · C ${r0(t.c)} · F ${r0(t.f)}</p>
    ${meals.map(m => `<div class="meal"><span class="grow"><span class="label" style="margin:0">${esc(m.label)}</span><div>${link(m.id)}</div>${m.fresh ? '<span class="small muted">Cooked today: the first portion of the Sunday batch.</span>' : ''}</span><span class="kc">${r0(m.kcal)} kcal · ${r0(m.p)} g</span></div>`).join('')}
    ${jobs.length ? `<div class="note small" style="margin-top:10px"><b>${wd === 0 ? 'Today' : 'Tonight'}:</b><ul class="tasks" style="margin-top:6px">${jobs.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}</div>
  <div class="card"><h2>Cooking this week</h2>
    <div class="label" style="margin-top:8px">Sunday before the week · from about 15:00</div><p class="small">${link(W.sunDinner)} ×4 · ${ROLE.sunDinner.when}<br>${link(W.sunLunch)} ×3 · ${ROLE.sunLunch.when}</p>
    <div class="label">Tuesday night · 25 min</div><p class="small">${link(W.wedBox)} · ${ROLE.wedBox.when}</p>
    <div class="label">Thursday after the gym</div><p class="small">${link(W.thuDinner)} ×3 · ${ROLE.thuDinner.when}<br>${link(W.thuLunch)} ×2 · ${ROLE.thuLunch.when}<br>${link(W.friBox)} · ${ROLE.friBox.when}</p>
    ${wk === 0 ? '<p class="small muted">Week 1: the Sunday batch is cooked the day before you press Start.</p>' : ''}</div>
  <div class="card"><h2>Week ${wk + 1} recipes</h2>${['breakfast', 'snack', 'sunDinner', 'sunLunch', 'wedBox', 'thuDinner', 'thuLunch', 'friBox'].map(k => recipeRow(W[k])).join('')}${recipeRow('nightquark')}</div>
  <div class="card"><div class="label">Food safety</div><ul class="plain small">
    <li>Cool cooked food fast: lids off, no more than 1 hour on the counter, then fridge or freezer.</li>
    <li>Cooked rice: 1 day in the fridge, otherwise the freezer. Other cooked food: 2 days.</li>
    <li>Thaw in the fridge overnight, never on the counter.</li>
    <li>Reheat once, until it is steaming hot all the way through.</li>
    <li>Work box: insulated bag with 2 frozen ice packs. Anything you bring home goes in the bin.</li>
    <li>Chicken, pork and mince are done when a cut-open piece has no pink and the juice runs clear.</li></ul></div>
  <div class="card"><h2>The targets</h2><p><b>${PLAN.kcal} kcal · ${PLAN.protein} g protein a day</b>: about ${r0((1 - PLAN.kcal / PLAN.maintenance) * 100)} % below your estimated maintenance of ~${PLAN.maintenance} kcal. Expect about 0.75 kg a week.</p>
  <p class="small muted">Maintenance week: ${PLAN.dietBreaks.map(([a, b]) => shortDate(a) + ' – ' + shortDate(b)).join(', ')} (~${PLAN.dietBreakKcal} kcal). Goal: ${esc(PLAN.goal)}.</p></div>
  <div class="card"><div class="label">Rules that always apply</div><ul class="plain small"><li>Protein first at every meal.</li><li>No juice, soda or sugary drinks (the pre-gym beetroot juice is the planned exception).</li><li>Kitchen closes after the night quark.</li><li>Still hungry? Vegetables and water, never more rice.</li><li>Hob: high = 8 of 9, medium = 5–6, low = 2–3.</li></ul></div>`;
}

function vRecipe(id) {
  const r = RECIPES[id], m = macros(id), ro = roleOf(id), batch = r.makes > 1, st = storageText(id);
  const pic = PICS.includes(id) ? `<div class="hero"><img src="pics/${esc(id)}.jpg" alt="${esc(r.name)}"></div>` : `<div class="hero empty"><span style="font-size:26px">📷</span><span class="small">No picture yet: make one with the prompt at the bottom.</span></div>`;
  const showNote = i => i.note && !FOODS[i.f].n.toLowerCase().includes(i.note.toLowerCase());
  const rows = r.ings.map(i => `<tr><td>${esc(FOODS[i.f].n)}${showNote(i) ? ` <span class="muted">(${esc(i.note)})</span>` : ''}<span class="de">${esc(FOODS[i.f].de)}</span></td><td class="num">${amt(i.f, i.g)}</td>${batch ? `<td class="num">${amt(i.f, i.g * r.makes)}</td>` : ''}</tr>`).join('');
  return `<div class="top"><button class="btn ghost sm" data-act="closeRecipe">← Back</button><span class="pill">${esc(r.cuisine)}</span></div>
  <div style="height:12px"></div>${pic}
  <div class="eyebrow">${esc(KIND[ro && ro.role] || '')} · ${r.minutes} min · makes ${r.makes}</div>
  <h1 style="margin-bottom:6px">${esc(r.name)}</h1><p class="muted">${esc(r.tagline)}</p>
  <div class="grid4" style="margin:12px 0 14px"><div class="stat"><div class="big">${r0(m.kcal)}</div><div class="label" style="margin:0">kcal</div></div><div class="stat"><div class="big">${r0(m.p)}</div><div class="label" style="margin:0">protein g</div></div><div class="stat"><div class="big">${r0(m.c)}</div><div class="label" style="margin:0">carbs g</div></div><div class="stat"><div class="big">${r0(m.f)}</div><div class="label" style="margin:0">fat g</div></div></div>
  <p class="small muted" style="margin-top:-6px">Per portion.${ro && ROLE[ro.role] && ROLE[ro.role].when ? ` Eaten: ${esc(ROLE[ro.role].when)}.` : ''}</p>
  <div class="card"><h2>Ingredients</h2><table><tr><th>Food</th><th class="num">Each</th>${batch ? `<th class="num">All ${r.makes}</th>` : ''}</tr>${rows}</table>
    ${r.spices.length ? `<p class="small" style="margin-top:10px"><b>Spices:</b> ${r.spices.map(esc).join(' · ')}</p>` : ''}
    <p class="small muted">Weigh with your kitchen scale: raw meat and fish, dry rice and pasta, drained beans and tuna.</p></div>
  <div class="card"><h2>Steps</h2><ol class="steps">${r.steps.map(s => `<li>${esc(fillStep(s, r))}</li>`).join('')}</ol></div>
  ${st || r.reheat ? `<div class="card"><h2>Fridge, freezer, reheating</h2>${st ? `<p class="small">${esc(st)}</p>` : ''}${r.reheat ? `<p class="small"><b>Reheat:</b> ${esc(r.reheat)}</p>` : ''}</div>` : ''}
  ${r.sundayPrep ? `<div class="card"><div class="label">On Sunday</div><p class="small">${esc(r.sundayPrep)}</p></div>` : ''}
  ${r.swap ? `<div class="card"><div class="label">Swap</div><p class="small">${esc(r.swap)}</p></div>` : ''}
  <div class="card"><div class="label">Picture prompt for the Gemini app</div><p class="note small" id="prompt">${esc(promptFor(r))}</p>
    <button class="btn sm" data-act="copyPrompt">Copy prompt</button><p class="small muted" style="margin-top:8px">Paste it into Gemini, save the picture to Drive (folder Claude) and tell me: I add it to this page.</p></div>`;
}

const AISLES = [['veg', 'Fruit and veg'], ['meat', 'Meat, fish and ham (fridge)'], ['dairy', 'Dairy and eggs'], ['bakery', 'Bread and wraps'], ['frozen', 'Freezer'], ['cupboard', 'Cupboard'], ['drinks', 'Drinks']];
const PLURAL = {'box of 10': 'boxes of 10', 'pack of 6': 'packs of 6', bunch: 'bunches', loaf: 'loaves', '3-pack': '3-packs'};
const units = (n, u) => `${n} ${n === 1 ? u : PLURAL[u] || u + 's'}`;
const eur = n => `€${n.toFixed(2)}`;
const CHAIN = {kaufland: /kaufland/i, aldi: /aldi/i, lidl: /lidl/i, rewe: /rewe|penny|netto/i};
const BUDGET = [170, 200];
function forWhat(ids) {
  const names = ids.map(id => id === 'juice' ? 'gym juice' : id === 'extras' ? 'maintenance extras' : RECIPES[id].name);
  return names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', ');
}
function priceNote(o) {
  if (o.store === 'est') return '≈ estimate, not checked in a shop yet';
  if (o.fallback) return `not found at this shop: ${STORES[o.store]} price shown`;
  return o.ok ? '' : '≈ estimate';
}
function vShop() {
  const store = STORES[S.store] ? S.store : 'kaufland', cur = tripNow(), sel = ui.trip ?? cur;
  const T = trips(Math.floor(Math.max(sel, cur + 2) / 2) + 1), t = T[sel];
  const plan = shopPlan(store, 2 * t.wk + 1), trip = plan[sel], basket = S.basket[t.date] || {};
  const week = plan[2 * t.wk].eaten + plan[2 * t.wk + 1].eaten, month = week * 4.33;
  const buy = trip.items.filter(x => x.packs > 0), home = trip.items.filter(x => x.packs === 0);
  const inBasket = buy.filter(x => basket[x.f]), still = buy.filter(x => !basket[x.f]).reduce((s, x) => s + x.cost, 0);
  const chips = [...new Set([cur, cur + 1, cur + 2, sel])].sort((a, b) => a - b).map(i => { const x = T[i]; return `<button class="chip ${i === sel ? 'on' : ''}" data-act="trip" data-i="${i}">${shortDate(x.date)} · ${x.kind === 'main' ? 'main shop' : 'top-up'}</button>`; }).join('');
  const row = x => { const on = !!basket[x.f], note = priceNote(x.o);
    return `<div class="tick ${on ? 'on' : ''}" role="checkbox" tabindex="0" aria-checked="${on}" data-act="basket" data-d="${t.date}" data-k="${esc(x.f)}"><span class="box">${on ? '✓' : ''}</span><span class="grow"><div class="t">${units(x.packs, SHOP_INFO[x.f].unit)} · ${esc(foodName(x.f))}</div><div class="small muted">${esc(x.o.label)}${note ? ` · <i>${esc(note)}</i>` : ''}</div><div class="small muted">For ${esc(forWhat(x.ids))}${x.fromHome > 0.5 ? ` · you still have ~${amt(x.f, x.fromHome)}` : ''}${x.left > x.o.pack_g * 0.05 ? ` · ~${amt(x.f, x.left)} left for later` : ''}</div></span><span class="kc">${eur(x.cost)}</span></div>`; };
  const groups = AISLES.map(([a, label]) => { const xs = buy.filter(x => SHOP_INFO[x.f].aisle === a); return xs.length ? `<div class="label" style="margin-top:14px">${label}</div>${xs.map(row).join('')}` : ''; }).join('');
  const sp = SPICE_PRICES[store], spiceRows = SPICE_SHELF.map((s, i) => { const k = 'spice:' + i, on = !!basket[k]; return `<div class="tick ${on ? 'on' : ''}" role="checkbox" tabindex="0" aria-checked="${on}" data-act="basket" data-d="${t.date}" data-k="${k}"><span class="box">${on ? '✓' : ''}</span><span class="grow"><div class="t">${esc(s.n)}</div><div class="small muted">${esc(s.de)}</div></span></div>`; }).join('');
  const branches = BRANCHES.filter(b => CHAIN[store].test(b.chain || ''));
  const status = month <= BUDGET[1] ? `<span class="pill ok">${month < BUDGET[0] ? 'under' : 'inside'} your budget</span>` : '<span class="pill warn">over budget</span>';
  return header() + `<h1>Shop</h1>
  <div class="chips" role="group" aria-label="Shop">${Object.entries(STORES).map(([k, n]) => `<button class="chip ${k === store ? 'on' : ''}" data-act="store" data-s="${k}">${esc(n)}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="Trip">${chips}</div>
  ${!S.start && sel === 0 ? `<div class="card hi"><div class="label">Your first shop</div><h2>Everything for week 1</h2><p class="small">This list also stocks the cupboard (oil, rice, sauces) and the spice shelf, which last for weeks, so it costs more than a normal week. Shop on Saturday, batch cook on Sunday, press Start on Monday.</p></div>` : ''}
  <div class="card"><div class="label">Budget · week ${t.wk + 1}</div><div class="row"><span class="big">≈ ${eur(week)}</span><span class="muted">of food eaten this week</span></div>
    <div class="bar"><i style="width:${Math.min(100, month / BUDGET[1] * 100)}%"></i></div>
    <p class="small" style="margin-top:6px">≈ ${eur(month)} a month (budget €${BUDGET[0]}–${BUDGET[1]}) ${status}</p>
    <p class="small muted">What you pay at the till changes from trip to trip (a bag of rice lasts weeks); this is what the food you actually eat costs.</p></div>
  <div class="card"><div class="row"><h2 class="grow" style="margin:0">${longDate(t.date)}</h2><span class="counter">≈ ${eur(trip.cost)}</span></div>
    <p class="small muted" style="margin-top:6px">${t.kind === 'main' ? `Main shop for week ${t.wk + 1}: the Sunday batch, every breakfast, snack and night quark, Tuesday’s work box, and the cupboard and freezer food for Thursday.` : `Top-up for week ${t.wk + 1}: fresh meat and other short-life food for the Thursday batch, Friday’s work box and the weekend.`}</p>
    ${buy.length ? `<p class="small"><b>In the basket: ${inBasket.length} of ${buy.length}</b>${inBasket.length < buy.length ? ` · ≈ ${eur(still)} still to get` : ' · all done'}</p>${groups}` : '<p>Nothing to buy on this trip: you already have everything.</p>'}
    ${home.length ? `<details style="margin-top:12px"><summary>Already at home (${home.length})</summary><ul class="plain small">${home.map(x => `<li>${esc(foodName(x.f))}: you have enough (~${amt(x.f, x.need)} needed)</li>`).join('')}</ul></details>` : ''}</div>
  <div class="card"><details ${sel === 0 ? 'open' : ''}><summary>Spice shelf (buy once${sp && sp.price ? `, ≈ ${eur(Number(sp.price))} each` : ', ≈ €1 each'})</summary><p class="small muted">Small jars that last for months. Tick what you already have.</p>${spiceRows}</details></div>
  <div class="card"><details ${sel === 0 ? 'open' : ''}><summary>Buy once, before the first work day</summary><ul class="plain small">${ONE_TIME.map(o => `<li><b>${esc(o.n)}</b> · ${esc(o.price)}<br><span class="muted">${esc(o.why)} ${esc(o.where)}.</span></li>`).join('')}</ul></details></div>
  ${branches.length ? `<div class="card"><div class="label">${esc(STORES[store])} in the city centre</div>${branches.map(b => `<p class="small"><b>${esc(b.address)}</b>${b.hours ? `<br><span class="muted">${esc(b.hours)}</span>` : ''}</p>`).join('')}<p class="small muted">${branches.some(b => /sun/i.test(b.hours || '')) ? 'The branch at the main station also opens on Sundays: handy if something is missing for the Sunday batch. The others are closed on Sundays and public holidays.' : 'Closed on Sundays and public holidays.'}</p></div>` : ''}
  <p class="small muted">${PRICES_CHECKED ? `Prices seen on the shop websites on ${longDate(PRICES_CHECKED)}.` : 'Prices are estimates until they are checked on the shop websites.'} Shelf prices and weekly offers change, so totals are a guide (≈). The list assumes you bought the earlier lists.</p>`;
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
  if (ui.recipe && !RECIPES[ui.recipe]) ui.recipe = null;
  $('#app').innerHTML = ui.recipe ? vRecipe(ui.recipe) : VIEWS[S.tab]();
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
  recipe(el) {
    // one history entry for the recipe page, so the phone's Back always returns to where you came from
    ui.recipe = el.dataset.id;
    try { if (history.state && history.state.fuelRecipe) history.replaceState({fuelRecipe: ui.recipe}, ''); else history.pushState({fuelRecipe: ui.recipe}, ''); } catch (e) { /* history blocked: the Back button still works */ }
    render(); window.scrollTo(0, 0);
  },
  closeRecipe() { if (history.state && history.state.fuelRecipe) history.back(); else { ui.recipe = null; render(); } },
  eatWeek(el) { ui.week = Number(el.dataset.w); render(); },
  eatDay(el) { ui.day = Number(el.dataset.d); render(); },
  goEat() { S.tab = 'eat'; ui.week = 0; save(); render(); window.scrollTo(0, 0); },
  copyPrompt() {
    const el = $('#prompt'), text = el.textContent;
    const fallback = () => { const range = document.createRange(); range.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); toast('Selected: long-press it and choose Copy'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('Prompt copied. Paste it into the Gemini app.'), fallback);
    else fallback();
  },
  store(el) { S.store = el.dataset.s; save(); render(); },
  trip(el) { ui.trip = Number(el.dataset.i); render(); },
  basket(el) { const d = el.dataset.d, k = el.dataset.k; S.basket[d] = S.basket[d] || {}; if (S.basket[d][k]) delete S.basket[d][k]; else S.basket[d][k] = true; save(); render(); },
  export() {
    const blob = new Blob([JSON.stringify(Object.assign({}, S, {exported: new Date().toISOString()}), null, 1)], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `fuel-backup-${todayISO()}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Backup file created');
  },
};
document.addEventListener('click', e => {
  const tab = e.target.closest('#tabs button');
  if (tab) { S.tab = tab.dataset.tab; if (ui.recipe) { ui.recipe = null; try { history.replaceState(null, ''); } catch (err) { /* ignore */ } } save(); render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-act]');
  if (el && el.tagName === 'A') e.preventDefault();
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

// phone Back button closes an open recipe
window.addEventListener('popstate', () => { ui.recipe = (history.state && history.state.fuelRecipe) || null; render(); });

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__fuel = {get S() { return S; }, set S(v) { S = v; }, render, advice, H, save, todayISO, mondayOf, addDays, ui, planFor, dayMeals, kitchen, kitchenOn, macros, weekIdx, fillStep, storageText, ROLE, useOn, trips, shopPlan, offerFor, tripNow};
})();
