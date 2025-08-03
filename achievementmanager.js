const achievementManager = {
  achievements: [],

  initializeAchievements() {
    // Initialize achievements array if it doesn't exist in gameState
    if (!gameState.achievements) {
      gameState.achievements = [];
    }

    // Ensure achievements from gameState are loaded
    this.achievements = [...gameState.achievements];

    this.defineAchievements();
  },

  defineAchievements() {
    this.achievementDefinitions = [
      {
        id: "first_egg",
        name: "First Steps",
        description: "Place your first egg",
        icon: "🥚",
        rarity: "Common",
        points: 10,
        check: () => gameState.createdAnimals.size >= 1,
      },
      {
        id: "first_merge",
        name: "Merger",
        description: "Perform your first merge",
        icon: "🔄",
        rarity: "Common",
        points: 15,
        check: () => gameState.totalMerges >= 1,
      },
      {
        id: "first_sale",
        name: "Entrepreneur",
        description: "Sell your first animal",
        icon: "💰",
        rarity: "Common",
        points: 20,
        check: () => gameState.totalSlaughtered >= 1,
      },
      {
        id: "money_milestone_10",
        name: "Getting Started",
        description: "Earn 10 money",
        icon: "💵",
        rarity: "Common",
        points: 25,
        check: () => gameState.money >= 10,
      },
      {
        id: "money_milestone_50",
        name: "Level 1 Master",
        description: "Earn 50 money",
        icon: "🏆",
        rarity: "Uncommon",
        points: 50,
        check: () => gameState.money >= 50,
      },
      {
        id: "money_milestone_100",
        name: "Hundred Club",
        description: "Earn 100 money",
        icon: "💎",
        rarity: "Uncommon",
        points: 75,
        check: () => gameState.money >= 100,
      },
      {
        id: "money_milestone_500",
        name: "Level 2 Master",
        description: "Earn 500 money",
        icon: "🌟",
        rarity: "Rare",
        points: 100,
        check: () => gameState.money >= 500,
      },
      {
        id: "money_milestone_1000",
        name: "Level 3 Master",
        description: "Earn 1000 money",
        icon: "👑",
        rarity: "Rare",
        points: 150,
        check: () => gameState.money >= 1000,
      },
      {
        id: "money_milestone_10000",
        name: "Big Business",
        description: "Earn 10,000 money",
        icon: "🏭",
        rarity: "Epic",
        points: 300,
        check: () => gameState.money >= 10000,
      },
      {
        id: "money_milestone_40000",
        name: "Level 4 Master",
        description: "Earn 40,000 money",
        icon: "🚀",
        rarity: "Legendary",
        points: 500,
        check: () => gameState.money >= 40000,
      },
      {
        id: "merge_milestone_10",
        name: "Merge Master",
        description: "Perform 10 merges",
        icon: "⚡",
        rarity: "Common",
        points: 30,
        check: () => gameState.totalMerges >= 10,
      },
      {
        id: "merge_milestone_50",
        name: "Merge Expert",
        description: "Perform 50 merges",
        icon: "🔥",
        rarity: "Uncommon",
        points: 100,
        check: () => gameState.totalMerges >= 50,
      },
      {
        id: "slaughter_milestone_10",
        name: "Butcher",
        description: "Process 10 animals",
        icon: "🔪",
        rarity: "Common",
        points: 40,
        check: () => gameState.totalSlaughtered >= 10,
      },
      {
        id: "slaughter_milestone_50",
        name: "Master Butcher",
        description: "Process 50 animals",
        icon: "🥩",
        rarity: "Uncommon",
        points: 120,
        check: () => gameState.totalSlaughtered >= 50,
      },
      {
        id: "grid_expansion_5",
        name: "Land Baron",
        description: "Purchase 5 grid spots",
        icon: "🌱",
        rarity: "Common",
        points: 35,
        check: () => gameState.purchasedCells.size >= 7, // 2 starting + 5 purchased
      },
      {
        id: "grid_expansion_10",
        name: "Territory Expansion",
        description: "Purchase 10 grid spots",
        icon: "🏞️",
        rarity: "Uncommon",
        points: 80,
        check: () => gameState.purchasedCells.size >= 12, // 2 starting + 10 purchased
      },
      {
        id: "auto_merge_purchase",
        name: "Automation Begins",
        description: "Purchase Auto-Merge",
        icon: "⚙️",
        rarity: "Uncommon",
        points: 60,
        check: () => gameState.autoMerge.owned,
      },
      {
        id: "shuffle_purchase",
        name: "Mix It Up",
        description: "Purchase Shuffle",
        icon: "🔀",
        rarity: "Uncommon",
        points: 70,
        check: () => gameState.shuffle.owned,
      },
      {
        id: "auto_butcher_purchase",
        name: "Full Automation",
        description: "Purchase Auto-Butcher",
        icon: "🤖",
        rarity: "Rare",
        points: 120,
        check: () => gameState.autoButcher.owned,
      },
      {
        id: "first_coop",
        name: "Farm Builder",
        description: "Build your first coop",
        icon: "🏡",
        rarity: "Uncommon",
        points: 90,
        check: () => {
          return Object.entries(GAME_CONFIG.coopConfig).some(([animalType]) => {
            const coop = gameState[`${animalType}Coop`];
            return coop && coop.owned;
          });
        },
      },
      {
        id: "all_coops_level",
        name: "Coop Empire",
        description: "Own all coops available in current level",
        icon: "🏘️",
        rarity: "Rare",
        points: 200,
        check: () => {
          const levelConfig = getCurrentLevelConfig();
          if (levelConfig.availableCoops.length === 0) return false;

          return levelConfig.availableCoops.every((animalType) => {
            const coop = gameState[`${animalType}Coop`];
            return coop && coop.owned;
          });
        },
      },
      {
        id: "discover_all_animals_level",
        name: "Animal Collector",
        description: "Discover all animals in current level",
        icon: "🦄",
        rarity: "Epic",
        points: 250,
        check: () => {
          const levelConfig = getCurrentLevelConfig();
          const availableAnimals = levelConfig.availableAnimals.filter(
            (animal) => GAME_CONFIG.animalTypes[animal].sellPrice > 0 // Only count sellable animals
          );

          return availableAnimals.every((animal) =>
            gameState.createdAnimals.has(animal)
          );
        },
      },
    ];
  },

  checkAchievements() {
    if (!this.achievementDefinitions) return;

    this.achievementDefinitions.forEach((achievement) => {
      // Check if achievement was already earned
      if (this.isAchievementEarned(achievement.id)) {
        return; // Skip if already earned
      }

      // Check if achievement condition is met
      if (achievement.check()) {
        this.awardAchievement(achievement);
      }
    });
  },

  isAchievementEarned(achievementId) {
    return (
      this.achievements.some((a) => a.id === achievementId) ||
      gameState.achievements.some((a) => a.id === achievementId)
    );
  },

  awardAchievement(achievement) {
    // Double-check to prevent duplicates
    if (this.isAchievementEarned(achievement.id)) {
      return;
    }

    const earnedAchievement = {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      points: achievement.points,
      earnedAt: Date.now(),
    };

    // Add to both local and gameState arrays
    this.achievements.push(earnedAchievement);
    gameState.achievements.push(earnedAchievement);

    // Show achievement notification
    eventManager.showAchievement(`${achievement.icon} ${achievement.name}`);

    // Play achievement sound
    audioManager.playSound("achievement-awarded");

    // Save progress
    saveManager.saveOnAction();
  },

  getEarnedAchievements() {
    return this.achievements.filter((a) => a.earnedAt);
  },

  getTotalPoints() {
    return this.getEarnedAchievements().reduce((total, achievement) => {
      return total + (achievement.points || 0);
    }, 0);
  },

  getAchievementsByRarity(rarity) {
    return this.achievements.filter((a) => a.rarity === rarity);
  },

  getRarityColor(rarity) {
    const colors = {
      Common: "#9ca3af",
      Uncommon: "#10b981",
      Rare: "#3b82f6",
      Epic: "#8b5cf6",
      Legendary: "#f59e0b",
    };
    return colors[rarity] || "#9ca3af";
  },

  initializeEventListeners() {
    const toggleButton = document.getElementById("achievementToggleBtn");
    const drawer = document.getElementById("achievementDrawer");
    const closeButton = document.getElementById("drawerCloseBtn");

    if (toggleButton && drawer) {
      utilityManager.addEventListener(
        toggleButton,
        "click",
        () => {
          audioManager.playSound("button-click");
          drawer.classList.toggle("open");
          toggleButton.classList.toggle("active");
          this.updateAchievementDisplay();
        },
        "achievementToggle"
      );
    }

    if (closeButton && drawer) {
      utilityManager.addEventListener(
        closeButton,
        "click",
        () => {
          audioManager.playSound("button-click");
          drawer.classList.remove("open");
          toggleButton.classList.remove("active");
        },
        "achievementClose"
      );
    }

    // Close drawer when clicking outside
    if (drawer) {
      utilityManager.addEventListener(
        document,
        "click",
        (e) => {
          if (
            drawer.classList.contains("open") &&
            !drawer.contains(e.target) &&
            !toggleButton.contains(e.target)
          ) {
            drawer.classList.remove("open");
            toggleButton.classList.remove("active");
          }
        },
        "achievementOutsideClick"
      );
    }
  },

  updateAchievementDisplay() {
    const statsElement = document.querySelector(".achievement-stats");
    const listElement = document.querySelector(".achievement-list");

    if (!statsElement || !listElement || !this.achievementDefinitions) return;

    const earnedCount = this.achievements.length;
    const totalCount = this.achievementDefinitions.length;
    const totalPoints = this.getTotalPoints();

    statsElement.innerHTML = `
      <div class="stats-row">
        <span>Achievements: ${earnedCount}/${totalCount}</span>
      </div>
      <div class="stats-row">
        <span>Total Points: ${totalPoints}</span>
      </div>
    `;

    listElement.innerHTML = this.achievementDefinitions
      .map((achievement) => {
        const isEarned = this.isAchievementEarned(achievement.id);
        const itemClass = isEarned ? "earned" : "locked";
        const rarityColor = this.getRarityColor(achievement.rarity);

        return `
          <div class="achievement-item ${itemClass}">
            <div class="achievement-icon" style="background-color: ${rarityColor}20; color: ${rarityColor};">
              ${achievement.icon}
            </div>
            <div class="achievement-content">
              <div class="achievement-name">${achievement.name}</div>
              <div class="achievement-description">${achievement.description}</div>
              <div class="achievement-meta">
                <span class="achievement-rarity" style="color: ${rarityColor};">${achievement.rarity}</span>
                <span class="achievement-points">${achievement.points} pts</span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  generateAchievementDrawerHTML() {
    return `
      <button id="achievementToggleBtn" class="achievement-toggle-btn" title="View Achievements">
        🏆
      </button>

      <div id="achievementDrawer" class="achievement-drawer">
        <div class="achievement-header">
          <h3>🏆 Achievements</h3>
          <button id="drawerCloseBtn" class="drawer-close-btn">×</button>
        </div>

        <div class="achievement-stats">
          <div class="stats-row">
            <span>Achievements: 0/0</span>
          </div>
          <div class="stats-row">
            <span>Total Points: 0</span>
          </div>
        </div>

        <div class="achievement-list">
          <!-- Achievements will be dynamically populated -->
        </div>
      </div>
    `;
  },
};
