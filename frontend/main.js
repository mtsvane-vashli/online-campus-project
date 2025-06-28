import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// =========== 必須要素の初期化 ===========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87ceeb);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// =========== 物理エンジンの設定 ===========
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// =========== ライティング ===========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// =========== ダミーアセット（地面） ===========
const textureLoader = new THREE.TextureLoader();
const checkerTexture = textureLoader.load('https://threejs.org/examples/textures/checker.png');
checkerTexture.wrapS = THREE.RepeatWrapping;
checkerTexture.wrapT = THREE.RepeatWrapping;
checkerTexture.repeat.set(100, 100);
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ map: checkerTexture });
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = -Math.PI / 2;
groundMesh.receiveShadow = true;
scene.add(groundMesh);
const groundBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Plane(),
    material: new CANNON.Material(),
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// =========== 情報ボックスの作成 ===========
const infoBoxSize = 2;
// Three.js側の見た目
const infoBoxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(infoBoxSize, infoBoxSize, infoBoxSize),
    new THREE.MeshStandardMaterial({ color: 0xff4500 }) // オレンジ色
);
infoBoxMesh.position.set(10, infoBoxSize / 2, 0); // 配置したい場所
infoBoxMesh.castShadow = true;
scene.add(infoBoxMesh);

// cannon-es側の物理的な実体
const infoBoxBody = new CANNON.Body({
    mass: 0, // 静的オブジェクト
    shape: new CANNON.Box(new CANNON.Vec3(infoBoxSize / 2, infoBoxSize / 2, infoBoxSize / 2)),
    position: new CANNON.Vec3(infoBoxMesh.position.x, infoBoxMesh.position.y, infoBoxMesh.position.z)
});
world.addBody(infoBoxBody);


// =========== キャラクターモデルと物理ボディ ===========
// 物理的な実体 (ここはシンプルな球体のまま)
const characterRadius = 0.5;
const characterBody = new CANNON.Body({
    mass: 5,
    position: new CANNON.Vec3(0, 5, 0),
    shape: new CANNON.Sphere(characterRadius),
    material: new CANNON.Material(),
});
characterBody.angularDamping = 1.0;
world.addBody(characterBody);

// アニメーション関連の変数を準備
let model, mixer, animations;
const animationActions = {};
let activeAction;

// GLTFLoaderを使ってモデルを読み込む
const loader = new GLTFLoader();
loader.load(
    './assets/fox.glb', // ★★★ あなたのモデルファイル名に書き換えてください ★★★
    (gltf) => {
        model = gltf.scene;
        model.scale.set(0.02, 0.02, 0.02); // モデルの大きさに合わせて調整
        
        // モデルに影を適用
        model.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
            }
        });
        
        scene.add(model);

        // アニメーションをセットアップ
        animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);

        // アニメーションクリップを名前でアクセスできるように準備
        // ★★★ モデルのアニメーション名に合わせて "Idle", "Walk" を書き換えてください ★★★
        const idleClip = THREE.AnimationClip.findByName(animations, 'Survey'); // ← ここを修正
        const walkClip = THREE.AnimationClip.findByName(animations, 'Walk');
        const runClip = THREE.AnimationClip.findByName(animations, 'Run');

        if (idleClip) animationActions.idle = mixer.clipAction(idleClip);
        if (walkClip) animationActions.walk = mixer.clipAction(walkClip);
        // if (runClip) animationActions.run = mixer.clipAction(runClip);

        // 初期状態として 'idle' アニメーションを再生
        if (animationActions.idle) {
            setActiveAction(animationActions.idle);
        }
    },
    undefined,
    (error) => {
        console.error('An error happened while loading the model:', error);
    }
);

// アニメーションをスムーズに切り替えるための関数
function setActiveAction(action) {
    if (activeAction === action) return;
    if (activeAction) activeAction.fadeOut(0.2);
    activeAction = action;
    activeAction.reset().fadeIn(0.2).play();
}


// =========== TPSカメラと操作の実装 ===========
let cameraTarget = new THREE.Vector3();
let cameraOffset = new THREE.Vector3(0, 2, 8);
let keys = {};
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
document.body.addEventListener('click', () => { document.body.requestPointerLock(); });
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -e.movementX * 0.002);
        const newY = cameraOffset.y + e.movementY * 0.002;
        if (newY > 1 && newY < 5) cameraOffset.y = newY;
    }
});

