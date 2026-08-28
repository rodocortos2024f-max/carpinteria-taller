// Service Worker para Carpintería Taller PWA
// Soporte 100% Offline para navegación, cálculo y optimizador en taller

const CACHE_NAME = 'carpinteria-taller-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Instalación del Service Worker: precargar shell esencial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-caching static assets warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: reclamar clientes y limpiar cachés obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Fetch:
// 1. Para navegación HTML: Red primero con respaldo en caché (permite abrir la app offline)
// 2. Para recursos estáticos (JS, CSS, Fuentes, Imágenes, Iconos): Caché primero / Stale-While-Revalidate con respaldo dinámico
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignorar peticiones que no sean GET o esquemas no soportados (e.g. chrome-extension:)
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Navegación (HTML SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          return caches.match('/');
        })
    );
    return;
  }

  // Recursos estáticos y activos de la app
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalidar si hay conexión
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {
          // Sin conexión: simplemente se usa la copia en caché
        });

        return cachedResponse;
      }

      // Si no está en caché, buscar en red y guardar para uso offline futuro
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // En caso de fallo total (offline) para imágenes/iconos, fallback a icono SVG
          if (request.destination === 'image') {
            return caches.match('/icon.svg');
          }
        });
    })
  );
});
