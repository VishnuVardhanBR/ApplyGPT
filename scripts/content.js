chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'gatherForms') {
        const forms = document.querySelectorAll('form');
        const formDetails = Array.from(forms).map((form, index) => {
            const elements = form.elements;
            const details = Array.from(elements).map(el => {
                const label = el.labels && el.labels.length > 0 ? el.labels[0].innerText : '';
                return {
                    tagName: el.tagName,
                    type: el.type,
                    name: el.name,
                    id: el.id,
                    label: label,
                    value: el.value,
                };
            });
            return { formId: form.id || `form${index}`, details };
        });
        console.log('Form Details:', formDetails);
        chrome.runtime.sendMessage({ action: 'filterForms', formDetails }, response => {
            if (response && response.filledForms) {
                response.filledForms.forEach(formMapping => {
                    const form = document.getElementById(formMapping.formId);
                    if (form) {
                        Object.keys(formMapping.mapping).forEach(fieldId => {
                            const fieldValue = formMapping.mapping[fieldId];
                            if (fieldValue) {
                                const element = form.querySelector(`#${fieldId}`);
                                if (element) {
                                    element.value = fieldValue;
                                    element.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }
                        });
                    }
                });
            } else {
                console.error('Error: No filled forms returned');
            }
            sendResponse({ status: 'success' });
        });
    }
    return true; // Keep the message channel open for async response
});
