'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');
const pauseMenu = document.getElementById('pause-menu');
const pauseTitle = document.getElementById('pause-title');
const pauseMain = document.getElementById('pause-main');
const pauseControls = document.getElementById('pause-controls');
const resumeBtn = document.getElementById('resume-btn');
const newGameBtn = document.getElementById('new-game-btn');
const showControlsBtn = document.getElementById('show-controls-btn');
const controlsBackBtn = document.getElementById('controls-back-btn');
const levelDownBtn = document.getElementById('level-down');
const levelUpBtn = document.getElementById('level-up');
const startLevelEl = document.getElementById('start-level');
const recordsListEl = document.getElementById('records-list');
const recordsBestsEl = document.getElementById('records-bests');
const resetRecordsBtn = document.getElementById('reset-records');
const overlayRecordsEl = document.getElementById('overlay-records');
const overlayStatsEl = document.getElementById('overlay-stats');
const overlayRecordsListEl = document.getElementById('overlay-records-list');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const skinChips = document.getElementById('skin-chips');

const THEME_STORAGE_KEY = 'tetris-theme';
const START_LEVEL_KEY = 'tetris-start-level';
const MIN_LEVEL = 1;
const MAX_LEVEL = 15;
const THEME_COLORS = {
  dark: { grid: '#22222e', highlight: 'rgba(255,255,255,0.12)' },
  light: { grid: '#d8d8e8', highlight: 'rgba(0,0,0,0.10)' },
};

const SKIN_STORAGE_KEY = 'tetris-skin';

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const clamp = v => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + amount);
  const g = clamp(((n >> 8) & 255) + amount);
  const b = clamp((n & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawRetro(context, px, py, size, color) {
  context.fillStyle = color;
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  context.fillStyle = THEME_COLORS[theme].highlight;
  context.fillRect(px + 1, py + 1, size - 2, 4);
}

function drawNeon(context, px, py, size, color, alpha) {
  context.fillStyle = 'rgba(5, 5, 12, 0.85)';
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  context.shadowColor = color;
  context.shadowBlur = alpha < 1 ? 4 : 12;
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.strokeRect(px + 2, py + 2, size - 4, size - 4);
  context.shadowBlur = 0;
}

function drawPastel(context, px, py, size, color) {
  const radius = size * 0.25;
  context.fillStyle = color;
  if (context.roundRect) {
    context.beginPath();
    context.roundRect(px + 2, py + 2, size - 4, size - 4, radius);
    context.fill();
  } else {
    context.fillRect(px + 2, py + 2, size - 4, size - 4);
  }
}

function drawPixel(context, px, py, size, color) {
  context.fillStyle = color;
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  const sub = (size - 2) / 4;
  for (let sy = 0; sy < 4; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      if ((sx + sy) % 2 === 0) continue;
      context.fillStyle = shade(color, ((sx + sy) % 4 === 1) ? 28 : -28);
      context.fillRect(px + 1 + sx * sub, py + 1 + sy * sub, sub, sub);
    }
  }
  context.strokeStyle = shade(color, -60);
  context.lineWidth = 2;
  context.strokeRect(px + 1, py + 1, size - 2, size - 2);
}

const SKINS = {
  retro: {
    label: 'Retro',
    colors: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d'],
    draw: drawRetro,
    forcesDarkBoard: false,
  },
  neon: {
    label: 'Neon',
    colors: [null, '#00e5ff', '#ffea00', '#e040fb', '#00ff85', '#ff1744', '#3d5afe', '#ff9100'],
    draw: drawNeon,
    forcesDarkBoard: true,
    gridColor: '#12202c',
  },
  pastel: {
    label: 'Pastel',
    colors: [null, '#a8e6f0', '#ffe9a8', '#d9b8f0', '#b8e6c0', '#f5b8b8', '#b8c4f0', '#ffd4a8'],
    draw: drawPastel,
    forcesDarkBoard: false,
  },
  pixel: {
    label: 'Pixel',
    colors: [null, '#3aa0ad', '#d9b23c', '#9a5fa8', '#5fa06a', '#c05a5a', '#5a68a8', '#c98a3f'],
    draw: drawPixel,
    forcesDarkBoard: true,
    gridColor: '#1a1a12',
  },
};
const skinButtons = skinChips ? Array.from(skinChips.querySelectorAll('.chip')) : [];

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let theme = 'dark';
let startLevel = 1;
let pauseView = 'main';
let combo = 0, maxCombo = 0, maxLineClear = 0;
let lastLiveRank = -1;
let skin = 'retro';

const intervalForLevel = lv => Math.max(100, 1000 - (lv - 1) * 90);

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = startLevel + Math.floor(lines / 10);
    dropInterval = intervalForLevel(level);
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    maxLineClear = Math.max(maxLineClear, cleared);
    updateHUD();
  } else {
    combo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  const rank = Records.rankFor(score);
  if (rank !== lastLiveRank) {
    lastLiveRank = rank;
    renderRecords(recordsListEl, recordsBestsEl, rank);
  }
}

