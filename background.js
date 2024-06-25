
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'filterForms') {
        const formDetails = message.formDetails;
        console.log('Received form details:', formDetails);

        const systemPromptFilter = `You are a helpful assistant who helps to filter out forms. You will be provided a JSON array of forms available on a website. Filter the given forms and retain only those that ask for job applicant information such as name, email, phone number, resume, cover letter, etc. Ignore any other forms. Return the output in the following JSON format, do not provide any explanation:
        [
            {
                "formId": "form1",
                "inputs": [
                    {
                        "tagName": "INPUT",
                        "label": "Name:",
                        "type": "text",
                        "name": "name",
                        "id": "name"
                    },
                    {
                        "tagName": "INPUT",
                        "label": "Email:",
                        "type": "email",
                        "name": "email",
                        "id": "email"
                    },
                    {
                        "tagName": "INPUT",
                        "label": "Phone Number:",
                        "type": "tel",
                        "name": "phone",
                        "id": "phone"
                    },
                    {
                        "tagName": "INPUT",
                        "label": "Resume URL:",
                        "type": "url",
                        "name": "resume",
                        "id": "resume"
                    },
                    {
                        "tagName": "TEXTAREA",
                        "label": "Cover Letter:",
                        "type": "textarea",
                        "name": "coverLetter",
                        "id": "coverLetter"
                    }
                ]
            }
        ]`;

        filterFormsWithOpenAI(formDetails, systemPromptFilter)
            .then(filteredForms => {
                console.log('Filtered Forms:', filteredForms);
                return getCandidateInfo()
                    .then(candidateInfo => {
                        console.log('Candidate Info:', candidateInfo);
                        return fillFormsWithCandidateInfo(filteredForms, candidateInfo);
                    })
                    .then(filledForms => {
                        console.log('Filled Forms:', filledForms);
                        sendResponse({ filledForms });
                    });
            })
            .catch(error => {
                console.error('Error filtering forms:', error);
                sendResponse({ error: error.message });
            });
    }
    return true; // Keep the message channel open for async response
});

async function filterFormsWithOpenAI(formDetails, systemPrompt) {
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
                { role: 'user', content: `${JSON.stringify(formDetails)}` }
            ],
            max_tokens: 500,
            temperature: 0.5
        })
    });

    const data = await response.json();
    const filteredFormsText = data.choices[0].message.content.trim();
    const cleanedText = filteredFormsText.replace(/^```json|```$/g, '').trim();
    console.log('Filtered Forms Text:', cleanedText);
    const filteredForms = JSON.parse(cleanedText);
    return filteredForms;
}

async function getCandidateInfo() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['name', 'email', 'phone', 'resume', 'coverLetter'], (data) => {
            resolve(data);
        });
    });
}

async function fillFormsWithCandidateInfo(filteredForms, candidateInfo) {
    const systemPromptFill = `You are a helpful assistant who matches form fields available with the details you are provided with. Match the filtered form fields with the candidate info provided. Make it so that you use the id of the element as the key. Use the following format for output:
    [
      {
        "formId": "form1",
        "mapping": {
          "name": "John Doe",
          "email": "john.doe@example.com",
          "phone": "123-456-7890",
          "resume": "http://example.com/resume.pdf",
          "coverLetter": "I am very interested in this job..."
        }
      }
    ]
    If we don't have information for a field, leave it empty. Here is the filtered form details and candidate info.`;

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
                { role: 'user', content: `Filtered Form Details: ${JSON.stringify(filteredForms)}\n\nCandidate Info: ${JSON.stringify(candidateInfo)}` }
            ],
            max_tokens: 500,
            temperature: 0.5
        })
    });

    const data = await response.json();
    const filledFormsText = data.choices[0].message.content.trim();
    const cleanedText = filledFormsText.replace(/^```json|```$/g, '').trim();
    console.log('Filled Forms Text:', cleanedText);
    const filledForms = JSON.parse(cleanedText);
    return filledForms;
}