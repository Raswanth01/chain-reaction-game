function startGame(mode) {
    gameState.currentMode = mode;
    gameState.gameStarted = true;
    gameState.isPaused = false;
    
    // Switch screens first so the UI is ready for updateScoreUI()
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    if (mode === 'hacker') {
        generateRandomPortals();
    } else {
        gameState.portals = [];
    }
    const btn = document.getElementById('pause-btn');
    if (btn) btn.innerText = "Pause";

    resetGame();
}

function resetGame() {
    if (gameState.isPaused) {
        togglePause();
    }
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    gameState.totalTime = 300;
    gameState.turnTime = 20;
    gameState.currentPlayer = 1;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.activeAnimations = 0;
    gameState.firstMove = { 1: true, 2: true, 3: true, 4: true };
    gameState.scores = { 1: 0, 2: 0, 3: 0, 4: 0 };
    gameState.hasMovedThisTurn = false; // Unlock the grid
    gameState.activePowerUp = null;     // Clear any active bomb targeting
    gameState.chainCount = 0;           // Reset the bomb reward counter
    gameState.inactivePlayers = [];
    // Handle Hacker Mode transitions
    if (gameState.currentMode === 'hacker') {
        generateRandomPortals(); 
    } else {
        gameState.portals = [];
    }
    // 2. Clear the data in the inventory object
    gameState.inventory = {
        1: { bomb: 0, swap: 0 },
        2: { bomb: 0, swap: 0 },
        3: { bomb: 0, swap: 0 },
        4: { bomb: 0, swap: 0 }
    };
    const log = document.getElementById('move-history-log');
    if (log) log.innerHTML = "";
    initializeBoardData(); // Rebuilds the grid array
    updateVisuals();       // Clears dots from cells
    updateTimerUI();       // Resets the timer display
    startTimers();         // Starts the game clock and turn timer
    updateScoreUI();       // Resets scores and inventory display
    updateTurnDisplay();   // Dynamically creates the score badges
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    const btn = document.getElementById('pause-btn');
    btn.innerText = gameState.isPaused ? "Resume" : "Pause";
    if (gameState.isPaused) gameState.bgm.pause();
    else gameState.bgm.play();
}

