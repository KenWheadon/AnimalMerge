class SceneController {
  constructor(editor) {
    this.editor = editor;
  }

  addScene() {
    const project = this.editor.projectManager.getProject();
    const sceneId = this.editor.sceneManager.addScene(project);
    // FIX: Ensure UI refreshes after adding scene
    this.refreshAllUIComponents();
    this.selectScene(sceneId);
  }

  duplicateScene() {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const sceneId = this.editor.sceneManager.duplicateScene(
      project,
      this.editor.currentScene
    );
    if (sceneId) {
      // FIX: Ensure UI refreshes after duplicating scene
      this.refreshAllUIComponents();
      this.selectScene(sceneId);
    }
  }

  deleteScene() {
    if (!this.editor.currentScene) return;

    if (confirm("Are you sure you want to delete this scene?")) {
      const project = this.editor.projectManager.getProject();
      this.editor.sceneManager.deleteScene(project, this.editor.currentScene);
      this.editor.currentScene = null;
      // FIX: Ensure UI refreshes after deleting scene
      this.refreshAllUIComponents();
      this.editor.previewManager.clearPreview();
      this.editor.uiManager.updateSceneObjectsList(project, null);
    }
  }

  selectScene(sceneId) {
    this.editor.currentScene = sceneId;
    this.editor.sceneManager.selectScene(sceneId);
    this.editor.previewManager.deselectObject();
    this.renderSceneAndUpdateUI();
  }

  updateSceneProperties() {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const sceneProperties = this.extractScenePropertiesFromUI(scene);

    scene.name = sceneProperties.name;
    this.editor.sceneManager.updateSceneProperties(
      project,
      this.editor.currentScene,
      sceneProperties
    );

    // FIX: Refresh scene list when properties change to update displayed names
    this.editor.sceneManager.refreshSceneList(project);
    this.editor.sceneManager.updateActiveSceneInList();

    this.renderSceneAndUpdateUI();
    this.editor.uiManager.updateChoicesVisibility();
  }

  extractScenePropertiesFromUI(scene) {
    const sceneProperties = {
      type: document.getElementById("scene-type").value,
      content: document.getElementById("scene-content").value,
      name: document.getElementById("scene-name").value,
    };

    const backgroundSelect = document.getElementById("scene-background");
    if (backgroundSelect) {
      sceneProperties.background = backgroundSelect.value;
    }

    const nextSceneSelect = document.getElementById("next-scene");
    if (nextSceneSelect && scene.type === "image") {
      const nextScene = nextSceneSelect.value;
      sceneProperties.nextScene = nextScene === "null" ? null : nextScene;
    }

    return sceneProperties;
  }

  updateUIPositions() {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const positions = this.extractUIPositionsFromInputs();

    this.editor.sceneManager.updateUIElementPosition(
      project,
      this.editor.currentScene,
      "textContent",
      positions.textPosX,
      positions.textPosY
    );
    this.editor.sceneManager.updateUIElementPosition(
      project,
      this.editor.currentScene,
      "buttonsContainer",
      positions.buttonsPosX,
      positions.buttonsPosY
    );

    // FIX: Use optimized preview update instead of full rebuild to prevent flicker
    this.optimizedUIPositionUpdate(project.scenes[this.editor.currentScene]);
  }

  // FIX: Add optimized UI position update that doesn't rebuild entire preview
  optimizedUIPositionUpdate(scene) {
    // Update text content position directly
    const textElement = document.querySelector(".preview-text-content");
    if (textElement && scene.uiPositions?.textContent) {
      const textPos = scene.uiPositions.textContent;
      textElement.style.left = `${textPos.x}%`;
      textElement.style.top = `${textPos.y}%`;
      textElement.style.width = `${textPos.width}%`;
    }

    // Update button positions directly
    const buttonElement = document.querySelector(".preview-continue-button");
    if (buttonElement && scene.uiPositions?.buttonsContainer) {
      const buttonPos = scene.uiPositions.buttonsContainer;
      buttonElement.style.left = `${buttonPos.x}%`;
      buttonElement.style.top = `${buttonPos.y}%`;
      buttonElement.style.width = `${buttonPos.width}%`;
    }
  }

  extractUIPositionsFromInputs() {
    return {
      textPosX: parseFloat(document.getElementById("text-pos-x").value),
      textPosY: parseFloat(document.getElementById("text-pos-y").value),
      buttonsPosX: parseFloat(document.getElementById("buttons-pos-x").value),
      buttonsPosY: parseFloat(document.getElementById("buttons-pos-y").value),
    };
  }

  updateOverlay() {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const enabled = document.getElementById("overlay-enabled").checked;

    if (enabled) {
      scene.overlay = this.extractOverlayPropertiesFromUI();
      this.updateOverlayDisplayValues(scene.overlay);
    } else {
      delete scene.overlay;
    }

    this.editor.uiManager.updateOverlayControls();
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);
  }

  extractOverlayPropertiesFromUI() {
    return {
      color: document.getElementById("overlay-color").value,
      opacity: parseFloat(document.getElementById("overlay-opacity").value),
      zIndex: parseInt(document.getElementById("overlay-zindex").value),
    };
  }

  updateOverlayDisplayValues(overlay) {
    const opacityValue = document.getElementById("overlay-opacity-value");
    const zindexValue = document.getElementById("overlay-zindex-value");

    if (opacityValue) opacityValue.textContent = overlay.opacity;
    if (zindexValue) zindexValue.textContent = overlay.zIndex;
  }

  addChoice() {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    this.editor.sceneManager.addChoice(project, this.editor.currentScene);
    this.updateChoicesAndPreview(project);
  }

  removeChoice(index) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    this.editor.sceneManager.removeChoice(
      project,
      this.editor.currentScene,
      index
    );
    this.updateChoicesAndPreview(project);
  }

  updateChoicesAndPreview(project) {
    this.editor.uiManager.refreshChoicesList(project, this.editor.currentScene);
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);
  }

  updateChoice(index, property, value) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    this.editor.sceneManager.updateChoice(
      project,
      this.editor.currentScene,
      index,
      property,
      value
    );
    this.validateSceneReferences();
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);

    if (property === "text") {
      this.editor.uiManager.updateChoicePositions(
        project,
        this.editor.currentScene
      );
    }
  }

  updateChoiceDisplayMode(index, displayMode) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const choice = scene.choices[index];

    choice.displayMode = displayMode;

    if (displayMode === "graphic") {
      this.editor.sceneManager.initializeChoiceGraphicProperties(choice);
    }

    this.editor.uiManager.updateChoiceDisplayModeVisibility(index, displayMode);
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);
  }

  updateChoiceGraphic(index, graphicPath) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const choice = scene.choices[index];

    choice.graphic = graphicPath;
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);
  }

  updateChoiceGraphicProperty(index, property, value) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const choice = scene.choices[index];

    this.handleChoiceGraphicEffectChange(choice, property, value);
    this.updateChoiceGraphicSliderDisplay(index, property, value);
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);
  }

  handleChoiceGraphicEffectChange(choice, property, value) {
    if (property === "effect") {
      const previousEffect = choice.graphicProperties.effect;
      choice.graphicProperties.effect = value;

      if (value && value !== previousEffect) {
        this.editor.sceneManager.initializeChoiceGraphicProperties(choice);
      }

      if (!value || value !== previousEffect) {
        this.editor.sceneManager.clearChoiceGraphicEffectProperties(choice);
      }
    } else {
      this.editor.sceneManager.updateChoiceGraphicProperty(
        this.editor.projectManager.getProject(),
        this.editor.currentScene,
        index,
        property,
        value
      );
    }
  }

  updateChoiceGraphicSliderDisplay(index, property, value) {
    const config = this.getSliderDisplayConfig(property);
    const slider = document.getElementById(
      `choice-graphic-${property}-${index}`
    );
    const valueDisplay = slider?.nextElementSibling;

    if (slider) slider.value = value;
    if (valueDisplay) {
      valueDisplay.textContent = value.toFixed(config.decimals) + config.suffix;
    }
  }

  getSliderDisplayConfig(property) {
    const configs = {
      scale: { suffix: "", decimals: 2 },
      rotation: { suffix: "°", decimals: 0 },
      opacity: { suffix: "", decimals: 1 },
      zIndex: { suffix: "", decimals: 0 },
    };
    return configs[property] || { suffix: "", decimals: 0 };
  }

  validateSceneReferences() {
    const project = this.editor.projectManager.getProject();
    const warnings = Utils.validateSceneReferences(project.scenes);

    if (warnings.length > 0) {
      this.editor.showWarning(warnings.join("\n"));
    }
  }

  reorderScene(sceneId, newIndex) {
    console.log("SceneController.reorderScene called:", { sceneId, newIndex });

    const project = this.editor.projectManager.getProject();
    const idMapping = this.editor.sceneManager.reorderScene(
      project,
      sceneId,
      newIndex
    );

    console.log("Reorder result from SceneManager:", idMapping);

    if (idMapping && this.editor.currentScene) {
      // Update current scene reference if it was remapped
      const newCurrentSceneId = idMapping[this.editor.currentScene];
      if (newCurrentSceneId) {
        this.editor.currentScene = newCurrentSceneId;
      }

      console.log("Updated current scene to:", this.editor.currentScene);

      // Refresh all UI components to show the new order
      this.refreshAllUIComponents();

      // Re-render the current scene
      this.renderSceneAndUpdateUI();

      console.log("UI refresh completed");

      return true;
    }

    console.log("Reorder failed or no changes needed");
    return false;
  }

  // FIX: Add centralized UI refresh method to reduce flicker
  refreshAllUIComponents() {
    const project = this.editor.projectManager.getProject();

    // Use requestAnimationFrame to batch DOM updates and reduce flicker
    requestAnimationFrame(() => {
      this.editor.sceneManager.refreshSceneList(project);
      this.editor.assetManager.refreshAssetLists();
      this.editor.projectHandler.updateSceneDropdowns();
    });
  }

  renderSceneAndUpdateUI() {
    const project = this.editor.projectManager.getProject();

    // FIX: Batch UI updates to reduce flicker
    requestAnimationFrame(() => {
      this.editor.uiManager.updateScenePropertiesDisplay(
        project,
        this.editor.currentScene
      );
      this.editor.projectHandler.updateSceneDropdowns();
      this.editor.previewManager.renderPreview(
        project,
        this.editor.currentScene
      );
      this.editor.sceneManager.updateActiveSceneInList();
      this.editor.objectController.updateObjectProperties();
      this.editor.uiManager.updateSceneObjectsList(
        project,
        this.editor.currentScene,
        this.editor.previewManager.getSelectedObject()
      );
    });
  }
}
