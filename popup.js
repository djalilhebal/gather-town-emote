// Gather Town Emote - Popup Script
document.addEventListener('DOMContentLoaded', function () {
  const EMOTE_OPTIONS_STORAGE_KEY = 'gather-town-emote-options';

  const INPUTS_COUNT = 8;

  // See https://en.wikipedia.org/wiki/Arrows_(Unicode_block)
  const EMOTE_INDEX_TO_DIRECTION = {
    0: '→',
    1: '↘',
    2: '↓',
    3: '↙',
    4: '←',
    5: '↖',
    6: '↑',
    7: '↗',
  };
  const DEFAULT_VALUES = Array(INPUTS_COUNT).fill('❓');

  const $inputsContainer = document.getElementById('inputs-container');

  // Load saved inputs from localStorage
  function loadSavedInputs() {
    try {
      const savedData = localStorage.getItem(EMOTE_OPTIONS_STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (e) {
      console.error('Failed to load saved inputs:', e);
    }
    return DEFAULT_VALUES;
  }

  // Save inputs to localStorage
  function saveInputs() {
    try {
      const inputs = Array.from(document.querySelectorAll('.char-input'));
      const inputValues = inputs.map(input => input.value);
      const optionsJson = JSON.stringify(inputValues);
      localStorage.setItem(EMOTE_OPTIONS_STORAGE_KEY, optionsJson);

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url.startsWith('https://app.gather.town/')) {
          chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: (key, value) => {
              localStorage.setItem(key, value);
            },
            args: [EMOTE_OPTIONS_STORAGE_KEY, optionsJson],
          });
        }
      });
    } catch (e) {
      console.error('Failed to save inputs:', e);
    }
  }

  function countUnicode(str) {
    return [...new Intl.Segmenter().segment(str)].length;
  }

  function createInputs() {
    const savedInputs = loadSavedInputs();

    for (let i = 0; i < INPUTS_COUNT; i++) {
      const $container = document.createElement('div');
      $container.className = 'input-container';

      const $label = document.createElement('div');
      $label.className = 'input-label';
      $label.textContent = `Emote ${EMOTE_INDEX_TO_DIRECTION[i]}`;

      const $input = document.createElement('input');
      $input.className = 'char-input';
      $input.type = 'text';
      $input.value = savedInputs[i] || '';
      $input.dataset.index = i;

      // Add input event to save changes
      $input.addEventListener('input', (_e) => {
        const isExactlyOneCharacter = countUnicode($input.value) === 1;
        if (isExactlyOneCharacter) {
          $input.setCustomValidity('');
          saveInputs();
        } else {
          $input.setCustomValidity('Please enter exactly one character');
          $input.reportValidity();
        }
      });

      $container.appendChild($label);
      $container.appendChild($input);
      $inputsContainer.appendChild($container);
    }
  }

  function showMainSection() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      const isOnGather = currentTab && currentTab.url.startsWith('https://app.gather.town/');
      const toShowSelector = isOnGather ? '.app--is-gather' : '.app--not-gather';
      document.querySelector(toShowSelector).removeAttribute('hidden');
    });
  }

  // Initialize
  createInputs();
  showMainSection();
});
