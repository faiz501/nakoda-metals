const CACHE_NAME = 'nakoda-metals-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/products.html',
  '/team.html',
  '/styles.css',
  '/css/normalize.css',
  '/css/components.css',
  '/css/responsive.css',
  '/css/products.css',
  '/css/team.css',
  '/script.js',
  '/js/products.js',
  '/js/team.js',
  '/js/modules/utils.js',
  '/data/products.json',
  '/data/team.json',
  '/assets/images/icons/logo.svg',
  '/assets/images/icons/logo-white.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
