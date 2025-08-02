class ObjectPropertiesManager {
  static SLIDER_CONFIGS = [
    { id: "obj-x", valueId: "obj-x-value", suffix: "", decimals: 1 },
    { id: "obj-y", valueId: "obj-y-value", suffix: "", decimals: 1 },
    {
      id: "obj-scale",
      valueId: "obj-scale-value",
      suffix: "",
      decimals: 2,
      resetValue: 1.0,
    },
    {
      id: "obj-rotation",
      valueId: "obj-rotation-value",
      suffix: "°",
      decimals: 0,
      resetValue: 0,
    },
    {
      id: "obj-zindex",
      valueId: "obj-zindex-value",
      suffix: "",
      decimals: 0,
      resetValue: 1,
    },
    {
      id: "obj-opacity",
      valueId: "obj-opacity-value",
      suffix: "",
      decimals: 1,
    },
  ];

  static ANIMATION_TIMING_CONFIGS = [
    {
      id: "obj-animation-duration",
      valueId: "obj-animation-duration-value",
      suffix: "ms",
      decimals: 0,
    },
    {
      id: "obj-animation-delay",
      valueId: "obj-animation-delay-value",
      suffix: "ms",
      decimals: 0,
    },
  ];

  static EFFECT_OPTIONS = [
    { value: "", text: "No Effect" },
    { value: "fade_in", text: "Fade In" },
    { value: "fade_out", text: "Fade Out" },
    { value: "slide_to", text: "Slide To" },
    { value: "scale_to", text: "Scale To" },
    { value: "glow", text: "Glow" },
    { value: "wiggle", text: "Wiggle" },
  ];

  static EASING_OPTIONS = [
    { value: "ease", text: "Ease" },
    { value: "ease-in", text: "Ease In" },
    { value: "ease-out", text: "Ease Out" },
    { value: "ease-in-out", text: "Ease In-Out" },
    { value: "linear", text: "Linear" },
  ];

  constructor() {
    this.lastRenderedState = null;
  }

  updateObjectProperties(project, sceneId, selectedObjectIndex) {
    const propsContainer = document.getElementById("object-properties");
    if (!propsContainer) return;

    const hasSelection =
      selectedObjectIndex !== null && sceneId && project.scenes[sceneId];
    const obj = hasSelection
      ? project.scenes[sceneId].images[selectedObjectIndex]
      : null;

    const currentState = this.createStateHash(
      hasSelection,
      obj,
      selectedObjectIndex,
      sceneId
    );

    if (this.lastRenderedState === currentState) {
      return;
    }

    this.lastRenderedState = currentState;

    const disabled = hasSelection ? "" : "disabled";

    const values = {
      x: obj?.x ?? 50,
      y: obj?.y ?? 50,
      scale: obj?.scale ?? 1,
      rotation: obj?.rotation ?? 0,
      zIndex: obj?.zIndex ?? 1,
      opacity: obj?.opacity ?? 1,
      effect: obj?.effect ?? "",
      flipped: obj?.flipped ?? false,
      animationTiming: obj?.animationTiming ??
        project.defaults?.animationTiming ?? {
          duration: 1000,
          delay: 0,
          easing: "ease-in-out",
        },
    };

    requestAnimationFrame(() => {
      propsContainer.innerHTML = `
        <div class="object-properties-form">
          <div class="properties-section">
            <div class="properties-grid">
              <div class="slider-group">
                <label>X Position:</label>
                <div class="slider-container">
                  <input type="range" id="obj-x" min="0" max="100" step="0.1" value="${
                    values.x
                  }" ${disabled}>
                  <span class="slider-value" id="obj-x-value">${values.x.toFixed(
                    1
                  )}</span>
                </div>
              </div>

              <div class="slider-group">
                <label>Y Position:</label>
                <div class="slider-container">
                  <input type="range" id="obj-y" min="0" max="100" step="0.1" value="${
                    values.y
                  }" ${disabled}>
                  <span class="slider-value" id="obj-y-value">${values.y.toFixed(
                    1
                  )}</span>
                </div>
              </div>

              <div class="slider-group">
                <label>Scale:</label>
                <div class="slider-container">
                  <input type="range" id="obj-scale" min="0.05" max="3" step="0.05" value="${
                    values.scale
                  }" ${disabled}>
                  <span class="slider-value" id="obj-scale-value">${values.scale.toFixed(
                    2
                  )}</span>
                  <button class="reset-btn" id="reset-scale" ${disabled}>↻</button>
                </div>
              </div>

              <div class="slider-group">
                <label>Rotation:</label>
                <div class="slider-container">
                  <input type="range" id="obj-rotation" min="-360" max="360" step="1" value="${
                    values.rotation
                  }" ${disabled}>
                  <span class="slider-value" id="obj-rotation-value">${
                    values.rotation
                  }°</span>
                  <button class="reset-btn" id="reset-rotation" ${disabled}>↻</button>
                </div>
              </div>

              <div class="slider-group">
                <label>Z-Index:</label>
                <div class="slider-container">
                  <input type="range" id="obj-zindex" min="1" max="100" step="1" value="${
                    values.zIndex
                  }" ${disabled}>
                  <span class="slider-value" id="obj-zindex-value">${
                    values.zIndex
                  }</span>
                  <button class="reset-btn" id="reset-zindex" ${disabled}>↻</button>
                </div>
              </div>
              
              <div class="slider-group">
                <label>Opacity:</label>
                <div class="slider-container">
                  <input type="range" id="obj-opacity" min="0" max="1" step="0.1" value="${
                    values.opacity
                  }" ${disabled}>
                  <span class="slider-value" id="obj-opacity-value">${values.opacity.toFixed(
                    1
                  )}</span>
                </div>
              </div>

                            <div class="slider-group">
                <label>Duration:</label>
                <div class="slider-container">
                  <input type="range" id="obj-animation-duration" min="100" max="5000" step="100" value="${
                    values.animationTiming.duration
                  }" ${disabled}>
                  <span class="slider-value" id="obj-animation-duration-value">${
                    values.animationTiming.duration
                  }ms</span>
                </div>
              </div>

              <div class="slider-group">
                <label>Delay:</label>
                <div class="slider-container">
                  <input type="range" id="obj-animation-delay" min="0" max="3000" step="100" value="${
                    values.animationTiming.delay
                  }" ${disabled}>
                  <span class="slider-value" id="obj-animation-delay-value">${
                    values.animationTiming.delay
                  }ms</span>
                </div>
              </div>

              <div class="form-group">
                <label>Easing:</label>
                <select id="obj-animation-easing" ${disabled}>
                  <option value="ease" ${
                    values.animationTiming.easing === "ease" ? "selected" : ""
                  }>Ease</option>
                  <option value="ease-in" ${
                    values.animationTiming.easing === "ease-in"
                      ? "selected"
                      : ""
                  }>Ease In</option>
                  <option value="ease-out" ${
                    values.animationTiming.easing === "ease-out"
                      ? "selected"
                      : ""
                  }>Ease Out</option>
                  <option value="ease-in-out" ${
                    values.animationTiming.easing === "ease-in-out"
                      ? "selected"
                      : ""
                  }>Ease In-Out</option>
                  <option value="linear" ${
                    values.animationTiming.easing === "linear" ? "selected" : ""
                  }>Linear</option>
                </select>
              </div>

              <div class="form-group">
                <button class="btn btn-small btn-secondary" id="reset-animation-timing" ${disabled}>Reset to Defaults</button>
              </div>

                            <div class="form-group">
                <label>Effect:</label>
                <select id="obj-effect" ${disabled}>
                  <option value="">No Effect</option>
                  <option value="fade_in">Fade In</option>
                  <option value="fade_out">Fade Out</option>
                  <option value="slide_to">Slide To</option>
                  <option value="scale_to">Scale To</option>
                  <option value="glow">Glow</option>
                  <option value="wiggle">Wiggle</option>
                </select>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" id="obj-flipped" ${
                    values.flipped ? "checked" : ""
                  } ${disabled}>
                  Flip Horizontally
                </label>
              </div>

              <button class="btn btn-danger btn-small" onclick="if(window.editor) window.editor.removeSelectedObject()" ${disabled}>Remove Object</button>

            </div>
          </div>

        </div>
      `;

      document.getElementById("obj-effect").value = values.effect;

      if (hasSelection) {
        this.setupEventListeners(obj);
        this.setupResetButtons();
        this.setupAnimationTimingListeners();
      }
    });
  }

  createStateHash(hasSelection, obj, selectedObjectIndex, sceneId) {
    if (!hasSelection) {
      return "no-selection";
    }

    return JSON.stringify({
      sceneId,
      selectedObjectIndex,
      x: obj?.x,
      y: obj?.y,
      scale: obj?.scale,
      rotation: obj?.rotation,
      zIndex: obj?.zIndex,
      opacity: obj?.opacity,
      effect: obj?.effect,
      flipped: obj?.flipped,
      locked: obj?.locked,
      animationTiming: obj?.animationTiming,
    });
  }

  setupEventListeners(obj) {
    const sliders = ObjectPropertiesManager.SLIDER_CONFIGS;

    sliders.forEach(({ id, valueId, suffix, decimals }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        slider.addEventListener("input", () => {
          const value = parseFloat(slider.value);
          valueDisplay.textContent = value.toFixed(decimals) + suffix;
          window.editor.updateSelectedObject();
        });
      }
    });

    const effectSelect = document.getElementById("obj-effect");
    if (effectSelect) {
      effectSelect.addEventListener("change", (e) => {
        const previousEffect = obj.effect;
        const newEffect = e.target.value;

        window.editor.updateSelectedObject();

        if (previousEffect !== newEffect && window.effectManager) {
          window.effectManager.handleEffectChange(newEffect);
        }
      });
    }

    const flippedCheckbox = document.getElementById("obj-flipped");
    if (flippedCheckbox) {
      flippedCheckbox.addEventListener("change", () => {
        window.editor.updateSelectedObject();
      });
    }
  }

  setupAnimationTimingListeners() {
    const timingSliders = ObjectPropertiesManager.ANIMATION_TIMING_CONFIGS;

    timingSliders.forEach(({ id, valueId, suffix, decimals }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);

      if (slider && valueDisplay) {
        slider.addEventListener("input", () => {
          const value = parseInt(slider.value);
          valueDisplay.textContent = value.toFixed(decimals) + suffix;
          window.editor.updateSelectedObject();
        });
      }
    });

    const easingSelect = document.getElementById("obj-animation-easing");
    if (easingSelect) {
      easingSelect.addEventListener("change", () => {
        window.editor.updateSelectedObject();
      });
    }

    const resetTimingBtn = document.getElementById("reset-animation-timing");
    if (resetTimingBtn) {
      resetTimingBtn.addEventListener("click", () => {
        this.resetAnimationTiming();
      });
    }
  }

  setupResetButtons() {
    const resetButtons = [
      {
        id: "reset-scale",
        property: "scale",
        value: 1.0,
        sliderId: "obj-scale",
        valueId: "obj-scale-value",
        decimals: 2,
      },
      {
        id: "reset-rotation",
        property: "rotation",
        value: 0,
        sliderId: "obj-rotation",
        valueId: "obj-rotation-value",
        decimals: 0,
        suffix: "°",
      },
      {
        id: "reset-zindex",
        property: "zIndex",
        value: 1,
        sliderId: "obj-zindex",
        valueId: "obj-zindex-value",
        decimals: 0,
      },
    ];

    resetButtons.forEach(
      ({ id, property, value, sliderId, valueId, decimals, suffix = "" }) => {
        const button = document.getElementById(id);
        if (button) {
          button.addEventListener("click", () => {
            this.resetProperty(
              property,
              value,
              sliderId,
              valueId,
              decimals,
              suffix
            );
          });
        }
      }
    );
  }

  resetProperty(property, value, sliderId, valueId, decimals, suffix) {
    const selectedObject = window.previewManager?.getSelectedObject();
    if (selectedObject === null || !window.editor?.currentScene) return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[selectedObject];

    if (!obj) return;

    obj[property] = value;

    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueId);

    if (slider) slider.value = value;
    if (display) display.textContent = value.toFixed(decimals) + suffix;

    window.editor.updateSelectedObject();
  }

  resetAnimationTiming() {
    const selectedObject = window.previewManager?.getSelectedObject();
    if (selectedObject === null || !window.editor?.currentScene) return;

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[selectedObject];

    if (!obj) return;

    const defaultTiming =
      window.editor.projectManager.getDefaultAnimationTiming();
    obj.animationTiming = { ...defaultTiming };

    // Update UI controls
    const durationSlider = document.getElementById("obj-animation-duration");
    const delaySlider = document.getElementById("obj-animation-delay");
    const easingSelect = document.getElementById("obj-animation-easing");

    const durationDisplay = document.getElementById(
      "obj-animation-duration-value"
    );
    const delayDisplay = document.getElementById("obj-animation-delay-value");

    if (durationSlider) durationSlider.value = defaultTiming.duration;
    if (delaySlider) delaySlider.value = defaultTiming.delay;
    if (easingSelect) easingSelect.value = defaultTiming.easing;

    if (durationDisplay)
      durationDisplay.textContent = defaultTiming.duration + "ms";
    if (delayDisplay) delayDisplay.textContent = defaultTiming.delay + "ms";

    window.editor.updateSelectedObject();
  }

  updateSceneObjectsList(project, sceneId, selectedObjectIndex = null) {
    const sceneObjectsList = document.getElementById("scene-objects-list");
    if (!sceneObjectsList) return;

    if (!sceneId) {
      sceneObjectsList.innerHTML =
        '<div class="scene-objects-empty">No scene selected</div>';
      return;
    }

    const scene = project.scenes[sceneId];
    if (!scene.images || scene.images.length === 0) {
      sceneObjectsList.innerHTML =
        '<div class="scene-objects-empty">No objects in scene</div>';
      return;
    }

    requestAnimationFrame(() => {
      sceneObjectsList.innerHTML = scene.images
        .map((imageData, index) =>
          this.createObjectItemHTML(
            imageData,
            index,
            selectedObjectIndex === index
          )
        )
        .join("");
    });
  }

  createObjectItemHTML(imageData, index, isSelected) {
    const cleanName = Utils.getCleanFilename(imageData.src, "object");
    const lockIcon = imageData.locked ? "🔒" : "🔓";
    const lockTitle = imageData.locked ? "Unlock object" : "Lock object";
    const selectedClass = isSelected ? " selected" : "";
    const lockedClass = imageData.locked ? " locked" : "";

    const hasEffect = imageData.effect && imageData.effect !== "";
    const effectIndicator = hasEffect
      ? `<span class="effect-indicator" title="Has ${imageData.effect} effect">✨</span>`
      : "";

    return `
      <div class="scene-object-item${selectedClass}${lockedClass}">
        <div class="scene-object-info">
          <div class="scene-object-name">${cleanName} ${effectIndicator}</div>
          <div class="scene-object-details">
            x: ${imageData.x.toFixed(1)}%, y: ${imageData.y.toFixed(1)}%, 
            scale: ${imageData.scale.toFixed(1)}, z: ${imageData.zIndex}${
      imageData.flipped ? ", flipped" : ""
    }
          </div>
        </div>
        <div class="scene-object-actions">
          <button class="lock-btn" onclick="if(window.editor) window.editor.toggleObjectLock(${index})" title="${lockTitle}">${lockIcon}</button>
          <button class="select-btn" onclick="if(window.editor) window.editor.selectObjectFromList(${index})">Select</button>
          <button class="delete-btn" onclick="if(window.editor) window.editor.removeObjectFromList(${index})">Delete</button>
        </div>
      </div>
    `;
  }
}
