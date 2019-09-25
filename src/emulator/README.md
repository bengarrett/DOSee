> Note: If compiling your own version of DOSBox, you must use Emscripten **1.37.3+** otherwise there maybe issues with the resizing of the `canvas` with high DPR devices.

DOSBox as JavaScript emulator sources.
Any compressed downloads with the `.gz` extension will need to be uncompressed before use.
The `core` and `mem` values for the `paths` Map() in `dosee-init.js` will need to be updated with the replacement DOSBox filenames.

### 'DOSBox Sync Enabled' `dosbox-sync.js`

`version 8fedaa0 built with Emscripten 1.37.3`

- https://archive.org/download/emularity_engine_v1/dosbox-sync.js.gz
- https://archive.org/download/emularity_engine_v1/dosbox-sync.mem.gz

### 'DOSee' `dosee-core.js`

`version 30e85e1M built with Emscripten 1.37.0`

This legacy version breaks on high DPR devices and should not be used.

### Compiling em-dosbox.

Compiling [em-dosbox](https://github.com/dreamlayers/em-dosbox) does _not_ work in Windows!

[Download, install and verify emscripten](https://emscripten.org/docs/getting_started/downloads.html).

```sh
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
