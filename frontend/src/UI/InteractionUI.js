// src/UI/InteractionUI.js
export class InteractionUI {
    // 複数のinfoBoxesを配列で受け取るように変更
    constructor(character, infoBoxes) {
        this.character = character;
        this.infoBoxes = infoBoxes;
        
        this.interactionPrompt = document.getElementById('interaction-prompt');
        this.infoPanel = document.getElementById('info-panel');
        this.infoPanelTitle = document.querySelector('#info-panel-content h2');
        this.infoPanelText = document.querySelector('#info-panel-content p');


        this.activeInfoBox = null; // 現在アクティブな情報ボックス
        this.interactionDistance = 5;

        this.setupEventListeners();
    }

    setupEventListeners() {

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            // Eキーでパネルの表示・非表示
            if (key === 'e' && this.activeInfoBox) {
                this.togglePanel();
            }
            // Escキーでパネルを閉じる
            if (key === 'escape' && this.infoPanel.style.display === 'block') {
                this.closePanel();
            }
        });
    }

    togglePanel() {
        const isPanelVisible = this.infoPanel.style.display === 'block';
        if (isPanelVisible) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        if (!this.activeInfoBox) return;
        // アクティブなInfoBoxの情報をパネルに設定
        this.infoPanelTitle.textContent = this.activeInfoBox.title;
        this.infoPanelText.textContent = this.activeInfoBox.text;
        this.infoPanel.style.display = 'block';
        this.interactionPrompt.style.display = 'none';
        document.exitPointerLock(); // パネルを開くとカーソルロックを解除
    }

    closePanel() {
        this.infoPanel.style.display = 'none';
    }

    update() {
        let closestBox = null;
        let minDistance = this.interactionDistance;

        // 最も近い情報ボックスを探す
        for (const infoBox of this.infoBoxes) {
            const distance = this.character.body.position.distanceTo(infoBox.body.position);
            if (distance < minDistance) {
                minDistance = distance;
                closestBox = infoBox;
            }
        }
        this.activeInfoBox = closestBox;

        if (this.activeInfoBox && this.infoPanel.style.display !== 'block') {
            this.interactionPrompt.style.display = 'block';
        } else {
            this.interactionPrompt.style.display = 'none';
        }
    }
}
