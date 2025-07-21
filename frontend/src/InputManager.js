// frontend/src/InputManager.js
import * as THREE from 'three';

export class InputManager {
    constructor(world) {
        this.world = world;
        this.keys = world.keys;
        this.touchState = world.touchState;
        this.cameraOffset = world.cameraOffset;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        document.addEventListener('chat-opened', () => this.onChatOpened());
        document.addEventListener('chat-closed', () => this.onChatClosed());

        document.body.addEventListener('click', () => this.onBodyClick());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        window.addEventListener('resize', () => this.onWindowResize());

        // Touch Events
        const joystickBase = document.getElementById('joystick-base');
        const joystickStick = document.getElementById('joystick-stick');
        const actionButton = document.getElementById('action-button');

        joystickBase.addEventListener('touchstart', (e) => this.onJoystickTouchStart(e), { passive: false });
        joystickBase.addEventListener('touchmove', (e) => this.onJoystickTouchMove(e), { passive: false });
        joystickBase.addEventListener('touchend', (e) => this.onJoystickTouchEnd(e), { passive: false });

        actionButton.addEventListener('touchend', (e) => this.onActionButtonTouchEnd(e));

        // Camera touch controls
        this.world.renderer.domElement.addEventListener('touchstart', (e) => this.onRendererTouchStart(e), { passive: false });
        this.world.renderer.domElement.addEventListener('touchmove', (e) => this.onRendererTouchMove(e), { passive: false });
        this.world.renderer.domElement.addEventListener('touchend', (e) => this.onRendererTouchEnd(e), { passive: false });
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = true;

        if (key === 'p') {
            const pos = this.world.character.body.position;
            console.log(`Character Position: { x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)} }`);
        }
    }

    onKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }

    onChatOpened() {
        if (this.world.character) {
            this.world.character.disableInput();
        }
    }

    onChatClosed() {
        if (this.world.character) {
            this.world.character.enableInput();
        }
    }

    onBodyClick() {
        if (window.innerWidth > 800) {
            document.body.requestPointerLock();
        }
    }

    onMouseMove(e) {
        if (document.pointerLockElement === document.body) {
            this.world.handleCameraRotation(e.movementX, e.movementY);
        }
    }

    onWindowResize() {
        this.world.camera.aspect = window.innerWidth / window.innerHeight;
        this.world.camera.updateProjectionMatrix();
        this.world.renderer.setPixelRatio(window.devicePixelRatio);
        this.world.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onJoystickTouchStart(e) {
        e.preventDefault();
        this.touchState.joystick.active = true;
        const touch = e.changedTouches[0];
        this.touchState.joystick.startX = touch.clientX;
        this.touchState.joystick.startY = touch.clientY;
    }

    onJoystickTouchMove(e) {
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

        const joystickStick = document.getElementById('joystick-stick');
        joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

        this.updateKeysFromJoystick(deltaX, deltaY);
    }

    onJoystickTouchEnd(e) {
        e.preventDefault();
        this.touchState.joystick.active = false;
        const joystickStick = document.getElementById('joystick-stick');
        joystickStick.style.transform = 'translate(0, 0)';
        this.resetKeys();
    }

    onActionButtonTouchEnd(e) {
        e.preventDefault();
        if (this.world.interactionUI) {
            this.world.interactionUI.handleActionButtonClick();
        }
    }

    onRendererTouchStart(e) {
        const targetId = e.target.id;
        if (targetId.includes('joystick') || targetId.includes('action-button') || targetId.includes('chat')) {
            return;
        }

        if (this.touchState.camera.active) return;

        e.preventDefault();

        const touch = e.changedTouches[0];
        this.touchState.camera.active = true;
        this.touchState.camera.touchId = touch.identifier;
        this.touchState.camera.startX = touch.clientX;
        this.touchState.camera.startY = touch.clientY;
    }

    onRendererTouchMove(e) {
        if (!this.touchState.camera.active) return;

        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchState.camera.touchId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return;

        const deltaX = touch.clientX - this.touchState.camera.startX;
        const deltaY = touch.clientY - this.touchState.camera.startY;

        this.world.handleCameraRotation(deltaX, deltaY);

        this.touchState.camera.startX = touch.clientX;
        this.touchState.camera.startY = touch.clientY;
    }

    onRendererTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchState.camera.touchId) {
                this.touchState.camera.active = false;
                this.touchState.camera.touchId = null;
                break;
            }
        }
    }

    updateKeysFromJoystick(deltaX, deltaY) {
        const moveThreshold = 20;
        const runThreshold = 50;

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
        this.keys['shift'] = false;
    }
}
