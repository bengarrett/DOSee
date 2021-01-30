/*globals articleHandler importScripts workbox*/
importScripts(`/js/workbox-sw.js`);

if (!workbox) {
  console.warn(`Failed to load Workbox service worker library`);
} else {
  console.log(`Loaded Workbox v5 service worker library`);

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  workbox.routing.registerRoute(/(.*)article(.*)\.html/, (args) => {
    return articleHandler.handle(args).then((response) => {
      if (!response) return caches.match(`offline.html`);
      if (response.status === 404) return caches.match(`404.html`);
      return response;
    });
  });
}
