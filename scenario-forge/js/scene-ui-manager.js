class SceneUIManager {
  static DEFAULT_GRAPHIC_PROPS = {
    scale: 1.0,
    rotation: 0,
    opacity: 1.0,
    zIndex: 50,
    effect: "",
  };

  static SLIDER_CONFIGS = {
    scale: { min: 0.05, max: 3, step: 0.05, decimals: 2 },
    rotation: { min: -360, max: 360, step: 1, decimals: 0, suffix: "°" },
    opacity: { min: 0, max: 1, step: 0.1, decimals: 1 },
    zIndex: { min: 1, max: 100, step: 1, decimals: 0 },
  };

  static EFFECT_OPTIONS = [
    { value: "", text: "No Effect" },
    { value: "fade_in", text: "Fade In" },
    { value: "fade_out", text: "Fade Out" },
    { value: "slide_to", text: "Slide To" },
    { value: "scale_to", text: "Scale To" },
    { value: "glow", text: "Glow" },
    { value: "wiggle", text: "Wiggle" },
  ];

  constructor() {
    this.domCache = {};
  }

  getElement(id) {
    if (!this.domCache[id]) {
      this.domCache[id] = document.getElementById(id);
    }
    return this.domCache[id];
  }

  setupEventListeners() {
    const events = [
      ["scene-name", "input", () => window.editor.updateSceneProperties()],
      ["scene-type", "change", () => window.editor.updateSceneProperties()],
      [
        "scene-background",
        "change",
        () => window.editor.updateSceneProperties(),
      ],
      ["scene-content", "input", () => window.editor.updateSceneProperties()],
      ["next-scene", "change", () => window.editor.updateSceneProperties()],
      ["add-scene", "click", () => window.editor.addScene()],
      ["duplicate-scene", "click", () => window.editor.duplicateScene()],
      ["delete-scene", "click", () => window.editor.deleteScene()],
      ["add-choice", "click", () => window.editor.addChoice()],
      ["overlay-enabled", "change", () => window.editor.updateOverlay()],
      ["overlay-color", "input", () => window.editor.updateOverlay()],
      ["overlay-opacity", "input", () => window.editor.updateOverlay()],
      ["overlay-zindex", "input", () => window.editor.updateOverlay()],
    ];

    events.forEach(([id, event, handler]) => {
      Utils.addEventListenerSafe(id, event, handler);
    });
  }

  getSceneDisplayName(sceneId, scene) {
    return `${sceneId}: ${scene.name}`;
  }

  populateDropdown(element, options, currentValue) {
    if (!element) return;

    element.innerHTML = options
      .map((opt) => {
        const attributes = [
          `value="${opt.value}"`,
          opt.style ? `style="${opt.style}"` : null,
          opt.title ? `title="${opt.title}"` : null,
        ]
          .filter(Boolean)
          .join(" ");

        return `<option ${attributes}>${opt.text}</option>`;
      })
      .join("");

    element.value = currentValue;
  }

  createSceneOptions(project) {
    const currentSceneId = window.editor.currentScene;
    const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);

    const baseOptions = [
      { value: "", text: "Select Scene" },
      { value: "null", text: "End" },
    ];

    const sceneOptions = orderedSceneKeys.map((sceneId) => {
      const scene = project.scenes[sceneId];
      const isCurrentScene = sceneId === currentSceneId;

      return {
        value: sceneId,
        text: this.getSceneDisplayName(sceneId, scene),
        style: isCurrentScene
          ? "background-color: #3498db; color: white; font-weight: bold;"
          : null,
        title: isCurrentScene ? "Currently editing this scene" : null,
      };
    });

    return [...baseOptions, ...sceneOptions];
  }

  createObjectGraphicOptions() {
    const objects = window.assetManager.getSortedObjects();
    const baseOptions = [{ value: "", text: "Select Graphic" }];

    const objectOptions = objects.map((obj) => ({
      value: obj,
      text: Utils.getCleanFilename(obj, "object"),
    }));

    return [...baseOptions, ...objectOptions];
  }

  updateSceneDropdowns(backgrounds, project) {
    this.updateBackgroundDropdown(backgrounds);
    this.updateNextSceneDropdown(project);
    this.updateChoiceDropdowns(project);
  }

  updateBackgroundDropdown(backgrounds) {
    const bgSelect = this.getElement("scene-background");
    if (!bgSelect) return;

    const currentBgValue = bgSelect.value;
    const baseOptions = [{ value: "", text: "No Background" }];

    const bgOptions = Utils.sortAssets(backgrounds).map((bg) => ({
      value: bg,
      text: Utils.getCleanFilename(bg, "background"),
    }));

    this.populateDropdown(
      bgSelect,
      [...baseOptions, ...bgOptions],
      currentBgValue
    );
  }

  updateNextSceneDropdown(project) {
    const nextSceneSelect = this.getElement("next-scene");
    if (!nextSceneSelect) return;

    const currentNextValue = nextSceneSelect.value;
    this.populateDropdown(
      nextSceneSelect,
      this.createSceneOptions(project),
      currentNextValue
    );
  }

  updateChoiceDropdowns(project) {
    this.updateChoiceSceneDropdowns(project);
    this.updateChoiceGraphicDropdowns();
  }

  updateChoiceSceneDropdowns(project) {
    const choiceSelects = document.querySelectorAll(".choice-next-scene");
    const sceneOptions = this.createSceneOptions(project);

    choiceSelects.forEach((select) => {
      const currentValue = select.value;
      this.populateDropdown(select, sceneOptions, currentValue);
    });
  }

  updateChoiceGraphicDropdowns() {
    const graphicSelects = document.querySelectorAll(".choice-graphic-select");
    const objectOptions = this.createObjectGraphicOptions();

    graphicSelects.forEach((select) => {
      const currentValue = select.value;
      this.populateDropdown(select, objectOptions, currentValue);
    });
  }

  updateScenePropertiesDisplay(project, sceneId) {
    const scene = project.scenes[sceneId];

    this.updateBasicSceneProperties(scene, sceneId);
    this.updateOverlayProperties(scene);
    this.updateOverlayControls();
    this.updateChoicesVisibility();
    this.refreshChoicesList(project, sceneId);
  }

  updateBasicSceneProperties(scene, sceneId) {
    const elementConfigs = [
      ["scene-id-display", "textContent", `${sceneId}:`],
      ["scene-name", "value", scene.name],
      ["scene-type", "value", scene.type],
      ["scene-background", "value", scene.background],
      ["scene-content", "value", scene.content],
      ["next-scene", "value", scene.nextScene],
    ];

    elementConfigs.forEach(([id, prop, value]) => {
      const element = this.getElement(id);
      if (element) element[prop] = value || "";
    });
  }

  updateOverlayProperties(scene) {
    if (scene.overlay) {
      const overlayConfigs = [
        ["overlay-enabled", "checked", true],
        ["overlay-color", "value", scene.overlay.color],
        ["overlay-opacity", "value", scene.overlay.opacity],
        ["overlay-zindex", "value", scene.overlay.zIndex],
        ["overlay-opacity-value", "textContent", scene.overlay.opacity],
        ["overlay-zindex-value", "textContent", scene.overlay.zIndex],
      ];

      overlayConfigs.forEach(([id, prop, value]) => {
        const element = this.getElement(id);
        if (element) element[prop] = value;
      });
    } else {
      const overlayEnabled = this.getElement("overlay-enabled");
      if (overlayEnabled) overlayEnabled.checked = false;
    }
  }

  updateChoicesVisibility() {
    const sceneType = this.getElement("scene-type")?.value;
    const choicesSection = this.getElement("choices-section");
    const nextSceneGroup = this.getElement("next-scene-group");

    const isChoiceType = sceneType === "choice";

    if (choicesSection) {
      choicesSection.style.display = isChoiceType ? "block" : "none";
    }
    if (nextSceneGroup) {
      nextSceneGroup.style.display = isChoiceType ? "none" : "block";
    }
  }

  updateOverlayControls() {
    const overlayEnabled = this.getElement("overlay-enabled");
    const controls = this.getElement("overlay-controls");

    if (controls) {
      controls.classList.toggle("visible", overlayEnabled?.checked);
    }
  }

  createSliderHTML(property, value, index) {
    const config = SceneUIManager.SLIDER_CONFIGS[property];
    const displayValue =
      config.decimals > 0 ? value.toFixed(config.decimals) : value.toString();
    const suffix = config.suffix || "";

    return `
      <div class="slider-group">
        <label>${property.charAt(0).toUpperCase() + property.slice(1)}:</label>
        <div class="slider-container">
          <input type="range" 
                 id="choice-graphic-${property}-${index}" 
                 min="${config.min}" 
                 max="${config.max}" 
                 step="${config.step}" 
                 value="${value}" 
                 onchange="window.editor.updateChoiceGraphicProperty(${index}, '${property}', ${
      config.decimals > 0 ? "parseFloat" : "parseInt"
    }(this.value))">
          <span class="slider-value">${displayValue}${suffix}</span>
        </div>
      </div>
    `;
  }

  createEffectSelectHTML(effect, index) {
    const options = SceneUIManager.EFFECT_OPTIONS.map(
      (opt) => `<option value="${opt.value}">${opt.text}</option>`
    ).join("");

    return `
      <div class="form-group">
        <label>Effect:</label>
        <select id="choice-graphic-effect-${index}" onchange="window.editor.updateChoiceGraphicProperty(${index}, 'effect', this.value)">
          ${options}
        </select>
      </div>
    `;
  }

  createChoiceGraphicControls(choice, index) {
    const graphicProps =
      choice.graphicProperties || SceneUIManager.DEFAULT_GRAPHIC_PROPS;
    const properties = ["scale", "rotation", "opacity", "zIndex"];

    const slidersHTML = properties
      .map((prop) => this.createSliderHTML(prop, graphicProps[prop], index))
      .join("");

    const effectHTML = this.createEffectSelectHTML(graphicProps.effect, index);

    return `
      <div class="choice-graphic-controls" id="choice-graphic-controls-${index}">
        <div class="form-group">
          <label>Graphic:</label>
          <select class="choice-graphic-select" onchange="window.editor.updateChoiceGraphic(${index}, this.value)">
            <option value="">Select Graphic</option>
          </select>
        </div>
        <div class="choice-graphic-properties">
          ${slidersHTML}
          ${effectHTML}
        </div>
      </div>
    `;
  }

  createChoiceItemHTML(choice, index) {
    const textDisplay = choice.displayMode === "text" ? "block" : "none";
    const graphicDisplay = choice.displayMode === "graphic" ? "block" : "none";

    return `
      <div class="choice-item">
        <div class="choice-item-header">
          <button class="remove-choice" onclick="window.editor.removeChoice(${index})">&times;</button>
          <div class="choice-display-mode">
            <label>
              <input type="radio" name="choice-display-${index}" value="text" ${
      choice.displayMode === "text" ? "checked" : ""
    } onchange="window.editor.updateChoiceDisplayMode(${index}, 'text')">
              Text
            </label>
            <label>
              <input type="radio" name="choice-display-${index}" value="graphic" ${
      choice.displayMode === "graphic" ? "checked" : ""
    } onchange="window.editor.updateChoiceDisplayMode(${index}, 'graphic')">
              Graphic
            </label>
          </div>
        </div>
        
        <div class="choice-content">
          <div class="form-group">
            <label>Next Scene:</label>
            <select class="choice-next-scene" onchange="window.editor.updateChoice(${index}, 'nextScene', this.value)">
              <option value="">Select Scene</option>
              <option value="null">End</option>
            </select>
          </div>
          
          <div class="choice-text-controls" id="choice-text-controls-${index}" style="display: ${textDisplay}">
            <div class="form-group">
              <label>Text:</label>
              <input type="text" placeholder="Choice text" value="${
                choice.text
              }" onchange="window.editor.updateChoice(${index}, 'text', this.value)">
            </div>
          </div>
          
          <div class="choice-graphic-controls" id="choice-graphic-controls-${index}" style="display: ${graphicDisplay}">
            ${this.createChoiceGraphicControls(choice, index)}
          </div>
        </div>
      </div>
    `;
  }

  refreshChoicesList(project, sceneId) {
    const scene = project.scenes[sceneId];
    const choicesList = this.getElement("choices-list");

    if (!choicesList || !scene.choices) return;

    choicesList.innerHTML = scene.choices
      .map((choice, index) => this.createChoiceItemHTML(choice, index))
      .join("");

    this.updateChoiceDropdowns(project);
    this.setChoiceDropdownValues(scene);
    this.updateChoiceGraphicSliderDisplays(scene.choices);
  }

  setChoiceDropdownValues(scene) {
    this.setChoiceSceneValues(scene);
    this.setChoiceGraphicValues(scene);
    this.setChoiceEffectValues(scene);
  }

  setChoiceSceneValues(scene) {
    const choiceSelects = document.querySelectorAll(".choice-next-scene");
    scene.choices.forEach((choice, index) => {
      if (choiceSelects[index]) {
        choiceSelects[index].value = choice.nextScene || "";
      }
    });
  }

  setChoiceGraphicValues(scene) {
    const graphicSelects = document.querySelectorAll(".choice-graphic-select");
    scene.choices.forEach((choice, index) => {
      if (graphicSelects[index]) {
        graphicSelects[index].value = choice.graphic || "";
      }
    });
  }

  setChoiceEffectValues(scene) {
    scene.choices.forEach((choice, index) => {
      const effectSelect = document.getElementById(
        `choice-graphic-effect-${index}`
      );
      if (effectSelect && choice.graphicProperties) {
        effectSelect.value = choice.graphicProperties.effect || "";
      }
    });
  }

  updateChoiceGraphicSliderDisplays(choices) {
    choices.forEach((choice, index) => {
      if (choice.displayMode === "graphic" && choice.graphicProperties) {
        this.updateSliderDisplaysForChoice(choice.graphicProperties, index);
      }
    });
  }

  updateSliderDisplaysForChoice(props, index) {
    const properties = ["scale", "rotation", "opacity", "zIndex"];

    properties.forEach((prop) => {
      const slider = document.getElementById(`choice-graphic-${prop}-${index}`);
      if (!slider) return;

      const config = SceneUIManager.SLIDER_CONFIGS[prop];
      const value = props[prop];

      slider.value = value;

      const valueDisplay = slider.nextElementSibling;
      if (valueDisplay) {
        const displayValue =
          config.decimals > 0
            ? value.toFixed(config.decimals)
            : value.toString();
        const suffix = config.suffix || "";
        valueDisplay.textContent = displayValue + suffix;
      }
    });
  }

  updateChoiceDisplayModeVisibility(choiceIndex, displayMode) {
    const textControls = document.getElementById(
      `choice-text-controls-${choiceIndex}`
    );
    const graphicControls = document.getElementById(
      `choice-graphic-controls-${choiceIndex}`
    );

    if (textControls) {
      textControls.style.display = displayMode === "text" ? "block" : "none";
    }
    if (graphicControls) {
      graphicControls.style.display =
        displayMode === "graphic" ? "block" : "none";
    }
  }

  dispose() {
    this.domCache = {};
  }
}
