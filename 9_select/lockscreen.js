// Lockscreen functionality for ASUS ROG Ally prototype
class LockscreenManager {
    constructor() {
        this.currentFocus = 'avatar'; // avatar, games
        this.focusedGameIndex = 0; // Start with first interactive game
        this.usernameIndex = 0; // 0 = tenarcher_name, 1 = ghost_name
        this.focusedAvatarIndex = 0; // 0 = tenarcher, 1 = ghost
        this.lastUsernameIndex = 0; // Track previous username mode for crossfade detection
        
        // Hold to unlock functionality
        this.isHolding = false;
        this.holdProgress = 0;
        this.holdDuration = 1500; // 1.5 seconds to unlock
        this.holdStartTime = 0;
        this.holdAnimationFrame = null;
        
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
        this.tenarcherGameTiles = document.getElementById('tenarcher-games');
        this.ghostGameTiles = document.getElementById('ghost-games');
        this.gameTiles = this.tenarcherGameTiles.querySelectorAll('.game-tile'); // Default to TenArcher tiles for navigation
        this.holdProgressBar = document.getElementById('hold-progress-bar');
        
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
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        console.log('Lockscreen handling key:', e.key);
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to main
        
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
                this.handleSelect();
                break;
            case 'Escape':
                this.handleBack();
                break;
            case 'y':
            case 'Y':
                if (!this.isHolding) {
                    this.startHolding();
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        switch (e.key) {
            case 'y':
            case 'Y':
                if (this.isHolding) {
                    this.stopHolding();
                }
                break;
        }
    }
    
    navigateUp() {
        if (this.currentFocus === 'games') {
            this.currentFocus = 'avatar';
        }
        this.updateFocus();
        this.playLockscreenNavSound(); // Use lockscreen-specific navigation sound
    }
    
    navigateDown() {
        if (this.currentFocus === 'avatar') {
            this.currentFocus = 'games';
        }
        this.updateFocus();
        this.playLockscreenNavSound(); // Use lockscreen-specific navigation sound
    }
    
    navigateLeft() {
        if (this.currentFocus === 'games') {
            this.previousGame();
            this.updateFocus();
            this.playLockscreenNavSound(); // Use lockscreen-specific navigation sound
        } else if (this.currentFocus === 'avatar') {
            this.previousAvatar();
            this.updateFocus();
            this.playLockscreenNavSound(); // Use lockscreen-specific navigation sound
        }
    }
    
    navigateRight() {
        if (this.currentFocus === 'games') {
            this.nextGame();
            this.updateFocus();
            this.playLockscreenNavSound(); // Use lockscreen-specific navigation sound
        } else if (this.currentFocus === 'avatar') {
            this.nextAvatar();
            this.updateFocus();
            this.playLockscreenNavSound(); // Use lockscreen-specific navigation sound
        }
    }
    
    handleSelect() {
        if (this.currentFocus === 'avatar') {
            // Avatar selection now unlocks the device directly
            this.unlockDevice();
        } else if (this.currentFocus === 'games') {
            this.selectGame();
        }
    }
    
    handleBack() {
        // Can add any general back functionality here if needed
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
        
        // For now, any game selection unlocks the device
        this.unlockDevice();
    }
    
    startHolding() {
        console.log('Started holding Y button');
        this.isHolding = true;
        this.holdStartTime = Date.now();
        this.holdProgress = 0;
        this.updateProgressBar();
        this.animateHoldProgress();
    }
    
    stopHolding() {
        console.log('Stopped holding Y button');
        this.isHolding = false;
        if (this.holdAnimationFrame) {
            cancelAnimationFrame(this.holdAnimationFrame);
            this.holdAnimationFrame = null;
        }
        // Reset progress bar
        this.holdProgress = 0;
        this.updateProgressBar();
    }
    
    animateHoldProgress() {
        if (!this.isHolding) return;
        
        const elapsed = Date.now() - this.holdStartTime;
        this.holdProgress = Math.min(elapsed / this.holdDuration, 1);
        
        this.updateProgressBar();
        
        if (this.holdProgress >= 1) {
            // Hold complete - unlock device
            console.log('Hold to unlock complete!');
            this.unlockDevice();
        } else {
            // Continue animation
            this.holdAnimationFrame = requestAnimationFrame(() => this.animateHoldProgress());
        }
    }
    
    updateProgressBar() {
        if (this.holdProgressBar) {
            const progressPercent = this.holdProgress * 100;
            this.holdProgressBar.style.width = `${progressPercent}%`;
            // Progress bar fill is always 100% opacity white
            this.holdProgressBar.style.backgroundColor = `rgba(255, 255, 255, 1)`;
        }
    }
    
    unlockDevice() {
        console.log('🔓 Device unlocked!');
        // Clear global lockscreen flag
        window.lockscreenActive = false;
        
        // Set background to Halo when transitioning to main
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            // Clear any existing background classes
            gameContainer.className = gameContainer.className.replace(/bg-\w+/g, '');
            // Add Halo background class
            gameContainer.classList.add('bg-halo');
        }
        
        // Simple immediate switch
        this.lockscreenElement.style.display = 'none';
        this.appElement.style.display = 'flex';
        
        // Initialize main interface
        if (window.initializeMain) {
            window.initializeMain();
        }
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
    }
    
    playLockscreenNavSound() {
        // Silent navigation for lockscreen - nav.mp3 should only be used for main navigation bar
        // Lockscreen uses its own visual feedback and doesn't need audio navigation sounds
        return;
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
    
}

// Initialize lockscreen when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to ensure other scripts have loaded
    setTimeout(() => {
        window.lockscreenManager = new LockscreenManager();
        console.log('🔒 Lockscreen initialized');
        console.log('Navigation: Arrow keys, Enter to select avatar or games to unlock');
    }, 100);
});