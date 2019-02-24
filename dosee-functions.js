/*
 * dosee-functions.js
 * DOSee user interface functions
 */

/* global saveAs screenfull */
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

(function() {
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
    // ❌ Session storage interactions that get deleted when the browser tab is closed
    if (storageAvailable(`session`)) {
        const setTab = function(ac) {
            if (ac === null) return
            sessionStorage.setItem(`doseeTab`, `${ac}`)
        }
        const tab = document.getElementById(`doseeTabs`)
        const tabs = tab.getElementsByClassName(`tabtoggle`)
        // tab event listeners
        if (tabs != null && tabs.length >= 0) {
            let i = tabs.length
            while (i--) {
                tabs[i].addEventListener(
                    `click`,
                    function() {
                        //setTab(this.firstChild.getAttribute(`aria-controls`))
                    },
                    0
                )
            }
        }
        // restore most recently used tab
        const savedTab = sessionStorage.getItem(`doseeTab`)
        if (savedTab !== null) {
            const dt = document.getElementById(`doseeTabs`)
            const dtc = document.getElementById(`doseeTabContent`)
            const ts = document.getElementById(`${savedTab}Tab`)
            const tb = document.getElementById(savedTab)
            if (dt !== null && dtc !== null && ts !== null && tb !== null) {
                dt.getElementsByClassName(`active`)[0].classList.remove(
                    `active`
                )
                dtc.getElementsByClassName(`active`)[0].classList.remove(
                    `active`
                )
                ts.classList.add(`active`)
                tb.classList.add(`active`)
            }
        }
    }

    // Full screen button
    {
        let element = document.getElementById(`doseeCanvas`)
        if (screenfull.enabled) {
            const chrome =
                /Chrome/.test(navigator.userAgent) &&
                /Google Inc/.test(navigator.vendor)
            if (chrome) element = document.getElementById(`doseeContainer`)
        }
        document
            .getElementById(`doseeFullScreen`)
            .addEventListener(`click`, () => {
                if (screenfull.enabled) screenfull.request(element)
            })
    }

    // Screen capture button
    try {
        const fss = !!new Blob()
        if (typeof fss !== `undefined`) {
            const ssb = document.getElementById(`doseeCaptureScreen`)
            // dosee screen capture button
            ssb.addEventListener(`click`, () => {
                const canvas = document.getElementById(`doseeCanvas`)
                const filename = getMetaContent(`dosee:capname`)
                canvas.toBlob(blob => {
                    saveAs(blob, filename)
                    ssb.style.color = `green`
                    setTimeout(() => {
                        ssb.style.color = `black`
                    }, 750)
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
