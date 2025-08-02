class ModalManager {
  constructor() {
    this.modalElement = null;
    this.eventListeners = [];
    this.MODAL_IDS = {
      WARNING: "warning-modal",
      NEW_SCENARIO: "new-scenario-modal",
      RESET_ALL_POSITIONS: "reset-all-positions-modal",
      EXPORT_FILENAME: "export-filename-modal",
    };
  }

  setupEventListeners() {
    const listeners = [
      [
        "new-scenario",
        "click",
        () => this.showModal(this.MODAL_IDS.NEW_SCENARIO),
      ],
      [
        "new-scenario-close",
        "click",
        () => this.hideModal(this.MODAL_IDS.NEW_SCENARIO),
      ],
      ["confirm-new-scenario", "click", () => this.confirmNewScenario()],
      [
        "cancel-new-scenario",
        "click",
        () => this.hideModal(this.MODAL_IDS.NEW_SCENARIO),
      ],
      [
        "reset-all-positions-close",
        "click",
        () => this.hideModal(this.MODAL_IDS.RESET_ALL_POSITIONS),
      ],
      [
        "confirm-reset-all-positions",
        "click",
        () => this.confirmResetAllPositions(),
      ],
      [
        "cancel-reset-all-positions",
        "click",
        () => this.hideModal(this.MODAL_IDS.RESET_ALL_POSITIONS),
      ],
      ["export-story", "click", () => this.showExportModal()],
      [
        "export-filename-close",
        "click",
        () => this.hideModal(this.MODAL_IDS.EXPORT_FILENAME),
      ],
      ["confirm-export", "click", () => this.confirmExport()],
      [
        "cancel-export",
        "click",
        () => this.hideModal(this.MODAL_IDS.EXPORT_FILENAME),
      ],
    ];

    listeners.forEach(([id, event, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener(event, handler);
        this.eventListeners.push([element, event, handler]);
      }
    });

    document.querySelectorAll(".close").forEach((element) => {
      const handler = () => this.hideModal(this.MODAL_IDS.WARNING);
      element.addEventListener("click", handler);
      this.eventListeners.push([element, "click", handler]);
    });

    const windowHandler = (e) => {
      Object.values(this.MODAL_IDS).forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal && e.target === modal) {
          this.hideModal(modalId);
        }
      });
    };

    window.addEventListener("click", windowHandler);
    this.eventListeners.push([window, "click", windowHandler]);

    const exportInput = document.getElementById("export-filename-input");
    if (exportInput) {
      const enterHandler = (e) => {
        if (e.key === "Enter") {
          this.confirmExport();
        }
      };
      exportInput.addEventListener("keydown", enterHandler);
      this.eventListeners.push([exportInput, "keydown", enterHandler]);
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "block";
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
    }
  }

  confirmNewScenario() {
    window.editor.createNewScenario();
    this.hideModal(this.MODAL_IDS.NEW_SCENARIO);
  }

  confirmResetAllPositions() {
    window.positionManager.executeResetAllPositions();
    this.hideModal(this.MODAL_IDS.RESET_ALL_POSITIONS);
  }

  showExportModal() {
    const project = window.editor.projectManager.getProject();
    const suggestedFilename = project.metadata.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    const input = document.getElementById("export-filename-input");
    if (input) {
      input.value = suggestedFilename;
    }

    this.showModal(this.MODAL_IDS.EXPORT_FILENAME);

    setTimeout(() => {
      const input = document.getElementById("export-filename-input");
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  confirmExport() {
    const input = document.getElementById("export-filename-input");
    const filename = input ? input.value.trim() : "";

    if (!filename) {
      alert("Please enter a filename");
      return;
    }

    window.editor.exportInteractiveStory(filename);
    this.hideModal(this.MODAL_IDS.EXPORT_FILENAME);
  }

  showWarning(message) {
    const messageElement = document.getElementById("warning-message");
    if (messageElement) {
      messageElement.textContent = message;
    }
    this.showModal(this.MODAL_IDS.WARNING);
  }

  closeModal() {
    this.hideModal(this.MODAL_IDS.WARNING);
  }

  showResetAllPositionsModal() {
    this.showModal(this.MODAL_IDS.RESET_ALL_POSITIONS);
  }

  destroy() {
    this.eventListeners.forEach(([element, event, handler]) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}
