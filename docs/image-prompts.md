# 🐝 Spelling Garden — Image Prompt Pack (for ChatGPT or Gemini)

Drop finished images into `images/incoming/` with the exact file names below, then run `node tools/prepare-images.mjs` (or ask Claude to).

## How to use it, for consistent results
1. **Use one tool for everything.** ChatGPT is recommended, because it can produce truly transparent PNGs. Use **one long chat**.
2. **Message 1 = the STYLE BIBLE + the BUZZY CHARACTER BIBLE** below. Then start every image prompt with *"Using the style bible and character bible above…"*. If the chat gets long and the style drifts, paste the bible again.
3. **Make the mascot reference sheet (M0) first.** Pick your favourite, and **attach it to every prompt that includes Buzzy**, adding *"same character as the attached reference, identical proportions and colours"*.
4. **Transparent background** for everything except the backgrounds and the app icon. If the tool gives a solid background instead, use the **chroma colour** listed, then on the Mac: **Finder → right-click the image → Quick Actions → Remove Background**.
5. **No text anywhere:** no letters, numbers, words, logos or watermarks. I add all text in code, in all three languages.
6. **Save with the exact file name shown**, into `images/incoming/`. I'll resize and place them.
7. **Before saving, check Buzzy:** 3 brown stripes · 2 antennae with round yellow tips · lavender scarf · pink cheeks · 2 sparkles in each eye · pale-blue wings. If anything is off, regenerate rather than "fixing" it.
8. Priority: ⭐ = needed first (Milestone 2), ⭐⭐ = nice to have, ⭐⭐⭐ = optional extra.

## STYLE BIBLE (paste in message 1)
> Style: flat vector sticker illustration for a children's educational app (ages 8–10). Clean simple shapes, thick smooth rounded outlines in dark chocolate brown (#3D2C29), flat colour fills with only one soft cel-shading tone and one small white highlight per shape. No gradients, no textures, no noise, no realistic detail, no 3D rendering. Cheerful, cute, friendly and warm. Use only this palette: honey yellow #FFC93C, warm orange #FF8C42, sky blue #5BC0EB, leaf green #7BD389, deep green #3FA34D, berry pink #FF6B9D, lavender purple #9B5DE5, cream #FFF8E7, white #FFFFFF, outline brown #3D2C29. Absolutely no text, letters, numbers, logos, signatures or watermarks. No white sticker border, no frame, no cast shadow on the background. Subject centred with a comfortable empty margin around it. Plants and objects have no faces; only the bee characters have faces.

