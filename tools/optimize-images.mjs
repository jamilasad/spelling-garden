#!/usr/bin/env node
// Converts the prepared PNG illustrations to WebP (about 5–10× smaller, transparency kept),
// using the Google Chrome already installed on this Mac, then updates images/manifest.json.
// App icons stay PNG (phones need PNG icons).
// Usage: node tools/optimize-images.mjs [--quality=0.86]

import { readFile, writeFile, rm, stat, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const quality = Number((process.argv.find((a) => a.startsWith('--quality=')) || '').slice(10)) || 0.86;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const manifestFile = path.join(ROOT, 'images', 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const todo = Object.entries(manifest).filter(([, p]) => p.endsWith('.png') && !p.startsWith('images/icons/'));
  if (!todo.length) return console.log('Nothing to convert.');

  // Serve the images folder so the browser can read the pixels.
  const server = http.createServer(async (req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    const file = path.resolve(ROOT, rel);
    if (!file.startsWith(path.join(ROOT, 'images') + path.sep)) { res.writeHead(404); return res.end(); }
    try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': 'image/png' }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const profile = await mkdtemp(path.join(tmpdir(), 'sg-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    chrome.stderr.on('data', (d) => { buf += d; const m = /ws:\/\/[^\s]+/.exec(buf); if (m) resolve(m[0]); });
    chrome.on('error', reject);
    setTimeout(() => reject(new Error('Chrome did not start (is Google Chrome installed?)')), 15000);
  });
  const port9 = new URL(wsUrl).port;
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port9}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!target) await sleep(200);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/images/manifest.json` });
  await sleep(600);

  let before = 0, after = 0;
  for (const [name, rel] of todo) {
    const expr = `(async()=>{const im=new Image();im.src='/${rel}';await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);return c.toDataURL('image/webp',${quality})})()`;
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    const url = r.result?.result?.value;
    if (!url || !url.startsWith('data:image/webp')) { console.log(`  ✗ ${name} (kept PNG)`); continue; }
    const png = path.join(ROOT, rel);
    const webpRel = rel.replace(/\.png$/, '.webp');
    const data = Buffer.from(url.split(',')[1], 'base64');
    before += (await stat(png)).size;
    after += data.length;
    await writeFile(path.join(ROOT, webpRel), data);
    await rm(png);
    manifest[name] = webpRel;
    console.log(`  ✓ ${webpRel}`);
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  ws.close();
  chrome.kill();
  server.close();
  await sleep(800);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  console.log(`\n${todo.length} image(s): ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
