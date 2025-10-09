// Lockscreen functionality for ASUS ROG Ally prototype
class LockscreenManager {
    constructor() {
        this.currentFocus = 'avatar'; // avatar, pin, games
        this.pinInput = '';
        this.correctPin = '1234'; // Demo PIN
        this.focusedGameIndex = 0; // Start with first interactive game
        this.focusedPinIndex = 0; // Current PIN dot focus (0-3)
        this.usernameIndex = 0; // 0 = tenarcher_name, 1 = ghost_name
        this.focusedAvatarIndex = 0; // 0 = tenarcher, 1 = ghost
        this.lastUsernameIndex = 0; // Track previous username mode for crossfade detection
        this.lastGamepadInput = 0; // Throttle gamepad input
        this.lastPinInput = 0; // Debounce PIN input to prevent double registration
        
        // Set global flag to indicate lockscreen is active
        window.lockscreenActive = true;
        
        this.lockscreenElement = document.getElementById('lockscreen');
        this.appElement = document.getElementById('app');
        
        this.initializeElements();
        this.bindEvents();
        this.initializeImages();
        this.updateFocus();
    }
    
    initializeElements() {
        // Get all interactive elements
        this.avatarImg = document.getElementById('avatar-image');
        this.ghostAvatarImg = document.getElementById('ghost-avatar-image');
        this.tenarcherUsernameImg = document.getElementById('tenarcher-username');
        this.ghostUsernameImg = document.getElementById('ghost-username');
        this.pinDots = document.querySelectorAll('.pin-dot');
        this.tenarcherGameTiles = document.getElementById('tenarcher-games');
        this.ghostGameTiles = document.getElementById('ghost-games');
        this.gameTiles = this.tenarcherGameTiles.querySelectorAll('.game-tile'); // Default to TenArcher tiles for navigation
        
        // Avatar should use tenarcher images
        this.avatar = { 
            normal: 'assets/lockscreen/tenarcher.png', 
            focus: 'assets/lockscreen/tenarcher_focus.png' 
        };

        // Ghost avatar data
        this.ghostAvatar = {
            normal: 'assets/lockscreen/ghost.png',
            focus: 'assets/lockscreen/ghost_focus.png'
        };
        
        // Username options (separate from avatar)
        this.usernames = [
            { normal: 'assets/lockscreen/tenarcher_name.png', focus: 'assets/lockscreen/tenarcher_name.png' },
            { normal: 'assets/lockscreen/ghost_name.png', focus: 'assets/lockscreen/ghost_name.png' }
        ];
        
        // Game images for TenArcher
        this.tenArcherGames = [
            { normal: 'assets/lockscreen/game.png', focus: 'assets/lockscreen/game_focus.png' },
            { normal: 'assets/lockscreen/avatar1.png', focus: 'assets/lockscreen/avatar1_focus.png' },
            { normal: 'assets/lockscreen/avatar2.png', focus: 'assets/lockscreen/avatar2_focus.png' },
            { normal: 'assets/lockscreen/avatar3.png', focus: 'assets/lockscreen/avatar3_focus.png' },
            { normal: 'assets/lockscreen/plus3.png', focus: 'assets/lockscreen/plus3.png' }, // +3 tile (no focus state)
            { normal: 'assets/lockscreen/update.png', focus: 'assets/lockscreen/update_focus.png' }
        ];
        
        // Game images for Ghost (only game2, avatar4, avatar5)
        this.ghostGames = [
            { normal: 'assets/lockscreen/game2.png', focus: 'assets/lockscreen/game2_focus.png' },
            { normal: 'assets/lockscreen/avatar4.png', focus: 'assets/lockscreen/avatar4_focus.png' },
            { normal: 'assets/lockscreen/avatar5.png', focus: 'assets/lockscreen/avatar5_focus.png' },
            null, // Empty slot
            null, // +3 tile (no interaction, no focus state)
            null  // No update tile for ghost
        ];
        
        // Start with TenArcher games
        this.gameImages = this.tenArcherGames;
    }
    
