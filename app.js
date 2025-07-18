// Game State
let gameState = {
  money: 0,
  grid: [],
  purchasedCells: new Set(),
  selectedCell: null,
  draggedCell: null,
  isSlaughterAnimating: false,
  hasChicken: false,
  hasRooster: false,
  createdAnimals: new Set(),
  recentlyAnimatedCells: [],
  mergeablePairs: [],
  chickenCoop: { owned: false, level: 1, baseTime: 60, timer: 60, stored: 0 },
  roosterCoop: { owned: false, level: 1, baseTime: 120, timer: 120, stored: 0 },
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

  // Debug log to check if slaughter house is initialized
  console.log("Slaughter houses initialized:", gameState.slaughterHouses);

  // Inject HTML structure
  document.getElementById("gameContainer").innerHTML = generateMainHTML();

  // Initialize all managers
  gridManager.initializeGridEventListeners();
  slaughterHouseManager.initializeSlaughterHouseEventListeners();
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
            </div>
            
            <!-- Buy Buttons -->
            <div class="flex-1 overflow-y-auto p-4">
                <h3 class="text-lg font-bold text-green-800 mb-4">🛒 Buy Animals</h3>
                <div class="space-y-3">
                    <button id="buyEgg" class="enhanced-button buy-button w-full px-4 py-3 rounded-xl shadow-lg font-bold text-white">
                        <i class="fas fa-egg mr-2"></i>Buy Egg 🥚 (Free)
                    </button>
                    <button id="buyChicken" class="enhanced-button buy-button w-full px-4 py-3 rounded-xl shadow-lg font-bold text-white hidden">
                        <i class="fas fa-drumstick-bite mr-2"></i>Buy Chicken 🐔 ($7)
                    </button>
                    <button id="buyRooster" class="enhanced-button buy-button w-full px-4 py-3 rounded-xl shadow-lg font-bold text-white hidden">
                        <i class="fas fa-feather mr-2"></i>Buy Rooster 🦃 ($20)
                    </button>
                </div>
                
                <!-- Status Display -->
                <div class="mt-6">
                    <div id="status" class="status-display text-sm">Drag or click 'Buy Egg 🥚' to start!</div>
                </div>
            </div>
        </div>

        <!-- Main Game Area -->
        <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="p-4 bg-white shadow-sm">
                <h1 class="text-4xl font-bold text-center">Animal Merge Farm 🐔</h1>
            </div>

            <!-- Slaughter Houses -->
            <div class="p-4 bg-gray-50 border-b">
                <h2 class="text-xl font-bold text-red-800 mb-3">🗡️ Slaughter Houses</h2>
                <div id="slaughterHousesContainer">
                    ${slaughterHouseManager.generateSlaughterHouseHTML()}
                </div>
            </div>

            <!-- Game Grid -->
            <div class="flex-1 p-4 overflow-auto">
                <div class="flex justify-center">
                    ${gridManager.generateGridHTML()}
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
  gameState.mergeablePairs = [];
  const neighbors = [
    { di: 0, dj: 1 }, // Right
    { di: 1, dj: 0 }, // Down
    { di: 0, dj: -1 }, // Left
    { di: -1, dj: 0 }, // Up
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
          gameState.mergeablePairs.push({
            source: { i, j },
            target: { i: ni, j: nj },
          });
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
  updateMergeablePairs();

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
  if (newType === "Chicken" && !gameState.hasChicken) {
    gameState.hasChicken = true;
    coopManager.updateCoopVisibility();
    eventManager.showAchievement("🐔 Chicken Coop Unlocked!");
    updateStatus(
      `Merged into ${GAME_CONFIG.animalEmojis[newType]}. Unlocked Chicken Coop!`
    );
  } else if (newType === "Rooster" && !gameState.hasRooster) {
    gameState.hasRooster = true;
    coopManager.updateCoopVisibility();
    eventManager.showAchievement("🦃 Rooster Coop Unlocked!");
    updateStatus(
      `Merged into ${GAME_CONFIG.animalEmojis[newType]}. Unlocked Rooster Coop!`
    );
  } else {
    const sellPrice = GAME_CONFIG.animalTypes[newType].sellPrice;
    updateStatus(
      sellPrice > 0
        ? `Merged into ${GAME_CONFIG.animalEmojis[newType]}! You can sell it for 💰${sellPrice}`
        : `Merged into ${GAME_CONFIG.animalEmojis[newType]}!`
    );
  }
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
  setInterval(() => {
    coopManager.updateCoopTimers();
    coopManager.updateAutoMergeTimer();
    coopManager.updatePlaceButtonStates();
    slaughterHouseManager.updateSlaughterHouseTimers();
  }, 1000);
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeGame);
