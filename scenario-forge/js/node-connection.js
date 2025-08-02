class NodeConnection {
  constructor() {
    this.connections = [];

    this.constants = {
      CONNECTION_THRESHOLD: 10,
    };
  }

  updateConnections() {
    this.connections = [];
    const nodes = window.nodeEditor.nodeManager.getNodes();

    nodes.forEach((node, nodeId) => {
      const scene = node.scene;

      if (scene.nextScene) {
        this.addConnection(
          nodeId,
          scene.nextScene.toString(),
          "nextScene",
          "Continue"
        );
      }

      if (scene.choices?.length > 0) {
        scene.choices.forEach((choice, index) => {
          if (choice.nextScene) {
            this.addConnection(
              nodeId,
              choice.nextScene.toString(),
              "choice",
              choice.text || `Choice ${index + 1}`,
              index
            );
          }
        });
      }
    });
  }

  addConnection(from, to, type, label, choiceIndex = undefined) {
    const nodes = window.nodeEditor.nodeManager.getNodes();
    if (nodes.has(to)) {
      this.connections.push({ from, to, type, label, choiceIndex });
    }
  }

  getConnectionAtPosition(x, y) {
    const nodes = window.nodeEditor.nodeManager.getNodes();

    for (const connection of this.connections) {
      const fromNode = nodes.get(connection.from);
      const toNode = nodes.get(connection.to);

      if (!fromNode || !toNode) continue;

      const fromX = fromNode.x + fromNode.width / 2;
      const fromY = fromNode.y + fromNode.height / 2;
      const toX = toNode.x + toNode.width / 2;
      const toY = toNode.y + toNode.height / 2;

      const distance = this.pointToLineDistance(x, y, fromX, fromY, toX, toY);
      if (distance < this.constants.CONNECTION_THRESHOLD) {
        return connection;
      }
    }

    return null;
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  validateConnection(fromNode, toNode) {
    if (fromNode.id === toNode.id) {
      alert("Cannot connect a scene to itself.");
      return false;
    }

    if (fromNode.scene.type === "image" && fromNode.scene.nextScene) {
      alert(
        "Image scenes can only have one 'Next Scene' connection. Remove the existing connection first."
      );
      return false;
    }

    const existingConnection = this.connections.find(
      (conn) => conn.from === fromNode.id && conn.to === toNode.id
    );

    if (existingConnection) {
      alert("A connection already exists between these scenes.");
      return false;
    }

    return true;
  }

  createConnection(fromNode, toNode) {
    this.showConnectionDialog(fromNode, toNode);
  }

  showConnectionDialog(fromNode, toNode) {
    const dialog = window.nodeEditor.nodeRenderer.createElement("div", {
      className: "connection-dialog",
    });
    const connectionType =
      fromNode.scene.type === "image" ? "nextScene" : "choice";

    if (fromNode.scene.type === "image" && fromNode.scene.nextScene) {
      alert(
        "Image scenes can only have one 'Next Scene' connection. Remove the existing connection first."
      );
      return;
    }

    dialog.innerHTML = this.buildConnectionDialogContent(
      fromNode,
      toNode,
      connectionType
    );
    document.body.appendChild(dialog);

    this.setupConnectionDialogHandlers(
      dialog,
      fromNode,
      toNode,
      connectionType
    );
  }

  buildConnectionDialogContent(fromNode, toNode, connectionType) {
    let content = `
      <div class="connection-dialog-content">
        <h3>Create Connection</h3>
        <p>From: ${fromNode.id} (${fromNode.scene.name})</p>
        <p>To: ${toNode.id} (${toNode.scene.name})</p>
        <p><strong>Connection Type: ${
          connectionType === "nextScene"
            ? "Next Scene (Continue)"
            : "Choice Connection"
        }</strong></p>
    `;

    if (connectionType === "choice") {
      content += this.buildChoiceSelectionContent(fromNode);
    }

    content += `
        <div class="connection-dialog-buttons">
          <button id="create-connection-btn" class="btn btn-primary">Create</button>
          <button id="cancel-connection-btn" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `;

    return content;
  }

  buildChoiceSelectionContent(fromNode) {
    let content = `<div id="choice-selection">`;

    if (fromNode.scene.choices?.length > 0) {
      content += `<h4>Existing Choices:</h4><div class="existing-choices">`;

      fromNode.scene.choices.forEach((choice, index) => {
        content += `
          <label>
            <input type="radio" name="choiceOption" value="existing-${index}">
            Update: "${choice.text}"
          </label>
        `;
      });

      content += `</div>`;
    }

    const isChecked =
      !fromNode.scene.choices || fromNode.scene.choices.length === 0;
    content += `
      <label>
        <input type="radio" name="choiceOption" value="new" ${
          isChecked ? "checked" : ""
        }>
        Create New Choice
      </label>
      </div>
      <div id="choice-text-input">
        <input type="text" id="choice-text" placeholder="Enter choice text">
      </div>
    `;

    return content;
  }

  setupConnectionDialogHandlers(dialog, fromNode, toNode, connectionType) {
    if (connectionType === "choice") {
      this.setupChoiceOptionsHandlers(dialog);
    }

    dialog
      .querySelector("#create-connection-btn")
      .addEventListener("click", () => {
        this.handleCreateConnection(dialog, fromNode, toNode, connectionType);
      });

    dialog
      .querySelector("#cancel-connection-btn")
      .addEventListener("click", () => {
        dialog.remove();
      });
  }

  setupChoiceOptionsHandlers(dialog) {
    const choiceOptions = dialog.querySelectorAll('input[name="choiceOption"]');
    const choiceTextInputField = dialog.querySelector("#choice-text");

    choiceOptions.forEach((option) => {
      option.addEventListener("change", () => {
        if (option.value === "new") {
          choiceTextInputField.value = "";
          choiceTextInputField.placeholder = "Enter choice text";
          choiceTextInputField.disabled = false;
        } else if (option.value.startsWith("existing-")) {
          const index = parseInt(option.value.split("-")[1]);
          const existingChoice = fromNode.scene.choices[index];
          choiceTextInputField.value = existingChoice.text;
          choiceTextInputField.placeholder = "Choice will be updated";
          choiceTextInputField.disabled = true;
        }
      });
    });
  }

  handleCreateConnection(dialog, fromNode, toNode, connectionType) {
    let choiceText = "";
    let choiceOption = null;

    if (connectionType === "choice") {
      choiceText = dialog.querySelector("#choice-text").value;
      const selectedChoiceOption = dialog.querySelector(
        'input[name="choiceOption"]:checked'
      );
      choiceOption = selectedChoiceOption ? selectedChoiceOption.value : "new";
    }

    this.executeCreateConnection(
      fromNode,
      toNode,
      connectionType,
      choiceText,
      choiceOption
    );
    dialog.remove();
  }

  executeCreateConnection(fromNode, toNode, type, choiceText, choiceOption) {
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[fromNode.id];

    if (type === "nextScene" && scene.type !== "image") {
      alert("Only image scenes can have 'Next Scene' connections.");
      return;
    }

    if (type === "choice" && scene.type !== "choice") {
      alert("Only choice scenes can have 'Choice' connections.");
      return;
    }

    if (type === "nextScene") {
      if (scene.nextScene) {
        alert(
          "Image scenes can only have one 'Next Scene' connection. Remove the existing connection first."
        );
        return;
      }
      scene.nextScene = toNode.id;
    } else if (type === "choice") {
      this.handleChoiceConnection(scene, toNode, choiceText, choiceOption);
    }

    this.updateConnections();
    window.nodeEditor.render();
    window.nodeEditor.nodeManager.updateEditorState(fromNode.id);
  }

  handleChoiceConnection(scene, toNode, choiceText, choiceOption) {
    if (!scene.choices) scene.choices = [];

    if (choiceOption?.startsWith("existing-")) {
      const index = parseInt(choiceOption.split("-")[1]);
      if (scene.choices[index]) {
        scene.choices[index].nextScene = toNode.id;
      }
    } else {
      scene.choices.push(
        this.createNewChoice(choiceText, toNode.id, scene.choices.length)
      );
    }
  }

  createNewChoice(choiceText, nextSceneId, choiceCount) {
    const newChoice = {
      text: choiceText || "New Choice",
      nextScene: nextSceneId,
      displayMode: "text",
      graphic: "",
      graphicProperties: {
        scale: 1.0,
        rotation: 0,
        opacity: 1.0,
        zIndex: 50,
        effect: "",
      },
    };

    if (window.projectManager) {
      const defaultChoicePosition =
        window.projectManager.getDefaultUIPositions().choiceButton;
      const spacing = window.sceneManager?.CHOICE_VERTICAL_SPACING || 7;

      newChoice.position = {
        x: defaultChoicePosition.x,
        y: defaultChoicePosition.y + choiceCount * spacing,
        width: defaultChoicePosition.width,
      };
    }

    return newChoice;
  }

  deleteConnection(connection) {
    const project = window.editor.projectManager.getProject();
    const scene = project.scenes[connection.from];

    if (connection.type === "nextScene") {
      scene.nextScene = null;
    } else if (
      connection.type === "choice" &&
      connection.choiceIndex !== undefined
    ) {
      if (scene.choices?.[connection.choiceIndex]) {
        scene.choices.splice(connection.choiceIndex, 1);
      }
    }

    this.updateConnections();
    window.nodeEditor.render();
    window.nodeEditor.nodeManager.updateEditorState(connection.from);
  }

  removeAllConnectionsForScene(sceneId) {
    this.connections = this.connections.filter(
      (connection) => connection.from !== sceneId
    );
  }

  getConnections() {
    return this.connections;
  }
}