function exitToMenu() {
    gameState.isPaused = true;
    gameState.bgm.play();
    gameState.gameStarted = false;
    clearInterval(gameState.timerInterval);
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function generateRandomPortals() {
    const rand = (max) => Math.floor(Math.random() * max);
    const getUniquePos = (existing) => {
        let pos;
        do {
            pos = { r: rand(12), c: rand(6) };
        } while (existing.some(p => p.r === pos.r && p.c === pos.c));
        return pos;
    };

    let used = [];
    
    // Pair 1 (Set A)
    const a1 = getUniquePos(used); used.push(a1);
    const a2 = getUniquePos(used); used.push(a2);
    
    // Pair 2 (Set B)
    const b1 = getUniquePos(used); used.push(b1);
    const b2 = getUniquePos(used); used.push(b2);


    gameState.portals = [
        { entry: a1, exit: a2, type: 'a' },
        { entry: a2, exit: a1, type: 'a' },
        { entry: b1, exit: b2, type: 'b' },
        { entry: b2, exit: b1, type: 'b' },
    ];

    if (gameState.totalPlayers > 2) {
        // Pair 3 (Set C)
        const c1 = getUniquePos(used); used.push(c1);
        const c2 = getUniquePos(used); used.push(c2);
        gameState.portals.push(
            { entry: c1, exit: c2, type: 'c' },
            { entry: c2, exit: c1, type: 'c' }
        );
    }
    if(gameState.totalPlayers > 3) {
        // Pair 4 (Set D)
        const d1 = getUniquePos(used); used.push(d1);
        const d2 = getUniquePos(used); used.push(d2);
        gameState.portals.push(
            { entry: d1, exit: d2, type: 'd' },
            { entry: d2, exit: d1, type: 'd' }
        );
    }
}
function handleMove(r, c) {
    if (gameState.isGameOver || gameState.isPaused || gameState.activeAnimations > 0) return;

    // 1. Check if player is eliminated first
    if (isPlayerWipedOut(gameState.currentPlayer)) {
        nextTurn();
        return;
    }

    // 2. Handle Power-Up execution BEFORE marking the move as spent
    if (gameState.activePowerUp === 'bomb') {
        executeBomb(r, c);
        return;
    }

    // game_engine.js inside handleMove(r, c)
    if (gameState.activePowerUp === 'swap') {
        executeSwap(r, c);
        return;
        }

    // 3. Block if they already started a standard dot move
    if (gameState.hasMovedThisTurn) return;

    const cellData = gameState.board[r][c];
    if (cellData.owner !== null && cellData.owner !== gameState.currentPlayer) return;

    // 4. Start the move
    gameState.hasMovedThisTurn = true; 
    gameState.chainCount = 0; // Reset consecutive pops for this specific move

    const isFirst = gameState.firstMove[gameState.currentPlayer];
    if (isFirst) {
        cellData.count = cellData.capacity - 1;
        addPoint(gameState.currentPlayer, cellData.count);
        gameState.firstMove[gameState.currentPlayer] = false;
    } else {
        cellData.count++;
        addPoint(gameState.currentPlayer, 1);
    }

    cellData.owner = gameState.currentPlayer;
    gameState.sounds.place.currentTime = 0;
    gameState.sounds.place.play();
    logMove(`P${gameState.currentPlayer} placed dot at (${r},${c})`);

    if (cellData.count >= cellData.capacity) {
        explode(r, c, gameState.currentPlayer);
    } else {
        nextTurn();
    }
    updateVisuals();
}

async function explode(r, c, attacker) {
    if (gameState.isGameOver) return;

    // One more cell has popped in this chain
    gameState.chainCount++; 

    // Award the bomb only on the 5th consecutive explosion
    if (gameState.chainCount === 5) {
        gameState.inventory[attacker].bomb++;
        
        // UI Feedback: Flash the inventory so the player knows they earned it
        const invEl = document.getElementById(`p${attacker}-inv`);
        invEl.style.animation = "glow-pulse 1s ease"; 
        
        updateScoreUI(); 
    }

    if (gameState.chainCount === 7 && gameState.scores[attacker] >= 250) {
    gameState.inventory[attacker].swap++;
    updateScoreUI();
}

    gameState.sounds.explode.currentTime = 0;
    gameState.sounds.explode.play();
    
    const cellData = gameState.board[r][c];
    const originCell = document.getElementById(`cell-${r}-${c}`);
    
    cellData.count = 0;
    cellData.owner = null;

    let neighbors = [[r-1, c], [r+1, c], [r, c-1], [r, c+1]];

    neighbors.forEach(([nr, nc]) => {
        if (nr >= 0 && nr < 12 && nc >= 0 && nc < 6) {
            let tr = nr, tc = nc;
            
            // Portal Logic
            const entryCell = document.getElementById(`cell-${nr}-${nc}`); // The square the dot hits first
            const portal = gameState.portals.find(p => p.entry.r === nr && p.entry.c === nc);
            let portalExitcell = null;

            if (portal) {
                tr = portal.exit.r;
                tc = portal.exit.c;
                portalExitcell = document.getElementById(`cell-${tr}-${tc}`);
            }

            const targetCell = document.getElementById(`cell-${tr}-${tc}`);
            gameState.activeAnimations++;
            createFlyingDot(originCell, entryCell, attacker, !!portal, portalExitcell);


            setTimeout(() => {
                if (gameState.isGameOver) return;
                
                const neighborData = gameState.board[tr][tc];
                
                // If the attacker captures an opponent's cell, 
                // the attacker gets credit for the dots now inside it.
                neighborData.owner = attacker;
                neighborData.count++;
                
                // ADD POINT: We only add points for the dots that land.
                addPoint(attacker, 1); 

                updateVisuals(); 
                
                if (neighborData.count >= neighborData.capacity) {
                    explode(tr, tc, attacker);
                }

                gameState.activeAnimations--;
                if (gameState.activeAnimations === 0) {
                    checkWinner();
                    if (!gameState.isGameOver) nextTurn();
                }
            }, 300);
        }
    });
}

function executeBomb(r, c) {
    const p = gameState.currentPlayer;
    const area = [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];

    // 1. Wipe the data
    area.forEach(([tr, tc]) => {
        if (tr >= 0 && tr < 12 && tc >= 0 && tc < 6) {
            const cell = gameState.board[tr][tc];
            cell.count = 0;
            cell.owner = null;
        }
    });
    gameState.sounds.boom.currentTime = 0;
    gameState.sounds.boom.play();
    logMove(`SYSTEM: P${p} detonated BOMB at (${r},${c})`);

    // 2. Redraw the board so dots disappear
    updateVisuals();

    // 3. Trigger the animations on the affected cells
    area.forEach(([tr, tc]) => {
        const el = document.getElementById(`cell-${tr}-${tc}`);
        if (el) {
            el.animate([
                // Keyframes
                { backgroundColor: '#ffffff', boxShadow: '0 0 40px #ffffff', transform: 'scale(1.1)', zIndex: 100 },
                { backgroundColor: '#ff3131', boxShadow: '0 0 20px #ff3131', transform: 'scale(1.05)' },
                { backgroundColor: 'transparent', boxShadow: 'none', transform: 'scale(1)', zIndex: 1 }
            ], {
                // Timing options
                duration: 400,
                easing: 'ease-out'
            });
        }
    });

    // 4. State cleanup
    gameState.inventory[p].bomb--;
    gameState.activePowerUp = null;
    updateScoreUI();

    setTimeout(() => nextTurn(), 400);
} 

function nextTurn() {
    let next = (gameState.currentPlayer % gameState.totalPlayers) + 1;
    gameState.hasMovedThisTurn = false;
    gameState.activePowerUp = null;
    
    let attempts = 0;
    // Skip if they are wiped out OR inactive
    while ((isPlayerWipedOut(next) || gameState.inactivePlayers.includes(next)) && attempts < gameState.totalPlayers) {
        next = (next % gameState.totalPlayers) + 1;
        attempts++;
    }

    gameState.currentPlayer = next;
    gameState.turnTime = 20;
    
    updateScoreUI();
    updateTimerUI();
    updateTurnDisplay();
    checkWinner(); // Final check in case everyone but one is gone
}

function addPoint(player, amount = 1) {
    if (gameState.scores[player] !== undefined) {
        gameState.scores[player] += amount;
    }

    // This calls the UI controller to refresh the numbers on screen
    updateScoreUI();
}

function checkWinner() {
    if (gameState.activeAnimations > 0) return;

    let activePlayerIDs = [];
    for (let i = 1; i <= gameState.totalPlayers; i++) {
        // A player is active ONLY if they aren't on the blacklist
        if (!gameState.inactivePlayers.includes(i)) {
            activePlayerIDs.push(i);
        }
    }

    // Check if anyone has actually played yet
    const gameIsLive = Object.values(gameState.firstMove).some(v => v === false);

    // WIN CONDITION: If only 1 remains and the game is active
    if (gameIsLive && activePlayerIDs.length === 1) {
        const finalWinner = activePlayerIDs[0]; // Use the ID from our list
        endGame(`PLAYER ${finalWinner} IS THE LAST ONE STANDING!`);
    }
}

function isPlayerWipedOut(playerIndex) {
    // 1. Can't be wiped out before their first move
    if (gameState.firstMove[playerIndex]) return false;

    // 2. Scan the board for any cells owned by this player
    const hasCells = gameState.board.some(row => 
        row.some(cell => cell.owner === playerIndex)
    );

    // 3. THE FIX: Only mark as wiped if they have NO cells 
    // AND there are NO dots flying in the air.
    const isWiped = !hasCells && gameState.activeAnimations === 0;

    // 4. Repurpose the existing blacklist
    if (isWiped && !gameState.inactivePlayers.includes(playerIndex)) {
        gameState.inactivePlayers.push(playerIndex);
        logMove(`CRITICAL: Player ${playerIndex} has been WIPED OUT.`);
    }

    return isWiped;
}

// Optional helper for the victory message
function getPlayerColorName(id) {
    const names = { 1: "RED", 2: "GREEN", 3: "BLUE", 4: "YELLOW" };
    return names[id] || "UNKNOWN";
}

function startTimers() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    gameState.timerInterval = setInterval(() => {
        if (gameState.isPaused || gameState.isGameOver) return;

        // 1. Global Game Clock
        if (gameState.totalTime > 0) {
            gameState.totalTime--;
        } else {
            // A. Find the highest score value currently on the board
            const scoresArray = Object.values(gameState.scores).slice(0, gameState.totalPlayers);
            const topScore = Math.max(...scoresArray);

            // B. Identify ALL players who have that top score
            let winners = [];
            for (let i = 1; i <= gameState.totalPlayers; i++) {
                if (gameState.scores[i] === topScore) {
                    winners.push(`P${i}`);
                }
            }

            // C. Determine if it's a Solo Win or a Draw
            if (winners.length === 1) {
                endGame(`TIME'S UP! ${winners[0]} wins with ${topScore} dots!`);
            } else {
                // Joins player IDs like "P1 & P2"
                const drawList = winners.join(" & ");
                endGame(`TIME'S UP! It's a DRAW between ${drawList} at ${topScore} dots!`);
            }
            return;
        }
        
        // 2. Turn Clock
        if (gameState.turnTime > 0) {
            gameState.turnTime--;
        } else {
            const timedOutPlayer = gameState.currentPlayer;

            // FIX: Only process if NOT already inactive to stop the spam
            if (!gameState.inactivePlayers.includes(timedOutPlayer)) {
                gameState.inactivePlayers.push(timedOutPlayer);
                logMove(`SYSTEM: P${timedOutPlayer} TIMED OUT. Empire frozen.`);

                gameState.firstMove[timedOutPlayer] = false; 
                updateVisuals();
                
                // CRITICAL: Check for winner before trying to move to next person
                checkWinner(); 

                if (!gameState.isGameOver) {
                    nextTurn(); 
                }
            }
        }
        updateTimerUI();
    }, 1000);
}

