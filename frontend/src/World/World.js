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

        // Touch controls
        this.touchState = { joystick: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }, camera: { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, touchId: null } };

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
        this.interactionUI = new InteractionUI(this.character, this.infoBoxes, this.keys);
        
        //this.debugger = CannonDebugger(this.scene, this.physicsWorld);

        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            if (key === 'p') {
                const pos = this.character.body.position;
                console.log(`Character Position: { x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)} }`);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.body.addEventListener('click', () => { 
            if(window.innerWidth > 800) document.body.requestPointerLock(); 
        });

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

        // Touch Events
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        const actionButton = document.getElementById('action-button');

        joystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.joystick.active = true;
            const touch = e.changedTouches[0];
            this.touchState.joystick.startX = touch.clientX;
            this.touchState.joystick.startY = touch.clientY;
        }, { passive: false });

        joystickBase.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touchState.joystick.active) return;
            const touch = e.changedTouches[0];
            this.touchState.joystick.currentX = touch.clientX;
            this.touchState.joystick.currentY = touch.clientY;

            const deltaX = this.touchState.joystick.currentX - this.touchState.joystick.startX;
            const deltaY = this.touchState.joystick.currentY - this.touchState.joystick.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 60;
            const angle = Math.atan2(deltaY, deltaX);

            const stickX = Math.min(maxDistance, distance) * Math.cos(angle);
            const stickY = Math.min(maxDistance, distance) * Math.sin(angle);

            joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

            this.updateKeysFromJoystick(deltaX, deltaY);
        }, { passive: false });

        joystickBase.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.joystick.active = false;
            joystickStick.style.transform = 'translate(0, 0)';
            this.resetKeys();
        }, { passive: false });

        actionButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.interactionUI) {
                this.interactionUI.handleActionButtonClick();
            }
        });

        // Camera touch controls
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            // Check if the touch originated on a UI element
            const targetId = e.target.id;
            if (targetId.includes('joystick') || targetId.includes('action-button') || targetId.includes('chat')) {
                // Allow default behavior for UI elements to enable their clicks/taps
                return;
            }

            // If there's already a camera touch, ignore new ones
            if (this.touchState.camera.active) return;

            e.preventDefault(); // Only prevent default if it's a camera touch

            const touch = e.changedTouches[0];
            this.touchState.camera.active = true;
            this.touchState.camera.touchId = touch.identifier;
            this.touchState.camera.startX = touch.clientX;
            this.touchState.camera.startY = touch.clientY;
        }, { passive: false });

        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (!this.touchState.camera.active) return;

            // Find the correct touch
            let touch = null;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchState.camera.touchId) {
                    touch = e.changedTouches[i];
                    break;
                }
            }
            if (!touch) return; // Touch not found

            const deltaX = touch.clientX - this.touchState.camera.startX;
            const deltaY = touch.clientY - this.touchState.camera.startY;

            this.cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * 0.005);
            const newY = this.cameraOffset.y + deltaY * 0.005;
            if (newY > 1 && newY < 5) this.cameraOffset.y = newY;

            this.touchState.camera.startX = touch.clientX;
            this.touchState.camera.startY = touch.clientY;
        }, { passive: false });

        this.renderer.domElement.addEventListener('touchend', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchState.camera.touchId) {
                    this.touchState.camera.active = false;
                    this.touchState.camera.touchId = null;
                    break;
                }
            }
        }, { passive: false });
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
            const characterPos = this.character.body.position; // this is a CANNON.Vec3
            const lookAtPoint = new THREE.Vector3(characterPos.x, characterPos.y + 1, characterPos.z);

            // Create a normalized THREE.Vector3 from the camera offset
            const offsetDirection = this.cameraOffset.clone().normalize();

            // Calculate the desired camera position (as a THREE.Vector3)
            const desiredCameraPos = new THREE.Vector3().copy(lookAtPoint).add(offsetDirection.multiplyScalar(8));

            // Now, convert to CANNON.Vec3 for raycasting
            const rayFrom = new CANNON.Vec3(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z);
            const rayTo = new CANNON.Vec3(desiredCameraPos.x, desiredCameraPos.y, desiredCameraPos.z);

            const ray = new CANNON.Ray(rayFrom, rayTo);
            ray.collisionFilterMask = ~this.character.body.collisionFilterGroup; // Ignore character's physics body

            const result = new CANNON.RaycastResult();
            if (this.physicsWorld.raycastClosest(ray.from, ray.to, {}, result)) {
                // Collision detected. Position camera just before the hit point.
                const hitPoint = result.hitPointWorld; // CANNON.Vec3
                
                // Create a direction vector from the lookAtPoint to the hitPoint
                const direction = new CANNON.Vec3();
                hitPoint.vsub(rayFrom, direction);
                direction.normalize();

                // Move back a little from the hit point
                const newCamPos = hitPoint.vsub(direction.scale(0.5));

                this.camera.position.copy(newCamPos); // Copy from CANNON.Vec3 to THREE.Vector3
            } else {
                // No collision, use the desired position
                this.camera.position.copy(desiredCameraPos);
            }

            this.camera.lookAt(lookAtPoint);
        }
    }

    updateKeysFromJoystick(deltaX, deltaY) {
        const moveThreshold = 20;
        const runThreshold = 50; // ジョイスティックを大きく倒したと判断する閾値

        this.keys['w'] = deltaY < -moveThreshold;
        this.keys['s'] = deltaY > moveThreshold;
        this.keys['a'] = deltaX < -moveThreshold;
        this.keys['d'] = deltaX > moveThreshold;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        this.keys['shift'] = distance > runThreshold;
    }

    resetKeys() {
        this.keys['w'] = false;
        this.keys['s'] = false;
        this.keys['a'] = false;
        this.keys['d'] = false;
        this.keys['shift'] = false; // shiftキーもリセット
    }
}
