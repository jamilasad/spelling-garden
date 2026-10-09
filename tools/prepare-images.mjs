#!/usr/bin/env node
// Takes the illustrations you dropped into images/incoming/, resizes them with the Mac's
// built-in `sips`, files them into the right folders and updates images/manifest.json.
// The app picks them up automatically; anything missing stays as a placeholder drawing.
// Usage: node tools/prepare-images.mjs

import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INCOMING = path.join(ROOT, 'images', 'incoming');

// file-name prefix → [folder, longest side in px]
const RULES = [
  ['mascot-', 'mascot', 520],
  ['avatar-', 'avatars', 320],
  ['icon-app', 'icons', 1024],
  ['bee-flyer', 'nature', 256],
  ['sunflower-', 'flowers', 760],
  ['garden-', 'flowers', 480],
  ['petal-', 'nature', 160],
  ['leaf-', 'nature', 200],
  ['cloud-', 'nature', 520],
  ['grass-', 'nature', 400],
  ['flower-small-', 'nature', 200],
  ['butterfly-', 'nature', 240],
  ['honey-', 'nature', 320],
  ['watering-can', 'nature', 320],
  ['beehive', 'nature', 480],
  ['scene-', 'scene', 2000],
  ['card-', 'cards', 400],
  ['badge-', 'badges', 320],
  ['word-', 'words', 512],
  ['logo-', 'brand', 600],
  ['hat-', 'shop', 320],
  ['decor-', 'shop', 320],
];

async function listImages(dir) {
  try {
    return (await readdir(dir)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !f.startsWith('.'));
  } catch {
    return [];
  }
}

async function main() {
  const manifest = {};
  // Keep images that were prepared earlier.
  for (const [, folder] of RULES) {
    for (const f of await listImages(path.join(ROOT, 'images', folder))) {
      if (folder === 'icons') continue;
      manifest[path.parse(f).name] = `images/${folder}/${f}`;
    }
  }

  const incoming = await listImages(INCOMING);
  let done = 0;
  const unknown = [];
  for (const file of incoming) {
    const name = path.parse(file).name.toLowerCase().replace(/\s+/g, '-');
    const rule = RULES.find(([prefix]) => name.startsWith(prefix));
    if (!rule) { unknown.push(file); continue; }
    const [, folder, size] = rule;
    const outDir = path.join(ROOT, 'images', folder);
    await mkdir(outDir, { recursive: true });
    const out = path.join(outDir, `${name}.png`);
    await run('sips', ['-s', 'format', 'png', '-Z', String(size), path.join(INCOMING, file), '--out', out]);
    manifest[name] = `images/${folder}/${name}.png`;
    done++;
    console.log(`  ✓ ${file} → images/${folder}/${name}.png`);
  }

  // App icon sizes for phones and tablets.
  if (manifest['icon-app']) {
    const src = path.join(ROOT, manifest['icon-app']);
    for (const s of [512, 192, 180]) {
      await run('sips', ['-s', 'format', 'png', '-z', String(s), String(s), src, '--out', path.join(ROOT, 'images', 'icons', `icon-${s}.png`)]);
    }
    console.log('  ✓ app icon sizes updated (512, 192, 180)');
  }

  delete manifest['icon-app'];
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(path.join(ROOT, 'images', 'manifest.json'), JSON.stringify(sorted, null, 2) + '\n');
  console.log(`\n${done} new image(s) prepared, ${Object.keys(sorted).length} in total. Reload the app to see them.`);
  if (unknown.length) console.log(`Not recognised (check the file names in docs/image-prompts.md): ${unknown.join(', ')}`);
  if (done) console.log('Tip: run `node tools/optimize-images.mjs` to make them about 5–10× smaller (WebP).');
  if (done && process.argv.includes('--clean')) {
    for (const file of incoming) await rm(path.join(INCOMING, file));
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
