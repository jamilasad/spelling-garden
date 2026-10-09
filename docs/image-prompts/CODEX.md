# Making the images with the Codex app

1. Open the **Codex app** and choose this project folder (`Spelling Bee Project`).
2. Copy the prompt below and paste it into Codex. To work on a different file, change only the **first line**.
3. Codex makes the **first 3 images** and stops so you can check them. Reply "continue" (or ask for changes) and it works through the rest of the file one by one.
4. If Codex stops halfway or you start a new chat, paste the same prompt again. It continues from the first image that isn't ticked yet.
5. When a file is finished, tell Claude Code **"add the new images"**.

Order of files: `02-garden-builder.md` → `03-word-treasures.md` → then the optional ones (04–07).

---

```
Prompt file for this run: docs/image-prompts/02-garden-builder.md

You are making illustrations for a children's spelling app ("Spelling Garden") in this project. All the prompts are already written. Make the images yourself with your image generation, one at a time, in the order they appear in the prompt file above.

SETUP (once, at the start)
- Read docs/image-prompts/00-start-here.md (the style rules) and the prompt file above.
- Run: node tools/build-image-jobs.mjs
  This writes docs/image-prompts/image-jobs.json. For every image it holds the COMPLETE prompt (style rules + garden rules + the item), the size and the reference pictures. Always use the "prompt" from image-jobs.json for the matching "file", not just the short text in the .md file.
- Look at docs/art-reference/style-sheet.png. Every new image must match this style exactly: thick dark-brown outlines, flat colours, one soft shading tone, a small white highlight, cute and simple.

FOR EACH IMAGE (in the order of the prompt file)
1. Skip it if its box is already ticked ("- [x]") or images/incoming/<file> already exists.
2. Generate it using the job's "prompt", in the job's "size" (1024x1024 square, 1024x1536 tall, 1536x1024 wide), with a TRANSPARENT background. If you can attach reference images, attach every path in the job's "references" (the style sheet, plus the Buzzy reference when listed).
3. Save it as a PNG at images/incoming/<file> with exactly that file name.
4. Run: node tools/finish-image.mjs images/incoming/<file>
   It reports the size and transparency and removes a plain background if there is one. If it says "regenerate", make the image again.
5. Look at the image and check:
   - exactly one subject (the lawn is the exception), filling most of the canvas, standing at the bottom
   - no text, letters, numbers or logos anywhere
   - same style as the style sheet
   - Buzzy (when he appears) looks like docs/art-reference/mascot-M0-reference.png
   If any check fails, regenerate (at most 2 more tries). If it still isn't right, keep the best one and note why.
6. Tick its box in the prompt file: change "- [ ] **`<file>`**" to "- [x] **`<file>`**".
7. Add one line to docs/image-prompts/generation-log.md: file | saved / needs review | tries | short note.

PACE
- After the FIRST 3 images, STOP. Show me the three images and wait for my reply.
- After I say continue, work through the rest of the file without stopping, then give me a short summary: how many were made, and which "need review" and why.

DO NOT
- Do not change any app code (js/, css/, index.html, sw.js, i18n/, data/, tools/).
- Do not change the wording of prompts in the .md files (only tick boxes). If a prompt seems wrong, tell me instead.
- Do not commit or push anything.
- Only write to images/incoming/, docs/image-prompts/generation-log.md, and the tick boxes.
```

---

## Notes
- **Running out of room:** long runs can fill up a Codex chat. If it gets slow or confused, start a new chat and paste the prompt again; it picks up where it stopped.
- **Redo one image:** delete it from `images/incoming/`, untick its box, and ask Codex: "Make docs/image-prompts/02-garden-builder.md → `plant-tulip.png` again, a bit taller and with more leaves."
- **Change a prompt:** edit it in the `.md` file, then run `node tools/build-image-jobs.mjs` (Codex also runs this at the start).
- **Check everything at once:** `node tools/finish-image.mjs --check images/incoming/*.png`
