# ZenFS Migration Plan for DOSee

## Current BrowserFS Usage Analysis

### Files Using BrowserFS

1. **`src/js/dosee-init.js`** - Dependency check for `BrowserFS` global
2. **`src/js/dosee-loader.js`** - Main BrowserFS usage for file system operations

### Current BrowserFS Dependencies

```json
"browserfs": "1.4.3",
"browserfs-zipfs-extras": "1.0.1"
```

### BrowserFS Usage Patterns in DOSee

#### 1. File System Initialization

```javascript
const deltaFS = new BrowserFS.FileSystem.InMemory();
BrowserFS.FileSystem.OverlayFS.Create(
  {
    readable: deltaFS,
    writable: new BrowserFS.FileSystem.MountableFileSystem(),
  },
  callback,
);
```

#### 2. ZIP File Handling

```javascript
BrowserFS.FileSystem.ZipFS.Create(
  {
    zipData: loadedData,
  },
  callback,
);
```

#### 3. Buffer Handling

```javascript
const Buffer = BrowserFS.BFSRequire(`buffer`).Buffer;
```

#### 4. Emscripten Integration

```javascript
const BFS = new BrowserFS.EmscriptenFS();
BrowserFS.initialize(fileSystem);
```

## ZenFS Migration Strategy

### Step 1: Research ZenFS API

ZenFS is the spiritual successor to BrowserFS, but with a different API design. Key differences:

- **Modular design**: ZenFS is more modular with separate packages
- **Promise-based**: ZenFS uses Promises instead of callbacks
- **Modern ES modules**: ZenFS uses ES modules instead of CommonJS
- **Different package structure**: Separate packages for different file systems

### Step 2: Package Migration

#### Current Packages

```json
"browserfs": "1.4.3",
"browserfs-zipfs-extras": "1.0.1"
```

#### Proposed ZenFS Packages

```json
"@zenfs/core": "latest",
"@zenfs/memory": "latest",  // Replaces InMemory
"@zenfs/zipfs": "latest",   // Replaces ZipFS
"@zenfs/overlay": "latest", // Replaces OverlayFS
"@zenfs/emscripten": "latest" // Replaces EmscriptenFS
```

### Step 3: API Migration Guide

#### 1. File System Initialization

**BrowserFS (Current):**

```javascript
const deltaFS = new BrowserFS.FileSystem.InMemory();
BrowserFS.FileSystem.OverlayFS.Create(
  {
    readable: deltaFS,
    writable: new BrowserFS.FileSystem.MountableFileSystem(),
  },
  (e, overlayFS) => {
    if (e) {
      doseeLog("error", `Failed to create OverlayFS: ${e.message}`);
      return;
    }
    gameData.fileSystem = overlayFS;
    // ...
  },
);
```

**ZenFS (Proposed):**

```javascript
import { MemoryFileSystem } from "@zenfs/memory";
import { OverlayFileSystem } from "@zenfs/overlay";
import { MountableFileSystem } from "@zenfs/core";

async function initializeFileSystem() {
  try {
    const deltaFS = new MemoryFileSystem();
    const overlayFS = await OverlayFileSystem.create({
      readable: deltaFS,
      writable: new MountableFileSystem(),
    });
    gameData.fileSystem = overlayFS;
    // ...
  } catch (e) {
    doseeLog("error", `Failed to create OverlayFS: ${e.message}`);
  }
}
```

#### 2. ZIP File Handling

**BrowserFS (Current):**

```javascript
function BFSOpenZip(loadedData) {
  if (typeof loadedData === `undefined`)
    throw Error(`BFSOpenZip loadedData argument cannot be empty`);

  return new Promise((resolve, reject) => {
    BrowserFS.FileSystem.ZipFS.Create(
      {
        zipData: loadedData,
      },
      (e, zipFS) => {
        if (e) {
          doseeLog("ERROR", "Failed to create ZipFS: " + e.message);
          reject(e);
        } else {
          resolve(zipFS);
        }
      },
    );
  });
}
```

**ZenFS (Proposed):**

