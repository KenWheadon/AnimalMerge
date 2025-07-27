const gridManager = {
  initializeGridState() {
    gameState.grid = Array(5)
      .fill(null)
      .map(() => Array(8).fill(null));

    gameState.purchasedCells = new Set();
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
      if (cost === 0) {
        gameState.purchasedCells.add(`${row}-${col}`);
      }
    });
  },

  generateGridHTML() {
    let html = '<table class="game-grid">';

    for (let i = 0; i < 5; i++) {
      html += "<tr>";
      for (let j = 0; j < 4; j++) {
        const spotConfig = GAME_CONFIG.gridConfig.availableSpots.find(
          (spot) => spot.row === i && spot.col === j
        );

        if (spotConfig) {
          const isPurchased = gameState.purchasedCells.has(`${i}-${j}`);
          const cellClass = isPurchased ? "grid-cell" : "grid-cell grass";
          const cellContent =
            isPurchased && gameState.grid[i][j]
              ? `<img src="${
                  GAME_CONFIG.animalImages[gameState.grid[i][j]]
                }" alt="${gameState.grid[i][j]}" class="animal-image" />`
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

      // Remove any existing value display
      const existingValue = cell.querySelector(".grid-cell-value");
      if (existingValue) {
        existingValue.remove();
      }

      if (gameState.grid[i][j]) {
        const animalType = gameState.grid[i][j];
        const animalConfig = GAME_CONFIG.animalTypes[animalType];

        cell.classList.add("occupied");
        cell.innerHTML = `<img src="${GAME_CONFIG.animalImages[animalType]}" alt="${animalType}" class="animal-image" />`;

        // Add butcher value display if animal has sell price > 0
        if (animalConfig.sellPrice > 0) {
          const valueDisplay = document.createElement("div");
          valueDisplay.className = "grid-cell-value";
          valueDisplay.textContent = `💰${animalConfig.sellPrice}`;
          cell.appendChild(valueDisplay);
        }

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

  setupGrassCell(i, j, cost) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!cell) return;

    cell.addEventListener("click", () => {
      gameState.lastInteractionTime = Date.now(); // Track interaction

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

  initializeGridEventListeners() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      const cell = document.getElementById(`cell-${i}-${j}`);
      if (!cell) return;

      cell.addEventListener("mousedown", (e) => this.handleMouseDown(e, i, j));
      cell.addEventListener("dragstart", (e) => this.handleDragStart(e, i, j));
      cell.addEventListener("dragover", (e) => this.handleDragOver(e, i, j));
      cell.addEventListener("drop", (e) => this.handleDrop(e, i, j));
      cell.addEventListener("dragend", (e) => this.handleDragEnd(e, i, j));
      cell.addEventListener("dragenter", (e) => this.handleDragEnter(e, i, j));
      cell.addEventListener("dragleave", (e) => this.handleDragLeave(e, i, j));

      cell.addEventListener("touchstart", (e) =>
        this.handleTouchStart(e, i, j)
      );
      cell.addEventListener("touchmove", (e) => this.handleTouchMove(e, i, j));
      cell.addEventListener("touchend", (e) => this.handleTouchEnd(e, i, j));
    });
  },

  handleMouseDown(e, i, j) {
    gameState.lastInteractionTime = Date.now(); // Track interaction

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;

    if (e.shiftKey) {
      sellAnimal(i, j, gameState.grid[i][j]);
    } else {
      gameState.selectedCell = { i, j };
    }
  },

  handleDragStart(e, i, j) {
    gameState.lastInteractionTime = Date.now(); // Track interaction

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j]) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData("text/plain", `${i}-${j}`);
    e.dataTransfer.effectAllowed = "move";

    gameState.draggedCell = { i, j };

    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");

    this.showValidTargets(i, j);

    // Check if dragged animal can be sold and trigger butcher wiggle
    const animalType = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    if (animalConfig.sellPrice > 0) {
      const butcherImage = document.querySelector(".butcher-image");
      if (butcherImage) {
        butcherImage.classList.add("butcher-wiggle");
      }
    }
  },

  handleDragOver(e, i, j) {
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    if (sourceI === i && sourceJ === j) return;

    e.dataTransfer.dropEffect = "move";
  },

  handleDragEnter(e, i, j) {
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    if (sourceI === i && sourceJ === j) return;

    const cell = document.getElementById(`cell-${i}-${j}`);

    if (this.canMerge(sourceI, sourceJ, i, j)) {
      cell.classList.add("drag-valid-target");
      cell.classList.remove("drag-invalid-target");
    } else if (this.canSwap(sourceI, sourceJ, i, j)) {
      cell.classList.add("drag-valid-target");
      cell.classList.remove("drag-invalid-target");
    } else if (this.canMoveToEmpty(sourceI, sourceJ, i, j)) {
      cell.classList.add("drag-valid-target");
      cell.classList.remove("drag-invalid-target");
    } else {
      cell.classList.add("drag-invalid-target");
      cell.classList.remove("drag-valid-target");
    }
  },

  handleDragLeave(e, i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.remove("drag-valid-target", "drag-invalid-target");
  },

  handleDrop(e, i, j) {
    e.preventDefault();
    gameState.lastInteractionTime = Date.now(); // Track interaction

    if (!gameState.draggedCell) {
      return;
    }

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    if (this.canMerge(sourceI, sourceJ, i, j)) {
      mergeAnimals(sourceI, sourceJ, i, j);
    } else if (this.canSwap(sourceI, sourceJ, i, j)) {
      this.swapAnimals(sourceI, sourceJ, i, j);
    } else if (this.canMoveToEmpty(sourceI, sourceJ, i, j)) {
      this.moveToEmpty(sourceI, sourceJ, i, j);
    } else {
      updateStatus("Cannot perform this action! 😕");
    }

    this.clearValidTargets();
    const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
    if (sourceCell) {
      sourceCell.classList.remove("drag-preview");
    }

    // Remove butcher wiggle
    const butcherImage = document.querySelector(".butcher-image");
    if (butcherImage) {
      butcherImage.classList.remove("butcher-wiggle");
    }

    gameState.draggedCell = null;
  },

  handleDragEnd(e, i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (cell) {
      cell.classList.remove("drag-preview");
    }

    this.clearValidTargets();

    // Remove butcher wiggle
    const butcherImage = document.querySelector(".butcher-image");
    if (butcherImage) {
      butcherImage.classList.remove("butcher-wiggle");
    }

    gameState.draggedCell = null;
  },

  handleTouchStart(e, i, j) {
    gameState.lastInteractionTime = Date.now(); // Track interaction

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;

    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");
    this.showValidTargets(i, j);

    // Check if dragged animal can be sold and trigger butcher wiggle
    const animalType = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    if (animalConfig.sellPrice > 0) {
      const butcherImage = document.querySelector(".butcher-image");
      if (butcherImage) {
        butcherImage.classList.add("butcher-wiggle");
      }
    }
  },

  handleTouchMove(e, i, j) {
    e.preventDefault();
  },

  handleTouchEnd(e, i, j) {
    e.preventDefault();
    gameState.lastInteractionTime = Date.now(); // Track interaction

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
      } else if (
        this.canSwap(
          gameState.draggedCell.i,
          gameState.draggedCell.j,
          targetI,
          targetJ
        )
      ) {
        this.swapAnimals(
          gameState.draggedCell.i,
          gameState.draggedCell.j,
          targetI,
          targetJ
        );
      } else if (
        this.canMoveToEmpty(
          gameState.draggedCell.i,
          gameState.draggedCell.j,
          targetI,
          targetJ
        )
      ) {
        this.moveToEmpty(
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
    if (sourceCell) {
      sourceCell.classList.remove("drag-preview");
    }

    // Remove butcher wiggle
    const butcherImage = document.querySelector(".butcher-image");
    if (butcherImage) {
      butcherImage.classList.remove("butcher-wiggle");
    }

    gameState.draggedCell = null;
  },

  canMerge(sourceI, sourceJ, targetI, targetJ) {
    // Fix: Prevent self-merging - same cell cannot merge with itself
    if (sourceI === targetI && sourceJ === targetJ) {
      return false;
    }

    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) {
      return false;
    }

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    if (!sourceType || !targetType) {
      return false;
    }

    if (sourceType !== targetType) {
      return false;
    }

    if (!GAME_CONFIG.animalTypes[sourceType].mergeTo) {
      return false;
    }

    return true;
  },

  canSwap(sourceI, sourceJ, targetI, targetJ) {
    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) {
      return false;
    }

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    if (!sourceType || !targetType) {
      return false;
    }

    if (sourceType !== targetType) {
      return true;
    }

    return false;
  },

  canMoveToEmpty(sourceI, sourceJ, targetI, targetJ) {
    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) {
      return false;
    }

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    if (!sourceType) {
      return false;
    }

    if (targetType) {
      return false;
    }

    return true;
  },

  showValidTargets(sourceI, sourceJ) {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        if (i === sourceI && j === sourceJ) return;

        if (
          this.canMerge(sourceI, sourceJ, i, j) ||
          this.canSwap(sourceI, sourceJ, i, j) ||
          this.canMoveToEmpty(sourceI, sourceJ, i, j)
        ) {
          const cell = document.getElementById(`cell-${i}-${j}`);
          if (cell) {
            cell.classList.add("drag-valid-target");
          }
        }
      }
    });
  },

  moveToEmpty(sourceI, sourceJ, targetI, targetJ) {
    const sourceType = gameState.grid[sourceI][sourceJ];

    gameState.grid[sourceI][sourceJ] = null;
    gameState.grid[targetI][targetJ] = sourceType;

    this.updateCell(sourceI, sourceJ);
    this.updateCell(targetI, targetJ);

    updateMergeablePairs();

    const animalConfig = GAME_CONFIG.animalTypes[sourceType];
    updateStatus(`Moved ${animalConfig.name} to empty space! 📦`);
  },

  swapAnimals(sourceI, sourceJ, targetI, targetJ) {
    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    gameState.grid[sourceI][sourceJ] = targetType;
    gameState.grid[targetI][targetJ] = sourceType;

    this.updateCell(sourceI, sourceJ);
    this.updateCell(targetI, targetJ);

    updateMergeablePairs();

    const sourceConfig = GAME_CONFIG.animalTypes[sourceType];
    const targetConfig = GAME_CONFIG.animalTypes[targetType];
    updateStatus(`Swapped ${sourceConfig.name} and ${targetConfig.name}! 🔄`);
  },

  clearValidTargets() {
    document.querySelectorAll(".drag-valid-target").forEach((cell) => {
      cell.classList.remove("drag-valid-target");
    });
    document.querySelectorAll(".drag-invalid-target").forEach((cell) => {
      cell.classList.remove("drag-invalid-target");
    });
  },
};
