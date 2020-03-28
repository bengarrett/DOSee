# src/emulator/README.md

> Note: If compiling a version of DOSBox, you must use Emscripten **1.37.3+**. Otherwise there may be issues with the resizing of the `canvas` with high DPR devices.

## DOSBox in JavaScript, emulator sources.

Any compressed downloads in this document with the `.gz` extension need to be uncompressed before use.

The **`core`** and **`mem`** key values for the `paths = new Map()` in `src\js\dosee-init.js` need updating with the replacement DOSBox filenames.

### 'DOSBox Sync Enabled' `dosbox-sync.js`

```js
// Relative file paths to DOSee emulation dependencies
const paths = new Map()
   ...
  .set(`mem`, `/emulator/dosbox-sync.mem`)
  .set(`core`, `/emulator/dosbox.js`)
```

> `version 8fedaa0 built with Emscripten 1.37.3`

- https://archive.org/download/emularity_engine_v1/dosbox-sync.js.gz
- https://archive.org/download/emularity_engine_v1/dosbox-sync.mem.gz

### 'DOSee' `dosee-core.js`

```js
// Relative file paths to DOSee emulation dependencies
const paths = new Map()
   ...
  .set(`mem`, `/emulator/dosbox-core.mem`)
  .set(`core`, `/emulator/dosbox-core.js`)
```

> `version 30e85e1M built with Emscripten 1.37.0`

This legacy version **should be avoided** as it breaks on high DPR devices.

## Compiling em-dosbox.

Compiling [em-dosbox](https://github.com/dreamlayers/em-dosbox) does not work on Microsoft Windows.

[Download, install and verify emscripten](https://emscripten.org/docs/getting_started/downloads.html).

```bash
# go home
cd ~

# clone em-dosbox
git clone https://github.com/dreamlayers/em-dosbox.git
cd em-dosbox

# create `configure`
./autogen.sh

# configure the program
emconfigure ./configure

# build project
make

# view compiled files
ls src/dosbox.*
```

Compiler flags that can be used in `src/Makefile.am`.

- `FORCE_FILESYSTEM=1` Forces embedding filesystem support in DOSBox WASM module.
- `ASSERTIONS=1` Enable em-dosbox debugging.

For example

```am
if WEBASSEMBLY
dosbox_LDFLAGS+=-s WASM=1 -s ASSERTIONS=1 -s FORCE_FILESYSTEM=1
```

Configure options

- `--enable-wasm` Enable WebAssembly
- `--disable-sync` Disables emterpreter sync
- `--without-sdl2` Use SDL1 (simple directmedia layer)

For example

```sh
emconfigure ./configure --enable-wasm --disable-sync
```

Emterpreter sync enables more DOSBox features but uses a few more browser resources.
It also requires the use of the Emscripten memory initialisation file `dosbox.html.mem`.
