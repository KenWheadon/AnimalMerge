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
  previousMergeablePairs: [], // Track previous pairs to detect new ones
  totalSlaughtered: 0,
  eggButtonClicked: false, // Track if egg button has been clicked
  autoMerge: {
    owned: false,
    level: 1,
    baseInterval: 10,
    currentInterval: 10,
    timer: 10,
    enabled: true,
  },
  shuffle: {
    owned: false,
    enabled: true,
  },
  slaughterHouses: [],
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
          <h2 class="tutorial-title">Welcome to Animal Merge Farm!</h2>
          <div class="tutorial-instructions">
            <p><strong>🥚 Start with Eggs:</strong> Buy and place eggs on your grid to begin!</p>
            <p><strong>🔄 Merge Everything:</strong> Merge 2 of the same thing to upgrade it!</p>
            <p><strong>💰 Make Money:</strong> Sell animations by dragging them to the butcher shop!</p>
            <p><strong>🏡 Build Coops:</strong> Unlock coops to automatically generate better eggs!</p>
            <p><strong>⚙️ Automate:</strong> Buy auto-merge to automatically combine animals and eggs!</p>
          </div>
          <button id="startFarming" class="tutorial-start-btn">Get Farming!</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  const closeBtn = document.getElementById("closeTutorial");
  const startBtn = document.getElementById("startFarming");

  const closeTutorial = () => {
    popup.remove();
  };

  closeBtn.addEventListener("click", closeTutorial);
  startBtn.addEventListener("click", closeTutorial);
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      closeTutorial();
    }
  });
}

function initializeGame() {
  gridManager.initializeGridState();
  slaughterHouseManager.initializeSlaughterHouses();
  coopManager.initializeCoopStates();

  document.getElementById("gameContainer").innerHTML = generateMainHTML();

  gridManager.initializeGridEventListeners();
  slaughterHouseManager.initializeSlaughterHouseEventListeners();
  coopManager.initializeFarmBuildingEventListeners();
  eventManager.initializeButtonEventListeners();

  updateAnimalValues();
  updateMergeablePairs();
  coopManager.updateEmptyMessageVisibility(); // Initialize empty state message
  updateStatus(
    `Start with initial grid spots! Click 🌱 grass squares to expand!`
  );

  GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
    if (cost > 0) {
      gridManager.setupGrassCell(row, col, cost);
    }
  });

  startGameTimers();

  // Add initial egg button animation
  eventManager.startInitialEggButtonAnimation();

  showTutorialPopup();
}

function generateMainHTML() {
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
                            <span id="autoMergeLevel" class="text-xs text-gray-600">Lv.1</span>
                        </div>
                        <div class="space-y-1 text-xs mb-1">
                            <div class="flex justify-between">
                                <span>Interval:</span>
                                <span id="autoMergeTimer" class="font-mono">10.0s</span>
                            </div>
                            <div id="autoMergeProgress" class="text-gray-500">0/6 animals slaughtered</div>
                        </div>
                        <div id="autoMergeProgressContainer" class="mb-2 hidden">
                            <div class="coop-progress-bar h-1">
                                <div id="autoMergeProgressBar" class="coop-progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="space-y-1">
                            <button id="buyAutoMerge" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed);">
                                Buy ($1)
                            </button>
                            <button id="autoMergeToggle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white hidden bg-green-500">
                                🔵 ON
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
                            <button id="buyShuffle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white" style="background: linear-gradient(145deg, #f59e0b, #d97706);">
                                Buy ($10)
                            </button>
                            <button id="shuffleToggle" class="enhanced-button w-full px-2 py-1 rounded text-xs font-bold text-white hidden bg-green-500">
                                🔵 ON
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
            <div class="p-4 border-b">
                <h2 class="text-xl font-bold text-green-800">🏭 Buildings</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-3">
                <div id="slaughterHouseContainer" class="mb-6">
                    ${slaughterHouseManager.generateSlaughterHouseHTML()}
                </div>
                <div class="space-y-4">
                    ${coopManager.generateCoopHTML()}
                </div>
            </div>
        </div>
    </div>
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

  // Removed the check for new mergeable pairs animation
}

function isGridFull() {
  return GAME_CONFIG.gridConfig.availableSpots.every(
    ({ row, col }) =>
      !gameState.purchasedCells.has(`${row}-${col}`) || gameState.grid[row][col]
  );
}

function placeAnimal(type) {
  console.log(`placeAnimal called with type: ${type}`);
  console.log(
    `gameState.eggButtonClicked in placeAnimal: ${gameState.eggButtonClicked}`
  );

  for (const { row: i, col: j } of GAME_CONFIG.gridConfig.availableSpots) {
    if (gameState.purchasedCells.has(`${i}-${j}`) && !gameState.grid[i][j]) {
      gameState.grid[i][j] = type;
      gameState.createdAnimals.add(type);
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

      return true;
    }
  }
  updateStatus("No available space! Purchase more grid squares! 🌱");
  return false;
}

function buyAnimal(type, cost) {
  console.log(`buyAnimal called with type: ${type}, cost: ${cost}`);
  console.log(
    `gameState.eggButtonClicked before: ${gameState.eggButtonClicked}`
  );

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
    }
  } else {
    const animalConfig = GAME_CONFIG.animalTypes[type];
    updateStatus(`Not enough money for ${animalConfig.name}! 😕`);
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 500);
  }
}

function sellAnimal(i, j, type) {
  if (gameState.slaughterHouses.length > 0) {
    slaughterHouseManager.addAnimalToQueue(0, type, i, j);
  }
}

function mergeAnimals(sourceI, sourceJ, targetI, targetJ) {
  const newType =
    GAME_CONFIG.animalTypes[gameState.grid[targetI][targetJ]].mergeTo;

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

document.addEventListener("DOMContentLoaded", initializeGame);
