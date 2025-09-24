// background.js

const DEFAULTS = {
    settings: {
        targetUrl: 'https://aistudio.google.com/live/',
        submitKey: 'ctrl-enter',
        position: {
            anchor: 'top-right',
            offsetX: 0,
            offsetY: 0
        }
    }
};

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendText" && request.text) {
        // First, get the user's settings from storage
        chrome.storage.sync.get(DEFAULTS, (data) => {
            const { settings } = data;
            const targetUrl = settings.targetUrl;
            // The query needs a wildcard to match any sub-path
            const queryUrl = targetUrl.endsWith('*') ? targetUrl : targetUrl + (targetUrl.endsWith('/') ? '*' : '/*');

            // 1. Find the target tab
            chrome.tabs.query({ url: queryUrl }, (tabs) => {
                if (tabs.length > 0) {
                    const targetTabId = tabs[0].id;
                    // 2. Execute script in the found tab
                    chrome.scripting.executeScript({
                        target: { tabId: targetTabId },
                        function: fillInputAndSubmit,
                        args: [request.text, settings.submitKey] // Pass text and submit key
                    });
                } else {
                    // 3. If no tab is found, create a new one
                    chrome.tabs.create({ url: targetUrl, active: false }, (newTab) => {
                        // Listen for the tab to finish loading before injecting script
                        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                            if (tabId === newTab.id && info.status === 'complete') {
                                chrome.scripting.executeScript({
                                    target: { tabId: newTab.id },
                                    function: fillInputAndSubmit,
                                    args: [request.text, settings.submitKey]
                                });
                                // Clean up the listener
                                chrome.tabs.onUpdated.removeListener(listener);
                            }
                        });
                    });
                }
            });
        });
    }
    // Return true to indicate you wish to send a response asynchronously
    return true;
});

/**
 * This function is injected into the target page.
 * It fills an input field and simulates a keypress to submit.
 * @param {string} text - The text to fill.
 * @param {string} submitKey - The key to simulate ('enter' or 'ctrl-enter').
 */
function fillInputAndSubmit(text, submitKey) {
    const inputField = document.querySelector('textarea, [contenteditable="true"]');
    
    if (!inputField) {
        // If no input field is found, try again after a delay.
        setTimeout(() => {
            const fallbackInputField = document.querySelector('textarea, [contenteditable="true"]');
            if (fallbackInputField) {
                fillInputAndSubmit(text, submitKey);
            } else {
                alert("Could not find a suitable input field on the target page.");
            }
        }, 1000);
        return;
    }

    // --- Step 1: Fill the text ---
    if (inputField.isContentEditable) {
        inputField.focus();
        document.execCommand('insertText', false, text);
    } else {
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // --- Step 2: Simulate the keypress after a short delay ---
    // The delay gives frameworks like React time to process the input change
    // and enable/update any relevant UI elements like a submit button.
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
    }, 100); // 100ms delay
}