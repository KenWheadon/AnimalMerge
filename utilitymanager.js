const utilityManager = {
  eventListenerRegistry: new Map(),
  intervalRegistry: new Map(),
  timeoutRegistry: new Map(),

  addEventListener(element, event, handler, identifier) {
    element.addEventListener(event, handler);

    if (!this.eventListenerRegistry.has(identifier)) {
      this.eventListenerRegistry.set(identifier, []);
    }
    this.eventListenerRegistry.get(identifier).push({
      element,
      event,
      handler,
    });
  },

  removeEventListeners(identifier) {
    const listeners = this.eventListenerRegistry.get(identifier);
    if (listeners) {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this.eventListenerRegistry.delete(identifier);
    }
  },

  setInterval(callback, delay, identifier) {
    const intervalId = setInterval(callback, delay);
    this.intervalRegistry.set(identifier, intervalId);
    return intervalId;
  },

  clearInterval(identifier) {
    const intervalId = this.intervalRegistry.get(identifier);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalRegistry.delete(identifier);
    }
  },

  setTimeout(callback, delay, identifier) {
    const timeoutId = setTimeout(() => {
      callback();
      this.timeoutRegistry.delete(identifier);
    }, delay);
    this.timeoutRegistry.set(identifier, timeoutId);
    return timeoutId;
  },

  clearTimeout(identifier) {
    const timeoutId = this.timeoutRegistry.get(identifier);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutRegistry.delete(identifier);
    }
  },

  cleanup() {
    this.eventListenerRegistry.forEach((listeners) => {
      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListenerRegistry.clear();

    this.intervalRegistry.forEach((intervalId) => clearInterval(intervalId));
    this.intervalRegistry.clear();

    this.timeoutRegistry.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timeoutRegistry.clear();
  },

  createElement(tag, className, innerHTML = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  },

  generateButtonHTML(id, className, text, iconSrc = null, hidden = false) {
    const hiddenClass = hidden ? "hidden" : "";
    const icon = iconSrc
      ? `<img src="${iconSrc}" alt="${text}" class="inline-animal-icon" />`
      : "";
    return `
      <button id="${id}" class="${className} ${hiddenClass}">
        <span>${text}</span>${icon}
      </button>
    `;
  },

  createTooltip(content, targetElement, id) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const tooltip = this.createElement("div", "tooltip-fixed", content);
    tooltip.id = id;
    document.body.appendChild(tooltip);

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = targetRect.left - tooltipRect.width - 10;
    let top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) {
      left = targetRect.right + 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    if (top < 10) {
      top = 10;
    } else if (top + tooltipRect.height > viewportHeight - 10) {
      top = viewportHeight - tooltipRect.height - 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    return tooltip;
  },

  removeTooltip(id) {
    const tooltip = document.getElementById(id);
    if (tooltip) tooltip.remove();
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  },

  randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  },

  removeElementsByClass(className) {
    const elements = document.querySelectorAll(`.${className}`);
    elements.forEach((element) => element.remove());
  },

  addScreenShake() {
    document.body.classList.add("screen-shake");
    this.setTimeout(
      () => document.body.classList.remove("screen-shake"),
      500,
      "screenShake"
    );
  },
};
