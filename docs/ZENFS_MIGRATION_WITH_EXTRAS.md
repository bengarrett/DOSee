# ZenFS Migration Plan with ZipFS Extras Support

## Understanding browserfs-zipfs-extras

### What it provides

**browserfs-zipfs-extras** adds support for older ZIP compression algorithms:

1. **EXPLODE** - Original PKZIP compression method
2. **UNSHRINK** - Another older PKZIP method
3. **UNREDUCE** - Rare compression algorithm

These algorithms are needed to support older DOS games and applications that use these legacy compression methods.

### Current usage in DOSee

The extras are automatically loaded when `browserfs-zipfs-extras.js` is included after `browserfs.js`. BrowserFS automatically detects and uses these additional decompression algorithms when needed.

## ZenFS Equivalent Functionality

### Research Findings

After researching ZenFS, here's what I found about ZIP compression support:

#### ZenFS Native ZIP Support

ZenFS's `@zenfs/zipfs` package includes:

- **DEFLATE** (most common modern ZIP compression)
- **STORE** (uncompressed storage)
- **BZIP2** (optional, if supported)

**Missing**: EXPLODE, UNSHRINK, UNREDUCE algorithms

#### Solutions for Legacy ZIP Support

### Option 1: Use ZenFS with Custom Decompression

```javascript
import { ZipFileSystem } from "@zenfs/zipfs";
import { ExplodeDecompressor } from "custom-explode-decompressor";
import { UnshrinkDecompressor } from "custom-unshrink-decompressor";

// Register custom decompressors
ZipFileSystem.registerDecompressor(8, ExplodeDecompressor); // Method 8 = EXPLODE
ZipFileSystem.registerDecompressor(1, UnshrinkDecompressor); // Method 1 = UNSHRINK

const zipFS = await ZipFileSystem.create({ zipData: loadedData });
```

### Option 2: Hybrid Approach (Recommended)

Use ZenFS for modern ZIPs and fall back to BrowserFS for legacy ZIPs:

```javascript
async function BFSOpenZip(loadedData) {
  if (typeof loadedData === `undefined`)
    throw Error(`BFSOpenZip loadedData argument cannot be empty`);

  try {
    // Try ZenFS first (modern ZIPs)
    const zipFS = await ZipFileSystem.create({ zipData: loadedData });
    return zipFS;
  } catch (e) {
    // Fall back to BrowserFS for legacy ZIPs
    if (window.BrowserFS) {
      return new Promise((resolve, reject) => {
        BrowserFS.FileSystem.ZipFS.Create(
          {
            zipData: loadedData,
          },
          (e, zipFS) => {
            if (e) {
              doseeLog(
                "ERROR",
                "Failed to create ZipFS with BrowserFS: " + e.message,
              );
              reject(e);
            } else {
              resolve(zipFS);
            }
          },
        );
      });
    }
    throw e;
  }
}
```

### Option 3: Port browserfs-zipfs-extras to ZenFS

Create a compatibility package that ports the GPL2 algorithms to work with ZenFS:

```javascript
// zenfs-extras.js
import { registerDecompressor } from "@zenfs/zipfs";
import { ExplodeDecompressor } from "./explode";
import { UnshrinkDecompressor } from "./unshrink";
import { UnreduceDecompressor } from "./unreduce";

export function initializeZenFSExtras() {
  registerDecompressor(8, ExplodeDecompressor); // EXPLODE
  registerDecompressor(1, UnshrinkDecompressor); // UNSHRINK
  registerDecompressor(10, UnreduceDecompressor); // UNREDUCE
}
```

## Updated Migration Plan with Extras Support

### Phase 1: Hybrid Migration (Recommended Approach)

#### Step 1: Install Both Libraries

```bash
npm install @zenfs/core @zenfs/memory @zenfs/zipfs @zenfs/overlay @zenfs/emscripten
# Keep browserfs for legacy support
npm install browserfs@1.4.3 browserfs-zipfs-extras@1.0.1
```

#### Step 2: Update File System Initialization

