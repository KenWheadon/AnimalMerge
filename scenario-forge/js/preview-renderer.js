class PreviewRenderer {
  static STYLES = {
    TEXT_CHOICE: {
      border: "none",
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      textAlign: "center",
      transition: "background-color 0.2s",
    },
    GRAPHIC_CHOICE: {
      cursor: "pointer",
      background: "none",
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "0",
      padding: "0",
      margin: "0",
      outline: "none",
      boxShadow: "none",
      transition: "filter 0.2s",
    },
  };

  static DEFAULT_COLORS = {
    SUCCESS: "#27ae60",
    INFO: "#3498db",
    WARNING: "#f39c12",
    DANGER: "#e74c3c",
    HOVER: "#2980b9",
    ACTIVE: "#1f618d",
    MISSING: "#7f8c8d",
    MISSING_HOVER: "#95a5a6",
  };

  constructor(interactionManager) {
    this.interactionManager = interactionManager;
    this.animationPaths = new Map();
  }

  async renderPreview(project, sceneId) {
    const previewScene = document.getElementById("preview-scene");
    const scene = project.scenes[sceneId];

    if (!scene) {
      previewScene.innerHTML =
        '<div class="drop-zone">Select a scene to preview</div>';
      return;
    }

    // Apply custom scene dimensions
    this.applySceneDimensions(previewScene, project);

    previewScene.innerHTML = "";
    this.setBackground(previewScene, scene);
    this.addOverlay(previewScene, scene);
    await this.addImages(previewScene, scene);
    this.addTextContent(previewScene, scene);
    this.addButtons(previewScene, scene, project);
    this.addDropZone(previewScene, scene);
    this.maintainSelection();
    this.renderAnimationPaths(previewScene);
  }

  applySceneDimensions(previewScene, project) {
    const dimensions = project.defaults?.sceneDimensions || {
      width: 960,
      height: 720,
    };
    const container = previewScene.parentElement;

    // Calculate the aspect ratio
    const aspectRatio = dimensions.width / dimensions.height;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let newWidth, newHeight;

    if (aspectRatio > containerAspectRatio) {
      // Scene is wider than container
      newWidth = containerWidth * 0.95;
      newHeight = newWidth / aspectRatio;
    } else {
      // Scene is taller than container
      newHeight = containerHeight * 0.95;
      newWidth = newHeight * aspectRatio;
    }

    previewScene.style.width = `${newWidth}px`;
    previewScene.style.height = `${newHeight}px`;
    previewScene.style.margin = "auto";
  }

  setBackground(previewScene, scene) {
    previewScene.style.backgroundImage = scene.background
      ? `url('${scene.background}')`
      : "none";
  }

  addOverlay(previewScene, scene) {
    if (!scene.overlay) return;

    const overlay = document.createElement("div");
    overlay.className = "preview-overlay";
    Object.assign(overlay.style, {
      backgroundColor: scene.overlay.color,
      opacity: scene.overlay.opacity,
      zIndex: scene.overlay.zIndex,
    });
    previewScene.appendChild(overlay);
  }

  async addImages(previewScene, scene) {
    if (!scene.images) return;

    for (let index = 0; index < scene.images.length; index++) {
      const imageData = scene.images[index];
      const objElement = await this.createImageElement(imageData, index);
      previewScene.appendChild(objElement);
    }
  }

  async createImageElement(imageData, index) {
    const objElement = document.createElement("div");
    objElement.className = "preview-object";
    objElement.dataset.imageIndex = index;

    this.applyObjectVisualProperties(objElement, imageData, index);

    if (imageData.locked) {
      objElement.classList.add("locked-object");
      this.addLockIndicator(objElement);
    } else {
      this.interactionManager.addImageInteractions(objElement, index);
    }

    const img = await this.loadImage(imageData.src);
    objElement.style.width = `${img.naturalWidth}px`;
    objElement.style.height = `${img.naturalHeight}px`;
    objElement.appendChild(img);

    // Store animation path data if this object has slide_to effect
    if (imageData.effect === "slide_to") {
      this.animationPaths.set(index, {
        startX:
          imageData.moveStartX !== undefined
            ? imageData.moveStartX
            : imageData.x,
        startY:
          imageData.moveStartY !== undefined
            ? imageData.moveStartY
            : imageData.y,
        endX:
          imageData.moveEndX !== undefined ? imageData.moveEndX : imageData.x,
        endY:
          imageData.moveEndY !== undefined ? imageData.moveEndY : imageData.y,
      });
    } else {
      this.animationPaths.delete(index);
    }

    return objElement;
  }

  loadImage(src) {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      Object.assign(img.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "auto",
        height: "auto",
        maxWidth: "none",
        maxHeight: "none",
        objectFit: "contain",
        pointerEvents: "none",
      });
      img.src = src;
      img.alt = "Scene Object";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
    });
  }

  addLockIndicator(objElement) {
    const lockIndicator = document.createElement("div");
    lockIndicator.className = "lock-indicator";
    lockIndicator.textContent = "🔒";
    Object.assign(lockIndicator.style, {
      position: "absolute",
      top: "5px",
      right: "5px",
      background: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "2px 4px",
      borderRadius: "3px",
      fontSize: "12px",
      pointerEvents: "none",
      zIndex: "10",
    });
    objElement.appendChild(lockIndicator);
  }

  addTextContent(previewScene, scene) {
    if (!scene.content) return;

    const textContent = document.createElement("div");
    textContent.className = "preview-text-content draggable-ui";
    textContent.dataset.uiType = "textContent";
    textContent.textContent = scene.content;

    const textPos = scene.uiPositions.textContent;
    this.positionElement(textContent, textPos);
    this.interactionManager.makeUIElementDraggable(textContent);
    previewScene.appendChild(textContent);
  }

  addButtons(previewScene, scene, project) {
    if (scene.type === "choice" && scene.choices?.length > 0) {
      this.addChoiceButtons(previewScene, scene, project);
    } else if (scene.type === "image" && scene.nextScene !== undefined) {
      this.addContinueButton(previewScene, scene, project);
    }
  }

  async addChoiceButtons(previewScene, scene, project) {
    // Get button colors from project defaults with fallbacks
    const buttonColors = project.defaults?.buttonColors?.choiceButton || {
      background: PreviewRenderer.DEFAULT_COLORS.DANGER,
      backgroundHover: "#c0392b",
      text: "white",
    };

    for (let index = 0; index < scene.choices.length; index++) {
      const choice = scene.choices[index];
      const choiceElement = await this.createChoiceElement(
        choice,
        index,
        buttonColors
      );
      previewScene.appendChild(choiceElement);
    }
  }

  async createChoiceElement(choice, index, buttonColors) {
    const choiceElement = document.createElement("div");
    choiceElement.className = "preview-choice-button draggable-ui";
    choiceElement.dataset.uiType = "choice";
    choiceElement.dataset.choiceIndex = index;

    const choicePos = choice.position;
    this.positionElement(choiceElement, choicePos);

    if (choice.displayMode === "graphic" && choice.graphic) {
      await this.setupGraphicChoice(choiceElement, choice, index);
    } else {
      this.setupTextChoice(choiceElement, choice, index, buttonColors);
    }

    this.interactionManager.makeUIElementDraggable(choiceElement);
    return choiceElement;
  }

  async setupGraphicChoice(choiceElement, choice, index) {
    choiceElement.classList.add("graphic-choice");
    const graphicProps = choice.graphicProperties;

    try {
      const img = await this.loadImage(choice.graphic);
      this.applyGraphicChoiceStyle(choiceElement, img, graphicProps);
      this.addGraphicChoiceEvents(choiceElement);
      choiceElement.appendChild(img);
    } catch (error) {
      this.setupMissingGraphicChoice(choiceElement, choice, index);
    }
  }

  applyGraphicChoiceStyle(choiceElement, img, graphicProps) {
    const flipTransform = graphicProps.flipped ? "scaleX(-1)" : "";
    const baseTransform = `translate(-50%, -50%) scale(${graphicProps.scale}) rotate(${graphicProps.rotation}deg)`;
    const finalTransform = flipTransform
      ? `${baseTransform} ${flipTransform}`
      : baseTransform;

    Object.assign(choiceElement.style, {
      ...PreviewRenderer.STYLES.GRAPHIC_CHOICE,
      transform: finalTransform,
      opacity: graphicProps.opacity !== undefined ? graphicProps.opacity : 1,
      zIndex: graphicProps.zIndex,
      width: `${img.naturalWidth}px`,
      height: `${img.naturalHeight}px`,
    });

    Object.assign(img.style, {
      border: "none",
      outline: "none",
      boxShadow: "none",
    });
  }

  addGraphicChoiceEvents(choiceElement) {
    choiceElement.addEventListener("mouseenter", () => {
      choiceElement.style.filter =
        "brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))";
    });

    choiceElement.addEventListener("mouseleave", () => {
      choiceElement.style.filter = "none";
    });

    choiceElement.addEventListener("mousedown", () => {
      choiceElement.style.filter = "brightness(0.8)";
    });

    choiceElement.addEventListener("mouseup", () => {
      choiceElement.style.filter =
        "brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))";
    });
  }

  setupTextChoice(choiceElement, choice, index, buttonColors) {
    choiceElement.classList.add("text-choice");
    choiceElement.textContent = choice.text;

    const styles = {
      ...PreviewRenderer.STYLES.TEXT_CHOICE,
      backgroundColor: buttonColors.background,
      color: buttonColors.text,
    };

    Object.assign(choiceElement.style, styles);

    const hoverColor = buttonColors.backgroundHover;
    const normalColor = buttonColors.background;

    // Add event listeners with current colors
    choiceElement.addEventListener("mouseenter", () => {
      choiceElement.style.backgroundColor = hoverColor;
    });

    choiceElement.addEventListener("mouseleave", () => {
      choiceElement.style.backgroundColor = normalColor;
    });

    choiceElement.addEventListener("mousedown", () => {
      choiceElement.style.backgroundColor =
        PreviewRenderer.DEFAULT_COLORS.ACTIVE;
    });

    choiceElement.addEventListener("mouseup", () => {
      choiceElement.style.backgroundColor = hoverColor;
    });

    return choiceElement;
  }

  setupMissingGraphicChoice(choiceElement, choice, index) {
    choiceElement.classList.add("missing-graphic-choice");
    choiceElement.textContent = "graphic missing";

    Object.assign(choiceElement.style, {
      backgroundColor: PreviewRenderer.DEFAULT_COLORS.MISSING,
      color: "white",
      border: "2px dashed #bdc3c7",
      padding: "20px",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
      textAlign: "center",
      width: "100px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background-color 0.2s",
    });

    choiceElement.addEventListener("mouseenter", () => {
      choiceElement.style.backgroundColor =
        PreviewRenderer.DEFAULT_COLORS.MISSING_HOVER;
    });

    choiceElement.addEventListener("mouseleave", () => {
      choiceElement.style.backgroundColor =
        PreviewRenderer.DEFAULT_COLORS.MISSING;
    });
  }

  addContinueButton(previewScene, scene, project) {
    // Get button colors from project defaults with fallbacks
    const buttonColors = project.defaults?.buttonColors?.continueButton || {
      background: PreviewRenderer.DEFAULT_COLORS.INFO,
      backgroundHover: PreviewRenderer.DEFAULT_COLORS.HOVER,
      text: "white",
    };

    const continueBtn = document.createElement("button");
    continueBtn.className = "preview-continue-button draggable-ui";
    continueBtn.dataset.uiType = "buttonsContainer";
    continueBtn.textContent = "Continue";

    Object.assign(continueBtn.style, {
      backgroundColor: buttonColors.background,
      color: buttonColors.text,
      border: "none",
      padding: "12px 24px",
      borderRadius: "6px",
      fontSize: "16px",
      cursor: "pointer",
      fontWeight: "bold",
      transition: "background-color 0.2s",
    });

    const hoverColor = buttonColors.backgroundHover;
    const normalColor = buttonColors.background;

    continueBtn.addEventListener("mouseenter", () => {
      continueBtn.style.backgroundColor = hoverColor;
    });

    continueBtn.addEventListener("mouseleave", () => {
      continueBtn.style.backgroundColor = normalColor;
    });

    const buttonPos = scene.uiPositions.buttonsContainer;
    this.positionElement(continueBtn, buttonPos);
    this.interactionManager.makeUIElementDraggable(continueBtn);
    previewScene.appendChild(continueBtn);
  }

  positionElement(element, position) {
    Object.assign(element.style, {
      position: "absolute",
      left: `${position.x}%`,
      top: `${position.y}%`,
      width: `${position.width}%`,
      transform: "translate(-50%, -50%)",
    });
  }

  addDropZone(previewScene, scene) {
    if (scene.images?.length > 0) return;

    const dropZone = document.createElement("div");
    dropZone.className = "drop-zone";
    dropZone.textContent = "Drop objects here or click to place";
    previewScene.appendChild(dropZone);
  }

  renderAnimationPaths(previewScene) {
    // Remove existing animation paths
    previewScene
      .querySelectorAll(".animation-path")
      .forEach((path) => path.remove());

    const selectedObject = this.interactionManager.getSelectedObject();
    if (selectedObject === null) return;

    const pathData = this.animationPaths.get(selectedObject);
    if (!pathData) return;

    this.createAnimationPath(previewScene, pathData);
  }

  createAnimationPath(previewScene, pathData) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.className = "animation-path";
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    const previewRect = previewScene.getBoundingClientRect();
    const startX = (pathData.startX / 100) * previewRect.width;
    const startY = (pathData.startY / 100) * previewRect.height;
    const endX = (pathData.endX / 100) * previewRect.width;
    const endY = (pathData.endY / 100) * previewRect.height;

    // Create the path line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", startX);
    line.setAttribute("y1", startY);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", endY);
    line.setAttribute("stroke", "#ff6b6b");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-dasharray", "8,4");

    // Add arrow at the end
    const arrowSize = 12;
    const angle = Math.atan2(endY - startY, endX - startX);

    const arrowX1 = endX - arrowSize * Math.cos(angle - Math.PI / 6);
    const arrowY1 = endY - arrowSize * Math.sin(angle - Math.PI / 6);
    const arrowX2 = endX - arrowSize * Math.cos(angle + Math.PI / 6);
    const arrowY2 = endY - arrowSize * Math.sin(angle + Math.PI / 6);

    const arrow1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    arrow1.setAttribute("x1", endX);
    arrow1.setAttribute("y1", endY);
    arrow1.setAttribute("x2", arrowX1);
    arrow1.setAttribute("y2", arrowY1);
    arrow1.setAttribute("stroke", "#ff6b6b");
    arrow1.setAttribute("stroke-width", "3");

    const arrow2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    arrow2.setAttribute("x1", endX);
    arrow2.setAttribute("y1", endY);
    arrow2.setAttribute("x2", arrowX2);
    arrow2.setAttribute("y2", arrowY2);
    arrow2.setAttribute("stroke", "#ff6b6b");
    arrow2.setAttribute("stroke-width", "3");

    // Create start and end markers
    const startMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    startMarker.setAttribute("cx", startX);
    startMarker.setAttribute("cy", startY);
    startMarker.setAttribute("r", "6");
    startMarker.setAttribute("fill", "#4CAF50");
    startMarker.setAttribute("stroke", "white");
    startMarker.setAttribute("stroke-width", "2");

    const endMarker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    endMarker.setAttribute("cx", endX);
    endMarker.setAttribute("cy", endY);
    endMarker.setAttribute("r", "6");
    endMarker.setAttribute("fill", "#ff6b6b");
    endMarker.setAttribute("stroke", "white");
    endMarker.setAttribute("stroke-width", "2");

    // Add labels
    const startLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    startLabel.setAttribute("x", startX);
    startLabel.setAttribute("y", startY - 12);
    startLabel.setAttribute("text-anchor", "middle");
    startLabel.setAttribute("fill", "#4CAF50");
    startLabel.setAttribute("font-size", "12");
    startLabel.setAttribute("font-weight", "bold");
    startLabel.textContent = "START";

    const endLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    endLabel.setAttribute("x", endX);
    endLabel.setAttribute("y", endY - 12);
    endLabel.setAttribute("text-anchor", "middle");
    endLabel.setAttribute("fill", "#ff6b6b");
    endLabel.setAttribute("font-size", "12");
    endLabel.setAttribute("font-weight", "bold");
    endLabel.textContent = "END";

    svg.appendChild(line);
    svg.appendChild(arrow1);
    svg.appendChild(arrow2);
    svg.appendChild(startMarker);
    svg.appendChild(endMarker);
    svg.appendChild(startLabel);
    svg.appendChild(endLabel);

    previewScene.appendChild(svg);
  }

  applyObjectVisualProperties(objElement, imageData, index) {
    const { x, y, scale } = this.calculateEffectAwareProperties(
      imageData,
      index
    );

    const flipTransform = imageData.flipped ? "scaleX(-1)" : "";
    const baseTransform = `translate(-50%, -50%) scale(${scale}) rotate(${
      imageData.rotation || 0
    }deg)`;
    const finalTransform = flipTransform
      ? `${baseTransform} ${flipTransform}`
      : baseTransform;

    Object.assign(objElement.style, {
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      transform: finalTransform,
      zIndex: imageData.zIndex || 1,
      opacity: imageData.opacity !== undefined ? imageData.opacity : 1,
    });
  }

  calculateEffectAwareProperties(imageData, index) {
    let x = imageData.x;
    let y = imageData.y;
    let scale = imageData.scale;

    const isSelectedObject =
      this.interactionManager.getSelectedObject() === index;
    const effectEditMode = isSelectedObject ? imageData.effectEditMode : null;

    if (imageData.effect === "slide_to") {
      if (isSelectedObject && effectEditMode === "end") {
        x = imageData.moveEndX !== undefined ? imageData.moveEndX : imageData.x;
        y = imageData.moveEndY !== undefined ? imageData.moveEndY : imageData.y;
      } else {
        x =
          imageData.moveStartX !== undefined
            ? imageData.moveStartX
            : imageData.x;
        y =
          imageData.moveStartY !== undefined
            ? imageData.moveStartY
            : imageData.y;
      }
    }

    if (imageData.effect === "scale_to") {
      if (isSelectedObject && effectEditMode === "end") {
        scale =
          imageData.scaleEnd !== undefined
            ? imageData.scaleEnd
            : imageData.scale;
      } else {
        scale =
          imageData.scaleStart !== undefined
            ? imageData.scaleStart
            : imageData.scale;
      }
    }

    return { x, y, scale };
  }

  updateObjectVisualForEffectMode(mode) {
    const selectedObject = this.interactionManager.getSelectedObject();
    if (selectedObject === null) return;

    const obj = this.interactionManager.getCurrentSceneObject();
    const objElement = document.querySelector(
      `[data-image-index="${selectedObject}"]`
    );

    if (objElement) {
      this.applyObjectVisualProperties(objElement, obj, selectedObject);
    }

    // Re-render animation paths
    const previewScene = document.getElementById("preview-scene");
    if (previewScene) {
      this.renderAnimationPaths(previewScene);
    }
  }

  updateObjectVisual() {
    const selectedObject = this.interactionManager.getSelectedObject();
    const obj = this.interactionManager.getCurrentSceneObject();
    const objElement = document.querySelector(
      `[data-image-index="${selectedObject}"]`
    );

    if (objElement) {
      this.applyObjectVisualProperties(objElement, obj, selectedObject);
    }

    // Re-render animation paths
    const previewScene = document.getElementById("preview-scene");
    if (previewScene) {
      this.renderAnimationPaths(previewScene);
    }
  }

  maintainSelection() {
    const selectedObject = this.interactionManager.getSelectedObject();
    if (selectedObject === null) return;

    const selectedElement = document.querySelector(
      `[data-image-index="${selectedObject}"]`
    );
    if (selectedElement) {
      selectedElement.classList.add("selected");
      this.interactionManager.showObjectControls();
    }
  }

  removeSelectionFromObjects() {
    document.querySelectorAll(".preview-object").forEach((obj) => {
      obj.classList.remove("selected");
    });

    // Remove animation paths when deselecting
    document
      .querySelectorAll(".animation-path")
      .forEach((path) => path.remove());
  }

  clearPreview() {
    const previewScene = document.getElementById("preview-scene");
    previewScene.innerHTML =
      '<div class="drop-zone">Select a scene to preview</div>';
    previewScene.style.backgroundImage = "none";

    // Reset scene dimensions
    previewScene.style.width = "";
    previewScene.style.height = "";
    previewScene.style.margin = "";

    const objectProperties = document.getElementById("object-properties");
    objectProperties.innerHTML = "";

    // Clear animation paths
    this.animationPaths.clear();
  }
}
