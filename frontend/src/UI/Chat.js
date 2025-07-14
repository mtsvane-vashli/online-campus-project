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
        this.chatOpenBtn.addEventListener('click', () => this.openChat());
        this.chatCloseBtn.addEventListener('click', () => this.closeChat());
        this.chatSendBtn.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') this.sendMessage();
        });

        this.chatContainer.addEventListener('click', (event) => event.stopPropagation());
        this.chatOpenBtn.addEventListener('click', (event) => event.stopPropagation());
    }

    openChat() {
        this.chatContainer.classList.remove('hidden');
        this.chatOpenBtn.classList.add('hidden');
    }

    closeChat() {
        this.chatContainer.classList.add('hidden');
        this.chatOpenBtn.classList.remove('hidden');
    }

    async sendMessage() {
        const messageText = this.chatInput.value.trim();
        if (messageText === '') return;

        this.appendMessage(messageText, 'user-message');
        this.chatInput.value = '';

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