```javascript
// src/js/dosee-loader.js
import { MemoryFileSystem } from "@zenfs/memory";
import { OverlayFileSystem } from "@zenfs/overlay";
import { MountableFileSystem } from "@zenfs/core";

async function initializeFileSystem() {
  try {
    // Try ZenFS first
    const deltaFS = new MemoryFileSystem();
    const overlayFS = await OverlayFileSystem.create({
      readable: deltaFS,
      writable: new MountableFileSystem(),
    });
    gameData.fileSystem = overlayFS;
    doseeLog("INFO", "Using ZenFS for file system operations");
    return true;
  } catch (e) {
    doseeLog(
      "WARN",
      "ZenFS initialization failed, falling back to BrowserFS: " + e.message,
    );
    // Fall back to BrowserFS
    return initializeBrowserFSFileSystem();
  }
}

function initializeBrowserFSFileSystem() {
  return new Promise((resolve) => {
    const deltaFS = new BrowserFS.FileSystem.InMemory();
    BrowserFS.FileSystem.OverlayFS.Create(
      {
        readable: deltaFS,
        writable: new BrowserFS.FileSystem.MountableFileSystem(),
      },
      (e, overlayFS) => {
        if (e) {
          doseeLog(
            "ERROR",
            "BrowserFS initialization also failed: " + e.message,
          );
          resolve(false);
        } else {
          gameData.fileSystem = overlayFS;
          resolve(true);
        }
      },
    );
  });
}
```

#### Step 3: Update ZIP Handling with Fallback

```javascript
import { ZipFileSystem } from "@zenfs/zipfs";

async function BFSOpenZip(loadedData) {
  if (typeof loadedData === `undefined`)
    throw Error(`BFSOpenZip loadedData argument cannot be empty`);

  try {
    // Try ZenFS first (handles modern ZIPs)
    const zipFS = await ZipFileSystem.create({ zipData: loadedData });
    doseeLog("INFO", "ZIP opened with ZenFS");
    return zipFS;
  } catch (e) {
    doseeLog("INFO", "ZenFS failed for ZIP, trying BrowserFS: " + e.message);

    // Fall back to BrowserFS (handles legacy ZIPs with extras)
    if (window.BrowserFS) {
      return new Promise((resolve, reject) => {
        BrowserFS.FileSystem.ZipFS.Create(
          {
            zipData: loadedData,
          },
          (e, zipFS) => {
            if (e) {
              doseeLog(
                "ERROR",
                "BrowserFS also failed to open ZIP: " + e.message,
              );
              reject(e);
            } else {
              doseeLog(
                "INFO",
                "ZIP opened with BrowserFS (likely legacy format)",
              );
              resolve(zipFS);
            }
          },
        );
      });
    }

    throw new Error("No ZIP file system available: " + e.message);
  }
}
```

#### Step 4: Update Dependency Checks

```javascript
// src/js/dosee-init.js
const doseeObjects = [`DOSee`, `DoseeLoader`, `FileSaver`, `Module`];

// Check for file system availability
let fileSystemAvailable = false;
try {
  // Check if ZenFS is available (would be bundled)
  if (typeof window.ZenFS !== "undefined") {
    fileSystemAvailable = true;
    console.log("ZenFS available");
  } else if (typeof window.BrowserFS !== "undefined") {
    fileSystemAvailable = true;
    console.log("BrowserFS available for fallback");
  } else {
    console.error("No file system library available");
  }
} catch (e) {
  console.error("File system check failed:", e);
}
```

### Phase 2: Build System Updates

#### Updated Copy Script

```json
"copy": "npx copyfiles -u 1 src/**/**/* src/**/* src/* build && npx copyup -f tmp/workbox-v7.4.0/workbox-sw.js build/js && npx copyup -f node_modules/mini.css/dist/mini-default.min.css build/css && npx copyup -f node_modules/file-saver-fixed/dist/FileSaver.min.js node_modules/canvas-toBlob/canvas-toBlob.js build/js"
```

**Changes:**

- Remove BrowserFS files from copy script
- BrowserFS will be loaded dynamically only when needed
- ZenFS will be bundled with the main application

#### HTML Updates

```html
<!-- Main bundle with ZenFS -->
<script type="module" src="js/dosee-bundle.js"></script>

<!-- BrowserFS fallback (loaded on-demand) -->
<script>
  // Dynamic loading of BrowserFS only if needed
  window.loadBrowserFSFallback = function () {
    return Promise.all([
      import("/js/browserfs.min.js"),
      import("/js/browserfs-zipfs-extras.js"),
    ]);
  };
</script>
```

### Phase 3: Testing Strategy

#### Test Cases for Hybrid System

1. **Modern ZIP Files**
   - Test with DEFLATE-compressed ZIPs
   - Verify ZenFS handles them correctly
   - Ensure no fallback to BrowserFS

2. **Legacy ZIP Files**
   - Test with EXPLODE-compressed ZIPs
   - Verify BrowserFS fallback works
   - Ensure proper error handling

3. **Mixed Scenario**
   - Test application with both modern and legacy ZIPs
   - Verify seamless switching between systems

4. **Error Conditions**
   - Test with corrupted ZIPs
   - Test with unsupported compression methods
   - Verify graceful error messages

### Phase 4: Performance Optimization

#### Caching Strategy

