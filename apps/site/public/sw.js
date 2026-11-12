// An earlier version of the site registered its worker at this address. Browsers that still hold it fetch this
// file on their next visit; it clears what that worker cached, removes itself and reloads the open pages.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const pages = await self.clients.matchAll({ type: 'window' });
      await Promise.all(pages.map((page) => page.navigate(page.url).catch(() => undefined)));
    })(),
  );
});