    initializeImages() {
        // Set initial avatar image (start focused since avatar is the default focus)
        this.avatarImg.src = this.avatar.focus;
        this.avatarImg.classList.add('focused'); // Add focused class for scaling
        
        // Set initial ghost avatar (not focused initially)
        this.ghostAvatarImg.src = this.ghostAvatar.normal;
        
        // Initialize both username images - start with TenArcher active
        this.tenarcherUsernameImg.src = this.usernames[0].normal;
        this.ghostUsernameImg.src = this.usernames[1].normal;
        
        // Set initial game images for both sets
        const tenarcherTiles = this.tenarcherGameTiles.querySelectorAll('.game-tile');
        tenarcherTiles.forEach((tile, index) => {
            const gameImg = tile.querySelector('.game-image');
            if (gameImg && this.tenArcherGames[index]) {
                gameImg.src = this.tenArcherGames[index].normal;
            }
        });
        
        const ghostTiles = this.ghostGameTiles.querySelectorAll('.game-tile');
        ghostTiles.forEach((tile, index) => {
            const gameImg = tile.querySelector('.game-image');
            if (gameImg && this.ghostGames[index]) {
                gameImg.src = this.ghostGames[index].normal;
            }
        });
        
        // Start with TenArcher games as active
        this.gameImages = this.tenArcherGames;
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Initialize GamepadManager
        this.gamepadManager = new GamepadManager();
        
        // Start gamepad update loop
        this.startGamepadLoop();
    }
    
    startGamepadLoop() {
        const updateGamepad = () => {
            this.gamepadManager.update();
            this.handleGamepadInput();
            requestAnimationFrame(updateGamepad);
        };
        updateGamepad();
    }
    
    handleGamepadInput() {
        // Handle joystick input
        const leftStick = this.gamepadManager.getStick('LEFT');
        
        // Check for joystick movement (with threshold to prevent drift)
        const threshold = 0.7;
        
        // Left stick navigation
        if (leftStick.magnitude > threshold) {
            if (Math.abs(leftStick.x) > Math.abs(leftStick.y)) {
                // Horizontal movement
                if (leftStick.x > threshold) {
                    this.handleGamepadDirection('right');
                } else if (leftStick.x < -threshold) {
                    this.handleGamepadDirection('left');
                }
            } else {
                // Vertical movement
                if (leftStick.y > threshold) {
                    this.handleGamepadDirection('up');
                } else if (leftStick.y < -threshold) {
                    this.handleGamepadDirection('down');
                }
            }
        }

        // Handle d-pad input directly (GamepadManager will also convert to keyboard events)
        if (this.gamepadManager.justPressed('UP')) {
            this.handleGamepadDirection('up');
        } else if (this.gamepadManager.justPressed('DOWN')) {
            this.handleGamepadDirection('down');
        } else if (this.gamepadManager.justPressed('LEFT')) {
            this.handleGamepadDirection('left');
        } else if (this.gamepadManager.justPressed('RIGHT')) {
            this.handleGamepadDirection('right');
        }
        
        // Note: A button handling removed - let GamepadManager convert to spacebar
        // This prevents double input from both direct gamepad and simulated keyboard
        
        // Check for B button (back/escape equivalent)
        if (this.gamepadManager.justPressed('B')) {
            this.handleBack();
        }
    }    handleGamepadDirection(direction) {
        // Throttle gamepad input to prevent rapid firing
        const now = Date.now();
        if (this.lastGamepadInput && now - this.lastGamepadInput < 200) {
            return;
        }
        this.lastGamepadInput = now;
        
        switch (direction) {
            case 'up':
                this.navigateUp();
                break;
            case 'down':
                this.navigateDown();
                break;
            case 'left':
                this.navigateLeft();
                break;
            case 'right':
                this.navigateRight();
                break;
        }
    }
    
    handleKeyDown(e) {
        console.log('Lockscreen handling key:', e.key);
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to main app
        
        switch (e.key) {
            case 'ArrowUp':
                this.navigateUp();
                break;
            case 'ArrowDown':
                this.navigateDown();
                break;
            case 'ArrowLeft':
                this.navigateLeft();
                break;
            case 'ArrowRight':
                this.navigateRight();
                break;
            case 'Enter':
            case ' ':
                this.handleSelect();
                break;
            case 'Escape':
                this.handleBack();
                break;
            // Number keys for PIN input
            case '0': case '1': case '2': case '3': case '4':
            case '5': case '6': case '7': case '8': case '9':
                if (this.currentFocus === 'pin') {
                    this.addPinDigit(e.key);
                }
                break;
            case 'Backspace':
                if (this.currentFocus === 'pin') {
                    this.removePinDigit();
                }
                break;
        }
    }
    
    navigateUp() {
        if (this.currentFocus === 'games') {
            this.currentFocus = 'pin';
        } else if (this.currentFocus === 'pin') {
            this.currentFocus = 'avatar';
        }
        this.updateFocus();
        this.playNavSound(); // nav.mp3 for vertical navigation
    }
    
    navigateDown() {
        if (this.currentFocus === 'avatar') {
            this.currentFocus = 'pin';
        } else if (this.currentFocus === 'pin') {
            this.currentFocus = 'games';
        }
        this.updateFocus();
        this.playNavSound(); // nav.mp3 for vertical navigation
    }
    
