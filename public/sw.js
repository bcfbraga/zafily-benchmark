// Zafily service worker — intentionally minimal.
//
// This app is a live-commerce dashboard: product prices, click counts, and
// vitrine content must always be current, especially during a live shopping
// event. So this worker does NOT cache API responses or dynamic pages — it
// only makes the app installable and provides an offline fallback page when
// there's truly no connection.

const CACHE_NAME = "zafily-shell-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;

  // Only handle top-level page navigations; everything else (API calls,
  // images, scripts) goes straight to the network, uncached.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL))
  );
});
