// src/World/utils/cannon-debugger.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// cannon-esの物理ボディを視覚化するデバッガー
export default function CannonDebugger(scene, world) {
    const meshes = [];
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    const bodyToMesh = new Map();

    function createMesh(shape) {
        let mesh;
        const { SPHERE, BOX, PLANE, TRIMESH } = CANNON.Shape.types;
        switch(shape.type) {
            case SPHERE: {
                mesh = new THREE.Mesh(new THREE.SphereGeometry(shape.radius), material);
                break;
            }
            case BOX: {
                const { x, y, z } = shape.halfExtents;
                mesh = new THREE.Mesh(new THREE.BoxGeometry(x * 2, y * 2, z * 2), material);
                break;
            }
            case TRIMESH: {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(shape.vertices), 3));
                geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(shape.indices), 1));
                mesh = new THREE.Mesh(geometry, material);
                break;
            }
        }
        return mesh;
    }

    function update() {
        for (const [body, meshGroup] of bodyToMesh.entries()) {
            meshGroup.position.copy(body.position);
            meshGroup.quaternion.copy(body.quaternion);
        }
    }

    world.bodies.forEach(body => {
        const meshGroup = new THREE.Group();
        body.shapes.forEach((shape, i) => {
            const mesh = createMesh(shape);
            if (mesh) {
                const offset = body.shapeOffsets[i];
                const orientation = body.shapeOrientations[i];
                mesh.position.set(offset.x, offset.y, offset.z);
                mesh.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
                meshGroup.add(mesh);
            }
        });
        bodyToMesh.set(body, meshGroup);
        scene.add(meshGroup);
    });

    return { update };
}
