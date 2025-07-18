// Game State
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
  autoMerge: {
    owned: false,
    level: 1,
    baseInterval: 10,
    currentInterval: 10,
    timer: 10,
  },
  slaughterHouses: [],
};

// Main initialization function
function initializeGame() {
  // Initialize grid state
  gridManager.initializeGridState();

  // Initialize slaughter houses FIRST
  slaughterHouseManager.initializeSlaughterHouses();

  // Initialize dynamic coop states
  coopManager.initializeCoopStates();

  // Inject HTML structure
  document.getElementById("gameContainer").innerHTML = generateMainHTML();

  // Initialize all managers
  gridManager.initializeGridEventListeners();
  slaughterHouseManager.initializeSlaughterHouseEventListeners();
  coopManager.initializeFarmBuildingEventListeners();
  eventManager.initializeButtonEventListeners();

  // Initialize game state
  updateAnimalValues();
  updateMergeablePairs();
  updateStatus(
    `Start with initial grid spots! Click 🌱 grass squares to expand!`
  );

  // Set up grass cells for unpurchased cells
  GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
    if (cost > 0) {
      gridManager.setupGrassCell(row, col, cost);
    }
  });

  // Start game loops
  startGameTimers();
  eventManager.startWiggleAnimation();
}

// Generate main HTML structure
function generateMainHTML() {
  return `
    <div class="game-container flex h-screen">
        <!-- Left Panel - Buy Options -->
        <div class="w-64 bg-white shadow-lg flex flex-col">
            <!-- Money Display -->
            <div class="p-4 border-b">
                <div id="money" class="money-display text-center">Money: 💰${
                  gameState.money
                }</div>
                <!-- Status Display with Fixed Height -->
                <div class="mt-6">
                    <div id="status" class="status-display text-sm h-16 flex items-center justify-center">Drag or click 'Buy Egg 🥚' to start!</div>
                </div>
            </div>
            
            <!-- Buy Buttons with overflow auto -->
            <div class="flex-1 overflow-y-auto p-4">
                <h3 class="text-lg font-bold text-green-800 mb-4">🛒 Buy Animals</h3>
                <div class="space-y-3">
                    ${coopManager.generateBuyAnimalButtons()}
                </div>
            </div>
        </div>

        <!-- Main Game Area -->
        <div class="flex flex-col">
            <!-- Slaughter Houses -->
            <div class="p-3 bg-gray-50 border-b">
                <div id="slaughterHousesContainer">
                    ${slaughterHouseManager.generateSlaughterHouseHTML()}
                </div>
            </div>

            <!-- Game Grid -->
            <div class="p-4 overflow-auto">
                <div class="flex justify-center">
                    ${gridManager.generateGridHTML()}
                </div>
            </div>
            
            <!-- Auto-Merge -->
            <div class="flex-shrink-0 bg-white m-4 p-4 rounded-xl shadow-lg min-w-[220px]">
                <h3 class="text-lg font-bold text-purple-800 mb-2">⚙️ Auto-Merge</h3>
                <div class="space-y-2 text-sm">
                    <p id="autoMergeLevel" class="font-semibold">Level: 1</p>
                    <p id="autoMergeTimer" class="timer-display">Check Interval: 10s</p>
                    <!-- Progress Bar Container -->
                    <div id="autoMergeProgressContainer" class="hidden">
                        <div class="coop-progress-container">
                            <div class="coop-progress-label">Next Auto-Merge</div>
                            <div class="coop-progress-bar">
                                <div id="autoMergeProgress" class="coop-progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 space-y-2">
                    <button id="buyAutoMerge" class="enhanced-button px-3 py-2 rounded-lg font-bold text-white text-sm" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed);">
                        <i class="fas fa-cogs mr-1"></i>Buy Auto-Merge ($1)
                    </button>
                    <button id="upgradeAutoMerge" class="enhanced-button upgrade-button px-3 py-2 rounded-lg font-bold text-white text-sm hidden">
                        <i class="fas fa-arrow-up mr-1"></i>Upgrade Auto-Merge ($5)
                    </button>
                </div>
            </div>
        </div>

        <!-- Right Panel - Farm Buildings -->
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

// Game Logic Functions
function updateMergeablePairs() {
  console.log("🔍 UPDATING MERGEABLE PAIRS...");
  gameState.mergeablePairs = [];
  const neighbors = [
    { di: 0, dj: 1 }, // Right
    { di: 1, dj: 0 }, // Down
    { di: 0, dj: -1 }, // Left
    { di: -1, dj: 0 }, // Up
  ];

  console.log("Current grid state:");
  for (let i = 0; i < gameState.grid.length; i++) {
    console.log(`Row ${i}:`, gameState.grid[i]);
  }

  GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
    if (
      gameState.purchasedCells.has(`${i}-${j}`) &&
      gameState.grid[i][j] &&
      GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
    ) {
      console.log(
        `Checking cell ${i}-${j}: ${gameState.grid[i][j]} (can merge to ${
          GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo
        })`
      );

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
          console.log(
            `Found matching neighbor at ${ni}-${nj}: ${gameState.grid[ni][nj]}`
          );

          // Only add unique pairs (avoid duplicates)
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
            console.log(`➕ Adding mergeable pair: ${i}-${j} + ${ni}-${nj}`);
            gameState.mergeablePairs.push({
              source: { i, j },
              target: { i: ni, j: nj },
            });
          } else {
            console.log(`⚠️ Pair already exists: ${i}-${j} + ${ni}-${nj}`);
          }
        }
      }
    }
  });

  console.log("Final mergeable pairs:", gameState.mergeablePairs);
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
      updateMergeablePairs(); // Update mergeable pairs after placing animal

      // Enhanced spawn animation
      const cell = document.getElementById(`cell-${i}-${j}`);
      cell.classList.add("new-animal-spawn");
      setTimeout(
        () => cell.classList.remove("new-animal-spawn"),
        GAME_CONFIG.animationConfig.spawnAnimationDuration
      );

      // Create particles
      eventManager.createParticles(cell);

      const animalType = GAME_CONFIG.animalTypes[type];
      updateStatus(
        gameState.createdAnimals.size === 1 && animalType.sellPrice > 0
          ? `${GAME_CONFIG.animalEmojis[type]} created! You can sell it for 💰${animalType.sellPrice}`
          : `Placed ${GAME_CONFIG.animalEmojis[type]}`
      );

      // Check for new unlocks
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
      updateStatus(`Bought and placed ${GAME_CONFIG.animalEmojis[type]}`);
    }
  } else {
    updateStatus(`Not enough money for ${GAME_CONFIG.animalEmojis[type]}! 😕`);
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 500);
  }
}

// Legacy sell function (kept for grid click functionality)
function sellAnimal(i, j, type) {
  // Use the first available slaughter house
  if (gameState.slaughterHouses.length > 0) {
    slaughterHouseManager.addAnimalToQueue(0, type, i, j);
  }
}

function mergeAnimals(sourceI, sourceJ, targetI, targetJ) {
  const newType =
    GAME_CONFIG.animalTypes[gameState.grid[targetI][targetJ]].mergeTo;

  // Create merge explosion at source
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

  // Update grid
  gameState.grid[sourceI][sourceJ] = null;
  gameState.grid[targetI][targetJ] = newType;
  gameState.createdAnimals.add(newType);

  updateAnimalValues();
  gridManager.updateCell(sourceI, sourceJ);
  gridManager.updateCell(targetI, targetJ);
  updateMergeablePairs(); // Update mergeable pairs after merging

  // Enhanced target animation
  const targetCell = document.getElementById(`cell-${targetI}-${targetJ}`);
  targetCell.classList.add("new-animal-spawn");
  setTimeout(
    () => targetCell.classList.remove("new-animal-spawn"),
    GAME_CONFIG.animationConfig.spawnAnimationDuration
  );

  // Create particles
  eventManager.createParticles(targetCell);

  // Check for unlocks
  coopManager.checkForNewUnlocks(newType);

  const sellPrice = GAME_CONFIG.animalTypes[newType].sellPrice;
  updateStatus(
    sellPrice > 0
      ? `Merged into ${GAME_CONFIG.animalEmojis[newType]}! You can sell it for 💰${sellPrice}`
      : `Merged into ${GAME_CONFIG.animalEmojis[newType]}!`
  );
}

// UI Update Functions
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

function updateAnimalValues() {
  // This function is now primarily for maintaining compatibility
  // Animal values are shown in slaughter house tooltips
}

// Game Timer Functions
function startGameTimers() {
  // Use 100ms intervals for more precise timing
  setInterval(() => {
    coopManager.updateCoopTimers();
    coopManager.updatePlaceButtonStates();
    slaughterHouseManager.updateSlaughterHouseTimers();
  }, 1000);

  // Separate timer for auto-merge with higher precision
  setInterval(() => {
    coopManager.updateAutoMergeTimer();
  }, 100); // 100ms intervals for precise timing
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeGame);
