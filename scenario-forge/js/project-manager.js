class ProjectManager {
  static AUTO_SAVE_INTERVAL = 10000;
  static STORAGE_KEY = "story-editor-autosave";

  static DEFAULT_METADATA = {
    title: "New Story",
    author: "Author",
    description: "A new interactive story",
    version: "1.0.0",
    tags: [],
  };

  static DEFAULT_UI_POSITIONS = {
    textContent: { x: 50, y: 85, width: 80 },
    buttonsContainer: { x: 80, y: 85, width: 40 },
    choiceButton: { x: 80, y: 85, width: 40 },
  };

  static DEFAULT_SCENE_DIMENSIONS = {
    width: 960,
    height: 720,
  };

  static DEFAULT_BUTTON_COLORS = {
    choiceButton: {
      background: "#e74c3c",
      backgroundHover: "#c0392b",
      text: "#ffffff",
    },
    continueButton: {
      background: "#3498db",
      backgroundHover: "#2980b9",
      text: "#ffffff",
    },
  };

  static DEFAULT_ANIMATION_TIMING = {
    duration: 1000, // milliseconds
    delay: 0, // milliseconds
    easing: "ease-in-out",
  };

  constructor() {
    this.project = null;
    this.autoSaveInterval = null;
    this.autoSaveStatus = "ready";
    this.clipboardObject = null;
    this.clipboardPosition = null;
  }

  initializeProject() {
    this.project = {
      metadata: { ...ProjectManager.DEFAULT_METADATA },
      totalScenes: 0,
      currentScene: 1,
      scenes: {},
      defaults: {
        uiPositions: { ...ProjectManager.DEFAULT_UI_POSITIONS },
        sceneDimensions: { ...ProjectManager.DEFAULT_SCENE_DIMENSIONS },
        buttonColors: { ...ProjectManager.DEFAULT_BUTTON_COLORS },
        animationTiming: { ...ProjectManager.DEFAULT_ANIMATION_TIMING },
      },
    };
  }

  createNewScenario() {
    localStorage.removeItem(ProjectManager.STORAGE_KEY);
    this.clipboardObject = null;
    this.clipboardPosition = null;
    this.initializeProject();

    const firstScene = {
      id: "scene_1",
      name: "New Scene",
      type: "choice",
      content: "New scene content",
      choices: [],
      uiPositions: {
        textContent: { ...ProjectManager.DEFAULT_UI_POSITIONS.textContent },
        buttonsContainer: {
          ...ProjectManager.DEFAULT_UI_POSITIONS.buttonsContainer,
        },
      },
    };

    this.project.scenes["1"] = firstScene;
    this.project.totalScenes = 1;
    this.project.currentScene = 1;
    this.updateAutoSaveStatus("ready");
  }

  getDefaultUIPositions() {
    return this.project.defaults.uiPositions;
  }

  getDefaultSceneDimensions() {
    return this.project.defaults.sceneDimensions;
  }

  getDefaultButtonColors() {
    return this.project.defaults.buttonColors;
  }

  getDefaultAnimationTiming() {
    return this.project.defaults.animationTiming;
  }

  updateDefaultUIPosition(elementType, x, y, width) {
    this.project.defaults.uiPositions[elementType] = { x, y, width };
  }

  updateDefaultSceneDimensions(width, height) {
    this.project.defaults.sceneDimensions = { width, height };
  }

  updateDefaultButtonColors(buttonType, colors) {
    this.project.defaults.buttonColors[buttonType] = { ...colors };
  }

  updateDefaultAnimationTiming(timing) {
    this.project.defaults.animationTiming = { ...timing };
  }

  copyObject(objectData) {
    this.clipboardObject = JSON.parse(JSON.stringify(objectData));
  }

  getPastedObject() {
    return this.clipboardObject
      ? JSON.parse(JSON.stringify(this.clipboardObject))
      : null;
  }

  hasClipboardObject() {
    return this.clipboardObject !== null;
  }

  copyPosition(objectData) {
    this.clipboardPosition = {
      x: objectData.x,
      y: objectData.y,
      rotation: objectData.rotation,
      opacity: objectData.opacity,
      scale: objectData.scale,
      zIndex: objectData.zIndex,
      width: objectData.width,
    };
  }

  getPastedPosition() {
    return this.clipboardPosition ? { ...this.clipboardPosition } : null;
  }

  hasClipboardPosition() {
    return this.clipboardPosition !== null;
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, ProjectManager.AUTO_SAVE_INTERVAL);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  autoSave() {
    this.updateAutoSaveStatus("saving");
    const projectData = JSON.stringify(this.project);
    localStorage.setItem(ProjectManager.STORAGE_KEY, projectData);
    this.updateAutoSaveStatus("saved");
  }

  updateAutoSaveStatus(status) {
    this.autoSaveStatus = status;
    const indicator = document.getElementById("auto-save-indicator");
    if (!indicator) return;

    indicator.className = status;

    const statusConfig = {
      saving: { text: "Saving...", timeout: 0 },
      saved: { text: "Saved", timeout: 2000 },
      error: { text: "Error", timeout: 3000 },
      ready: { text: "Ready", timeout: 0 },
    };

    const config = statusConfig[status] || statusConfig.ready;
    indicator.textContent = config.text;

    if (config.timeout > 0) {
      setTimeout(() => {
        if (this.autoSaveStatus === status) {
          this.updateAutoSaveStatus("ready");
        }
      }, config.timeout);
    }
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem(ProjectManager.STORAGE_KEY);

    if (!savedData || savedData === "null" || savedData === "undefined") {
      return false;
    }

    try {
      const parsedProject = JSON.parse(savedData);

      if (
        !parsedProject ||
        typeof parsedProject !== "object" ||
        !parsedProject.scenes
      ) {
        return false;
      }

      this.project = parsedProject;
      this.ensureProjectDefaults();
      this.updateAutoSaveStatus("ready");
      return true;
    } catch (error) {
      return false;
    }
  }

  loadFromJSON(jsonString) {
    try {
      const parsedProject = JSON.parse(jsonString);

      if (
        !parsedProject ||
        typeof parsedProject !== "object" ||
        !parsedProject.scenes
      ) {
        throw new Error("Invalid project structure");
      }

      this.project = parsedProject;
      this.ensureProjectDefaults();
      localStorage.removeItem(ProjectManager.STORAGE_KEY);
      this.updateAutoSaveStatus("ready");
      return true;
    } catch (error) {
      return false;
    }
  }

  ensureProjectDefaults() {
    if (!this.project.defaults) {
      this.project.defaults = {};
    }

    if (!this.project.defaults.uiPositions) {
      this.project.defaults.uiPositions = {
        ...ProjectManager.DEFAULT_UI_POSITIONS,
      };
    }

    if (!this.project.defaults.sceneDimensions) {
      this.project.defaults.sceneDimensions = {
        ...ProjectManager.DEFAULT_SCENE_DIMENSIONS,
      };
    }

    if (!this.project.defaults.buttonColors) {
      this.project.defaults.buttonColors = {
        ...ProjectManager.DEFAULT_BUTTON_COLORS,
      };
    }

    if (!this.project.defaults.animationTiming) {
      this.project.defaults.animationTiming = {
        ...ProjectManager.DEFAULT_ANIMATION_TIMING,
      };
    }

    // Ensure all objects have timing properties
    Object.values(this.project.scenes).forEach((scene) => {
      if (scene.images) {
        scene.images.forEach((obj) => {
          if (!obj.animationTiming) {
            obj.animationTiming = {
              ...ProjectManager.DEFAULT_ANIMATION_TIMING,
            };
          }
        });
      }
    });
  }

  exportProject() {
    return JSON.stringify(this.project, null, 2);
  }

  saveProjectToFile() {
    const dataStr = this.exportProject();
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${this.project.metadata.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}-story.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  extractAssetsFromProject() {
    if (!this.project || !this.project.scenes) {
      return {
        backgrounds: [],
        objects: [],
      };
    }

    const backgrounds = new Set();
    const objects = new Set();

    Object.values(this.project.scenes).forEach((scene) => {
      if (scene.background) {
        backgrounds.add(scene.background);
      }
      if (scene.images) {
        scene.images.forEach((img) => {
          objects.add(img.src);
        });
      }
    });

    return {
      backgrounds: Array.from(backgrounds),
      objects: Array.from(objects),
    };
  }

  getProject() {
    return this.project;
  }

  setProject(project) {
    this.project = project;
  }

  clearProject() {
    this.project = null;
    this.clipboardObject = null;
    this.clipboardPosition = null;
    localStorage.removeItem(ProjectManager.STORAGE_KEY);
    this.updateAutoSaveStatus("ready");
  }
}
