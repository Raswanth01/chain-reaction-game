// --- 1. HANDLE MOVE (The Trigger) ---
function handleMove(r, c) {
    
    // 1. COMBINED LOCK: Don't allow move if paused, game over, or dots are flying
    if (gameState.isGameOver || gameState.isPaused || gameState.activeAnimations > 0) {
        return; 
    }

    const cellData = gameState.board[r][c];

    // --- THE NEW FIRST-MOVE LOGIC ---
    const isFirst = (gameState.currentPlayer === 1) ? gameState.firstMove.player1 : gameState.firstMove.player2;

    if (isFirst) {
        // Set count to capacity - 1
        cellData.count = cellData.capacity - 1;
        
        // Consume the first move flag
        if (gameState.currentPlayer === 1) gameState.firstMove.player1 = false;
        else gameState.firstMove.player2 = false;
        
        // Update score based on how many dots we just placed
        // (You might need to loop addPoint or update addPoint to take a value)
        for(let i = 0; i < cellData.count; i++) addPoint(gameState.currentPlayer);
    } else {
        // Normal turn: just add one
        cellData.count++;
        addPoint(gameState.currentPlayer);
    }
    // -------------------------------

    // 2. OWNERSHIP CHECK: (The part you accidentally deleted)
    // Only allow move if cell is empty (null) OR owned by the current player
    if (cellData.owner !== null && cellData.owner !== gameState.currentPlayer) {
        alert("Not your cell!");
        return; 
    }

    // --- TRIGGER PLACE SOUND ---
    gameState.sounds.place.currentTime = 0; 
    gameState.sounds.place.play();
    // ---------------------------

    // 3. APPLY MOVE DATA
    
    cellData.owner = gameState.currentPlayer;
     

    // 4. TRIGGER EXPLOSION
    if (cellData.count >= cellData.capacity) {
        explode(r, c, gameState.currentPlayer);
    }

    // 5. SYNC UI & SWITCH TURN
    updateVisuals();
    // If no explosion was triggered, switch turns immediately
    if (gameState.activeAnimations === 0) {
        gameState.currentPlayer = (gameState.currentPlayer === 1) ? 2 : 1;
        gameState.turnTime = 15;
    }
    
}


// --- 2. EXPLODE (The Tree Logic) ---
// game_engine.js
async function explode(r, c, attacker) {
    if (gameState.isGameOver) return;

    // --- TRIGGER EXPLOSION SOUND ---
    // Resetting to 0 is CRITICAL for chain reactions
    gameState.sounds.explode.currentTime = 0; 
    gameState.sounds.explode.play();
    // -------------------------------
    
    const cellData = gameState.board[r][c];
    const originCell = document.getElementById(`cell-${r}-${c}`);
    if (!originCell) return;

    // 1. DATA CLEAR: Do this first so the logic knows the cell is empty
    cellData.count = 0;
    cellData.owner = null;

    const neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];

    neighbors.forEach(([nr, nc]) => {
        if (nr >= 0 && nr < 12 && nc >= 0 && nc < 6) {
            const targetCell = document.getElementById(`cell-${nr}-${nc}`);
            
            gameState.activeAnimations++;
            createFlyingDot(originCell, targetCell, attacker);

            setTimeout(() => {
                if (gameState.isGameOver) return;

                const neighborData = gameState.board[nr][nc];
                neighborData.owner = attacker;
                neighborData.count++; // FILLING THE CELL DATA
                
                addPoint(attacker);
                
                // 2. UI UPDATE: This draws the dots in the NEW cell
                updateVisuals(); 

                if (neighborData.count >= neighborData.capacity) {
                    explode(nr, nc, attacker);
                }

                gameState.activeAnimations--;
                if (gameState.activeAnimations <= 0) {
                    gameState.activeAnimations = 0;
                    checkWipeout();

                    if (!gameState.isGameOver) {
                        gameState.currentPlayer = (gameState.currentPlayer === 1) ? 2 : 1;
                        gameState.turnTime = 15; 
                        updateTimerUI();}
                }
            }, 300); // Wait for the "Ghost Dot" to arrive
        }
    });

    // 3. UI CLEAR: Remove the old dots from the source cell
    originCell.innerHTML = ""; 
}

function createFlyingDot(fromEl, toEl, player) {
    const dot = document.createElement('div');
    dot.className = `ghost-dot ${player === 1 ? 'p1-dot' : 'p2-dot'}`;
    const start = fromEl.getBoundingClientRect();
    const end = toEl.getBoundingClientRect();

    dot.style.left = `${start.left + 15}px`;
    dot.style.top = `${start.top + 15}px`;
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            dot.style.left = `${end.left + 15}px`;
            dot.style.top = `${end.top + 15}px`;
        });
    });

    setTimeout(() => {
        if (dot.parentNode) dot.remove();
    }, 350); // Slightly after the 300ms transition
}

// --- 4. CHECK WIPEOUT (The Judge) ---
function checkWipeout() {
    // 1. If dots are still flying, don't judge yet!
    if (gameState.activeAnimations > 0) return;

    let p1Dots = 0;
    let p2Dots = 0;

    // Scan the board
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 6; c++) {
            if (gameState.board[r][c].owner === 1) p1Dots++;
            if (gameState.board[r][c].owner === 2) p2Dots++;
        }
    }

    // 2. BETTER CHECK: Has each player at least MADE a move?
    // We check the scores we added in addPoint()
    const p1Started = gameState.scores.player1 > 0;
    const p2Started = gameState.scores.player2 > 0;

    if (p1Started && p2Started) {
        if (p1Dots > 0 && p2Dots === 0) {
            endGame("Red Domination! Player 1 Wins!");
        } else if (p2Dots > 0 && p1Dots === 0) {
            endGame("Blue Victory! Player 2 Wins!");
        }
    }
}

function addPoint(player) {
    if (player === 1) gameState.scores.player1++;
    else gameState.scores.player2++;
    
    // Update the UI text immediately
    const scoreBoard = document.getElementById('score-board');
    if (scoreBoard) {
        scoreBoard.innerText = `Player 1: ${gameState.scores.player1} | Player 2: ${gameState.scores.player2}`;
    }
}

// Inside your cell click listener or a "Start Game" button
function unlockAudio() {
    if (gameState.bgm.paused) {
        gameState.bgm.play().catch(error => {
            console.log("Audio waiting for user interaction...");
        });
    }
}


function endGame(message) {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    gameState.isPaused = true;
    
    // FORCE UNLOCK
    gameState.activeAnimations = 0; 

    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    updateVisuals();
    gameState.bgm.pause();
    gameState.sounds.win.currentTime = 0;
    gameState.sounds.win.play();


    setTimeout(() => {
        alert(message);
    }, 800);
}