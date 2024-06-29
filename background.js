chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'filterInputs') {
        const inputDetails = message.inputDetails;
        console.log('Received input details:', inputDetails);
        chrome.storage.sync.get('apiKey', (data) => {
            const apiKey = data.apiKey;
            if (!apiKey) {
                sendResponse({ error: 'No API Key provided.' });
                return;
            }
        const systemPromptFilter = `You are a helpful assistant who helps to filter out input fields. You will be provided a JSON array of input elements available on a website. 
        Filter the given inputs and retain only those that ask for job applicant information such as name, family name, email, phone number, address, resume, cover letter, etc. But keep in mind that this is not a restrictive list. Have high consideration and include inputs which are relavant. 
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

        filterInputsWithOpenAI(inputDetails, systemPromptFilter)
            .then(filteredInputs => {
                console.log('Filtered Inputs:', filteredInputs);
                return getCandidateInfo()
                    .then(candidateInfo => {
                        console.log('Candidate Info:', candidateInfo);
                        return fillInputsWithCandidateInfo(filteredInputs, candidateInfo);
                    })
                    .then(filledInputs => {
                        console.log('Filled Inputs:', filledInputs);
                        sendResponse({ filledInputs });
                    });
            })
            .catch(error => {
                console.error('Error filtering inputs:', error);
                sendResponse({ error: error.message });
            });
        });
    }
    return true; // Keep the message channel open for async response
});

async function filterInputsWithOpenAI(inputDetails, systemPrompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${JSON.stringify(inputDetails)}` }
            ],
            max_tokens: 500,
            temperature: 0.5
        })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response from OpenAI API');
    }

    const filteredInputsText = data.choices[0].message.content.trim();
    const cleanedText = filteredInputsText.replace(/^```json|```$/g, '').trim();
    console.log('Filtered Inputs Text:', cleanedText);
    const filteredInputs = JSON.parse(cleanedText);
    return filteredInputs;
}

async function getCandidateInfo() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['name', 'familyName', 'email', 'phone', 'address1', 'address2', 'city', 'state', 'postalCode', 'country', 'skills', 'portfolio', 'coverLetter', 'workExperience', 'education', 'resumeData'], (data) => {
            resolve(data);
        });
    });
}

async function fillInputsWithCandidateInfo(filteredInputs, candidateInfo) {
    const systemPromptFill = `You are a helpful assistant who matches input fields available with the details you are provided with. Match the filtered input fields with the candidate info provided. Make it so that you use the id of the element as the key, and fallback to name if id is empty. Use the following format for output:
    [
      {
        "id": "input1",
        "name": "input1",
        "value": "John Doe"
      },
      ...
    ]
    If we don't have information for a field, leave it empty. Here is the filtered input details and candidate info.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPromptFill },
                { role: 'user', content: `Filtered Input Details: ${JSON.stringify(filteredInputs)}\n\nCandidate Info: ${JSON.stringify(candidateInfo)}` }
            ],
            max_tokens: 500,
            temperature: 0.5
        })
    });

    const data = await response.json();
    let filledInputsText = data.choices[0].message.content.trim();
    filledInputsText = filledInputsText.replace(/^```json|```$/g, '').trim();

    // Ensure proper JSON formatting by removing trailing commas
    filledInputsText = filledInputsText.replace(/,(\s*})/g, '$1').replace(/,(\s*\])/g, '$1');

    console.log('Filled Inputs Text:', filledInputsText);
    const filledInputs = JSON.parse(filledInputsText);
    return filledInputs;
}