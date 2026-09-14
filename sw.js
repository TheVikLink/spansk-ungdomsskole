// Generated build identifier; run npm run build:app after changing app assets.
const APP_BUILD = '512b07a258938fe1';
const CACHE_NAME = `spansk123-shell-${APP_BUILD}`;
const AUDIO_CACHE = 'spansk123-audio-v1';
const APP_SHELL = ['./', './index.html', './dist/tailwind.css', './manifest.webmanifest'];
const absolute = relative => new URL(relative, self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map(url => new Request(absolute(url), { cache: 'reload' })));
    // The inline app stays in memory. Clients choose when to reload it.
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const audioCache = await caches.open(AUDIO_CACHE);
    for (const key of await caches.keys()) {
      if (key === CACHE_NAME || key === AUDIO_CACHE) continue;
      if (!key.startsWith('spansk123-shell-') && !/^spansk123-v\d+$/.test(key)) continue;
      // Keep full audio already cached by older app versions.
      if (/^spansk123-v\d+$/.test(key)) {
        const old = await caches.open(key);
        for (const request of await old.keys()) {
          if (!request.url.startsWith(absolute('audio/diktat/'))) continue;
          const response = await old.match(request);
          if (response?.status === 200 && response.headers.get('content-type')?.startsWith('audio/')) await audioCache.put(request.url, response);
        }
      }
      await caches.delete(key);
    }
    await self.clients.claim();
    for (const client of await self.clients.matchAll()) client.postMessage({ type: 'APP_BUILD', build: APP_BUILD });
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'GET_APP_BUILD') event.source?.postMessage({ type: 'APP_BUILD', build: APP_BUILD });
});

async function audioResponse(request) {
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request.url);
  if (!cached) {
    try { return await fetch(request); }
    catch { return new Response('Lydfilen er ikke lastet ned.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  }
  const range = request.headers.get('range');
  if (!range) return cached;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  // Multi-range requests may legally receive the entire resource.
  if (!match || (!match[1] && !match[2])) return cached;
  const bytes = await cached.arrayBuffer();
  const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.byteLength}` } });
  const headers = new Headers(cached.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.url.startsWith(absolute('audio/diktat/'))) {
    event.respondWith(audioResponse(request));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(request); }
    catch {
      if (request.mode === 'navigate') return await cache.match(absolute('./index.html'));
      return new Response('Filen er ikke tilgjengelig uten nett.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
