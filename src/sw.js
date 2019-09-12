/* eslint-disable */
importScripts(
    `https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js`
)

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`)

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
    console.log(`Boo! Workbox didn't load 😬`)
}
