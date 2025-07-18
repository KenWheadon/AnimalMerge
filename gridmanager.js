// Grid Manager - Handles all grid-related functionality
const gridManager = {
  // Initialize the grid state
  initializeGridState() {
    // Create grid array
    gameState.grid = Array(5)
      .fill(null)
      .map(() => Array(8).fill(null));

    // Mark initial purchased cells
    gameState.purchasedCells = new Set();
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
      if (cost === 0) {
        gameState.purchasedCells.add(`${row}-${col}`);
      }
    });
  },

  // Generate grid HTML with fixed sizing
  generateGridHTML() {
    let html = '<table class="game-grid">';

    for (let i = 0; i < 5; i++) {
      html += "<tr>";
      for (let j = 0; j < 8; j++) {
        const spotConfig = GAME_CONFIG.gridConfig.availableSpots.find(
          (spot) => spot.row === i && spot.col === j
        );

        if (spotConfig) {
          const isPurchased = gameState.purchasedCells.has(`${i}-${j}`);
          const cellClass = isPurchased ? "grid-cell" : "grid-cell grass";
          const cellContent =
            isPurchased && gameState.grid[i][j]
              ? `<span class="animal-emoji">${
                  GAME_CONFIG.animalEmojis[gameState.grid[i][j]]
                }</span>`
              : "";

          html += `<td><div id="cell-${i}-${j}" class="${cellClass}" 
                      data-row="${i}" data-col="${j}" 
                      ${!isPurchased ? `data-cost="$${spotConfig.cost}"` : ""}
                      draggable="${
                        isPurchased && gameState.grid[i][j] ? "true" : "false"
                      }"
                      >${cellContent}</div></td>`;
        } else {
          html += '<td><div class="grid-cell empty"></div></td>';
        }
      }
      html += "</tr>";
    }

    html += "</table>";
    return html;
  },

  // Update a specific cell with fixed sizing
  updateCell(i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!cell) return;

    const isPurchased = gameState.purchasedCells.has(`${i}-${j}`);
    const spotConfig = GAME_CONFIG.gridConfig.availableSpots.find(
      (spot) => spot.row === i && spot.col === j
    );

    if (isPurchased) {
      cell.className = "grid-cell";
      cell.removeAttribute("data-cost");

      if (gameState.grid[i][j]) {
        cell.classList.add("occupied");
        cell.innerHTML = `<span class="animal-emoji">${
          GAME_CONFIG.animalEmojis[gameState.grid[i][j]]
        }</span>`;
        cell.draggable = true;
      } else {
        cell.classList.remove("occupied");
        cell.innerHTML = "";
        cell.draggable = false;
      }
    } else {
      cell.className = "grid-cell grass";
      cell.setAttribute("data-cost", `$${spotConfig.cost}`);
      cell.innerHTML = "";
      cell.draggable = false;
    }
  },

  // Setup grass cell for purchase
  setupGrassCell(i, j, cost) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!cell) return;

    cell.addEventListener("click", () => {
      if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.purchasedCells.add(`${i}-${j}`);
        updateMoney();
        this.updateCell(i, j);
        updateMergeablePairs();
        updateStatus(`Purchased grid spot for $${cost}! 🌱`);
      } else {
        updateStatus(`Need $${cost} to purchase this spot! 😕`);
        document.body.classList.add("screen-shake");
        setTimeout(() => document.body.classList.remove("screen-shake"), 500);
      }
    });
  },

  // Initialize grid event listeners
  initializeGridEventListeners() {
    // Add event listeners to all grid cells
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      const cell = document.getElementById(`cell-${i}-${j}`);
      if (!cell) return;

      // Mouse events
      cell.addEventListener("mousedown", (e) => this.handleMouseDown(e, i, j));
      cell.addEventListener("dragstart", (e) => this.handleDragStart(e, i, j));
      cell.addEventListener("dragover", (e) => this.handleDragOver(e, i, j));
      cell.addEventListener("drop", (e) => this.handleDrop(e, i, j));
      cell.addEventListener("dragend", (e) => this.handleDragEnd(e, i, j));

      // Touch events for mobile
      cell.addEventListener("touchstart", (e) =>
        this.handleTouchStart(e, i, j)
      );
      cell.addEventListener("touchmove", (e) => this.handleTouchMove(e, i, j));
      cell.addEventListener("touchend", (e) => this.handleTouchEnd(e, i, j));
    });
  },

  // Handle mouse down
  handleMouseDown(e, i, j) {
    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;

    if (e.shiftKey) {
      // Shift+click to sell
      sellAnimal(i, j, gameState.grid[i][j]);
    } else {
      gameState.selectedCell = { i, j };
    }
  },

  // Handle drag start
  handleDragStart(e, i, j) {
    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j]) {
      e.preventDefault();
      return;
    }

    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");
    this.showValidTargets(i, j);
  },

  // Handle drag over
  handleDragOver(e, i, j) {
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    if (sourceI === i && sourceJ === j) return;

    const cell = document.getElementById(`cell-${i}-${j}`);

    if (this.canMerge(sourceI, sourceJ, i, j)) {
      cell.classList.add("drag-valid-target");
    } else {
      cell.classList.add("drag-invalid-target");
    }
  },

  // Handle drop
  handleDrop(e, i, j) {
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    if (this.canMerge(sourceI, sourceJ, i, j)) {
      mergeAnimals(sourceI, sourceJ, i, j);
    }

    this.clearValidTargets();
    const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
    sourceCell.classList.remove("drag-preview");
    gameState.draggedCell = null;
  },

  // Handle drag end
  handleDragEnd(e, i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.remove("drag-preview");
    this.clearValidTargets();
    gameState.draggedCell = null;
  },

  // Handle touch start
  handleTouchStart(e, i, j) {
    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;

    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");
    this.showValidTargets(i, j);
  },

  // Handle touch move
  handleTouchMove(e, i, j) {
    e.preventDefault();
  },

  // Handle touch end
  handleTouchEnd(e, i, j) {
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );

    if (
      elementBelow &&
      elementBelow.id &&
      elementBelow.id.startsWith("cell-")
    ) {
      const [, targetI, targetJ] = elementBelow.id.split("-").map(Number);

      if (
        this.canMerge(
          gameState.draggedCell.i,
          gameState.draggedCell.j,
          targetI,
          targetJ
        )
      ) {
        mergeAnimals(
          gameState.draggedCell.i,
          gameState.draggedCell.j,
          targetI,
          targetJ
        );
      }
    }

    this.clearValidTargets();
    const sourceCell = document.getElementById(
      `cell-${gameState.draggedCell.i}-${gameState.draggedCell.j}`
    );
    sourceCell.classList.remove("drag-preview");
    gameState.draggedCell = null;
  },

  // Check if merge is possible
  canMerge(sourceI, sourceJ, targetI, targetJ) {
    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) return false;

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    if (!sourceType || !targetType) return false;
    if (sourceType !== targetType) return false;
    if (!GAME_CONFIG.animalTypes[sourceType].mergeTo) return false;

    // Check if they're adjacent
    const distance = Math.abs(sourceI - targetI) + Math.abs(sourceJ - targetJ);
    return distance === 1;
  },

  // Show valid merge targets
  showValidTargets(sourceI, sourceJ) {
    const neighbors = [
      { di: 0, dj: 1 }, // Right
      { di: 1, dj: 0 }, // Down
      { di: 0, dj: -1 }, // Left
      { di: -1, dj: 0 }, // Up
    ];

    neighbors.forEach(({ di, dj }) => {
      const ni = sourceI + di;
      const nj = sourceJ + dj;

      if (this.canMerge(sourceI, sourceJ, ni, nj)) {
        const cell = document.getElementById(`cell-${ni}-${nj}`);
        if (cell) {
          cell.classList.add("drag-valid-target");
        }
      }
    });
  },

  // Clear all drag target highlights
  clearValidTargets() {
    document.querySelectorAll(".drag-valid-target").forEach((cell) => {
      cell.classList.remove("drag-valid-target");
    });
    document.querySelectorAll(".drag-invalid-target").forEach((cell) => {
      cell.classList.remove("drag-invalid-target");
    });
  },
};
