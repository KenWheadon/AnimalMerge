class PreviewContextMenuManager {
  static STYLES = {
    CONTEXT_MENU: {
      position: "absolute",
      background: "#2c3e50",
      border: "1px solid #34495e",
      borderRadius: "4px",
      padding: "4px 0",
      zIndex: "2000",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      minWidth: "140px",
    },
    MENU_ITEM: {
      display: "block",
      width: "100%",
      padding: "8px 12px",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "12px",
      textAlign: "left",
    },
    SUBMENU: {
      position: "absolute",
      left: "100%",
      top: "0",
      background: "#2c3e50",
      border: "1px solid #34495e",
      borderRadius: "4px",
      padding: "4px 0",
      zIndex: "2001",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
      minWidth: "120px",
      maxHeight: "200px",
      overflowY: "auto",
    },
  };

  static COLORS = {
    SUCCESS: "#27ae60",
    INFO: "#3498db",
    WARNING: "#f39c12",
    DANGER: "#e74c3c",
  };

  constructor(interactionManager) {
    this.interactionManager = interactionManager;
    this.activeSubmenus = new Set();
  }

  showBackgroundContextMenu(e) {
    const items = [];
    if (window.projectManager.hasClipboardObject()) {
      items.push({
        text: "Paste Object",
        action: () => this.pasteObjectAtPosition(e.clientX, e.clientY),
      });
    }
    if (items.length > 0) {
      this.createContextMenu(
        e.clientX,
        e.clientY,
        items,
        "background-context-menu"
      );
    }
  }

  pasteObjectAtPosition(clientX, clientY) {
    const objectData = window.projectManager.getPastedObject();
    if (!objectData) return;

    const position = this.interactionManager.calculateRelativePosition(
      clientX,
      clientY
    );
    const newObject = {
      ...objectData,
      x: Math.max(0, Math.min(100, position.x)),
      y: Math.max(0, Math.min(100, position.y)),
      zIndex: Date.now(),
    };

    const scene = this.interactionManager.getCurrentScene();
    if (!scene.images) scene.images = [];
    scene.images.push(newObject);

    this.interactionManager.updateAllComponents(scene.images.length - 1);
    this.interactionManager.showFeedback(
      "Pasted!",
      PreviewContextMenuManager.COLORS.INFO
    );
  }

  showObjectContextMenu(e, objectIndex) {
    const obj = this.interactionManager.getCurrentSceneObject(objectIndex);
    const items = [
      {
        text: "Copy Object",
        action: () => this.interactionManager.copySelectedObject(),
      },
      {
        text: "Copy Position",
        action: () => this.interactionManager.copySelectedObjectPosition(),
      },
      {
        text: "Paste Object",
        action: () => this.interactionManager.pasteObject(),
        disabled: !window.projectManager.hasClipboardObject(),
      },
      {
        text: "Paste Position",
        action: () => this.interactionManager.pasteObjectPosition(),
        disabled: !window.projectManager.hasClipboardPosition(),
      },
      { separator: true },
      {
        text: "Swap Graphic",
        submenu: this.createSwapGraphicSubmenu(objectIndex),
        color: PreviewContextMenuManager.COLORS.INFO,
      },
      { separator: true },
      {
        text: obj.locked ? "Unlock Object" : "Lock Object",
        action: () => window.editor.toggleObjectLock(objectIndex),
        color: PreviewContextMenuManager.COLORS.WARNING,
      },
      {
        text: "Delete Object",
        action: () => window.editor.removeObjectFromList(objectIndex),
        color: PreviewContextMenuManager.COLORS.DANGER,
      },
    ];

    this.createContextMenu(e.clientX, e.clientY, items, "object-context-menu");
  }

  createSwapGraphicSubmenu(objectIndex) {
    const availableObjects = window.assetManager.getSortedObjects();
    const currentObj =
      this.interactionManager.getCurrentSceneObject(objectIndex);

    return availableObjects
      .filter((objPath) => objPath !== currentObj.src) // Don't show current graphic
      .map((objPath) => ({
        text: Utils.getCleanFilename(objPath, "object"),
        action: () => this.swapObjectGraphic(objectIndex, objPath),
      }));
  }

  swapObjectGraphic(objectIndex, newGraphicPath) {
    const selectedObject = this.interactionManager.getSelectedObject();
    const scene = this.interactionManager.getCurrentScene();

    if (scene.images && scene.images[objectIndex]) {
      scene.images[objectIndex].src = newGraphicPath;

      // Re-render the preview to show the new graphic
      window.previewManager.renderPreview(
        this.interactionManager.getProject(),
        window.editor.currentScene
      );

      // If this was the selected object, maintain selection
      if (selectedObject === objectIndex) {
        this.interactionManager.selectObject(objectIndex);
      }

      this.interactionManager.showFeedback(
        "Graphic Swapped!",
        PreviewContextMenuManager.COLORS.SUCCESS
      );
    }
  }

  showUIElementContextMenu(e, element) {
    const items = [
      {
        text: "Copy Position",
        action: () => this.interactionManager.copyUIElementPosition(),
      },
      {
        text: "Paste Position",
        action: () => this.interactionManager.pasteUIElementPosition(),
        disabled: !window.projectManager.hasClipboardPosition(),
      },
      { separator: true },
      {
        text: "Set as Default",
        action: () => this.setUIElementAsDefault(element),
        color: PreviewContextMenuManager.COLORS.SUCCESS,
      },
      {
        text: "Reset to Default",
        action: () => this.resetUIElementToDefault(element),
        color: PreviewContextMenuManager.COLORS.WARNING,
      },
    ];

    this.createContextMenu(e.clientX, e.clientY, items, "ui-context-menu");
  }

  resetUIElementToDefault(element) {
    const uiType = element.dataset.uiType;
    const defaults = window.projectManager.getDefaultUIPositions();
    const defaultType = uiType === "choice" ? "choiceButton" : uiType;
    const defaultPosition = defaults[defaultType];

    this.interactionManager.setUIElementPosition(element, defaultPosition);
    this.interactionManager.showFeedback(
      "Reset to Default!",
      PreviewContextMenuManager.COLORS.WARNING
    );
  }

  setUIElementAsDefault(element) {
    const position = this.interactionManager.getUIElementPosition(element);
    const uiType = element.dataset.uiType;
    const defaultType = uiType === "choice" ? "choiceButton" : uiType;

    window.projectManager.updateDefaultUIPosition(
      defaultType,
      position.x,
      position.y,
      position.width
    );
    this.interactionManager.showFeedback(
      "Set as Default!",
      PreviewContextMenuManager.COLORS.SUCCESS
    );
  }

  createContextMenu(x, y, items, menuId) {
    this.removeContextMenus();

    const menu = document.createElement("div");
    menu.id = menuId;
    menu.className = "context-menu";
    Object.assign(menu.style, PreviewContextMenuManager.STYLES.CONTEXT_MENU);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    items.forEach((item) => {
      if (item.separator) {
        const separator = this.createSeparator();
        menu.appendChild(separator);
      } else {
        const menuItem = this.createMenuItem(item, menu);
        menu.appendChild(menuItem);
      }
    });

    document.body.appendChild(menu);
    this.setupContextMenuCloseHandler(menu);
  }

  createSeparator() {
    const separator = document.createElement("div");
    Object.assign(separator.style, {
      height: "1px",
      background: "#34495e",
      margin: "4px 0",
    });
    return separator;
  }

  createMenuItem(item, parentMenu) {
    const menuItem = document.createElement("button");
    menuItem.textContent = item.text;
    menuItem.className = "context-menu-item";

    Object.assign(menuItem.style, {
      ...PreviewContextMenuManager.STYLES.MENU_ITEM,
      color: item.disabled ? "#7f8c8d" : "#ecf0f1",
      cursor: item.disabled ? "not-allowed" : "pointer",
      position: "relative",
    });

    if (item.submenu && item.submenu.length > 0) {
      // Add arrow indicator for submenu
      menuItem.style.paddingRight = "24px";
      const arrow = document.createElement("span");
      arrow.textContent = "▶";
      arrow.style.position = "absolute";
      arrow.style.right = "8px";
      arrow.style.fontSize = "10px";
      menuItem.appendChild(arrow);

      menuItem.addEventListener("mouseenter", (e) => {
        this.showSubmenu(e, item.submenu, menuItem, parentMenu);
        menuItem.style.background =
          item.color || PreviewContextMenuManager.COLORS.INFO;
      });

      menuItem.addEventListener("mouseleave", (e) => {
        // Only hide submenu if not moving to submenu
        setTimeout(() => {
          if (!this.isMouseOverSubmenu(e)) {
            this.hideSubmenu(menuItem);
            menuItem.style.background = "none";
          }
        }, 100);
      });
    } else if (!item.disabled) {
      menuItem.addEventListener("click", () => {
        item.action();
        this.removeContextMenus();
      });

      menuItem.addEventListener("mouseenter", () => {
        menuItem.style.background =
          item.color || PreviewContextMenuManager.COLORS.INFO;
      });

      menuItem.addEventListener("mouseleave", () => {
        menuItem.style.background = "none";
      });
    }

    return menuItem;
  }

  showSubmenu(e, submenuItems, menuItem, parentMenu) {
    this.hideAllSubmenus();

    const submenu = document.createElement("div");
    submenu.className = "context-submenu";
    submenu.dataset.parentItem = menuItem.textContent;
    Object.assign(submenu.style, PreviewContextMenuManager.STYLES.SUBMENU);

    submenuItems.forEach((subItem) => {
      const subMenuItem = document.createElement("button");
      subMenuItem.textContent = subItem.text;
      subMenuItem.className = "context-menu-item";

      Object.assign(subMenuItem.style, {
        ...PreviewContextMenuManager.STYLES.MENU_ITEM,
        color: "#ecf0f1",
        cursor: "pointer",
      });

      subMenuItem.addEventListener("click", () => {
        subItem.action();
        this.removeContextMenus();
      });

      subMenuItem.addEventListener("mouseenter", () => {
        subMenuItem.style.background = PreviewContextMenuManager.COLORS.INFO;
      });

      subMenuItem.addEventListener("mouseleave", () => {
        subMenuItem.style.background = "none";
      });

      submenu.appendChild(subMenuItem);
    });

    // Position submenu relative to menu item
    const itemRect = menuItem.getBoundingClientRect();
    submenu.style.left = `${itemRect.right - 1}px`;
    submenu.style.top = `${itemRect.top}px`;

    // Adjust if submenu would go off screen
    document.body.appendChild(submenu);
    const submenuRect = submenu.getBoundingClientRect();
    if (submenuRect.right > window.innerWidth) {
      submenu.style.left = `${itemRect.left - submenuRect.width + 1}px`;
    }
    if (submenuRect.bottom > window.innerHeight) {
      submenu.style.top = `${window.innerHeight - submenuRect.height}px`;
    }

    this.activeSubmenus.add(submenu);

    // Handle submenu mouse events - FIX: Capture menuItem reference properly
    const menuItemColor =
      menuItem.dataset.itemColor || PreviewContextMenuManager.COLORS.INFO;

    submenu.addEventListener("mouseenter", () => {
      menuItem.style.background = menuItemColor;
    });

    submenu.addEventListener("mouseleave", () => {
      this.hideSubmenu(menuItem);
      menuItem.style.background = "none";
    });
  }

  hideSubmenu(menuItem) {
    const existingSubmenu = document.querySelector(
      `.context-submenu[data-parent-item="${menuItem.textContent}"]`
    );
    if (existingSubmenu) {
      existingSubmenu.remove();
      this.activeSubmenus.delete(existingSubmenu);
    }
  }

  hideAllSubmenus() {
    this.activeSubmenus.forEach((submenu) => {
      submenu.remove();
    });
    this.activeSubmenus.clear();
  }

  isMouseOverSubmenu(e) {
    // Check if mouse is over any active submenu
    for (const submenu of this.activeSubmenus) {
      const rect = submenu.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        return true;
      }
    }
    return false;
  }

  setupContextMenuCloseHandler(menu) {
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && !this.isMouseOverSubmenu(e)) {
        this.removeContextMenus();
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  removeContextMenus() {
    this.hideAllSubmenus();
    [
      "object-context-menu",
      "ui-context-menu",
      "background-context-menu",
    ].forEach((id) => {
      const menu = document.getElementById(id);
      if (menu) menu.remove();
    });
  }
}
