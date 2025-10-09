// Handheld Controller Boilerplate
// Main JavaScript File - ROG Ally Controller + Keyboard Integration

let inputManager;
let animationFrameId;
let lastInputMethod = null;
let lastButtonState = false;
let navAudio;
let carouselAudio;
let carouselNavAudio;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 ROG Ally Controller Boilerplate initialized');
    console.log('⌨️ Keyboard controls enabled!');
    init();
});

function init() {
    // Create unified input manager (gamepad + keyboard)
    inputManager = new InputManager();
    
    // Load navigation sound
    navAudio = new Audio('assets/sounds/nav.mp3');
    navAudio.preload = 'auto';
    navAudio.volume = 0.5; // Set volume to 50%
    window.navAudio = navAudio; // Make available globally for lockscreen
    
    // Load carousel sound
    carouselAudio = new Audio('assets/sounds/carousel2.MP3');
    carouselAudio.preload = 'auto';
    carouselAudio.volume = 0.5; // Set volume to 50%
    
    // Load carousel navigation sound (used by lockscreen for PIN entry)
    carouselNavAudio = new Audio('assets/sounds/carousel.MP3');
    carouselNavAudio.preload = 'auto';
    carouselNavAudio.volume = 0.5; // Set volume to 50%
    window.carouselAudio = carouselNavAudio; // Make available globally for lockscreen
    
    // Setup arrow key event listeners to test d-pad mapping
    setupArrowKeyListeners();
    
    // Start update loop
    update();
    
    // Display keyboard controls
    console.log('Keyboard Controls:', inputManager.getKeyboardControls());
    console.log('Press A/D button to test rumble!');
    console.log('Use D-pad to test arrow key simulation!');
    
    // Add gamepad testing
    setTimeout(() => {
        console.log('🎮 Testing gamepad detection...');
        const gamepads = navigator.getGamepads();
        console.log('Gamepads:', gamepads);
        if (gamepads && gamepads[0]) {
            console.log('First gamepad:', gamepads[0].id);
            console.log('Buttons count:', gamepads[0].buttons.length);
            console.log('Axes count:', gamepads[0].axes.length);
        } else {
            console.log('❌ No gamepad detected. Make sure your ASUS ROG Ally is connected and try pressing a button.');
        }
    }, 2000);
}

// Setup arrow key event listeners for testing
function setupArrowKeyListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) {
            console.log(`⌨️ Arrow key detected: ${e.key}`);
            
            // Don't play any sounds here - let the navigation system in HTML handle all audio
            // The HTML navigation system already has the correct audio logic:
            // - Nav bar left/right = nav.mp3
            // - Nav to carousel (down) = carousel2.mp3  
            // - Carousel to nav (up) = nav.mp3
            // - Carousel left/right = carousel.mp3
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key.startsWith('Arrow')) {
            // Visual indicators removed
        }
    });
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
    // Check if lockscreen is active
    const lockscreen = document.getElementById('lockscreen');
    const isLockscreenActive = lockscreen && lockscreen.style.display !== 'none';
    
    if (isLockscreenActive && window.lockscreenManager) {
        // Handle lockscreen input through gamepad
        handleLockscreenGamepadInput();
    } else {
        // Handle main app input
        handleMainAppInput();
    }
}

function handleLockscreenGamepadInput() {
    // Map gamepad buttons to lockscreen actions
    const dpadUp = inputManager.justPressed('DPadUp');
    const dpadDown = inputManager.justPressed('DPadDown');
    const dpadLeft = inputManager.justPressed('DPadLeft');
    const dpadRight = inputManager.justPressed('DPadRight');
    const buttonA = inputManager.justPressed('A');
    const buttonB = inputManager.justPressed('B');
    
    if (dpadUp) {
        window.lockscreenManager.navigateUp();
    } else if (dpadDown) {
        window.lockscreenManager.navigateDown();
    } else if (dpadLeft) {
        window.lockscreenManager.navigateLeft();
    } else if (dpadRight) {
        window.lockscreenManager.navigateRight();
    } else if (buttonA) {
        window.lockscreenManager.handleSelect();
    } else if (buttonB) {
        window.lockscreenManager.handleBack();
    }
    
    // Handle number input via gamepad for PIN
    // Map face buttons to numbers for PIN entry
    if (window.lockscreenManager.currentFocus === 'pin') {
        if (inputManager.justPressed('A')) {
            window.lockscreenManager.addPinDigit('1');
        } else if (inputManager.justPressed('B')) {
            window.lockscreenManager.addPinDigit('2');
        } else if (inputManager.justPressed('X')) {
            window.lockscreenManager.addPinDigit('3');
        } else if (inputManager.justPressed('Y')) {
            window.lockscreenManager.addPinDigit('4');
        }
    }
}

function handleMainAppInput() {
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

// Function to play navigation sound
function playNavSound() {
    if (navAudio) {
        navAudio.currentTime = 0; // Reset to beginning
        navAudio.play().catch(error => {
            console.log('Audio play failed:', error);
        });
    }
}

// Function to play carousel sound
function playCarouselSound() {
    if (carouselAudio) {
        carouselAudio.currentTime = 0; // Reset to beginning
        carouselAudio.play().catch(error => {
            console.log('Carousel audio play failed:', error);
        });
    }
}

// Function to play carousel navigation sound
function playCarouselNavSound() {
    if (carouselNavAudio) {
        carouselNavAudio.currentTime = 0; // Reset to beginning
        carouselNavAudio.play().catch(error => {
            console.log('Carousel navigation audio play failed:', error);
        });
    }
}

// Make sound functions available globally
window.playNavSound = playNavSound;
window.playCarouselSound = playCarouselSound;
window.playCarouselNavSound = playCarouselNavSound;

// Add global gamepad test function
window.testGamepad = function() {
    console.log('🎮 Manual gamepad test...');
    const gamepads = navigator.getGamepads();
    console.log('Gamepads array:', gamepads);
    
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            const gp = gamepads[i];
            console.log(`Gamepad ${i}:`, gp.id);
            console.log(`  Buttons (${gp.buttons.length}):`, gp.buttons.map((b, idx) => `${idx}:${b.pressed}`).filter(b => b.includes('true')));
            console.log(`  Axes (${gp.axes.length}):`, gp.axes.map((a, idx) => `${idx}:${a.toFixed(3)}`));
            
            // Test d-pad specifically
            console.log(`  D-pad: UP=${gp.buttons[12]?.pressed}, DOWN=${gp.buttons[13]?.pressed}, LEFT=${gp.buttons[14]?.pressed}, RIGHT=${gp.buttons[15]?.pressed}`);
        }
    }
    
    if (!gamepads || !gamepads[0]) {
        console.log('❌ No gamepad detected. Make sure to:');
        console.log('  1. Connect your ASUS ROG Ally');
        console.log('  2. Press any button on the gamepad first');
        console.log('  3. Make sure the page has focus');
    }
};

console.log('💡 Type testGamepad() in console to manually test gamepad detection');

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
