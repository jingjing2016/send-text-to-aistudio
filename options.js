// options.js

// --- UI Elements ---
const statusDiv = document.getElementById('status');
const resetButton = document.getElementById('reset');
// Target & Submission
const targetUrlInput = document.getElementById('targetUrl');
const submitKeyRadios = document.querySelectorAll('input[name="submitKey"]');
// Position
const anchorRadios = document.querySelectorAll('input[name="anchor"]');
const offsetXSlider = document.getElementById('offsetX');
const offsetYSlider = document.getElementById('offsetY');
const offsetXValueSpan = document.getElementById('offsetXValue');
const offsetYValueSpan = document.getElementById('offsetYValue');

// --- Default Settings ---
const DEFAULTS = {
    targetUrl: 'https://aistudio.google.com/live/',
    submitKey: 'ctrl-enter',
    position: {
        anchor: 'top-right',
        offsetX: 0,
        offsetY: 0
    }
};

// --- Core Functions ---

function saveOptions() {
    const settings = {
        targetUrl: targetUrlInput.value,
        submitKey: document.querySelector('input[name="submitKey"]:checked').value,
        position: {
            anchor: document.querySelector('input[name="anchor"]:checked').value,
            offsetX: parseInt(offsetXSlider.value, 10),
            offsetY: parseInt(offsetYSlider.value, 10)
        }
    };

    chrome.storage.sync.set({ settings: settings }, () => {
        statusDiv.textContent = 'Options saved.';
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 1500);
    });
}

function restoreOptions() {
    chrome.storage.sync.get({ settings: DEFAULTS }, (result) => {
        const settings = result.settings;

        // Restore Target & Submission
        targetUrlInput.value = settings.targetUrl;
        document.querySelector(`input[name="submitKey"][value="${settings.submitKey}"]`).checked = true;

        // Restore Position
        document.querySelector(`input[name="anchor"][value="${settings.position.anchor}"]`).checked = true;
        offsetXSlider.value = settings.position.offsetX;
        offsetYSlider.value = settings.position.offsetY;

        updateSliderValues();
    });
}

function resetToDefaults() {
    // Set UI to defaults
    targetUrlInput.value = DEFAULTS.targetUrl;
    document.querySelector(`input[name="submitKey"][value="${DEFAULTS.submitKey}"]`).checked = true;
    document.querySelector(`input[name="anchor"][value="${DEFAULTS.position.anchor}"]`).checked = true;
    offsetXSlider.value = DEFAULTS.position.offsetX;
    offsetYSlider.value = DEFAULTS.position.offsetY;

    updateSliderValues();
    saveOptions();
    // After resetting, we might need to re-request permission for the default URL if it was removed
    handleUrlChange();
}

function updateSliderValues() {
    offsetXValueSpan.textContent = `${offsetXSlider.value} px`;
    offsetYValueSpan.textContent = `${offsetYSlider.value} px`;
}

// --- Permissions Handling ---

async function handleUrlChange() {
    const url = targetUrlInput.value;
    if (!url || !url.startsWith('http')) {
        // Don't request permissions for invalid or empty URLs
        return;
    }

    try {
        const urlPattern = new URL(url).origin + '/*';
        const granted = await chrome.permissions.contains({ origins: [urlPattern] });

        if (!granted) {
            const granted = await chrome.permissions.request({ origins: [urlPattern] });
            if (granted) {
                console.log('Permission granted for:', urlPattern);
                saveOptions();
            } else {
                console.log('Permission denied for:', urlPattern);
            }
        } else {
            // Permission already exists, just save
            saveOptions();
        }
    } catch (error) {
        console.error('Invalid URL specified:', error);
        statusDiv.textContent = 'Invalid URL format.';
        setTimeout(() => { statusDiv.textContent = ''; }, 2000);
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', restoreOptions);
resetButton.addEventListener('click', resetToDefaults);

// Listen for changes on all inputs to save
targetUrlInput.addEventListener('blur', handleUrlChange); // Special handling for URL to request permission
submitKeyRadios.forEach(radio => radio.addEventListener('change', saveOptions));
anchorRadios.forEach(radio => radio.addEventListener('change', saveOptions));
offsetXSlider.addEventListener('change', saveOptions);
offsetYSlider.addEventListener('change', saveOptions);

// Real-time UI updates for sliders
offsetXSlider.addEventListener('input', updateSliderValues);
offsetYSlider.addEventListener('input', updateSliderValues);
