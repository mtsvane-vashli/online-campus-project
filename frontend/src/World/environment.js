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

    const PHYSICS_Y_OFFSET = 0; // この数値を調整します (例: -0.2 や 0.1 など)
    const PHYSICS_SCALE_MULTIPLIER = 1; // 物理シミュレーションのスケール調整用

    // Campus Model Loading
    const loader = new GLTFLoader();
    try {
        const gltf = await loader.loadAsync('./assets/Kyushu_University_beta3_2.glb');
        const campusModel = gltf.scene;
        
        // モデルをシーンに追加
        scene.add(campusModel);

        // モデル内のメッシュをトラバースして、当たり判定と表示を分ける
        campusModel.traverse(node => {
            if (node.isMesh) {
                // メッシュ名に「_collider」が含まれているかチェック
                if (node.name.endsWith('_collider')) {
                    console.log(`[Debug] Processing collider mesh: ${node.name}`); // デバッグログ追加
                    // 当たり判定用のメッシュ
                    const shape = threeToCannon(node, { scale: PHYSICS_SCALE_MULTIPLIER });
                    console.log(`[Debug] Shape created for ${node.name}:`, shape); // デバッグログ追加
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
                }
            }
        });
    } catch (error) {
        console.error('キャンパスモデルの読み込みに失敗しました:', error);
    }
}
