class NodeRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;

    this.constants = {
      BUTTON_WIDTH: 80,
      BUTTON_HEIGHT: 25,
      CONNECTION_RADIUS: 8,
      ARROW_HEAD_LENGTH: 15,
      MAX_LABEL_LENGTH: 20,
      PREVIEW_OBJECTS_PER_AREA: 3,
      PREVIEW_OBJECT_MAX_SIZE: 30,
      PREVIEW_OBJECT_MIN_SIZE: 15,
    };

    this.colors = {
      choice: { background: "#2980b9", border: "#3498db", active: "#1abc9c" },
      image: { background: "#5a9c12", border: "#e67e22", active: "#e74c3c" },
      connection: "#34495e",
      selected: "#e74c3c",
      text: "#ffffff",
      background: "#1a1a1a",
      connectionChoice: "#e74c3c",
      connectionNext: "#3498db",
      connectionPreview: "#95a5a6",
      connectionPoint: "#27ae60",
      toggle: "#34495e",
      toggleBorder: "#2c3e50",
      toggleText: "#ecf0f1",
      labelBackground: "rgba(0, 0, 0, 0.7)",
      objectColors: ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"],
    };
  }

  setCanvas(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  render(
    zoom,
    viewOffset,
    selectedNode,
    isDraggingConnection,
    connectionStart,
    mousePos
  ) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(viewOffset.x, viewOffset.y);

    this.renderConnections();

    if (isDraggingConnection && connectionStart) {
      this.renderConnectionPreview(connectionStart, mousePos);
    }

    this.renderNodes(selectedNode);

    this.ctx.restore();
  }

  renderConnections() {
    const connections = window.nodeEditor.nodeConnection.getConnections();
    connections.forEach((connection) => {
      this.renderConnection(connection);
    });
  }

  renderConnection(connection) {
    const nodes = window.nodeEditor.nodeManager.getNodes();
    const fromNode = nodes.get(connection.from);
    const toNode = nodes.get(connection.to);

    if (!fromNode || !toNode) return;

    const fromX = fromNode.x + fromNode.width / 2;
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x + toNode.width / 2;
    const toY = toNode.y + toNode.height / 2;

    this.ctx.strokeStyle =
      connection.type === "choice"
        ? this.colors.connectionChoice
        : this.colors.connectionNext;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    this.drawArrow(fromX, fromY, toX, toY);

    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    this.renderConnectionLabel(connection.label, midX, midY, connection);
  }

  drawArrow(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const factor =
      (distance - window.nodeEditor.nodeManager.constants.NODE_WIDTH / 2) /
      distance;

    const arrowX = fromX + dx * factor;
    const arrowY = fromY + dy * factor;

    this.ctx.beginPath();
    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.lineTo(
      arrowX - this.constants.ARROW_HEAD_LENGTH * Math.cos(angle - Math.PI / 6),
      arrowY - this.constants.ARROW_HEAD_LENGTH * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.lineTo(
      arrowX - this.constants.ARROW_HEAD_LENGTH * Math.cos(angle + Math.PI / 6),
      arrowY - this.constants.ARROW_HEAD_LENGTH * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  renderConnectionLabel(text, x, y, connection) {
    if (!text) return;

    if (connection?.type === "choice" && connection.choiceIndex !== undefined) {
      const nodes = window.nodeEditor.nodeManager.getNodes();
      const fromNode = nodes.get(connection.from);
      const scene = fromNode.scene;
      const choice = scene.choices[connection.choiceIndex];

      if (choice?.displayMode === "graphic" && choice.graphic) {
        this.renderGraphicConnectionLabel(choice.graphic, x, y);
        return;
      }
    }

    const displayText =
      text.length > this.constants.MAX_LABEL_LENGTH
        ? text.substring(0, this.constants.MAX_LABEL_LENGTH) + "..."
        : text;

    this.ctx.fillStyle = this.colors.labelBackground;
    this.ctx.font = "12px Arial";

    const textWidth = this.ctx.measureText(displayText).width;
    const padding = 4;

    this.ctx.fillRect(
      x - textWidth / 2 - padding,
      y - 8,
      textWidth + padding * 2,
      16
    );

    this.ctx.fillStyle = this.colors.text;
    this.ctx.textAlign = "center";
    this.ctx.fillText(displayText, x, y + 4);
  }

  renderGraphicConnectionLabel(graphicPath, x, y) {
    const indicatorSize = 16;

    this.ctx.fillStyle = this.colors.labelBackground;
    this.ctx.fillRect(
      x - indicatorSize / 2 - 2,
      y - indicatorSize / 2 - 2,
      indicatorSize + 4,
      indicatorSize + 4
    );

    this.ctx.strokeStyle = this.colors.connectionChoice;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      x - indicatorSize / 2 - 2,
      y - indicatorSize / 2 - 2,
      indicatorSize + 4,
      indicatorSize + 4
    );

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = "10px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("📷", x, y + 3);
  }

  renderConnectionPreview(connectionStart, mousePos) {
    const fromNode = connectionStart;
    const fromX = fromNode.x + fromNode.width / 2;
    const fromY = fromNode.y + fromNode.height / 2;

    this.ctx.strokeStyle = this.colors.connectionPreview;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(mousePos.x, mousePos.y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  renderNodes(selectedNode) {
    const nodes = window.nodeEditor.nodeManager.getNodes();
    nodes.forEach((node) => {
      this.renderNode(node, selectedNode);
    });
  }

  renderNode(node, selectedNode) {
    const { x, y, width, height, scene } = node;
    const colors =
      scene.type === "choice" ? this.colors.choice : this.colors.image;

    this.ctx.fillStyle =
      selectedNode === node ? colors.active : colors.background;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = selectedNode === node ? 3 : 1;
    this.ctx.strokeRect(x, y, width, height);

    if (node.backgroundImage) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.drawImage(node.backgroundImage, x, y, width, height);
      this.ctx.restore();
    }

    if (node.objectImages?.size > 0) {
      this.renderSceneObjects(node);
    }

    this.renderNodeText(node);
    this.renderSceneTypeToggle(node);

    if (selectedNode === node) {
      this.renderConnectionPoints(node);
    }
  }

  renderNodeText(node) {
    const { x, width, height, scene } = node;

    this.ctx.fillStyle = this.colors.text;
    this.ctx.font = "bold 14px Arial";
    this.ctx.textAlign = "center";

    this.ctx.fillText(`Scene ${node.id}`, x + width / 2, node.y + 20);

    this.ctx.font = "12px Arial";
    const name = scene.name || "Untitled Scene";
    this.ctx.fillText(name, x + width / 2, node.y + 40);

    this.ctx.font = "10px Arial";
    this.ctx.fillStyle = "#bdc3c7";
    this.ctx.fillText(scene.type, x + width / 2, node.y + height - 50);
  }

  renderSceneTypeToggle(node) {
    const toggleArea = this.getToggleArea(node);
    const { x, y, width, height } = toggleArea;

    this.ctx.fillStyle = this.colors.toggle;
    this.ctx.fillRect(x, y, width, height);

    this.ctx.strokeStyle = this.colors.toggleBorder;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    this.ctx.fillStyle = this.colors.toggleText;
    this.ctx.font = "bold 12px Arial";
    this.ctx.textAlign = "center";

    const buttonText = node.scene.type === "choice" ? "Choice" : "Image";
    this.ctx.fillText(buttonText, x + width / 2, y + height / 2 + 4);
  }

  renderSceneObjects(node) {
    if (!node.objectImages?.size) return;

    const { x, y, width, height } = node;
    const toggleArea = this.getToggleArea(node);

    const previewAreas = [
      {
        x: x + 10,
        y: y + 50,
        width: width - 20,
        height: toggleArea.y - y - 60,
      },
      {
        x: x + 10,
        y: toggleArea.y + toggleArea.height + 10,
        width: width - 20,
        height: y + height - (toggleArea.y + toggleArea.height) - 50,
      },
    ];

    let objectIndex = 0;
    const maxObjects = Math.min(
      node.objectImages.size,
      window.nodeEditor.nodeManager.constants.MAX_PREVIEW_OBJECTS
    );

    previewAreas.forEach((previewArea) => {
      if (previewArea.height > 20 && objectIndex < maxObjects) {
        const objectsInThisArea = Math.min(
          this.constants.PREVIEW_OBJECTS_PER_AREA,
          maxObjects - objectIndex
        );

        for (
          let i = 0;
          i < objectsInThisArea && objectIndex < maxObjects;
          i++, objectIndex++
        ) {
          const objData = node.objectImages.get(objectIndex);
          if (objData) {
            this.renderObjectPreview(objData, previewArea, objectIndex);
          }
        }
      }
    });

    if (
      node.scene.images?.length >
      window.nodeEditor.nodeManager.constants.MAX_PREVIEW_OBJECTS
    ) {
      const remaining =
        node.scene.images.length -
        window.nodeEditor.nodeManager.constants.MAX_PREVIEW_OBJECTS;
      this.ctx.fillStyle = this.colors.text;
      this.ctx.font = "10px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        `+${remaining} more`,
        x + width / 2,
        toggleArea.y + toggleArea.height + 35
      );
    }
  }

  renderObjectPreview(objData, previewArea, index) {
    const { image, data } = objData;

    const objX = previewArea.x + (data.x / 100) * previewArea.width;
    const objY = previewArea.y + (data.y / 100) * previewArea.height;

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    const aspectRatio = originalWidth / originalHeight;

    let renderWidth =
      this.constants.PREVIEW_OBJECT_MAX_SIZE * (data.scale || 1);
    let renderHeight = renderWidth / aspectRatio;

    if (renderHeight > this.constants.PREVIEW_OBJECT_MAX_SIZE) {
      renderHeight = this.constants.PREVIEW_OBJECT_MAX_SIZE * (data.scale || 1);
      renderWidth = renderHeight * aspectRatio;
    }

    if (renderWidth < this.constants.PREVIEW_OBJECT_MIN_SIZE) {
      renderWidth = this.constants.PREVIEW_OBJECT_MIN_SIZE;
      renderHeight = renderWidth / aspectRatio;
    }
    if (renderHeight < this.constants.PREVIEW_OBJECT_MIN_SIZE) {
      renderHeight = this.constants.PREVIEW_OBJECT_MIN_SIZE;
      renderWidth = renderHeight * aspectRatio;
    }

    const clampedX = Math.max(
      previewArea.x,
      Math.min(
        previewArea.x + previewArea.width - renderWidth,
        objX - renderWidth / 2
      )
    );
    const clampedY = Math.max(
      previewArea.y,
      Math.min(
        previewArea.y + previewArea.height - renderHeight,
        objY - renderHeight / 2
      )
    );

    this.ctx.save();
    this.ctx.globalAlpha = data.opacity || 1;

    if (data.rotation && data.rotation !== 0) {
      this.ctx.translate(
        clampedX + renderWidth / 2,
        clampedY + renderHeight / 2
      );
      this.ctx.rotate((data.rotation * Math.PI) / 180);
      this.ctx.translate(-renderWidth / 2, -renderHeight / 2);
      this.ctx.drawImage(image, 0, 0, renderWidth, renderHeight);
    } else {
      this.ctx.drawImage(image, clampedX, clampedY, renderWidth, renderHeight);
    }

    this.ctx.restore();
  }

  renderConnectionPoints(node) {
    const { x, y, width, height } = node;

    const points = [
      { x: x + width / 2, y: y },
      { x: x + width, y: y + height / 2 },
      { x: x + width / 2, y: y + height },
      { x: x, y: y + height / 2 },
    ];

    points.forEach((point) => {
      this.ctx.fillStyle = this.colors.connectionPoint;
      this.ctx.beginPath();
      this.ctx.arc(
        point.x,
        point.y,
        this.constants.CONNECTION_RADIUS,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    });
  }

  getToggleArea(node) {
    return {
      x: node.x + (node.width - this.constants.BUTTON_WIDTH) / 2,
      y: node.y + (node.height - this.constants.BUTTON_HEIGHT) / 2,
      width: this.constants.BUTTON_WIDTH,
      height: this.constants.BUTTON_HEIGHT,
    };
  }

  isPositionInArea(x, y, area) {
    return (
      x >= area.x &&
      x <= area.x + area.width &&
      y >= area.y &&
      y <= area.y + area.height
    );
  }

  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.assign(element, attributes);
    return element;
  }
}
