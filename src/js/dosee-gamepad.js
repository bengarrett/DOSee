/**
 * DOSee Gamepad Support Module
 * Maps gamepad input to keyboard events for DOS emulation
 *
 * This module provides gamepad support by translating gamepad button presses
 * and D-pad movements into keyboard events that DOSBox can understand.
 *
 * BE WARNED, this hacked gamepad support was created by with coding agents, which
 * are dumb and love to make a mess of things. I had to jump through hoops and painful
 * feedback loops to get this operating at a basic level.
 * So I will not be supporting this code, and given the copy-paste nature of LLMs,
 * it is likely parts of this code are (c) by people elsewhere.
 */

// DOSee console logging utility with consistent styling
export const doseeLog = (level, message) => {
  const styles = `color:dimgray;font-weight:bold`;
  const prefix = `%cDOSee`;

  switch (level) {
    case 'error':
      console.error(prefix, styles, message);
      break;
    case 'warn':
      console.warn(prefix, styles, message);
      break;
    case 'info':
    default:
      console.log(prefix, styles, message);
  }
};

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
      back: { key: 'M', name: 'Menu' },
    },
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
      share: { key: 'M', name: 'Menu' },
    },
  },
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
      doseeLog('info', 'Gamepad: Local storage not available');
      return;
    }

    try {
      const settings = localStorage.getItem('doseeGamepadSettings');
      if (settings) {
        const parsed = JSON.parse(settings);

        doseeLog('info', 'DEBUG: Loading settings from localStorage');

        // Restore layout configuration first (use setConfig to ensure proper handling)
        if (parsed.layout && gamepadConfigs[parsed.layout]) {
          doseeLog('info', `DEBUG: Setting layout to: ${parsed.layout}`);
          this.setConfig(parsed.layout, false); // Don't save during load
        }

        // Restore enabled state and apply it (use enable/disable methods)
        if (parsed.enabled !== undefined) {
          const shouldEnable =
            parsed.enabled === true || parsed.enabled === 'true';
          doseeLog('info', `DEBUG: Setting enabled to: ${shouldEnable}`);

          if (shouldEnable) {
            this.enable(false); // Don't save during load
          } else {
            this.disable(false); // Don't save during load
          }
        }

        doseeLog(
          'info',
          `DEBUG: After loading - enabled: ${this.enabled}, config: ${this.config}`
        );
        doseeLog(
          'info',
          'Gamepad: Settings loaded and applied from local storage'
        );
      }
    } catch (error) {
      doseeLog(
        'warn',
        `Gamepad: Failed to load settings from local storage: ${error.message}`
      );
    }
  }

  /**
   * Save settings to local storage
   */
  saveSettings() {
    // Check if local storage is available
    if (!this.storageAvailable()) {
      doseeLog('info', 'Gamepad: Local storage not available');
      return;
    }

    try {
      const settings = {
        enabled: this.enabled,
        layout: this.config === gamepadConfigs.xbox ? 'xbox' : 'playstation',
      };

      localStorage.setItem('doseeGamepadSettings', JSON.stringify(settings));
      doseeLog('info', 'Gamepad: Settings saved to local storage');
    } catch (error) {
      doseeLog(
        'warn',
        `Gamepad: Failed to save settings to local storage: ${error.message}`
      );
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
    } catch {
      return false;
    }
  }

  /**
   * Initialize gamepad support
   * @returns {boolean} True if Gamepad API is supported
   */
  init() {
    // Check for Gamepad API support
    this.supported = Boolean(navigator.getGamepads);

    if (!this.supported) {
      doseeLog('info', 'Gamepad: Gamepad API not supported in this browser');
      return false;
    }

    // Load settings from local storage
    this.loadSettings();

    // Set up event listeners
    window.addEventListener(
      'gamepadconnected',
      this.handleGamepadConnected.bind(this)
    );
    window.addEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisconnected.bind(this)
    );

    doseeLog('info', 'Gamepad: Initialized');
    return true;
  }

  /**
   * Handle gamepad connection event
   * @param {GamepadEvent} event
   */
  handleGamepadConnected(event) {
    doseeLog('info', `Gamepad: Controller connected: ${event.gamepad.id}`);
    doseeLog('info', 'Gamepad: Input monitoring started');
    this.gamepad = event.gamepad;

    // Debug the gamepad state initially to help identify axes
    this.debugGamepadState(event.gamepad);

    this.startPolling();
  }

  /**
   * Handle gamepad disconnection event
   * @param {GamepadEvent} event
   */
  handleGamepadDisconnected(event) {
    doseeLog('info', `Gamepad: Controller disconnected: ${event.gamepad.id}`);
    this.stopPolling();
    this.releaseAllKeys();
    this.gamepad = null;
  }

  /**
   * Start polling gamepad state
   */
  startPolling() {
    if (this.pollingInterval) return;

    doseeLog('info', 'DEBUG: Starting gamepad polling at 60fps');
    const pollInterval = 16; // ~60fps (1000ms/60 ≈ 16.67ms)
    this.pollingInterval = setInterval(() => {
      this.pollGamepad();
    }, pollInterval);
  }

  /**
   * Manual debug trigger to check current gamepad state
   */
  debugCurrentState() {
    if (!this.gamepad) {
      doseeLog('info', 'DEBUG: No gamepad connected');
      return;
    }

    const gamepads = navigator.getGamepads();
    const currentGamepad = gamepads[this.gamepad.index] || gamepads[0];

    if (currentGamepad) {
      this.debugGamepadState(currentGamepad);
    } else {
      doseeLog('info', 'DEBUG: Gamepad not found in navigator.getGamepads()');
    }
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
    }
  }

  /**
   * Debug method to log all gamepad axes and buttons
   * @param {Gamepad} gamepad
   */
  debugGamepadState(gamepad) {
    doseeLog('info', '=== Gamepad State Debug ===');
    doseeLog('info', `Gamepad ID: ${gamepad.id}`);
    doseeLog('info', `Axes: ${gamepad.axes}`);
    doseeLog(
      'info',
      `Buttons: ${gamepad.buttons.map((b) => (b.pressed ? 1 : 0))}`
    );
    doseeLog('info', '===========================');
  }

  /**
   * Handle D-pad input - supports both axis-based and button-based D-pads
   * @param {Gamepad} gamepad
   */
  handleDpad(gamepad) {
    // Try axis-based D-pad with multiple common configurations
    const axisSuccess = this.tryMultipleAxisConfigurations(gamepad);

    // If axis-based didn't work, try button-based D-pad (POV hat)
    if (!axisSuccess) {
      this.handleDpadButtons(gamepad);
    }
  }

  /**
   * Try multiple common D-pad axis configurations
   * @param {Gamepad} gamepad
   * @returns {boolean} True if any configuration worked
   */
  tryMultipleAxisConfigurations(gamepad) {
    // Common D-pad axis configurations for different controllers
    const configurations = [
      { xAxis: 6, yAxis: 7 }, // Xbox/PS standard
      { xAxis: 0, yAxis: 1 }, // Some USB controllers
      { xAxis: 2, yAxis: 3 }, // Some controllers
      { xAxis: 4, yAxis: 5 }, // Rare but possible
      { xAxis: 16, yAxis: 17 }, // Some advanced controllers
    ];

    for (const config of configurations) {
      // Use this configuration if it shows significant activity
      const axisThreshold = 0.5; // Minimum axis value to consider as intentional movement
      if (this.tryAxisConfiguration(gamepad, config.xAxis, config.yAxis, axisThreshold)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Try a specific axis configuration for D-pad
   * @param {Gamepad} gamepad
   * @param {number} xAxis
   * @param {number} yAxis
   * @param {number} threshold
   * @returns {boolean} True if D-pad input was handled
   */
  tryAxisConfiguration(gamepad, xAxis, yAxis, threshold) {
    const x = gamepad.axes[xAxis] || 0;
    const y = gamepad.axes[yAxis] || 0;

    // Release all arrow keys first
    this.releaseKeys(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    // Handle X axis (left/right)
    if (x < -threshold) {
      doseeLog('info', `D-pad: left (axis ${xAxis})`);
      this.pressKey('ArrowLeft');
      return true;
    } else if (x > threshold) {
      doseeLog('info', `D-pad: right (axis ${xAxis})`);
      this.pressKey('ArrowRight');
      return true;
    }

    // Handle Y axis (up/down)
    if (y < -threshold) {
      doseeLog('info', `D-pad: up (axis ${yAxis})`);
      this.pressKey('ArrowUp');
      return true;
    } else if (y > threshold) {
      doseeLog('info', `D-pad: down (axis ${yAxis})`);
      this.pressKey('ArrowDown');
      return true;
    }

    return false;
  }

  /**
   * Handle D-pad using axes (standard approach)
   * @param {Gamepad} gamepad
   * @returns {boolean} True if D-pad axes were detected
   */
  handleDpadAxes(gamepad) {
    const { xAxis, yAxis, threshold } = this.config.dpad;
    const x = gamepad.axes[xAxis] || 0;
    const y = gamepad.axes[yAxis] || 0;

    // Debug logging for D-pad axes
    doseeLog(
      'info',
      `D-pad Axis Debug - X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Threshold: ${threshold}`
    );

    // Check if any axis movement is detected
    const minAxisMovement = 0.1; // Minimum axis movement to detect activity
    const axisActive = Math.abs(x) > minAxisMovement || Math.abs(y) > minAxisMovement;

    // Release all arrow keys first
    this.releaseKeys(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    // Handle X axis (left/right)
    if (x < -threshold) {
      doseeLog('info', 'Gamepad: D-pad Left → ArrowLeft (axis-based)');
      this.pressKey('ArrowLeft');
      return true;
    } else if (x > threshold) {
      doseeLog('info', 'Gamepad: D-pad Right → ArrowRight (axis-based)');
      this.pressKey('ArrowRight');
      return true;
    }

    // Handle Y axis (up/down) - Y axis is typically inverted
    if (y < -threshold) {
      doseeLog('info', 'Gamepad: D-pad Up → ArrowUp (axis-based)');
      this.pressKey('ArrowUp');
      return true;
    } else if (y > threshold) {
      doseeLog('info', 'Gamepad: D-pad Down → ArrowDown (axis-based)');
      this.pressKey('ArrowDown');
      return true;
    }

    return axisActive; // Return true if any axis movement detected, even if below threshold
  }

  /**
   * Handle D-pad using buttons (POV hat approach)
   * Many controllers report D-pad as 4 separate buttons (up, down, left, right)
   * @param {Gamepad} gamepad
   */
  handleDpadButtons(gamepad) {
    // Try common button indices
    const commonDpadButtons = this.tryCommonDpadButtonIndices(gamepad);

    // If common indices don't work, scan all buttons for D-pad
    if (!commonDpadButtons) {
      this.scanAllButtonsForDpad(gamepad);
    }
  }

  /**
   * Try common D-pad button indices
   * @param {Gamepad} gamepad
   * @returns {boolean} True if D-pad buttons were found
   */
  tryCommonDpadButtonIndices(gamepad) {
    // Common button indices for D-pad (varies by controller)
    const dpadButtonMap = {
      up: 12, // Common D-pad up button index
      down: 13, // Common D-pad down button index
      left: 14, // Common D-pad left button index
      right: 15, // Common D-pad right button index
    };

    let foundAny = false;

    // Check each D-pad direction button
    for (const [direction, buttonIndex] of Object.entries(dpadButtonMap)) {
      if (buttonIndex < gamepad.buttons.length) {
        const button = gamepad.buttons[buttonIndex];
        if (button && button.pressed) {
          foundAny = true;
          this.handleDpadButtonPress(direction);
        }
      }
    }

    return foundAny;
  }

  /**
   * Scan all buttons to find D-pad buttons
   * @param {Gamepad} gamepad
   */
  scanAllButtonsForDpad(gamepad) {
    // Release all arrow keys first
    this.releaseKeys(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    // D-pad button range
    const start = 12;
    const end = 19;

    for (let i = start; i <= end; i++) {
      if (i < gamepad.buttons.length) {
        const button = gamepad.buttons[i];
        if (button && button.pressed) {
          // Try to map button index to direction
          const direction = this.getDirectionFromButtonIndex(i);
          if (direction) {
            this.handleDpadButtonPress(direction);
          }
        }
      }
    }
  }

  /**
   * Map button index to D-pad direction
   * @param {number} buttonIndex
   * @returns {string|null} Direction or null if not a D-pad button
   */
  getDirectionFromButtonIndex(buttonIndex) {
    // Common patterns for D-pad button indices
    const patterns = [
      { up: 12, down: 13, left: 14, right: 15 },
      { up: 13, down: 12, left: 14, right: 15 },
      { up: 14, down: 15, left: 12, right: 13 },
    ];

    for (const pattern of patterns) {
      if (buttonIndex === pattern.up) return 'up';
      if (buttonIndex === pattern.down) return 'down';
      if (buttonIndex === pattern.left) return 'left';
      if (buttonIndex === pattern.right) return 'right';
    }

    // Simple sequential mapping for D-pad buttons
    const dpadStart = 12;
    const dpadEnd = 15;
    if (buttonIndex >= dpadStart && buttonIndex <= dpadEnd) {
      const directions = ['up', 'down', 'left', 'right'];
      return directions[buttonIndex - dpadStart] || null;
    }

    return null;
  }

  /**
   * Handle a D-pad button press
   * @param {string} direction
   */
  handleDpadButtonPress(direction) {
    doseeLog('info', `D-pad: ${direction}`);

    switch (direction) {
      case 'up':
        this.pressKey('ArrowUp');
        break;
      case 'down':
        this.pressKey('ArrowDown');
        break;
      case 'left':
        this.pressKey('ArrowLeft');
        break;
      case 'right':
        this.pressKey('ArrowRight');
        break;
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
        doseeLog('info', `Gamepad: ${buttonName} → ${mapping.key}`);

        // Debug gamepad state when back/share is pressed
        if (buttonName === 'back' || buttonName === 'share') {
          this.debugGamepadState(gamepad);
        }

        this.pressKey(mapping.key);
      } else if (
        (!button || !button.pressed) &&
        this.activeKeys.has(mapping.key)
      ) {
        doseeLog('info', `Gamepad: ${buttonName} released`);
        this.releaseKey(mapping.key);
      }
    }

    // Simple D-pad button test - check buttons 12-15 directly
    this.checkSimpleDpadButtons(gamepad);
  }

  /**
   * Simple direct check for D-pad buttons (12-15)
   * @param {Gamepad} gamepad
   */
  checkSimpleDpadButtons(gamepad) {
    const dpadButtons = {
      12: 'ArrowUp',
      13: 'ArrowDown',
      14: 'ArrowLeft',
      15: 'ArrowRight',
    };

    for (const [buttonIndex, arrowKey] of Object.entries(dpadButtons)) {
      const idx = parseInt(buttonIndex);
      if (idx < gamepad.buttons.length) {
        const button = gamepad.buttons[idx];
        if (button && button.pressed && !this.activeKeys.has(arrowKey)) {
          doseeLog('info', `D-pad: ${buttonIndex} → ${arrowKey}`);
          this.pressKey(arrowKey);
        }
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
      a: 0,
      b: 1,
      x: 2,
      y: 3,
      lb: 4,
      rb: 5,
      back: 8,
      start: 9,
      cross: 0,
      circle: 1,
      square: 2,
      triangle: 3,
      l1: 4,
      r1: 5,
      options: 9,
      share: 8,
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
      doseeLog('info', `[DEV] Key press: ${key}`);
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
      doseeLog('info', `[DEV] Key release: ${key}`);
    }

    this.activeKeys.delete(key);
    this.dispatchKeyEvent('keyup', key);
  }

  /**
   * Release multiple keys
   * @param {string[]} keys
   */
  releaseKeys(keys) {
    keys.forEach((key) => this.releaseKey(key));
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
        cancelable: false, // Make it non-cancelable like real Escape
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
        detail: 0,
      });

      // Dispatch to canvas with slight delay to mimic real key press timing
      const keyPressDelay = 10; // milliseconds
      setTimeout(() => {
        if (canvas) canvas.dispatchEvent(escapeEvent);
        document.dispatchEvent(escapeEvent);
      }, keyPressDelay);

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
        cancelable: true,
      });

      if (this.developerMode) {
        doseeLog('info', `[DEV] Dispatching ${type} event for key: ${key}`);
      }

      // Send to canvas first (where Em-DOSBox should be listening)
      if (canvas) {
        canvas.dispatchEvent(event);
      }

      // Also send to document for good measure
      document.dispatchEvent(event);
    } catch (error) {
      doseeLog(
        'error',
        `Failed to dispatch ${type} for ${key}: ${error.message}`
      );
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
      ArrowUp: 'ArrowUp',
      ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight',
      ' ': 'Space',
      Esc: 'Escape',
      Enter: 'Enter',
      Tab: 'Tab',
      Ctrl: 'ControlLeft',
      Alt: 'AltLeft',
      P: 'KeyP',
      M: 'KeyM',
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
      ArrowUp: 38,
      ArrowDown: 40,
      ArrowLeft: 37,
      ArrowRight: 39,
      ' ': 32,
      Esc: 27,
      Enter: 13,
      Tab: 9,
      ControlLeft: 17,
      AltLeft: 18,
      KeyP: 80,
      KeyM: 77,
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
      doseeLog('info', `Gamepad: Switched to ${configName} layout`);
      if (saveToStorage) this.saveSettings();
      return true;
    }
    doseeLog('warn', `Gamepad: Unknown config ${configName}`);
    return false;
  }

  /**
   * Enable developer mode for detailed output
   */
  enableDeveloperMode() {
    this.developerMode = true;
    doseeLog('info', 'Gamepad: Developer mode enabled');
  }

  /**
   * Enable gamepad input
   * @param {boolean} saveToStorage - Whether to save to localStorage (default: true)
   */
  enable(saveToStorage = true) {
    this.enabled = true;
    doseeLog('info', 'Gamepad: Enabled');
    if (this.gamepad) this.startPolling();
    if (saveToStorage) this.saveSettings();
  }

  /**
   * Disable gamepad input
   * @param {boolean} saveToStorage - Whether to save to localStorage (default: true)
   */
  disable(saveToStorage = true) {
    this.enabled = false;
    doseeLog('info', 'Gamepad: Disabled');
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
    window.removeEventListener(
      'gamepaddisconnected',
      this.handleGamepadDisconnected
    );
    doseeLog('info', 'Gamepad: Destroyed');
  }
}

// Export developer mode enablement function for external use
function enableGamepadDeveloperMode(gamepadInstance) {
  if (gamepadInstance && gamepadInstance.enableDeveloperMode) {
    gamepadInstance.enableDeveloperMode();
  }
}

// Export as ES module
export default DOSeeGamepad;
export { enableGamepadDeveloperMode };
