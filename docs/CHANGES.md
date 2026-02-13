# DOSee Changelog

## v1.9.0 (Current)

**Enhancements:**

- Better feedback for missing/misconfigured HTML elements
- Updated packages (including workbox) to latest versions
- Replaced yarn/npx with pnpm for development
- Improved service worker error feedback

**Bug Fixes:**

- Fixed potential memory leak with full-screen usage
- Fixed browserfs.filesystem console warnings
- Removed deprecated fallback properties

**Breaking Changes:** None

## v1.8.5 - 2024-May-30

**Enhancements:**

- DOSee now works properly with subdirectories
- Updated ESLint to v9

**Bug Fixes:**

- Fixed internal path issues

**Breaking Changes:** Removed yarn installation requirements

## v1.8.0 - 2022-Jul-05

**Major Features:**

- Added command chaining with `&&` separator in `dosee:run:filename`
- Added cache clearing button for service worker files
- Added apple-touch-icon support

**Enhancements:**

- Fixed backslash handling in DOS commands (e.g., `EXAMPLE.EXE /?`)
- Renamed internal drive letters for clarity
- Complete overhaul of Utilities `U:` drive:
  - Renamed directories: ALIASES→ALIAS, TOOLS→FILEHACK, REPAIR→FIX, DF2DOS→UTIL
  - Moved TP-FIX into FILEHACK
  - Added CWSDPMI.EXE dependency
  - Added ANSI WELCOME help screen
  - Removed slow DOSzip commander (DZ.EXE)
  - Removed unused DRIVER directory
  - Replaced Open Cubic Player with XTC-PLAY v0.47
  - Replaced Acidview with Insane View v2.01b

**Breaking Changes:** None

## v1.71 - 2022-Apr-23

**Bug Fixes:**

- Fixed yarn/npm build error in `workbox-config.js`
  Error: `[InjectManifest.maximumFileSizeToCacheInBytes] 'maximumFileSizeToCacheInBytes' property type must be number`

## v1.70 - 2021-Jun-17

**Major Features:**

- New meta initialization options: `dosee:speed`, `dosee:graphic`, `dosee:audio`

**Enhancements:**

- Renamed Hardware tab headers for better clarity
- Replaced sample demos to showcase hardware variety
- Emulating header now shows archive filename instead of path
- Fixed broken SVGA Graphic option (`dosmachine=svga`)
- Fixed broken "Automatically start DOS emulation" option

**Breaking Changes:** None

## v1.60 - 2021-Jan-30

**Enhancements:**

- Code refactor to be ES2017 and ESLint compliant
- Updated Workbox to v6
- Fixed broken Dockerfile

**Bug Fixes:**

- Fixed broken stop button

**Breaking Changes:** Dropped docker-compose.yml

## v1.50 - 2020-Apr-03

**Major Features:**

- Added experimental WASM (WebAssembly) DOSBox port support
- Added responsive DOSee forms

**Enhancements:**

- Fixed malformed canvas rendering on high DPR/Retina devices
- Migrated all static styles from JavaScript to `dosee.css`
- Added DOSee/DOSBox prefixes to console logging
- `dosee:width:height` now applies to splash screen
- Migrated to Workbox v5

**Bug Fixes:**

- Dropped unused `aspectRatio` API call

**Breaking Changes:** None

## v1.40 - 2019-Sep-13

**Major Features:**

- Converted DOSee into a Progressive Web App (desktop installation support)
- Added basic offline support using Workbox

**Enhancements:**

- Rearranged source files and subdirectories
- Center-aligned canvas and form layout
- Added favicon for bookmarks

**Breaking Changes:** Now requires `build` initialization

## v1.30 - 2019-Jun-09

**Breaking Changes:** Meta element name changes (breaking):

- `dosee:capname` → `dosee:capture:filename`
- `dosee:gamefilepath` → `dosee:zip:path`
- `dosee:gusaudio` → `dosee:audio:gus`
- `dosee:resolution` → `dosee:width:height`
- `dosee:startexe` → `dosee:run:filename`
- `dosee:utils` → `dosee:utilities`

**Enhancements:**

- Implemented functional Help tab
- Added browser protocol check for cross-origin request issues
- Fixed glyph display issues on macOS
- Fixed `DOSee.newQueryString()` handling of URLs without `#` symbols
- Replaced deprecated `onkeydown.which` with `onkeydown.key`
- Restored navigation keyboard keys after DOSee stops
- Prevented form labels from wrapping

## v1.20 - 2019-Jun-07

**Breaking Changes:**

- Now requires npm or Docker (removed installation scripts)

**Major Features:**

- Added `DOSee` prototype object accessible from `window.DOSee`
- Added `DOSee.exit()` to end emulation and clean up event listeners
- Added `DOSee.canvasResize()` for canvas resizing
- Added `dosee:spacekeystart` meta element to disable Space key start

**Enhancements:**

- Removed right-click menu over canvas (replaced with screen capture)
- Isolated variables/functions in `dosee-init.js` to avoid global scope pollution
- Gracefully handles missing form elements

## v1.13 - 2019-Jun-07

**Enhancements:**

- Now reads and uses `<meta data="dosee:filename">` element

## v1.11 - 2019-Jun-07

**Enhancements:**

- Added PowerShell install script for Windows/PowerShell Core
- Replaced `doseeVersion` string with `version` Map() object
- Replaced outdated _screenfull_ library with Fullscreen API
- Fixed missing dependencies false-positives
- Fixed _doseeTabs_ links anchoring

## v1.10 - 2019-Feb-25

**Initial Release:** First public version of DOSee