## BUZZY CHARACTER BIBLE (paste in message 1)
> Buzzy is a small, round, chubby bumblebee: soft egg-shaped body slightly wider at the bottom, head and body as one round shape (no neck). Honey-yellow body (#FFC93C) with exactly three curved chocolate-brown stripes. Large glossy dark-brown eyes, each with two white sparkle highlights. Small rosy pink cheeks, a tiny happy curved smile. Exactly two short antennae with round honey-yellow tips. Two small rounded translucent pale-blue wings with white outlines. Short stubby brown arms and legs. Wears a small lavender-purple (#9B5DE5) scarf tied at the neck. Gentle, friendly, gender-neutral.

## M: Buzzy the mascot (1024×1024 PNG, transparent, full body, Buzzy fills about 75% of the height, the same scale in every pose) · chroma: sky blue
| ⭐ | File | Prompt (after "Using the style bible and character bible above…") |
|---|---|---|
| ⭐ | `mascot-M0-reference.png` | **Character reference sheet** of Buzzy: front view, three-quarter view, side view and back view standing in a row, identical size, evenly spaced, plain white background. |
| ⭐ | `mascot-wave.png` | Buzzy facing the viewer, waving hello with the right arm raised high, big warm smile, wings slightly open. |
| ⭐ | `mascot-listen.png` | Buzzy listening carefully: one hand cupped behind its ear, eyes looking up attentively, mouth in a small "o", leaning slightly to one side. |
| ⭐ | `mascot-think.png` | Buzzy thinking: one finger tapping its chin, eyes glancing up to the side, small thoughtful smile. |
| ⭐ | `mascot-cheer.png` | Buzzy jumping for joy, both arms up, happy closed eyes shaped like upside-down U's, big open-mouth smile, three small yellow star shapes around it. |
| ⭐ | `mascot-oops.png` | Buzzy being encouraging after a small mistake: gentle sheepish smile, one hand scratching the back of its head, the other hand giving a thumbs up. Kind and hopeful, not sad. |
| ⭐ | `mascot-trophy.png` | Buzzy proudly holding a shiny gold trophy cup above its head with both hands, big smile, eyes sparkling. |
| ⭐⭐ | `mascot-read.png` | Buzzy sitting and holding a big open book with blank pages, looking at it happily. |
| ⭐⭐ | `mascot-point.png` | Buzzy facing the viewer, pointing to the right side with one arm stretched out, friendly smile. |
| ⭐⭐ | `mascot-fly.png` | Buzzy flying, side view facing right, arms stretched forward like a little superhero, wings spread, happy face. |
| ⭐⭐ | `mascot-sleep.png` | Buzzy curled up asleep on a big green leaf, eyes closed, peaceful smile, hands under its cheek. |
| ⭐ | `mascot-face.png` | Close-up of Buzzy's head and upper body only, facing the viewer, big happy smile. |

## Profile avatars (1024×1024, transparent, head-and-shoulders, attach `mascot-face.png`) ⭐⭐
> Same character as the attached reference, same pose and framing, but change only the colours: body colour **[X]** with chocolate-brown stripes, scarf colour **[Y]**.

`avatar-honey.png` (honey yellow / lavender, the original) · `avatar-pink.png` (soft pink #FF9EC0 / honey yellow) · `avatar-mint.png` (mint #9EE6B8 / berry pink) · `avatar-sky.png` (light blue #9AD8F5 / warm orange) · `avatar-lavender.png` (light lavender #C7A6F2 / leaf green) · `avatar-peach.png` (peach #FFB98A / sky blue)

## App icon ⭐ (1024×1024, NOT transparent)
`icon-app.png`: Buzzy's happy face (as in `mascot-face.png`) centred on a solid honey-yellow (#FFC93C) square background, with a few small white five-petal flower shapes in the corners. Keep the face inside the central 60% of the image. No text.

## A: Small flying bee for background animation ⭐ (512×512, transparent)
`bee-flyer.png`: a tiny simple worker bee in the same style, side view facing right, round striped body, small smile, **without any wings** (wings will be added by animation code). No scarf, so it reads as a background bee rather than Buzzy.

## F: Sunflower reveal set ⭐ (1024×1536 portrait, transparent, stem base at the bottom centre, same plant in every image) · chroma: sky blue
Generate **F0 first** as a consistency guide, then each stage separately with F0 attached: *"same sunflower as stage N in the attached sheet, alone, stem base at the bottom centre of the canvas, identical scale."*
| File | Prompt |
|---|---|
| `sunflower-F0-sheet.png` | Five growth stages of the same sunflower in a row, left to right, evenly spaced, identical scale, all standing on one baseline with a small tuft of grass at each base: (1) tiny green sprout with two round leaves, (2) tall stem with leaves and a closed green bud, (3) bud half-open with bright yellow petals peeking out, (4) full bloom with a big brown seed centre and bright honey-yellow petals, (5) the same full sunflower with its head gently bowed and leaves slightly drooping, still yellow and healthy, not wilted. White background. |
| `sunflower-1-sprout.png` | Stage 1 alone. |
| `sunflower-2-bud.png` | Stage 2 alone. |
| `sunflower-3-half.png` | Stage 3 alone. |
| `sunflower-4-bloom.png` | Stage 4 alone. |
| `sunflower-5-droop.png` | Stage 5 alone: gently bowed, still bright and healthy, **not sad, not dead**. |

## N: Nature pieces for animation (512×512, transparent, one object per image)
| ⭐ | File | Prompt | Chroma |
|---|---|---|---|
| ⭐ | `petal-yellow.png` | A single sunflower petal, slightly curved. | sky blue |
| ⭐ | `petal-pink.png` | A single soft pink rounded flower petal. | sky blue |
| ⭐ | `petal-white.png` | A single white flower petal with a faint cream shade. | **sky blue** (needed for white) |
| ⭐ | `leaf-1.png` | A simple oval leaf, leaf green, with a centre vein. | sky blue |
| ⭐ | `leaf-2.png` | A heart-shaped light-green leaf. | sky blue |
| ⭐ | `leaf-3.png` | A long slender deep-green leaf. | sky blue |
| ⭐⭐ | `leaf-4.png` | A small round yellow-green leaf with a short stem. | sky blue |
| ⭐ | `cloud-1.png` | A big fluffy cartoon cloud, white with a soft pale blue-grey shade underneath. Wide shape (1024×512). | **sky blue** |
| ⭐ | `cloud-2.png` | A small long flat cloud (1024×512). | sky blue |
| ⭐ | `cloud-3.png` | A medium puffy round cloud (1024×512). | sky blue |
| ⭐⭐ | `grass-1.png` / `grass-2.png` | A tuft of grass blades, leaf green and deep green (grass-2: wider, with two tiny flowers). | sky blue |
| ⭐⭐ | `flower-small-pink.png` / `flower-small-purple.png` | A tiny five-petal flower, berry pink / lavender, with a yellow centre. | sky blue |
| ⭐⭐ | `butterfly-pink.png` / `butterfly-blue.png` | A cute butterfly seen from the front with wings fully open, pink/blue wings with honey-yellow dots. | white |
| ⭐⭐ | `honey-drop.png` | A glossy golden honey drop. | sky blue |
| ⭐⭐ | `honey-pot.png` | A round clay honey pot with honey dripping over the rim and a wooden dipper (used as the score counter). | sky blue |
| ⭐⭐ | `watering-can.png` | A cute watering can in sky blue, tilted, with a few water drops. | white |
| ⭐⭐ | `beehive.png` | A round cosy beehive hanging from a short branch, honey-yellow and orange layers, small round door. | sky blue |

## B: Background scenes (layered so they can move at different depths; landscape 1536×1024 or 16:9; keep important details near the middle, because phones crop the sides)
| ⭐ | File | Prompt |
|---|---|---|
| ⭐ | `scene-hills-far.png` | Wide band of soft, rolling, far-away hills in pale green and pale blue-green, very simple, with a few tiny distant round trees, occupying only the **bottom 45%** of the canvas. Top 55% completely empty and transparent (no sky). |
| ⭐ | `scene-hills-near.png` | Rolling bright-green meadow hills in the foreground occupying only the **bottom 35%**, with a few small dotted flowers in pink, purple and yellow. Top 65% transparent. |
| ⭐ | `scene-grass-front.png` | A strip of tall grass blades and small flowers along the very **bottom 15%** edge, left to right across the full width. Everything above is transparent. |
| ⭐⭐ | `scene-hive-tree.png` | A friendly round tree with a beehive hanging from one branch, standing on a small grassy mound. Transparent background (placed at the side of the home screen). |
| ⭐⭐ | `scene-hive-inside.png` | Full background, not transparent: the warm cosy inside of a beehive, honeycomb walls in honey-yellow and orange, soft glowing light, a few honey drips. Keep the centre calm and plain for text on top. |
| ⭐⭐ | `scene-garden-bed.png` | Garden background: a wide flat bed of soft brown soil across the bottom half with a white wooden picket fence behind it and grass edges. Soil left empty (flowers are added by code). Top half transparent. |

The sky gradient, sun and sun rays are drawn in code.

## G: Garden flowers for "My Garden" ⭐⭐ (1024×1536 portrait, transparent, all the same height, stem base at the bottom centre, small grass tuft at the base, attach `sunflower-4-bloom.png` for style)
| Language | Files and prompts |
|---|---|
| All | `garden-sprout.png`: a small seedling with two leaves (for words still growing) |
| English | `garden-sunflower.png` (reuse `sunflower-4-bloom.png`) · `garden-tulip.png`: a berry-pink tulip · `garden-daisy.png`: a cluster of three white daisies with yellow centres |
| Bangla | `garden-shapla.png`: a white shapla water lily (national flower of Bangladesh) on a round lily pad in a tiny pond puddle · `garden-marigold.png`: a bunch of orange marigold (gada) flowers · `garden-tagar.png`: white টগর (crape jasmine) flowers with pinwheel-shaped petals on a green shrub |
| Arabic | `garden-jasmine.png`: a sprig of small white jasmine flowers · `garden-rose.png`: a pink damask rose · `garden-datepalm.png`: a small young date-palm with a cluster of orange-brown dates |

## C: Home menu cards ⭐⭐ (1024×1024, transparent, attach the Buzzy reference where Buzzy appears)
- `card-practice.png`: Buzzy wearing small round headphones, standing happily next to a blooming sunflower.
- `card-hive.png`: The cosy beehive with a big magnifying glass leaning against it.
- `card-garden.png`: A sky-blue watering can watering a little row of colourful flowers.
- `card-mock.png`: A small wooden stage with a microphone stand and a gold star above it.
- `card-parent.png`: A friendly wise owl wearing round glasses, holding a clipboard with blank paper.
- *(Later, Phase 2 games: `card-game-savebee.png`, `card-game-scramble.png`, `card-game-speed.png` (stopwatch), `card-game-missing.png` (puzzle pieces).)*

## Badges ⭐⭐ (1024×1024, transparent, a round medallion with a thick rim and a simple flat icon inside, no text, the same medallion design for all, only the colours and icon change)
> Using the style bible above: a round achievement badge medallion with a thick **[RIM COLOUR]** rim and a cream inner circle containing **[ICON]**, simple and bold, with a small ribbon tail at the bottom. No text or numbers.

| File | Rim | Icon |
|---|---|---|
| `badge-first-bloom.png` | leaf green | a tiny sprout with two leaves |
| `badge-ten-right.png` | honey yellow | a blooming sunflower |
| `badge-perfect.png` | gold/honey | a big shining star |
| `badge-streak-3.png` | warm orange | a small friendly flame |
| `badge-streak-7.png` | berry pink | a big flame with a little rainbow |
| `badge-hive-hero.png` | honey yellow | a honeycomb with a small shield |
| `badge-english.png` | sky blue | a sunflower and an open book |
| `badge-bangla.png` | deep green | a white shapla water lily |
| `badge-arabic.png` | lavender | a sprig of white jasmine |
| `badge-all-three.png` | rainbow segments | a bouquet of sunflower, shapla and jasmine |
| `badge-champion.png` | gold | a gold trophy with laurel leaves |

## W: Word picture hints ⭐⭐⭐ optional (1024×1024, transparent)
> Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing **[SUBJECT]**. Clear and instantly recognisable. No text, numbers or letters.

Buzzy acts out the actions and feelings (attach the reference). Words marked "skip" are abstract and use the meaning text instead.
**⚠️ Count check:** AI often gets counts wrong, so check images that show numbers of things (seven, two).

**English** (file `word-en-<word>.png`): bed: a cosy bed with a pillow and blanket · milk: a glass of milk beside a blank milk carton · recovered: Buzzy healthy again, stretching happily, with a get-well flower beside it · boat: a small wooden rowing boat on gentle waves · bowl: a round blue bowl with a spoon · river: a winding river through green fields · dune: a golden sand dune under a blue sky · pattern: a square tile with a repeating zig-zag and dot pattern · mountain: a tall mountain with a snowy peak · droplet: one shiny water droplet · scooter: a child's kick scooter · village: a small village with houses and trees · estimate: Buzzy looking at a big jar of colourful marbles, thinking · stinky: an old sock with green wavy smell lines and a fly · mango: a ripe mango with a leaf · giraffe: a giraffe · present: a wrapped gift box with a big ribbon · spill: a tipped-over glass with milk spilling on a table · quiet: Buzzy with a finger on its lips, beside a sleeping kitten · finder: Buzzy with a magnifying glass finding a shiny key in the grass · grasslands: a wide grassy plain with tall grass and a zebra far away · masked: Buzzy wearing a colourful eye mask · dancers: two little bees twirling happily · heavy: Buzzy straining to lift a big rock · surprise: Buzzy with a surprised face, hands on cheeks, as a gift box pops open

**Bangla** (file `word-bn-NN.png`, numbered as on the list): 01 প্রথম: Buzzy on the top step of a winners' podium wearing a gold medal · 02 শ্রেণি: a bright classroom with small desks and a blank blackboard · 03 বিদ্যালয়: a cheerful school building with a bell · 04 সহপাঠী: two little bees with backpacks walking side by side · 05 বিজয়: Buzzy waving a small Bangladesh flag (green with a red circle) on a hill with fireworks · 06 দোয়েল: a black-and-white magpie-robin on a branch · 07 টগর ফুল: white crape-jasmine flowers with pinwheel petals · 08 আতা ফল: a green custard apple (sugar apple) · 09 রাখাল: Buzzy in a small straw hat leading a cow across a green field · 10 বাঁশি: a bamboo flute · 11 গ্রামবাসী: a village of thatched-roof huts with a few friendly bees as villagers · 12 বাংলাদেশ: green paddy fields, a river with a small boat, and a shapla lily · 13 ঐরাবত: a big friendly white elephant · 14 ব্যাঙ: a green frog on a lily pad · 15 রুপালি: a shiny silver hilsa fish · 16 লাঙল: a traditional wooden plough · 17 মঙ্গলবার: skip · 18 চমৎকার: Buzzy giving a big thumbs up with sparkles · 19 শীতকাল: Buzzy wrapped in a warm shawl on a foggy winter morning, holding a steaming cup · 20 কাঁঠাল: a big green jackfruit

**Arabic** (file `word-ar-NN.png`): 01 وَالِدٌ: a big father bee holding hands with little Buzzy · 02 أُخْتٌ: two bee sisters hugging, one with a pink scarf · 03 سَبْعَةٌ: exactly seven red apples in a neat row · 04 اِثْنَانِ: exactly two red apples · 05 مَرِيضٌ: Buzzy in bed with a thermometer and a tired face · 06 حِذَاءٌ: a pair of shoes · 07 يَوْمٌ: a bright sun over a green field in the daytime · 08 نَعَمْ: Buzzy nodding with a big smile next to a green tick mark · 09 قَلَمٌ: a pen · 10 هٰذِهِ: Buzzy pointing at a single pink flower

## Quick count
- ⭐ Priority (≈ 30 images): Buzzy 8, icon 1, flying bee 1, sunflower 6, nature 9, scene layers 3
- ⭐⭐ Nice to have (≈ 45): avatars, extra nature pieces, scenes, garden flowers, cards, badges
- ⭐⭐⭐ Optional (≈ 54): word pictures

## Honey Shop items (optional) ⭐⭐⭐
The shop already has hand-drawn hats and decorations. To replace any of them with your own art, use the template below (1024×1024, transparent) and save with the file name shown.
> Using the style bible above: a single [ITEM], flat vector sticker, centred, no text, transparent background.

**Hats** (drawn front-on, as if sitting on a head; the bottom edge is where it touches the head): `hat-flower.png` flower crown · `hat-bow.png` big pink bow · `hat-party.png` striped party hat · `hat-sunhat.png` straw sun hat with a lavender ribbon · `hat-grad.png` graduation cap with a honey-yellow tassel · `hat-crown.png` small golden crown with gems

**Garden decorations:** `decor-ladybug.png` · `decor-butterfly.png` · `decor-wateringcan.png` · `decor-birdhouse.png` · `decor-pond.png` (small pond with a duck) · `decor-rainbow.png` (rainbow with two little clouds)
