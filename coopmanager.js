// Coop Manager - Handles all coop-related functionality
const coopManager = {
  // Generate coop HTML
  generateCoopHTML() {
    return `
          <!-- Auto-Merge -->
      <div class="flex-shrink-0 bg-white p-4 rounded-xl shadow-lg min-w-[220px]">
          <h3 class="text-lg font-bold text-purple-800 mb-2">⚙️ Auto-Merge</h3>
          <div class="space-y-2 text-sm">
              <p id="autoMergeLevel" class="font-semibold">Level: 1</p>
              <p id="autoMergeTimer" class="timer-display">Check Interval: 10s</p>
              <p id="autoMergeCountdown" class="timer-display hidden">Next Auto-Merge: 10.0s</p>
          </div>
          <div class="mt-4 space-y-2">
              <button id="buyAutoMerge" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed);">
                  <i class="fas fa-cogs mr-1"></i>Buy Auto-Merge ($1)
              </button>
              <button id="upgradeAutoMerge" class="enhanced-button upgrade-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                  <i class="fas fa-arrow-up mr-1"></i>Upgrade Auto-Merge ($5)
              </button>
          </div>
      </div>
      <!-- Chicken Coop -->
      <div id="chickenCoop" class="hidden flex-shrink-0 bg-white p-4 rounded-xl shadow-lg min-w-[220px]">
          <h3 class="text-lg font-bold text-green-800 mb-2">🐔 Chicken Coop</h3>
          <div class="space-y-2 text-sm">
              <p id="chickenCoopLevel" class="font-semibold">Level: 1</p>
              <p id="chickenCoopTimer" class="timer-display">Next Chicken 🐔: 60s</p>
              <p id="chickenCoopStored" class="font-semibold">Stored: 0</p>
          </div>
          <div class="mt-4 space-y-2">
              <button id="placeChicken" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                  <i class="fas fa-plus mr-1"></i>Place Chicken 🐔
              </button>
              <button id="buyChickenCoop" class="enhanced-button buy-button px-3 py-2 rounded-lg font-bold text-white text-sm">
                  <i class="fas fa-home mr-1"></i>Buy Chicken Coop 🏡 ($10)
              </button>
              <button id="upgradeChickenCoop" class="enhanced-button upgrade-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                  <i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($3)
              </button>
          </div>
      </div>

      <!-- Chicken Coop Placeholder -->
      <div id="chickenCoopPlaceholder" class="flex-shrink-0 bg-gray-200 opacity-50 p-4 rounded-xl min-w-[220px]" title="Merge to Chicken to unlock!">
          <h3 class="text-lg font-semibold text-gray-600">🔒 Chicken Coop</h3>
          <p class="text-sm text-gray-600 mt-2">Merge to Chicken to unlock!</p>
      </div>

      <!-- Rooster Coop -->
      <div id="roosterCoop" class="hidden flex-shrink-0 bg-white p-4 rounded-xl shadow-lg min-w-[220px]">
          <h3 class="text-lg font-bold text-green-800 mb-2">🦃 Rooster Coop</h3>
          <div class="space-y-2 text-sm">
              <p id="roosterCoopLevel" class="font-semibold">Level: 1</p>
              <p id="roosterCoopTimer" class="timer-display">Next Rooster 🦃: 120s</p>
              <p id="roosterCoopStored" class="font-semibold">Stored: 0</p>
          </div>
          <div class="mt-4 space-y-2">
              <button id="placeRooster" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                  <i class="fas fa-plus mr-1"></i>Place Rooster 🦃
              </button>
              <button id="buyRoosterCoop" class="enhanced-button buy-button px-3 py-2 rounded-lg font-bold text-white text-sm">
                  <i class="fas fa-home mr-1"></i>Buy Rooster Coop 🏡 ($50)
              </button>
              <button id="upgradeRoosterCoop" class="enhanced-button upgrade-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                  <i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($3)
              </button>
          </div>
      </div>

      <!-- Rooster Coop Placeholder -->
      <div id="roosterCoopPlaceholder" class="flex-shrink-0 bg-gray-200 opacity-50 p-4 rounded-xl min-w-[220px]" title="Merge to Rooster to unlock!">
          <h3 class="text-lg font-semibold text-gray-600">🔒 Rooster Coop</h3>
          <p class="text-sm text-gray-600 mt-2">Merge to Rooster to unlock!</p>
      </div>
    `;
  },

  // Coop Functions
  buyCoop(type) {
    const cost = GAME_CONFIG.coopConfig[type].buyCost;
    if (gameState.money >= cost) {
      gameState.money -= cost;
      if (type === "chicken") {
        gameState.chickenCoop.owned = true;
        document.getElementById("buyChickenCoop").classList.add("hidden");
        document.getElementById("buyChicken").classList.remove("hidden");
        document
          .getElementById("upgradeChickenCoop")
          .classList.remove("hidden");
      } else {
        gameState.roosterCoop.owned = true;
        document.getElementById("buyRoosterCoop").classList.add("hidden");
        document.getElementById("buyRooster").classList.remove("hidden");
        document
          .getElementById("upgradeRoosterCoop")
          .classList.remove("hidden");
      }
      updateMoney();
      eventManager.showAchievement(
        `🏡 ${type.charAt(0).toUpperCase() + type.slice(1)} Coop Purchased!`
      );
      updateStatus(`Bought ${type} coop 🏡`);
    } else {
      updateStatus(`Not enough money for ${type} coop! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  updateCoopVisibility() {
    if (gameState.hasChicken) {
      document.getElementById("chickenCoop").classList.remove("hidden");
      document.getElementById("chickenCoop").classList.add("bounce-in");
      document.getElementById("chickenCoopPlaceholder").classList.add("hidden");
    }
    if (gameState.hasRooster) {
      document.getElementById("roosterCoop").classList.remove("hidden");
      document.getElementById("roosterCoop").classList.add("bounce-in");
      document.getElementById("roosterCoopPlaceholder").classList.add("hidden");
    }
  },

  upgradeCoop(type) {
    const coop =
      type === "chicken" ? gameState.chickenCoop : gameState.roosterCoop;
    const cost =
      GAME_CONFIG.coopConfig[type].upgradeCostMultiplier * coop.level;
    if (gameState.money >= cost) {
      gameState.money -= cost;
      coop.level += 1;
      coop.timer =
        GAME_CONFIG.coopConfig[type].baseTime *
        Math.pow(
          GAME_CONFIG.coopConfig[type].timeReductionFactor,
          coop.level - 1
        );
      document.getElementById(
        `${type}CoopLevel`
      ).textContent = `Level: ${coop.level}`;
      document.getElementById(`${type}CoopTimer`).textContent = `Next ${
        type === "chicken" ? "Chicken 🐔" : "Rooster 🦃"
      }: ${coop.timer.toFixed(1)}s`;
      document.getElementById(
        `upgrade${type.charAt(0).toUpperCase() + type.slice(1)}Coop`
      ).innerHTML = `<i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($${
        GAME_CONFIG.coopConfig[type].upgradeCostMultiplier * coop.level
      })`;
      updateMoney();
      eventManager.showAchievement(
        `🆙 ${type.charAt(0).toUpperCase() + type.slice(1)} Coop Level ${
          coop.level
        }!`
      );
      updateStatus(`Upgraded ${type} coop to level ${coop.level} 🆙`);
    } else {
      updateStatus(`Not enough money to upgrade ${type} coop! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  placeStoredAnimal(type) {
    const coop =
      type === "Chicken" ? gameState.chickenCoop : gameState.roosterCoop;
    if (coop.stored > 0 && placeAnimal(type)) {
      coop.stored -= 1;
      document.getElementById(
        `${type.toLowerCase()}CoopStored`
      ).textContent = `Stored: ${coop.stored}`;
      if (coop.stored === 0) {
        document.getElementById(`place${type}`).classList.add("hidden");
        document.getElementById(`place${type}`).classList.remove("pulse");
      }
      this.updatePlaceButtonStates();
    } else {
      updateStatus("Grid is full! 😕");
    }
  },

  updatePlaceButtonStates() {
    document.getElementById("placeChicken").disabled =
      isGridFull() || gameState.chickenCoop.stored === 0;
    document.getElementById("placeRooster").disabled =
      isGridFull() || gameState.roosterCoop.stored === 0;

    if (!document.getElementById("placeChicken").disabled) {
      document.getElementById("placeChicken").classList.add("pulse");
    } else {
      document.getElementById("placeChicken").classList.remove("pulse");
    }

    if (!document.getElementById("placeRooster").disabled) {
      document.getElementById("placeRooster").classList.add("pulse");
    } else {
      document.getElementById("placeRooster").classList.remove("pulse");
    }
  },

  // Auto-Merge Functions
  buyAutoMerge() {
    if (gameState.money >= GAME_CONFIG.autoMergeConfig.buyCost) {
      gameState.money -= GAME_CONFIG.autoMergeConfig.buyCost;
      gameState.autoMerge.owned = true;
      gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
      document.getElementById("buyAutoMerge").classList.add("hidden");
      document.getElementById("upgradeAutoMerge").classList.remove("hidden");
      document.getElementById("autoMergeCountdown").classList.remove("hidden");
      document.getElementById(
        "autoMergeCountdown"
      ).textContent = `Next Auto-Merge: ${gameState.autoMerge.timer.toFixed(
        1
      )}s`;
      updateMoney();
      eventManager.showAchievement("⚙️ Auto-Merge Activated!");
      updateStatus("Bought Auto-Merge ⚙️");
    } else {
      updateStatus("Not enough money for Auto-Merge! 😕");
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  upgradeAutoMerge() {
    const cost =
      GAME_CONFIG.autoMergeConfig.upgradeCostMultiplier *
      gameState.autoMerge.level;
    if (gameState.money >= cost) {
      gameState.money -= cost;
      gameState.autoMerge.level += 1;
      gameState.autoMerge.currentInterval =
        GAME_CONFIG.autoMergeConfig.baseInterval *
        Math.pow(
          GAME_CONFIG.autoMergeConfig.intervalReductionFactor,
          gameState.autoMerge.level - 1
        );
      gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
      document.getElementById(
        "autoMergeLevel"
      ).textContent = `Level: ${gameState.autoMerge.level}`;
      document.getElementById(
        "autoMergeTimer"
      ).textContent = `Check Interval: ${gameState.autoMerge.currentInterval.toFixed(
        1
      )}s`;
      document.getElementById(
        "autoMergeCountdown"
      ).textContent = `Next Auto-Merge: ${gameState.autoMerge.timer.toFixed(
        1
      )}s`;
      document.getElementById(
        "upgradeAutoMerge"
      ).innerHTML = `<i class="fas fa-arrow-up mr-1"></i>Upgrade Auto-Merge ($${
        GAME_CONFIG.autoMergeConfig.upgradeCostMultiplier *
        gameState.autoMerge.level
      })`;
      updateMoney();
      eventManager.showAchievement(
        `🆙 Auto-Merge Level ${gameState.autoMerge.level}!`
      );
      updateStatus(
        `Upgraded Auto-Merge to level ${gameState.autoMerge.level} 🆙`
      );
    } else {
      updateStatus("Not enough money to upgrade Auto-Merge! 😕");
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Clear all auto-merge visual effects
  clearAutoMergeHighlight() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        const cell = document.getElementById(`cell-${i}-${j}`);
        if (cell) {
          cell.classList.remove(
            "border-purple-500",
            "border-2",
            "border-green-500",
            "new-animal-spawn",
            "auto-merge-glow"
          );
        }
      }
    });
  },

  // Show glow effect on cells that will be merged
  showAutoMergeGlow() {
    console.log("🔍 GLOW TRIGGERED - Checking mergeable pairs...");
    console.log("Current mergeable pairs:", gameState.mergeablePairs);

    // First clear any existing glow
    this.clearAutoMergeHighlight();

    // Make sure we have the latest mergeable pairs
    updateMergeablePairs();
    console.log("Updated mergeable pairs:", gameState.mergeablePairs);

    // Add glow to all cells that are part of mergeable pairs
    const glowCells = new Set();

    gameState.mergeablePairs.forEach(({ source, target }) => {
      console.log(
        `Adding glow to cells: ${source.i}-${source.j} and ${target.i}-${target.j}`
      );
      glowCells.add(`${source.i}-${source.j}`);
      glowCells.add(`${target.i}-${target.j}`);
    });

    console.log("Total cells to glow:", glowCells);

    glowCells.forEach((cellKey) => {
      const cell = document.getElementById(`cell-${cellKey}`);
      if (cell) {
        console.log(`✨ Adding glow to cell: ${cellKey}`);
        cell.classList.add("auto-merge-glow");
      } else {
        console.log(`❌ Cell not found: ${cellKey}`);
      }
    });

    if (glowCells.size === 0) {
      console.log("⚠️ No cells to glow - no mergeable pairs found!");
    }
  },

  autoMergeCheck() {
    // Clear any existing highlights
    this.clearAutoMergeHighlight();

    let mergedTypes = [];
    let mergesMade = false;

    // Process all mergeable pairs in the current state
    // Create a copy of the pairs to avoid modifying during iteration
    const pairsToProcess = [...gameState.mergeablePairs];

    pairsToProcess.forEach(({ source, target }) => {
      // Verify the pair is still valid (cells might have changed during this cycle)
      if (
        gameState.grid[source.i][source.j] &&
        gameState.grid[target.i][target.j] &&
        gameState.grid[source.i][source.j] ===
          gameState.grid[target.i][target.j] &&
        GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo
      ) {
        const newType =
          GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo;

        // Create merge explosion at source
        const sourceCell = document.getElementById(
          `cell-${source.i}-${source.j}`
        );
        const explosion = document.createElement("div");
        explosion.textContent = "⚙️";
        explosion.classList.add("merge-explosion", "absolute", "text-3xl");
        explosion.style.left = "50%";
        explosion.style.top = "50%";
        explosion.style.transform = "translate(-50%, -50%)";
        sourceCell.appendChild(explosion);

        setTimeout(
          () => explosion.remove(),
          GAME_CONFIG.animationConfig.mergeExplosionDuration
        );

        gameState.grid[source.i][source.j] = null;
        gameState.grid[target.i][target.j] = newType;
        gameState.createdAnimals.add(newType);

        document
          .getElementById(`cell-${source.i}-${source.j}`)
          .classList.add("border-green-500", "border-2");
        document
          .getElementById(`cell-${target.i}-${target.j}`)
          .classList.add("border-green-500", "border-2", "new-animal-spawn");

        gridManager.updateCell(source.i, source.j);
        gridManager.updateCell(target.i, target.j);

        // Create particles
        eventManager.createParticles(
          document.getElementById(`cell-${target.i}-${target.j}`)
        );

        if (!mergedTypes.includes(newType)) mergedTypes.push(newType);
        mergesMade = true;

        if (newType === "Chicken" && !gameState.hasChicken) {
          gameState.hasChicken = true;
          this.updateCoopVisibility();
          eventManager.showAchievement("🐔 Chicken Coop Unlocked!");
        } else if (newType === "Rooster" && !gameState.hasRooster) {
          gameState.hasRooster = true;
          this.updateCoopVisibility();
          eventManager.showAchievement("🦃 Rooster Coop Unlocked!");
        }
      }
    });

    // Update mergeable pairs after all merges are complete
    // This ensures we don't recursively merge in the same cycle
    updateMergeablePairs();

    // Clear highlights after a delay
    setTimeout(() => this.clearAutoMergeHighlight(), 1500);
    updateAnimalValues();

    if (mergesMade) {
      const message =
        mergedTypes.length > 0
          ? `Auto-merged into ${mergedTypes
              .map((t) => GAME_CONFIG.animalEmojis[t])
              .join(", ")} ⚙️`
          : "Auto-merged animals ⚙️";
      updateStatus(message);
    }
    this.updatePlaceButtonStates();
  },

  // Timer update functions
  updateCoopTimers() {
    if (gameState.chickenCoop.owned) {
      gameState.chickenCoop.timer -= 1;
      const timerElement = document.getElementById("chickenCoopTimer");
      timerElement.textContent = `Next Chicken 🐔: ${gameState.chickenCoop.timer.toFixed(
        1
      )}s`;

      if (gameState.chickenCoop.timer <= 3) {
        timerElement.classList.add("urgent");
      } else {
        timerElement.classList.remove("urgent");
      }

      if (gameState.chickenCoop.timer <= 0) {
        gameState.chickenCoop.stored += 1;
        document.getElementById(
          "chickenCoopStored"
        ).textContent = `Stored: ${gameState.chickenCoop.stored}`;
        document.getElementById("placeChicken").classList.remove("hidden");
        document.getElementById("placeChicken").classList.add("pulse");
        if (!isGridFull())
          document.getElementById("placeChicken").disabled = false;
        gameState.chickenCoop.timer =
          GAME_CONFIG.coopConfig.chicken.baseTime *
          Math.pow(
            GAME_CONFIG.coopConfig.chicken.timeReductionFactor,
            gameState.chickenCoop.level - 1
          );

        // Achievement effect
        eventManager.showAchievement("🐔 Chicken Ready!");
      }
    }

    if (gameState.roosterCoop.owned) {
      gameState.roosterCoop.timer -= 1;
      const timerElement = document.getElementById("roosterCoopTimer");
      timerElement.textContent = `Next Rooster 🦃: ${gameState.roosterCoop.timer.toFixed(
        1
      )}s`;

      if (gameState.roosterCoop.timer <= 3) {
        timerElement.classList.add("urgent");
      } else {
        timerElement.classList.remove("urgent");
      }

      if (gameState.roosterCoop.timer <= 0) {
        gameState.roosterCoop.stored += 1;
        document.getElementById(
          "roosterCoopStored"
        ).textContent = `Stored: ${gameState.roosterCoop.stored}`;
        document.getElementById("placeRooster").classList.remove("hidden");
        document.getElementById("placeRooster").classList.add("pulse");
        if (!isGridFull())
          document.getElementById("placeRooster").disabled = false;
        gameState.roosterCoop.timer =
          GAME_CONFIG.coopConfig.rooster.baseTime *
          Math.pow(
            GAME_CONFIG.coopConfig.rooster.timeReductionFactor,
            gameState.roosterCoop.level - 1
          );

        // Achievement effect
        eventManager.showAchievement("🦃 Rooster Ready!");
      }
    }
  },

  updateAutoMergeTimer() {
    if (gameState.autoMerge.owned) {
      gameState.autoMerge.timer -= 0.1; // Decrement by 0.1 seconds for precision
      const countdownElement = document.getElementById("autoMergeCountdown");
      const displayTime = Math.max(0, gameState.autoMerge.timer);
      countdownElement.textContent = `Next Auto-Merge: ${displayTime.toFixed(
        1
      )}s`;

      // Show glow effects at specific countdown times
      // Using Math.abs to handle floating point precision issues
      if (Math.abs(gameState.autoMerge.timer - 2) < 0.05) {
        console.log("🔥 Triggering glow at 2s");
        this.showAutoMergeGlow();
      } else if (Math.abs(gameState.autoMerge.timer - 1) < 0.05) {
        console.log("🔥 Triggering glow at 1s");
        this.showAutoMergeGlow();
      } else if (Math.abs(gameState.autoMerge.timer - 0.5) < 0.05) {
        console.log("🔥 Triggering glow at 0.5s");
        this.showAutoMergeGlow();
      } else if (Math.abs(gameState.autoMerge.timer - 0.25) < 0.05) {
        console.log("🔥 Triggering glow at 0.25s");
        this.showAutoMergeGlow();
      }

      if (gameState.autoMerge.timer <= 3) {
        countdownElement.classList.add("urgent", "pulse");
      } else {
        countdownElement.classList.remove("urgent", "pulse");
      }

      // Execute auto-merge when timer reaches 0, regardless of drag/select state
      if (gameState.autoMerge.timer <= 0) {
        console.log("🚀 Auto-merge triggered at 0s");
        this.autoMergeCheck();
        // Reset timer for next cycle
        gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
        countdownElement.textContent = `Next Auto-Merge: ${gameState.autoMerge.timer.toFixed(
          1
        )}s`;
        countdownElement.classList.remove("urgent", "pulse");
      }
    }
  },
};
