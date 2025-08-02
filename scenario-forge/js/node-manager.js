class NodeManager {
  constructor() {
    this.nodes = new Map();
    this.imageCache = new Map();
    this.loadingImages = new Set();

    this.constants = {
      NODE_WIDTH: 200,
      NODE_HEIGHT: 180,
      LEVEL_SPACING: 300,
      NODE_SPACING: 250,
      LAYOUT_PADDING: 50,
      MAX_PREVIEW_OBJECTS: 5,
    };
  }

  validateProjectState() {
    if (!window.editor?.projectManager) {
      alert("No project loaded. Please create or load a project first.");
      return false;
    }

    const project = window.editor.projectManager.getProject();
    if (!project?.scenes || Object.keys(project.scenes).length === 0) {
      alert("No scenes found in the project. Please create some scenes first.");
      return false;
    }

    return true;
  }

  loadScenesAsNodes() {
    const project = window.editor.projectManager.getProject();
    if (!project?.scenes) return;

    this.nodes.clear();

    Object.keys(project.scenes).forEach((sceneId) => {
      const scene = project.scenes[sceneId];
      this.nodes.set(sceneId, this.createNodeFromScene(sceneId, scene));
    });

    this.loadAllImages();
  }

  createNodeFromScene(sceneId, scene) {
    return {
      id: sceneId,
      scene: scene,
      x: 0,
      y: 0,
      width: this.constants.NODE_WIDTH,
      height: this.constants.NODE_HEIGHT,
      isDragging: false,
      backgroundImage: null,
      objectImages: new Map(),
    };
  }

  async loadAllImages() {
    for (const [sceneId, node] of this.nodes) {
      const scene = node.scene;

      if (scene.background) {
        this.loadNodeBackgroundImage(node, scene.background);
      }

      if (scene.images?.length > 0) {
        this.loadNodeObjectImages(node, scene.images);
      }
    }
  }

  async loadNodeBackgroundImage(node, backgroundPath) {
    try {
      const img = new Image();
      img.onload = () => {
        node.backgroundImage = img;
        if (window.nodeEditor?.isOpen) window.nodeEditor.render();
      };
      img.onerror = () => {};
      img.src = backgroundPath;
    } catch (error) {}
  }

  async loadNodeObjectImages(node, objects) {
    const maxObjects = Math.min(
      objects.length,
      this.constants.MAX_PREVIEW_OBJECTS
    );

    for (let i = 0; i < maxObjects; i++) {
      const obj = objects[i];
      try {
        const img = await this.loadImageAsync(obj.src);
        node.objectImages.set(i, { image: img, data: obj });
        if (window.nodeEditor?.isOpen) window.nodeEditor.render();
      } catch (error) {}
    }
  }

  loadImageAsync(src) {
    return new Promise((resolve, reject) => {
      if (this.imageCache.has(src)) {
        resolve(this.imageCache.get(src));
        return;
      }

      if (this.loadingImages.has(src)) {
        const checkLoading = () => {
          if (this.imageCache.has(src)) {
            resolve(this.imageCache.get(src));
          } else if (!this.loadingImages.has(src)) {
            reject(new Error(`Failed to load: ${src}`));
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
        return;
      }

      this.loadingImages.add(src);

      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        this.loadingImages.delete(src);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingImages.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  calculateInitialLayout(canvas) {
    if (this.nodes.size === 0) return;

    const rootNode = this.findRootNode();
    const levels = this.calculateNodeLevels(rootNode);
    this.positionNodesByLevel(levels, canvas);
    this.positionOrphanNodes(levels, canvas);
  }

  findRootNode() {
    let rootNode = this.nodes.get("1");
    if (!rootNode) {
      const sortedKeys = Array.from(this.nodes.keys()).sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
      rootNode = this.nodes.get(sortedKeys[0]);
    }
    return rootNode || this.nodes.values().next().value;
  }

  calculateNodeLevels(rootNode) {
    const levels = new Map();
    const queue = [{ node: rootNode, level: 0 }];
    levels.set(rootNode.id, 0);

    while (queue.length > 0) {
      const { node, level } = queue.shift();
      const connections = window.nodeEditor.nodeConnection.connections.filter(
        (c) => c.from === node.id
      );

      connections.forEach((conn) => {
        const targetNode = this.nodes.get(conn.to);
        if (targetNode && !levels.has(targetNode.id)) {
          levels.set(targetNode.id, level + 1);
          queue.push({ node: targetNode, level: level + 1 });
        }
      });
    }

    return levels;
  }

  positionNodesByLevel(levels, canvas) {
    const nodesByLevel = new Map();
    levels.forEach((level, nodeId) => {
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level).push(this.nodes.get(nodeId));
    });

    const startX = canvas ? canvas.width / 2 : 400;
    const startY = 100;

    nodesByLevel.forEach((levelNodes, level) => {
      const totalWidth = (levelNodes.length - 1) * this.constants.NODE_SPACING;
      const startXForLevel = startX - totalWidth / 2;

      levelNodes.forEach((node, index) => {
        node.x = startXForLevel + index * this.constants.NODE_SPACING;
        node.y = startY + level * this.constants.LEVEL_SPACING;
      });
    });
  }

  positionOrphanNodes(levels, canvas) {
    let orphanX = (canvas ? canvas.width / 2 : 400) + 400;
    let orphanY = 100;

    this.nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        node.x = orphanX;
        node.y = orphanY;
        orphanY += this.constants.LEVEL_SPACING;
        if (orphanY > 100 + this.constants.LEVEL_SPACING * 5) {
          orphanX += this.constants.NODE_SPACING;
          orphanY = 100;
        }
      }
    });
  }

  toggleSceneType(node) {
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[node.id];

    const newType = scene.type === "choice" ? "image" : "choice";
    scene.type = newType;
    node.scene = scene;

    if (newType === "image") {
      delete scene.choices;
    } else {
      delete scene.nextScene;
      if (!scene.choices) {
        scene.choices = [];
      }
    }

    window.nodeEditor.nodeConnection.removeAllConnectionsForScene(node.id);
    this.cleanupSceneReferences(project, node.id);
    window.nodeEditor.nodeConnection.updateConnections();
    window.nodeEditor.render();
    this.updateEditorState(node.id);
  }

  updateEditorState(sceneId) {
    if (!window.editor) return;

    window.editor.updateSceneDropdowns();
    window.editor.sceneManager.refreshSceneList(
      window.editor.projectManager.getProject()
    );

    if (window.editor.currentScene === sceneId) {
      const project = window.editor.projectManager.getProject();
      window.editor.uiManager.updateScenePropertiesDisplay(project, sceneId);
      window.editor.previewManager.renderPreview(project, sceneId);
      window.editor.uiManager.refreshChoicesList(project, sceneId);
      window.editor.uiManager.updateChoicesVisibility();
    }
  }

  cleanupSceneReferences(project, sceneId) {
    const scene = project.scenes[sceneId];

    delete scene.nextScene;

    if (scene.choices) {
      scene.choices.forEach((choice) => {
        choice.nextScene = "";
      });
    }
  }

  getNodeAtPosition(x, y) {
    for (const node of this.nodes.values()) {
      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        return node;
      }
    }
    return null;
  }

  isOnNodeEdge(node, x, y) {
    const EDGE_THRESHOLD = 20;
    return (
      x < node.x + EDGE_THRESHOLD ||
      x > node.x + node.width - EDGE_THRESHOLD ||
      y < node.y + EDGE_THRESHOLD ||
      y > node.y + node.height - EDGE_THRESHOLD
    );
  }

  calculateNodeBounds() {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    this.nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  editScene(sceneId) {
    window.nodeEditor.close();
    if (window.editor) {
      window.editor.selectScene(sceneId);
    }
  }

  cleanup() {
    this.imageCache.clear();
    this.loadingImages.clear();
    this.nodes.clear();
  }

  getNodes() {
    return this.nodes;
  }

  getNode(id) {
    return this.nodes.get(id);
  }
}
