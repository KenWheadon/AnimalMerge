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
      for (let j = 0; j < 5; j++) {
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
        cell.innerHTML = `<img src="${
          GAME_CONFIG.animalImages[gameState.grid[i][j]]
        }" alt="${gameState.grid[i][j]}" class="animal-image" />`;
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
      cell.addEventListener("dragenter", (e) => this.handleDragEnter(e, i, j));
      cell.addEventListener("dragleave", (e) => this.handleDragLeave(e, i, j));

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

  // Handle drag start - FIXED: Better data transfer and state management
  handleDragStart(e, i, j) {
    if (!gameState.purchasedCells.has(`${i}-${j}`) || !gameState.grid[i][j]) {
      e.preventDefault();
      return;
    }

    console.log(
      `🎯 Drag started on cell ${i}-${j} with animal: ${gameState.grid[i][j]}`
    );

    // Set drag data - CRITICAL for proper drag/drop
    e.dataTransfer.setData("text/plain", `${i}-${j}`);
    e.dataTransfer.effectAllowed = "move";

    // Set game state
    gameState.draggedCell = { i, j };

    // Add visual feedback
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add("drag-preview");

    // Show valid merge targets
    this.showValidTargets(i, j);
  },

  // Handle drag over - FIXED: Proper event prevention
  handleDragOver(e, i, j) {
    // CRITICAL: Must prevent default to allow drop
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    // Don't highlight the source cell
    if (sourceI === i && sourceJ === j) return;

    // Set the drop effect
    e.dataTransfer.dropEffect = "move";
  },

  // Handle drag enter - FIXED: Support merge, swap, and move to empty space
  handleDragEnter(e, i, j) {
    e.preventDefault();

    if (!gameState.draggedCell) return;

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    // Don't highlight the source cell
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

  // Handle drag leave - FIXED: Clean up visual feedback
  handleDragLeave(e, i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.remove("drag-valid-target", "drag-invalid-target");
  },

  // Handle drop - FIXED: Support merge, swap, and move to empty space
  handleDrop(e, i, j) {
    e.preventDefault();

    console.log(`🎯 Drop attempted on cell ${i}-${j}`);

    if (!gameState.draggedCell) {
      console.log("❌ No dragged cell found");
      return;
    }

    const sourceI = gameState.draggedCell.i;
    const sourceJ = gameState.draggedCell.j;

    console.log(`🎯 Attempting action from ${sourceI}-${sourceJ} to ${i}-${j}`);

    // Check if this is a valid merge
    if (this.canMerge(sourceI, sourceJ, i, j)) {
      console.log("✅ Merge is valid, executing...");
      mergeAnimals(sourceI, sourceJ, i, j);
    }
    // Check if this is a valid swap
    else if (this.canSwap(sourceI, sourceJ, i, j)) {
      console.log("✅ Swap is valid, executing...");
      this.swapAnimals(sourceI, sourceJ, i, j);
    }
    // Check if this is a valid move to empty space
    else if (this.canMoveToEmpty(sourceI, sourceJ, i, j)) {
      console.log("✅ Move to empty space is valid, executing...");
      this.moveToEmpty(sourceI, sourceJ, i, j);
    } else {
      console.log("❌ No valid action possible");
      updateStatus("Cannot perform this action! 😕");
    }

    // Clean up
    this.clearValidTargets();
    const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
    if (sourceCell) {
      sourceCell.classList.remove("drag-preview");
    }
    gameState.draggedCell = null;
  },

  // Handle drag end - FIXED: Better cleanup
  handleDragEnd(e, i, j) {
    console.log(`🎯 Drag ended on cell ${i}-${j}`);

    const cell = document.getElementById(`cell-${i}-${j}`);
    if (cell) {
      cell.classList.remove("drag-preview");
    }

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
    gameState.draggedCell = null;
  },

  // Check if merge is possible - FIXED: Manual merge allows any distance
  canMerge(sourceI, sourceJ, targetI, targetJ) {
    console.log(
      `🔍 Checking if merge is possible: ${sourceI}-${sourceJ} -> ${targetI}-${targetJ}`
    );

    // Check if target cell is purchased
    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) {
      console.log("❌ Target cell not purchased");
      return false;
    }

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    console.log(`🔍 Source type: ${sourceType}, Target type: ${targetType}`);

    // Check if both cells have animals
    if (!sourceType || !targetType) {
      console.log("❌ One or both cells empty");
      return false;
    }

    // Check if animals are the same type
    if (sourceType !== targetType) {
      console.log("❌ Different animal types - will swap instead");
      return false;
    }

    // Check if this animal type can merge
    if (!GAME_CONFIG.animalTypes[sourceType].mergeTo) {
      console.log("❌ Animal type cannot merge");
      return false;
    }

    // Manual merge allows any distance (no adjacency requirement)
    console.log("✅ Merge is valid!");
    return true;
  },

  // Check if swap is possible
  canSwap(sourceI, sourceJ, targetI, targetJ) {
    console.log(
      `🔍 Checking if swap is possible: ${sourceI}-${sourceJ} -> ${targetI}-${targetJ}`
    );

    // Check if target cell is purchased
    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) {
      console.log("❌ Target cell not purchased");
      return false;
    }

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    console.log(`🔍 Source type: ${sourceType}, Target type: ${targetType}`);

    // Check if both cells have animals
    if (!sourceType || !targetType) {
      console.log("❌ One or both cells empty");
      return false;
    }

    // Can swap if animals are different types
    if (sourceType !== targetType) {
      console.log("✅ Swap is valid!");
      return true;
    }

    console.log("❌ Same animal types - should merge instead");
    return false;
  },

  // Check if move to empty space is possible
  canMoveToEmpty(sourceI, sourceJ, targetI, targetJ) {
    console.log(
      `🔍 Checking if move to empty is possible: ${sourceI}-${sourceJ} -> ${targetI}-${targetJ}`
    );

    // Check if target cell is purchased
    if (!gameState.purchasedCells.has(`${targetI}-${targetJ}`)) {
      console.log("❌ Target cell not purchased");
      return false;
    }

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    console.log(`🔍 Source type: ${sourceType}, Target type: ${targetType}`);

    // Check if source has animal and target is empty
    if (!sourceType) {
      console.log("❌ Source cell empty");
      return false;
    }

    if (targetType) {
      console.log("❌ Target cell not empty");
      return false;
    }

    console.log("✅ Move to empty space is valid!");
    return true;
  },

  // Show valid merge targets - FIXED: Show all valid targets (not just adjacent)
  showValidTargets(sourceI, sourceJ) {
    console.log(`🎯 Showing valid targets for ${sourceI}-${sourceJ}`);

    // Check all cells on the grid for valid merge, swap, or move targets
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        // Skip the source cell
        if (i === sourceI && j === sourceJ) return;

        if (
          this.canMerge(sourceI, sourceJ, i, j) ||
          this.canSwap(sourceI, sourceJ, i, j) ||
          this.canMoveToEmpty(sourceI, sourceJ, i, j)
        ) {
          const cell = document.getElementById(`cell-${i}-${j}`);
          if (cell) {
            cell.classList.add("drag-valid-target");
            console.log(`✅ Marked ${i}-${j} as valid target`);
          }
        }
      }
    });
  },

  // Move animal to empty space
  moveToEmpty(sourceI, sourceJ, targetI, targetJ) {
    console.log(
      `🔄 Moving animal: ${sourceI}-${sourceJ} -> ${targetI}-${targetJ}`
    );

    const sourceType = gameState.grid[sourceI][sourceJ];

    // Move the animal to the empty space
    gameState.grid[sourceI][sourceJ] = null;
    gameState.grid[targetI][targetJ] = sourceType;

    // Update both cells
    this.updateCell(sourceI, sourceJ);
    this.updateCell(targetI, targetJ);

    // Update mergeable pairs after moving
    updateMergeablePairs();

    updateStatus(`Moved ${sourceType} to empty space! 📦`);
  },

  // Swap two animals
  swapAnimals(sourceI, sourceJ, targetI, targetJ) {
    console.log(
      `🔄 Swapping animals: ${sourceI}-${sourceJ} <-> ${targetI}-${targetJ}`
    );

    const sourceType = gameState.grid[sourceI][sourceJ];
    const targetType = gameState.grid[targetI][targetJ];

    // Swap the animals in the grid
    gameState.grid[sourceI][sourceJ] = targetType;
    gameState.grid[targetI][targetJ] = sourceType;

    // Update both cells
    this.updateCell(sourceI, sourceJ);
    this.updateCell(targetI, targetJ);

    // Update mergeable pairs after swapping
    updateMergeablePairs();

    updateStatus(`Swapped ${sourceType} and ${targetType}! 🔄`);
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
