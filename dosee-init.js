/*
 * dosee-loader.js
 * DOSee initialisator
 */
{
    `use strict`

    const paths = new Map()
        .set(`ddg`, `disk_drives/g_drive.zip`)
        .set(`dds`, `disk_drives/s_drive.zip`)
        .set(`ddu`, `disk_drives/u_drive.zip`)
        .set(`core`, `emulator/dosee-core.js`)
        .set(`mem`, `emulator/dosee-core.mem`)

    // Load GUS (Gravis UltraSound) drivers
    const gusDriver = function (q) {
        if (q !== `true`) return null
        return DoseeLoader.mountZip(`g`, DoseeLoader.fetchFile(`gravis ultrasound drivers`, `${paths.get(`ddg`)}`))
    }

    // Load the Emscripten static memory initialization code external file
    // https://kripken.github.io/emscripten-site/docs/optimizing/Optimizing-Code.html#code-size
    const locateFiles = function (filename) {
        console.log(`filename: ${filename}`)
        if (filename === `dosbox.html.mem`) return `${paths.get(`mem`)}`
        return `libs/${filename}`
    }

    // Initialise the resolution of the DOS program - width, height
    const nr = function () {
        const arr = cfg.res.split(`,`)
        if (arr.length < 1) return [640, 480]
        return [parseInt(arr[0]), parseInt(arr[1])]
    }

    // Load additional DOS tools and utilities
    const utils = function (q) {
        if (q !== `true`) return null
        return DoseeLoader.mountZip(`u`, DoseeLoader.fetchFile(`dos utilities`, `${paths.get(`ddu`)}`))
    }

    // Load configurations obtained from <meta name="dosee:"> HTML tags
    const cfg = {
        start: false,
        exe: metaContent(`dosee:startexe`),
        filename: metaContent(`dosee:filename`),
        gus: metaContent(`dosee:gusaudio`),
        path: metaContent(`dosee:gamefilepath`),
        res: metaContent(`dosee:resolution`),
        utils: metaContent(`dosee:utils`),
    }

    // Start DOSee automatically?
    if (storageAvailable(`local`) && localStorage.getItem(`doseeAutostart`) === `true`) { cfg.start = true }
    if (cfg.start === true) console.log(`DOSee will launch automatically`)

    // Initialise DOSee
    // Note order of these DoseeLoader values are important and swapping them could cause failures
    // dosee-core.js is the compiled Emscripten edition of DOSBox and should not be minified
    const init = new DoseeLoader(
        DoseeLoader.emulatorJS(`${paths.get(`core`)}`),
        DoseeLoader.locateAdditionalEmulatorJS(locateFiles),
        DoseeLoader.nativeResolution(nr()[0], nr()[1]),
        DoseeLoader.mountZip(`c`, DoseeLoader.fetchFile(`\'${cfg.filename}\'`, `${cfg.path}`)),
        DoseeLoader.mountZip(`s`, DoseeLoader.fetchFile(`DOSee configurations`, `${paths.get(`dds`)}`)),
        gusDriver(cfg.gus),
        utils(cfg.utils),
        DoseeLoader.startExe(cfg.exe)
    )

    // Start DOSee!
    const emulator = new Emulator(document.querySelector(`#doseeCanvas`), null, init)
    emulator.start({ waitAfterDownloading: !cfg.start })
}