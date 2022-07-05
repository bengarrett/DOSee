/*
 * dosee-init.js
 * DOSee initialisation
 */
(() => {
  "use strict";
  // Relative file paths to DOSee emulation dependencies
  const paths = new Map()
    .set(`driveGUS`, `/disk_drives/g_drive.zip`)
    .set(`driveConfigs`, `/disk_drives/s_drive.zip`)
    .set(`driveUtils`, `/disk_drives/u_drive.zip`)
    .set(`sync`, `/emulator/dosbox-sync.js`)
    .set(`mem`, `/emulator/dosbox-sync.mem`)
    .set(`core`, `/emulator/dosbox.js`)
    .set(`wasm`, `/emulator/dosbox.wasm`);

  // Load configurations that are obtained from the <meta name="dosee:"> HTML tags
  const config = new Map()
    .set(`path`, DOSee.getMetaContent(`dosee:zip:path`))
    .set(`exe`, DOSee.getMetaContent(`dosee:run:filename`))
    .set(`utils`, DOSee.getMetaContent(`dosee:utilities`))
    .set(`gus`, DOSee.getMetaContent(`dosee:audio:gus`))
    .set(`res`, DOSee.getMetaContent(`dosee:width:height`))
    .set(`filename`, DOSee.getMetaContent(`dosee:loading:name`))
    .set(`start`, false);

  const checks = () => {
    const err = `html page is missing the required meta tag`;
    if (config.get(`path`) === null) throw Error(`${err} "dosee:zip:path"`);
    if (config.get(`exe`) === null) throw Error(`${err} "dosee:run:filename"`);
  };

  // Extract and save the filename from config path
  const extractSave = () => {
    const index = config.get(`path`).lastIndexOf(`/`),
      filename = config.get(`filename`);
    if (filename !== null) return;
    if (index)
      return config.set(`filename`, config.get(`path`).slice(index + 1));
    config.set(`filename`, config.get(`path`));
  };

  // Handle URL params special cases that need additional files to be loaded by DOSee
  const specialCaseURLs = () => {
    const urlParams = DOSee.newQueryString();
    // Gravis UltraSound Audio drivers (dosaudio=gus)
    const audio = urlParams.get(`dosaudio`);
    if (
      audio === `gus` ||
      (audio == null && DOSee.getMetaContent(`dosee:audio`) === `gus`)
    ) {
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
    if (load !== `true`) return null;
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

  checks();
  extractSave();
  specialCaseURLs();

  // Initialise the resolution of the DOS program - width, height
  const nativeResolution = () => {
    const defaults = [DOSee.gfx.mode13h.width, DOSee.gfx.mode13h.height],
      resolutions = config.get(`res`).split(`,`);
    if (!resolutions.length) return defaults;
    return [parseInt(resolutions[0]), parseInt(resolutions[1])];
  };

  // Load additional DOS tools and utilities
  const utilities = (load) => {
    if (load !== `true`) return null;
    const driveLetter = `u`;
    return DoseeLoader.mountZip(
      driveLetter,
      DoseeLoader.fetchFile(`DOSee utilities`, `${paths.get(`driveUtils`)}`)
    );
  };

  // Initialise canvas size
  const canvasSize = () => {
    const canvas = document.getElementById(`doseeCanvas`);
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
      error = document.getElementById(`doseeError`);
    a.href = `https://github.com/bengarrett/DOSee#readme`;
    a.textContent = ` setup instructions? `;
    a.style.backgroundColor = `red`;
    a.style.color = `white`;
    a.style.textDecoration = `underline`;
    document.getElementById(`doseeSlowLoad`).style.display = `none`;
    crash.classList.remove(`hidden`);
    error.textContent = errMsg;
    error.append(a);
  };

  // Start DOSee without user interaction
  // NOTE: This may break audio support in Chrome 71+ due to its Web Audio autoplay policy?
  // https://goo.gl/7K7WLu
  if (DOSee.storageAvailable(`local`)) {
    if (localStorage.getItem(`doseeAutoStart`) === `true`)
      config.set(`start`, true);
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
  const emulator = new Emulator(document.querySelector(`#doseeCanvas`), init);
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
        return (pass = false);
      }
      console.log(
        `%cDOSee`,
        `color:dimgray;font-weight:bold`,
        `checking ${objName}, ${typeof window[objName]}`
      );
    });
    if (!pass) {
      // console output
      try {
        throw new Error(
          `DOSee has aborted as it is missing the above dependencies.`
        );
      } catch (err) {
        console.error(err);
      }
      // error link
      return errorBox(
        `DOSee cannot load the required dependencies listed the Browser Console.`
      );
    }
  });
})();
