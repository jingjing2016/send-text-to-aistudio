// background.js

// 监听来自 content.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendText" && request.text) {
    // 1. 查找目标标签页
    chrome.tabs.query({ url: "https://aistudio.google.com/live/*" }, (tabs) => {
      if (tabs.length > 0) {
        const targetTabId = tabs[0].id; // 默认发送到第一个匹配的标签页
        
        // 2. 在目标标签页上执行脚本
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          function: fillInputAndSubmit,
          args: [request.text] // 将接收到的文本作为参数传入
        });
      } else {
        // 如果找不到，可以创建一个新标签页
        chrome.tabs.create({ url: "https://aistudio.google.com/live/" }, (newTab) => {
            // 在新标签页加载完成后执行脚本
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === newTab.id && info.status === 'complete') {
                    chrome.scripting.executeScript({
                        target: { tabId: newTab.id },
                        function: fillInputAndSubmit,
                        args: [request.text]
                    });
                    // 执行后移除监听器，避免重复执行
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        });
      }
    });
  }
});

/**
 * 这个函数将被注入到目标页面并执行。
 * 它会填充输入框并模拟按下 Ctrl+Enter。
 * @param {string} text - 要填充的文本。
 */
function fillInputAndSubmit(text) {
  // 查找页面上最主要的输入区域，<textarea> 优先
  const inputField = document.querySelector('textarea, [contenteditable="true"]');
  
  if (inputField) {
    // --- 第1步：填充文本 ---
    if (inputField.isContentEditable) {
        inputField.focus();
        document.execCommand('insertText', false, text);
    } else {
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // --- 第2步：模拟 Ctrl+Enter 按键 ---
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    
    inputField.dispatchEvent(enterEvent);

  } else {
    // 备用方案：如果找不到输入框，可以尝试在页面加载后延迟执行
    setTimeout(() => {
        const fallbackInputField = document.querySelector('textarea, [contenteditable="true"]');
        if (fallbackInputField) {
            fillInputAndSubmit(text); // 重新调用自己
        } else {
            alert("在目标页面上找不到指定的输入区域！");
        }
    }, 1000); // 延迟1秒
  }
}