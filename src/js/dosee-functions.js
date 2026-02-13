/*
 * dosee-functions.js
 * DOSee user-interface functions
 */
(() => {
  'use strict';

  // DOSee console logging utility with consistent styling
  const doseeLog = (level, message) => {
    const styles = `color:dimgray;font-weight:bold`;
    const prefix = `%cDOSee`;

    switch (level) {
      case 'error':
        console.error(prefix, styles, message);
        break;
      case 'warn':
        console.warn(prefix, styles, message);
        break;
      case 'info':
      default:
        console.log(prefix, styles, message);
    }
  };

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
    const canvas = document.getElementById(`doseeCanvas`);
    if (canvas === null) {
      doseeLog('error', `Canvas element #doseeCanvas not found, cannot resize`);
      return null;
    }

    doseeLog('info', `Resizing DOSee canvas to ${width}*${height}px`);
    return window._emscripten_set_element_css_size(
      canvas,
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
        location: 1,
      })
    );
    body.dispatchEvent(
      new KeyboardEvent(`keydown`, {
        bubbles: true,
        cancelable: true,
        code: `F9`,
        composed: true,
        key: `F9`,
        location: 0,
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
    if (!elm[0] || !elm[0].hasAttribute('content')) return null;
    return elm[0].getAttribute('content');
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
    if (elm === null) return false;
    if (elm.length === 0) return false;
    if (!elm[0] || !elm[0].hasAttribute('content')) return false;

    try {
      elm[0].setAttribute('content', `${value}`);
      return true; // Success
    } catch (error) {
      doseeLog(
        'error',
        `Failed to set meta content for ${name}: ${error.message}`
      );
      return false; // Failure
    }
  };

  // Full screen toggle that uses the Fullscreen API
  // (https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
  DOSee.fullScreen = () => {
    if (typeof document.fullscreenElement === `undefined`)
      return doseeLog('info', `Filescreen API is not supported`);

    const element = document.getElementById(`doseeCanvas`),
      restoreValue = element.style.imageRendering;

    // Store handlers in variables for proper cleanup
    const errorHandler = () => {
      doseeLog('error', `Filescreen API resulted in an error`);
    };
    const changeHandler = () => {
      if (!document.fullscreenElement) {
        element.style.imageRendering = restoreValue;
      }
    };

    // Remove old handlers first to prevent memory leaks
    element.removeEventListener('fullscreenerror', errorHandler);
    element.removeEventListener('fullscreenchange', changeHandler);

    // Add new handlers
    element.addEventListener('fullscreenerror', errorHandler);
    element.addEventListener('fullscreenchange', changeHandler);

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
        const exists = typeof Boolean(new Blob()) === `undefined`;
        if (exists) return false;
      } catch {
        return false;
      }
      return true;
    };
    if (!blobSupport()) return;

    try {
      const button = this,
        canvas = document.getElementById(`doseeCanvas`);
      if (canvas === null) {
        throw new Error(`Canvas element not found`);
      }

      const filename = DOSee.getMetaContent(`dosee:capture:filename`);
      if (!filename || filename.trim() === '') {
        throw new Error(`Capture filename not specified in meta tags`);
      }

      const milliSeconds = 750,
        restoreValue = canvas.style.borderRadius;

      // Visual feedback for user
      canvas.style.borderRadius = `unset`;
      button.style.color = `green`;
      canvas.toBlob((blob) => {
        try {
          if (!blob) {
            throw new Error(`Failed to create image blob`);
          }

          // uses FileSaver.js to save the image locally
          FileSaver.saveAs(blob, filename);
          doseeLog('info', `Screen capture saved as ${filename}`);

          // Success feedback
          setTimeout(() => {
            button.style.color = `black`;
          }, milliSeconds);
        } catch (error) {
          doseeLog('error', `Failed to save screen capture: ${error.message}`);
          button.style.color = `red`; // Error feedback
          setTimeout(() => {
            button.style.color = `black`;
          }, milliSeconds * 2);
        } finally {
          // Always restore styles
          canvas.style.borderRadius = restoreValue;
        }
      }, `image/png`); // Explicit MIME type
    } catch (error) {
      doseeLog('error', `Screen capture failed: ${error.message}`);
      // Provide user feedback if possible
      if (this && typeof this.style !== 'undefined') {
        this.style.color = `red`;
        setTimeout(() => {
          this.style.color = `black`;
        }, 1000);
      }
    }
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
      } catch {
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

      // Safe localStorage access with validation
      try {
        const item = localStorage.getItem(`doseeAutoStart`);
        if (item === null) return; // No setting stored yet

        // Convert string to boolean properly
        const autoStart = item === 'true'; // Proper string-to-boolean conversion
        autoRun.checked = autoStart;
      } catch (error) {
        doseeLog(
          'error',
          `Failed to restore auto-run setting: ${error.message}`
        );
      }
    };
    const sharpenText = () => {
      // For sharper DOS ASCII/ANSI text
      const aspect = document.getElementById(`doseeAspect`);
      if (aspect === null) return;
      aspect.addEventListener(`click`, () => {
        const value = aspect.checked;
        localStorage.setItem(`doseeAspect`, !value); // Intentional inversion for "Disable" checkbox
      });

      // Safe localStorage access with validation
      try {
        const item = localStorage.getItem(`doseeAspect`);
        if (item === null) return; // No setting stored yet

        // Convert string to boolean properly
        const aspectRatio = item === 'true'; // Proper string-to-boolean conversion
        aspect.checked = aspectRatio;
      } catch (error) {
        doseeLog(
          'error',
          `Failed to restore aspect ratio setting: ${error.message}`
        );
      }
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
    const exists = typeof Boolean(new Blob()) !== `undefined`;
    if (exists) {
      const button = document.getElementById(`doseeCaptureScreen`);
      if (button !== null)
        button.addEventListener(`click`, DOSee.screenCapture);
    }
  } catch (err) {
    doseeLog('error', err.message);
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
