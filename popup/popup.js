document.addEventListener('DOMContentLoaded', () => {
    const activateButton = document.getElementById('activate');
    const settingsButton = document.getElementById('settings');
    const loadingIcon = document.getElementById('car');
    const messageDiv = document.getElementById('message');
  
    activateButton.addEventListener('click', async () => {
      try {
        activateButton.disabled = true;
        loadingIcon.style.display = 'block';
        messageDiv.textContent = '';
        messageDiv.className = '';
  
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/content.js']
        });
  
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'gatherAndFillInputs' });
  
        if (response.status === 'error') {
          throw new Error(response.message);
        }
  
        messageDiv.textContent = response.message;
        messageDiv.className = 'success';
      } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = `Error: ${error.message}`;
        messageDiv.className = 'error';
      } finally {
        activateButton.disabled = false;
        loadingIcon.style.display = 'none';
      }
    });
  
    settingsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });