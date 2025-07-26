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
  totalSlaughtered: 0,
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
            <p><strong>🔄 Merge Animals:</strong> Drag identical animals together to create new species!</p>
            <p><strong>💰 Make Money:</strong> Drag animals to slaughter houses to sell them!</p>
            <p><strong>🏡 Build Coops:</strong> Unlock coops to automatically generate animals!</p>
            <p><strong>⚙️ Automate:</strong> Buy auto-merge to automatically combine animals!</p>
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
  updateStatus(
    `Start with initial grid spots! Click 🌱 grass squares to expand!`
  );

  GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
    if (cost > 0) {
      gridManager.setupGrassCell(row, col, cost);
    }
  });

  startGameTimers();
  eventManager.startWiggleAnimation();

  showTutorialPopup();
}

function generateMainHTML() {
  return `
    <div class="game-container flex h-screen">
        <div class="w-64 bg-white shadow-lg flex flex-col">
            <div class="p-4 border-b">
                <div id="money" class="money-display text-center">Money: 💰${
                  gameState.money
                }</div>
                <div class="mt-6">
                    <div id="status" class="status-display text-sm h-16 flex items-center justify-center">Drag or click 'Buy Egg 🥚' to start!</div>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4">
                <h3 class="text-lg font-bold text-green-800 mb-4">🛒 Buy Animals</h3>
                <div class="space-y-3">
                    ${coopManager.generateBuyAnimalButtons()}
                </div>
            </div>
        </div>

        <div class="flex flex-col">
            <div class="p-3 bg-gray-50 border-b">
                <div id="slaughterHousesContainer">
                    ${slaughterHouseManager.generateSlaughterHouseHTML()}
                </div>
            </div>

            <div class="p-4 overflow-auto">
                <div class="flex justify-center">
                    ${gridManager.generateGridHTML()}
                </div>
            </div>
            
            <div class="flex-shrink-0 bg-white m-4 p-4 rounded-xl shadow-lg">
                <div class="flex space-x-6">
                    <div class="flex-1 min-w-[220px]">
                        <h3 class="text-lg font-bold text-purple-800 mb-2">⚙️ Auto-Merge</h3>
                        <div class="space-y-2 text-sm">
                            <p id="autoMergeLevel" class="font-semibold">Level: 1</p>
                            <p id="autoMergeTimer" class="timer-display">Check Interval: 10s</p>
                            <p id="autoMergeProgress" class="text-xs text-gray-600">Progress: 0/6 animals slaughtered</p>
                            <div id="autoMergeProgressContainer" class="hidden">
                                <div class="coop-progress-container">
                                    <div class="coop-progress-label">Next Auto-Merge</div>
                                    <div class="coop-progress-bar">
                                        <div id="autoMergeProgressBar" class="coop-progress-fill" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 space-y-2">
                            <button id="buyAutoMerge" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm w-full" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed);">
                                <i class="fas fa-cogs mr-1"></i>Auto-Merge ($1)
                            </button>
                            <button id="autoMergeToggle" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm w-full hidden bg-green-500">
                                🔵 ON
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 min-w-[220px]">
                        <h3 class="text-lg font-bold text-orange-800 mb-2">🔀 Shuffle</h3>
                        <div class="space-y-2 text-sm">
                            <p class="font-semibold">Shuffles after Auto-Merge</p>
                            <p class="text-xs text-gray-600">Automatically rearranges animals on grid</p>
                        </div>
                        <div class="mt-4 space-y-2">
                            <button id="buyShuffle" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm w-full" style="background: linear-gradient(145deg, #f59e0b, #d97706);">
                                <i class="fas fa-random mr-1"></i>Shuffle ($10)
                            </button>
                            <button id="shuffleToggle" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm w-full hidden bg-green-500">
                                🔵 ON
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="w-80 bg-white shadow-lg flex flex-col">
            <div class="p-4 border-b">
                <h2 class="text-xl font-bold text-green-800">🏡 Farm Buildings</h2>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
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

    document.getElementById(
      "autoMergeLevel"
    ).textContent = `Level: ${newLevel}`;
    document.getElementById(
      "autoMergeTimer"
    ).textContent = `Check Interval: ${gameState.autoMerge.currentInterval.toFixed(
      1
    )}s`;

    eventManager.showAchievement(`🆙 Auto-Merge Level ${newLevel}!`);
    updateStatus(`Auto-Merge upgraded to level ${newLevel}! 🆙`);
  }

  const nextRequirement = getNextAutoMergeRequirement(
    gameState.autoMerge.level
  );
  document.getElementById(
    "autoMergeProgress"
  ).textContent = `Progress: ${gameState.totalSlaughtered}/${nextRequirement} animals slaughtered`;
}

function updateMergeablePairs() {
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
}

function isGridFull() {
  return GAME_CONFIG.gridConfig.availableSpots.every(
    ({ row, col }) =>
      !gameState.purchasedCells.has(`${row}-${col}`) || gameState.grid[row][col]
  );
}

function placeAnimal(type) {
  for (const { row: i, col: j } of GAME_CONFIG.gridConfig.availableSpots) {
    if (gameState.purchasedCells.has(`${i}-${j}`) && !gameState.grid[i][j]) {
      gameState.grid[i][j] = type;
      gameState.createdAnimals.add(type);
      updateAnimalValues();
      gridManager.updateCell(i, j);
      updateMergeablePairs();

      const cell = document.getElementById(`cell-${i}-${j}`);
      cell.classList.add("new-animal-spawn");
      setTimeout(
        () => cell.classList.remove("new-animal-spawn"),
        GAME_CONFIG.animationConfig.spawnAnimationDuration
      );

      eventManager.createParticles(cell);

      const animalType = GAME_CONFIG.animalTypes[type];
      updateStatus(
        gameState.createdAnimals.size === 1 && animalType.sellPrice > 0
          ? `${type} created! You can sell it for 💰${animalType.sellPrice}`
          : `Placed ${type}`
      );

      coopManager.checkForNewUnlocks(type);

      return true;
    }
  }
  updateStatus("No available space! Purchase more grid squares! 🌱");
  return false;
}

function buyAnimal(type, cost) {
  if (gameState.money >= cost) {
    gameState.money -= cost;
    if (placeAnimal(type)) {
      updateMoney();
      updateStatus(`Bought and placed ${type}`);
    }
  } else {
    updateStatus(`Not enough money for ${type}! 😕`);
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
  targetCell.classList.add("new-animal-spawn");
  setTimeout(
    () => targetCell.classList.remove("new-animal-spawn"),
    GAME_CONFIG.animationConfig.spawnAnimationDuration
  );

  eventManager.createParticles(targetCell);
  coopManager.checkForNewUnlocks(newType);

  if (newType === "EndDemoAnimal") {
    eventManager.showDemoEndedPopup();
  }

  const sellPrice = GAME_CONFIG.animalTypes[newType].sellPrice;
  updateStatus(
    sellPrice > 0
      ? `Merged into ${newType}! You can sell it for 💰${sellPrice}`
      : `Merged into ${newType}!`
  );
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
