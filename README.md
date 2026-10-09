# 🐝 Spelling Garden

A colorful spelling bee practice app for English, Bangla and Arabic words. Everything runs from this folder on your Mac: nothing is uploaded anywhere.

## Start it
1. Double-click **`Start Spelling Garden.command`**. A Terminal window opens and the app opens in your browser.
   *(The first time, macOS may ask for permission. Right-click the file, choose **Open**, then **Open** again.)*
2. **On her iPad or phone:** make sure it's on the same Wi-Fi, then type the address shown in the Terminal window (it looks like `http://192.168.x.x:8080`) into Safari. Use Share → **Add to Home Screen** to get an app icon.
3. Keep the Terminal window open while she practices. Close it (or press Ctrl+C) to stop.

## Learning the words first
- **My word list:** all words together, or one language at a time (English, বাংলা, العربية). Tap 🔊 to hear a word, or tap the word to learn it. **Print** gives a clean memory sheet with the tricky parts marked, one language per page.
- **Learn words:** Look → Say → Cover → Write → Check. She sees the word, spells along as the letters light up, the leaves cover it, she writes it from memory on paper, then checks. Learning doesn't affect her test results; afterwards, **Test myself** quizzes the same words.

## Games and spelling aloud
- **Missing letters** (home screen): the tricky parts of a word disappear, and she picks the right piece from three look-alikes (ি/ী, ন/ণ, ة/ه, missing harakat, b/d…).
- **How to say each piece (Bangla):** the school way of spelling aloud, e.g. মঙ্গলবার → ম · উঁয়ো-এ গ · ল · ব-এ আ-কার · র. In Learn words, tap any hexagon to see how that piece is said (and the Say step shows each name as the tiles light up); the word list shows the full spelling under each Bangla word. Spoken letter names are planned for later.
- **Narrators:** each language has several voices (Settings → Narrators). During practice, "Other voice" plays the word in the next voice.

## Parent report
Parent Corner → **Report**: days practiced, words practiced, right answers, time in the app, a chart of answers per day, readiness per language (not started / tricky / learning / blooming), focus words and suggestions. Printable.