function createFlyingDot(fromEl, toEl, player, portalExitEl = null) {
    const grid = document.getElementById('grid');
    const dot = document.createElement('div');
    // NEW LOGIC (Supports all 4 players)
    dot.className = `ghost-dot p${player}-dot`;
    const cellWidth = fromEl.offsetWidth;
    const cellHeight = fromEl.offsetHeight;
    
    const getRelativePos = (el) => {
        return { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 };
    };

    const start = getRelativePos(fromEl);
    const target = getRelativePos(toEl);

    
    Object.assign(dot.style, { 
        // FIX: Set size in pixels to match 40% of the cell exactly
        width: `${cellWidth * 0.4}px`, 
        height: `${cellHeight * 0.4}px`,
        left: `${start.x}px`, 
        top: `${start.y}px`,
        position: 'absolute',
        zIndex: '10000',
        margin: '0',
        transform: 'translate(-50%, -50%)'
    });
    
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
        // Use a tiny delay to ensure the browser registers the starting position
        setTimeout(() => {
            dot.style.transition = portalExitEl ? "all 0.15s ease-in" : "all 0.3s linear";
            dot.style.left = `${target.x}px`;
            dot.style.top = `${target.y}px`;

            if (portalExitEl) {
                // We change opacity, but keep the scale slightly visible (0.1) 
                // until the exact moment of the warp to prevent it "dropping" under
                dot.style.opacity = "0";
                dot.style.transform = "translate(-50%, -50%) scale(0.1)";
            }
        }, 5);
    });

    if (portalExitEl) {
        if (gameState.sounds.portal) {
            gameState.sounds.portal.currentTime = 0;
            gameState.sounds.portal.play().catch(() => {});
        }
        setTimeout(() => {
            const exit = getPos(portalExitEl);
            dot.style.transition = "none";
            dot.style.left = `${exit.x}px`;
            dot.style.top = `${exit.y}px`;
            
            // Re-apply the scale(0) before starting the exit animation
            dot.style.transform = "translate(-50%, -50%) scale(0)";
            
            // Force a reflow so the 'none' transition is respected
            dot.offsetHeight; 

            dot.classList.add('portal-exit-anim');
        }, 160);
    }

    setTimeout(() => dot.remove(), 300);
}

