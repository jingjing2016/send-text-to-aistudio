// options.js

const statusDiv = document.getElementById('status');
const positionRadios = document.querySelectorAll('input[name="position"]');

// Saves options to chrome.storage
function saveOptions() {
  const position = document.querySelector('input[name="position"]:checked').value;

  chrome.storage.sync.set({
    iconPosition: position
  }, () => {
    // Update status to let user know options were saved.
    statusDiv.textContent = 'Options saved.';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 1500);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  // Use default value 'top-right'
  chrome.storage.sync.get({
    iconPosition: 'top-right'
  }, (items) => {
    document.querySelector(`input[name="position"][value="${items.iconPosition}"]`).checked = true;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
positionRadios.forEach(radio => radio.addEventListener('change', saveOptions));
