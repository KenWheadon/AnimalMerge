class EffectManager {
  constructor() {
    window.effectManager = this;
  }

  setupEventListeners() {
    Utils.addEventListenerSafe("close-effect-drawer", "click", () => {
      this.closeEffectDrawer();
    });
  }

  handleEffectChange(effectType) {
    if (effectType === "scale_to" || effectType === "slide_to") {
      this.autoOpenEffectDrawer();
    } else {
      this.closeEffectDrawer();
    }
  }

  autoOpenEffectDrawer() {
    const selectedObject = window.previewManager?.getSelectedObject();
    if (selectedObject === null || !window.editor?.currentScene) {
      return;
    }

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[selectedObject];
    if (!obj) return;

    const drawer = document.getElementById("effect-controls-drawer");
    const drawerContent = document.getElementById("effect-drawer-content");
    if (!drawer || !drawerContent) return;

    if (!obj.effectEditMode) {
      obj.effectEditMode = "start";
    }

    this.updateEffectDrawerContent(obj);
    drawer.classList.add("open");
  }

  closeEffectDrawer() {
    const drawer = document.getElementById("effect-controls-drawer");
    if (drawer) {
      drawer.classList.remove("open");
    }
  }

  toggleEffectEditMode(mode) {
    const selectedObject = window.previewManager?.getSelectedObject();
    if (selectedObject === null || !window.editor?.currentScene) {
      return;
    }

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[selectedObject];
    if (!obj) return;

    obj.effectEditMode = mode;

    this.updateToggleButtonStates(obj);
    window.previewManager?.updateObjectVisualForEffectMode(mode);
  }

  updateToggleButtonStates(obj) {
    const startBtn = document.getElementById("effect-toggle-start");
    const endBtn = document.getElementById("effect-toggle-end");
    const stateLabel = document.getElementById("effect-state-label");
    const stateDesc = document.getElementById("effect-state-description");

    const currentMode = obj.effectEditMode || "start";

    if (startBtn && endBtn) {
      startBtn.classList.toggle("active", currentMode === "start");
      endBtn.classList.toggle("active", currentMode === "end");
    }

    if (stateLabel && stateDesc) {
      if (currentMode === "start") {
        stateLabel.textContent = "Editing Start Position";
        stateDesc.textContent = "Adjusting where the effect begins";
      } else {
        stateLabel.textContent = "Editing End Position";
        stateDesc.textContent = "Adjusting where the effect finishes";
      }
    }
  }

  createSliderControl(id, label, min, max, step, value) {
    const precision = step === "0.1" ? 1 : 2;
    return `
      <div class="slider-group">
        <label>${label}:</label>
        <div class="slider-container">
          <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
          <span class="slider-value" id="${id}-value">${value.toFixed(
      precision
    )}</span>
        </div>
      </div>
    `;
  }

  attachSliderListener(id) {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(`${id}-value`);
    if (!slider || !valueDisplay) return;

    const precision = slider.step === "0.1" ? 1 : 2;
    slider.addEventListener("input", () => {
      const value = parseFloat(slider.value);
      valueDisplay.textContent = value.toFixed(precision);
      window.editor?.updateSelectedObjectFromDrawer();
    });
  }

  createEffectStateControls() {
    return `
      <div class="effect-state-indicator">
        <div class="state-label" id="effect-state-label">Editing Start Position</div>
        <div class="state-description" id="effect-state-description">Adjusting where the effect begins</div>
      </div>
      
      <div class="effect-toggle-controls">
        <button class="effect-toggle-btn active" id="effect-toggle-start" onclick="if(window.effectManager) window.effectManager.toggleEffectEditMode('start')">Start</button>
        <button class="effect-toggle-btn" id="effect-toggle-end" onclick="if(window.effectManager) window.effectManager.toggleEffectEditMode('end')">End</button>
      </div>
    `;
  }

  updateEffectDrawerContent(obj) {
    const drawerContent = document.getElementById("effect-drawer-content");
    if (!drawerContent) return;

    const effectType = obj.effect || "";

    if (effectType === "scale_to") {
      const scaleStart =
        obj.scaleStart !== undefined ? obj.scaleStart : obj.scale;
      const scaleEnd = obj.scaleEnd !== undefined ? obj.scaleEnd : obj.scale;

      drawerContent.innerHTML = `
        ${this.createEffectStateControls()}
        <div class="effect-controls-section">
          <h5>Scale Effect Settings</h5>
          ${this.createSliderControl(
            "drawer-scale-start",
            "Start Scale",
            "0.05",
            "3",
            "0.05",
            scaleStart
          )}
          ${this.createSliderControl(
            "drawer-scale-end",
            "End Scale",
            "0.05",
            "3",
            "0.05",
            scaleEnd
          )}
        </div>
      `;

      this.attachSliderListener("drawer-scale-start");
      this.attachSliderListener("drawer-scale-end");
    } else if (effectType === "slide_to") {
      const moveStartX = obj.moveStartX !== undefined ? obj.moveStartX : obj.x;
      const moveStartY = obj.moveStartY !== undefined ? obj.moveStartY : obj.y;
      const moveEndX = obj.moveEndX !== undefined ? obj.moveEndX : obj.x;
      const moveEndY = obj.moveEndY !== undefined ? obj.moveEndY : obj.y;

      drawerContent.innerHTML = `
        ${this.createEffectStateControls()}
        <div class="effect-controls-section">
          <h5>Move Effect Settings</h5>
          ${this.createSliderControl(
            "drawer-move-start-x",
            "Start X Position",
            "0",
            "100",
            "0.1",
            moveStartX
          )}
          ${this.createSliderControl(
            "drawer-move-start-y",
            "Start Y Position",
            "0",
            "100",
            "0.1",
            moveStartY
          )}
          ${this.createSliderControl(
            "drawer-move-end-x",
            "End X Position",
            "0",
            "100",
            "0.1",
            moveEndX
          )}
          ${this.createSliderControl(
            "drawer-move-end-y",
            "End Y Position",
            "0",
            "100",
            "0.1",
            moveEndY
          )}
        </div>
      `;

      [
        "drawer-move-start-x",
        "drawer-move-start-y",
        "drawer-move-end-x",
        "drawer-move-end-y",
      ].forEach((id) => {
        this.attachSliderListener(id);
      });
    }

    this.updateToggleButtonStates(obj);
  }

  getCurrentEffectEditMode() {
    const selectedObject = window.previewManager?.getSelectedObject();
    if (selectedObject === null || !window.editor?.currentScene) {
      return "start";
    }

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];
    const obj = scene.images[selectedObject];
    if (!obj) return "start";

    return obj.effectEditMode || "start";
  }
}