    navigateLeft() {
        if (this.currentFocus === 'games') {
            this.previousGame();
            this.updateFocus();
            this.playNavSound(); // nav.mp3 for footer items
        } else if (this.currentFocus === 'pin') {
            this.previousPin();
            this.updateFocus();
            this.playNavSound(); // nav.mp3 for PIN left navigation
        } else if (this.currentFocus === 'avatar') {
            this.previousAvatar();
            this.updateFocus();
            this.playNavSound(); // nav.mp3 for avatar navigation
        }
    }
    
    navigateRight() {
        if (this.currentFocus === 'games') {
            this.nextGame();
            this.updateFocus();
            this.playNavSound(); // nav.mp3 for footer items
        } else if (this.currentFocus === 'pin') {
            this.nextPin();
            this.updateFocus();
            this.playNavSound(); // nav.mp3 for PIN right navigation
        } else if (this.currentFocus === 'avatar') {
            this.nextAvatar();
            this.updateFocus();
            this.playNavSound(); // nav.mp3 for avatar navigation
        }
    }
    
    handleSelect() {
        // Add debouncing for all select inputs to prevent double registration
        const now = Date.now();
        if (now - this.lastPinInput < 300) {
            console.log('Select input debounced - too fast');
            return; // Ignore rapid inputs from any source
        }
        
        if (this.currentFocus === 'avatar') {
            this.toggleUsername();
        } else if (this.currentFocus === 'games') {
            this.selectGame();
        } else if (this.currentFocus === 'pin') {
            this.lastPinInput = now; // Update debounce timestamp for all PIN inputs
            this.addPinWithSpacebar();
            this.playSelectSound(); // carousel.mp3 only for PIN spacebar/A button
        }
        // No sound for avatar/games selection
    }
    
    handleBack() {
        if (this.currentFocus === 'pin' && this.pinInput.length > 0) {
            this.removePinDigit();
        }
    }
    
    toggleUsername() {
        this.usernameIndex = (this.usernameIndex + 1) % this.usernames.length;
        this.updateUsernameImage();
    }
    
    updateUsernameImage() {
        const isAvatarFocused = this.currentFocus === 'avatar';
        const isGhostMode = this.focusedAvatarIndex === 1;
        
        // Update the image sources based on focus state
        const tenarcherSrc = isAvatarFocused && !isGhostMode ? this.usernames[0].focus : this.usernames[0].normal;
        const ghostSrc = isAvatarFocused && isGhostMode ? this.usernames[1].focus : this.usernames[1].normal;
        
        this.tenarcherUsernameImg.src = tenarcherSrc;
        this.ghostUsernameImg.src = ghostSrc;
        
        // Update positioning classes based on current mode
        if (isGhostMode) {
            // Ghost mode: Ghost centered, TenArcher left
            this.tenarcherUsernameImg.className = 'username tenarcher-inactive';
            this.ghostUsernameImg.className = 'username ghost-active';
        } else {
            // TenArcher mode: TenArcher centered, Ghost right
            this.tenarcherUsernameImg.className = 'username tenarcher-active';
            this.ghostUsernameImg.className = 'username ghost-inactive';
        }
        
        // Track the current avatar mode for next comparison
        this.lastUsernameIndex = isGhostMode ? 1 : 0;
    }
    
    updateAvatarImage() {
        const isAvatarFocused = this.currentFocus === 'avatar';
        const isTenArcherSelected = this.focusedAvatarIndex === 0;
        const isTenArcherFocused = isAvatarFocused && isTenArcherSelected;
        
        // Use focus image only when avatar section is focused AND TenArcher is selected
        this.avatarImg.src = isTenArcherFocused ? this.avatar.focus : this.avatar.normal;
        
        // Keep focused class (large size) when TenArcher is selected, regardless of current focus
        if (isTenArcherSelected) {
            this.avatarImg.classList.add('focused');
        } else {
            this.avatarImg.classList.remove('focused');
        }
    }

    updateGhostAvatarImage() {
        const isAvatarFocused = this.currentFocus === 'avatar';
        const isGhostSelected = this.focusedAvatarIndex === 1;
        const isGhostFocused = isAvatarFocused && isGhostSelected;
        
        // Use focus image only when avatar section is focused AND Ghost is selected
        this.ghostAvatarImg.src = isGhostFocused ? this.ghostAvatar.focus : this.ghostAvatar.normal;
        
        // Keep focused class (large size) when Ghost is selected, regardless of current focus
        if (isGhostSelected) {
            this.ghostAvatarImg.classList.add('focused');
        } else {
            this.ghostAvatarImg.classList.remove('focused');
        }
    }

