// src/World/environment.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { threeToCannon } from './utils/three-to-cannon.js'; // 物理メッシュ変換用のヘルパー

// 非同期関数として定義
export async function createCampusEnvironment(scene, world, mode = 'day') {
    // Lighting (ライティング設定はそのまま)
    // Lighting (ライティング設定はそのまま)
    let ambientLight;
    let directionalLight;

    if (mode === 'night') {
        scene.background = new THREE.Color(0x0a0a20); // 非常に暗い青
        ambientLight = new THREE.AmbientLight(0x404080, 0.3); // 青みがかった弱い環境光
        directionalLight = new THREE.DirectionalLight(0x8080a0, 0.2); // 青みがかった弱い指向性ライト
        directionalLight.position.set(10, 50, 20);

        // 星の追加
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });

        const starVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starVertices.push(x, y, z);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

    } else { // 'day' mode
        scene.background = new THREE.Color(0x87CEEB); // スカイブルー
        ambientLight = new THREE.AmbientLight(0xb0e0e6, 0.5); // 空の色に合わせて調整
        directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // 通常の明るさの指向性ライト
        directionalLight.position.set(10, 50, 20);
    }

    scene.add(ambientLight);
    directionalLight.position.set(10, 50, 20); // ライトの位置を調整
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // 影の解像度を上げる
    directionalLight.shadow.mapSize.height = 4096;

    // 影のカメラの範囲を調整
    directionalLight.shadow.camera.left = -100; // 左端
    directionalLight.shadow.camera.right = 100; // 右端
    directionalLight.shadow.camera.top = 100; // 上端
    directionalLight.shadow.camera.bottom = -100; // 下端
    directionalLight.shadow.camera.near = 0.5; // 影の開始距離
    directionalLight.shadow.camera.far = 200; // 影の終了距離

    scene.add(directionalLight);

    const PHYSICS_Y_OFFSET = 0; // この数値を調整します (例: -0.2 や 0.1 など)
    const PHYSICS_SCALE_MULTIPLIER = 1; // 物理シミュレーションのスケール調整用

    // Campus Model Loading
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync('/Kyushu_University_beta4.glb');
        const campusModel = gltf.scene;
        
        // モデルをシーンに追加
        scene.add(campusModel);

        // モデル内のメッシュをトラバースして、当たり判定と表示を分ける
        campusModel.traverse(node => {
            if (node.isMesh) {
                // メッシュ名に「_collider」が含まれているかチェック
                if (node.name.endsWith('_collider')) {
                    // 当たり判定用のメッシュ
                    const shape = threeToCannon(node, { scale: PHYSICS_SCALE_MULTIPLIER });
                    if (shape) {
                        const body = new CANNON.Body({ mass: 0 });
                        body.addShape(shape);

                        const worldPosition = new THREE.Vector3();
                        const worldQuaternion = new THREE.Quaternion();
                        node.getWorldPosition(worldPosition);
                        node.getWorldQuaternion(worldQuaternion);

                        body.position.copy(worldPosition);
                        body.position.y += PHYSICS_Y_OFFSET;
                        body.quaternion.copy(worldQuaternion);

                        world.addBody(body);
                    }
                    // 当たり判定用メッシュは非表示にする
                    node.visible = false;
                } else {
                    // 見た目用のメッシュ
                    node.castShadow = true;
                    node.receiveShadow = true;
                    const oldMaterial = node.material;
                    node.material = new THREE.MeshToonMaterial({
                        color: oldMaterial.color,
                        map: oldMaterial.map,
                    });
                }
            }
        });
    } catch (error) {
        console.error('キャンパスモデルの読み込みに失敗しました:', error);
    }

    return directionalLight; // ライトを返す
}
