// src/main.js
import { World } from './World/World.js';
import { SettingsUI } from './UI/SettingsUI.js';
import { getSettings, onChange } from './utils/Settings.js';

async function main() {
    const world = new World();
    await world.init();

    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';

    // Register Service Worker for asset caching
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.warn('SW registration failed:', err);
            });
        });
    }

    // Init settings panel and apply left-handed on load
    new SettingsUI();
    const applyBodyClass = (s) => { document.body.classList.toggle('left-handed', !!s.leftHanded); };
    applyBodyClass(getSettings());
    onChange(applyBodyClass);
}

main();
