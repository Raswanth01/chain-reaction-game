// This object will hold all the current info about the game
const gameState = {
    board: [],
    totalPlayers: 2,
    currentPlayer: 1,
    currentMode: 'normal',
    scores: { 1: 0, 2: 0, 3: 0, 4: 0 },    isPaused: true,
    gameStarted: false,
    isGameOver: false,
    // Core color mapping
    playerColors: {
        1: '#ff3131', // Red
        2: '#39ff14', // Green
        3: '#00d2ff', // Blue
        4: '#fff01f'  // Yellow
    },
    totalTime: 180, 
    turnTime: 15,
    timerInterval: null,
    activeAnimations: 0,
    bgm: new Audio('assets/BGM.wav'),
    sounds: {
        place: new Audio('assets/place.wav'),
        explode: new Audio('assets/pop.wav'),
        win: new Audio('assets/win.wav'),
        portal: new Audio('assets/portal.wav'),
        boom: new Audio('assets/boom.wav'),
        swap: new Audio('assets/swap.wav')
    },
    firstMove: { 1: true, 2: true, 3: true, 4: true },
    // Track inventory for all players
    inventory: {
        1: { bomb: 0, swap: 0 },
        2: { bomb: 0, swap: 0 },
        3: { bomb: 0, swap: 0 },
        4: { bomb: 0, swap: 0 }
    },
    swapSelection: null,
    hasMovedThisTurn: false,
    activePowerUp: null, // Stores 'bomb', 'shield', etc., or null
    chainCount: 0,
    
    portals: [] 
};
// Configure the BGM
gameState.bgm.loop = true;      // Makes the music restart automatically
gameState.bgm.volume = 0.5;    // Lower volume (30%) so SFX can be heard
gameState.sounds.win.volume = 0.6;
gameState.sounds.portal.volume = 1.5;
gameState.sounds.swap.volume = 0.8;
// Initialize the data for a 6x12 board
function initializeBoardData() {
    for (let r = 0; r < 12; r++) {
        gameState.board[r] = []; // Create a row
        for (let c = 0; c < 6; c++) {
            // Calculate capacity based on neighbors
            let capacity = 4;
            if ((r === 0 || r === 11) && (c === 0 || c === 5)) capacity = 2; // Corners
            else if (r === 0 || r === 11 || c === 0 || c === 5) capacity = 3; // Edges

            gameState.board[r][c] = {
                count: 0,
                owner: null,
                capacity: capacity
            };
        }
    }
}

initializeBoardData();

// state_manager.js
function startTimers() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    gameState.timerInterval = setInterval(() => {
        // Only stop for manual pauses or Game Over. 
        // REMOVE activeAnimations check here!
        if (gameState.isPaused || gameState.isGameOver) return;

        // Total Game Clock
        if (gameState.totalTime > 0) {
            gameState.totalTime--;
        } else {
            let winner = gameState.scores.player1 > gameState.scores.player2 ? "Player 1" : "Player 2";
            if (gameState.scores.player1 === gameState.scores.player2) winner = "No one (It's a Draw)";
            endGame(`Time's up! ${winner} wins!`);
            return;
        }
        
        // Turn Clock
        if (gameState.turnTime > 0) {
            gameState.turnTime--;
        } else {
            const winner = (gameState.currentPlayer === 1) ? "Player 2" : "Player 1";
            endGame(`Time's up! ${winner} wins!`);
            return;
        }

        updateTimerUI();
    }, 1000);
}

// Function called by the new HTML buttons
function setPlayerCount(num) {
    gameState.totalPlayers = num;
    // Visually update the menu buttons
    document.querySelectorAll('.player-opt').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.innerText) === num);
    });
}