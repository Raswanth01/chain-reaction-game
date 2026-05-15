document.addEventListener('DOMContentLoaded', () => {

    // --- THE AUDIO UNLOCKER ---
    const unlockAudio = () => {
        if (gameState.bgm.paused) {
            gameState.bgm.play()
                .then(() => {
                    console.log("BGM Started successfully");
                    // Once playing, remove these listeners so they don't keep firing
                    document.removeEventListener('mousedown', unlockAudio);
                    document.removeEventListener('touchstart', unlockAudio);
                })
                .catch(e => console.log("Audio still blocked:", e));
        }
    };

    // Listen for any interaction anywhere on the page
    document.addEventListener('mousedown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio); // For mobile taps
    

    // --- 1. MAIN MENU NAVIGATION ---
    const normalBtn = document.getElementById('normal-mode-btn');
    if (normalBtn) {
        normalBtn.onclick = () => {
            unlockAudio(); // For safety
            startGame('normal'); 
        };
    }

    const hackerBtn = document.getElementById('hacker-mode-btn');
    if (hackerBtn) {
        hackerBtn.onclick = () => {
            unlockAudio(); // For safety
            startGame('hacker');
        };
    }

    const backBtn = document.getElementById('back-to-menu');
    if (backBtn) {
        backBtn.onclick = () => {
            if (confirm("Exit to menu? Scores will be saved but board cleared.")) {
                exitToMenu();
            }
        };
    }

    // --- 2. THE CLICK FIX (GLOBAL DELEGATION) ---
document.body.addEventListener('click', (e) => {
    // 1. Identify if the click was on a cell
    const cell = e.target.closest('.cell');
    if (!cell) return;

    // 2. THE HARD PAUSE CHECK 
    if (gameState.isPaused) {
        window.alert("SYSTEM PAUSED: Please resume the game to continue.");
        return; // This stops the code immediately
    }

    // 3. Other technical safety checks
    if (!gameState.gameStarted || gameState.activeAnimations > 0) {
        return;
    }

    // 4. Extract coordinates
    const parts = cell.id.split('-');
    const r = parseInt(parts[1]);
    const c = parseInt(parts[2]);

    // 5. OPPONENT CELL CHECK
    const cellData = gameState.board[r][c];
    const currentPlayer = gameState.currentPlayer;

    if (cellData.owner !== null && cellData.owner !== currentPlayer) {
        // Block unless using a bomb
        if (gameState.activePowerUp !== 'bomb') {
            window.alert("ACCESS DENIED: You cannot click on an opponent's cell!");
            return; 
        }
    }
    
    handleMove(r, c);
});

    // --- 3. CONTROL PANEL ---
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.onclick = () => {
            togglePause(); 
        };
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("Are you sure? This resets the board and cumulative scores.")) {
                
                resetGame();
            }
        };
    }
});

/**
 * Helper to ensure audio works on mobile/Chrome
 */
function unlockAudio() {
    if (gameState.bgm && gameState.bgm.paused) {
        gameState.bgm.play().catch(() => console.log("Audio waiting for user interaction"));
    }
}
