'use strict';

// Unidad 1: menú de pausa. Depende de globals definidos en game.js
// (togglePause, init, getStoredStartLevel, START_LEVEL_KEY) que ya están
// disponibles porque este script se carga después de game.js.

const pauseMenu = document.getElementById('pause-menu');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const pauseControlsBtn = document.getElementById('pause-controls-btn');
const pauseControlsPanel = document.getElementById('pause-controls-panel');
const startLevelSelect = document.getElementById('start-level');

function showPauseMenu() {
  if (startLevelSelect) startLevelSelect.value = String(getStoredStartLevel());
  if (pauseControlsPanel) pauseControlsPanel.classList.add('hidden');
  if (pauseMenu) pauseMenu.classList.remove('hidden');
}

function hidePauseMenu() {
  if (pauseMenu) pauseMenu.classList.add('hidden');
}

if (pauseResumeBtn) {
  pauseResumeBtn.addEventListener('click', () => {
    togglePause();
  });
}

if (pauseRestartBtn) {
  pauseRestartBtn.addEventListener('click', () => {
    init();
  });
}

if (pauseControlsBtn) {
  pauseControlsBtn.addEventListener('click', () => {
    if (pauseControlsPanel) pauseControlsPanel.classList.toggle('hidden');
  });
}

if (startLevelSelect) {
  startLevelSelect.addEventListener('change', () => {
    const value = parseInt(startLevelSelect.value, 10);
    if (Number.isInteger(value) && value >= 1 && value <= 10) {
      localStorage.setItem(START_LEVEL_KEY, String(value));
    }
  });
}
