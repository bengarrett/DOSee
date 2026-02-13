/*
 * dosee-sw.js
 * DOSee service worker
 */

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

if ('serviceWorker' in navigator) {
  ('use strict');

  // Debug logging function
  const debugLog = (message, type = 'log') => {
    if (typeof console !== 'undefined') {
      const timestamp = new Date().toISOString();
      let logMethod = console.log;

      if (type === 'error') logMethod = console.error;
      else if (type === 'warn') logMethod = console.warn;
      else if (type === 'info') logMethod = console.info;

      logMethod(
        `[DOSee ServiceWorker ${timestamp}] [${type.toUpperCase()}] ${message}`
      );
    }
  };

  // Check if we're in development mode
  const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

  if (isDevelopment) {
    debugLog('Running in development mode - enabling extra debugging', 'info');
  }

  window.addEventListener('load', () => {
    'use strict';

    // Check for common service worker issues
    if (isDevelopment) {
      // Check if we're on HTTPS or localhost (service workers require HTTPS)
      if (
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        debugLog('Service workers require HTTPS (except localhost)', 'warn');
      }

      // Check if the page is being served from file:// (won't work)
      if (window.location.protocol === 'file:') {
        debugLog('Service workers do not work with file:// protocol', 'error');
      }
    }
    // Use relative path based on the current location
    // Try to determine the correct path based on the current script location
    const swPath = (function () {
      // Always try the root path first (most common case)
      if (window.location.protocol !== 'file:') {
        return '/sw.js';
      }

      // For file protocol, try to calculate relative path
      const pathParts = window.location.pathname.split('/');
      // Remove current file from path (pop not needed, just check if we need to go up)
      pathParts.pop(); // Remove current file

      // If we're in a subdirectory, go up to root
      if (pathParts.length > 0) {
        return '../'.repeat(pathParts.length) + 'sw.js';
      }

      // Default to root path
      return '/sw.js';
    })();

    debugLog(`Attempting to register service worker from: ${swPath}`, 'info');
    debugLog(`Current page location: ${window.location.href}`, 'info');
    debugLog(`Current pathname: ${window.location.pathname}`, 'info');

    // Test if the service worker file is accessible before trying to register
    async function testServiceWorkerAccessibility(path) {
      try {
        const response = await fetch(path, {
          method: 'HEAD',
          cache: 'no-store',
        });
        if (response.ok) {
          debugLog(
            `Service worker file accessible at: ${path} (${response.status})`,
            'success'
          );
          return true;
        } else {
          debugLog(
            `Service worker file exists but returned status: ${response.status} at ${path}`,
            'warn'
          );
          return false;
        }
      } catch (error) {
        debugLog(
          `Service worker file not accessible at: ${path} - ${error.message}`,
          'error'
        );
        return false;
      }
    }

    // Try multiple paths if the first one fails
    const pathsToTry = [swPath, '/sw.js', './sw.js', '../sw.js'];

    // Test all paths first to see which ones are accessible
    Promise.all(
      pathsToTry.map((path) => testServiceWorkerAccessibility(path))
    ).then((results) => {
      const accessiblePaths = pathsToTry.filter((_, index) => results[index]);
      if (accessiblePaths.length > 0) {
        debugLog(
          `Accessible service worker paths: ${accessiblePaths.join(', ')}`,
          'success'
        );
      } else {
        debugLog('No accessible service worker paths found!', 'error');
      }
    });

    function tryRegisterServiceWorker(paths, index = 0) {
      if (index >= paths.length) {
        debugLog('All service worker registration paths failed');
        throw new Error('Could not register service worker from any path');
      }

      const currentPath = paths[index];
      debugLog(
        `Attempt ${index + 1}/${paths.length}: Registering from ${currentPath}`
      );

      return navigator.serviceWorker
        .register(currentPath, { scope: '/' })
        .catch((error) => {
          debugLog(`Failed to register from ${currentPath}: ${error.message}`);
          return tryRegisterServiceWorker(paths, index + 1);
        });
    }

    tryRegisterServiceWorker(pathsToTry)
      .then((registration) => {
        doseeLog('info', `Service worker registered: ${registration.scope}`);
        debugLog(
          `Service worker registered successfully with scope: ${registration.scope}`,
          'success'
        );

        // Check for updates if this is not the first load
        if (navigator.serviceWorker.controller) {
          debugLog('Service worker is controlling the page', 'info');
          registration.update().then(() => {
            debugLog('Checked for service worker updates', 'info');
          });
        } else {
          debugLog(
            'Service worker registered but not yet controlling the page',
            'info'
          );
        }

        // Update button state to show service worker is active
        const update = document.getElementById('updateDOSeeSW');
        if (update !== null) {
          update.textContent = 'Update DOSee (Service Worker Active)';
          update.title = 'Click to update DOSee and reload service worker';

          // Add service worker state monitoring
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            debugLog(
              'Service worker controller changed - new version available',
              'info'
            );
            update.textContent = 'Update Available! Click to reload';
            update.classList.add('update-available');
          });

          update.addEventListener(
            'click',
            () => {
              doseeLog('info', 'Remove and reregister service worker');
              debugLog('User initiated service worker update', 'info');

              // Show loading state
              update.textContent = 'Updating...';
              update.disabled = true;

              registration
                .unregister()
                .then(() => {
                  debugLog(
                    'Service worker unregistered successfully',
                    'success'
                  );
                  const oneSec = 500;
                  setTimeout(() => {
                    location.reload();
                  }, oneSec);
                })
                .catch((error) => {
                  doseeLog(
                    'error',
                    `Could not unregister service worker: ${error.message}`
                  );
                  debugLog(
                    `Service worker update failed: ${error.message}`,
                    'error'
                  );
                  update.textContent = 'Update Failed';
                  update.disabled = false;
                });
            },
            false
          );
        }
        // Add message event listener for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          debugLog(`Message from service worker: ${event.data}`, 'info');
        });
      })
      .catch((err) => {
        doseeLog('error', `Service worker registration failed: ${err.message}`);
        // Provide user feedback about the failure
        const updateButton = document.getElementById(`updateDOSeeSW`);
        if (updateButton) {
          updateButton.textContent = `Service worker failed to register`;
          updateButton.disabled = true;
        }
      });
  });
} else {
  const message = `Service worker not supported in this browser`;
  doseeLog('info', message);
  const updateButton = document.getElementById(`updateDOSeeSW`);
  if (updateButton) {
    updateButton.value = message;
    updateButton.disabled = true;
    updateButton.classList.remove('secondary');
  }
}