// =========== UI要素のgetとイベントリスナー ===========
const interactionPrompt = document.getElementById('interaction-prompt');
const infoPanel = document.getElementById('info-panel');
const infoPanelClose = document.getElementById('info-panel-close');

let isNearInfoBox = false;
const interactionDistance = 5; // この距離まで近づいたら反応する

// 情報パネルの「閉じる」ボタンがクリックされた時の処理
infoPanelClose.addEventListener('click', () => {
    infoPanel.style.display = 'none';
});

// 'e'キーで情報パネルの表示・非表示を切り替える処理
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e' && isNearInfoBox) {
        // 現在のパネルの表示状態を取得
        const isPanelVisible = infoPanel.style.display === 'block';
        // 表示状態に応じて、表示・非表示を切り替える
        infoPanel.style.display = isPanelVisible ? 'none' : 'block';
    }
});

// アニメーションループ内で接近をチェックする関数
function checkProximity() {
    const distance = characterBody.position.distanceTo(infoBoxBody.position);
    if (distance < interactionDistance) {
        isNearInfoBox = true;
        // パネルが開いていない時だけ案内を表示する
        if (infoPanel.style.display !== 'block') {
            interactionPrompt.style.display = 'block';
        } else {
            interactionPrompt.style.display = 'none';
        }
    } else {
        isNearInfoBox = false;
        interactionPrompt.style.display = 'none';
    }
}

// =========== アニメーションループ ===========
const clock = new THREE.Clock();
function animate() {
    const delta = clock.getDelta();
    requestAnimationFrame(animate);

    world.step(1/60, delta, 3);
    checkProximity();

    // キャラクターの移動処理
    const moveSpeed = 5;
    const moveDirection = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    euler.setFromQuaternion(camera.quaternion);
    euler.x = 0;
    euler.z = 0;
    
    if (keys['w']) moveDirection.z = -1;
    if (keys['s']) moveDirection.z = 1;
    if (keys['a']) moveDirection.x = -1;
    if (keys['d']) moveDirection.x = 1;
    if(moveDirection.length() > 0) moveDirection.normalize();
    moveDirection.applyEuler(euler);
    
    characterBody.velocity.x = moveDirection.x * moveSpeed;
    characterBody.velocity.z = moveDirection.z * moveSpeed;

    // アニメーションの更新
    if (mixer) {
        mixer.update(delta);
        const speed = new THREE.Vector3(characterBody.velocity.x, 0, characterBody.velocity.z).length();
        if (speed > 0.1 && animationActions.walk) {
            setActiveAction(animationActions.walk);
        } else if (animationActions.idle) {
            setActiveAction(animationActions.idle);
        }
    }

    // モデルの位置と向きを物理ボディに合わせる
    if (model) {
        model.position.copy(characterBody.position);
        model.position.y -= characterRadius; // モデルの足元が地面に合うように調整

        const lookDirection = new THREE.Vector3(characterBody.velocity.x, 0, characterBody.velocity.z);
        if (lookDirection.length() > 0.1) {
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), lookDirection.normalize());
            model.quaternion.slerp(targetQuaternion, 0.1);
        }
    }

    // TPSカメラの更新
    cameraTarget.copy(characterBody.position);
    camera.position.copy(cameraTarget).add(cameraOffset);
    camera.lookAt(cameraTarget);

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========== チャットUIのイベントリスナー ===========
const chatOpenBtn = document.getElementById('chat-open-btn');
const chatCloseBtn = document.getElementById('chat-close-btn');
const chatContainer = document.getElementById('chat-container');

chatOpenBtn.addEventListener('click', () => {
    chatContainer.classList.remove('hidden');
    chatOpenBtn.classList.add('hidden');
});

chatCloseBtn.addEventListener('click', () => {
    chatContainer.classList.add('hidden');
    chatOpenBtn.classList.remove('hidden');
});

chatContainer.addEventListener('click', (event) => {
    event.stopPropagation();
});

chatOpenBtn.addEventListener('click', (event) => {
    event.stopPropagation();
});