## My Garden (build your own)
Home → **My Garden**. She builds her own garden with honey and learned words:
- **Buy** flowers, trees, garden pieces, water and big goals (like Buzzy's home) from the shelf. Each item needs honey **and** a number of **blooming (learned) words** to unlock, so completing the garden means learning nearly all the words.
- **Drag** anything anywhere. **Tap** an item for **－ / ＋** (5 sizes), **Flip** or **To bag** (put away, place again later from "My bag").
- **Word treasures:** when a word starts blooming she wins a matching item for free (mango → mango tree, বিজয় → flag, ব্যাঙ → frog…).
- **Mystery seed:** a full practice session (5+ words) gives one seed a day; it grows into a surprise flower the next day.
- **Saving goal:** pick a big item to save honey for.
- **More garden** opens at 10 blooming words. **Visitors** (butterflies, ladybug, duck, rabbit, snail) arrive as the garden grows.
- Items without an illustration yet use a simple drawn stand-in until the images from `docs/image-prompts/02` and `03` are added.

## Honey Pot
Every word she gets right earns a **honey drop**, up to **2 drops per word per day** (across practice, Learn and games), so honey comes from practising many different words. A "Not yet" never takes honey away.
- **Honey jars:** every 25 drops fills a jar.
- **Today's goal:** collect 20 drops a day (change it in Settings: 10, 20 or 30), with a celebration when she reaches it.
- **Honey Shop:** spend drops on hats for Buzzy and special bee colours (silver, gold, rainbow). Garden things are bought in **My Garden**.

## How she practices
1. **Hear the word.** It plays automatically, and she can tap again, slowly, meaning, sentence or word type.
2. **She writes it on paper** (or spells it aloud).
3. **She holds the button** to see the answer. Leaves fly off each letter so she can compare letter by letter.
4. **She checks herself:** 🌻 *I got it!* or 🌱 *Not yet*. "Not yet" words come back later in the same session and stay in the **Tricky Words Hive** until they're strong.

- **Today's practice** mixes words due for review with new words, about 15 a day.
- **Mock contest** has no hints and an optional timer, like the real stage.

## Parent Corner
Hold the 🔒 button on the home screen (or the button in Settings) for about a second.
- **Word check:** compare every word with the paper list and tick it. Play each pronunciation, and press **Record** to replace any that sound wrong with your own voice. Recording works on the Mac at `http://localhost:8080`.
- **Progress:** see which words she misses most.
- **Print:** practice sheets with writing lines (tricky words or the full list).

## Adding the illustrations
1. Make images with the prompts in `docs/image-prompts/` (start with `README.md` there). Each group has its own file with tick boxes.
2. Save them with the exact file names into `images/incoming/`.
3. In Terminal, from this folder, run `node tools/prepare-images.mjs`, then `node tools/optimize-images.mjs` (makes them much smaller), and reload the app. Or ask Claude to "add the new images".

Anything you haven't made yet stays as a placeholder drawing.

## Put it online (GitHub Pages)
Online, it works fully offline on every device after the first visit, with no Mac needed.
1. On github.com, create a new **public** repository (for example `spelling-garden`) without a README.
2. In Terminal, from this folder:
   ```
   git remote add origin https://github.com/YOUR-NAME/spelling-garden.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` → Save**.
4. After a minute or two the app is at `https://YOUR-NAME.github.io/spelling-garden/`.
5. On her iPad, open it in Safari → Share → **Add to Home Screen**.

Things to know about the online version:
- **The website is public:** anyone with the link can open it. The word-list photos (`WordList/`) are never uploaded (see `.gitignore`) because they show the school's name. Umamah is set up as the default player (`data/app-config.json`); others can add their own name on their device.
- **Recording works only on the Mac:** record pronunciations on the Mac version first, then upload. Your recordings in `audio/rec/` become part of the website.
- **Updates:** change things on the Mac, then `git add -A && git commit -m "…" && git push`. Devices pick up the update the next time they open the app online.

## Good to know
- **Progress is saved in each device's browser.** Use Settings → **Save backup** now and then, and **Load backup** to move progress to another device.
- **Pronunciations:** natural Microsoft voices, generated once and stored in `audio/` (made louder and even for tablets). Narrators are listed in `data/voices.json` (the first one per language is the default). When a voice says a word wrongly, give it a hint spelling in the word's data — `"say": "লাঙোল"` (the screen still shows লাঙল) — or a different voice for that word — `"voice": "bn-IN-TanishaaNeural"` — then rebuild that word: `node tools/build-audio.mjs --force --only=bn-16`. You can also record your own voice in Word check. One-time setup for the natural voices: `python3 -m venv .venv && .venv/bin/pip install edge-tts`.
- **Offline:** on the Mac the app keeps working without internet. When the Mac serves it over Wi-Fi, the iPad and phone only work while the Mac is running. Once it's on GitHub Pages (above), every device works fully offline.
- **Contest date** is set to 22 Oct 2026. Change it in Settings.

## Sound credits
All garden sounds are real recordings released into the public domain (CC0):
- Morning garden birdsong (`audio/garden/garden-morning.m4a`): "Morning birds in garden village Chambon-sur-Cisse" by bruno.auzet, https://freesound.org/people/bruno.auzet/sounds/851792/ (shortened to a 1-minute loop)
- Bee buzz (`audio/garden/bee-buzz.m4a`): "Solitary bees or flies" by Joseph Sardin, BigSoundBank, https://bigsoundbank.com/solitary-bees-or-flies-s0101.html

Turn garden sounds off in Settings → "Garden sounds". They fade almost to silence whenever a word is spoken and are off in the Mock contest.

## For developers
- Plain HTML/CSS/JavaScript, no build step. `tools/server.mjs` is a zero-dependency Node server.
- Word lists: `data/words-*.json` and `data/lists.json`. Audio index: `data/audio-index.json`.
- Tests: `node --test tests/*.test.mjs` (letter tiles for all three scripts, spaced-review timing).
