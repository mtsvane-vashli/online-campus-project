// src/main.js
import { World } from './World/World.js';

async function main() {
    const world = new World();
    await world.init();

    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';
}

main();