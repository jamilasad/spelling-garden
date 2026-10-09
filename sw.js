// Offline support. Network first (so updates show up straight away), cache as the fallback.
// Every network request revalidates with the server ("no-cache"), so a new version is picked up
// on the next online visit instead of waiting for the browser's own cache to expire.
// Bump VERSION when files are added or renamed.
const VERSION = 'spelling-garden-v7';

const CORE = [
  './', 'index.html', 'manifest.webmanifest',
  'css/tokens.css', 'css/base.css', 'css/components.css', 'css/scene.css', 'css/screens.css',
  'js/app.js', 'js/ambient.js', 'js/art.js', 'js/audio.js', 'js/badges.js', 'js/data.js', 'js/fx.js',
  'js/i18n.js', 'js/icons.js', 'js/reveal.js', 'js/scheduler.js', 'js/segment.js', 'js/sfx.js', 'js/store.js', 'js/ui.js',
  'js/screens/home.js', 'js/screens/profiles.js', 'js/screens/setup.js', 'js/screens/bee.js', 'js/screens/hive.js',
  'js/screens/garden.js', 'js/screens/settings.js', 'js/screens/parent.js', 'js/screens/words.js', 'js/screens/learn.js',
  'i18n/en.json', 'i18n/bn.json', 'i18n/ar.json',
  'data/app-config.json', 'data/lists.json', 'data/words-en.json', 'data/words-bn.json', 'data/words-ar.json',
  'data/audio-index.json', 'images/manifest.json',
  'fonts/baloo-2-latin.woff2', 'fonts/baloo-2-latin-ext.woff2', 'fonts/baloo-da-2-bengali.woff2',
  'fonts/baloo-bhaijaan-2-arabic.woff2', 'fonts/noto-naskh-arabic-arabic.woff2', 'fonts/noto-sans-bengali-bengali.woff2',
  'images/icons/icon-180.png', 'images/icons/icon-192.png', 'images/icons/icon-512.png',
];

async function precache() {
  const cache = await caches.open(VERSION);
  const fresh = (u) => new Request(u, { cache: 'reload' });
  await cache.addAll(CORE.map(fresh));
  // Audio and illustrations are listed in their index files.
  try {
    const audio = await (await fetch('data/audio-index.json', { cache: 'no-store' })).json();
    const art = await (await fetch('images/manifest.json', { cache: 'no-store' })).json();
    const extra = [
      ...Object.values(audio).flatMap((e) => [e.word, e.sentence]),
      ...Object.values(art),
    ].filter(Boolean);
    await Promise.allSettled(extra.map((u) => cache.add(fresh(u))));
  } catch { /* the app still works online */ }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Safari asks for audio in byte ranges; answer those from the cached file.
async function rangeResponse(request, response) {
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (!range) return response;
  const buf = await response.arrayBuffer();
  const start = range[1] ? Number(range[1]) : 0;
  const end = range[2] ? Math.min(Number(range[2]), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1),
    },
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hasRange = req.headers.has('range');
    try {
      // A navigation request can't be copied with new options, so fetch its URL instead.
      const fresh = req.mode === 'navigate'
        ? await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        : await fetch(req, { cache: 'no-cache' });
      if (fresh.ok && fresh.status === 200 && !hasRange) cache.put(req, fresh.clone());
      return fresh;
    } catch {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return hasRange ? rangeResponse(req, cached) : cached;
      if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }
  })());
});
