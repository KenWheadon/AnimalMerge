// Game configuration
const GAME_CONFIG = {
    animalTypes: {
        'Egg': { level: 1, mergeTo: 'Chick', sellPrice: 0 },
        'Chick': { level: 2, mergeTo: 'Chick2', sellPrice: 1 },
        'Chick2': { level: 3, mergeTo: 'Chicken', sellPrice: 0 },
        'Chicken': { level: 4, mergeTo: 'Chicken2', sellPrice: 5 },
        'Chicken2': { level: 5, mergeTo: 'Chicken3', sellPrice: 0 },
        'Chicken3': { level: 6, mergeTo: 'Rooster', sellPrice: 0 },
        'Rooster': { level: 7, mergeTo: null, sellPrice: 15 }
    },

    animalEmojis: {
        'Egg': '🥚',
        'Chick': '🐥',
        'Chick2': '🐤',
        'Chicken': '🐔',
        'Chicken2': '🐔²',
        'Chicken3': '🐔³',
        'Rooster': '🦃'
    },

    coopConfig: {
        chicken: {
            buyCost: 10,
            baseTime: 60,
            upgradeCostMultiplier: 3,
            timeReductionFactor: 0.9
        },
        rooster: {
            buyCost: 50,
            baseTime: 120,
            upgradeCostMultiplier: 3,
            timeReductionFactor: 0.9
        }
    },

    autoMergeConfig: {
        buyCost: 1,
        baseInterval: 10,
        upgradeCostMultiplier: 5,
        intervalReductionFactor: 0.9
    },

    purchaseConfig: {
        chicken: 3,
        rooster: 5
    },

    animationConfig: {
        particleCount: 12,
        wiggleInterval: 4000,
        wiggleDuration: 3000,
        achievementDuration: 3000,
        floatingNumberDuration: 2000,
        mergeExplosionDuration: 600,
        spawnAnimationDuration: 800,
        slaughterAnimationDuration: 800
    }
};