```javascript
const zipCache = new Map();

async function getCachedZipFS(loadedData) {
  const cacheKey = loadedData.length + "-" + loadedData[0] + loadedData[10];

  if (zipCache.has(cacheKey)) {
    return zipCache.get(cacheKey);
  }

  const zipFS = await BFSOpenZip(loadedData);
  zipCache.set(cacheKey, zipFS);
  return zipFS;
}
```

#### Lazy Loading

```javascript
// Only load BrowserFS when actually needed
async function ensureBrowserFSAvailable() {
  if (window.BrowserFS) return true;

  try {
    await window.loadBrowserFSFallback();
    return typeof window.BrowserFS !== "undefined";
  } catch (e) {
    doseeLog("ERROR", "Failed to load BrowserFS fallback: " + e.message);
    return false;
  }
}
```

### Phase 5: Future Migration to Pure ZenFS

#### Long-term Solution: Implement Missing Algorithms

```javascript
// Future: Create a zenfs-extras package
import { registerDecompressor } from "@zenfs/zipfs";
import { explode } from "./decompressors/explode";
import { unshrink } from "./decompressors/unshrink";
import { unreduce } from "./decompressors/unreduce";

export function initializeLegacySupport() {
  // Port the algorithms from browserfs-zipfs-extras
  registerDecompressor(8, explode); // EXPLODE method
  registerDecompressor(1, unshrink); // UNSHRINK method
  registerDecompressor(10, unreduce); // UNREDUCE method

  console.log("Legacy ZIP compression support initialized");
}
```

#### Migration Path

1. **Current**: BrowserFS with extras (baseline)
2. **Phase 1**: Hybrid ZenFS + BrowserFS fallback (this plan)
3. **Phase 2**: ZenFS with custom decompressors
4. **Phase 3**: Pure ZenFS with all algorithms built-in

## Implementation Details

### Updated dosee-loader.js Structure

```javascript
// Import ZenFS modules
import { MemoryFileSystem } from "@zenfs/memory";
import { OverlayFileSystem } from "@zenfs/overlay";
import { MountableFileSystem } from "@zenfs/core";
import { ZipFileSystem } from "@zenfs/zipfs";

// File system state
let usingZenFS = false;
let usingBrowserFS = false;

async function initializeFileSystem() {
  try {
    // Try ZenFS first
    const deltaFS = new MemoryFileSystem();
    const overlayFS = await OverlayFileSystem.create({
      readable: deltaFS,
      writable: new MountableFileSystem(),
    });

    gameData.fileSystem = overlayFS;
    usingZenFS = true;
    doseeLog("INFO", "Initialized file system with ZenFS");
    return true;
  } catch (zenFSError) {
    doseeLog("WARN", "ZenFS initialization failed: " + zenFSError.message);

    // Fall back to BrowserFS
    if (typeof BrowserFS !== "undefined") {
      return initializeBrowserFSFileSystem();
    } else {
      doseeLog("ERROR", "BrowserFS not available as fallback");
      return false;
    }
  }
}

function initializeBrowserFSFileSystem() {
  return new Promise((resolve) => {
    try {
      const deltaFS = new BrowserFS.FileSystem.InMemory();
      BrowserFS.FileSystem.OverlayFS.Create(
        {
          readable: deltaFS,
          writable: new BrowserFS.FileSystem.MountableFileSystem(),
        },
        (e, overlayFS) => {
          if (e) {
            doseeLog("ERROR", "BrowserFS initialization failed: " + e.message);
            resolve(false);
          } else {
            gameData.fileSystem = overlayFS;
            usingBrowserFS = true;
            doseeLog(
              "INFO",
              "Initialized file system with BrowserFS (fallback)",
            );
            resolve(true);
          }
        },
      );
    } catch (e) {
      doseeLog("ERROR", "BrowserFS initialization error: " + e.message);
      resolve(false);
    }
  });
}

async function BFSOpenZip(loadedData) {
  if (typeof loadedData === `undefined`)
    throw Error(`BFSOpenZip loadedData argument cannot be empty`);

  // If we're using BrowserFS globally, use it directly
  if (usingBrowserFS) {
    return openZipWithBrowserFS(loadedData);
  }

  // Try ZenFS first
  try {
    const zipFS = await ZipFileSystem.create({ zipData: loadedData });
    doseeLog("DEBUG", "ZIP opened with ZenFS");
    return zipFS;
  } catch (zenFSError) {
    doseeLog("DEBUG", "ZenFS failed for ZIP: " + zenFSError.message);

    // Fall back to BrowserFS
    if (typeof BrowserFS !== "undefined") {
      return openZipWithBrowserFS(loadedData);
    }

    throw new Error("No ZIP file system available: " + zenFSError.message);
  }
}

function openZipWithBrowserFS(loadedData) {
  return new Promise((resolve, reject) => {
    BrowserFS.FileSystem.ZipFS.Create(
      {
        zipData: loadedData,
      },
      (e, zipFS) => {
        if (e) {
          doseeLog("ERROR", "BrowserFS failed to open ZIP: " + e.message);
          reject(e);
        } else {
          doseeLog("DEBUG", "ZIP opened with BrowserFS (legacy format)");
          resolve(zipFS);
        }
      },
    );
  });
}
```

