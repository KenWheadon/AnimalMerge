class NodeEditor {
  constructor() {
    this.isOpen = false;
    this.canvas = null;
    this.ctx = null;
    this.selectedNode = null;
    this.draggingNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDraggingConnection = false;
    this.connectionStart = null;
    this.mousePos = { x: 0, y: 0 };
    this.viewOffset = { x: 0, y: 0 };
    this.zoom = 1;
    this.resizeHandler = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.panOffset = { x: 0, y: 0 };
    this.eventListeners = new Map();

    this.constants = {
      ZOOM_MIN: 0.1,
      ZOOM_MAX: 3,
      ZOOM_DELTA: 0.9,
      ZOOM_DELTA_REVERSE: 1.1,
    };

    // Initialize component managers
    this.nodeManager = new NodeManager();
    this.nodeConnection = new NodeConnection();
    this.nodeRenderer = new NodeRenderer();

    this.setupEventListeners();
  }

  setupEventListeners() {
    const setupButton = () => this.setupButtonListener();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupButton);
    } else {
      setupButton();
    }
  }

  setupButtonListener() {
    const openNodeEditorBtn = document.getElementById("open-node-editor");
    if (openNodeEditorBtn) {
      openNodeEditorBtn.addEventListener("click", () => this.open());
    }
  }

  open() {
    if (this.isOpen || !this.nodeManager.validateProjectState()) return;

    this.isOpen = true;
    this.createNodeEditorOverlay();
    this.nodeManager.loadScenesAsNodes();
    this.nodeConnection.updateConnections();
    this.nodeManager.calculateInitialLayout(this.canvas);
    this.render();
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    const overlay = document.getElementById("node-editor-overlay");
    if (overlay) {
      overlay.remove();
    }
    this.cleanup();
  }

  createNodeEditorOverlay() {
    const overlay = this.nodeRenderer.createElement("div", {
      id: "node-editor-overlay",
      className: "node-editor-overlay",
    });

    overlay.appendChild(this.createHeader());
    overlay.appendChild(this.createCanvas());
    overlay.appendChild(this.createInfoPanel());

    document.body.appendChild(overlay);

    this.resizeCanvas();
    this.setupCanvasEventListeners();
    this.setupHeaderEventListeners();

    this.resizeHandler = () => this.resizeCanvas();
    window.addEventListener("resize", this.resizeHandler);
  }

  createHeader() {
    const header = this.nodeRenderer.createElement("div", {
      className: "node-editor-header",
    });
    header.innerHTML = `
      <h2>Visual Node Editor</h2>
      <div class="node-editor-controls">
        <button id="node-editor-fit" class="btn btn-small">Fit to Screen</button>
        <button id="node-editor-reset" class="btn btn-small">Reset Layout</button>
        <button id="node-editor-close" class="btn btn-small btn-danger">Close</button>
      </div>
    `;
    return header;
  }

  createCanvas() {
    this.canvas = this.nodeRenderer.createElement("canvas", {
      id: "node-editor-canvas",
      className: "node-editor-canvas",
    });
    this.ctx = this.canvas.getContext("2d");
    this.nodeRenderer.setCanvas(this.canvas, this.ctx);
    return this.canvas;
  }

  createInfoPanel() {
    const infoPanel = this.nodeRenderer.createElement("div", {
      className: "node-editor-info",
    });
    infoPanel.innerHTML = `
      <div class="node-editor-legend">
        <h3>Controls</h3>
        <p>• Drag nodes to reposition</p>
        <p>• Drag empty space in pan view</p>
        <p>• Click and drag from node edge to create connection</p>
        <p>• Click type button to toggle scene type</p>
        <p>• Right-click node for options</p>
        <p>• Mouse wheel to zoom</p>
        <p><strong>Note:</strong> Changing scene type removes outgoing connections</p>
      </div>
    `;
    return infoPanel;
  }

  setupHeaderEventListeners() {
    this.addEventListenerWithCleanup("node-editor-close", "click", () =>
      this.close()
    );
    this.addEventListenerWithCleanup("node-editor-fit", "click", () =>
      this.fitToScreen()
    );
    this.addEventListenerWithCleanup("node-editor-reset", "click", () =>
      this.resetLayout()
    );
  }

  addEventListenerWithCleanup(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
      this.eventListeners.set(`${elementId}-${event}`, {
        element,
        event,
        handler,
      });
    }
  }

  setupCanvasEventListeners() {
    const events = [
      ["mousedown", (e) => this.handleMouseDown(e)],
      ["mousemove", (e) => this.handleMouseMove(e)],
      ["mouseup", (e) => this.handleMouseUp(e)],
      ["contextmenu", (e) => this.handleRightClick(e)],
      ["wheel", (e) => this.handleWheel(e)],
    ];

    events.forEach(([event, handler]) => {
      this.canvas.addEventListener(event, handler);
      this.eventListeners.set(`canvas-${event}`, {
        element: this.canvas,
        event,
        handler,
      });
    });
  }

  resizeCanvas() {
    if (!this.canvas) return;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 60;

    if (this.isOpen) {
      this.render();
    }
  }

  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.zoom - this.viewOffset.x,
      y: (e.clientY - rect.top) / this.zoom - this.viewOffset.y,
    };
  }

  handleMouseDown(e) {
    const { x: mouseX, y: mouseY } = this.getCanvasCoordinates(e);
    const clickedNode = this.nodeManager.getNodeAtPosition(mouseX, mouseY);

    if (clickedNode) {
      this.handleNodeClick(clickedNode, mouseX, mouseY);
    } else {
      this.handleCanvasClick(e, mouseX, mouseY);
    }

    this.render();
  }

  handleNodeClick(clickedNode, mouseX, mouseY) {
    const toggleArea = this.nodeRenderer.getToggleArea(clickedNode);

    if (this.nodeRenderer.isPositionInArea(mouseX, mouseY, toggleArea)) {
      this.nodeManager.toggleSceneType(clickedNode);
      return;
    }

    const isOnEdge = this.nodeManager.isOnNodeEdge(clickedNode, mouseX, mouseY);

    if (isOnEdge) {
      this.isDraggingConnection = true;
      this.connectionStart = clickedNode;
      this.mousePos = { x: mouseX, y: mouseY };
    } else {
      this.draggingNode = clickedNode;
      this.dragOffset = {
        x: mouseX - clickedNode.x,
        y: mouseY - clickedNode.y,
      };
      clickedNode.isDragging = true;
    }

    this.selectedNode = clickedNode;
    this.canvas.style.cursor = "grabbing";
  }

  handleCanvasClick(e, mouseX, mouseY) {
    this.isPanning = true;
    this.panStart = { x: e.clientX, y: e.clientY };
    this.panOffset = { x: this.viewOffset.x, y: this.viewOffset.y };
    this.selectedNode = null;
    this.canvas.style.cursor = "grabbing";
  }

  handleMouseMove(e) {
    const { x: mouseX, y: mouseY } = this.getCanvasCoordinates(e);
    this.mousePos = { x: mouseX, y: mouseY };

    if (this.draggingNode) {
      this.draggingNode.x = mouseX - this.dragOffset.x;
      this.draggingNode.y = mouseY - this.dragOffset.y;
      this.render();
    } else if (this.isDraggingConnection) {
      this.render();
    } else if (this.isPanning) {
      this.handlePanning(e);
    } else {
      this.updateCursor(mouseX, mouseY);
    }
  }

  handlePanning(e) {
    const deltaX = e.clientX - this.panStart.x;
    const deltaY = e.clientY - this.panStart.y;

    this.viewOffset.x = this.panOffset.x + deltaX / this.zoom;
    this.viewOffset.y = this.panOffset.y + deltaY / this.zoom;

    this.render();
  }

  updateCursor(mouseX, mouseY) {
    const nodeUnderMouse = this.nodeManager.getNodeAtPosition(mouseX, mouseY);

    if (nodeUnderMouse) {
      const toggleArea = this.nodeRenderer.getToggleArea(nodeUnderMouse);
      if (this.nodeRenderer.isPositionInArea(mouseX, mouseY, toggleArea)) {
        this.canvas.style.cursor = "pointer";
      } else {
        const isOnEdge = this.nodeManager.isOnNodeEdge(
          nodeUnderMouse,
          mouseX,
          mouseY
        );
        this.canvas.style.cursor = isOnEdge ? "crosshair" : "grab";
      }
    } else {
      this.canvas.style.cursor = "grab";
    }
  }

  handleMouseUp(e) {
    const { x: mouseX, y: mouseY } = this.getCanvasCoordinates(e);

    if (this.isDraggingConnection) {
      this.handleConnectionDrop(mouseX, mouseY);
    }

    this.resetDragStates();
    this.canvas.style.cursor = "grab";
    this.render();
  }

  handleConnectionDrop(mouseX, mouseY) {
    const targetNode = this.nodeManager.getNodeAtPosition(mouseX, mouseY);

    if (targetNode && targetNode !== this.connectionStart) {
      if (
        this.nodeConnection.validateConnection(this.connectionStart, targetNode)
      ) {
        this.nodeConnection.createConnection(this.connectionStart, targetNode);
      }
    }

    this.isDraggingConnection = false;
    this.connectionStart = null;
  }

  resetDragStates() {
    if (this.draggingNode) {
      this.draggingNode.isDragging = false;
      this.draggingNode = null;
    }

    this.isPanning = false;
  }

  handleRightClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const { x: mouseX, y: mouseY } = this.getCanvasCoordinates(e);
    const clickedNode = this.nodeManager.getNodeAtPosition(mouseX, mouseY);

    if (clickedNode) {
      this.showNodeContextMenu(e, clickedNode);
      return;
    }

    const connection = this.nodeConnection.getConnectionAtPosition(
      mouseX,
      mouseY
    );
    if (connection) {
      this.nodeConnection.deleteConnection(connection);
    }
  }

  showNodeContextMenu(e, node) {
    this.removeExistingContextMenu();

    const menu = this.createContextMenu(e);
    const editOption = this.createEditOption(node);

    menu.appendChild(editOption);

    const overlay = document.getElementById("node-editor-overlay");
    (overlay || document.body).appendChild(menu);

    this.setupContextMenuCloseHandler(menu);
  }

  removeExistingContextMenu() {
    const existingMenu = document.getElementById("node-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  createContextMenu(e) {
    const menu = this.nodeRenderer.createElement("div", {
      id: "node-context-menu",
      className: "context-menu",
    });

    menu.style.cssText = `
      position: absolute;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      background: #2c3e50;
      border: 1px solid #34495e;
      border-radius: 4px;
      padding: 4px 0;
      z-index: 3010;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      min-width: 140px;
      pointer-events: auto;
    `;

    return menu;
  }

  createEditOption(node) {
    const editOption = this.nodeRenderer.createElement("button");
    editOption.textContent = "Edit Scene";
    editOption.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #ecf0f1;
      font-size: 12px;
      text-align: left;
      pointer-events: auto;
    `;

    editOption.addEventListener("mouseenter", () => {
      editOption.style.background = "#3498db";
    });

    editOption.addEventListener("mouseleave", () => {
      editOption.style.background = "none";
    });

    editOption.addEventListener("click", (clickEvent) => {
      clickEvent.stopPropagation();
      this.nodeManager.editScene(node.id);
      editOption.closest("#node-context-menu").remove();
    });

    return editOption;
  }

  setupContextMenuCloseHandler(menu) {
    const closeMenu = (event) => {
      if (!menu.contains(event.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 200);
  }

  handleWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta =
      e.deltaY > 0
        ? this.constants.ZOOM_DELTA
        : this.constants.ZOOM_DELTA_REVERSE;
    const newZoom = Math.max(
      this.constants.ZOOM_MIN,
      Math.min(this.constants.ZOOM_MAX, this.zoom * delta)
    );

    this.viewOffset.x =
      mouseX / this.zoom - mouseX / newZoom + this.viewOffset.x;
    this.viewOffset.y =
      mouseY / this.zoom - mouseY / newZoom + this.viewOffset.y;

    this.zoom = newZoom;
    this.render();
  }

  fitToScreen() {
    if (this.nodeManager.getNodes().size === 0) return;

    const bounds = this.nodeManager.calculateNodeBounds();
    const contentWidth =
      bounds.width + this.nodeManager.constants.LAYOUT_PADDING * 2;
    const contentHeight =
      bounds.height + this.nodeManager.constants.LAYOUT_PADDING * 2;

    const scaleX = this.canvas.width / contentWidth;
    const scaleY = this.canvas.height / contentHeight;
    this.zoom = Math.min(scaleX, scaleY, 1);

    this.viewOffset.x =
      -(bounds.minX - this.nodeManager.constants.LAYOUT_PADDING) * this.zoom;
    this.viewOffset.y =
      -(bounds.minY - this.nodeManager.constants.LAYOUT_PADDING) * this.zoom;

    this.render();
  }

  resetLayout() {
    this.nodeManager.calculateInitialLayout(this.canvas);
    this.fitToScreen();
  }

  render() {
    this.nodeRenderer.render(
      this.zoom,
      this.viewOffset,
      this.selectedNode,
      this.isDraggingConnection,
      this.connectionStart,
      this.mousePos
    );
  }

  cleanup() {
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }

    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    if (this.canvas) {
      this.canvas.style.cursor = "grab";
    }

    this.nodeManager.cleanup();

    this.selectedNode = null;
    this.draggingNode = null;
    this.isDraggingConnection = false;
    this.connectionStart = null;
    this.isPanning = false;
    this.canvas = null;
    this.ctx = null;

    this.removeExistingContextMenu();
  }
}

window.nodeEditor = new NodeEditor();