    updateAvatarPosition() {
        const userProfile = document.querySelector('.user-profile');
        const lockscreenContainer = document.querySelector('.lockscreen-container');
        // Maintain avatar mode regardless of current focus
        const isGhostMode = this.focusedAvatarIndex === 1;
        
        if (isGhostMode) {
            userProfile.classList.add('ghost-focused');
            lockscreenContainer.classList.add('ghost-focused');
        } else {
            userProfile.classList.remove('ghost-focused');
            lockscreenContainer.classList.remove('ghost-focused');
        }
    }

    updateGameImages() {
        const isGhostMode = this.focusedAvatarIndex === 1;
        
        // Update which set of game tiles we're using for navigation
        if (isGhostMode) {
            this.gameImages = this.ghostGames;
            this.gameTiles = this.ghostGameTiles.querySelectorAll('.game-tile');
        } else {
            this.gameImages = this.tenArcherGames;
            this.gameTiles = this.tenarcherGameTiles.querySelectorAll('.game-tile');
        }
        
        // Update positioning classes based on current mode
        if (isGhostMode) {
            // Ghost mode: Ghost centered, TenArcher left
            this.tenarcherGameTiles.className = 'game-tiles tenarcher-inactive';
            this.ghostGameTiles.className = 'game-tiles ghost-active';
        } else {
            // TenArcher mode: TenArcher centered, Ghost right
            this.tenarcherGameTiles.className = 'game-tiles tenarcher-active';
            this.ghostGameTiles.className = 'game-tiles ghost-inactive';
        }
        
        // Update focus states for the active game tiles
        this.gameTiles.forEach((tile, index) => {
            const gameImg = tile.querySelector('.game-image');
            if (gameImg && this.gameImages[index]) {
                const isFocused = this.currentFocus === 'games' && this.focusedGameIndex === index;
                const gameData = this.gameImages[index];
                gameImg.src = isFocused ? gameData.focus : gameData.normal;
                
                // Add/remove focused class for scaling effect
                if (isFocused) {
                    tile.classList.add('focused');
                } else {
                    tile.classList.remove('focused');
                }
            }
        });
    }
    
    previousGame() {
        do {
            this.focusedGameIndex = this.focusedGameIndex <= 0 ? this.gameTiles.length - 1 : this.focusedGameIndex - 1;
        } while (this.gameImages[this.focusedGameIndex] === null); // Skip non-interactive tiles
    }
    
    nextGame() {
        do {
            this.focusedGameIndex = (this.focusedGameIndex + 1) % this.gameTiles.length;
        } while (this.gameImages[this.focusedGameIndex] === null); // Skip non-interactive tiles
    }
    
    previousPin() {
        this.focusedPinIndex = Math.max(0, this.focusedPinIndex - 1);
    }
    
    nextPin() {
        this.focusedPinIndex = Math.min(3, this.focusedPinIndex + 1);
        
        // Simulate PIN entry - when moving right, fill the previous dot
        if (this.focusedPinIndex > this.pinInput.length) {
            // Add a digit to simulate entry (using the position as the digit)
            this.pinInput += (this.focusedPinIndex).toString();
            this.updatePinDisplay();
            
            if (this.pinInput.length === 4) {
                this.checkPin();
            }
        }
    }

    previousAvatar() {
        this.focusedAvatarIndex = this.focusedAvatarIndex === 0 ? 1 : 0; // Toggle between 0 and 1
    }

    nextAvatar() {
        this.focusedAvatarIndex = this.focusedAvatarIndex === 0 ? 1 : 0; // Toggle between 0 and 1
    }
    
    selectGame() {
        const selectedTile = this.gameTiles[this.focusedGameIndex];
        console.log('Selected game tile:', this.focusedGameIndex);
        // Add game selection logic here
        
        // For demo, if it's the download tile, show some feedback
        if (selectedTile.classList.contains('download-tile')) {
            this.showDownloadFeedback();
        }
    }
    
    addPinDigit(digit) {
        if (this.pinInput.length < 4) {
            this.pinInput += digit;
            this.updatePinDisplay();
            
            if (this.pinInput.length === 4) {
                this.checkPin();
            }
        }
    }
    
    addPinWithSpacebar() {
        if (this.pinInput.length < 4) {
            // Add a digit based on current focused pin position (1-4)
            const digitToAdd = (this.focusedPinIndex + 1).toString();
            this.pinInput += digitToAdd;
            this.updatePinDisplay();
            
            // Move to next pin if not on the last one
            if (this.focusedPinIndex < 3) {
                this.focusedPinIndex++;
                this.updateFocus();
            }
            
            // Check PIN if we've filled all 4 digits
            if (this.pinInput.length === 4) {
                this.checkPin();
            }
        }
    }
    
