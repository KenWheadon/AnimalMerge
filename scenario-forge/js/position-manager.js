class PositionManager {
  static SLIDER_CONFIGS = {
    default: [
      {
        id: "default-text-pos-x",
        valueId: "default-text-pos-x-value",
        suffix: "%",
        label: "Text X",
      },
      {
        id: "default-text-pos-y",
        valueId: "default-text-pos-y-value",
        suffix: "%",
        label: "Text Y",
      },
      {
        id: "default-text-width",
        valueId: "default-text-width-value",
        suffix: "%",
        label: "Text Width",
      },
      {
        id: "default-buttons-pos-x",
        valueId: "default-buttons-pos-x-value",
        suffix: "%",
        label: "Button X",
      },
      {
        id: "default-buttons-pos-y",
        valueId: "default-buttons-pos-y-value",
        suffix: "%",
        label: "Button Y",
      },
      {
        id: "default-buttons-width",
        valueId: "default-buttons-width-value",
        suffix: "%",
        label: "Button Width",
      },
      {
        id: "default-choice-pos-x",
        valueId: "default-choice-pos-x-value",
        suffix: "%",
        label: "Choice X",
      },
      {
        id: "default-choice-pos-y",
        valueId: "default-choice-pos-y-value",
        suffix: "%",
        label: "Choice Y",
      },
      {
        id: "default-choice-width",
        valueId: "default-choice-width-value",
        suffix: "%",
        label: "Choice Width",
      },
    ],
    ui: [
      {
        id: "text-pos-x",
        valueId: "text-pos-x-value",
        suffix: "%",
        label: "X",
      },
      {
        id: "text-pos-y",
        valueId: "text-pos-y-value",
        suffix: "%",
        label: "Y",
      },
      {
        id: "buttons-pos-x",
        valueId: "buttons-pos-x-value",
        suffix: "%",
        label: "X",
      },
      {
        id: "buttons-pos-y",
        valueId: "buttons-pos-y-value",
        suffix: "%",
        label: "Y",
      },
    ],
  };

  constructor() {
    window.positionManager = this;
    this.updateThrottleTimer = null;
    this.THROTTLE_DELAY = 8;
    this.pendingUpdates = new Set();
  }

  setupEventListeners() {
    const events = [
      [
        "default-text-pos-x",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-text-pos-y",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-text-width",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-buttons-pos-x",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-buttons-pos-y",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-buttons-width",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-choice-pos-x",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-choice-pos-y",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      [
        "default-choice-width",
        "input",
        () => this.throttledUpdateDefaultPositions(),
      ],
      ["reset-text-position", "click", () => this.resetTextPosition()],
      ["reset-buttons-position", "click", () => this.resetButtonsPosition()],
      ["reset-all-positions", "click", () => this.resetAllPositions()],
      ["open-ui-positioning", "click", () => this.openUIPositioningDrawer()],
      [
        "close-ui-positioning-drawer",
        "click",
        () => this.closeUIPositioningDrawer(),
      ],
    ];

    events.forEach(([id, event, handler]) => {
      Utils.addEventListenerSafe(id, event, handler);
    });
  }

  throttledUpdateDefaultPositions() {
    if (this.updateThrottleTimer) {
      clearTimeout(this.updateThrottleTimer);
    }

    this.updateThrottleTimer = setTimeout(() => {
      this.updateDefaultPositions();
      this.updateThrottleTimer = null;
    }, this.THROTTLE_DELAY);
  }

  updateUIPositionSliders(scene) {
    const uiPositions = scene.uiPositions;
    this.updateSliderValue("text-pos-x", uiPositions.textContent.x);
    this.updateSliderValue("text-pos-y", uiPositions.textContent.y);
    this.updateSliderValue("buttons-pos-x", uiPositions.buttonsContainer.x);
    this.updateSliderValue("buttons-pos-y", uiPositions.buttonsContainer.y);
  }

  updateSliderValue(id, value) {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(id + "-value");
    if (slider) slider.value = value;
    if (valueDisplay) valueDisplay.textContent = value.toFixed(1) + "%";
  }

  resetAllPositions() {
    window.modalManager.showResetAllPositionsModal();
  }

  executeResetAllPositions() {
    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();

    Object.keys(project.scenes).forEach((sceneId) => {
      const scene = project.scenes[sceneId];

      this.resetScenePositions(project, sceneId, defaults);
      this.resetChoicePositions(scene, defaults);
    });

    this.updateCurrentSceneUI(project, defaults);
    this.showResetFeedback(
      "All UI positions reset to defaults across ALL scenes in project!"
    );
  }

  resetScenePositions(project, sceneId, defaults) {
    window.sceneManager.updateUIElementPosition(
      project,
      sceneId,
      "textContent",
      defaults.textContent.x,
      defaults.textContent.y,
      defaults.textContent.width
    );

    window.sceneManager.updateUIElementPosition(
      project,
      sceneId,
      "buttonsContainer",
      defaults.buttonsContainer.x,
      defaults.buttonsContainer.y,
      defaults.buttonsContainer.width
    );
  }

  resetChoicePositions(scene, defaults) {
    if (scene.choices) {
      scene.choices.forEach((choice, index) => {
        choice.position = {
          x: defaults.choiceButton.x,
          y:
            defaults.choiceButton.y +
            index * window.sceneManager.CHOICE_VERTICAL_SPACING,
          width: defaults.choiceButton.width,
        };
      });
    }
  }

  updateCurrentSceneUI(project, defaults) {
    if (window.editor.currentScene) {
      const currentScene = project.scenes[window.editor.currentScene];
      this.updateUIPositionSliders(currentScene);
      this.updateChoicePositions(project, window.editor.currentScene);
      window.previewManager.renderPreview(project, window.editor.currentScene);
    }
  }

  resetTextPosition() {
    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();

    window.sceneManager.updateUIElementPosition(
      project,
      window.editor.currentScene,
      "textContent",
      defaults.textContent.x,
      defaults.textContent.y,
      defaults.textContent.width
    );

    this.updateSliderValue("text-pos-x", defaults.textContent.x);
    this.updateSliderValue("text-pos-y", defaults.textContent.y);
    window.previewManager.renderPreview(project, window.editor.currentScene);
    this.showResetFeedback("Text position reset to default!");
  }

  resetButtonsPosition() {
    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();

    window.sceneManager.updateUIElementPosition(
      project,
      window.editor.currentScene,
      "buttonsContainer",
      defaults.buttonsContainer.x,
      defaults.buttonsContainer.y,
      defaults.buttonsContainer.width
    );

    this.updateSliderValue("buttons-pos-x", defaults.buttonsContainer.x);
    this.updateSliderValue("buttons-pos-y", defaults.buttonsContainer.y);
    window.previewManager.renderPreview(project, window.editor.currentScene);
    this.showResetFeedback("Buttons position reset to default!");
  }

  updateChoicePositions(project, sceneId) {
    const choicePositionsSection = document.getElementById(
      "choice-positions-section-drawer"
    );
    const scene = project.scenes[sceneId];
    const hasChoices =
      scene.type === "choice" && scene.choices && scene.choices.length > 0;

    if (choicePositionsSection) {
      choicePositionsSection.style.display = hasChoices ? "block" : "none";
    }

    if (hasChoices) {
      this.refreshChoicePositionsList(project, sceneId);
    }
  }

  refreshChoicePositionsList(project, sceneId) {
    const choicePositionsList = document.getElementById(
      "choice-positions-list"
    );
    if (!choicePositionsList) return;

    const scene = project.scenes[sceneId];
    choicePositionsList.innerHTML = "";

    scene.choices.forEach((choice, index) => {
      const choiceItem = this.createChoicePositionItem(choice, index);
      choicePositionsList.appendChild(choiceItem);
    });

    this.setupChoicePositionEventListeners(sceneId, scene.choices.length);
  }

  createChoicePositionItem(choice, index) {
    const position = choice.position;
    const choiceItem = document.createElement("div");
    choiceItem.className = "choice-position-item compact";

    choiceItem.innerHTML = `
      <div class="choice-position-header">
        <h5>Choice ${index + 1}: ${choice.text}</h5>
        <button class="btn btn-tiny btn-reset" onclick="window.positionManager.resetChoicePosition(${index})">Reset</button>
      </div>
      <div class="choice-position-controls compact">
        <div class="controls-row">
          ${this.createCompactSliderHTML(
            "X",
            `choice-pos-x-${index}`,
            position.x,
            "%"
          )}
          ${this.createCompactSliderHTML(
            "Y",
            `choice-pos-y-${index}`,
            position.y,
            "%"
          )}
          ${this.createCompactSliderHTML(
            "Width",
            `choice-width-${index}`,
            position.width,
            "%"
          )}
        </div>
      </div>
    `;

    return choiceItem;
  }

  createCompactSliderHTML(label, id, value, suffix) {
    return `
      <div class="compact-slider-group">
        <label>${label}:</label>
        <div class="compact-slider-container">
          <input type="range" id="${id}" min="0" max="100" step="0.1" value="${value}" class="compact-slider">
          <span class="compact-slider-value" id="${id}-value">${value.toFixed(
      1
    )}${suffix}</span>
        </div>
      </div>
    `;
  }

  createChoiceSliderHTML(label, id, value, suffix) {
    return `
      <div class="slider-group">
        <label>${label}:</label>
        <div class="slider-container">
          <input type="range" id="${id}" min="0" max="100" step="0.1" value="${value}">
          <span class="slider-value" id="${id}-value">${value.toFixed(
      1
    )}${suffix}</span>
        </div>
      </div>
    `;
  }

  setupChoicePositionEventListeners(sceneId, choiceCount) {
    for (let i = 0; i < choiceCount; i++) {
      const controls = [
        {
          id: `choice-pos-x-${i}`,
          valueId: `choice-pos-x-${i}-value`,
          suffix: "%",
        },
        {
          id: `choice-pos-y-${i}`,
          valueId: `choice-pos-y-${i}-value`,
          suffix: "%",
        },
        {
          id: `choice-width-${i}`,
          valueId: `choice-width-${i}-value`,
          suffix: "%",
        },
      ];

      controls.forEach(({ id, valueId, suffix }) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);

        if (slider && valueDisplay) {
          let choiceThrottleTimer = null;

          slider.addEventListener("input", () => {
            const value = parseFloat(slider.value);
            valueDisplay.textContent = value.toFixed(1) + suffix;

            if (choiceThrottleTimer) {
              clearTimeout(choiceThrottleTimer);
            }

            choiceThrottleTimer = setTimeout(() => {
              this.updateChoicePositionFromSlider(i, sceneId);
              choiceThrottleTimer = null;
            }, this.THROTTLE_DELAY);
          });
        }
      });
    }
  }

  updateChoicePositionFromSlider(choiceIndex, sceneId) {
    const project = window.editor.projectManager.getProject();
    const x = parseFloat(
      document.getElementById(`choice-pos-x-${choiceIndex}`).value
    );
    const y = parseFloat(
      document.getElementById(`choice-pos-y-${choiceIndex}`).value
    );
    const width = parseFloat(
      document.getElementById(`choice-width-${choiceIndex}`).value
    );

    window.sceneManager.updateChoicePosition(
      project,
      sceneId,
      choiceIndex,
      x,
      y,
      width
    );

    this.optimizedPreviewUpdate(project, sceneId);
  }

  optimizedPreviewUpdate(project, sceneId) {
    const scene = project.scenes[sceneId];

    const textElement = document.querySelector(".preview-text-content");
    if (textElement && scene.uiPositions?.textContent) {
      const textPos = scene.uiPositions.textContent;
      textElement.style.left = `${textPos.x}%`;
      textElement.style.top = `${textPos.y}%`;
      textElement.style.width = `${textPos.width}%`;
    }

    const buttonElement = document.querySelector(".preview-continue-button");
    if (buttonElement && scene.uiPositions?.buttonsContainer) {
      const buttonPos = scene.uiPositions.buttonsContainer;
      buttonElement.style.left = `${buttonPos.x}%`;
      buttonElement.style.top = `${buttonPos.y}%`;
      buttonElement.style.width = `${buttonPos.width}%`;
    }

    const choiceElements = document.querySelectorAll(".preview-choice-button");
    if (scene.choices) {
      scene.choices.forEach((choice, index) => {
        const choiceElement = choiceElements[index];
        if (choiceElement && choice.position) {
          choiceElement.style.left = `${choice.position.x}%`;
          choiceElement.style.top = `${choice.position.y}%`;
          choiceElement.style.width = `${choice.position.width}%`;
        }
      });
    }
  }

  updateChoicePositionSliders(sceneId, choiceIndex, position) {
    if (position.x !== undefined) {
      this.updateSliderValue(`choice-pos-x-${choiceIndex}`, position.x);
    }
    if (position.y !== undefined) {
      this.updateSliderValue(`choice-pos-y-${choiceIndex}`, position.y);
    }
    if (position.width !== undefined) {
      const slider = document.getElementById(`choice-width-${choiceIndex}`);
      const valueDisplay = document.getElementById(
        `choice-width-${choiceIndex}-value`
      );
      if (slider) slider.value = position.width;
      if (valueDisplay) valueDisplay.textContent = position.width + "%";
    }
  }

  resetChoicePosition(choiceIndex) {
    const defaults = window.projectManager.getDefaultUIPositions();
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const choice = scene.choices[choiceIndex];

    choice.position = {
      x: defaults.choiceButton.x,
      y:
        defaults.choiceButton.y +
        choiceIndex * window.sceneManager.CHOICE_VERTICAL_SPACING,
      width: defaults.choiceButton.width,
    };

    this.updateChoicePositionSliders(
      window.editor.currentScene,
      choiceIndex,
      choice.position
    );

    this.optimizedPreviewUpdate(project, window.editor.currentScene);
    this.showResetFeedback(
      `Choice ${choiceIndex + 1} position reset to default!`
    );
  }

  showResetFeedback(message) {
    const feedback = document.createElement("div");
    feedback.className = "reset-feedback";
    feedback.textContent = message;

    Object.assign(feedback.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "#f39c12",
      color: "white",
      padding: "12px 16px",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "bold",
      zIndex: "2001",
      pointerEvents: "none",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      maxWidth: "300px",
      wordWrap: "break-word",
    });

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
  }

  updateDefaultPositions() {
    const positions = this.extractDefaultPositions();
    this.applyDefaultPositions(positions);
    this.updateSliderValueDisplays(PositionManager.SLIDER_CONFIGS.default);
  }

  extractDefaultPositions() {
    return {
      textContent: {
        x: parseFloat(document.getElementById("default-text-pos-x").value),
        y: parseFloat(document.getElementById("default-text-pos-y").value),
        width: parseFloat(document.getElementById("default-text-width").value),
      },
      buttonsContainer: {
        x: parseFloat(document.getElementById("default-buttons-pos-x").value),
        y: parseFloat(document.getElementById("default-buttons-pos-y").value),
        width: parseFloat(
          document.getElementById("default-buttons-width").value
        ),
      },
      choiceButton: {
        x: parseFloat(document.getElementById("default-choice-pos-x").value),
        y: parseFloat(document.getElementById("default-choice-pos-y").value),
        width: parseFloat(
          document.getElementById("default-choice-width").value
        ),
      },
    };
  }

  applyDefaultPositions(positions) {
    Object.entries(positions).forEach(([elementType, position]) => {
      window.projectManager.updateDefaultUIPosition(
        elementType,
        position.x,
        position.y,
        position.width
      );
    });
  }

  updateSliderValueDisplays(sliderConfigs) {
    sliderConfigs.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);
      if (slider && valueDisplay) {
        const value = parseFloat(slider.value);
        valueDisplay.textContent = value.toFixed(1) + suffix;
      }
    });
  }

  setupDefaultPositionControls() {
    const defaults = window.projectManager.getDefaultUIPositions();

    this.setDefaultSliderValues(defaults);
    this.updateSliderValueDisplays(PositionManager.SLIDER_CONFIGS.default);
    this.setupSliderEventListeners(PositionManager.SLIDER_CONFIGS.default, () =>
      this.throttledUpdateDefaultPositions()
    );
  }

  setDefaultSliderValues(defaults) {
    const sliderMappings = [
      ["default-text-pos-x", defaults.textContent.x],
      ["default-text-pos-y", defaults.textContent.y],
      ["default-text-width", defaults.textContent.width],
      ["default-buttons-pos-x", defaults.buttonsContainer.x],
      ["default-buttons-pos-y", defaults.buttonsContainer.y],
      ["default-buttons-width", defaults.buttonsContainer.width],
      ["default-choice-pos-x", defaults.choiceButton.x],
      ["default-choice-pos-y", defaults.choiceButton.y],
      ["default-choice-width", defaults.choiceButton.width],
    ];

    sliderMappings.forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });
  }

  setupSliderEventListeners(sliderConfigs, callback) {
    sliderConfigs.forEach(({ id, valueId, suffix }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        slider.addEventListener("input", () => {
          const value = parseFloat(slider.value);
          valueDisplay.textContent = value.toFixed(1) + suffix;
          callback();
        });
      }
    });
  }

  updateUIPositionControls(scene) {
    const uiPositions = scene.uiPositions;

    this.updateSliderValue("text-pos-x", uiPositions.textContent.x);
    this.updateSliderValue("text-pos-y", uiPositions.textContent.y);
    this.updateSliderValue("buttons-pos-x", uiPositions.buttonsContainer.x);
    this.updateSliderValue("buttons-pos-y", uiPositions.buttonsContainer.y);

    this.setupSliderEventListeners(PositionManager.SLIDER_CONFIGS.ui, () =>
      this.throttledUpdateUIPositions()
    );
  }

  throttledUpdateUIPositions() {
    if (this.updateThrottleTimer) {
      clearTimeout(this.updateThrottleTimer);
    }

    this.updateThrottleTimer = setTimeout(() => {
      window.editor.updateUIPositions();
      this.updateThrottleTimer = null;
    }, this.THROTTLE_DELAY);
  }

  openUIPositioningDrawer() {
    const drawer = document.getElementById("ui-positioning-drawer");
    if (drawer) {
      drawer.classList.add("open");
    }
  }

  closeUIPositioningDrawer() {
    const drawer = document.getElementById("ui-positioning-drawer");
    if (drawer) {
      drawer.classList.remove("open");
    }
  }
}
