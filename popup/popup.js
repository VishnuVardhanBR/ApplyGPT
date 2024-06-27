document.addEventListener('DOMContentLoaded', () => {
    const loadingIcon = document.getElementById('loadingIcon');
    
    document.getElementById('activate').addEventListener('click', () => {
        loadingIcon.style.display = 'block'; // Show loading icon
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    files: ['scripts/content.js']
                },
                () => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherInputs' }, (response) => {
                        loadingIcon.style.display = 'none'; // Hide loading icon
                        
                        if (chrome.runtime.lastError) {
                            console.error('Runtime Error:', chrome.runtime.lastError.message);
                        } else {
                            console.log('Response:', response);
                        }
                    });
                }
            );
        });
    });

    document.getElementById('settings').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});