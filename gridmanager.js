const gridManager = {
  initializeGridState() {
    // Only initialize if grid doesn't exist
    if (!gameState.grid || gameState.grid.length === 0) {
      gameState.grid = Array(5)
        .fill(null)
        .map(() => Array(8).fill(null));
    }

    // Only initialize if purchasedCells doesn't exist
    if (!gameState.purchasedCells || gameState.purchasedCells.size === 0) {
      gameState.purchasedCells = new Set();
      GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
        if (cost === 0) {
          gameState.purchasedCells.add(`${row}-${col}`);
        }
      });
    }
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
                      ${!isPurchased ? `data-cost="${spotConfig.cost}"` : ""}
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
      // FIX: Clear all highlighting classes when updating cell
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
      // FIX: Clear all highlighting classes for grass cells too
      cell.className = "grid-cell grass";
      cell.setAttribute("data-cost", `${spotConfig.cost}`);
      cell.innerHTML = "";
      cell.draggable = false;
    }
  },

  setupGrassCell(i, j, cost) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!cell) return;

    // Add hover sound for grass cells
    // cell.addEventListener("mouseenter", () => {
    //   audioManager.playSound("button-hover");
    // });

    cell.addEventListener("click", () => {
      gameState.lastInteractionTime = Date.now(); // Track interaction

      // FIXED: Check money first, but don't deduct until after successful purchase
      if (gameState.money >= cost) {
        // FIXED: Add the cell to purchased set first (this is the "action")
        gameState.purchasedCells.add(`${i}-${j}`);

        // FIXED: Only deduct money AFTER successful purchase
        gameState.money -= cost;

        // Play grid expansion sound
        audioManager.playSound("grid-expansion");

        updateMoney();
        this.updateCell(i, j);
        updateMergeablePairs();
        updateStatus(`Purchased grid spot for ${cost}! 🌱`);
        saveManager.saveOnAction(); // Save after purchasing grid cell

        // Check achievements after purchasing grid cell
        achievementManager.checkAchievements();
      } else {
        // Play invalid action sound for insufficient funds
        audioManager.playSound("invalid-action");
        updateStatus(`Need ${cost} to purchase this spot! 😕`);
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

      // NEW: Add right-click event listener
      cell.addEventListener("contextmenu", (e) =>
        this.handleRightClick(e, i, j)
      );

      cell.addEventListener("touchstart", (e) =>
        this.handleTouchStart(e, i, j)
      );
      cell.addEventListener("touchmove", (e) => this.handleTouchMove(e, i, j));
      cell.addEventListener("touchend", (e) => this.handleTouchEnd(e, i, j));
    });
  },

  // NEW: Handle right-click to send animals to butcher
  handleRightClick(e, i, j) {
    e.preventDefault(); // Prevent context menu
    gameState.lastInteractionTime = Date.now(); // Track interaction

    // Only work on purchased cells with animals
    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j]) {
      return;
    }

    const animalType = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[animalType];

    // Only sellable animals can be sent to butcher
    if (animalConfig.sellPrice <= 0) {
      audioManager.playSound("invalid-action");
      updateStatus(`${animalConfig.name} cannot be sold! 😕`);
      return;
    }

    // Check if butcher has space
    const house = gameState.slaughterHouses[0];
    if (!house || house.queue.length >= 10) {
      audioManager.playSound("invalid-action");
      updateStatus("Butcher shop queue is full! 😕");
      return;
    }

    // Send to butcher
    if (slaughterHouseManager.addAnimalToQueue(0, animalType, i, j)) {
      updateStatus(`Right-clicked ${animalConfig.name} to butcher! 🔪`);
    }
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

    // Play random "ooh" sound when picking up an animal (not eggs)
    const animalType = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    if (animalConfig.sellPrice > 0) {
      // Only animals, not eggs, have sell price
      audioManager.playRandomSound("ooh");
    }

    e.dataTransfer.setData("text/plain", `${i}-${j}`);
    e.dataTransfer.effectAllowed = "move";

    gameState.draggedCell = { i, j };

    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");

    // FIX: Clear any existing highlights before showing new ones
    this.clearValidTargets();

    // FIX: Only show valid targets for the specific cell being dragged
    this.showValidTargets(i, j);

    // Check if dragged animal can be sold and trigger butcher wiggle
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
      // Play invalid action sound for unsuccessful drop
      audioManager.playSound("invalid-action");
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

    // Play random "ooh" sound when picking up an animal (not eggs) on touch
    const animalType = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    if (animalConfig.sellPrice > 0) {
      // Only animals, not eggs, have sell price
      audioManager.playRandomSound("ooh");
    }

    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");

    // FIX: Clear any existing highlights before showing new ones
    this.clearValidTargets();
    this.showValidTargets(i, j);

    // Check if dragged animal can be sold and trigger butcher wiggle
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

  // FIX: Completely rewritten to only highlight actual valid targets
  showValidTargets(sourceI, sourceJ) {
    const sourceType = gameState.grid[sourceI][sourceJ];
    if (!sourceType) return;

    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      // Skip the source cell itself
      if (i === sourceI && j === sourceJ) return;

      // Only check purchased cells
      if (!gameState.purchasedCells.has(`${i}-${j}`)) return;

      const cell = document.getElementById(`cell-${i}-${j}`);
      if (!cell) return;

      if (
        this.canMerge(sourceI, sourceJ, i, j) ||
        this.canSwap(sourceI, sourceJ, i, j) ||
        this.canMoveToEmpty(sourceI, sourceJ, i, j)
      ) {
        cell.classList.add("drag-valid-target");
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
    saveManager.saveOnAction(); // Save after moving animal
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
    saveManager.saveOnAction(); // Save after swapping animals
  },

  // FIX: More thorough clearing of all highlighting classes
  clearValidTargets() {
    // Remove all drag-related classes from all grid cells
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      const cell = document.getElementById(`cell-${i}-${j}`);
      if (cell) {
        cell.classList.remove(
          "drag-valid-target",
          "drag-invalid-target",
          "auto-merge-glow",
          "border-purple-500",
          "border-2",
          "border-green-500",
          "new-animal-spawn"
        );
      }
    });
  },
};
