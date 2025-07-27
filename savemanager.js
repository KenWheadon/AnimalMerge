const saveManager = {
  SAVE_KEY: "animalMergeFarmSave11",
  COOKIE_KEY: "animalMergeFarmSave11",
  SAVE_VERSION: 1,
  autoSaveInterval: null,

  // Initialize save system
  initialize() {
    const saveLoaded = this.loadGame();
    this.startAutoSave();

    // Save on page unload
    window.addEventListener("beforeunload", () => {
      this.saveGame();
    });

    return saveLoaded; // Return whether a save was loaded
  },

  // Start auto-save timer (every 15 seconds)
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      this.saveGame();
    }, 15000); // 15 seconds
  },

  // Get save data from current game state
  getSaveData() {
    const saveData = {
      version: this.SAVE_VERSION,
      timestamp: Date.now(),
      money: gameState.money,
      grid: gameState.grid,
      purchasedCells: Array.from(gameState.purchasedCells), // Convert Set to Array
      createdAnimals: Array.from(gameState.createdAnimals), // Convert Set to Array
      totalSlaughtered: gameState.totalSlaughtered,
      eggButtonClicked: gameState.eggButtonClicked,
      achievements: gameState.achievements || [], // Save achievements
      autoMerge: {
        owned: gameState.autoMerge.owned,
        level: gameState.autoMerge.level,
        baseInterval: gameState.autoMerge.baseInterval,
        currentInterval: gameState.autoMerge.currentInterval,
        timer: gameState.autoMerge.timer,
        enabled: gameState.autoMerge.enabled,
      },
      shuffle: {
        owned: gameState.shuffle.owned,
        enabled: gameState.shuffle.enabled,
      },
      slaughterHouses: gameState.slaughterHouses,
      lastInteractionTime: gameState.lastInteractionTime,
      // Save purchase config unlocked states
      purchaseConfig: {},
    };

    // Save which eggs are unlocked for purchase
    for (const [animalType, config] of Object.entries(
      GAME_CONFIG.purchaseConfig
    )) {
      saveData.purchaseConfig[animalType] = {
        unlocked: config.unlocked,
      };
    }

    // Save coop states including levels and egg merge progress
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const coopKey = `${animalType}Coop`;
      if (gameState[coopKey]) {
        saveData[coopKey] = {
          owned: gameState[coopKey].owned,
          level: gameState[coopKey].level,
          baseTime: gameState[coopKey].baseTime,
          timer: gameState[coopKey].timer,
          stored: gameState[coopKey].stored,
          eggsMerged: gameState[coopKey].eggsMerged || 0, // Save eggs merged progress
        };
      }
    }

    return saveData;
  },

  // Apply save data to game state
  applySaveData(saveData) {
    // Basic data
    gameState.money = saveData.money || 0;
    gameState.grid =
      saveData.grid ||
      Array(5)
        .fill(null)
        .map(() => Array(8).fill(null));
    gameState.purchasedCells = new Set(saveData.purchasedCells || []);
    gameState.createdAnimals = new Set(saveData.createdAnimals || []);
    gameState.totalSlaughtered = saveData.totalSlaughtered || 0;
    gameState.eggButtonClicked = saveData.eggButtonClicked || false;
    gameState.lastInteractionTime = saveData.lastInteractionTime || Date.now();
    gameState.achievements = saveData.achievements || []; // Load achievements

    // Auto-merge state
    if (saveData.autoMerge) {
      gameState.autoMerge.owned = saveData.autoMerge.owned || false;
      gameState.autoMerge.level = saveData.autoMerge.level || 1;
      gameState.autoMerge.baseInterval =
        saveData.autoMerge.baseInterval ||
        GAME_CONFIG.autoMergeConfig.baseInterval;
      gameState.autoMerge.currentInterval =
        saveData.autoMerge.currentInterval ||
        GAME_CONFIG.autoMergeConfig.baseInterval;
      gameState.autoMerge.timer =
        saveData.autoMerge.timer || GAME_CONFIG.autoMergeConfig.baseInterval;
      gameState.autoMerge.enabled = saveData.autoMerge.enabled !== false; // Default to true
    }

    // Shuffle state
    if (saveData.shuffle) {
      gameState.shuffle.owned = saveData.shuffle.owned || false;
      gameState.shuffle.enabled = saveData.shuffle.enabled !== false; // Default to true
    }

    // Slaughter houses
    gameState.slaughterHouses = saveData.slaughterHouses || [];

    // Restore purchase config unlocked states
    if (saveData.purchaseConfig) {
      for (const [animalType, savedConfig] of Object.entries(
        saveData.purchaseConfig
      )) {
        if (GAME_CONFIG.purchaseConfig[animalType]) {
          GAME_CONFIG.purchaseConfig[animalType].unlocked =
            savedConfig.unlocked || false;
        }
      }
    }

    // Coop states - FIX: Load coop levels and egg merge progress from save data
    for (const [animalType, config] of Object.entries(GAME_CONFIG.coopConfig)) {
      const coopKey = `${animalType}Coop`;
      if (saveData[coopKey]) {
        if (!gameState[coopKey]) {
          gameState[coopKey] = {
            owned: false,
            level: 1,
            baseTime: config.baseTime,
            timer: config.baseTime,
            stored: 0,
            eggsMerged: 0,
          };
        }
        gameState[coopKey].owned = saveData[coopKey].owned || false;
        gameState[coopKey].level = saveData[coopKey].level || 1; // Load saved level
        gameState[coopKey].baseTime =
          saveData[coopKey].baseTime || config.baseTime;
        gameState[coopKey].timer = saveData[coopKey].timer || config.baseTime;
        gameState[coopKey].stored = saveData[coopKey].stored || 0;
        gameState[coopKey].eggsMerged = saveData[coopKey].eggsMerged || 0; // Load eggs merged progress
      }
    }
  },

  // Save to localStorage and cookie
  saveGame() {
    try {
      const saveData = this.getSaveData();
      const saveString = JSON.stringify(saveData);

      // Save to localStorage
      try {
        localStorage.setItem(this.SAVE_KEY, saveString);
      } catch (e) {
        console.warn("Failed to save to localStorage:", e);
      }

      // Save to cookie as backup
      try {
        // Cookies have size limits, so compress if needed
        const maxCookieSize = 4000; // Conservative limit
        if (saveString.length <= maxCookieSize) {
          const expires = new Date();
          expires.setFullYear(expires.getFullYear() + 1); // 1 year expiry
          document.cookie = `${this.COOKIE_KEY}=${encodeURIComponent(
            saveString
          )}; expires=${expires.toUTCString()}; path=/`;
        } else {
          console.warn("Save data too large for cookie backup");
        }
      } catch (e) {
        console.warn("Failed to save to cookie:", e);
      }
    } catch (e) {
      console.error("Failed to save game:", e);
    }
  },

  // Load from localStorage or cookie
  loadGame() {
    let saveData = null;

    // Try localStorage first
    try {
      const saveString = localStorage.getItem(this.SAVE_KEY);
      if (saveString) {
        saveData = JSON.parse(saveString);
      }
    } catch (e) {
      console.warn("Failed to load from localStorage:", e);
    }

    // If localStorage failed, try cookie
    if (!saveData) {
      try {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split("=");
          if (name === this.COOKIE_KEY) {
            const saveString = decodeURIComponent(value);
            saveData = JSON.parse(saveString);
            break;
          }
        }
      } catch (e) {
        console.warn("Failed to load from cookie:", e);
      }
    }

    // Apply save data if found
    if (saveData && this.validateSaveData(saveData)) {
      this.applySaveData(saveData);
      console.log("Game loaded from save");
      return true;
    } else {
      console.log("Starting new game");
      return false;
    }
  },

  // Validate save data structure
  validateSaveData(saveData) {
    try {
      // Check version
      if (!saveData.version || saveData.version !== this.SAVE_VERSION) {
        console.warn("Save data version mismatch");
        return false;
      }

      // Check required fields
      if (typeof saveData.money !== "number") return false;
      if (!Array.isArray(saveData.grid)) return false;
      if (!Array.isArray(saveData.purchasedCells)) return false;
      if (!Array.isArray(saveData.createdAnimals)) return false;

      return true;
    } catch (e) {
      console.error("Save data validation failed:", e);
      return false;
    }
  },

  // Clear save data (for debugging or new game)
  clearSave() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      document.cookie = `${this.COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log("Save data cleared");
    } catch (e) {
      console.error("Failed to clear save data:", e);
    }
  },

  // Save on player action (called from various game functions)
  saveOnAction() {
    this.saveGame();
  },
};
