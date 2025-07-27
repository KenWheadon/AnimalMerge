const achievementManager = {
  // Define all achievements with their properties
  achievementDefinitions: [
    // Building Related (100-500 points)
    {
      id: "first_coop",
      name: "Coop Builder",
      icon: "🏡",
      description: "Purchase your first coop",
      hint: "Building Related",
      rarity: "Common",
      points: 100,
      earned: false,
      checkCondition: () => {
        for (const [animalType] of Object.entries(GAME_CONFIG.coopConfig)) {
          if (gameState[`${animalType}Coop`]?.owned) return true;
        }
        return false;
      },
    },
    {
      id: "all_coops",
      name: "Master Builder",
      icon: "🏰",
      description: "Purchase all available coops",
      hint: "Building Related",
      rarity: "Epic",
      points: 1000,
      earned: false,
      checkCondition: () => {
        return Object.entries(GAME_CONFIG.coopConfig).every(
          ([animalType]) => gameState[`${animalType}Coop`]?.owned
        );
      },
    },

    // Merging Related (100-2000 points)
    {
      id: "first_merge",
      name: "Merger Novice",
      icon: "🔄",
      description: "Perform your first merge",
      hint: "Merging Related",
      rarity: "Common",
      points: 100,
      earned: false,
      checkCondition: () => gameState.createdAnimals.size >= 2,
    },
    {
      id: "auto_merge",
      name: "Automation Expert",
      icon: "⚙️",
      description: "Purchase Auto-Merge",
      hint: "Automation Related",
      rarity: "Rare",
      points: 500,
      earned: false,
      checkCondition: () => gameState.autoMerge.owned,
    },
    {
      id: "max_tier",
      name: "Apex Creator",
      icon: "👑",
      description: "Create the legendary beast",
      hint: "Merging Related",
      rarity: "Legendary",
      points: 5000,
      earned: false,
      checkCondition: () => gameState.createdAnimals.has("EndDemoAnimal"),
    },

    // Selling Related (100-1000 points)
    {
      id: "first_sale",
      name: "First Sale",
      icon: "💰",
      description: "Sell your first animal",
      hint: "Selling Related",
      rarity: "Common",
      points: 100,
      earned: false,
      checkCondition: () => gameState.totalSlaughtered >= 1,
    },
    {
      id: "slaughter_10",
      name: "Butcher Apprentice",
      icon: "🔪",
      description: "Sell 10 animals",
      hint: "Selling Related",
      rarity: "Common",
      points: 200,
      earned: false,
      checkCondition: () => gameState.totalSlaughtered >= 10,
    },
    {
      id: "slaughter_100",
      name: "Master Butcher",
      icon: "💀",
      description: "Sell 100 animals",
      hint: "Selling Related",
      rarity: "Rare",
      points: 1000,
      earned: false,
      checkCondition: () => gameState.totalSlaughtered >= 100,
    },

    // Money Related (200-2000 points)
    {
      id: "first_thousand",
      name: "Wealthy Farmer",
      icon: "💎",
      description: "Accumulate 1000 money",
      hint: "Wealth Related",
      rarity: "Uncommon",
      points: 300,
      earned: false,
      checkCondition: () => gameState.money >= 1000,
    },
    {
      id: "ten_thousand",
      name: "Rich Tycoon",
      icon: "💸",
      description: "Accumulate 10000 money",
      hint: "Wealth Related",
      rarity: "Epic",
      points: 2000,
      earned: false,
      checkCondition: () => gameState.money >= 10000,
    },

    // Discovery Related (100-1500 points)
    {
      id: "discover_5",
      name: "Animal Collector",
      icon: "📚",
      description: "Discover 5 different animal types",
      hint: "Discovery Related",
      rarity: "Common",
      points: 200,
      earned: false,
      checkCondition: () => gameState.createdAnimals.size >= 5,
    },
    {
      id: "discover_all",
      name: "Zoologist",
      icon: "🔬",
      description: "Discover all animal types",
      hint: "Discovery Related",
      rarity: "Epic",
      points: 1500,
      earned: false,
      checkCondition: () => {
        const totalAnimals = Object.keys(GAME_CONFIG.animalTypes).length;
        return gameState.createdAnimals.size >= totalAnimals;
      },
    },

    // Grid Related (200-800 points)
    {
      id: "expand_grid",
      name: "Land Owner",
      icon: "🌱",
      description: "Purchase 10 grid spaces",
      hint: "Expansion Related",
      rarity: "Uncommon",
      points: 300,
      earned: false,
      checkCondition: () => gameState.purchasedCells.size >= 10,
    },
    {
      id: "full_grid",
      name: "Territory Master",
      icon: "🗺️",
      description: "Purchase all available grid spaces",
      hint: "Expansion Related",
      rarity: "Rare",
      points: 800,
      earned: false,
      checkCondition: () => {
        const totalSpots = GAME_CONFIG.gridConfig.availableSpots.length;
        return gameState.purchasedCells.size >= totalSpots;
      },
    },
  ],

  // Rarity colors and point values
  rarityConfig: {
    Common: { color: "#9ca3af", points: 100 },
    Uncommon: { color: "#10b981", points: 300 },
    Rare: { color: "#3b82f6", points: 500 },
    Epic: { color: "#8b5cf6", points: 1000 },
    Legendary: { color: "#f59e0b", points: 2000 },
  },

  // Initialize achievements in game state
  initializeAchievements() {
    if (!gameState.achievements) {
      gameState.achievements = this.achievementDefinitions.map((def) => ({
        id: def.id,
        earned: false,
        earnedDate: null,
      }));
    }
  },

  // Check all achievements and mark newly earned ones
  checkAchievements() {
    let newAchievements = [];

    this.achievementDefinitions.forEach((def) => {
      const savedAchievement = gameState.achievements.find(
        (a) => a.id === def.id
      );

      if (!savedAchievement?.earned && def.checkCondition()) {
        // Mark as earned
        if (savedAchievement) {
          savedAchievement.earned = true;
          savedAchievement.earnedDate = Date.now();
        }

        newAchievements.push(def);
      }
    });

    // Show notifications for new achievements
    newAchievements.forEach((achievement) => {
      eventManager.showAchievement(
        `${achievement.icon} ${achievement.name} (+${achievement.points} pts)`
      );
    });

    // Update the achievements display if drawer is open
    if (
      document.getElementById("achievementDrawer")?.classList.contains("open")
    ) {
      this.updateAchievementDisplay();
    }

    return newAchievements.length > 0;
  },

  // Get earned achievements count and total points
  getAchievementStats() {
    const earnedAchievements =
      gameState.achievements?.filter((a) => a.earned) || [];
    const totalAchievements = this.achievementDefinitions.length;

    const earnedPoints = earnedAchievements.reduce((total, achievement) => {
      const def = this.achievementDefinitions.find(
        (d) => d.id === achievement.id
      );
      return total + (def?.points || 0);
    }, 0);

    const totalPoints = this.achievementDefinitions.reduce(
      (total, def) => total + def.points,
      0
    );

    return {
      earnedCount: earnedAchievements.length,
      totalCount: totalAchievements,
      earnedPoints,
      totalPoints,
    };
  },

  // Generate achievement drawer HTML
  generateAchievementDrawerHTML() {
    const stats = this.getAchievementStats();

    let achievementsHTML = "";

    // Sort achievements: earned first, then by rarity points desc, then alphabetical
    const sortedAchievements = [...this.achievementDefinitions].sort((a, b) => {
      const aEarned =
        gameState.achievements?.find((ach) => ach.id === a.id)?.earned || false;
      const bEarned =
        gameState.achievements?.find((ach) => ach.id === b.id)?.earned || false;

      if (aEarned && !bEarned) return -1;
      if (!aEarned && bEarned) return 1;
      if (aEarned === bEarned) {
        if (a.points !== b.points) return b.points - a.points;
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    sortedAchievements.forEach((def) => {
      const savedAchievement = gameState.achievements?.find(
        (a) => a.id === def.id
      );
      const isEarned = savedAchievement?.earned || false;
      const rarityColor = this.rarityConfig[def.rarity]?.color || "#9ca3af";

      if (isEarned) {
        achievementsHTML += `
          <div class="achievement-item earned">
            <div class="achievement-icon">${def.icon}</div>
            <div class="achievement-content">
              <div class="achievement-name">${def.name}</div>
              <div class="achievement-description">${def.description}</div>
              <div class="achievement-meta">
                <span class="achievement-rarity" style="color: ${rarityColor}">${def.rarity}</span>
                <span class="achievement-points">+${def.points} pts</span>
              </div>
            </div>
          </div>
        `;
      } else {
        achievementsHTML += `
          <div class="achievement-item locked">
            <div class="achievement-icon">🔒</div>
            <div class="achievement-content">
              <div class="achievement-name">??????</div>
              <div class="achievement-description">${def.hint}</div>
              <div class="achievement-meta">
                <span class="achievement-rarity" style="color: ${rarityColor}">${def.rarity}</span>
                <span class="achievement-points">+${def.points} pts</span>
              </div>
            </div>
          </div>
        `;
      }
    });

    return `
      <div id="achievementDrawer" class="achievement-drawer">
        <div class="achievement-header">
          <h3>🏆 Achievements</h3>
          <button id="achievementDrawerClose" class="drawer-close-btn">×</button>
        </div>
        <div class="achievement-stats">
          <div class="stats-row">
            <span>${stats.earnedCount}/${stats.totalCount} Unlocked</span>
          </div>
          <div class="stats-row">
            <span>${stats.earnedPoints.toLocaleString()}/${stats.totalPoints.toLocaleString()} points</span>
          </div>
        </div>
        <div class="achievement-list">
          ${achievementsHTML}
        </div>
      </div>
      <button id="achievementDrawerToggle" class="achievement-toggle-btn">🏆</button>
    `;
  },

  // Update the achievement display
  updateAchievementDisplay() {
    const drawer = document.getElementById("achievementDrawer");
    if (!drawer) return;

    const stats = this.getAchievementStats();
    const statsContainer = drawer.querySelector(".achievement-stats");

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stats-row">
          <span>${stats.earnedCount}/${stats.totalCount} Unlocked</span>
        </div>
        <div class="stats-row">
          <span>${stats.earnedPoints.toLocaleString()}/${stats.totalPoints.toLocaleString()} points</span>
        </div>
      `;
    }
  },

  // Toggle drawer open/closed
  toggleDrawer() {
    const drawer = document.getElementById("achievementDrawer");
    const toggle = document.getElementById("achievementDrawerToggle");

    if (drawer && toggle) {
      drawer.classList.toggle("open");
      toggle.classList.toggle("active");

      if (drawer.classList.contains("open")) {
        this.updateAchievementDisplay();
      }
    }
  },

  // Initialize event listeners
  initializeEventListeners() {
    const toggleBtn = document.getElementById("achievementDrawerToggle");
    const closeBtn = document.getElementById("achievementDrawerClose");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        trackPlayerInteraction();
        this.toggleDrawer();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        trackPlayerInteraction();
        this.toggleDrawer();
      });
    }
  },
};
