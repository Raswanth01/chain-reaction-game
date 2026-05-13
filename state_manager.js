// This object will hold all the current info about the game
const gameState = {
    board: [], // This will be a list of every cell's count and owner
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    isPaused: false,
    isGameOver: false,
    totalTime: 180, // Total time in seconds (5 minutes)
    turnTime: 15,
    timerInterval: null,
    activeAnimations: 0, // This will hold references to any active animation timeouts
    bgm: new Audio('assets/BGM.wav'),
    sounds: {
        place: new Audio('assets/place.wav'),
        explode: new Audio('assets/pop.wav'),
        win: new Audio('assets/win.wav')
    },
    firstMove: {player1: true, player2: true} // Track if it's the player's first move
};
// Configure the BGM
gameState.bgm.loop = true;      // Makes the music restart automatically
gameState.bgm.volume = 0.5;    // Lower volume (30%) so SFX can be heard
gameState.sounds.win.volume = 0.6;
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