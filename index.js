/*
 * index.js
 * DOSee index.html example menu user-interactions
 */
"use strict"

// Menu containers
const menuTabs = new Map()
    .set(`hardware`, document.getElementById(`hardwareTab`))
    .set(`options`, document.getElementById(`optionsTab`))
    .set(`help`, document.getElementById(`helpTab`))

// Menu buttons
const menuBtns = new Map()
    .set(`hardware`, document.getElementById(`hardwareBtn`))
    .set(`options`, document.getElementById(`optionsBtn`))
    .set(`help`, document.getElementById(`helpBtn`))

// Create mouse click events for each menu button
function monitorTabs() {
    menuBtns.forEach(button => {
        if (button === null) return
        button.addEventListener(`click`, event => {
            const srcId = event.srcElement.id
            // replace the trailing `Btn` from the srcElement Id with `Tab`
            const newId = `${srcId.slice(0, -3)}Tab`
            resetTabs(newId)
        })
    })
}

// Hides all menu containers, if a defaultTab is provided then it will be displayed
function resetTabs(defaultTab) {
    menuTabs.forEach(tab => {
        if (tab.id === `${defaultTab}`) tab.classList.remove(`hidden`)
        else tab.classList.add(`hidden`)
    })
}

// Self-invoking function
(() => {
    monitorTabs()
    resetTabs(`hardwareTab`)
    {
        // set the <H2> element to show the running program and archive filename
        const h2 = document.getElementById(`doseeH2`)
        const archive = `${DOSee.getMetaContent(`dosee:zip:path`)}`
        const exe = `${DOSee.getMetaContent(`dosee:run:filename`)}`
        if (exe.length > 0) {
            // char-code 8592 is a leftward arrow
            h2.innerText = `${exe} ${String.fromCharCode(8592)} ${archive}`
        } else h2.innerText = `${archive}`
    }
    console.log(`Loaded index.js`)
})()
