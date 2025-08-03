const gridManager = {
  initializeGridState() {
    gameState.grid = Array(GAME_CONFIG.gridConfig.rows)
      .fill(null)
      .map(() => Array(GAME_CONFIG.gridConfig.cols).fill(null));

    gameState.purchasedCells = new Set();
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
      if (cost === 0) {
        gameState.purchasedCells.add(`${row}-${col}`);
      }
    });
  },

  generateGridHTML() {
    let html = '<table class="game-grid">';

    for (let i = 0; i < GAME_CONFIG.gridConfig.rows; i++) {
      html += "<tr>";
      for (let j = 0; j < GAME_CONFIG.gridConfig.cols; j++) {
        const spotConfig = GAME_CONFIG.gridConfig.availableSpots.find(
          (spot) => spot.row === i && spot.col === j
        );

        if (spotConfig) {
          const isPurchased = gameState.purchasedCells.has(`${i}-${j}`);
          const cellClass = isPurchased ? "grid-cell" : "grid-cell grass";

          // Only show animals that are valid for the current level
          let cellContent = "";
          if (
            isPurchased &&
            gameState.grid[i][j] &&
            validateAnimalForLevel(gameState.grid[i][j])
          ) {
            cellContent = `<img src="${
              GAME_CONFIG.animalImages[gameState.grid[i][j]]
            }" alt="${gameState.grid[i][j]}" class="animal-image" />`;
          }

          html += `<td><div id="cell-${i}-${j}" class="${cellClass}" 
                      data-row="${i}" data-col="${j}" 
                      ${!isPurchased ? `data-cost="${spotConfig.cost}"` : ""}
                      draggable="${
                        isPurchased &&
                        gameState.grid[i][j] &&
                        validateAnimalForLevel(gameState.grid[i][j])
                          ? "true"
                          : "false"
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

      const existingValue = cell.querySelector(".grid-cell-value");
      if (existingValue) {
        existingValue.remove();
      }

      // Only display animals that are valid for the current level
      if (
        gameState.grid[i][j] &&
        validateAnimalForLevel(gameState.grid[i][j])
      ) {
        const animalType = gameState.grid[i][j];
        const animalConfig = GAME_CONFIG.animalTypes[animalType];

        cell.classList.add("occupied");
        cell.innerHTML = `<img src="${GAME_CONFIG.animalImages[animalType]}" alt="${animalType}" class="animal-image" />`;

        if (animalConfig.sellPrice > 0) {
          const valueDisplay = utilityManager.createElement(
            "div",
            "grid-cell-value",
            `💰${animalConfig.sellPrice}`
          );
          cell.appendChild(valueDisplay);
        }

        cell.draggable = true;
      } else {
        // Either no animal or invalid animal for current level
        cell.classList.remove("occupied");
        cell.innerHTML = "";
        cell.draggable = false;

        // Clean up invalid animals from the grid
        if (
          gameState.grid[i][j] &&
          !validateAnimalForLevel(gameState.grid[i][j])
        ) {
          gameState.grid[i][j] = null;
        }
      }
    } else {
      cell.className = "grid-cell grass";
      cell.setAttribute("data-cost", `${spotConfig.cost}`);
      cell.innerHTML = "";
      cell.draggable = false;
    }
  },

  setupGrassCell(i, j, cost) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!cell) return;

    utilityManager.addEventListener(
      cell,
      "click",
      () => {
        gameState.lastInteractionTime = Date.now();

        if (gameState.money >= cost) {
          gameState.purchasedCells.add(`${i}-${j}`);
          gameState.money -= cost;

          audioManager.playSound("grid-expansion");

          updateMoney();
          this.updateCell(i, j);
          updateMergeablePairs();
          updateStatus(`Purchased grid spot for ${cost}! 🌱`);
          saveManager.saveOnAction();

          achievementManager.checkAchievements();
        } else {
          audioManager.playSound("invalid-action");
          updateStatus(`Need ${cost} to purchase this spot! 😕`);
          utilityManager.addScreenShake();
        }
      },
      `grassCell_${i}_${j}`
    );
  },

  initializeGridEventListeners() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      const cell = document.getElementById(`cell-${i}-${j}`);
      if (!cell) return;

      const cellId = `cell_${i}_${j}`;

      utilityManager.addEventListener(
        cell,
        "mousedown",
        (e) => this.handleMouseDown(e, i, j),
        `${cellId}_mousedown`
      );
      utilityManager.addEventListener(
        cell,
        "dragstart",
        (e) => this.handleDragStart(e, i, j),
        `${cellId}_dragstart`
      );
      utilityManager.addEventListener(
        cell,
        "dragover",
        (e) => this.handleDragOver(e, i, j),
        `${cellId}_dragover`
      );
      utilityManager.addEventListener(
        cell,
        "drop",
        (e) => this.handleDrop(e, i, j),
        `${cellId}_drop`
      );
      utilityManager.addEventListener(
        cell,
        "dragend",
        (e) => this.handleDragEnd(e, i, j),
        `${cellId}_dragend`
      );
      utilityManager.addEventListener(
        cell,
        "dragenter",
        (e) => this.handleDragEnter(e, i, j),
        `${cellId}_dragenter`
      );
      utilityManager.addEventListener(
        cell,
        "dragleave",
        (e) => this.handleDragLeave(e, i, j),
        `${cellId}_dragleave`
      );
      utilityManager.addEventListener(
        cell,
        "contextmenu",
        (e) => this.handleRightClick(e, i, j),
        `${cellId}_contextmenu`
      );
      utilityManager.addEventListener(
        cell,
        "touchstart",
        (e) => this.handleTouchStart(e, i, j),
        `${cellId}_touchstart`
      );
      utilityManager.addEventListener(
        cell,
        "touchmove",
        (e) => this.handleTouchMove(e, i, j),
        `${cellId}_touchmove`
      );
      utilityManager.addEventListener(
        cell,
        "touchend",
        (e) => this.handleTouchEnd(e, i, j),
        `${cellId}_touchend`
      );
    });
  },

  handleRightClick(e, i, j) {
    e.preventDefault();
    gameState.lastInteractionTime = Date.now();

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j]) {
      return;
    }

    const animalType = gameState.grid[i][j];

    // Validate animal is still valid for current level
    if (!validateAnimalForLevel(animalType)) {
      audioManager.playSound("invalid-action");
      updateStatus("This animal is not valid in the current level! 🚫");
      return;
    }

    const animalConfig = GAME_CONFIG.animalTypes[animalType];

    if (animalConfig.sellPrice <= 0) {
      audioManager.playSound("invalid-action");
      updateStatus(`${animalConfig.name} cannot be sold! 😕`);
      return;
    }

    const house = gameState.slaughterHouses[0];
    if (
      !house ||
      house.queue.length >= GAME_CONFIG.gameplayConfig.slaughterHouseQueueMax
    ) {
      audioManager.playSound("invalid-action");
      updateStatus("Butcher shop queue is full! 😕");
      return;
    }

    if (slaughterHouseManager.addAnimalToQueue(0, animalType, i, j)) {
      updateStatus(`Right-clicked ${animalConfig.name} to butcher! 🔪`);
    }
  },

  handleMouseDown(e, i, j) {
    gameState.lastInteractionTime = Date.now();

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;

    // Validate animal is still valid for current level
    if (!validateAnimalForLevel(gameState.grid[i][j])) {
      return;
    }

    if (e.shiftKey) {
      sellAnimal(i, j, gameState.grid[i][j]);
    } else {
      gameState.selectedCell = { i, j };
    }
  },

  handleDragStart(e, i, j) {
    gameState.lastInteractionTime = Date.now();

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j]) {
      e.preventDefault();
      return;
    }

    const animalType = gameState.grid[i][j];

    // Validate animal is still valid for current level
    if (!validateAnimalForLevel(animalType)) {
      e.preventDefault();
      return;
    }

    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    if (animalConfig.sellPrice > 0) {
      audioManager.playRandomSound("ooh");
    }

    e.dataTransfer.setData("text/plain", `${i}-${j}`);
    e.dataTransfer.effectAllowed = "move";

    gameState.draggedCell = { i, j };

    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");

    this.clearValidTargets();
    this.showValidTargets(i, j);

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

    if (
      this.canMerge(sourceI, sourceJ, i, j) ||
      this.canSwap(sourceI, sourceJ, i, j) ||
      this.canMoveToEmpty(sourceI, sourceJ, i, j)
    ) {
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
    gameState.lastInteractionTime = Date.now();

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
      audioManager.playSound("invalid-action");
      updateStatus("Cannot perform this action! 😕");
    }

    this.clearValidTargets();
    const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
    if (sourceCell) {
      sourceCell.classList.remove("drag-preview");
    }

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

    const butcherImage = document.querySelector(".butcher-image");
    if (butcherImage) {
      butcherImage.classList.remove("butcher-wiggle");
    }

    gameState.draggedCell = null;
  },

  handleTouchStart(e, i, j) {
    gameState.lastInteractionTime = Date.now();

    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j])
      return;

    const animalType = gameState.grid[i][j];

    // Validate animal is still valid for current level
    if (!validateAnimalForLevel(animalType)) {
      return;
    }

    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    if (animalConfig.sellPrice > 0) {
      audioManager.playRandomSound("ooh");
    }

    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");

    this.clearValidTargets();
    this.showValidTargets(i, j);

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
    gameState.lastInteractionTime = Date.now();

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

    const butcherImage = document.querySelector(".butcher-image");
    if (butcherImage) {
      butcherImage.classList.remove("butcher-wiggle");
    }

    gameState.draggedCell = null;
  },

  canMerge(sourceI, sourceJ, targetI, targetJ) {
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

    // Check if both animals and the merge result are valid for current level
    return canMergeInLevel(sourceType, targetType);
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

    // Both animals must be valid for current level to swap
    if (
      !validateAnimalForLevel(sourceType) ||
      !validateAnimalForLevel(targetType)
    ) {
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

    // Source animal must be valid for current level
    return validateAnimalForLevel(sourceType);
  },

  showValidTargets(sourceI, sourceJ) {
    const sourceType = gameState.grid[sourceI][sourceJ];
    if (!sourceType || !validateAnimalForLevel(sourceType)) return;

    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (i === sourceI && j === sourceJ) return;

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
    saveManager.saveOnAction();
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
    saveManager.saveOnAction();
  },

  clearValidTargets() {
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
