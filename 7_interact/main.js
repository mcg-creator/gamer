// Handheld Controller Boilerplate
// Main JavaScript File - ROG Ally Controller + Keyboard Integration

let inputManager;
let animationFrameId;
let lastInputMethod = null;
let lastButtonState = false;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 ROG Ally Controller Boilerplate initialized');
    console.log('⌨️ Keyboard controls enabled!');
    init();
});

function init() {
    // Create unified input manager (gamepad + keyboard)
    inputManager = new InputManager();
    
    // Start update loop
    update();
    
    // Display keyboard controls
    console.log('Keyboard Controls:', inputManager.getKeyboardControls());
    console.log('Press A/D button to test rumble!');
}

// Main update loop
function update() {
    // Update input state (gamepad + keyboard)
    inputManager.update();
    
    // Debug: Log input method
    const inputMethod = inputManager.getActiveInputMethod();
    if (inputMethod !== lastInputMethod) {
        console.log('Active input method:', inputMethod);
        lastInputMethod = inputMethod;
    }
    
    // Handle button presses
    handleInput();
    
    // Continue loop
    animationFrameId = requestAnimationFrame(update);
}

// These UI update functions are no longer needed since we removed the UI elements
function updateConnectionStatus() { }
function updateButtons() { }
function updateTriggers() { }
function updateSticks() { }
function updateActiveButtons() { }

// Handle input events
function handleInput() {
    const appContainer = document.getElementById('app-container');
    
    // Check for keyboard key 'A' press
    if (inputManager.isButtonDown('A') && !lastButtonState) {
        handleScale();
    }
    
    // Update last button state
    lastButtonState = inputManager.isButtonDown('A');
}

function handleScale() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        const isScaled = appContainer.classList.contains('scaled');
        appContainer.classList.toggle('scaled');
        console.log('Container scaled:', !isScaled);
        inputManager.rumble(0.8, 200);
    } else {
        console.error('App container not found - check HTML structure');
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
