// background.js

const DEFAULTS = {
    settings: {
        targetingMode: 'url',
        targetUrl: 'https://aistudio.google.com/live/',
        tabPosition: 1,
        submitKey: 'ctrl-enter',
    }
};

// When the extension is installed, create a context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendTextToTarget",
    title: "Send selected text to target",
    contexts: ["selection"]
  });
});

// Listen for the context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendTextToTarget" && info.selectionText) {

    chrome.storage.sync.get(DEFAULTS, (data) => {
        const settings = { ...DEFAULTS, ...data.settings };

        if (settings.targetingMode === 'position') {
            // --- Target by Position Logic ---
            const tabIndex = settings.tabPosition - 1;
            if (tabIndex < 0) return;

            chrome.tabs.query({ currentWindow: true }, (tabs) => {
                // Sort tabs by their index to ensure visual order
                const sortedTabs = tabs.sort((a, b) => a.index - b.index);
                const targetTab = sortedTabs[tabIndex];
                if (targetTab) {
                    executeScriptInTab(targetTab.id, info.selectionText, settings.submitKey);
                } else {
                    alert(`Error: No tab found at position ${settings.tabPosition}.`);
                }
            });

        } else {
            // --- Target by URL Logic ---
            const targetUrl = settings.targetUrl;
            const queryUrl = targetUrl.endsWith('*') ? targetUrl : targetUrl + (targetUrl.endsWith('/') ? '*' : '/*');

            chrome.tabs.query({ url: queryUrl }, (tabs) => {
                if (tabs.length > 0) {
                    executeScriptInTab(tabs[0].id, info.selectionText, settings.submitKey);
                } else {
                    alert(`Error: No tab found with URL matching ${targetUrl}`);
                }
            });
        }
    });
  }
});

// Helper function to avoid duplicating the executeScript call
function executeScriptInTab(tabId, text, submitKey) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: fillInputAndSubmit,
        args: [text, submitKey]
    });
}

/**
 * This function is injected into the target page.
 * It fills an input field and simulates a keypress.
 * @param {string} text - The text to fill.
 * @param {string} submitKey - The key to simulate ('enter' or 'ctrl-enter').
 */
function fillInputAndSubmit(text, submitKey) {
    const inputField = document.querySelector('textarea, [contenteditable="true"]');

    if (!inputField) {
        alert("Could not find a suitable input field on the target page.");
        return;
    }

    if (inputField.isContentEditable) {
        inputField.focus();
        document.execCommand('insertText', false, text);
    } else {
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // The delay gives frameworks time to process the input change
    setTimeout(() => {
        const useCtrlKey = submitKey === 'ctrl-enter';
        const commonEventProps = {
            key: 'Enter',
            code: 'Enter',
            ctrlKey: useCtrlKey,
            bubbles: true,
            cancelable: true
        };

        const keydownEvent = new KeyboardEvent('keydown', commonEventProps);
        inputField.dispatchEvent(keydownEvent);

        const keyupEvent = new KeyboardEvent('keyup', commonEventProps);
        inputField.dispatchEvent(keyupEvent);
    }, 100);
}