function renderRecords(listEl, bestsEl, highlightIndex) {
  const { records, bestCombo, bestLineClear } = Records.load();
  listEl.innerHTML = '';
  if (!records.length) {
    const li = document.createElement('li');
    li.className = 'records-empty';
    li.textContent = 'Sin records aún';
    listEl.appendChild(li);
  } else {
    records.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'records-row' + (i === highlightIndex ? ' is-highlight' : '');
      li.innerHTML = `<span class="records-rank">${i + 1}</span><span class="records-name">${escapeHtml(r.name)}</span><span class="records-score">${r.score.toLocaleString()}</span>`;
      listEl.appendChild(li);
    });
  }
  if (bestsEl) {
    bestsEl.textContent = `Mejor combo: x${bestCombo} · Máx. líneas: ${bestLineClear}`;
  }
}

function refreshRecords(highlightIndex) {
  renderRecords(recordsListEl, recordsBestsEl, -1);
  renderRecords(overlayRecordsListEl, null, highlightIndex);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const s = SKINS[skin];
  const color = s.colors[colorIndex];
  const a = alpha ?? 1;
  context.save();
  context.globalAlpha = a;
  s.draw(context, x * size, y * size, size, color, a);
  context.restore();
}

function drawGrid() {
  const s = SKINS[skin];
  ctx.strokeStyle = s.forcesDarkBoard && s.gridColor ? s.gridColor : THEME_COLORS[theme].grid;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  animId = null;
  draw();
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlayStatsEl.textContent = `Combo máx.: x${maxCombo} · Líneas de golpe: ${maxLineClear}`;
  overlayRecordsEl.classList.remove('hidden');

  Records.updateBests({ combo: maxCombo, lineClear: maxLineClear });

  if (Records.qualifies(score)) {
    nameForm.classList.remove('hidden');
    nameInput.value = '';
    refreshRecords(-1);
    setTimeout(() => nameInput.focus(), 0);
  } else {
    nameForm.classList.add('hidden');
    refreshRecords(-1);
  }

  overlay.classList.remove('hidden');
}

function saveRecord() {
  const idx = Records.add({ name: nameInput.value, score, lines, level });
  nameForm.classList.add('hidden');
  refreshRecords(idx);
}

function applyTheme(newTheme) {
  theme = newTheme;
  document.body.classList.toggle('light-theme', theme === 'light');
  if (themeToggle) themeToggle.checked = theme === 'light';
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch (e) { /* modo privado */ }
  if (board) { draw(); drawNext(); }
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_STORAGE_KEY); } catch (e) { /* modo privado */ }
  applyTheme(saved === 'light' ? 'light' : 'dark');
}

function setStartLevel(v) {
  startLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, v));
  localStorage.setItem(START_LEVEL_KEY, String(startLevel));
  startLevelEl.textContent = startLevel;
}

function initStartLevel() {
  const saved = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
  setStartLevel(Number.isFinite(saved) ? saved : 1);
}

function showPauseView(view) {
  pauseView = view;
  const isMain = view === 'main';
  pauseMain.classList.toggle('hidden', !isMain);
  pauseControls.classList.toggle('hidden', isMain);
  pauseTitle.textContent = isMain ? 'PAUSA' : 'CONTROLES';
  const focusTarget = isMain ? resumeBtn : controlsBackBtn;
  if (focusTarget) focusTarget.focus();
}

function pauseGame() {
  if (gameOver || paused) return;
  paused = true;
  cancelAnimationFrame(animId);
  animId = null;
  showPauseView('main');
  pauseMenu.classList.remove('hidden');
}

