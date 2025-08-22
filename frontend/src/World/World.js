// src/World/World.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createCampusEnvironment } from './environment.js';
import { Character } from './models/Character.js';
import { InfoBox } from './models/InfoBox.js';
import { Chat } from '../UI/Chat.js';
import { InteractionUI } from '../UI/InteractionUI.js';
import { OutlineEffect } from './utils/OutlineEffect.js';
import { CAMERA_SETTINGS, INFO_BOXES, PHYSICS_SETTINGS, INPUT_SETTINGS } from '../config.js';
import CannonDebugger from './utils/cannon-debugger.js'; // デバッガーをインポート

import { InputManager } from '../InputManager.js';

export class World {
    constructor() {
        // Basic setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = null; // Initialized in init()
        this.clock = new THREE.Clock();

        // Physics
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(PHYSICS_SETTINGS.gravity.x, PHYSICS_SETTINGS.gravity.y, PHYSICS_SETTINGS.gravity.z);

        // Controls
        this.keys = {};
        this.cameraYaw = 0; // Initial yaw
        this.cameraPitch = 0; // Initial pitch
        this.cameraOffset = new THREE.Vector3(CAMERA_SETTINGS.offset.x, CAMERA_SETTINGS.offset.y, CAMERA_SETTINGS.offset.z);
        this.currentCameraDistance = this.cameraOffset.length();

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
        this.inputManager = null;
    }

    async init(mode = 'day') {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x87ceeb);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);
        this.renderer = renderer;

        this.effect = new OutlineEffect(this.renderer);

        this.directionalLight = await createCampusEnvironment(this.scene, this.physicsWorld, mode);
        this.character = new Character(this.scene, this.physicsWorld);
        await this.character.init();

        // --- 情報ポイントの作成 ---
        this.infoBoxes = INFO_BOXES.map(info => new InfoBox(this.scene, this.physicsWorld, {
            ...info,
            position: new THREE.Vector3(info.position.x, info.position.y, info.position.z),
        }));

        this.chat = new Chat();
        this.interactionUI = new InteractionUI(this.character, this.infoBoxes, this.keys);
        this.inputManager = new InputManager(this);

        //this.debugger = CannonDebugger(this.scene, this.physicsWorld);

        this.animate();
    }

    

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        this.physicsWorld.step(PHYSICS_SETTINGS.worldStep, delta, 3);
        
        if (this.keys['v']) {
            this.character.toggleFlyingMode();
            this.keys['v'] = false;
        }
        
        if (this.debugger) {
           this.debugger.update();
        }
        
        

        if (this.character) {
            this.character.update(delta, this.keys, this.camera);
            this.updateCamera(delta);
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

    handleCameraRotation(deltaX, deltaY, inputType = 'mouse') {
        // Select sensitivity based on input type
        let sensitivity = INPUT_SETTINGS.mouse.camera.sensitivity;
        let maxDelta = INPUT_SETTINGS.mouse.camera.maxDelta;

        if (inputType === 'touch') {
            const touchConf = INPUT_SETTINGS.touch.camera;
            sensitivity = touchConf.sensitivity;
            maxDelta = touchConf.maxDelta;

            // Apply DPR and viewport-width scaling to touch sensitivity
            let multiplier = 1.0;
            if (touchConf.scaleByDPR && typeof window !== 'undefined') {
                const dpr = window.devicePixelRatio || 1;
                const width = window.innerWidth || touchConf.baseWidth;
                const widthScaleRaw = width / touchConf.baseWidth;
                const widthScale = Math.max(touchConf.minWidthScale, Math.min(touchConf.maxWidthScale, widthScaleRaw));
                multiplier = dpr * widthScale;
            }
            sensitivity *= multiplier;
            // Increase clamp slightly with multiplier to avoid over-clamping on high-DPR
            maxDelta = Math.max(maxDelta, maxDelta * (multiplier / 2));
        }

        // Clamp deltaX and deltaY to prevent extreme values
        deltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
        deltaY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));

        this.cameraYaw -= deltaX * sensitivity;
        this.cameraPitch -= deltaY * sensitivity;

        // Clamp pitch to prevent camera from flipping upside down
        this.cameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraPitch));
    }
    
    updateCamera(delta) {
        if (this.character && this.character.body) {
            const characterPos = this.character.body.position; // this is a CANNON.Vec3
            const lookAtPoint = new THREE.Vector3(characterPos.x, characterPos.y + CAMERA_SETTINGS.lookAtOffset.y, characterPos.z);

            // Apply camera rotation based on yaw and pitch
            this.camera.quaternion.setFromEuler(new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, 'YXZ'));

            // Calculate desired camera position based on rotated offset
            const rotatedOffset = this.cameraOffset.clone().applyQuaternion(this.camera.quaternion);
            const desiredCameraPos = new THREE.Vector3().copy(lookAtPoint).add(rotatedOffset);

            // Raycast from lookAtPoint to desired camera position to prevent clipping
            const rayFrom = new CANNON.Vec3(lookAtPoint.x, lookAtPoint.y, lookAtPoint.z);
            const rayTo = new CANNON.Vec3(desiredCameraPos.x, desiredCameraPos.y, desiredCameraPos.z);

            const ray = new CANNON.Ray(rayFrom, rayTo);
            ray.collisionFilterMask = ~this.character.body.collisionFilterGroup; // Ignore character's physics body

            const result = new CANNON.RaycastResult();
            const margin = (CAMERA_SETTINGS.collision && CAMERA_SETTINGS.collision.margin) ? CAMERA_SETTINGS.collision.margin : 0.5;
            if (this.physicsWorld.raycastClosest(ray.from, ray.to, {}, result)) {
                // Collision detected. Position camera just before the hit point.
                const hitPoint = result.hitPointWorld; // CANNON.Vec3

                // Create a direction vector from the lookAtPoint to the hitPoint
                const direction = new CANNON.Vec3();
                hitPoint.vsub(rayFrom, direction);
                direction.normalize();

                // Move back a little from the hit point
                const newCamPos = hitPoint.vsub(direction.scale(margin));

                this.camera.position.copy(newCamPos); // Copy from CANNON.Vec3 to THREE.Vector3
            } else {
                // No collision, use the desired position
                this.camera.position.copy(desiredCameraPos);
            }
        }
    }

    
}
