// Fuel recipes. Grams are PER PORTION (raw / dry / drained); the app multiplies by `makes` for the batch.
// In steps, {food} becomes the batch amount of that ingredient ("480 g", "3 eggs"), {=food*2} a plain number (for water in ml).
// Macros are computed from foods.js. Kitchen kit: air fryer + ceramic hob + kitchen scale. No oven, no microwave.
// Hob words: high = 8 of 9, medium = 5–6, low = 2–3.

const RECIPES = {
  // ---------- every day ----------
  nightquark: {name: 'Night quark', kind: 'night', minutes: 1, makes: 1, cuisine: 'Every day',
    tagline: 'The last food of the day. Slow protein while you sleep, then the kitchen is closed.',
    ings: [{f: 'quark', g: 200}],
    spices: ['Cinnamon, as much as you like. No honey, no sugar.'],
    steps: ['Quark {quark} in a bowl, stir until smooth, cinnamon on top.'],
    look: 'small white bowl of smooth thick white quark dusted with cinnamon, a teaspoon beside it'},

  // ---------- week 1 ----------
  berrybowl: {name: 'Peanut butter and berry quark bowl', kind: 'breakfast', minutes: 3, makes: 1, cuisine: 'European',
    tagline: 'Your usual quark bowl, now with peanut butter: tastes like PB and jam. No cooking.',
    ings: [{f: 'quark', g: 300}, {f: 'oats', g: 30}, {f: 'berries', g: 100, note: 'frozen'}, {f: 'pbutter', g: 12, note: '2 tsp'}],
    spices: ['Cinnamon (optional)'],
    steps: ['Quark {quark} in a bowl, stir until smooth.', 'Oats {oats} on top.', 'Frozen berries {berries} straight from the freezer: they soften in 5 minutes. Peanut butter {pbutter} on top (warm the spoon under hot water and it drizzles).'],
    look: 'white bowl of thick white quark topped with rolled oats, dark red and purple mixed berries and a drizzle of peanut butter'},

  cocoaquark: {name: 'Cocoa-banana quark', kind: 'snack', minutes: 2, makes: 1, cuisine: 'European',
    tagline: 'Tastes like chocolate pudding. On work days the quark goes in a small box.',
    ings: [{f: 'quark', g: 250}, {f: 'banana', g: 80, note: '1 small, peeled'}, {f: 'cocoa', g: 6, note: '2 tsp'}],
    spices: [],
    steps: ['Stir the cocoa {cocoa} into the quark {quark} with 1 tbsp water until there are no lumps.', 'Slice the banana {banana} on top. Work day: quark in a small box, banana whole, both in the insulated bag.'],
    look: 'glass bowl of smooth light-brown cocoa quark with banana slices on top'},

  teriyaki: {name: 'Teriyaki chicken rice bowls', kind: 'main', minutes: 35, makes: 3, cuisine: 'Asian', fridge: 1,
    tagline: 'Sticky soy-honey-ginger chicken thighs (juicier and cheaper than breast) with broccoli and carrots.',
    ings: [{f: 'thigh', g: 170}, {f: 'rice', g: 35, note: 'dry'}, {f: 'broccoli', g: 150, note: 'frozen'}, {f: 'carrot', g: 60}, {f: 'soy', g: 15}, {f: 'honey', g: 5}, {f: 'ginger', g: 5}, {f: 'garlic', g: 4, note: '1 clove'}, {f: 'cornflour', g: 4}, {f: 'oil', g: 4}, {f: 'sesame', g: 3}],
    spices: ['Pepper'],
    steps: [
      'Rice: rinse {rice} in a sieve until the water runs clear. Pot with {=rice*2} ml water and a pinch of salt, high heat until it boils, then low, lid on, 12 min (parboiled rice: the time on the pack, about 15–20 min). Off the heat, lid on, 5 min more.',
      'Sauce in a cup: soy sauce {soy}, honey {honey}, grated ginger {ginger}, crushed garlic {garlic}, cornflour {cornflour} and 100 ml water. Stir.',
      'Cut the chicken thighs {thigh} into 2–3 cm pieces. Large pan, high heat, oil {oil}. Chicken in one layer (2 rounds if it is crowded), 6–7 min, turning, until golden. Cut the biggest piece open: white all through, no pink.',
      'Carrots {carrot} in thin slices. Add them and the frozen broccoli {broccoli} to the pan with 100 ml water, lid on, medium heat, 5 min.',
      'Stir the sauce again, pour it in, 1–2 min until thick and glossy. Sesame {sesame} on top.',
      'Rice and chicken into 3 boxes. Cool with the lids off (no longer than 1 hour), then lids on.',
    ],
    reheat: 'Pan with 3 tbsp water, lid on, medium heat, 6–7 min, stir halfway, until steaming hot all through.',
    swap: 'Chicken breast instead of thighs: 160 g per portion.',
    look: 'glass meal-prep box with white rice, glossy teriyaki chicken pieces with sesame seeds, bright green broccoli and carrot slices'},

  chili: {name: 'Chili con carne with a warm tortilla', kind: 'main', minutes: 45, makes: 4, cuisine: 'International', fridge: 2,
    tagline: 'Smoky beef and bean chili, quark instead of sour cream. Freezes perfectly.',
    ings: [{f: 'beef5', g: 120}, {f: 'kidney', g: 40, note: 'drained'}, {f: 'choptom', g: 200}, {f: 'onion', g: 50}, {f: 'pepper', g: 80}, {f: 'tompaste', g: 10}, {f: 'garlic', g: 4, note: '1 clove'}, {f: 'oil', g: 4}, {f: 'quark', g: 40, note: 'on top'}, {f: 'wrap', g: 62}],
    spices: ['2 tsp smoked paprika', '1 tsp ground cumin', '1 tsp chili powder (less if you do not like heat)', '1 tsp oregano', 'Salt, pepper'],
    steps: [
      'Dice the onions {onion} and peppers {pepper}. Crush the garlic {garlic}.',
      'Big pot, high heat, oil {oil}. Beef {beef5}: break it up with a wooden spoon, 6–8 min until browned and no pink is left.',
      'Onions and peppers in, 4 min. Then garlic, tomato paste {tompaste} and all the spices, 1 min, stirring.',
      'Chopped tomatoes {choptom}, drained kidney beans {kidney} and 150 ml water. Boil, then low heat, lid half on, 25 min, stir now and then. Taste and add salt.',
      'Eat tonight’s portion. The rest into 3 boxes, cool with the lids off (max 1 hour), lids on.',
      'To serve each portion: 1 tortilla warmed 30 s per side in a dry pan, and 40 g quark on top instead of sour cream. For all 4: tortillas {wrap}, quark {quark}. The quark stays in its tub in the fridge.',
    ],
    reheat: 'Pot or pan with a splash of water, lid on, medium heat, 6–8 min until bubbling.',
    swap: 'No tortilla? 45 g dry rice per portion instead.',
    look: 'bowl of thick dark red chili con carne with kidney beans and pepper pieces, a spoon of white quark on top, a folded warm tortilla on the side'},

  pollock: {name: 'Lemon-garlic pollock, potatoes and green beans', kind: 'main', minutes: 35, makes: 3, cuisine: 'German', fridge: 2, thaw: ['pollock'],
    tagline: 'Air-fried white fish with a mustard-dill quark dip. Day 2 and 3: the potatoes go crispy in the pan.',
    ings: [{f: 'pollock', g: 180, note: 'frozen, thawed'}, {f: 'potato', g: 250}, {f: 'beans', g: 150, note: 'frozen'}, {f: 'oil', g: 11}, {f: 'lemon', g: 10}, {f: 'garlic', g: 3}, {f: 'quark', g: 60, note: 'dip'}, {f: 'mustard', g: 8}],
    spices: ['Sweet paprika', 'Dried dill', 'Salt, pepper'],
    steps: [
      'Potatoes {potato}: wash, halve the big ones. Pot of cold salted water, high heat until it boils, then medium, 18–20 min until a knife slides in. Add the frozen green beans {beans} for the last 7 minutes. Drain.',
      'Fish {pollock}, thawed in the fridge overnight: pat dry with kitchen paper. Rub with 1 tbsp of the oil {oil}, crushed garlic {garlic}, paprika, salt and pepper.',
      'Air fryer 190 °C, 10–12 min, one layer (2 rounds if needed), until it flakes and is white all through. Lemon juice {lemon} over it.',
      'Dip: quark {quark}, mustard {mustard}, dill, salt and 2 tbsp water. Stir smooth.',
      'Tonight’s plate. The rest into 2 boxes; dip into 2 small pots.',
    ],
    reheat: 'Fish: air fryer 180 °C, 4–5 min. Potatoes in slices in a pan with the last of the oil until golden (Bratkartoffeln). Beans in the same pan for 2 min.',
    swap: 'Any white fish fillet (Alaska-Seelachs, Kabeljau), same grams.',
    look: 'plate with two golden air-fried white fish fillets and a lemon wedge, boiled potatoes, green beans, small bowl of mustard-dill quark dip'},

  salmonpasta: {name: 'Salmon and spinach tomato pasta', kind: 'main', minutes: 25, makes: 2, cuisine: 'Italian', fridge: 2, thaw: ['salmon'],
    tagline: 'Your fatty fish of the week (omega-3). No oil needed: the salmon brings its own.',
    ings: [{f: 'salmon', g: 125, note: '1 fillet, thawed'}, {f: 'pasta', g: 45, note: 'dry'}, {f: 'spinach', g: 150, note: 'frozen'}, {f: 'passata', g: 150}, {f: 'onion', g: 40}, {f: 'garlic', g: 4}, {f: 'lemon', g: 5}],
    spices: ['Oregano', 'Chili flakes (optional)', 'Salt, pepper'],
    steps: [
      'Pasta {pasta} in salted boiling water for the pack time minus 1 minute. Drain; keep a cup of the water.',
      'Pan, medium-high heat, no oil: salmon {salmon}, skin side down if it has skin, 4 min, flip, 3 min, until it flakes. Lift it out and break it into big flakes (skin off).',
      'Same pan, medium heat: diced onion {onion} 3 min, garlic {garlic} 1 min, then passata {passata}, oregano, chili, salt. Simmer 5 min.',
      'Frozen spinach {spinach} into the sauce, 4–5 min until hot. Pasta in with a splash of pasta water, then the salmon and lemon {lemon}. Fold gently.',
      'Two boxes. Cool with the lids off, then lids on.',
    ],
    reheat: 'Pan with 3 tbsp water, lid on, medium heat, 5–6 min until steaming hot.',
    swap: 'Trout fillet instead of salmon, same grams.',
    look: 'glass meal-prep box with penne in tomato sauce, large flakes of pink salmon and dark green spinach'},

  chickenpastasalad: {name: 'Italian chicken pasta salad', kind: 'work', minutes: 25, makes: 1, cuisine: 'Italian', fridge: 1,
    tagline: 'Made the night before, eaten cold on your break. Nothing in it needs heating.',
    ings: [{f: 'pasta', g: 50, note: 'dry'}, {f: 'chicken', g: 160}, {f: 'tomato', g: 100}, {f: 'cucumber', g: 80}, {f: 'pepper', g: 60}, {f: 'oil', g: 10, note: '2 tsp'}, {f: 'vinegar', g: 10}],
    spices: ['Italian herbs', 'Sweet paprika', 'Salt, pepper'],
    steps: [
      'Pasta {pasta} in salted boiling water for the pack time. Drain, rinse with cold water so it stops cooking, drain well.',
      'Chicken {chicken}: rub with paprika, Italian herbs, salt, pepper. Air fryer 190 °C, 14–16 min. Cut it open: white all through. Cool 10 min, slice.',
      'Dice the tomato {tomato}, cucumber {cucumber} and pepper {pepper}.',
      'In the box: oil {oil}, vinegar {vinegar}, herbs, salt, pepper. Everything in, mix, lid on, fridge.',
      'Morning: box into the insulated bag with 2 frozen ice packs. Eat it cold.',
    ],
    look: 'glass box of fusilli pasta salad with sliced grilled chicken, tomato, cucumber and red pepper pieces, green herbs'},

  tunapotato: {name: 'Tuna, egg and potato salad', kind: 'work', minutes: 25, makes: 1, cuisine: 'French', fridge: 1,
    tagline: 'Niçoise-style. The potatoes, beans and egg cook in the same pot as Thursday’s dinner.',
    ings: [{f: 'potato', g: 220}, {f: 'tuna', g: 112, note: '1 can, drained'}, {f: 'egg', g: 55}, {f: 'beans', g: 100, note: 'frozen'}, {f: 'tomato', g: 100}, {f: 'oil', g: 8}, {f: 'vinegar', g: 10}, {f: 'mustard', g: 5}],
    spices: ['Dried parsley or dill', 'Salt, pepper'],
    steps: [
      'Cook the potatoes {potato} in the same pot as the dinner potatoes. The egg {egg} goes in for the last 10 minutes and the green beans {beans} with the dinner beans for the last 7. Cool the egg in cold water and peel it.',
      'Halve the warm potatoes. Dressing in the box: oil {oil}, vinegar {vinegar}, mustard {mustard}, salt, pepper, 1 tbsp water. Toss the warm potatoes in it: they soak it up.',
      'Drained tuna {tuna}, the beans, tomato wedges {tomato} and the egg in quarters on top. Lid on, fridge once cool.',
      'Morning: box into the insulated bag with 2 frozen ice packs. Eat it cold.',
    ],
    look: 'glass box with halved boiled potatoes, chunks of tuna, green beans, tomato wedges and a quartered boiled egg, light mustard dressing'},

  // ---------- week 2 ----------
  appleoats: {name: 'Apple-cinnamon overnight oats', kind: 'breakfast', minutes: 5, makes: 1, cuisine: 'European', prep: 'night',
    tagline: 'Made the night before in a jar. Tastes like apple crumble, eaten cold.',
    ings: [{f: 'oats', g: 30}, {f: 'quark', g: 250}, {f: 'milk', g: 60}, {f: 'apple', g: 100, note: '1 small'}, {f: 'pbutter', g: 10, note: '2 tsp'}],
    spices: ['1 tsp cinnamon', 'Pinch of salt'],
    steps: ['The night before, in a jar or box: oats {oats}, milk {milk}, quark {quark}, cinnamon and a pinch of salt. Stir well.', 'Grate or dice half the apple {apple} into it, stir, lid on, fridge.', 'Morning: dice the other half of the apple on top, peanut butter {pbutter} over it. Eat it cold.'],
    look: 'glass jar of creamy overnight oats with diced apple, a drizzle of peanut butter and a dusting of cinnamon on top'},

  herbdip: {name: 'Herb quark dip, carrot sticks and an egg', kind: 'snack', minutes: 4, makes: 1, cuisine: 'German',
    tagline: 'A savoury, crunchy snack. The eggs are boiled on Sunday for the whole week.',
    ings: [{f: 'quark', g: 200}, {f: 'carrot', g: 150}, {f: 'egg', g: 55, note: 'boiled on Sunday'}, {f: 'mustard', g: 5}, {f: 'garlic', g: 2, note: '½ clove'}, {f: 'lemon', g: 5}],
    spices: ['Dried herbs (dill or Kräuter der Provence)', 'Salt, pepper'],
    steps: ['Stir the quark {quark} with mustard {mustard}, crushed garlic {garlic}, lemon {lemon}, herbs, salt, pepper and 1–2 tbsp water until smooth.', 'Peel the carrots {carrot} and cut them into sticks.', 'Peel one of the Sunday eggs {egg}. Work day: dip in a small box, carrots in a bag, egg in its shell, all in the insulated bag.'],
    sundayPrep: 'Boil 7 eggs for this week’s snacks: 10 min, then cold water. Keep them in their shells in the fridge (up to 1 week).',
    look: 'small bowl of white herb quark dip with green herbs, orange carrot sticks, a halved boiled egg'},

  beefnoodles: {name: 'Ginger beef noodles', kind: 'main', minutes: 30, makes: 3, cuisine: 'Asian', fridge: 2,
    tagline: 'Savoury minced beef, stir-fry vegetables and egg noodles in a soy-ginger glaze.',
    ings: [{f: 'beef5', g: 150}, {f: 'eggnoodles', g: 45, note: 'dry'}, {f: 'wokveg', g: 200, note: 'frozen'}, {f: 'soy', g: 15}, {f: 'honey', g: 4}, {f: 'ginger', g: 6}, {f: 'garlic', g: 4}, {f: 'cornflour', g: 3}, {f: 'oil', g: 3}, {f: 'springon', g: 15}],
    spices: ['Chili flakes (optional)', 'Pepper'],
    steps: [
      'Noodles {eggnoodles}: cook as the pack says (usually 4 min in boiling water). Drain, rinse cold, toss with a few drops of the oil so they do not stick.',
      'Sauce in a cup: soy sauce {soy}, honey {honey}, grated ginger {ginger}, crushed garlic {garlic}, cornflour {cornflour} and 100 ml water.',
      'Wok or large pan, high heat, the rest of the oil {oil}. Beef {beef5}: break it up, 6–8 min until browned and no pink is left.',
      'Frozen stir-fry vegetables {wokveg} in, 5–6 min on high, stirring, until hot and the water has cooked off.',
      'Stir the sauce, pour it in, 1 min until glossy. Noodles in, toss 2 min. Sliced spring onions {springon} on top.',
      'Three boxes. Cool with the lids off, then lids on.',
    ],
    reheat: 'Pan with 2 tbsp water, lid on, medium heat, 5 min, toss halfway.',
    swap: 'Chicken breast strips instead of beef, same grams, 6 min in the pan.',
    look: 'glass meal-prep box of egg noodles tossed with browned minced beef, stir-fry vegetables (pepper strips, carrot, broccoli) and sliced spring onion'},

  goulash: {name: 'Paprika pork goulash with pasta', kind: 'main', minutes: 70, makes: 4, cuisine: 'German', fridge: 2,
    tagline: 'Slow-simmered, deep red and tender. Most of the time it cooks on its own.',
    ings: [{f: 'porkloin', g: 150}, {f: 'onion', g: 100}, {f: 'pepper', g: 100}, {f: 'tompaste', g: 20}, {f: 'stock', g: 3}, {f: 'oil', g: 7}, {f: 'garlic', g: 3}, {f: 'pasta', g: 50, note: 'dry'}, {f: 'quark', g: 40, note: 'on top'}],
    spices: ['3 tbsp sweet paprika', '1 tsp caraway (optional)', '1 tsp marjoram', 'Salt, pepper'],
    steps: [
      'Pork {porkloin} in 2 cm cubes. Onions {onion} diced, peppers {pepper} in strips, garlic {garlic} crushed.',
      'Big pot, high heat, oil {oil}. Pork in 2 rounds, 4 min each, until browned on all sides. Lift it out.',
      'Medium heat: onions 6–8 min until soft and golden (a splash of water if they stick). Garlic, tomato paste {tompaste}, paprika and caraway, 1 min. Do not let the paprika burn.',
      'Pork back in with the peppers, stock powder {stock}, marjoram and 600 ml water. Boil, then low, lid on, 45–50 min until the pork is tender. Lid off for the last 10 min to thicken. Salt, pepper.',
      'Pasta {pasta} in salted boiling water for the pack time. Drain.',
      'Tonight’s plate; the rest of the pasta and goulash into 3 boxes. Quark {quark}: 40 g on top of each portion when you eat it (it stays in its tub in the fridge).',
    ],
    reheat: 'Pot or pan with a splash of water, lid on, medium heat, 6–8 min until bubbling.',
    swap: 'Beef goulash meat (Rindergulasch) instead of pork: 60–70 min simmering.',
    look: 'deep plate with rich red-brown paprika pork goulash with pepper strips over pasta, a spoon of white quark on top'},

  chickencurry: {name: 'Chicken and spinach coconut curry with rice', kind: 'main', minutes: 40, makes: 3, cuisine: 'Asian', fridge: 1,
    tagline: 'Mild and creamy with light coconut milk, spinach and peas.',
    ings: [{f: 'chicken', g: 160}, {f: 'rice', g: 40, note: 'dry'}, {f: 'coconutlt', g: 65}, {f: 'choptom', g: 133}, {f: 'onion', g: 60}, {f: 'spinach', g: 100, note: 'frozen'}, {f: 'peas', g: 50, note: 'frozen'}, {f: 'garlic', g: 4}, {f: 'ginger', g: 5}, {f: 'oil', g: 3}],
    spices: ['2 tbsp mild curry powder', 'Salt', 'Lemon juice (optional)'],
    steps: [
      'Rice: rinse {rice}. Pot with {=rice*2} ml water and a pinch of salt, boil, then low, lid on, 12 min (parboiled rice: the time on the pack). Off the heat, lid on, 5 min.',
      'Chicken {chicken} in bite-size pieces. Onion {onion} diced; garlic {garlic} and ginger {ginger} grated.',
      'Big pan or pot, medium-high heat, oil {oil}: onion 4 min, then garlic, ginger and curry powder, 1 min.',
      'Chicken in, 4 min, stirring. Chopped tomatoes {choptom} (one can), coconut milk {coconutlt} (half a can: freeze the rest in a small box) and 100 ml water. Simmer 12 min, lid half on. Cut a piece open: white all through.',
      'Frozen spinach {spinach} and peas {peas} in, 5 min until hot. Salt.',
      'Tonight’s plate. The rest with rice into 2 boxes. Cool with the lids off, then lids on.',
    ],
    reheat: 'Pan with 3 tbsp water, lid on, medium heat, 6–7 min until steaming hot.',
    swap: 'Turkey breast instead of chicken, same grams.',
    look: 'bowl of creamy golden-orange chicken curry with spinach and green peas next to white rice'},

  turkeywedges: {name: 'Paprika turkey strips, wedges and green beans', kind: 'main', minutes: 40, makes: 2, cuisine: 'European', fridge: 2,
    tagline: 'All in the air fryer while the curry cooks on the hob. Garlic quark dip on the side.',
    ings: [{f: 'turkey', g: 170}, {f: 'potato', g: 220}, {f: 'beans', g: 150, note: 'frozen'}, {f: 'oil', g: 10}, {f: 'quark', g: 50, note: 'dip'}, {f: 'garlic', g: 3}],
    spices: ['Smoked paprika', 'Garlic powder', 'Rosemary', 'Salt, pepper'],
    steps: [
      'Potatoes {potato}: wash, cut into wedges (no need to peel), dry with a tea towel. Toss with two thirds of the oil {oil}, paprika, rosemary and salt. Air fryer 200 °C, 18–20 min, shake twice, until golden and soft inside.',
      'Turkey {turkey} in finger-thick strips, tossed with the rest of the oil, smoked paprika, garlic powder, salt, pepper. Air fryer 190 °C, 8–10 min, shake once. Cut the thickest strip: white all through.',
      'Green beans {beans}: boiling salted water, 6–7 min, drain.',
      'Dip: quark {quark}, crushed garlic {garlic}, salt and 1 tbsp water.',
      'Two boxes; dip in 2 small pots.',
    ],
    reheat: 'Wedges and turkey in the air fryer, 180 °C, 5–6 min (they go crisp again). Beans in a pan with a splash of water.',
    swap: 'Chicken breast instead of turkey, same grams, 10–12 min.',
    look: 'plate with golden potato wedges, paprika-seasoned turkey strips, green beans and a small bowl of white garlic dip'},

  burritobowl: {name: 'Chicken burrito bowl', kind: 'work', minutes: 30, makes: 1, cuisine: 'International', fridge: 1,
    tagline: 'Spiced chicken, rice and crunchy vegetables with a lime-quark dressing. Eaten cold.',
    ings: [{f: 'rice', g: 45, note: 'dry'}, {f: 'chicken', g: 160}, {f: 'pepper', g: 80}, {f: 'tomato', g: 80}, {f: 'lettuce', g: 40}, {f: 'quark', g: 50, note: 'dressing'}, {f: 'lemon', g: 10}, {f: 'oil', g: 9}],
    spices: ['Ground cumin', 'Smoked paprika', 'Chili powder', 'Garlic powder', 'Salt'],
    steps: [
      'Rice: rinse {rice}. Small pot with {=rice*2} ml water, boil, then low, lid on, 12 min (parboiled: the time on the pack), then 5 min off the heat. Spread it on a plate so it cools fast (10 min), then into the box.',
      'Chicken {chicken}: rub with 1 tsp of the oil, cumin, smoked paprika, chili, garlic powder and salt. Air fryer 190 °C, 14–16 min. Cut it open: white all through. Cool 10 min, slice.',
      'Pepper {pepper} and tomato {tomato} diced, lettuce {lettuce} shredded.',
      'Dressing in a small pot: quark {quark}, lemon or lime juice {lemon}, the rest of the oil {oil}, a pinch of salt and cumin.',
      'Box: rice, lettuce, vegetables, chicken. Fridge. Morning: into the insulated bag with 2 frozen ice packs.',
    ],
    look: 'glass box with white rice, sliced spiced chicken, diced red pepper and tomato, shredded lettuce, a small pot of white quark dressing'},

  kartoffelsalat: {name: 'German potato salad with ham and egg', kind: 'work', minutes: 30, makes: 1, cuisine: 'German', fridge: 1,
    tagline: 'Creamy Kartoffelsalat made with quark instead of mayonnaise. Better cold.',
    ings: [{f: 'potato', g: 250}, {f: 'ham', g: 100}, {f: 'egg', g: 55}, {f: 'cucumber', g: 100}, {f: 'onion', g: 20}, {f: 'quark', g: 70}, {f: 'mustard', g: 8}, {f: 'vinegar', g: 10}, {f: 'oil', g: 5}],
    spices: ['Dried dill', 'Salt, pepper'],
    steps: [
      'Potatoes {potato} in their skins in a pot of cold salted water. Boil, then medium, 18–20 min; the egg {egg} goes in for the last 10. Drain; egg into cold water.',
      'Peel the potatoes while warm (hold them with a fork) and slice them.',
      'Dressing: quark {quark}, mustard {mustard}, vinegar {vinegar}, oil {oil}, very finely diced onion {onion}, dill, salt, pepper and 2 tbsp water.',
      'Mix with the potatoes, diced ham {ham} and cucumber slices {cucumber}. Egg in quarters on top. Lid on, fridge.',
      'Morning: box into the insulated bag with 2 frozen ice packs. Eat it cold.',
    ],
    look: 'glass box of creamy German potato salad with diced ham, cucumber slices, dill and a quartered boiled egg'},
};

