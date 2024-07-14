chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'gatherAndFillInputs') {
    gatherAndFillInputs()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true; 
  }
});

async function gatherAndFillInputs() {
  const inputs = Array.from(document.querySelectorAll('input, textarea')).filter(element => element.value.trim() === '');
  const inputDetails = Array.from(inputs).map(input => ({
    tagName: input.tagName,
    type: input.type,
    name: input.name,
    id: input.id || input.name,
    label: input.labels && input.labels.length > 0 ? input.labels[0].innerText : '',
    value: input.value,
  }));

  const response = await chrome.runtime.sendMessage({ action: 'fillInputs', inputDetails });

  if (response.status === 'error') {
    throw new Error(response.message);
  }

  let filledCount = 0;
  response.filledInputs.forEach(inputMapping => {
    const input = document.querySelector(`#${inputMapping.id}`) || document.querySelector(`[name="${inputMapping.name}"]`);
    if (input) {
      input.value = inputMapping.value;
      console.log(inputMapping.name + ": " + inputMapping.value);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      filledCount++;
    }
  });
  if (!filledCount) return { status: 'success', message: `Couldn't fill any fields` };
  return { status: 'success', message: `filled it for you! activate again for more fields.` };
}