/*
 * index.js
 * DOSee index.html example menu user-interactions
 */

(() => {
  "use strict";

  // DOSee console logging utility with consistent styling
  const doseeLog = (level, message) => {
    const styles = `color:dimgray;font-weight:bold`;
    const prefix = `%cDOSee`;

    switch (level) {
      case "error":
        console.error(prefix, styles, message);
        break;
      case "warn":
        console.warn(prefix, styles, message);
        break;
      case "info":
      default:
        console.log(prefix, styles, message);
    }
  };

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
    menuTabs.forEach((tab, key) => {
      if (tab === null) {
        doseeLog(
          "error",
          `Menu tab element missing for key "${key}". Check your HTML for element with id "${key}Tab"`,
        );
        return;
      }
      if (typeof tab.id !== "string" || tab.id.length === 0) {
        doseeLog(
          "error",
          `Menu tab element has invalid id. Expected "${key}Tab", got: ${tab.id}`,
        );
        return;
      }

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
    const h2 = document.getElementById(`doseeH2`);
    if (h2 === null) {
      doseeLog(
        "error",
        `Required element #doseeH2 not found. Check your HTML structure`,
      );
      return;
    }

    const zipPath = DOSee.getMetaContent(`dosee:zip:path`);
    const runFilename = DOSee.getMetaContent(`dosee:run:filename`);

    if (zipPath === null) {
      doseeLog(
        "error",
        `Missing required meta tag "dosee:zip:path". Add <meta name="dosee:zip:path" content="your/path/here.zip"> to your HTML`,
      );
      return;
    }

    if (runFilename === null) {
      doseeLog(
        "error",
        `Missing required meta tag "dosee:run:filename". Add <meta name="dosee:run:filename" content="program.exe"> to your HTML`,
      );
      return;
    }

    if (!zipPath.includes("/")) {
      doseeLog(
        "warn",
        `zip path doesn't contain '/'. Expected format like "programs/example.zip", got: ${zipPath}`,
      );
    }

    try {
      const archive = zipPath.split(`/`),
        executable = `${runFilename}`,
        leftwardArrow = 8592;

      if (archive.length === 0) {
        throw new Error(`Empty archive path after splitting: ${zipPath}`);
      }

      const fileName = archive[archive.length - 1];
      h2.innerText =
        executable.length > 0
          ? `${executable} ${String.fromCharCode(leftwardArrow)} ${fileName}`
          : `${fileName}`;
    } catch (error) {
      doseeLog("error", `Error setting header text: ${error.message}`);
      h2.innerText = `DOSee Configuration Error`;
    }
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
    doseeLog("info", `Thank you for installing DOSee`);
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
  doseeLog("info", `Loaded index.js`);
})();
