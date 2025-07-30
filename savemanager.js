const saveManager = {
  initialize() {
    const saveLoaded = this.loadGame();
    this.startAutoSave();

    window.addEventListener("beforeunload", () => {
      this.saveGame();
    });

    return saveLoaded;
  },

  startAutoSave() {
    utilityManager.setInterval(
      () => {
        this.saveGame();
      },
      GAME_CONFIG.gameplayConfig.autoSaveInterval,
      "autoSave"
    );
  },

  getSaveData() {
    const saveData = {
      version: GAME_CONFIG.saveConfig.version,
      timestamp: Date.now(),
      money: gameState.money,
      grid: gameState.grid,
      purchasedCells: Array.from(gameState.purchasedCells),
      createdAnimals: Array.from(gameState.createdAnimals),
      totalSlaughtered: gameState.totalSlaughtered,
      totalMerges: gameState.totalMerges,
      eggButtonClicked: gameState.eggButtonClicked,
      achievements: gameState.achievements,
      autoMerge: gameState.autoMerge,
      shuffle: gameState.shuffle,
      autoButcher: gameState.autoButcher,
      slaughterHouses: gameState.slaughterHouses,
      lastInteractionTime: gameState.lastInteractionTime,
      purchaseConfig: {},
    };

    Object.entries(GAME_CONFIG.purchaseConfig).forEach(
      ([animalType, config]) => {
        saveData.purchaseConfig[animalType] = {
          unlocked: config.unlocked,
        };
      }
    );

    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType]) => {
      const coopKey = `${animalType}Coop`;
      if (gameState[coopKey]) {
        saveData[coopKey] = gameState[coopKey];
      }
    });

    return saveData;
  },

  applySaveData(saveData) {
    gameState.money = saveData.money || 0;
    gameState.grid = saveData.grid || [];
    gameState.purchasedCells = new Set(saveData.purchasedCells || []);
    gameState.createdAnimals = new Set(saveData.createdAnimals || []);
    gameState.totalSlaughtered = saveData.totalSlaughtered || 0;
    gameState.totalMerges = saveData.totalMerges || 0;
    gameState.eggButtonClicked = saveData.eggButtonClicked || false;
    gameState.lastInteractionTime = saveData.lastInteractionTime || Date.now();
    gameState.achievements = saveData.achievements || [];

    if (saveData.autoMerge) {
      Object.assign(gameState.autoMerge, saveData.autoMerge);
    }

    if (saveData.shuffle) {
      Object.assign(gameState.shuffle, saveData.shuffle);
    }

    if (saveData.autoButcher) {
      Object.assign(gameState.autoButcher, saveData.autoButcher);
    } else {
      // Initialize autoButcher if not present in save data
      gameState.autoButcher = {
        owned: false,
        enabled: true,
        timer: GAME_CONFIG.autoButcherConfig.checkInterval,
      };
    }

    gameState.slaughterHouses = saveData.slaughterHouses || [];

    // Ensure slaughter houses have the new properties
    if (gameState.slaughterHouses.length > 0) {
      const house = gameState.slaughterHouses[0];
      if (!house.level) house.level = 1;
      if (!house.queueMax)
        house.queueMax = GAME_CONFIG.slaughterHouseConfig.baseQueueMax;
      if (!house.processTime)
        house.processTime = GAME_CONFIG.slaughterHouseConfig.baseProcessTime;
    }

    if (saveData.purchaseConfig) {
      Object.entries(saveData.purchaseConfig).forEach(
        ([animalType, savedConfig]) => {
          if (GAME_CONFIG.purchaseConfig[animalType]) {
            GAME_CONFIG.purchaseConfig[animalType].unlocked =
              savedConfig.unlocked || false;
          }
        }
      );
    }

    Object.entries(GAME_CONFIG.coopConfig).forEach(([animalType, config]) => {
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
            autoPlacement: true,
          };
        }
        Object.assign(gameState[coopKey], saveData[coopKey]);

        // Ensure autoPlacement property exists
        if (gameState[coopKey].autoPlacement === undefined) {
          gameState[coopKey].autoPlacement = true;
        }
      }
    });
  },

  saveGame() {
    try {
      const saveData = this.getSaveData();
      const saveString = JSON.stringify(saveData);

      try {
        localStorage.setItem(GAME_CONFIG.saveConfig.key, saveString);
      } catch (e) {
        // Ignore localStorage errors
      }

      try {
        if (saveString.length <= GAME_CONFIG.saveConfig.maxCookieSize) {
          const expires = new Date();
          expires.setFullYear(expires.getFullYear() + 1);
          document.cookie = `${GAME_CONFIG.saveConfig.key}=${encodeURIComponent(
            saveString
          )}; expires=${expires.toUTCString()}; path=/`;
        }
      } catch (e) {
        // Ignore cookie errors
      }
    } catch (e) {
      // Ignore save errors
    }
  },

  loadGame() {
    let saveData = null;

    try {
      const saveString = localStorage.getItem(GAME_CONFIG.saveConfig.key);
      if (saveString) {
        saveData = JSON.parse(saveString);
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    if (!saveData) {
      try {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split("=");
          if (name === GAME_CONFIG.saveConfig.key) {
            const saveString = decodeURIComponent(value);
            saveData = JSON.parse(saveString);
            break;
          }
        }
      } catch (e) {
        // Ignore cookie errors
      }
    }

    if (saveData && this.validateSaveData(saveData)) {
      this.applySaveData(saveData);
      return true;
    }

    return false;
  },

  validateSaveData(saveData) {
    try {
      if (
        !saveData.version ||
        saveData.version !== GAME_CONFIG.saveConfig.version
      ) {
        return false;
      }

      if (typeof saveData.money !== "number") return false;
      if (!Array.isArray(saveData.grid)) return false;
      if (!Array.isArray(saveData.purchasedCells)) return false;
      if (!Array.isArray(saveData.createdAnimals)) return false;

      return true;
    } catch (e) {
      return false;
    }
  },

  clearSave() {
    try {
      localStorage.removeItem(GAME_CONFIG.saveConfig.key);
      document.cookie = `${GAME_CONFIG.saveConfig.key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (e) {
      // Ignore clear errors
    }
  },

  saveOnAction() {
    this.saveGame();
  },
};
