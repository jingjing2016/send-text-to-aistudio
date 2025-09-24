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
 * It fills an input field and attempts to submit it using a tiered approach.
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

    // --- Step 2: Attempt submission with a tiered strategy ---

    // Method 1: Find and click a submit button. This is often the most reliable.
    const form = inputField.closest('form');
    if (form) {
        // Look for a button with type="submit" or common submit-like text/attributes.
        const submitButton = form.querySelector(
            'button[type="submit"], input[type="submit"], button[aria-label*="Send"], button[aria-label*="Submit"]'
        );
        if (submitButton) {
            submitButton.click();
            return; // Submission attempted.
        }
    }

    // Method 2: If in a form, try to submit the form directly.
    // This is good but might bypass some client-side validation attached to a button click.
    if (form) {
        // Using requestSubmit() is better than submit() as it triggers the 'submit' event.
        if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
        } else {
            form.submit();
        }
        return; // Submission attempted.
    }

    // Method 3: Fallback to simulating the keyboard event.
    // This is for single-page apps or elements that listen for key presses without a formal <form>.
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
}