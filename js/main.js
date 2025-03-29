// Gather Town Emote Overlay
(() => {
  // XXX: Moved from circular-menu.js to main.js because the extension was failing sometimes, saying "CircularMenu is not defined".
  //      Reloading the extension fixes the issue for some reason.
  //      To be safe, keep the code here.
  class CircularMenu {
    constructor($root, getOptions, onSelected) {
      this.$root = $root;
      this.getOptions = getOptions;
      this.options = getOptions();
      this.size = 300;
      this.centerX = 0;
      this.centerY = 0;
      this.isOpen = false;
      this.selectedIndex = null;
      this.onSelected = onSelected;

      this.init();
    }

    init() {
      this.$root.addEventListener('mousedown', this.handleMouseDown.bind(this));
      document.addEventListener('mouseup', this.handleMouseUp.bind(this));
      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseDown(e) {
      // Prevent default to stop text selection
      e.preventDefault();

      // Use left mouse button (button 0)
      if (e.button === 0) {
        this.centerX = e.clientX;
        this.centerY = e.clientY;
        this.isOpen = true;
        this.selectedIndex = null;
        this.renderMenu();
      }
    }

    handleMouseUp() {
      if (this.isOpen) {
        if (this.selectedIndex !== null) {
          const selectedOption = this.options[this.selectedIndex];
          this.onSelected(selectedOption);
        }

        // Always destroy the menu, regardless of selection
        this.destroyMenu();
      }
    }

    destroyMenu() {
      this.isOpen = false;
      this.$root.innerHTML = '';
      this.selectedIndex = null;
    }

    handleMouseMove(e) {
      if (!this.isOpen) return;

      const dx = e.clientX - this.centerX;
      const dy = e.clientY - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 50) {
        this.selectedIndex = null;
        this.renderMenu();
        return;
      }

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) {
        angle += 360;
      }

      const optionAngle = 360 / this.options.length;
      const index = Math.floor(((angle + optionAngle / 2) % 360) / optionAngle);
      this.selectedIndex = index;
      this.renderMenu();
    }

    renderMenu() {
      this.options = this.getOptions();

      this.$root.innerHTML = `
            <div class="menu-container">
                <div class="circular-menu" style="width: ${this.size}px; height: ${this.size}px; left: ${this.centerX - this.size / 2}px; top: ${this.centerY - this.size / 2}px;"></div>
                ${this.renderCenterIndicator()}
                ${this.renderSelectionLine()}
                ${this.renderMenuOptions()}
            </div>
        `;
    }

    renderMenuOptions() {
      return this.options.map((option, index) => {
        const angle = (index * 360) / this.options.length;
        const radian = (angle * Math.PI) / 180;
        const radius = this.size / 2 - 40;
        const x = this.centerX + radius * Math.cos(radian);
        const y = this.centerY + radius * Math.sin(radian);
        const isSelected = index === this.selectedIndex;

        return `
                <div 
                    class="menu-option ${isSelected ? 'selected' : ''}" 
                    style="
                        width: 60px; 
                        height: 60px; 
                        left: ${x - 30}px; 
                        top: ${y - 30}px; 
                        background-color: ${option.color};
                        box-shadow: ${isSelected ? `0 0 15px ${option.color}` : 'none'};
                    "
                >
                    <span style="font-size: 1.5rem;">${option.value}</span>
                </div>
            `;
      }).join('');
    }

    renderCenterIndicator() {
      return `
            <div 
                class="center-indicator" 
                style="
                    width: 4rem; 
                    height: 4rem; 
                    left: ${this.centerX - 32}px; 
                    top: ${this.centerY - 32}px;
                "
            >
                <div class="center-dot"></div>
            </div>
        `;
    }

    renderSelectionLine() {
      if (this.selectedIndex === null) return '';

      return `
            <div 
                class="selection-line" 
                style="
                    width: ${this.size / 2 - 40}px; 
                    left: ${this.centerX}px; 
                    top: ${this.centerY}px; 
                    transform: rotate(${(this.selectedIndex * 360) / this.options.length}deg);
                    transform-origin: left center;
                "
            ></div>
        `;
    }
  }

  const EMOTE_OPTIONS_STORAGE_KEY = 'gather-town-emote-options';
  const DEFAULT_EMOTES_OPTIONS = [
    { value: '💜', color: '#FFF' },
    { value: '👍', color: '#FFF' },
    { value: '👎', color: '#FFF' },
    { value: '😂', color: '#FFF' },
    { value: '😴', color: '#FFF' },
    { value: '⬢', color: '#FFF' },
    { value: 'Ω', color: '#FFF' },
    { value: '🫡', color: '#FFF' },
  ];

  const DEFAULT_EMOTE_TIMEOUT = 3 * 1000;

  function getEmotes() {
    try {
      const optionsJson = localStorage.getItem(EMOTE_OPTIONS_STORAGE_KEY);
      const options = JSON.parse(optionsJson);
      if (!Array.isArray(options)) {
        throw new Error('Invalid payload');
      }
      return options.map(val => ({ value: val, color: '#FFF' }));
    } catch (e) {
      console.error(e);
      return DEFAULT_EMOTES_OPTIONS;
    }
  }

  let $overlay = null;

  // Create and inject CSS styles
  function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .gather-emote-overlay {
        display: none;
        position: fixed;
        z-index: 666;
        top: 0;
        left: 0;
        padding: 0;
        margin: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background-color: rgb(148 0 211 / 0%);
      }

      .gather-emote-overlay.visible {
        display: block;
      }

      /**
       * Circular Menu stuff
       */
      .gather-emote-overlay {

            .menu-container {
                position: fixed;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
            }

            .menu-hint {
                color: #777;
                text-align: center;
            }

            .circular-menu {
                position: absolute;
                background-color: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                border-radius: 50%;
                pointer-events: auto;
            }

            .menu-option {
                position: absolute;
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 50%;
                transition: all 0.15s ease;
                pointer-events: auto;
            }

            .menu-option.selected {
                transform: scale(1.25);
                box-shadow: 0 0 15px;
            }

            .center-indicator {
                position: absolute;
                background-color: #333;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                pointer-events: auto;
            }

            .center-dot {
                width: 0.75rem;
                height: 0.75rem;
                background-color: #ccc;
                border-radius: 50%;
            }

            .selection-line {
                position: absolute;
                background-color: rgba(255, 255, 255, 0.3);
                height: 2px;
                pointer-events: none;
            }
        }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Create main overlay container
   */
  function createOverlay() {
    $overlay = document.createElement('div');
    $overlay.className = 'gather-emote-overlay';
    document.body.appendChild($overlay);
  }

  /**
   * Show or hide the overlay.
   * @param {boolean} isVisible 
   */
  function setOverlayVisible(isVisible) {
    if (isVisible) {
      $overlay.classList.add('visible');
    } else {
      $overlay.classList.remove('visible');
    }
  }

  function setupEventListeners() {
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && getHasEntered()) {
        setOverlayVisible(true);
      }
    });

    document.addEventListener("keyup", (event) => {
      if (!event.ctrlKey) {
        setOverlayVisible(false);
      }
    });

    // Handle case when user switches tabs or windows
    window.addEventListener("blur", () => {
      setOverlayVisible(false);
    });
  }

  /**
   * Returns true if the player has entered the game.
   * 
   * **Remarks**:
   * - Implementation logic mimics `game.getMyPlayer()`.
   * 
   * @returns {boolean}
   */
  function getHasEntered() {
    if (!game.engine?.clientUid) {
      return false; // Client is still connecting
    }

    return Boolean(game.players[game.engine.clientUid]);
  }

  function handleEmoteSelect(option) {
    const { value } = option;

    game.setEmote(value);

    setTimeout(() => {
      const currentEmote = game.getMyPlayer().emote;
      const stillSame = currentEmote === value;
      if (stillSame) {
        // Unset
        game.setEmote(undefined);
      }
    }, DEFAULT_EMOTE_TIMEOUT);
  }

  // Initialize the extension
  function init() {
    console.log('Gather Town Emote Overlay initialized');
    injectStyles();
    createOverlay();
    setupEventListeners();

    const $overlay = document.querySelector('.gather-emote-overlay');
    const circularMenu = new CircularMenu($overlay, getEmotes, handleEmoteSelect);
  }

  // Wait for the page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
