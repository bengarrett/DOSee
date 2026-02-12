# DOSBox Emulator Compilation Guide

> **Important:** For best results, use Emscripten 1.37.3 or newer. Older versions may cause canvas resizing issues on high-DPI (Retina) displays.

## About This Guide

This document provides instructions for compiling DOSBox to WebAssembly using Emscripten, along with information about pre-compiled emulator versions available for DOSee.

## Pre-Compiled Emulator Options

### Recommended: DOSBox Sync Enabled

For most users, we recommend using the pre-compiled DOSBox Sync version:

- Version: 8fedaa0 (built with Emscripten 1.37.3)
- Features: Full feature set with emterpreter sync
- Performance: Slightly higher resource usage, but best compatibility
- Downloads:
  - [dosbox-sync.js.gz](https://archive.org/download/emularity_engine_v1/dosbox-sync.js.gz)
  - [dosbox-sync.mem.gz](https://archive.org/download/emularity_engine_v1/dosbox-sync.mem.gz)

### Legacy Version (Not Recommended)

- Version: 30e85e1M (built with Emscripten 1.37.0)
- Status: Deprecated - Contains bugs with high-DPI displays
- Recommendation: Do not use this version

## Compiling DOSBox from Source

If you need to compile DOSBox yourself, follow these instructions.

### System Requirements

- Operating System: Linux, macOS, or Windows Subsystem for Linux (WSL)
  Note: Native Windows compilation is not supported
- Emscripten: Version 1.37.3 or newer
  Download and installation guide: https://emscripten.org/docs/getting_started/downloads.html

### Step-by-Step Compilation

```bash
# Navigate to your home directory
cd ~

# Clone the em-dosbox repository
git clone https://github.com/dreamlayers/em-dosbox.git
cd em-dosbox

# Generate the configure script
./autogen.sh

# Configure the build with Emscripten
emconfigure ./configure

# Compile the project
make

# Verify the compiled files
ls src/dosbox.*
```

After successful compilation, you should see:
- dosbox.js - Main emulator JavaScript
- dosbox.wasm - WebAssembly module
- dosbox.mem - Memory initialization file (if using sync)

### Customizing the Build

You can customize the compilation by modifying src/Makefile.am:

#### Common Compiler Flags

Flag | Purpose | Example
------|---------|---------
FORCE_FILESYSTEM=1 | Embed filesystem in WASM | -s FORCE_FILESYSTEM=1
ASSERTIONS=1 | Enable debugging | -s ASSERTIONS=1
WASM=1 | Optimize for WebAssembly | -s WASM=1

Example Makefile configuration:
```makefile
if WEBASSEMBLY
dosbox_LDFLAGS += -s WASM=1 -s ASSERTIONS=1 -s FORCE_FILESYSTEM=1
```

#### Configure Options

Option | Effect
--------|--------
--enable-wasm | Optimize for WebAssembly (recommended)
--disable-sync | Disable emterpreter sync (reduces features)
--without-sdl2 | Use SDL1 instead of SDL2

Example with custom options:
```bash
emconfigure ./configure --enable-wasm --disable-sync
```

### About Emterpreter Sync

Emterpreter sync is a feature that:

- Enables more DOSBox features (better compatibility)
- Uses more browser resources (higher memory/CPU usage)
- Requires memory file (dosbox.html.mem)

Recommendation: Use emterpreter sync unless you have specific performance constraints or are targeting low-end devices.

## Integrating with DOSee

After obtaining your emulator files (either pre-compiled or self-compiled), update the DOSee configuration:

1. Place the files in your src/emulator/ directory
2. Update dosee-init.js with the correct filenames:

```javascript
const paths = new Map([
  ['core', 'your-emulator.js'],      // e.g., 'dosbox-sync.js'
  ['mem', 'your-emulator.mem'],      // e.g., 'dosbox-sync.mem'
  // ... other required paths
]);
```

3. If using compressed (.gz) files, uncompress them first

## Troubleshooting

Problem: Canvas doesn't resize properly on Retina/HiDPI displays
Solution: Ensure you're using Emscripten 1.37.3+

Problem: Compilation fails on Windows
Solution: Use WSL or compile on Linux/macOS

Problem: Emulator crashes or has missing features
Solution: Try enabling emterpreter sync if disabled

## Getting Help

For additional support:
- Check the em-dosbox GitHub repository: https://github.com/dreamlayers/em-dosbox
- Review Emscripten documentation: https://emscripten.org/docs/
- Open an issue on the DOSee repository

---

DOSee - MS-DOS Emulator for the Web
