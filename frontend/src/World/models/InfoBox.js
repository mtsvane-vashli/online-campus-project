// src/World/models/InfoBox.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class InfoBox {
    constructor(scene, world, position = new THREE.Vector3(10, 1, 0)) {
        this.scene = scene;
        this.world = world;
        this.position = position;
        const size = 2;

        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshStandardMaterial({ color: 0xff4500 })
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