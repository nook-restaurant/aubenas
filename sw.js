const CACHE = 'nook-v21';
const ASSETS = [
  './',
  './index.html',
  './img/logo.png',
  './img/facade.jpg',
  './img/curry.jpg',
  './img/dessert.jpg',
  './img/assiette.jpg',
  './img/restaurant.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
