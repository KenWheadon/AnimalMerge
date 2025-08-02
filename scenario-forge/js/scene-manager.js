class SceneManager {
  static CHOICE_VERTICAL_SPACING = 7;
  static DEFAULT_UI_POSITIONS = {
    textContent: { x: 50, y: 85, width: 80 },
    buttonsContainer: { x: 80, y: 85, width: 40 },
    choiceButton: { x: 80, y: 85, width: 40 },
  };

  constructor() {
    this.currentScene = null;
    this.draggedScene = null;
    this.insertionIndicator = null;
    this.CHOICE_VERTICAL_SPACING = SceneManager.CHOICE_VERTICAL_SPACING;
  }

  getDefaultUIPositions() {
    return (
      window.projectManager?.getDefaultUIPositions() ||
      SceneManager.DEFAULT_UI_POSITIONS
    );
  }

  initializeUIPositions(scene) {
    const defaults = this.getDefaultUIPositions();
    scene.uiPositions = {
      textContent: { ...defaults.textContent },
      buttonsContainer: { ...defaults.buttonsContainer },
    };
  }

  ensureUIPositions(scene) {
    if (!scene.uiPositions) {
      this.initializeUIPositions(scene);
    }
    if (!scene.uiPositions.textContent.width) {
      scene.uiPositions.textContent.width = 80;
    }
    if (!scene.uiPositions.buttonsContainer.width) {
      scene.uiPositions.buttonsContainer.width = 40;
    }
  }

  addScene(project) {
    const sceneId = Utils.getNextSceneId(project.scenes);
    const newScene = {
      id: `scene_${sceneId}`,
      name: "New Scene",
      type: "choice",
      content: "New scene content",
      choices: [],
    };

    this.initializeUIPositions(newScene);
    project.scenes[sceneId] = newScene;
    project.totalScenes = Object.keys(project.scenes).length;
    return sceneId;
  }

  duplicateScene(project, sceneId) {
    const newSceneId = Utils.getNextSceneId(project.scenes);
    const duplicatedScene = JSON.parse(JSON.stringify(project.scenes[sceneId]));

    duplicatedScene.id = `scene_${newSceneId}`;
    duplicatedScene.name = duplicatedScene.name || "New Scene";

    this.ensureUIPositions(duplicatedScene);

    project.scenes[newSceneId] = duplicatedScene;
    project.totalScenes = Object.keys(project.scenes).length;
    return newSceneId;
  }

  deleteScene(project, sceneId) {
    delete project.scenes[sceneId];
    project.totalScenes = Object.keys(project.scenes).length;
    Utils.cleanupDeletedSceneReferences(project.scenes, sceneId);
  }

  selectScene(sceneId) {
    this.currentScene = sceneId;
  }

  getCurrentScene() {
    return this.currentScene;
  }

  createSceneItem(sceneId, scene, index) {
    const sceneItem = document.createElement("div");
    sceneItem.className = "scene-item";
    sceneItem.dataset.sceneId = sceneId;
    sceneItem.dataset.sceneIndex = index;
    sceneItem.draggable = true;

    if (scene.type === "choice") {
      sceneItem.classList.add("scene-type-choice");
    } else if (scene.type === "image") {
      sceneItem.classList.add("scene-type-image");
    }

    const displayName = scene.name || "Untitled Scene";
    sceneItem.innerHTML = `<div class="scene-item-id">${sceneId}: ${displayName}</div>`;

    // Add click handler for scene selection
    sceneItem.addEventListener("click", (e) => {
      if (!this.draggedScene && window.editor) {
        window.editor.selectScene(sceneId);
      }
    });

    // Add drag handlers - but NOT drop handlers (container will handle drops)
    this.addDragHandlers(sceneItem, sceneId, index);

    return sceneItem;
  }

  addDragHandlers(sceneItem, sceneId, index) {
    const handlers = {
      dragstart: (e) => this.handleSceneDragStart(e, sceneId, index),
      dragend: (e) => this.handleSceneDragEnd(e),
      dragover: (e) => this.handleSceneDragOver(e, sceneId, index),
      dragenter: (e) => this.handleSceneDragEnter(e),
      dragleave: (e) => this.handleSceneDragLeave(e),
      // NOTE: Removed 'drop' handler from individual items to avoid conflicts
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      sceneItem.addEventListener(event, handler);
    });
  }

  refreshSceneList(project) {
    const horizontalSceneList = document.getElementById(
      "scene-list-horizontal"
    );
    if (horizontalSceneList) {
      this.refreshHorizontalSceneList(horizontalSceneList, project);
    }
  }

  refreshHorizontalSceneList(horizontalSceneList, project) {
    horizontalSceneList.innerHTML = "";

    const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);
    orderedSceneKeys.forEach((sceneId, index) => {
      const scene = project.scenes[sceneId];
      const sceneItem = this.createSceneItem(sceneId, scene, index);
      horizontalSceneList.appendChild(sceneItem);
    });

    // Create insertion indicator after adding all scene items
    this.createInsertionIndicator(horizontalSceneList);

    // Add container-level drag handlers for proper drop zone handling
    this.setupContainerDragHandlers(horizontalSceneList);
  }

  setupContainerDragHandlers(container) {
    // Remove any existing handlers first
    if (this.containerDragOverHandler) {
      container.removeEventListener("dragover", this.containerDragOverHandler);
    }
    if (this.containerDropHandler) {
      container.removeEventListener("drop", this.containerDropHandler);
    }
    if (this.containerDragEnterHandler) {
      container.removeEventListener(
        "dragenter",
        this.containerDragEnterHandler
      );
    }
    if (this.containerDragLeaveHandler) {
      container.removeEventListener(
        "dragleave",
        this.containerDragLeaveHandler
      );
    }

    // Create bound handler functions to maintain 'this' context
    this.containerDragOverHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";

      if (!this.draggedScene) return;

      // Handle drops between scenes or at the edges
      this.handleContainerDragOver(e, container);
    };

    this.containerDropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!this.draggedScene) return;

      console.log("Container drop handler called", {
        draggedScene: this.draggedScene,
      });

      // Handle drop at container level
      this.handleContainerDrop(e, container);
    };

    this.containerDragEnterHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    this.containerDragLeaveHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Only hide indicator if leaving the container entirely
      if (!container.contains(e.relatedTarget)) {
        this.hideInsertionIndicator();
      }
    };

    // Add the handlers
    container.addEventListener("dragover", this.containerDragOverHandler);
    container.addEventListener("drop", this.containerDropHandler);
    container.addEventListener("dragenter", this.containerDragEnterHandler);
    container.addEventListener("dragleave", this.containerDragLeaveHandler);
  }

  handleContainerDragOver(e, container) {
    const sceneItems = Array.from(container.querySelectorAll(".scene-item"));
    if (sceneItems.length === 0) return;

    const mouseX = e.clientX;
    let targetIndex = sceneItems.length; // Default to end
    let insertPosition = "after";
    let targetElement = null;

    // Find the closest scene item
    for (let i = 0; i < sceneItems.length; i++) {
      const item = sceneItems[i];
      const rect = item.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      if (mouseX < midpoint) {
        targetIndex = i;
        insertPosition = "before";
        targetElement = item;
        break;
      } else if (mouseX < rect.right) {
        targetIndex = i;
        insertPosition = "after";
        targetElement = item;
        break;
      }
    }

    // If we're at the end, use the last item
    if (!targetElement && sceneItems.length > 0) {
      targetElement = sceneItems[sceneItems.length - 1];
      insertPosition = "after";
    }

    if (targetElement) {
      this.showInsertionIndicator(targetElement, insertPosition);
    }
  }

  handleContainerDrop(e, container) {
    if (!this.draggedScene) {
      console.log("No dragged scene found");
      return;
    }

    const sceneItems = Array.from(container.querySelectorAll(".scene-item"));
    const mouseX = e.clientX;
    let targetIndex = sceneItems.length; // Default to end

    // Find the target position
    for (let i = 0; i < sceneItems.length; i++) {
      const item = sceneItems[i];
      const rect = item.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      if (mouseX < midpoint) {
        targetIndex = i;
        break;
      }
    }

    // Adjust for dragging from before the target
    if (this.draggedScene.index < targetIndex) {
      targetIndex--;
    }

    console.log("Calculated reorder:", {
      draggedSceneId: this.draggedScene.id,
      fromIndex: this.draggedScene.index,
      toIndex: targetIndex,
    });

    // Call the editor's reorderScene method
    if (window.editor && window.editor.sceneController) {
      const result = window.editor.sceneController.reorderScene(
        this.draggedScene.id,
        targetIndex
      );
      console.log("Reorder result:", result);

      if (result) {
        console.log("Scene reordered successfully");
      } else {
        console.log("Scene reorder failed");
      }
    } else {
      console.error("Editor or scene controller not found");
    }

    this.hideInsertionIndicator();
  }

  createInsertionIndicator(container) {
    if (!container) return;

    // Remove existing insertion indicator if it exists
    if (this.insertionIndicator) {
      this.insertionIndicator.remove();
      this.insertionIndicator = null;
    }

    this.insertionIndicator = document.createElement("div");
    this.insertionIndicator.className = "scene-insertion-indicator horizontal";
    this.insertionIndicator.style.cssText = `
      position: absolute;
      background: #27ae60;
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 999;
      pointer-events: none;
    `;
    container.appendChild(this.insertionIndicator);
  }

  handleSceneDragStart(e, sceneId, index) {
    this.draggedScene = { id: sceneId, index: index };
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sceneId);
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);

    console.log("Drag started:", { sceneId, index });
  }

  handleSceneDragEnd(e) {
    console.log("Drag ended");
    e.currentTarget.classList.remove("dragging");
    this.draggedScene = null;
    this.hideInsertionIndicator();
    document.querySelectorAll(".scene-item").forEach((item) => {
      item.classList.remove("drag-over");
    });
  }

  handleSceneDragOver(e, sceneId, index) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    if (!this.draggedScene || this.draggedScene.id === sceneId) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const dropPosition = e.clientX < midpoint ? "before" : "after";

    this.showInsertionIndicator(e.currentTarget, dropPosition);
  }

  handleSceneDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.draggedScene) {
      e.currentTarget.classList.add("drag-over");
    }
  }

  handleSceneDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  showInsertionIndicator(targetElement, position) {
    if (!this.insertionIndicator) return;

    const rect = targetElement.getBoundingClientRect();
    const containerRect = targetElement.parentElement.getBoundingClientRect();

    let left;
    if (position === "before") {
      left = rect.left - containerRect.left - 2;
    } else {
      left = rect.right - containerRect.left + 2;
    }

    this.insertionIndicator.style.left = `${left}px`;
    this.insertionIndicator.style.top = "0px";
    this.insertionIndicator.style.height = "100%";
    this.insertionIndicator.style.width = "3px";
    this.insertionIndicator.style.opacity = "1";
    this.insertionIndicator.classList.add("visible");
  }

  hideInsertionIndicator() {
    if (this.insertionIndicator) {
      this.insertionIndicator.style.opacity = "0";
      this.insertionIndicator.classList.remove("visible");
    }
  }

  updateActiveSceneInList() {
    document.querySelectorAll(".scene-item").forEach((item) => {
      item.classList.remove("active");
    });

    const activeItems = document.querySelectorAll(
      `[data-scene-id="${this.currentScene}"]`
    );
    activeItems.forEach((item) => item.classList.add("active"));
  }

  reorderScene(project, sceneId, newIndex) {
    const orderedSceneKeys = Utils.getOrderedSceneKeys(project.scenes);
    const currentIndex = orderedSceneKeys.indexOf(sceneId);

    console.log("SceneManager.reorderScene called:", {
      sceneId,
      currentIndex,
      newIndex,
      orderedSceneKeys,
    });

    if (currentIndex === -1 || currentIndex === newIndex) {
      console.log("No reorder needed - same position or scene not found");
      return null;
    }

    const newOrderedScenes = [...orderedSceneKeys];
    newOrderedScenes.splice(currentIndex, 1);
    newOrderedScenes.splice(newIndex, 0, sceneId);

    console.log("New order:", newOrderedScenes);

    const idMapping = {};
    newOrderedScenes.forEach((oldId, index) => {
      idMapping[oldId] = (index + 1).toString();
    });

    console.log("ID mapping:", idMapping);

    this.renumberScenes(project, idMapping);

    if (this.currentScene) {
      this.currentScene = idMapping[this.currentScene];
    }

    return idMapping;
  }

  renumberScenes(project, idMapping) {
    const newScenes = {};
    const oldScenes = { ...project.scenes };

    Object.keys(oldScenes).forEach((oldId) => {
      const newId = idMapping[oldId];
      const scene = { ...oldScenes[oldId] };
      scene.id = `scene_${newId}`;

      this.ensureUIPositions(scene);
      newScenes[newId] = scene;
    });

    Object.keys(newScenes).forEach((sceneId) => {
      const scene = newScenes[sceneId];

      if (scene.nextScene && idMapping[scene.nextScene]) {
        scene.nextScene = idMapping[scene.nextScene];
      }

      scene.choices?.forEach((choice) => {
        if (choice.nextScene && idMapping[choice.nextScene]) {
          choice.nextScene = idMapping[choice.nextScene];
        }
      });
    });

    project.scenes = newScenes;
    console.log("Scenes renumbered:", project.scenes);
  }

  updateSceneProperties(project, sceneId, properties) {
    const scene = project.scenes[sceneId];
    Object.assign(scene, properties);
    this.ensureUIPositions(scene);
  }

  updateUIElementPosition(project, sceneId, elementType, x, y, width) {
    const scene = project.scenes[sceneId];

    if (!scene.uiPositions) {
      this.initializeUIPositions(scene);
    }

    if (width !== undefined) {
      scene.uiPositions[elementType] = { x, y, width };
    } else {
      scene.uiPositions[elementType].x = x;
      scene.uiPositions[elementType].y = y;
    }
  }

  updateChoicePosition(project, sceneId, choiceIndex, x, y, width) {
    const scene = project.scenes[sceneId];
    const choice = scene.choices[choiceIndex];
    const defaultChoicePosition = this.getDefaultUIPositions().choiceButton;

    if (!choice.position) {
      choice.position = { ...defaultChoicePosition };
    }

    if (x !== undefined) choice.position.x = x;
    if (y !== undefined) choice.position.y = y;
    if (width !== undefined) choice.position.width = width;
  }

  addChoice(project, sceneId, choice = { text: "New choice", nextScene: "" }) {
    const scene = project.scenes[sceneId];
    if (!scene.choices) scene.choices = [];

    if (!choice.position) {
      const defaultChoicePosition = this.getDefaultUIPositions().choiceButton;
      const choiceCount = scene.choices.length;
      choice.position = {
        x: defaultChoicePosition.x,
        y: defaultChoicePosition.y + choiceCount * this.CHOICE_VERTICAL_SPACING,
        width: defaultChoicePosition.width,
      };
    }

    if (!choice.displayMode) {
      choice.displayMode = "text";
    }
    if (!choice.graphic) {
      choice.graphic = "";
    }
    if (!choice.graphicProperties) {
      choice.graphicProperties = {
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        zIndex: 50,
        effect: "",
      };
    }

    scene.choices.push(choice);
  }

  removeChoice(project, sceneId, index) {
    const scene = project.scenes[sceneId];
    scene.choices?.splice(index, 1);
  }

  updateChoice(project, sceneId, index, property, value) {
    const scene = project.scenes[sceneId];
    if (scene.choices?.[index]) {
      scene.choices[index][property] = value;
    }
  }

  updateChoiceGraphicProperty(project, sceneId, choiceIndex, property, value) {
    const scene = project.scenes[sceneId];
    const choice = scene.choices[choiceIndex];

    if (!choice.graphicProperties) {
      choice.graphicProperties = {
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        zIndex: 50,
        effect: "",
      };
    }

    choice.graphicProperties[property] = value;
  }

  initializeChoiceGraphicProperties(choice) {
    if (!choice.graphicProperties) {
      choice.graphicProperties = {
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        zIndex: 50,
        effect: "",
      };
    }

    if (choice.graphicProperties.effect === "scale_to") {
      if (choice.graphicProperties.scaleStart === undefined) {
        choice.graphicProperties.scaleStart = choice.graphicProperties.scale;
      }
      if (choice.graphicProperties.scaleEnd === undefined) {
        choice.graphicProperties.scaleEnd = choice.graphicProperties.scale;
      }
    } else if (choice.graphicProperties.effect === "slide_to") {
      if (choice.graphicProperties.moveStartX === undefined) {
        choice.graphicProperties.moveStartX = choice.position.x;
      }
      if (choice.graphicProperties.moveStartY === undefined) {
        choice.graphicProperties.moveStartY = choice.position.y;
      }
      if (choice.graphicProperties.moveEndX === undefined) {
        choice.graphicProperties.moveEndX = choice.position.x;
      }
      if (choice.graphicProperties.moveEndY === undefined) {
        choice.graphicProperties.moveEndY = choice.position.y;
      }
    }
  }

  clearChoiceGraphicEffectProperties(choice) {
    if (choice.graphicProperties) {
      delete choice.graphicProperties.scaleStart;
      delete choice.graphicProperties.scaleEnd;
      delete choice.graphicProperties.moveStartX;
      delete choice.graphicProperties.moveStartY;
      delete choice.graphicProperties.moveEndX;
      delete choice.graphicProperties.moveEndY;
    }
  }
}
