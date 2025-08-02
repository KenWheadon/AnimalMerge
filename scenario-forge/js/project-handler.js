class ProjectHandler {
  constructor(editor) {
    this.editor = editor;
  }

  loadFromLocalStorage() {
    if (this.editor.projectManager.loadFromLocalStorage()) {
      this.loadProjectData();
    } else {
      this.createNewProject();
    }
  }

  createNewProject() {
    this.editor.projectManager.initializeProject();
    this.resetEditorState();
  }

  createNewScenario() {
    this.editor.projectManager.createNewScenario();
    this.resetEditorState();
    this.selectFirstAvailableScene();
  }

  resetEditorState() {
    this.editor.assetManager.clearAssets();
    this.refreshUIComponents();
    this.editor.previewManager.clearPreview();
    this.editor.uiManager.updateSceneObjectsList(
      this.editor.projectManager.getProject(),
      null
    );
  }

  selectFirstAvailableScene() {
    const project = this.editor.projectManager.getProject();
    const firstSceneId = Object.keys(project.scenes)[0];
    if (firstSceneId) {
      this.editor.sceneController.selectScene(firstSceneId);
    }
  }

  loadProjectData() {
    const extractedAssets =
      this.editor.projectManager.extractAssetsFromProject();
    this.editor.assetManager.setAssets(
      extractedAssets.backgrounds,
      extractedAssets.objects
    );
    this.refreshUIComponents();
    this.selectFirstAvailableScene();
  }

  loadProject() {
    document.getElementById("file-input").click();
  }

  handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.editor.projectManager.loadFromJSON(e.target.result)) {
        this.loadProjectData();
      } else {
        this.editor.showWarning("Error loading project file.");
      }
    };
    reader.readAsText(file);
  }

  saveProject() {
    this.editor.projectManager.saveProjectToFile();
  }

  collectAllImagePaths(project) {
    const imagePaths = new Set();

    Object.values(project.scenes).forEach((scene) => {
      if (scene.background) {
        imagePaths.add(scene.background);
      }

      if (scene.images) {
        scene.images.forEach((imageData) => {
          imagePaths.add(imageData.src);
        });
      }

      if (scene.choices) {
        scene.choices.forEach((choice) => {
          if (choice.displayMode === "graphic" && choice.graphic) {
            imagePaths.add(choice.graphic);
          }
        });
      }
    });

    return Array.from(imagePaths);
  }

  isBase64DataURL(str) {
    return typeof str === "string" && str.startsWith("data:");
  }

  async convertImageToBase64(imagePath) {
    if (this.isBase64DataURL(imagePath)) {
      return imagePath;
    }

    if (this.editor.assetManager.hasBase64Data(imagePath)) {
      const base64Data = this.editor.assetManager.getBase64Data(imagePath);
      return base64Data;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const base64Data = this.convertImageElementToBase64(img, imagePath);
          resolve(base64Data);
        } catch (error) {
          reject(
            new Error(
              `Failed to convert image to base64: ${imagePath} - ${error.message}`
            )
          );
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image for conversion: ${imagePath}`));
      };

      if (!imagePath.startsWith("blob:") && !imagePath.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }

      img.src = imagePath;
    });
  }

  convertImageElementToBase64(imgElement, imagePath) {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgElement, 0, 0);

      const dataURL = canvas.toDataURL("image/png");

      if (!dataURL || dataURL === "data:,") {
        throw new Error("Canvas conversion resulted in empty data URL");
      }

      return dataURL;
    } catch (error) {
      throw new Error(
        `Canvas conversion failed for ${imagePath}: ${error.message}`
      );
    }
  }

  async createImageRegistry(project) {
    const imagePaths = this.collectAllImagePaths(project);
    const imageRegistry = new Map();
    const imageIdCounter = { value: 1 };

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];

      try {
        const base64Data = await this.convertImageToBase64(imagePath);
        const imageId = `img_${imageIdCounter.value++}`;

        imageRegistry.set(imagePath, {
          id: imageId,
          data: base64Data,
        });
      } catch (error) {
        throw new Error(
          `Failed to process image for registry: ${error.message}`
        );
      }
    }

    return imageRegistry;
  }

  replaceImagePathsWithRegistryIds(project, imageRegistry) {
    const optimizedProject = JSON.parse(JSON.stringify(project));

    Object.values(optimizedProject.scenes).forEach((scene) => {
      if (scene.background && imageRegistry.has(scene.background)) {
        scene.background = `#${imageRegistry.get(scene.background).id}`;
      }

      if (scene.images) {
        scene.images.forEach((imageData) => {
          if (imageRegistry.has(imageData.src)) {
            imageData.src = `#${imageRegistry.get(imageData.src).id}`;
          }
        });
      }

      if (scene.choices) {
        scene.choices.forEach((choice) => {
          if (
            choice.displayMode === "graphic" &&
            choice.graphic &&
            imageRegistry.has(choice.graphic)
          ) {
            choice.graphic = `#${imageRegistry.get(choice.graphic).id}`;
          }
        });
      }
    });

    return optimizedProject;
  }

  async exportInteractiveStory(filename) {
    try {
      const project = this.editor.projectManager.getProject();

      const exportBtn = document.getElementById("export-story");
      const originalText = exportBtn.innerHTML;
      exportBtn.innerHTML =
        '<span class="btn-icon">⏳</span>Creating Image Registry...';
      exportBtn.disabled = true;

      const imageRegistry = await this.createImageRegistry(project);

      exportBtn.innerHTML =
        '<span class="btn-icon">📦</span>Optimizing Project...';

      const optimizedProject = this.replaceImagePathsWithRegistryIds(
        project,
        imageRegistry
      );

      exportBtn.innerHTML =
        '<span class="btn-icon">📦</span>Generating Export...';

      const htmlContent = this.generateInteractiveStoryHTML(
        optimizedProject,
        imageRegistry
      );

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const originalSize = JSON.stringify(project).length;
      const optimizedSize = htmlContent.length;

      exportBtn.innerHTML = originalText;
      exportBtn.disabled = false;
    } catch (error) {
      const exportBtn = document.getElementById("export-story");
      exportBtn.innerHTML = '<span class="btn-icon">📦</span>Export Story';
      exportBtn.disabled = false;

      this.editor.showWarning(`Export failed: ${error.message}`);
    }
  }

  generateInteractiveStoryHTML(project, imageRegistry) {
    const registryData = {};
    imageRegistry.forEach((imageInfo, originalPath) => {
      registryData[imageInfo.id] = imageInfo.data;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.metadata.title || "Interactive Story"}</title>
    <style>
        ${this.getExportedCSS(project)}
    </style>
</head>
<body>
    <div id="story-container">
        <div id="story-scene" class="story-scene">
            <div class="loading-message">Loading story...</div>
        </div>
    </div>
    
    <script>
        const STORY_DATA = ${JSON.stringify(project, null, 2)};
        const IMAGE_REGISTRY = ${JSON.stringify(registryData, null, 2)};
        
        ${this.getExportedJavaScript()}
    </script>
</body>
</html>`;
  }

  getExportedCSS(project) {
    const dimensions = project.defaults?.sceneDimensions || {
      width: 960,
      height: 720,
    };
    const buttonColors = project.defaults?.buttonColors || {};
    const choiceColors = buttonColors.choiceButton || {
      background: "#e74c3c",
      backgroundHover: "#c0392b",
      text: "#ffffff",
    };
    const continueColors = buttonColors.continueButton || {
      background: "#3498db",
      backgroundHover: "#2980b9",
      text: "#ffffff",
    };

    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #2c3e50, #3498db);
    color: #ecf0f1;
    height: 100vh;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
}

#story-container {
    width: 90%;
    height: 90%;
    max-width: ${dimensions.width}px;
    max-height: ${dimensions.height}px;
    position: relative;
}

.story-scene {
    width: 100%;
    height: 100%;
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    border: 2px solid #34495e;
    overflow: hidden;
    backdrop-filter: blur(2px);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.loading-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #7f8c8d;
    font-size: 18px;
    text-align: center;
}

.story-object {
    position: absolute;
    z-index: 10;
    transform: translate(-50%, -50%);
    will-change: transform, opacity;
    backface-visibility: hidden;
    transition: all var(--animation-duration, 1000ms) var(--animation-easing, ease-in-out) var(--animation-delay, 0ms);
}

.story-object img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
}

.story-object.placeholder {
    background: #7f8c8d;
    border: 2px dashed #95a5a6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    min-width: 60px;
    min-height: 40px;
}

.story-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.story-text-content {
    position: absolute;
    text-align: center;
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 8px;
    max-width: 80%;
    font-size: 18px;
    line-height: 1.6;
    z-index: 100;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    color: white;
    user-select: none;
    transform: translate(-50%, -50%);
}

.story-continue-button {
    position: absolute;
    padding: 12px 24px;
    background: ${continueColors.background};
    color: ${continueColors.text};
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    z-index: 200;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    user-select: none;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
}

.story-continue-button:hover {
    background: ${continueColors.backgroundHover};
    transform: translate(-50%, -50%) translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.5);
}

.story-choice-button {
    position: absolute;
    padding: 12px 20px;
    background: ${choiceColors.background};
    color: ${choiceColors.text};
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    text-align: center;
    white-space: normal;
    word-wrap: break-word;
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
    user-select: none;
    z-index: 200;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
}

.story-choice-button:hover {
    background: ${choiceColors.backgroundHover};
    transform: translate(-50%, -50%) translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.5);
}

.story-choice-button.text-choice {
    background: ${choiceColors.background};
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.story-choice-button.text-choice:hover {
    background: ${choiceColors.backgroundHover};
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.5);
}

.story-choice-button.graphic-choice {
    background: none;
    border: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    filter: none;
    transition: filter 0.2s;
}

.story-choice-button.graphic-choice:hover {
    filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
    transform: translate(-50%, -50%) translateY(-1px);
}

.story-choice-button.missing-graphic {
    background: #7f8c8d;
    border: 2px dashed #bdc3c7;
    color: white;
    font-weight: bold;
    width: 100px;
    height: 40px;
    font-size: 12px;
}

.story-choice-button.missing-graphic:hover {
    background: #95a5a6;
}

@media (max-width: 768px) {
    #story-container {
        width: 95%;
        height: 95%;
    }
    
    .story-text-content {
        font-size: 16px;
        padding: 12px 16px;
    }
    
    .story-choice-button, 
    .story-continue-button {
        font-size: 14px;
        padding: 10px 16px;
    }
}
`;
  }

  getExportedJavaScript() {
    return `
class StoryRuntime {
    constructor(storyData, imageRegistry) {
        this.storyData = storyData;
        this.imageRegistry = imageRegistry;
        this.storyContainer = document.getElementById('story-scene');
        this.imageCache = new Map();
        this.animationQueue = [];
        
        // Find the first available scene ID
        this.currentSceneId = this.findFirstSceneId();
        
        this.init();
    }
    
    findFirstSceneId() {
        // Try "1" first as that's the expected default
        if (this.storyData.scenes && this.storyData.scenes["1"]) {
            return "1";
        }
        
        // Otherwise find the first available scene key
        const sceneKeys = Object.keys(this.storyData.scenes || {});
        if (sceneKeys.length > 0) {
            console.log('Scene "1" not found, using first available scene:', sceneKeys[0]);
            return sceneKeys[0];
        }
        
        console.error('No scenes found in story data!');
        return "1"; // fallback
    }
    
    async init() {
        try {
            this.storyContainer.innerHTML = '<div class="loading-message">Loading images...</div>';
            
            // Add comprehensive debugging information
            console.log('Story Runtime initialized');
            console.log('Image registry entries:', Object.keys(this.imageRegistry).length);
            console.log('Story data structure:', this.storyData);
            console.log('Available scene keys:', Object.keys(this.storyData.scenes || {}));
            console.log('Looking for scene ID:', this.currentSceneId);
            console.log('Scene exists?', !!this.storyData.scenes[this.currentSceneId]);
            
            if (Object.keys(this.imageRegistry).length === 0) {
                console.log('No images to preload, proceeding to render scene');
                this.renderScene(this.currentSceneId);
                return;
            }
            
            await this.preloadAllImagesFromRegistry();
            console.log('All images preloaded successfully');
            this.renderScene(this.currentSceneId);
        } catch (error) {
            console.error('Failed to initialize story runtime:', error);
            this.storyContainer.innerHTML = '<div class="loading-message" style="color: #e74c3c;">Error loading story: ' + error.message + '</div>';
        }
    }
    
    async preloadAllImagesFromRegistry() {
        const imageEntries = Object.entries(this.imageRegistry);
        console.log('Preloading', imageEntries.length, 'images');
        
        if (imageEntries.length === 0) {
            return;
        }
        
        const loadPromises = imageEntries.map(([imageId, base64Data]) => 
            this.preloadImageFromRegistry(imageId, base64Data)
        );
        
        const results = await Promise.all(loadPromises);
        
        // Check for any failed loads
        const failedLoads = results.filter(result => result === null);
        if (failedLoads.length > 0) {
            console.warn('Some images failed to load:', failedLoads.length, 'out of', results.length);
        }
        
        console.log('Image preloading completed. Loaded:', results.filter(r => r !== null).length, 'Failed:', failedLoads.length);
    }
    
    preloadImageFromRegistry(imageId, base64Data) {
        return new Promise((resolve) => {
            if (this.imageCache.has(imageId)) {
                resolve(this.imageCache.get(imageId));
                return;
            }
            
            // Validate base64 data
            if (!base64Data || !base64Data.startsWith('data:image/')) {
                console.error('Invalid base64 data for image:', imageId, base64Data ? base64Data.substring(0, 50) + '...' : 'null');
                this.imageCache.set(imageId, null);
                resolve(null);
                return;
            }
            
            const img = document.createElement('img');
            
            img.onload = () => {
                try {
                    img.style.position = 'absolute';
                    img.style.top = '0';
                    img.style.left = '0';
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                    img.style.objectFit = 'contain';
                    img.style.pointerEvents = 'none';
                    
                    const clonedImg = img.cloneNode();
                    this.imageCache.set(imageId, clonedImg);
                    console.log('Successfully loaded image:', imageId);
                    resolve(clonedImg);
                } catch (error) {
                    console.error('Error processing loaded image:', imageId, error);
                    this.imageCache.set(imageId, null);
                    resolve(null);
                }
            };
            
            img.onerror = (error) => {
                console.error('Failed to load image:', imageId, error);
                this.imageCache.set(imageId, null);
                resolve(null);
            };
            
            // Set source and trigger load
            try {
                img.src = base64Data;
                img.alt = 'Story Asset';
            } catch (error) {
                console.error('Error setting image source:', imageId, error);
                this.imageCache.set(imageId, null);
                resolve(null);
            }
        });
    }
    
    resolveImageReference(imageSrc) {
        if (imageSrc.startsWith('#')) {
            const imageId = imageSrc.substring(1);
            const cachedImage = this.imageCache.get(imageId);
            if (!cachedImage) {
                console.warn('Image not found in cache:', imageId);
            }
            return cachedImage;
        }
        
        return this.loadImageDirect(imageSrc);
    }
    
    loadImageDirect(src) {
        if (this.imageCache.has(src)) {
            return this.imageCache.get(src);
        }
        
        const img = document.createElement('img');
        img.src = src;
        this.imageCache.set(src, img);
        return img;
    }
    
    async renderScene(sceneId) {
        const scene = this.storyData.scenes[sceneId];
        if (!scene) {
            console.error('Scene not found:', sceneId);
            console.log('Available scenes:', Object.keys(this.storyData.scenes || {}));
            console.log('Story data structure:', this.storyData);
            
            // Try to find any available scene as fallback
            const availableScenes = Object.keys(this.storyData.scenes || {});
            if (availableScenes.length > 0) {
                console.log('Attempting to render first available scene:', availableScenes[0]);
                this.renderScene(availableScenes[0]);
                return;
            }
            
            this.storyContainer.innerHTML = '<div class="loading-message" style="color: #e74c3c;">Error: No scenes found in story data</div>';
            return;
        }
        
        console.log('Rendering scene:', sceneId);
        this.currentSceneId = sceneId;
        this.storyContainer.innerHTML = '';
        
        this.setBackground(scene);
        this.addOverlay(scene);
        await this.addImages(scene);
        this.addTextContent(scene);
        this.addButtons(scene);
        
        // Start animations
        this.runAnimations();
    }
    
    setBackground(scene) {
        if (scene.background) {
            if (scene.background.startsWith('#')) {
                const imageId = scene.background.substring(1);
                const base64Data = this.imageRegistry[imageId];
                if (base64Data) {
                    this.storyContainer.style.backgroundImage = \`url('\${base64Data}')\`;
                } else {
                    console.warn('Background image not found in registry:', imageId);
                    this.storyContainer.style.backgroundImage = 'none';
                }
            } else {
                this.storyContainer.style.backgroundImage = \`url('\${scene.background}')\`;
            }
        } else {
            this.storyContainer.style.backgroundImage = 'none';
        }
    }
    
    addOverlay(scene) {
        if (!scene.overlay) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'story-overlay';
        overlay.style.backgroundColor = scene.overlay.color;
        overlay.style.opacity = scene.overlay.opacity;
        overlay.style.zIndex = scene.overlay.zIndex;
        this.storyContainer.appendChild(overlay);
    }
    
    async addImages(scene) {
        if (!scene.images) return;
        
        for (const imageData of scene.images) {
            const objElement = await this.createImageElement(imageData);
            this.storyContainer.appendChild(objElement);
        }
    }
    
    async createImageElement(imageData) {
        const objElement = document.createElement('div');
        objElement.className = 'story-object';
        
        // Apply animation timing
        const timing = imageData.animationTiming || this.storyData.defaults?.animationTiming || { duration: 1000, delay: 0, easing: 'ease-in-out' };
        objElement.style.setProperty('--animation-duration', timing.duration + 'ms');
        objElement.style.setProperty('--animation-delay', timing.delay + 'ms');
        objElement.style.setProperty('--animation-easing', timing.easing);
        
        const img = this.resolveImageReference(imageData.src);
        if (img) {
            const imgClone = img.cloneNode();
            objElement.style.width = img.naturalWidth + 'px';
            objElement.style.height = img.naturalHeight + 'px';
            objElement.appendChild(imgClone);
        } else {
            objElement.className += ' placeholder';
            objElement.style.width = '60px';
            objElement.style.height = '40px';
            objElement.textContent = 'placeholder';
        }
        
        // Handle flipped objects
        const flipTransform = imageData.flipped ? 'scaleX(-1)' : '';
        const baseTransform = \`translate(-50%, -50%) scale(\${imageData.scale || 1}) rotate(\${imageData.rotation || 0}deg)\`;
        const finalTransform = flipTransform ? \`\${baseTransform} \${flipTransform}\` : baseTransform;
        
        objElement.style.left = imageData.x + '%';
        objElement.style.top = imageData.y + '%';
        objElement.style.transform = finalTransform;
        objElement.style.zIndex = imageData.zIndex || 1;
        objElement.style.opacity = imageData.opacity !== undefined ? imageData.opacity : 1;
        
        // Set up animations
        if (imageData.effect) {
            this.setupObjectAnimation(objElement, imageData);
        }
        
        return objElement;
    }
    
    setupObjectAnimation(objElement, imageData) {
        switch (imageData.effect) {
            case 'fade_in':
                objElement.style.opacity = '0';
                this.animationQueue.push(() => {
                    objElement.style.opacity = imageData.opacity !== undefined ? imageData.opacity : 1;
                });
                break;
            case 'fade_out':
                this.animationQueue.push(() => {
                    objElement.style.opacity = '0';
                });
                break;
            case 'slide_to':
                const startX = imageData.moveStartX !== undefined ? imageData.moveStartX : imageData.x;
                const startY = imageData.moveStartY !== undefined ? imageData.moveStartY : imageData.y;
                const endX = imageData.moveEndX !== undefined ? imageData.moveEndX : imageData.x;
                const endY = imageData.moveEndY !== undefined ? imageData.moveEndY : imageData.y;
                
                objElement.style.left = startX + '%';
                objElement.style.top = startY + '%';
                
                this.animationQueue.push(() => {
                    objElement.style.left = endX + '%';
                    objElement.style.top = endY + '%';
                });
                break;
            case 'scale_to':
                const startScale = imageData.scaleStart !== undefined ? imageData.scaleStart : imageData.scale;
                const endScale = imageData.scaleEnd !== undefined ? imageData.scaleEnd : imageData.scale;
                
                const flipTransform = imageData.flipped ? 'scaleX(-1)' : '';
                const initialTransform = \`translate(-50%, -50%) scale(\${startScale}) rotate(\${imageData.rotation || 0}deg)\`;
                const finalTransform = \`translate(-50%, -50%) scale(\${endScale}) rotate(\${imageData.rotation || 0}deg)\`;
                
                objElement.style.transform = flipTransform ? \`\${initialTransform} \${flipTransform}\` : initialTransform;
                
                this.animationQueue.push(() => {
                    objElement.style.transform = flipTransform ? \`\${finalTransform} \${flipTransform}\` : finalTransform;
                });
                break;
        }
    }
    
    runAnimations() {
        this.animationQueue.forEach((animation, index) => {
            setTimeout(() => animation(), index * 100);
        });
        this.animationQueue = [];
    }
    
    addTextContent(scene) {
        if (!scene.content) return;
        
        const textContent = document.createElement('div');
        textContent.className = 'story-text-content';
        textContent.textContent = scene.content;
        
        const textPos = scene.uiPositions.textContent;
        textContent.style.left = textPos.x + '%';
        textContent.style.top = textPos.y + '%';
        textContent.style.width = textPos.width + '%';
        
        this.storyContainer.appendChild(textContent);
    }
    
    addButtons(scene) {
        if (scene.type === 'choice' && scene.choices && scene.choices.length > 0) {
            this.addChoiceButtons(scene);
        } else if (scene.type === 'image' && scene.nextScene !== undefined && scene.nextScene !== null) {
            this.addContinueButton(scene);
        }
    }
    
    async addChoiceButtons(scene) {
        for (let i = 0; i < scene.choices.length; i++) {
            const choice = scene.choices[i];
            const choiceElement = await this.createChoiceElement(choice, i);
            this.storyContainer.appendChild(choiceElement);
        }
    }
    
    async createChoiceElement(choice, index) {
        const choiceElement = document.createElement('button');
        choiceElement.className = 'story-choice-button';
        
        const choicePos = choice.position;
        choiceElement.style.left = choicePos.x + '%';
        choiceElement.style.top = choicePos.y + '%';
        choiceElement.style.width = choicePos.width + '%';
        
        if (choice.displayMode === 'graphic' && choice.graphic) {
            await this.setupGraphicChoice(choiceElement, choice);
        } else {
            this.setupTextChoice(choiceElement, choice);
        }
        
        choiceElement.addEventListener('click', () => {
            this.handleChoiceClick(choice);
        });
        
        return choiceElement;
    }
    
    async setupGraphicChoice(choiceElement, choice) {
        choiceElement.classList.add('graphic-choice');
        const graphicProps = choice.graphicProperties;
        
        const img = this.resolveImageReference(choice.graphic);
        if (img) {
            const imgClone = img.cloneNode();
            
            // Handle flipped graphic choices
            const flipTransform = graphicProps.flipped ? 'scaleX(-1)' : '';
            const baseTransform = \`translate(-50%, -50%) scale(\${graphicProps.scale}) rotate(\${graphicProps.rotation}deg)\`;
            const finalTransform = flipTransform ? \`\${baseTransform} \${flipTransform}\` : baseTransform;
            
            choiceElement.style.width = img.naturalWidth + 'px';
            choiceElement.style.height = img.naturalHeight + 'px';
            choiceElement.style.transform = finalTransform;
            choiceElement.style.opacity = graphicProps.opacity !== undefined ? graphicProps.opacity : 1;
            choiceElement.style.zIndex = graphicProps.zIndex;
            choiceElement.appendChild(imgClone);
        } else {
            choiceElement.classList.add('missing-graphic');
            choiceElement.textContent = 'graphic missing';
        }
    }
    
    setupTextChoice(choiceElement, choice) {
        choiceElement.classList.add('text-choice');
        choiceElement.textContent = choice.text;
    }
    
    addContinueButton(scene) {
        const continueBtn = document.createElement('button');
        continueBtn.className = 'story-continue-button';
        continueBtn.textContent = 'Continue';
        
        const buttonPos = scene.uiPositions.buttonsContainer;
        continueBtn.style.left = buttonPos.x + '%';
        continueBtn.style.top = buttonPos.y + '%';
        continueBtn.style.width = buttonPos.width + '%';
        
        continueBtn.addEventListener('click', () => {
            this.handleContinueClick(scene);
        });
        
        this.storyContainer.appendChild(continueBtn);
    }
    
    handleChoiceClick(choice) {
        if (choice.nextScene && this.storyData.scenes[choice.nextScene]) {
            this.renderScene(choice.nextScene);
        }
    }
    
    handleContinueClick(scene) {
        if (scene.nextScene && this.storyData.scenes[scene.nextScene]) {
            this.renderScene(scene.nextScene);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StoryRuntime(STORY_DATA, IMAGE_REGISTRY);
});
`;
  }

  refreshUIComponents() {
    requestAnimationFrame(() => {
      this.refreshSceneList();
      this.editor.assetManager.refreshAssetLists();
      this.updateSceneDropdowns();
    });
  }

  refreshSceneList() {
    const project = this.editor.projectManager.getProject();
    this.editor.sceneManager.refreshSceneList(project);
  }

  updateSceneDropdowns() {
    const project = this.editor.projectManager.getProject();
    const backgrounds = this.editor.assetManager.getBackgrounds();
    this.editor.uiManager.updateSceneDropdowns(backgrounds, project);
  }
}
