# Generating the images with Codex

**Before you start:**
- Codex needs an **OpenAI API key with billing turned on** (from platform.openai.com). A ChatGPT subscription on its own doesn't cover API image generation.
- In the Terminal where you run Codex: `export OPENAI_API_KEY="sk-..."` (never paste the key into a file in this project).
- Allow Codex network access when it asks.
- Open Codex in this project folder, then copy everything between the two lines below and paste it in.

---

You are generating illustrations for a children's spelling app in this repository ("Spelling Garden"). All prompts are already written. Your job: write and run a small generator that loops through them, calls the OpenAI Images API, saves the PNGs, checks them, and keeps a log. Do not change any app code.

## Inputs
- First run `node tools/build-image-jobs.mjs`. It (re)creates `docs/image-prompts/image-jobs.json` from the prompt files.
- `docs/image-prompts/image-jobs.json` → `jobs[]`. Each job has:
  - `file`: the output file name
  - `group`: the prompt file it came from (`02-garden-builder.md` …)
  - `size`: `1024x1024`, `1024x1536` or `1536x1024`
  - `background`: `transparent`
  - `references`: image paths to attach to the request. `docs/art-reference/style-sheet.png` is on every job so the style stays consistent; some jobs also have the Buzzy character reference.
  - `prompt`: complete and standalone. Send it exactly as it is.
  - `done` / `exists`: skip a job if either is true (unless `--force`).
- Save every result to `images/incoming/<file>` (this folder is git-ignored on purpose).

## Build `tools/generate-images.mjs`
Node 20+, preferably no extra dependencies (use `fetch`, `FormData`, `Blob`). Read the key from `OPENAI_API_KEY`; never print, log or save it.

For each pending job, in file order:
1. **Call the OpenAI Images API** with the best image model available on this account (check the current OpenAI docs; at the time of writing that is `gpt-image-1`). Because every job has reference images, use the **image edit endpoint** (`POST /v1/images/edits`, multipart) with each file in `references` attached as an input image, plus `prompt`, `size`, `background: "transparent"`, `output_format: "png"` and `quality` (default `medium`, a flag for `high`). **Check the exact parameter names in the current docs before the first call.**
2. **Save** the returned base64 PNG to `images/incoming/<file>`.
3. **Automatic checks:** the PNG size equals `size`, and the image really is transparent (all four corner pixels have alpha 0). If a check fails, retry (at most 2 retries), then mark it "needs review".
4. **Visual check** (if you can view images): exactly one subject (the lawn is the exception), no text, letters or numbers, same style as the style sheet (thick dark-brown outlines, flat colours), and Buzzy matches the reference when he appears. If not, regenerate (at most 2 retries), then mark "needs review" with a short reason.
5. **Tick the box** in the matching `docs/image-prompts/0X-*.md`: change ``- [ ] **`<file>`**`` to ``- [x] **`<file>`**``.
6. **Log** one row in `docs/image-prompts/generation-log.md`: `file | status (saved / needs review / failed) | attempts | note`.

Script options:
- `--dry-run`: list what would be generated, with counts per group; no API calls
- `--group=02`: only jobs from that prompt file
- `--only=plant-tulip.png,tree-mango.png`, `--limit=N`
- `--quality=medium|high`
- `--force`: regenerate even if the file exists

Behaviour:
- At most 2 requests at a time.
- On HTTP 429 or 5xx: wait and retry with backoff. On 401, 403, billing or quota errors: stop immediately and tell me.
- Resumable: safe to stop and run again; finished files are skipped.
- Show progress like `[12/43] plant-tulip.png … saved (1 attempt)`.

## Order of work (STOP means wait for my reply)
1. Build the script and run `--dry-run`. Tell me the count per group and an estimated cost from current OpenAI pricing for the model, quality and sizes. **STOP.**
2. **Test batch:** `--only=garden-lawn.png,plant-tulip.png,tree-mango.png`. Show me the three images. **STOP**: I may want to adjust the prompts.
3. Run `--group=02`, then `--group=03`, one group at a time. After each group, summarise how many were saved and which need review. **STOP** after each group.
4. Groups 04–07 only when I ask.

## Do not
- Do not edit app code (`js/`, `css/`, `index.html`, `sw.js`, `i18n/`, `data/`).
- Do not change the prompt wording in the `.md` files (only tick boxes). If a prompt needs changing, tell me instead.
- Do not commit or push anything.
- Do not write outside `images/incoming/`, `tools/generate-images.mjs` and `docs/image-prompts/generation-log.md` (plus ticking boxes).

When a group is finished, list the files that need review. I'll then ask Claude Code to "add the new images", which resizes them and places them in the app.

---

## After Codex finishes
- Look through `images/incoming/` and delete or regenerate anything you don't like: `node tools/generate-images.mjs --only=<file> --force`.
- Tell Claude Code **"add the new images"**.
