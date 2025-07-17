// Game State
let gameState = {
    money: 0,
    grid: Array(3).fill().map(() => Array(3).fill(null)),
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
    autoMerge: { owned: false, level: 1, baseInterval: 10, currentInterval: 10, timer: 10 }
};

// HTML Structure
const HTML_STRUCTURE = `
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
                        <i class="fas fa-drumstick-bite mr-2"></i>Buy Chicken 🐔 ($3)
                    </button>
                    <button id="buyRooster" class="enhanced-button buy-button px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all duration-200 hidden">
                        <i class="fas fa-feather mr-2"></i>Buy Rooster 🦃 ($5)
                    </button>
                </div>
            </div>

            <!-- Game Grid -->
            <div class="game-grid grid grid-cols-3 gap-3 w-80 h-80 p-4 rounded-2xl mx-auto">
                <div id="cell-0-0" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-0-1" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-0-2" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-1-0" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-1-1" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-1-2" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-2-0" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-2-1" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
                <div id="cell-2-2" class="grid-cell rounded-xl flex items-center justify-center text-5xl cursor-pointer" draggable="true"></div>
            </div>

            <!-- Coop Toggle -->
            <button id="toggleCoops" class="enhanced-button mt-6 px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all duration-200 w-full lg:w-auto">
                <i class="fas fa-chevron-down mr-2"></i>Show Farm Buildings
            </button>

            <!-- Coop Drawer -->
            <div id="coopDrawer" class="coop-drawer hidden mt-4">
                <div class="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 coop-panel p-6 rounded-2xl">
                    
                    <!-- Chicken Coop -->
                    <div id="chickenCoop" class="hidden flex-1 bg-white p-4 rounded-xl shadow-lg">
                        <h2 class="text-xl font-bold text-green-800 mb-2">🐔 Chicken Coop</h2>
                        <div class="space-y-2 text-sm">
                            <p id="chickenCoopLevel" class="font-semibold">Level: 1</p>
                            <p id="chickenCoopTimer" class="timer-display">Next Chicken 🐔: 60s</p>
                            <p id="chickenCoopStored" class="font-semibold">Stored: 0</p>
                        </div>
                        <div class="mt-4 space-y-2">
                            <button id="placeChicken" class="enhanced-button px-4 py-2 rounded-lg font-bold text-white hidden">
                                <i class="fas fa-plus mr-1"></i>Place Chicken 🐔
                            </button>
                            <button id="buyChickenCoop" class="enhanced-button buy-button px-4 py-2 rounded-lg font-bold text-white">
                                <i class="fas fa-home mr-1"></i>Buy Chicken Coop 🏡 ($10)
                            </button>
                            <button id="upgradeChickenCoop" class="enhanced-button upgrade-button px-4 py-2 rounded-lg font-bold text-white hidden">
                                <i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($3)
                            </button>
                        </div>
                    </div>

                    <!-- Chicken Coop Placeholder -->
                    <div id="chickenCoopPlaceholder" class="flex-1 bg-gray-200 opacity-50 p-4 rounded-xl" title="Merge to Chicken to unlock!">
                        <h2 class="text-xl font-semibold text-gray-600">🔒 Chicken Coop</h2>
                        <p class="text-sm text-gray-600 mt-2">Merge to Chicken to unlock!</p>
                    </div>

                    <!-- Rooster Coop -->
                    <div id="roosterCoop" class="hidden flex-1 bg-white p-4 rounded-xl shadow-lg">
                        <h2 class="text-xl font-bold text-green-800 mb-2">🦃 Rooster Coop</h2>
                        <div class="space-y-2 text-sm">
                            <p id="roosterCoopLevel" class="font-semibold">Level: 1</p>
                            <p id="roosterCoopTimer" class="timer-display">Next Rooster 🦃: 120s</p>
                            <p id="roosterCoopStored" class="font-semibold">Stored: 0</p>
                        </div>
                        <div class="mt-4 space-y-2">
                            <button id="placeRooster" class="enhanced-button px-4 py-2 rounded-lg font-bold text-white hidden">
                                <i class="fas fa-plus mr-1"></i>Place Rooster 🦃
                            </button>
                            <button id="buyRoosterCoop" class="enhanced-button buy-button px-4 py-2 rounded-lg font-bold text-white">
                                <i class="fas fa-home mr-1"></i>Buy Rooster Coop 🏡 ($50)
                            </button>
                            <button id="upgradeRoosterCoop" class="enhanced-button upgrade-button px-4 py-2 rounded-lg font-bold text-white hidden">
                                <i class="fas fa-arrow-up mr-1"></i>Upgrade Coop ($3)
                            </button>
                        </div>
                    </div>

                    <!-- Rooster Coop Placeholder -->
                    <div id="roosterCoopPlaceholder" class="flex-1 bg-gray-200 opacity-50 p-4 rounded-xl" title="Merge to Rooster to unlock!">
                        <h2 class="text-xl font-semibold text-gray-600">🔒 Rooster Coop</h2>
                        <p class="text-sm text-gray-600 mt-2">Merge to Rooster to unlock!</p>
                    </div>

                    <!-- Auto-Merge -->
                    <div class="flex-1 bg-white p-4 rounded-xl shadow-lg">
                        <h2 class="text-xl font-bold text-purple-800 mb-2">⚙️ Auto-Merge</h2>
                        <div class="space-y-2 text-sm">
                            <p id="autoMergeLevel" class="font-semibold">Level: 1</p>
                            <p id="autoMergeTimer" class="timer-display">Check Interval: 10s</p>
                            <p id="autoMergeCountdown" class="timer-display hidden">Next Auto-Merge: 10.0s</p>
                        </div>
                        <div class="mt-4 space-y-2">
                            <button id="buyAutoMerge" class="enhanced-button px-4 py-2 rounded-lg font-bold text-white" style="background: linear-gradient(145deg, #8b5cf6, #7c3aed);">
                                <i class="fas fa-cogs mr-1"></i>Buy Auto-Merge ($1)
                            </button>
                            <button id="upgradeAutoMerge" class="enhanced-button upgrade-button px-4 py-2 rounded-lg font-bold text-white hidden">
                                <i class="fas fa-arrow-up mr-1"></i>Upgrade Auto-Merge ($5)
                            </button>
                        </div>
                    </div>
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

// Initialize Game
function initializeGame() {
    // Inject HTML structure
    document.getElementById('gameContainer').innerHTML = HTML_STRUCTURE;
    
    // Initialize grid event listeners
    initializeGridEventListeners();
    
    // Initialize slaughter house event listeners
    initializeSlaughterHouseEventListeners();
    
    // Initialize button event listeners
    initializeButtonEventListeners();
    
    // Initialize game state
    updateAnimalValues();
    updateMergeablePairs();
    
    // Start game loops
    startGameTimers();
    startWiggleAnimation();
}

// Event Listeners
function initializeGridEventListeners() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.addEventListener('click', () => handleCellClick(i, j));
            cell.addEventListener('dragstart', (e) => handleDragStart(i, j, e));
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => handleDrop(i, j, e));
            cell.addEventListener('touchstart', (e) => handleTouchStart(i, j, e));
            cell.addEventListener('touchmove', (e) => handleTouchMove(e));
            cell.addEventListener('touchend', (e) => handleTouchEnd(i, j, e));
        }
    }
}

function initializeSlaughterHouseEventListeners() {
    const slaughterHouse = document.getElementById('slaughterHouse');
    slaughterHouse.addEventListener('dragover', (e) => {
        e.preventDefault();
        slaughterHouse.classList.add('drag-over');
    });
    slaughterHouse.addEventListener('dragleave', () => {
        slaughterHouse.classList.remove('drag-over');
    });
    slaughterHouse.addEventListener('drop', handleSlaughterDrop);
    slaughterHouse.addEventListener('touchmove', (e) => e.preventDefault());
    slaughterHouse.addEventListener('touchend', handleSlaughterTouchEnd);
}

function initializeButtonEventListeners() {
    document.getElementById('buyEgg').addEventListener('click', () => placeAnimal('Egg'));
    document.getElementById('buyChicken').addEventListener('click', () => buyAnimal('Chicken', GAME_CONFIG.purchaseConfig.chicken));
    document.getElementById('buyRooster').addEventListener('click', () => buyAnimal('Rooster', GAME_CONFIG.purchaseConfig.rooster));
    document.getElementById('buyChickenCoop').addEventListener('click', () => buyCoop('chicken'));
    document.getElementById('buyRoosterCoop').addEventListener('click', () => buyCoop('rooster'));
    document.getElementById('upgradeChickenCoop').addEventListener('click', () => upgradeCoop('chicken'));
    document.getElementById('upgradeRoosterCoop').addEventListener('click', () => upgradeCoop('rooster'));
    document.getElementById('placeChicken').addEventListener('click', () => placeStoredAnimal('Chicken'));
    document.getElementById('placeRooster').addEventListener('click', () => placeStoredAnimal('Rooster'));
    document.getElementById('buyAutoMerge').addEventListener('click', () => buyAutoMerge());
    document.getElementById('upgradeAutoMerge').addEventListener('click', () => upgradeAutoMerge());
    document.getElementById('toggleCoops').addEventListener('click', toggleCoops);
}

// Game Logic Functions
function updateMergeablePairs() {
    gameState.mergeablePairs = [];
    const neighbors = [
        { di: 0, dj: 1 }, // Right
        { di: 1, dj: 0 }  // Down
    ];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (gameState.grid[i][j] && GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo) {
                for (const { di, dj } of neighbors) {
                    const ni = i + di;
                    const nj = j + dj;
                    if (ni < 3 && nj < 3 && gameState.grid[ni][nj] === gameState.grid[i][j]) {
                        gameState.mergeablePairs.push({ source: { i, j }, target: { i: ni, j: nj } });
                    }
                }
            }
        }
    }
}

function isGridFull() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (!gameState.grid[i][j]) return false;
        }
    }
    return true;
}

function updatePlaceButtonStates() {
    document.getElementById('placeChicken').disabled = isGridFull() || gameState.chickenCoop.stored === 0;
    document.getElementById('placeRooster').disabled = isGridFull() || gameState.roosterCoop.stored === 0;
    
    if (!document.getElementById('placeChicken').disabled) {
        document.getElementById('placeChicken').classList.add('pulse');
    } else {
        document.getElementById('placeChicken').classList.remove('pulse');
    }
    
    if (!document.getElementById('placeRooster').disabled) {
        document.getElementById('placeRooster').classList.add('pulse');
    } else {
        document.getElementById('placeRooster').classList.remove('pulse');
    }
}

function placeAnimal(type) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (!gameState.grid[i][j]) {
                gameState.grid[i][j] = type;
                gameState.createdAnimals.add(type);
                updateAnimalValues();
                updateCell(i, j);
                updateMergeablePairs();
                
                // Enhanced spawn animation
                const cell = document.getElementById(`cell-${i}-${j}`);
                cell.classList.add('new-animal-spawn');
                setTimeout(() => cell.classList.remove('new-animal-spawn'), GAME_CONFIG.animationConfig.spawnAnimationDuration);
                
                // Create particles
                createParticles(cell);
                
                const animalType = GAME_CONFIG.animalTypes[type];
                updateStatus(gameState.createdAnimals.size === 1 && animalType.sellPrice > 0 
                    ? `${GAME_CONFIG.animalEmojis[type]} created! You can sell it for 💰${animalType.sellPrice}` 
                    : `Placed ${GAME_CONFIG.animalEmojis[type]}`);
                return true;
            }
        }
    }
    updateStatus('Grid is full! 😕');
    return false;
}

function placeStoredAnimal(type) {
    const coop = type === 'Chicken' ? gameState.chickenCoop : gameState.roosterCoop;
    if (coop.stored > 0 && placeAnimal(type)) {
        coop.stored -= 1;
        document.getElementById(`${type.toLowerCase()}CoopStored`).textContent = `Stored: ${coop.stored}`;
        if (coop.stored === 0) {
            document.getElementById(`place${type}`).classList.add('hidden');
            document.getElementById(`place${type}`).classList.remove('pulse');
        }
        updatePlaceButtonStates();
    } else {
        updateStatus('Grid is full! 😕');
    }
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
        // Screen shake for failure
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
}

// Cell Interaction Handlers
function handleCellClick(i, j) {
    if (gameState.draggedCell) return;
    const cell = document.getElementById(`cell-${i}-${j}`);
    if (!gameState.grid[i][j]) return;

    if (!gameState.selectedCell) {
        gameState.selectedCell = { i, j };
        cell.classList.add('bg-blue-200');
        clearAutoMergeHighlight();
        updateStatus(`Selected ${GAME_CONFIG.animalEmojis[gameState.grid[i][j]]}. Drag to Slaughter House to sell!`);
    } else {
        const prev = gameState.selectedCell;
        document.getElementById(`cell-${prev.i}-${prev.j}`).classList.remove('bg-blue-200');
        
        if (prev.i === i && prev.j === j) {
            // Sell animal
            const type = gameState.grid[i][j];
            if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
                sellAnimal(i, j, type);
            } else {
                updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
            }
        } else if (gameState.grid[prev.i][prev.j] === gameState.grid[i][j] && GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo) {
            // Merge animals
            mergeAnimals(prev.i, prev.j, i, j);
        } else {
            updateStatus('Cannot merge different or unmergeable animals! 😕');
        }
        gameState.selectedCell = null;
    }
}

function handleDragStart(i, j, e) {
    if (!gameState.grid[i][j]) return;
    gameState.draggedCell = { i, j };
    e.dataTransfer.setData('text/plain', JSON.stringify({ i, j }));
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add('drag-preview');
    clearAutoMergeHighlight();
    clearWiggleGlow();
    highlightValidTargets(i, j);
}

function handleDrop(i, j, e) {
    e.preventDefault();
    if (!gameState.draggedCell) return;
    const source = gameState.draggedCell;
    const sourceCell = document.getElementById(`cell-${source.i}-${source.j}`);
    sourceCell.classList.remove('drag-preview');
    clearValidTargets();
    
    if (gameState.grid[i][j] && gameState.grid[source.i][source.j] === gameState.grid[i][j] && GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo) {
        mergeAnimals(source.i, source.j, i, j);
    } else {
        updateStatus('Cannot merge here! 😕');
    }
    gameState.draggedCell = null;
}

function handleSlaughterDrop(e) {
    e.preventDefault();
    const slaughterHouse = document.getElementById('slaughterHouse');
    slaughterHouse.classList.remove('drag-over');
    if (!gameState.draggedCell || gameState.isSlaughterAnimating) return;
    
    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];
    
    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
        sellAnimal(i, j, type);
    } else {
        updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
    }
    
    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove('drag-preview');
    clearValidTargets();
    gameState.draggedCell = null;
}

function handleTouchStart(i, j, e) {
    e.preventDefault();
    if (!gameState.grid[i][j]) return;
    gameState.draggedCell = { i, j };
    const cell = document.getElementById(`cell-${i}-${j}`);
    cell.classList.add('drag-preview');
    clearAutoMergeHighlight();
    clearWiggleGlow();
    highlightValidTargets(i, j);
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(i, j, e) {
    e.preventDefault();
    if (!gameState.draggedCell) return;
    const source = gameState.draggedCell;
    const sourceCell = document.getElementById(`cell-${source.i}-${source.j}`);
    sourceCell.classList.remove('drag-preview');
    clearValidTargets();
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.id === 'slaughterHouse') {
        const type = gameState.grid[source.i][source.j];
        if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
            sellAnimal(source.i, source.j, type);
        } else {
            updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
        }
    } else if (gameState.grid[i][j] && gameState.grid[source.i][source.j] === gameState.grid[i][j] && GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo) {
        mergeAnimals(source.i, source.j, i, j);
    } else {
        updateStatus('Cannot merge or sell here! 😕');
    }
    gameState.draggedCell = null;
}

function handleSlaughterTouchEnd(e) {
    e.preventDefault();
    const slaughterHouse = document.getElementById('slaughterHouse');
    slaughterHouse.classList.remove('drag-over');
    if (!gameState.draggedCell || gameState.isSlaughterAnimating) return;
    
    const { i, j } = gameState.draggedCell;
    const type = gameState.grid[i][j];
    
    if (GAME_CONFIG.animalTypes[type].sellPrice > 0) {
        sellAnimal(i, j, type);
    } else {
        updateStatus(`${GAME_CONFIG.animalEmojis[type]} cannot be sold! 😕`);
    }
    
    const sourceCell = document.getElementById(`cell-${i}-${j}`);
    sourceCell.classList.remove('drag-preview');
    clearValidTargets();
    gameState.draggedCell = null;
}

// Game Action Functions
function sellAnimal(i, j, type) {
    if (gameState.isSlaughterAnimating) return;
    gameState.isSlaughterAnimating = true;
    
    const price = GAME_CONFIG.animalTypes[type].sellPrice;
    gameState.money += price;
    gameState.grid[i][j] = null;
    updateCell(i, j);
    updateMoney();
    updateMergeablePairs();
    
    // Enhanced slaughter animation
    const slaughterHouse = document.getElementById('slaughterHouse');
    const tempEmoji = document.createElement('div');
    tempEmoji.textContent = GAME_CONFIG.animalEmojis[type];
    tempEmoji.classList.add('slaughter-anim', 'absolute', 'text-4xl', 'font-bold');
    tempEmoji.style.left = '50%';
    tempEmoji.style.top = '50%';
    tempEmoji.style.transform = 'translate(-50%, -50%)';
    slaughterHouse.appendChild(tempEmoji);
    
    // Enhanced coin burst
    for (let k = 0; k < 8; k++) {
        const coin = document.createElement('div');
        coin.classList.add('coin-burst');
        coin.style.left = `${Math.random() * 60 + 20}%`;
        coin.style.top = `${Math.random() * 60 + 20}%`;
        slaughterHouse.appendChild(coin);
        setTimeout(() => coin.remove(), 1000);
    }
    
    // Floating money number
    showFloatingNumber(`+💰${price}`, slaughterHouse);
    
    setTimeout(() => {
        tempEmoji.remove();
        gameState.isSlaughterAnimating = false;
    }, GAME_CONFIG.animationConfig.slaughterAnimationDuration);
    
    updateStatus(`Sold ${GAME_CONFIG.animalEmojis[type]} for 💰${price}!`);
}

function mergeAnimals(sourceI, sourceJ, targetI, targetJ) {
    const newType = GAME_CONFIG.animalTypes[gameState.grid[targetI][targetJ]].mergeTo;
    
    // Create merge explosion at source
    const sourceCell = document.getElementById(`cell-${sourceI}-${sourceJ}`);
    const explosion = document.createElement('div');
    explosion.textContent = '✨';
    explosion.classList.add('merge-explosion', 'absolute', 'text-4xl');
    explosion.style.left = '50%';
    explosion.style.top = '50%';
    explosion.style.transform = 'translate(-50%, -50%)';
    sourceCell.appendChild(explosion);
    
    setTimeout(() => explosion.remove(), GAME_CONFIG.animationConfig.mergeExplosionDuration);
    
    // Update grid
    gameState.grid[sourceI][sourceJ] = null;
    gameState.grid[targetI][targetJ] = newType;
    gameState.createdAnimals.add(newType);
    
    updateAnimalValues();
    updateCell(sourceI, sourceJ);
    updateCell(targetI, targetJ);
    updateMergeablePairs();
    
    // Enhanced target animation
    const targetCell = document.getElementById(`cell-${targetI}-${targetJ}`);
    targetCell.classList.add('new-animal-spawn');
    setTimeout(() => targetCell.classList.remove('new-animal-spawn'), GAME_CONFIG.animationConfig.spawnAnimationDuration);
    
    // Create particles
    createParticles(targetCell);
    
    // Check for unlocks
    if (newType === 'Chicken' && !gameState.hasChicken) {
        gameState.hasChicken = true;
        updateCoopVisibility();
        showAchievement('🐔 Chicken Coop Unlocked!');
        updateStatus(`Merged into ${GAME_CONFIG.animalEmojis[newType]}. Unlocked Chicken Coop!`);
    } else if (newType === 'Rooster' && !gameState.hasRooster) {
        gameState.hasRooster = true;
        updateCoopVisibility();
        showAchievement('🦃 Rooster Coop Unlocked!');
        updateStatus(`Merged into ${GAME_CONFIG.animalEmojis[newType]}. Unlocked Rooster Coop!`);
    } else {
        const sellPrice = GAME_CONFIG.animalTypes[newType].sellPrice;
        updateStatus(sellPrice > 0 
            ? `Merged into ${GAME_CONFIG.animalEmojis[newType]}! You can sell it for 💰${sellPrice}` 
            : `Merged into ${GAME_CONFIG.animalEmojis[newType]}!`);
    }
}

// Coop Functions
function buyCoop(type) {
    const cost = GAME_CONFIG.coopConfig[type].buyCost;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        if (type === 'chicken') {
            gameState.chickenCoop.owned = true;
            document.getElementById('buyChickenCoop').classList.add('hidden');
            document.getElementById('buyChicken').classList.remove('hidden');
            document.getElementById('upgradeChickenCoop').classList.remove('hidden');
        } else {
            gameState.roosterCoop.owned = true;
            document.getElementById('buyRoosterCoop').classList.add('hidden');
            document.getElementById('buyRooster').classList.remove('hidden');
            document.getElementById('upgradeRoosterCoop').classList.remove('hidden');
        }
        updateMoney();
        showAchievement(`🏡 ${type.charAt(0).toUpperCase() + type.slice(1)} Coop Purchased!`);
        updateStatus(`Bought ${type} coop 🏡`);
    } else {
        updateStatus(`Not enough money for ${type} coop! 😕`);
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
}

function updateCoopVisibility() {
    if (gameState.hasChicken) {
        document.getElementById('chickenCoop').classList.remove('hidden');
        document.getElementById('chickenCoop').classList.add('bounce-in');
        document.getElementById('chickenCoopPlaceholder').classList.add('hidden');
    }
    if (gameState.hasRooster) {
        document.getElementById('roosterCoop').classList.remove('hidden');
        document.getElementById('roosterCoop').classList.add('bounce-in');
        document.getElementById('roosterCoopPlaceholder').classList.add('hidden');
    }
}

function upgradeCoop(type) {
    const coop = type === 'chicken' ? gameState.chickenCoop : gameState.roosterCoop;
    const cost = GAME_CONFIG.coopConfig[type].upgradeCostMultiplier * coop.level;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        coop.level += 1;
        coop.timer = GAME_CONFIG.coopConfig[type].baseTime * Math.pow(GAME_CONFIG.coopConfig[type].timeReductionFactor, coop.level - 1);
        document.getElementById(`${type}CoopLevel`).textContent = `Level: ${coop.level}`;
        document.getElementById(`${type}CoopTimer`).textContent = `Next ${type === 'chicken' ? 'Chicken 🐔' : 'Rooster 🦃'}: ${coop.timer.toFixed(1)}s`;
        document.getElementById(`upgrade${type.charAt(0).toUpperCase() + type.slice(1)}Coop`).innerHTML = `<i class="fas fa-arrow-up mr-1"></i>Upgrade Coop (${GAME_CONFIG.coopConfig[type].upgradeCostMultiplier * coop.level})`;
        updateMoney();
        showAchievement(`🆙 ${type.charAt(0).toUpperCase() + type.slice(1)} Coop Level ${coop.level}!`);
        updateStatus(`Upgraded ${type} coop to level ${coop.level} 🆙`);
    } else {
        updateStatus(`Not enough money to upgrade ${type} coop! 😕`);
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
}

// Auto-Merge Functions
function buyAutoMerge() {
    if (gameState.money >= GAME_CONFIG.autoMergeConfig.buyCost) {
        gameState.money -= GAME_CONFIG.autoMergeConfig.buyCost;
        gameState.autoMerge.owned = true;
        gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
        document.getElementById('buyAutoMerge').classList.add('hidden');
        document.getElementById('upgradeAutoMerge').classList.remove('hidden');
        document.getElementById('autoMergeCountdown').classList.remove('hidden');
        document.getElementById('autoMergeCountdown').textContent = `Next Auto-Merge: ${gameState.autoMerge.timer.toFixed(1)}s`;
        updateMoney();
        showAchievement('⚙️ Auto-Merge Activated!');
        updateStatus('Bought Auto-Merge ⚙️');
    } else {
        updateStatus('Not enough money for Auto-Merge! 😕');
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
}

function upgradeAutoMerge() {
    const cost = GAME_CONFIG.autoMergeConfig.upgradeCostMultiplier * gameState.autoMerge.level;
    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.autoMerge.level += 1;
        gameState.autoMerge.currentInterval = GAME_CONFIG.autoMergeConfig.baseInterval * Math.pow(GAME_CONFIG.autoMergeConfig.intervalReductionFactor, gameState.autoMerge.level - 1);
        gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
        document.getElementById('autoMergeLevel').textContent = `Level: ${gameState.autoMerge.level}`;
        document.getElementById('autoMergeTimer').textContent = `Check Interval: ${gameState.autoMerge.currentInterval.toFixed(1)}s`;
        document.getElementById('autoMergeCountdown').textContent = `Next Auto-Merge: ${gameState.autoMerge.timer.toFixed(1)}s`;
        document.getElementById('upgradeAutoMerge').innerHTML = `<i class="fas fa-arrow-up mr-1"></i>Upgrade Auto-Merge (${GAME_CONFIG.autoMergeConfig.upgradeCostMultiplier * gameState.autoMerge.level})`;
        updateMoney();
        showAchievement(`🆙 Auto-Merge Level ${gameState.autoMerge.level}!`);
        updateStatus(`Upgraded Auto-Merge to level ${gameState.autoMerge.level} 🆙`);
    } else {
        updateStatus('Not enough money to upgrade Auto-Merge! 😕');
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }
}

function autoMergeCheck() {
    clearAutoMergeHighlight();
    let mergedTypes = [];
    let mergesMade = false;
    
    for (const { source, target } of gameState.mergeablePairs) {
        if (gameState.grid[source.i][source.j] === gameState.grid[target.i][target.j] && GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo) {
            const newType = GAME_CONFIG.animalTypes[gameState.grid[target.i][target.j]].mergeTo;
            
            // Create merge explosion at source
            const sourceCell = document.getElementById(`cell-${source.i}-${source.j}`);
            const explosion = document.createElement('div');
            explosion.textContent = '⚙️';
            explosion.classList.add('merge-explosion', 'absolute', 'text-3xl');
            explosion.style.left = '50%';
            explosion.style.top = '50%';
            explosion.style.transform = 'translate(-50%, -50%)';
            sourceCell.appendChild(explosion);
            
            setTimeout(() => explosion.remove(), GAME_CONFIG.animationConfig.mergeExplosionDuration);
            
            gameState.grid[source.i][source.j] = null;
            gameState.grid[target.i][target.j] = newType;
            gameState.createdAnimals.add(newType);
            
            document.getElementById(`cell-${source.i}-${source.j}`).classList.add('border-green-500', 'border-2');
            document.getElementById(`cell-${target.i}-${target.j}`).classList.add('border-green-500', 'border-2', 'new-animal-spawn');
            
            updateCell(source.i, source.j);
            updateCell(target.i, target.j);
            
            // Create particles
            createParticles(document.getElementById(`cell-${target.i}-${target.j}`));
            
            if (!mergedTypes.includes(newType)) mergedTypes.push(newType);
            mergesMade = true;
            
            if (newType === 'Chicken' && !gameState.hasChicken) {
                gameState.hasChicken = true;
                updateCoopVisibility();
                showAchievement('🐔 Chicken Coop Unlocked!');
            } else if (newType === 'Rooster' && !gameState.hasRooster) {
                gameState.hasRooster = true;
                updateCoopVisibility();
                showAchievement('🦃 Rooster Coop Unlocked!');
            }
            
            updateMergeablePairs();
        }
    }
    
    setTimeout(clearAutoMergeHighlight, 1500);
    updateAnimalValues();
    
    if (mergesMade) {
        const message = mergedTypes.length > 0 
            ? `Auto-merged into ${mergedTypes.map(t => GAME_CONFIG.animalEmojis[t]).join(', ')} ⚙️` 
            : 'Auto-merged animals ⚙️';
        updateStatus(message);
    }
    updatePlaceButtonStates();
}

// Visual Helper Functions
function highlightValidTargets(i, j) {
    for (let di = 0; di < 3; di++) {
        for (let dj = 0; dj < 3; dj++) {
            if (di === i && dj === j) continue;
            const targetCell = document.getElementById(`cell-${di}-${dj}`);
            if (gameState.grid[di][dj] === gameState.grid[i][j] && GAME_CONFIG.animalTypes[gameState.grid[i][j]].mergeTo) {
                targetCell.classList.add('drag-valid-target');
            } else if (gameState.grid[di][dj]) {
                targetCell.classList.add('drag-invalid-target');
            }
        }
    }
}

function clearValidTargets() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.classList.remove('drag-valid-target', 'drag-invalid-target');
        }
    }
}

function clearWiggleGlow() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            document.getElementById(`cell-${i}-${j}`).classList.remove('wiggle', 'glow');
        }
    }
    gameState.recentlyAnimatedCells = [];
}

function clearAutoMergeHighlight() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.classList.remove('border-purple-500', 'border-2', 'border-green-500', 'new-animal-spawn');
        }
    }
}

// UI Update Functions
function updateCell(i, j) {
    const cell = document.getElementById(`cell-${i}-${j}`);
    const animal = gameState.grid[i][j];
    cell.textContent = animal ? GAME_CONFIG.animalEmojis[animal] : '';
    
    if (animal) {
        cell.classList.add('occupied');
    } else {
        cell.classList.remove('occupied');
    }
}

function updateMoney() {
    const moneyElement = document.getElementById('money');
    moneyElement.textContent = `Money: 💰${gameState.money}`;
    moneyElement.classList.add('updated');
    setTimeout(() => moneyElement.classList.remove('updated'), 500);
}

function updateStatus(message) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.classList.add('bounce-in');
    setTimeout(() => statusElement.classList.remove('bounce-in'), 600);
}

function updateAnimalValues() {
    const animalValues = document.getElementById('animalValues');
    animalValues.innerHTML = '';
    
    if (gameState.createdAnimals.size === 0) {
        const li = document.createElement('li');
        li.textContent = 'Create animals to see sell values!';
        li.className = 'text-gray-500 italic';
        animalValues.appendChild(li);
        return;
    }
    
    for (const [type, { sellPrice }] of Object.entries(GAME_CONFIG.animalTypes)) {
        if (sellPrice > 0 && gameState.createdAnimals.has(type)) {
            const li = document.createElement('li');
            li.innerHTML = `<span class="font-semibold">${GAME_CONFIG.animalEmojis[type]} ${type}:</span> <span class="text-yellow-600 font-bold">💰${sellPrice}</span>`;
            li.className = 'p-2 bg-yellow-50 rounded-lg border border-yellow-200 mb-1';
            animalValues.appendChild(li);
        }
    }
}

function toggleCoops() {
    const drawer = document.getElementById('coopDrawer');
    drawer.classList.toggle('hidden');
    document.getElementById('toggleCoops').innerHTML = drawer.classList.contains('hidden') 
        ? '<i class="fas fa-chevron-down mr-2"></i>Show Farm Buildings' 
        : '<i class="fas fa-chevron-up mr-2"></i>Hide Farm Buildings';
}

// Animation and Effect Functions
function showAchievement(message) {
    const achievement = document.createElement('div');
    achievement.className = 'achievement-popup';
    achievement.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="text-2xl">🏆</div>
            <div class="font-bold text-yellow-800">${message}</div>
        </div>
    `;
    document.body.appendChild(achievement);
    
    setTimeout(() => {
        achievement.style.transform = 'translateX(100%)';
        achievement.style.opacity = '0';
        setTimeout(() => achievement.remove(), 500);
    }, GAME_CONFIG.animationConfig.achievementDuration);
}

