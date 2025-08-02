class PreviewInteractionManager {
  static SCALE_LIMITS = { MIN: 0.1, MAX: 5 };
  static SCALE_SENSITIVITY = 0.01;
  static FEEDBACK_DURATION = 1000;
  static FEEDBACK_OFFSET = 25;
  static SLIDER_WIDTH = 100;
  static SLIDER_OFFSET = 40;

  static COLORS = {
    SUCCESS: "#27ae60",
    INFO: "#3498db",
    WARNING: "#f39c12",
    DANGER: "#e74c3c",
  };

  constructor(contextMenuManager) {
    this.contextMenuManager = contextMenuManager;
    this.selectedObject = null;
    this.isDragging = false;
    this.isScaling = false;
    this.isRotating = false;
    this.selectedUIElement = null;
    this.isDraggingUI = false;
    this.eventListeners = new Map();
    this.activeTimers = new Set();

    // FIX: Add throttling for smooth drag updates
    this.dragUpdateTimer = null;
    this.DRAG_THROTTLE_DELAY = 8; // ~120fps for smooth dragging
  }

  setupPreviewEventListeners() {
    const previewScene = document.getElementById("preview-scene");
    this.addEventListener(previewScene, "click", (e) =>
      this.handlePreviewClick(e)
    );
    this.addEventListener(previewScene, "dragover", (e) =>
      this.handleDragOver(e)
    );
    this.addEventListener(previewScene, "drop", (e) => this.handleDrop(e));
    this.addEventListener(previewScene, "contextmenu", (e) =>
      this.handleBackgroundContextMenu(e)
    );
    this.addEventListener(document, "keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );
  }

  addEventListener(element, event, handler) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }
    this.eventListeners.get(element).set(event, handler);
    element.addEventListener(event, handler);
  }

  removeEventListener(element, event) {
    const elementListeners = this.eventListeners.get(element);
    if (elementListeners && elementListeners.has(event)) {
      const handler = elementListeners.get(event);
      element.removeEventListener(event, handler);
      elementListeners.delete(event);
    }
  }

  cleanup() {
    this.clearAllTimers();
    this.cleanupAllEventListeners();
    this.hideLengthSlider();

    // FIX: Clear drag timer on cleanup
    if (this.dragUpdateTimer) {
      clearTimeout(this.dragUpdateTimer);
      this.dragUpdateTimer = null;
    }
  }

  clearAllTimers() {
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();
  }

  cleanupAllEventListeners() {
    this.eventListeners.forEach((eventMap, element) => {
      eventMap.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }

  handleBackgroundContextMenu(e) {
    const target = e.target;
    if (
      target.classList.contains("preview-scene") ||
      target.classList.contains("preview-overlay") ||
      target.classList.contains("drop-zone")
    ) {
      e.preventDefault();
      this.contextMenuManager.showBackgroundContextMenu(e);
    }
  }

  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "c") {
        e.preventDefault();
        this.selectedUIElement
          ? this.copyUIElementPosition()
          : this.copySelectedObject();
      } else if (e.key === "v") {
        e.preventDefault();
        this.selectedUIElement
          ? this.pasteUIElementPosition()
          : this.pasteObject();
      }
    }
  }

  copySelectedObject() {
    const obj = this.getCurrentSceneObject();
    window.projectManager.copyObject(obj);
    this.showFeedback("Copied!", PreviewInteractionManager.COLORS.SUCCESS);
  }

  copySelectedObjectPosition() {
    const obj = this.getCurrentSceneObject();
    window.projectManager.copyPosition(obj);
    this.showFeedback(
      "Position Copied!",
      PreviewInteractionManager.COLORS.SUCCESS
    );
  }

  pasteObject() {
    const objectData = window.projectManager.getPastedObject();
    const newObject = {
      ...objectData,
      zIndex: Date.now(),
    };

    const scene = this.getCurrentScene();
    scene.images.push(newObject);
    this.updateAllComponents(scene.images.length - 1);
    this.showFeedback("Pasted!", PreviewInteractionManager.COLORS.INFO);
  }

  pasteObjectPosition() {
    const selectedObject = this.getSelectedObject();
    if (selectedObject === null) return;

    const positionData = window.projectManager.getPastedPosition();
    if (!positionData) return;

    const obj = this.getCurrentSceneObject();
    this.applyPositionData(obj, positionData);
    this.updateObjectAndUI();
    this.showFeedback(
      "Position Pasted!",
      PreviewInteractionManager.COLORS.INFO
    );
  }

  applyPositionData(obj, positionData) {
    obj.x = positionData.x;
    obj.y = positionData.y;
    obj.rotation = positionData.rotation;
    obj.opacity = positionData.opacity;
    obj.scale = positionData.scale;
    obj.zIndex = positionData.zIndex;
  }

  updateObjectAndUI() {
    window.previewManager.renderer.updateObjectVisual();
    window.editor.updateObjectProperties();
    window.editor.updateSceneObjectsList();
  }

  updateAllComponents(selectedIndex) {
    window.previewManager.renderPreview(
      this.getProject(),
      window.editor.currentScene
    );
    this.selectObject(selectedIndex);
    window.editor.updateObjectProperties();
    window.editor.updateSceneObjectsList();
  }

  copyUIElementPosition() {
    const position = this.getUIElementPosition(this.selectedUIElement);
    window.projectManager.copyPosition(position);
    this.showFeedback("Copied!", PreviewInteractionManager.COLORS.SUCCESS);
  }

  pasteUIElementPosition() {
    const position = window.projectManager.getPastedPosition();
    if (!position) return;

    this.setUIElementPosition(this.selectedUIElement, position);
    this.showFeedback("Pasted!", PreviewInteractionManager.COLORS.INFO);
  }

  getUIElementPosition(element) {
    const scene = this.getCurrentScene();
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    if (uiType === "choice" && choiceIndex !== undefined) {
      return scene.choices[parseInt(choiceIndex)].position;
    }
    return scene.uiPositions[uiType];
  }

  setUIElementPosition(element, position) {
    const project = this.getProject();
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    this.applyElementPosition(element, position);

    if (uiType === "choice" && choiceIndex !== undefined) {
      window.sceneManager.updateChoicePosition(
        project,
        window.editor.currentScene,
        parseInt(choiceIndex),
        position.x,
        position.y,
        position.width !== undefined ? position.width : undefined
      );

      if (window.uiManager && position.width !== undefined) {
        window.uiManager.updateChoicePositionSliders(
          window.editor.currentScene,
          parseInt(choiceIndex),
          { x: position.x, y: position.y, width: position.width }
        );
      }
    } else {
      const currentPos = this.getCurrentScene().uiPositions[uiType];
      const width =
        position.width !== undefined ? position.width : currentPos.width;

      window.sceneManager.updateUIElementPosition(
        project,
        window.editor.currentScene,
        uiType,
        position.x,
        position.y,
        width
      );

      if (window.uiManager) {
        window.uiManager.updateUIPositionSliders(this.getCurrentScene());
      }
    }

    this.updateLengthSliderPosition(element);
    if (position.width !== undefined) {
      this.updateLengthSliderValue(position.width);
    }
  }

  applyElementPosition(element, position) {
    element.style.left = `${position.x}%`;
    element.style.top = `${position.y}%`;
    if (position.width !== undefined) {
      element.style.width = `${position.width}%`;
    }
  }

  updateLengthSliderValue(width) {
    const lengthSlider = document.getElementById("length-slider");
    const valueDisplay = document
      .getElementById("length-slider-container")
      ?.querySelector("span");
    if (lengthSlider) lengthSlider.value = width;
    if (valueDisplay) valueDisplay.textContent = `${width}%`;
  }

  showFeedback(message, color) {
    const targetElement = this.selectedUIElement;
    const rect = this.getFeedbackRect(targetElement);
    const feedback = this.createFeedbackElement(message, color, rect);

    document.getElementById("preview-scene").appendChild(feedback);
    const timer = setTimeout(
      () => feedback.remove(),
      PreviewInteractionManager.FEEDBACK_DURATION
    );
    this.activeTimers.add(timer);
  }

  getFeedbackRect(targetElement) {
    const previewRect = document
      .getElementById("preview-scene")
      .getBoundingClientRect();

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      return {
        left: rect.left - previewRect.left,
        top:
          rect.top -
          previewRect.top -
          PreviewInteractionManager.FEEDBACK_OFFSET,
      };
    }

    return {
      left: previewRect.width / 2,
      top: previewRect.height / 2,
    };
  }

  createFeedbackElement(message, color, rect) {
    const feedback = document.createElement("div");
    feedback.className = "position-feedback";
    feedback.textContent = message;
    Object.assign(feedback.style, {
      position: "absolute",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      background: color,
      color: "white",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "bold",
      zIndex: "1002",
      pointerEvents: "none",
    });
    return feedback;
  }

  handlePreviewClick(e) {
    if (
      e.target.classList.contains("preview-scene") ||
      e.target.classList.contains("preview-overlay") ||
      e.target.classList.contains("drop-zone")
    ) {
      this.deselectAll();
      this.hideAllControls();
      window.previewManager.renderer.removeSelectionFromObjects();
    }
  }

  deselectAll() {
    this.selectedObject = null;
    this.selectedUIElement = null;
    window.editor.updateObjectProperties();
    window.editor.updateSceneObjectsList();
  }

  hideAllControls() {
    this.hideObjectControls();
    this.hideUIElementSelection();
    this.hideLengthSlider();
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  handleDrop(e) {
    e.preventDefault();
    const objPath = e.dataTransfer.getData("text/plain");
    const position = this.calculateRelativePosition(e.clientX, e.clientY);
    window.editor.addObjectToScene(objPath, position.x, position.y);
  }

  calculateRelativePosition(clientX, clientY) {
    const previewScene = document.getElementById("preview-scene");
    const rect = previewScene.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }

  addImageInteractions(objElement, index) {
    objElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectObject(index);
    });

    objElement.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectObject(index);
      this.contextMenuManager.showObjectContextMenu(e, index);
    });

    objElement.addEventListener("mousedown", (e) => this.startDrag(e, index));
  }

  makeUIElementDraggable(element) {
    if (element.classList.contains("graphic-choice")) {
      Object.assign(element.style, {
        cursor: "move",
        border: "none !important",
        borderRadius: "0 !important",
        outline: "none !important",
        boxShadow: "none !important",
      });
    } else {
      Object.assign(element.style, {
        cursor: "move",
        border: "2px dashed transparent",
        transition: "border-color 0.2s",
      });

      element.addEventListener("mouseenter", () => {
        if (!element.classList.contains("graphic-choice")) {
          element.style.borderColor = "rgba(52, 152, 219, 0.5)";
        }
      });

      element.addEventListener("mouseleave", () => {
        if (
          this.selectedUIElement !== element &&
          !element.classList.contains("graphic-choice")
        ) {
          element.style.borderColor = "transparent";
        }
      });
    }

    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectUIElement(element);
    });

    element.addEventListener("mousedown", (e) => {
      this.startUIElementDrag(e, element);
    });

    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.contextMenuManager.showUIElementContextMenu(e, element);
    });
  }

  selectUIElement(element) {
    this.deselectAll();
    this.hideObjectControls();
    window.previewManager.renderer.removeSelectionFromObjects();

    this.selectedUIElement = element;
    this.showUIElementSelection(element);
    this.showLengthSlider(element);
    window.editor.updateObjectProperties();
    window.editor.updateSceneObjectsList();
  }

  showLengthSlider(element) {
    this.hideLengthSlider();

    const rect = element.getBoundingClientRect();
    const previewRect = document
      .getElementById("preview-scene")
      .getBoundingClientRect();
    const currentWidth = this.getElementWidth(element);

    const sliderContainer = this.createSliderContainer(
      rect,
      previewRect,
      currentWidth
    );
    document.getElementById("preview-scene").appendChild(sliderContainer);
  }

  createSliderContainer(rect, previewRect, currentWidth) {
    const sliderContainer = document.createElement("div");
    sliderContainer.className = "length-slider-container";
    sliderContainer.id = "length-slider-container";

    Object.assign(sliderContainer.style, {
      position: "absolute",
      left: `${rect.left - previewRect.left}px`,
      top: `${
        rect.top - previewRect.top - PreviewInteractionManager.SLIDER_OFFSET
      }px`,
      zIndex: "1000",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: "5px 10px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });

    const label = this.createSliderLabel();
    const slider = this.createSlider(currentWidth);
    const valueDisplay = this.createValueDisplay(currentWidth);

    sliderContainer.appendChild(label);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);

    return sliderContainer;
  }

  createSliderLabel() {
    const label = document.createElement("label");
    label.textContent = "Width:";
    Object.assign(label.style, {
      color: "white",
      fontSize: "12px",
      minWidth: "40px",
    });
    return label;
  }

  createSlider(currentWidth) {
    const slider = document.createElement("input");
    Object.assign(slider, {
      type: "range",
      min: "10",
      max: "100",
      step: "1",
      id: "length-slider",
      value: currentWidth,
    });
    slider.style.width = `${PreviewInteractionManager.SLIDER_WIDTH}px`;

    slider.addEventListener("input", (e) => {
      const newWidth = parseFloat(e.target.value);
      const valueDisplay = slider.parentElement.querySelector("span");
      valueDisplay.textContent = `${newWidth}%`;
      this.updateElementWidth(this.selectedUIElement, newWidth);
    });

    return slider;
  }

  createValueDisplay(currentWidth) {
    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = `${currentWidth}%`;
    Object.assign(valueDisplay.style, {
      color: "white",
      fontSize: "12px",
      minWidth: "35px",
    });
    return valueDisplay;
  }

  hideLengthSlider() {
    const existingSlider = document.getElementById("length-slider-container");
    if (existingSlider) existingSlider.remove();
  }

  getElementWidth(element) {
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;
    const scene = this.getCurrentScene();

    if (uiType === "choice" && choiceIndex !== undefined) {
      return scene.choices[parseInt(choiceIndex)].position?.width;
    }
    return scene.uiPositions[uiType]?.width;
  }

  updateElementWidth(element, width) {
    element.style.width = `${width}%`;

    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;
    const project = this.getProject();

    if (uiType === "choice" && choiceIndex !== undefined) {
      window.sceneManager.updateChoicePosition(
        project,
        window.editor.currentScene,
        parseInt(choiceIndex),
        undefined,
        undefined,
        width
      );

      if (window.uiManager) {
        window.uiManager.updateChoicePositionSliders(
          window.editor.currentScene,
          parseInt(choiceIndex),
          { width: width }
        );
      }
    } else {
      const currentPos = this.getCurrentScene().uiPositions[uiType];
      window.sceneManager.updateUIElementPosition(
        project,
        window.editor.currentScene,
        uiType,
        currentPos.x,
        currentPos.y,
        width
      );
    }
  }

  showUIElementSelection(element) {
    document.querySelectorAll(".draggable-ui").forEach((el) => {
      el.style.borderColor = "transparent";
      el.style.borderWidth = "0";
      el.style.borderStyle = "none";
      if (el.classList.contains("graphic-choice")) {
        el.style.filter = "none";
      }
    });

    if (element.classList.contains("graphic-choice")) {
      element.style.filter =
        "brightness(1.2) drop-shadow(0 0 8px rgba(231, 76, 60, 0.8))";
      element.style.border = "none !important";
      element.style.borderWidth = "0 !important";
      element.style.borderStyle = "none !important";
    } else {
      element.style.borderColor = PreviewInteractionManager.COLORS.DANGER;
      element.style.borderWidth = "2px";
      element.style.borderStyle = "dashed";
    }
  }

  hideUIElementSelection() {
    document.querySelectorAll(".draggable-ui").forEach((el) => {
      el.style.borderColor = "transparent";
      el.style.borderWidth = "0";
      el.style.borderStyle = "none";
      if (el.classList.contains("graphic-choice")) {
        el.style.filter = "none";
      }
    });
    this.hideLengthSlider();
  }

  startUIElementDrag(e, element) {
    e.preventDefault();
    e.stopPropagation();

    this.isDraggingUI = true;
    this.selectUIElement(element);

    const previewScene = document.getElementById("preview-scene");
    const previewRect = previewScene.getBoundingClientRect();

    const mouseMoveHandler = (e) => {
      if (!this.isDraggingUI) return;

      const position = this.calculateConstrainedPosition(
        e.clientX,
        e.clientY,
        previewRect
      );

      // FIX: Throttle UI element position updates during drag for smooth performance
      this.throttledUpdateUIElementPosition(element, position);
    };

    const mouseUpHandler = () => {
      this.isDraggingUI = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);

      // FIX: Clear any pending throttled updates
      if (this.dragUpdateTimer) {
        clearTimeout(this.dragUpdateTimer);
        this.dragUpdateTimer = null;
      }
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  // FIX: Add throttled UI element position update for smooth dragging
  throttledUpdateUIElementPosition(element, position) {
    // Update visual position immediately for smooth feedback
    element.style.left = `${position.x}%`;
    element.style.top = `${position.y}%`;
    this.updateLengthSliderPosition(element);

    // Throttle the data model updates
    if (this.dragUpdateTimer) {
      clearTimeout(this.dragUpdateTimer);
    }

    this.dragUpdateTimer = setTimeout(() => {
      this.updateUIElementPosition(element, position);
      this.dragUpdateTimer = null;
    }, this.DRAG_THROTTLE_DELAY);
  }

  calculateConstrainedPosition(clientX, clientY, previewRect) {
    return {
      x: Math.max(
        0,
        Math.min(100, ((clientX - previewRect.left) / previewRect.width) * 100)
      ),
      y: Math.max(
        0,
        Math.min(100, ((clientY - previewRect.top) / previewRect.height) * 100)
      ),
    };
  }

  updateUIElementPosition(element, position) {
    const project = this.getProject();
    const uiType = element.dataset.uiType;
    const choiceIndex = element.dataset.choiceIndex;

    if (uiType === "choice" && choiceIndex !== undefined) {
      window.sceneManager.updateChoicePosition(
        project,
        window.editor.currentScene,
        parseInt(choiceIndex),
        position.x,
        position.y
      );

      if (window.uiManager) {
        window.uiManager.updateChoicePositionSliders(
          window.editor.currentScene,
          parseInt(choiceIndex),
          position
        );
      }
    } else {
      window.sceneManager.updateUIElementPosition(
        project,
        window.editor.currentScene,
        uiType,
        position.x,
        position.y
      );

      if (window.uiManager) {
        window.uiManager.updateUIPositionSliders(this.getCurrentScene());
      }
    }
  }

  updateLengthSliderPosition(element) {
    const sliderContainer = document.getElementById("length-slider-container");
    if (!sliderContainer) return;

    const rect = element.getBoundingClientRect();
    const previewRect = document
      .getElementById("preview-scene")
      .getBoundingClientRect();

    sliderContainer.style.left = `${rect.left - previewRect.left}px`;
    sliderContainer.style.top = `${
      rect.top - previewRect.top - PreviewInteractionManager.SLIDER_OFFSET
    }px`;
  }

  selectObject(index) {
    const isReselecting = this.selectedObject === index;

    this.selectedObject = index;
    this.selectedUIElement = null;
    this.hideUIElementSelection();

    window.previewManager.renderer.removeSelectionFromObjects();
    const selectedElement = document.querySelector(
      `[data-image-index="${index}"]`
    );

    // FIX: Add null check before accessing classList
    if (selectedElement) {
      selectedElement.classList.add("selected");
    } else {
      console.warn(`Could not find element with data-image-index="${index}"`);
      // Reset selection if element not found
      this.selectedObject = null;
      return;
    }

    window.editor.updateObjectProperties();
    window.editor.updateSceneObjectsList();
    this.showObjectControls();
  }

  getSelectedObject() {
    return this.selectedObject;
  }

  getSelectedUIElement() {
    return this.selectedUIElement;
  }

  deselectObject() {
    this.selectedObject = null;
    this.hideObjectControls();
    window.previewManager.renderer.removeSelectionFromObjects();
  }

  showObjectControls() {
    const selectedElement = document.querySelector(
      `[data-image-index="${this.selectedObject}"]`
    );
    if (!selectedElement) return;

    this.hideObjectControls();

    const controls = this.createObjectControls();
    selectedElement.appendChild(controls);
  }

  createObjectControls() {
    const controls = document.createElement("div");
    controls.className = "object-controls visible";
    controls.id = "object-controls";

    Object.assign(controls.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });

    const scaleHandle = this.createControlHandle("scale-handle", (e) =>
      this.startScaling(e)
    );
    const rotateHandle = this.createControlHandle("rotate-handle", (e) =>
      this.startRotating(e)
    );

    controls.appendChild(scaleHandle);
    controls.appendChild(rotateHandle);

    return controls;
  }

  createControlHandle(className, mouseDownHandler) {
    const handle = document.createElement("div");
    handle.className = `control-handle ${className}`;
    handle.style.pointerEvents = "auto";
    handle.addEventListener("mousedown", mouseDownHandler);
    return handle;
  }

  hideObjectControls() {
    const existingControls = document.getElementById("object-controls");
    if (existingControls) existingControls.remove();
  }

  startScaling(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isScaling = true;

    const startMouseY = e.clientY;
    const obj = this.getCurrentSceneObject();
    const { scaleProperty, startScale } = this.getScaleProperties(obj);

    const mouseMoveHandler = (e) => {
      if (!this.isScaling) return;

      const deltaY = startMouseY - e.clientY;
      const scaleChange = deltaY * PreviewInteractionManager.SCALE_SENSITIVITY;
      obj[scaleProperty] = Math.max(
        PreviewInteractionManager.SCALE_LIMITS.MIN,
        Math.min(
          PreviewInteractionManager.SCALE_LIMITS.MAX,
          startScale + scaleChange
        )
      );

      this.updateObjectAndUI();
      this.updateEffectDrawer(obj);
    };

    const mouseUpHandler = () => {
      this.isScaling = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  getScaleProperties(obj) {
    let scaleProperty = "scale";

    if (obj.effect === "scale_to") {
      const editMode = obj.effectEditMode;
      if (editMode === "start") {
        scaleProperty = "scaleStart";
        if (obj.scaleStart === undefined) obj.scaleStart = obj.scale;
      } else if (editMode === "end") {
        scaleProperty = "scaleEnd";
        if (obj.scaleEnd === undefined) obj.scaleEnd = obj.scale;
      }
    }

    return { scaleProperty, startScale: obj[scaleProperty] };
  }

  updateEffectDrawer(obj) {
    if (obj.effect === "scale_to" && window.effectManager) {
      window.effectManager.updateEffectDrawerContent(obj);
    }
  }

  startRotating(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isRotating = true;

    const selectedElement = document.querySelector(
      `[data-image-index="${this.selectedObject}"]`
    );
    const rect = selectedElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const obj = this.getCurrentSceneObject();

    const mouseMoveHandler = (e) => {
      if (!this.isRotating) return;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      obj.rotation = Math.round(rotation);

      this.updateObjectAndUI();
    };

    const mouseUpHandler = () => {
      this.isRotating = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  startDrag(e, index) {
    e.preventDefault();
    e.stopPropagation();

    if (this.isScaling || this.isRotating) return;

    this.isDragging = true;
    const isReselecting = this.selectedObject === index;

    if (!isReselecting) {
      this.selectObject(index);
    }

    const previewScene = document.getElementById("preview-scene");
    const previewRect = previewScene.getBoundingClientRect();

    const mouseMoveHandler = (e) => {
      if (!this.isDragging) return;

      const position = this.calculateConstrainedPosition(
        e.clientX,
        e.clientY,
        previewRect
      );
      this.updateObjectPosition(position);
    };

    const mouseUpHandler = () => {
      this.isDragging = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  updateObjectPosition(position) {
    const obj = this.getCurrentSceneObject();

    if (obj.effect === "slide_to") {
      const editMode = obj.effectEditMode;
      if (editMode === "start") {
        if (obj.moveStartX === undefined) obj.moveStartX = obj.x;
        if (obj.moveStartY === undefined) obj.moveStartY = obj.y;
        obj.moveStartX = position.x;
        obj.moveStartY = position.y;
      } else if (editMode === "end") {
        if (obj.moveEndX === undefined) obj.moveEndX = obj.x;
        if (obj.moveEndY === undefined) obj.moveEndY = obj.y;
        obj.moveEndX = position.x;
        obj.moveEndY = position.y;
      }
      this.updateEffectDrawer(obj);
    } else {
      obj.x = position.x;
      obj.y = position.y;
    }

    this.updateObjectAndUI();
  }

  getProject() {
    return window.editor.projectManager.getProject();
  }

  getCurrentScene() {
    return this.getProject().scenes[window.editor.currentScene];
  }

  getCurrentSceneObject(index = this.selectedObject) {
    return this.getCurrentScene().images[index];
  }
}
