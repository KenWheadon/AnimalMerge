// Coop Manager - Handles all coop-related functionality
const coopManager = {
  // Track which coops have been unlocked to prevent duplicate notifications
  unlockedCoops: new Set(),

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

      // Generate the actual coop HTML (hidden by default - only shown when unlocked)
      html += `
        <!-- ${animalName} Coop -->
        <div id="${animalType}Coop" class="compact-coop hidden">
          <div class="coop-header">
            <div class="flex justify-between items-center">
              <h3 class="coop-title">${animalEmoji} ${animalName} Coop</h3>
              <button id="coopInfo${animalType}" class="info-button">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
          
          <!-- Unlocked but not purchased state -->
          <div id="${animalType}CoopUnpurchased" class="coop-unpurchased">
            <div class="lock-icon">🔒</div>
            <p class="coop-name">${animalName} Coop</p>
            <button id="buy${animalName}Coop" class="enhanced-button buy-button coop-buy-btn">
              <i class="fas fa-home mr-1"></i>Buy 🏡 ($${config.buyCost})
            </button>
          </div>

          <!-- Purchased state -->
          <div id="${animalType}CoopPurchased" class="coop-purchased hidden">
            <div class="coop-stats">
              <div class="coop-progress-container">
                <div class="coop-progress-label">Next ${animalName} ${animalEmoji}</div>
                <div class="coop-progress-bar">
                  <div id="${animalType}CoopProgress" class="coop-progress-fill" style="width: 0%"></div>
                </div>
              </div>
              <div class="coop-stored-display">
                <span id="${animalType}CoopStored">Stored: ${coopState.stored}</span>
              </div>
            </div>
            
            <div class="coop-actions">
              <button id="place${animalName}" class="enhanced-button place-button hidden">
                <i class="fas fa-plus mr-1"></i>Place ${animalName} ${animalEmoji}
              </button>
            </div>
          </div>
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

      // Place animal button
      const placeButton = document.getElementById(`place${animalName}`);
      if (placeButton) {
        placeButton.addEventListener("click", () =>
          this.placeStoredAnimal(animalName)
        );
      }

      // Info button for tooltip
      const infoButton = document.getElementById(`coopInfo${animalType}`);
      if (infoButton) {
        infoButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleCoopTooltip(animalType);
        });
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

    console.log(`Attempting to buy ${animalType} coop for $${cost}`);

    if (gameState.money >= cost) {
      gameState.money -= cost;
      gameState[`${animalType}Coop`].owned = true;

      console.log(`Successfully bought ${animalType} coop`);

      // Hide unpurchased state, show purchased state
      const unpurchasedElement = document.getElementById(
        `${animalType}CoopUnpurchased`
      );
      const purchasedElement = document.getElementById(
        `${animalType}CoopPurchased`
      );

      console.log(`Unpurchased element found:`, unpurchasedElement);
      console.log(`Purchased element found:`, purchasedElement);

      if (unpurchasedElement) {
        unpurchasedElement.classList.add("hidden");
        console.log(`Hidden unpurchased state for ${animalType}`);
      } else {
        console.error(`Could not find unpurchased element for ${animalType}`);
      }

      if (purchasedElement) {
        purchasedElement.classList.remove("hidden");
        console.log(`Shown purchased state for ${animalType}`);
      } else {
        console.error(`Could not find purchased element for ${animalType}`);
      }

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

  // Upgrade a coop (now handled through tooltip)
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

      updateMoney();
      eventManager.showAchievement(
        `🆙 ${animalName} Coop Level ${coop.level}!`
      );
      updateStatus(`Upgraded ${animalType} coop to level ${coop.level} 🆙`);

      // Update tooltip if it's currently showing
      const existingTooltip = document.getElementById("coopTooltip");
      if (existingTooltip) {
        this.hideCoopTooltip();
        setTimeout(() => this.showCoopTooltip(animalType), 100);
      }
    } else {
      updateStatus(`Not enough money to upgrade ${animalType} coop! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Toggle coop tooltip visibility
  toggleCoopTooltip(animalType) {
    const existingTooltip = document.getElementById("coopTooltip");
    if (existingTooltip) {
      this.hideCoopTooltip();
    } else {
      this.showCoopTooltip(animalType);
    }
  },

  // Show coop tooltip with upgrade information - now positioned fixed from document body
  showCoopTooltip(animalType) {
    const coop = gameState[`${animalType}Coop`];
    const config = GAME_CONFIG.coopConfig[animalType];
    const animalName = animalType.charAt(0).toUpperCase() + animalType.slice(1);
    const infoButton = document.getElementById(`coopInfo${animalType}`);

    // Only show tooltip if coop is owned and info button exists
    if (!coop.owned || !infoButton) return;

    // Remove existing tooltip
    this.hideCoopTooltip();

    const tooltip = document.createElement("div");
    tooltip.id = "coopTooltip";
    tooltip.className = "coop-tooltip-fixed";

    const upgradeCost = config.upgradeCostMultiplier * coop.level;
    const currentTime = (
      config.baseTime * Math.pow(config.timeReductionFactor, coop.level - 1)
    ).toFixed(1);
    const nextTime = (
      config.baseTime * Math.pow(config.timeReductionFactor, coop.level)
    ).toFixed(1);

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${animalName} Coop</strong>
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row">Level: ${coop.level}</div>
        <div class="tooltip-row">Current time: ${currentTime}s</div>
        <div class="tooltip-row">Next level: ${nextTime}s</div>
        <button class="tooltip-upgrade-btn" onclick="coopManager.upgradeCoop('${animalType}')">
          <i class="fas fa-arrow-up mr-1"></i>Upgrade ($${upgradeCost})
        </button>
      </div>
    `;

    // Append to body for proper positioning
    document.body.appendChild(tooltip);

    // Calculate position relative to the info button
    const buttonRect = infoButton.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position to the left of the info button
    let left = buttonRect.left - tooltipRect.width - 10;
    let top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;

    // Ensure tooltip stays within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if tooltip would go off-screen
    if (left < 10) {
      left = buttonRect.right + 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    // Adjust vertical position if tooltip would go off-screen
    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > viewportHeight - 10) {
      top = viewportHeight - tooltipRect.height - 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    // Add click outside listener to close tooltip
    setTimeout(() => {
      const clickOutsideHandler = (e) => {
        if (!tooltip.contains(e.target) && e.target !== infoButton) {
          this.hideCoopTooltip();
          document.removeEventListener("click", clickOutsideHandler);
        }
      };
      document.addEventListener("click", clickOutsideHandler);
    }, 100);
  },

  // Hide coop tooltip
  hideCoopTooltip() {
    const tooltip = document.getElementById("coopTooltip");
    if (tooltip) {
      tooltip.remove();
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

        if (coopElement) {
          coopElement.classList.remove("hidden");
          coopElement.classList.add("bounce-in");
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

      if (placeButton && coop && coop.owned) {
        placeButton.disabled = isGridFull() || coop.stored === 0;

        if (coop.stored > 0 && !isGridFull()) {
          placeButton.classList.remove("hidden");
          placeButton.classList.add("pulse");
        } else {
          placeButton.classList.remove("pulse");
          if (coop.stored === 0) {
            placeButton.classList.add("hidden");
          }
        }
      }
    }
  },

  // Check for new unlocks when animals are created - FIXED: Only show notification once
  checkForNewUnlocks(newAnimalType) {
    // Check if we need to unlock coop visibility
    if (GAME_CONFIG.coopConfig[newAnimalType.toLowerCase()]) {
      const coopKey = newAnimalType.toLowerCase();

      // Only show notification if this coop hasn't been unlocked before
      if (!this.unlockedCoops.has(coopKey)) {
        this.unlockedCoops.add(coopKey);
        this.updateCoopVisibility();
        eventManager.showAchievement(`🏡 ${newAnimalType} Coop Unlocked!`);
      }
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

        // Update progress bar
        const progressElement = document.getElementById(
          `${animalType}CoopProgress`
        );
        if (progressElement) {
          const maxTime =
            config.baseTime *
            Math.pow(config.timeReductionFactor, coop.level - 1);
          const progress = ((maxTime - coop.timer) / maxTime) * 100;
          progressElement.style.width = `${Math.max(0, progress)}%`;

          // Add urgent class when close to completion
          if (coop.timer <= 3) {
            progressElement.classList.add("urgent");
          } else {
            progressElement.classList.remove("urgent");
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

          // Reset progress bar
          const progressElement = document.getElementById(
            `${animalType}CoopProgress`
          );
          if (progressElement) {
            progressElement.style.width = "0%";
            progressElement.classList.remove("urgent");
          }
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
      document
        .getElementById("autoMergeProgressContainer")
        .classList.remove("hidden");
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

      // Update progress bar
      const progressElement = document.getElementById("autoMergeProgress");
      if (progressElement) {
        const progress =
          ((gameState.autoMerge.currentInterval - gameState.autoMerge.timer) /
            gameState.autoMerge.currentInterval) *
          100;
        progressElement.style.width = `${Math.max(0, progress)}%`;

        // Add urgent class when close to completion
        if (gameState.autoMerge.timer <= 3) {
          progressElement.classList.add("urgent");
        } else {
          progressElement.classList.remove("urgent");
        }
      }

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

      // Execute auto-merge when timer reaches 0
      if (gameState.autoMerge.timer <= 0) {
        console.log("🚀 Auto-merge triggered at 0s");
        this.autoMergeCheck();
        // Reset timer for next cycle
        gameState.autoMerge.timer = gameState.autoMerge.currentInterval;

        // Reset progress bar
        if (progressElement) {
          progressElement.style.width = "0%";
          progressElement.classList.remove("urgent");
        }
      }
    }
  },
};
