import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CHARACTER_SETTINGS } from '../../config.js';

export class Character {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.radius = CHARACTER_SETTINGS.radius;

        this.model = null;
        this.flyingModel = null;
        this.mixer = null;
        this.flyingMixer = null;
        this.animationActions = {};
        this.flyingAnimationAction = null;
        this.activeAction = null;

        this.body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(-154.05, 6.08, 30.33),
            shape: new CANNON.Sphere(this.radius),
            material: new CANNON.Material(),
        });
        this.body.angularDamping = 1.0;
        this.maxFallSpeed = CHARACTER_SETTINGS.terminalVelocity;
        this.world.addBody(this.body);

        this.inputEnabled = true;
        this.isFlying = false;

        // this.loadModels();
    }

    async init() {
        await this.loadModels();
    }

    enableInput() {
        this.inputEnabled = true;
    }

    disableInput() {
        this.inputEnabled = false;
    }

    toggleFlyingMode() {
        this.isFlying = !this.isFlying;
        this.body.allowSleep = !this.isFlying;

        if (this.isFlying) {
            this.scene.remove(this.model);
            this.scene.add(this.flyingModel);
            if (this.activeAction) this.activeAction.stop();
            if (this.flyingAnimationAction) this.flyingAnimationAction.play();
        } else {
            this.scene.remove(this.flyingModel);
            this.scene.add(this.model);
            if (this.flyingAnimationAction) this.flyingAnimationAction.stop();
            if (this.animationActions.idle) this.setActiveAction(this.animationActions.idle);
        }
    }

    loadModels() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            let modelsLoaded = 0;

            const onModelLoad = () => {
                modelsLoaded++;
                if (modelsLoaded === 2) {
                    resolve();
                }
            };

            // Load walking model
            loader.load(
                CHARACTER_SETTINGS.modelPath,
                (gltf) => {
                    this.model = gltf.scene;
                    this.model.scale.set(CHARACTER_SETTINGS.scale, CHARACTER_SETTINGS.scale, CHARACTER_SETTINGS.scale);
                    this.model.traverse(node => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            const oldMaterial = node.material;
                            node.material = new THREE.MeshToonMaterial({
                                color: oldMaterial.color,
                                map: oldMaterial.map,
                            });
                            // 法線がない場合に計算する
                            if (!node.geometry.attributes.normal) {
                                node.geometry.computeVertexNormals();
                            }
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
                    onModelLoad();
                },
                undefined,
                reject
            );

            // Load flying model
            loader.load(
                CHARACTER_SETTINGS.flyingModelPath,
                (gltf) => {
                    this.flyingModel = gltf.scene;
                    this.flyingModel.scale.set(CHARACTER_SETTINGS.scale, CHARACTER_SETTINGS.scale, CHARACTER_SETTINGS.scale);
                    this.flyingModel.traverse(node => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            const oldMaterial = node.material;
                            node.material = new THREE.MeshToonMaterial({
                                color: oldMaterial.color,
                                map: oldMaterial.map,
                            });
                        }
                    });
                    this.flyingMixer = new THREE.AnimationMixer(this.flyingModel);
                    const flyingClip = THREE.AnimationClip.findByName(gltf.animations, 'Take 001');
                    if (flyingClip) {
                        this.flyingAnimationAction = this.flyingMixer.clipAction(flyingClip);
                    }
                    onModelLoad();
                },
                undefined,
                reject
            );
        });
    }

    setActiveAction(action) {
        if (this.activeAction === action) return;
        if (this.activeAction) this.activeAction.fadeOut(0.2);
        this.activeAction = action;
        this.activeAction.reset().fadeIn(0.2).play();
    }

    update(delta, keys, camera) {
        if (!this.model || !this.flyingModel) return;
        if (!this.inputEnabled) {
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
            if (this.animationActions.idle) {
                this.setActiveAction(this.animationActions.idle);
            }
            return;
        }

        const activeModel = this.isFlying ? this.flyingModel : this.model;

        if (this.isFlying) {
            this.updateFlying(delta, keys, camera);
        } else {
            this.updateWalking(delta, keys, camera);
        }

        if (this.body.velocity.y < -this.maxFallSpeed) {
            this.body.velocity.y = -this.maxFallSpeed;
        }

        activeModel.position.copy(this.body.position);
        activeModel.position.y -= this.radius;

        const lookDirection = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
        if (lookDirection.length() > 0.1) {
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), lookDirection.normalize());
            activeModel.quaternion.slerp(targetQuaternion, 0.1);
        }
    }

    updateFlying(delta, keys, camera) {
        const currentSpeed = CHARACTER_SETTINGS.speed.run;
        const moveDirection = new THREE.Vector3();
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');

        euler.setFromQuaternion(camera.quaternion);
        euler.x = 0;
        euler.z = 0;

        if (keys['w']) moveDirection.z = -1;
        if (keys['s']) moveDirection.z = 1;
        if (keys['a']) moveDirection.x = -1;
        if (keys['d']) moveDirection.x = 1;

        let verticalVelocity = 0;
        if (keys[' ']) verticalVelocity = currentSpeed;
        if (keys['c']) verticalVelocity = -currentSpeed;

        if (moveDirection.length() > 0) {
            moveDirection.normalize().applyEuler(euler);
        }

        this.body.velocity.x = moveDirection.x * currentSpeed;
        this.body.velocity.z = moveDirection.z * currentSpeed;
        this.body.velocity.y = verticalVelocity;

        if (this.flyingMixer) {
            this.flyingMixer.update(delta);
        }
    }

    updateWalking(delta, keys, camera) {
        const isRunning = keys['shift'];
        const currentSpeed = isRunning ? CHARACTER_SETTINGS.speed.run : CHARACTER_SETTINGS.speed.walk;
        
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

        if (this.mixer) {
            this.mixer.update(delta);
        }

        const speed = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z).length();
        if (speed > 5.1 && this.animationActions.run) {
            this.setActiveAction(this.animationActions.run);
        } else if (speed > 0.1 && this.animationActions.walk) {
            this.setActiveAction(this.animationActions.walk);
        } else if (this.animationActions.idle) {
            this.setActiveAction(this.animationActions.idle);
        }
    }
}