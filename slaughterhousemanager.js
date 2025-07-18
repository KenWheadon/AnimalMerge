// Slaughter House Manager - Handles all slaughter house functionality
const slaughterHouseManager = {
  // Cache for DOM elements and event listeners
  domCache: new Map(),
  eventListeners: new Map(),
  tooltipCache: null,
  processingIntervals: new Map(),
  particleIntervals: new Map(),

  // Generate slaughter house HTML with new compact design
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
        <div class="slaughter-house-container">
          <!-- Hover Controls -->
          <div class="slaughter-house-hover-controls">
            <div class="level-display">Level ${house.level}</div>
            <button id="upgradeSlaughterHouse${index}" class="enhanced-button upgrade-button px-2 py-1 rounded text-xs">
              Upgrade ($${house.upgradeCost})
            </button>
          </div>

          <div class="p-3">
            <!-- Header -->
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-sm font-bold text-red-800">Slaughter House ${
                index + 1
              }</h3>
              <div class="compact-queue-display">
                <span id="queueCount${index}">${house.queue.length}</span>
              </div>
            </div>
            
            <!-- Drop Zone with Progress Bar -->
            <div id="slaughterHouse${index}" class="slaughter-house" data-house-index="${index}">
              <div class="drop-zone-text">Drop animals here</div>
              <div id="processingProgress${index}" class="processing-progress" style="width: 0%"></div>
            </div>
          </div>
        </div>
      `;
    });

    // Add buy new slaughter house button
    html += `
      <div class="slaughter-house-container opacity-60">
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
      this.startProcessingAnimation(houseIndex);
    }
  },

  // Start processing animation
  startProcessingAnimation(houseIndex) {
    const house = gameState.slaughterHouses[houseIndex];
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
    if (!slaughterHouse || !house.currentAnimal) return;

    // Clear any existing animations
    this.clearProcessingAnimation(houseIndex);

    // Create processing animal element
    const processingAnimal = document.createElement("div");
    processingAnimal.className = "processing-animal";
    processingAnimal.id = `processingAnimal${houseIndex}`;
    processingAnimal.textContent =
      GAME_CONFIG.animalEmojis[house.currentAnimal.type];
    slaughterHouse.appendChild(processingAnimal);

    // Start particle effect
    this.startProcessingParticles(houseIndex);

    // Hide the drop zone text
    const dropZoneText = slaughterHouse.querySelector(".drop-zone-text");
    if (dropZoneText) {
      dropZoneText.style.opacity = "0";
    }
  },

  // Start processing particles
  startProcessingParticles(houseIndex) {
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
    if (!slaughterHouse) return;

    // Clear existing particles
    const existingParticles = slaughterHouse.querySelectorAll(
      ".processing-particle"
    );
    existingParticles.forEach((particle) => particle.remove());

    // Create particle interval
    const particleInterval = setInterval(() => {
      const house = gameState.slaughterHouses[houseIndex];
      if (!house.currentAnimal) {
        clearInterval(particleInterval);
        return;
      }

      // Create 3-5 particles
      for (let i = 0; i < Math.random() * 3 + 3; i++) {
        const particle = document.createElement("div");
        particle.className = "processing-particle";
        particle.style.left = `${Math.random() * 80 + 10}%`;
        particle.style.top = `${Math.random() * 80 + 10}%`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        slaughterHouse.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 1000);
      }
    }, 200);

    this.particleIntervals.set(houseIndex, particleInterval);
  },

  // Clear processing animation
  clearProcessingAnimation(houseIndex) {
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
    if (!slaughterHouse) return;

    // Remove processing animal
    const processingAnimal = document.getElementById(
      `processingAnimal${houseIndex}`
    );
    if (processingAnimal) {
      processingAnimal.remove();
    }

    // Clear particle interval
    const particleInterval = this.particleIntervals.get(houseIndex);
    if (particleInterval) {
      clearInterval(particleInterval);
      this.particleIntervals.delete(houseIndex);
    }

    // Remove all particles
    const particles = slaughterHouse.querySelectorAll(".processing-particle");
    particles.forEach((particle) => particle.remove());

    // Show drop zone text
    const dropZoneText = slaughterHouse.querySelector(".drop-zone-text");
    if (dropZoneText) {
      dropZoneText.style.opacity = "1";
    }
  },

  // Create processing burst effect
  createProcessingBurst(houseIndex) {
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
    if (!slaughterHouse) return;

    const burst = document.createElement("div");
    burst.className = "processing-burst";
    burst.textContent = "💥";
    slaughterHouse.appendChild(burst);

    setTimeout(() => {
      if (burst.parentNode) {
        burst.parentNode.removeChild(burst);
      }
    }, 800);
  },

  // Create flying coins animation
  createFlyingCoins(houseIndex, value) {
    const slaughterHouse = document.getElementById(
      `slaughterHouse${houseIndex}`
    );
    const moneyDisplay = document.getElementById("money");

    if (!slaughterHouse || !moneyDisplay) return;

    const slaughterRect = slaughterHouse.getBoundingClientRect();
    const moneyRect = moneyDisplay.getBoundingClientRect();

    const numCoins = Math.ceil(value / 10);
    const displayValue = `+$${value}`;

    // Create money value display
    const moneyValue = document.createElement("div");
    moneyValue.className = "flying-money-value";
    moneyValue.textContent = displayValue;
    moneyValue.style.left = `${slaughterRect.left + slaughterRect.width / 2}px`;
    moneyValue.style.top = `${slaughterRect.top + slaughterRect.height / 2}px`;
    document.body.appendChild(moneyValue);

    // Remove money value after animation
    setTimeout(() => {
      if (moneyValue.parentNode) {
        moneyValue.parentNode.removeChild(moneyValue);
      }
    }, 2000);

    // Create and animate coins
    for (let i = 0; i < numCoins; i++) {
      setTimeout(() => {
        const coin = document.createElement("div");
        coin.className = "flying-coin";
        coin.style.left = `${
          slaughterRect.left + slaughterRect.width / 2 - 16
        }px`;
        coin.style.top = `${
          slaughterRect.top + slaughterRect.height / 2 - 16
        }px`;
        document.body.appendChild(coin);

        // Calculate trajectory
        const deltaX =
          moneyRect.left +
          moneyRect.width / 2 -
          (slaughterRect.left + slaughterRect.width / 2);
        const deltaY =
          moneyRect.top +
          moneyRect.height / 2 -
          (slaughterRect.top + slaughterRect.height / 2);

        // Animate coin to money display
        coin
          .animate(
            [
              {
                transform: "translate(0, 0) scale(1) rotate(0deg)",
                opacity: 1,
              },
              {
                transform: `translate(${deltaX}px, ${deltaY}px) scale(0.8) rotate(360deg)`,
                opacity: 0,
              },
            ],
            {
              duration: 1000 + i * 100,
              easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }
          )
          .addEventListener("finish", () => {
            if (coin.parentNode) {
              coin.parentNode.removeChild(coin);
            }
          });
      }, i * 50);
    }
  },

  // Update slaughter house timers
  updateSlaughterHouseTimers() {
    gameState.slaughterHouses.forEach((house, index) => {
      if (house.currentAnimal) {
        house.timer -= 1;

        // Update progress bar
        const progressBar = document.getElementById(
          `processingProgress${index}`
        );
        if (progressBar) {
          const progress =
            ((house.processTime - house.timer) / house.processTime) * 100;
          progressBar.style.width = `${progress}%`;
        }

        if (house.timer <= 0) {
          // Complete processing
          const animal = house.currentAnimal;
          gameState.money += animal.value;
          updateMoney();

          // Show completion effects
          this.createProcessingBurst(index);
          this.createFlyingCoins(index, animal.value);

          // Clear animations
          this.clearProcessingAnimation(index);

          // Reset progress bar
          const progressBar = document.getElementById(
            `processingProgress${index}`
          );
          if (progressBar) {
            progressBar.style.width = "0%";
          }

          house.currentAnimal = null;
          this.processQueue(index); // Start next animal

          updateStatus(
            `Processed ${GAME_CONFIG.animalEmojis[animal.type]} for 💰${
              animal.value
            }!`
          );
        }
      }
    });
  },

  // Update only the data for a specific slaughter house (memory optimized)
  updateSlaughterHouseData(index) {
    const house = gameState.slaughterHouses[index];

    // Update level in hover controls
    const levelDisplay = document
      .querySelector(`#upgradeSlaughterHouse${index}`)
      .parentNode.querySelector(".level-display");
    if (levelDisplay) {
      levelDisplay.textContent = `Level ${house.level}`;
    }

    // Update upgrade button
    const upgradeBtn = document.getElementById(`upgradeSlaughterHouse${index}`);
    if (upgradeBtn) {
      upgradeBtn.textContent = `Upgrade ($${house.upgradeCost})`;
    }
  },

  // Update only the queue display (memory optimized)
  updateSlaughterHouseQueue(index) {
    const house = gameState.slaughterHouses[index];
    const queueCount = document.getElementById(`queueCount${index}`);

    if (queueCount) {
      queueCount.textContent = house.queue.length;
    }
  },

  // Update slaughter house display (now more memory efficient)
  updateSlaughterHouseDisplay() {
    const container = document.getElementById("slaughterHousesContainer");
    if (!container) return;

    // Clear cached DOM references
    this.domCache.clear();

    // Clean up existing event listeners and animations
    this.cleanupEventListeners();
    this.cleanupAnimations();

    container.innerHTML = this.generateSlaughterHouseHTML();
    this.initializeSlaughterHouseEventListeners();
  },

  // Clean up animations
  cleanupAnimations() {
    // Clear all processing intervals
    this.processingIntervals.forEach((interval) => clearInterval(interval));
    this.processingIntervals.clear();

    // Clear all particle intervals
    this.particleIntervals.forEach((interval) => clearInterval(interval));
    this.particleIntervals.clear();

    // Remove any remaining animated elements
    document
      .querySelectorAll(
        ".processing-animal, .processing-particle, .processing-burst, .flying-coin, .flying-money-value"
      )
      .forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
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

  // Show animal values tooltip (now cached) - FIXED: Position below instead of above
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
    tooltip.style.top = "100%"; // Changed from "-10px" to "100%" to position below
    tooltip.style.transform = "translateX(-50%) translateY(10px)"; // Changed from translateY(-100%) to translateY(10px)

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
