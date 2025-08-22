// src/UI/SettingsUI.js
import { getSettings, set as setSettings, onChange } from '../utils/Settings.js';

export class SettingsUI {
  constructor() {
    this.panel = document.getElementById('settings-panel');
    this.openBtn = document.getElementById('settings-open-btn');
    this.closeBtn = document.getElementById('settings-close-btn');

    // Controls
    this.invertY = document.getElementById('setting-invertY');
    this.leftHanded = document.getElementById('setting-leftHanded');
    this.touchSensitivity = document.getElementById('setting-touchSensitivity');
    this.mouseSensitivity = document.getElementById('setting-mouseSensitivity');
    this.deadzone = document.getElementById('setting-joystickDeadzone');
    this.runThreshold = document.getElementById('setting-joystickRunThreshold');

    this.init();
  }

  init() {
    if (!this.panel || !this.openBtn) return;
    this.openBtn.addEventListener('click', () => this.show());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.hide());

    const s = getSettings();
    this.invertY.checked = !!s.invertY;
    this.leftHanded.checked = !!s.leftHanded;
    this.touchSensitivity.value = s.touchSensitivity;
    this.mouseSensitivity.value = s.mouseSensitivity;
    this.deadzone.value = s.joystickDeadzone;
    this.runThreshold.value = s.joystickRunThreshold;

    // Wire inputs
    this.invertY.addEventListener('change', () => setSettings({ invertY: this.invertY.checked }));
    this.leftHanded.addEventListener('change', () => setSettings({ leftHanded: this.leftHanded.checked }));
    this.touchSensitivity.addEventListener('input', () => setSettings({ touchSensitivity: parseFloat(this.touchSensitivity.value) }));
    this.mouseSensitivity.addEventListener('input', () => setSettings({ mouseSensitivity: parseFloat(this.mouseSensitivity.value) }));
    this.deadzone.addEventListener('input', () => setSettings({ joystickDeadzone: parseInt(this.deadzone.value, 10) }));
    this.runThreshold.addEventListener('input', () => setSettings({ joystickRunThreshold: parseInt(this.runThreshold.value, 10) }));

    // Reflect left-handed class on body
    const applyBodyClass = (settings) => {
      document.body.classList.toggle('left-handed', !!settings.leftHanded);
    };
    applyBodyClass(s);
    onChange(applyBodyClass);
  }

  show() { this.panel?.classList.remove('hidden'); }
  hide() { this.panel?.classList.add('hidden'); }
}

