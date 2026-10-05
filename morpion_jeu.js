document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "pvp";
  const rows = parseInt(params.get("rows"));
  const cols = parseInt(params.get("cols"));
  const size = parseInt(params.get("size")) || Math.min(rows || 3, cols || 3);
  const players = parseInt(params.get("players")) || 2;
  const playerIcons = [];

  if (!params.has("icon1")) {
    playerIcons.push("X", "O");
  } else {
    for (let i = 1; i <= players; i++) {
      const icon = params.get(`icon${i}`) || "cat.png";
      playerIcons.push("image/" + icon);
    }
  }

  const board = Array(size * size).fill(null);
  let currentPlayerIndex = 0;
  let gameActive = true;
  let countdown = 20;
  let timerInterval;
  let isPaused = false;

  const table = document.getElementById("morpion-board");
  const playerInfoDiv = document.getElementById("player-info");

  for (let i = 0; i < players; i++) {
    const player = document.createElement("div");
    player.className = "player";
    if (i === 0) player.classList.add("active");

    const symbol = document.createElement("span");
    symbol.className = "player-symbol";
    const icon = playerIcons[i];

    if (icon.startsWith("image/")) {
      symbol.innerHTML = `<img src="${icon}" width="32">`;
    } else {
      const symbolClass = icon === "X" ? "player-x" : icon === "O" ? "player-o" : "text-symbol";
      symbol.innerHTML = `<span class="${symbolClass}">${icon}</span>`;
    }

    const name = document.createElement("span");
    name.className = "player-name";
    name.textContent = `Joueur ${i + 1}`;

    player.appendChild(symbol);
    player.appendChild(name);
    playerInfoDiv.appendChild(player);
  }

  table.innerHTML = "";
  table.style.setProperty("--board-size", size);
  for (let r = 0; r < size; r++) {
    const row = document.createElement("tr");
    for (let c = 0; c < size; c++) {
      const cell = document.createElement("td");
      const index = r * size + c;

      cell.addEventListener("click", function () {
        if (!gameActive || board[index] !== null || (mode === "pvc" && currentPlayerIndex === 1)) return;

        playMove(index);

        if (mode === "pvc" && currentPlayerIndex === 1 && gameActive) {
          setTimeout(botMove, 300);
        }
      });

      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  function playMove(index) {
    if (!gameActive || board[index] !== null) return;

    board[index] = currentPlayerIndex;
    const cell = table.querySelectorAll("td")[index];
    const icon = playerIcons[currentPlayerIndex];

    cell.innerHTML = icon.startsWith("image/")
      ? `<img src="${icon}" width="40">`
      : `<span class="text-symbol">${icon}</span>`;

    if (!checkWinner(currentPlayerIndex)) {
      currentPlayerIndex = (currentPlayerIndex + 1) % players;
      highlightCurrentPlayer();
      startTimer();
    }
  }

  function botMove() {
    if (!gameActive) return;

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = currentPlayerIndex;
        if (isWinningMove(currentPlayerIndex)) {
          board[i] = null;
          playMove(i);
          return;
        }
        board[i] = null;
      }
    }

    const opponent = (currentPlayerIndex + 1) % players;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = opponent;
        if (isWinningMove(opponent)) {
          board[i] = null;
          playMove(i);
          return;
        }
        board[i] = null;
      }
    }

    const center = Math.floor(board.length / 2);
    if (board[center] === null) {
      playMove(center);
      return;
    }

    const corners = [0, size - 1, board.length - size, board.length - 1];
    for (let i of corners) {
      if (board[i] === null) {
        playMove(i);
        return;
      }
    }

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        playMove(i);
        return;
      }
    }
  }

  function checkWinner(index) {
    const grid = buildGrid();
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== index) continue;

        for (let [dr, dc] of directions) {
          let count = 1;
          for (let step = 1; step < 3; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === index) {
              count++;
            } else break;
          }

          if (count >= 3) {
            alert(`🎉 Joueur ${index + 1} gagne !`);
            gameActive = false;
            stopTimer();
            return true;
          }
        }
      }
    }

    if (!board.includes(null)) {
      alert("😲 Match nul !");
      gameActive = false;
      stopTimer();
      return true;
    }

    return false;
  }

  function isWinningMove(index) {
    const grid = buildGrid();
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== index) continue;

        for (let [dr, dc] of directions) {
          let count = 1;
          for (let step = 1; step < 3; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === index) {
              count++;
            } else break;
          }
          if (count >= 3) return true;
        }
      }
    }

    return false;
  }

  function buildGrid() {
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = board.slice(r * size, (r + 1) * size);
    }
    return grid;
  }

  function highlightCurrentPlayer() {
    document.querySelectorAll(".player").forEach((el, i) => {
      el.classList.toggle("active", i === currentPlayerIndex);
    });
  }

  function startTimer() {
    clearInterval(timerInterval);
    countdown = 20;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      if (!isPaused) {
        countdown--;
        updateTimerDisplay();
        if (countdown <= 0) {
          clearInterval(timerInterval);
          alert(`⏳ Temps écoulé ! Joueur ${currentPlayerIndex + 1} a perdu !`);
          gameActive = false;
        }
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function updateTimerDisplay() {
    const timer = document.getElementById("game-timer");
    if (timer) {
      timer.innerHTML = `<img src="image/timer.png" class="resize-img"> 00:${countdown < 10 ? "0" + countdown : countdown}`;
    }
  }

  document.getElementById("reset-btn").addEventListener("click", () => location.reload());

  document.getElementById("pause-btn").addEventListener("click", function () {
    isPaused = !isPaused;
    if (isPaused) {
      stopTimer();
      this.innerHTML = `<img src="image/skip.png" alt="Reprendre">`;
    } else {
      startTimer();
      this.innerHTML = `<img src="image/pause.png" alt="Pause">`;
    }
  });

  startTimer();
  if (mode === "pvc" && currentPlayerIndex === 1) {
    setTimeout(botMove, 300);
  }
});
