// Fuel — Wael's data. Plain data only; app.js reads it.
// Numbers come from D:/Brain/Looks-Maxing/40-Body-Posture.md (21 Sep 2026) and the 22 Oct 2026 weekly plan.
// Never put personal addresses in here: this file is public.

const PLAN = {
  kcal: 1850,                 // daily target on the cut
  protein: 180,               // g per day
  maintenance: 2550,          // estimated at ~85 kg with 4 lifts + steps
  dietBreakKcal: 2400,        // scheduled maintenance weeks
  dietBreaks: [['2026-11-16', '2026-11-22']],
  startKg: 85,
  goal: 'about 72–73 kg by 1 April 2027',
};

// Weekday -> what the day is. 0 = Sunday.
const WEEK = {
  0: {type: 'rest', label: 'Rest day · church', note: 'Church in the morning. Batch cook from about 15:00. A long walk if you feel like it.'},
  1: {type: 'gym', session: 'lowerA', when: 'Late morning (class at 17:45)'},
  2: {type: 'gym', session: 'upperA', when: 'Late morning (class at 17:45)'},
  3: {type: 'work', label: 'Work day', note: 'Your shift is your cardio: you are on your feet all day. 10 minutes of posture drills in the morning.'},
  4: {type: 'gym', session: 'lowerB', when: 'Late morning (class at 17:00)'},
  5: {type: 'work', label: 'Work day', note: 'Your shift is your cardio: you are on your feet all day. 10 minutes of posture drills in the morning.'},
  6: {type: 'gym', session: 'upperB', when: 'Morning, then the weekly shop (shops are closed on Sunday)'},
};

const TRAP_SHORT = {n: 'Trapezius block (short): shrugs + upright row', sets: 2, reps: '12', rest: 60};
const TRAP_FULL = {n: 'Trapezius block (full): shrugs, one-arm row, reverse fly, lateral raise, upright row', sets: 3, reps: '10–12', rest: 60};

const SESSIONS = {
  lowerA: {name: 'Legs A', focus: 'Quads, hamstrings, calves, core', cardio: 15, ex: [
    TRAP_SHORT,
    {n: 'Leg press or squat', sets: 4, reps: '8–10', rest: 120, main: true},
    {n: 'Romanian deadlift', sets: 3, reps: '10', rest: 120, main: true},
    {n: 'Walking lunges (per leg)', sets: 3, reps: '12', rest: 90},
    {n: 'Leg curl', sets: 3, reps: '12', rest: 75},
    {n: 'Calf raise', sets: 3, reps: '15', rest: 60},
    {n: 'Plank (seconds)', sets: 3, reps: '45', rest: 60, unit: 's'},
  ]},
  upperA: {name: 'Upper body A', focus: 'Chest, back, shoulders, arms', cardio: 15, ex: [
    TRAP_FULL,
    {n: 'Bench press or dumbbell press', sets: 4, reps: '8–10', rest: 120, main: true},
    {n: 'Lat pulldown', sets: 4, reps: '8–10', rest: 120, main: true},
    {n: 'Dumbbell shoulder press', sets: 3, reps: '10', rest: 90},
    {n: 'Cable row', sets: 3, reps: '12', rest: 75},
    {n: 'Face pull', sets: 3, reps: '15', rest: 60},
    {n: 'Biceps curl', sets: 2, reps: '12', rest: 60},
    {n: 'Triceps pushdown', sets: 2, reps: '12', rest: 60},
  ]},
  lowerB: {name: 'Legs B', focus: 'Glutes, legs, core, grip', cardio: 15, ex: [
    TRAP_SHORT,
    {n: 'Hip thrust', sets: 4, reps: '10', rest: 120, main: true},
    {n: 'Goblet or hack squat', sets: 3, reps: '10', rest: 120, main: true},
    {n: 'Split squat (per leg)', sets: 3, reps: '10', rest: 90},
    {n: 'Leg extension', sets: 3, reps: '12', rest: 75},
    {n: 'Hanging knee raise', sets: 3, reps: '12', rest: 60, unit: 'reps'},
    {n: 'Farmer carry (metres)', sets: 3, reps: '30', rest: 90, unit: 'm'},
  ]},
  upperB: {name: 'Upper body B', focus: 'Upper chest, back width, side delts', cardio: 25, ex: [
    TRAP_FULL,
    {n: 'Incline dumbbell press', sets: 4, reps: '10', rest: 120, main: true},
    {n: 'Chest-supported row', sets: 4, reps: '10', rest: 120, main: true},
    {n: 'Lateral raise', sets: 3, reps: '15', rest: 60},
    {n: 'Pull-ups or assisted pull-ups', sets: 3, reps: 'max', rest: 120},
    {n: 'Dips or triceps pushdown', sets: 3, reps: '12', rest: 75},
    {n: 'Rear-delt fly', sets: 3, reps: '15', rest: 60},
  ]},
};

