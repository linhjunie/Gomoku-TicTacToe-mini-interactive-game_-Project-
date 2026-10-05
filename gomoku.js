const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "pvp";
const customRows = parseInt(urlParams.get("rows"));
const customCols = parseInt(urlParams.get("cols"));
const icon1 = urlParams.get("icon1") || "cat.png";
const icon2 = urlParams.get("icon2") || "chick.png";
const ROWS = customRows || 19;
const COLS = customCols || 19;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentPlayer = "player1";
let gameOver = false;


let timeLeft = 20;
let turnTimer = null;
let isPaused = false;

const placeSound = new Audio("sound/place.mp3");
const winSound = new Audio("sound/win.mp3");

document.addEventListener("DOMContentLoaded", function () {
    const gameBoard = document.getElementById("game-boardG");

    // Cập nhật icon trên phần hiển thị người chơi
    const playerIcons = document.querySelectorAll(".player-symbol img");
    const playerNames = document.querySelectorAll(".player-name");
    if (playerIcons[0]) playerIcons[0].src = `image/${icon1}`;
    if (playerIcons[1]) playerIcons[1].src = `image/${icon2}`;
    if (playerNames[0]) playerNames[0].textContent = icon1.replace(".png", "");
    if (playerNames[1]) playerNames[1].textContent = icon2.replace(".png", "");

    gameBoard.style.position = "relative";
    gameBoard.style.width = `${COLS * 27.5}px`;
    gameBoard.style.height = `${ROWS * 27.5}px`;
    gameBoard.style.margin = "auto";

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.style.position = "absolute";
            cell.style.width = "30px";
            cell.style.height = "30px";
            cell.style.left = `${c * 30}px`;
            cell.style.top = `${r * 30}px`;
            gameBoard.appendChild(cell);
        }
    }

    gameBoard.addEventListener("click", handleBoardClick);
    startTurnTimer();
});

function handleBoardClick(event) {
    if (gameOver || isPaused || (mode === "pvc" && currentPlayer === "player2")) return;

    const gameBoard = document.getElementById("game-boardG");
    const rect = gameBoard.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    // Tính vị trí điểm giao gần nhất
    let col = Math.round(x / 30);
    let row = Math.round(y / 30);	

    // Kiểm tra nếu nằm trong phạm vi click chính xác gần điểm giao
    let centerX = col * 30;
    let centerY = row * 30;

    let distance = Math.hypot(x - centerX, y - centerY);
    if (distance > 6) return; // chỉ chấp nhận click gần trung tâm giao điểm (bán kính 6px)

    // Ngăn đặt ở viền trên và trái
	if (row <= 0 || col <= 0) return;

    if (board[row][col] === null) {
        placePiece(row, col);
    }
}



function placePiece(row, col) {
    if (gameOver || board[row][col] !== null) return;

    board[row][col] = currentPlayer;
    updateBoard();
    stopTurnTimer();
    placeSound.play();

    let winningCells = checkWin(row, col);
    if (winningCells) {
        highlightWinningLine(winningCells);
        document.getElementById("game-status").innerHTML = `<strong>${currentPlayer.toUpperCase()} gagne !</strong>`;
        winSound.play();
        gameOver = true;
        return;
    }

    currentPlayer = currentPlayer === "player1" ? "player2" : "player1";

    // ✅ Vérifier l'égalité uniquement dans les cases valides (ignorer ligne 0 et colonne 0)
    let isDraw = true;
    for (let r = 1; r < ROWS; r++) {
        for (let c = 1; c < COLS; c++) {
            if (board[r][c] === null) {
                isDraw = false;
                break;
            }
        }
        if (!isDraw) break;
    }

    if (isDraw) {
        document.getElementById("game-status").innerHTML = "<strong>Match nul ! Plus aucun coup possible.</strong>";
        gameOver = true;
        return;
    }

    if (mode === "pvc" && currentPlayer === "player2" && !gameOver) {
        setTimeout(botMove, 300);
    } else {
        startTurnTimer();
    }
}



function botMove() {
    if (gameOver) return;

    let bestScore = -Infinity;
    let bestMove = null;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] !== null) continue;

            board[r][c] = "player2";
            let score = evaluatePosition(r, c, "player2");
            board[r][c] = "player1";
            score += evaluatePosition(r, c, "player1") * 0.8;
            board[r][c] = null;

            let centerBonus = 9 - Math.abs(9 - r) - Math.abs(9 - c);
            score += centerBonus;

            if (score > bestScore) {
                bestScore = score;
                bestMove = [r, c];
            }
        }
    }

    if (bestMove) {
        placePiece(bestMove[0], bestMove[1]);
    }
}

