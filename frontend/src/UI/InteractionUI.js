// src/UI/InteractionUI.js
export class InteractionUI {
    constructor(character, infoBox) {
        this.character = character;
        this.infoBox = infoBox;
        
        this.interactionPrompt = document.getElementById('interaction-prompt');
        this.infoPanel = document.getElementById('info-panel');
        this.infoPanelClose = document.getElementById('info-panel-close');

        this.isNearInfoBox = false;
        this.interactionDistance = 5;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.infoPanelClose.addEventListener('click', () => this.closePanel());
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e' && this.isNearInfoBox) {
                this.togglePanel();
            }
        });
    }

    togglePanel() {
        const isPanelVisible = this.infoPanel.style.display === 'block';
        this.infoPanel.style.display = isPanelVisible ? 'none' : 'block';
    }

    closePanel() {
        this.infoPanel.style.display = 'none';
    }

    update() {
        const distance = this.character.body.position.distanceTo(this.infoBox.body.position);
        if (distance < this.interactionDistance) {
            this.isNearInfoBox = true;
            if (this.infoPanel.style.display !== 'block') {
                this.interactionPrompt.style.display = 'block';
            } else {
                this.interactionPrompt.style.display = 'none';
            }
        } else {
            this.isNearInfoBox = false;
            this.interactionPrompt.style.display = 'none';
        }
    }
}