/*
 * dosee-functions.js
 * DOSee user interface functions
 */

"use strict"

// Returns the content data stored in a HTML <meta> tag
function getMetaContent(name) {
    const elm = document.getElementsByName(name)
    if (elm[0] === undefined) return null
    return elm[0].getAttribute(`content`)
}

// Updates the content data stored in a HTML <meta> tag
function setMetaContent(name, value) {
    const elm = document.getElementsByName(name)
    if (elm[0] === undefined || !elm[0].hasAttribute(`content`)) return null
    return elm[0].setAttribute(`content`, `${value}`)
}

// Extracts the URL query string and run it through the URLSearchParams API
function newQueryString() {
    const wlh = window.location.href
    // the API works best with only the URL query string rather than the whole URL
    return new URLSearchParams(wlh.slice(wlh.indexOf(`?`), wlh.indexOf(`#`)))
}

// Test the local storage availability for the browser
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
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

(() => {
    // 'Options' tab interactions

    // Restore existing and save new interactions that are kept after the browser is closed
    if (storageAvailable(`local`)) {
        // Automatically start DOS emulation
        const autoRun = document.getElementById(`doseeAutoRun`)
        autoRun.addEventListener(`click`, () => {
            const chk = autoRun.checked
            localStorage.setItem(`doseeAutoStart`, chk) // boolean value
        })
        const item1 = localStorage.getItem(`doseeAutoStart`)
        if (item1 === `true`) autoRun.checked = true
        // For sharper DOS ASCII/ANSI text
        const aspect = document.getElementById(`doseeAspect`)
        const item2 = localStorage.getItem(`doseeAspect`)
        aspect.addEventListener(`click`, () => {
            const dosAspect = aspect.checked
            localStorage.setItem(`doseeAspect`, !dosAspect) // boolean value
        })
        if (item2 === `false`) aspect.checked = true
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

    // Fullscreen button
    // uses the Fullscreen API (https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
    if (typeof document.fullscreenElement === `undefined`) {
        // disable and hide the button if API is not supported by the browser such as in Safari
        const element = document.getElementById(`doseeFullScreen`)
        element.style.display = `none`
    } else {
        document
            .getElementById(`doseeFullScreen`)
            .addEventListener(`click`, () => {
                const element = document.getElementById(`doseeCanvas`)
                if (!element.fullscreenElement) {
                    element.requestFullscreen()
                } else {
                    if (element.exitFullscreen) {
                        element.exitFullscreen()
                    }
                }
            })
    }

    // Screen capture button
    try {
        if (typeof !!new Blob() !== `undefined`) {
            const button = document.getElementById(`doseeCaptureScreen`)
            // dosee screen capture button
            button.addEventListener(`click`, () => {
                const canvas = document.getElementById(`doseeCanvas`)
                const filename = getMetaContent(`dosee:capname`)
                // the default .toBlob() saved image type is image/png
                // but it can be swapped: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
                canvas.toBlob(blob => {
                    // cycles the colours of the button when clicked
                    button.style.color = `green`
                    setTimeout(() => {
                        button.style.color = `black`
                    }, 750)
                    // uses FileSaver.js to save the image locally
                    saveAs(blob, filename)
                })
            })
        }
    } catch (err) {
        console.error(err)
    }

    // Reboot button and links
    document.getElementsByName(`doseeReboot`).forEach(element => {
        element.addEventListener(`click`, () => {
            location.reload(true)
        })
    })
})()
