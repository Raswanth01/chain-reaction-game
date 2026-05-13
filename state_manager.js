// This object will hold all the current info about the game
const gameState = {
    board: [],
    currentPlayer: 1,
    currentMode: 'normal',
    scores: { player1: 0, player2: 0 },
    isPaused: true,
    gameStarted: false,
    isGameOver: false,
    totalTime: 180, 
    turnTime: 15,
    timerInterval: null,
    activeAnimations: 0,
    bgm: new Audio('assets/BGM.wav'),
    sounds: {
        place: new Audio('assets/place.wav'),
        explode: new Audio('assets/pop.wav'),
        win: new Audio('assets/win.wav'),
        portal: new Audio('assets/portal.wav')
    },
    firstMove: { player1: true, player2: true },
    portals: [] 
};
// Configure the BGM
gameState.bgm.loop = true;      // Makes the music restart automatically
gameState.bgm.volume = 0.5;    // Lower volume (30%) so SFX can be heard
gameState.sounds.win.volume = 0.6;
gameState.sounds.portal.volume = 1.5;
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