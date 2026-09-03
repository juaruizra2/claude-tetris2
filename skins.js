'use strict';

// Unidad 3 — Temas visuales / skins.
// Cargado DESPUES de game.js: puede usar sus globals (COLORS, THEME_COLORS,
// theme, board, draw, drawNext, etc.) porque game.js no es un módulo ES,
// solo variables/funciones top-level en el mismo scope léxico global.

const SKIN_STORAGE_KEY = 'tetris-skin';
const DEFAULT_SKIN = 'retro';

// Paleta "retro": réplica exacta de la paleta original de game.js.
// Referencia directa a COLORS (definida en game.js, cargado antes) en vez
// de duplicar los literales, para que ambas no puedan divergir.
const RETRO_COLORS = COLORS;

const NEON_COLORS = [
  null,
  '#00e5ff', // I
  '#ffee00', // O
  '#d500f9', // T
  '#00ff6a', // S
  '#ff1744', // Z
  '#3d5afe', // J
  '#ff9100', // L
  '#e0e0e0', // Nut
];

const PASTEL_COLORS = [
  null,
  '#a8dadc', // I
  '#ffe8a3', // O
  '#d8bfd8', // T
  '#b8e6b8', // S
  '#f4a8a8', // Z
  '#b3c1f0', // J
  '#ffcfa3', // L
  '#d9d9d9', // Nut
];

const PIXEL_COLORS = [
  null,
  '#5cc9e0',
  '#e0c34d',
  '#a15fb0',
  '#6ab86a',
  '#c15c5c',
  '#5c6cb0',
  '#d99a4d',
  '#8a8a8a',
];

function drawBlockRetro(ctx, x, y, colorIndex, size, alpha) {
  const color = RETRO_COLORS[colorIndex];
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = SKINS.retro.highlight;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

function drawBlockNeon(ctx, x, y, colorIndex, size, alpha) {
  const color = NEON_COLORS[colorIndex];
  ctx.globalAlpha = alpha ?? 1;
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = SKINS.neon.highlight;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

function drawBlockPastel(ctx, x, y, colorIndex, size, alpha) {
  const color = PASTEL_COLORS[colorIndex];
  const px = x * size + 1;
  const py = y * size + 1;
  const w = size - 2;
  const h = size - 2;
  const radius = 5;
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(px, py, w, h, radius);
    ctx.fill();
  } else {
    ctx.fillRect(px, py, w, h);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(px, py, w, h, radius);
    ctx.stroke();
  } else {
    ctx.strokeRect(px, py, w, h);
  }
  ctx.fillStyle = SKINS.pastel.highlight;
  ctx.fillRect(px, py, w, 4);
  ctx.globalAlpha = 1;
}

function drawBlockPixel(ctx, x, y, colorIndex, size, alpha) {
  const color = PIXEL_COLORS[colorIndex];
  const px = x * size + 1;
  const py = y * size + 1;
  const w = size - 2;
  const h = size - 2;
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = SKINS.pixel.highlight;
  ctx.fillRect(px, py, w, 4);

  // textura tipo pixel-art: patrón de tablero de ajedrez con celdas pequeñas
  const cell = Math.max(2, Math.floor(size / 8));
  for (let ry = 0; ry * cell < h; ry++) {
    for (let rx = 0; rx * cell < w; rx++) {
      if ((rx + ry) % 2 === 0) continue;
      const cw = Math.min(cell, w - rx * cell);
      const ch = Math.min(cell, h - ry * cell);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(px + rx * cell, py + ry * cell, cw, ch);
    }
  }
  ctx.globalAlpha = 1;
}

const SKINS = {
  retro: {
    colors: RETRO_COLORS,
    grid: '#22222e',
    highlight: 'rgba(255,255,255,0.12)',
    boardBg: '#1a1a25',
    drawBlock: drawBlockRetro,
  },
  neon: {
    colors: NEON_COLORS,
    grid: '#1a1a2e',
    highlight: 'rgba(255,255,255,0.25)',
    boardBg: '#000000',
    drawBlock: drawBlockNeon,
  },
  pastel: {
    colors: PASTEL_COLORS,
    grid: '#eeeef5',
    highlight: 'rgba(255,255,255,0.5)',
    boardBg: '#fdfdfb',
    drawBlock: drawBlockPastel,
  },
  pixel: {
    colors: PIXEL_COLORS,
    grid: '#2a2a2a',
    highlight: 'rgba(255,255,255,0.15)',
    boardBg: '#111111',
    drawBlock: drawBlockPixel,
  },
};

let currentSkin = DEFAULT_SKIN;

function getActiveSkin() {
  return SKINS[currentSkin] || SKINS[DEFAULT_SKIN];
}

function applySkin(skinName, redraw) {
  currentSkin = SKINS[skinName] ? skinName : DEFAULT_SKIN;
  localStorage.setItem(SKIN_STORAGE_KEY, currentSkin);

  document.body.classList.remove('skin-retro', 'skin-neon', 'skin-pastel', 'skin-pixel');
  document.body.classList.add('skin-' + currentSkin);
  // Se fija en body (no en :root) porque body.light-theme (style.css)
  // redeclara --board-bg directamente en body; un override en :root
  // quedaría oculto por esa regla más específica cuando el tema es claro.
  document.body.style.setProperty('--board-bg', getActiveSkin().boardBg);

  const skinSelect = document.getElementById('skin-select');
  if (skinSelect) skinSelect.value = currentSkin;

  if (redraw !== false) {
    if (typeof board !== 'undefined' && board && typeof draw === 'function') draw();
    if (typeof next !== 'undefined' && next && typeof drawNext === 'function') drawNext();
  }
}

function initSkin() {
  const saved = localStorage.getItem(SKIN_STORAGE_KEY);
  applySkin(SKINS[saved] ? saved : DEFAULT_SKIN, false);
}

const skinSelectEl = document.getElementById('skin-select');
if (skinSelectEl) {
  skinSelectEl.addEventListener('change', () => {
    applySkin(skinSelectEl.value);
  });
}

initSkin();