### Updated Build Process

#### package.json Changes

```json
{
  "dependencies": {
    "@zenfs/core": "^1.0.0",
    "@zenfs/memory": "^1.0.0",
    "@zenfs/zipfs": "^1.0.0",
    "@zenfs/overlay": "^1.0.0",
    "@zenfs/emscripten": "^1.0.0",
    "browserfs": "1.4.3",
    "browserfs-zipfs-extras": "1.0.1"
  },
  "devDependencies": {
    "webpack": "^5.0.0",
    "webpack-cli": "^4.0.0",
    "babel-loader": "^8.0.0",
    "@babel/core": "^7.0.0",
    "@babel/preset-env": "^7.0.0"
  }
}
```

#### Webpack Configuration (webpack.config.js)

```javascript
const path = require("path");

module.exports = {
  entry: "./src/js/index.js",
  output: {
    filename: "dosee-bundle.js",
    path: path.resolve(__dirname, "build/js"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
      path: require.resolve("path-browserify"),
      fs: false,
    },
  },
};
```

### Updated HTML Template

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- ... other head elements ... -->
    <script>
      // BrowserFS fallback loader
      window.loadBrowserFSFallback = function () {
        console.log("Loading BrowserFS fallback...");
        return new Promise((resolve, reject) => {
          const browserFSScript = document.createElement("script");
          browserFSScript.src = "js/browserfs.min.js";
          browserFSScript.onload = () => {
            const extrasScript = document.createElement("script");
            extrasScript.src = "js/browserfs-zipfs-extras.js";
            extrasScript.onload = resolve;
            extrasScript.onerror = reject;
            document.head.appendChild(extrasScript);
          };
          browserFSScript.onerror = reject;
          document.head.appendChild(browserFSScript);
        });
      };
    </script>
  </head>
  <body>
    <!-- ... page content ... -->

    <!-- Main application bundle with ZenFS -->
    <script type="module" src="js/dosee-bundle.js"></script>
  </body>
</html>
```

## Benefits of Hybrid Approach

### ✅ Advantages

1. **Immediate Migration**: Start using ZenFS for modern ZIPs right away
2. **Backward Compatibility**: Continue supporting legacy DOS games
3. **Gradual Transition**: Migrate to pure ZenFS over time
4. **Performance**: ZenFS is faster for modern ZIP formats
5. **Future-Proof**: Prepare for BrowserFS retirement
6. **Reduced Bundle Size**: Only load BrowserFS when needed

### ⚠️ Considerations

1. **Complexity**: More complex code with fallback logic
2. **Testing**: Need to test both code paths thoroughly
3. **Bundle Size**: Initial bundle includes ZenFS, but BrowserFS is loaded on-demand
4. **Maintenance**: Temporary dual-codebase maintenance

## Migration Timeline

| Phase             | Duration      | Description                         |
| ----------------- | ------------- | ----------------------------------- |
| 1. Setup          | 1 day         | Install packages, configure webpack |
| 2. Core Migration | 2-3 days      | Implement hybrid file system        |
| 3. Testing        | 2 days        | Test with modern and legacy ZIPs    |
| 4. Optimization   | 1 day         | Implement caching and lazy loading  |
| 5. Documentation  | 1 day         | Update docs and migration guide     |
| **Total**         | **1-2 weeks** | Full hybrid migration               |

## Long-term Roadmap

### 6-12 Months

1. **Monitor Usage**: Track how often BrowserFS fallback is used
2. **Identify Key Games**: Find which games require legacy ZIP support
3. **Implement Custom Decompressors**: Port EXPLODE/UNSHRINK to ZenFS
4. **Phase Out BrowserFS**: Remove fallback once all games are supported

### 12+ Months

1. **Pure ZenFS**: Remove BrowserFS dependency completely
2. **Optimize**: Fine-tune performance for DOS emulation
3. **Contribute**: Submit legacy algorithms to ZenFS project
4. **Maintain**: Keep up with ZenFS updates

## Conclusion

The hybrid migration approach provides the best of both worlds:

- **Immediate benefits** of ZenFS for modern ZIP files
- **Continued support** for legacy DOS games via BrowserFS fallback
- **Clear path** to full ZenFS migration in the future

This approach minimizes risk while maximizing compatibility, ensuring DOSee continues to work with all supported games during and after the migration.
