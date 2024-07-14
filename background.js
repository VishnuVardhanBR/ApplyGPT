chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fillInputs') {
        handleFillInputs(message.inputDetails, sender.tab.id)
            .then(result => {
                chrome.runtime.sendMessage({ action: 'fillComplete', result });
                sendResponse(result);
            })
            .catch(error => {
                console.error('Error:', error);
                chrome.runtime.sendMessage({ 
                    action: 'fillError', 
                    message: error.message.includes('API Key') || error.message.includes('candidate information')
                        ? error.message
                        : 'An unexpected error occurred. Please try again.'
                });
                sendResponse({ status: 'error', message: error.message });
            });
        return true;
    }
});

async function handleFillInputs(inputDetails, tabId) {
    const sendProgressUpdate = (step) => {
        chrome.runtime.sendMessage({ action: 'progressUpdate', step });
    };

    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error('No API Key provided. Please add your OpenAI API key in the settings.');
    }

    const candidateInfo = await getCandidateInfo();
    if (Object.keys(candidateInfo).length === 0) {
        throw new Error('No candidate information found. Please fill in your details in the settings.');
    }

    sendProgressUpdate('Filtering relevant input fields...');
    const filteredInputs = await filterInputsWithOpenAI(inputDetails, apiKey);

    sendProgressUpdate('Generating input data...');
    const filledInputs = await fillInputsWithCandidateInfo(filteredInputs, candidateInfo, apiKey);

    sendProgressUpdate('Filling fields with your information...');

    return { 
        status: 'success', 
        filledInputs, 
        message: 'Inputs filled successfully.'
    };
}



async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('apiKey', (data) => resolve(data.apiKey));
    });
}

async function filterInputsWithOpenAI(inputDetails, apiKey) {
    const systemPrompt = `You are a helpful assistant who helps to filter out input fields. You will be provided a JSON array of input elements available on a website. 
    Filter the given inputs and retain only those that ask for job applicant information such as name, family name, email, phone number, address, resume, cover letter, etc. But keep in mind that this is not a restrictive list. Have high consideration and include inputs which are relevant. 
    Ignore any other inputs. Return the output in the following JSON format, do not provide any explanation:
    [
      {
        "id": "input1",
        "name": "input1",
        "label": "Name",
        "type": "text"
      },
      ...
    ]`;

    return callOpenAI(systemPrompt, JSON.stringify(inputDetails), apiKey);
}

async function fillInputsWithCandidateInfo(filteredInputs, candidateInfo, apiKey) {
    const systemPrompt = `You are a helpful assistant who matches input fields available with the details you are provided with. Match the filtered input fields with the candidate info provided. Use the resume content to provide relevant information when filling the fields, if the input asks for a Cover Letter, generate a good structured personalised Cover Letter based on all the information available. Make it so that you use the id of the element as the key, and fallback to name if id is empty. Use the following format for output:
    [
      {
        "id": "input1",
        "name": "input1",
        "value": "Detailed answer based on resume and candidate info"
      },
      ...
    ]
    If we don't have information for a field, leave it empty. Here is the filtered input details, candidate info, and resume content. If at any point, for an input field, you feel the content you want to write is too large, skip it`;

    const userContent = `Filtered Input Details: ${JSON.stringify(filteredInputs)}
    
    Candidate Info: ${JSON.stringify(candidateInfo)}
    
    Resume Content: ${candidateInfo.resumeContent}`;

    return callOpenAI(systemPrompt, userContent, apiKey);
}

async function callOpenAI(systemPrompt, userContent, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo-0125',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            temperature: 0.5
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response from OpenAI API');
    }

    const content = data.choices[0].message.content.trim();
    const cleanedContent = content.replace(/^```json|```$/g, '').trim();
    console.log(cleanedContent);
    return JSON.parse(cleanedContent);
}

async function getCandidateInfo() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (data) => {
            if (chrome.runtime.lastError) {
                reject(new Error(`Failed to get candidate info: ${chrome.runtime.lastError.message}`));
            } else {
                resolve(data);
            }
        });
    });
}