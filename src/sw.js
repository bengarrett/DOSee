/* eslint-disable */
importScripts(
    `https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js`
)

if (workbox) {
    console.log(`Loaded Workbox service worker library`)

    workbox.precaching.precacheAndRoute([])

    workbox.routing.registerRoute(/(.*)article(.*)\.html/, args => {
        return articleHandler.handle(args).then(response => {
            if (!response) {
                return caches.match(`offline.html`)
            } else if (response.status === 404) {
                return caches.match(`404.html`)
            }
            return response
        })
    })
} else {
    console.warn(`Failed to load Workbox service worker library`)
}
