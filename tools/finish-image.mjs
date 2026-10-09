#!/usr/bin/env node
// Checks freshly made images and fixes the background if needed.
//   • Reports each image's size and whether it is truly transparent.
//   • If the background is a plain colour (white, cream, a solid fill…), removes it so the image
//     becomes transparent: flood-fills from the edges, with soft edges so outlines stay smooth.
// Uses the Google Chrome already on this Mac (no extra installs).
// Usage: node tools/finish-image.mjs images/incoming/plant-tulip.png [more files…]
//        node tools/finish-image.mjs --check images/incoming/*.png   (report only, change nothing)

import { readFile, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import http from 'node:http';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const files = args.filter((a) => !a.startsWith('--')).map((f) => path.resolve(f));
if (!files.length) {
  console.log('Usage: node tools/finish-image.mjs [--check] <image.png> [more…]');
  process.exit(1);
}

// Runs in the browser: measures the image and, if asked, removes a plain background.
const PAGE_FN = String.raw`async (src, fix) => {
  const im = new Image(); im.src = src; await im.decode();
  const w = im.naturalWidth, h = im.naturalHeight;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const img = x.getImageData(0, 0, w, h), d = img.data;
  const corner = (px, py) => d[(py * w + px) * 4 + 3];
  const transparent = [corner(1, 1), corner(w - 2, 1), corner(1, h - 2), corner(w - 2, h - 2)].every((a) => a < 10);
  let cleared = 0;
  if (fix && !transparent) {
    const pts = [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3], [w >> 1, 2], [w >> 1, h - 3], [2, h >> 1], [w - 3, h >> 1]];
    const bg = pts.map(([px, py]) => { const i = (py * w + px) * 4; return [d[i], d[i + 1], d[i + 2]]; });
    const TOL = 34, SOFT = 30;
    const dist = (i) => Math.min(...bg.map((b) => Math.hypot(d[i] - b[0], d[i + 1] - b[1], d[i + 2] - b[2])));
    const seen = new Uint8Array(w * h), stack = [];
    for (let px = 0; px < w; px++) stack.push(px, (h - 1) * w + px);
    for (let py = 0; py < h; py++) stack.push(py * w, py * w + w - 1);
    while (stack.length) {
      const p = stack.pop(); if (seen[p]) continue; seen[p] = 1;
      const i = p * 4, dd = dist(i);
      if (dd < TOL) {
        d[i + 3] = 0; cleared++;
        const px = p % w, py = (p / w) | 0;
        if (px > 0) stack.push(p - 1); if (px < w - 1) stack.push(p + 1);
        if (py > 0) stack.push(p - w); if (py < h - 1) stack.push(p + w);
      } else if (dd < TOL + SOFT) {
        d[i + 3] = Math.min(d[i + 3], Math.round(255 * (dd - TOL) / SOFT));
      }
    }
    x.putImageData(img, 0, 0);
  }
  let opaque = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) opaque++;
  return { w, h, transparent, cleared, fill: Math.round(100 * opaque / (w * h)), png: fix && !transparent ? c.toDataURL('image/png') : null };
}`;

async function main() {
  const server = http.createServer(async (req, res) => {
    const i = Number(new URL(req.url, 'http://x').searchParams.get('i'));
    try { res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(await readFile(files[i])); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const profile = await mkdtemp(path.join(tmpdir(), 'sg-finish-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    chrome.stderr.on('data', (d) => { buf += d; const m = /ws:\/\/[^\s]+/.exec(buf); if (m) resolve(m[0]); });
    chrome.on('error', reject);
    setTimeout(() => reject(new Error('Chrome did not start (is Google Chrome installed?)')), 15000);
  });
  const dbg = new URL(wsUrl).port;
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${dbg}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!target) await sleep(200);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await sleep(500);

  let problems = 0;
  for (let i = 0; i < files.length; i++) {
    const name = path.basename(files[i]);
    const r = await send('Runtime.evaluate', {
      expression: `(${PAGE_FN})('/img?i=${i}', ${!checkOnly})`, awaitPromise: true, returnByValue: true,
    });
    const v = r.result?.result?.value;
    if (!v) { console.log(`  ✗ ${name}: could not read the image`); problems++; continue; }
    let status;
    if (v.transparent) status = 'transparent ✓';
    else if (checkOnly) { status = 'NOT transparent'; problems++; }
    else if (v.png && v.cleared > v.w * v.h * 0.05) {
      await writeFile(files[i], Buffer.from(v.png.split(',')[1], 'base64'));
      status = 'background removed ✓';
    } else { status = 'NOT transparent (background is not a plain colour — regenerate)'; problems++; }
    const tiny = v.fill < 4 ? ' · subject looks very small' : '';
    console.log(`  ${name}: ${v.w}×${v.h} · ${status}${tiny}`);
  }
  ws.close();
  chrome.kill();
  server.close();
  await sleep(500);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  if (problems) process.exitCode = 2;
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
