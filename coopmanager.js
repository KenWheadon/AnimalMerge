// Coop Manager - Handles all coop-related functionality
const coopManager = {
  // Initialize coop states dynamically based on config
  initializeCoopStates() {
    // Initialize coop states for all animals in coopConfig
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const coopKey = `${animalType}Coop`;
      if (!gameState[coopKey]) {
        gameState[coopKey] = {
          owned: false,
          level: 1,
          baseTime: config.baseTime,
          timer: config.baseTime,
          stored: 0,
        };
      }
    }
  },

  // Generate buy animal buttons dynamically from config
  generateBuyAnimalButtons() {
    let html = "";

    for (const [animalType, config] of Object.entries(
      GAME_CONFIG.purchaseConfig
    )) {
      const emoji = GAME_CONFIG.animalEmojis[animalType];
      const costText = config.cost === 0 ? "Free" : `$${config.cost}`;
      const hiddenClass = config.unlocked ? "" : "hidden";

      // Get appropriate icon based on animal type
      let icon = "fas fa-egg";
      if (animalType.toLowerCase().includes("chicken"))
        icon = "fas fa-drumstick-bite";
      else if (animalType.toLowerCase().includes("rooster"))
        icon = "fas fa-feather";
      else if (animalType.toLowerCase().includes("goat"))
        icon = "fas fa-mountain";
      else if (animalType.toLowerCase().includes("sheep"))
        icon = "fas fa-sheep";
      else if (animalType.toLowerCase().includes("pig")) icon = "fas fa-pig";
      else if (animalType.toLowerCase().includes("llama"))
        icon = "fas fa-horse";
      else if (animalType.toLowerCase().includes("cow")) icon = "fas fa-cow";
      else if (animalType.toLowerCase().includes("bull")) icon = "fas fa-bull";

      html += `
        <button id="buy${animalType}" class="enhanced-button buy-button w-full px-4 py-3 rounded-xl shadow-lg font-bold text-white ${hiddenClass}">
            <i class="${icon} mr-2"></i>Buy ${animalType} ${emoji} (${costText})
        </button>
      `;
    }

    return html;
  },

  // Generate farm building HTML dynamically from config
  generateCoopHTML() {
    let html = "";

    // Generate farm buildings for each animal type in coopConfig
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      const animalEmoji = GAME_CONFIG.animalEmojis[animalName];
      const coopState = gameState[`${animalType}Coop`] || {
        level: 1,
        stored: 0,
      };

      // Calculate current upgrade cost
      const currentUpgradeCost = config.upgradeCostMultiplier * coopState.level;

      // Generate the actual coop HTML (hidden by default)
      html += `
        <!-- ${animalName} Coop -->
        <div id="${animalType}Coop" class="hidden flex-shrink-0 bg-white p-4 rounded-xl shadow-lg min-w-[220px]">
            <h3 class="text-lg font-bold text-green-800 mb-2">${animalEmoji} ${animalName} Coop</h3>
            <div class="space-y-2 text-sm">
                <p id="${animalType}CoopLevel" class="font-semibold">Level: ${coopState.level}</p>
                <p id="${animalType}CoopTimer" class="timer-display">Next ${animalName} ${animalEmoji}: ${config.baseTime}s</p>
                <p id="${animalType}CoopStored" class="font-semibold">Stored: ${coopState.stored}</p>
            </div>
            <div class="mt-4 space-y-2">
                <button id="place${animalName}" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                    <i class="fas fa-plus mr-1"></i>Place ${animalName} ${animalEmoji}
                </button>
                <button id="buy${animalName}Coop" class="enhanced-button buy-button px-3 py-2 rounded-lg font-bold text-white text-sm">
                    <i class="fas fa-home mr-1"></i>Buy ${animalName} Coop 🏡 ($${config.buyCost})
                </button>
                <button id="upgrade${animalName}Coop" class="enhanced-button upgrade-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                    <i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($${currentUpgradeCost})
                </button>
            </div>
        </div>

        <!-- ${animalName} Coop Placeholder -->
        <div id="${animalType}CoopPlaceholder" class="flex-shrink-0 bg-gray-200 opacity-50 p-4 rounded-xl min-w-[220px]" title="Merge to ${animalName} to unlock!">
            <h3 class="text-lg font-semibold text-gray-600">🔒 ${animalName} Coop</h3>
            <p class="text-sm text-gray-600 mt-2">Merge to ${animalName} to unlock!</p>
        </div>
      `;
    }

    return html;
  },

  // Initialize all event listeners for dynamic farm buildings and buy buttons
  initializeFarmBuildingEventListeners() {
    // Initialize buy animal button event listeners
    for (const [animalType, config] of Object.entries(
      GAME_CONFIG.purchaseConfig
    )) {
      const buyButton = document.getElementById(`buy${animalType}`);
      if (buyButton) {
        if (config.cost === 0) {
          buyButton.addEventListener("click", () => placeAnimal(animalType));
        } else {
          buyButton.addEventListener("click", () =>
            buyAnimal(animalType, config.cost)
          );
        }
      }
    }

    // Initialize coop event listeners
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);

      // Buy coop button
      const buyButton = document.getElementById(`buy${animalName}Coop`);
      if (buyButton) {
        buyButton.addEventListener("click", () => this.buyCoop(animalType));
      }

      // Upgrade coop button
      const upgradeButton = document.getElementById(`upgrade${animalName}Coop`);
      if (upgradeButton) {
        upgradeButton.addEventListener("click", () =>
          this.upgradeCoop(animalType)
        );
      }

      // Place animal button
      const placeButton = document.getElementById(`place${animalName}`);
      if (placeButton) {
        placeButton.addEventListener("click", () =>
          this.placeStoredAnimal(animalName)
        );
      }
    }
  },

  // Update visibility of buy animal buttons based on unlocked status
  updateBuyAnimalButtons() {
    for (const [animalType, config] of Object.entries(
      GAME_CONFIG.purchaseConfig
    )) {
      const button = document.getElementById(`buy${animalType}`);
      if (button) {
        if (config.unlocked) {
          button.classList.remove("hidden");
        } else {
          button.classList.add("hidden");
        }
      }
    }
  },

  // Buy a coop for the specified animal type
  buyCoop(animalType) {
    const config = GAME_CONFIG.coopConfig[animalType];
    const cost = config.buyCost;
    const animalName = animalType.charAt(0).toUpperCase() + animalType.slice(1);

    if (gameState.money >= cost) {
      gameState.money -= cost;
      gameState[`${animalType}Coop`].owned = true;

      // Hide buy button, show upgrade button
      document.getElementById(`buy${animalName}Coop`).classList.add("hidden");
      document
        .getElementById(`upgrade${animalName}Coop`)
        .classList.remove("hidden");

      // Unlock the purchase button for this animal
      if (GAME_CONFIG.purchaseConfig[animalName]) {
        GAME_CONFIG.purchaseConfig[animalName].unlocked = true;
        this.updateBuyAnimalButtons();
      }

      updateMoney();
      eventManager.showAchievement(`🏡 ${animalName} Coop Purchased!`);
      updateStatus(`Bought ${animalType} coop 🏡`);
    } else {
      updateStatus(`Not enough money for ${animalType} coop! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Upgrade a coop
  upgradeCoop(animalType) {
    const coop = gameState[`${animalType}Coop`];
    const config = GAME_CONFIG.coopConfig[animalType];
    const cost = config.upgradeCostMultiplier * coop.level;
    const animalName = animalType.charAt(0).toUpperCase() + animalType.slice(1);

    if (gameState.money >= cost) {
      gameState.money -= cost;
      coop.level += 1;
      coop.timer =
        config.baseTime * Math.pow(config.timeReductionFactor, coop.level - 1);

      // Update display elements
      document.getElementById(
        `${animalType}CoopLevel`
      ).textContent = `Level: ${coop.level}`;
      document.getElementById(
        `${animalType}CoopTimer`
      ).textContent = `Next ${animalName} ${
        GAME_CONFIG.animalEmojis[animalName]
      }: ${coop.timer.toFixed(1)}s`;
      document.getElementById(
        `upgrade${animalName}Coop`
      ).innerHTML = `<i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($${
        config.upgradeCostMultiplier * coop.level
      })`;

      updateMoney();
      eventManager.showAchievement(
        `🆙 ${animalName} Coop Level ${coop.level}!`
      );
      updateStatus(`Upgraded ${animalType} coop to level ${coop.level} 🆙`);
    } else {
      updateStatus(`Not enough money to upgrade ${animalType} coop! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Place a stored animal on the grid
  placeStoredAnimal(animalName) {
    const animalType = animalName.toLowerCase();
    const coop = gameState[`${animalType}Coop`];

    if (coop.stored > 0 && placeAnimal(animalName)) {
      coop.stored -= 1;
      document.getElementById(
        `${animalType}CoopStored`
      ).textContent = `Stored: ${coop.stored}`;

      if (coop.stored === 0) {
        document.getElementById(`place${animalName}`).classList.add("hidden");
        document.getElementById(`place${animalName}`).classList.remove("pulse");
      }
      this.updatePlaceButtonStates();
    } else {
      updateStatus("Grid is full! 😕");
    }
  },

  // Update coop visibility based on unlocked animals
  updateCoopVisibility() {
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);

      // Check if this animal has been created
      if (gameState.createdAnimals.has(animalName)) {
        const coopElement = document.getElementById(`${animalType}Coop`);
        const placeholderElement = document.getElementById(
          `${animalType}CoopPlaceholder`
        );

        if (coopElement && placeholderElement) {
          coopElement.classList.remove("hidden");
          coopElement.classList.add("bounce-in");
          placeholderElement.classList.add("hidden");
        }
      }
    }
  },

  // Update state of place buttons based on grid status and stored animals
  updatePlaceButtonStates() {
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      const placeButton = document.getElementById(`place${animalName}`);
      const coop = gameState[`${animalType}Coop`];

      if (placeButton && coop) {
        placeButton.disabled = isGridFull() || coop.stored === 0;

        if (!placeButton.disabled) {
          placeButton.classList.add("pulse");
        } else {
          placeButton.classList.remove("pulse");
        }
      }
    }
  },

  // Check for new unlocks when animals are created
  checkForNewUnlocks(newAnimalType) {
    // Check if we need to unlock coop visibility
    if (GAME_CONFIG.coopConfig[newAnimalType.toLowerCase()]) {
      this.updateCoopVisibility();
      eventManager.showAchievement(`🏡 ${newAnimalType} Coop Unlocked!`);
    }
  },

  // Update timers for all coops
  updateCoopTimers() {
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const coop = gameState[`${animalType}Coop`];
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);

      if (coop.owned) {
        coop.timer -= 1;
        const timerElement = document.getElementById(`${animalType}CoopTimer`);
        if (timerElement) {
          timerElement.textContent = `Next ${animalName} ${
            GAME_CONFIG.animalEmojis[animalName]
          }: ${coop.timer.toFixed(1)}s`;

          if (coop.timer <= 3) {
            timerElement.classList.add("urgent");
          } else {
            timerElement.classList.remove("urgent");
          }
        }

        if (coop.timer <= 0) {
          coop.stored += 1;
          const storedElement = document.getElementById(
            `${animalType}CoopStored`
          );
          if (storedElement) {
            storedElement.textContent = `Stored: ${coop.stored}`;
          }

          const placeButton = document.getElementById(`place${animalName}`);
          if (placeButton) {
            placeButton.classList.remove("hidden");
            placeButton.classList.add("pulse");
            if (!isGridFull()) {
              placeButton.disabled = false;
            }
          }

          coop.timer =
            config.baseTime *
            Math.pow(config.timeReductionFactor, coop.level - 1);

          // Achievement effect
          eventManager.showAchievement(
            `${GAME_CONFIG.animalEmojis[animalName]} ${animalName} Ready!`
          );
        }
      }
    }
  },

  // AUTO-MERGE FUNCTIONS - Keeping existing functionality intact

  // Buy auto-merge system
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

  // Upgrade auto-merge system
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

  // Perform auto-merge check and execution
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

        // Check for new unlocks
        this.checkForNewUnlocks(newType);
      }
    });

    // Update mergeable pairs after all merges are complete
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

  // Update auto-merge timer with high precision
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

      // Execute auto-merge when timer reaches 0
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
