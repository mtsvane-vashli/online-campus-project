// src/utils/Settings.js
import { INPUT_SETTINGS } from '../config.js';

const STORAGE_KEY = 'oc_settings_v1';

const defaults = {
  invertY: false,
  leftHanded: false,
  mouseSensitivity: INPUT_SETTINGS.mouse.camera.sensitivity,
  touchSensitivity: INPUT_SETTINGS.touch.camera.sensitivity,
  joystickDeadzone: 20,
  joystickRunThreshold: 50,
};

let current = { ...defaults, ...loadStored() };
const listeners = new Set();

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch (_) {}
}

export function getSettings() { return { ...current }; }
export function get(key) { return key in current ? current[key] : undefined; }
export function set(partial) {
  current = { ...current, ...partial };
  persist();
  listeners.forEach((fn) => { try { fn(getSettings()); } catch (_) {} });
}
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

