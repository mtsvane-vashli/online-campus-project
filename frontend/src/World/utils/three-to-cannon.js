// src/World/utils/three-to-cannon.js
import * as CANNON from 'cannon-es';

// Three.jsのメッシュからCannon.jsのTrimeshを生成するヘルパー関数
export function threeToCannon(mesh) {
    const geometry = mesh.geometry;
    if (!geometry) {
        return null;
    }

    let vertices = geometry.attributes.position.array;
    let indices = geometry.index ? geometry.index.array : undefined;

    // 非インデックスジオメトリのインデックスを生成
    if (!indices) {
        indices = [];
        for (let i = 0; i < vertices.length / 3; i++) {
            indices.push(i);
        }
    }

    // Cannon.jsはFloat32Arrayではなく通常の配列を期待する場合がある
    const verticesForCannon = Array.from(vertices);
    const indicesForCannon = Array.from(indices);

    return new CANNON.Trimesh(verticesForCannon, indicesForCannon);
}
