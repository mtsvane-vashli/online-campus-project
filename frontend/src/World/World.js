// src/World/World.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCampusEnvironment } from './environment.js';
import { Character } from './models/Character.js';
// import { InfoBox } from './models/InfoBox.js';
import { Chat } from '../UI/Chat.js';
// import { InteractionUI } from '../UI/InteractionUI.js';
import CannonDebugger from './utils/cannon-debugger.js'; // デバッガーをインポート

export class World {
    constructor() {
        // Basic setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();

        // Physics
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.82, 0);

        // Controls
        this.keys = {};
        this.cameraOffset = new THREE.Vector3(0, 2, 8);

        // Components
        this.character = null;
        this.infoBox = null;
        this.interactionUI = null;
        this.chat = null;
        this.debugger = null; // デバッガー用のプロパティを追加
    }

    async init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87ceeb);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        await createCampusEnvironment(this.scene, this.physicsWorld); 
        this.character = new Character(this.scene, this.physicsWorld);
        
        this.chat = new Chat();
        
        this.debugger = CannonDebugger(this.scene, this.physicsWorld);

        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        
        document.body.addEventListener('click', () => { document.body.requestPointerLock(); });
        
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -e.movementX * 0.002);
                const newY = this.cameraOffset.y + e.movementY * 0.002;
                if (newY > 1 && newY < 5) this.cameraOffset.y = newY;
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        this.physicsWorld.step(1/60, delta, 3);
        
        
        if (this.debugger) {
            this.debugger.update();
        }
        
        

        if (this.character) {
            this.character.update(delta, this.keys, this.camera);
            this.updateCamera();
        }

        // if(this.interactionUI) {
        //     this.interactionUI.update();
        // }

        this.renderer.render(this.scene, this.camera);
    }
    
    updateCamera() {
        if (this.character && this.character.body) {
            const cameraTarget = this.character.body.position;
            this.camera.position.copy(cameraTarget).add(this.cameraOffset);
            this.camera.lookAt(new THREE.Vector3(cameraTarget.x, cameraTarget.y + 1, cameraTarget.z));
        }
    }
}
