const CACHE_NAME = 'elections-lafleche-v23';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/saisie.js',
  './js/resultats.js',
  './js/sieges.js',
  './js/projections.js',
  './js/analyse.js',
  './js/soiree.js',
  './js/share.js',
  './js/historique.js',
  './js/historique_bv.js',
  './js/montecarlo.js',
  './data/historique.json',
  './data/historique_bv.json',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Navigation (HTML pages): network-first, fallback to cache (offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with fresh HTML
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets (JS, CSS, images): stale-while-revalidate
  // Serve from cache immediately, but also update cache in background
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        // Update cache with fresh version
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);

      // Return cached immediately if available, otherwise wait for network
      return cached || networkFetch;
    })
  );
});
