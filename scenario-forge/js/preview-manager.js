class PreviewManager {
  constructor() {
    // Initialize the component managers
    this.contextMenuManager = new PreviewContextMenuManager(null); // Will be set after interaction manager
    this.interactionManager = new PreviewInteractionManager(
      this.contextMenuManager
    );
    this.contextMenuManager.interactionManager = this.interactionManager; // Set the reference
    this.renderer = new PreviewRenderer(this.interactionManager);
  }

  setupPreviewEventListeners() {
    this.interactionManager.setupPreviewEventListeners();
  }

  cleanup() {
    this.interactionManager.cleanup();
    this.contextMenuManager.removeContextMenus();
  }

  // Delegation methods to maintain existing API

  async renderPreview(project, sceneId) {
    return this.renderer.renderPreview(project, sceneId);
  }

  clearPreview() {
    this.renderer.clearPreview();
    this.interactionManager.selectedObject = null;
    this.interactionManager.selectedUIElement = null;
    this.interactionManager.hideAllControls();
    this.contextMenuManager.removeContextMenus();
  }

  // Object selection methods
  selectObject(index) {
    return this.interactionManager.selectObject(index);
  }

  getSelectedObject() {
    return this.interactionManager.getSelectedObject();
  }

  getSelectedUIElement() {
    return this.interactionManager.getSelectedUIElement();
  }

  deselectObject() {
    return this.interactionManager.deselectObject();
  }

  // UI Element methods
  selectUIElement(element) {
    return this.interactionManager.selectUIElement(element);
  }

  // Visual update methods
  updateObjectVisual() {
    return this.renderer.updateObjectVisual();
  }

  updateObjectVisualForEffectMode(mode) {
    return this.renderer.updateObjectVisualForEffectMode(mode);
  }

  // Object control methods
  showObjectControls() {
    return this.interactionManager.showObjectControls();
  }

  hideObjectControls() {
    return this.interactionManager.hideObjectControls();
  }

  // UI Element control methods
  showUIElementSelection(element) {
    return this.interactionManager.showUIElementSelection(element);
  }

  hideUIElementSelection() {
    return this.interactionManager.hideUIElementSelection();
  }

  // Length slider methods
  showLengthSlider(element) {
    return this.interactionManager.showLengthSlider(element);
  }

  hideLengthSlider() {
    return this.interactionManager.hideLengthSlider();
  }

  // Position and interaction methods
  calculateRelativePosition(clientX, clientY) {
    return this.interactionManager.calculateRelativePosition(clientX, clientY);
  }

  updateUIElementPosition(element, position) {
    return this.interactionManager.updateUIElementPosition(element, position);
  }

  updateObjectPosition(position) {
    return this.interactionManager.updateObjectPosition(position);
  }

  // Drag and interaction state
  get isDragging() {
    return this.interactionManager.isDragging;
  }

  get isScaling() {
    return this.interactionManager.isScaling;
  }

  get isRotating() {
    return this.interactionManager.isRotating;
  }

  get isDraggingUI() {
    return this.interactionManager.isDraggingUI;
  }

  // Copy/paste methods
  copySelectedObject() {
    return this.interactionManager.copySelectedObject();
  }

  copySelectedObjectPosition() {
    return this.interactionManager.copySelectedObjectPosition();
  }

  pasteObject() {
    return this.interactionManager.pasteObject();
  }

  pasteObjectPosition() {
    return this.interactionManager.pasteObjectPosition();
  }

  copyUIElementPosition() {
    return this.interactionManager.copyUIElementPosition();
  }

  pasteUIElementPosition() {
    return this.interactionManager.pasteUIElementPosition();
  }

  // Context menu methods
  showBackgroundContextMenu(e) {
    return this.contextMenuManager.showBackgroundContextMenu(e);
  }

  showObjectContextMenu(e, objectIndex) {
    return this.contextMenuManager.showObjectContextMenu(e, objectIndex);
  }

  showUIElementContextMenu(e, element) {
    return this.contextMenuManager.showUIElementContextMenu(e, element);
  }

  removeContextMenus() {
    return this.contextMenuManager.removeContextMenus();
  }

  // Feedback methods
  showFeedback(message, color) {
    return this.interactionManager.showFeedback(message, color);
  }

  // Element width methods
  getElementWidth(element) {
    return this.interactionManager.getElementWidth(element);
  }

  updateElementWidth(element, width) {
    return this.interactionManager.updateElementWidth(element, width);
  }

  // UI element position methods
  getUIElementPosition(element) {
    return this.interactionManager.getUIElementPosition(element);
  }

  setUIElementPosition(element, position) {
    return this.interactionManager.setUIElementPosition(element, position);
  }

  // Drag handlers
  makeUIElementDraggable(element) {
    return this.interactionManager.makeUIElementDraggable(element);
  }

  addImageInteractions(objElement, index) {
    return this.interactionManager.addImageInteractions(objElement, index);
  }

  // Scaling and rotation methods
  startScaling(e) {
    return this.interactionManager.startScaling(e);
  }

  startRotating(e) {
    return this.interactionManager.startRotating(e);
  }

  startDrag(e, index) {
    return this.interactionManager.startDrag(e, index);
  }

  startUIElementDrag(e, element) {
    return this.interactionManager.startUIElementDrag(e, element);
  }

  // Helper methods for getting project data
  getProject() {
    return this.interactionManager.getProject();
  }

  getCurrentScene() {
    return this.interactionManager.getCurrentScene();
  }

  getCurrentSceneObject(index) {
    return this.interactionManager.getCurrentSceneObject(index);
  }

  // Selection state management
  deselectAll() {
    return this.interactionManager.deselectAll();
  }

  hideAllControls() {
    return this.interactionManager.hideAllControls();
  }

  // Event listener management
  addEventListener(element, event, handler) {
    return this.interactionManager.addEventListener(element, event, handler);
  }

  removeEventListener(element, event) {
    return this.interactionManager.removeEventListener(element, event);
  }

  // Timer management
  clearAllTimers() {
    return this.interactionManager.clearAllTimers();
  }

  // Visual rendering methods delegation
  setBackground(previewScene, scene) {
    return this.renderer.setBackground(previewScene, scene);
  }

  addOverlay(previewScene, scene) {
    return this.renderer.addOverlay(previewScene, scene);
  }

  addImages(previewScene, scene) {
    return this.renderer.addImages(previewScene, scene);
  }

  createImageElement(imageData, index) {
    return this.renderer.createImageElement(imageData, index);
  }

  loadImage(src) {
    return this.renderer.loadImage(src);
  }

  addLockIndicator(objElement) {
    return this.renderer.addLockIndicator(objElement);
  }

  addTextContent(previewScene, scene) {
    return this.renderer.addTextContent(previewScene, scene);
  }

  addButtons(previewScene, scene) {
    return this.renderer.addButtons(previewScene, scene);
  }

  addChoiceButtons(previewScene, scene) {
    return this.renderer.addChoiceButtons(previewScene, scene);
  }

  createChoiceElement(choice, index) {
    return this.renderer.createChoiceElement(choice, index);
  }

  setupGraphicChoice(choiceElement, choice, index) {
    return this.renderer.setupGraphicChoice(choiceElement, choice, index);
  }

  applyGraphicChoiceStyle(choiceElement, img, graphicProps) {
    return this.renderer.applyGraphicChoiceStyle(
      choiceElement,
      img,
      graphicProps
    );
  }

  addGraphicChoiceEvents(choiceElement) {
    return this.renderer.addGraphicChoiceEvents(choiceElement);
  }

  setupTextChoice(choiceElement, choice, index) {
    return this.renderer.setupTextChoice(choiceElement, choice, index);
  }

  setupMissingGraphicChoice(choiceElement, choice, index) {
    return this.renderer.setupMissingGraphicChoice(
      choiceElement,
      choice,
      index
    );
  }

  addContinueButton(previewScene, scene) {
    return this.renderer.addContinueButton(previewScene, scene);
  }

  positionElement(element, position) {
    return this.renderer.positionElement(element, position);
  }

  addDropZone(previewScene, scene) {
    return this.renderer.addDropZone(previewScene, scene);
  }

  applyObjectVisualProperties(objElement, imageData, index) {
    return this.renderer.applyObjectVisualProperties(
      objElement,
      imageData,
      index
    );
  }

  calculateEffectAwareProperties(imageData, index) {
    return this.renderer.calculateEffectAwareProperties(imageData, index);
  }

  maintainSelection() {
    return this.renderer.maintainSelection();
  }

  removeSelectionFromObjects() {
    return this.renderer.removeSelectionFromObjects();
  }
}
