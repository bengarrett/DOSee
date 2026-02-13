/**
 * DOSee Gamepad Support Module - Simplified Version
 * Focused on digital D-pad button detection
 */

// Gamepad configuration presets
export const gamepadConfigs = {
  xbox: {
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

  init() {
    this.supported = !!navigator.getGamepads;
    if (!this.supported) return false;
    
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
    
    console.log('Gamepad: Initialized - waiting for controller');
    return true;
  }

  handleGamepadConnected(event) {
    console.log('Gamepad: Controller connected', event.gamepad.id);
    this.gamepad = event.gamepad;
    this.startPolling();
  }

  handleGamepadDisconnected(event) {
    console.log('Gamepad: Controller disconnected');
    this.stopPolling();
    this.releaseAllKeys();
    this.gamepad = null;
  }

  startPolling() {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(() => this.pollGamepad(), 16);
    console.log('Gamepad: Polling started');
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  pollGamepad() {
    if (!this.gamepad || !this.enabled) return;
    
    const gamepads = navigator.getGamepads();
    const currentGamepad = gamepads[this.gamepad.index] || gamepads[0];
    
    if (currentGamepad) {
      this.handleDpad(currentGamepad);
      this.handleButtons(currentGamepad);
    }
  }

  // SIMPLE D-PAD HANDLING - FOCUSED ON BUTTONS 12-15
  handleDpad(gamepad) {
    // Digital D-pad buttons are typically indices 12-15
    const dpadMap = {
      12: 'ArrowUp',    // D-pad up
      13: 'ArrowDown',  // D-pad down
      14: 'ArrowLeft',  // D-pad left  
      15: 'ArrowRight' // D-pad right
    };

    // Release all arrow keys first
    this.releaseKeys(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

    // Check each potential D-pad button
    for (const [buttonIndex, arrowKey] of Object.entries(dpadMap)) {
      const idx = parseInt(buttonIndex);
      if (idx < gamepad.buttons.length) {
        const button = gamepad.buttons[idx];
        if (button && button.pressed) {
          console.log(`D-pad: ${buttonIndex} → ${arrowKey}`);
          this.pressKey(arrowKey);
        }
      }
    }
  }

  handleButtons(gamepad) {
    for (const [buttonName, mapping] of Object.entries(this.config.buttons)) {
      const buttonIndex = this.getButtonIndex(buttonName);
      if (buttonIndex === -1) continue;
      
      const button = gamepad.buttons[buttonIndex];
      
      if (button && button.pressed && !this.activeKeys.has(mapping.key)) {
        console.log(`Button: ${buttonName} → ${mapping.key}`);
        this.pressKey(mapping.key);
      } else if ((!button || !button.pressed) && this.activeKeys.has(mapping.key)) {
        this.releaseKey(mapping.key);
      }
    }
  }

  getButtonIndex(buttonName) {
    const buttonMap = {
      'a': 0, 'b': 1, 'x': 2, 'y': 3,
      'lb': 4, 'rb': 5, 'back': 8, 'start': 9,
      'cross': 0, 'circle': 1, 'square': 2, 'triangle': 3,
      'l1': 4, 'r1': 5, 'options': 9, 'share': 8
    };
    return buttonMap[buttonName] || -1;
  }

  pressKey(key) {
    if (this.activeKeys.has(key)) return;
    this.activeKeys.add(key);
    this.dispatchKeyEvent('keydown', key);
  }

  releaseKey(key) {
    if (!this.activeKeys.has(key)) return;
    this.activeKeys.delete(key);
    this.dispatchKeyEvent('keyup', key);
  }

  releaseKeys(keys) {
    keys.forEach(key => this.releaseKey(key));
  }

  releaseAllKeys() {
    for (const key of this.activeKeys) {
      this.dispatchKeyEvent('keyup', key);
    }
    this.activeKeys.clear();
  }

  dispatchKeyEvent(type, key) {
    // Special handling for Escape key
    if (key === 'Esc') {
      const escapeEvent = new KeyboardEvent(type, {
        key: 'Escape', code: 'Escape', keyCode: 27, which: 27,
        bubbles: true, cancelable: false, composed: true
      });
      
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.focus();
        setTimeout(() => {
          canvas.dispatchEvent(escapeEvent);
          document.dispatchEvent(escapeEvent);
        }, 10);
      }
      return;
    }
    
    // Normal key dispatch
    try {
      const event = new KeyboardEvent(type, {
        key: key, bubbles: true, cancelable: true
      });
      
      const canvas = document.querySelector('canvas');
      if (canvas) canvas.dispatchEvent(event);
      document.dispatchEvent(event);
    } catch (error) {
      console.error(`Failed to dispatch ${type} for ${key}:`, error);
    }
  }

  setConfig(configName) {
    if (gamepadConfigs[configName]) {
      this.config = gamepadConfigs[configName];
      return true;
    }
    return false;
  }

  enable() {
    this.enabled = true;
    if (this.gamepad) this.startPolling();
  }

  disable() {
    this.enabled = false;
    this.stopPolling();
    this.releaseAllKeys();
  }

  destroy() {
    this.disable();
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }
}

export default DOSeeGamepad;
