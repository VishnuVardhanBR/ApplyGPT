chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'gatherInputs') {
        const inputs = document.querySelectorAll('input, textarea');
        const inputDetails = Array.from(inputs).map(input => {
            const label = input.labels && input.labels.length > 0 ? input.labels[0].innerText : '';
            return {
                tagName: input.tagName,
                type: input.type,
                name: input.name,
                id: input.id || input.name, // Use name as fallback if id is empty
                label: label,
                value: input.value,
            };
        });
        console.log('Input Details:', inputDetails);
        chrome.runtime.sendMessage({ action: 'filterInputs', inputDetails }, response => {
            if (response && response.filledInputs) {
                response.filledInputs.forEach(inputMapping => {
                    const input = document.querySelector(`#${inputMapping.id}`) || document.querySelector(`[name="${inputMapping.name}"]`);
                    if (input) {
                        input.value = inputMapping.value;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            } else {
                console.error('Error: No filled inputs returned');
            }
            sendResponse({ status: 'success' });
        });
    }
    return true; // Keep the message channel open for async response
});