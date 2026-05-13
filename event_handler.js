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
    const normalBtn = document.querySelector('.menu-btn:not(.hacker-btn)');
    if (normalBtn) {
        normalBtn.onclick = () => {
            unlockAudio(); // Important for mobile browsers
            startGame('normal');
        };
    }

    const hackerBtn = document.querySelector('.hacker-btn');
    if (hackerBtn) {
        hackerBtn.onclick = () => {
            unlockAudio();
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
    // Instead of grabbing '#grid' specifically, we listen to the whole body.
    // This is the most reliable way to ensure clicks are never "lost".
    document.body.addEventListener('click', (e) => {
        // 1. Check if the click was on a cell or inside a cell
        const cell = e.target.closest('.cell');
        if (!cell) return;

        // 2. Safety checks
        if (!gameState.gameStarted || gameState.isPaused || gameState.activeAnimations > 0) {
            return;
        }

        // 3. Extract coordinates
        const parts = cell.id.split('-');
        const r = parseInt(parts[1]);
        const c = parseInt(parts[2]);

        // 4. Trigger the logic
        console.log(`Cell Clicked: ${r}, ${c}`); // Debug log to verify fix
        handleMove(r, c);
    });

    // --- 3. CONTROL PANEL ---
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.onclick = () => {
            togglePause(); // Ensure this function is in your game_engine.js
        };
    }

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm("Are you sure? This resets the board and cumulative scores.")) {
                // Manually reset cumulative scores here if resetGame() doesn't do it
                gameState.scores.player1 = 0;
                gameState.scores.player2 = 0;
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
