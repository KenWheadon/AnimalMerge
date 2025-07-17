// Event Manager - Handles events, animations, and visual effects
const eventManager = {
  // Event Listeners for Slaughter House
  initializeSlaughterHouseEventListeners() {
    const slaughterHouse = document.getElementById("slaughterHouse");
    slaughterHouse.addEventListener("dragover", (e) => {
      e.preventDefault();
      slaughterHouse.classList.add("drag-over");
    });
    slaughterHouse.addEventListener("dragleave", () => {
      slaughterHouse.classList.remove("drag-over");
    });
    slaughterHouse.addEventListener("drop", this.handleSlaughterDrop);
    slaughterHouse.addEventListener("touchmove", (e) => e.preventDefault());
    slaughterHouse.addEventListener("touchend", this.handleSlaughterTouchEnd);
  },

  initializeButtonEventListeners() {
    document
      .getElementById("buyEgg")
      .addEventListener("click", () => placeAnimal("Egg"));
    document
      .getElementById("buyChicken")
      .addEventListener("click", () =>
        buyAnimal("Chicken", GAME_CONFIG.purchaseConfig.chicken)
      );
    document
      .getElementById("buyRooster")
      .addEventListener("click", () =>
        buyAnimal("Rooster", GAME_CONFIG.purchaseConfig.rooster)
      );
    document
      .getElementById("buyChickenCoop")
      .addEventListener("click", () => coopManager.buyCoop("chicken"));
    document
      .getElementById("buyRoosterCoop")
      .addEventListener("click", () => coopManager.buyCoop("rooster"));
    document
      .getElementById("upgradeChickenCoop")
      .addEventListener("click", () => coopManager.upgradeCoop("chicken"));
    document
      .getElementById("upgradeRoosterCoop")
      .addEventListener("click", () => coopManager.upgradeCoop("rooster"));
    document
      .getElementById("placeChicken")
      .addEventListener("click", () =>
        coopManager.placeStoredAnimal("Chicken")
      );
    document
      .getElementById("placeRooster")
      .addEventListener("click", () =>
        coopManager.placeStoredAnimal("Rooster")
      );
    document
      .getElementById("buyAutoMerge")
      .addEventListener("click", () => coopManager.buyAutoMerge());
    document
      .getElementById("upgradeAutoMerge")
      .addEventListener("click", () => coopManager.upgradeAutoMerge());
    document
      .getElementById("toggleCoops")
      .addEventListener("click", toggleCoops);
  },

  handleSlaughterDrop(e) {
    e.preventDefault();
    const slaughterHouse = document.getElementById("slaughterHouse");
    slaughterHouse.classList.remove("drag-over");
    if (!gameState.draggedCell || gameState.isSlaughterAnimating) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];

    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
      sellAnimal(i, j, type);
    } else {
      updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove("drag-preview");
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  handleSlaughterTouchEnd(e) {
    e.preventDefault();
    const slaughterHouse = document.getElementById("slaughterHouse");
    slaughterHouse.classList.remove("drag-over");
    if (!gameState.draggedCell || gameState.isSlaughterAnimating) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];

    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
      sellAnimal(i, j, type);
    } else {
      updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove("drag-preview");
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  // Visual Helper Functions
  clearWiggleGlow() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        const cell = document.getElementById(`cell-${i}-${j}`);
        if (cell) {
          cell.classList.remove("wiggle", "glow");
        }
      }
    });
    gameState.recentlyAnimatedCells = [];
  },

  clearAutoMergeHighlight() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        const cell = document.getElementById(`cell-${i}-${j}`);
        if (cell) {
          cell.classList.remove(
            "border-purple-500",
            "border-2",
            "border-green-500",
            "new-animal-spawn"
          );
        }
      }
    });
  },

  // Animation and Effect Functions
  showAchievement(message) {
    const achievement = document.createElement("div");
    achievement.className = "achievement-popup";
    achievement.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="text-2xl">🏆</div>
            <div class="font-bold text-yellow-800">${message}</div>
        </div>
    `;
    document.body.appendChild(achievement);

    setTimeout(() => {
      achievement.style.transform = "translateX(100%)";
      achievement.style.opacity = "0";
      setTimeout(() => achievement.remove(), 500);
    }, GAME_CONFIG.animationConfig.achievementDuration);
  },

  showFloatingNumber(text, parent) {
    const number = document.createElement("div");
    number.className = "floating-number";
    number.textContent = text;
    number.style.left = "50%";
    number.style.top = "50%";
    number.style.transform = "translate(-50%, -50%)";
    parent.appendChild(number);

    setTimeout(
      () => number.remove(),
      GAME_CONFIG.animationConfig.floatingNumberDuration
    );
  },

  createParticles(element) {
    const rect = element.getBoundingClientRect();
    const container = document.body;

    for (let i = 0; i < GAME_CONFIG.animationConfig.particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${1 + Math.random() * 1}s`;

      // Random direction
      const angle =
        (Math.PI * 2 * i) / GAME_CONFIG.animationConfig.particleCount;
      const distance = 50 + Math.random() * 50;
      particle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      container.appendChild(particle);
      setTimeout(() => particle.remove(), 2000);
    }
  },

  // Wiggle Animation
  startWiggleAnimation() {
    setInterval(() => {
      if (
        gameState.draggedCell ||
        gameState.selectedCell ||
        !gameState.autoMerge.owned
      )
        return;
      this.clearWiggleGlow();
      const nonEmptyCells = [];
      GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
        if (
          gameState.purchasedCells.has(`${i}-${j}`) &&
          gameState.grid[i][j] &&
          !gameState.recentlyAnimatedCells.includes(`${i}-${j}`)
        ) {
          nonEmptyCells.push({ i, j });
        }
      });
      if (nonEmptyCells.length === 0) return;
      const count = Math.min(
        Math.floor(Math.random() * 3) + 1,
        nonEmptyCells.length
      );
      const selectedCells = [];
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * nonEmptyCells.length);
        selectedCells.push(nonEmptyCells.splice(index, 1)[0]);
      }
      selectedCells.forEach(({ i, j }) => {
        const cell = document.getElementById(`cell-${i}-${j}`);
        if (cell) {
          cell.classList.add("wiggle", "glow");
          gameState.recentlyAnimatedCells.push(`${i}-${j}`);
          setTimeout(() => {
            if (cell) {
              cell.classList.remove("wiggle", "glow");
              gameState.recentlyAnimatedCells =
                gameState.recentlyAnimatedCells.filter(
                  (c) => c !== `${i}-${j}`
                );
            }
          }, GAME_CONFIG.animationConfig.wiggleDuration);
        }
      });
    }, GAME_CONFIG.animationConfig.wiggleInterval);
  },
};
