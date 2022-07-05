/*
  DOSee emulator loader

  This is a fork of Fork of The Emularity loader
  https://github.com/db48x/emularity/blob/master/loader.js
  Latest commit 05390a4 on Oct 28, 2020

  Uses DOSBox version 4526ed7fM, built with Emscripten 1.38.45 a6c8e25

  Major differences:
    + Requires an ECMAScript 2015 (ES6) compatible browser
    + Only implements DOS emulation
    + There are no local save states

*/

window.Module = null;
((Promise) => {
  "use strict";
  const version = new Map()
    .set(`date`, new Date(`5,Jul,2022`))
    .set(`minor`, `8`)
    .set(`major`, `1`)
    .set(`display`, ``);

  version.set(
    `display`,
    `${version.get(`major`)}.${version.get(`minor`)} (${version
      .get(`date`)
      .toLocaleDateString()})`
  );

  // DOSBox requires a valid IndexedDB
  if (window.indexedDB)
    document.getElementById(`doseeCrashed`).classList.add(`hidden`);

  /**
   * DOSBox API functions.
   */
  class dosboxAPI {
    /**
     * HTML <canvas> element used to display the emulation.
     */
    canvas(id = ``) {
      const elem = id instanceof Element ? id : document.getElementById(id);
      return { canvas: elem };
    }
    emulatorJS(url = ``) {
      return { emulatorJS: url };
    }
    emulatorWASM(url = ``) {
      return { emulatorWASM: url };
    }
    fetchFile(title, url) {
      return {
        title,
        url,
      };
    }
    fetchOptionalFile(title = ``, url = ``) {
      return {
        title,
        url,
        optional: true,
      };
    }
    locateAdditionalEmulatorJS(path = ``) {
      return { locateAdditionalJS: path };
    }
    localFile(title, data) {
      return {
        title,
        data,
      };
    }
    mountZip(drive, file) {
      return {
        files: [
          {
            drive,
            mountpoint: `/${drive}`,
            file,
          },
        ],
      };
    }
    mountFile(filename, file) {
      return {
        files: [
          {
            mountpoint: filename,
            file,
          },
        ],
      };
    }
    nativeResolution(width = 0, height = 0) {
      if (typeof width !== `number` || typeof height !== `number`)
        throw new Error(`Width and height must be numbers`);
      return {
        nativeResolution: {
          width: Math.floor(width),
          height: Math.floor(height),
        },
      };
    }
  }

  /**
   * DOSBox command line arguments.
   */
  class dosboxArguments {
    constructor(executableFilename = ``, filesToMount = []) {
      if (executableFilename === ``)
        throw Error(`dosbox executableFilename argument cannot be blank`);
      if (filesToMount.length === 0)
        throw Error(`dosbox filesToMount argument cannot be empty`);
      this.verbose = `with the following configuration:`;
      this.executableFilename = executableFilename;
      this.filesToMount = filesToMount;
      // command line arguments
      this.commandLine = [];
    }
    build() {
      // dosbox command line parameters https://www.dosbox.com/wiki/Usage
      // dosbox.conf https://www.dosbox.com/wiki/Dosbox.conf
      const loadConfig = `-conf`,
        urlParams = DOSee.newQueryString();
      console.log(`Initialisation of DOSee ${version.get(`display`)}`);
      this._graphicEngineScaler(loadConfig);
      this._aspectRatioCorrection(loadConfig);
      this._cpuSpeed(loadConfig, urlParams);
      this._soundCard(loadConfig, urlParams);
      this._graphicMode(loadConfig, urlParams);
      this._dosMemory(loadConfig, urlParams);
      this._automaticExecution(loadConfig, urlParams);
      console.log(this.verbose);
      return this.commandLine;
    }
    _defaultParam(param = ``) {
      switch (param) {
        case `dosspeed`:
          return DOSee.getMetaContent(`dosee:speed`) || `auto`;
        case `dosmachine`:
          return DOSee.getMetaContent(`dosee:graphic`) || `vga`;
        case `dosaudio`:
          return DOSee.getMetaContent(`dosee:audio`) || `sb16`;
        default:
          throw Error(`cannot fetch default URL param for "${param}"`);
      }
    }
    _graphicEngineScaler(loadConfig = ``) {
      if (loadConfig === ``)
        throw Error(`graphicEngineScaler loadConfig argument cannot be empty`);
      // graphic engine scalers (https://www.dosbox.com/wiki/Scaler)
      const scaler = localStorage.getItem(`doseeScaler`) || `none`;
      switch (scaler) {
        case `none`:
          return (document.getElementById(`dosscale0`).checked = true);
        case `advinterp3x`:
          this.verbose += ` Advanced interpolation engine (advinterp3x).`;
          this.commandLine.push(loadConfig, `/dos/s/engine-advinterp3x.con`);
          return (document.getElementById(`dosscale5`).checked = true);
        case `hq3x`:
          this.verbose += ` High Quality 3 magnification (hq3x).`;
          this.commandLine.push(loadConfig, `/dos/s/engine-hq3x.con`);
          return (document.getElementById(`dosscale4`).checked = true);
        case `rgb3x`:
          this.verbose += ` RGB engine (rgb3x).`;
          this.commandLine.push(loadConfig, `/dos/s/engine-rgb3x.con`);
          return (document.getElementById(`dosscale3`).checked = true);
        case `super2xsai`:
          this.verbose += ` Super scale and interpolation engine (super2xsai).`;
          this.commandLine.push(loadConfig, `/dos/s/engine-super2xsai.con`);
          return (document.getElementById(`dosscale1`).checked = true);
        case `tv3x`:
          this.verbose += ` TV 3x scale engine (tv3x).`;
          this.commandLine.push(loadConfig, `/dos/s/engine-tv3x.con`);
          return (document.getElementById(`dosscale2`).checked = true);
        default:
          throw Error(
            `doseeScaler value "${scaler}" is unknown, use "none" for a default`
          );
      }
    }
    _aspectRatioCorrection(loadConfig = ``) {
      if (loadConfig === ``)
        throw Error(
          `aspectRatioCorrection loadConfig argument cannot be empty`
        );
      // impose aspect ratio correction
      const aspect = localStorage.getItem(`doseeAspect`) || `false`;
      if (aspect === `true`) {
        this.verbose += ` With aspect correction.`;
        return this.commandLine.push(loadConfig, `/dos/s/render.con`);
      }
      document.getElementById(`doseeAspect`).checked = true;
      this.verbose += ` No aspect correction.`;
    }
    _cpuSpeed(loadConfig = ``, urlParams = URLSearchParams) {
      if (loadConfig === ``)
        throw Error(`cpuSpeed loadConfig argument cannot be empty`);
      // emulation cpu speed
      const cpuspeed =
        urlParams.get(`dosspeed`) || this._defaultParam(`dosspeed`);
      switch (cpuspeed) {
        case `auto`:
          this.verbose += ` Automatic CPU speed.`;
          this.commandLine.push(loadConfig, `/dos/s/cpu-auto.con`);
          document.getElementById(`dosspeed1`).checked = true;
          break;
        case `8086`:
          this.verbose += ` 8086 real mode CPU.`;
          this.commandLine.push(loadConfig, `/dos/s/cpu-8086.con`);
          document.getElementById(`dosspeed4`).checked = true;
          break;
        case `386`:
          this.verbose += ` 386 protect mode CPU.`;
          this.commandLine.push(loadConfig, `/dos/s/cpu-386.con`);
          document.getElementById(`dosspeed3`).checked = true;
          break;
        case `486`:
        case `max`:
          this.verbose += ` Unlocked CPU speed.`;
          this.commandLine.push(loadConfig, `/dos/s/cpu-max.con`);
          document.getElementById(`dosspeed2`).checked = true;
          break;
        default:
          throw Error(
            `dosspeed value "${cpuspeed}" is unknown, use "auto" for a default`
          );
      }
    }
    _soundCard(loadConfig = ``, urlParams = URLSearchParams) {
      if (loadConfig === ``)
        throw Error(`soundCard loadConfig argument cannot be empty`);
      const sound = urlParams.get(`dosaudio`) || this._defaultParam(`dosaudio`);
      switch (sound) {
        case `none`:
          this.verbose += ` No audio.`;
          this.commandLine.push(loadConfig, `/dos/s/noaudio.con`);
          document.getElementById(`dosaudio5`).checked = true;
          break;
        case `sb1`:
          this.verbose += ` Sound Blaster 1.0 audio.`;
          this.commandLine.push(loadConfig, `/dos/s/sb1.con`);
          document.getElementById(`dosaudio3`).checked = true;
          break;
        case `sb16`:
          this.verbose += ` Sound Blaster 16 audio.`;
          this.commandLine.push(loadConfig, `/dos/s/sb16.con`);
          document.getElementById(`dosaudio2`).checked = true;
          break;
        case `gus`:
          this.verbose += ` Gravis UltraSound audio.`;
          this.commandLine.push(loadConfig, `/dos/g/gus.con`);
          document.getElementById(`dosaudio1`).checked = true;
          break;
        case `covox`:
          this.verbose += ` Covox Speech Accelerator audio.`;
          this.commandLine.push(loadConfig, `/dos/s/covox.con`);
          document.getElementById(`dosaudio4`).checked = true;
          break;
        default:
          throw Error(
            `dosaudio value "${sound}" is unknown, use "sb16" for a default`
          );
      }
    }
    _graphicMode(loadConfig = ``, urlParams = URLSearchParams) {
      if (loadConfig === ``)
        throw Error(`graphicMode loadConfig argument cannot be empty`);
      const alerts = () => {
        const s = document.getElementById(`svgaEffectsMsg`);
        if (s !== null) s.classList.add(`hidden`);
        const h = document.getElementById(`highResRequired`);
        if (h !== null) h.classList.remove(`hidden`);
      };
      // emulation graphics or machine type
      const machine =
        urlParams.get(`dosmachine`) || this._defaultParam(`dosmachine`);
      switch (machine) {
        case `svga`:
          this.verbose += ` SVGA s3 graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/svga.con`);
          document.getElementById(`dosmachine1`).checked = true;
          alerts();
          break;
        case `vga`:
          this.verbose += ` VGA graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/vgaonly.con`);
          document.getElementById(`dosmachine2`).checked = true;
          break;
        case `cga`:
          this.verbose += ` CGA graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/cga.con`);
          document.getElementById(`dosmachine5`).checked = true;
          break;
        case `ega`:
          this.verbose += ` EGA graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/ega.con`);
          document.getElementById(`dosmachine3`).checked = true;
          break;
        case `herc`:
          this.verbose += ` Hercules graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/herc.con`);
          document.getElementById(`dosmachine6`).checked = true;
          break;
        case `tandy`:
          this.verbose += ` Tandy graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/tandy.con`);
          document.getElementById(`dosmachine4`).checked = true;
          break;
        case `et3000`:
          this.verbose += ` SVGA ET3000 graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/et3000.con`);
          document.getElementById(`dosmachine1`).checked = true;
          alerts();
          break;
        case `et4000`:
          this.verbose += ` SVGA ET4000 graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/et4000.con`);
          alerts();
          break;
        case `paradise`:
          this.verbose += ` Paradise PVGA1A graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/paradise.con`);
          alerts();
          break;
        case `nolfb`:
          this.verbose += ` SVGA s3 graphics with no-line frame buffer hack.`;
          this.commandLine.push(loadConfig, `/dos/s/nolfb.con`);
          alerts();
          break;
        case `oldvbe`:
          this.verbose += ` VESA 1.3 graphics.`;
          this.commandLine.push(loadConfig, `/dos/s/oldvbe.con`);
          alerts();
          break;
        default:
          throw Error(
            `dosmachine value "${machine}" is unknown, use "vga" for a default`
          );
      }
    }
    _dosMemory(loadConfig = ``, urlParams = URLSearchParams) {
      if (loadConfig === ``)
        throw Error(`dosMemory loadConfig argument cannot be empty`);
      // dosbox memory managers
      const ems = urlParams.get(`dosems`),
        umb = urlParams.get(`dosumb`),
        xms = urlParams.get(`dosxms`);
      if (ems === `false`) {
        this.verbose += ` ✗ Expanded (EMS) memory.`;
        this.commandLine.push(loadConfig, `/dos/s/noems.con`);
      }
      if (umb === `false`) {
        this.verbose += ` ✗ Upper Memory Block (UMB) access.`;
        this.commandLine.push(loadConfig, `/dos/s/noumb.con`);
      }
      if (xms === `false`) {
        this.verbose += ` ✗ Extended (XMS) memory.`;
        this.commandLine.push(loadConfig, `/dos/s/noxms.con`);
      }
    }
    _automaticExecution(loadConfig = ``, urlParams = URLSearchParams) {
      if (loadConfig === ``)
        throw Error(`automaticExecution loadConfig argument cannot be empty`);
      // to split backslash and forward slash use: .split(/\\|\//)
      const backslash = /\\/,
        path = this.executableFilename.split(backslash);
      const runCommand = `-c`,
        diskDriveC = `C:`;
      // dosbox mount points (dos drive letters)
      for (const file of this.filesToMount) {
        if (`drive` in file)
          this.commandLine.push(
            runCommand,
            `mount ${file.drive} /dos${file.mountpoint}`
          );
      }
      // Load any operating system drivers that are not natively supplied by DOSBox.
      // These must be loaded after the emulated drives are mounted.
      // And after the environment PATH to the drivers have been set in the
      // Dosbox configuration under the [autoexec] header.
      if (urlParams.get(`dosaudio`) === `sb1`) {
        // sound blaster 1 drivers
        this.commandLine.push(runCommand, `SBFMDRV.COM`);
        this.commandLine.push(runCommand, `SOUND.COM`);
      }
      // dos utilities with PATH setup
      if (urlParams.get(`dosutils`) === `true`)
        this.commandLine.push(loadConfig, `/dos/s/utils.con`);
      // some programs don't run correctly unless the current active directory is root
      if (path && path.length) {
        const suffix = -1;
        let newPath = path.toString().replace(`,`, `\\`);
        newPath = newPath.split(`\\`).slice(0, suffix).join(`\\`);
        if (newPath !== ``) {
          console.log(`Execute path "${newPath}"`);
          this.commandLine.push(runCommand, `CD ${newPath}`);
        }
      }
      // dosbox default drive letter
      this.commandLine.push(
        runCommand,
        /^[a-zA-Z]:$/.test(path[0]) ? path.shift() : diskDriveC
      );
      // do not automatically run the program executable
      if (
        urlParams.get(`dosautorun`) === `false` ||
        this.executableFilename === ``
      ) {
        this.commandLine.push(runCommand, `U:\\ALIAS\\WELCOME.BAT`);
        return;
      }
      // handle multiple commands (chained) using && separators
      let command = path.pop();
      const chainCmds = command.split(`&&`);
      if (chainCmds.length > 1) {
        for (const cmd of chainCmds) {
          this.commandLine.push(runCommand, cmd);
        }
        return;
      }
      // hack to implement program options
      command = command.replace(` :`, ` /`);
      this.verbose = `Will execute \`${command}\` ${this.verbose}`;
      this.commandLine.push(runCommand, command);
      if (command.trim().length) {
        // an exit comment to display after executable program is complete
        const print = `@echo `,
          exitComment = `${print}${command} has finished.`;
        this.commandLine.push(runCommand, exitComment);
      }
    }
  }

  /**
   * DOSBox ported to Emscripten (em-dosbox) emulator interface.
   */
  class Emulator {
    /**
     * @param {HTMLElement} canvas Element containing the emulator.
     * @param {object} loadFiles An object of `DoseeLoader` files to load.
     */
    constructor(canvas = HTMLElement, loadFiles) {
      if (canvas === null)
        throw Error(`Emulator canvas element does not exist`);
      if (loadFiles === null)
        throw Error(`Emulator loadFiles must be a DoseeLoader object`);
      /**
       * Initialize the loading splash screen and create its methods.
       */
      const splash = {
        spinning: true,
        loadComplete: false,
        table: null,
        splashimg: new Image(),
      };
      splash.hide = () => {
        splash.splashElt.classList.add(`hidden`);
        document.getElementById(`doseeCanvas`).classList.remove(`hidden`);
      };
      splash.setTitle = (title) => {
        splash.titleElt.textContent = `${title}`;
      };
      let hasStarted = false;

      /**
       * Set the inner dimension of the canvas to match the calculated dimensions of the browser.
       * It avoids the situation where the DOSBox canvas is initialized in a tiny 300x150 pixel box.
       */
      const _initializeCanvas = () => {
        if (canvas.hasAttribute(`width`)) return;
        const style = getComputedStyle(canvas);
        console.log(`_initializeCanvas init canvas style`);
        console.log(style);
        canvas.width = parseInt(style.width, 10);
        canvas.height = parseInt(style.height, 10);
      };
      _initializeCanvas();

      // Screen resolution settings.
      const canvasScale = 1;
      let canvasSize = { width: canvas.width, height: canvas.height };

      /**
       * Use as a method to start the Emulator.
       */
      this.start = start;

      /**
       * Start the emulator.
       * @param {object} options Only one option is supported, `waitAfterDownloading` bool.
       */
      function start(options = { waitAfterDownloading: false }) {
        if (hasStarted) return false;
        hasStarted = true;

        const initializeLoad =
          typeof loadFiles === `function`
            ? loadFiles(requestFile, splash)
            : Promise.resolve(loadFiles);
        let keyPressEvent, clickEvent, gameData;

        setupSplash(canvas, splash);
        initializeLoad
          .then(_loadHardDrive)
          .then(_loadBranding, _errorBranding)
          .then(_loadDOSWarp, _errorDOSWarp);
        _hideSlowAlert();
        return true;

        function _hideSlowAlert() {
          // hide long load time messages once emulator has loaded
          const slow = document.getElementById(`doseeSlowLoad`);
          if (slow !== null) slow.classList.add(`hidden`);
        }

        function _loadHardDrive(data) {
          if (typeof data === `undefined`)
            throw Error(`_loadHardDrive requires the data argument`);
          return new Promise(function (resolve, reject) {
            const deltaFS = new BrowserFS.FileSystem.InMemory();
            gameData = data;
            // Any file system writes to MountableFileSystem will be written to the
            // deltaFS, letting us mount read-only zip files into the MountableFileSystem
            // while being able to 'write' to them.
            gameData.fileSystem = new BrowserFS.FileSystem.OverlayFS(
              deltaFS,
              new BrowserFS.FileSystem.MountableFileSystem()
            );
            gameData.fileSystem.initialize(() => {
              /* eslint-disable new-cap */
              const Buffer = BrowserFS.BFSRequire(`buffer`).Buffer;
              const fetch = (file) => {
                if (
                  `data` in file &&
                  file.data !== null &&
                  typeof file.data !== `undefined`
                )
                  return Promise.resolve(file.data);
                return requestFile(
                  file.title,
                  file.url,
                  `arraybuffer`,
                  file.optional
                );
              };
              const mountAt = (drive) => {
                return (zipData) => {
                  if (zipData === null) return;
                  const mountpoint = `/${drive.toLowerCase()}`;
                  // Mount into RO MFS.
                  gameData.fileSystem
                    .getOverlayedFileSystems()
                    .readable.mount(
                      mountpoint,
                      BFSOpenZip(new Buffer(zipData))
                    );
                };
              };
              const wasm = () => {
                if (!(`emulatorWASM` in gameData)) return;
                if (!gameData.emulatorWASM) return;
                if (!(`WebAssembly` in window)) return;
                gameData.files.push(
                  fetch({
                    title: `WASM Binary`,
                    url: gameData.emulatorWASM,
                  })
                    .then((binary) => {
                      gameData.wasmBinary = binary;
                    })
                    .then(() => {
                      Promise.all(
                        gameData.files.map((f) => {
                          if (!f) return null;
                          if (!f.file) return null;
                          if (!f.drive) return null;
                          return fetch(f.file).then(mountAt(f.drive));
                        })
                      ).then(resolve, reject);
                      console.log(
                        `%cDOSee`,
                        `color:dimgray;font-weight:bold`,
                        `loading WASM binary complete`
                      );
                    })
                );
              };
              wasm();
            });
          });
        }

        function _loadBranding() {
          if (!gameData || splash.loadFail) return null;
          if (!options.waitAfterDownloading) return Promise.resolve();
          return new Promise((resolve) => {
            const android = `and`,
              ipad = `ipa`,
              iphone = `iph`,
              ipod = `ipo`;
            const title = () => {
              /* eslint-disable no-magic-numbers */
              switch (navigator.platform.slice(0, 3).toLowerCase()) {
                case android:
                case ipad:
                case iphone:
                case ipod:
                  return `tap to start`;
                default:
                  return `click to start`;
              }
            };
            splash.setTitle(`${title()}`);
            splash.spinning = false;
            // stashes these event listeners so that we can remove them after
            window.addEventListener(
              `keydown`,
              (keyPressEvent = keyevent(resolve))
            );
            canvas.addEventListener(`click`, (clickEvent = resolve));
            splash.splashElt.addEventListener(`click`, clickEvent);
          });
        }

        function _loadDOSWarp() {
          if (!gameData || splash.loadFail) return;
          splash.spinning = true;
          window.removeEventListener(`keypress`, keyPressEvent);
          canvas.removeEventListener(`click`, clickEvent);
          splash.splashElt.removeEventListener(`click`, clickEvent);
          blockNavigationKeys();

          // Emscripten doesn't use the proper prefixed functions for fullscreen requests,
          // so let's map the prefixed versions to the correct function.
          canvas.requestPointerLock = getPointerLockEnabler(canvas);
          moveConfigToRoot(gameData.fileSystem);
          Module = initializeModule(
            gameData.emulatorArguments,
            gameData.fileSystem,
            gameData.locateAdditionalJS,
            gameData.wasmBinary,
            gameData.nativeResolution
          );
          if (!gameData.emulatorJS)
            return splash.setTitle(`Non-system disk or disk error`);
          // enable the operator screenshot and upload button
          const captureUpload = document.getElementById(`doseeCaptureUpload`);
          if (captureUpload !== null) captureUpload.disabled = false;
          // reveal hidden buttons that require dosee to be running
          const hiddenButtons = [
            `doseeCaptureScreen`,
            `doseeExit`,
            `doseeFullScreen`,
            `doseeReboot`,
          ];
          hiddenButtons.forEach((id) => {
            const button = document.getElementById(`${id}`);
            if (button !== null) {
              switch (id) {
                case `doseeCaptureScreen`:
                  if (!Blob) return console.log(`Blob is unsupported`);
                  break;
                case `doseeFullScreen`:
                  // Fullscreen API check
                  if (!canvas.requestFullscreen)
                    return console.log(`Fullscreen API is unsupported`);
                  break;
                default:
              }
              button.classList.remove(`hide-true`);
            }
          });
          // auto-align browser tab to the emulation canvas
          window.location.href = `#emulator`;
          // update the canvas and start the emulator
          splash.setTitle(`Warping to DOS`);
          attachScript(gameData.emulatorJS);
        }

        function _errorBranding() {
          if (splash.loadFail) return null;
          const frownFace = 9785;
          splash.setTitle(
            `The emulator broke ${String.fromCharCode(frownFace)}`
          );
          splash.loadFail = true;
        }

        function _errorDOSWarp() {
          if (splash.loadFail) return;
          splash.setTitle(`Invalid media, track 0 bad or unusable`);
          splash.loadFail = true;
        }
      }

      /**
       * Initialize the window Module.
       * @param {*} args Emulator arguments.
       * @param {*} fileSystem File system.
       * @param {*} locateAdditionalJS JS script file location.
       * @param {*} wasmBinary WASM binary data.
       * @param {*} nativeResolution Emulator resolution.
       */
      function initializeModule(
        args,
        fileSystem,
        locateAdditionalJS,
        wasmBinary,
        nativeResolution
      ) {
        if (typeof args === `undefined`)
          throw Error(`initializeModule args argument cannot be undefined`);
        if (typeof fileSystem === `undefined`)
          throw Error(
            `initializeModule fileSystem argument cannot be undefined`
          );
        if (typeof locateAdditionalJS === `undefined`)
          throw Error(
            `initializeModule locateAdditionalJS argument cannot be undefined`
          );
        if (typeof wasmBinary === `undefined`)
          throw Error(
            `initializeModule wasmBinary argument cannot be undefined`
          );
        if (typeof nativeResolution === `undefined`)
          throw Error(
            `initializeModule nativeResolution argument cannot be undefined`
          );
        return {
          arguments: args,
          screenIsReadOnly: true,
          print(text) {
            console.log(`%cDOSBox`, `color:dimgray;font-weight:bold;`, text);
          },
          canvas,
          noInitialRun: false,
          locateFile: locateAdditionalJS,
          wasmBinary,
          preInit() {
            splash.setTitle(`Loading program into the file system`);
            // Re-initialize BFS to just use the writeable in-memory storage.
            BrowserFS.initialize(fileSystem);
            const BFS = new BrowserFS.EmscriptenFS();
            // Mount the file system into Emscripten.
            FS.mkdir(`/dos`);
            FS.mount(BFS, { root: `/` }, `/dos`);
            splash.loadComplete = true;
            splash.hide();
            setTimeout(() => {
              resizeCanvas(
                canvas,
                (canvasSize = nativeResolution || canvasSize),
                canvasScale
              );
            });
          },
        };
      }
    }
  }

  /**
   * DOSee initialization.
   */
  function DoseeLoader(...args) {
    const config = Array.prototype.reduce.call(args, mergeObjects);
    config.emulatorArguments = new dosboxArguments(
      config.emulatorStart,
      config.files,
      config.emulatorCPU
    ).build();
    return config;
  }
  DoseeLoader.startExe = function (path = ``) {
    return { emulatorStart: path };
  };
  const api = new dosboxAPI();
  Object.setPrototypeOf(DoseeLoader, api);

  /**
   * Miscellaneous functions
   */

  /**
   * Open a ZIP archive for the emulation file system.
   * @param {object} loadedData BrowserFS, Zip file-backed filesystem object.
   */
  function BFSOpenZip(loadedData) {
    if (typeof loadedData === `undefined`)
      throw Error(`BFSOpenZip loadedData argument cannot be empty`);
    return new BrowserFS.FileSystem.ZipFS(loadedData);
  }

  /**
   * Add a row to the splash loading information.
   */
  function addRowToSplash() {
    const progress = document.getElementById(`doseeProgressIndicator`),
      p = document.createElement(`p`),
      status = document.createElement(`span`),
      title = document.createElement(`span`);
    if (progress === null)
      throw Error(
        `div element doseeProgressIndicator does not exist on the page`
      );
    status.classList.add(`splash-status`);
    p.classList.add(`toast`);
    p.append(status, title);
    progress.append(p);
    return [title, status];
  }

  /**
   * Attach a JS file to the head element of the HTML document.
   * @param {string} url URL of an external script.
   */
  function attachScript(url = ``) {
    if (url.length === 0)
      throw Error(`attachScript url argument cannot be empty`);
    const head = document.getElementsByTagName(`head`)[0],
      script = document.createElement(`script`);
    script.src = url;
    head.append(script);
  }

  /**
   * Don't allow the arrow, PgUp, PgDn, Home or End keys to affect the position of the webpage.
   */
  function blockNavigationKeys() {
    const blockKeys = (event) => {
      if (typeof Module === `undefined`) return;
      if (typeof window.ABORT === `boolean` && window.ABORT === true) {
        // cancel this preventDefault() event listener if em-dosbox has been aborted
        document.removeEventListener(`keydown`, blockKeys);
      }
      // monitor keyboard key presses
      // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Navigation_keys
      switch (event.key) {
        case `ArrowDown`:
        case `ArrowLeft`:
        case `ArrowRight`:
        case `ArrowUp`:
        case `End`:
        case `Home`:
        case `PageDown`:
        case `PageUp`:
          // blocks the browser's default key press handling
          event.preventDefault();
          return false;
        default:
          return true;
      }
    };
    document.addEventListener(`keydown`, blockKeys);
  }

  /**
   * Lets you asynchronously ask for the pointer to be locked.
   * @param {HTMLElement} canvas Element containing the emulator.
   */
  function getPointerLockEnabler(canvas = HTMLElement) {
    // requestPointerLock() browser compatibility, Chrome, Firefox 50+, Safari 10+
    return (
      canvas.requestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock
    );
  }

  /**
   * Keyboard input event handler
   * @param {*} resolve Promise resolve.
   */
  function keyevent(resolve) {
    return (keyboardEvent) => {
      // Space bar is used here as alternative to a mouse click to start DOSee
      if (keyboardEvent.code === `Space`) {
        if (DOSee.getMetaContent(`dosee:spacekey:start`) === `false`) return;
        keyboardEvent.preventDefault();
        resolve();
      }
    };
  }

  /**
   * Merge two objects or arrays and return the result.
   * You cannot mix types and merge an object with an array.
   * @param {any[]|object} one Object or array one.
   * @param {any[]|object} two Object or array two.
   */
  function mergeObjects(one, two) {
    if (one === null) return two;
    if (two === null) return one;
    const oneType = typeof one,
      twoType = typeof two;
    if (oneType !== twoType) {
      if (oneType === `undefined`) return two;
      if (twoType === `undefined`) return one;
      throw new Error(`Cannot merge ${oneType} with ${twoType}`);
    }
    if (Array.isArray(one)) return one.concat(two);
    if (oneType === `object`) {
      Object.keys(two).forEach(function (key) {
        one[key] = mergeObjects(one[key], two[key]);
      });
      return one;
    }
    return two;
  }

  /**
   * Search for the DOSBox configuration file `dosbox.conf` on the file system and move it to the root.
   * @param {object} fileSystem BrowserFS object.
   */
  function moveConfigToRoot(fileSystem = {}) {
    const currentDir = `.`,
      parentDir = `..`,
      separator = `/`;
    let dosboxConfPath = null;
    // Recursively search for dosbox.conf.
    function searchDirectory(dirPath) {
      fileSystem.readdirSync(dirPath).forEach((item) => {
        if (dosboxConfPath) return;
        // Avoid infinite recursion by ignoring these entries,
        // which exist at the root.
        if (item === currentDir || item === parentDir) return;
        // Append `/` between dirPath and the item's name... unless dirPath
        // already ends in it (which always occurs if dirPath is the root, `/`).
        const itemPath =
            dirPath +
            (dirPath[dirPath.length - 1] === separator ? `` : separator) +
            item,
          itemStat = fileSystem.statSync(itemPath);
        itemStat.isDirectory(itemStat.mode)
          ? searchDirectory(itemPath)
          : (dosboxConfPath = itemPath);
      });
    }
    searchDirectory(`/`);
    if (dosboxConfPath !== null) {
      const rewriteReadRead = 644;
      const read = new Map()
          .set(`filename`, dosboxConfPath)
          .set(`encoding`, null)
          .set(`fileFlag`, flagRead),
        write = new Map()
          .set(`filename`, `/dosbox.conf`)
          .set(`encoding`, null)
          .set(`fileFlag`, flagWrite)
          .set(`mode`, rewriteReadRead);
      // read the file
      write.set(
        `data`,
        fileSystem.readFileSync(
          read.get(`filename`),
          read.get(`encoding`),
          read.get(`fileFlag`)
        )
      );
      // write the file to the new location
      fileSystem.writeFileSync(
        write.get(`filename`),
        write.get(`data`),
        write.get(`encoding`),
        write.get(`fileFlag`),
        write.get(`mode`)
      );
    }
  }

  /**
   * Request and download a remote file from a URL source.
   * @param {string} title Title or descriptor for the splash screen.
   * @param {string} url URL to send the request to.
   * @param {string} type The type of data contained in the response.
   * @param {bool} optional Flag the request as an optional, meaning it will never return a failed response.
   */
  function requestFile(title = ``, url = ``, type = `arraybuffer`, optional) {
    const row = addRowToSplash(),
      titleCell = row[0],
      statusCell = row[1];

    const removeQuotes = (text) => {
      return text.replace(/['"]+/g, ``);
    };
    const text = removeQuotes(title);

    titleCell.textContent = text;

    return new Promise((resolve, reject) => {
      if (url === ``)
        return reject(new Error(`requestFile url cannot be empty`));
      const nbsp = `\u00A0`;
      titleCell.textContent = `${text}`;
      const spinner = document.createElement(`i`);
      spinner.classList.add(
        `fal`,
        `fa-circle-notch`,
        `fa-spin`,
        `fa-fw`,
        `fa-xs`
      );
      statusCell.append(spinner, `${nbsp}`);
      fetch(url, {
        method: `GET`,
      })
        .then((response) => {
          if (!response.ok) {
            if (optional) return resolve(null);
            const error = `A network error ${response.status} occurred downloading a file`;
            throw new Error(error);
          }
          switch (type) {
            case `arraybuffer`:
              return response.arrayBuffer();
            case `blob`:
              return response.blob();
            case `json`:
              return response.json();
            case `text`:
            case ``:
              return response.text();
            default:
              return reject(
                new Error(
                  `unknown requestFile type, it needs to be a valid fetch method`
                )
              );
          }
        })
        .then((reply) => {
          statusCell.classList.add(`text-success`);
          statusCell.textContent = `✔${nbsp}`;
          titleCell.textContent = text;
          resolve(reply);
        })
        .catch((err) => {
          statusCell.classList.add(`text-failure`);
          statusCell.textContent = `✘${nbsp}`;
          statusCell.title = `${err}`;
          titleCell.textContent = text;
          titleCell.title = `${err}`;
          const error = `A DOSee error occurred`;
          console.error(`${error}: ${err}`);
          reject(new Error(`${error}: ${err}`));
        });
    });
  }

  /**
   * Resize the canvas that displays the emulator.
   * @param {HTMLElement} canvas Element containing the emulator.
   * @param {object} resolution Pixel width and height of the canvas.
   * @param {number} scale Increase the pixel width and height.
   */
  function resizeCanvas(
    canvas = HTMLElement,
    resolution = { width: 0, height: 0 },
    scale = 0
  ) {
    if (scale && resolution) {
      canvas.classList.add(`dosee-crisp-render`);
      canvas.width = resolution.width * scale;
      canvas.height = resolution.height * scale;
    }
    const aspect = localStorage.getItem(`doseeAspect`) || `false`;
    if (aspect !== `false`) return;
    // Em-dosbox modifies the height and width attribute values to apply screen resolution changes.
    // The mutation observer creates an event listener to monitor any changes to these values,
    // and update the CSS style values accordingly.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type !== `attributes`) return;
        switch (mutation.attributeName) {
          case `height`:
            return (canvas.style.height = `auto`);
          case `width`:
            return (canvas.style.width = `auto`);
          default:
        }
      });
    });
    observer.observe(canvas, { attributes: true });
  }

  /**
   * Setup the DOSee splash screen with the loading information.
   * @param {*} canvas Element containing the emulator.
   * @param {*} splash Element containing the load, splash screen.
   */
  function setupSplash(canvas = HTMLElement, splash) {
    const splashScreen = () => {
      const screen = document.getElementById(`doseeSplashScreen`);
      if (screen) return (splash.splashElt = screen);
      const div = document.createElement(`div`);
      div.setAttribute(`id`, `doseeSplashScreen`);
      div.classList.add(`rounded`);
      canvas.parentElement.append(div);
      splash.splashElt = div;
    };
    const splashImage = () => {
      const image = document.getElementById(`doseeSplashImg`);
      if (image) return (splash.splashimg = image);
      const img = document.createElement(`img`);
      img.src = `/images/floppy_disk_icon-180x180.png`;
      img.classList.add(`dosee-crisp-render`);
      img.setAttribute(`id`, `doseeSplashImg`);
      img.setAttribute(`alt`, `DOSee logo`);
      img.setAttribute(`width`, `180`);
      img.setAttribute(`height`, `180`);
      splash.splashElt.append(img);
    };
    const title = () => {
      splash.titleElt = document.createElement(`span`);
      splash.titleElt.setAttribute(`id`, `doseeSplashTitle`);
      splash.titleElt.textContent = ``;
      splash.splashElt.append(splash.titleElt);
    };
    const indicator = () => {
      const indicate = document.getElementById(`doseeProgressIndicator`);
      if (indicate) return (splash.table = indicate);
      const table = document.createElement(`div`);
      table.setAttribute(`id`, `doseeProgressIndicator`);
      splash.splashElt.append(table);
      splash.table = table;
    };
    splashScreen();
    splashImage();
    title();
    indicator();
  }

  /**
   * This is a hack as the BrowserFS API is not being used correctly.
   */
  const flagRead = {
    isReadable: () => {
      return true;
    },
    isWriteable: () => {
      return false;
    },
    isTruncating: () => {
      return false;
    },
    isAppendable: () => {
      return false;
    },
    isSynchronous: () => {
      return false;
    },
    isExclusive: () => {
      return false;
    },
    pathExistsAction: () => {
      return 0;
    },
    pathNotExistsAction: () => {
      return 1;
    },
  };
  const flagWrite = {
    isReadable: () => {
      return false;
    },
    isWriteable: () => {
      return true;
    },
    isTruncating: () => {
      return false;
    },
    isAppendable: () => {
      return false;
    },
    isSynchronous: () => {
      return false;
    },
    isExclusive: () => {
      return false;
    },
    pathExistsAction: () => {
      return 0;
    },
    pathNotExistsAction: () => {
      return 3;
    },
  };

  document.getElementById(`doseeVersion`).innerHTML = ` version ${version.get(
    `display`
  )}`;
  window.DoseeLoader = DoseeLoader;
  window.Emulator = Emulator;
})(Promise);
