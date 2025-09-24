// background.js

// 当扩展被安装时，创建一个右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendTextToAIStudio",
    title: "发送选中文本并执行 (Ctrl+Enter)", // 更新了菜单标题以反映新功能
    contexts: ["selection"] // 只有在选中文本时才显示
  });
});

// 监听右键菜单的点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendTextToAIStudio" && info.selectionText) {
    // 1. 查找目标标签页
    chrome.tabs.query({ url: "https://aistudio.google.com/live/*" }, (tabs) => {
      if (tabs.length > 0) {
        const targetTabId = tabs[0].id; // 默认发送到第一个匹配的标签页
        
        // 2. 在目标标签页上执行脚本
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          function: fillInputAndSubmit, // 使用更新后的函数
          args: [info.selectionText] // 将选中的文本作为参数传入
        });
      } else {
        alert("错误：找不到 https://aistudio.google.com/live 标签页！");
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
  // 注意：你仍然需要确保这个选择器能准确地找到目标输入框
  const inputField = document.querySelector('textarea'); 
  
  if (inputField) {
    // --- 第1步：填充文本 ---
    inputField.value = text;
    // 模拟输入事件，以便页面上的框架（如React, Vue等）能够识别到内容变化
    inputField.dispatchEvent(new Event('input', { bubbles: true }));

    // --- 第2步 (新增功能)：模拟 Ctrl+Enter 按键 ---
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      ctrlKey: true,    // 关键：模拟按下了 Ctrl 键
      bubbles: true,    // 允许事件冒泡
      cancelable: true
    });
    
    // 将创建的键盘事件派发到输入框上
    inputField.dispatchEvent(enterEvent);

  } else {
    alert("在目标页面上找不到指定的输入框！");
  }
}