function showFloatingNumber(text, parent) {
    const number = document.createElement('div');
    number.className = 'floating-number';
    number.textContent = text;
    number.style.left = '50%';
    number.style.top = '50%';
    number.style.transform = 'translate(-50%, -50%)';
    parent.appendChild(number);
    
    setTimeout(() => number.remove(), GAME_CONFIG.animationConfig.floatingNumberDuration);
}

function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const container = document.body;
    
    for (let i = 0; i < GAME_CONFIG.animationConfig.particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${rect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top + rect.height / 2}px`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        particle.style.animationDuration = `${1 + Math.random() * 1}s`;
        
        // Random direction
        const angle = (Math.PI * 2 * i) / GAME_CONFIG.animationConfig.particleCount;
        const distance = 50 + Math.random() * 50;
        particle.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
        
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 2000);
    }
}

// Game Timer Functions
function startGameTimers() {
    setInterval(() => {
        if (gameState.chickenCoop.owned) {
            gameState.chickenCoop.timer -= 1;
            const timerElement = document.getElementById('chickenCoopTimer');
            timerElement.textContent = `Next Chicken 🐔: ${gameState.chickenCoop.timer.toFixed(1)}s`;
            
            if (gameState.chickenCoop.timer <= 3) {
                timerElement.classList.add('urgent');
            } else {
                timerElement.classList.remove('urgent');
            }
            
            if (gameState.chickenCoop.timer <= 0) {
                gameState.chickenCoop.stored += 1;
                document.getElementById('chickenCoopStored').textContent = `Stored: ${gameState.chickenCoop.stored}`;
                document.getElementById('placeChicken').classList.remove('hidden');
                document.getElementById('placeChicken').classList.add('pulse');
                if (!isGridFull()) document.getElementById('placeChicken').disabled = false;
                gameState.chickenCoop.timer = GAME_CONFIG.coopConfig.chicken.baseTime * Math.pow(GAME_CONFIG.coopConfig.chicken.timeReductionFactor, gameState.chickenCoop.level - 1);
                
                // Achievement effect
                showAchievement('🐔 Chicken Ready!');
            }
        }
        
        if (gameState.roosterCoop.owned) {
            gameState.roosterCoop.timer -= 1;
            const timerElement = document.getElementById('roosterCoopTimer');
            timerElement.textContent = `Next Rooster 🦃: ${gameState.roosterCoop.timer.toFixed(1)}s`;
            
            if (gameState.roosterCoop.timer <= 3) {
                timerElement.classList.add('urgent');
            } else {
                timerElement.classList.remove('urgent');
            }
            
            if (gameState.roosterCoop.timer <= 0) {
                gameState.roosterCoop.stored += 1;
                document.getElementById('roosterCoopStored').textContent = `Stored: ${gameState.roosterCoop.stored}`;
                document.getElementById('placeRooster').classList.remove('hidden');
                document.getElementById('placeRooster').classList.add('pulse');
                if (!isGridFull()) document.getElementById('placeRooster').disabled = false;
                gameState.roosterCoop.timer = GAME_CONFIG.coopConfig.rooster.baseTime * Math.pow(GAME_CONFIG.coopConfig.rooster.timeReductionFactor, gameState.roosterCoop.level - 1);
                
                // Achievement effect
                showAchievement('🦃 Rooster Ready!');
            }
        }
        
        if (gameState.autoMerge.owned) {
            gameState.autoMerge.timer -= 1;
            const countdownElement = document.getElementById('autoMergeCountdown');
            countdownElement.textContent = `Next Auto-Merge: ${Math.max(0, gameState.autoMerge.timer).toFixed(1)}s`;
            
            if (gameState.autoMerge.timer <= 3) {
                countdownElement.classList.add('urgent', 'pulse');
            } else {
                countdownElement.classList.remove('urgent', 'pulse');
            }
            
            if (gameState.autoMerge.timer <= 0 && !gameState.selectedCell && !gameState.draggedCell) {
                autoMergeCheck();
                gameState.autoMerge.timer = gameState.autoMerge.currentInterval;
                countdownElement.textContent = `Next Auto-Merge: ${gameState.autoMerge.timer.toFixed(1)}s`;
                countdownElement.classList.remove('urgent', 'pulse');
            }
        }
        updatePlaceButtonStates();
    }, 1000);
}

function startWiggleAnimation() {
    setInterval(() => {
        if (gameState.draggedCell || gameState.selectedCell || !gameState.autoMerge.owned) return;
        clearWiggleGlow();
        const nonEmptyCells = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (gameState.grid[i][j] && !gameState.recentlyAnimatedCells.includes(`${i}-${j}`)) {
                    nonEmptyCells.push({ i, j });
                }
            }
        }
        if (nonEmptyCells.length === 0) return;
        const count = Math.min(Math.floor(Math.random() * 3) + 1, nonEmptyCells.length);
        const selectedCells = [];
        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * nonEmptyCells.length);
            selectedCells.push(nonEmptyCells.splice(index, 1)[0]);
        }
        selectedCells.forEach(({ i, j }) => {
            const cell = document.getElementById(`cell-${i}-${j}`);
            cell.classList.add('wiggle', 'glow');
            gameState.recentlyAnimatedCells.push(`${i}-${j}`);
            setTimeout(() => {
                cell.classList.remove('wiggle', 'glow');
                gameState.recentlyAnimatedCells = gameState.recentlyAnimatedCells.filter(c => c !== `${i}-${j}`);
            }, GAME_CONFIG.animationConfig.wiggleDuration);
        });
    }, GAME_CONFIG.animationConfig.wiggleInterval);
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);