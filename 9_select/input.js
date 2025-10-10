// InputManager - Unified input system for keyboard and gamepad
// Provides unified interface for both keyboard and ASUS ROG Ally controller controls

class InputManager {
    constructor() {
        this.keyboard = new KeyboardManager();
        this.gamepad = new GamepadManager();
        this.preferGamepad = false; // Prefer gamepad input when available
    }

    // Update both keyboard and gamepad input systems
    update() {
        this.keyboard.update();
        this.gamepad.update();
        
        // Prefer gamepad if connected
        this.preferGamepad = this.gamepad.isConnected();
    }

    // Check if button is down (gamepad first, then keyboard)
    isButtonDown(buttonName) {
        if (this.preferGamepad && this.gamepad.isConnected()) {
            return this.gamepad.isButtonDown(buttonName);
        }
        return this.keyboard.isButtonDown(buttonName);
    }

    // Check if button was just pressed (gamepad first, then keyboard)
    justPressed(buttonName) {
        if (this.preferGamepad && this.gamepad.isConnected()) {
            return this.gamepad.justPressed(buttonName);
        }
        return this.keyboard.justPressed(buttonName);
    }

    // Check if button was just released (gamepad first, then keyboard)
    justReleased(buttonName) {
        if (this.preferGamepad && this.gamepad.isConnected()) {
            return this.gamepad.justReleased(buttonName);
        }
        return this.keyboard.justReleased(buttonName);
    }

    // Get stick value (gamepad first, then keyboard)
    getStick(stickName) {
        if (this.preferGamepad && this.gamepad.isConnected()) {
            return this.gamepad.getStick(stickName);
        }
        return this.keyboard.getStick(stickName);
    }

    // Get trigger value (gamepad first, then keyboard)
    getTrigger(triggerName) {
        if (this.preferGamepad && this.gamepad.isConnected()) {
            return this.gamepad.getTrigger(triggerName);
        }
        return this.keyboard.getTrigger(triggerName);
    }

    // Get all pressed buttons (gamepad first, then keyboard)
    getPressedButtons() {
        if (this.preferGamepad && this.gamepad.isConnected()) {
            return this.gamepad.getPressedButtons();
        }
        return this.keyboard.getPressedButtons();
    }

    // Rumble (only works with gamepad)
    async rumble(intensity = 0.5, duration = 200) {
        if (this.gamepad.isConnected()) {
            return this.gamepad.rumble(intensity, duration);
        }
        return Promise.resolve();
    }

    // Check if gamepad is connected
    isGamepadConnected() {
        return this.gamepad.isConnected();
    }

    // Get active input method
    getActiveInputMethod() {
        return this.gamepad.isConnected() ? 'gamepad' : 'keyboard';
    }

    // Get keyboard controls info
    getKeyboardControls() {
        return this.keyboard.getKeyboardControls();
    }
}
