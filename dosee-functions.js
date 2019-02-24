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
        const asb = document.getElementById(`doseeAutoRun`)
        asb.addEventListener(`click`, function() {
            const chk = asb.checked
            localStorage.setItem(`doseeAutostart`, chk) // boolean value
        })
        const d = localStorage.getItem(`doseeAutostart`)
        if (d === `true`) asb.checked = true
        // For sharper DOS ASCII/ANSI text
        const nab = document.getElementById(`doseeAspect`)
        const e = localStorage.getItem(`doseeAspect`)
        nab.addEventListener(`click`, function() {
            var dosaspect = nab.checked
            localStorage.setItem(`doseeAspect`, !dosaspect) // boolean value
        })
        if (e === `false`) nab.checked = true
        // Scaler engine
        const sOpt = document.querySelectorAll(`input[name=dosscale]`)
        let i = sOpt.length
        while (i--)
            sOpt[i].addEventListener(
                `change`,
                function() {
                    localStorage.setItem(`doseeScaler`, this.value)
                },
                0
            )
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
        let elem = document.getElementById(`doseeCanvas`)
        if (screenfull.enabled) {
            const chrome =
                /Chrome/.test(navigator.userAgent) &&
                /Google Inc/.test(navigator.vendor)
            if (chrome) elem = document.getElementById(`doseeContainer`)
        }
        document
            .getElementById(`doseeFullScreen`)
            .addEventListener(`click`, function() {
                if (screenfull.enabled) screenfull.request(elem)
            })
    }

    // Screen capture button
    try {
        const fss = !!new Blob()
        if (typeof fss !== `undefined`) {
            const ssb = document.getElementById(`doseeCaptureScreen`)
            // dosee screen capture button
            ssb.addEventListener(`click`, function() {
                const canvas = document.getElementById(`doseeCanvas`)
                const filename = getMetaContent(`dosee:capname`)
                canvas.toBlob(function(blob) {
                    saveAs(blob, filename)
                    ssb.style.color = `green`
                    setTimeout(function() {
                        ssb.style.color = `black`
                    }, 750)
                })
            })
        }
    } catch (err) {
        console.error(err)
    }

    // Reboot button
    document
        .getElementById(`doseeReboot`)
        .addEventListener(`click`, function() {
            location.reload(true)
        })
})()
