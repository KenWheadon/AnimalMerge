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
};

// Main initialization function
function initializeGame() {
  // Initialize grid state
  gridManager.initializeGridState();

  // Inject HTML structure
  document.getElementById("gameContainer").innerHTML = generateMainHTML();

  // Initialize all managers
  gridManager.initializeGridEventListeners();
  eventManager.initializeSlaughterHouseEventListeners();
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
    <div class="game-container container mx-auto p-4 flex flex-col lg:flex-row lg:space-x-8">
        <!-- Main Game Area -->
        <div class="flex-1">
            <h1 class="text-5xl font-bold text-center mb-6">Animal Merge Farm 🐔</h1>
            
            <!-- Game Stats -->
            <div class="flex flex-col lg:flex-row justify-between items-center mb-6 space-y-4 lg:space-y-0 lg:space-x-4">
                <div class="flex flex-col space-y-2">
                    <div id="money" class="money-display">Money: 💰0</div>
                    <div id="status" class="status-display">Drag or click 'Buy Egg 🥚' to start!</div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-3">
                    <button id="buyEgg" class="enhanced-button buy-button px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all duration-200">
                        <i class="fas fa-egg mr-2"></i>Buy Egg 🥚 (Free)
                    </button>
                    <button id="buyChicken" class="enhanced-button buy-button px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all duration-200 hidden">
                        <i class="fas fa-drumstick-bite mr-2"></i>Buy Chicken 🐔 ($7)
                    </button>
                    <button id="buyRooster" class="enhanced-button buy-button px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all duration-200 hidden">
                        <i class="fas fa-feather mr-2"></i>Buy Rooster 🦃 ($20)
                    </button>
                </div>
            </div>

            <!-- Game Grid -->
            ${gridManager.generateGridHTML()}

            <!-- Coop Toggle -->
            <button id="toggleCoops" class="enhanced-button mt-6 px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all duration-200 w-full lg:w-auto">
                <i class="fas fa-chevron-down mr-2"></i>Show Farm Buildings
            </button>

            <!-- Coop Drawer -->
            <div id="coopDrawer" class="coop-drawer hidden mt-4">
                <div class="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 coop-panel p-6 rounded-2xl">
                    ${coopManager.generateCoopHTML()}
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <div class="mt-6 lg:mt-0 lg:w-64">
            <!-- Slaughter House -->
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-red-800 mb-3 text-center">🗡️ Slaughter House</h2>
                <div id="slaughterHouse" class="slaughter-house rounded-xl p-6 text-center font-bold text-red-800 h-36 flex items-center justify-center cursor-pointer relative">
                    <div class="z-10">Drag animals here to sell</div>
                </div>
            </div>

            <!-- Animal Values -->
            <div class="bg-white p-4 rounded-xl shadow-lg">
                <h3 class="text-lg font-bold text-green-800 mb-3">💰 Animal Values</h3>
                <ul id="animalValues" class="text-sm space-y-1"></ul>
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

function sellAnimal(i, j, type) {
  if (gameState.isSlaughterAnimating) return;
  gameState.isSlaughterAnimating = true;

  const price = GAME_CONFIG.animalTypes[type].sellPrice;
  gameState.money += price;
  gameState.grid[i][j] = null;
  gridManager.updateCell(i, j);
  updateMoney();
  updateMergeablePairs();

  // Enhanced slaughter animation
  const slaughterHouse = document.getElementById("slaughterHouse");
  const tempEmoji = document.createElement("div");
  tempEmoji.textContent = GAME_CONFIG.animalEmojis[type];
  tempEmoji.classList.add(
    "slaughter-anim",
    "absolute",
    "text-4xl",
    "font-bold"
  );
  tempEmoji.style.left = "50%";
  tempEmoji.style.top = "50%";
  tempEmoji.style.transform = "translate(-50%, -50%)";
  slaughterHouse.appendChild(tempEmoji);

  // Enhanced coin burst
  for (let k = 0; k < 8; k++) {
    const coin = document.createElement("div");
    coin.classList.add("coin-burst");
    coin.style.left = `${Math.random() * 60 + 20}%`;
    coin.style.top = `${Math.random() * 60 + 20}%`;
    slaughterHouse.appendChild(coin);
    setTimeout(() => coin.remove(), 1000);
  }

  // Floating money number
  eventManager.showFloatingNumber(`+💰${price}`, slaughterHouse);

  setTimeout(() => {
    tempEmoji.remove();
    gameState.isSlaughterAnimating = false;
  }, GAME_CONFIG.animationConfig.slaughterAnimationDuration);

  updateStatus(`Sold ${GAME_CONFIG.animalEmojis[type]} for 💰${price}!`);
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
  const animalValues = document.getElementById("animalValues");
  animalValues.innerHTML = "";

  if (gameState.createdAnimals.size === 0) {
    const li = document.createElement("li");
    li.textContent = "Create animals to see sell values!";
    li.className = "text-gray-500 italic";
    animalValues.appendChild(li);
    return;
  }

  for (const [type, { sellPrice }] of Object.entries(GAME_CONFIG.animalTypes)) {
    if (sellPrice > 0 && gameState.createdAnimals.has(type)) {
      const li = document.createElement("li");
      li.innerHTML = `<span class="font-semibold">${GAME_CONFIG.animalEmojis[type]} ${type}:</span> <span class="text-yellow-600 font-bold">💰${sellPrice}</span>`;
      li.className =
        "p-2 bg-yellow-50 rounded-lg border border-yellow-200 mb-1";
      animalValues.appendChild(li);
    }
  }
}

function toggleCoops() {
  const drawer = document.getElementById("coopDrawer");
  drawer.classList.toggle("hidden");
  document.getElementById("toggleCoops").innerHTML = drawer.classList.contains(
    "hidden"
  )
    ? '<i class="fas fa-chevron-down mr-2"></i>Show Farm Buildings'
    : '<i class="fas fa-chevron-up mr-2"></i>Hide Farm Buildings';
}

// Game Timer Functions
function startGameTimers() {
  setInterval(() => {
    coopManager.updateCoopTimers();
    coopManager.updateAutoMergeTimer();
    coopManager.updatePlaceButtonStates();
  }, 1000);
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeGame);
