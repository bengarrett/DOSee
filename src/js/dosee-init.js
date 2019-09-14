/*
 * dosee-init.js
 * DOSee initialisation
 */

"use strict"
;(() => {
    // Relative file paths to DOSee emulation dependencies
    const paths = new Map()
        .set(`driveG`, `/disk_drives/g_drive.zip`)
        .set(`driveS`, `/disk_drives/s_drive.zip`)
        .set(`driveU`, `/disk_drives/u_drive.zip`)
        .set(`core`, `/emulator/dosee-core.js`)
        .set(`mem`, `/emulator/dosee-core.mem`)

    // Load configurations that are obtained from the <meta name="dosee:"> HTML tags
    const config = new Map()
        .set(`exe`, DOSee.getMetaContent(`dosee:run:filename`))
        .set(`filename`, DOSee.getMetaContent(`dosee:filename`))
        .set(`gus`, DOSee.getMetaContent(`dosee:audio:gus`))
        .set(`path`, DOSee.getMetaContent(`dosee:zip:path`))
        .set(`res`, DOSee.getMetaContent(`dosee:width:height`))
        .set(`start`, false)
        .set(`utils`, DOSee.getMetaContent(`dosee:utilities`))

    // Extract and save the filename from config path
    {
        const index = config.get(`path`).lastIndexOf(`/`)
        const filename = config.get(`filename`)
        if (filename === null || config.get(`filename`).length == 0) {
            if (index > -1)
                config.set(`filename`, config.get(`path`).slice(index + 1))
            else config.set(`filename`, config.get(`path`))
        }
    }

    // Handle URL params special cases that need additional files to be loaded by DOSee
    {
        const urlParams = DOSee.newQueryString()
        // Gravis Ultrasound Audio drivers (dosaudio=gus)
        const audio = urlParams.get(`dosaudio`)
        if (audio === `gus`) {
            config.set(`gus`, `true`)
            DOSee.setMetaContent(`dosee:audio:gus`, `true`)
        }
        // DOSee Utilities (dosutils=true)
        const utils = urlParams.get(`dosutils`)
        if (utils === `true`) {
            config.set(`utils`, `true`)
            DOSee.setMetaContent(`dosee:utilities`, `true`)
        }
    }

    // Load the GUS (Gravis UltraSound) driver
    const gusDriver = load => {
        if (load !== `true`) return null
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
    const utils = load => {
        if (load !== `true`) return null
        return DoseeLoader.mountZip(
            `u`,
            DoseeLoader.fetchFile(`dos utilities`, `${paths.get(`driveU`)}`)
        )
    }

    // Initialise canvas size
    {
        const canvas = document.getElementById(`doseeCanvas`)
        canvas.width = nativeRes()[0]
        canvas.height = nativeRes()[1]
        canvas.style.width = `${nativeRes()[0]}px`
        canvas.style.height = `${nativeRes()[1]}px`
    }

    // Check the browser protocol that DOSee is hosted on
    // Modern browsers to not permit the loading of web resources using XMLHttpRequest()
    // over `file:///` or `ftp://` as they do not support Cross-origin resource sharing.
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    const protocolCheck = () => {
        const url = new URL(window.location.href)
        switch (url.protocol) {
            case `http:`:
            case `https:`:
                // valid protocols so do nothing
                break
            default:
                // invalid protocols
                try {
                    throw new Error(
                        `DOSee has aborted as it cannot be hosted over the '${url.protocol}' protocol.`
                    )
                } catch (err) {
                    console.error(err)
                }
                return errorBox(
                    `DOSee cannot run over the ${url.protocol} protocol`
                )
        }
    }

    // Displays an dark red error notice with custom `feedback` and a README link
    const errorBox = feedback => {
        const a = document.createElement(`a`)
        a.href = `https://github.com/bengarrett/DOSee#readme`
        a.textContent = ` setup instructions? `
        a.style.backgroundColor = `red`
        a.style.color = `white`
        a.style.textDecoration = `underline`
        // error message
        const errMsg = `${feedback}. Have you followed these `
        // error containers
        document.getElementById(`doseeSlowLoad`).style.display = `none`
        const crash = document.getElementById(`doseeCrashed`)
        const error = document.getElementById(`doseeError`)
        crash.classList.remove(`hidden`)
        error.textContent = errMsg
        error.appendChild(a)
    }

    // Start DOSee without user interaction
    // NOTE: This may break audio support in Chrome 71+ due to its Web Audio autoplay policy?
    // https://goo.gl/7K7WLu
    if (DOSee.storageAvailable(`local`)) {
        if (localStorage.getItem(`doseeAutoStart`) === `true`)
            config.set(`start`, true)
    }
    if (config.get(`start`) === true)
        console.log(`DOSee will launch automatically`)

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
            DoseeLoader.fetchFile(
                `DOSee configurations`,
                `${paths.get(`driveS`)}`
            )
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
        protocolCheck()
        const checks = [
            `BrowserFS`,
            `DOSee`,
            `DoseeLoader`,
            `FileSaver`,
            `Module`
        ]
        let pass = true
        checks.forEach(objName => {
            if (typeof window[objName] === `undefined`) {
                console.error(`checking ${objName}, ${typeof window[objName]}`)
                pass = false
            } else console.log(`checking ${objName}, ${typeof window[objName]}`)
        })
        if (!pass) {
            // console output
            try {
                throw new Error(
                    `DOSee has aborted as it is missing the above dependencies.`
                )
            } catch (err) {
                console.error(err)
            }
            // error link
            return errorBox(
                `DOSee cannot load the required dependencies listed the Browser Console.`
            )
        }
    })
})()
