const CACHE_NAME = 'tinytalk-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/icon-72.png',
  '/images/icon-96.png',
  '/images/icon-128.png',
  '/images/icon-144.png',
  '/images/icon-152.png',
  '/images/icon-192.png',
  '/images/icon-384.png',
  '/images/icon-512.png',
  '/images/maskable-icon-192.png',
  '/images/maskable-icon-512.png'
];

// Встановлення — кешуємо всі активи
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кешування активів...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активація — очищаємо старі кеші
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Стратегія: спочатку кеш, потім мережа (Cache First)
self.addEventListener('fetch', (event) => {
  // Пропускаємо запити до аналітики чи сторонніх API
  if (event.request.url.includes('googleapis.com') || 
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Кешуємо тільки успішні відповіді
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Якщо офлайн — показуємо сторінку офлайн (опціонально)
            return caches.match('/offline.html');
          });
      })
  );
});