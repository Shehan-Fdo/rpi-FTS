const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.querySelector('.progress-fill');
const qrBtn = document.getElementById('qr-btn');
const qrModal = document.getElementById('qr-modal');
const closeModal = document.getElementById('close-modal');
const qrContainer = document.getElementById('qr-code-container');
const serverUrl = document.getElementById('server-url');

const socket = io();

// Initial load
fetchFiles();
fetchServerInfo();

// Socket events
socket.on('file_uploaded', (file) => {
    addFileToList(file, true);
});

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Click to upload
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

function handleFiles(files) {
    if (files.length === 0) return;

    Array.from(files).forEach(uploadFile);
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Show progress bar
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    const progressPercent = document.getElementById('progress-percent');
    const progressDetails = document.getElementById('progress-details');

    progressPercent.textContent = '0%';
    progressDetails.textContent = `Preparing...`;

    const startTime = Date.now();

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressFill.style.width = percentComplete + '%';
            progressPercent.textContent = Math.round(percentComplete) + '%';

            // Calculate speed and ETA
            const timeElapsed = (Date.now() - startTime) / 1000; // seconds
            const uploadSpeed = e.loaded / timeElapsed; // bytes per second
            const remainingBytes = e.total - e.loaded;
            const secondsRemaining = remainingBytes / uploadSpeed;

            const speedStr = formatSize(uploadSpeed) + '/s';
            const uploadedStr = formatSize(e.loaded);
            const totalStr = formatSize(e.total);

            let etaStr = '';
            if (!isFinite(secondsRemaining)) {
                etaStr = '...';
            } else if (secondsRemaining < 60) {
                etaStr = Math.round(secondsRemaining) + 's';
            } else {
                etaStr = Math.round(secondsRemaining / 60) + 'm';
            }

            progressDetails.innerHTML = `${uploadedStr} / ${totalStr} &nbsp;&bull;&nbsp; Speed: ${speedStr} &nbsp;&bull;&nbsp; ETA: ${etaStr}`;
        }
    });

    xhr.onload = () => {
        if (xhr.status === 200) {
            console.log('Upload success');
            progressPercent.textContent = '100%';
            progressDetails.textContent = 'Upload Complete!';
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
                progressFill.style.width = '0%';
            }, 2000);
        } else {
            console.error('Upload failed:', xhr.status, xhr.statusText);
            alert(`Upload failed: Server returned ${xhr.status} ${xhr.statusText}`);
            uploadProgress.classList.add('hidden');
        }
    };

    xhr.onerror = () => {
        console.error('Upload error');
        alert('Upload error');
        uploadProgress.classList.add('hidden');
    };

    xhr.open('POST', '/upload');
    xhr.send(formData);
}

function fetchFiles() {
    fetch('/files')
        .then(res => res.json())
        .then(files => {
            fileList.innerHTML = '';
            files.forEach(file => addFileToList(file));
        })
        .catch(err => console.error('Error fetching files:', err));
}

function addFileToList(file, prepend = false) {
    // Check if file already exists in list to avoid duplicates on socket event
    const existing = Array.from(fileList.children).find(li => li.dataset.filename === file.name);
    if (existing) return;

    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.filename = file.name;

    const size = formatSize(file.size);

    li.innerHTML = `
        <div class="file-info">
            <span class="file-name" title="${file.name}">${file.name}</span>
            <span class="file-meta">${size}</span>
        </div>
        <div class="file-actions">
            <a href="/download/${encodeURIComponent(file.name)}" class="btn btn-primary" download>Download</a>
        </div>
    `;

    if (prepend) {
        fileList.prepend(li);
    } else {
        fileList.appendChild(li);
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function fetchServerInfo() {
    fetch('/server-info')
        .then(res => res.json())
        .then(data => {
            serverUrl.textContent = data.url;
            const img = document.createElement('img');
            img.src = data.qrCodeUrl;
            qrContainer.innerHTML = '';
            qrContainer.appendChild(img);
        })
        .catch(err => console.error('Error fetching server info:', err));
}

// Modal logic
qrBtn.addEventListener('click', () => {
    qrModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    qrModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === qrModal) {
        qrModal.classList.add('hidden');
    }
});
