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
  eggButtonClicked: false,
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
  slaughterHouses: [],
  lastInteractionTime: Date.now(), // Track last player interaction for idle detection
};

function showTutorialPopup() {
  const popup = document.createElement("div");
  popup.id = "tutorialPopup";
  popup.className = "tutorial-popup-backdrop";

  popup.innerHTML = `
       <div class="tutorial-popup">
      <button id="closeTutorial" class="tutorial-close-btn">×</button>
      <div class="tutorial-content">
        <div class="tutorial-character">
          <img src="images/cow.png" alt="Farm Guide" class="tutorial-cow-image" />
        </div>
        <div class="tutorial-text">
          <h2 class="tutorial-title">Welcome to Furry Merge Farm!</h2>
          <div class="tutorial-instructions">
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
  `;

  document.body.appendChild(popup);

  const closeBtn = document.getElementById("closeTutorial");
  const startBtn = document.getElementById("startFarming");
  const creditsBtn = document.getElementById("showCredits");

  const closeTutorial = () => {
    // Handle first user interaction for audio
    audioManager.handleFirstUserInteraction();
    popup.remove();
    // Start the tutorial notification cycle after popup is closed
    eventManager.startInitialTutorialCycle();
  };

  closeBtn.addEventListener("click", closeTutorial);
  startBtn.addEventListener("click", closeTutorial);

  creditsBtn.addEventListener("click", () => {
    audioManager.playSound("button-click");
    showCreditsGallery();
  });

  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      closeTutorial();
    }
  });
}

function showCreditsGallery() {
  const modal = document.createElement("div");
  modal.className = "credits-gallery-modal";
  modal.id = "creditsModal";

  // Ensure modal is positioned properly
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
        <div class="credits-company">
          <h1 class="credits-gallery-title">Game Credits</h1>
          <img src="images/company-logo.png" alt="Company Logo" class="credits-logo" />
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

  // Show modal with proper animation
  requestAnimationFrame(() => {
    modal.style.opacity = "1";
    modal.style.visibility = "visible";
    modal.style.pointerEvents = "auto";
  });

  // Event listeners
  document
    .getElementById("closeCredits")
    .addEventListener("click", hideCreditsGallery);

  // Filter buttons
  document.querySelectorAll(".credits-filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
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
    });
  });

  // Card clicks
  document.querySelectorAll(".credits-card").forEach((card) => {
    card.addEventListener("click", () => {
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
    });
  });

  // Detail back button
  document.getElementById("creditsDetailBack").addEventListener("click", () => {
    document.getElementById("creditsDetailView").classList.remove("active");
  });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideCreditsGallery();
    }
  });
}

function hideCreditsGallery() {
  const modal = document.getElementById("creditsModal");
  if (modal) {
    modal.style.opacity = "0";
    modal.style.visibility = "hidden";
    modal.style.pointerEvents = "none";
    setTimeout(() => modal.remove(), 300);
  }
}

function initializeGame() {
  // Initialize save system and load saved data FIRST
  const saveLoaded = saveManager.initialize();

  // Only initialize default states if no save was loaded
  if (!saveLoaded) {
    gridManager.initializeGridState();
    slaughterHouseManager.initializeSlaughterHouses();
    coopManager.initializeCoopStates();
  } else {
    // If save was loaded, still need to ensure grid state array exists
    if (!gameState.grid || gameState.grid.length === 0) {
      gameState.grid = Array(5)
        .fill(null)
        .map(() => Array(8).fill(null));
    }
    // Ensure slaughter houses exist
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
    // Ensure coop states exist
    coopManager.initializeCoopStates();
  }

  // Initialize achievements system
  achievementManager.initializeAchievements();

  // Initialize audio system
  audioManager.initialize();

  document.getElementById("gameContainer").innerHTML = generateMainHTML();

  gridManager.initializeGridEventListeners();
  slaughterHouseManager.initializeSlaughterHouseEventListeners();
  coopManager.initializeFarmBuildingEventListeners();
  eventManager.initializeButtonEventListeners();
  achievementManager.initializeEventListeners();

  // Update UI based on loaded/initial state
  updateAnimalValues();
  updateMergeablePairs();
  coopManager.updateEmptyMessageVisibility();
  coopManager.updateBuyAnimalButtons(); // Update button states based on loaded data
  coopManager.updateShuffleButtonState(); // Update shuffle state

  // Update UI elements that depend on saved state
  updateMoney();
  updateAutoMergeLevel();
  updatePanelVisibility();

  // Check achievements on load
  achievementManager.checkAchievements();

  // If no save was loaded, show initial status
  if (!saveLoaded) {
    updateStatus(
      `Start with initial grid spots! Click 🌱 grass squares to expand!`
    );
  } else {
    updateStatus("Game loaded! Welcome back! 🎉");
  }

  // FIX: Only setup grass cells for unpurchased spots AFTER save loading
  GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
    if (cost > 0 && !gameState.purchasedCells.has(`${row}-${col}`)) {
      gridManager.setupGrassCell(row, col, cost);
    }
  });

  startGameTimers();

  // Add initial egg button animation
  eventManager.startInitialEggButtonAnimation();

  // Initialize idle detection system (but don't start tutorial cycle yet)
  eventManager.initializeIdleDetection();

  // Initialize shuffle button state (locked until auto-merge is purchased)
  coopManager.updateShuffleButtonState();

  showTutorialPopup();
}

