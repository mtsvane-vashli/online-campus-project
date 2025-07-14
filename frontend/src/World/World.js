// src/World/World.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCampusEnvironment } from './environment.js';
import { Character } from './models/Character.js';
import { InfoBox } from './models/InfoBox.js';
import { Chat } from '../UI/Chat.js';
import { InteractionUI } from '../UI/InteractionUI.js';
import { OutlineEffect } from './utils/OutlineEffect.js';
//import CannonDebugger from './utils/cannon-debugger.js'; // デバッガーをインポート

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
        this.effect = null; // OutlineEffect
        this.directionalLight = null; // 指向性ライト
    }

    async init() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x87ceeb);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;

        this.effect = new OutlineEffect(this.renderer);

        this.directionalLight = await createCampusEnvironment(this.scene, this.physicsWorld); 
        this.character = new Character(this.scene, this.physicsWorld);

        // --- 情報ポイントの作成 ---
        this.infoBoxes = [
            new InfoBox(this.scene, this.physicsWorld, {
                position: new THREE.Vector3(10, 1.5, 5), // ← Pキーで調べた座標に置き換える
                title: '中央図書館',
                text: '九州大学の中央図書館です。豊富な蔵書と静かな学習スペースが魅力です。'
            }),
            new InfoBox(this.scene, this.physicsWorld, {
                position: new THREE.Vector3(1, 0, -6), // ← Pキーで調べた座標に置き換える
                color: 0x00ff00,
                title: '理学部棟',
                text: 'ここは理学部の建物です。最先端の研究が行われています。'
            })
        ];
        
        this.chat = new Chat();
        this.interactionUI = new InteractionUI(this.character, this.infoBoxes);
        
        //this.debugger = CannonDebugger(this.scene, this.physicsWorld);

        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            // 'P'キーでキャラクターの現在位置をコンソールに出力する
            if (key === 'p') {
                const pos = this.character.body.position;
                console.log(`Character Position: { x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)} }`);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
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
        
        
        //if (this.debugger) {
        //    this.debugger.update();
        //}
        
        

        if (this.character) {
            this.character.update(delta, this.keys, this.camera);
            this.updateCamera();
            this.updateLight(); // ライトの更新処理を呼び出す
        }

        if(this.interactionUI) {
            this.interactionUI.update();
        }

        this.effect.render(this.scene, this.camera);
    }
    
    updateLight() {
        if (this.directionalLight && this.character && this.character.body) {
            // ライトの位置をキャラクターの少し上空に設定
            this.directionalLight.position.x = this.character.body.position.x + 10;
            this.directionalLight.position.y = this.character.body.position.y + 50;
            this.directionalLight.position.z = this.character.body.position.z + 20;

            // ライトのターゲット（注視点）をキャラクターの位置に設定
            this.directionalLight.target.position.copy(this.character.body.position);
            this.directionalLight.target.updateMatrixWorld(); // ターゲットのワールド座標を更新
        }
    }
    
    updateCamera() {
        if (this.character && this.character.body) {
            const cameraTarget = this.character.body.position;
            this.camera.position.copy(cameraTarget).add(this.cameraOffset);
            this.camera.lookAt(new THREE.Vector3(cameraTarget.x, cameraTarget.y + 1, cameraTarget.z));
        }
    }
}
