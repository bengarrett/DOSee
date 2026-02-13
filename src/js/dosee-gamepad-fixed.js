/**
 * DOSee Gamepad Support Module
 * Maps gamepad input to keyboard events for DOS emulation
 * 
 * This module provides gamepad support by translating gamepad button presses
 * and D-pad movements into keyboard events that DOSBox can understand.
 */

// Gamepad configuration presets
export const gamepadConfigs = {
  xbox: {
    dpad: { xAxis: 6, yAxis: 7, threshold: 0.5 },
    buttons: {
      a: { key: ' ', name: 'Space' },
      b: { key: 'Esc', name: 'Escape' },
      x: { key: 'Enter', name: 'Enter' },
      y: { key: 'Tab', name: 'Tab' },
      lb: { key: 'Ctrl', name: 'Control' },
      rb: { key: 'Alt', name: 'Alt' },
      start: { key: 'P', name: 'Pause' },
      back: { key: 'M', name: 'Menu' }
    }
  },
  playstation: {
    dpad: { xAxis: 6, yAxis: 7, threshold: 0.5 },
    buttons: {
      cross: { key: ' ', name: 'Space' },
      circle: { key: 'Esc', name: 'Escape' },
      square: { key: 'Enter', name: 'Enter' },
      triangle: { key: 'Tab', name: 'Tab' },
      l1: { key: 'Ctrl', name: 'Control' },
      r1: { key: 'Alt', name: 'Alt' },
      options: { key: 'P', name: 'Pause' },
      share: { key: 'M', name: 'Menu' }
    }
  }
};

class DOSeeGamepad {
  constructor() {
    this.enabled = false;
    this.supported = false;
    this.gamepad = null;
    this.config = gamepadConfigs.xbox;
    this.activeKeys = new Set();
    this.pollingInterval = null;
    this.developerMode = false; // Flag for developer output
  }

  /**
   * Load settings from local storage
   */
  loadSettings() {
    // Check if local storage is available
    if (!this.storageAvailable()) {
      console.log('DOSee Gamepad: Local storage not available');
      return;
    }

    try {
      const settings = localStorage.getItem('doseeGamepadSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        
        console.log('DEBUG: Loading settings from localStorage:', parsed);
        
        // Restore layout configuration first (use setConfig to ensure proper handling)
        if (parsed.layout && gamepadConfigs[parsed.layout]) {
          console.log('DEBUG: Setting layout to:', parsed.layout);
          this.setConfig(parsed.layout, false); // Don't save during load
        }
        
        // Restore enabled state and apply it (use enable/disable methods)
        if (parsed.enabled !== undefined) {
          const shouldEnable = parsed.enabled === true || parsed.enabled === 'true';
          console.log('DEBUG: Setting enabled to:', shouldEnable);
          
          if (shouldEnable) {
            this.enable(false); // Don't save during load
          } else {
            this.disable(false); // Don't save during load
          }
        }
        
        console.log('DEBUG: After loading - enabled:', this.enabled, 'config:', this.config);
        console.log('DOSee Gamepad: Settings loaded and applied from local storage');
      }
    } catch (error) {
      console.warn('DOSee Gamepad: Failed to load settings from local storage', error);
    }
  }

  /**
   * Save settings to local storage
   */
  saveSettings() {
    // Check if local storage is available
    if (!this.storageAvailable()) {
      console.log('DOSee Gamepad: Local storage not available');
      return;
    }

    try {
      const settings = {
        enabled: this.enabled,
        layout: this.config === gamepadConfigs.xbox ? 'xbox' : 'playstation'
      };
      
      localStorage.setItem('doseeGamepadSettings', JSON.stringify(settings));
      console.log('DOSee Gamepad: Settings saved to local storage');
    } catch (error) {
      console.warn('DOSee Gamepad: Failed to save settings to local storage', error);
    }
  }

  /**
   * Check if local storage is available
   * @returns {boolean} True if local storage is available
   */
  storageAvailable() {
    try {
      const testKey = '__dosee_gamepad_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Initialize gamepad support
   * @returns {boolean} True if Gamepad API is supported
   */
  init() {
    // Check for Gamepad API support
    this.supported = !!navigator.getGamepads;

    if (!this.supported) {
      console.log('DOSee Gamepad: Gamepad API not supported in this browser');
      return false;
    }

    // Load settings from local storage
    this.loadSettings();

    // Set up event listeners
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));

    console.log('DOSee Gamepad: Initialized');
    return true;
  }

  /**
   * Handle gamepad connection event
   * @param {GamepadEvent} event
   */
  handleGamepadConnected(event) {
    console.log('DOSee Gamepad: Controller connected', event.gamepad.id);
    this.gamepad = event.gamepad;
    this.startPolling();
  }

