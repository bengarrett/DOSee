/*
 * dosee-sw.js
 * DOSee service worker
 */

if (`serviceWorker` in navigator) {
  `use strict`;
  window.addEventListener(`load`, () => {
    "use strict";
    navigator.serviceWorker
      .register(`/sw.js`)
      .then((registration) => {
        console.log(`DOSee service worker registered: ${registration.scope}`);
      })
      .catch((err) => {
        console.log(`DOSee service worker registration failed: ${err}`);
      });
  });
}
