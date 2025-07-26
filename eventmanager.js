const eventManager = {
  notificationQueue: [],
  isShowingNotification: false,
  notificationOffset: 0,

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
