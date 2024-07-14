document.addEventListener('DOMContentLoaded', () => {
  const activateButton = document.getElementById('activate');
  const settingsButton = document.getElementById('settings');
  const loadingIcon = document.getElementById('loadingIcon');
  const messageDiv = document.getElementById('message');

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch(message.action) {
          case 'progressUpdate':
              messageDiv.textContent = message.step;
              messageDiv.className = '';
              break;
          case 'fillComplete':
              messageDiv.textContent = message.result.message;
              messageDiv.className = 'success';
              activateButton.disabled = false;
              loadingIcon.style.display = 'none';
              break;
          case 'fillError':
              messageDiv.textContent = message.message;
              messageDiv.className = 'error';
              activateButton.disabled = false;
              loadingIcon.style.display = 'none';
              break;
      }
  });

  activateButton.addEventListener('click', async () => {
      try {
          activateButton.disabled = true;
          loadingIcon.style.display = 'block';
          messageDiv.textContent = 'Initializing...';
          messageDiv.className = '';
  
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['scripts/content.js']
          });
  
          await chrome.tabs.sendMessage(tab.id, { action: 'gatherAndFillInputs' });
      } catch (error) {
          console.error('Error:', error);
          messageDiv.textContent = 'An unexpected error occurred. Please try again.';
          messageDiv.className = 'error';
          activateButton.disabled = false;
          loadingIcon.style.display = 'none';
      }
  });

  settingsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
  });
});

