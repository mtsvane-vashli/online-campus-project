// frontend/src/config.js
export const CAMERA_SETTINGS = {
    offset: { x: 0, y: 0, z: 2 },
    lookAtOffset: { y: 1 },
    raycastDistance: 8,
    collisionFilterMask: 2, // Assuming character's collision group is 1
    collision: {
        margin: 0.5,        // how far from hit point to place camera
        minDistance: 0.7,   // clamp closest camera distance
        smoothness: 10.0,   // higher = faster responsiveness
    },
};

// Input-specific settings for camera rotation
export const INPUT_SETTINGS = {
    mouse: {
        camera: {
            sensitivity: 0.002, // baseline for pointer-lock mouse
            maxDelta: 50,
        },
    },
    touch: {
        camera: {
            // Base sensitivity before device scaling; roughly ~3x mouse
            sensitivity: 0.006,
            maxDelta: 100,
            // Scale sensitivity by DPR and screen width to keep feel consistent
            scaleByDPR: true,
            baseWidth: 375, // iPhone base width
            minWidthScale: 0.9,
            maxWidthScale: 1.3,
        },
    },
};

export const CHARACTER_SETTINGS = {
    modelPath: '/fox.glb',
    flyingModelPath: '/phoenix.glb',
    scale: 0.005,
    radius: 0.1,
    speed: {
        walk: 5,
        run: 10,
    },
    terminalVelocity: 10,
};

export const INFO_BOXES = [
    {
        position: { x: 10, y: 1.5, z: 5 },
        title: '中央図書館',
        text: '九州大学の中央図書館です。豊富な蔵書と静かな学習スペースが魅力です。',
    },
    {
        position: { x: 1, y: 0, z: -6 },
        color: 0x00ff00,
        title: '理学部棟',
        text: 'ここは理学部の建物です。最先端の研究が行われています。',
    },
];

export const PHYSICS_SETTINGS = {
    gravity: { x: 0, y: -9.82, z: 0 },
    worldStep: 1 / 120,
};
