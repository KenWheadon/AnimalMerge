const eventManager = {
  notificationQueue: [],
  isShowingNotification: false,
  notificationOffset: 0,

  activeParticles: new Set(),

  tutorialMessages: [
    "🥚 Click the free Egg button to place your first animal!",
    "🔄 Drag identical animals together to merge and upgrade them!",
    "💰 Drag animals to the butcher shop to sell them for money!",
    "🖱️ Right-click animals to quickly send them to the butcher!",
    "🌱 Click grass squares with your money to expand your farm!",
    "🏡 Create better animals to unlock coops that generate eggs automatically!",
    "⚙️ Buy Auto-Merge to automatically combine animals every 25 seconds!",
    "🔀 Buy Shuffle to rearrange your animals after auto-merging!",
    "🔪 Buy Auto-Butcher to automatically sell your lowest value animals!",
    "💡 Tip: Merge two of the same animal type to create the next tier!",
    "🎯 Goal: Keep merging to discover all the different animal types!",
  ],
  currentTutorialIndex: 0,
  lastTutorialTime: 0,
  initialTutorialComplete: false,
  isPlayingTutorial: false,

  initializeButtonEventListeners() {
    this.initializeParticleCleanup();
    this.setupButtonListener("buyAutoMerge", () => coopManager.buyAutoMerge());
    this.setupButtonListener("autoMergeToggle", () =>
      coopManager.toggleAutoMerge()
    );
    this.setupButtonListener("buyShuffle", () => coopManager.buyShuffle());
    this.setupButtonListener("shuffleToggle", () =>
      coopManager.toggleShuffle()
    );
    this.setupButtonListener("buyAutoButcher", () =>
      coopManager.buyAutoButcher()
    );
    this.setupButtonListener("autoButcherToggle", () =>
      coopManager.toggleAutoButcher()
    );
    this.setupButtonListener("helpButton", () => this.playTutorialSequence());
  },

  setupButtonListener(id, callback) {
    const button = document.getElementById(id);
    if (button) {
      utilityManager.addEventListener(
        button,
        "mouseenter",
        () => {
          audioManager.playSound("button-hover");
        },
        `${id}Hover`
      );

      utilityManager.addEventListener(
        button,
        "click",
        () => {
          gameState.lastInteractionTime = Date.now();
          audioManager.playSound("button-click");
          callback();
        },
        `${id}Click`
      );
    }
  },

  initializeParticleCleanup() {
    utilityManager.setInterval(
      () => {
        this.cleanupOrphanedParticles();
      },
      GAME_CONFIG.gameplayConfig.particleCleanupInterval,
      "particleCleanup"
    );
  },

  cleanupOrphanedParticles() {
    const particles = document.querySelectorAll(
      ".particle, .processing-particle, .flying-coin, .flying-money-value"
    );
    const maxAge = 10000;
    const now = Date.now();

    particles.forEach((particle) => {
      const createdTime = particle.dataset.created;
      if (createdTime && now - parseInt(createdTime) > maxAge) {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
        this.activeParticles.delete(particle);
      }
    });
  },

  initializeIdleDetection() {
    utilityManager.setInterval(
      () => {
        this.checkIdleState();
      },
      2000,
      "idleCheck"
    );
  },

  startInitialTutorialCycle() {
    this.isPlayingTutorial = true;
    this.currentTutorialIndex = 0;
    this.lastTutorialTime = Date.now();

    this.showTutorialMessage();

    utilityManager.setInterval(
      () => {
        if (this.isPlayingTutorial && !this.initialTutorialComplete) {
          const now = Date.now();
          if (
            now - this.lastTutorialTime >=
            GAME_CONFIG.gameplayConfig.tutorialScrollDelay
          ) {
            if (this.currentTutorialIndex < this.tutorialMessages.length) {
              this.showTutorialMessage();
              this.lastTutorialTime = now;
            } else {
              this.initialTutorialComplete = true;
              this.isPlayingTutorial = false;
              utilityManager.clearInterval("initialTutorialScroll");
              this.showHelpButton();
            }
          }
        }
      },
      1000,
      "initialTutorialScroll"
    );
  },

  playTutorialSequence() {
    if (this.isPlayingTutorial) return;

    this.isPlayingTutorial = true;
    this.currentTutorialIndex = 0;
    this.lastTutorialTime = Date.now();

    this.showTutorialMessage();

    utilityManager.setInterval(
      () => {
        if (this.isPlayingTutorial) {
          const now = Date.now();
          if (
            now - this.lastTutorialTime >=
            GAME_CONFIG.gameplayConfig.tutorialScrollDelay
          ) {
            if (this.currentTutorialIndex < this.tutorialMessages.length) {
              this.showTutorialMessage();
              this.lastTutorialTime = now;
            } else {
              this.isPlayingTutorial = false;
              utilityManager.clearInterval("manualTutorial");
            }
          }
        }
      },
      1000,
      "manualTutorial"
    );
  },

  showHelpButton() {
    const statusElement = document.getElementById("status");
    if (statusElement && !document.getElementById("helpButton")) {
      const helpButton = utilityManager.createElement(
        "button",
        "help-button",
        "❓"
      );
      helpButton.id = "helpButton";
      helpButton.title = "Show tutorial tips";

      helpButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(145deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        transition: all 0.2s ease;
        z-index: 10;
      `;

      utilityManager.addEventListener(
        helpButton,
        "mouseenter",
        () => {
          audioManager.playSound("button-hover");
          helpButton.style.transform = "scale(1.1)";
          helpButton.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
        },
        "helpHover"
      );

      utilityManager.addEventListener(
        helpButton,
        "mouseleave",
        () => {
          helpButton.style.transform = "scale(1)";
          helpButton.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
        },
        "helpLeave"
      );

      utilityManager.addEventListener(
        helpButton,
        "click",
        () => {
          gameState.lastInteractionTime = Date.now();
          audioManager.playSound("button-click");
          this.playTutorialSequence();
        },
        "helpClick"
      );

      statusElement.style.position = "relative";
      statusElement.appendChild(helpButton);
    }
  },

  checkIdleState() {
    const now = Date.now();
    const timeSinceLastInteraction = now - gameState.lastInteractionTime;

    if (
      timeSinceLastInteraction >= GAME_CONFIG.gameplayConfig.idleDetectionTime
    ) {
      this.handleEggGlowIdle();
    }

    if (
      timeSinceLastInteraction >= GAME_CONFIG.gameplayConfig.animalWiggleTime
    ) {
      this.handleAnimalWiggleIdle();
      gameState.lastInteractionTime = now - 15000;
    }
  },

  handleEggGlowIdle() {
    const hasOpenSpace = GAME_CONFIG.gridConfig.availableSpots.some(
      ({ row, col }) =>
        gameState.purchasedCells.has(`${row}-${col}`) &&
        !gameState.grid[row][col]
    );

    if (hasOpenSpace && !gameState.eggButtonClicked) {
      const eggButton = document.getElementById("buyEgg");
      if (eggButton && !eggButton.classList.contains("egg-button-pulse")) {
        eggButton.classList.add("glow", "pulse");
        utilityManager.setTimeout(
          () => {
            eggButton.classList.remove("glow", "pulse");
          },
          3000,
          "eggGlow"
        );
      }
    }
  },

  handleAnimalWiggleIdle() {
    const occupiedCells = [];
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row, col }) => {
      if (
        gameState.purchasedCells.has(`${row}-${col}`) &&
        gameState.grid[row][col]
      ) {
        occupiedCells.push({ row, col, type: gameState.grid[row][col] });
      }
    });

    if (occupiedCells.length > 0) {
      const randomCell =
        occupiedCells[Math.floor(Math.random() * occupiedCells.length)];
      const cellElement = document.getElementById(
        `cell-${randomCell.row}-${randomCell.col}`
      );

      if (cellElement) {
        cellElement.classList.add("butcher-wiggle");
        utilityManager.setTimeout(
          () => {
            cellElement.classList.remove("butcher-wiggle");
          },
          1000,
          "animalWiggle"
        );
      }
    }
  },

  showTutorialMessage() {
    if (this.currentTutorialIndex >= this.tutorialMessages.length) {
      return;
    }

    const message = this.tutorialMessages[this.currentTutorialIndex];
    this.currentTutorialIndex++;
    updateStatus(message);
  },

  startInitialEggButtonAnimation() {
    const eggButton = document.getElementById("buyEgg");
    if (eggButton && !gameState.eggButtonClicked) {
      eggButton.classList.add("egg-button-pulse");
    }
  },

  stopInitialEggButtonAnimation() {
    const eggButton = document.getElementById("buyEgg");
    if (eggButton) {
      eggButton.classList.remove("egg-button-pulse");
    }
  },

  showDemoEndedPopup() {
    const backdrop = utilityManager.createElement("div", "demo-ended-backdrop");
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const popup = utilityManager.createElement("div", "demo-ended-popup");
    popup.style.cssText = `
      background: linear-gradient(145deg, #1f2937, #374151);
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      text-align: center;
      max-width: 400px;
      width: 90%;
      border: 2px solid #fbbf24;
      animation: popupScale 0.5s ease-out;
    `;

    const endDemoConfig = GAME_CONFIG.animalTypes.EndDemoAnimal;
    popup.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <img src="${GAME_CONFIG.animalImages.EndDemoAnimal}" alt="End Demo Animal" style="width: 120px; height: 120px; object-fit: contain; margin: 0 auto; display: block; border-radius: 0.5rem;" />
      </div>
      <h2 style="color: #fbbf24; font-size: 2rem; font-weight: bold; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎉 Demo Ended! 🎉</h2>
      <p style="color: #d1d5db; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;">
        Congratulations! You've reached the final animal and completed this demo. 
        The <strong style="color: #fbbf24;">${endDemoConfig.name}</strong> can be sold but cannot merge any further.
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button id="closeDemoPopup" style="
          background: linear-gradient(145deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          transition: all 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Continue Playing
        </button>
        <button id="showDemoCredits" style="
          background: linear-gradient(145deg, #374151, #1f2937);
          color: #fbbf24;
          padding: 0.75rem 2rem;
          border: 2px solid #fbbf24;
          border-radius: 0.5rem;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
          transition: all 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Credits
        </button>
      </div>
    `;

    if (!document.querySelector("#popup-animations")) {
      const style = document.createElement("style");
      style.id = "popup-animations";
      style.textContent = `
        @keyframes popupScale {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);

    const closeButton = document.getElementById("closeDemoPopup");
    const creditsButton = document.getElementById("showDemoCredits");

    utilityManager.addEventListener(
      closeButton,
      "mouseenter",
      () => {
        audioManager.playSound("button-hover");
      },
      "demoCloseHover"
    );

    utilityManager.addEventListener(
      closeButton,
      "click",
      () => {
        audioManager.playSound("button-click");
        backdrop.remove();
      },
      "demoClose"
    );

    utilityManager.addEventListener(
      creditsButton,
      "mouseenter",
      () => {
        audioManager.playSound("button-hover");
      },
      "demoCreditsHover"
    );

    utilityManager.addEventListener(
      creditsButton,
      "click",
      () => {
        audioManager.playSound("button-click");
        if (typeof showCreditsGallery === "function") {
          showCreditsGallery();
        }
      },
      "demoCredits"
    );

    utilityManager.addEventListener(
      backdrop,
      "click",
      (e) => {
        if (e.target === backdrop) {
          audioManager.playSound("button-click");
          backdrop.remove();
        }
      },
      "demoBackdrop"
    );

    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        audioManager.playSound("button-click");
        backdrop.remove();
        utilityManager.removeEventListeners("demoEscape");
      }
    };
    utilityManager.addEventListener(
      document,
      "keydown",
      escapeHandler,
      "demoEscape"
    );
  },

  queueNotification(message) {
    this.notificationQueue.push(message);
    this.processNotificationQueue();
  },

  processNotificationQueue() {
    if (
      this.isShowingNotification ||
      this.notificationQueue.length === 0 ||
      (this.isPlayingTutorial && this.initialTutorialComplete)
    ) {
      return;
    }

    this.isShowingNotification = true;
    const message = this.notificationQueue.shift();
    this.showNotification(message);
  },

  showNotification(message) {
    const notification = utilityManager.createElement(
      "div",
      "achievement-popup",
      `
      <div class="flex items-center space-x-2">
        <div class="text-2xl">🏆</div>
        <div class="font-bold text-yellow-800">${message}</div>
      </div>
    `
    );

    notification.style.top = `${20 + this.notificationOffset}px`;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    });

    this.notificationOffset += 80;

    utilityManager.setTimeout(
      () => {
        notification.style.transform = "translateX(100%)";
        notification.style.opacity = "0";

        utilityManager.setTimeout(
          () => {
            notification.remove();
            this.notificationOffset -= 80;
            this.isShowingNotification = false;
            this.processNotificationQueue();
          },
          500,
          "notificationRemove"
        );
      },
      GAME_CONFIG.animationConfig.achievementDuration,
      "notificationHide"
    );
  },

  clearWiggleGlow() {
    GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
      if (gameState.purchasedCells.has(`${i}-${j}`)) {
        const cell = document.getElementById(`cell-${i}-${j}`);
        if (cell) {
          cell.classList.remove("wiggle", "glow");
        }
      }
    });
    gameState.recentlyAnimatedCells = [];
  },

  showAchievement(message) {
    audioManager.playSound("achievement-awarded");
    this.queueNotification(message);
  },

  showFloatingNumber(text, parent) {
    const number = utilityManager.createElement("div", "floating-number", text);
    number.style.left = "50%";
    number.style.top = "50%";
    number.style.transform = "translate(-50%, -50%)";
    number.dataset.created = Date.now().toString();

    parent.appendChild(number);
    this.activeParticles.add(number);

    utilityManager.setTimeout(
      () => {
        if (number.parentNode) {
          number.parentNode.removeChild(number);
        }
        this.activeParticles.delete(number);
      },
      GAME_CONFIG.animationConfig.floatingNumberDuration,
      "floatingNumber"
    );
  },

  createParticles(element, value = null) {
    const rect = element.getBoundingClientRect();
    const container = document.body;

    let particleCount = GAME_CONFIG.animationConfig.particleCount;

    if (value !== null) {
      const scaledCount =
        Math.floor(value / 100) + GAME_CONFIG.animationConfig.minParticles;
      particleCount = Math.min(
        scaledCount,
        GAME_CONFIG.animationConfig.maxParticles
      );
    }

    for (let i = 0; i < particleCount; i++) {
      const particle = utilityManager.createElement("div", "particle");
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${1 + Math.random() * 1}s`;
      particle.dataset.created = Date.now().toString();

      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 50 + Math.random() * 50;
      particle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      container.appendChild(particle);
      this.activeParticles.add(particle);

      utilityManager.setTimeout(
        () => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
          this.activeParticles.delete(particle);
        },
        2000,
        `particle_${i}`
      );
    }
  },

  cleanup() {
    utilityManager.clearInterval("particleCleanup");
    utilityManager.clearInterval("idleCheck");
    utilityManager.clearInterval("initialTutorialScroll");
    utilityManager.clearInterval("manualTutorial");

    this.activeParticles.forEach((particle) => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    this.activeParticles.clear();
  },
};
