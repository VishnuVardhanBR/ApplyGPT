document.addEventListener('DOMContentLoaded', () => {
    const car = document.getElementById('car');

    document.getElementById('activate').addEventListener('click', () => {
        car.style.display = 'block'; // Show car
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    files: ['scripts/content.js']
                },
                () => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherInputs' }, (response) => {
                        car.style.display = 'none'; // Hide car
                        
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
document.getElementById('activate').addEventListener('click', () => {
    chrome.storage.sync.get(null, (data) => {
        const { apiKey, name, email, phone } = data;

        if (!apiKey) {
            alert('Please provide your OpenAI API Key in the settings.');
            return;
        }

        if (!name && !email && !phone) {
            alert('Please fill in your details in the settings.');
            return;
        }

        const car = document.getElementById('car');
        car.style.display = 'block'; // Show car
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    files: ['scripts/content.js']
                },
                () => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherInputs' }, (response) => {
                        car.style.display = 'none'; // Hide car       
                        if (chrome.runtime.lastError) {
                            console.error('Runtime Error:', chrome.runtime.lastError.message);
                        } 
                    });
                }
            );
        });
    });
});