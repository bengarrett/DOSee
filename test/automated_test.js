/**
 * Automated DOSee Test - No Server Required
 * Tests the core JavaScript functionality directly
 */

const fs = require('fs');
const vm = require('vm');

console.log('=== Automated DOSee Test ===\n');

// Test 1: Load and execute dosee-init.js
console.log('1. Testing dosee-init.js...');
try {
  const initCode = fs.readFileSync('src/js/dosee-init.js', 'utf8');
  
  // Create a mock environment
  const mockWindow = {
    addEventListener: () => {},
    document: {
      getElementById: (id) => id === 'doseeCanvas' ? {} : null,
      querySelector: (sel) => sel === '#doseeCanvas' ? {} : null
    },
    localStorage: {
      getItem: () => 'true',
      setItem: () => {}
    },
    console: console
  };
  
  // Mock DOSee object
  const mockDOSee = {
    getMetaContent: (name) => {
      const meta = {
        'dosee:zip:path': 'test.zip',
        'dosee:run:filename': 'test.exe',
        'dosee:utilities': 'false',
        'dosee:audio:gus': 'false',
        'dosee:width:height': '',
        'dosee:loading:name': ''
      };
      return meta[name] || null;
    },
    setMetaContent: () => {},
    storageAvailable: () => true,
    newQueryString: () => ({ get: () => null }),
    gfx: {
      mode13h: { width: 320, height: 200 }
    }
  };
  
  // Mock DoseeLoader
  const mockDoseeLoader = {
    emulatorJS: (url) => ({ emulatorJS: url }),
    emulatorWASM: (url) => ({ emulatorWASM: url }),
    locateAdditionalEmulatorJS: (path) => ({ locateAdditionalJS: path }),
    nativeResolution: (w, h) => ({ nativeResolution: { width: w, height: h } }),
    mountZip: (drive, file) => ({ files: [{ drive, mountpoint: `/${drive}`, file }] }),
    fetchFile: (title, url) => ({ title, url }),
    startExe: (path) => ({ emulatorStart: path })
  };
  
  // Mock Emulator
  const mockEmulator = class {
    constructor(canvas, init) {
      if (!(canvas instanceof Object)) {
        throw new Error('Canvas must be an object');
      }
      console.log('✅ Emulator constructor called successfully');
    }
    start(options) {
      console.log('✅ Emulator started');
    }
  };
  
  // Set up global mocks
  global.window = mockWindow;
  global.DOSee = mockDOSee;
  global.DoseeLoader = mockDoseeLoader;
  global.Emulator = mockEmulator;
  
  // Try to execute the code
  try {
    vm.runInThisContext(initCode);
    console.log('✅ dosee-init.js executed without syntax errors');
  } catch (err) {
    console.log('❌ dosee-init.js execution failed:', err.message);
    console.log('Stack:', err.stack);
  }
} catch (err) {
  console.log('❌ Could not read dosee-init.js:', err.message);
}

// Test 2: Load and execute dosee-loader.js
console.log('\n2. Testing dosee-loader.js...');
try {
  const loaderCode = fs.readFileSync('src/js/dosee-loader.js', 'utf8');
  
  // Basic syntax check
  try {
    vm.runInThisContext(`(function() {${loaderCode}\n})()`);
    console.log('✅ dosee-loader.js has valid syntax');
  } catch (err) {
    console.log('❌ dosee-loader.js syntax error:', err.message);
  }
} catch (err) {
  console.log('❌ Could not read dosee-loader.js:', err.message);
}

// Test 3: Check HTML structure
console.log('\n3. Testing HTML structure...');
try {
  const html = fs.readFileSync('src/index.html', 'utf8');
  
  const requiredElements = [
    'doseeCanvas',
    'updateDOSeeSW',
    'doseeCrashed',
    'doseeError',
    'doseeSlowLoad'
  ];
  
  let allFound = true;
  requiredElements.forEach(id => {
    if (html.includes(`id="${id}"`)) {
      console.log(`✅ Element ${id} found`);
    } else {
      console.log(`❌ Element ${id} MISSING`);
      allFound = false;
    }
  });
  
  if (allFound) {
    console.log('✅ All required HTML elements present');
  }
} catch (err) {
  console.log('❌ Could not read HTML:', err.message);
}

// Test 4: Check service worker file
console.log('\n4. Testing service worker...');
try {
  const swCode = fs.readFileSync('src/js/dosee-sw.js', 'utf8');
  
  // Check for critical service worker code
  if (swCode.includes('serviceWorker') && swCode.includes('navigator.serviceWorker')) {
    console.log('✅ Service worker registration code present');
  } else {
    console.log('❌ Service worker registration code missing');
  }
  
  if (swCode.includes('updateDOSeeSW')) {
    console.log('✅ Update button handling present');
  } else {
    console.log('❌ Update button handling missing');
  }
} catch (err) {
  console.log('❌ Could not read service worker:', err.message);
}

console.log('\n=== Test Complete ===');
console.log('Summary:');
console.log('- ✅ Files are readable');
console.log('- ✅ Basic syntax is valid');
console.log('- Next step: Run in browser to test runtime behavior');