const achievementManager = {
  achievementDefinitions: [
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
    {
      id: "discover_6",
      name: "Animal Collector",
      icon: "📚",
      description: "Discover 6 different animal types",
      hint: "Discovery Related",
      rarity: "Common",
      points: 200,
      earned: false,
      checkCondition: () => gameState.createdAnimals.size >= 6,
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

  rarityConfig: {
    Common: { color: "#9ca3af", points: 100 },
    Uncommon: { color: "#10b981", points: 300 },
    Rare: { color: "#3b82f6", points: 500 },
    Epic: { color: "#8b5cf6", points: 1000 },
    Legendary: { color: "#f59e0b", points: 2000 },
  },

  initializeAchievements() {
    if (!gameState.achievements) {
      gameState.achievements = this.achievementDefinitions.map((def) => ({
        id: def.id,
        earned: false,
        earnedDate: null,
      }));
    }
  },

  checkAchievements() {
    let newAchievements = [];

    this.achievementDefinitions.forEach((def) => {
      const savedAchievement = gameState.achievements.find(
        (a) => a.id === def.id
      );

      if (!savedAchievement?.earned && def.checkCondition()) {
        if (savedAchievement) {
          savedAchievement.earned = true;
          savedAchievement.earnedDate = Date.now();
        }

        newAchievements.push(def);
      }
    });

    newAchievements.forEach((achievement) => {
      eventManager.showAchievement(
        `${achievement.icon} ${achievement.name} (+${achievement.points} pts)`
      );
    });

    if (newAchievements.length > 0) {
      this.refreshAchievementDrawer();
    }

    return newAchievements.length > 0;
  },

  refreshAchievementDrawer() {
    const drawer = document.getElementById("achievementDrawer");
    if (drawer) {
      const newDrawerHTML = this.generateAchievementDrawerHTML();
      const tempDiv = utilityManager.createElement("div", "", newDrawerHTML);
      const newDrawerElement = tempDiv.querySelector("#achievementDrawer");

      const wasOpen = drawer.classList.contains("open");
      drawer.innerHTML = newDrawerElement.innerHTML;

      if (wasOpen) {
        drawer.classList.add("open");
      }

      this.initializeEventListeners();
    }
  },

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

  generateAchievementDrawerHTML() {
    const stats = this.getAchievementStats();

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

    const achievementsHTML = sortedAchievements
      .map((def) => {
        const savedAchievement = gameState.achievements?.find(
          (a) => a.id === def.id
        );
        const isEarned = savedAchievement?.earned || false;
        const rarityColor = this.rarityConfig[def.rarity]?.color || "#9ca3af";

        if (isEarned) {
          return `
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
          return `
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
      })
      .join("");

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
            <span>${utilityManager.formatNumber(
              stats.earnedPoints
            )}/${utilityManager.formatNumber(stats.totalPoints)} points</span>
          </div>
        </div>
        <div class="achievement-list">
          ${achievementsHTML}
        </div>
      </div>
      <button id="achievementDrawerToggle" class="achievement-toggle-btn">🏆</button>
    `;
  },

  updateAchievementDisplay() {
    this.refreshAchievementDrawer();
  },

  toggleDrawer() {
    const drawer = document.getElementById("achievementDrawer");
    const toggle = document.getElementById("achievementDrawerToggle");

    if (drawer && toggle) {
      drawer.classList.toggle("open");
      toggle.classList.toggle("active");

      if (drawer.classList.contains("open")) {
        this.refreshAchievementDrawer();
      }
    }
  },

  initializeEventListeners() {
    const toggleBtn = document.getElementById("achievementDrawerToggle");
    const closeBtn = document.getElementById("achievementDrawerClose");

    if (toggleBtn) {
      utilityManager.addEventListener(
        toggleBtn,
        "mouseenter",
        () => {
          audioManager.playSound("button-hover");
        },
        "achievementToggleHover"
      );

      const newToggleBtn = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

      utilityManager.addEventListener(
        newToggleBtn,
        "click",
        () => {
          trackPlayerInteraction();
          audioManager.playSound("button-click");
          this.toggleDrawer();
        },
        "achievementToggleClick"
      );
    }

    if (closeBtn) {
      utilityManager.addEventListener(
        closeBtn,
        "mouseenter",
        () => {
          audioManager.playSound("button-hover");
        },
        "achievementCloseHover"
      );

      utilityManager.addEventListener(
        closeBtn,
        "click",
        () => {
          trackPlayerInteraction();
          audioManager.playSound("button-click");
          this.toggleDrawer();
        },
        "achievementCloseClick"
      );
    }
  },
};