function generateMainHTML() {
  // Determine button states based on current game state
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

  return `
    <div class="game-container flex h-screen">
        <div class="w-40 bg-white shadow-lg flex flex-col">
            <div class="p-4 border-b">
                <div id="money" class="money-display text-center">Money: 💰${
                  gameState.money
                }</div>
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
                <div class="grid grid-cols-2 gap-2">
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
                              gameState.totalSlaughtered
                            }/${getNextAutoMergeRequirement(
    gameState.autoMerge.level
  )} animals slaughtered</div>
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
                </div>
            </div>

            <div class="pb-2">
                <div class="flex justify-center">
                    ${gridManager.generateGridHTML()}
                </div>
            </div>

            <div id="status" class="status-display text-sm h-16 flex items-center justify-center">Drag or click 'Buy Egg 🥚' to start!</div>

        </div>

        <div class="w-60 bg-white shadow-lg flex flex-col">
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

function calculateAutoMergeLevel(totalSlaughtered) {
  let level = 1;
  let requirement = 6;
  let gap = 9;

  while (totalSlaughtered >= requirement) {
    level++;
    if (level <= 8) {
      requirement =
        GAME_CONFIG.autoMergeConfig.animalRequirements[level - 1] ||
        requirement;
    } else {
      requirement += gap;
      gap += 5;
    }
  }

  return level - 1;
}

function getNextAutoMergeRequirement(currentLevel) {
  if (currentLevel < 8) {
    return GAME_CONFIG.autoMergeConfig.animalRequirements[currentLevel];
  } else {
    let requirement = 115;
    let gap = 25;
    for (let i = 8; i < currentLevel; i++) {
      requirement += gap;
      gap += 5;
    }
    return requirement;
  }
}

function updateAutoMergeLevel() {
  const newLevel = calculateAutoMergeLevel(gameState.totalSlaughtered);
  const oldLevel = gameState.autoMerge.level;

  if (newLevel > oldLevel) {
    gameState.autoMerge.level = newLevel;
    // Fixed: Properly calculate decreasing interval using config values
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
  document.getElementById(
    "autoMergeProgress"
  ).textContent = `${gameState.totalSlaughtered}/${nextRequirement} animals slaughtered`;
}

function updateMergeablePairs() {
  // Store previous pairs for comparison
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

  // FIX: Clear any persistent highlights that shouldn't be there
  // Only clear highlights if we're not currently dragging
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

// Function to track player interactions
function trackPlayerInteraction() {
  gameState.lastInteractionTime = Date.now();
}

function placeAnimal(type) {
  console.log(`placeAnimal called with type: ${type}`);
  console.log(
    `gameState.eggButtonClicked in placeAnimal: ${gameState.eggButtonClicked}`
  );

  trackPlayerInteraction(); // Track interaction

  for (const { row: i, col: j } of GAME_CONFIG.gridConfig.availableSpots) {
    if (gameState.purchasedCells.has(`${i}-${j}`) && !gameState.grid[i][j]) {
      gameState.grid[i][j] = type;
      gameState.createdAnimals.add(type);

      // Play egg placement sound
      audioManager.playSound("egg-placement");

      updateAnimalValues();
      gridManager.updateCell(i, j);
      updateMergeablePairs();

      const cell = document.getElementById(`cell-${i}-${j}`);
      // Removed the spawn animation

      eventManager.createParticles(cell);

      const animalConfig = GAME_CONFIG.animalTypes[type];
      updateStatus(
        gameState.createdAnimals.size === 1 && animalConfig.sellPrice > 0
          ? `${animalConfig.name} created! You can sell it for 💰${animalConfig.sellPrice}`
          : `Placed ${animalConfig.name}`
      );

      coopManager.checkForNewUnlocks(type);

      // Update panel visibility based on created animals
      updatePanelVisibility();

      // Update background music based on new animals
      audioManager.updateBackgroundMusic();

      return true;
    }
  }

  // Play invalid action sound if grid is full
  audioManager.playSound("invalid-action");
  updateStatus("No available space! Purchase more grid squares! 🌱");
  return false;
}

function buyAnimal(type, cost) {
  console.log(`buyAnimal called with type: ${type}, cost: ${cost}`);
  console.log(
    `gameState.eggButtonClicked before: ${gameState.eggButtonClicked}`
  );

  trackPlayerInteraction(); // Track interaction

  if (gameState.money >= cost) {
    gameState.money -= cost;

    // Mark egg button as clicked if this is an egg purchase
    if (type === "Egg" && !gameState.eggButtonClicked) {
      console.log("Setting eggButtonClicked to true and stopping animation");
      gameState.eggButtonClicked = true;
      eventManager.stopInitialEggButtonAnimation();
      coopManager.updateBuyAnimalButtons(); // Update button states
    }

    if (placeAnimal(type)) {
      updateMoney();
      const animalConfig = GAME_CONFIG.animalTypes[type];
      updateStatus(`Bought and placed ${animalConfig.name}`);
      saveManager.saveOnAction(); // Save after buying animal

      // Check achievements after buying animal
      achievementManager.checkAchievements();
    }
  } else {
    // Play invalid action sound for insufficient funds
    audioManager.playSound("invalid-action");
    const animalConfig = GAME_CONFIG.animalTypes[type];
    updateStatus(`Not enough money for ${animalConfig.name}! 😕`);
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 500);
  }
}

function sellAnimal(i, j, type) {
  trackPlayerInteraction(); // Track interaction
  if (gameState.slaughterHouses.length > 0) {
    slaughterHouseManager.addAnimalToQueue(0, type, i, j);
  }
}

function mergeAnimals(sourceI, sourceJ, targetI, targetJ) {
  trackPlayerInteraction(); // Track interaction

  const sourceType = gameState.grid[sourceI][sourceJ];
  const newType = GAME_CONFIG.animalTypes[sourceType].mergeTo;

  // Play manual merge sound
  audioManager.playSound("manual-merge");

  const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
  const explosion = document.createElement("div");
  explosion.textContent = "✨";
  explosion.classList.add("merge-explosion", "absolute", "text-4xl");
  explosion.style.left = "50%";
  explosion.style.top = "50%";
  explosion.style.transform = "translate(-50%, -50%)";
  sourceCell.appendChild(explosion);

  setTimeout(
    () => explosion.remove(),
    GAME_CONFIG.animationConfig.mergeExplosionDuration
  );

  gameState.grid[sourceI][sourceJ] = null;
  gameState.grid[targetI][targetJ] = newType;
  gameState.createdAnimals.add(newType);

  // FIX: Check for coop leveling when eggs are merged
  coopManager.checkCoopLevelUp(sourceType);

  updateAnimalValues();
  gridManager.updateCell(sourceI, sourceJ);
  gridManager.updateCell(targetI, targetJ);
  updateMergeablePairs();

  const targetCell = document.getElementById(`cell-${targetI}-${targetJ}`);
  // Removed the spawn animation

  eventManager.createParticles(targetCell);
  coopManager.checkForNewUnlocks(newType);

  // Update panel visibility based on created animals
  updatePanelVisibility();

  // Update background music based on new animals
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

  saveManager.saveOnAction(); // Save after merging

  // Check achievements after merging
  achievementManager.checkAchievements();
}

function updatePanelVisibility() {
  // Update slaughter house visibility
  slaughterHouseManager.updateVisibility();

  // Update farm building visibility
  coopManager.updatePanelVisibility();
}

function updateMoney() {
  const moneyElement = document.getElementById("money");
  moneyElement.textContent = `Money: 💰${gameState.money}`;
  moneyElement.classList.add("updated");
  setTimeout(() => moneyElement.classList.remove("updated"), 500);

  // Check achievements when money changes
  achievementManager.checkAchievements();
}

function updateStatus(message) {
  const statusElement = document.getElementById("status");
  statusElement.textContent = message;
  statusElement.classList.add("bounce-in");
  setTimeout(() => statusElement.classList.remove("bounce-in"), 600);
}

function updateAnimalValues() {}

function startGameTimers() {
  setInterval(() => {
    coopManager.updateCoopTimers();
    coopManager.updatePlaceButtonStates();
    slaughterHouseManager.updateSlaughterHouseTimers();
  }, 1000);

  setInterval(() => {
    coopManager.updateAutoMergeTimer();
  }, 100);
}

// Initialize the game when page loads, but start with loading screen
document.addEventListener("DOMContentLoaded", () => {
  loadingManager.showLoadingScreen();
});
