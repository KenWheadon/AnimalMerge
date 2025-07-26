const eventManager = {
  notificationQueue: [],
  isShowingNotification: false,
  notificationOffset: 0,
  initialEggAnimationInterval: null,

  initializeButtonEventListeners() {
    const buyAutoMergeBtn = document.getElementById("buyAutoMerge");
    const autoMergeToggleBtn = document.getElementById("autoMergeToggle");
    const buyShuffleBtn = document.getElementById("buyShuffle");
    const shuffleToggleBtn = document.getElementById("shuffleToggle");

    if (buyAutoMergeBtn) {
      buyAutoMergeBtn.addEventListener("click", () =>
        coopManager.buyAutoMerge()
      );
    }

    if (autoMergeToggleBtn) {
      autoMergeToggleBtn.addEventListener("click", () =>
        coopManager.toggleAutoMerge()
      );
    }

    if (buyShuffleBtn) {
      buyShuffleBtn.addEventListener("click", () => coopManager.buyShuffle());
    }

    if (shuffleToggleBtn) {
      shuffleToggleBtn.addEventListener("click", () =>
        coopManager.toggleShuffle()
      );
    }
  },

  startInitialEggButtonAnimation() {
    if (gameState.eggButtonClicked) return;

    const eggButton = document.getElementById("buyEgg");
    if (eggButton) {
      eggButton.classList.add("initial-egg-glow");
    }
  },

  stopInitialEggButtonAnimation() {
    // Remove the animation class from the DOM element immediately
    const eggButton = document.getElementById("buyEgg");
    if (eggButton) {
      eggButton.classList.remove("initial-egg-glow");
    }
  },

  checkForNewMergeablePairs() {
    // Compare current pairs with previous pairs to find new ones
    const newPairs = gameState.mergeablePairs.filter((currentPair) => {
      return !gameState.previousMergeablePairs.some((previousPair) => {
        return (
          (currentPair.source.i === previousPair.source.i &&
            currentPair.source.j === previousPair.source.j &&
            currentPair.target.i === previousPair.target.i &&
            currentPair.target.j === previousPair.target.j) ||
          (currentPair.source.i === previousPair.target.i &&
            currentPair.source.j === previousPair.target.j &&
            currentPair.target.i === previousPair.source.i &&
            currentPair.target.j === previousPair.source.j)
        );
      });
    });

    // Animate new pairs
    if (newPairs.length > 0) {
      newPairs.forEach((pair) => {
        this.animateNewMergeablePair(pair);
      });
    }
  },

  animateNewMergeablePair(pair) {
    const sourceCell = document.getElementById(
      `cell-${pair.source.i}-${pair.source.j}`
    );
    const targetCell = document.getElementById(
      `cell-${pair.target.i}-${pair.target.j}`
    );

    if (sourceCell && targetCell) {
      // Add to recently animated to prevent regular wiggle from interfering
      const sourceCellKey = `${pair.source.i}-${pair.source.j}`;
      const targetCellKey = `${pair.target.i}-${pair.target.j}`;

      gameState.recentlyAnimatedCells.push(sourceCellKey, targetCellKey);

      // Apply wiggle and glow animation
      sourceCell.classList.add("wiggle", "glow");
      targetCell.classList.add("wiggle", "glow");

      // Remove animation after duration
      setTimeout(() => {
        sourceCell.classList.remove("wiggle", "glow");
        targetCell.classList.remove("wiggle", "glow");

        // Remove from recently animated list
        gameState.recentlyAnimatedCells =
          gameState.recentlyAnimatedCells.filter(
            (c) => c !== sourceCellKey && c !== targetCellKey
          );
      }, GAME_CONFIG.animationConfig.wiggleDuration);
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

    popup.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <img src="${GAME_CONFIG.animalImages.EndDemoAnimal}" alt="End Demo Animal" style="width: 120px; height: 120px; object-fit: contain; margin: 0 auto; display: block; border-radius: 0.5rem;" />
      </div>
      <h2 style="color: #fbbf24; font-size: 2rem; font-weight: bold; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🎉 Demo Ended! 🎉</h2>
      <p style="color: #d1d5db; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;">
        Congratulations! You've reached the final animal and completed this demo. 
        The <strong style="color: #fbbf24;">End Demo Animal</strong> can be sold but cannot merge any further.
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

  startWiggleAnimation() {
    setInterval(() => {
      // Don't wiggle during drag operations or if user is interacting
      if (gameState.draggedCell || gameState.selectedCell) return;

      // Only proceed if auto-merge or shuffle is owned (advanced feature)
      if (!gameState.autoMerge.owned && !gameState.shuffle.owned) return;

      this.clearWiggleGlow();

      // Only wiggle animals that are part of mergeable pairs
      if (gameState.mergeablePairs.length === 0) return;

      // Select a random mergeable pair to wiggle
      const randomPairIndex = Math.floor(
        Math.random() * gameState.mergeablePairs.length
      );
      const selectedPair = gameState.mergeablePairs[randomPairIndex];

      const sourceCellKey = `${selectedPair.source.i}-${selectedPair.source.j}`;
      const targetCellKey = `${selectedPair.target.i}-${selectedPair.target.j}`;

      // Don't wiggle if these cells were recently animated
      if (
        gameState.recentlyAnimatedCells.includes(sourceCellKey) ||
        gameState.recentlyAnimatedCells.includes(targetCellKey)
      ) {
        return;
      }

      const sourceCell = document.getElementById(
        `cell-${selectedPair.source.i}-${selectedPair.source.j}`
      );
      const targetCell = document.getElementById(
        `cell-${selectedPair.target.i}-${selectedPair.target.j}`
      );

      if (sourceCell && targetCell) {
        // Add both cells to recently animated list
        gameState.recentlyAnimatedCells.push(sourceCellKey, targetCellKey);

        // Apply wiggle and glow animation
        sourceCell.classList.add("wiggle", "glow");
        targetCell.classList.add("wiggle", "glow");

        // Remove animation after duration
        setTimeout(() => {
          sourceCell.classList.remove("wiggle", "glow");
          targetCell.classList.remove("wiggle", "glow");

          // Remove from recently animated list
          gameState.recentlyAnimatedCells =
            gameState.recentlyAnimatedCells.filter(
              (c) => c !== sourceCellKey && c !== targetCellKey
            );
        }, GAME_CONFIG.animationConfig.wiggleDuration);
      }
    }, GAME_CONFIG.animationConfig.wiggleInterval);
  },
};
