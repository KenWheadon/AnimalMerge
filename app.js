let gameState = {
  money: 0,
  grid: [],
  purchasedCells: new Set(),
  selectedCell: null,
  draggedCell: null,
  isSlaughterAnimating: false,
  createdAnimals: new Set(),
  recentlyAnimatedCells: [],
  mergeablePairs: [],
  previousMergeablePairs: [],
  totalSlaughtered: 0,
  totalMerges: 0,
  eggButtonClicked: false,
  achievements: [],
  currentLevel: 1,
  levelCompleted: false,
  autoMerge: {
    owned: false,
    level: 1,
    baseInterval: GAME_CONFIG.autoMergeConfig.baseInterval,
    currentInterval: GAME_CONFIG.autoMergeConfig.baseInterval,
    timer: GAME_CONFIG.autoMergeConfig.baseInterval,
    enabled: true,
  },
  shuffle: {
    owned: false,
    enabled: true,
  },
  autoButcher: {
    owned: false,
    enabled: true,
    timer: GAME_CONFIG.autoButcherConfig.checkInterval,
  },
  slaughterHouses: [],
  lastInteractionTime: Date.now(),
  isAutoMergeInProgress: false,
};

function getCurrentLevelConfig() {
  return (
    GAME_CONFIG.levelConfig[gameState.currentLevel] ||
    GAME_CONFIG.levelConfig[1]
  );
}

function getLevelFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get("level")) || 1;
  return Math.max(1, Math.min(4, level)); // Clamp between 1 and 4
}

function checkWinCondition() {
  const levelConfig = getCurrentLevelConfig();
  if (gameState.levelCompleted) return false; // Already completed

  if (gameState.money >= levelConfig.winCondition.money) {
    gameState.levelCompleted = true;
    // Use setTimeout to avoid multiple triggers during the same money update
    utilityManager.setTimeout(
      () => {
        if (gameState.levelCompleted) {
          // Double-check in case it was reset
          showLevelCompletePopup();
        }
      },
      100,
      "levelCompleteDelay"
    );
    return true;
  }
  return false;
}

function showLevelCompletePopup() {
  const levelConfig = getCurrentLevelConfig();
  const nextLevel = levelConfig.nextLevel;

  const backdrop = utilityManager.createElement(
    "div",
    "level-complete-backdrop"
  );
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const popup = utilityManager.createElement("div", "level-complete-popup");
  popup.style.cssText = `
    background: linear-gradient(145deg, #10b981, #059669);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    text-align: center;
    max-width: 400px;
    width: 90%;
    border: 2px solid #fbbf24;
    animation: popupScale 0.5s ease-out;
  `;

  popup.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h2 style="color: white; font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎉 Level Complete! 🎉</h2>
      <h3 style="color: #fbbf24; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">${
        levelConfig.name
      }</h3>
    </div>
    <p style="color: white; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;">
      Congratulations! You've earned <strong style="color: #fbbf24;">💰${
        gameState.money
      }</strong> and completed this level!
    </p>
    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
      ${
        nextLevel
          ? `
        <button id="nextLevelBtn" style="
          background: linear-gradient(145deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          transition: all 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Next Level
        </button>
      `
          : `
        <button id="finalCompleteBtn" style="
          background: linear-gradient(145deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          transition: all 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Game Complete!
        </button>
      `
      }
      <button id="continueLevelBtn" style="
        background: linear-gradient(145deg, #374151, #1f2937);
        color: #fbbf24;
        padding: 0.75rem 2rem;
        border: 2px solid #fbbf24;
        border-radius: 0.5rem;
        font-weight: bold;
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        transition: all 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        Continue Playing
      </button>
    </div>
  `;

  if (!document.querySelector("#popup-animations")) {
    const style = document.createElement("style");
    style.id = "popup-animations";
    style.textContent = `
      @keyframes popupScale {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  backdrop.appendChild(popup);
  document.body.appendChild(backdrop);

  // Event listeners
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const continueLevelBtn = document.getElementById("continueLevelBtn");
  const finalCompleteBtn = document.getElementById("finalCompleteBtn");

  if (nextLevelBtn) {
    utilityManager.addEventListener(
      nextLevelBtn,
      "click",
      () => {
        window.location.href = `${window.location.pathname}?level=${nextLevel}`;
      },
      "nextLevel"
    );
  }

  if (finalCompleteBtn) {
    utilityManager.addEventListener(
      finalCompleteBtn,
      "click",
      () => {
        backdrop.remove();
        updateStatus("🎊 Congratulations! You've mastered the entire farm! 🎊");
      },
      "finalComplete"
    );
  }

  if (continueLevelBtn) {
    utilityManager.addEventListener(
      continueLevelBtn,
      "click",
      () => {
        backdrop.remove();
        gameState.levelCompleted = false; // Allow them to keep playing
      },
      "continueLevel"
    );
  }

  // Close on backdrop click
  utilityManager.addEventListener(
    backdrop,
    "click",
    (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
        gameState.levelCompleted = false;
      }
    },
    "levelCompleteBackdrop"
  );
}

