// Self-cleaning service worker: purge legacy precache buckets so browsers always fetch fresh Vercel bundles.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.registration.unregister();
      } catch {
        // ignore cache cleanup failures
      }
    })(),
  );
});
