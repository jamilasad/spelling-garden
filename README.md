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

## Honey Pot
Every word she gets right earns a **honey drop** (it never goes down for a "Not yet").
- **Honey jars:** every 25 drops fills a jar.
- **Today's goal:** collect 20 drops a day (change it in Settings: 10, 20 or 30), with a celebration when she reaches it.
- **Honey Shop:** spend drops on hats for Buzzy, special bee colours (silver, gold, rainbow) and decorations for My Garden.

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
1. Make images with `docs/image-prompts.md`. It lists what's already made and the prompts still to do, in order.
2. Save them with the exact file names into `images/incoming/`.
3. In Terminal, from this folder, run `node tools/prepare-images.mjs`, then `node tools/optimize-images.mjs` (makes them much smaller), and reload the app. Or ask Claude to do it.

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
- **Pronunciations:** all three languages use natural Microsoft female voices, generated once and stored in `audio/`: English "Jenny" (American), Bangla "Nabanita" (Bangladesh) and Arabic "Zariyah". Check them in Word check, and record your own voice for any word that's still not right. To rebuild a language: `node tools/build-audio.mjs --force --lang=bn` (your own recordings are always kept). The natural voices need a one-time setup: `python3 -m venv .venv && .venv/bin/pip install edge-tts`. To use a different voice: `--voice-en=en-US-AvaNeural` (any Microsoft voice ending in "Neural"), or a built-in Mac voice such as `--voice-en=Samantha`.
- **Offline:** on the Mac the app keeps working without internet. When the Mac serves it over Wi-Fi, the iPad and phone only work while the Mac is running. Once it's on GitHub Pages (above), every device works fully offline.
- **Contest date** is set to 22 Oct 2026. Change it in Settings.

## For developers
- Plain HTML/CSS/JavaScript, no build step. `tools/server.mjs` is a zero-dependency Node server.
- Word lists: `data/words-*.json` and `data/lists.json`. Audio index: `data/audio-index.json`.
- Tests: `node --test tests/*.test.mjs` (letter tiles for all three scripts, spaced-review timing).
