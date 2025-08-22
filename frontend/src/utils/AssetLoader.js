// src/utils/AssetLoader.js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ASSET_PATHS } from '../config.js';

// Centralized factory for GLTFLoader configured with Draco (and room for KTX2 later)
export function createGLTFLoader(options = {}) {
  const { dracoDecoderPath = ASSET_PATHS.dracoDecoderPath } = options;

  const gltfLoader = new GLTFLoader();

  // Draco configuration
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(dracoDecoderPath);
  gltfLoader.setDRACOLoader(dracoLoader);

  return gltfLoader;
}
