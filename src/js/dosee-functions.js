/*
 * dosee-functions.js
 * DOSee user-interface functions
 */
(() => {
  "use strict";
  // Create a DOSee object prototype
  function DOSee(args) {
    return Array.prototype.reduce.call(...args);
  }

  // PC graphic modes
  // http://www.brokenthorn.com/Resources/OSDevVid2.html
  DOSee.gfx = {
    // VGA mode 12, 640x480 planar 16-color mode
    mode12h: {
      width: 640,
      height: 480,
    },
    // VGA mode 13, 320x200 linear 256-color mode (upscaled by 2)
    mode13h: {
      width: 640,
      height: 400,
    },
  };

  // Resize the DOSee canvas
  DOSee.canvasResize = (
    width = DOSee.gfx.mode13h.width,
    height = DOSee.gfx.mode13h.height
  ) => {
    console.log(`Resizing DOSee canvas to ${width}*${height}px`);
    return window._emscripten_set_element_css_size(
      document.getElementById(`doseeCanvas`),
      parseInt(width),
      parseInt(height)
    );
  };

  // Aborts DOSee pressing the DOSBox Ctrl-F9 keyboard key combination.
  DOSee.exit = () => {
    const body = document.getElementsByTagName(`body`)[0];
    body.dispatchEvent(
      new KeyboardEvent(`keydown`, {
        bubbles: true,
        cancelable: true,
        code: `ControlLeft`,
        composed: true,
        ctrlKey: true,
        key: `Control`,
        keyCode: 17,
        location: 1,
        witch: 17,
      })
    );
    body.dispatchEvent(
      new KeyboardEvent(`keydown`, {
        bubbles: true,
        cancelable: true,
        code: `F9`,
        composed: true,
        key: `F9`,
        keyCode: 120,
        location: 0,
        witch: 120,
      })
    );
    const e = document.getElementById(`doseeExit`);
    if (e !== null) e.classList.add(`hide-true`);
    const h = document.getElementById(`doseeHalted`);
    if (h !== null) h.classList.remove(`hide-true`);
  };

  // Returns the content data stored in a HTML <meta> tag
  DOSee.getMetaContent = (name) => {
    const elm = document.getElementsByName(name);
    if (elm === null) return null;
    if (elm.length === 0) return null;
    if (elm[0].length === 0) return null;
    return elm[0].getAttribute(`content`);
  };

  // Extracts the URL query string and run it through the URLSearchParams API
  DOSee.newQueryString = () => {
    const url = window.location.href,
      start = url.indexOf(`?`),
      end = url.indexOf(`#`);
    // URLSearchParams API works best with only the URL query string
    // slice string value between ? and #
    if (end >= 0) return new URLSearchParams(url.slice(start, end));
    // slice string value starting at ? to the end of the URL
    return new URLSearchParams(url.slice(start));
  };

  // Updates the content data stored in a HTML <meta> tag
  DOSee.setMetaContent = (name, value) => {
    const elm = document.getElementsByName(name);
    if (elm === null) return null;
    if (elm[0].length === 0) return null;
    if (!elm[0].hasAttribute(`content`)) return null;
    return elm[0].setAttribute(`content`, `${value}`);
  };

  // Full screen toggle that uses the Fullscreen API
  // (https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
  DOSee.fullScreen = () => {
    if (typeof document.fullscreenElement === `undefined`)
      return console.log(`Filescreen API is not supported`);

    const element = document.getElementById(`doseeCanvas`),
      restoreValue = element.style.imageRendering;

    element.onfullscreenerror = () => {
      console.log(`Filescreen API resulted in an error`);
    };
    element.onfullscreenchange = () => {
      if (!document.fullscreenElement) {
        return (element.style.imageRendering = `${restoreValue}`);
      }
    };

    if (!document.fullscreenElement) {
      // Smooth out the font rendering while in full screen
      element.style.imageRendering = `auto`;
      return element.requestFullscreen();
    }
  };

  // Capture and save the canvas to a PNG image file
  // Arrow function does not support the `this` value
  DOSee.screenCapture = function () {
    const blobSupport = () => {
      try {
        if (typeof Boolean(new Blob()) === `undefined`) return false;
      } catch (err) {
        return false;
      }
      return true;
    };
    if (!blobSupport()) return;
    const button = this,
      canvas = document.getElementById(`doseeCanvas`),
      filename = DOSee.getMetaContent(`dosee:capture:filename`),
      milliSeconds = 750,
      restoreValue = canvas.style.borderRadius;
    // the default .toBlob() saved image type is image/png
    // but it can be swapped: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
    canvas.style.borderRadius = `unset`;
    canvas.toBlob((blob) => {
      // cycles the colours of the button when clicked
      button.style.color = `green`;
      setTimeout(() => {
        button.style.color = `black`;
      }, milliSeconds);
      // uses FileSaver.js to save the image locally
      FileSaver.saveAs(blob, filename);
      canvas.style.borderRadius = restoreValue;
    });
  };

  // Test the local storage availability for the browser
  // Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  DOSee.storageAvailable = (type) => {
    const test = (store) => {
      try {
        const storage = window[store],
          x = `__storage_test__`;
        storage.setItem(x, `test data`);
        storage.removeItem(x);
        return true;
      } catch (err) {
        return false;
      }
    };
    switch (type) {
      case `local`:
      case `session`:
        return test(`${type}Storage`);
      default:
        return false;
    }
  };

  DOSee.reboot = () => {
    location.reload();
  };

  // Make DOSee a global object to allow access by other scripts
  window.DOSee = DOSee;

  // 'Options' tab interactions

  // Restore existing and save new interactions that are kept after the browser is closed
  const restoreOptions = () => {
    const automaticRun = () => {
      // Automatically start DOS emulation
      const autoRun = document.getElementById(`doseeAutoRun`);
      if (autoRun === null) return;
      autoRun.addEventListener(`click`, () => {
        // boolean value
        const value = autoRun.checked;
        localStorage.setItem(`doseeAutoStart`, value);
      });
      const item = localStorage.getItem(`doseeAutoStart`);
      if (item === `true`) autoRun.checked = true;
    };
    const sharpenText = () => {
      // For sharper DOS ASCII/ANSI text
      const aspect = document.getElementById(`doseeAspect`);
      if (aspect === null) return;
      const item = localStorage.getItem(`doseeAspect`);
      aspect.addEventListener(`click`, () => {
        const value = aspect.checked;
        localStorage.setItem(`doseeAspect`, !value);
      });
      if (item === `false`) aspect.checked = true;
    };
    const scalerEngine = () => {
      // Scaler engine
      const scaler = document.querySelectorAll(`input[name=dosscale]`);
      scaler.forEach((input) => {
        input.addEventListener(
          `change`,
          (element) => {
            localStorage.setItem(`doseeScaler`, element.target.value);
          },
          0
        );
      });
    };
    automaticRun();
    sharpenText();
    scalerEngine();
  };
  if (DOSee.storageAvailable(`local`)) restoreOptions();

  // Full screen button
  const fullScreen = () => {
    const button = document.getElementById(`doseeFullScreen`);
    if (button === null) return;
    if (typeof document.fullscreenElement === `undefined`) {
      // disable and hide the button if API is not supported
      return (button.style.display = `none`);
    }
    button.addEventListener(`click`, DOSee.fullScreen);
  };
  fullScreen();

  // Screen capture button
  try {
    if (typeof Boolean(new Blob()) !== `undefined`) {
      const button = document.getElementById(`doseeCaptureScreen`);
      if (button !== null)
        button.addEventListener(`click`, DOSee.screenCapture);
    }
  } catch (err) {
    console.error(err);
  }

  // Reboot button and links
  document.getElementsByName(`doseeReboot`).forEach((element) => {
    element.addEventListener(`click`, DOSee.reboot);
  });

  // Stop, abort, quit button
  const exitButton = document.getElementById(`doseeExit`);
  if (exitButton !== null)
    return exitButton.addEventListener(`click`, DOSee.exit);
})();
