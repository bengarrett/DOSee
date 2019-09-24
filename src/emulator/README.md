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
