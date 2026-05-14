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
                const portal = gameState.portals.find(p => p.entry.r === r && p.entry.c === c);
                if (portal) {
                    cell.classList.add(portal.type === 'a' ? 'portal-a' : 'portal-b');
                }
            }

            // 4. Draw Dots
            if (data.count > 0) {
                for (let i = 1; i <= data.count; i++) {
                    const dot = document.createElement('div');
                    
                    // Assign classes for CSS to handle positioning and color
                    dot.className = `dot p${data.owner}-dot dot-${i}-of-${data.count}`;
                    
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

// ui_controller.js

function updateScoreUI() {
    const scoreBoard = document.getElementById('score-board');
    if (!scoreBoard) return;

    // 1. LEADERBOARD LOGIC: Rank players by score
    let rankings = [];
    for (let i = 1; i <= gameState.totalPlayers; i++) {
        rankings.push({ id: i, score: gameState.scores[i] });
    }
    rankings.sort((a, b) => b.score - a.score); // Highest score first

    scoreBoard.innerHTML = ''; 
    rankings.forEach((player, index) => {
        const badge = document.createElement('div');
        // Standardize the class to match your style.css
        badge.className = `leader-rank ${gameState.currentPlayer === player.id ? 'active-player' : ''}`;
        badge.style.borderLeft = `3px solid ${gameState.playerColors[player.id]}`;
        
        // Use the "isPlayerWipedOut" logic from our engine discussion
        const isDead = isPlayerWipedOut(player.id);
        if (isDead) badge.style.opacity = "0.3";

        badge.innerHTML = `<span>#${index + 1} Player ${player.id}</span> <span>${player.score}</span>`;
        scoreBoard.appendChild(badge);
    });

    // 2. INVENTORY LOGIC: Update the Left Sidebar counts
for (let i = 1; i <= 4; i++) {
    const invEl = document.getElementById(`p${i}-inv`);
    if (invEl) {
        const b = gameState.inventory[i].bomb;
        const s = gameState.inventory[i].swap;
        
        // Use innerHTML so the emojis render correctly
        invEl.innerHTML = `P${i}: 💣 ${b} | 🔄 ${s}`;
        
        // Highlight the current player's inventory
        invEl.classList.toggle('active-inv', gameState.currentPlayer === i);
        
        // Hide extra players
        invEl.classList.toggle('hidden', i > gameState.totalPlayers);
    }
}

// 3. BOMB BUTTON LOGIC
const bombBtn = document.getElementById('bomb-action-btn');
if (bombBtn) {
    const hasBombs = gameState.inventory[gameState.currentPlayer].bomb > 0;
    bombBtn.classList.toggle('power-available', hasBombs);
    bombBtn.disabled = !hasBombs;
    bombBtn.classList.toggle('power-selected', gameState.activePowerUp === 'bomb');
}

// 4. SWAP BUTTON LOGIC: Adding the Mirror Logic for Swap
const swapBtn = document.getElementById('swap-action-btn');
if (swapBtn) {
    const hasSwaps = gameState.inventory[gameState.currentPlayer].swap > 0;
    
    // Wake up the swap button if they hit 7-chain + 500 score
    swapBtn.classList.toggle('power-available', hasSwaps);
    swapBtn.disabled = !hasSwaps;

    // Highlight if selected for targeting
    swapBtn.classList.toggle('power-selected', gameState.activePowerUp === 'swap');
}
}



// ... keep your other functions like updateTurnDisplay and updateTimerUI ...

function updateTimerUI() {
    const gameTimerEl = document.getElementById('game-timer');
    const turnTimerEl = document.getElementById('turn-timer');

    if (gameTimerEl) {
        // VS Code needs 'min' to be declared here
        const min = Math.floor(gameState.totalTime / 60); 
        const sec = gameState.totalTime % 60;
        gameTimerEl.innerText = `Total Time: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
    
    if (turnTimerEl) {
        turnTimerEl.innerText = `Turn Time: ${gameState.turnTime}`;
        
        // Add the multiplayer color logic
        if (gameState.turnTime <= 5) {
            turnTimerEl.style.color = "#ff3131";
        } else {
            turnTimerEl.style.color = "var(--neon-cyan)";
        }
    }
}

function updateTurnDisplay() {
    const turnDisplay = document.getElementById('player-indicators');
    if (!turnDisplay) return;

    // Get the color of the current player from your gameState
    const color = gameState.playerColors[gameState.currentPlayer];
    
    // Update text and color
    turnDisplay.innerText = `TURN: PLAYER ${gameState.currentPlayer}`;
    turnDisplay.style.color = color;
    turnDisplay.style.borderColor = color;
    turnDisplay.style.boxShadow = `0 0 10px ${color}`;
}

function selectPowerUp(type) {
    // If they already clicked the grid, the sidebar should be locked
    if (gameState.hasMovedThisTurn) return; 

    const p = gameState.currentPlayer;
    if (gameState.inventory[p][type] > 0) {
        gameState.activePowerUp = (gameState.activePowerUp === type) ? null : type;
        updateScoreUI();
    }
}

// Build the grid structure once immediately
createGrid();