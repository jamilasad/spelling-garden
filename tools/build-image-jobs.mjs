#!/usr/bin/env node
// Turns the human-readable prompt files (docs/image-prompts/02…07) into one machine-readable job list,
// docs/image-prompts/image-jobs.json, for generating images in a loop (e.g. with Codex + the OpenAI Images API).
// Each job has a complete, standalone prompt (style rules included), its size, and the reference images to attach.
// Usage: node tools/build-image-jobs.mjs        (re-run after editing any prompt file)

import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'docs', 'image-prompts');
const exists = (p) => access(p).then(() => true, () => false);

const STYLE_REF = 'docs/art-reference/style-sheet.png';
const BUZZY_REF = 'docs/art-reference/mascot-M0-reference.png';
const FACE_REF = 'docs/art-reference/mascot-face.png';
const SIZES = { Square: '1024x1024', Tall: '1024x1536', Wide: '1536x1024' };

const STYLE = `STYLE: Flat vector sticker illustration for a children's educational app (ages 8–10), matching the attached style sheet exactly: thick smooth rounded outlines in dark chocolate brown (#3D2C29), flat colour fills with one soft cel-shading tone and one small white highlight per shape. No gradients, no textures, no realistic detail, no 3D rendering. Cheerful, cute, friendly and warm. Palette: honey yellow #FFC93C, warm orange #FF8C42, sky blue #5BC0EB, leaf green #7BD389, deep green #3FA34D, berry pink #FF6B9D, lavender purple #9B5DE5, cream #FFF8E7, white #FFFFFF, outline brown #3D2C29. Absolutely no text, letters, numbers, logos, signatures or watermarks anywhere. No white sticker border, no frame, no drop shadow. Transparent background.`;
const BUZZY = `CHARACTER "Buzzy" (when the prompt mentions Buzzy or bees): draw exactly the character in the attached Buzzy reference — a small, round, chubby honey-yellow bumblebee with chocolate-brown stripes, big glossy brown eyes with white sparkles, pink cheeks, two antennae with round yellow tips, small pale-blue wings and a lavender-purple scarf.`;
const GARDEN = `GARDEN OBJECT RULES: This is ONE object for a drag-and-drop cartoon garden. Front view, very slightly from above, as if standing on flat ground. The bottom of the object touches the bottom edge of the canvas, centred, and the object fills about 85% of the canvas. No ground patch, no grass around it, no shadow, nothing else in the picture. Animals may have simple cute faces (dot eyes, small smile); plants and objects have no faces.`;
const REF_NOTE = 'The attached style sheet is ONLY a style reference: match its outline thickness, colours and shading, but do not copy any of its objects.';

const LEADS = [
  /^Using the garden rules:\s*/i,
  /^Using the style bible and character bible above:\s*/i,
  /^Using the style bible above:\s*/i,
];

function sizeOf(header, text) {
  const m = header.match(/·\s*(Square|Tall|Wide)/);
  if (m) return SIZES[m[1]];
  if (/Portrait 2:3|1024×1536/.test(text)) return SIZES.Tall;
  if (/Landscape 3:2|1536×1024/.test(text)) return SIZES.Wide;
  return SIZES.Square;
}

function parse(md, group) {
  const jobs = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(/^- \[( |x)\] \*\*`([a-z0-9-]+\.png)`\*\*(.*)$/i);
    if (!head) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].trim().startsWith('```')) j++;
    let k = j + 1;
    const body = [];
    while (k < lines.length && !lines[k].trim().startsWith('```')) body.push(lines[k].trim()), k++;
    const raw = body.join(' ').trim();
    if (!raw) continue;
    const [, done, file, rest] = head;
    let text = raw;
    for (const re of LEADS) text = text.replace(re, '');
    const buzzy = rest.includes('📎') && !file.startsWith('avatar-');
    const face = file.startsWith('avatar-');
    const garden = (group.startsWith('02') || group.startsWith('03')) && file !== 'garden-lawn.png'; // the lawn is a background, not an object
    const size = sizeOf(rest, raw);
    const references = [STYLE_REF, ...(buzzy ? [BUZZY_REF] : []), ...(face ? [FACE_REF] : [])];
    const prompt = [
      STYLE,
      buzzy || face || /buzzy|bee/i.test(text) ? BUZZY : '',
      garden ? GARDEN : '',
      REF_NOTE,
      face ? 'The second attached image is the exact character, pose and framing to keep; change only the colours described.' : '',
      `SUBJECT: ${text}`,
      `Canvas: ${size.replace('x', '×')} pixels, transparent background.`,
    ].filter(Boolean).join('\n\n');
    jobs.push({
      file,
      group,
      label: rest.replace(/[·📎*`]/g, ' ').replace(/\s+/g, ' ').trim(),
      size,
      background: 'transparent',
      references,
      prompt,
      done: done === 'x',
    });
    i = k;
  }
  return jobs;
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => /^0[2-7]-.*\.md$/.test(f)).sort();
  const jobs = [];
  for (const f of files) jobs.push(...parse(await readFile(path.join(DIR, f), 'utf8'), f));
  for (const j of jobs) j.exists = await exists(path.join(ROOT, 'images', 'incoming', j.file));
  for (const ref of new Set(jobs.flatMap((j) => j.references))) {
    if (!(await exists(path.join(ROOT, ref)))) throw new Error(`Missing reference image: ${ref}`);
  }
  const out = {
    about: 'Generated by tools/build-image-jobs.mjs from docs/image-prompts/*.md — edit the .md files, then re-run. Save each image to images/incoming/<file>.',
    outputDir: 'images/incoming',
    count: jobs.length,
    jobs,
  };
  await writeFile(path.join(DIR, 'image-jobs.json'), JSON.stringify(out, null, 2) + '\n');
  const byGroup = {};
  for (const j of jobs) byGroup[j.group] = (byGroup[j.group] || 0) + 1;
  console.log(`${jobs.length} jobs → docs/image-prompts/image-jobs.json`);
  for (const [g, n] of Object.entries(byGroup)) console.log(`  ${g}: ${n}`);
  console.log(`  already done or saved: ${jobs.filter((j) => j.done || j.exists).length}`);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