function isAnimalAvailableInLevel(animalType) {
  const levelConfig = getCurrentLevelConfig();
  return levelConfig.availableAnimals.includes(animalType);
}

function validateAnimalForLevel(animalType) {
  if (!animalType) return false;
  return isAnimalAvailableInLevel(animalType);
}

function canMergeInLevel(sourceType, targetType) {
  // Both source animals must be valid for the level
  if (
    !validateAnimalForLevel(sourceType) ||
    !validateAnimalForLevel(targetType)
  ) {
    return false;
  }

  // The merge result must also be valid for the level
  const mergeResult = GAME_CONFIG.animalTypes[sourceType].mergeTo;
  if (!mergeResult || !validateAnimalForLevel(mergeResult)) {
    return false;
  }

  return true;
}

function isCoopAvailableInLevel(coopType) {
  const levelConfig = getCurrentLevelConfig();
  return levelConfig.availableCoops.includes(coopType);
}

function showTutorialPopup() {
  const levelConfig = getCurrentLevelConfig();

  const popup = utilityManager.createElement(
    "div",
    "tutorial-popup-backdrop",
    `
    <div class="tutorial-popup">
      <button id="closeTutorial" class="tutorial-close-btn">×</button>
      <div class="tutorial-content">
        <div class="tutorial-character">
          <img src="images/cow.png" alt="Farm Guide" class="tutorial-cow-image" />
        </div>
        <div class="tutorial-text">
          <h2 class="tutorial-title">Welcome to ${levelConfig.name}!</h2>
          <div class="tutorial-instructions">
            <p><strong>🎯 Level Goal:</strong> ${levelConfig.description}</p>
            <p><strong>💰 Win Condition:</strong> Earn ${levelConfig.winCondition.money} money to complete this level!</p>
            <p><strong>🥚 Start with Eggs:</strong> Buy and place eggs on your grid to begin!</p>
            <p><strong>🔄 Merge Everything:</strong> Merge 2 of the same thing to upgrade it!</p>
            <p><strong>💰 Make Money:</strong> Sell animals by dragging them to the butcher shop!</p>
            <p><strong>🏡 Build Coops:</strong> Unlock coops to automatically generate better eggs!</p>
            <p><strong>⚙️ Automate:</strong> Buy auto-merge to automatically combine animals and eggs!</p>
          </div>
          <div class="tutorial-buttons">
            <button id="startFarming" class="tutorial-start-btn">Get Farming!</button>
            <button id="showCredits" class="tutorial-credits-btn">Credits</button>
          </div>
        </div>
      </div>
    </div>
  `
  );

  popup.id = "tutorialPopup";
  document.body.appendChild(popup);

  const closeBtn = document.getElementById("closeTutorial");
  const startBtn = document.getElementById("startFarming");
  const creditsBtn = document.getElementById("showCredits");

  const closeTutorial = () => {
    audioManager.handleFirstUserInteraction();
    popup.remove();
    eventManager.startInitialTutorialCycle();
  };

  utilityManager.addEventListener(
    closeBtn,
    "click",
    closeTutorial,
    "tutorialClose"
  );
  utilityManager.addEventListener(
    startBtn,
    "click",
    closeTutorial,
    "tutorialStart"
  );
  utilityManager.addEventListener(
    creditsBtn,
    "click",
    () => {
      audioManager.playSound("button-click");
      if (typeof showCreditsGallery === "function") {
        showCreditsGallery();
      }
    },
    "tutorialCredits"
  );

  utilityManager.addEventListener(
    popup,
    "click",
    (e) => {
      if (e.target === popup) {
        closeTutorial();
      }
    },
    "tutorialBackdrop"
  );
}

