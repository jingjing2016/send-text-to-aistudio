// options.js

// --- UI Elements ---
const statusDiv = document.getElementById('status');
const targetingModeRadios = document.querySelectorAll('input[name="targetingMode"]');
const urlTargetGroup = document.getElementById('urlTargetGroup');
const positionTargetGroup = document.getElementById('positionTargetGroup');
const targetUrlInput = document.getElementById('targetUrl');
const tabPositionInput = document.getElementById('tabPosition');
const submitKeyRadios = document.querySelectorAll('input[name="submitKey"]');

// --- Default Settings ---
const DEFAULTS = {
    targetingMode: 'url',
    targetUrl: 'https://aistudio.google.com/live/',
    tabPosition: 1,
    submitKey: 'ctrl-enter',
};

// --- Functions ---

// Populates the UI with settings from an object
function setUIFromSettings(settings) {
    document.querySelector(`input[name="targetingMode"][value="${settings.targetingMode}"]`).checked = true;
    targetUrlInput.value = settings.targetUrl;
    tabPositionInput.value = settings.tabPosition;
    document.querySelector(`input[name="submitKey"][value="${settings.submitKey}"]`).checked = true;
    updateTargetingUI();
}

// Reads the current state of the UI and returns a settings object
function getSettingsFromUI() {
    return {
        targetingMode: document.querySelector('input[name="targetingMode"]:checked').value,
        targetUrl: targetUrlInput.value,
        tabPosition: parseInt(tabPositionInput.value, 10),
        submitKey: document.querySelector('input[name="submitKey"]:checked').value,
    };
}

// Saves the current UI state to storage
function saveOptions() {
    const settings = getSettingsFromUI();
    chrome.storage.sync.set({ settings: settings }, () => {
        statusDiv.textContent = 'Options saved.';
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 1500);
    });
}

// Restores settings from storage and populates the UI
function restoreOptions(callback) {
    chrome.storage.sync.get({ settings: DEFAULTS }, (result) => {
        const settings = { ...DEFAULTS, ...result.settings };
        setUIFromSettings(settings);
        if (callback) callback();
    });
}

// Toggles visibility of URL vs. Position inputs
function updateTargetingUI() {
    const selectedMode = document.querySelector('input[name="targetingMode"]:checked').value;
    urlTargetGroup.style.display = selectedMode === 'url' ? 'block' : 'none';
    positionTargetGroup.style.display = selectedMode === 'position' ? 'block' : 'none';
}

// Checks and requests permissions for the URL currently in the input
async function manageUrlPermissions() {
    const selectedMode = document.querySelector('input[name="targetingMode"]:checked').value;
    if (selectedMode !== 'url') return;

    const url = targetUrlInput.value;
    if (!url || !url.startsWith('http')) return;

    try {
        const urlPattern = new URL(url).origin + '/*';
        const hasPermission = await chrome.permissions.contains({ origins: [urlPattern] });
        if (!hasPermission) {
            await chrome.permissions.request({ origins: [urlPattern] });
        }
    } catch (error) {
        console.error('Invalid URL for permission request:', error);
    }
}

// --- Event Listeners ---

// On page load, restore settings, then check permissions for the loaded URL
document.addEventListener('DOMContentLoaded', () => {
    restoreOptions(() => {
        manageUrlPermissions();
    });
});

// Add listeners to all inputs to save options on change
targetingModeRadios.forEach(radio => radio.addEventListener('change', () => {
    updateTargetingUI();
    saveOptions();
}));
targetUrlInput.addEventListener('change', () => {
    manageUrlPermissions().then(saveOptions);
});
tabPositionInput.addEventListener('change', saveOptions);
submitKeyRadios.forEach(radio => radio.addEventListener('change', saveOptions));
