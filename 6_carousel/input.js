// InputManager - Unified input system
// Combines GamepadManager and KeyboardManager for seamless input

class InputManager {
    constructor() {
        this.gamepad = new GamepadManager();
        this.keyboard = new KeyboardManager();
    }

    // Update both input systems
    update() {
        this.gamepad.update();
        this.keyboard.update();
    }

    // Check if button is down (gamepad OR keyboard)
    isButtonDown(buttonName, gamepadIndex = 0) {
        return this.gamepad.isButtonDown(buttonName, gamepadIndex) || 
               this.keyboard.isButtonDown(buttonName);
    }

    // Check if button was just pressed (gamepad OR keyboard)
    justPressed(buttonName, gamepadIndex = 0) {
        return this.gamepad.justPressed(buttonName, gamepadIndex) || 
               this.keyboard.justPressed(buttonName);
    }

    // Check if button was just released (gamepad OR keyboard)
    justReleased(buttonName, gamepadIndex = 0) {
        return this.gamepad.justReleased(buttonName, gamepadIndex) || 
               this.keyboard.justReleased(buttonName);
    }

    // Get stick value (gamepad takes priority, keyboard as fallback)
    getStick(stickName, gamepadIndex = 0) {
        const gamepadStick = this.gamepad.getStick(stickName, gamepadIndex);
        
        // If gamepad has significant input, use it
        if (gamepadStick.magnitude > 0.1) {
            return gamepadStick;
        }
        
        // Otherwise use keyboard
        return this.keyboard.getStick(stickName);
    }

    // Get trigger value (gamepad takes priority, keyboard as fallback)
    getTrigger(triggerName, gamepadIndex = 0) {
        const gamepadTrigger = this.gamepad.getTrigger(triggerName, gamepadIndex);
        
        // If gamepad trigger is pressed, use it
        if (gamepadTrigger > 0.1) {
            return gamepadTrigger;
        }
        
        // Otherwise use keyboard
        return this.keyboard.getTrigger(triggerName);
    }

    // Get all pressed buttons from both sources
    getPressedButtons(gamepadIndex = 0) {
        const gamepadButtons = this.gamepad.getPressedButtons(gamepadIndex);
        const keyboardButtons = this.keyboard.getPressedButtons();
        
        // Combine and remove duplicates
        const allButtons = [...new Set([...gamepadButtons, ...keyboardButtons])];
        return allButtons;
    }

    // Rumble (gamepad only)
    async rumble(intensity = 0.5, duration = 200, gamepadIndex = 0) {
        return this.gamepad.rumble(intensity, duration, gamepadIndex);
    }

    // Check if gamepad is connected
    isGamepadConnected(gamepadIndex = 0) {
        return this.gamepad.isConnected(gamepadIndex);
    }

    // Get active input method
    getActiveInputMethod() {
        const hasGamepad = this.isGamepadConnected();
        const hasKeyboard = this.keyboard.keysDown.size > 0 || 
                           this.keyboard.getStick('LEFT').magnitude > 0 ||
                           this.keyboard.getStick('RIGHT').magnitude > 0;
        
        if (hasGamepad && hasKeyboard) return 'both';
        if (hasGamepad) return 'gamepad';
        if (hasKeyboard) return 'keyboard';
        return 'none';
    }

    // Get keyboard controls reference
    getKeyboardControls() {
        return this.keyboard.getKeyboardMap();
    }

    // Get first connected gamepad (for info display)
    getGamepad(index = 0) {
        return this.gamepad.getGamepad(index);
    }
}