const GYM_RULES = [
  'Warm up: 5 min bike, then 2 light sets of the first big exercise.',
  'Pick a weight where you could still do 2 more reps at the end of each set.',
  'Rest about 2 min on the big lifts, 60–90 s on the rest (shown on each exercise).',
  'When you hit the top of the rep range on every set, add the smallest weight step next time.',
  'Holding your weights during a cut is winning. Getting stronger is a bonus.',
  'Finish with the incline walk: 10–12 % incline, 5–5.5 km/h.',
];

const POSTURE = ['Dead bugs 3 × 10', 'Glute bridges 3 × 12', 'Hip-flexor stretch 2 × 45 s per side'];

const JUICE = {
  name: 'Pre-gym beetroot juice',
  kcal: 170,
  how: '450 ml beetroot DIRECT juice (Direktsaft, not Nektar), 2–3 hours before training, sipped over 15–20 minutes. Never in the last hour before.',
  limit: 3,   // max per week; the 4th gym day goes without
  note: 'Gives a few more reps and better blood flow in studies. It is 170 kcal on top of the food plan (counted below). Three a week is about 70 kcal a day on average: if the scale stalls, the juice is the first thing to drop.',
};

const SUPPLEMENTS = [
  {id: 'vitd', name: 'Vitamin D3 capsule (5600 IU, weekly)', day: 6, when: 'with dinner', note: 'Mivolis Wochen-Depot from dm. One a week only.'},
  // day: null = every day. food + g: counted in the day's calories when ticked.
  {id: 'chia', name: 'Chia water: 12 g chia seeds (1 tbsp) in a big glass of water', day: null, food: 'chia', g: 12, when: 'before your hungriest meal', note: 'Stir, wait at least 10 minutes (15 is better), stir again, then drink it slowly. Never eat chia dry. No more than 15 g a day (the EU limit on the pack).'},
  {id: 'creatine', name: 'Creatine monohydrate, 5 g', day: null, when: 'any time of day, weighed on your scale', note: 'Stir it into the breakfast quark or a glass of water. Every day, rest days too; no loading phase. The first 2–3 weeks add about 1–2 kg of water in the muscles: that is not fat, and the app waits until week 3 before judging the scale.'},
];

// Used every day on top of the recipes; the shop list buys them. g = grams, or ml for drinks.
const DAILY_USE = [{f: 'chia', g: 12}, {f: 'colazero', g: 3000 / 7}];

const DRINKS = 'Drinks: water, tea, black coffee, and zero-sugar cola (up to about 0.5 l a day, with meals, none after 16:00 because of the caffeine).';

const INBODY = {
  place: 'Firstsports, Halberstädter Str. 17, Magdeburg',
  phone: '0391 405 90 49',
  dates: ['2026-11-02', '2027-01-11', '2027-03-08', '2027-05-03'],
  rules: ['Morning, before eating or drinking much.', 'Toilet just before.', 'No training that day before the scan.', 'Light clothes, no metal (watch, belt).'],
};

// Fixed evening jobs per weekday. The recipe jobs (batch cooking, work boxes, freezer to fridge) are worked out by app.js from recipes.js.
const KITCHEN = {
  0: ['Ice packs into the freezer (for Wednesday).'],
  3: ['Ice packs back in the freezer.'],
  5: ['Ice packs back in the freezer.', 'Check what is running low for tomorrow’s shop.'],
  6: ['Weekly shop after the gym (shops are closed on Sunday).'],
};
