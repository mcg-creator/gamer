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
    
    // Load carousel sound
    carouselAudio = new Audio('assets/sounds/carousel2.mp3');
    carouselAudio.preload = 'auto';
    carouselAudio.volume = 0.5; // Set volume to 50%
    
    // Load carousel navigation sound
    carouselNavAudio = new Audio('assets/sounds/carousel.mp3');
    carouselNavAudio.preload = 'auto';
    carouselNavAudio.volume = 0.5; // Set volume to 50%
    
    // Setup arrow key event listeners to test d-pad mapping
    setupArrowKeyListeners();
    
    // Start update loop
    update();
    
    // Display keyboard controls
    console.log('Keyboard Controls:', inputManager.getKeyboardControls());
    console.log('Press A/D button to test rumble!');
    console.log('Use D-pad to test arrow key simulation!');
}

// Setup arrow key event listeners for testing
function setupArrowKeyListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) {
            console.log(`⌨️ Arrow key detected: ${e.key}`);
            highlightArrowIndicator(e.key, true);
            
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
            highlightArrowIndicator(e.key, false);
        }
    });
}

// Highlight arrow key indicators for visual feedback
function highlightArrowIndicator(key, pressed) {
    const indicators = {
        'ArrowUp': 'up-indicator',
        'ArrowDown': 'down-indicator',
        'ArrowLeft': 'left-indicator',
        'ArrowRight': 'right-indicator'
    };

    const indicatorId = indicators[key];
    if (!indicatorId) return;

    const element = document.getElementById(indicatorId);
    if (element) {
        if (pressed) {
            element.style.background = '#0f7b0f';
            element.style.color = 'white';
            element.style.transform = 'scale(1.1)';
        } else {
            element.style.background = '#333';
            element.style.color = 'white';
            element.style.transform = 'scale(1.0)';
        }
    }
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

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
