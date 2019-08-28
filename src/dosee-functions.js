/*
 * dosee-functions.js
 * DOSee user interface functions
 */

"use strict"
;(() => {
    // Create a DOSee object prototype
    function DOSee() {
        return Array.prototype.reduce.call(arguments)
    }

    // Resize the DOSee canvas
    DOSee.canvasResize = (width = 640, height = 480) => {
        //window._emscripten_get_device_pixel_ratio()
        console.log(`Resizing DOSee canvas to ${width}*${height}px`)
        return window._emscripten_set_element_css_size(
            document.getElementById(`doseeCanvas`),
            parseInt(width),
            parseInt(height)
        )
    }

    // Aborts DOSee and cleans up its event handlers
    DOSee.exit = () => {
        if (
            typeof Module === `undefined` ||
            typeof window.exitRuntime === `undefined`
        )
            return
        // Remove all the event listeners created by EMscripten
        // to restore mouse and keyboard usage.
        window.exitRuntime()
        try {
            // Module is an global object created by Emscripten.
            // abort() abruptly stops Emscripten and frees up browser resources.
            Module.abort()
        } catch (err) {
            console.log(`DOSee has stopped.`)
        }
    }

    // Returns the content data stored in a HTML <meta> tag
    DOSee.getMetaContent = name => {
        const elm = document.getElementsByName(name)
        if (elm[0] === undefined) return null
        return elm[0].getAttribute(`content`)
    }

    // Extracts the URL query string and run it through the URLSearchParams API
    DOSee.newQueryString = () => {
        const url = window.location.href
        const start = url.indexOf(`?`)
        const end = url.indexOf(`#`)
        // URLSearchParams API works best with only the URL query string rather than the whole URL
        // slice string value between ? and #
        if (end >= 0) return new URLSearchParams(url.slice(start, end))
        // slice string value starting at ? to the end of the URL
        else return new URLSearchParams(url.slice(start))
    }

    // Updates the content data stored in a HTML <meta> tag
    DOSee.setMetaContent = (name, value) => {
        const elm = document.getElementsByName(name)
        if (elm[0] === undefined || !elm[0].hasAttribute(`content`)) return null
        return elm[0].setAttribute(`content`, `${value}`)
    }

    // Full screen toggle that uses the Fullscreen API
    // (https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
    DOSee.fullScreen = () => {
        if (typeof document.fullscreenElement === `undefined`) return
        const element = document.getElementById(`doseeCanvas`)
        if (!element.fullscreenElement) element.requestFullscreen()
        else if (element.exitFullscreen) element.exitFullscreen()
    }

    // Capture and save the canvas to a PNG image file
    DOSee.screenCapture = function() {
        try {
            if (typeof !!new Blob() === `undefined`) return
        } catch (err) {
            return
        }
        // note: arrow functions do not support `this`
        const button = this
        const canvas = document.getElementById(`doseeCanvas`)
        const filename = DOSee.getMetaContent(`dosee:capture:filename`)
        // the default .toBlob() saved image type is image/png
        // but it can be swapped: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
        canvas.toBlob(blob => {
            // cycles the colours of the button when clicked
            button.style.color = `green`
            setTimeout(() => {
                button.style.color = `black`
            }, 750)
            // uses FileSaver.js to save the image locally
            FileSaver.saveAs(blob, filename)
        })
    }

    // Test the local storage availability for the browser
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    DOSee.storageAvailable = type => {
        const test = function(t) {
            try {
                const storage = window[t],
                    x = `__storage_test__`
                storage.setItem(x, `test data`)
                storage.removeItem(x)
                return true
            } catch (e) {
                return false
            }
        }
        switch (type) {
            case `local`:
            case `session`:
                return test(`${type}Storage`)
            default:
                return false
        }
    }

    DOSee.reboot = () => {
        location.reload(true)
    }

    // Make DOSee a global object to allow access by other scripts
    window.DOSee = DOSee

    // 'Options' tab interactions

    // Restore existing and save new interactions that are kept after the browser is closed
    if (DOSee.storageAvailable(`local`)) {
        // Automatically start DOS emulation
        const autoRun = document.getElementById(`doseeAutoRun`)
        if (autoRun !== null) {
            autoRun.addEventListener(`click`, () => {
                const chk = autoRun.checked
                localStorage.setItem(`doseeAutoStart`, chk) // boolean value
            })
            const item1 = localStorage.getItem(`doseeAutoStart`)
            if (item1 === `true`) autoRun.checked = true
        }
        // For sharper DOS ASCII/ANSI text
        const aspect = document.getElementById(`doseeAspect`)
        if (aspect !== null) {
            const item2 = localStorage.getItem(`doseeAspect`)
            aspect.addEventListener(`click`, () => {
                const dosAspect = aspect.checked
                localStorage.setItem(`doseeAspect`, !dosAspect) // boolean value
            })
            if (item2 === `false`) aspect.checked = true
        }
        // Scaler engine
        const scaler = document.querySelectorAll(`input[name=dosscale]`)
        scaler.forEach(input => {
            input.addEventListener(
                `change`,
                element => {
                    localStorage.setItem(
                        `doseeScaler`,
                        element.srcElement.value
                    )
                },
                0
            )
        })
    }

    // Full screen button
    const fullScreenButton = document.getElementById(`doseeFullScreen`)
    if (fullScreenButton === null) {
        // do nothing
    } else if (typeof document.fullscreenElement === `undefined`) {
        // disable and hide the button if API is not supported by the browser such as in Safari
        fullScreenButton.style.display = `none`
    } else {
        fullScreenButton.addEventListener(`click`, DOSee.fullScreen)
    }

    // Screen capture button
    try {
        if (typeof !!new Blob() !== `undefined`) {
            const button = document.getElementById(`doseeCaptureScreen`)
            if (button !== null)
                button.addEventListener(`click`, DOSee.screenCapture)
        }
    } catch (err) {
        console.error(err)
    }

    // Reboot button and links
    document.getElementsByName(`doseeReboot`).forEach(element => {
        element.addEventListener(`click`, DOSee.reboot)
    })

    // Stop, abort, quit button
    const exitButton = document.getElementById(`doseeExit`)
    if (exitButton !== null)
        return exitButton.addEventListener(`click`, DOSee.exit)
})()
