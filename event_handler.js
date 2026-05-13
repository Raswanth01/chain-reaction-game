// 1. Find all the squares we just created
const cells = document.querySelectorAll('.cell');

// 2. Attach a "Listener" to every single square
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (!gameState.isPaused) {
        // This code runs every time a square is clicked
        
        // Extract the row and column from the ID (e.g., "cell-2-3")
        const parts = cell.id.split('-');
        const r = parseInt(parts[1]);
        const c = parseInt(parts[2]);
        unlockAudio();

        console.log(`You clicked cell at Row: ${r}, Column: ${c}`);

        // 3. Call the function that handles the game logic (we'll write this next)
        handleMove(r, c);
        } else {
            alert("Game is paused! Please resume to make a move.");
        }
    });
});

document.getElementById('pause-btn').addEventListener('click', () => {
    gameState.isPaused = !gameState.isPaused; // Flip true to false or vice versa
    if (gameState.isPaused) {
        gameState.bgm.pause();
    } else {
        gameState.bgm.play();
    }
    document.getElementById('pause-btn').innerText = gameState.isPaused ? "Resume" : "Pause";
});


const myButton = document.getElementById('reset-btn');
myButton.addEventListener('click', () => {
    // 1. Reset the logic numbers
    gameState.totalTime = 180;
    gameState.turnTime = 15;
    gameState.currentPlayer = 1;
    gameState.scores.player1 = 0;
    gameState.scores.player2 = 0;
    gameState.isPaused = false; // Make sure it's unpaused
    gameState.isGameOver = false;
    gameState.board = []; // Clear the board data
    gameState.activeAnimations = 0; // CLEAR THE GHOSTS
    gameState.isGameOver = false;
    gameState.firstMove.player1 = true;
    gameState.firstMove.player2 = true;
    initializeBoardData(); // Re-initialize the board data with empty cells
    updateVisuals()


    // 2. IMPORTANT: Loop through your data and clear the counts
    for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 6; c++) {
            gameState.board[r][c].count = 0;
            gameState.board[r][c].owner = null;
        }
    }

    // 3. Sync the screen with the new empty data
    updateVisuals(); 
    startTimers(); // RESTART THE HEARTBEAT
    alert("Game Reset!");
});

// Start the clocks when the page loads
startTimers();



