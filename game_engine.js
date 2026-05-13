function startGame(mode) {
    gameState.currentMode = mode;
    gameState.gameStarted = true;
    gameState.isPaused = false;
    
    
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    if (mode === 'hacker') generateRandomPortals();
    else gameState.portals = [];

    resetGame();
}

function resetGame() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.totalTime = 180;
    gameState.turnTime = 15;
    gameState.currentPlayer = 1;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.activeAnimations = 0;
    gameState.firstMove = { player1: true, player2: true };
    gameState.scores = { player1: 0, player2: 0 };

    if (gameState.currentMode === 'hacker') {
        generateRandomPortals(); 
    } else {
        gameState.portals = [];
    }
    
    initializeBoardData();
    updateVisuals();
    updateTimerUI();
    startTimers();
    updateScoreUI();
    
    
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
        { entry: b2, exit: b1, type: 'b' }
    ];
}

function handleMove(r, c) {
    if (gameState.isGameOver || gameState.isPaused || gameState.activeAnimations > 0) return;

    const cellData = gameState.board[r][c];
    if (cellData.owner !== null && cellData.owner !== gameState.currentPlayer) return;

    const isFirst = (gameState.currentPlayer === 1) ? gameState.firstMove.player1 : gameState.firstMove.player2;

    if (isFirst) {
        cellData.count = cellData.capacity - 1;
        addPoint(gameState.currentPlayer, cellData.count);
        if (gameState.currentPlayer === 1) gameState.firstMove.player1 = false;
        else gameState.firstMove.player2 = false;
    } else {
        cellData.count++;
        addPoint(gameState.currentPlayer, 1);
    }

    cellData.owner = gameState.currentPlayer;
    gameState.sounds.place.currentTime = 0;
    gameState.sounds.place.play();

    if (cellData.count >= cellData.capacity) {
        explode(r, c, gameState.currentPlayer);
    } else {
        nextTurn();
    }
    updateVisuals();
}

async function explode(r, c, attacker) {
    if (gameState.isGameOver) return;

    gameState.sounds.explode.currentTime = 0;
    gameState.sounds.explode.play();
    
    const cellData = gameState.board[r][c];
    const originCell = document.getElementById(`cell-${r}-${c}`);
    
    // We do NOT subtract points here. 
    // The dots are "exploding" out, but they still count as dots placed by the player.
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
                    checkWipeout();
                    if (!gameState.isGameOver) nextTurn();
                }
            }, 300);
        }
    });
}

function nextTurn() {
    gameState.currentPlayer = (gameState.currentPlayer === 1) ? 2 : 1;
    gameState.turnTime = 15;
    updateTimerUI();
}

function addPoint(player, amount = 1) {
    if (player === 1) gameState.scores.player1 += amount;
    else if (player === 2) gameState.scores.player2 += amount;
    
    // This calls the UI controller to refresh the numbers on screen
    updateScoreUI();
}

function checkWipeout() {
    let p1 = 0, p2 = 0;
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 6; c++) {
            if (gameState.board[r][c].owner === 1) p1++;
            if (gameState.board[r][c].owner === 2) p2++;
        }
    }
    if (!gameState.firstMove.player1 && !gameState.firstMove.player2) {
        if (p1 > 0 && p2 === 0) endGame("Player 1 Wins!");
        else if (p2 > 0 && p1 === 0) endGame("Player 2 Wins!");
    }
}

function startTimers() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        if (gameState.isPaused || gameState.isGameOver) return;

        if (gameState.totalTime > 0) gameState.totalTime--;
        else return endGame("Draw! Time Out");

        if (gameState.turnTime > 0) gameState.turnTime--;
        else return endGame(`Player ${(gameState.currentPlayer === 1 ? 2 : 1)} Wins (Timeout)!`);

        updateTimerUI();
    }, 1000);
}


function createFlyingDot(fromEl, toEl, player, portalExitEl = null) {
    const dot = document.createElement('div');
    dot.className = `ghost-dot ${player === 1 ? 'p1-dot' : 'p2-dot'}`;
    
    const getPos = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    const start = getPos(fromEl);
    const target = getPos(toEl);

    // FIX: Add a very high zIndex directly here to be safe
    Object.assign(dot.style, { 
        left: `${start.x}px`, 
        top: `${start.y}px`,
        position: 'fixed',
        zIndex: '10000' 
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
    clearInterval(gameState.timerInterval);
    gameState.bgm.pause();
    gameState.sounds.win.play();
    gameState.sounds.win.onended = () => {
        gameState.bgm.play();    
    };
    setTimeout(() => alert(msg), 500);
}