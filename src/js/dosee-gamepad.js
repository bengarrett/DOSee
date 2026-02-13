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
        this.pressKey(mapping.key);
      } else if ((!button || !button.pressed) && this.activeKeys.has(mapping.key)) {
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

    this.activeKeys.add(key);
    this.dispatchKeyEvent('keydown', key);
  }

  /**
   * Release a key (simulate keyup event)
   * @param {string} key
   */
  releaseKey(key) {
    if (!this.activeKeys.has(key)) return;

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
   * Dispatch a keyboard event
   * @param {string} type - Event type ('keydown' or 'keyup')
   * @param {string} key
   */
  dispatchKeyEvent(type, key) {
    const event = new KeyboardEvent(type, {
      key: key,
      code: this.getKeyCode(key),
      bubbles: true,
      cancelable: true,
      composed: true
    });
    document.dispatchEvent(event);
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
   * Set gamepad configuration
   * @param {string} configName - Configuration name ('xbox' or 'playstation')
   * @returns {boolean} True if config was set successfully
   */
  setConfig(configName) {
    if (gamepadConfigs[configName]) {
      this.config = gamepadConfigs[configName];
      console.log(`DOSee Gamepad: Switched to ${configName} layout`);
      return true;
    }
    console.warn(`DOSee Gamepad: Unknown config ${configName}`);
    return false;
  }

  /**
   * Enable gamepad input
   */
  enable() {
    this.enabled = true;
    console.log('DOSee Gamepad: Enabled');
    if (this.gamepad) this.startPolling();
  }

  /**
   * Disable gamepad input
   */
  disable() {
    this.enabled = false;
    console.log('DOSee Gamepad: Disabled');
    this.stopPolling();
    this.releaseAllKeys();
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

// Export as ES module
export default DOSeeGamepad;
