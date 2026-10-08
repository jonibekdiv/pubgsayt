/* Ranger Esports — Service Worker */

const CACHE_VERSION = 'ranger-v1';
const STATIC_CACHE = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

/* Static assets to cache on install */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

/* Install: precache shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => { /* ignore */ }))
      .then(() => self.skipWaiting())
  );
});

/* Activate: cleanup old caches */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !k.startsWith(CACHE_VERSION))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch strategy */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin (Google Fonts, DiceBear, etc.)
  if (url.origin !== self.location.origin) {
    // But cache external images (avatars, logos) with runtime cache
    if (
      url.hostname.includes('dicebear.com') ||
      url.hostname.includes('picsum.photos')
    ) {
      event.respondWith(
        caches.open(RUNTIME_CACHE).then(cache =>
          cache.match(request).then(cached => {
            if (cached) return cached;
            return fetch(request).then(res => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            }).catch(() => cached || new Response('', { status: 404 }));
          })
        )
      );
    }
    return;
  }

  // HTML navigation — network-first with fallback to cached index
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets — cache-first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
          }
          return res;
        });
      })
    );
  }
});

/* Message handler (for skipWaiting trigger) */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});