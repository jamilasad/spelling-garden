# 🐝 Image prompts: index

One file per group. Work through them top to bottom. Each image has a tick box: change `[ ]` to `[x]` when it's saved in `images/incoming/`.

| File | What's inside | Images | Priority |
|---|---|---|---|
| [00-start-here.md](00-start-here.md) | **Message 1** (style + Buzzy rules) and the checklist for saving images | — | Read first |
| [01-made-so-far.md](01-made-so-far.md) | Record of the 26 images already in the app | 26 ✅ | Done |
| [02-garden-builder.md](02-garden-builder.md) | Her own garden: lawn, plants, trees, garden pieces, water, big goals, visitors, seed packet | 43 | ⭐ Next |
| [03-word-treasures.md](03-word-treasures.md) | Free garden rewards that appear when a word starts blooming | 33 | ⭐ After 02 |
| [04-badges.md](04-badges.md) | Achievement badges | 11 | Optional |
| [05-word-pictures.md](05-word-pictures.md) | Picture hints for each word | 54 | Optional |
| [06-shop-hats.md](06-shop-hats.md) | Illustrated hats for Buzzy | 6 | Optional |
| [07-avatars.md](07-avatars.md) | Player pictures in different colours | 8 | Optional |

## Making them in a loop with the Codex app
Instead of pasting prompts one by one into ChatGPT, the Codex app can make them one after another:
- **[CODEX.md](CODEX.md):** the prompt to paste into Codex (change its first line to pick the file)
- **`image-jobs.json`:** every prompt written out in full, made by `node tools/build-image-jobs.mjs` (Codex runs this itself)
- **`docs/art-reference/style-sheet.png`:** your approved art, so every new image matches the same style
- **`tools/finish-image.mjs`:** checks each image's size and transparency, and removes a plain background

## Tips
- **One ChatGPT chat for everything,** so the style stays the same. If the chat gets long and images start to drift, start a new chat and paste Message 1 again.
- **You don't have to finish a file before using it.** Whatever you've saved gets added; anything missing stays drawn by code or hidden.
- **When you have a batch ready,** tell Claude "add the new images".

## No longer needed
These were in the first plan, but the app doesn't use them: extra Buzzy poses (`mascot-read`, `-point`, `-fly`, `-sleep`), menu cards (`card-*`), `scene-hive-tree`, `scene-hive-inside`, `scene-garden-bed`, `grass-*`, `flower-small-*`, `honey-drop`, `honey-pot`, `beehive`, `garden-sprout`, the old `garden-*` flowers (replaced by `plant-*` in file 02), `decor-*` (replaced by file 02), and `logo-emblem` (the logo is drawn in code).
