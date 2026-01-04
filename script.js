document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatArea = document.getElementById('chat-area');
    const sendBtn = document.getElementById('send-btn');
    const welcomeMessage = document.querySelector('.welcome-message');

    const fileInput = document.getElementById('file-input');
    const attachBtn = document.getElementById('attach-btn');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const filePreviewImg = document.getElementById('file-preview-img');
    const fileNamePreview = document.getElementById('file-name-preview');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    let selectedFile = null;

    // New Chat Button Logic
    if (newChatBtn) {
        newChatBtn.addEventListener('click', async () => {
            // Clear Frontend
            chatArea.innerHTML = '';
            // Re-show welcome message if it exists
            if (welcomeMessage) {
                welcomeMessage.style.display = 'flex';
                chatArea.appendChild(welcomeMessage);
            }

            // Clear Backend History
            try {
                await fetch('/api/reset', { method: 'POST' });
            } catch (e) {
                console.error("Failed to reset chat:", e);
            }
        });
    }

    // Attach Button Click
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // File Selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            showPreview(selectedFile);
        }
    });

    // Remove File
    removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        sendBtn.disabled = userInput.value.trim() === '';
    });

    function showPreview(file) {
        filePreviewContainer.style.display = 'flex';
        fileNamePreview.textContent = file.name;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreviewImg.src = e.target.result;
                filePreviewImg.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            filePreviewImg.style.display = 'none';
        }
        sendBtn.disabled = false; // Enable send if file is present
    }

    // Enable/Disable send button logic also needs to verify file presence
    userInput.addEventListener('input', () => {
        sendBtn.disabled = (userInput.value.trim() === '' && !selectedFile);
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();

        if (!message && !selectedFile) return;

        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Add User Message (Text + Optional File Indicator)
        let displayMsg = message;
        if (selectedFile) {
            displayMsg += `\n*[Attached: ${selectedFile.name}]*`;
        }

        addMessage(displayMsg, 'user');

        // Reset Inputs
        userInput.value = '';
        const fileToSend = selectedFile; // Capture for sending

        // Reset UI immediately
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        sendBtn.disabled = true;

        const loadingId = addLoadingIndicator();

        try {
            // Use FormData for multipart upload
            const formData = new FormData();
            formData.append('message', message);
            if (fileToSend) {
                formData.append('file', fileToSend);
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                // Content-Type header not set manually to let browser set boundary
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                addMessage(`Error: ${data.error || 'Unknown server error'}`, 'ai');
                removeLoadingIndicator(loadingId);
                return;
            }

            // Remove loading indicator
            removeLoadingIndicator(loadingId);

            if (data.error) {
                addMessage(`Error: ${data.error}`, 'ai');
            } else {
                addMessage(data.response, 'ai');
            }

        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessage("Sorry, I'm having trouble connecting to the server. Please check your connection or API key.", 'ai');
        }
    });

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = sender === 'user' ? 'U' : 'AI';

        const content = document.createElement('div');
        content.classList.add('message-content');

        if (sender === 'ai') {
            // Parse Markdown
            content.innerHTML = marked.parse(text);
            // Highlight code blocks
            content.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            content.textContent = text;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatArea.appendChild(messageDiv);

        // Scroll to bottom
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function addLoadingIndicator() {
        const id = 'loading-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'ai');
        messageDiv.id = id;

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = 'AI';

        const content = document.createElement('div');
        content.classList.add('message-content');
        content.innerHTML = `
            <div class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;

        return id;
    }

    function removeLoadingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }
});
