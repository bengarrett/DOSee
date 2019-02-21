/*
 * index.js
 * DOSee index.html functions
 */
"use strict"

// todo
function setMetaContent(name) {
    const elm = document.getElementsByName(name)
    if (elm[0] === undefined) return null
    else return elm[0].getAttribute(`content`)
}

(function() {
    const hw = document.getElementById(`hardware`)
    const opt = document.getElementById(`options`)
    const hlp = document.getElementById(`helpTab`)
    const hwBut = document.getElementById(`hwButton`)
    const optBut = document.getElementById(`optButton`)
    const hlpBut = document.getElementById(`hlpButton`)
    const resetMenu = function() {
        hw.style.display = `none`
        opt.style.display = `none`
        hlp.style.display = `none`
    }

    //        document.getElementById(`hardware`)
    hwBut.onclick = function() {
        resetMenu()
        hw.style.display = `block`
    }
    optBut.onclick = function() {
        resetMenu()
        opt.style.display = `block`
    }
    hlpBut.onclick = function() {
        resetMenu()
        hlp.style.display = `block`
    }


    resetMenu()
    hwBut.click()

    // set the header to show the filename
    document.getElementById(`doseeH2`).innerText = `${getMetaContent(`dosee:filename`)}`

    console.info(`index.js v1.0 loaded`)

})()
