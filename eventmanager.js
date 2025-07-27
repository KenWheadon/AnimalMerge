const eventManager = {
  notificationQueue: [],
  isShowingNotification: false,
  notificationOffset: 0,

  // FIX: Add centralized particle management
  activeParticles: new Set(),
  particleCleanupInterval: null,

  // Idle detection system
  idleCheckInterval: null,
  tutorialScrollInterval: null,
  tutorialMessages: [
    "🥚 Click the free Egg button to place your first animal!",
    "🔄 Drag identical animals together to merge and upgrade them!",
    "💰 Drag animals to the butcher shop to sell them for money!",
    "🖱️ Right-click animals to quickly send them to the butcher!",
    "🌱 Click grass squares with your money to expand your farm!",
    "🏡 Create better animals to unlock coops that generate eggs automatically!",
    "⚙️ Buy Auto-Merge to automatically combine animals every 25 seconds!",
    "🔀 Buy Shuffle to rearrange your animals after auto-merging!",
    "💡 Tip: Merge two of the same animal type to create the next tier!",
    "🎯 Goal: Keep merging to discover all the different animal types!",
  ],
  currentTutorialIndex: 0,
  lastTutorialTime: 0,
  tutorialScrollDelay: 6000, // 6 seconds between tutorial messages for initial cycle
  initialTutorialComplete: false,
  isPlayingTutorial: false,

  initializeButtonEventListeners() {
    const buyAutoMergeBtn = document.getElementById("buyAutoMerge");
    const autoMergeToggleBtn = document.getElementById("autoMergeToggle");
    const buyShuffleBtn = document.getElementById("buyShuffle");
    const shuffleToggleBtn = document.getElementById("shuffleToggle");
    const helpBtn = document.getElementById("helpButton");

    // FIX: Initialize particle cleanup system
    this.initializeParticleCleanup();

    if (buyAutoMergeBtn) {
      // Add hover sound
      buyAutoMergeBtn.addEventListener("mouseenter", () => {
        audioManager.playSound("button-hover");
      });

      buyAutoMergeBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        audioManager.playSound("button-click");
        coopManager.buyAutoMerge();
      });
    }

    if (autoMergeToggleBtn) {
      // Add hover sound
      autoMergeToggleBtn.addEventListener("mouseenter", () => {
        audioManager.playSound("button-hover");
      });

      autoMergeToggleBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        audioManager.playSound("button-click");
        coopManager.toggleAutoMerge();
      });
    }

    if (buyShuffleBtn) {
      // Add hover sound
      buyShuffleBtn.addEventListener("mouseenter", () => {
        audioManager.playSound("button-hover");
      });

      buyShuffleBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        audioManager.playSound("button-click");
        coopManager.buyShuffle();
      });
    }

    if (shuffleToggleBtn) {
      // Add hover sound
      shuffleToggleBtn.addEventListener("mouseenter", () => {
        audioManager.playSound("button-hover");
      });

      shuffleToggleBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        audioManager.playSound("button-click");
        coopManager.toggleShuffle();
      });
    }

    if (helpBtn) {
      // Add hover sound
      helpBtn.addEventListener("mouseenter", () => {
        audioManager.playSound("button-hover");
      });

      helpBtn.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now(); // Track interaction
        audioManager.playSound("button-click");
        this.playTutorialSequence();
      });
    }
  },

  // FIX: Initialize particle cleanup system for optimization
  initializeParticleCleanup() {
    // Clean up orphaned particles every 5 seconds
    this.particleCleanupInterval = setInterval(() => {
      this.cleanupOrphanedParticles();
    }, 5000);
  },

  // FIX: Clean up particles that may have been left behind
  cleanupOrphanedParticles() {
    const particles = document.querySelectorAll(
      ".particle, .processing-particle, .flying-coin, .flying-money-value"
    );
    const maxAge = 10000; // 10 seconds max age for any particle
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
    // Check for idle states every 2 seconds
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleState();
    }, 2000);

    // Don't start tutorial cycle here - wait for popup to be closed
  },

  startInitialTutorialCycle() {
    // Start the initial tutorial cycle immediately
    this.isPlayingTutorial = true;
    this.currentTutorialIndex = 0;
    this.lastTutorialTime = Date.now();

    // Show first message immediately
    this.showTutorialMessage();

    // Set up interval for the rest of the messages
    this.tutorialScrollInterval = setInterval(() => {
      if (this.isPlayingTutorial && !this.initialTutorialComplete) {
        const now = Date.now();
        if (now - this.lastTutorialTime >= this.tutorialScrollDelay) {
          if (this.currentTutorialIndex < this.tutorialMessages.length) {
            this.showTutorialMessage();
            this.lastTutorialTime = now;
          } else {
            // Initial cycle complete
            this.initialTutorialComplete = true;
            this.isPlayingTutorial = false;
            clearInterval(this.tutorialScrollInterval);
            this.showHelpButton();
          }
        }
      }
    }, 1000);
  },

  playTutorialSequence() {
    if (this.isPlayingTutorial) return; // Don't start if already playing

    this.isPlayingTutorial = true;
    this.currentTutorialIndex = 0;
    this.lastTutorialTime = Date.now();

    // Show first message immediately
    this.showTutorialMessage();

    // Set up interval for manual tutorial playback
    this.tutorialScrollInterval = setInterval(() => {
      if (this.isPlayingTutorial) {
        const now = Date.now();
        if (now - this.lastTutorialTime >= this.tutorialScrollDelay) {
          if (this.currentTutorialIndex < this.tutorialMessages.length) {
            this.showTutorialMessage();
            this.lastTutorialTime = now;
          } else {
            // Manual cycle complete
            this.isPlayingTutorial = false;
            clearInterval(this.tutorialScrollInterval);
          }
        }
      }
    }, 1000);
  },

  showHelpButton() {
    // Add help button to the status area or a suitable location
    const statusElement = document.getElementById("status");
    if (statusElement && !document.getElementById("helpButton")) {
      const helpButton = document.createElement("button");
      helpButton.id = "helpButton";
      helpButton.className = "help-button";
      helpButton.innerHTML = "❓";
      helpButton.title = "Show tutorial tips";

      // Position the help button in the corner of the status area
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

      // Add hover effect
      helpButton.addEventListener("mouseenter", () => {
        audioManager.playSound("button-hover");
        helpButton.style.transform = "scale(1.1)";
        helpButton.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
      });

      helpButton.addEventListener("mouseleave", () => {
        helpButton.style.transform = "scale(1)";
        helpButton.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.3)";
      });

      // Make status element relative positioned so the button can be positioned absolutely within it
      statusElement.style.position = "relative";
      statusElement.appendChild(helpButton);

      // Add event listener (will be picked up by initializeButtonEventListeners)
      helpButton.addEventListener("click", () => {
        gameState.lastInteractionTime = Date.now();
        audioManager.playSound("button-click");
        this.playTutorialSequence();
      });
    }
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

  showTutorialMessage() {
    if (this.currentTutorialIndex >= this.tutorialMessages.length) {
      return;
    }

    const message = this.tutorialMessages[this.currentTutorialIndex];
    this.currentTutorialIndex++;

    // FIX: Use status system instead of achievement notifications for tutorial messages
    updateStatus(message);
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
    closeButton.addEventListener("mouseenter", () => {
      audioManager.playSound("button-hover");
    });
    closeButton.addEventListener("click", () => {
      audioManager.playSound("button-click");
      backdrop.remove();
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        audioManager.playSound("button-click");
        backdrop.remove();
      }
    });

    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        audioManager.playSound("button-click");
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
    // Don't show regular notifications while tutorial is playing (except for the initial cycle)
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
    // Play achievement awarded sound
    audioManager.playSound("achievement-awarded");
    this.queueNotification(message);
  },

  showFloatingNumber(text, parent) {
    const number = document.createElement("div");
    number.className = "floating-number";
    number.textContent = text;
    number.style.left = "50%";
    number.style.top = "50%";
    number.style.transform = "translate(-50%, -50%)";

    // FIX: Add timestamp for cleanup tracking
    number.dataset.created = Date.now().toString();

    parent.appendChild(number);
    this.activeParticles.add(number);

    setTimeout(() => {
      if (number.parentNode) {
        number.parentNode.removeChild(number);
      }
      this.activeParticles.delete(number);
    }, GAME_CONFIG.animationConfig.floatingNumberDuration);
  },

  // FIX: Enhanced particle creation with limits and optimization
  createParticles(element, value = null) {
    const rect = element.getBoundingClientRect();
    const container = document.body;

    // FIX: Dynamic particle count based on value with reasonable limits
    let particleCount = GAME_CONFIG.animationConfig.particleCount; // Default 20

    if (value !== null) {
      // Scale particle count based on value, but cap it for performance
      const minParticles = 5;
      const maxParticles = 30; // Maximum for performance
      const scaledCount = Math.floor(value / 100) + minParticles; // 1 particle per 100 value
      particleCount = Math.min(scaledCount, maxParticles);
    }

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.animationDelay = `${Math.random() * 0.5}s`;
      particle.style.animationDuration = `${1 + Math.random() * 1}s`;

      // FIX: Add timestamp for cleanup tracking
      particle.dataset.created = Date.now().toString();

      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 50 + Math.random() * 50;
      particle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      container.appendChild(particle);
      this.activeParticles.add(particle);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
        this.activeParticles.delete(particle);
      }, 2000);
    }
  },

  // FIX: Cleanup method to be called when game is shut down
  cleanup() {
    if (this.particleCleanupInterval) {
      clearInterval(this.particleCleanupInterval);
      this.particleCleanupInterval = null;
    }

    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }

    if (this.tutorialScrollInterval) {
      clearInterval(this.tutorialScrollInterval);
      this.tutorialScrollInterval = null;
    }

    // Remove all active particles
    this.activeParticles.forEach((particle) => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    this.activeParticles.clear();
  },
};
