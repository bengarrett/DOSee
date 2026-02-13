/*globals articleHandler importScripts workbox*/
importScripts('js/workbox-sw.js');

// Set Workbox configuration first
if (workbox) {
  console.log('Loaded Workbox v7 service worker library');
  
  // Enable logging for debugging - must be set before using other modules
  workbox.setConfig({ debug: false });

  // Set a name for the cache to make it easier to identify
  workbox.core.setCacheNameDetails({
    prefix: 'dosee',
    suffix: 'v1',
    precache: 'precache',
    runtime: 'runtime'
  });
  
  try {
    workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
    console.log('Precaching completed successfully');
  } catch (error) {
    console.error('An error occurred while precaching and routing:', error);
  }
  
  // Route for article handling
  workbox.routing.registerRoute(
    /(.*)article(.*)\.html/,
    (args) => {
      const notFound = 404;
      return articleHandler.handle(args).then((response) => {
        if (!response) return caches.match('offline.html');
        if (response.status === notFound) return caches.match('404.html');
        return response;
      });
    }
  );
  
  // Add a fallback route for all other requests
  workbox.routing.setDefaultHandler((args) => {
    return caches.match(args.request)
      .then((response) => {
        if (response) {
          return response;
        }
        // If not in cache, try network
        return fetch(args.request)
          .catch(() => {
            // If both fail, return offline page
            return caches.match('offline.html');
          });
      });
  });
  
  // Listen for install events
  self.addEventListener('install', (event) => {
    console.log('DOSee service worker installing...');
    // Skip waiting to activate immediately
    self.skipWaiting();
  });
  
  // Listen for activate events
  self.addEventListener('activate', (event) => {
    console.log('DOSee service worker activated');
    // Claim clients immediately
    event.waitUntil(clients.claim());
  });
  
  // Listen for fetch errors
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('Network request failed, serving from cache:', event.request.url);
        return caches.match(event.request);
      })
    );
  });
  
} else {
  console.error('Failed to load Workbox service worker library');
}
