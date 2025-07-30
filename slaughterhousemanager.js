const slaughterHouseManager = {
  splatSoundPlayed: new Map(),

  generateSlaughterHouseHTML() {
    const shouldShowSlaughterHouse = gameState.createdAnimals.has("Mantis");

    if (!shouldShowSlaughterHouse) {
      return `<div id="slaughterHousePlaceholder" class="hidden"></div>`;
    }

    const house = gameState.slaughterHouses[0];
    const currentProcessTime = this.calculateSlaughterHouseProcessTime(
      house.level
    );
    const nextLevelRequirement = this.getSlaughterHouseNextLevelRequirement(
      house.level
    );

    return `
      <div class="slaughter-house-section">
        <div class="slaughter-house-header">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold text-red-800">🔪 Butcher Shop</h3>
            <span class="text-xs text-gray-600">Lv.${house.level}</span>
          </div>
          
          <div class="butcher-image-container">
            <img src="images/butcher.png" alt="Butcher" class="butcher-image" />
          </div>
          
          <div class="space-y-1 text-xs mb-2">
            <div class="flex justify-between">
              <span>Process Time:</span>
              <span class="font-mono">${currentProcessTime.toFixed(1)}s</span>
            </div>
            <div class="flex justify-between">
              <span>Queue:</span>
              <span id="queueCount0">${
                house.queue.length
              }</span>/<span id="queueMax0">${house.queueMax}</span>
            </div>
            <div id="slaughterHouseProgress" class="text-gray-500">${
              gameState.totalSlaughtered
            }/${nextLevelRequirement} animals slaughtered</div>
          </div>
          
          <div class="mb-2">
            <div class="coop-progress-bar h-1">
              <div id="slaughterHouseLevelBar" class="coop-progress-fill" style="width: 0%"></div>
            </div>
          </div>
        </div>
        
        <div id="slaughterHouse0" class="slaughter-house" data-house-index="0">
          <div class="drop-zone-text">Drop animals here to sell</div>
          <div id="processingProgress0" class="processing-progress" style="width: 0%"></div>
        </div>
      </div>
    `;
  },

  calculateSlaughterHouseProcessTime(level) {
    const baseTime = GAME_CONFIG.slaughterHouseConfig.baseProcessTime;
    const reductionFactor =
      GAME_CONFIG.slaughterHouseConfig.timeReductionFactor;
    const minimumTime = GAME_CONFIG.slaughterHouseConfig.minimumProcessTime;

    const calculatedTime = baseTime * Math.pow(reductionFactor, level - 1);
    return Math.max(calculatedTime, minimumTime);
  },

  calculateSlaughterHouseQueueMax(level) {
    return GAME_CONFIG.slaughterHouseConfig.baseQueueMax + (level - 1) * 2;
  },

  getSlaughterHouseNextLevelRequirement(currentLevel) {
    if (currentLevel < 12) {
      return (
        GAME_CONFIG.slaughterHouseConfig.slaughterRequirements[currentLevel] ||
        330
      );
    } else {
      let requirement = 330;
      let gap = 45;
      for (let i = 12; i < currentLevel; i++) {
        requirement += gap;
        gap += 10;
      }
      return requirement;
    }
  },

  updateSlaughterHouseLevel() {
    const house = gameState.slaughterHouses[0];
    if (!house) return;

    const currentLevel = house.level;
    const nextRequirement =
      this.getSlaughterHouseNextLevelRequirement(currentLevel);

    if (gameState.totalSlaughtered >= nextRequirement) {
      house.level += 1;
      house.processTime = this.calculateSlaughterHouseProcessTime(house.level);
      house.queueMax = this.calculateSlaughterHouseQueueMax(house.level);

      // Update UI elements
      const levelDisplay = document.querySelector(
        ".slaughter-house-section .text-xs.text-gray-600"
      );
      if (levelDisplay) {
        levelDisplay.textContent = `Lv.${house.level}`;
      }

      const processTimeDisplay = document.querySelector(
        ".slaughter-house-section .font-mono"
      );
      if (processTimeDisplay) {
        processTimeDisplay.textContent = `${house.processTime.toFixed(1)}s`;
      }

      const queueMaxDisplay = document.getElementById("queueMax0");
      if (queueMaxDisplay) {
        queueMaxDisplay.textContent = house.queueMax;
      }

      const newNextRequirement = this.getSlaughterHouseNextLevelRequirement(
        house.level
      );
      const progressElement = document.getElementById("slaughterHouseProgress");
      if (progressElement) {
        progressElement.textContent = `${gameState.totalSlaughtered}/${newNextRequirement} animals slaughtered`;
      }

      const levelBarElement = document.getElementById("slaughterHouseLevelBar");
      if (levelBarElement) {
        levelBarElement.style.width = "0%";
        levelBarElement.classList.remove("urgent");
      }

      eventManager.showAchievement(`🆙 Butcher Shop Level ${house.level}!`);
      audioManager.playSound("achievement-awarded");
      updateStatus(
        `Butcher shop leveled up! Faster processing and bigger queue! 🆙`
      );

      saveManager.saveOnAction();
    }

    // Update progress bar
    const levelBarElement = document.getElementById("slaughterHouseLevelBar");
    if (levelBarElement) {
      const progress = (gameState.totalSlaughtered / nextRequirement) * 100;
      levelBarElement.style.width = `${Math.min(progress, 100)}%`;

      if (progress >= 90) {
        levelBarElement.classList.add("urgent");
      } else {
        levelBarElement.classList.remove("urgent");
      }
    }
  },

  updateVisibility() {
    const container = document.getElementById("slaughterHouseContainer");
    if (!container) return;

    const shouldShowSlaughterHouse = gameState.createdAnimals.has("Mantis");
    const currentlyVisible = !container.querySelector(
      "#slaughterHousePlaceholder"
    );

    if (shouldShowSlaughterHouse !== currentlyVisible) {
      this.updateSlaughterHouseDisplay();
    }
  },

  initializeSlaughterHouses() {
    gameState.slaughterHouses = [
      {
        level: 1,
        processTime: GAME_CONFIG.slaughterHouseConfig.baseProcessTime,
        timer: 0,
        queue: [],
        currentAnimal: null,
        queueMax: GAME_CONFIG.slaughterHouseConfig.baseQueueMax,
      },
    ];
  },

  addAnimalToQueue(houseIndex, animalType, gridI, gridJ) {
    const house = gameState.slaughterHouses[0];
    if (house.queue.length >= house.queueMax) {
      audioManager.playSound("invalid-action");
      updateStatus("Slaughter house queue is full! 😕");
      return false;
    }

    const animalConfig = GAME_CONFIG.animalTypes[animalType];
    house.queue.push({
      type: animalType,
      gridI,
      gridJ,
      value: animalConfig.sellPrice,
    });

    gameState.grid[gridI][gridJ] = null;
    gridManager.updateCell(gridI, gridJ);
    updateMergeablePairs();

    this.updateSlaughterHouseQueue(0);
    this.processQueue(0);

    updateStatus(`Added ${animalConfig.name} to slaughter queue!`);
    return true;
  },

  processQueue(houseIndex) {
    const house = gameState.slaughterHouses[0];

    if (!house.currentAnimal && house.queue.length > 0) {
      house.currentAnimal = house.queue.shift();
      house.timer = house.processTime;
      this.splatSoundPlayed.set(0, false);
      this.updateSlaughterHouseQueue(0);
      this.startProcessingAnimation(0);
    }
  },

  startProcessingAnimation(houseIndex) {
    const house = gameState.slaughterHouses[0];
    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (!slaughterHouse || !house.currentAnimal) return;

    audioManager.playSound("butcher-shop");

    this.clearProcessingAnimation(0);

    const processingAnimal = utilityManager.createElement(
      "div",
      "processing-animal",
      `
      <img src="${GAME_CONFIG.animalImages[house.currentAnimal.type]}" alt="${
        house.currentAnimal.type
      }" class="processing-animal-image" />
    `
    );
    processingAnimal.id = `processingAnimal0`;
    slaughterHouse.appendChild(processingAnimal);

    this.startProcessingParticles(0);

    const dropZoneText = slaughterHouse.querySelector(".drop-zone-text");
    if (dropZoneText) {
      dropZoneText.style.opacity = "0";
    }
  },

  startProcessingParticles(houseIndex) {
    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (!slaughterHouse) return;

    utilityManager.removeElementsByClass("processing-particle");

    utilityManager.setInterval(
      () => {
        const house = gameState.slaughterHouses[0];
        if (!house.currentAnimal) {
          utilityManager.clearInterval("processingParticles");
          return;
        }

        for (let i = 0; i < utilityManager.randomBetween(3, 6); i++) {
          const particle = utilityManager.createElement(
            "div",
            "processing-particle"
          );
          particle.style.left = `${utilityManager.randomBetween(10, 90)}%`;
          particle.style.top = `${utilityManager.randomBetween(10, 90)}%`;
          particle.style.animationDelay = `${utilityManager.randomBetween(
            0,
            0.5
          )}s`;
          slaughterHouse.appendChild(particle);

          utilityManager.setTimeout(
            () => {
              if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
              }
            },
            1000,
            `particle_${Date.now()}_${i}`
          );
        }
      },
      200,
      "processingParticles"
    );
  },

  clearProcessingAnimation(houseIndex) {
    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (!slaughterHouse) return;

    const processingAnimal = document.getElementById("processingAnimal0");
    if (processingAnimal) {
      processingAnimal.remove();
    }

    utilityManager.clearInterval("processingParticles");

    utilityManager.removeElementsByClass("processing-particle");

    const dropZoneText = slaughterHouse.querySelector(".drop-zone-text");
    if (dropZoneText) {
      dropZoneText.style.opacity = "1";
    }
  },

  createProcessingBurst(houseIndex) {
    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (!slaughterHouse) return;

    const burst = utilityManager.createElement("div", "processing-burst", "💥");
    slaughterHouse.appendChild(burst);

    utilityManager.setTimeout(
      () => {
        if (burst.parentNode) {
          burst.parentNode.removeChild(burst);
        }
      },
      800,
      "processingBurst"
    );
  },

  createFlyingCoins(houseIndex, value) {
    const slaughterHouse = document.getElementById("slaughterHouse0");
    const moneyDisplay = document.getElementById("money");

    if (!slaughterHouse || !moneyDisplay) return;

    const slaughterRect = slaughterHouse.getBoundingClientRect();
    const moneyRect = moneyDisplay.getBoundingClientRect();

    const maxCoins = Math.min(
      Math.ceil(value / 10),
      GAME_CONFIG.animationConfig.maxParticles
    );
    const displayValue = `+${value}`;

    const moneyValue = utilityManager.createElement(
      "div",
      "flying-money-value",
      displayValue
    );
    moneyValue.style.left = `${slaughterRect.left + slaughterRect.width / 2}px`;
    moneyValue.style.top = `${slaughterRect.top + slaughterRect.height / 2}px`;
    document.body.appendChild(moneyValue);

    utilityManager.setTimeout(
      () => {
        if (moneyValue.parentNode) {
          moneyValue.parentNode.removeChild(moneyValue);
        }
      },
      2000,
      "flyingMoneyValue"
    );

    for (let i = 0; i < maxCoins; i++) {
      utilityManager.setTimeout(
        () => {
          const coin = utilityManager.createElement("div", "flying-coin");
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
        },
        i * 50,
        `flyingCoin_${i}`
      );
    }
  },

  updateSlaughterHouseTimers() {
    const house = gameState.slaughterHouses[0];
    if (house && house.currentAnimal) {
      house.timer -= 1;

      const progressBar = document.getElementById("processingProgress0");
      if (progressBar) {
        const progress =
          ((house.processTime - house.timer) / house.processTime) * 100;
        progressBar.style.width = `${progress}%`;

        if (progress >= 90 && !this.splatSoundPlayed.get(0)) {
          audioManager.playRandomSound("butcher-done");
          this.splatSoundPlayed.set(0, true);
        }
      }

      if (house.timer <= 0) {
        const animal = house.currentAnimal;
        gameState.money += animal.value;
        gameState.totalSlaughtered += 1;

        audioManager.playSound("earn-money");

        updateMoney();
        this.updateSlaughterHouseLevel();
        saveManager.saveOnAction();

        achievementManager.checkAchievements();

        this.createProcessingBurst(0);
        this.createFlyingCoins(0, animal.value);
        this.clearProcessingAnimation(0);

        const progressBar = document.getElementById("processingProgress0");
        if (progressBar) {
          progressBar.style.width = "0%";
        }

        house.currentAnimal = null;
        this.processQueue(0);

        const animalConfig = GAME_CONFIG.animalTypes[animal.type];
        updateStatus(`Processed ${animalConfig.name} for 💰${animal.value}!`);
      }
    }

    // Update slaughter house progress display
    this.updateSlaughterHouseProgressDisplay();
  },

  updateSlaughterHouseProgressDisplay() {
    const house = gameState.slaughterHouses[0];
    if (!house) return;

    const nextRequirement = this.getSlaughterHouseNextLevelRequirement(
      house.level
    );
    const progressElement = document.getElementById("slaughterHouseProgress");
    if (progressElement) {
      progressElement.textContent = `${gameState.totalSlaughtered}/${nextRequirement} animals slaughtered`;
    }

    const levelBarElement = document.getElementById("slaughterHouseLevelBar");
    if (levelBarElement) {
      const progress = (gameState.totalSlaughtered / nextRequirement) * 100;
      levelBarElement.style.width = `${Math.min(progress, 100)}%`;

      if (progress >= 90) {
        levelBarElement.classList.add("urgent");
      } else {
        levelBarElement.classList.remove("urgent");
      }
    }
  },

  updateSlaughterHouseQueue(index) {
    const house = gameState.slaughterHouses[0];
    const queueCount = document.getElementById("queueCount0");

    if (queueCount) {
      queueCount.textContent = house.queue.length;
    }
  },

  updateSlaughterHouseDisplay() {
    const container = document.getElementById("slaughterHouseContainer");
    if (!container) return;

    utilityManager.removeEventListeners("slaughterHouse");
    this.clearProcessingAnimation(0);

    container.innerHTML = this.generateSlaughterHouseHTML();
    this.initializeSlaughterHouseEventListeners();
  },

  initializeSlaughterHouseEventListeners() {
    const shouldShowSlaughterHouse = gameState.createdAnimals.has("Mantis");
    if (!shouldShowSlaughterHouse) return;

    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (slaughterHouse) {
      const dragOverHandler = (e) => {
        e.preventDefault();
        slaughterHouse.classList.add("drag-over");
      };
      const dragLeaveHandler = () => {
        slaughterHouse.classList.remove("drag-over");
      };
      const dropHandler = (e) => this.handleSlaughterDrop(e, 0);
      const touchEndHandler = (e) => this.handleSlaughterTouchEnd(e, 0);

      utilityManager.addEventListener(
        slaughterHouse,
        "dragover",
        dragOverHandler,
        "slaughterHouseDragOver"
      );
      utilityManager.addEventListener(
        slaughterHouse,
        "dragleave",
        dragLeaveHandler,
        "slaughterHouseDragLeave"
      );
      utilityManager.addEventListener(
        slaughterHouse,
        "drop",
        dropHandler,
        "slaughterHouseDrop"
      );
      utilityManager.addEventListener(
        slaughterHouse,
        "touchend",
        touchEndHandler,
        "slaughterHouseTouchEnd"
      );
    }

    const slaughterSection = document.querySelector(".slaughter-house-section");
    if (slaughterSection) {
      const sectionDragOverHandler = (e) => {
        e.preventDefault();
        const slaughterHouse = document.getElementById("slaughterHouse0");
        if (slaughterHouse) {
          slaughterHouse.classList.add("drag-over");
        }
      };
      const sectionDragLeaveHandler = (e) => {
        if (!slaughterSection.contains(e.relatedTarget)) {
          const slaughterHouse = document.getElementById("slaughterHouse0");
          if (slaughterHouse) {
            slaughterHouse.classList.remove("drag-over");
          }
        }
      };
      const sectionDropHandler = (e) => this.handleSlaughterDrop(e, 0);
      const sectionTouchEndHandler = (e) => this.handleSlaughterTouchEnd(e, 0);

      utilityManager.addEventListener(
        slaughterSection,
        "dragover",
        sectionDragOverHandler,
        "slaughterSectionDragOver"
      );
      utilityManager.addEventListener(
        slaughterSection,
        "dragleave",
        sectionDragLeaveHandler,
        "slaughterSectionDragLeave"
      );
      utilityManager.addEventListener(
        slaughterSection,
        "drop",
        sectionDropHandler,
        "slaughterSectionDrop"
      );
      utilityManager.addEventListener(
        slaughterSection,
        "touchend",
        sectionTouchEndHandler,
        "slaughterSectionTouchEnd"
      );
    }
  },

  handleSlaughterDrop(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (slaughterHouse) {
      slaughterHouse.classList.remove("drag-over");
    }

    if (!gameState.draggedCell) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[type];

    if (animalConfig.sellPrice > 0) {
      this.addAnimalToQueue(0, type, i, j);
    } else {
      audioManager.playSound("invalid-action");
      updateStatus(`${animalConfig.name} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    if (sourceCell) {
      sourceCell.classList.remove("drag-preview");
    }
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },

  handleSlaughterTouchEnd(e, houseIndex) {
    e.preventDefault();
    const slaughterHouse = document.getElementById("slaughterHouse0");
    if (slaughterHouse) {
      slaughterHouse.classList.remove("drag-over");
    }

    if (!gameState.draggedCell) return;

    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];
    const animalConfig = GAME_CONFIG.animalTypes[type];

    if (animalConfig.sellPrice > 0) {
      this.addAnimalToQueue(0, type, i, j);
    } else {
      audioManager.playSound("invalid-action");
      updateStatus(`${animalConfig.name} cannot be sold! 😕`);
    }

    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    if (sourceCell) {
      sourceCell.classList.remove("drag-preview");
    }
    gridManager.clearValidTargets();
    gameState.draggedCell = null;
  },
};
