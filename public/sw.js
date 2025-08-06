/* Simple cache-first Service Worker for static assets */
const CACHE_NAME = 'theset-static-v1';
const ASSET_CACHE_GLOBS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSET_CACHE_GLOBS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const networkResponse = await fetch(request);

        // Only cache successful same-origin responses to avoid cloning issues
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (_err) {
        // If offline and no cache match, just error out
        return cached || Response.error();
      }
    })
  );
});
