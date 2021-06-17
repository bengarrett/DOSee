# DOSee

## Changes and updates

### v1.70

- New meta initialisation options, `dosee:speed`, `dosee:graphic` and `dosee:audio`.
- Renamed Hardware tab headers to improve their clarity.
- Replaced two of the sample demos to better show off the variety of emulated hardware.
- Fixed broken SVGA Graphic option, `dosmachine=svga`.
- Fixed broken _Automatically start DOS emulation_ option.

### v1.60

- Fixed broken stop button.
- Code refactor to be ES2017 and ESlint compliant.
- Updated Workbox to v6.
- Fixed the broken Dockerfile and dropped docker-compose.yml.

### v1.50

- Added experimental _WASM_ WebAssembly DOSBox port support.
- Fixed malformed, tiny canvas rendering on high DPR devices such as Retina laptops.
- Migrated all static `styles` from the JavaScript into `dosee.css`.
- DOSee forms are responsive.
- Added _DOSee_ and _DOSBox_ prefixes to console logging.
- `dosee:width:height` now applies to splash screen.
- Dropped `aspectRatio` API call as it wasn't used.
- Migrated to Workbox v5.

### v1.40

- Made DOSee into a [Progressive Web App](https://developers.google.com/web/progressive-web-apps/desktop) that allows installation to a desktop.
- Added basic offline support using [Workbox](https://workboxjs.org).
- Rearranged the source files and subdirectories to require a `build` initialisation
- Changed page layout to center-align the canvas and form.
- Added a favicon for bookmarks.

### v1.30

Introduced breaking meta element name changes.

- `dosee:capname` &rarr; `dosee:capture:filename`
- `dosee:gamefilepath` &rarr; `dosee:zip:path`
- `dosee:gusaudio` &rarr; `dosee:audio:gus`
- `dosee:resolution` &rarr; `dosee:width:height`
- `dosee:startexe` &rarr; `dosee:run:filename`
- `dosee:utils` &rarr; `dosee:utilities`

* Help tab is implemented and functional
* Added a browser protocol check and user notification to handle [some cross-origin request issues](https://github.com/bengarrett/DOSee/issues/1)
* Fixed glyph display issues on macOS
* Fixed `DOSee.newQueryString()` incorrectly handling URLs that lacked `#` symbols
* Replaced depreciated `onkeydown.which` property usage with `onkeydown.key`
* Navigation keyboard keys will be restored if DOSee has been stopped
* Form labels now do not wrap over multiple lines

### v1.20

- Now requires [npm](https://www.npmjs.com/get-npm) or [Docker](https://www.docker.com/products/docker-desktop) for installation as the installation scripts have been removed.
- Added `DOSee` prototype object that is accessible from `window.DOSee`. It is now used to access all the custom DOSee function additions.
- Added `DOSee.exit()` that will end the emulation and remove all event listeners created by Emscripten.
- Added `DOSee.canvasResize()` that uses Emscripten to resize the canvas element.
- Added `dosee:spacekeystart` meta element to disable the Space key to start DOSee feature.
- Removed the right-click menu over the canvas blocker that was used by The Emularity, there are a couple of screen capture items instead.
- Isolated the variables and functions in `dosee-init.js` so they do not pollute the `window` global scope.
- Now gracefully handles missing, expected form elements.

### v1.13

- Now will read and use `<meta data="dosee:filename">` element.

### v1.11

- Added a PowerShell install script for Windows (and PowerShell Core) users.
- Replaced `doseeVersion` string with a `version` Map() object.
- Replaced the use of the outdated and broken _screenfull_ library with the [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API).
- Fixed missing dependencies false-positives.
- _doseeTabs_ links now anchor back to `<header id="doseeTabs">`

### v1.10

- Initial public release.
