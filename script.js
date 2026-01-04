document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatArea = document.getElementById('chat-area');
    const sendBtn = document.getElementById('send-btn');
    const welcomeMessage = document.querySelector('.welcome-message');

    // Enable/Disable send button based on input
    userInput.addEventListener('input', () => {
        sendBtn.disabled = userInput.value.trim() === '';
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        // Hide welcome message on first chat
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Add User Message
        addMessage(message, 'user');
        userInput.value = '';
        sendBtn.disabled = true;

        // Show Loading Indicator
        const loadingId = addLoadingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
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
