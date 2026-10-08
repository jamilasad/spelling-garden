# 🐝 Spelling Garden

A colorful spelling bee practice app for English, Bangla and Arabic words. Everything runs from this folder on your Mac: nothing is uploaded anywhere.

## Start it
1. Double-click **`Start Spelling Garden.command`**. A Terminal window opens and the app opens in your browser.
   *(The first time, macOS may ask for permission. Right-click the file, choose **Open**, then **Open** again.)*
2. **On her iPad or phone:** make sure it's on the same Wi-Fi, then type the address shown in the Terminal window (it looks like `http://192.168.x.x:8080`) into Safari. Use Share → **Add to Home Screen** to get an app icon.
3. Keep the Terminal window open while she practices. Close it (or press Ctrl+C) to stop.

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
1. Make images with `docs/image-prompts-quickstart.md` (start here) or the full pack in `docs/image-prompts.md`.
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
- **Pronunciations:** English uses the Mac's American female voice "Samantha", Bangla uses "Piya" and Arabic uses "Majed". Check them in Word check. For a more natural English voice, download a Premium voice (System Settings → Accessibility → Spoken Content → System voice → Manage Voices… → English (United States) → **Ava (Premium)**), then run `node tools/build-audio.mjs --force --lang=en --voice-en="Ava (Premium)"`. Your own recordings are always kept.
- **Offline:** on the Mac the app keeps working without internet. When the Mac serves it over Wi-Fi, the iPad and phone only work while the Mac is running. Once it's on GitHub Pages (above), every device works fully offline.
- **Contest date** is set to 22 Oct 2026. Change it in Settings.

## For developers
- Plain HTML/CSS/JavaScript, no build step. `tools/server.mjs` is a zero-dependency Node server.
- Word lists: `data/words-*.json` and `data/lists.json`. Audio index: `data/audio-index.json`.
- Tests: `node --test tests/*.test.mjs` (letter tiles for all three scripts, spaced-review timing).
