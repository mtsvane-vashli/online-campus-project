// src/World/environment.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { threeToCannon } from './utils/three-to-cannon.js'; // 物理メッシュ変換用のヘルパー

// 非同期関数として定義
export async function createCampusEnvironment(scene, world) {
    // Lighting (ライティング設定はそのまま)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 50, 20); // ライトの位置を調整
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // 影の解像度を上げる
    directionalLight.shadow.mapSize.height = 4096;

    // 影のカメラの範囲を調整
    directionalLight.shadow.camera.left = 0; // 左端
    directionalLight.shadow.camera.right = 0; // 右端
    directionalLight.shadow.camera.top = 0; // 上端
    directionalLight.shadow.camera.bottom = 0; // 下端
    directionalLight.shadow.camera.near = 0.5; // 影の開始距離
    directionalLight.shadow.camera.far = 200; // 影の終了距離

    scene.add(directionalLight);

    // Campus Model Loading
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync('./assets/Kyushu_University_beta1.glb');
        const campusModel = gltf.scene;
        scene.add(campusModel);

        // モデル内のすべてのメッシュに対して物理設定と影の設定を行う
        campusModel.traverse(node => {
            if (node.isMesh) {
                // 影を有効にする
                node.castShadow = true;
                node.receiveShadow = true;

                const shape = threeToCannon(node, { scale: PHYSICS_SCALE_MULTIPLIER });
                if (shape) {
                    const body = new CANNON.Body({ mass: 0 });
                    body.addShape(shape);
                    
                    const worldPosition = new THREE.Vector3();
                    const worldQuaternion = new THREE.Quaternion();
                    node.getWorldPosition(worldPosition);
                    node.getWorldQuaternion(worldQuaternion);
                    
                    // ★★★ オフセットを適用 ★★★
                    body.position.copy(worldPosition);
                    body.position.y += PHYSICS_Y_OFFSET;
                    body.quaternion.copy(worldQuaternion);
                    
                    world.addBody(body);
                }
            }
        });
    } catch (error) {
        console.error('キャンパスモデルの読み込みに失敗しました:', error);
    }
}
