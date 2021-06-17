/*
 * index.js
 * DOSee index.html example menu user-interactions
 */

(() => {
  "use strict";

  // Menu containers
  const menuTabs = new Map()
    .set(`hardware`, document.getElementById(`hardwareTab`))
    .set(`options`, document.getElementById(`optionsTab`))
    .set(`help`, document.getElementById(`helpTab`));

  // Menu buttons
  const menuButtons = new Map()
    .set(`hardware`, document.getElementById(`hardwareBtn`))
    .set(`options`, document.getElementById(`optionsBtn`))
    .set(`help`, document.getElementById(`helpBtn`));

  // Hides all menu containers, if a defaultTab is provided then it will be displayed
  function resetTabs(defaultTab) {
    menuTabs.forEach((tab) => {
      tab.id === `${defaultTab}`
        ? tab.classList.remove(`hidden`)
        : tab.classList.add(`hidden`);
    });
  }

  // Create mouse click events for each menu button
  function monitorTabs() {
    menuButtons.forEach((button) => {
      if (button === null) return;
      button.addEventListener(`click`, (event) => {
        const srcId = event.srcElement.id,
          threeChars = -3;
        // replace the trailing `Btn` from the srcElement Id with `Tab`
        const newId = `${srcId.slice(0, threeChars)}Tab`;
        resetTabs(newId);
      });
    });
  }

  // Set the <H2> element to show the running program and archive filename
  function setHeader() {
    const h2 = document.getElementById(`doseeH2`),
      archive = DOSee.getMetaContent(`dosee:zip:path`).split(`/`),
      executable = `${DOSee.getMetaContent(`dosee:run:filename`)}`,
      leftwardArrow = 8592;
    const fileName = archive[archive.length - 1];
    h2.innerText =
      executable.length > 0
        ? `${executable} ${String.fromCharCode(leftwardArrow)} ${fileName}`
        : `${fileName}`;
  }

  // Update help tab example
  function example() {
    const path = DOSee.getMetaContent(`dosee:zip:path`),
      na = document.getElementById(`helpTabNA`);
    switch (path) {
      case `dos_programs/program_0/agi_demo_pack_1.zip`:
        document.getElementById(`helpProgram_0`).classList.remove(`hide`);
        na.classList.add(`hide`);
        break;
      case `dos_programs/program_1/loom.zip`:
        document.getElementById(`helpProgram_1`).classList.remove(`hide`);
        na.classList.add(`hide`);
        break;
      case `dos_programs/program_2/emf_vrs2.zip`:
        document.getElementById(`helpProgram_2`).classList.remove(`hide`);
        na.classList.add(`hide`);
        break;
      case `dos_programs/program_3/hyb605.zip`:
        document.getElementById(`helpProgram_3`).classList.remove(`hide`);
        na.classList.add(`hide`);
        break;
      default:
        na.classList.remove(`hide`);
    }
  }

  // PWA offline notification
  function pwa() {
    const offline = document.getElementById(`doseeOffline`);
    window.addEventListener(`offline`, () => {
      offline.classList.remove(`hidden`);
    });
    window.addEventListener(`online`, () => {
      offline.classList.add(`hidden`);
    });
  }

  monitorTabs();
  resetTabs(`hardwareTab`);
  setHeader();
  example();
  pwa();

  // Install (pwa) link
  window.onappinstalled = () => {
    console.log(`Thank you for installing DOSee`);
  };
  window.addEventListener(`beforeinstallprompt`, (beforeInstallPromptEvent) => {
    const installButton = document.getElementById(`doseeInstall`);
    // Prevents immediate prompt display
    beforeInstallPromptEvent.preventDefault();
    installButton.classList.remove(`hidden`);
    installButton.addEventListener(`click`, () => {
      installButton.classList.add(`hidden`);
      // Display install prompt and catch any `Cancel` buttons
      beforeInstallPromptEvent.prompt().catch(() => {
        installButton.classList.add(`hidden`);
      });
    });
  });
  console.log(`Loaded index.js`);
})();