```javascript
import { ZipFileSystem } from "@zenfs/zipfs";

async function BFSOpenZip(loadedData) {
  if (typeof loadedData === `undefined`)
    throw Error(`BFSOpenZip loadedData argument cannot be empty`);

  try {
    const zipFS = await ZipFileSystem.create({ zipData: loadedData });
    return zipFS;
  } catch (e) {
    doseeLog("ERROR", "Failed to create ZipFS: " + e.message);
    throw e;
  }
}
```

#### 3. Buffer Handling

**BrowserFS (Current):**

```javascript
const Buffer = BrowserFS.BFSRequire(`buffer`).Buffer;
```

**ZenFS (Proposed):**

```javascript
// ZenFS doesn't include buffer polyfill - use native Buffer or install separately
import { Buffer } from "buffer";
// OR use native Buffer if available
const Buffer = globalThis.Buffer || (await import("buffer")).Buffer;
```

#### 4. Emscripten Integration

**BrowserFS (Current):**

```javascript
const BFS = new BrowserFS.EmscriptenFS();
BrowserFS.initialize(fileSystem);
```

**ZenFS (Proposed):**

```javascript
import { EmscriptenFS } from "@zenfs/emscripten";
import { initialize } from "@zenfs/core";

const BFS = new EmscriptenFS();
await initialize(fileSystem);
```

### Step 4: Dependency Check Update

**Current (dosee-init.js):**

```javascript
const doseeObjects = [
  `BrowserFS`,
  `DOSee`,
  `DoseeLoader`,
  `FileSaver`,
  `Module`,
];
```

**Proposed Update:**

```javascript
// ZenFS uses ES modules, so we need to check for different global indicators
const doseeObjects = [`DOSee`, `DoseeLoader`, `FileSaver`, `Module`];

// Add separate check for ZenFS availability
try {
  // If using ES modules, this would be handled differently
  if (typeof window.ZenFS === "undefined") {
    console.warn("ZenFS not loaded - file system operations may fail");
  }
} catch (e) {
  console.error("ZenFS initialization check failed:", e);
}
```

### Step 5: Build System Updates

#### Current Build Process

```json
"copy": "npx copyfiles -u 1 src/**/**/* src/**/* src/* build && npx copyup -f tmp/workbox-v7.4.0/workbox-sw.js build/js && npx copyup -f node_modules/mini.css/dist/mini-default.min.css build/css && npx copyup -f node_modules/browserfs/dist/browserfs.min.js node_modules/browserfs-zipfs-extras/dist/browserfs-zipfs-extras.js node_modules/file-saver-fixed/dist/FileSaver.min.js node_modules/canvas-toBlob/canvas-toBlob.js build/js"
```

#### Proposed Build Process

```json
"copy": "npx copyfiles -u 1 src/**/**/* src/**/* src/* build && npx copyup -f tmp/workbox-v7.4.0/workbox-sw.js build/js && npx copyup -f node_modules/mini.css/dist/mini-default.min.css build/css && npx copyup -f node_modules/file-saver-fixed/dist/FileSaver.min.js node_modules/canvas-toBlob/canvas-toBlob.js build/js"
```

**Changes:**

- Remove BrowserFS file copying since ZenFS would be bundled
- Add bundling step for ZenFS modules

### Step 6: HTML Import Updates

**Current:**

```html
<script src="js/browserfs.min.js"></script>
<script src="js/browserfs-zipfs-extras.js"></script>
```

**Proposed:**

```html
<!-- ZenFS would be bundled with the main JS or loaded as ES modules -->
<script type="module" src="js/dosee-bundle.js"></script>
```

### Step 7: Migration Challenges

#### 1. Module System Compatibility

- **Issue**: ZenFS uses ES modules, DOSee currently uses CommonJS/UMD
- **Solution**: Use a bundler (Webpack, Rollup, Vite) or dynamic imports

#### 2. Global vs Module Scope

- **Issue**: BrowserFS exposes globals, ZenFS uses module exports
- **Solution**: Create a compatibility layer or refactor to use modules

#### 3. API Differences

- **Issue**: Some API methods may have different names/signatures
- **Solution**: Create wrapper functions to maintain compatibility

