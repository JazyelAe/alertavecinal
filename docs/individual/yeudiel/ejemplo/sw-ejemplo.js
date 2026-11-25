/*
 * sw-ejemplo.js · Service worker del ejemplo mínimo (Yeudiel).
 * Alcance: solo docs/individual/yeudiel/ejemplo/ (no interfiere con sw.js de la app).
 * - install: precachea la página (app shell mínimo).
 * - fetch: Cache First con respaldo a la red.
 * - notificationclick: abre o enfoca la página.
 */
const CACHE = 'ejemplo-yeudiel-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(['./', 'index.html', 'ejemplo.js', 'manifest.json']))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((enCache) => enCache || fetch(event.request)));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then((ventanas) => {
    const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
    return abierta ? abierta.focus() : self.clients.openWindow(destino);
  }));
});
