/*
 * /javascripts/dosee-functions.js
 *
 * DOSee user interface functions
 */

/* global saveAs screenfull */
/* eslint-env es6 */
/* eslint quotes: ['error', 'backtick'] */
/* eslint indent: ["error", 4, { "SwitchCase": 1 } ] */
/* eslint no-console: ["error", { allow: ["log", "error", "warn"] }] */

'use strict'

// Returns the content data stored in HTML <meta> tags
function metaContent(name) {
    const elm = document.getElementsByName(name)
    if (elm[0] === undefined) return null
    else return elm[0].getAttribute(`content`)
}

// Test the local storage availability for the browser
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
    const test = function (t) {
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
        case `local`: case `session`:
            return test(`${type}Storage`)
        default: return false
    }
}

(function () {
    // 'Options' tab interactions

    // Restore existing and save new interactions that are kept after the browser is closed
    if (storageAvailable(`local`)) {
        // Reveal Options tab
        const dto = document.getElementById(`doseeOptionsTab`)
        dto.classList.remove(`hide-true`)
        dto.classList.add(`hide-false`)
        // Automatically start DOS emulation
        const asb = document.getElementById(`doseeAutoRun`)
        asb.addEventListener(`click`, function () {
            const chk = asb.checked
            localStorage.setItem(`doseeAutostart`, chk) // boolean value
        })
        const d = localStorage.getItem(`doseeAutostart`)
        if (d === `true`) asb.checked = true
        // For sharper DOS ASCII/ANSI text
        const nab = document.getElementById(`doseeAspect`)
        const e = localStorage.getItem(`doseeAspect`)
        nab.addEventListener(`click`, function () {
            var dosaspect = nab.checked
            localStorage.setItem(`doseeAspect`, !dosaspect) // boolean value
        })
        if (e === `false`) nab.checked = true
        // Scaler engine
        const sOpt = document.querySelectorAll(`input[name=dosscale]`)
        let i = sOpt.length
        while (i--)
            sOpt[i].addEventListener(`change`, function () {
                localStorage.setItem(`doseeScaler`, this.value)
            }, 0)
    }
    // Session storage interactions that get deleted when the browser tab is closed
    if (storageAvailable(`session`)) {
        const setTab = function (ac) {
            if (ac === null) return
            sessionStorage.setItem(`doseeTab`, `${ac}`)
        }
        const tab = document.getElementById(`doseeTabs`)
        const tabs = tab.getElementsByClassName(`tabtoggle`)
        // tab event listeners
        if (tabs != null && tabs.length >= 0) {
            let i = tabs.length
            while (i--) {
                tabs[i].addEventListener(`click`, function () {
                    setTab(this.firstChild.getAttribute(`aria-controls`))
                }, 0)
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
                dt.getElementsByClassName(`active`)[0].classList.remove(`active`)
                dtc.getElementsByClassName(`active`)[0].classList.remove(`active`)
                ts.classList.add(`active`)
                tb.classList.add(`active`)
            }
        }
    }

    // Full screen button
    {
        let elem = document.getElementById(`doseeCanvas`)
        if (screenfull.enabled) {
            const fsb = document.getElementById(`doseeFullScreen`)
            fsb.classList.remove(`hide-true`)
            fsb.classList.add(`hide-false-inline`)
            const chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
            if (chrome) elem = document.getElementById(`doseeContainer`)
        }
        document.getElementById(`doseeFullScreen`).addEventListener(`click`, function () {
            if (screenfull.enabled) screenfull.request(elem)
        })
    }

    // Screenshot button & screenshot + upload button
    try {
        const fss = !!new Blob()
        if (typeof fss !== `undefined`) {
            const ssb = document.getElementById(`doseeCaptureScreen`)
            // dosee screenshot button
            ssb.classList.remove(`hide-true`)
            ssb.classList.add(`hide-false-inline`)
            ssb.addEventListener(`click`, function () {
                const canvas = document.getElementById(`doseeCanvas`)
                const filename = metaContent(`dosee:capname`)
                canvas.toBlob(function (blob) {
                    saveAs(blob, filename)
                    const click = ssb.childNodes[0].childNodes[0].classList
                    click.add(`brand-success`)
                    setTimeout(function () { click.remove(`brand-success`) }, 750)
                })
            })
        }
    } catch (err) {
        console.error(err)
    }

    // Keyboard navigation is disabled
    {
        const tki = document.getElementsByClassName(`touchKeyboardIcons`)
        if (typeof tki[0] !== `undefined`) {
            tki[0].style.cssText = `display: none`
        }
    }

    // Reboot button
    document.getElementById(`doseereboot`).addEventListener(`click`, function () {
        location.reload(true)
    })

})()