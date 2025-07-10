// src/World/utils/three-to-cannon.js
import * as CANNON from 'cannon-es';

// スケール調整に対応したヘルパー関数
export function threeToCannon(mesh, options = {}) {
    // オプションからスケール乗数を取得、なければ1.0をデフォルト値とする
    const scale = options.scale || 1.0;
    
    const geometry = mesh.geometry;
    if (!geometry) {
        return null;
    }

    let vertices = geometry.attributes.position.array;
    let indices = geometry.index ? geometry.index.array : undefined;

    // スケール乗数を適用した新しい頂点配列を作成
    const scaledVertices = [];
    for (let i = 0; i < vertices.length; i++) {
        // すべての頂点座標にスケール値を掛け合わせる
        scaledVertices.push(vertices[i] * scale);
    }

    if (!indices) {
        indices = [];
        for (let i = 0; i < scaledVertices.length / 3; i++) {
            indices.push(i);
        }
    }

    return new CANNON.Trimesh(scaledVertices, Array.from(indices));
}
