/*
 * index.js
 * DOSee index.html functions
 */
"use strict";

(function() {
    const hw = document.getElementById(`hardware`)
    const opt = document.getElementById(`options`)
    const hwBut = document.getElementById(`hwButton`)
    const optBut = document.getElementById(`optButton`)

    console.info(`index.js v1.0 loaded`)
    //        document.getElementById(`hardware`)
    hwBut.onclick = function() {
        resetMenu()
        hw.style.display = `block`
    }
    optBut.onclick = function() {
        resetMenu()
        opt.style.display = `block`
    }

    const resetMenu = function() {
        hw.style.display = `none`
        opt.style.display = `none`
    }
})()
