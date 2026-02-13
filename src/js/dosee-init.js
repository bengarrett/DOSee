/*
 * dosee-init.js
 * DOSee initialisation
 */
(async () => {
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

  // Relative file paths to DOSee emulation dependencies
  const paths = new Map()
    .set(`driveGUS`, `disk_drives/g_drive.zip`)
    .set(`driveConfigs`, `disk_drives/s_drive.zip`)
    .set(`driveUtils`, `disk_drives/u_drive.zip`)
    .set(`sync`, `emulator/dosbox-sync.js`)
    .set(`mem`, `emulator/dosbox-sync.mem`)
    .set(`core`, `emulator/dosbox.js`)
    .set(`wasm`, `emulator/dosbox.wasm`);

  // Gamepad support initialization
  let gamepadSupport;
  try {
    // Try to import the gamepad module (works with ES modules)
    gamepadSupport = new (await import('./dosee-gamepad.js')).default();
    gamepadSupport.init();
    doseeLog('info', 'Gamepad support initialized');
  } catch (error) {
    // Fallback for non-module environments or if file doesn't exist
    console.warn('Gamepad module not available:', error.message);
    gamepadSupport = null;
  }

  // Load configurations that are obtained from the <meta name="dosee:"> HTML tags
  const config = new Map()
    .set(`path`, DOSee.getMetaContent(`dosee:zip:path`))
    .set(`exe`, DOSee.getMetaContent(`dosee:run:filename`))
    .set(`utils`, DOSee.getMetaContent(`dosee:utilities`) || `false`) // Default: false
    .set(`gus`, DOSee.getMetaContent(`dosee:audio:gus`) || `false`) // Default: false
    .set(`res`, DOSee.getMetaContent(`dosee:width:height`) || ``) // Default: empty string
    .set(`filename`, DOSee.getMetaContent(`dosee:loading:name`) || ``) // Default: empty string
    .set(`start`, false);

  // Configure gamepad support
  if (gamepadSupport) {
    // Import gamepad configs for layout detection
    const { gamepadConfigs } = await import('./dosee-gamepad.js');
    
    // Check if localStorage settings exist
    const hasLocalSettings = localStorage.getItem('doseeGamepadSettings') !== null;
    
    if (hasLocalSettings) {
      // LocalStorage settings exist - they were already loaded in init()
      doseeLog('info', 'Gamepad support using saved settings from localStorage');
      
      // Ensure the gamepad is enabled if the saved setting says it should be
      if (gamepadSupport.enabled) {
        doseeLog('info', `Gamepad support enabled with ${gamepadSupport.config === gamepadConfigs.xbox ? 'xbox' : 'playstation'} layout (from localStorage)`);
      }
    } else {
      doseeLog('info', 'Gamepad support ready - use UI to enable and configure');
    }

    // Add UI controls for gamepad
    try {
      const gamepadUIModule = await import('./dosee-gamepad-ui.js');
      gamepadUIModule.addGamepadUI(gamepadSupport);
    } catch (error) {
      console.warn('Gamepad UI module not available:', error.message);
    }
  }

  const checks = () => {
    const err = `html page is missing the required meta tag`;
    if (config.get(`path`) === null) throw Error(`${err} "dosee:zip:path"`);
    if (config.get(`exe`) === null) throw Error(`${err} "dosee:run:filename"`);
  };

  // Extract and save the filename from config path
  const extractSave = () => {
    // Get values with null checks
    const path = config.get(`path`);
    const filename = config.get(`filename`);

    // Early return if filename already set
    if (filename !== '') return;

    // Validate path exists and is a string
    if (typeof path !== 'string' || path.length === 0) {
      console.warn(`DOSee: Invalid or missing path in config`);
      return;
    }

    // Extract filename from path
    const index = path.lastIndexOf(`/`);
    if (index === -1) {
      // No slash found, use entire path as filename
      config.set(`filename`, path);
    } else if (index === 0) {
      // Path starts with /, get everything after
      config.set(`filename`, path.slice(1));
    } else {
      // Normal case: get everything after last /
      config.set(`filename`, path.slice(index + 1));
    }
  };

  // Handle URL params special cases that need additional files to be loaded by DOSee
  const specialCaseURLs = () => {
    const urlParams = DOSee.newQueryString();
    // Gravis UltraSound Audio drivers (dosaudio=gus)
    const audio = urlParams.get(`dosaudio`);
    const gusFallback =
      (typeof audio === `undefined` || audio === null) &&
      DOSee.getMetaContent(`dosee:audio`) === `gus`;
    if (audio === `gus` || gusFallback) {
      config.set(`gus`, `true`);
      DOSee.setMetaContent(`dosee:audio:gus`, `true`);
    }
    // DOSee Utilities (dosutils=true)
    const utils = urlParams.get(`dosutils`);
    if (utils === `true`) {
      config.set(`utils`, `true`);
      DOSee.setMetaContent(`dosee:utilities`, `true`);
    }
  };

  // Load the GUS (Gravis UltraSound) driver
  const gravisDriver = (load) => {
    if (load !== `true`) {
      if (load !== `false` && load !== ``) {
        doseeLog(
          'error',
          `Invalid GUS audio configuration value "${load}". ` +
            `Use "true" to enable or omit/"false"/"" to disable.`
        );
      }
      return null;
    }
    return DoseeLoader.mountZip(
      `g`,
      DoseeLoader.fetchFile(
        `Gravis UltraSound (GUS) drivers`,
        `${paths.get(`driveGUS`)}`
      )
    );
  };

  // Load the Emscripten static memory initialization code external file
  // https://kripken.github.io/emscripten-site/docs/optimizing/Optimizing-Code.html#code-size
  const locateFiles = (filename) => {
    switch (filename) {
      case `dosbox.html.mem`:
        return `${paths.get(`mem`)}`;
      default:
        return `/emulator/${filename}`;
    }
  };

  try {
    checks();
  } catch (error) {
    console.error(`DOSee initialization failed:`, error);
    return errorBox(
      `DOSee cannot start due to missing required configuration.`
    );
  }
  extractSave();
  specialCaseURLs();

  // Initialise the resolution of the DOS program - width, height
  const nativeResolution = () => {
    const defaults = [DOSee.gfx.mode13h.width, DOSee.gfx.mode13h.height];
    const resConfig = config.get(`res`);

    try {
      // Check if empty or missing (valid - use defaults silently)
      if (typeof resConfig !== 'string' || resConfig.length === 0) {
        return defaults;
      }

      // Split and validate format
      const resolutions = resConfig.split(`,`);
      if (resolutions.length !== 2) {
        doseeLog(
          'error',
          `Invalid resolution format "${resConfig}". ` +
            `Expected "width,height" (e.g., "640,480" or "800,600").`
        );
        return defaults;
      }

      // Parse and validate numbers (trim whitespace for robustness)
      const width = parseInt(resolutions[0].trim(), 10);
      const height = parseInt(resolutions[1].trim(), 10);

      // Check for non-numeric values
      if (isNaN(width) || isNaN(height)) {
        doseeLog(
          'error',
          `Invalid resolution values "${resConfig}". ` +
            `Width and height must be valid numbers.`
        );
        return defaults;
      }

      // Check for zero or negative values
      if (width <= 0 || height <= 0) {
        doseeLog(
          'error',
          `Invalid resolution values "${resConfig}". ` +
            `Width and height must be positive numbers greater than 0.`
        );
        return defaults;
      }
      const maximum = 4096;
      // Optional: Prevent unreasonably large resolutions
      if (width > maximum || height > maximum) {
        doseeLog(
          'error',
          `Unreasonably large resolution "${resConfig}". ` +
            `Maximum supported resolution is 4096x4096.`
        );
        return defaults;
      }

      return [width, height];
    } catch (error) {
      doseeLog(
        'error',
        `Failed to parse resolution "${resConfig}": ${error.message}`
      );
      return defaults;
    }
  };

  // Load additional DOS tools and utilities
  const utilities = (load) => {
    if (load !== `true`) {
      if (load !== `false` && load !== ``) {
        doseeLog(
          'error',
          `Invalid utilities configuration value "${load}". ` +
            `Use "true" to enable or omit/"false"/"" to disable.`
        );
      }
      return null;
    }
    const driveLetter = `u`;
    return DoseeLoader.mountZip(
      driveLetter,
      DoseeLoader.fetchFile(`DOSee utilities`, `${paths.get(`driveUtils`)}`)
    );
  };

  // Initialise canvas size
  const canvasSize = () => {
    const canvas = document.getElementById(`doseeCanvas`);
    if (canvas === null) {
      console.error(
        `DOSee: Canvas element #doseeCanvas not found. Cannot initialize canvas size.`
      );
      return;
    }
    canvas.width = nativeResolution()[0];
    canvas.height = nativeResolution()[1];
  };
  canvasSize();

  // Check the browser protocol that DOSee is hosted on
  // Modern browsers to not permit the loading of web resources using fetch API
  // over `file:///` or `ftp://` as they do not support Cross-origin resource sharing.
  // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
  const protocolCheck = () => {
    const url = new URL(window.location.href);
    switch (url.protocol) {
      case `http:`:
      case `https:`:
        return;
      default:
        // invalid protocols
        try {
          throw new Error(
            `DOSee has aborted as it cannot be hosted over the "${url.protocol}" protocol.`
          );
        } catch (err) {
          console.error(err);
        }
        return errorBox(`DOSee cannot run over the ${url.protocol} protocol`);
    }
  };

  // Displays an dark red error notice with custom `feedback` and a README link
  const errorBox = (feedback) => {
    const a = document.createElement(`a`),
      errMsg = `${feedback}. Have you followed these `,
      crash = document.getElementById(`doseeCrashed`),
      error = document.getElementById(`doseeError`),
      slowLoad = document.getElementById(`doseeSlowLoad`);

    // Check if required elements exist
    if (crash === null || error === null || slowLoad === null) {
      console.error(`DOSee: Required error display elements not found in DOM`);
      return;
    }

    a.href = `https://github.com/bengarrett/DOSee#readme`;
    a.textContent = ` setup instructions? `;
    a.style.backgroundColor = `red`;
    a.style.color = `white`;
    a.style.textDecoration = `underline`;
    slowLoad.style.display = `none`;
    crash.classList.remove(`hidden`);
    error.textContent = errMsg;
    error.append(a);
  };

  // Start DOSee without user interaction
  // NOTE: This may break audio support in Chrome 71+ due to its Web Audio autoplay policy?
  // https://goo.gl/7K7WLu
  if (DOSee.storageAvailable(`local`)) {
    const autoStartItem = localStorage.getItem(`doseeAutoStart`);
    if (autoStartItem === 'true') {
      config.set(`start`, true);
    }
    // Note: autoStartItem could be null (first run) or "false" (disabled)
  }
  if (config.get(`start`) === true)
    console.log(`DOSee will launch automatically`);

  // Initialise DOSee
  // Note order of these DoseeLoader values are important and swapping them could cause failures
  // dosee-core.js is the compiled Emscripten edition of DOSBox and should not be minified
  const wantsWASM = `WebAssembly` in window;

  const driveC = `c`,
    driveConfigs = `s`,
    init = new DoseeLoader(
      DoseeLoader.emulatorJS(`${paths.get(wantsWASM ? `core` : `sync`)}`),
      DoseeLoader.emulatorWASM(`${paths.get(`wasm`)}`),
      DoseeLoader.locateAdditionalEmulatorJS(locateFiles),
      DoseeLoader.nativeResolution(
        nativeResolution()[0],
        nativeResolution()[1]
      ),
      DoseeLoader.mountZip(
        driveC,
        DoseeLoader.fetchFile(
          `'${config.get(`filename`)}'`,
          `${config.get(`path`)}`
        )
      ),
      DoseeLoader.mountZip(
        driveConfigs,
        DoseeLoader.fetchFile(
          `DOSee configurations`,
          `${paths.get(`driveConfigs`)}`
        )
      ),
      gravisDriver(config.get(`gus`)),
      utilities(config.get(`utils`)),
      DoseeLoader.startExe(config.get(`exe`))
    );

  // Start DOSee!
  const canvasElement = document.querySelector(`#doseeCanvas`);
  if (canvasElement === null) {
    console.error(
      `DOSee: Canvas element #doseeCanvas not found. Cannot initialize emulator.`
    );
    return;
  }
  const emulator = new Emulator(canvasElement, init);
  emulator.start({ waitAfterDownloading: !config.get(`start`) });

  // Checks for and provides feedback for missing dependencies after all other JS has been loaded
  window.addEventListener(`load`, () => {
    protocolCheck();
    const doseeObjects = [
      `BrowserFS`,
      `DOSee`,
      `DoseeLoader`,
      `FileSaver`,
      `Module`,
    ];
    let pass = true;
    doseeObjects.forEach((objName) => {
      if (typeof window[objName] === `undefined`) {
        console.error(`checking ${objName}, ${typeof window[objName]}`);
        pass = false;
        // Continue loop to check all dependencies for comprehensive debugging
        return;
      }
      console.log(
        `%cDOSee`,
        `color:dimgray;font-weight:bold`,
        `checking ${objName}, ${typeof window[objName]}`
      );
    });
    if (!pass) {
      // console output
      console.error(
        `DOSee has aborted as it is missing the above dependencies.`
      );
      // error link
      return errorBox(
        `DOSee cannot load the required dependencies listed the Browser Console.`
      );
    }
  });
})();
