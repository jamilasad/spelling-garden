# 🐝 Spelling Garden: Image Prompts

One list, in order. **Made so far** records what's already in the app. **Still to make** has ready-to-paste prompts, most useful first. Everything in "Still to make" is optional: the app already looks complete without it.

**How to add new images:** save them with the exact file name into `images/incoming/`, then ask Claude to "add the new images" (it runs `tools/prepare-images.mjs` and `tools/optimize-images.mjs`).

---

## ✅ Made so far (26 images, all in the app)
| Image | File | Used for |
|---|---|---|
| Buzzy, 7 poses | `mascot-wave`, `-listen`, `-think`, `-cheer`, `-oops`, `-trophy`, `-face` | Home, practice, learn, summary, dialogs; the face is also the player avatar |
| App icon | `icon-app` | Home-screen icon on phones and tablets |
| Sunflower, 5 stages | `sunflower-1-sprout` … `sunflower-5-droop` | The bloom / "not yet" moment, the garden, the hero card |
| Flying bee | `bee-flyer` | The worker bees in the sky (wings are drawn by code) |
| Petals ×3, leaves ×3 | `petal-yellow/pink/white`, `leaf-1/2/3` | Falling petals and leaves; leaves cover the letter tiles |
| Clouds ×3 (Gemini) | `cloud-1/2/3` | Drifting clouds (blue background removed) |
| Scene layers ×3 | `scene-hills-far`, `scene-hills-near`, `scene-grass-front` | The garden background on every screen |

Reference sheets (not in the app, kept for consistency): `docs/art-reference/mascot-M0-reference.png`, `sunflower-F0-sheet.png`.

---

## 🟡 Still to make, in order

**Before you start:** open a ChatGPT chat. If it's a **new** chat, paste **Message 1** first. If you continue the chat where you made Buzzy, skip it. For prompts marked 📎, attach `docs/art-reference/mascot-M0-reference.png`.

### Message 1 (only in a new chat)
```
I'm making a set of matching illustrations for a children's spelling app. Please follow ALL of these rules for EVERY image I ask for in this chat. I will ask for one image at a time. Reply "Ready" and wait for my first request.

STYLE BIBLE: Flat vector sticker illustration for a children's educational app (ages 8–10). Clean simple shapes, thick smooth rounded outlines in dark chocolate brown (#3D2C29), flat colour fills with only one soft cel-shading tone and one small white highlight per shape. No gradients, no textures, no noise, no realistic detail, no 3D rendering. Cheerful, cute, friendly and warm. Use only this palette: honey yellow #FFC93C, warm orange #FF8C42, sky blue #5BC0EB, leaf green #7BD389, deep green #3FA34D, berry pink #FF6B9D, lavender purple #9B5DE5, cream #FFF8E7, white #FFFFFF, outline brown #3D2C29. Absolutely no text, letters, numbers, logos, signatures or watermarks. No white sticker border, no frame, no cast shadow on the background. Subject centred with a comfortable empty margin around it. Plants and objects have no faces; only the bee characters have faces. Use a transparent background unless I say otherwise.

CHARACTER BIBLE — "Buzzy": exactly like the attached reference image — a small, round, chubby honey-yellow bumblebee with chocolate-brown stripes, big glossy brown eyes with white sparkles, pink cheeks, two antennae with round yellow tips, small pale-blue wings and a lavender-purple scarf.
```

### Step 1 · Logo emblem (only if you choose logo style 3 in the mockup)
#### `logo-emblem.png` 📎
```
Same character as the attached reference. Buzzy peeking out happily from behind a big blooming sunflower, waving one hand. Compact, roughly square composition that reads well when small. Square 1024×1024, transparent background. No text.
```

### Step 2 · Garden flowers (My Garden shows these when Bangla and Arabic words bloom; English words already use the sunflower)
#### `garden-shapla.png`
```
Using the style bible above: a white shapla water lily (the national flower of Bangladesh) on a round green lily pad in a tiny pond puddle, small tuft of grass at the base. Portrait 2:3 (1024×1536), the flower's base at the bottom centre, transparent background. No faces, no text.
```
#### `garden-jasmine.png`
```
Using the style bible above: a sprig of small white jasmine flowers on a short green stem with leaves, small tuft of grass at the base. Portrait 2:3 (1024×1536), the stem base at the bottom centre, same height as a sunflower stage 4, transparent background. No faces, no text.
```

