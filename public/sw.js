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
    caches.match(request).then((resp) => {
      if (resp) return resp;
      return fetch(request).then((netResp) => {
        // Cache new requests
        if (netResp.status === 200 && request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, netResp.clone()));
        }
        return netResp;
      });
    })
  );
});

