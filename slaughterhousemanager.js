// Slaughter House Manager - Handles all slaughter house functionality
const slaughterHouseManager = {
  // Cache for DOM elements and event listeners
  domCache: new Map(),
  eventListeners: new Map(),
  tooltipCache: null,

  // Generate slaughter house HTML
  generateSlaughterHouseHTML() {
    console.log(
      "Generating slaughter house HTML, houses:",
      gameState.slaughterHouses
    );

    let html = '<div class="flex space-x-3 overflow-x-auto pb-2">';

    // Generate existing slaughter houses
    gameState.slaughterHouses.forEach((house, index) => {
      console.log(`Generating house ${index}:`, house);
      html += `
        <div class="slaughter-house-container flex-shrink-0 bg-white rounded-lg shadow-md min-w-[280px] max-w-[320px]">
          <div class="p-3">
            <!-- Header Row -->
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-sm font-bold text-red-800">🗡️ House ${
                index + 1
              }</h3>
               <div class="gap-2 items-center">
              <button id="upgradeSlaughterHouse${index}" class="enhanced-button upgrade-button flex-1 px-2 py-1 rounded-lg font-bold text-white text-xs">
                <i class="fas fa-arrow-up mr-1"></i>Upgrade ($${
                  house.upgradeCost
                })
              </button>
              <div class="queue-display flex flex-wrap gap-1 flex-1 justify-end" id="queue${index}">
                ${house.queue
                  .slice(0, 6)
                  .map(
                    (animal) =>
                      `<span class="text-xs bg-red-100 px-1 py-0.5 rounded">${
                        GAME_CONFIG.animalEmojis[animal.type]
                      }</span>`
                  )
                  .join("")}
                ${
                  house.queue.length > 6
                    ? `<span class="text-xs text-gray-500">+${
                        house.queue.length - 6
                      }</span>`
                    : ""
                }
              </div>
            </div>
              <span class="text-xs bg-red-100 px-2 py-1 rounded-full">Lv.${
                house.level
              }</span>
            </div>
            
            <!-- Main Content Row -->
            <div class="flex gap-3">
              <!-- Drop Zone -->
              <div id="slaughterHouse${index}" class="slaughter-house rounded-lg p-2 text-center font-bold text-red-800 flex-1 h-16 flex items-center justify-center cursor-pointer relative border-2 border-dashed border-red-500" 
                   data-house-index="${index}">
                <div class="z-10 text-xs">Drop animals here</div>
              </div>
              
              <!-- Info Panel -->
              <div class="flex-1 text-xs space-y-1">
                <div class="flex justify-between">
                  <span>Time:</span>
                  <span class="timer-display px-1 py-0.5 rounded">${house.processTime.toFixed(
                    1
                  )}s</span>
                </div>
                <div class="flex justify-between">
                  <span>Queue:</span>
                  <span class="font-semibold">${house.queue.length}/10</span>
                </div>
                ${
                  house.currentAnimal
                    ? `<div class="flex justify-between">
                        <span>Processing:</span>
                        <span class="timer-display px-1 py-0.5 rounded">${house.timer.toFixed(
                          1
                        )}s</span>
                      </div>`
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `;
    });

    // Add buy new slaughter house button
    html += `
      <div class="slaughter-house-container flex-shrink-0 bg-gray-200 rounded-lg shadow-md min-w-[280px] max-w-[320px] opacity-60">
        <div class="p-3 h-full flex flex-col justify-center">
          <div class="text-center">
            <h3 class="text-sm font-bold text-gray-600 mb-2">🔒 New House</h3>
            <p class="text-xs text-gray-600 mb-3">Expand operation!</p>
            <button id="buySlaughterHouse" class="enhanced-button buy-button w-full px-2 py-2 rounded-lg font-bold text-white text-xs">
              <i class="fas fa-plus mr-1"></i>Buy ($${this.getNextSlaughterHouseCost()})
            </button>
          </div>
        </div>
      </div>
    `;

    html += "</div>";
    console.log("Generated HTML:", html);
    return html;
  },

  // Initialize slaughter house system
  initializeSlaughterHouses() {
    if (!gameState.slaughterHouses || gameState.slaughterHouses.length === 0) {
      gameState.slaughterHouses = [
        {
          level: 1,
          processTime: 5.0,
          timer: 0,
          queue: [],
          currentAnimal: null,
          upgradeCost: 20,
        },
      ];
    }
  },

  // Get cost for next slaughter house
  getNextSlaughterHouseCost() {
    return 50 * Math.pow(2, gameState.slaughterHouses.length - 1);
  },

  // Buy new slaughter house
  buySlaughterHouse() {
    if (gameState.slaughterHouses.length >= 3) {
      updateStatus("Maximum of 3 slaughter houses allowed! 🏭");
      return;
    }

    const cost = this.getNextSlaughterHouseCost();
    if (gameState.money >= cost) {
      gameState.money -= cost;
      gameState.slaughterHouses.push({
        level: 1,
        processTime: 5.0,
        timer: 0,
        queue: [],
        currentAnimal: null,
        upgradeCost: 20,
      });
      updateMoney();
      this.updateSlaughterHouseDisplay();
      eventManager.showAchievement(`🗡️ New Slaughter House Built!`);
      updateStatus(`Bought new slaughter house for ${cost}! 🗡️`);
    } else {
      updateStatus(`Need ${cost} for new slaughter house! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Upgrade slaughter house
  upgradeSlaughterHouse(index) {
    const house = gameState.slaughterHouses[index];
    if (gameState.money >= house.upgradeCost) {
      gameState.money -= house.upgradeCost;
      house.level += 1;
      house.processTime = 5.0 * Math.pow(0.85, house.level - 1);
      house.upgradeCost = Math.floor(house.upgradeCost * 1.5);
      updateMoney();
      this.updateSlaughterHouseData(index);
      eventManager.showAchievement(
        `🆙 Slaughter House ${index + 1} Level ${house.level}!`
      );
      updateStatus(
        `Upgraded slaughter house ${index + 1} to level ${house.level}! 🆙`
      );
    } else {
      updateStatus(`Need $${house.upgradeCost} to upgrade slaughter house! 😕`);
      document.body.classList.add("screen-shake");
      setTimeout(() => document.body.classList.remove("screen-shake"), 500);
    }
  },

  // Add animal to slaughter house queue
  addAnimalToQueue(houseIndex, animalType, gridI, gridJ) {
    const house = gameState.slaughterHouses[houseIndex];
    if (house.queue.length >= 10) {
      updateStatus("Slaughter house queue is full! 😕");
      return false;
    }

    house.queue.push({
      type: animalType,
      gridI,
      gridJ,
      value: GAME_CONFIG.animalTypes[animalType].sellPrice,
    });

    // Remove from grid
    gameState.grid[gridI][gridJ] = null;
    gridManager.updateCell(gridI, gridJ);
    updateMergeablePairs();

    this.updateSlaughterHouseQueue(houseIndex);
    this.processQueue(houseIndex);

    updateStatus(
      `Added ${GAME_CONFIG.animalEmojis[animalType]} to slaughter queue!`
    );
    return true;
  },

  // Process slaughter house queue
  processQueue(houseIndex) {
    const house = gameState.slaughterHouses[houseIndex];

    // If not currently processing and queue has items
    if (!house.currentAnimal && house.queue.length > 0) {
      house.currentAnimal = house.queue.shift();
      house.timer = house.processTime;
      this.updateSlaughterHouseQueue(houseIndex);
      this.updateSlaughterHouseStatus(houseIndex);
    }
  },

  // Update slaughter house timers
  updateSlaughterHouseTimers() {
    gameState.slaughterHouses.forEach((house, index) => {
      if (house.currentAnimal) {
        house.timer -= 1;

        if (house.timer <= 0) {
          // Complete processing
          const animal = house.currentAnimal;
          gameState.money += animal.value;
          updateMoney();

          // Show completion effects
          this.showSlaughterComplete(index, animal);

          house.currentAnimal = null;
          this.updateSlaughterHouseStatus(index);
          this.processQueue(index); // Start next animal
        } else {
          this.updateSlaughterHouseStatus(index);
        }
      }
    });
  },

  // Show slaughter completion effects
  showSlaughterComplete(houseIndex, animal) {
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
    if (!slaughterHouse) return;

    // Enhanced coin burst
    for (let k = 0; k < 5; k++) {
      const coin = document.createElement("div");
      coin.classList.add("coin-burst");
      coin.style.left = `${Math.random() * 60 + 20}%`;
      coin.style.top = `${Math.random() * 60 + 20}%`;
      slaughterHouse.appendChild(coin);
      setTimeout(() => coin.remove(), 1000);
    }

    // Floating money number
    eventManager.showFloatingNumber(`+💰${animal.value}`, slaughterHouse);

    updateStatus(
      `Processed ${GAME_CONFIG.animalEmojis[animal.type]} for 💰${
        animal.value
      }!`
    );
  },

  // Update only the data for a specific slaughter house (memory optimized)
  updateSlaughterHouseData(index) {
    const house = gameState.slaughterHouses[index];
    const container = document
      .querySelector(`[data-house-index="${index}"]`)
      ?.closest(".slaughter-house-container");
    if (!container) return;

    // Update level
    const levelSpan = container.querySelector(".bg-red-100");
    if (levelSpan) {
      levelSpan.textContent = `Lv.${house.level}`;
    }

    // Update process time
    const timeSpan = container.querySelector(".timer-display");
    if (timeSpan) {
      timeSpan.textContent = `${house.processTime.toFixed(1)}s`;
    }

    // Update upgrade button
    const upgradeBtn = container.querySelector(
      `#upgradeSlaughterHouse${index}`
    );
    if (upgradeBtn) {
      upgradeBtn.innerHTML = `<i class="fas fa-arrow-up mr-1"></i>Upgrade ($${house.upgradeCost})`;
    }
  },

  // Update only the queue display (memory optimized)
  updateSlaughterHouseQueue(index) {
    const house = gameState.slaughterHouses[index];
    const queueDisplay = document.getElementById(`queue${index}`);
    const queueCount = document
      .querySelector(`[data-house-index="${index}"]`)
      ?.closest(".slaughter-house-container")
      .querySelector(".flex.justify-between .font-semibold");

    if (queueDisplay) {
      queueDisplay.innerHTML =
        house.queue
          .slice(0, 6)
          .map(
            (animal) =>
              `<span class="text-xs bg-red-100 px-1 py-0.5 rounded">${
                GAME_CONFIG.animalEmojis[animal.type]
              }</span>`
          )
          .join("") +
        (house.queue.length > 6
          ? `<span class="text-xs text-gray-500">+${
              house.queue.length - 6
            }</span>`
          : "");
    }

    if (queueCount) {
      queueCount.textContent = `${house.queue.length}/10`;
    }
  },

  // Update only the processing status (memory optimized)
  updateSlaughterHouseStatus(index) {
    const house = gameState.slaughterHouses[index];
    const container = document
      .querySelector(`[data-house-index="${index}"]`)
      ?.closest(".slaughter-house-container");
    if (!container) return;

    const infoPanel = container.querySelector(".flex-1.text-xs.space-y-1");
    if (!infoPanel) return;

    // Find or create processing status
    let processingDiv = infoPanel.querySelector(".processing-status");

    if (house.currentAnimal) {
      if (!processingDiv) {
        processingDiv = document.createElement("div");
        processingDiv.className = "flex justify-between processing-status";
        infoPanel.appendChild(processingDiv);
      }
      processingDiv.innerHTML = `
        <span>Processing:</span>
        <span class="timer-display px-1 py-0.5 rounded">${house.timer.toFixed(
          1
        )}s</span>
      `;
    } else if (processingDiv) {
      processingDiv.remove();
    }
  },

  // Update slaughter house display (now more memory efficient)
  updateSlaughterHouseDisplay() {
    const container = document.getElementById("slaughterHousesContainer");
    if (!container) return;

    // Clear cached DOM references
    this.domCache.clear();

    // Clean up existing event listeners
    this.cleanupEventListeners();

    container.innerHTML = this.generateSlaughterHouseHTML();
    this.initializeSlaughterHouseEventListeners();
  },

  // Clean up event listeners to prevent memory leaks
  cleanupEventListeners() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  },

  // Initialize event listeners for slaughter houses
  initializeSlaughterHouseEventListeners() {
    gameState.slaughterHouses.forEach((house, index) => {
      const slaughterHouse = document.getElementById(`slaughterHouse${index}`);
      if (slaughterHouse) {
        // Cache DOM element
        this.domCache.set(`slaughterHouse${index}`, slaughterHouse);

        // Create event handlers
        const dragOverHandler = (e) => {
          e.preventDefault();
          slaughterHouse.classList.add("drag-over");
        };
        const dragLeaveHandler = () => {
          slaughterHouse.classList.remove("drag-over");
        };
        const dropHandler = (e) => this.handleSlaughterDrop(e, index);
        const touchEndHandler = (e) => this.handleSlaughterTouchEnd(e, index);
        const mouseEnterHandler = () =>
          this.showAnimalValuesTooltip(slaughterHouse);
        const mouseLeaveHandler = () => this.hideAnimalValuesTooltip();

        // Add event listeners
        slaughterHouse.addEventListener("dragover", dragOverHandler);
        slaughterHouse.addEventListener("dragleave", dragLeaveHandler);
        slaughterHouse.addEventListener("drop", dropHandler);
        slaughterHouse.addEventListener("touchend", touchEndHandler);
        slaughterHouse.addEventListener("mouseenter", mouseEnterHandler);
        slaughterHouse.addEventListener("mouseleave", mouseLeaveHandler);

        // Cache event listeners for cleanup
        this.eventListeners.set(slaughterHouse, [
          { event: "dragover", handler: dragOverHandler },
          { event: "dragleave", handler: dragLeaveHandler },
          { event: "drop", handler: dropHandler },
          { event: "touchend", handler: touchEndHandler },
          { event: "mouseenter", handler: mouseEnterHandler },
          { event: "mouseleave", handler: mouseLeaveHandler },
        ]);
      }

      // Upgrade button
      const upgradeButton = document.getElementById(
        `upgradeSlaughterHouse${index}`
      );
      if (upgradeButton) {
        const upgradeHandler = () => this.upgradeSlaughterHouse(index);
        upgradeButton.addEventListener("click", upgradeHandler);

        // Cache event listener
        this.eventListeners.set(upgradeButton, [
          { event: "click", handler: upgradeHandler },
        ]);
      }
    });

    // Buy slaughter house button
    const buyButton = document.getElementById("buySlaughterHouse");
    if (buyButton) {
      const buyHandler = () => this.buySlaughterHouse();
      buyButton.addEventListener("click", buyHandler);

      // Cache event listener
      this.eventListeners.set(buyButton, [
        { event: "click", handler: buyHandler },
      ]);
    }
  },

  // Handle drop on slaughter house
  handleSlaughterDrop(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse =
      this.domCache.get(`slaughterHouse${houseIndex}`) ||
      document.getElementById(`slaughterHouse${houseIndex}`);
    slaughterHouse.classList.remove("drag-over");

    if (!gameState.draggedCell) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];

    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
      this.addAnimalToQueue(houseIndex, type, i, j);
    } else {
      updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove("drag-preview");
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  // Handle touch end on slaughter house
  handleSlaughterTouchEnd(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse =
      this.domCache.get(`slaughterHouse${houseIndex}`) ||
      document.getElementById(`slaughterHouse${houseIndex}`);
    slaughterHouse.classList.remove("drag-over");

    if (!gameState.draggedCell) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];

    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
      this.addAnimalToQueue(houseIndex, type, i, j);
    } else {
      updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove("drag-preview");
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  // Show animal values tooltip (now cached)
  showAnimalValuesTooltip(element) {
    // Reuse cached tooltip if available
    if (this.tooltipCache) {
      element.appendChild(this.tooltipCache);
      return;
    }

    const tooltip = document.createElement("div");
    tooltip.id = "animalValuesTooltip";
    tooltip.className =
      "absolute bg-black text-white p-2 rounded shadow-lg z-50 text-xs";
    tooltip.style.left = "50%";
    tooltip.style.top = "-10px";
    tooltip.style.transform = "translateX(-50%) translateY(-100%)";

    let tooltipContent = "<strong>Animal Values:</strong><br>";
    for (const [type, { sellPrice }] of Object.entries(
      GAME_CONFIG.animalTypes
    )) {
      if (sellPrice > 0 && gameState.createdAnimals.has(type)) {
        tooltipContent += `${GAME_CONFIG.animalEmojis[type]} ${type}: 💰${sellPrice}<br>`;
      }
    }

    tooltip.innerHTML = tooltipContent;

    // Cache the tooltip
    this.tooltipCache = tooltip;
    element.appendChild(tooltip);
  },

  // Hide animal values tooltip
  hideAnimalValuesTooltip() {
    if (this.tooltipCache && this.tooltipCache.parentNode) {
      this.tooltipCache.parentNode.removeChild(this.tooltipCache);
      // Keep cached for reuse
    }
  },
};
