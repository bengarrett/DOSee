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

// Load configurations that are obtained from the <meta name="dosee:"> HTML tags
const config = new Map()
    .set(`exe`, getMetaContent(`dosee:startexe`))
    .set(`filename`, ``)
    .set(`gus`, getMetaContent(`dosee:gusaudio`))
    .set(`path`, getMetaContent(`dosee:gamefilepath`))
    .set(`res`, getMetaContent(`dosee:resolution`))
    .set(`start`, false)
    .set(`utils`, getMetaContent(`dosee:utils`))

// Extract and save the filename from config path
{
    const index = config.get(`path`).lastIndexOf(`/`)
    if (index > -1) config.set(`filename`, config.get(`path`).slice(index + 1))
    else config.set(`filename`, config.get(`path`))
}

// Handle URL params special cases that need additional files to be loaded by DOSee
{
    const urlParams = newQueryString()
    // Gravis Ultrasound Audio drivers (dosaudio=gus)
    const audio = urlParams.get(`dosaudio`)
    if (audio === `gus`) {
        config.set(`gus`, `true`)
        setMetaContent(`dosee:gusaudio`, `true`)
    }
    // DOSee Utilities (dosutils=true)
    const utils = urlParams.get(`dosutils`)
    if (utils === `true`) {
        config.set(`utils`, `true`)
        setMetaContent(`dosee:utils`, `true`)
    }
}

// Load the GUS (Gravis UltraSound) driver
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
    const arr = config.get(`res`).split(`,`)
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

// Start DOSee without user interaction
// NOTE: This may break audio support in Chrome 71+ due to its Web Audio autoplay policy?
// https://goo.gl/7K7WLu
if (storageAvailable(`local`)) {
    if (localStorage.getItem(`doseeAutoStart`) === `true`)
        config.set(`start`, true)
}
if (config.get(`start`) === true) console.log(`DOSee will launch automatically`)

// Initialise DOSee
// Note order of these DoseeLoader values are important and swapping them could cause failures
// dosee-core.js is the compiled Emscripten edition of DOSBox and should not be minified
const init = new DoseeLoader(
    DoseeLoader.emulatorJS(`${paths.get(`core`)}`),
    DoseeLoader.locateAdditionalEmulatorJS(locateFiles),
    DoseeLoader.nativeResolution(nativeRes()[0], nativeRes()[1]),
    DoseeLoader.mountZip(
        `c`,
        DoseeLoader.fetchFile(
            `'${config.get(`filename`)}'`,
            `${config.get(`path`)}`
        )
    ),
    DoseeLoader.mountZip(
        `s`,
        DoseeLoader.fetchFile(`DOSee configurations`, `${paths.get(`driveS`)}`)
    ),
    gusDriver(config.get(`gus`)),
    utils(config.get(`utils`)),
    DoseeLoader.startExe(config.get(`exe`))
)

// Start DOSee!
const emulator = new Emulator(
    document.querySelector(`#doseeCanvas`),
    null,
    init
)
emulator.start({ waitAfterDownloading: !config.get(`start`) })

// Checks for and provides feedback for missing dependencies after all other JS has been loaded
window.addEventListener(`load`, () => {
    const checks = [`BrowserFS`, `saveAs`]
    let pass = true
    checks.forEach(objName => {
        if (typeof window[objName] === `undefined`) return (pass = false)
    })
    if (!pass) {
        // error link
        const a = document.createElement(`a`)
        a.href = `https://github.com/bengarrett/DOSee`
        a.textContent = `Installation instructions?`
        a.style.color = `white`
        a.style.textDecoration = `underline`
        // error message
        const errMsg = `DOSee cannot load the required dependencies listed the Browser Console. Did you follow the `
        // error containers
        document.getElementById(`doseeSlowLoad`).style.display = `none`
        const crash = document.getElementById(`doseeCrashed`)
        const error = document.getElementById(`doseeError`)
        crash.classList.remove(`hidden`)
        error.textContent = errMsg
        error.appendChild(a)
        // console output
        throw new Error(
            `DOSee has aborted as it is missing the above dependencies.`
        )
    }
})
