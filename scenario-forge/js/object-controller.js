class ObjectController {
  constructor(editor) {
    this.editor = editor;
  }

  addObjectToScene(objPath, x, y) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    if (!scene.images) scene.images = [];

    const newObject = this.createNewSceneObject(
      objPath,
      x,
      y,
      scene.images.length
    );
    scene.images.push(newObject);
    this.updateSceneAndObjects();
  }

  createNewSceneObject(objPath, x, y, index) {
    const defaultTiming =
      this.editor.projectManager.getDefaultAnimationTiming();

    return {
      src: objPath,
      x: x,
      y: y,
      scale: 1.0,
      rotation: 0,
      zIndex: index + 1,
      opacity: 1.0,
      flipped: false,
      animationTiming: { ...defaultTiming },
    };
  }

  selectObjectFromList(index) {
    this.editor.previewManager.selectObject(index);
    this.updateSceneAndObjects();
  }

  toggleObjectLock(index) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    if (!scene.images || !scene.images[index]) return;

    const obj = scene.images[index];
    obj.locked = !obj.locked;

    if (
      obj.locked &&
      this.editor.previewManager.getSelectedObject() === index
    ) {
      this.editor.previewManager.deselectObject();
      this.updateObjectProperties();
    }

    this.updateSceneAndObjects();
  }

  removeObjectFromList(index) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    if (!scene.images || !scene.images[index]) return;

    scene.images.splice(index, 1);
    this.handleObjectSelectionAfterRemoval(index);
    this.updateSceneAndObjects();
  }

  handleObjectSelectionAfterRemoval(removedIndex) {
    const selectedObject = this.editor.previewManager.getSelectedObject();
    if (selectedObject === removedIndex) {
      this.editor.previewManager.deselectObject();
    } else if (selectedObject > removedIndex) {
      this.editor.previewManager.selectObject(selectedObject - 1);
    }
  }

  updateObjectProperties() {
    const project = this.editor.projectManager.getProject();
    const selectedObject = this.editor.previewManager.getSelectedObject();
    this.editor.uiManager.updateObjectProperties(
      project,
      this.editor.currentScene,
      selectedObject
    );

    if (
      selectedObject !== null &&
      this.editor.currentScene &&
      project.scenes[this.editor.currentScene]
    ) {
      const obj =
        project.scenes[this.editor.currentScene].images[selectedObject];
      if (obj && obj.effect) {
        this.editor.uiManager.handleEffectChange(obj.effect);
      } else {
        this.editor.uiManager.closeEffectDrawer();
      }
    }
  }

  updateSceneObjectsList() {
    const project = this.editor.projectManager.getProject();
    const selectedObject = this.editor.previewManager.getSelectedObject();
    this.editor.uiManager.updateSceneObjectsList(
      project,
      this.editor.currentScene,
      selectedObject
    );
  }

  updateSelectedObject() {
    const selectedObject = this.editor.previewManager.getSelectedObject();
    if (selectedObject === null || !this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const obj = scene.images[selectedObject];

    this.applyObjectPropertiesFromUI(obj);
    this.handleObjectEffectChange(obj);
    this.updateObjectVisualAndList(project, selectedObject);
  }

  applyObjectPropertiesFromUI(obj) {
    const properties = this.extractObjectPropertiesFromUI();
    Object.assign(obj, properties);
  }

  extractObjectPropertiesFromUI() {
    const properties = {
      x: parseFloat(document.getElementById("obj-x").value),
      y: parseFloat(document.getElementById("obj-y").value),
      scale: parseFloat(document.getElementById("obj-scale").value),
      rotation: parseFloat(document.getElementById("obj-rotation").value),
      zIndex: parseInt(document.getElementById("obj-zindex").value),
      opacity: parseFloat(document.getElementById("obj-opacity").value),
      effect: document.getElementById("obj-effect").value,
      flipped: document.getElementById("obj-flipped")?.checked || false,
    };

    // Handle animation timing properties
    const durationInput = document.getElementById("obj-animation-duration");
    const delayInput = document.getElementById("obj-animation-delay");
    const easingInput = document.getElementById("obj-animation-easing");

    if (durationInput && delayInput && easingInput) {
      properties.animationTiming = {
        duration: parseInt(durationInput.value),
        delay: parseInt(delayInput.value),
        easing: easingInput.value,
      };
    }

    return properties;
  }

  handleObjectEffectChange(obj) {
    const previousEffect = obj.effect;

    if (obj.effect && obj.effect !== previousEffect) {
      this.initializeEffectProperties(obj);
    }

    if (!obj.effect || obj.effect !== previousEffect) {
      this.clearEffectProperties(obj);
    }
  }

  updateObjectVisualAndList(project, selectedObject) {
    this.editor.previewManager.updateObjectVisual();
    this.editor.uiManager.updateSceneObjectsList(
      project,
      this.editor.currentScene,
      selectedObject
    );
  }

  initializeEffectProperties(obj) {
    const effectInitializers = {
      scale_to: () => {
        if (obj.scaleStart === undefined) obj.scaleStart = obj.scale;
        if (obj.scaleEnd === undefined) obj.scaleEnd = obj.scale;
      },
      slide_to: () => {
        if (obj.moveStartX === undefined) obj.moveStartX = obj.x;
        if (obj.moveStartY === undefined) obj.moveStartY = obj.y;
        if (obj.moveEndX === undefined) obj.moveEndX = obj.x;
        if (obj.moveEndY === undefined) obj.moveEndY = obj.y;
      },
    };

    const initializer = effectInitializers[obj.effect];
    if (initializer) initializer();
  }

  updateSelectedObjectFromDrawer() {
    const selectedObject = this.editor.previewManager.getSelectedObject();
    if (selectedObject === null || !this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    const obj = scene.images[selectedObject];

    this.applyDrawerPropertiesToObject(obj);
    this.updateObjectVisualAndList(project, selectedObject);
  }

  applyDrawerPropertiesToObject(obj) {
    const drawerUpdaters = {
      scale_to: () => {
        obj.scaleStart = parseFloat(
          document.getElementById("drawer-scale-start").value
        );
        obj.scaleEnd = parseFloat(
          document.getElementById("drawer-scale-end").value
        );
      },
      slide_to: () => {
        obj.moveStartX = parseFloat(
          document.getElementById("drawer-move-start-x").value
        );
        obj.moveStartY = parseFloat(
          document.getElementById("drawer-move-start-y").value
        );
        obj.moveEndX = parseFloat(
          document.getElementById("drawer-move-end-x").value
        );
        obj.moveEndY = parseFloat(
          document.getElementById("drawer-move-end-y").value
        );
      },
    };

    const updater = drawerUpdaters[obj.effect];
    if (updater) updater();
  }

  clearEffectProperties(obj) {
    const effectProperties = [
      "scaleStart",
      "scaleEnd",
      "moveStartX",
      "moveStartY",
      "moveEndX",
      "moveEndY",
    ];
    effectProperties.forEach((prop) => delete obj[prop]);
  }

  removeSelectedObject() {
    const selectedObject = this.editor.previewManager.getSelectedObject();
    if (selectedObject === null || !this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    scene.images.splice(selectedObject, 1);

    this.editor.previewManager.deselectObject();
    this.updateSceneAndObjects();
  }

  updateSceneAndObjects() {
    const project = this.editor.projectManager.getProject();
    this.editor.previewManager.renderPreview(project, this.editor.currentScene);
    this.updateObjectProperties();
    this.editor.uiManager.updateSceneObjectsList(
      project,
      this.editor.currentScene,
      this.editor.previewManager.getSelectedObject()
    );
  }

  resetObjectAnimationTiming(objectIndex) {
    if (!this.editor.currentScene) return;

    const project = this.editor.projectManager.getProject();
    const scene = project.scenes[this.editor.currentScene];
    if (!scene.images || !scene.images[objectIndex]) return;

    const obj = scene.images[objectIndex];
    const defaultTiming =
      this.editor.projectManager.getDefaultAnimationTiming();
    obj.animationTiming = { ...defaultTiming };

    this.updateSceneAndObjects();
  }
}
