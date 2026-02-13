/**
 * DOSee Gamepad UI Controls
 * Adds gamepad controls to the DOSee interface that match the existing UI style
 */

/**
 * Add gamepad controls to the DOSee UI
 * @param {DOSeeGamepad} gamepadSupport - The gamepad support instance
 */
export function addGamepadUI(gamepadSupport) {
  if (!gamepadSupport || !document.getElementById('optionsTab')) {
    console.warn('DOSee Gamepad UI: Required elements not found');
    return;
  }

  // Create gamepad controls fieldset
  const gamepadFieldset = document.createElement('fieldset');
  gamepadFieldset.id = 'gamepadControls';
  
  const legend = document.createElement('legend');
  legend.textContent = 'Gamepad Settings';
  gamepadFieldset.appendChild(legend);

  // Add gamepad toggle
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'radio-inline';
  
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.id = 'gamepadToggle';
  toggleInput.checked = gamepadSupport.enabled;
  
  const toggleText = document.createTextNode(' Enable Gamepad Support');
  
  toggleLabel.appendChild(toggleInput);
  toggleLabel.appendChild(toggleText);
  gamepadFieldset.appendChild(toggleLabel);
  gamepadFieldset.appendChild(document.createElement('br'));

  // Add layout selector
  const layoutLabel = document.createElement('label');
  layoutLabel.textContent = 'Controller Layout: ';
  
  const layoutSelect = document.createElement('select');
  layoutSelect.id = 'gamepadLayout';
  
  const xboxOption = document.createElement('option');
  xboxOption.value = 'xbox';
  xboxOption.textContent = 'Xbox Controller';
  
  const psOption = document.createElement('option');
  psOption.value = 'playstation';
  psOption.textContent = 'PlayStation Controller';
  
  layoutSelect.appendChild(xboxOption);
  layoutSelect.appendChild(psOption);
  layoutSelect.value = gamepadSupport.config === gamepadConfigs.xbox ? 'xbox' : 'playstation';
  
  layoutLabel.appendChild(layoutSelect);
  gamepadFieldset.appendChild(layoutLabel);
  gamepadFieldset.appendChild(document.createElement('br'));

  // Add status indicator
  const statusDiv = document.createElement('div');
  statusDiv.id = 'gamepadStatus';
  statusDiv.className = 'splash-status';
  statusDiv.textContent = 'No gamepad detected';
  gamepadFieldset.appendChild(statusDiv);

  // Add to options tab
  const optionsTab = document.getElementById('optionsTab');
  optionsTab.appendChild(gamepadFieldset);

  // Set up event handlers
  toggleInput.addEventListener('change', function() {
    if (this.checked) {
      gamepadSupport.enable();
      updateGamepadStatus('Gamepad enabled');
    } else {
      gamepadSupport.disable();
      updateGamepadStatus('Gamepad disabled');
    }
  });

  layoutSelect.addEventListener('change', function() {
    gamepadSupport.setConfig(this.value);
    updateGamepadStatus(`Layout: ${this.value}`);
  });

  // Gamepad connection events
  window.addEventListener('gamepadconnected', function(e) {
    updateGamepadStatus(`Connected: ${e.gamepad.id}`);
  });

  window.addEventListener('gamepaddisconnected', function() {
    updateGamepadStatus('No gamepad detected');
  });

  function updateGamepadStatus(message) {
    const statusElement = document.getElementById('gamepadStatus');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  // Add CSS for gamepad controls
  addGamepadCSS();
}

/**
 * Add CSS styles for gamepad controls
 */
function addGamepadCSS() {
  const style = document.createElement('style');
  style.textContent = `
    /* Gamepad controls styling - matches DOSee UI */
    #gamepadControls {
      margin-top: 1em;
      padding: 0.5em;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    
    #gamepadControls legend {
      font-weight: bold;
      padding: 0 0.5em;
    }
    
    #gamepadToggle {
      margin-right: 0.5em;
    }
    
    #gamepadLayout {
      margin-left: 0.5em;
      padding: 0.2em;
    }
    
    #gamepadStatus {
      margin-top: 0.5em;
      font-size: 0.9em;
      color: #666;
      min-height: 1.2em;
    }
    
    .gamepad-connected {
      color: green;
    }
    
    .gamepad-disconnected {
      color: #666;
    }
    
    .gamepad-error {
      color: red;
    }
  `;
  document.head.appendChild(style);
}

// Import gamepad configs for layout detection
import { gamepadConfigs } from './dosee-gamepad.js';
