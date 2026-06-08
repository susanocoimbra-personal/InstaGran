// InstaGran service worker — minimal, network-first.
// Its main job is to make the app installable (PWA criteria). We deliberately
// avoid aggressively caching API/data so photos and the feed always stay fresh.

const CACHE = 'instagran-shell-v2';
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

// --- Web Push -------------------------------------------------------------
// A push arrives with a JSON payload { title, body, url }. Show it as a
// notification; tapping it focuses an open tab or opens the app at `url`.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'InstaGran';
  const options = {
    body: data.body || 'Há novidades no diário da família.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/feed' },
    tag: data.tag || 'instagran-photo', // collapse duplicates
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/feed';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing tab if one is open, else open a new one.
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
