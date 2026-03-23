const CACHE_NAME = 'nook-v170';
const IMAGES = [
  './img/logo.png',
  './img/facade.jpg',
  './img/curry.jpg',
  './img/dessert.jpg',
  './img/assiette.jpg',
  './img/restaurant.jpg'
];
const STATIC = [
  './',
  './index.html'
];

// Installation — on met tout en cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([...STATIC, ...IMAGES]);
    })
  );
  self.skipWaiting();
});

// Activation — on supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — stratégie selon le type de ressource
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Images → Cache First (toujours depuis le cache si dispo)
  const isImage = IMAGES.some(img => url.pathname.endsWith(img.replace('./', '')));
  if (isImage) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // HTML → Network First (toujours la version la plus récente)
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Reste → Stale While Revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
      return cached || fresh;
    })
  );
});
