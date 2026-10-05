const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "pvp";

const customRows = parseInt(urlParams.get("rows"));
const customCols = parseInt(urlParams.get("cols"));
const ROWS = customRows || 6;
const COLS = customCols || 7;

const playerCount = parseInt(urlParams.get("players")) || 2;
const defaultIcons = ["cat.png", "chick.png", "pig.png", "panda.png"];

let players = [];
for (let i = 0; i < playerCount; i++) {
  const icon = urlParams.get(`icon${i + 1}`) || defaultIcons[i];
  players.push({
    id: i === 0 ? "cat" : i === 1 ? "chick" : `player${i + 1}`,
    icon: `image/${icon}`
  });
}

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
let currentPlayerIndex = 0;
let gameOver = false;
let isPaused = false;
let turnTimer = null;
let timeLeft = 20;

const gameBoard = document.getElementById("game-board");

document.addEventListener("DOMContentLoaded", () => {
  renderPlayers();
  createBoard();
  startTurnTimer();
});

function renderPlayers() {
  const playerInfo = document.getElementById("player-info");
  if (!playerInfo) return;

  playerInfo.innerHTML = "";
  players.forEach((player, i) => {
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `
      <span class="player-symbol"><img src="${player.icon}" width="32"></span>
      <span class="player-name">Joueur ${i + 1}</span>
    `;
    playerInfo.appendChild(div);
  });
}

function createBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  gameBoard.innerHTML = "";

  const cellSize = 50;

  // Gán lại grid layout
  gameBoard.style.display = "grid";
  gameBoard.style.gridTemplateColumns = `repeat(${COLS}, ${cellSize}px)`;
  gameBoard.style.gridTemplateRows = `repeat(${ROWS}, ${cellSize}px)`;

  // Tính kích thước nền (đảm bảo nền thay đổi cả theo hàng và cột)
  gameBoard.style.width = `${COLS * cellSize}px`;
  gameBoard.style.height = `${ROWS * cellSize}px`;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;

      // Bắt buộc set kích thước cho từng ô (nếu chưa có trong CSS)
      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;

      cell.addEventListener("click", () => {
        if (gameOver || (mode === "pvc" && getCurrentPlayer().id === "chick")) return;
        dropPiece(c);
      });

      gameBoard.appendChild(cell);
    }
  }
}


function dropPiece(col) {
  if (gameOver || isPaused) return;

  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      const current = getCurrentPlayer();
      board[r][col] = current.id;
      updateBoard();
      stopTurnTimer();

      if (checkWin(r, col, current.id)) {
        document.getElementById("game-status").innerText = `🎉 ${current.id.toUpperCase()} gagne !`;
        gameOver = true;
        disableBoard();
      } else {
        // ✅ Kiểm tra hòa
        const isDraw = board.flat().every(cell => cell !== null);
        if (isDraw) {
          document.getElementById("game-status").innerText = "Match nul ! Plus aucun coup possible.";
          gameOver = true;
          disableBoard();
        } else {
          nextPlayer();
          if (mode === "pvc" && getCurrentPlayer().id === "chick" && !gameOver) {
            setTimeout(botMove, 300);
          } else {
            startTurnTimer();
          }
        }
      }
      break;
    }
  }
}


function updateBoard() {
  document.querySelectorAll(".cell").forEach(cell => {
    const r = cell.dataset.row;
    const c = cell.dataset.col;
    const value = board[r][c];
    if (value) {
      const player = players.find(p => p.id === value);
      cell.innerHTML = `<img src="${player.icon}" width="40" height="40">`;
    } else {
      cell.innerHTML = "";
    }
  });
}

function getCurrentPlayer() {
  return players[currentPlayerIndex];
}

function nextPlayer() {
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
}

function checkWin(row, col, playerId) {
  return (
    checkDirection(row, col, 1, 0, playerId) ||
    checkDirection(row, col, 0, 1, playerId) ||
    checkDirection(row, col, 1, 1, playerId) ||
    checkDirection(row, col, 1, -1, playerId)
  );
}

function checkDirection(row, col, dr, dc, playerId) {
  let count = 1;
  for (let i = 1; i < 4; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== playerId) break;
    count++;
  }
  for (let i = 1; i < 4; i++) {
    const r = row - dr * i;
    const c = col - dc * i;
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== playerId) break;
    count++;
  }
  return count >= 4;
}

function disableBoard() {
  document.querySelectorAll(".cell").forEach(cell => {
    const clone = cell.cloneNode(true);
    cell.parentNode.replaceChild(clone, cell);
  });
  stopTurnTimer();
}

function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  currentPlayerIndex = 0;
  gameOver = false;
  document.getElementById("game-status").innerText = "";
  createBoard();
  startTurnTimer();
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
        gameOver = true;
        document.getElementById("game-status").innerText = `${getCurrentPlayer().id} a dépassé le temps !`;
        disableBoard();
      }
    }
  }, 1000);
}

function stopTurnTimer() {
  clearInterval(turnTimer);
}

function updateTimerDisplay() {
  document.getElementById("game-timer").innerHTML =
    `<img src="image/timer.png" class="resize-img">${String(timeLeft).padStart(2, '0')}`;
}

function Pause() {
  isPaused = !isPaused;
  const icon = document.getElementById("pause-icon");
  if (icon) {
    icon.src = isPaused ? "image/skip.png" : "image/pause.png";
  }
}

function botMove() {
  let bestScore = -Infinity;
  let bestCol = null;

  for (let c = 0; c < COLS; c++) {
    const r = getAvailableRow(c);
    if (r === -1) continue;

    board[r][c] = "chick";
    const scoreChick = evaluateScore(r, c, "chick");

    board[r][c] = "cat";
    const scoreCat = evaluateScore(r, c, "cat");

    const totalScore = scoreChick + scoreCat * 0.8;
    board[r][c] = null;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCol = c;
    }
  }

  if (bestCol !== null) {
    dropPiece(bestCol);
  }
}

function getAvailableRow(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) return r;
  }
  return -1;
}

function evaluateScore(row, col, playerId) {
  let total = 0;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (let [dr, dc] of directions) {
    let count = 1;
    let blocks = 0;

    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) { blocks++; break; }
      if (board[r][c] === playerId) count++;
      else if (board[r][c] === null) break;
      else { blocks++; break; }
    }

    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) { blocks++; break; }
      if (board[r][c] === playerId) count++;
      else if (board[r][c] === null) break;
      else { blocks++; break; }
    }

    if (count >= 4) total += 10000;
    else if (count === 3 && blocks === 0) total += 1000;
    else if (count === 3) total += 300;
    else if (count === 2 && blocks === 0) total += 100;
    else if (count === 2) total += 30;
  }

  const center = Math.floor(COLS / 2);
  total += 10 * (COLS - Math.abs(center - col));
  return total;
}
