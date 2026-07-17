// Minimal service worker — exists mainly to satisfy PWA installability criteria
// (a fetch handler is required by Chrome/Edge's "Add to Home Screen" heuristics).
// Deliberately network-first / no offline cache: this app talks to a live API and
// stale cached HTML/JS would be actively harmful (outdated auth flows, stale data).
const CACHE_NAME = "aprenderaser-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Network-first passthrough — no caching of API responses or app bundles, just
// makes the service worker a valid fetch-handling SW as required by installability.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
