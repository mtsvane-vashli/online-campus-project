// src/World/models/InfoBox.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class InfoBox {
    // コンストラクタで情報を受け取るように変更
    constructor(scene, world, options) {
        this.scene = scene;
        this.world = world;

        // デフォルト値と受け取ったオプションをマージ
        const {
            position = new THREE.Vector3(0, 1, 0),
            size = 2,
            color = 0xff4500,
            title = 'デフォルトタイトル',
            text = 'ここに説明文が入ります。'
        } = options;
        
        this.position = position;
        this.title = title;
        this.text = text;

        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color: color })
        );
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        this.body = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)),
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z)
        });
        this.world.addBody(this.body);
    }
}
