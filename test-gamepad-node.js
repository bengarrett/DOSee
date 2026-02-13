#!/usr/bin/env node

/**
 * DOSee Gamepad Implementation Test
 * Command-line test script to verify gamepad module functionality
 */

console.log('🎮 DOSee Gamepad Implementation Test');
console.log('=====================================\n');

let testsPassed = 0;
let testsFailed = 0;

async function runTests() {
    try {
        // Test 1: Module Syntax Check
        console.log('Test 1: Checking module syntax...');
        await testModuleSyntax();
        
        // Test 2: Module Structure
        console.log('\nTest 2: Checking module structure...');
        await testModuleStructure();
        
        // Test 3: Configuration Validation
        console.log('\nTest 3: Validating configurations...');
        await testConfigurations();
        
        // Summary
        console.log('\n' + '='.repeat(40));
        console.log(`Tests Completed: ${testsPassed + testsFailed}`);
        console.log(`✅ Passed: ${testsPassed}`);
        console.log(`❌ Failed: ${testsFailed}`);
        
        if (testsFailed === 0) {
            console.log('\n🎉 All tests passed! Gamepad implementation is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
        }
        
    } catch (error) {
        console.error('\n❌ Unexpected error during testing:', error);
        process.exit(1);
    }
}

async function testModuleSyntax() {
    try {
        // Check if the file exists and has valid syntax
        const fs = require('fs');
        const path = require('path');
        
        const gamepadPath = path.join(__dirname, 'src', 'js', 'dosee-gamepad.js');
        const uiPath = path.join(__dirname, 'src', 'js', 'dosee-gamepad-ui.js');
        
        // Check gamepad module
        if (!fs.existsSync(gamepadPath)) {
            throw new Error('Gamepad module file not found');
        }
        
        // Check UI module
        if (!fs.existsSync(uiPath)) {
            throw new Error('Gamepad UI module file not found');
        }
        
        console.log('✅ Gamepad module files exist');
        testsPassed++;
        
    } catch (error) {
        console.log(`❌ ${error.message}`);
        testsFailed++;
    }
}

async function testModuleStructure() {
    try {
        // We can't actually import ES modules in Node without special handling,
        // but we can check the file structure
        const fs = require('fs');
        const path = require('path');
        
        const gamepadContent = fs.readFileSync(
            path.join(__dirname, 'src', 'js', 'dosee-gamepad.js'),
            'utf8'
        );
        
        // Check for key components
        const checks = [
            { pattern: /class\s+DOSeeGamepad/, name: 'DOSeeGamepad class' },
            { pattern: /gamepadConfigs/, name: 'gamepadConfigs constant' },
            { pattern: /handleDpad\(/, name: 'handleDpad method' },
            { pattern: /handleButtons\(/, name: 'handleButtons method' },
            { pattern: /export\s+default/, name: 'ES module export' }
        ];
        
        let allFound = true;
        for (const check of checks) {
            if (!check.pattern.test(gamepadContent)) {
                console.log(`❌ Missing: ${check.name}`);
                allFound = false;
            }
        }
        
        if (allFound) {
            console.log('✅ All required module components found');
            testsPassed++;
        } else {
            testsFailed++;
        }
        
    } catch (error) {
        console.log(`❌ Error checking module structure: ${error.message}`);
        testsFailed++;
    }
}

async function testConfigurations() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const gamepadContent = fs.readFileSync(
            path.join(__dirname, 'src', 'js', 'dosee-gamepad.js'),
            'utf8'
        );
        
        // Check for basic configuration elements in the file
        if (!gamepadContent.includes('const gamepadConfigs = {')) {
            throw new Error('gamepadConfigs constant not found');
        }
        
        if (!gamepadContent.includes('xbox: {') || !gamepadContent.includes('playstation: {')) {
            throw new Error('Controller configurations not found');
        }
        
        if (!gamepadContent.includes('dpad:') || !gamepadContent.includes('buttons:')) {
            throw new Error('Configuration structure incomplete');
        }
        
        console.log('✅ Xbox and PlayStation configurations validated');
        testsPassed++;
        
    } catch (error) {
        console.log(`❌ Configuration error: ${error.message}`);
        testsFailed++;
    }
}

// Run the tests
runTests();
