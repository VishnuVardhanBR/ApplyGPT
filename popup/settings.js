document.addEventListener('DOMContentLoaded', () => {
    // Load saved details
    chrome.storage.sync.get(['name', 'email', 'phone', 'address', 'linkedin', 'github', 'coverLetter'], (data) => {
        document.getElementById('name').value = data.name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('address').value = data.address || '';
        document.getElementById('linkedin').value = data.linkedin || '';
        document.getElementById('github').value = data.github || '';
        document.getElementById('coverLetter').value = data.coverLetter || '';
    });

    // Save details
    document.getElementById('saveSettings').addEventListener('click', () => {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const linkedin = document.getElementById('linkedin').value;
        const github = document.getElementById('github').value;
        const coverLetter = document.getElementById('coverLetter').value;

        const resumeFile = document.getElementById('resume').files[0];
        if (resumeFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const resumeData = e.target.result;
                chrome.storage.sync.set({ name, email, phone, address, linkedin, github, resumeData, coverLetter }, () => {
                    alert('Details saved successfully!');
                });
            };
            reader.readAsDataURL(resumeFile);
        } else {
            chrome.storage.sync.set({ name, email, phone, address, linkedin, github, coverLetter }, () => {
                alert('Details saved successfully!');
            });
        }
    });
});