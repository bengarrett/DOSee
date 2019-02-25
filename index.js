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
        const archive = `${getMetaContent(`dosee:gamefilepath`)}`
        const exe = `${getMetaContent(`dosee:startexe`)}`
        if (exe.length > 0) {
            h2.innerText = `${exe} ⭠ ${archive}`
        } else h2.innerText = `${archive}`
    }
    console.log(`Loaded index.js`)
})()
