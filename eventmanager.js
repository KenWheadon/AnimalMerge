const eventManager = {
  notificationQueue: [],
  isShowingNotification: false,
  notificationOffset: 0,

  // Idle detection system
  idleCheckInterval: null,
  tutorialScrollInterval: null,
  tutorialMessages: [
    "🥚 Click the free Egg button to place your first animal!",
    "🔄 Drag identical animals together to merge and upgrade them!",
    "💰 Drag animals to the butcher shop to sell them for money!",
    "🌱 Click grass squares with your money to expand your farm!",
    "🏡 Create better animals to unlock coops that generate eggs automatically!",
    "⚙️ Buy Auto-Merge to automatically combine animals every 25 seconds!",
    "🔀 Buy Shuffle to rearrange your animals after auto-merging!",
    "💡 Tip: Merge two of the same animal type to create the next tier!",
    "🎯 Goal: Keep merging to discover all the different animal types!",
  ],
  currentTutorialIndex: 0,
  lastTutorialTime: 0,
  tutorialScrollDelay: 8000, // 8 seconds between tutorial messages

  initializeButtonEventListeners() {
    const buyAutoMergeBtn = document.getElementById("buyAutoMerge");
    const autoMergeToggleBtn = document.getElementById("autoMergeToggle");
    const buyShuffleBtn = document.getElementById("buyShuffle");
    const shuffleToggleBtn = document.getElementById("shuffleToggle");

    if (buyAutoMergeBtn) {
      buyAutoMergeBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        coopManager.buyAutoMerge();
      });
    }

    if (autoMergeToggleBtn) {
      autoMergeToggleBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        coopManager.toggleAutoMerge();
      });
    }

    if (buyShuffleBtn) {
      buyShuffleBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        coopManager.buyShuffle();
      });
    }

    if (shuffleToggleBtn) {
      shuffleToggleBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        coopManager.toggleShuffle();
      });
    }
  },

  initializeIdleDetection() {
    // Check for idle states every 2 seconds
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleState();
    }, 2000);

    // Start tutorial scrolling when no notifications are active
    this.startTutorialScrolling();
  },

  checkIdleState() {
    const now = Date.now();
    const timeSinceLastInteraction = now - gameState.lastInteractionTime;

    // Check for 10 second idle + open space for egg glow
    if (timeSinceLastInteraction >= 10000) {
      this.handleEggGlowIdle();
    }

    // Check for 20 second idle + animals present for wiggle
    if (timeSinceLastInteraction >= 20000) {
      this.handleAnimalWiggleIdle();
      // Reset the interaction time to prevent constant wiggling
      gameState.lastInteractionTime = now - 15000; // Reset to 15 seconds ago
    }
  },

  handleEggGlowIdle() {
    // Check if there's an open space on the board
    const hasOpenSpace = GAME_CONFIG.gridConfig.availableSpots.some(
      ({ row, col }) =>
        gameState.purchasedCells.has(`${row}-${col}`) &&
        !gameState.grid[row][col]
    );

    if (hasOpenSpace && !gameState.eggButtonClicked) {
      // Make the free egg button glow and scale once
      const eggButton = document.getElementById("buyEgg");
      if (eggButton && !eggButton.classList.contains("egg-button-pulse")) {
        eggButton.classList.add("glow", "pulse");
        setTimeout(() => {
          eggButton.classList.remove("glow", "pulse");
        }, 3000); // Remove after 3 seconds (glow animation runs 3 times)
      }
    }
  },

  handleAnimalWiggleIdle() {
    // Find all animals/eggs on the board
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
      // Pick a random animal to wiggle
      const randomCell =
        occupiedCells[Math.floor(Math.random() * occupiedCells.length)];
      const cellElement = document.getElementById(
        `cell-${randomCell.row}-${randomCell.col}`
      );

      if (cellElement) {
        // Add wiggle animation
        cellElement.classList.add("butcher-wiggle");
        setTimeout(() => {
          cellElement.classList.remove("butcher-wiggle");
        }, 1000); // Remove after 1 second
      }
    }
  },

  startTutorialScrolling() {
    // Start tutorial message cycling
    this.tutorialScrollInterval = setInterval(() => {
      // Only show tutorial messages when no other notifications are active
      if (!this.isShowingNotification && this.notificationQueue.length === 0) {
        const now = Date.now();
        if (now - this.lastTutorialTime >= this.tutorialScrollDelay) {
          this.showTutorialMessage();
          this.lastTutorialTime = now;
        }
      }
    }, 1000); // Check every second
  },

  showTutorialMessage() {
    const message = this.tutorialMessages[this.currentTutorialIndex];
    this.currentTutorialIndex =
      (this.currentTutorialIndex + 1) % this.tutorialMessages.length;

    // Show tutorial message with a different style
    this.showTutorialNotification(message);
  },

  showTutorialNotification(message) {
    const notification = document.createElement("div");
    notification.className = "achievement-popup tutorial-notification";
    notification.style.top = `${20 + this.notificationOffset}px`;
    notification.style.background = "linear-gradient(145deg, #e0f2fe, #bae6fd)";
    notification.style.border = "2px solid #0ea5e9";
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="text-2xl">💡</div>
            <div class="font-bold text-blue-800">${message}</div>
        </div>
    `;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    });

    this.notificationOffset += 80;

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";

      setTimeout(() => {
        notification.remove();
        this.notificationOffset -= 80;
      }, 500);
    }, 6000); // Show tutorial messages longer than achievements
  },

  startInitialEggButtonAnimation() {
    console.log("startInitialEggButtonAnimation called");
    console.log(`gameState.eggButtonClicked: ${gameState.eggButtonClicked}`);

    // The animation is now applied via CSS class in generateBuyAnimalButtons
    // This method is called to ensure the animation starts
    const eggButton = document.getElementById("buyEgg");
    console.log("eggButton found:", eggButton);

    if (eggButton && !gameState.eggButtonClicked) {
      console.log("Adding egg-button-pulse class");
      eggButton.classList.add("egg-button-pulse");
    } else {
      console.log("Not adding animation - button not found or already clicked");
    }
  },

  stopInitialEggButtonAnimation() {
    console.log("stopInitialEggButtonAnimation called");
    const eggButton = document.getElementById("buyEgg");
    console.log("eggButton found:", eggButton);

    if (eggButton) {
      console.log("Removing egg-button-pulse class");
      console.log("Classes before removal:", eggButton.className);
      eggButton.classList.remove("egg-button-pulse");
      console.log("Classes after removal:", eggButton.className);
    } else {
      console.log("Egg button not found when trying to stop animation");
    }
  },

  showDemoEndedPopup() {
    const backdrop = document.createElement("div");
    backdrop.className = "demo-ended-backdrop";
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

    const popup = document.createElement("div");
    popup.className = "demo-ended-popup";
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
    closeButton.addEventListener("click", () => {
      backdrop.remove();
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
      }
    });

    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        backdrop.remove();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);
  },

  queueNotification(message) {
    this.notificationQueue.push(message);
    this.processNotificationQueue();
  },

  processNotificationQueue() {
    if (this.isShowingNotification || this.notificationQueue.length === 0) {
      return;
    }

    this.isShowingNotification = true;
    const message = this.notificationQueue.shift();
    this.showNotification(message);
  },

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "achievement-popup";
    notification.style.top = `${20 + this.notificationOffset}px`;
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="text-2xl">🏆</div>
            <div class="font-bold text-yellow-800">${message}</div>
        </div>
    `;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    });

    this.notificationOffset += 80;

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";

      setTimeout(() => {
        notification.remove();
        this.notificationOffset -= 80;
        this.isShowingNotification = false;
        this.processNotificationQueue();
      }, 500);
    }, GAME_CONFIG.animationConfig.achievementDuration);
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
    this.queueNotification(message);
  },

  showFloatingNumber(text, parent) {
    const number = document.createElement("div");
    number.className = "floating-number";
    number.textContent = text;
    number.style.left = "50%";
    number.style.top = "50%";
    number.style.transform = "translate(-50%, -50%)";
    parent.appendChild(number);

    setTimeout(
      () => number.remove(),
      GAME_CONFIG.animationConfig.floatingNumberDuration
    );
  },

  createParticles(element) {
    const rect = element.getBoundingClientRect();
    const container = document.body;

    for (let i = 0; i < GAME_CONFIG.animationConfig.particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${1 + Math.random() * 1}s`;

      const angle =
        (Math.PI * 2 * i) / GAME_CONFIG.animationConfig.particleCount;
      const distance = 50 + Math.random() * 50;
      particle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      container.appendChild(particle);
      setTimeout(() => particle.remove(), 2000);
    }
  },
};
