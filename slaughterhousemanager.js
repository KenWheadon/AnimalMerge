// Slaughter House Manager - Handles all slaughter house functionality
const slaughterHouseManager = {
  // Generate slaughter house HTML
  generateSlaughterHouseHTML() {
    let html = '<div class="flex space-x-4 overflow-x-auto pb-4">';

    // Generate existing slaughter houses
    gameState.slaughterHouses.forEach((house, index) => {
      html += `
        <div class="slaughter-house-container flex-shrink-0 bg-white p-4 rounded-xl shadow-lg min-w-[200px]">
          <h3 class="text-lg font-bold text-red-800 mb-2">🗡️ Slaughter House ${
            index + 1
          }</h3>
          <div class="space-y-2 text-sm">
            <p class="font-semibold">Level: ${house.level}</p>
            <p class="timer-display">Process Time: ${house.processTime.toFixed(
              1
            )}s</p>
            <p class="font-semibold">Queue: ${house.queue.length}/10</p>
            ${
              house.currentAnimal
                ? `<p class="timer-display">Processing: ${
                    house.currentAnimal.type
                  } (${house.timer.toFixed(1)}s)</p>`
                : ""
            }
          </div>
          <div id="slaughterHouse${index}" class="slaughter-house rounded-xl p-4 text-center font-bold text-red-800 h-24 flex items-center justify-center cursor-pointer relative mt-2 border-2 border-dashed border-red-500" 
               data-house-index="${index}">
            <div class="z-10 text-sm">Drop animals here</div>
          </div>
          <div class="mt-2 space-y-1">
            <button id="upgradeSlaughterHouse${index}" class="enhanced-button upgrade-button w-full px-2 py-1 rounded-lg font-bold text-white text-sm">
              <i class="fas fa-arrow-up mr-1"></i>Upgrade ($${
                house.upgradeCost
              })
            </button>
          </div>
          <div class="queue-display mt-2 flex flex-wrap gap-1" id="queue${index}">
            ${house.queue
              .map(
                (animal) =>
                  `<span class="text-xs bg-red-100 px-1 py-0.5 rounded">${
                    GAME_CONFIG.animalEmojis[animal.type]
                  }</span>`
              )
              .join("")}
          </div>
        </div>
      `;
    });

    // Add buy new slaughter house button
    html += `
      <div class="slaughter-house-container flex-shrink-0 bg-gray-200 p-4 rounded-xl shadow-lg min-w-[200px] opacity-60">
        <h3 class="text-lg font-bold text-gray-600 mb-2">🔒 New Slaughter House</h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>Expand your operation!</p>
        </div>
        <button id="buySlaughterHouse" class="enhanced-button buy-button w-full px-2 py-2 rounded-lg font-bold text-white text-sm mt-4">
          <i class="fas fa-plus mr-1"></i>Buy Slaughter House ($${this.getNextSlaughterHouseCost()})
        </button>
      </div>
    `;

    html += "</div>";
    return html;
  },

  // Initialize slaughter house system
  initializeSlaughterHouses() {
    if (!gameState.slaughterHouses) {
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
      this.reinitializeEventListeners();
      eventManager.showAchievement(`🗡️ New Slaughter House Built!`);
      updateStatus(`Bought new slaughter house for $${cost}! 🗡️`);
    } else {
      updateStatus(`Need $${cost} for new slaughter house! 😕`);
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
      this.updateSlaughterHouseDisplay();
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

    this.updateSlaughterHouseDisplay();
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
          this.processQueue(index); // Start next animal
        }
      }
    });

    this.updateSlaughterHouseDisplay();
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

  // Update slaughter house display
  updateSlaughterHouseDisplay() {
    const container = document.getElementById("slaughterHousesContainer");
    if (!container) return;

    container.innerHTML = this.generateSlaughterHouseHTML();
    this.reinitializeEventListeners();
  },

  // Initialize event listeners for slaughter houses
  initializeSlaughterHouseEventListeners() {
    gameState.slaughterHouses.forEach((house, index) => {
      const slaughterHouse = document.getElementById(`slaughterHouse${index}`);
      if (slaughterHouse) {
        slaughterHouse.addEventListener("dragover", (e) => {
          e.preventDefault();
          slaughterHouse.classList.add("drag-over");
        });
        slaughterHouse.addEventListener("dragleave", () => {
          slaughterHouse.classList.remove("drag-over");
        });
        slaughterHouse.addEventListener("drop", (e) =>
          this.handleSlaughterDrop(e, index)
        );
        slaughterHouse.addEventListener("touchend", (e) =>
          this.handleSlaughterTouchEnd(e, index)
        );

        // Add hover tooltip for animal values
        slaughterHouse.addEventListener("mouseenter", () =>
          this.showAnimalValuesTooltip(slaughterHouse)
        );
        slaughterHouse.addEventListener("mouseleave", () =>
          this.hideAnimalValuesTooltip()
        );
      }

      // Upgrade button
      const upgradeButton = document.getElementById(
        `upgradeSlaughterHouse${index}`
      );
      if (upgradeButton) {
        upgradeButton.addEventListener("click", () =>
          this.upgradeSlaughterHouse(index)
        );
      }
    });

    // Buy slaughter house button
    const buyButton = document.getElementById("buySlaughterHouse");
    if (buyButton) {
      buyButton.addEventListener("click", () => this.buySlaughterHouse());
    }
  },

  // Reinitialize event listeners (called after updates)
  reinitializeEventListeners() {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      this.initializeSlaughterHouseEventListeners();
    }, 100);
  },

  // Handle drop on slaughter house
  handleSlaughterDrop(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
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
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
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

  // Show animal values tooltip
  showAnimalValuesTooltip(element) {
    const tooltip = document.createElement("div");
    tooltip.id = "animalValuesTooltip";
    tooltip.className =
      "absolute bg-black text-white p-2 rounded shadow-lg z-50 text-sm";
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
    element.appendChild(tooltip);
  },

  // Hide animal values tooltip
  hideAnimalValuesTooltip() {
    const tooltip = document.getElementById("animalValuesTooltip");
    if (tooltip) {
      tooltip.remove();
    }
  },
};
