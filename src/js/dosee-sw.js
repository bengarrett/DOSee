/*
 * dosee-sw.js
 * DOSee service worker
 */

"use strict"
if (`serviceWorker` in navigator) {
    window.addEventListener(`load`, () => {
        navigator.serviceWorker
            .register(`/sw.js`)
            .then(registration => {
                console.log(
                    `DOSee service worker registered: ${registration.scope}`
                )
            })
            .catch(err => {
                console.log(`DOSee service worker registration failed: ${err}`)
            })
    })
}
