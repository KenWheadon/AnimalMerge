class LoadingManager {
  constructor() {
    this.loadingStartTime = null;
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.imagePromises = [];
    this.MINIMUM_LOADING_TIME = 2000; // 2 seconds minimum
  }

  getAllGameImages() {
    // Return array of all image paths used in Furry Merge Farm
    const gameImages = [];

    // Add all animal images from config
    Object.values(GAME_CONFIG.animalImages).forEach((imagePath) => {
      gameImages.push(imagePath);
    });

    // Add other game images
    gameImages.push(
      "images/company-logo.png",
      "images/cow.png", // Tutorial cow
      "images/butcher.png" // Butcher image
    );

    // Add credits images
    Object.values(CREDITS).forEach((person) => {
      if (person.previewImage) gameImages.push(person.previewImage);
      if (person.fullImage && person.fullImage !== person.previewImage) {
        gameImages.push(person.fullImage);
      }
    });

    return [...new Set(gameImages)]; // Remove duplicates
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.loadedAssets++;
        this.updateLoadingProgress();
        resolve(img);
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        this.loadedAssets++;
        this.updateLoadingProgress();
        resolve(null); // Don't reject, just resolve with null to continue loading
      };

      img.src = src;
    });
  }

  updateLoadingProgress() {
    const progress = Math.floor((this.loadedAssets / this.totalAssets) * 100);
    const loadingBar = document.getElementById("loadingBar");
    const loadingPercentage = document.getElementById("loadingPercentage");
    const loadingText = document.getElementById("loadingText");

    if (loadingBar && loadingPercentage) {
      loadingBar.style.width = progress + "%";
      loadingPercentage.textContent = progress + "%";
    }

    // Update loading message based on progress
    if (loadingText) {
      const messages = [
        "Loading Furry Merge Farm...",
        "Preparing farm animals...",
        "Setting up coops...",
        "Loading butcher shop...",
        "Almost ready to farm!",
      ];
      const messageIndex = Math.floor((progress / 100) * (messages.length - 1));
      loadingText.textContent =
        messages[Math.min(messageIndex, messages.length - 1)];
    }

    // Check if loading is complete
    if (this.loadedAssets >= this.totalAssets) {
      this.completeLoading();
    }
  }

  async showLoadingScreen() {
    this.loadingStartTime = Date.now();

    // Show loading screen
    document.getElementById("loadingScreen").style.display = "flex";

    // Start loading all assets
    await this.startAssetLoading();
  }

  async startAssetLoading() {
    const loadingText = document.getElementById("loadingText");

    // Get all images to preload
    const imagePaths = this.getAllGameImages();

    // Count images for progress tracking
    this.totalAssets = imagePaths.length;
    this.loadedAssets = 0;

    // Initial loading message
    if (loadingText) {
      loadingText.textContent = "Loading Furry Merge Farm...";
    }

    console.log(`Starting to preload ${imagePaths.length} images...`);

    // Start preloading images and let audio load independently
    const imageLoadingPromise = this.startImageLoading(imagePaths);

    // Wait for AudioManager to finish loading (but don't track individual files)
    const audioLoadingPromise = this.waitForAudioManager();

    // Wait for both image and audio loading to complete
    await Promise.all([imageLoadingPromise, audioLoadingPromise]);

    console.log(`Finished preloading all assets`);
  }

  async startImageLoading(imagePaths) {
    // Start preloading all images
    const imagePromises = imagePaths.map((imagePath) =>
      this.preloadImage(imagePath)
    );
    await Promise.all(imagePromises);
    console.log(`Finished preloading ${imagePaths.length} images`);
  }

  async waitForAudioManager() {
    // Give audio manager time to initialize
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Audio assets loaded`);
        resolve();
      }, 500); // Small delay to let audio start loading
    });
  }

  completeLoading() {
    // Ensure minimum loading time has passed
    const elapsed = Date.now() - this.loadingStartTime;
    const remaining = this.MINIMUM_LOADING_TIME - elapsed;

    if (remaining > 0) {
      setTimeout(() => {
        this.finishLoading();
      }, remaining);
    } else {
      this.finishLoading();
    }
  }

  finishLoading() {
    // Hide loading screen
    document.getElementById("loadingScreen").style.display = "none";

    // Initialize the game
    initializeGame();

    console.log("Loading complete! All assets preloaded.");
  }
}

// Global loading manager instance
const loadingManager = new LoadingManager();
