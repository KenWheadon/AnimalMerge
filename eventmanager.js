// Event Manager - Handles events, animations, and visual effects
const eventManager = {
  // Notification queue system
  notificationQueue: [],
  isShowingNotification: false,
  notificationOffset: 0,

  // Initialize button event listeners - now handles dynamic buttons
  initializeButtonEventListeners() {
    // Auto-merge buttons
    const buyAutoMergeBtn = document.getElementById("buyAutoMerge");
    const upgradeAutoMergeBtn = document.getElementById("upgradeAutoMerge");
    const autoMergeToggleBtn = document.getElementById("autoMergeToggle");
    const buyDiagonalBtn = document.getElementById("buyDiagonalUpgrade");
    const buyMagicBtn = document.getElementById("buyMagicUpgrade");

    // Shuffle buttons
    const buyShuffleBtn = document.getElementById("buyShuffle");
    const upgradeShuffleBtn = document.getElementById("upgradeShuffle");
    const shuffleToggleBtn = document.getElementById("shuffleToggle");

    if (buyAutoMergeBtn) {
      buyAutoMergeBtn.addEventListener("click", () =>
        coopManager.buyAutoMerge()
      );
    }

    if (upgradeAutoMergeBtn) {
      upgradeAutoMergeBtn.addEventListener("click", () =>
        coopManager.upgradeAutoMerge()
      );
    }

    if (autoMergeToggleBtn) {
      autoMergeToggleBtn.addEventListener("click", () =>
        coopManager.toggleAutoMerge()
      );
    }

    if (buyDiagonalBtn) {
      buyDiagonalBtn.addEventListener("click", () =>
        coopManager.buyDiagonalUpgrade()
      );
    }

    if (buyMagicBtn) {
      buyMagicBtn.addEventListener("click", () =>
        coopManager.buyMagicUpgrade()
      );
    }

    if (buyShuffleBtn) {
      buyShuffleBtn.addEventListener("click", () => coopManager.buyShuffle());
    }

    if (upgradeShuffleBtn) {
      upgradeShuffleBtn.addEventListener("click", () =>
        coopManager.upgradeShuffle()
      );
    }

    if (shuffleToggleBtn) {
      shuffleToggleBtn.addEventListener("click", () =>
        coopManager.toggleShuffle()
      );
    }
  },

  // Enhanced notification queue system
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

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    });

    // Update offset for next notification
    this.notificationOffset += 80;

    setTimeout(() => {
      // Animate out
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";

      setTimeout(() => {
        notification.remove();
        this.notificationOffset -= 80;
        this.isShowingNotification = false;

        // Process next notification in queue
        this.processNotificationQueue();
      }, 500);
    }, GAME_CONFIG.animationConfig.achievementDuration);
  },

  // Visual Helper Functions
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

  // Animation and Effect Functions
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

      // Random direction
      const angle =
        (Math.PI * 2 * i) / GAME_CONFIG.animationConfig.particleCount;
      const distance = 50 + Math.random() * 50;
      particle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      container.appendChild(particle);
      setTimeout(() => particle.remove(), 2000);
    }
  },

  // Wiggle Animation
  startWiggleAnimation() {
    setInterval(() => {
      if (
        gameState.draggedCell ||
        gameState.selectedCell ||
        (!gameState.autoMerge.owned && !gameState.shuffle.owned)
      )
        return;
      this.clearWiggleGlow();
      const nonEmptyCells = [];
      GAME_CONFIG.gridConfig.availableSpots.forEach(({ row: i, col: j }) => {
        if (
          gameState.purchasedCells.has(`${i}-${j}`) &&
          gameState.grid[i][j] &&
          !gameState.recentlyAnimatedCells.includes(`${i}-${j}`)
        ) {
          nonEmptyCells.push({ i, j });
        }
      });
      if (nonEmptyCells.length === 0) return;
      const count = Math.min(
        Math.floor(Math.random() * 3) + 1,
        nonEmptyCells.length
      );
      const selectedCells = [];
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * nonEmptyCells.length);
        selectedCells.push(nonEmptyCells.splice(index, 1)[0]);
      }
      selectedCells.forEach(({ i, j }) => {
        const cell = document.getElementById(`cell-${i}-${j}`);
        if (cell) {
          cell.classList.add("wiggle", "glow");
          gameState.recentlyAnimatedCells.push(`${i}-${j}`);
          setTimeout(() => {
            if (cell) {
              cell.classList.remove("wiggle", "glow");
              gameState.recentlyAnimatedCells =
                gameState.recentlyAnimatedCells.filter(
                  (c) => c !== `${i}-${j}`
                );
            }
          }, GAME_CONFIG.animationConfig.wiggleDuration);
        }
      });
    }, GAME_CONFIG.animationConfig.wiggleInterval);
  },
};
