#!/usr/bin/env node
// Tiny local server for Spelling Garden — no dependencies.
//   • Serves the app to this Mac (http://localhost:8080) and to devices on the home Wi-Fi.
//   • Saves pronunciation recordings from the Parent Corner (only accepted from this Mac).
// Usage: node tools/server.mjs   (PORT=9000 node tools/server.mjs to change the port)

import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { readFile, writeFile, stat, mkdir, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;
const MAX_UPLOAD = 8 * 1024 * 1024;

// Only these paths are served — the word-list photos, tools and notes stay private.
const PUBLIC_FILES = new Set(['index.html', 'manifest.webmanifest', 'sw.js']);
const PUBLIC_DIRS = ['css/', 'js/', 'i18n/', 'data/', 'audio/', 'images/', 'fonts/'];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.mp3': 'audio/mpeg', '.webm': 'audio/webm',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.ico': 'image/x-icon',
};

const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

async function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
  if (rel === '') rel = 'index.html';
  const allowed = PUBLIC_FILES.has(rel) || PUBLIC_DIRS.some((d) => rel.startsWith(d));
  const file = path.resolve(ROOT, rel);
  if (!allowed || !file.startsWith(ROOT + path.sep) || rel.split('/').some((p) => p.startsWith('.'))) {
    return send(res, 404, 'Not found');
  }
  let info;
  try { info = await stat(file); } catch { return send(res, 404, 'Not found'); }
  if (!info.isFile()) return send(res, 404, 'Not found');

  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  // Safari needs byte ranges for audio playback.
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}` });
      return res.end();
    }
    res.writeHead(206, {
      'Content-Type': type, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Cache-Control': 'no-cache',
    });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_UPLOAD) { reject(new Error('too large')); req.destroy(); }
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// POST /api/recording?id=bn-02&kind=word|sentence   body: the recorded audio
async function saveRecording(req, res, url) {
  if (!isLoopback(req)) return send(res, 403, 'Recordings can only be saved from this Mac.');
  const id = url.searchParams.get('id') || '';
  const kind = url.searchParams.get('kind') === 'sentence' ? 'sentence' : 'word';
  if (!/^[a-z]{2}-\d{2,3}$/.test(id)) return send(res, 400, 'Bad word id');
  const ctype = (req.headers['content-type'] || '').split(';')[0];
  const ext = { 'audio/webm': '.webm', 'audio/mp4': '.m4a', 'audio/ogg': '.ogg', 'audio/wav': '.wav' }[ctype];
  if (!ext) return send(res, 415, 'Unsupported audio type');

  const body = await readBody(req);
  const dir = path.join(ROOT, 'audio', 'rec');
  await mkdir(dir, { recursive: true });
  const name = `${id}${kind === 'sentence' ? '-s' : ''}${ext}`;
  await writeFile(path.join(dir, name), body);

  const indexFile = path.join(ROOT, 'data', 'audio-index.json');
  let index = {};
  try { index = JSON.parse(await readFile(indexFile, 'utf8')); } catch {}
  const entry = index[id] || {};
  const relPath = `audio/rec/${name}`;
  // Remove an older recording in a different format.
  const previous = entry[kind];
  if (previous && previous.startsWith('audio/rec/') && previous !== relPath) {
    await unlink(path.join(ROOT, previous)).catch(() => {});
  }
  entry[kind] = relPath;
  if (kind === 'word') entry.wordSource = 'recording';
  else entry.sentenceSource = 'recording';
  index[id] = entry;
  await writeFile(indexFile, JSON.stringify(index, null, 2) + '\n');
  send(res, 200, JSON.stringify({ ok: true, path: relPath, version: Date.now() }), 'application/json');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/recording' && req.method === 'POST') return await saveRecording(req, res, url);
    if (url.pathname === '/api/ping') return send(res, 200, JSON.stringify({ ok: true, canRecord: isLoopback(req) }), 'application/json');
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    await serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 500, 'Something went wrong');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces()).flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => `http://${n.address}:${PORT}`);
  console.log('\n  🐝  Spelling Garden is running!\n');
  console.log(`  On this Mac:        http://localhost:${PORT}`);
  for (const u of lan) console.log(`  iPad / phone (Wi-Fi): ${u}`);
  console.log('\n  Keep this window open while practising. Press Ctrl+C to stop.\n');
});
