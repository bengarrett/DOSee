/*
 * dosee-loader.js
 * DOSee initialisation
 */

/* global newQueryString setMetaContent */
"use strict"

// Relative file paths to DOSee emulation dependencies
const paths = new Map()
    .set(`driveG`, `disk_drives/g_drive.zip`)
    .set(`driveS`, `disk_drives/s_drive.zip`)
    .set(`driveU`, `disk_drives/u_drive.zip`)
    .set(`core`, `emulator/dosee-core.js`)
    .set(`mem`, `emulator/dosee-core.mem`)

// Handle URL params special cases that require additional files to be loaded into DOSee
{
    const urlParams = newQueryString()
    // Gravis Ultrasound Audio drivers (dosaudio=gus)
    const audio = urlParams.get(`dosaudio`)
    console.log(`GUS`, audio)
    if (audio === `gus`) setMetaContent(`dosee:gusaudio`, `true`)
    // DOSee Utilities (dosutils=true)
    const utils = urlParams.get(`dosutils`)
    if (utils === `true`) setMetaContent(`dosee:utils`, `true`)
}

// Load GUS (Gravis UltraSound) driver
const gusDriver = q => {
    if (q !== `true`) return null
    return DoseeLoader.mountZip(
        `g`,
        DoseeLoader.fetchFile(
            `gravis ultrasound drivers`,
            `${paths.get(`driveG`)}`
        )
    )
}

// Load the Emscripten static memory initialization code external file
// https://kripken.github.io/emscripten-site/docs/optimizing/Optimizing-Code.html#code-size
const locateFiles = filename => {
    if (filename === `dosbox.html.mem`) return `${paths.get(`mem`)}`
    return `libs/${filename}`
}

// Initialise the resolution of the DOS program - width, height
const nativeRes = () => {
    const defaults = [640, 480]
    const arr = cfg.res.split(`,`)
    if (arr.length < 1) return defaults
    return [parseInt(arr[0]), parseInt(arr[1])]
}

// Load additional DOS tools and utilities
const utils = q => {
    if (q !== `true`) return null
    return DoseeLoader.mountZip(
        `u`,
        DoseeLoader.fetchFile(`dos utilities`, `${paths.get(`driveU`)}`)
    )
}

// Load configurations that are obtained from the <meta name="dosee:"> HTML tags
const cfg = {
    start: false,
    exe: getMetaContent(`dosee:startexe`),
    filename: getMetaContent(`dosee:filename`),
    gus: getMetaContent(`dosee:gusaudio`),
    path: getMetaContent(`dosee:gamefilepath`),
    res: getMetaContent(`dosee:resolution`),
    utils: getMetaContent(`dosee:utils`)
}

// Start DOSee automatically?
if (
    storageAvailable(`local`) &&
    localStorage.getItem(`doseeAutostart`) === `true`
) {
    cfg.start = true
}
if (cfg.start === true) console.log(`DOSee will launch automatically`)

// Initialise DOSee
// Note order of these DoseeLoader values are important and swapping them could cause failures
// dosee-core.js is the compiled Emscripten edition of DOSBox and should not be minified
const init = new DoseeLoader(
    DoseeLoader.emulatorJS(`${paths.get(`core`)}`),
    DoseeLoader.locateAdditionalEmulatorJS(locateFiles),
    DoseeLoader.nativeResolution(nativeRes()[0], nativeRes()[1]),
    DoseeLoader.mountZip(
        `c`,
        DoseeLoader.fetchFile(`'${cfg.filename}'`, `${cfg.path}`)
    ),
    DoseeLoader.mountZip(
        `s`,
        DoseeLoader.fetchFile(`DOSee configurations`, `${paths.get(`driveS`)}`)
    ),
    gusDriver(cfg.gus),
    utils(cfg.utils),
    DoseeLoader.startExe(cfg.exe)
)

// Start DOSee!
const emulator = new Emulator(
    document.querySelector(`#doseeCanvas`),
    null,
    init
)
emulator.start({ waitAfterDownloading: !cfg.start })