    removePinDigit() {
        if (this.pinInput.length > 0) {
            this.pinInput = this.pinInput.slice(0, -1);
            this.updatePinDisplay();
        }
    }
    
    updatePinDisplay() {
        this.pinDots.forEach((dot, index) => {
            if (index < this.pinInput.length) {
                dot.src = 'assets/lockscreen/pin_fill.png';
            } else {
                dot.src = 'assets/lockscreen/pin.png';
            }
        });
        
        // Reapply focus state if PIN is currently focused
        if (this.currentFocus === 'pin') {
            this.updateFocus();
        }
    }
    
    checkPin() {
        if (this.pinInput === this.correctPin) {
            this.unlockDevice();
        } else {
            this.showPinError();
        }
    }
    
    unlockDevice() {
        console.log('🔓 Device unlocked!');
        // Clear global lockscreen flag
        window.lockscreenActive = false;
        
        // Add unlock animation
        this.lockscreenElement.style.opacity = '0';
        this.lockscreenElement.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            this.lockscreenElement.style.display = 'none';
            this.appElement.style.display = 'flex';
        }, 500);
    }
    
    showPinError() {
        console.log('❌ Incorrect PIN');
        // Add error animation
        const pinSection = document.querySelector('.pin-section');
        pinSection.style.animation = 'shake 0.5s ease-in-out';
        
        // Reset PIN after error
        setTimeout(() => {
            this.pinInput = '';
            this.updatePinDisplay();
            pinSection.style.animation = '';
        }, 1000);
    }
    
    showDownloadFeedback() {
        console.log('📥 Download initiated');
        // Add visual feedback for download
        const downloadTile = document.querySelector('.download-tile');
        downloadTile.style.background = 'rgba(76, 175, 80, 0.5)';
        setTimeout(() => {
            downloadTile.style.background = 'rgba(76, 175, 80, 0.2)';
        }, 300);
    }
    
    updateFocus() {
        // Update avatar image based on focus
        this.updateAvatarImage();
        this.updateGhostAvatarImage();
        this.updateUsernameImage();
        this.updateAvatarPosition();
        this.updateGameImages();
        
        // Handle PIN focus
        this.pinDots.forEach(dot => dot.classList.remove('focused'));
        if (this.currentFocus === 'pin') {
            // Focus on the specific PIN index
            if (this.pinDots[this.focusedPinIndex]) {
                this.pinDots[this.focusedPinIndex].classList.add('focused');
                this.pinDots[this.focusedPinIndex].src = 'assets/lockscreen/pin_focus.png';
            }
            
            // Set other PIN dots to their appropriate states
            this.pinDots.forEach((dot, index) => {
                if (index !== this.focusedPinIndex) {
                    if (index < this.pinInput.length) {
                        dot.src = 'assets/lockscreen/pin_fill.png';
                    } else {
                        dot.src = 'assets/lockscreen/pin.png';
                    }
                }
            });
        } else {
            // When not focused on PIN, show normal states
            this.pinDots.forEach((dot, index) => {
                if (index < this.pinInput.length) {
                    dot.src = 'assets/lockscreen/pin_fill.png';
                } else {
                    dot.src = 'assets/lockscreen/pin.png';
                }
            });
        }
    }
    
    playNavSound() {
        // Play navigation sound if available
        console.log('Attempting to play nav sound, window.navAudio:', !!window.navAudio);
        if (window.navAudio) {
            window.navAudio.currentTime = 0;
            window.navAudio.play().catch(e => console.log('Audio play failed:', e));
        } else {
            console.log('nav.mp3 audio not loaded');
        }
    }
    
    playSelectSound() {
        // Play selection sound if available
        console.log('Attempting to play carousel sound, window.carouselAudio:', !!window.carouselAudio);
        if (window.carouselAudio) {
            window.carouselAudio.currentTime = 0;
            window.carouselAudio.play().catch(e => console.log('Audio play failed:', e));
        } else {
            console.log('carousel.mp3 audio not loaded');
        }
    }
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Initialize lockscreen when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to ensure other scripts have loaded
    setTimeout(() => {
        window.lockscreenManager = new LockscreenManager();
        console.log('🔒 Lockscreen initialized');
        console.log('Navigation: Arrow keys, Enter to select, Numbers for PIN');
        console.log('Demo PIN: 1234');
    }, 100);
});