  /**
   * Handle gamepad disconnection event
   * @param {GamepadEvent} event
   */
  handleGamepadDisconnected(event) {
    console.log('DOSee Gamepad: Controller disconnected', event.gamepad.id);
    this.stopPolling();
    this.releaseAllKeys();
    this.gamepad = null;
  }

  /**
   * Start polling gamepad state
   */
  startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(() => {
      this.pollGamepad();
    }, 16); // ~60fps
  }

  /**
   * Stop polling gamepad state
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll gamepad state and handle input
   */
  pollGamepad() {
    if (!this.gamepad || !this.enabled) return;

    const gamepads = navigator.getGamepads();
    const currentGamepad = gamepads[this.gamepad.index] || gamepads[0];

    if (currentGamepad) {
      this.handleDpad(currentGamepad);
      this.handleButtons(currentGamepad);
    } else {
      console.log('DEBUG: No gamepad found in pollGamepad');
    }
  }

  /**
   * Handle D-pad input
   * @param {Gamepad} gamepad
   */
  handleDpad(gamepad) {
    const { xAxis, yAxis, threshold } = this.config.dpad;
    const x = gamepad.axes[xAxis] || 0;
    const y = gamepad.axes[yAxis] || 0;

    // Release all arrow keys first
    this.releaseKeys(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    // Handle X axis (left/right)
    if (x < -threshold) {
      this.pressKey('ArrowLeft');
    } else if (x > threshold) {
      this.pressKey('ArrowRight');
    }

    // Handle Y axis (up/down) - Y axis is typically inverted
    if (y < -threshold) {
      this.pressKey('ArrowUp');
    } else if (y > threshold) {
      this.pressKey('ArrowDown');
    }
  }

  /**
   * Handle button input
   * @param {Gamepad} gamepad
   */
  handleButtons(gamepad) {
    for (const [buttonName, mapping] of Object.entries(this.config.buttons)) {
      const buttonIndex = this.getButtonIndex(buttonName);
      if (buttonIndex === -1) continue;

      const button = gamepad.buttons[buttonIndex];

      if (button && button.pressed && !this.activeKeys.has(mapping.key)) {
        if (this.developerMode) {
          console.log(`[DEV] Button pressed: ${buttonName} → ${mapping.key}`);
        }
        this.pressKey(mapping.key);
      } else if ((!button || !button.pressed) && this.activeKeys.has(mapping.key)) {
        if (this.developerMode) {
          console.log(`[DEV] Button released: ${buttonName} → ${mapping.key}`);
        }
        this.releaseKey(mapping.key);
      }
    }
  }

  /**
   * Get button index for a given button name
   * @param {string} buttonName
   * @returns {number} Button index or -1 if not found
   */
  getButtonIndex(buttonName) {
    // Standard button mapping for most controllers
    const buttonMap = {
      'a': 0, 'b': 1, 'x': 2, 'y': 3,
      'lb': 4, 'rb': 5, 'back': 8, 'start': 9,
      'cross': 0, 'circle': 1, 'square': 2, 'triangle': 3,
      'l1': 4, 'r1': 5, 'options': 9, 'share': 8
    };
    return buttonMap[buttonName] || -1;
  }

  /**
   * Press a key (simulate keydown event)
   * @param {string} key
   */
  pressKey(key) {
    if (this.activeKeys.has(key)) return;

    if (this.developerMode) {
      console.log(`[DEV] Key press: ${key}`);
    }

    this.activeKeys.add(key);
    this.dispatchKeyEvent('keydown', key);
  }

  /**
   * Release a key (simulate keyup event)
   * @param {string} key
   */
  releaseKey(key) {
    if (!this.activeKeys.has(key)) return;

    if (this.developerMode) {
      console.log(`[DEV] Key release: ${key}`);
    }

    this.activeKeys.delete(key);
    this.dispatchKeyEvent('keyup', key);
  }

  /**
   * Release multiple keys
   * @param {string[]} keys
   */
  releaseKeys(keys) {
    keys.forEach(key => this.releaseKey(key));
  }

  /**
   * Release all currently pressed keys
   */
  releaseAllKeys() {
    for (const key of this.activeKeys) {
      this.dispatchKeyEvent('keyup', key);
    }
    this.activeKeys.clear();
  }

  /**
   * Simple keyboard event dispatch - just make it work
   * @param {string} type - Event type ('keydown' or 'keyup')
   * @param {string} key
   */
  dispatchKeyEvent(type, key) {
    const keyCode = this.getKeyCode(key);
    const legacyKeyCode = this.getLegacyKeyCode(keyCode);
    
    // Get the canvas and focus it
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.focus();
    }
    
    // Special handling for Escape key which Em-DOSBox might be filtering
    if (key === 'Esc') {
      // Create a more 'real' looking Escape event
      const escapeEvent = new KeyboardEvent(type, {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: false,  // Make it non-cancelable like real Escape
        composed: true,
        // Add properties that real keyboard events have
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        repeat: false,
        isComposing: false,
        // Try to make it look more like a real event
        view: window,
        detail: 0
      });
      
      // Dispatch to canvas with slight delay to mimic real key press timing
      setTimeout(() => {
        if (canvas) canvas.dispatchEvent(escapeEvent);
        document.dispatchEvent(escapeEvent);
      }, 10);
      
      return; // Skip normal dispatch for Escape
    }
    
    // Normal dispatch for other keys
    try {
      const event = new KeyboardEvent(type, {
        key: key,
        code: keyCode,
        keyCode: legacyKeyCode,
        which: legacyKeyCode,
        bubbles: true,
        cancelable: true
      });
      
      if (this.developerMode) {
        console.log(`[DEV] Dispatching ${type} event for key: ${key}`);
      }
      
      // Send to canvas first (where Em-DOSBox should be listening)
      if (canvas) {
        canvas.dispatchEvent(event);
      }
      
      // Also send to document for good measure
      document.dispatchEvent(event);
    } catch (error) {
      console.error(`Failed to dispatch ${type} for ${key}:`, error);
    }
  }

  /**
   * Get key code for a given key
   * @param {string} key
   * @returns {string}
   */
  getKeyCode(key) {
    // Map key names to key codes
    const codeMap = {
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      ' ': 'Space',
      'Esc': 'Escape',
      'Enter': 'Enter',
      'Tab': 'Tab',
      'Ctrl': 'ControlLeft',
      'Alt': 'AltLeft',
      'P': 'KeyP',
      'M': 'KeyM'
    };
    return codeMap[key] || key;
  }

  /**
   * Get legacy keyCode for a given key (for older browser compatibility)
   * @param {string} key
   * @returns {number}
   */
  getLegacyKeyCode(key) {
    // Map key codes to legacy numerical keyCodes
    const legacyMap = {
      'ArrowUp': 38,
      'ArrowDown': 40,
      'ArrowLeft': 37,
      'ArrowRight': 39,
      ' ': 32,
      'Esc': 27,
      'Enter': 13,
      'Tab': 9,
      'ControlLeft': 17,
      'AltLeft': 18,
      'KeyP': 80,
      'KeyM': 77
    };
    return legacyMap[key] || 0;
  }

  /**
   * Set gamepad configuration
   * @param {string} configName - Configuration name ('xbox' or 'playstation')
   * @param {boolean} saveToStorage - Whether to save to localStorage (default: true)
   * @returns {boolean} True if config was set successfully
   */
  setConfig(configName, saveToStorage = true) {
    if (gamepadConfigs[configName]) {
      this.config = gamepadConfigs[configName];
      console.log(`DOSee Gamepad: Switched to ${configName} layout`);
      if (saveToStorage) this.saveSettings();
      return true;
    }
    console.warn(`DOSee Gamepad: Unknown config ${configName}`);
    return false;
  }

  /**
   * Enable developer mode for detailed output
   */
  enableDeveloperMode() {
    this.developerMode = true;
    console.log('DOSee Gamepad: Developer mode enabled');
  }

  /**
   * Enable gamepad input
   * @param {boolean} saveToStorage - Whether to save to localStorage (default: true)
   */
  enable(saveToStorage = true) {
    this.enabled = true;
    console.log('DOSee Gamepad: Enabled');
    if (this.gamepad) this.startPolling();
    if (saveToStorage) this.saveSettings();
  }

  /**
   * Disable gamepad input
   * @param {boolean} saveToStorage - Whether to save to localStorage (default: true)
   */
  disable(saveToStorage = true) {
    this.enabled = false;
    console.log('DOSee Gamepad: Disabled');
    this.stopPolling();
    this.releaseAllKeys();
    if (saveToStorage) this.saveSettings();
  }

  /**
   * Clean up gamepad support
   */
  destroy() {
    this.disable();
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    console.log('DOSee Gamepad: Destroyed');
  }
}

// Export developer mode enablement function for external use
function enableGamepadDeveloperMode(gamepadInstance) {
  if (gamepadInstance && gamepadInstance.enableDeveloperMode) {
  /**
   * Clean up gamepad support
   */
  destroy() {
    this.disable();
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    console.log('DOSee Gamepad: Destroyed');
  }
}

// Export developer mode enablement function for external use
function enableGamepadDeveloperMode(gamepadInstance) {
  if (gamepadInstance && gamepadInstance.enableDeveloperMode) {
    gamepadInstance.enableDeveloperMode();
  }
}
}

// Export as ES module
export default DOSeeGamepad;
