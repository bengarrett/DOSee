/**
 * DOSee Application Test Script
 * This script tests the core functionality to identify issues
 */

console.log('=== DOSee Application Test ===');

// Test 1: Check if required files exist
console.log('\n1. Checking required files...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/js/dosee-init.js',
  'src/js/dosee-loader.js',
  'src/js/dosee-functions.js',
  'src/js/dosee-sw.js',
  'src/sw.js',
  'src/index.html'
];

requiredFiles.forEach(file => {
  try {
    fs.accessSync(file, fs.constants.R_OK);
    console.log(`✅ ${file} - accessible`);
  } catch (err) {
    console.log(`❌ ${file} - MISSING or not readable`);
  }
});

// Test 2: Check for syntax errors in JavaScript files
console.log('\n2. Checking JavaScript syntax...');
const { execSync } = require('child_process');

try {
  execSync('npx eslint src/js/*.js', { stdio: 'pipe' });
  console.log('✅ All JavaScript files pass ESLint');
} catch (err) {
  console.log('❌ ESLint errors found:');
  console.log(err.stdout.toString());
}

// Test 3: Check HTML structure
console.log('\n3. Checking HTML structure...');
try {
  const html = fs.readFileSync('src/index.html', 'utf8');
  
  // Check for critical elements
  const criticalElements = [
    'doseeCanvas',
    'updateDOSeeSW',
    'doseeCrashed',
    'doseeError',
    'doseeSlowLoad'
  ];
  
  criticalElements.forEach(id => {
    if (html.includes(`id="${id}"`)) {
      console.log(`✅ Element ${id} found in HTML`);
    } else {
      console.log(`❌ Element ${id} MISSING from HTML`);
    }
  });
} catch (err) {
  console.log('❌ Could not read HTML file:', err.message);
}

// Test 4: Check service worker registration
console.log('\n4. Service Worker Configuration...');
try {
  const swJs = fs.readFileSync('src/js/dosee-sw.js', 'utf8');
  
  // Check for common issues
  if (swJs.includes('serviceWorker') && swJs.includes('navigator.serviceWorker')) {
    console.log('✅ Service worker registration code present');
  } else {
    console.log('❌ Service worker registration code missing');
  }
  
  if (swJs.includes('updateDOSeeSW')) {
    console.log('✅ Update button handling present');
  } else {
    console.log('❌ Update button handling missing');
  }
} catch (err) {
  console.log('❌ Could not analyze service worker:', err.message);
}

console.log('\n=== Test Complete ===');
console.log('If any critical issues (❌) are shown above, they need to be fixed.');
console.log('Common issues to check:');
console.log('- Missing HTML elements');
console.log('- JavaScript syntax errors');
console.log('- Service worker registration failures');
console.log('- Browser console errors (check F12 in browser)');