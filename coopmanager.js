const coopManager = {
  unlockedCoops: new Set(),

  initializeCoopStates() {
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

  generateBuyAnimalButtons() {
    let html = "";

    for (const [animalType, config] of Object.entries(
      GAME_CONFIG.purchaseConfig
    )) {
      const imageSrc = GAME_CONFIG.animalImages[animalType];
      const costText = config.cost === 0 ? "Free" : `$${config.cost}`;
      const hiddenClass = config.unlocked ? "" : "hidden";

      html += `
        <button id="buy${animalType}" class="egg-buy-button enhanced-button buy-button w-full px-4 py-3 rounded-xl shadow-lg font-bold text-white ${hiddenClass}">
            <span>${animalType} (${costText})</span> <img src="${imageSrc}" alt="${animalType}" class="inline-animal-icon" />
        </button>
      `;
    }

    return html;
  },

  generateCoopHTML() {
    let html = "";

    // Add empty state message
    html += `
      <div id="emptyFarmMessage" class="text-center py-4 text-gray-600 text-sm">
        Merge animals to unlock buildings
      </div>
    `;

    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      const producedType = config.producesType;
      const producedImage = GAME_CONFIG.animalImages[producedType];
      const coopState = gameState[`${animalType}Coop`] || {
        level: 1,
        stored: 0,
      };

      html += `
        <div id="${animalType}Coop" class="compact-coop hidden">
          <div class="coop-header">
            <div class="flex justify-between items-center">
              <h3 class="coop-title">${animalName} Coop</h3>
              <button id="coopInfo${animalType}" class="info-button">
                <i class="fas fa-info-circle"></i>
              </button>
            </div>
          </div>
          
          <div class="text-center mb-3">
            <img src="${producedImage}" alt="${producedType}" style="width: 60px; height: 60px; object-fit: contain; margin: 0 auto;" />
          </div>
          
          <div id="${animalType}CoopUnpurchased" class="coop-unpurchased">
            <div class="lock-icon">🔒</div>
            <p class="coop-name">${animalName} Coop</p>
            <button id="buy${animalName}Coop" class="enhanced-button buy-button coop-buy-btn">
              <i class="fas fa-home mr-1"></i>🏡 ($${config.buyCost})
            </button>
          </div>

          <div id="${animalType}CoopPurchased" class="coop-purchased hidden">
            <div class="coop-stats">
              <div class="coop-progress-container">
                <div class="coop-progress-label">Next ${producedType}</div>
                <div class="coop-progress-bar">
                  <div id="${animalType}CoopProgress" class="coop-progress-fill" style="width: 0%"></div>
                </div>
              </div>
              <div class="coop-stored-display">
                <span id="${animalType}CoopStored">Stored: ${coopState.stored}</span>
              </div>
            </div>
            
            <div class="coop-actions">
              <button id="place${producedType}" class="enhanced-button place-button hidden">
                <i class="fas fa-plus mr-1"></i>Place ${producedType}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return html;
  },

  initializeFarmBuildingEventListeners() {
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

    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      const producedType = config.producesType;

      const buyButton = document.getElementById(`buy${animalName}Coop`);
      if (buyButton) {
        buyButton.addEventListener("click", () => this.buyCoop(animalType));
      }

      const placeButton = document.getElementById(`place${producedType}`);
      if (placeButton) {
        placeButton.addEventListener("click", () =>
          this.placeStoredAnimal(animalType, producedType)
        );
      }

      const infoButton = document.getElementById(`coopInfo${animalType}`);
      if (infoButton) {
        infoButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleCoopTooltip(animalType);
        });
      }
    }
  },

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

  buyCoop(animalType) {
    const config = GAME_CONFIG.coopConfig[animalType];
    const cost = config.buyCost;
    const animalName = animalType.charAt(0).toUpperCase() + animalType.slice(1);
    const producedType = config.producesType;

    if (gameState.money >= cost) {
      gameState.money -= cost;
      gameState[`${animalType}Coop`].owned = true;

      const unpurchasedElement = document.getElementById(
        `${animalType}CoopUnpurchased`
      );
      const purchasedElement = document.getElementById(
        `${animalType}CoopPurchased`
      );

      if (unpurchasedElement) {
        unpurchasedElement.classList.add("hidden");
      }

      if (purchasedElement) {
        purchasedElement.classList.remove("hidden");
      }

      // Unlock the corresponding egg for purchase
      if (GAME_CONFIG.purchaseConfig[producedType]) {
        GAME_CONFIG.purchaseConfig[producedType].unlocked = true;
        this.updateBuyAnimalButtons();
      }

      updateMoney();
      this.updateEmptyMessageVisibility();
      eventManager.showAchievement(`🏡 ${animalName} Coop Purchased!`);
      updateStatus(`Bought ${animalType} coop 🏡`);
    } else {
      updateStatus(`Not enough money for ${animalType} coop! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  toggleCoopTooltip(animalType) {
    const existingTooltip = document.getElementById("coopTooltip");
    if (existingTooltip) {
      this.hideCoopTooltip();
    } else {
      this.showCoopTooltip(animalType);
    }
  },

  showCoopTooltip(animalType) {
    const coop = gameState[`${animalType}Coop`];
    const config = GAME_CONFIG.coopConfig[animalType];
    const animalName = animalType.charAt(0).toUpperCase() + animalType.slice(1);
    const producedType = config.producesType;
    const infoButton = document.getElementById(`coopInfo${animalType}`);

    if (!coop.owned || !infoButton) return;

    this.hideCoopTooltip();

    const tooltip = document.createElement("div");
    tooltip.id = "coopTooltip";
    tooltip.className = "coop-tooltip-fixed";

    const currentTime = (
      config.baseTime * Math.pow(config.timeReductionFactor, coop.level - 1)
    ).toFixed(1);

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <strong>${animalName} Coop</strong>
      </div>
      <div class="tooltip-content">
        <div class="tooltip-row">Level: ${coop.level}</div>
        <div class="tooltip-row">Produces: ${producedType}</div>
        <div class="tooltip-row">Generation time: ${currentTime}s</div>
        <div class="tooltip-row">Stored: ${coop.stored}</div>
      </div>
    `;

    document.body.appendChild(tooltip);

    const buttonRect = infoButton.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = buttonRect.left - tooltipRect.width - 10;
    let top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) {
      left = buttonRect.right + 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > viewportHeight - 10) {
      top = viewportHeight - tooltipRect.height - 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

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

  hideCoopTooltip() {
    const tooltip = document.getElementById("coopTooltip");
    if (tooltip) {
      tooltip.remove();
    }
  },

  placeStoredAnimal(animalType, producedType) {
    const coop = gameState[`${animalType}Coop`];

    if (coop.stored > 0 && placeAnimal(producedType)) {
      coop.stored -= 1;
      document.getElementById(
        `${animalType}CoopStored`
      ).textContent = `Stored: ${coop.stored}`;

      if (coop.stored === 0) {
        document.getElementById(`place${producedType}`).classList.add("hidden");
        document
          .getElementById(`place${producedType}`)
          .classList.remove("pulse");
      }
      this.updatePlaceButtonStates();
    } else {
      updateStatus("Grid is full! 😕");
    }
  },

  updateCoopVisibility() {
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);

      // Check if the actual animal (not egg) has been created to unlock the coop
      if (gameState.createdAnimals.has(animalName)) {
        const coopElement = document.getElementById(`${animalType}Coop`);

        if (coopElement) {
          coopElement.classList.remove("hidden");
          coopElement.classList.add("bounce-in");
        }
      }
    }
    this.updateEmptyMessageVisibility();
  },

  updateEmptyMessageVisibility() {
    const emptyMessage = document.getElementById("emptyFarmMessage");
    if (!emptyMessage) return;

    let hasVisibleBuildings = false;
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      if (gameState.createdAnimals.has(animalName)) {
        hasVisibleBuildings = true;
        break;
      }
    }

    if (hasVisibleBuildings) {
      emptyMessage.classList.add("hidden");
    } else {
      emptyMessage.classList.remove("hidden");
    }
  },

  updatePlaceButtonStates() {
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const producedType = config.producesType;
      const placeButton = document.getElementById(`place${producedType}`);
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

  checkForNewUnlocks(newAnimalType) {
    // Check if this animal type corresponds to a coop (Cat, Panda, Vulture unlock coops)
    const lowerAnimalType = newAnimalType.toLowerCase();
    if (GAME_CONFIG.coopConfig[lowerAnimalType]) {
      if (!this.unlockedCoops.has(lowerAnimalType)) {
        this.unlockedCoops.add(lowerAnimalType);
        this.updateCoopVisibility();
        eventManager.showAchievement(`🏡 ${newAnimalType} Coop Unlocked!`);
      }
    }
  },

  updateCoopTimers() {
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const coop = gameState[`${animalType}Coop`];
      const producedType = config.producesType;

      if (coop.owned) {
        coop.timer -= 1;

        const progressElement = document.getElementById(
          `${animalType}CoopProgress`
        );
        if (progressElement) {
          const maxTime =
            config.baseTime *
            Math.pow(config.timeReductionFactor, coop.level - 1);
          const progress = ((maxTime - coop.timer) / maxTime) * 100;
          progressElement.style.width = `${Math.max(0, progress)}%`;

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

          const placeButton = document.getElementById(`place${producedType}`);
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

          eventManager.showAchievement(`${producedType} Ready!`);

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

  buyAutoMerge() {
    if (gameState.money >= GAME_CONFIG.autoMergeConfig.buyCost) {
      gameState.money -= GAME_CONFIG.autoMergeConfig.buyCost;
      gameState.autoMerge.owned = true;
      gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
      document.getElementById("buyAutoMerge").classList.add("hidden");
      document.getElementById("autoMergeToggle").classList.remove("hidden");
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

  toggleAutoMerge() {
    gameState.autoMerge.enabled = !gameState.autoMerge.enabled;
    const button = document.getElementById("autoMergeToggle");
    if (gameState.autoMerge.enabled) {
      button.textContent = "🔵 ON";
      button.classList.remove("bg-red-500");
      button.classList.add("bg-green-500");
    } else {
      button.textContent = "🔴 OFF";
      button.classList.remove("bg-green-500");
      button.classList.add("bg-red-500");
    }
    updateStatus(
      `Auto-Merge ${gameState.autoMerge.enabled ? "enabled" : "disabled"}`
    );
  },

  buyShuffle() {
    if (gameState.money >= GAME_CONFIG.shuffleConfig.buyCost) {
      gameState.money -= GAME_CONFIG.shuffleConfig.buyCost;
      gameState.shuffle.owned = true;
      document.getElementById("buyShuffle").classList.add("hidden");
      document.getElementById("shuffleToggle").classList.remove("hidden");
      updateMoney();
      eventManager.showAchievement("🔀 Shuffle Activated!");
      updateStatus("Bought Shuffle 🔀");
    } else {
      updateStatus("Not enough money for Shuffle! 😕");
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  toggleShuffle() {
    gameState.shuffle.enabled = !gameState.shuffle.enabled;
    const button = document.getElementById("shuffleToggle");
    if (gameState.shuffle.enabled) {
      button.textContent = "🔵 ON";
      button.classList.remove("bg-red-500");
      button.classList.add("bg-green-500");
    } else {
      button.textContent = "🔴 OFF";
      button.classList.remove("bg-green-500");
      button.classList.add("bg-red-500");
    }
    updateStatus(
      `Shuffle ${gameState.shuffle.enabled ? "enabled" : "disabled"}`
    );
  },

  performShuffle() {
    const animals = [];
    const occupiedCells = [];

    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        if (gameState.grid[i][j]) {
          animals.push(gameState.grid[i][j]);
          occupiedCells.push({ i, j });
          gameState.grid[i][j] = null;
        }
      }
    });

    if (animals.length === 0) return;

    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        gridManager.updateCell(i, j);
      }
    });

    for (let i = animals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [animals[i], animals[j]] = [animals[j], animals[i]];
    }

    let animalIndex = 0;
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (
        gameState.purchasedCells.has(`${i}-${j}`) &&
        animalIndex < animals.length
      ) {
        gameState.grid[i][j] = animals[animalIndex];
        gridManager.updateCell(i, j);
        animalIndex++;
      }
    });

    updateMergeablePairs();
    updateStatus("Animals shuffled! 🔀");
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
            "new-animal-spawn",
            "auto-merge-glow"
          );
        }
      }
    });
  },

  showAutoMergeGlow() {
    this.clearAutoMergeHighlight();
    this.updateMergeablePairsForAutoMerge();

    const glowCells = new Set();

    gameState.mergeablePairs.forEach(({ source, target }) => {
      glowCells.add(`${source.i}-${source.j}`);
      glowCells.add(`${target.i}-${target.j}`);
    });

    glowCells.forEach((cellKey) => {
      const cell = document.getElementById(`cell-${cellKey}`);
      if (cell) {
        cell.classList.add("auto-merge-glow");
      }
    });
  },

  updateMergeablePairsForAutoMerge() {
    gameState.mergeablePairs = [];

    const neighbors = [
      { di: 0, dj: 1 },
      { di: 1, dj: 0 },
      { di: 0, dj: -1 },
      { di: -1, dj: 0 },
    ];

    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (
        gameState.purchasedCells.has(`${i}-${j}`) &&
        gameState.grid[i][j] &&
        GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
      ) {
        for (const { di, dj } of neighbors) {
          const ni = i + di;
          const nj = j + dj;
          if (
            GAME_CONFIG.gridConfig.availableSpots.some(
              (spot) => spot.row === ni && spot.col === nj
            ) &&
            gameState.purchasedCells.has(`${ni}-${nj}`) &&
            gameState.grid[ni][nj] === gameState.grid[i][j]
          ) {
            const pairExists = gameState.mergeablePairs.some(
              (pair) =>
                (pair.source.i === i &&
                  pair.source.j === j &&
                  pair.target.i === ni &&
                  pair.target.j === nj) ||
                (pair.source.i === ni &&
                  pair.source.j === nj &&
                  pair.target.i === i &&
                  pair.target.j === j)
            );

            if (!pairExists) {
              gameState.mergeablePairs.push({
                source: { i, j },
                target: { i: ni, j: nj },
              });
            }
          }
        }
      }
    });
  },

  autoMergeCheck() {
    if (!gameState.autoMerge.enabled) return;

    this.clearAutoMergeHighlight();

    let mergedTypes = [];
    let mergesMade = false;

    const pairsToProcess = [...gameState.mergeablePairs];

    pairsToProcess.forEach(({ source, target }) => {
      if (
        gameState.grid[source.i][source.j] &&
        gameState.grid[target.i][target.j] &&
        gameState.grid[source.i][source.j] ===
          gameState.grid[target.i][target.j] &&
        GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo
      ) {
        const newType =
          GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo;

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

        eventManager.createParticles(
          document.getElementById(`cell-${target.i}-${target.j}`)
        );

        if (!mergedTypes.includes(newType)) mergedTypes.push(newType);
        mergesMade = true;

        this.checkForNewUnlocks(newType);

        if (newType === "EndDemoAnimal") {
          eventManager.showDemoEndedPopup();
        }
      }
    });

    this.updateMergeablePairsForAutoMerge();

    setTimeout(() => this.clearAutoMergeHighlight(), 1500);
    updateAnimalValues();

    if (mergesMade) {
      const message =
        mergedTypes.length > 0
          ? `Auto-merged into ${mergedTypes.map((t) => t).join(", ")} ⚙️`
          : "Auto-merged animals ⚙️";
      updateStatus(message);
    }

    // Always trigger shuffle if owned and enabled, regardless of whether merges were made
    if (gameState.shuffle.owned && gameState.shuffle.enabled) {
      setTimeout(() => {
        this.performShuffle();
      }, GAME_CONFIG.shuffleConfig.delayAfterAutoMerge);
    }

    this.updatePlaceButtonStates();
  },

  updateAutoMergeTimer() {
    if (gameState.autoMerge.owned && gameState.autoMerge.enabled) {
      gameState.autoMerge.timer -= 0.1;

      const progressElement = document.getElementById("autoMergeProgressBar");
      if (progressElement) {
        const progress =
          ((gameState.autoMerge.currentInterval - gameState.autoMerge.timer) /
            gameState.autoMerge.currentInterval) *
          100;
        progressElement.style.width = `${Math.max(0, progress)}%`;

        if (gameState.autoMerge.timer <= 3) {
          progressElement.classList.add("urgent");
        } else {
          progressElement.classList.remove("urgent");
        }
      }

      if (Math.abs(gameState.autoMerge.timer - 2) < 0.05) {
        this.showAutoMergeGlow();
      } else if (Math.abs(gameState.autoMerge.timer - 1) < 0.05) {
        this.showAutoMergeGlow();
      } else if (Math.abs(gameState.autoMerge.timer - 0.5) < 0.05) {
        this.showAutoMergeGlow();
      } else if (Math.abs(gameState.autoMerge.timer - 0.25) < 0.05) {
        this.showAutoMergeGlow();
      }

      if (gameState.autoMerge.timer <= 0) {
        this.autoMergeCheck();
        gameState.autoMerge.timer = gameState.autoMerge.currentInterval;

        if (progressElement) {
          progressElement.style.width = "0%";
          progressElement.classList.remove("urgent");
        }
      }
    }
  },
};