// The rotation. Each week: 1 breakfast + 1 snack for all 7 days, 4 batch dishes and 2 work boxes.
//   sunLunch  cooked Sunday (before the week): Mon, Tue, Thu lunch            (makes 3)
//   sunDinner cooked Sunday (before the week): Sun dinner, Mon, Tue, Wed      (makes 4)
//   thuDinner cooked Thursday:                 Thu, Fri, Sat dinner           (makes 3)
//   thuLunch  cooked Thursday:                 Sat, Sun lunch                 (makes 2)
//   wedBox    made Tuesday night, friBox made Thursday night                  (makes 1)
const WEEKS = [
  {breakfast: 'berrybowl', snack: 'cocoaquark', sunLunch: 'teriyaki', sunDinner: 'chili', thuDinner: 'pollock', thuLunch: 'salmonpasta', wedBox: 'chickenpastasalad', friBox: 'tunapotato'},
  {breakfast: 'appleoats', snack: 'herbdip', sunLunch: 'beefnoodles', sunDinner: 'goulash', thuDinner: 'chickencurry', thuLunch: 'turkeywedges', wedBox: 'burritobowl', friBox: 'kartoffelsalat'},
];
const PLAN_WEEKS = 8; // weeks 3–8 are written in stage 2b

// Maintenance week (diet break): these come on top of the normal day.
const BREAK_EXTRAS = [{f: 'toast', g: 56, note: '2 slices'}, {f: 'pbutter', g: 20}, {f: 'banana', g: 120, note: '1 banana'}, {f: 'oats', g: 50, note: 'extra in breakfast'}];

// Pictures he has made in the Gemini app and that are saved in pics/<id>.jpg.
const PICS = ['appleoats', 'beefnoodles', 'berrybowl', 'burritobowl', 'chickencurry', 'chickenpastasalad', 'chili', 'cocoaquark', 'goulash', 'herbdip', 'kartoffelsalat', 'nightquark', 'pollock', 'salmonpasta', 'teriyaki', 'tunapotato', 'turkeywedges'];