function evaluatePosition(row, col, player) {
    let total = 0;
    const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    for (let [dr, dc] of directions) {
        let count = 1;
        let blocks = 0;

        for (let i = 1; i < 5; i++) {
            let r = row + dr * i;
            let c = col + dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
                blocks++;
                break;
            }
            if (board[r][c] === player) {
                count++;
            } else if (board[r][c] === null) {
                break;
            } else {
                blocks++;
                break;
            }
        }

        for (let i = 1; i < 5; i++) {
            let r = row - dr * i;
            let c = col - dc * i;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
                blocks++;
                break;
            }
            if (board[r][c] === player) {
                count++;
            } else if (board[r][c] === null) {
                break;
            } else {
                blocks++;
                break;
            }
        }

        if (count >= 5) total += 100000;
        else if (count === 4 && blocks === 0) total += 10000;
        else if (count === 4 && blocks === 1) total += 1000;
        else if (count === 3 && blocks === 0) total += 500;
        else if (count === 3 && blocks === 1) total += 100;
        else if (count === 2 && blocks === 0) total += 50;
        else if (count === 2 && blocks === 1) total += 10;
    }

    return total;
}

function checkWin(row, col) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let [rowDir, colDir] of directions) {
        let winningCells = [[row, col]];
        for (let step = 1; step < 5; step++) {
            let r = row + rowDir * step;
            let c = col + colDir * step;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== currentPlayer) break;
            winningCells.push([r, c]);
        }
        for (let step = 1; step < 5; step++) {
            let r = row - rowDir * step;
            let c = col - colDir * step;
            if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== currentPlayer) break;
            winningCells.push([r, c]);
        }
        if (winningCells.length >= 5) {
            return winningCells;
        }
    }
    return false;
}

function highlightWinningLine(cells) {
    for (let [r, c] of cells) {
        let piece = document.querySelector(`.piece[data-row='${r}'][data-col='${c}']`);
        if (piece) piece.classList.add("highlight");
    }
}

function updateBoard() {
    const gameBoard = document.getElementById("game-boardG");
    document.querySelectorAll(".piece").forEach(p => p.remove());

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                let piece = document.createElement("img");
                piece.src = board[r][c] === "player1" ? `image/${icon1}` : `image/${icon2}`;
                piece.classList.add("piece");
                piece.dataset.row = r;
                piece.dataset.col = c;
                piece.style.width = "24px";
                piece.style.height = "24px";
                piece.style.position = "absolute";
                piece.style.left = `${c * 30}px`;
                piece.style.top = `${r * 30}px`;
                gameBoard.appendChild(piece);
            }
        }
    }
}

function startTurnTimer() {
    clearInterval(turnTimer);
    isPaused = false;
    timeLeft = 20;
    updateTimerDisplay();

    turnTimer = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(turnTimer);
                gameOver = true;
                document.getElementById("game-status").innerHTML =
                    `<strong>${currentPlayer.toUpperCase()} a dépassé le temps ! ${getOpponentName().toUpperCase()} gagne !</strong>`;
            }
        }
    }, 1000);
}

function stopTurnTimer() {
    clearInterval(turnTimer);
}

function Pause() {
    if (gameOver) return;

    isPaused = !isPaused;

    const pauseIcon = document.getElementById("pause-icon");
    if (pauseIcon) {
        pauseIcon.src = isPaused ? "image/play.png" : "image/pause.png";
        pauseIcon.alt = isPaused ? "Reprendre" : "Pause";
    }
}

function updateTimerDisplay() {
    const timer = document.getElementById("game-timer");
    if (timer) {
        timer.innerHTML =
            `<img src="image/timer.png" class="resize-img">${String(timeLeft).padStart(2, '0')}`;
    }
}

function getOpponentName() {
    return currentPlayer === "player1" ? "player2" : "player1";
}

function resetGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    currentPlayer = "player1";
    gameOver = false;
    isPaused = false;

    const gameStatus = document.getElementById("game-status");
    if (gameStatus) gameStatus.innerText = "";

    document.querySelectorAll(".piece").forEach(p => p.remove());
    document.querySelectorAll(".highlight").forEach(p => p.classList.remove("highlight"));

    updateBoard();
    startTurnTimer();

    const pauseIcon = document.getElementById("pause-icon");
    if (pauseIcon) {
        pauseIcon.src = "image/pause.png";
        pauseIcon.alt = "Pause";
    }
}


