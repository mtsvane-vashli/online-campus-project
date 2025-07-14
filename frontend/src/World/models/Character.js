// src/World/models/Character.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Character {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.radius = 0.5;

        this.model = null;
        this.mixer = null;
        this.animationActions = {};
        this.activeAction = null;

        this.body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(-10, 100, -20),
            shape: new CANNON.Sphere(this.radius),
            material: new CANNON.Material(),
        });
        this.body.angularDamping = 1.0;
        this.world.addBody(this.body);

        this.loadModel();
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            '/assets/fox.glb',
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(0.02, 0.02, 0.02);
                this.model.traverse(node => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        const oldMaterial = node.material;
                        node.material = new THREE.MeshToonMaterial({
                            color: oldMaterial.color,
                            map: oldMaterial.map,
                        });
                    }
                });
                this.scene.add(this.model);

                this.mixer = new THREE.AnimationMixer(this.model);
                const surveyClip = THREE.AnimationClip.findByName(gltf.animations, 'Survey');
                const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'Walk');
                const runClip = THREE.AnimationClip.findByName(gltf.animations, 'Run');

                if (surveyClip) this.animationActions.idle = this.mixer.clipAction(surveyClip);
                if (walkClip) this.animationActions.walk = this.mixer.clipAction(walkClip);
                if (runClip) this.animationActions.run = this.mixer.clipAction(runClip);

                if (this.animationActions.idle) {
                    this.setActiveAction(this.animationActions.idle);
                }
            }
        );
    }

    setActiveAction(action) {
        if (this.activeAction === action) return;
        if (this.activeAction) this.activeAction.fadeOut(0.2);
        this.activeAction = action;
        this.activeAction.reset().fadeIn(0.2).play();
    }

    update(delta, keys, camera) {
        if (!this.model || !this.mixer) return;

        // Shiftキーが押されているかで速度を切り替え
        const isRunning = keys['shift'];
        const currentSpeed = isRunning ? 10 : 5; // 走る速度:10, 歩く速度:5
        
        const moveDirection = new THREE.Vector3();
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        
        euler.setFromQuaternion(camera.quaternion);
        euler.x = 0;
        euler.z = 0;
        
        if (keys['w']) moveDirection.z = -1;
        if (keys['s']) moveDirection.z = 1;
        if (keys['a']) moveDirection.x = -1;
        if (keys['d']) moveDirection.x = 1;

        if (moveDirection.length() > 0) {
            moveDirection.normalize().applyEuler(euler);
        }
        
        this.body.velocity.x = moveDirection.x * currentSpeed;
        this.body.velocity.z = moveDirection.z * currentSpeed;

        this.mixer.update(delta);

        // 速度に応じてアニメーションを決定
        const speed = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z).length();
        if (speed > 5.1 && this.animationActions.run) { // 走る速度の閾値
            this.setActiveAction(this.animationActions.run);
        } else if (speed > 0.1 && this.animationActions.walk) {
            this.setActiveAction(this.animationActions.walk);
        } else if (this.animationActions.idle) {
            this.setActiveAction(this.animationActions.idle);
        }

        this.model.position.copy(this.body.position);
        this.model.position.y -= this.radius;

        const lookDirection = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
        if (lookDirection.length() > 0.1) {
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), lookDirection.normalize());
            this.model.quaternion.slerp(targetQuaternion, 0.1);
        }
    }
}