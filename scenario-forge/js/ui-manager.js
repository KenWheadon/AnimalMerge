class UIManager {
  constructor() {
    this.modalManager = new ModalManager();
    this.positionManager = new PositionManager();
    this.objectPropertiesManager = new ObjectPropertiesManager();
    this.effectManager = new EffectManager();
    this.sceneUIManager = new SceneUIManager();

    this.setupGlobalReferences();
  }

  setupGlobalReferences() {
    window.uiManager = this;
    window.modalManager = this.modalManager;
    window.positionManager = this.positionManager;
    window.objectPropertiesManager = this.objectPropertiesManager;
    window.effectManager = this.effectManager;
    window.sceneUIManager = this.sceneUIManager;
  }

  setupEventListeners() {
    const baseEvents = [
      ["load-project", "click", () => window.editor?.loadProject()],
      ["save-project", "click", () => window.editor?.saveProject()],
      ["file-input", "change", (e) => window.editor?.handleFileLoad(e)],
      [
        "asset-file-input",
        "change",
        (e) => window.assetManager?.handleAssetFileLoad(e),
      ],
      ["open-project-settings", "click", () => this.openProjectSettings()],
    ];

    baseEvents.forEach(([id, event, handler]) => {
      Utils.addEventListenerSafe(id, event, handler);
    });

    this.modalManager.setupEventListeners();
    this.positionManager.setupEventListeners();
    this.effectManager.setupEventListeners();
    this.sceneUIManager.setupEventListeners();
    this.setupProjectSettingsListeners();
  }

  setupProjectSettingsListeners() {
    const settingsEvents = [
      [
        "close-project-settings-drawer",
        "click",
        () => this.closeProjectSettings(),
      ],
      ["scene-width", "input", () => this.updateSceneDimensions()],
      ["scene-height", "input", () => this.updateSceneDimensions()],
      ["reset-scene-dimensions", "click", () => this.resetSceneDimensions()],
      ["choice-button-bg", "input", () => this.updateButtonColors()],
      ["choice-button-bg-hover", "input", () => this.updateButtonColors()],
      ["choice-button-text", "input", () => this.updateButtonColors()],
      ["continue-button-bg", "input", () => this.updateButtonColors()],
      ["continue-button-bg-hover", "input", () => this.updateButtonColors()],
      ["continue-button-text", "input", () => this.updateButtonColors()],
      ["reset-button-colors", "click", () => this.resetButtonColors()],
      ["animation-duration", "input", () => this.updateAnimationTiming()],
      ["animation-delay", "input", () => this.updateAnimationTiming()],
      ["animation-easing", "change", () => this.updateAnimationTiming()],
      ["reset-animation-timing", "click", () => this.resetAnimationTiming()],
    ];

    settingsEvents.forEach(([id, event, handler]) => {
      Utils.addEventListenerSafe(id, event, handler);
    });
  }

  openProjectSettings() {
    const drawer = document.getElementById("project-settings-drawer");
    if (drawer) {
      this.populateProjectSettings();
      drawer.classList.add("open");
    }
  }

  closeProjectSettings() {
    const drawer = document.getElementById("project-settings-drawer");
    if (drawer) {
      drawer.classList.remove("open");
    }
  }

  populateProjectSettings() {
    const project = window.editor.projectManager.getProject();
    if (!project) return;

    const dimensions = project.defaults?.sceneDimensions || {
      width: 960,
      height: 720,
    };
    const buttonColors = project.defaults?.buttonColors || {};
    const animationTiming = project.defaults?.animationTiming || {
      duration: 1000,
      delay: 0,
      easing: "ease-in-out",
    };

    // Scene dimensions
    const widthInput = document.getElementById("scene-width");
    const heightInput = document.getElementById("scene-height");
    const widthValue = document.getElementById("scene-width-value");
    const heightValue = document.getElementById("scene-height-value");

    if (widthInput) widthInput.value = dimensions.width;
    if (heightInput) heightInput.value = dimensions.height;
    if (widthValue) widthValue.textContent = dimensions.width + "px";
    if (heightValue) heightValue.textContent = dimensions.height + "px";

    // Button colors
    const choiceColors = buttonColors.choiceButton || {};
    const continueColors = buttonColors.continueButton || {};

    this.setColorInput("choice-button-bg", choiceColors.background);
    this.setColorInput("choice-button-bg-hover", choiceColors.backgroundHover);
    this.setColorInput("choice-button-text", choiceColors.text);
    this.setColorInput("continue-button-bg", continueColors.background);
    this.setColorInput(
      "continue-button-bg-hover",
      continueColors.backgroundHover
    );
    this.setColorInput("continue-button-text", continueColors.text);

    // Animation timing
    const durationInput = document.getElementById("animation-duration");
    const delayInput = document.getElementById("animation-delay");
    const easingSelect = document.getElementById("animation-easing");
    const durationValue = document.getElementById("animation-duration-value");
    const delayValue = document.getElementById("animation-delay-value");

    if (durationInput) durationInput.value = animationTiming.duration;
    if (delayInput) delayInput.value = animationTiming.delay;
    if (easingSelect) easingSelect.value = animationTiming.easing;
    if (durationValue)
      durationValue.textContent = animationTiming.duration + "ms";
    if (delayValue) delayValue.textContent = animationTiming.delay + "ms";
  }

  setColorInput(id, color) {
    const input = document.getElementById(id);
    if (input && color) {
      input.value = color;
    }
  }

  updateSceneDimensions() {
    const widthInput = document.getElementById("scene-width");
    const heightInput = document.getElementById("scene-height");
    const widthValue = document.getElementById("scene-width-value");
    const heightValue = document.getElementById("scene-height-value");

    if (!widthInput || !heightInput) return;

    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    if (widthValue) widthValue.textContent = width + "px";
    if (heightValue) heightValue.textContent = height + "px";

    window.editor.projectManager.updateDefaultSceneDimensions(width, height);

    // Re-render preview with new dimensions
    const project = window.editor.projectManager.getProject();
    if (window.editor.currentScene) {
      window.editor.previewManager.renderPreview(
        project,
        window.editor.currentScene
      );
    }
  }

  resetSceneDimensions() {
    const defaultDimensions = { width: 960, height: 720 };

    window.editor.projectManager.updateDefaultSceneDimensions(
      defaultDimensions.width,
      defaultDimensions.height
    );

    this.populateProjectSettings();

    // Re-render preview
    const project = window.editor.projectManager.getProject();
    if (window.editor.currentScene) {
      window.editor.previewManager.renderPreview(
        project,
        window.editor.currentScene
      );
    }
  }

  updateButtonColors() {
    const choiceColors = {
      background:
        document.getElementById("choice-button-bg")?.value || "#e74c3c",
      backgroundHover:
        document.getElementById("choice-button-bg-hover")?.value || "#c0392b",
      text: document.getElementById("choice-button-text")?.value || "#ffffff",
    };

    const continueColors = {
      background:
        document.getElementById("continue-button-bg")?.value || "#3498db",
      backgroundHover:
        document.getElementById("continue-button-bg-hover")?.value || "#2980b9",
      text: document.getElementById("continue-button-text")?.value || "#ffffff",
    };

    window.editor.projectManager.updateDefaultButtonColors(
      "choiceButton",
      choiceColors
    );
    window.editor.projectManager.updateDefaultButtonColors(
      "continueButton",
      continueColors
    );

    // Force immediate preview update - completely rebuild the preview
    this.forceCompletePreviewUpdate();
  }

  resetButtonColors() {
    const defaultColors = {
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

    window.editor.projectManager.updateDefaultButtonColors(
      "choiceButton",
      defaultColors.choiceButton
    );
    window.editor.projectManager.updateDefaultButtonColors(
      "continueButton",
      defaultColors.continueButton
    );

    this.populateProjectSettings();

    // Force immediate preview update - completely rebuild the preview
    this.forceCompletePreviewUpdate();
  }

  forceCompletePreviewUpdate() {
    // Clear the preview scene completely first
    const previewScene = document.getElementById("preview-scene");
    if (previewScene) {
      previewScene.innerHTML = "";

      // Force the preview manager to completely re-render the scene with new button colors
      const project = window.editor.projectManager.getProject();
      if (window.editor.currentScene) {
        // Use a small delay to ensure DOM is cleared
        requestAnimationFrame(() => {
          window.editor.previewManager.renderPreview(
            project,
            window.editor.currentScene
          );
        });
      }
    }
  }

  updateAnimationTiming() {
    const durationInput = document.getElementById("animation-duration");
    const delayInput = document.getElementById("animation-delay");
    const easingSelect = document.getElementById("animation-easing");
    const durationValue = document.getElementById("animation-duration-value");
    const delayValue = document.getElementById("animation-delay-value");

    if (!durationInput || !delayInput || !easingSelect) return;

    const timing = {
      duration: parseInt(durationInput.value),
      delay: parseInt(delayInput.value),
      easing: easingSelect.value,
    };

    if (durationValue) durationValue.textContent = timing.duration + "ms";
    if (delayValue) delayValue.textContent = timing.delay + "ms";

    window.editor.projectManager.updateDefaultAnimationTiming(timing);
  }

  resetAnimationTiming() {
    const defaultTiming = { duration: 1000, delay: 0, easing: "ease-in-out" };

    window.editor.projectManager.updateDefaultAnimationTiming(defaultTiming);
    this.populateProjectSettings();
  }

  showWarning(message) {
    this.modalManager.showWarning(message);
  }

  closeModal() {
    this.modalManager.closeModal();
  }

  showResetAllPositionsModal() {
    this.modalManager.showResetAllPositionsModal();
  }

  updateUIPositionSliders(scene) {
    this.positionManager.updateUIPositionSliders(scene);
  }

  updateChoicePositions(project, sceneId) {
    this.positionManager.updateChoicePositions(project, sceneId);
  }

  updateChoicePositionSliders(sceneId, choiceIndex, position) {
    this.positionManager.updateChoicePositionSliders(
      sceneId,
      choiceIndex,
      position
    );
  }

  resetChoicePosition(choiceIndex) {
    this.positionManager.resetChoicePosition(choiceIndex);
  }

  setupDefaultPositionControls() {
    this.positionManager.setupDefaultPositionControls();
  }

  updateUIPositionControls(scene) {
    this.positionManager.updateUIPositionControls(scene);
  }

  updateObjectProperties(project, sceneId, selectedObjectIndex) {
    this.objectPropertiesManager.updateObjectProperties(
      project,
      sceneId,
      selectedObjectIndex
    );
  }

  updateSceneObjectsList(project, sceneId, selectedObjectIndex = null) {
    this.objectPropertiesManager.updateSceneObjectsList(
      project,
      sceneId,
      selectedObjectIndex
    );
  }

  handleEffectChange(effectType) {
    this.effectManager.handleEffectChange(effectType);
  }

  closeEffectDrawer() {
    this.effectManager.closeEffectDrawer();
  }

  getCurrentEffectEditMode() {
    return this.effectManager.getCurrentEffectEditMode();
  }

  updateEffectDrawerContent(obj) {
    this.effectManager.updateEffectDrawerContent(obj);
  }

  updateSceneDropdowns(backgrounds, project) {
    this.sceneUIManager.updateSceneDropdowns(backgrounds, project);
  }

  updateScenePropertiesDisplay(project, sceneId) {
    this.sceneUIManager.updateScenePropertiesDisplay(project, sceneId);

    if (project.scenes[sceneId]) {
      this.positionManager.updateUIPositionControls(project.scenes[sceneId]);
      this.positionManager.setupDefaultPositionControls();
      this.positionManager.updateChoicePositions(project, sceneId);
    }
  }

  updateChoicesVisibility() {
    this.sceneUIManager.updateChoicesVisibility();
  }

  updateOverlayControls() {
    this.sceneUIManager.updateOverlayControls();
  }

  refreshChoicesList(project, sceneId) {
    this.sceneUIManager.refreshChoicesList(project, sceneId);
  }

  updateChoiceDisplayModeVisibility(choiceIndex, displayMode) {
    this.sceneUIManager.updateChoiceDisplayModeVisibility(
      choiceIndex,
      displayMode
    );
  }

  cleanup() {
    this.modalManager.destroy();
    this.sceneUIManager.dispose();
  }
}
