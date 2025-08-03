const saveManager = {
  saveKey: GAME_CONFIG.saveConfig.key,

  initialize() {
    console.log(`Save manager initializing...`);

    try {
      const saveLoaded = this.loadGame();
      if (saveLoaded) {
        console.log("Loaded save successfully");
        return true;
      }

      console.log("No save found, starting fresh");
      return false;
    } catch (error) {
      console.error("Error initializing save:", error);
      return false;
    }
  },

  loadGame() {
    try {
      const saveData = localStorage.getItem(this.saveKey);
      if (!saveData) return false;

      const parsedData = JSON.parse(saveData);
      if (parsedData.version !== GAME_CONFIG.saveConfig.version) {
        console.warn("Save version mismatch, starting fresh");
        return false;
      }

      // Restore game state
      Object.assign(gameState, parsedData.gameState);

      // Convert Set objects back from arrays
      if (parsedData.gameState.purchasedCells) {
        gameState.purchasedCells = new Set(parsedData.gameState.purchasedCells);
      } else {
        // Initialize with default free spots if missing
        gameState.purchasedCells = new Set();
        GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col, cost }) => {
          if (cost === 0) {
            gameState.purchasedCells.add(`${row}-${col}`);
          }
        });
      }

      if (parsedData.gameState.createdAnimals) {
        gameState.createdAnimals = new Set(parsedData.gameState.createdAnimals);
      } else {
        gameState.createdAnimals = new Set();
      }

      // Ensure level progression values exist
      gameState.currentLevel = gameState.currentLevel || 1;
      gameState.highestUnlockedLevel = gameState.highestUnlockedLevel || 1;

      return true;
    } catch (error) {
      console.error("Error loading game:", error);
      return false;
    }
  },

  saveGame() {
    try {
      const saveData = {
        version: GAME_CONFIG.saveConfig.version,
        savedAt: Date.now(),
        gameState: {
          ...gameState,
          // Convert Set objects to arrays for JSON serialization
          purchasedCells: Array.from(gameState.purchasedCells),
          createdAnimals: Array.from(gameState.createdAnimals),
        },
      };

      const jsonString = JSON.stringify(saveData);

      // Check if save data is too large
      if (jsonString.length > GAME_CONFIG.saveConfig.maxCookieSize * 1024) {
        console.warn("Save data is too large, skipping save");
        return false;
      }

      localStorage.setItem(this.saveKey, jsonString);
      console.log(`Game saved for level ${gameState.currentLevel}`);
      return true;
    } catch (error) {
      console.error("Error saving game:", error);
      return false;
    }
  },

  saveOnAction() {
    // Debounce saves to avoid too frequent saving
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveGame();
    }, 1000);
  },

  clearSave() {
    try {
      localStorage.removeItem(this.saveKey);
      console.log("Save cleared");
      return true;
    } catch (error) {
      console.error("Error clearing save:", error);
      return false;
    }
  },

  exportSave() {
    try {
      const saveData = localStorage.getItem(this.saveKey);
      if (!saveData) {
        return null;
      }

      // Encode the save data for easy sharing
      return btoa(saveData);
    } catch (error) {
      console.error("Error exporting save:", error);
      return null;
    }
  },

  importSave(encodedData) {
    try {
      const saveData = atob(encodedData);
      const parsedData = JSON.parse(saveData);

      if (parsedData.version !== GAME_CONFIG.saveConfig.version) {
        console.warn("Import version mismatch");
        return false;
      }

      localStorage.setItem(this.saveKey, saveData);
      return true;
    } catch (error) {
      console.error("Error importing save:", error);
      return false;
    }
  },

  hasSave() {
    return localStorage.getItem(this.saveKey) !== null;
  },

  getSaveInfo() {
    try {
      const saveData = localStorage.getItem(this.saveKey);
      if (!saveData) return null;

      const parsedData = JSON.parse(saveData);
      return {
        currentLevel: parsedData.gameState.currentLevel,
        highestUnlockedLevel: parsedData.gameState.highestUnlockedLevel,
        savedAt: parsedData.savedAt,
        money: parsedData.gameState.money,
        totalMerges: parsedData.gameState.totalMerges,
        totalSlaughtered: parsedData.gameState.totalSlaughtered,
      };
    } catch (error) {
      console.error("Error getting save info:", error);
      return null;
    }
  },
};
