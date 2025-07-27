class CreditsGallery {
  constructor() {
    this.modal = null;
    this.container = null;
    this.content = null;
    this.detailView = null;
    this.currentFilter = "all";
    this.currentPerson = null;
    this.creditsList = [];
    this.filteredCredits = [];
    this.currentIndex = 0;
    this.eventListeners = new Map();
    this.preloadedImages = [];

    this.CSS_CLASSES = {
      MODAL: "credits-gallery-modal",
      CONTAINER: "credits-gallery-container",
      HEADER: "credits-gallery-header",
      TITLE: "credits-gallery-title",
      CLOSE: "credits-gallery-close",
      CONTENT: "credits-gallery-content",
      DETAIL_VIEW: "credits-detail-view",
      FILTERS: "credits-gallery-filters",
      FILTER_BTN: "credits-filter-btn",
      GRID: "credits-grid",
      CARD: "credits-card",
      CARD_IMAGE: "credits-card-image",
      CARD_NAME: "credits-card-name",
      CARD_TITLE: "credits-card-title",
      CARD_DEPARTMENT: "credits-card-department",
      DETAIL_BACK: "credits-detail-back",
      DETAIL_LEFT: "credits-detail-left",
      DETAIL_RIGHT: "credits-detail-right",
      DETAIL_IMAGE: "credits-detail-image",
      DETAIL_NAME: "credits-detail-name",
      DETAIL_TITLE: "credits-detail-title",
      DETAIL_DEPARTMENT: "credits-detail-department",
      DETAIL_DESCRIPTION: "credits-detail-description",
      NAVIGATION: "credits-navigation",
      NAV_BTN: "credits-nav-btn",
      ACTIVE: "active",
    };

    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeGallery();
      });
    } else {
      this.initializeGallery();
    }
  }

  initializeGallery() {
    this.createModalStructure();
    this.setupEventListeners();
    this.loadCredits();
  }

  createModalStructure() {
    this.modal = this.createElement("div", this.CSS_CLASSES.MODAL);
    this.container = this.createElement("div", this.CSS_CLASSES.CONTAINER);

    const header = this.createHeader();
    this.content = this.createElement("div", this.CSS_CLASSES.CONTENT);
    this.detailView = this.createElement("div", this.CSS_CLASSES.DETAIL_VIEW);

    this.container.appendChild(header);
    this.container.appendChild(this.content);
    this.container.appendChild(this.detailView);
    this.modal.appendChild(this.container);
    document.body.appendChild(this.modal);
  }

  createElement(tag, className) {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  }

  createHeader() {
    const header = this.createElement("div", this.CSS_CLASSES.HEADER);
    header.innerHTML = `
      <h2 class="${this.CSS_CLASSES.TITLE}">Pancake Tower Credits</h2>
      <div class="credits-company">
      <h4>Company: Weird Demon Games</h4>
      <img class='credits-logo' src="images/company-logo.png">
      </div>
      <button class="${this.CSS_CLASSES.CLOSE}">×</button>
    `;
    return header;
  }

  setupEventListeners() {
    this.addEventListenerWithCleanup(
      this.modal.querySelector(`.${this.CSS_CLASSES.CLOSE}`),
      "click",
      () => this.closeGallery()
    );

    this.addEventListenerWithCleanup(this.modal, "click", (e) => {
      if (e.target === this.modal) {
        this.closeGallery();
      }
    });

    this.addEventListenerWithCleanup(document, "keydown", (e) =>
      this.handleKeydown(e)
    );
  }

  addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);

    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler });
  }

  handleKeydown(e) {
    if (!this.modal.classList.contains(this.CSS_CLASSES.ACTIVE)) return;

    const keyActions = {
      Escape: () => this.handleEscape(),
      ArrowLeft: () => this.handleArrowKey("left"),
      ArrowRight: () => this.handleArrowKey("right"),
    };

    const action = keyActions[e.key];
    if (action) action();
  }

  handleEscape() {
    if (this.detailView.classList.contains(this.CSS_CLASSES.ACTIVE)) {
      this.closeDetailView();
    } else {
      this.closeGallery();
    }
  }

  handleArrowKey(direction) {
    if (this.detailView.classList.contains(this.CSS_CLASSES.ACTIVE)) {
      direction === "left" ? this.navigatePerson(-1) : this.navigatePerson(1);
    }
  }

  loadCredits() {
    this.creditsList = Object.entries(CREDITS).map(([key, data]) => ({
      id: key,
      ...data,
    }));
    this.filteredCredits = [...this.creditsList];
  }

  openGallery() {
    this.renderGallery();
    this.modal.classList.add(this.CSS_CLASSES.ACTIVE);
    document.body.style.overflow = "hidden";
  }

  closeGallery() {
    this.modal.classList.remove(this.CSS_CLASSES.ACTIVE);
    this.closeDetailView();
    document.body.style.overflow = "";
  }

  renderGallery() {
    const departments = ["all", ...getAllDepartments()];

    this.content.innerHTML = `
      <div class="${this.CSS_CLASSES.FILTERS}">
        ${this.renderFilterButtons(departments)}
      </div>
      <div class="${this.CSS_CLASSES.GRID}" id="credits-grid">
        ${this.renderCreditsGrid()}
      </div>
    `;

    this.setupFilterListeners();
    this.setupCreditsListeners();
  }

  renderFilterButtons(departments) {
    return departments
      .map(
        (dept) => `
        <button class="${this.CSS_CLASSES.FILTER_BTN} ${
          dept === this.currentFilter ? this.CSS_CLASSES.ACTIVE : ""
        }" 
                data-filter="${dept}">
          ${dept === "all" ? "All Team Members" : dept}
        </button>
      `
      )
      .join("");
  }

  renderCreditsGrid() {
    return this.filteredCredits
      .map(
        (person) => `
        <div class="${this.CSS_CLASSES.CARD}" data-person="${person.id}">
          <img src="${person.previewImage}" alt="${person.name}" class="${this.CSS_CLASSES.CARD_IMAGE}" />
          <h3 class="${this.CSS_CLASSES.CARD_NAME}">${person.name}</h3>
          <p class="${this.CSS_CLASSES.CARD_TITLE}">${person.jobTitle}</p>
          <p class="${this.CSS_CLASSES.CARD_DEPARTMENT}">${person.department}</p>
        </div>
      `
      )
      .join("");
  }

  setupFilterListeners() {
    this.content
      .querySelectorAll(`.${this.CSS_CLASSES.FILTER_BTN}`)
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.setFilter(e.target.dataset.filter);
        });
      });
  }

  setupCreditsListeners() {
    this.content
      .querySelectorAll(`.${this.CSS_CLASSES.CARD}`)
      .forEach((card) => {
        card.addEventListener("click", (e) => {
          this.showPersonDetail(e.currentTarget.dataset.person);
        });
      });
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.filteredCredits =
      filter === "all"
        ? [...this.creditsList]
        : this.creditsList.filter((person) => person.department === filter);
    this.renderGallery();
  }

  showPersonDetail(personId) {
    const person = this.creditsList.find((p) => p.id === personId);
    if (!person) return;

    this.currentPerson = person;
    this.currentIndex = this.filteredCredits.findIndex(
      (p) => p.id === personId
    );

    this.detailView.innerHTML = this.renderPersonDetail(person);
    this.setupDetailListeners();
    this.detailView.classList.add(this.CSS_CLASSES.ACTIVE);
  }

  renderPersonDetail(person) {
    return `
      <button class="${this.CSS_CLASSES.DETAIL_BACK}">←</button>
      <div class="${this.CSS_CLASSES.DETAIL_LEFT}">
        <img src="${person.fullImage}" alt="${person.name}" class="${
      this.CSS_CLASSES.DETAIL_IMAGE
    }" />
      </div>
      <div class="${this.CSS_CLASSES.DETAIL_RIGHT}">
        <h2 class="${this.CSS_CLASSES.DETAIL_NAME}">${person.name}</h2>
        <p class="${this.CSS_CLASSES.DETAIL_TITLE}">${person.jobTitle}</p>
        <p class="${this.CSS_CLASSES.DETAIL_DEPARTMENT}">${
      person.department
    }</p>
        <p class="${this.CSS_CLASSES.DETAIL_DESCRIPTION}">${
      person.description
    }</p>
      </div>
      <div class="${this.CSS_CLASSES.NAVIGATION}">
        ${this.renderNavigationButtons()}
      </div>
    `;
  }

  renderNavigationButtons() {
    return `
      <button class="${this.CSS_CLASSES.NAV_BTN}" id="prev-person" ${
      this.currentIndex === 0 ? "disabled" : ""
    }>
        ← Previous
      </button>
      <button class="${this.CSS_CLASSES.NAV_BTN}" id="next-person" ${
      this.currentIndex === this.filteredCredits.length - 1 ? "disabled" : ""
    }>
        Next →
      </button>
    `;
  }

  setupDetailListeners() {
    const buttonSelectors = [
      {
        selector: `.${this.CSS_CLASSES.DETAIL_BACK}`,
        action: () => this.closeDetailView(),
      },
      { selector: "#prev-person", action: () => this.navigatePerson(-1) },
      { selector: "#next-person", action: () => this.navigatePerson(1) },
    ];

    buttonSelectors.forEach(({ selector, action }) => {
      const button = this.detailView.querySelector(selector);
      if (button) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          action();
        });
      }
    });
  }

  closeDetailView() {
    this.detailView.classList.remove(this.CSS_CLASSES.ACTIVE);
    this.currentPerson = null;
  }

  navigatePerson(direction) {
    const newIndex = this.currentIndex + direction;
    if (newIndex >= 0 && newIndex < this.filteredCredits.length) {
      this.currentIndex = newIndex;
      const person = this.filteredCredits[this.currentIndex];
      this.showPersonDetail(person.id);
    }
  }

  previousPerson() {
    this.navigatePerson(-1);
  }

  nextPerson() {
    this.navigatePerson(1);
  }

  preloadCreditsImages() {
    this.cleanupPreloadedImages();
    this.creditsList.forEach((person) => {
      const previewImg = new Image();
      const fullImg = new Image();
      previewImg.src = person.previewImage;
      fullImg.src = person.fullImage;
      this.preloadedImages.push(previewImg, fullImg);
    });
  }

  cleanupPreloadedImages() {
    this.preloadedImages = [];
  }

  refresh() {
    this.loadCredits();
    if (this.modal.classList.contains(this.CSS_CLASSES.ACTIVE)) {
      this.renderGallery();
    }
  }

  cleanupEventListeners() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }

  destroy() {
    this.cleanupEventListeners();
    this.cleanupPreloadedImages();

    if (this.modal) {
      this.modal.remove();
    }

    const creditsBtn = document.querySelector(".credits-gallery-button");
    if (creditsBtn) {
      creditsBtn.remove();
    }

    document.body.style.overflow = "";
  }
}
