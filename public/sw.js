const CACHE = 'sleepseed-v2';

// Install — skip waiting immediately
self.addEventListener('install', () => self.skipWaiting());

// Activate — clear old caches, claim all clients
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — network first, always. Cache is only a bonus fallback.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept API calls — let them go straight to the network
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('anthropic') ||
    url.hostname.includes('elevenlabs')
  ) {
    return;
  }

  // Everything else: network first, cache as fallback
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (e.request.method === 'GET' && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached || Response.error())
      )
  );
});