function resumeGame() {
  if (!paused) return;
  paused = false;
  pauseMenu.classList.add('hidden');
  lastTime = performance.now();
  dropAccum = 0;
  animId = requestAnimationFrame(loop);
}

function applySkin(newSkin) {
  if (!SKINS[newSkin]) newSkin = 'retro';
  skin = newSkin;
  document.body.className = document.body.className.replace(/\bskin-\S+/g, '').trim();
  document.body.classList.add(`skin-${skin}`);
  try { localStorage.setItem(SKIN_STORAGE_KEY, skin); } catch (e) { /* modo privado */ }
  skinButtons.forEach(b => {
    const active = b.dataset.skin === skin;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  if (board) { draw(); drawNext(); }
}

function initSkin() {
  let saved = null;
  try { saved = localStorage.getItem(SKIN_STORAGE_KEY); } catch (e) { /* modo privado */ }
  applySkin(saved && SKINS[saved] ? saved : 'retro');
}

function loop(ts) {
  if (gameOver || paused) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  paused = false;
  gameOver = false;
  dropInterval = intervalForLevel(startLevel);
  dropAccum = 0;
  combo = 0;
  maxCombo = 0;
  maxLineClear = 0;
  lastLiveRank = -1;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  nameForm.classList.add('hidden');
  overlay.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function focusableMenuButtons() {
  const container = pauseView === 'main' ? pauseMain : pauseControls;
  return Array.from(container.querySelectorAll('.menu-btn'));
}

function movePauseFocus(dir) {
  const buttons = focusableMenuButtons();
  if (!buttons.length) return;
  const idx = buttons.indexOf(document.activeElement);
  const next = idx === -1 ? 0 : (idx + dir + buttons.length) % buttons.length;
  buttons[next].focus();
}

function handlePauseKeys(e) {
  switch (e.code) {
    case 'KeyP':
    case 'Escape':
      e.preventDefault();
      if (pauseView === 'controls') showPauseView('main');
      else resumeGame();
      break;
    case 'ArrowUp':
      e.preventDefault();
      movePauseFocus(-1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      movePauseFocus(1);
      break;
    case 'ArrowLeft':
      if (pauseView === 'main') { e.preventDefault(); setStartLevel(startLevel - 1); }
      break;
    case 'ArrowRight':
      if (pauseView === 'main') { e.preventDefault(); setStartLevel(startLevel + 1); }
      break;
    case 'Space':
      e.preventDefault();
      if (document.activeElement instanceof HTMLButtonElement) document.activeElement.click();
      break;
  }
}

document.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (paused) { handlePauseKeys(e); return; }
  if (gameOver) return;
  if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); pauseGame(); return; }
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);
resumeBtn.addEventListener('click', resumeGame);
newGameBtn.addEventListener('click', init);
showControlsBtn.addEventListener('click', () => showPauseView('controls'));
controlsBackBtn.addEventListener('click', () => showPauseView('main'));
levelDownBtn.addEventListener('click', () => setStartLevel(startLevel - 1));
levelUpBtn.addEventListener('click', () => setStartLevel(startLevel + 1));

nameForm.addEventListener('submit', e => {
  e.preventDefault();
  saveRecord();
});

let resetConfirming = false;
let resetConfirmTimer = null;
resetRecordsBtn.addEventListener('click', () => {
  if (!resetConfirming) {
    resetConfirming = true;
    resetRecordsBtn.textContent = '¿Seguro?';
    resetRecordsBtn.classList.add('is-confirming');
    resetConfirmTimer = setTimeout(() => {
      resetConfirming = false;
      resetRecordsBtn.textContent = 'Resetear records';
      resetRecordsBtn.classList.remove('is-confirming');
    }, 3000);
    return;
  }
  clearTimeout(resetConfirmTimer);
  resetConfirming = false;
  resetRecordsBtn.textContent = 'Resetear records';
  resetRecordsBtn.classList.remove('is-confirming');
  Records.reset();
  lastLiveRank = -2; // fuerza re-render aunque el rank actual también sea -1
  updateHUD();
  refreshRecords(-1);
});

if (themeToggle) {
  themeToggle.addEventListener('change', () => {
    applyTheme(themeToggle.checked ? 'light' : 'dark');
  });
}

if (skinChips) {
  skinChips.addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    applySkin(btn.dataset.skin);
    btn.blur();
  });
}

initTheme();
initStartLevel();
initSkin();
init();
