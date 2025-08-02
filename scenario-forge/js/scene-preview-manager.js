class ScenePreviewManager {
  constructor() {
    this.previewModal = null;
    this.previewContainer = null;
  }

  setupPreviewButton() {
    // Add preview button to the header controls
    const headerControls = document.querySelector(".header-controls");
    if (headerControls && !document.getElementById("preview-scene-btn")) {
      const previewBtn = document.createElement("button");
      previewBtn.id = "preview-scene-btn";
      previewBtn.className = "btn btn-primary";
      previewBtn.innerHTML = '<span class="btn-icon">👁️</span>Preview Scene';
      previewBtn.addEventListener("click", () => this.showScenePreview());

      // Insert before the export button
      const exportBtn = document.getElementById("export-story");
      if (exportBtn) {
        headerControls.insertBefore(previewBtn, exportBtn);
      } else {
        headerControls.appendChild(previewBtn);
      }
    }
  }

  showScenePreview() {
    if (!window.editor?.currentScene) {
      alert("Please select a scene to preview");
      return;
    }

    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[window.editor.currentScene];

    if (!scene) {
      alert("Scene not found");
      return;
    }

    this.createPreviewModal();
    this.renderSceneInModal(project, scene, window.editor.currentScene);
  }

  createPreviewModal() {
    // Remove existing modal if present
    this.closePreviewModal();

    this.previewModal = document.createElement("div");
    this.previewModal.className = "scene-preview-modal";
    this.previewModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 3000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "scene-preview-content";
    modalContent.style.cssText = `
      width: 90%;
      height: 90%;
      max-width: 960px;
      max-height: 720px;
      background: #1a1a1a;
      border-radius: 10px;
      border: 2px solid #34495e;
      position: relative;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    // Header with close button
    const header = document.createElement("div");
    header.style.cssText = `
      background: linear-gradient(135deg, #2c3e50, #3498db);
      padding: 12px 20px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #34495e;
    `;

    const title = document.createElement("h3");
    title.textContent = `Preview: Scene ${window.editor.currentScene}`;
    title.style.cssText = `
      margin: 0;
      color: white;
      font-size: 16px;
      font-weight: 500;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "#e74c3c";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "none";
    });

    closeBtn.addEventListener("click", () => this.closePreviewModal());

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Preview container
    this.previewContainer = document.createElement("div");
    this.previewContainer.className = "scene-preview-container";
    this.previewContainer.style.cssText = `
      flex: 1;
      position: relative;
      background: linear-gradient(135deg, #2c3e50, #3498db);
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    // Preview scene
    const previewScene = document.createElement("div");
    previewScene.id = "modal-preview-scene";
    previewScene.className = "modal-preview-scene";
    previewScene.style.cssText = `
      width: 95%;
      height: 95%;
      position: relative;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      border: 1px solid #34495e;
      overflow: hidden;
      backdrop-filter: blur(2px);
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    `;

    this.previewContainer.appendChild(previewScene);
    modalContent.appendChild(header);
    modalContent.appendChild(this.previewContainer);
    this.previewModal.appendChild(modalContent);

    // Close modal when clicking outside
    this.previewModal.addEventListener("click", (e) => {
      if (e.target === this.previewModal) {
        this.closePreviewModal();
      }
    });

    // Close modal on escape key
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        this.closePreviewModal();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    document.body.appendChild(this.previewModal);
  }

  async renderSceneInModal(project, scene, sceneId) {
    const previewScene = document.getElementById("modal-preview-scene");
    if (!previewScene) return;

    previewScene.innerHTML = "";

    // Set background
    if (scene.background) {
      previewScene.style.backgroundImage = `url('${scene.background}')`;
    } else {
      previewScene.style.backgroundImage = "none";
    }

    // Add overlay
    if (scene.overlay) {
      const overlay = document.createElement("div");
      overlay.className = "story-overlay";
      Object.assign(overlay.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: scene.overlay.color,
        opacity: scene.overlay.opacity,
        zIndex: scene.overlay.zIndex,
        pointerEvents: "none",
      });
      previewScene.appendChild(overlay);
    }

    // Add images
    if (scene.images) {
      for (let index = 0; index < scene.images.length; index++) {
        const imageData = scene.images[index];
        const objElement = await this.createModalImageElement(imageData, index);
        previewScene.appendChild(objElement);
      }
    }

    // Add text content
    if (scene.content) {
      const textContent = document.createElement("div");
      textContent.className = "story-text-content";
      textContent.textContent = scene.content;

      const textPos = scene.uiPositions.textContent;
      Object.assign(textContent.style, {
        position: "absolute",
        left: `${textPos.x}%`,
        top: `${textPos.y}%`,
        width: `${textPos.width}%`,
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        padding: "15px 20px",
        background: "rgba(0, 0, 0, 0.85)",
        borderRadius: "8px",
        maxWidth: "80%",
        fontSize: "18px",
        lineHeight: "1.6",
        zIndex: "100",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        color: "white",
        userSelect: "none",
      });

      previewScene.appendChild(textContent);
    }

    // Add buttons
    if (scene.type === "choice" && scene.choices?.length > 0) {
      await this.addModalChoiceButtons(previewScene, scene);
    } else if (scene.type === "image" && scene.nextScene !== undefined) {
      this.addModalContinueButton(previewScene, scene);
    }
  }

  async createModalImageElement(imageData, index) {
    const objElement = document.createElement("div");
    objElement.className = "story-object";

    const img = await this.loadModalImage(imageData.src);
    if (img) {
      objElement.style.width = `${img.naturalWidth}px`;
      objElement.style.height = `${img.naturalHeight}px`;
      objElement.appendChild(img);
    } else {
      objElement.className += " placeholder";
      objElement.style.width = "60px";
      objElement.style.height = "40px";
      objElement.textContent = "Missing Image";
      objElement.style.background = "#7f8c8d";
      objElement.style.border = "2px dashed #95a5a6";
      objElement.style.color = "white";
      objElement.style.display = "flex";
      objElement.style.alignItems = "center";
      objElement.style.justifyContent = "center";
      objElement.style.fontSize = "12px";
      objElement.style.fontWeight = "bold";
    }

    const flipTransform = imageData.flipped ? "scaleX(-1)" : "";
    const baseTransform = `translate(-50%, -50%) scale(${
      imageData.scale || 1
    }) rotate(${imageData.rotation || 0}deg)`;
    const finalTransform = flipTransform
      ? `${baseTransform} ${flipTransform}`
      : baseTransform;

    Object.assign(objElement.style, {
      position: "absolute",
      left: `${imageData.x}%`,
      top: `${imageData.y}%`,
      transform: finalTransform,
      zIndex: imageData.zIndex || 1,
      opacity: imageData.opacity !== undefined ? imageData.opacity : 1,
      willChange: "transform, opacity",
      backfaceVisibility: "hidden",
    });

    return objElement;
  }

  loadModalImage(src) {
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
      img.alt = "Story Asset";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  async addModalChoiceButtons(previewScene, scene) {
    for (let index = 0; index < scene.choices.length; index++) {
      const choice = scene.choices[index];
      const choiceElement = await this.createModalChoiceElement(choice, index);
      previewScene.appendChild(choiceElement);
    }
  }

  async createModalChoiceElement(choice, index) {
    const choiceElement = document.createElement("button");
    choiceElement.className = "story-choice-button";

    const choicePos = choice.position;
    Object.assign(choiceElement.style, {
      position: "absolute",
      left: `${choicePos.x}%`,
      top: `${choicePos.y}%`,
      width: `${choicePos.width}%`,
      transform: "translate(-50%, -50%)",
      zIndex: "200",
      minHeight: "44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none",
      transition: "all 0.3s ease",
      cursor: "pointer",
    });

    if (choice.displayMode === "graphic" && choice.graphic) {
      await this.setupModalGraphicChoice(choiceElement, choice);
    } else {
      this.setupModalTextChoice(choiceElement, choice);
    }

    // Add click handler for preview
    choiceElement.addEventListener("click", () => {
      this.handleModalChoiceClick(choice);
    });

    return choiceElement;
  }

  async setupModalGraphicChoice(choiceElement, choice) {
    choiceElement.classList.add("graphic-choice");
    const graphicProps = choice.graphicProperties;

    const img = await this.loadModalImage(choice.graphic);
    if (img) {
      const flipTransform = graphicProps.flipped ? "scaleX(-1)" : "";
      const baseTransform = `translate(-50%, -50%) scale(${graphicProps.scale}) rotate(${graphicProps.rotation}deg)`;
      const finalTransform = flipTransform
        ? `${baseTransform} ${flipTransform}`
        : baseTransform;

      Object.assign(choiceElement.style, {
        background: "none",
        border: "none",
        borderRadius: "0",
        padding: "0",
        boxShadow: "none",
        transform: finalTransform,
        opacity: graphicProps.opacity !== undefined ? graphicProps.opacity : 1,
        zIndex: graphicProps.zIndex,
        width: `${img.naturalWidth}px`,
        height: `${img.naturalHeight}px`,
        transition: "filter 0.2s",
      });

      Object.assign(img.style, {
        border: "none",
        outline: "none",
        boxShadow: "none",
      });

      choiceElement.appendChild(img);

      // Add hover effects
      choiceElement.addEventListener("mouseenter", () => {
        choiceElement.style.filter =
          "brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))";
      });

      choiceElement.addEventListener("mouseleave", () => {
        choiceElement.style.filter = "none";
      });
    } else {
      this.setupModalMissingGraphicChoice(choiceElement, choice);
    }
  }

  setupModalTextChoice(choiceElement, choice) {
    choiceElement.classList.add("text-choice");
    choiceElement.textContent = choice.text;

    Object.assign(choiceElement.style, {
      background: "linear-gradient(135deg, #3498db, #2980b9)",
      color: "white",
      border: "none",
      padding: "12px 20px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "bold",
      textAlign: "center",
      whiteSpace: "normal",
      wordWrap: "break-word",
      boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
    });

    choiceElement.addEventListener("mouseenter", () => {
      choiceElement.style.background =
        "linear-gradient(135deg, #2980b9, #1f618d)";
      choiceElement.style.transform = "translate(-50%, -50%) translateY(-2px)";
      choiceElement.style.boxShadow = "0 4px 12px rgba(52, 152, 219, 0.5)";
    });

    choiceElement.addEventListener("mouseleave", () => {
      choiceElement.style.background =
        "linear-gradient(135deg, #3498db, #2980b9)";
      choiceElement.style.transform = "translate(-50%, -50%)";
      choiceElement.style.boxShadow = "0 2px 8px rgba(52, 152, 219, 0.3)";
    });
  }

  setupModalMissingGraphicChoice(choiceElement, choice) {
    choiceElement.classList.add("missing-graphic");
    choiceElement.textContent = "graphic missing";

    Object.assign(choiceElement.style, {
      background: "#7f8c8d",
      border: "2px dashed #bdc3c7",
      color: "white",
      fontWeight: "bold",
      width: "100px",
      height: "40px",
      fontSize: "12px",
      borderRadius: "4px",
    });

    choiceElement.addEventListener("mouseenter", () => {
      choiceElement.style.background = "#95a5a6";
    });

    choiceElement.addEventListener("mouseleave", () => {
      choiceElement.style.background = "#7f8c8d";
    });
  }

  addModalContinueButton(previewScene, scene) {
    const continueBtn = document.createElement("button");
    continueBtn.className = "story-continue-button";
    continueBtn.textContent = "Continue";

    const buttonPos = scene.uiPositions.buttonsContainer;
    Object.assign(continueBtn.style, {
      position: "absolute",
      left: `${buttonPos.x}%`,
      top: `${buttonPos.y}%`,
      width: `${buttonPos.width}%`,
      transform: "translate(-50%, -50%)",
      padding: "12px 24px",
      background: "linear-gradient(135deg, #3498db, #2980b9)",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "16px",
      cursor: "pointer",
      zIndex: "200",
      boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
      userSelect: "none",
      transition: "all 0.3s ease",
    });

    continueBtn.addEventListener("mouseenter", () => {
      continueBtn.style.background =
        "linear-gradient(135deg, #2980b9, #1f618d)";
      continueBtn.style.transform = "translate(-50%, -50%) translateY(-2px)";
      continueBtn.style.boxShadow = "0 4px 12px rgba(52, 152, 219, 0.5)";
    });

    continueBtn.addEventListener("mouseleave", () => {
      continueBtn.style.background =
        "linear-gradient(135deg, #3498db, #2980b9)";
      continueBtn.style.transform = "translate(-50%, -50%)";
      continueBtn.style.boxShadow = "0 2px 8px rgba(52, 152, 219, 0.3)";
    });

    continueBtn.addEventListener("click", () => {
      this.handleModalContinueClick(scene);
    });

    previewScene.appendChild(continueBtn);
  }

  handleModalChoiceClick(choice) {
    if (
      choice.nextScene &&
      window.editor.projectManager.getProject().scenes[choice.nextScene]
    ) {
      // Navigate to the next scene in the editor and update preview
      window.editor.selectScene(choice.nextScene);
      setTimeout(() => {
        this.showScenePreview(); // Refresh the preview with the new scene
      }, 100);
    } else {
      alert("This choice leads to an invalid or missing scene.");
    }
  }

  handleModalContinueClick(scene) {
    if (
      scene.nextScene &&
      window.editor.projectManager.getProject().scenes[scene.nextScene]
    ) {
      // Navigate to the next scene in the editor and update preview
      window.editor.selectScene(scene.nextScene);
      setTimeout(() => {
        this.showScenePreview(); // Refresh the preview with the new scene
      }, 100);
    } else {
      alert("This scene leads to an invalid or missing scene.");
    }
  }

  closePreviewModal() {
    if (this.previewModal) {
      this.previewModal.remove();
      this.previewModal = null;
      this.previewContainer = null;
    }
  }
}
