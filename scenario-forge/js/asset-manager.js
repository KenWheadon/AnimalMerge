class AssetManager {
  constructor() {
    this.backgrounds = [];
    this.objects = [];
    this.imageCache = new Map();
    this.base64Cache = new Map();
    this.eventListeners = new Map();
    this.IMAGE_PATH_PREFIX = "images/";
  }

  setAssets(backgrounds, objects) {
    this.backgrounds = backgrounds;
    this.objects = objects;
  }

  addBackground(backgroundPath, base64Data = null) {
    if (!this.backgrounds.includes(backgroundPath)) {
      this.backgrounds.push(backgroundPath);
      if (base64Data) {
        this.base64Cache.set(backgroundPath, base64Data);
      }
    }
  }

  addObject(objectPath, base64Data = null) {
    if (!this.objects.includes(objectPath)) {
      this.objects.push(objectPath);
      if (base64Data) {
        this.base64Cache.set(objectPath, base64Data);
      }
    }
  }

  removeBackground(backgroundPath) {
    this.backgrounds = this.backgrounds.filter((bg) => bg !== backgroundPath);
    this.base64Cache.delete(backgroundPath);
  }

  removeObject(objectPath) {
    this.objects = this.objects.filter((obj) => obj !== objectPath);
    this.base64Cache.delete(objectPath);
  }

  getBackgrounds() {
    return this.backgrounds;
  }

  getObjects() {
    return this.objects;
  }

  getSortedBackgrounds() {
    return Utils.sortAssets(this.backgrounds);
  }

  getSortedObjects() {
    return Utils.sortAssets(this.objects);
  }

  getBase64Data(imagePath) {
    return this.base64Cache.get(imagePath);
  }

  hasBase64Data(imagePath) {
    return this.base64Cache.has(imagePath);
  }

  getAllBase64Data() {
    return new Map(this.base64Cache);
  }

  setupAssetDropZones() {
    const backgroundDropZone = document.getElementById("background-drop-zone");
    const objectDropZone = document.getElementById("object-drop-zone");
    const assetInput = document.getElementById("asset-file-input");

    this.addEventListenerWithCleanup(backgroundDropZone, "click", () => {
      assetInput.dataset.target = "backgrounds";
      assetInput.click();
    });

    this.addEventListenerWithCleanup(objectDropZone, "click", () => {
      assetInput.dataset.target = "objects";
      assetInput.click();
    });

    this.setupDropZoneEvents(backgroundDropZone, "backgrounds");
    this.setupDropZoneEvents(objectDropZone, "objects");
  }

  addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);
    const key = `${element.id}_${event}`;
    this.eventListeners.set(key, { element, event, handler });
  }

  setupDropZoneEvents(dropZone, targetType) {
    const handlers = {
      dragEnterHandler: (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("dragover");
      },
      dragOverHandler: (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("dragover");
        e.dataTransfer.dropEffect = "copy";
      },
      dragLeaveHandler: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
          dropZone.classList.remove("dragover");
        }
      },
      dropHandler: (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("dragover");
        this.handleAssetDrop(e, targetType);
      },
    };

    Object.entries(handlers).forEach(([name, handler]) => {
      this.addEventListenerWithCleanup(
        dropZone,
        name.replace("Handler", "").toLowerCase(),
        handler
      );
    });

    const childElements = dropZone.querySelectorAll("*");
    childElements.forEach((child) => {
      Object.entries(handlers).forEach(([name, handler]) => {
        child.addEventListener(
          name.replace("Handler", "").toLowerCase(),
          handler
        );
      });
    });
  }

  async handleAssetDrop(event, targetType) {
    if (!event.dataTransfer.files || event.dataTransfer.files.length === 0) {
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    await this.processImageFiles(files, targetType);
  }

  async handleAssetFileLoad(event) {
    const files = Array.from(event.target.files);
    const targetType = event.target.dataset.target;

    if (!targetType) return;

    await this.processImageFiles(files, targetType);
    event.target.value = "";
    event.target.dataset.target = "";
  }

  async processImageFiles(files, targetType) {
    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      window.editor?.showWarning("Please select image files only.");
      return;
    }

    const processingPromises = imageFiles.map((file) =>
      this.processImageFile(file, targetType)
    );

    await Promise.all(processingPromises);
    this.refreshAssetLists();
    window.editor?.updateSceneDropdowns();
  }

  processImageFile(file, targetType) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imagePath = `${this.IMAGE_PATH_PREFIX}${file.name}`;
        const base64Data = reader.result;

        if (targetType === "backgrounds") {
          this.addBackground(imagePath, base64Data);
        } else {
          this.addObject(imagePath, base64Data);
        }

        resolve();
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async loadImageDimensions(src) {
    return Utils.loadImageDimensions(src, this.imageCache);
  }

  refreshAssetLists() {
    this.refreshBackgroundList();
    this.refreshObjectList();
  }

  refreshBackgroundList() {
    const bgList = document.getElementById("background-list");
    bgList.innerHTML = "";

    this.getSortedBackgrounds().forEach((bg) => {
      const item = this.createBackgroundItem(bg);
      bgList.appendChild(item);
    });
  }

  createBackgroundItem(bg) {
    const item = document.createElement("div");
    item.className = "asset-item";
    const cleanName = Utils.getCleanFilename(bg, "background");

    item.innerHTML = `
      ${cleanName}
      <button class="remove-btn" data-bg="${bg}">&times;</button>
    `;

    const removeBtn = item.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      this.removeBackground(bg);
      this.refreshAssetLists();
      window.editor?.updateSceneDropdowns();
    });

    return item;
  }

  refreshObjectList() {
    const objList = document.getElementById("object-list");
    if (!objList) return;

    objList.innerHTML = "";

    this.getSortedObjects().forEach((obj) => {
      const item = this.createObjectItem(obj);
      objList.appendChild(item);
    });
  }

  createObjectItem(obj) {
    const item = document.createElement("div");
    item.className = "asset-item";
    item.draggable = true;
    item.dataset.objPath = obj;
    const cleanName = Utils.getCleanFilename(obj, "object");

    item.innerHTML = `
      ${cleanName}
      <button class="remove-btn" data-obj="${obj}">&times;</button>
    `;

    const removeBtn = item.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      this.removeObject(obj);
      this.refreshAssetLists();
    });

    const dragStartHandler = (e) => {
      e.dataTransfer.setData("text/plain", obj);
      item.classList.add("dragging");
    };

    const dragEndHandler = () => {
      item.classList.remove("dragging");
    };

    item.addEventListener("dragstart", dragStartHandler);
    item.addEventListener("dragend", dragEndHandler);

    return item;
  }

  cleanup() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
    this.imageCache.clear();
    this.base64Cache.clear();
  }

  clearAssets() {
    this.backgrounds = [];
    this.objects = [];
    this.imageCache.clear();
    this.base64Cache.clear();
  }
}
