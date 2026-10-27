/* DROP SPOT service worker: offline shell for the app itself.
   API calls always go to the network; only static assets are cached. */
const CACHE = 'drop-spot-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/logo.webp'])).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache API responses

  if (request.destination === 'image' || url.pathname.startsWith('/_next/static/')) {
    // Cache-first for images and built assets, refreshed in the background.
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        });
        return cached || network;
      }),
    );
    return;
  }

  // Pages: network first, fall back to whatever is cached.
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
