// InstaGran service worker — minimal, network-first.
// Its main job is to make the app installable (PWA criteria). We deliberately
// avoid aggressively caching API/data so photos and the feed always stay fresh.

const CACHE = 'instagran-shell-v1';
const SHELL = ['/feed', '/login', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; never touch Supabase API/storage or cross-origin.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Network-first, falling back to cache (useful when offline on a known page).
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache navigations/shell responses opportunistically.
        if (request.mode === 'navigate') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/feed'))),
  );
});