### Step 3 · Badges (replace the drawn medallions in My Garden)
Make all 11 in a row so they match each other.

### `badge-first-bloom.png`
```
Using the style bible above: a round achievement badge medallion with a thick leaf green rim and a cream inner circle containing a tiny sprout with two leaves. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-ten-right.png`
```
Using the style bible above: a round achievement badge medallion with a thick honey yellow rim and a cream inner circle containing a blooming sunflower. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-perfect.png`
```
Using the style bible above: a round achievement badge medallion with a thick gold rim and a cream inner circle containing a big shining star. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-streak-3.png`
```
Using the style bible above: a round achievement badge medallion with a thick warm orange rim and a cream inner circle containing a small friendly flame. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-streak-7.png`
```
Using the style bible above: a round achievement badge medallion with a thick berry pink rim and a cream inner circle containing a big flame with a little rainbow. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-hive-hero.png`
```
Using the style bible above: a round achievement badge medallion with a thick honey yellow rim and a cream inner circle containing a honeycomb with a small shield. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-english.png`
```
Using the style bible above: a round achievement badge medallion with a thick sky blue rim and a cream inner circle containing a sunflower and an open book. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-bangla.png`
```
Using the style bible above: a round achievement badge medallion with a thick deep green rim and a cream inner circle containing a white water lily (shapla). Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-arabic.png`
```
Using the style bible above: a round achievement badge medallion with a thick lavender purple rim and a cream inner circle containing a sprig of white jasmine. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-all-three.png`
```
Using the style bible above: a round achievement badge medallion with a thick rainbow-coloured segments rim and a cream inner circle containing a little bouquet of a sunflower, a white water lily and white jasmine. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### `badge-champion.png`
```
Using the style bible above: a round achievement badge medallion with a thick gold rim and a cream inner circle containing a gold trophy with laurel leaves. Simple and bold, with a small ribbon tail at the bottom. Square 1024×1024, transparent background. No text or numbers.
```

### Step 4 · Word pictures (the 🖼 "Picture" hint in practice and in Learn)
⚠️ AI often miscounts. Check the apple pictures for 7 and 2.

**English**
- **`word-en-01.png`** (bed)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a cosy bed with a pillow and a blanket. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-02.png`** (milk)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a glass of milk next to a milk carton with no writing on it. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-03.png`** (recovered) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy healthy and happy again, stretching, with a get-well flower beside it. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-04.png`** (boat)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a small wooden rowing boat on gentle waves. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-05.png`** (bowl)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a round blue bowl with a spoon. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-06.png`** (river)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a winding river through green fields. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-07.png`** (dune)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a golden sand dune under a blue sky. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-08.png`** (pattern)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a square tile with a repeating zig-zag and dot pattern. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-09.png`** (mountain)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a tall mountain with a snowy peak. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-10.png`** (droplet)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing one shiny water droplet. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-11.png`** (scooter)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a child's kick scooter. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-12.png`** (village)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a small village with houses and trees. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-13.png`** (estimate) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy looking at a big jar of colourful marbles, thinking. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-14.png`** (stinky)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing an old sock with green wavy smell lines and a fly. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-15.png`** (mango)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a ripe mango with a leaf. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-16.png`** (giraffe)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a giraffe. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-17.png`** (present)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a wrapped gift box with a big ribbon. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-18.png`** (spill)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a tipped-over glass with milk spilling on a table. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-19.png`** (quiet) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy with a finger on its lips, next to a sleeping kitten. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-20.png`** (finder) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy with a magnifying glass finding a shiny key in the grass. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-21.png`** (grasslands)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a wide grassy plain with tall grass and a zebra far away. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-22.png`** (masked) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy wearing a colourful eye mask. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-23.png`** (dancers) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing two little bees twirling happily. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-24.png`** (heavy) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy straining to lift a big rock. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-en-25.png`** (surprise) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy with a surprised face, hands on cheeks, as a gift box pops open. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```