function showCreditsGallery() {
  const modal = utilityManager.createElement("div", "credits-gallery-modal");
  modal.id = "creditsModal";

  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
  `;

  modal.innerHTML = `
    <div class="credits-gallery-container">
      <div class="credits-gallery-header">
       <img src="images/company-logo.png" alt="Weird Demon Games Logo" class="credits-logo" />
        <div class="credits-company">
          <div class="credits-text-info">
            <h1 class="credits-gallery-title">Furry Merge Farm</h1>
            <p class="credits-game-title">Game Credits</p>
            <p class="credits-company-name">Weird Demon Games</p>
          </div>
        </div>
        <button class="credits-gallery-close" id="closeCredits">×</button>
      </div>
      
      <div class="credits-gallery-content">
        <div class="credits-gallery-filters">
          <button class="credits-filter-btn active" data-filter="all">All</button>
          ${getAllDepartments()
            .map(
              (dept) =>
                `<button class="credits-filter-btn" data-filter="${dept.toLowerCase()}">${dept}</button>`
            )
            .join("")}
        </div>
        
        <div class="credits-grid" id="creditsGrid">
          ${Object.entries(CREDITS)
            .map(
              ([key, person]) => `
            <div class="credits-card" data-department="${person.department.toLowerCase()}" data-person="${key}">
              <img src="${person.previewImage}" alt="${
                person.name
              }" class="credits-card-image" />
              <h3 class="credits-card-name">${person.name}</h3>
              <p class="credits-card-title">${person.jobTitle}</p>
              <p class="credits-card-department">${person.department}</p>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="credits-detail-view" id="creditsDetailView">
          <button class="credits-detail-back" id="creditsDetailBack">←</button>
          <div class="credits-detail-left">
            <img id="creditsDetailImage" class="credits-detail-image" />
          </div>
          <div class="credits-detail-right">
            <h2 id="creditsDetailName" class="credits-detail-name"></h2>
            <p id="creditsDetailTitle" class="credits-detail-title"></p>
            <p id="creditsDetailDepartment" class="credits-detail-department"></p>
            <p id="creditsDetailDescription" class="credits-detail-description"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.style.opacity = "1";
    modal.style.visibility = "visible";
    modal.style.pointerEvents = "auto";
  });

  utilityManager.addEventListener(
    document.getElementById("closeCredits"),
    "click",
    hideCreditsGallery,
    "creditsClose"
  );

  document.querySelectorAll(".credits-filter-btn").forEach((btn) => {
    utilityManager.addEventListener(
      btn,
      "click",
      (e) => {
        document
          .querySelectorAll(".credits-filter-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        const filter = e.target.dataset.filter;
        const cards = document.querySelectorAll(".credits-card");

        cards.forEach((card) => {
          if (filter === "all" || card.dataset.department === filter) {
            card.style.display = "block";
          } else {
            card.style.display = "none";
          }
        });
      },
      `creditsFilter_${btn.dataset.filter}`
    );
  });

  document.querySelectorAll(".credits-card").forEach((card) => {
    utilityManager.addEventListener(
      card,
      "click",
      () => {
        const personKey = card.dataset.person;
        const person = CREDITS[personKey];

        document.getElementById("creditsDetailImage").src = person.fullImage;
        document.getElementById("creditsDetailImage").alt = person.name;
        document.getElementById("creditsDetailName").textContent = person.name;
        document.getElementById("creditsDetailTitle").textContent =
          person.jobTitle;
        document.getElementById("creditsDetailDepartment").textContent =
          person.department;
        document.getElementById("creditsDetailDescription").textContent =
          person.description;

        document.getElementById("creditsDetailView").classList.add("active");
      },
      `creditsCard_${card.dataset.person}`
    );
  });

  utilityManager.addEventListener(
    document.getElementById("creditsDetailBack"),
    "click",
    () => {
      document.getElementById("creditsDetailView").classList.remove("active");
    },
    "creditsDetailBack"
  );

  utilityManager.addEventListener(
    modal,
    "click",
    (e) => {
      if (e.target === modal) {
        hideCreditsGallery();
      }
    },
    "creditsModalBackdrop"
  );
}

function hideCreditsGallery() {
  const modal = document.getElementById("creditsModal");
  if (modal) {
    modal.style.opacity = "0";
    modal.style.visibility = "hidden";
    modal.style.pointerEvents = "none";
    utilityManager.setTimeout(() => modal.remove(), 300, "creditsModalRemove");
  }
}

function initializeGame() {
  // Set current level from URL first
  gameState.currentLevel = getLevelFromURL();

  const saveLoaded = saveManager.initialize();

  // If save was loaded, ensure level consistency with URL
  if (saveLoaded) {
    const urlLevel = getLevelFromURL();
    if (gameState.currentLevel !== urlLevel) {
      // URL takes precedence over saved level
      gameState.currentLevel = urlLevel;
      gameState.levelCompleted = false; // Reset completion status for new level
    }
  }

  if (!saveLoaded) {
    gridManager.initializeGridState();
    slaughterHouseManager.initializeSlaughterHouses();
    coopManager.initializeCoopStates();
  } else {
    if (!gameState.grid || gameState.grid.length === 0) {
      gameState.grid = Array(GAME_CONFIG.gridConfig.rows)
        .fill(null)
        .map(() => Array(GAME_CONFIG.gridConfig.cols).fill(null));
    }
    if (!gameState.slaughterHouses || gameState.slaughterHouses.length === 0) {
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
    }
    coopManager.initializeCoopStates();
  }

  achievementManager.initializeAchievements();
  audioManager.initialize();

  document.getElementById("gameContainer").innerHTML = generateMainHTML();

  gridManager.initializeGridEventListeners();
  slaughterHouseManager.initializeSlaughterHouseEventListeners();
  coopManager.initializeFarmBuildingEventListeners();
  eventManager.initializeButtonEventListeners();
  achievementManager.initializeEventListeners();

  updateAnimalValues();
  updateMergeablePairs();
  coopManager.updateEmptyMessageVisibility();
  coopManager.updateBuyAnimalButtons();
  coopManager.updateShuffleButtonState();

  updateMoney();
  updateAutoMergeLevel();
  updatePanelVisibility();

  achievementManager.checkAchievements();

  const levelConfig = getCurrentLevelConfig();
  if (!saveLoaded) {
    updateStatus(
      `Start ${levelConfig.name}! Click 🌱 grass squares to expand! Goal: ${levelConfig.winCondition.money} money`
    );
  } else {
    updateStatus(
      `Welcome back to ${levelConfig.name}! Goal: ${levelConfig.winCondition.money} money 🎉`
    );
  }

  GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
    if (cost > 0 && !gameState.purchasedCells.has(`${row}-${col}`)) {
      gridManager.setupGrassCell(row, col, cost);
    }
  });

  startGameTimers();
  eventManager.startInitialEggButtonAnimation();
  eventManager.initializeIdleDetection();
  coopManager.updateShuffleButtonState();

  showTutorialPopup();
}

function generateMainHTML() {
  const levelConfig = getCurrentLevelConfig();

  const autoMergeBuyHidden = gameState.autoMerge.owned ? "hidden" : "";
  const autoMergeToggleHidden = gameState.autoMerge.owned ? "" : "hidden";
  const autoMergeProgressHidden = gameState.autoMerge.owned ? "" : "hidden";
  const autoMergeToggleText = gameState.autoMerge.enabled ? "🔵 ON" : "🔴 OFF";
  const autoMergeToggleClass = gameState.autoMerge.enabled
    ? "bg-green-500"
    : "bg-red-500";

  const shuffleBuyHidden = gameState.shuffle.owned ? "hidden" : "";
  const shuffleToggleHidden = gameState.shuffle.owned ? "" : "hidden";
  const shuffleToggleText = gameState.shuffle.enabled ? "🔵 ON" : "🔴 OFF";
  const shuffleToggleClass = gameState.shuffle.enabled
    ? "bg-green-500"
    : "bg-red-500";

  const autoButcherBuyHidden = gameState.autoButcher.owned ? "hidden" : "";
  const autoButcherToggleHidden = gameState.autoButcher.owned ? "" : "hidden";
  const autoButcherToggleText = gameState.autoButcher.enabled
    ? "🔵 ON"
    : "🔴 OFF";
  const autoButcherToggleClass = gameState.autoButcher.enabled
    ? "bg-green-500"
    : "bg-red-500";

  return `
    <div class="game-container flex">
        <div class="w-40 bg-white shadow-lg flex flex-col" style="height: fit-content; max-height: 100vh;">
            <div class="p-4 border-b">
                <div id="money" class="money-display text-center">Money: 💰${
                  gameState.money
                }</div>
                <div class="level-info text-center mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="text-sm font-bold text-blue-800">Level ${
                    gameState.currentLevel
                  }</div>
                  <div class="text-xs text-blue-600">${levelConfig.name}</div>
                  <div class="text-xs text-blue-500">Goal: 💰${
                    levelConfig.winCondition.money
                  }</div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4">
                <h3 class="text-lg font-bold text-green-800 mb-4">🛒 Buy Eggs</h3>
                <div class="space-y-3">
                    ${coopManager.generateBuyAnimalButtons()}
                </div>
            </div>
        </div>

        <div class="flex flex-col">
            <div class="flex-shrink-0 bg-white mx-4 m-2 p-1 rounded-xl shadow-lg">
                <div class="grid grid-cols-3 gap-2">
                    <div class="automation-section">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-bold text-purple-800">⚙️ Auto-Merge</h4>
                            <span id="autoMergeLevel" class="text-xs text-gray-600">Lv.${
                              gameState.autoMerge.level
                            }</span>
                        </div>
                        <div class="space-y-1 text-xs mb-1">
                            <div class="flex justify-between">
                                <span>Interval:</span>
                                <span id="autoMergeTimer" class="font-mono">${gameState.autoMerge.currentInterval.toFixed(
                                  1
                                )}s</span>
                            </div>
                            <div id="autoMergeProgress" class="text-gray-500">${
                              gameState.totalMerges
                            }/${getNextAutoMergeRequirement(
    gameState.autoMerge.level
  )} merges completed</div>
                        </div>
                        <div id="autoMergeProgressContainer" class="mb-2 ${autoMergeProgressHidden}">
                            <div class="coop-progress-bar h-1">
                                <div id="autoMergeProgressBar" class="coop-progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <button id="buyAutoMerge" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${autoMergeBuyHidden}" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed);">
                                Buy ($1)
                            </button>
                            <button id="autoMergeToggle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${autoMergeToggleHidden} ${autoMergeToggleClass}">
                                ${autoMergeToggleText}
                            </button>
                        </div>
                    </div>

                    <div class="automation-section">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-bold text-orange-800">🔀 Shuffle</h4>
                            <span class="text-xs text-gray-600">Auto</span>
                        </div>
                        <div class="space-y-1 text-xs mb-1">
                            <div class="text-gray-500">Triggers after Auto-Merge</div>
                            <div class="text-gray-500">Rearranges animals</div>
                        </div>
                        <div class="mb-2" style="height: 4px;"></div>
                        <div class="space-y-1">
                            <button id="buyShuffle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${shuffleBuyHidden}" style="background: linear-gradient(145deg, #f59e0b, #d97706);">
                                <span id="shuffleButtonText">Buy ($50)</span>
                            </button>
                            <button id="shuffleToggle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${shuffleToggleHidden} ${shuffleToggleClass}">
                                ${shuffleToggleText}
                            </button>
                        </div>
                    </div>

                    <div class="automation-section">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-sm font-bold text-red-800">🔪 Auto-Butcher</h4>
                            <span class="text-xs text-gray-600">Auto</span>
                        </div>
                        <div class="space-y-1 text-xs mb-1">
                            <div class="text-gray-500">Butchers lowest value</div>
                            <div class="text-gray-500">animals automatically</div>
                        </div>
                        <div class="mb-2" style="height: 4px;"></div>
                        <div class="space-y-1">
                            <button id="buyAutoButcher" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${autoButcherBuyHidden}" style="background: linear-gradient(145deg, #dc2626, #b91c1c);">
                                Buy ($100)
                            </button>
                            <button id="autoButcherToggle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white ${autoButcherToggleHidden} ${autoButcherToggleClass}">
                                ${autoButcherToggleText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pb-2">
                <div class="flex justify-center">
                    ${gridManager.generateGridHTML()}
                </div>
            </div>

            <div id="status" class="status-display text-sm h-16 flex items-center justify-center">Level ${
              gameState.currentLevel
            }: ${levelConfig.description}. Goal: 💰${
    levelConfig.winCondition.money
  }</div>

        </div>

        <div class="w-60 bg-white shadow-lg flex flex-col" style="height: fit-content; max-height: 100vh;">
            <div class="p-2 border-b">
                <h2 class="text-xl font-bold text-green-800">🏭 Buildings</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
                <div id="slaughterHouseContainer" class="mb-2">
                    ${slaughterHouseManager.generateSlaughterHouseHTML()}
                </div>
                <div class="space-y-2">
                    ${coopManager.generateCoopHTML()}
                </div>
            </div>
        </div>
    </div>
    
    ${achievementManager.generateAchievementDrawerHTML()}
`;
}

function calculateAutoMergeLevel(totalMerges) {
  let level = 1;
  let requirement = 5;
  let gap = 7;

  while (totalMerges >= requirement) {
    level++;
    if (level <= 12) {
      requirement =
        GAME_CONFIG.autoMergeConfig.mergeRequirements[level - 1] || requirement;
    } else {
      requirement += gap;
      gap += 5;
    }
  }

  return level - 1;
}

function getNextAutoMergeRequirement(currentLevel) {
  if (currentLevel < 12) {
    return GAME_CONFIG.autoMergeConfig.mergeRequirements[currentLevel];
  } else {
    let requirement = 300;
    let gap = 30;
    for (let i = 12; i < currentLevel; i++) {
      requirement += gap;
      gap += 5;
    }
    return requirement;
  }
}

function updateAutoMergeLevel() {
  const newLevel = calculateAutoMergeLevel(gameState.totalMerges);
  const oldLevel = gameState.autoMerge.level;

  if (newLevel > oldLevel) {
    gameState.autoMerge.level = newLevel;
    gameState.autoMerge.currentInterval =
      GAME_CONFIG.autoMergeConfig.baseInterval *
      Math.pow(
        GAME_CONFIG.autoMergeConfig.intervalReductionFactor,
        newLevel - 1
      );
    gameState.autoMerge.timer = gameState.autoMerge.currentInterval;

    document.getElementById("autoMergeLevel").textContent = `Lv.${newLevel}`;
    document.getElementById(
      "autoMergeTimer"
    ).textContent = `${gameState.autoMerge.currentInterval.toFixed(1)}s`;

    eventManager.showAchievement(`🆙 Auto-Merge Level ${newLevel}!`);
    updateStatus(`Auto-Merge upgraded to level ${newLevel}! 🆙`);
  }

  const nextRequirement = getNextAutoMergeRequirement(
    gameState.autoMerge.level
  );
  const progressElement = document.getElementById("autoMergeProgress");
  if (progressElement) {
    progressElement.textContent = `${gameState.totalMerges}/${nextRequirement} merges completed`;
  }
}

function updateMergeablePairs() {
  gameState.previousMergeablePairs = [...gameState.mergeablePairs];
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
      GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo &&
      validateAnimalForLevel(gameState.grid[i][j]) // Only consider animals valid for current level
    ) {
      for (const { di, dj } of neighbors) {
        const ni = i + di;
        const nj = j + dj;

        if (
          GAME_CONFIG.gridConfig.availableSpots.some(
            (spot) => spot.row === ni && spot.col === nj
          ) &&
          gameState.purchasedCells.has(`${ni}-${nj}`) &&
          gameState.grid[ni][nj] === gameState.grid[i][j] &&
          canMergeInLevel(gameState.grid[i][j], gameState.grid[ni][nj]) // Validate merge is allowed
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

  if (!gameState.draggedCell) {
    gridManager.clearValidTargets();
  }
}

function isGridFull() {
  return GAME_CONFIG.gridConfig.availableSpots.every(
    ({ row, col }) =>
      !gameState.purchasedCells.has(`${row}-${col}`) || gameState.grid[row][col]
  );
}

function trackPlayerInteraction() {
  gameState.lastInteractionTime = Date.now();
}

function placeAnimal(type) {
  trackPlayerInteraction();

  if (gameState.isAutoMergeInProgress) {
    audioManager.playSound("invalid-action");
    updateStatus("Wait for auto-merge to complete! ⚙️");
    return false;
  }

  // Check if animal is available in current level
  if (!isAnimalAvailableInLevel(type)) {
    audioManager.playSound("invalid-action");
    updateStatus("This animal is not available in the current level! 🚫");
    return false;
  }

  for (const { row: i, col: j } of GAME_CONFIG.gridConfig.availableSpots) {
    if (gameState.purchasedCells.has(`${i}-${j}`) && !gameState.grid[i][j]) {
      gameState.grid[i][j] = type;
      gameState.createdAnimals.add(type);

      audioManager.playSound("egg-placement");

      updateAnimalValues();
      gridManager.updateCell(i, j);
      updateMergeablePairs();

      const cell = document.getElementById(`cell-${i}-${j}`);
      eventManager.createParticles(cell);

      const animalConfig = GAME_CONFIG.animalTypes[type];
      updateStatus(
        gameState.createdAnimals.size === 1 && animalConfig.sellPrice > 0
          ? `${animalConfig.name} created! You can sell it for 💰${animalConfig.sellPrice}`
          : `Placed ${animalConfig.name}`
      );

      coopManager.checkForNewUnlocks(type);
      updatePanelVisibility();
      audioManager.updateBackgroundMusic();

      return true;
    }
  }

  audioManager.playSound("invalid-action");
  updateStatus("No available space! Purchase more grid squares! 🌱");
  return false;
}

function buyAnimal(type, cost) {
  trackPlayerInteraction();

  // Check if animal is available in current level
  if (!isAnimalAvailableInLevel(type)) {
    audioManager.playSound("invalid-action");
    updateStatus("This animal is not available in the current level! 🚫");
    return;
  }

  if (gameState.money >= cost) {
    if (type === "Egg" && !gameState.eggButtonClicked) {
      gameState.eggButtonClicked = true;
      eventManager.stopInitialEggButtonAnimation();
      coopManager.updateBuyAnimalButtons();
    }

    if (placeAnimal(type)) {
      gameState.money -= cost;
      updateMoney();
      const animalConfig = GAME_CONFIG.animalTypes[type];
      updateStatus(`Bought and placed ${animalConfig.name}`);
      saveManager.saveOnAction();
      achievementManager.checkAchievements();
    } else {
      if (type === "Egg" && gameState.eggButtonClicked) {
        gameState.eggButtonClicked = false;
        eventManager.startInitialEggButtonAnimation();
        coopManager.updateBuyAnimalButtons();
      }
    }
  } else {
    audioManager.playSound("invalid-action");
    const animalConfig = GAME_CONFIG.animalTypes[type];
    updateStatus(`Not enough money for ${animalConfig.name}! 😕`);
    utilityManager.addScreenShake();
  }
}

function sellAnimal(i, j, type) {
  trackPlayerInteraction();
  if (gameState.slaughterHouses.length > 0) {
    slaughterHouseManager.addAnimalToQueue(0, type, i, j);
  }
}

function mergeAnimals(sourceI, sourceJ, targetI, targetJ) {
  trackPlayerInteraction();

  if (gameState.isAutoMergeInProgress) {
    audioManager.playSound("invalid-action");
    updateStatus("Wait for auto-merge to complete! ⚙️");
    return;
  }

  const sourceType = gameState.grid[sourceI][sourceJ];
  const targetType = gameState.grid[targetI][targetJ];

  // Validate that this merge is allowed in the current level
  if (!canMergeInLevel(sourceType, targetType)) {
    audioManager.playSound("invalid-action");
    updateStatus("Cannot merge - not available in this level! 🚫");
    return;
  }

  const newType = GAME_CONFIG.animalTypes[sourceType].mergeTo;

  audioManager.playSound("manual-merge");

  const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
  const explosion = utilityManager.createElement(
    "div",
    "merge-explosion absolute text-4xl",
    "✨"
  );
  explosion.style.left = "50%";
  explosion.style.top = "50%";
  explosion.style.transform = "translate(-50%, -50%)";
  sourceCell.appendChild(explosion);

  utilityManager.setTimeout(
    () => explosion.remove(),
    GAME_CONFIG.animationConfig.mergeExplosionDuration,
    "mergeExplosion"
  );

  gameState.grid[sourceI][sourceJ] = null;
  gameState.grid[targetI][targetJ] = newType;
  gameState.createdAnimals.add(newType);
  gameState.totalMerges += 1;

  coopManager.checkCoopLevelUp(sourceType);

  updateAnimalValues();
  gridManager.updateCell(sourceI, sourceJ);
  gridManager.updateCell(targetI, targetJ);
  updateMergeablePairs();
  updateAutoMergeLevel();

  const targetCell = document.getElementById(`cell-${targetI}-${targetJ}`);
  eventManager.createParticles(targetCell);
  coopManager.checkForNewUnlocks(newType);

  updatePanelVisibility();
  audioManager.updateBackgroundMusic();

  if (newType === "EndDemoAnimal") {
    eventManager.showDemoEndedPopup();
  }

  const newAnimalConfig = GAME_CONFIG.animalTypes[newType];
  const sellPrice = newAnimalConfig.sellPrice;
  updateStatus(
    sellPrice > 0
      ? `Merged into ${newAnimalConfig.name}! You can sell it for 💰${sellPrice}`
      : `Merged into ${newAnimalConfig.name}!`
  );

  saveManager.saveOnAction();
  achievementManager.checkAchievements();
}

function updateStatus(message) {
  const statusElement = document.getElementById("status");
  statusElement.textContent = message;
  statusElement.classList.add("bounce-in");
  utilityManager.setTimeout(
    () => statusElement.classList.remove("bounce-in"),
    600,
    "statusBounce"
  );
}

function updateAnimalValues() {
  // This function is kept for compatibility but doesn't need implementation
}

function updatePanelVisibility() {
  slaughterHouseManager.updateVisibility();
  coopManager.updatePanelVisibility();
}

function updateMoney() {
  const moneyElement = document.getElementById("money");
  moneyElement.textContent = `Money: 💰${gameState.money}`;
  moneyElement.classList.add("updated");
  utilityManager.setTimeout(
    () => moneyElement.classList.remove("updated"),
    500,
    "moneyUpdate"
  );

  // Check win condition after money update
  checkWinCondition();

  achievementManager.checkAchievements();
}

function startGameTimers() {
  utilityManager.setInterval(
    () => {
      coopManager.updateCoopTimers();
      coopManager.updatePlaceButtonStates();
      slaughterHouseManager.updateSlaughterHouseTimers();
      coopManager.updateAutoButcherTimer();
    },
    1000,
    "gameMainTimer"
  );

  utilityManager.setInterval(
    () => {
      coopManager.updateAutoMergeTimer();
    },
    100,
    "autoMergeTimer"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  loadingManager.showLoadingScreen();
});
