class Utils {
  static FILENAME_PATTERNS = {
    EXTENSION: /\.[^/.]+$/,
    BACKGROUND_PREFIX: /^bg-/,
    HYPHEN_TO_SPACE: /-/g,
    WORD_BOUNDARIES: /\b\w/g,
  };

  static SCENE_TYPES = {
    BACKGROUND: "background",
    OBJECT: "object",
  };

  static DEFAULT_SCENE_ID = 1;

  static getCleanFilename(path, type = Utils.SCENE_TYPES.OBJECT) {
    if (!path) return "";

    let filename = path
      .split("/")
      .pop()
      .replace(Utils.FILENAME_PATTERNS.EXTENSION, "");

    if (type === Utils.SCENE_TYPES.BACKGROUND) {
      return filename.replace(Utils.FILENAME_PATTERNS.BACKGROUND_PREFIX, "");
    }

    if (type === Utils.SCENE_TYPES.OBJECT) {
      return filename
        .replace(Utils.FILENAME_PATTERNS.HYPHEN_TO_SPACE, " ")
        .replace(Utils.FILENAME_PATTERNS.WORD_BOUNDARIES, (l) =>
          l.toUpperCase()
        );
    }

    return filename;
  }

  static sortAssets(assets) {
    return assets.sort((a, b) => {
      const nameA = Utils.getCleanFilename(a).toLowerCase();
      const nameB = Utils.getCleanFilename(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  static addEventListenerSafe(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  static addQueryListenerSafe(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    }
  }

  static async loadImageDimensions(src, cache) {
    if (cache.has(src)) {
      return cache.get(src);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
      };

      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        cache.set(src, dimensions);
        cleanup();
        resolve(dimensions);
      };

      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  static getNextSceneId(scenes) {
    const existingIds = Object.keys(scenes)
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    return existingIds.length > 0
      ? Math.max(...existingIds) + 1
      : Utils.DEFAULT_SCENE_ID;
  }

  static getOrderedSceneKeys(scenes) {
    return Object.keys(scenes).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );
  }

  static cleanupDeletedSceneReferences(scenes, deletedSceneId) {
    for (const sceneId in scenes) {
      const scene = scenes[sceneId];

      if (scene.nextScene === deletedSceneId) {
        scene.nextScene = undefined;
      }

      if (scene.choices) {
        scene.choices.forEach((choice) => {
          if (choice.nextScene === deletedSceneId) {
            choice.nextScene = "";
          }
        });
      }
    }
  }

  static validateSceneReferences(scenes) {
    const warnings = [];

    for (const sceneId in scenes) {
      const scene = scenes[sceneId];

      if (scene.nextScene && !scenes[scene.nextScene]) {
        warnings.push(
          `Scene ${sceneId} references non-existent scene: ${scene.nextScene}`
        );
      }

      if (scene.choices) {
        scene.choices.forEach((choice, index) => {
          if (choice.nextScene && !scenes[choice.nextScene]) {
            warnings.push(
              `Scene ${sceneId}, choice ${
                index + 1
              } references non-existent scene: ${choice.nextScene}`
            );
          }
        });
      }
    }

    return warnings;
  }
}
