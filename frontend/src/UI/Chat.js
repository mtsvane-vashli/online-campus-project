// src/UI/Chat.js
export class Chat {
    constructor() {
        this.chatOpenBtn = document.getElementById('chat-open-btn');
        this.chatCloseBtn = document.getElementById('chat-close-btn');
        this.chatContainer = document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendBtn = document.getElementById('chat-send-btn');

        this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/chat';

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.chatOpenBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.openChat(); });
        this.chatCloseBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.closeChat(); });
        this.chatSendBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.sendMessage(); });
        this.chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') this.sendMessage();
        });

        // PC: Open chat with '/' key
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '/' && window.innerWidth > 800) {
                if (this.chatContainer.classList.contains('hidden')) {
                    this.openChat();
                } else {
                    this.closeChat();
                }
            }
        });

        // Stop propagation for touch events on the container to prevent camera movement
        this.chatContainer.addEventListener('touchstart', (e) => e.stopPropagation());
        this.chatContainer.addEventListener('touchend', (e) => e.stopPropagation());
        this.chatContainer.addEventListener('touchmove', (e) => e.stopPropagation());

        // Stop propagation for touch events on the open button
        this.chatOpenBtn.addEventListener('touchstart', (e) => e.stopPropagation());
        this.chatOpenBtn.addEventListener('touchend', (e) => e.stopPropagation());
    }

    openChat() {
        this.chatContainer.classList.remove('hidden');
        this.chatOpenBtn.classList.add('hidden');
        this.chatInput.focus(); // Add this line to focus on the input field
        document.dispatchEvent(new CustomEvent('chat-opened')); // イベント発火
    }

    closeChat() {
        this.chatContainer.classList.add('hidden');
        this.chatOpenBtn.classList.remove('hidden');
        document.dispatchEvent(new CustomEvent('chat-closed')); // イベント発火
    }

    async sendMessage() {
        const messageText = this.chatInput.value.trim();
        if (messageText === '') return;

        this.appendMessage(messageText, 'user-message');
        this.chatInput.value = '';
        this.closeChat(); // メッセージ送信後にチャットを閉じる

        try {
            const response = await fetch(this.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText }),
            });

            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            this.appendMessage(data.reply, 'bot-message');
        } catch (error) {
            console.error('Fetch error:', error);
            this.appendMessage('エラーが発生しました。サーバーに接続できません。', 'bot-message');
        }
    }

    appendMessage(text, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        messageElement.textContent = text;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}