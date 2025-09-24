// content.js

// 创建一个图标元素，但先不显示
const icon = document.createElement('img');
icon.src = chrome.runtime.getURL('icon.png');
icon.style.position = 'absolute';
icon.style.cursor = 'pointer';
icon.style.zIndex = '10000';
icon.style.display = 'none';
document.body.appendChild(icon);

let currentSelection = '';

// 监听鼠标抬起事件，用于检测文本选择
document.addEventListener('mouseup', (e) => {
  // 延迟一小段时间再获取选区，确保选区已经最终确定
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      currentSelection = selectedText;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // 定位图标到选中文本的右上角
      icon.style.left = `${window.scrollX + rect.right}px`;
      icon.style.top = `${window.scrollY + rect.top}px`;
      icon.style.display = 'block';

    } else {
      // 如果没有选中文本，则隐藏图标
      // 但要排除点击图标本身的情况
      if (e.target !== icon) {
        icon.style.display = 'none';
        currentSelection = '';
      }
    }
  }, 10);
});

// 监听图标的点击事件
icon.addEventListener('click', () => {
  if (currentSelection) {
    // 发送消息到 background.js
    chrome.runtime.sendMessage({
      action: "sendText",
      text: currentSelection
    });
    // 点击后隐藏图标
    icon.style.display = 'none';
    currentSelection = '';
  }
});

// 当窗口大小改变或滚动时，可能需要重新定位或隐藏图标
window.addEventListener('resize', () => {
    icon.style.display = 'none';
    currentSelection = '';
});
window.addEventListener('scroll', () => {
    icon.style.display = 'none';
    currentSelection = '';
});
