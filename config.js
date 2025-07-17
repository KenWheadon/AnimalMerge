// Game configuration
const GAME_CONFIG = {
  animalTypes: {
    Egg: { level: 1, mergeTo: "Chick", sellPrice: 0 },
    Chick: { level: 2, mergeTo: "Chick2", sellPrice: 1 },
    Chick2: { level: 3, mergeTo: "Chicken", sellPrice: 2 },
    Chicken: { level: 4, mergeTo: "Chicken2", sellPrice: 5 },
    Chicken2: { level: 5, mergeTo: "Chicken3", sellPrice: 6 },
    Chicken3: { level: 6, mergeTo: "Rooster", sellPrice: 7 },
    Rooster: { level: 7, mergeTo: "Rooster2", sellPrice: 15 },
    Rooster2: { level: 8, mergeTo: "Rooster3", sellPrice: 16 },
    Rooster3: { level: 9, mergeTo: "Rooster4", sellPrice: 17 },
    Rooster4: { level: 10, mergeTo: null, sellPrice: 18 },
  },

  animalEmojis: {
    Egg: "🥚",
    Chick: "🐥1",
    Chick2: "🐤2",
    Chicken: "🐔1",
    Chicken2: "🐔2",
    Chicken3: "🐔3",
    Rooster: "🦃1",
    Rooster: "🦃2",
    Rooster: "🦃3",
    Rooster: "🦃4",
  },

  coopConfig: {
    chicken: {
      buyCost: 10,
      baseTime: 60,
      upgradeCostMultiplier: 3,
      timeReductionFactor: 0.9,
    },
    rooster: {
      buyCost: 50,
      baseTime: 120,
      upgradeCostMultiplier: 6,
      timeReductionFactor: 0.9,
    },
  },

  autoMergeConfig: {
    buyCost: 1,
    baseInterval: 10,
    upgradeCostMultiplier: 10,
    intervalReductionFactor: 0.9,
  },

  purchaseConfig: {
    chicken: 7,
    rooster: 20,
  },

  animationConfig: {
    particleCount: 12,
    wiggleInterval: 4000,
    wiggleDuration: 3000,
    achievementDuration: 3000,
    floatingNumberDuration: 2000,
    mergeExplosionDuration: 600,
    spawnAnimationDuration: 800,
    slaughterAnimationDuration: 800,
  },

  gridConfig: {
    initialSize: 2,
    maxSize: 4,
    expansionCosts: {
      row2: 5, // Cost for each square in row 2
      row3: 25, // Cost for each square in row 3
      row4: 250, // Cost for each square in row 4
    },
  },
};
