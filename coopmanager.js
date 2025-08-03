const coopManager = {
  unlockedCoops: new Set(),

  initializeCoopStates() {
    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
      const coopKey = `${animalType}Coop`;
      if (!gameState[coopKey]) {
        gameState[coopKey] = {
          owned: false,
          level: 1,
          baseTime: config.baseTime,
          timer: config.baseTime,
          stored: 0,
          eggsMerged: 0,
          autoPlacement: true,
        };
      }

      // Ensure autoPlacement property exists for existing saves
      if (
        gameState[coopKey] &&
        gameState[coopKey].autoPlacement === undefined
      ) {
        gameState[coopKey].autoPlacement = true;
      }
    });
  },

  generateBuyAnimalButtons() {
    const purchaseEntries = Object.entries(
      GAME_CONFIG.purchaseConfig
    ).reverse();

    return purchaseEntries
      .map(([animalType, config]) => {
        // Check if animal is available in current level
        if (!isAnimalAvailableInLevel(animalType)) {
          return ""; // Don't show button if not available in level
        }

        const animalConfig = GAME_CONFIG.animalTypes[animalType];
        const imageSrc = GAME_CONFIG.animalImages[animalType];
        const costText = config.cost === 0 ? "Free" : `${config.cost}`;
        const hiddenClass = config.unlocked ? "" : "hidden";

        let animationClass = "";
        if (
          animalType === "Egg" &&
          config.cost === 0 &&
          !gameState.eggButtonClicked
        ) {
          animationClass = "egg-button-pulse";
        }

        return utilityManager.generateButtonHTML(
          `buy${animalType}`,
          `egg-buy-button enhanced-button buy-button w-full px-4 py-3 rounded-xl shadow-lg font-bold text-white ${hiddenClass} ${animationClass}`,
          `${animalConfig.name} (${costText})`,
          imageSrc
        );
      })
      .join("");
  },

  generateCoopHTML() {
    let html = "";

    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
      // Check if coop is available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return; // Skip this coop if not available in level
      }

      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      const producedType = config.producesType;
      const producedImage = GAME_CONFIG.animalImages[producedType];
      const producedConfig = GAME_CONFIG.animalTypes[producedType];
      const coopState = gameState[`${animalType}Coop`] || {
        level: 1,
        stored: 0,
        owned: false,
        eggsMerged: 0,
        autoPlacement: true,
      };

      const unpurchasedClass = coopState.owned ? "hidden" : "";
      const purchasedClass = coopState.owned ? "" : "hidden";

      const currentTime = this.calculateCoopProductionTime(
        animalType,
        coopState.level
      );
      const nextLevelRequirement = this.getCoopNextLevelRequirement(
        coopState.level
      );

      const hasAutoPlacement = coopState.level >= config.autoPlacementLevel;
      const autoPlacementToggleClass = hasAutoPlacement ? "" : "hidden";
      const autoPlacementText = coopState.autoPlacement
        ? "🔵 Auto-Place ON"
        : "🔴 Auto-Place OFF";
      const autoPlacementButtonClass = coopState.autoPlacement
        ? "bg-green-500"
        : "bg-red-500";

      html += `
        <div id="${animalType}Coop" class="compact-coop hidden">
          <div class="coop-header">
            <div class="flex justify-between items-center">
              <h3 class="coop-title">${animalName} Coop</h3>
              <span class="text-xs text-gray-600">Lv.${coopState.level}</span>
            </div>
          </div>
          
          <div class="text-center">
            <button id="place${producedType}" class="coop-egg-button hidden" style="background: none; border: none; cursor: pointer; padding: 0;">
              <img src="${producedImage}" alt="${producedType}" style="width: 60px; height: 60px; object-fit: contain; margin: 0 auto; border-radius: 8px; transition: transform 0.2s ease;" />
            </button>
          </div>
          
          <div id="${animalType}CoopUnpurchased" class="coop-unpurchased ${unpurchasedClass}">
            <button id="buy${animalName}Coop" class="enhanced-button buy-button coop-buy-btn">
              <i class="fas fa-home mr-1"></i>(${config.buyCost})
            </button>
          </div>

          <div id="${animalType}CoopPurchased" class="coop-purchased ${purchasedClass}">
            <div class="coop-stats">
              <div class="space-y-1 text-xs">
                <div class="flex justify-between">
                  <span>Interval:</span>
                  <span id="${animalType}CoopTimer" class="font-mono">${currentTime.toFixed(
        1
      )}s</span>
                </div>
                <div id="${animalType}CoopProgress" class="text-gray-500">${
        coopState.eggsMerged
      }/${nextLevelRequirement} ${producedConfig.name}s merged</div>
              </div>
              
              <div id="${animalType}CoopLevelContainer" class="">
                <div class="coop-progress-bar h-1">
                  <div id="${animalType}CoopLevelBar" class="coop-progress-fill" style="width: 0%"></div>
                </div>
              </div>

              <div class="coop-next-level">
                <div class="coop-progress-container">
                  <div class="coop-progress-label">Next ${
                    producedConfig.name
                  }</div>
                  <div class="coop-progress-bar">
                    <div id="${animalType}CoopProductionProgress" class="coop-progress-fill" style="width: 0%"></div>
                  </div>
                </div>
                
                <div class="coop-stored-display">
                  <span id="${animalType}CoopStored">Stored: ${
        coopState.stored
      }</span>
                </div>
                
                <div class="coop-auto-placement ${autoPlacementToggleClass}">
                  <button id="${animalType}AutoPlacementToggle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${autoPlacementButtonClass}">
                    ${autoPlacementText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    return html;
  },

  updatePanelVisibility() {
    this.updateCoopVisibility();
    this.updateEmptyMessageVisibility();
  },

  initializeFarmBuildingEventListeners() {
    Object.entries(GAME_CONFIG.purchaseConfig).forEach(
      ([animalType, config]) => {
        // Skip if animal not available in current level
        if (!isAnimalAvailableInLevel(animalType)) {
          return;
        }

        const buyButton = document.getElementById(`buy${animalType}`);

        if (buyButton) {
          const buttonId = `buy${animalType}`;

          if (config.cost === 0) {
            utilityManager.addEventListener(
              buyButton,
              "click",
              () => {
                audioManager.playSound("button-click");

                if (animalType === "Egg" && !gameState.eggButtonClicked) {
                  gameState.eggButtonClicked = true;
                  eventManager.stopInitialEggButtonAnimation();
                  this.updateBuyAnimalButtons();
                }

                placeAnimal(animalType);
              },
              `${buttonId}Click`
            );
          } else {
            utilityManager.addEventListener(
              buyButton,
              "click",
              () => {
                audioManager.playSound("button-click");
                buyAnimal(animalType, config.cost);
              },
              `${buttonId}Click`
            );
          }
        }
      }
    );

    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
      // Skip if coop not available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return;
      }

      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      const producedType = config.producesType;

      const buyButton = document.getElementById(`buy${animalName}Coop`);
      if (buyButton) {
        utilityManager.addEventListener(
          buyButton,
          "mouseenter",
          () => {
            audioManager.playSound("button-hover");
          },
          `buy${animalName}CoopHover`
        );

        utilityManager.addEventListener(
          buyButton,
          "click",
          () => {
            audioManager.playSound("button-click");
            this.buyCoop(animalType);
          },
          `buy${animalName}CoopClick`
        );
      }

      const placeButton = document.getElementById(`place${producedType}`);
      if (placeButton) {
        utilityManager.addEventListener(
          placeButton,
          "click",
          () => {
            audioManager.playSound("button-click");
            this.placeStoredAnimal(animalType, producedType);
          },
          `place${producedType}Click`
        );
      }

      const autoPlacementButton = document.getElementById(
        `${animalType}AutoPlacementToggle`
      );
      if (autoPlacementButton) {
        utilityManager.addEventListener(
          autoPlacementButton,
          "mouseenter",
          () => {
            audioManager.playSound("button-hover");
          },
          `${animalType}AutoPlacementHover`
        );

        utilityManager.addEventListener(
          autoPlacementButton,
          "click",
          () => {
            audioManager.playSound("button-click");
            this.toggleAutoPlacement(animalType);
          },
          `${animalType}AutoPlacementClick`
        );
      }
    });
  },

  updateBuyAnimalButtons() {
    Object.entries(GAME_CONFIG.purchaseConfig).forEach(
      ([animalType, config]) => {
        const button = document.getElementById(`buy${animalType}`);

        if (button) {
          // Check level availability and unlock status
          const availableInLevel = isAnimalAvailableInLevel(animalType);

          if (config.unlocked && availableInLevel) {
            button.classList.remove("hidden");
          } else {
            button.classList.add("hidden");
          }

          if (animalType === "Egg" && gameState.eggButtonClicked) {
            button.classList.remove("egg-button-pulse");
          }
        }
      }
    );
  },

  buyCoop(animalType) {
    // Check if coop is available in current level
    if (!isCoopAvailableInLevel(animalType)) {
      audioManager.playSound("invalid-action");
      updateStatus("This coop is not available in the current level! 🚫");
      return;
    }

    const config = GAME_CONFIG.coopConfig[animalType];
    const cost = config.buyCost;
    const animalName = animalType.charAt(0).toUpperCase() + animalType.slice(1);
    const producedType = config.producesType;

    if (gameState.money >= cost) {
      gameState[`${animalType}Coop`].owned = true;
      gameState.money -= cost;

      audioManager.playSound("coop-bought");

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

      // Only unlock the purchase config if the animal is available in this level
      if (
        GAME_CONFIG.purchaseConfig[producedType] &&
        isAnimalAvailableInLevel(producedType)
      ) {
        GAME_CONFIG.purchaseConfig[producedType].unlocked = true;
        this.updateBuyAnimalButtons();
      }

      updateMoney();
      this.updateEmptyMessageVisibility();
      eventManager.showAchievement(`🏡 ${animalName} Coop Purchased!`);
      updateStatus(`Bought ${animalType} coop 🏡`);
      saveManager.saveOnAction();

      achievementManager.checkAchievements();
      audioManager.updateBackgroundMusic();
    } else {
      audioManager.playSound("invalid-action");
      updateStatus(`Not enough money for ${animalType} coop! 😕`);
      utilityManager.addScreenShake();
    }
  },

  toggleAutoPlacement(animalType) {
    const coop = gameState[`${animalType}Coop`];
    if (!coop) return;

    coop.autoPlacement = !coop.autoPlacement;

    const button = document.getElementById(`${animalType}AutoPlacementToggle`);
    if (button) {
      if (coop.autoPlacement) {
        button.textContent = "🔵 Auto-Place ON";
        button.classList.remove("bg-red-500");
        button.classList.add("bg-green-500");
      } else {
        button.textContent = "🔴 Auto-Place OFF";
        button.classList.remove("bg-green-500");
        button.classList.add("bg-red-500");
      }
    }

    updateStatus(
      `Auto-placement ${
        coop.autoPlacement ? "enabled" : "disabled"
      } for ${animalType} coop`
    );
    saveManager.saveOnAction();
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
      saveManager.saveOnAction();
    } else {
      audioManager.playSound("invalid-action");
      updateStatus("Grid is full! 😕");
    }
  },

  tryAutoPlaceEgg(animalType, producedType) {
    const coop = gameState[`${animalType}Coop`];
    const config = GAME_CONFIG.coopConfig[animalType];

    if (!coop || !coop.owned || !coop.autoPlacement) return false;
    if (coop.level < config.autoPlacementLevel) return false;
    if (coop.stored === 0) return false;

    // Try to place the egg automatically
    if (placeAnimal(producedType)) {
      coop.stored -= 1;
      document.getElementById(
        `${animalType}CoopStored`
      ).textContent = `Stored: ${coop.stored}`;

      this.updatePlaceButtonStates();
      saveManager.saveOnAction();
      return true;
    }

    return false;
  },

  updateCoopVisibility() {
    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType]) => {
      // Skip if coop not available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return;
      }

      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);

      // Only show coop if the animal has been created AND it's valid for the current level
      if (
        gameState.createdAnimals.has(animalName) &&
        validateAnimalForLevel(animalName)
      ) {
        const coopElement = document.getElementById(`${animalType}Coop`);

        if (coopElement && coopElement.classList.contains("hidden")) {
          coopElement.classList.remove("hidden");
          coopElement.classList.add("bounce-in");
          this.unlockedCoops.add(animalType);
        }
      }
    });
  },

  updateEmptyMessageVisibility() {
    const emptyMessage = document.getElementById("emptyFarmMessage");
    if (!emptyMessage) return;

    let hasVisibleCoops = false;
    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType]) => {
      // Skip if coop not available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return;
      }

      const animalName =
        animalType.charAt(0).toUpperCase() + animalType.slice(1);
      if (gameState.createdAnimals.has(animalName)) {
        hasVisibleCoops = true;
      }
    });

    if (hasVisibleCoops) {
      emptyMessage.classList.add("hidden");
    } else {
      emptyMessage.classList.remove("hidden");
    }
  },

  updatePlaceButtonStates() {
    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
      // Skip if coop not available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return;
      }

      const producedType = config.producesType;
      const placeButton = document.getElementById(`place${producedType}`);
      const coop = gameState[`${animalType}Coop`];

      if (placeButton && coop && coop.owned) {
        placeButton.disabled = isGridFull() || coop.stored === 0;

        // Only show manual place button if auto-placement is off or level is too low
        const hasAutoPlacement =
          coop.level >= config.autoPlacementLevel && coop.autoPlacement;

        if (coop.stored > 0 && !isGridFull() && !hasAutoPlacement) {
          placeButton.classList.remove("hidden");
          placeButton.classList.add("pulse");

          const eggImage = placeButton.querySelector("img");
          if (eggImage) {
            eggImage.style.transform = "scale(1.1)";
          }
        } else {
          placeButton.classList.remove("pulse");

          const eggImage = placeButton.querySelector("img");
          if (eggImage) {
            eggImage.style.transform = "scale(1)";
          }

          if (coop.stored === 0 || hasAutoPlacement) {
            placeButton.classList.add("hidden");
          }
        }
      }
    });
  },

  checkForNewUnlocks(newAnimalType) {
    const lowerAnimalType = newAnimalType.toLowerCase();

    // Only unlock coops that are both configured and available in the current level
    if (
      GAME_CONFIG.coopConfig[lowerAnimalType] &&
      isCoopAvailableInLevel(lowerAnimalType) &&
      validateAnimalForLevel(newAnimalType)
    ) {
      if (!this.unlockedCoops.has(lowerAnimalType)) {
        this.updateCoopVisibility();
        const animalConfig = GAME_CONFIG.animalTypes[newAnimalType];
        eventManager.showAchievement(`🏡 ${animalConfig.name} Coop Unlocked!`);
      }
    }
  },

  getCoopNextLevelRequirement(currentLevel) {
    let requirement = 5;
    let gap = 5;

    for (let level = 1; level < currentLevel; level++) {
      requirement += gap;
      gap += 5;
    }

    return requirement;
  },

  calculateCoopProductionTime(animalType, level) {
    const config = GAME_CONFIG.coopConfig[animalType];
    return config.baseTime * Math.pow(0.9, level - 1);
  },

  checkCoopLevelUp(eggType) {
    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
      // Skip if coop not available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return;
      }

      if (config.producesType === eggType) {
        const coop = gameState[`${animalType}Coop`];
        if (coop && coop.owned) {
          const oldLevel = coop.level;
          coop.eggsMerged += 1;

          const nextLevelRequirement = this.getCoopNextLevelRequirement(
            coop.level
          );

          const progressElement = document.getElementById(
            `${animalType}CoopProgress`
          );
          const levelBarElement = document.getElementById(
            `${animalType}CoopLevelBar`
          );
          const producedConfig = GAME_CONFIG.animalTypes[config.producesType];

          if (progressElement) {
            progressElement.textContent = `${coop.eggsMerged}/${nextLevelRequirement} ${producedConfig.name}s merged`;
          }

          if (levelBarElement) {
            const progress = (coop.eggsMerged / nextLevelRequirement) * 100;
            levelBarElement.style.width = `${Math.min(progress, 100)}%`;

            if (progress >= 90) {
              levelBarElement.classList.add("urgent");
            } else {
              levelBarElement.classList.remove("urgent");
            }
          }

          if (coop.eggsMerged >= nextLevelRequirement) {
            coop.level += 1;
            coop.eggsMerged = 0;

            const newTime = this.calculateCoopProductionTime(
              animalType,
              coop.level
            );
            coop.timer = Math.min(coop.timer, newTime);

            const levelDisplay = document.querySelector(
              `#${animalType}Coop .text-xs.text-gray-600`
            );
            const timerDisplay = document.getElementById(
              `${animalType}CoopTimer`
            );

            if (levelDisplay) {
              levelDisplay.textContent = `Lv.${coop.level}`;
            }

            if (timerDisplay) {
              timerDisplay.textContent = `${newTime.toFixed(1)}s`;
            }

            const newNextRequirement = this.getCoopNextLevelRequirement(
              coop.level
            );
            if (progressElement) {
              progressElement.textContent = `${coop.eggsMerged}/${newNextRequirement} ${producedConfig.name}s merged`;
            }

            if (levelBarElement) {
              levelBarElement.style.width = "0%";
              levelBarElement.classList.remove("urgent");
            }

            // Show/hide auto-placement toggle when reaching level 6
            if (coop.level === config.autoPlacementLevel) {
              const autoPlacementToggle = document.querySelector(
                `#${animalType}Coop .coop-auto-placement`
              );
              if (autoPlacementToggle) {
                autoPlacementToggle.classList.remove("hidden");
                eventManager.showAchievement(
                  `🤖 Auto-Placement Unlocked for ${
                    animalType.charAt(0).toUpperCase() + animalType.slice(1)
                  } Coop!`
                );
              }
            }

            eventManager.showAchievement(
              `🆙 ${
                animalType.charAt(0).toUpperCase() + animalType.slice(1)
              } Coop Level ${coop.level}!`
            );
            audioManager.playSound("achievement-awarded");
            updateStatus(
              `${
                animalType.charAt(0).toUpperCase() + animalType.slice(1)
              } coop leveled up! Production 10% faster! 🆙`
            );
          }

          saveManager.saveOnAction();
        }
      }
    });
  },

  updateCoopTimers() {
    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
      // Skip if coop not available in current level
      if (!isCoopAvailableInLevel(animalType)) {
        return;
      }

      const coop = gameState[`${animalType}Coop`];
      const producedType = config.producesType;

      if (coop.owned) {
        coop.timer -= 1;

        const progressElement = document.getElementById(
          `${animalType}CoopProductionProgress`
        );
        if (progressElement) {
          const maxTime = this.calculateCoopProductionTime(
            animalType,
            coop.level
          );
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

          // Try auto-placement first if enabled and level 6+
          if (!this.tryAutoPlaceEgg(animalType, producedType)) {
            // If auto-placement failed or disabled, show manual button
            const placeButton = document.getElementById(`place${producedType}`);
            if (placeButton) {
              placeButton.classList.remove("hidden");
              placeButton.classList.add("pulse");
              if (!isGridFull()) {
                placeButton.disabled = false;
              }
            }
          }

          coop.timer = this.calculateCoopProductionTime(animalType, coop.level);

          const progressElement = document.getElementById(
            `${animalType}CoopProductionProgress`
          );
          if (progressElement) {
            progressElement.style.width = "0%";
            progressElement.classList.remove("urgent");
          }

          saveManager.saveOnAction();
        }
      }
    });
  },

  buyAutoMerge() {
    if (gameState.money >= GAME_CONFIG.autoMergeConfig.buyCost) {
      gameState.autoMerge.owned = true;
      gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
      gameState.money -= GAME_CONFIG.autoMergeConfig.buyCost;

      audioManager.playSound("coop-bought");

      document.getElementById("buyAutoMerge").classList.add("hidden");
      document.getElementById("autoMergeToggle").classList.remove("hidden");
      document
        .getElementById("autoMergeProgressContainer")
        .classList.remove("hidden");

      this.updateShuffleButtonState();

      updateMoney();
      eventManager.showAchievement("⚙️ Auto-Merge Activated!");
      updateStatus("Bought Auto-Merge ⚙️");
      saveManager.saveOnAction();

      achievementManager.checkAchievements();
    } else {
      audioManager.playSound("invalid-action");
      updateStatus("Not enough money for Auto-Merge! 😕");
      utilityManager.addScreenShake();
    }
  },

  updateShuffleButtonState() {
    const shuffleButton = document.getElementById("buyShuffle");
    const shuffleButtonText = document.getElementById("shuffleButtonText");

    if (shuffleButton && shuffleButtonText) {
      if (!gameState.autoMerge.owned) {
        shuffleButton.disabled = true;
        shuffleButton.style.opacity = "0.5";
        shuffleButton.style.cursor = "not-allowed";
        shuffleButtonText.textContent = "Requires Auto-Merge";
        shuffleButton.title = "Purchase Auto-Merge first to unlock Shuffle";
      } else {
        shuffleButton.disabled = false;
        shuffleButton.style.opacity = "1";
        shuffleButton.style.cursor = "pointer";
        shuffleButtonText.textContent = "Buy ($50)";
        shuffleButton.title = "";
      }
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
    saveManager.saveOnAction();
  },

  buyShuffle() {
    if (!gameState.autoMerge.owned) {
      audioManager.playSound("invalid-action");
      updateStatus("You need Auto-Merge first! 😕");
      utilityManager.addScreenShake();
      return;
    }

    if (gameState.money >= GAME_CONFIG.shuffleConfig.buyCost) {
      gameState.shuffle.owned = true;
      gameState.money -= GAME_CONFIG.shuffleConfig.buyCost;

      audioManager.playSound("coop-bought");

      document.getElementById("buyShuffle").classList.add("hidden");
      document.getElementById("shuffleToggle").classList.remove("hidden");
      updateMoney();
      eventManager.showAchievement("🔀 Shuffle Activated!");
      updateStatus("Bought Shuffle 🔀");
      saveManager.saveOnAction();
    } else {
      audioManager.playSound("invalid-action");
      updateStatus("Not enough money for Shuffle! 😕");
      utilityManager.addScreenShake();
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
    saveManager.saveOnAction();
  },

  buyAutoButcher() {
    if (gameState.money >= GAME_CONFIG.autoButcherConfig.buyCost) {
      gameState.autoButcher.owned = true;
      gameState.autoButcher.timer = GAME_CONFIG.autoButcherConfig.checkInterval;
      gameState.money -= GAME_CONFIG.autoButcherConfig.buyCost;

      audioManager.playSound("coop-bought");

      document.getElementById("buyAutoButcher").classList.add("hidden");
      document.getElementById("autoButcherToggle").classList.remove("hidden");
      updateMoney();
      eventManager.showAchievement("🔪 Auto-Butcher Activated!");
      updateStatus("Bought Auto-Butcher 🔪");
      saveManager.saveOnAction();
    } else {
      audioManager.playSound("invalid-action");
      updateStatus("Not enough money for Auto-Butcher! 😕");
      utilityManager.addScreenShake();
    }
  },

  toggleAutoButcher() {
    gameState.autoButcher.enabled = !gameState.autoButcher.enabled;
    const button = document.getElementById("autoButcherToggle");
    if (gameState.autoButcher.enabled) {
      button.textContent = "🔵 ON";
      button.classList.remove("bg-red-500");
      button.classList.add("bg-green-500");
    } else {
      button.textContent = "🔴 OFF";
      button.classList.remove("bg-green-500");
      button.classList.add("bg-red-500");
    }
    updateStatus(
      `Auto-Butcher ${gameState.autoButcher.enabled ? "enabled" : "disabled"}`
    );
    saveManager.saveOnAction();
  },

  findLowestValueAnimal() {
    let lowestValue = Infinity;
    let lowestAnimal = null;

    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`) && gameState.grid[i][j]) {
        const animalType = gameState.grid[i][j];
        const animalConfig = GAME_CONFIG.animalTypes[animalType];

        if (
          animalConfig.sellPrice > 0 &&
          animalConfig.sellPrice < lowestValue
        ) {
          lowestValue = animalConfig.sellPrice;
          lowestAnimal = { i, j, type: animalType };
        }
      }
    });

    return lowestAnimal;
  },

  updateAutoButcherTimer() {
    if (!gameState.autoButcher.owned || !gameState.autoButcher.enabled) return;

    gameState.autoButcher.timer -= 1000;

    if (gameState.autoButcher.timer <= 0) {
      // Find the lowest value animal and try to butcher it
      const house = gameState.slaughterHouses[0];
      if (house && house.queue.length < house.queueMax) {
        const lowestAnimal = this.findLowestValueAnimal();
        if (lowestAnimal) {
          if (
            slaughterHouseManager.addAnimalToQueue(
              0,
              lowestAnimal.type,
              lowestAnimal.i,
              lowestAnimal.j
            )
          ) {
            const animalConfig = GAME_CONFIG.animalTypes[lowestAnimal.type];
            updateStatus(`Auto-butcher sent ${animalConfig.name} to queue! 🔪`);
          }
        }
      }

      gameState.autoButcher.timer = GAME_CONFIG.autoButcherConfig.checkInterval;
    }
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

    audioManager.playSound("shuffle");

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

    gameState.isAutoMergeInProgress = true;

    this.clearAutoMergeHighlight();

    let mergedTypes = [];
    let mergesMade = false;
    let skippedMerges = 0;

    const pairsToProcess = [...gameState.mergeablePairs];

    if (pairsToProcess.length === 0) {
      audioManager.playSound("auto-merge-fail");
    } else {
      audioManager.playSound("auto-merge-win");
    }

    pairsToProcess.forEach(({ source, target }) => {
      if (
        gameState.grid[source.i][source.j] &&
        gameState.grid[target.i][target.j] &&
        gameState.grid[source.i][source.j] ===
          gameState.grid[target.i][target.j] &&
        GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo
      ) {
        const sourceType = gameState.grid[source.i][source.j];
        const targetType = gameState.grid[target.i][target.j];
        const newType =
          GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo;

        // Check if merge is allowed in current level
        if (!canMergeInLevel(sourceType, targetType)) {
          skippedMerges++;
          return; // Skip this merge if not allowed in level
        }

        const sourceCell = document.getElementById(
          `cell-${source.i}-${source.j}`
        );
        const explosion = utilityManager.createElement(
          "div",
          "merge-explosion absolute text-3xl",
          "⚙️"
        );
        explosion.style.left = "50%";
        explosion.style.top = "50%";
        explosion.style.transform = "translate(-50%, -50%)";
        sourceCell.appendChild(explosion);

        utilityManager.setTimeout(
          () => explosion.remove(),
          GAME_CONFIG.animationConfig.mergeExplosionDuration,
          "autoMergeExplosion"
        );

        gameState.grid[source.i][source.j] = null;
        gameState.grid[target.i][target.j] = newType;
        gameState.createdAnimals.add(newType);
        gameState.totalMerges += 1;

        this.checkCoopLevelUp(sourceType);

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

        const newAnimalConfig = GAME_CONFIG.animalTypes[newType];
        if (!mergedTypes.includes(newAnimalConfig.name))
          mergedTypes.push(newAnimalConfig.name);
        mergesMade = true;

        this.checkForNewUnlocks(newType);

        if (newType === "EndDemoAnimal") {
          eventManager.showDemoEndedPopup();
        }
      }
    });

    this.updateMergeablePairsForAutoMerge();

    utilityManager.setTimeout(
      () => this.clearAutoMergeHighlight(),
      1500,
      "clearAutoMergeHighlight"
    );
    updateAnimalValues();
    updateAutoMergeLevel();

    if (mergesMade) {
      const message =
        mergedTypes.length > 0
          ? `Auto-merged into ${mergedTypes.map((t) => t).join(", ")} ⚙️`
          : "Auto-merged animals ⚙️";
      updateStatus(message);

      audioManager.updateBackgroundMusic();
    } else if (skippedMerges > 0) {
      updateStatus(
        `Auto-merge skipped ${skippedMerges} merges (level restricted) ⚙️`
      );
    }

    if (gameState.shuffle.owned && gameState.shuffle.enabled) {
      utilityManager.setTimeout(
        () => {
          this.performShuffle();
        },
        GAME_CONFIG.shuffleConfig.delayAfterAutoMerge,
        "shuffleDelay"
      );
    }

    this.updatePlaceButtonStates();

    utilityManager.setTimeout(
      () => {
        gameState.isAutoMergeInProgress = false;
      },
      1000,
      "autoMergeInProgress"
    );
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

      if (
        Math.abs(gameState.autoMerge.timer - 2) < 0.05 ||
        Math.abs(gameState.autoMerge.timer - 1) < 0.05 ||
        Math.abs(gameState.autoMerge.timer - 0.5) < 0.05 ||
        Math.abs(gameState.autoMerge.timer - 0.25) < 0.05
      ) {
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
