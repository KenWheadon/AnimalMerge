// Grid Manager - Handles all grid-related functionality
const gridManager = {
  // Initialize grid dimensions based on available spots
  initializeGridState() {
    const maxRow =
      Math.max(
        ...GAME_CONFIG.gridConfig.availableSpots.map((spot) => spot.row)
      ) + 1;
    const maxCol =
      Math.max(
        ...GAME_CONFIG.gridConfig.availableSpots.map((spot) => spot.col)
      ) + 1;
    gameState.grid = Array(maxRow)
      .fill()
      .map(() => Array(maxCol).fill(null));
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
      if (cost === 0) {
        gameState.purchasedCells.add(`${row}-${col}`);
      }
    });
  },

  // HTML Structure Generation
  generateGridHTML() {
    const maxRow =
      Math.max(
        ...GAME_CONFIG.gridConfig.availableSpots.map((spot) => spot.row)
      ) + 1;
    const maxCol =
      Math.max(
        ...GAME_CONFIG.gridConfig.availableSpots.map((spot) => spot.col)
      ) + 1;
    let gridHTML = `<div class="game-grid grid grid-cols-${maxCol} gap-3 w-${
      80 * maxCol
    } h-${80 * maxRow} p-4 rounded-2xl mx-auto">`;
    for (let i = 0; i < maxRow; i++) {
      for (let j = 0; j < maxCol; j++) {
        if (
          GAME_CONFIG.gridConfig.availableSpots.some(
            (spot) => spot.row === i && spot.col === j
          )
        ) {
          gridHTML += `<div id="cell-${i}-${j}" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>`;
        } else {
          gridHTML += `<div class="grid-cell invisible"></div>`; // Placeholder for non-available spots
        }
      }
    }
    gridHTML += `</div>`;
    return gridHTML;
  },

  // Event Listeners
  initializeGridEventListeners() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
      const cell = document.getElementById(`cell-${row}-${col}`);
      if (!cell) return;

      if (!gameState.purchasedCells.has(`${row}-${col}`)) {
        cell.addEventListener("click", () =>
          this.handleCellPurchase(row, col, cost)
        );
      } else {
        cell.addEventListener("click", () => this.handleCellClick(row, col));
        cell.addEventListener("dragstart", (e) =>
          this.handleDragStart(row, col, e)
        );
        cell.addEventListener("dragover", (e) => e.preventDefault());
        cell.addEventListener("drop", (e) => this.handleDrop(row, col, e));
        cell.addEventListener("touchstart", (e) =>
          this.handleTouchStart(row, col, e)
        );
        cell.addEventListener("touchmove", (e) => this.handleTouchMove(e));
        cell.addEventListener("touchend", (e) =>
          this.handleTouchEnd(row, col, e)
        );
      }
    });
  },

  setupGrassCell(row, col, cost) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (!cell) return;
    cell.classList.add("grass");
    cell.draggable = false;
    cell.setAttribute("data-cost", cost);
    cell.style.pointerEvents = "auto";
  },

  handleCellPurchase(row, col, cost) {
    if (gameState.purchasedCells.has(`${row}-${col}`)) return;

    if (gameState.money >= cost) {
      gameState.money -= cost;
      gameState.purchasedCells.add(`${row}-${col}`);

      // Convert grass cell to regular cell
      const cell = document.getElementById(`cell-${row}-${col}`);
      cell.classList.remove("grass");
      cell.removeAttribute("data-cost");
      cell.draggable = true;

      // Remove old event listeners and add new ones
      cell.replaceWith(cell.cloneNode(true));
      const newCell = document.getElementById(`cell-${row}-${col}`);
      newCell.addEventListener("click", () => this.handleCellClick(row, col));
      newCell.addEventListener("dragstart", (e) =>
        this.handleDragStart(row, col, e)
      );
      newCell.addEventListener("dragover", (e) => e.preventDefault());
      newCell.addEventListener("drop", (e) => this.handleDrop(row, col, e));
      newCell.addEventListener("touchstart", (e) =>
        this.handleTouchStart(row, col, e)
      );
      newCell.addEventListener("touchmove", (e) => this.handleTouchMove(e));
      newCell.addEventListener("touchend", (e) =>
        this.handleTouchEnd(row, col, e)
      );

      updateMoney();
      updateMergeablePairs();
      eventManager.showAchievement(
        `🌱 Purchased Grid Square (${row}, ${col})!`
      );
      updateStatus(`Purchased grid square for ${cost}! 🌱`);
    } else {
      updateStatus(`Need ${cost} to purchase this square! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Cell Interaction Handlers
  handleCellClick(i, j) {
    if (gameState.draggedCell) return;
    if (!gameState.purchasedCells.has(`${i}-${j}`)) return;

    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!gameState.grid[i][j]) return;

    if (!gameState.selectedCell) {
      gameState.selectedCell = { i, j };
      cell.classList.add("bg-blue-200");
      eventManager.clearAutoMergeHighlight();
      updateStatus(
        `Selected ${
          GAME_CONFIG.animalEmojis[gameState.grid[i][j]]
        }. Drag to Slaughter House to sell!`
      );
    } else {
      const prev = gameState.selectedCell;
      document
        .getElementById(`cell-${prev.i}-${prev.j}`)
        .classList.remove("bg-blue-200");

      if (prev.i === i && prev.j === j) {
        // Sell animal using first available slaughter house
        const type = gameState.grid[i][j];
        if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
          if (gameState.slaughterHouses.length > 0) {
            slaughterHouseManager.addAnimalToQueue(0, type, i, j);
          }
        } else {
          updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
        }
      } else if (
        gameState.grid[prev.i][prev.j] === gameState.grid[i][j] &&
        GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
      ) {
        // Merge animals
        mergeAnimals(prev.i, prev.j, i, j);
      } else {
        updateStatus("Cannot merge different or unmergeable animals! 😕");
      }
      gameState.selectedCell = null;
    }
  },

  handleDragStart(i, j, e) {
    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;
    gameState.draggedCell = { i, j };
    e.dataTransfer.setData("text/plain", JSON.stringify({ i, j }));
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");
    eventManager.clearAutoMergeHighlight();
    eventManager.clearWiggleGlow();
    this.highlightValidTargets(i, j);
  },

  handleDrop(i, j, e) {
    e.preventDefault();
    if (!gameState.draggedCell || !gameState.purchasedCells.has(`${i}-${j}`))
      return;
    const source = gameState.draggedCell;
    const sourceCell = document.getElementById(`cell-${source.i}-${source.j}`);
    sourceCell.classList.remove("drag-preview");
    this.clearValidTargets();

    if (
      gameState.grid[i][j] &&
      gameState.grid[source.i][source.j] === gameState.grid[i][j] &&
      GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
    ) {
      mergeAnimals(source.i, source.j, i, j);
    } else {
      updateStatus("Cannot merge here! 😕");
    }
    gameState.draggedCell = null;
  },

  handleTouchStart(i, j, e) {
    e.preventDefault();
    if (!gameState.grid[i][j]) return;
    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");
    eventManager.clearAutoMergeHighlight();
    eventManager.clearWiggleGlow();
    this.highlightValidTargets(i, j);
  },

  handleTouchMove(e) {
    e.preventDefault();
  },

  handleTouchEnd(i, j, e) {
    e.preventDefault();
    if (!gameState.draggedCell) return;
    const source = gameState.draggedCell;
    const sourceCell = document.getElementById(`cell-${source.i}-${source.j}`);
    sourceCell.classList.remove("drag-preview");
    this.clearValidTargets();

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // Check if dropped on any slaughter house
    if (element && element.id && element.id.startsWith("slaughterHouse")) {
      const houseIndex = parseInt(element.getAttribute("data-house-index"));
      const type = gameState.grid[source.i][source.j];
      if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
        slaughterHouseManager.addAnimalToQueue(
          houseIndex,
          type,
          source.i,
          source.j
        );
      } else {
        updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
      }
    } else if (
      gameState.grid[i][j] &&
      gameState.grid[source.i][source.j] === gameState.grid[i][j] &&
      GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
    ) {
      mergeAnimals(source.i, source.j, i, j);
    } else {
      updateStatus("Cannot merge or sell here! 😕");
    }
    gameState.draggedCell = null;
  },

  // Visual Helper Functions
  highlightValidTargets(i, j) {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: di, col: dj }) => {
      if (di === i && dj === j) return;
      if (!gameState.purchasedCells.has(`${di}-${dj}`)) return;

      const targetCell = document.getElementById(`cell-${di}-${dj}`);
      if (
        gameState.grid[di][dj] === gameState.grid[i][j] &&
        GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
      ) {
        targetCell.classList.add("drag-valid-target");
      } else if (gameState.grid[di][dj]) {
        targetCell.classList.add("drag-invalid-target");
      }
    });
  },

  clearValidTargets() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      const cell = document.getElementById(`cell-${i}-${j}`);
      if (cell) {
        cell.classList.remove("drag-valid-target", "drag-invalid-target");
      }
    });
  },

  // UI Update Functions
  updateCell(i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!cell) return;
    const animal = gameState.grid[i][j];
    cell.textContent = animal ? GAME_CONFIG.animalEmojis[animal] : "";

    if (animal) {
      cell.classList.add("occupied");
    } else {
      cell.classList.remove("occupied");
    }
  },
};
