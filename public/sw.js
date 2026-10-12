// Service worker de Al Día: guarda solo archivos propios de la app para poder abrirla sin conexión.
// No guarda respuestas de otros sitios (Firebase, Open Food Facts, EmailJS...) ni datos de cuentas.
const CACHE_NAME = 'aldia-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Al activarse, borra las cachés anteriores (que podían contener respuestas de otros sitios)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo contenido de la propia app; lo demás pasa directo a la red
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__/') || url.pathname.startsWith('/api/')) return;
  // Las listas compartidas (?c=...) nunca se guardan
  if (url.searchParams.has('c')) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('/')))
  );
});