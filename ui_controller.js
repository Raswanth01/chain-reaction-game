// ui_controller.js

function createGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    grid.innerHTML = ""; // Clear existing grid
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 6; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            
            // Add data attributes for easier JS access
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            grid.appendChild(cell);
        }
    }
}

function updateVisuals() {
    // We iterate through the board state
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 6; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            if (!cell) continue;

            const data = gameState.board[r][c];
            
            // 1. Clear the cell (dots only)
            cell.innerHTML = "";
            
            // 2. Refresh basic cell class (removes old player-owner classes if you had them)
            cell.className = 'cell'; 

            // 3. Re-apply Portal Glow if in Hacker Mode
            if (gameState.currentMode === 'hacker' && gameState.portals) {
                const isPortal = gameState.portals.find(p => p.entry.r === r && p.entry.c === c);
                if (isPortal) cell.classList.add('portal-cell');
            }

            // 4. Draw Dots
            if (data.count > 0) {
                for (let i = 1; i <= data.count; i++) {
                    const dot = document.createElement('div');
                    
                    // Assign classes for CSS to handle positioning and color
                    dot.className = `dot ${data.owner === 1 ? 'p1-dot' : 'p2-dot'} dot-${i}-of-${data.count}`;
                    
                    // CRITICAL: Prevent the dot from stealing the click from the cell
                    dot.style.pointerEvents = 'none';
                    
                    cell.appendChild(dot);
                }
            }
        }
    }
    // Update the scoreboard with the cumulative logic
    updateScoreUI();
}

function updateScoreUI() {
    const scoreBoard = document.getElementById('score-board');
    if (scoreBoard) {
        // This uses the cumulative scores from gameState.scores
        scoreBoard.innerText = `P1: ${gameState.scores.player1} | P2: ${gameState.scores.player2}`;
    }
}

function updateTimerUI() {
    const gameTimerEl = document.getElementById('game-timer');
    const turnTimerEl = document.getElementById('turn-timer');

    if (gameTimerEl) {
        const min = Math.floor(gameState.totalTime / 60);
        const sec = gameState.totalTime % 60;
        gameTimerEl.innerText = `Total: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
    
    if (turnTimerEl) {
        turnTimerEl.innerText = `Turn: ${gameState.turnTime}`;
    }
}

// Build the grid structure once immediately
createGrid();