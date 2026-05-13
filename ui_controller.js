const gridElement = document.getElementById('grid');
const rows = 12;
const cols = 6;

// This function creates the 72 squares
function createGrid() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // 1. Create a new <div> element
            const cell = document.createElement('div');
            
            // 2. Give it the class "cell" (so the CSS we wrote applies)
            cell.classList.add('cell');
            
            // 3. Give it a unique ID based on its position (Row-Column)
            // Example: cell-0-0, cell-0-1, etc.
            cell.id = `cell-${r}-${c}`;
            
            // 4. Add the cell into the grid container
            gridElement.appendChild(cell);
        }
    }
}

// Run the function!
createGrid();


// ui_controller.js
function updateVisuals() {
    const allCells = document.querySelectorAll('.cell');
    
    allCells.forEach(cell => {
        const parts = cell.id.split('-');
        const r = parseInt(parts[1]);
        const c = parseInt(parts[2]);
        const data = gameState.board[r][c];

        cell.innerHTML = ""; // This wipes the cell clean before redrawing

        if (data.count > 0) {
            for (let i = 1; i <= data.count; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dot.classList.add(data.owner === 1 ? 'p1-dot' : 'p2-dot');
                dot.classList.add(`dot-${i}-of-${data.count}`);
                cell.appendChild(dot);
            }
        }
    });
}

function updateTimerUI() {
    const tMin = Math.floor(gameState.totalTime / 60);
    const tSec = gameState.totalTime % 60;
    
    const gTimer = document.getElementById('game-timer');
    const tTimer = document.getElementById('turn-timer');

    if(gTimer) gTimer.innerText = `Total: ${tMin}:${tSec < 10 ? '0' : ''}${tSec}`;
    if(tTimer) tTimer.innerText = `Turn: ${gameState.turnTime}`;
}

