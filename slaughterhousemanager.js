const slaughterHouseManager = {
  domCache: new Map(),
  eventListeners: new Map(),
  tooltipCache: null,
  processingIntervals: new Map(),
  particleIntervals: new Map(),

  generateSlaughterHouseHTML() {
    // Check if slaughter house should be visible (Mantis has been created)
    const shouldShowSlaughterHouse = gameState.createdAnimals.has("Mantis");

    if (!shouldShowSlaughterHouse) {
      // Return placeholder that maintains layout but is invisible/empty
      return `
      `;
    }

    const house = gameState.slaughterHouses[0];

    return `
      <div class="slaughter-house-section">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold text-red-800">🗡️ Slaughter House</h3>
          <button id="slaughterInfo0" class="info-button">
            <i class="fas fa-info-circle"></i>
          </button>
        </div>
        
        <div class="compact-queue-display mb-3">
          Processing Queue: <span id="queueCount0">${house.queue.length}</span>/10
        </div>
        
        <div id="slaughterHouse0" class="slaughter-house" data-house-index="0">
          <div class="drop-zone-text">Drop animals here to sell</div>
          <div id="processingProgress0" class="processing-progress" style="width: 0%"></div>
        </div>
      </div>
    `;
  },

  updateVisibility() {
    const container = document.getElementById("slaughterHouseContainer");
    if (!container) return;

    // Check if visibility state has changed
    const shouldShowSlaughterHouse = gameState.createdAnimals.has("Mantis");
    const currentlyVisible = !container.querySelector(
      "#slaughterHousePlaceholder"
    );

    if (shouldShowSlaughterHouse !== currentlyVisible) {
      // Regenerate the HTML with new visibility state
      this.updateSlaughterHouseDisplay();
    }
  },

  initializeSlaughterHouses() {
    if (!gameState.slaughterHouses || gameState.slaughterHouses.length === 0) {
      gameState.slaughterHouses = [
        {
          level: 1,
          processTime: 5.0,
          timer: 0,
          queue: [],
          currentAnimal: null,
        },
      ];
    }
  },

  addAnimalToQueue(houseIndex, animalType, gridI, gridJ) {
    const house = gameState.slaughterHouses[0]; // Always use first house since there's only one
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

    gameState.grid[gridI][gridJ] = null;
    gridManager.updateCell(gridI, gridJ);
    updateMergeablePairs();

    this.updateSlaughterHouseQueue(0);
    this.processQueue(0);

    updateStatus(`Added ${animalType} to slaughter queue!`);
    return true;
  },

  processQueue(houseIndex) {
    const house = gameState.slaughterHouses[0];

    if (!house.currentAnimal && house.queue.length > 0) {
      house.currentAnimal = house.queue.shift();
      house.timer = house.processTime;
      this.updateSlaughterHouseQueue(0);
      this.startProcessingAnimation(0);
    }
  },

  startProcessingAnimation(houseIndex) {
    const house = gameState.slaughterHouses[0];
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    if (!slaughterHouse || !house.currentAnimal) return;

    this.clearProcessingAnimation(0);

    const processingAnimal = document.createElement("div");
    processingAnimal.className = "processing-animal";
    processingAnimal.id = `processingAnimal0`;
    processingAnimal.innerHTML = `<img src="${
      GAME_CONFIG.animalImages[house.currentAnimal.type]
    }" alt="${house.currentAnimal.type}" class="processing-animal-image" />`;
    slaughterHouse.appendChild(processingAnimal);

    this.startProcessingParticles(0);

    const dropZoneText = slaughterHouse.querySelector(".drop-zone-text");
    if (dropZoneText) {
      dropZoneText.style.opacity = "0";
    }
  },

  startProcessingParticles(houseIndex) {
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    if (!slaughterHouse) return;

    const existingParticles = slaughterHouse.querySelectorAll(
      ".processing-particle"
    );
    existingParticles.forEach((particle) => particle.remove());

    const particleInterval = setInterval(() => {
      const house = gameState.slaughterHouses[0];
      if (!house.currentAnimal) {
        clearInterval(particleInterval);
        return;
      }

      for (let i = 0; i < Math.random() * 3 + 3; i++) {
        const particle = document.createElement("div");
        particle.className = "processing-particle";
        particle.style.left = `${Math.random() * 80 + 10}%`;
        particle.style.top = `${Math.random() * 80 + 10}%`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        slaughterHouse.appendChild(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 1000);
      }
    }, 200);

    this.particleIntervals.set(0, particleInterval);
  },

  clearProcessingAnimation(houseIndex) {
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    if (!slaughterHouse) return;

    const processingAnimal = document.getElementById(`processingAnimal0`);
    if (processingAnimal) {
      processingAnimal.remove();
    }

    const particleInterval = this.particleIntervals.get(0);
    if (particleInterval) {
      clearInterval(particleInterval);
      this.particleIntervals.delete(0);
    }

    const particles = slaughterHouse.querySelectorAll(".processing-particle");
    particles.forEach((particle) => particle.remove());

    const dropZoneText = slaughterHouse.querySelector(".drop-zone-text");
    if (dropZoneText) {
      dropZoneText.style.opacity = "1";
    }
  },

  createProcessingBurst(houseIndex) {
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
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

  createFlyingCoins(houseIndex, value) {
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    const moneyDisplay = document.getElementById("money");

    if (!slaughterHouse || !moneyDisplay) return;

    const slaughterRect = slaughterHouse.getBoundingClientRect();
    const moneyRect = moneyDisplay.getBoundingClientRect();

    const numCoins = Math.ceil(value / 10);
    const displayValue = `+${value}`;

    const moneyValue = document.createElement("div");
    moneyValue.className = "flying-money-value";
    moneyValue.textContent = displayValue;
    moneyValue.style.left = `${slaughterRect.left + slaughterRect.width / 2}px`;
    moneyValue.style.top = `${slaughterRect.top + slaughterRect.height / 2}px`;
    document.body.appendChild(moneyValue);

    setTimeout(() => {
      if (moneyValue.parentNode) {
        moneyValue.parentNode.removeChild(moneyValue);
      }
    }, 2000);

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

        const deltaX =
          moneyRect.left +
          moneyRect.width / 2 -
          (slaughterRect.left + slaughterRect.width / 2);
        const deltaY =
          moneyRect.top +
          moneyRect.height / 2 -
          (slaughterRect.top + slaughterRect.height / 2);

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

  updateSlaughterHouseTimers() {
    const house = gameState.slaughterHouses[0];
    if (house && house.currentAnimal) {
      house.timer -= 1;

      const progressBar = document.getElementById(`processingProgress0`);
      if (progressBar) {
        const progress =
          ((house.processTime - house.timer) / house.processTime) * 100;
        progressBar.style.width = `${progress}%`;
      }

      if (house.timer <= 0) {
        const animal = house.currentAnimal;
        gameState.money += animal.value;
        gameState.totalSlaughtered += 1;
        updateMoney();
        updateAutoMergeLevel();

        this.createProcessingBurst(0);
        this.createFlyingCoins(0, animal.value);
        this.clearProcessingAnimation(0);

        const progressBar = document.getElementById(`processingProgress0`);
        if (progressBar) {
          progressBar.style.width = "0%";
        }

        house.currentAnimal = null;
        this.processQueue(0);

        updateStatus(`Processed ${animal.type} for 💰${animal.value}!`);
      }
    }
  },

  updateSlaughterHouseQueue(index) {
    const house = gameState.slaughterHouses[0];
    const queueCount = document.getElementById(`queueCount0`);

    if (queueCount) {
      queueCount.textContent = house.queue.length;
    }
  },

  updateSlaughterHouseDisplay() {
    const container = document.getElementById("slaughterHouseContainer");
    if (!container) return;

    this.domCache.clear();
    this.cleanupEventListeners();
    this.cleanupAnimations();

    container.innerHTML = this.generateSlaughterHouseHTML();
    this.initializeSlaughterHouseEventListeners();
  },

  cleanupAnimations() {
    this.processingIntervals.forEach((interval) => clearInterval(interval));
    this.processingIntervals.clear();

    this.particleIntervals.forEach((interval) => clearInterval(interval));
    this.particleIntervals.clear();

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

  cleanupEventListeners() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  },

  initializeSlaughterHouseEventListeners() {
    // Only initialize if slaughter house is visible
    const shouldShowSlaughterHouse = gameState.createdAnimals.has("Mantis");
    if (!shouldShowSlaughterHouse) return;

    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    if (slaughterHouse) {
      this.domCache.set(`slaughterHouse0`, slaughterHouse);

      const dragOverHandler = (e) => {
        e.preventDefault();
        slaughterHouse.classList.add("drag-over");
      };
      const dragLeaveHandler = () => {
        slaughterHouse.classList.remove("drag-over");
      };
      const dropHandler = (e) => this.handleSlaughterDrop(e, 0);
      const touchEndHandler = (e) => this.handleSlaughterTouchEnd(e, 0);

      slaughterHouse.addEventListener("dragover", dragOverHandler);
      slaughterHouse.addEventListener("dragleave", dragLeaveHandler);
      slaughterHouse.addEventListener("drop", dropHandler);
      slaughterHouse.addEventListener("touchend", touchEndHandler);

      this.eventListeners.set(slaughterHouse, [
        { event: "dragover", handler: dragOverHandler },
        { event: "dragleave", handler: dragLeaveHandler },
        { event: "drop", handler: dropHandler },
        { event: "touchend", handler: touchEndHandler },
      ]);
    }

    const infoButton = document.getElementById(`slaughterInfo0`);
    if (infoButton) {
      const infoHandler = (e) => {
        e.stopPropagation();
        this.toggleMergedTooltip(0);
      };
      infoButton.addEventListener("click", infoHandler);

      this.eventListeners.set(infoButton, [
        { event: "click", handler: infoHandler },
      ]);
    }
  },

  handleSlaughterDrop(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    slaughterHouse.classList.remove("drag-over");

    if (!gameState.draggedCell) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];

    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
      this.addAnimalToQueue(0, type, i, j);
    } else {
      updateStatus(`${type} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove("drag-preview");
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  handleSlaughterTouchEnd(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse = document.getElementById(`slaughterHouse0`);
    slaughterHouse.classList.remove("drag-over");

    if (!gameState.draggedCell) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];

    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
      this.addAnimalToQueue(0, type, i, j);
    } else {
      updateStatus(`${type} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove("drag-preview");
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  toggleMergedTooltip(houseIndex) {
    const existingTooltip = document.getElementById("mergedSlaughterTooltip");
    if (existingTooltip) {
      this.hideMergedTooltip();
    } else {
      this.showMergedTooltip(0);
    }
  },

  showMergedTooltip(houseIndex) {
    const house = gameState.slaughterHouses[0];
    const infoButton = document.getElementById(`slaughterInfo0`);

    if (!infoButton) return;

    this.hideMergedTooltip();

    const tooltip = document.createElement("div");
    tooltip.id = "mergedSlaughterTooltip";
    tooltip.className = "merged-slaughter-tooltip";

    let tooltipContent = `
      <div class="tooltip-header">
        <div class="tooltip-title">
          <strong>Slaughter House</strong>
          <span class="tooltip-level">Level ${house.level}</span>
        </div>
      </div>
      <div class="tooltip-divider"></div>
      <div class="tooltip-content">
        <div class="tooltip-section-title">Processing Info:</div>
        <div class="tooltip-animal-row">
          <span class="animal-info">Process Time: ${house.processTime.toFixed(
            1
          )}s</span>
        </div>
        <div class="tooltip-animal-row">
          <span class="animal-info">Queue Capacity: 10 animals</span>
        </div>
        <div class="tooltip-divider"></div>
        <div class="tooltip-section-title">Animal Values:</div>
    `;

    let hasAnimals = false;
    for (const [type, { sellPrice }] of Object.entries(
      GAME_CONFIG.animalTypes
    )) {
      if (sellPrice > 0 && gameState.createdAnimals.has(type)) {
        tooltipContent += `
          <div class="tooltip-animal-row">
            <span class="animal-info"><img src="${GAME_CONFIG.animalImages[type]}" alt="${type}" class="inline-animal-icon" /> ${type}</span>
            <span class="animal-value">💰${sellPrice}</span>
          </div>
        `;
        hasAnimals = true;
      }
    }

    if (!hasAnimals) {
      tooltipContent += `<div class="tooltip-no-animals">No sellable animals created yet</div>`;
    }

    tooltipContent += `
      </div>
    `;

    tooltip.innerHTML = tooltipContent;
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

    this.tooltipCache = tooltip;

    setTimeout(() => {
      const clickOutsideHandler = (e) => {
        if (!tooltip.contains(e.target) && e.target !== infoButton) {
          this.hideMergedTooltip();
          document.removeEventListener("click", clickOutsideHandler);
        }
      };
      document.addEventListener("click", clickOutsideHandler);
    }, 100);
  },

  hideMergedTooltip() {
    const tooltip = document.getElementById("mergedSlaughterTooltip");
    if (tooltip) {
      tooltip.remove();
    }
    this.tooltipCache = null;
  },
};