#### 4. Error Handling

- **Issue**: ZenFS may throw different error types
- **Solution**: Update error handling to be more generic

### Step 8: Recommended Migration Approach

#### Option A: Full Migration (Recommended)

1. **Install ZenFS packages**:

   ```bash
   npm install @zenfs/core @zenfs/memory @zenfs/zipfs @zenfs/overlay @zenfs/emscripten
   ```

2. **Set up bundler**: Configure Webpack/Rollup to bundle ZenFS with DOSee

3. **Refactor file system code**: Update all BrowserFS references to ZenFS

4. **Update build process**: Remove BrowserFS copying, add bundling

5. **Test thoroughly**: Verify all file system operations work correctly

#### Option B: Compatibility Layer (Interim)

1. **Create BrowserFS-compatible wrapper** around ZenFS
2. **Gradually migrate** individual components
3. **Maintain backward compatibility** during transition

### Step 9: Testing Strategy

#### Unit Tests

- Test file system initialization
- Test ZIP file mounting
- Test read/write operations
- Test error handling

#### Integration Tests

- Test with different DOS programs
- Test save/load functionality
- Test with different browser environments

#### Performance Tests

- Compare load times
- Test memory usage
- Verify no memory leaks

### Step 10: Fallback Strategy

```javascript
// Compatibility layer example
class BrowserFSCompatibility {
  static async initialize(fileSystem) {
    try {
      // Try ZenFS first
      return await zenFSInitialize(fileSystem);
    } catch (e) {
      console.warn("ZenFS not available, falling back to BrowserFS");
      // Fall back to BrowserFS if available
      if (window.BrowserFS) {
        return BrowserFS.initialize(fileSystem);
      }
      throw new Error("No file system available");
    }
  }
}
```

## Migration Timeline Estimate

| Phase                  | Duration      | Description                                        |
| ---------------------- | ------------- | -------------------------------------------------- |
| 1. Research & Planning | 1-2 days      | Analyze current usage, create migration plan       |
| 2. Environment Setup   | 1 day         | Install ZenFS, configure bundler                   |
| 3. Core Migration      | 2-3 days      | Update file system initialization and ZIP handling |
| 4. Testing             | 2 days        | Unit, integration, and performance testing         |
| 5. Build System Update | 1 day         | Update copy scripts and build process              |
| 6. Documentation       | 1 day         | Update docs and add migration guide                |
| **Total**              | **1-2 weeks** | Full migration with testing                        |

## Risk Assessment

### Low Risk Items

- File system initialization (straightforward API replacement)
- ZIP file handling (similar concepts, different syntax)
- Error handling (can be made more robust)

### Medium Risk Items

- Emscripten integration (may require API adjustments)
- Buffer handling (need to ensure compatibility)
- Build system changes (requires testing)

### High Risk Items

- Module system compatibility (may require significant refactoring)
- Global scope dependencies (other code may rely on BrowserFS globals)
- Performance characteristics (ZenFS may have different performance profile)

## Recommendations

1. **Start with a prototype**: Create a small test project using ZenFS to verify compatibility
2. **Use feature detection**: Check for ZenFS availability and fall back to BrowserFS if needed
3. **Gradual migration**: Migrate one component at a time to minimize risk
4. **Comprehensive testing**: Test with all supported DOS programs and scenarios
5. **Monitor performance**: Ensure ZenFS doesn't introduce performance regressions
6. **Document changes**: Update all relevant documentation and add migration guides

## Resources

- **ZenFS GitHub**: https://github.com/zen-fs
- **ZenFS Documentation**: https://zen-fs.github.io/
- **Migration Guide**: https://zen-fs.github.io/migration/
- **API Reference**: https://zen-fs.github.io/api/

## Conclusion

Migrating from BrowserFS to ZenFS is feasible but requires careful planning and testing. The migration offers benefits like:

- Active maintenance and updates
- Modern ES module support
- Better TypeScript support
- Improved performance
- Future compatibility

However, the migration also presents challenges around module system compatibility and API differences. A gradual, well-tested approach is recommended to ensure DOSee continues to work reliably during and after the migration.
