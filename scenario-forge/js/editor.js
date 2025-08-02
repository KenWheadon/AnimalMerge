class StoryEditor {
  constructor() {
    this.currentScene = null;
    this.projectManager = new ProjectManager();
    this.assetManager = new AssetManager();
    this.sceneManager = new SceneManager();
    this.previewManager = new PreviewManager();
    this.uiManager = new UIManager();
    this.scenePreviewManager = new ScenePreviewManager();
    this.eventCleanupFunctions = [];

    // Initialize the controller classes
    this.projectHandler = new ProjectHandler(this);
    this.sceneController = new SceneController(this);
    this.objectController = new ObjectController(this);

    this.setupGlobalReferences();
    this.initializeEditor();
  }

  setupGlobalReferences() {
    window.editor = this;
    window.assetManager = this.assetManager;
    window.projectManager = this.projectManager;
    window.sceneManager = this.sceneManager;
    window.previewManager = this.previewManager;
    window.uiManager = this.uiManager;
    window.scenePreviewManager = this.scenePreviewManager;
  }

  initializeEditor() {
    this.setupEventListeners();
    this.projectHandler.loadFromLocalStorage();
    this.projectManager.startAutoSave();
    this.scenePreviewManager.setupPreviewButton();
  }

  setupEventListeners() {
    this.uiManager.setupEventListeners();
    this.assetManager.setupAssetDropZones();
    this.previewManager.setupPreviewEventListeners();
  }

  cleanup() {
    this.eventCleanupFunctions.forEach((cleanup) => cleanup());
    this.eventCleanupFunctions = [];
    this.projectManager.stopAutoSave();
    this.assetManager.cleanup();
    this.previewManager.cleanup();
    this.scenePreviewManager.cleanup();
  }

  // Project Handler delegation methods
  loadFromLocalStorage() {
    return this.projectHandler.loadFromLocalStorage();
  }

  createNewProject() {
    return this.projectHandler.createNewProject();
  }

  createNewScenario() {
    return this.projectHandler.createNewScenario();
  }

  loadProject() {
    return this.projectHandler.loadProject();
  }

  handleFileLoad(event) {
    return this.projectHandler.handleFileLoad(event);
  }

  saveProject() {
    return this.projectHandler.saveProject();
  }

  async exportInteractiveStory(filename) {
    return this.projectHandler.exportInteractiveStory(filename);
  }

  // Scene Controller delegation methods
  addScene() {
    return this.sceneController.addScene();
  }

  duplicateScene() {
    return this.sceneController.duplicateScene();
  }

  deleteScene() {
    return this.sceneController.deleteScene();
  }

  selectScene(sceneId) {
    return this.sceneController.selectScene(sceneId);
  }

  updateSceneProperties() {
    return this.sceneController.updateSceneProperties();
  }

  updateUIPositions() {
    return this.sceneController.updateUIPositions();
  }

  updateOverlay() {
    return this.sceneController.updateOverlay();
  }

  addChoice() {
    return this.sceneController.addChoice();
  }

  removeChoice(index) {
    return this.sceneController.removeChoice(index);
  }

  updateChoice(index, property, value) {
    return this.sceneController.updateChoice(index, property, value);
  }

  updateChoiceDisplayMode(index, displayMode) {
    return this.sceneController.updateChoiceDisplayMode(index, displayMode);
  }

  updateChoiceGraphic(index, graphicPath) {
    return this.sceneController.updateChoiceGraphic(index, graphicPath);
  }

  updateChoiceGraphicProperty(index, property, value) {
    return this.sceneController.updateChoiceGraphicProperty(
      index,
      property,
      value
    );
  }

  reorderScene(sceneId, newIndex) {
    return this.sceneController.reorderScene(sceneId, newIndex);
  }

  // Object Controller delegation methods
  addObjectToScene(objPath, x, y) {
    return this.objectController.addObjectToScene(objPath, x, y);
  }

  selectObjectFromList(index) {
    return this.objectController.selectObjectFromList(index);
  }

  toggleObjectLock(index) {
    return this.objectController.toggleObjectLock(index);
  }

  removeObjectFromList(index) {
    return this.objectController.removeObjectFromList(index);
  }

  updateObjectProperties() {
    return this.objectController.updateObjectProperties();
  }

  updateSceneObjectsList() {
    return this.objectController.updateSceneObjectsList();
  }

  updateSelectedObject() {
    return this.objectController.updateSelectedObject();
  }

  updateSelectedObjectFromDrawer() {
    return this.objectController.updateSelectedObjectFromDrawer();
  }

  removeSelectedObject() {
    return this.objectController.removeSelectedObject();
  }

  // Direct methods that don't need delegation
  showWarning(message) {
    this.uiManager.showWarning(message);
  }

  closeModal() {
    this.uiManager.closeModal();
  }

  refreshUIComponents() {
    return this.projectHandler.refreshUIComponents();
  }

  updateSceneDropdowns() {
    return this.projectHandler.updateSceneDropdowns();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new StoryEditor();
});
