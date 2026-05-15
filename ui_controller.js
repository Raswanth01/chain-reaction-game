// ui_controller.js

function createGrid() {
    const grid = document.getElementById('grid');
    if (!grid) return; // Safety check to prevent errors if the element is missing
    grid.innerHTML = ""; // Clear existing grid
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 6; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`; 
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
            if (!cell) continue; // Safety check in case of missing cell (shouldn't happen if createGrid works correctly)

            const data = gameState.board[r][c];
            
            // 1. Clear the cell (dots only)
            cell.innerHTML = "";
            
            // 2. Refresh basic cell class (removes old player-owner classes if you had them)
            cell.className = 'cell'; 

            // 3. Re-apply Portal Glow if in Hacker Mode
            if (gameState.currentMode === 'hacker' && gameState.portals) {
                const portal = gameState.portals.find(p => p.entry.r === r && p.entry.c === c);
                if (portal) {
                    cell.classList.add(`portal-${portal.type}`);
                }
            }

            // 4. Draw Dots
            if (data.count > 0) {
                for (let i = 1; i <= data.count; i++) {
                    const dot = document.createElement('div');
                    
                    // Assign classes for CSS to handle positioning and color
                    dot.className = `dot p${data.owner}-dot dot-${i}-of-${data.count}`;                    
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
    if (!scoreBoard) return; // Safety check to prevent errors if the element is missing

    // 1. LEADERBOARD LOGIC: Rank players by score
    let rankings = [];
    for (let i = 1; i <= gameState.totalPlayers; i++) {
        rankings.push({ id: i, score: gameState.scores[i] });
    }
    rankings.sort((a, b) => b.score - a.score); // Highest score first

    scoreBoard.innerHTML = ''; // Clear existing scores
    rankings.forEach((player, index) => {
        const badge = document.createElement('div');
        
        badge.className = `leader-rank ${gameState.currentPlayer === player.id ? 'active-player' : ''}`;
        badge.style.borderLeft = `3px solid ${gameState.playerColors[player.id]}`;
        
        const isDead = isPlayerWipedOut(player.id);
        const isTimedOut = gameState.inactivePlayers.includes(player.id);
        if (isDead || isTimedOut) badge.style.opacity = "0.3";

        badge.innerHTML = `<span>${player.id} #${index + 1} </span> <span>Score ${player.score}</span>`;
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
    swapBtn.classList.toggle('power-available', hasSwaps);
    swapBtn.disabled = !hasSwaps;
    swapBtn.classList.toggle('power-selected', gameState.activePowerUp === 'swap');
}
}


function updateTimerUI() {
    const gameTimerEl = document.getElementById('game-timer');
    const turnTimerEl = document.getElementById('turn-timer');

    if (gameTimerEl) {
        
        const min = Math.floor(gameState.totalTime / 60); 
        const sec = gameState.totalTime % 60;
        gameTimerEl.innerText = `Total Time: ${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
    
    if (turnTimerEl) {
        turnTimerEl.innerText = `Turn Time: ${gameState.turnTime}`;
        
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

    const color = gameState.playerColors[gameState.currentPlayer];
    
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
        updateScoreUI(); // To refresh button states

    }
}

function logMove(message) {
    const log = document.getElementById('move-history-log');
    if (!log) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    // Get current game time for the timestamp
    const min = Math.floor(gameState.totalTime / 60);
    const sec = gameState.totalTime % 60;
    const timestamp = `[${min}:${sec < 10 ? '0' : ''}${sec}]`;

    entry.innerHTML = `<span class="log-time">${timestamp}</span> ${message}`;
    
    // Add to the top of the log
    log.prepend(entry);
}

// Build the grid structure once immediately
createGrid();