**Bangla**
- **`word-bn-01.png`** (প্রথম) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy on the top step of a winners' podium wearing a gold medal. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-02.png`** (শ্রেণি)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a bright classroom with small desks and a blank blackboard. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-03.png`** (বিদ্যালয়)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a cheerful school building with a bell. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-04.png`** (সহপাঠী) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing two little bees with backpacks walking side by side. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-05.png`** (বিজয়) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy waving a small Bangladesh flag (green with a red circle) on a hill with fireworks. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-06.png`** (দোয়েল)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a black-and-white magpie-robin bird on a branch. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-07.png`** (টগর ফুল)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing white crape-jasmine flowers with pinwheel-shaped petals. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-08.png`** (আতা ফল)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a green custard apple (sugar apple) fruit. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-09.png`** (রাখাল) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy in a small straw hat leading a cow across a green field. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-10.png`** (বাঁশি)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a bamboo flute. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-11.png`** (গ্রামবাসী) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a village of thatched-roof huts with a few friendly bees as villagers. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-12.png`** (বাংলাদেশ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing green paddy fields, a river with a small boat, and a white water lily. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-13.png`** (ঐরাবত)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a big friendly white elephant. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-14.png`** (ব্যাঙ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a green frog on a lily pad. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-15.png`** (রুপালি)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a shiny silver hilsa fish. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-16.png`** (লাঙল)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a traditional wooden plough. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- `word-bn-17.png` (মঙ্গলবার): skip, this word is abstract (the meaning text is used instead)
- **`word-bn-18.png`** (চমৎকার) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy giving a big thumbs up with sparkles. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-19.png`** (শীতকাল) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy wrapped in a warm shawl on a foggy winter morning, holding a steaming cup. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-bn-20.png`** (কাঁঠাল)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a big green jackfruit. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```

**Arabic**
- **`word-ar-01.png`** (وَالِدٌ) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a big father bee holding hands with little Buzzy. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-02.png`** (أُخْتٌ) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing two bee sisters hugging, one with a pink scarf. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-03.png`** (سَبْعَةٌ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing exactly seven red apples in a neat row (count them: 7). Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-04.png`** (اِثْنَانِ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing exactly two red apples (count them: 2). Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-05.png`** (مَرِيضٌ) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy in bed with a thermometer and a tired face. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-06.png`** (حِذَاءٌ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a pair of shoes. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-07.png`** (يَوْمٌ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a bright sun over a green field in the daytime. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-08.png`** (نَعَمْ) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy nodding with a big smile next to a green tick mark. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-09.png`** (قَلَمٌ)
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing a pen. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```
- **`word-ar-10.png`** (هٰذِهِ) 📎
  ```
  Using the style bible and character bible above: a single simple illustration for a children's vocabulary card showing Buzzy pointing at a single pink flower. Clear and instantly recognisable. Square 1024×1024, transparent background. No text, numbers or letters.
  ```

### Step 5 · Honey Shop items (optional; the shop already has drawn versions)
```
Using the style bible above: a single [ITEM], flat vector sticker, centred, square 1024×1024, transparent background. No text.
```
- **Hats** (front-on, bottom edge is where it touches the head): `hat-flower.png` flower crown · `hat-bow.png` big pink bow · `hat-party.png` striped party hat · `hat-sunhat.png` straw sun hat with a lavender ribbon · `hat-grad.png` graduation cap with a honey-yellow tassel · `hat-crown.png` small golden crown with gems
- **Garden decorations:** `decor-ladybug.png` · `decor-butterfly.png` · `decor-wateringcan.png` · `decor-birdhouse.png` · `decor-pond.png` small pond with a duck · `decor-rainbow.png` rainbow with two little clouds

### Step 6 · Player avatars (optional; the app currently tints Buzzy's face)
#### `avatar-pink.png`, `avatar-mint.png`, `avatar-sky.png`, `avatar-lavender.png`, `avatar-peach.png` 📎 (attach `mascot-face`)
```
Same character and framing as the attached image, but change only the colours: body colour [pink #FF9EC0 / mint #9EE6B8 / light blue #9AD8F5 / light lavender #C7A6F2 / peach #FFB98A] with chocolate-brown stripes. Square 1024×1024, transparent background. No text.
```

---

## ⛔ No longer needed
These were in the first plan, but the app doesn't use them, so skip them: extra Buzzy poses (`mascot-read`, `-point`, `-fly`, `-sleep`), menu cards (`card-*`), `scene-hive-tree`, `scene-hive-inside`, `scene-garden-bed`, `grass-*`, `flower-small-*`, `butterfly-*`, `honey-drop`, `honey-pot`, `watering-can`, `beehive`, `garden-sprout`, and the other garden flowers (`garden-tulip`, `-daisy`, `-marigold`, `-tagar`, `-rose`, `-datepalm`).