function endGame(msg) {
    gameState.isGameOver = true;
    gameState.isPaused = true;
    logMove(`STATUS: ${msg}`);
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.innerText = "Resume";
    clearInterval(gameState.timerInterval);
    gameState.bgm.pause();
    gameState.sounds.win.play();
    gameState.sounds.win.onended = () => {
        gameState.bgm.play();    
    };
    setTimeout(() => alert(msg), 500);
}

function executeSwap(r, c) {
    const attacker = gameState.currentPlayer;
    const targetCell = gameState.board[r][c];
    const victim = targetCell.owner;
    logMove(`CRITICAL: P${attacker} swapped with P${victim}`);

    // 1. Validation: You must click a cell owned by an opponent
    if (victim === null || victim === attacker) {
        window.alert("Invalid target! You must click an enemy cell to swap empires.");
        // We don't end the turn so the player can try clicking a valid target
        return;
    }

    // 2. THE HEIST: Iterate through every cell on the 6x12 board
    for (let row = 0; row < 12; row++) {
        for (let col = 0; col < 6; col++) {
            const cell = gameState.board[row][col];
            
            if (cell.owner === attacker) {
                // Give your territory to the victim
                cell.owner = victim; 
            } else if (cell.owner === victim) {
                // Take the victim's territory for yourself
                cell.owner = attacker; 
            }
            // Note: Cells owned by other players (in 3 or 4 player games) are untouched
        }
    }
    gameState.sounds.swap.currentTime = 0;
    gameState.sounds.swap.play();

    // 3. Visual Feedback: Add a glitch effect to the screen
    document.body.style.animation = "glow-pulse 0.5s ease-out";
    setTimeout(() => document.body.style.animation = "", 500);

    // 4. Cleanup and State Reset
    gameState.inventory[attacker].swap--;
    gameState.activePowerUp = null;

    // 5. Finalize
    updateVisuals();
    updateScoreUI();
    nextTurn(); // This massive move definitely ends the turn
}