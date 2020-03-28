/*
 * dosee-loader.js
 * DOSee emulator
 *
 * Fork of https://github.com/db48x/emularity/blob/master/loader.js
 * Last commit synced to: Feb 15, 2018
 *
 * Major differences:
 *  Requires ES6 compatible browser
 *  Only DOS emulation
 *  No local save states
 *  No Web Assembly builds [to-do]
 */

"use strict"
window.Module = null
;(Promise => {
  const version = new Map()
    .set(`date`, new Date(`24,Sep,2019`))
    .set(`minor`, `45`)
    .set(`major`, `1`)
    .set(`display`, ``)
  version.set(
    `display`,
    `${version.get(`major`)}.${version.get(`minor`)} (${version
      .get(`date`)
      .toLocaleDateString()})`
  )

  // DOSBox requires a valid IndexedDB
  // See: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
  if (window.indexedDB) {
    document.getElementById(`doseeCrashed`).classList.add(`hidden`)
  }

  // Common API functions
  // DOSee is based off The Emularity which supports multiple emulators.
  // The BaseLoader naming convention was used to highlight the shared functions.
  function DoseeAPI() {
    return Array.prototype.reduce.call(arguments, extend)
  }

  // HTML <canvas> element used to display the emulation
  DoseeAPI.canvas = function (id) {
    const elem = id instanceof Element ? id : document.getElementById(id)
    return { canvas: elem }
  }

  DoseeAPI.emulatorJS = function (url) {
    return { emulatorJS: url }
  }

  DoseeAPI.emulatorWASM = function (url) {
    return { emulatorWASM: url }
  }

  DoseeAPI.locateAdditionalEmulatorJS = function (func) {
    return { locateAdditionalJS: func }
  }

  DoseeAPI.nativeResolution = function (width, height) {
    if (typeof width !== `number` || typeof height !== `number`)
      throw new Error(`Width and height must be numbers`)
    return {
      nativeResolution: {
        width: Math.floor(width),
        height: Math.floor(height)
      }
    }
  }

  DoseeAPI.mountZip = function (drive, file) {
    return {
      files: [
        {
          drive: drive,
          mountpoint: `/${drive}`,
          file: file
        }
      ]
    }
  }

  DoseeAPI.mountFile = function (filename, file) {
    return {
      files: [
        {
          mountpoint: filename,
          file: file
        }
      ]
    }
  }

  DoseeAPI.fetchFile = function (title, url) {
    return {
      title: title,
      url: url
    }
  }

  DoseeAPI.fetchOptionalFile = function (title, url) {
    return {
      title: title,
      url: url,
      optional: true
    }
  }

  DoseeAPI.localFile = function (title, data) {
    return {
      title: title,
      data: data
    }
  }

  function DoseeLoader() {
    const config = Array.prototype.reduce.call(arguments, extend)
    config.emulator_arguments = build_dosbox_arguments(
      config.emulatorStart,
      config.files,
      config.emulatorCPU
    )
    return config
  }
  Object.setPrototypeOf(DoseeLoader, DoseeAPI)

  DoseeLoader.startExe = function (path) {
    return { emulatorStart: path }
  }

  const build_dosbox_arguments = function (emulator_start, files) {
    // dosbox command line parameters https://www.dosbox.com/wiki/Usage
    // dosbox.conf https://www.dosbox.com/wiki/Dosbox.conf

    console.log(`Initialisation of DOSee ` + version.get(`display`))
    let verbose = `with the following configuration:`

    // get guest program path
    const path = emulator_start.split(/\\|\//) // I have LTS already
    // get guest program file name
    let prog = path.pop()

    // dosbox command line arguments
    const args = []

    // parse URL query string
    if (`URLSearchParams` in window == false) {
      console.log(
        `DOSee needs the URLSearchParams interface to read URL query string values`
      )
      return args
    }
    // see dosee-function.js
    const urlParams = DOSee.newQueryString()

    // graphic engine scalers (https://www.dosbox.com/wiki/Scaler)
    let scaler = null || `none`
    if (DOSee.storageAvailable(`local`))
      scaler = localStorage.getItem(`doseeScaler`) // look for saved option
    switch (scaler) {
      case `advinterp3x`:
        verbose += ` Advanced interpolation engine (advinterp3x).`
        args.push(`-conf`, `/dos/s/engine-advinterp3x.con`)
        document.getElementById(`dosscale5`).checked = true
        break
      case `hq3x`:
        verbose += ` High Quality 3 magnification (hq3x).`
        args.push(`-conf`, `/dos/s/engine-hq3x.con`)
        document.getElementById(`dosscale4`).checked = true
        break
      case `rgb3x`:
        verbose += ` RGB engine (rgb3x).`
        args.push(`-conf`, `/dos/s/engine-rgb3x.con`)
        document.getElementById(`dosscale3`).checked = true
        break
      case `super2xsai`:
        verbose += ` Super scale and interpolation engine (super2xsai).`
        args.push(`-conf`, `/dos/s/engine-super2xsai.con`)
        document.getElementById(`dosscale1`).checked = true
        break
      case `tv3x`:
        verbose += ` TV 3x scale engine (tv3x).`
        args.push(`-conf`, `/dos/s/engine-tv3x.con`)
        document.getElementById(`dosscale2`).checked = true
        break
      default:
        document.getElementById(`dosscale0`).checked = true
        break
    }

    // impose aspect ratio correction
    let aspect = null || `true`
    if (DOSee.storageAvailable(`local`))
      aspect = localStorage.getItem(`doseeAspect`) // look for saved option
    if (aspect !== `false`) {
      verbose += ` With aspect correction.`
      args.push(`-conf`, `/dos/s/render.con`) // aspect=true
    } else {
      document.getElementById(`doseeAspect`).checked = true
      verbose += ` No aspect correction.`
    }
    // emulation cpu speed
    const cpuspeed = urlParams.get(`dosspeed`)
    switch (cpuspeed) {
      case `8086`:
        verbose += ` 8086 real mode CPU.`
        args.push(`-conf`, `/dos/s/cpu-8086.con`)
        document.getElementById(`dosspeed4`).checked = true
        break
      case `386`:
        verbose += ` 386 protect mode CPU.`
        args.push(`-conf`, `/dos/s/cpu-386.con`)
        document.getElementById(`dosspeed3`).checked = true
        break
      case `486`:
      case `max`:
        verbose += ` Unlocked CPU speed.`
        args.push(`-conf`, `/dos/s/cpu-max.con`)
        document.getElementById(`dosspeed2`).checked = true
        break
      default:
        verbose += ` Automatic CPU speed.`
        args.push(`-conf`, `/dos/s/cpu-auto.con`)
        document.getElementById(`dosspeed1`).checked = true
        break
    }

    // emulation sound cards
    const sound = urlParams.get(`dosaudio`)
    switch (sound) {
      case `none`:
        verbose += ` No audio.`
        args.push(`-conf`, `/dos/s/noaudio.con`)
        document.getElementById(`dosaudio5`).checked = true
        break
      case `sb1`:
        verbose += ` Sound Blaster 1.0 audio.`
        args.push(`-conf`, `/dos/s/sb1.con`)
        document.getElementById(`dosaudio3`).checked = true
        break
      case `gus`:
        verbose += ` Gravis Ultrasound audio.`
        args.push(`-conf`, `/dos/g/gus.con`)
        document.getElementById(`dosaudio1`).checked = true
        break
      case `covox`:
        verbose += ` Covox Speech Accelerator audio.`
        args.push(`-conf`, `/dos/s/covox.con`)
        document.getElementById(`dosaudio4`).checked = true
        break
      default:
        verbose += ` Sound Blaster 16 audio.`
        args.push(`-conf`, `/dos/s/sb16.con`)
        document.getElementById(`dosaudio2`).checked = true
        break
    }

    // emulation graphics or machine type
    const machine = urlParams.get(`dosmachine`)
    switch (machine) {
      case `svga`:
        verbose += ` SVGA s3 graphics.`
        args.push(`-conf`, `/dos/s/svga.con`)
        document.getElementById(`dosmachine1`).checked = true
        document.getElementById(`svgaEffectsMsg`).classList.add(`hidden`)
        break
      case `cga`:
        verbose += ` CGA graphics.`
        args.push(`-conf`, `/dos/s/cga.con`)
        document.getElementById(`dosmachine5`).checked = true
        break
      case `ega`:
        verbose += ` EGA graphics.`
        args.push(`-conf`, `/dos/s/ega.con`)
        document.getElementById(`dosmachine3`).checked = true
        break
      case `herc`:
        verbose += ` Hercules graphics.`
        args.push(`-conf`, `/dos/s/herc.con`)
        document.getElementById(`dosmachine6`).checked = true
        break
      case `tandy`:
        verbose += ` Tandy graphics.`
        args.push(`-conf`, `/dos/s/tandy.con`)
        document.getElementById(`dosmachine4`).checked = true
        break
      case `et3000`:
        verbose += ` SVGA ET3000 graphics.`
        args.push(`-conf`, `/dos/s/et3000.con`)
        document.getElementById(`dosmachine1`).checked = true
        break
      case `et4000`:
        verbose += ` SVGA ET4000 graphics.`
        args.push(`-conf`, `/dos/s/et4000.con`)
        break
      case `paradise`:
        verbose += ` Paradise PVGA1A graphics.`
        args.push(`-conf`, `/dos/s/paradise.con`)
        break
      case `nolfb`:
        verbose += ` SVGA s3 graphics with no-line frame buffer hack.`
        args.push(`-conf`, `/dos/s/nolfb.con`)
        break
      case `oldvbe`:
        verbose += ` VESA 1.3 graphics.`
        args.push(`-conf`, `/dos/s/oldvbe.con`)
        break
      default:
        verbose += ` VGA graphics.`
        args.push(`-conf`, `/dos/s/vgaonly.con`)
        document.getElementById(`dosmachine2`).checked = true
        break
    }

    // dosbox memory managers
    const ems = urlParams.get(`dosems`)
    if (ems === `false`) {
      verbose += ` ✗ Expanded (EMS) memory.`
      args.push(`-conf`, `/dos/s/noems.con`)
    }
    const umb = urlParams.get(`dosumb`)
    if (umb === `false`) {
      verbose += ` ✗ Upper Memory Block (UMB) access.`
      args.push(`-conf`, `/dos/s/noumb.con`)
    }
    const xms = urlParams.get(`dosxms`)
    if (xms === `false`) {
      verbose += ` ✗ Extended (XMS) memory.`
      args.push(`-conf`, `/dos/s/noxms.con`)
    }

    // dosbox mount points (dos drive letters)
    for (const i in files) {
      if (`drive` in files[i]) {
        args.push(`-c`, `mount ${files[i].drive} /dos${files[i].mountpoint}`)
      }
    }

    // dosbox default drive letter
    args.push(`-c`, /^[a-zA-Z]:$/.test(path[0]) ? path.shift() : `C:`)

    // load drivers not natively supplied by DOSBox and after emulated drives are mounted
    // paths to drivers has been set in the sb1.con under [autoexec]
    if (sound === `sb1`) {
      args.push(`-c`, `SBFMDRV.COM`)
      args.push(`-c`, `SOUND.COM`)
    }

    // dos utilities with PATH setup
    const dosutilities = urlParams.get(`dosutils`)
    if (dosutilities === `true`) {
      args.push(`-conf`, `/dos/s/utils.con`)
    }

    // some programs don't run correctly unless their root directory is active
    if (path && path.length) {
      let pathStr = path.toString()
      pathStr = pathStr.replace(`,`, `\\`)
      console.log(`Execute path ${pathStr}`)
      args.push(`-c`, `CD ${pathStr}`)
    }

    // automatically run the guest program
    if (urlParams.get(`dosautorun`) !== `false`) {
      prog = prog.replace(` :`, ` /`) // hack to implement program options
      verbose = `Will execute \`${prog}\` ${verbose}`
      args.push(`-c`, prog)
      // comment to display after guest program is complete
      if (prog.trim().length > 0) {
        const finCmd = `@echo ${prog} has finished.`
        args.push(`-c`, finCmd)
      }
    }
    console.log(verbose)
    return args
  }

  /**
   * Emulator
   */
  function Emulator(canvas, callbacks, loadFiles) {
    if (typeof callbacks !== `object`) {
      callbacks = {
        before_emulator: null,
        before_run: callbacks
      }
    }
    let has_started = false
    const splash = {
      loading_text: ``,
      spinning: true,
      finished_loading: false,
      table: null,
      splashimg: new Image()
    }

    // right off the bat we set the canvas's inner dimensions to
    // whatever it's current css dimensions are this isn't likely to be
    // the same size that dosbox will set it to, but it avoids
    // the case where the size was left at the default 300x150
    if (!canvas.hasAttribute(`width`)) {
      const style = getComputedStyle(canvas)
      canvas.width = parseInt(style.width, 10)
      canvas.height = parseInt(style.height, 10)
    }

    let cssResolution = { width: canvas.width, height: canvas.height },
      scale = 1

    this.setSplashImage = function (_splashimg) {
      if (_splashimg) {
        if (_splashimg instanceof Image) {
          if (splash.splashimg.parentNode) {
            splash.splashimg.src = _splashimg.src
          } else {
            splash.splashimg = _splashimg
          }
        } else {
          splash.splashimg.src = _splashimg
        }
      }
      return this
    }

    this.setCallbacks = function (_callbacks) {
      if (typeof _callbacks !== `object`) {
        callbacks = {
          before_emulator: null,
          before_run: _callbacks
        }
      } else {
        callbacks = _callbacks
      }
      return this
    }

    this.setSplashColors = function (colors) {
      splash.colors = colors
      return this
    }

    this.setLoad = function (loadFunc) {
      loadFiles = loadFunc
      return this
    }

    const start = function (options) {
      if (has_started) return false
      has_started = true
      if (typeof options !== `object`) {
        options = { waitAfterDownloading: false }
      }
      let k, c, game_data
      setupSplash(canvas, splash, cssResolution)

      let loading
      if (typeof loadFiles === `function`) {
        loading = loadFiles(fetch_file, splash)
      } else {
        loading = Promise.resolve(loadFiles)
      }

      loading
        .then(loadHardDrive)
        .then(loadBranding, errBranding)
        .then(loadDosWarp, errDosWarp)

      // hide long load time messages once emulator has loaded
      {
        const sdlm = document.getElementById(`doseeSlowLoad`)
        if (sdlm !== `undefined`) {
          sdlm.classList.add(`hidden`)
        }
      }
      return this

      function loadHardDrive(_game_data) {
        return new Promise(function (resolve, reject) {
          const deltaFS = new BrowserFS.FileSystem.InMemory()
          finish()

          function finish() {
            game_data = _game_data

            // Any file system writes to MountableFileSystem will be written to the
            // deltaFS, letting us mount read-only zip files into the MountableFileSystem
            // while being able to 'write' to them.
            game_data.fs = new BrowserFS.FileSystem.OverlayFS(
              deltaFS,
              new BrowserFS.FileSystem.MountableFileSystem()
            )
            game_data.fs.initialize(function () {
              const Buffer = BrowserFS.BFSRequire(`buffer`).Buffer

              function fetch(file) {
                if (
                  `data` in file &&
                  file.data !== null &&
                  typeof file.data !== `undefined`
                ) {
                  return Promise.resolve(file.data)
                }
                return fetch_file(
                  file.title,
                  file.url,
                  `arraybuffer`,
                  file.optional
                )
              }

              function mountAt(drive) {
                return function (data) {
                  if (data !== null) {
                    drive = drive.toLowerCase()
                    const mountpoint = `/${drive}`
                    // Mount into RO MFS.
                    game_data.fs
                      .getOverlayedFileSystems()
                      .readable.mount(mountpoint, BFSOpenZip(new Buffer(data)))
                  }
                }
              }

              if (
                `emulatorWASM` in game_data &&
                game_data.emulatorWASM &&
                `WebAssembly` in window
              ) {
                game_data.files.push(
                  fetch({
                    title: `WASM Binary`,
                    url: game_data.emulatorWASM
                  }).then(function (data) {
                    game_data.wasmBinary = data
                  })
                )
              }

              Promise.all(
                game_data.files.map(function (f) {
                  if (f && f.file) {
                    if (f.drive) return fetch(f.file).then(mountAt(f.drive))
                  }
                  return null
                })
              ).then(resolve, reject)
            })
          }
        })
      }

      function loadBranding() {
        if (!game_data || splash.failed_loading) return null
        if (options.waitAfterDownloading) {
          return new Promise(resolve => {
            let title = `click to start`
            // update title based on the browser platform
            switch (navigator.platform.slice(0, 3).toLowerCase()) {
              case `and`: // android
              case `ipa`: // ipad
              case `iph`: // iphone
              case `ipo`: // ipod
                title = `tap to start`
                break
            }
            splash.setTitle(`${title}`)
            splash.spinning = false
            // stashes these event listeners so that we can remove them after
            window.addEventListener(`keydown`, (k = keyevent(resolve)))
            canvas.addEventListener(`click`, (c = resolve))
            splash.splashElt.addEventListener(`click`, c)
          })
        }
        return Promise.resolve()
      }

      function loadDosWarp() {
        if (!game_data || splash.failed_loading) return
        splash.spinning = true
        window.removeEventListener(`keypress`, k)
        canvas.removeEventListener(`click`, c)
        splash.splashElt.removeEventListener(`click`, c)

        blockNavigationKeys()

        // Emscripten doesn't use the proper prefixed functions for fullscreen requests,
        // so let's map the prefixed versions to the correct function.
        canvas.requestPointerLock = getPointerLockEnabler()

        moveConfigToRoot(game_data.fs)
        Module = init_module(
          game_data.emulator_arguments,
          game_data.fs,
          game_data.locateAdditionalJS,
          game_data.wasmBinary,
          game_data.nativeResolution
        )

        if (callbacks && callbacks.before_emulator) {
          try {
            callbacks.before_emulator()
          } catch (x) {
            console.log(x)
          }
        }
        if (game_data.emulatorJS) {
          // enable the operator screenshot and upload button
          const captureUpload = document.getElementById(`doseeCaptureUpload`)
          if (captureUpload !== null) captureUpload.disabled = false
          // reveal hidden buttons that require dosee to be running
          const hiddenButtons = [
            `doseeCaptureScreen`,
            `doseeExit`,
            `doseeFullScreen`,
            `doseeReboot`
          ]
          hiddenButtons.forEach(id => {
            const button = document.getElementById(`${id}`)
            if (button !== null) button.classList.remove(`hide-true`)
          })
          // auto-align browser tab to the emulation canvas
          window.location.href = `#emulator`
          // update the canvas and start the emulator
          splash.setTitle(`Warping to DOS`)
          attachScript(game_data.emulatorJS)
        } else {
          splash.setTitle(`Non-system disk or disk error`)
        }
      }

      function errBranding() {
        if (splash.failed_loading) return null
        splash.setTitle(`The emulator broke ${String.fromCharCode(9785)}`) // frown face
        splash.failed_loading = true
      }

      function errDosWarp() {
        if (splash.failed_loading) return
        splash.setTitle(`Invalid media, track 0 bad or unusable`)
        splash.failed_loading = true
      }
    }
    this.start = start

    const init_module = function (
      args,
      fs,
      locateAdditionalJS,
      wasmBinary,
      nativeResolution
    ) {
      return {
        arguments: args,
        screenIsReadOnly: true,
        print: function (text) {
          // feedback from dosbox
          console.log(`%cDOSBox`, `color:dimgray;font-weight:bold`, text)
        },
        canvas: canvas,
        noInitialRun: false,
        locateFile: locateAdditionalJS,
        wasmBinary: wasmBinary,
        preInit: function () {
          splash.setTitle(`Loading program into the file system`)
          // Re-initialize BFS to just use the writeable in-memory storage.
          BrowserFS.initialize(fs)
          const BFS = new BrowserFS.EmscriptenFS()
          // Mount the file system into Emscripten.
          FS.mkdir(`/dos`)
          FS.mount(BFS, { root: `/` }, `/dos`)
          splash.finished_loading = true
          splash.hide()
          setTimeout(function () {
            resizeCanvas(
              canvas,
              (scale = scale || scale),
              (cssResolution = nativeResolution || cssResolution)
            )
          })
          if (callbacks && callbacks.before_run) {
            window.setTimeout(function () {
              callbacks.before_run()
            }, 0)
          }
        }
      }
    }

    const formatSize = function (event) {
      if (event.lengthComputable)
        return `(${
          event.total ? ((event.loaded / event.total) * 100).toFixed(0) : `100`
        }% \
 ${formatBytes(event.loaded)} of ${formatBytes(event.total)})`
      return `(${formatBytes(event.loaded)})`
    }

    const formatBytes = function (bytes, base10) {
      if (bytes === 0) return `0 B`
      const unit = base10 ? 1000 : 1024,
        units = base10
          ? [`B`, `kB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`]
          : [`B`, `KiB`, `MiB`, `GiB`, `TiB`, `PiB`, `EiB`, `ZiB`, `YiB`],
        exp = parseInt(Math.log(bytes) / Math.log(unit)),
        size = bytes / Math.pow(unit, exp)
      return `${size.toFixed(1)} ${units[exp]}`
    }

    const fetch_file = function (title, url, rt, optional) {
      const row = addRow(splash.table)
      const titleCell = row[0],
        statusCell = row[1]
      titleCell.textContent = title
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest()
        xhr.open(`GET`, url, true)
        xhr.responseType = rt || `arraybuffer`
        xhr.onprogress = function (e) {
          titleCell.textContent = `${title} ${formatSize(e)}`
        }
        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 0) {
            success()
            resolve(xhr.response)
          } else if (optional) {
            success()
            resolve(null)
          } else {
            failure()
            reject()
          }
        }
        xhr.onerror = function () {
          if (optional) {
            success()
            resolve(null)
          } else {
            failure()
            reject()
          }
        }

        function success() {
          statusCell.classList.add(`text-success`)
          statusCell.textContent = `✔`
          titleCell.textContent = title
        }

        function failure() {
          statusCell.classList.add(`text-failure`)
          statusCell.textContent = `✘`
          titleCell.textContent = title
        }
        xhr.send()
      })
    }

    // Keyboard input event handler
    function keyevent(resolve) {
      return keyboardEvent => {
        // Space bar is used here as alternative to a mouse click
        // to start DOSee
        if (keyboardEvent.code === `Space`) {
          if (DOSee.getMetaContent(`dosee:spacekeystart`) === `false`) return
          keyboardEvent.preventDefault()
          resolve()
        }
      }
    }

    const resizeCanvas = function (canvas, scale, resolution) {
      if (scale && resolution) {
        canvas.classList.add(`dosee-crisp-render`)
        canvas.style.width = `${resolution.width * scale}px`
        canvas.style.height = `${resolution.height * scale}px`
        canvas.width = resolution.width * scale
        canvas.height = resolution.height * scale
      }
    }

    function setupSplash(canvas, splash, resolution) {
      splash.splashElt = document.getElementById(`doseeSplashScreen`)
      if (!splash.splashElt) {
        const div = document.createElement(`div`)
        div.setAttribute(`id`, `doseeSplashScreen`)
        div.classList.add(`rounded`)
        div.style.width = `${resolution.width * scale}px`
        div.style.height = `${resolution.height * scale}px`
        canvas.parentElement.appendChild(div)
        splash.splashElt = div
      }

      splash.splashimg = document.getElementById(`doseeSplashImg`)
      if (!splash.splashimg) {
        const img = document.createElement(`img`)
        img.src = `/images/floppy_disk_icon-180x180.png`
        img.classList.add(`dosee-crisp-render`)
        img.setAttribute(`id`, `doseeSplashImg`)
        img.setAttribute(`alt`, `DOSee logo`)
        splash.splashElt.appendChild(img)
      }

      splash.titleElt = document.createElement(`span`)
      splash.titleElt.setAttribute(`id`, `doseeSplashTitle`)
      splash.titleElt.textContent = ``
      splash.splashElt.appendChild(splash.titleElt)

      let table = document.getElementById(`doseeProgressIndicator`)
      if (!table) {
        table = document.createElement(`div`)
        table.setAttribute(`id`, `doseeProgressIndicator`)
        splash.splashElt.appendChild(table)
      }
      splash.table = table
    }

    splash.setTitle = function (title) {
      splash.titleElt.textContent = title
    }

    splash.hide = function () {
      splash.splashElt.classList.add(`hidden`)
      document.getElementById(`doseeCanvas`).classList.remove(`hidden`)
    }

    const addRow = function (table) {
      const p = document.createElement(`p`)
      p.classList.add(`toast`)
      const statusCell = document.createElement(`span`)
      statusCell.classList.add(`splash-status`)
      const titleCell = document.createElement(`span`)
      p.appendChild(statusCell)
      p.appendChild(titleCell)
      table.appendChild(p)
      return [titleCell, statusCell]
    }

    function attachScript(js_url) {
      if (js_url) {
        const head = document.getElementsByTagName(`head`)[0]
        const newScript = document.createElement(`script`)
        newScript.type = `text/javascript`
        newScript.src = js_url
        head.appendChild(newScript)
      }
    }

    function getPointerLockEnabler() {
      return (
        canvas.requestPointerLock ||
        canvas.mozRequestPointerLock ||
        canvas.webkitRequestPointerLock
      )
    }

    // Don't allow the arrow keys, PgUp/PgDn, Home or End keys to affect the page position
    function blockNavigationKeys() {
      function blockKeys(e) {
        if (typeof Module === `undefined`) return
        // cancel this preventDefault() event listener if EM-DOSBox has been aborted
        if (typeof window.ABORT === `boolean` && window.ABORT === true) {
          document.removeEventListener(`keydown`, blockKeys)
        }
        // monitor keyboard key presses
        // list of e.key values
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Navigation_keys
        switch (e.key) {
          case `ArrowDown`:
          case `ArrowLeft`:
          case `ArrowRight`:
          case `ArrowUp`:
          case `End`:
          case `Home`:
          case `PageDown`:
          case `PageUp`:
            // Blocks the browser's default key press handling
            e.preventDefault()
            return false
        }
        return true
      }
      document.addEventListener(`keydown`, blockKeys)
    }
  }

  /**
   * misc
   */
  function BFSOpenZip(loadedData) {
    return new BrowserFS.FileSystem.ZipFS(loadedData)
  }

  // This is such a hack. We're not calling the BrowserFS api
  // 'correctly', so we have to synthesize these flags ourselves
  const flag_r = {
    isReadable: () => {
      return true
    },
    isWriteable: () => {
      return false
    },
    isTruncating: () => {
      return false
    },
    isAppendable: () => {
      return false
    },
    isSynchronous: () => {
      return false
    },
    isExclusive: () => {
      return false
    },
    pathExistsAction: () => {
      return 0
    },
    pathNotExistsAction: () => {
      return 1
    }
  }
  const flag_w = {
    isReadable: () => {
      return false
    },
    isWriteable: () => {
      return true
    },
    isTruncating: () => {
      return false
    },
    isAppendable: () => {
      return false
    },
    isSynchronous: () => {
      return false
    },
    isExclusive: () => {
      return false
    },
    pathExistsAction: () => {
      return 0
    },
    pathNotExistsAction: () => {
      return 3
    }
  }

  /**
     * Searches  for dosbox.conf, and moves it to '/dosbox.conf'
     so dosbox uses it.
      */
  function moveConfigToRoot(fs) {
    let dosboxConfPath = null
    // Recursively search for dosbox.conf.
    function searchDirectory(dirPath) {
      fs.readdirSync(dirPath).forEach(function (item) {
        if (dosboxConfPath) return
        // Avoid infinite recursion by ignoring these entries, which exist at
        // the root.
        if (item === `.` || item === `..`) return
        // Append `/` between dirPath and the item's name... unless dirPath
        // already ends in it (which always occurs if dirPath is the root, `/`).
        const itemPath =
            dirPath + (dirPath[dirPath.length - 1] !== `/` ? `/` : ``) + item,
          itemStat = fs.statSync(itemPath)
        if (itemStat.isDirectory(itemStat.mode)) {
          searchDirectory(itemPath)
        } else if (item === `dosbox.conf`) {
          dosboxConfPath = itemPath
        }
      })
    }

    searchDirectory(`/`)

    if (dosboxConfPath !== null) {
      fs.writeFileSync(
        `/dosbox.conf`,
        fs.readFileSync(dosboxConfPath, null, flag_r),
        null,
        flag_w,
        0x1a4
      )
    }
  }

  function extend(a, b) {
    if (a === null) return b
    if (b === null) return a
    const ta = typeof a,
      tb = typeof b
    if (ta !== tb) {
      if (ta === `undefined`) return b
      if (tb === `undefined`) return a
      throw new Error(`Cannot extend an ${ta} with an ${tb}`)
    }
    if (Array.isArray(a)) return a.concat(b)
    if (ta === `object`) {
      Object.keys(b).forEach(function (k) {
        a[k] = extend(a[k], b[k])
      })
      return a
    }
    return b
  }

  document.getElementById(`doseeVersion`).innerHTML = ` version ${version.get(
    `display`
  )}`
  window.DoseeLoader = DoseeLoader
  window.Emulator = Emulator
})(typeof Promise === `undefined` ? ES6Promise.Promise : Promise)
