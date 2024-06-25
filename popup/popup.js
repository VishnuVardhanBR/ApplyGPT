document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('activate').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    files: ['scripts/content.js']
                },
                () => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherForms' }, (response) => {
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