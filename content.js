// content.js

const icon = document.createElement('img');
icon.src = chrome.runtime.getURL('icon.png');
icon.style.position = 'absolute';
icon.style.cursor = 'pointer';
icon.style.zIndex = '10000';
icon.style.display = 'none';
// Add a class for easier selection and styling if needed
icon.classList.add('send-text-icon');
document.body.appendChild(icon);

let currentSelection = '';
let iconPosition = 'top-right'; // Default position

// --- 1. Load the setting from storage ---
function loadPositionSetting() {
    chrome.storage.sync.get({
        iconPosition: 'top-right' // Default value
    }, (items) => {
        iconPosition = items.iconPosition;
    });
}

// --- 2. Listen for changes in settings ---
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.iconPosition) {
        iconPosition = changes.iconPosition.newValue;
    }
});

// Initial load of the setting
loadPositionSetting();


// --- 3. Update position calculation logic ---
document.addEventListener('mouseup', (e) => {
    // Prevent icon from appearing when clicking on the icon itself
    if (e.target.classList.contains('send-text-icon')) {
        return;
    }

    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText) {
            currentSelection = selectedText;
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Calculate position based on the setting
            let top, left;
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            const iconWidth = 16;  // Approximate width of the icon
            const iconHeight = 16; // Approximate height of the icon

            switch (iconPosition) {
                case 'top-left':
                    top = scrollY + rect.top - iconHeight;
                    left = scrollX + rect.left;
                    break;
                case 'bottom-right':
                    top = scrollY + rect.bottom;
                    left = scrollX + rect.right - iconWidth;
                    break;
                case 'bottom-left':
                    top = scrollY + rect.bottom;
                    left = scrollX + rect.left;
                    break;
                case 'top-right':
                default:
                    top = scrollY + rect.top - iconHeight;
                    left = scrollX + rect.right - iconWidth;
                    break;
            }

            icon.style.left = `${left}px`;
            icon.style.top = `${top}px`;
            icon.style.display = 'block';

        } else {
            icon.style.display = 'none';
            currentSelection = '';
        }
    }, 10);
});

icon.addEventListener('click', () => {
    if (currentSelection) {
        chrome.runtime.sendMessage({
            action: "sendText",
            text: currentSelection
        });
        icon.style.display = 'none';
        currentSelection = '';
    }
});

// Hide icon on resize or scroll
function hideIcon() {
    icon.style.display = 'none';
    currentSelection = '';
}
window.addEventListener('resize', hideIcon);
window.addEventListener('scroll', hideIcon);
