// options.js

const statusDiv = document.getElementById('status');
const anchorRadios = document.querySelectorAll('input[name="anchor"]');
const offsetXSlider = document.getElementById('offsetX');
const offsetYSlider = document.getElementById('offsetY');
const offsetXValueSpan = document.getElementById('offsetXValue');
const offsetYValueSpan = document.getElementById('offsetYValue');
const resetButton = document.getElementById('reset');

const DEFAULTS = {
    anchor: 'top-right',
    offsetX: 0,
    offsetY: 0
};

// --- Functions to save and restore options ---

function saveOptions() {
    const settings = {
        anchor: document.querySelector('input[name="anchor"]:checked').value,
        offsetX: parseInt(offsetXSlider.value, 10),
        offsetY: parseInt(offsetYSlider.value, 10)
    };

    chrome.storage.sync.set({ iconPosition: settings }, () => {
        statusDiv.textContent = 'Options saved.';
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 1500);
    });
}

function restoreOptions() {
    chrome.storage.sync.get({ iconPosition: DEFAULTS }, (result) => {
        const settings = result.iconPosition;

        // Restore anchor
        document.querySelector(`input[name="anchor"][value="${settings.anchor}"]`).checked = true;

        // Restore sliders
        offsetXSlider.value = settings.offsetX;
        offsetYSlider.value = settings.offsetY;

        // Update slider value displays
        updateSliderValues();
    });
}

function resetToDefaults() {
    // Set UI to defaults
    document.querySelector(`input[name="anchor"][value="${DEFAULTS.anchor}"]`).checked = true;
    offsetXSlider.value = DEFAULTS.offsetX;
    offsetYSlider.value = DEFAULTS.offsetY;

    // Update slider value displays
    updateSliderValues();

    // Save the reset values
    saveOptions();
}

// --- Helper functions ---

function updateSliderValues() {
    offsetXValueSpan.textContent = `${offsetXSlider.value} px`;
    offsetYValueSpan.textContent = `${offsetYSlider.value} px`;
}

// --- Event Listeners ---

// Restore options on page load
document.addEventListener('DOMContentLoaded', restoreOptions);

// Save options when any control is changed
anchorRadios.forEach(radio => radio.addEventListener('change', saveOptions));
offsetXSlider.addEventListener('input', updateSliderValues);
offsetYSlider.addEventListener('input', updateSliderValues);
offsetXSlider.addEventListener('change', saveOptions);
offsetYSlider.addEventListener('change', saveOptions);


// Reset button
resetButton.addEventListener('click', resetToDefaults);
