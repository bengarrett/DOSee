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
        // optional, reload the service worker to destroy the browser cache
        const update = document.getElementById(`updateDOSeeSW`);
        if (update !== null) {
          update.addEventListener(
            `click`,
            () => {
              console.info(
                `DOSee remove and reregister service worker`,
                registration
              );
              registration
                .unregister()
                .then(() => {
                  const oneSec = 500;
                  setTimeout(() => {
                    location.reload();
                  }, oneSec);
                })
                .catch(function (error) {
                  console.log(
                    `DOSee could not unregister, the host server maybe offline?\n${error}`
                  );
                });
            },
            false
          );
        }
      })
      .catch((err) => {
        console.log(`DOSee service worker registration failed: ${err}`);
      });
  });
}
