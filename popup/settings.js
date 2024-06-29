document.addEventListener('DOMContentLoaded', () => {
    loadSavedDetails();

    document.getElementById('addWorkExperience').addEventListener('click', () => addWorkExperience());
    document.getElementById('addEducation').addEventListener('click', () => addEducation());
    document.getElementById('saveSettings').addEventListener('click', saveDetails);
});

function loadSavedDetails() {
    chrome.storage.sync.get(null, (data) => {
        document.getElementById('name').value = data.name || '';
        document.getElementById('familyName').value = data.familyName || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('address1').value = data.address1 || '';
        document.getElementById('address2').value = data.address2 || '';
        document.getElementById('city').value = data.city || '';
        document.getElementById('state').value = data.state || '';
        document.getElementById('postalCode').value = data.postalCode || '';
        document.getElementById('country').value = data.country || '';
        document.getElementById('skills').value = data.skills || '';
        document.getElementById('portfolio').value = data.portfolio || '';
        document.getElementById('coverLetter').value = data.coverLetter || '';
        document.getElementById('apiKey').value = data.apiKey || '';
        if (data.workExperience) {
            data.workExperience.forEach(work => addWorkExperience(work));
        }
        if (data.education) {
            data.education.forEach(edu => addEducation(edu));
        }
    });
}

function addWorkExperience(work = {}) {
    const container = document.getElementById('workExperienceContainer');
    const workEntry = document.createElement('div');
    workEntry.classList.add('entry');
    workEntry.innerHTML = `
        <label>job title</label>
        <input type="text" name="jobTitle" value="${work.jobTitle || ''}">
        <label>company</label>
        <input type="text" name="company" value="${work.company || ''}">
        <label>start date</label>
        <input type="date" name="startDate" value="${work.startDate || ''}">
        <label>end date</label>
        <input type="date" name="endDate" value="${work.endDate || ''}">
        <button type="button" class="removeButton" style="background-color: gray; color: black; border: 1px">remove</button>
    `;
    container.appendChild(workEntry);
    workEntry.querySelector('.removeButton').addEventListener('click', () => {
        workEntry.style.opacity = '0';
        setTimeout(() => container.removeChild(workEntry), 30);
    });
    workEntry.style.opacity = '0';
    setTimeout(() => workEntry.style.opacity = '1', 10);
}

function addEducation(edu = {}) {
    const container = document.getElementById('educationContainer');
    const eduEntry = document.createElement('div');
    eduEntry.classList.add('entry');
    eduEntry.innerHTML = `
        <label>school name</label>
        <input type="text" name="schoolName" value="${edu.schoolName || ''}">
        <label>degree</label>
        <input type="text" name="degree" value="${edu.degree || ''}">
        <label>start date</label>
        <input type="date" name="eduStartDate" value="${edu.eduStartDate || ''}">
        <label>end date</label>
        <input type="date" name="eduEndDate" value="${edu.eduEndDate || ''}">
        <button type="button" class="removeButton" style="background-color: gray; color: black; border: 1px">remove</button>
    `;
    container.appendChild(eduEntry);
    eduEntry.querySelector('.removeButton').addEventListener('click', () => {
        eduEntry.style.opacity = '0';
        setTimeout(() => container.removeChild(eduEntry), 300);
    });
    eduEntry.style.opacity = '0';
    setTimeout(() => eduEntry.style.opacity = '1', 10);
}

function saveDetails() {
    const name = document.getElementById('name').value;
    const familyName = document.getElementById('familyName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address1 = document.getElementById('address1').value;
    const address2 = document.getElementById('address2').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const postalCode = document.getElementById('postalCode').value;
    const country = document.getElementById('country').value;
    const skills = document.getElementById('skills').value;
    const portfolio = document.getElementById('portfolio').value;
    const coverLetter = document.getElementById('coverLetter').value;
    const apiKey = document.getElementById('apiKey').value;

    const workExperience = Array.from(document.querySelectorAll('#workExperienceContainer .entry')).map(entry => ({
        jobTitle: entry.querySelector('[name="jobTitle"]').value,
        company: entry.querySelector('[name="company"]').value,
        startDate: entry.querySelector('[name="startDate"]').value,
        endDate: entry.querySelector('[name="endDate"]').value,
    }));

    const education = Array.from(document.querySelectorAll('#educationContainer .entry')).map(entry => ({
        schoolName: entry.querySelector('[name="schoolName"]').value,
        degree: entry.querySelector('[name="degree"]').value,
        eduStartDate: entry.querySelector('[name="eduStartDate"]').value,
        eduEndDate: entry.querySelector('[name="eduEndDate"]').value,
    }));

    const resumeFile = document.getElementById('resume').files[0];
    if (resumeFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const resumeData = e.target.result;
            chrome.storage.sync.set({ apiKey, name, familyName, email, phone, address1, address2, city, state, postalCode, country, skills, portfolio, coverLetter, workExperience, education, resumeData }, () => {
                showSaveSuccess();
            });
        };
        reader.readAsDataURL(resumeFile);
    } else {
        chrome.storage.sync.set({ apiKey, name, familyName, email, phone, address1, address2, city, state, postalCode, country, skills, portfolio, coverLetter, workExperience, education }, () => {
            showSaveSuccess();
        });
    }
}

function showSaveSuccess() {
    const saveButton = document.getElementById('saveSettings');
    saveButton.innerHTML = 'saved!';
    saveButton.style.backgroundColor = 'green';
    saveButton.style.color = 'white';
    setTimeout(() => {
        saveButton.innerHTML = 'save';
        saveButton.style.backgroundColor = 'white';
        saveButton.style.color = 'black';
    }, 2000);
}