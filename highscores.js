'use strict';

const HS_STORAGE_KEY = 'tetris-highscores';
const HS_MAX_ENTRIES = 5;
const HS_NAME_MAX_LEN = 12;

const hsListEl = document.getElementById('hs-list');
const hsOverlayListEl = document.getElementById('hs-overlay-list');
const hsResetBtn = document.getElementById('hs-reset-btn');
const hsSaveEl = document.getElementById('hs-save');
const hsNameInput = document.getElementById('hs-name-input');
const hsSaveBtn = document.getElementById('hs-save-btn');

let hsLastSavedDate = null;
let hsPendingResult = null;

function loadHighscores() {
  let raw;
  try {
    raw = localStorage.getItem(HS_STORAGE_KEY);
  } catch (e) {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(entry =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.name === 'string' &&
      typeof entry.score === 'number' &&
      typeof entry.lines === 'number' &&
      typeof entry.maxCombo === 'number' &&
      typeof entry.date === 'string'
    );
  } catch (e) {
    return [];
  }
}

function saveHighscoresList(list) {
  try {
    localStorage.setItem(HS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // localStorage no disponible o cuota excedida: no persistimos, pero no rompemos el juego.
  }
}

function isTopScore(score) {
  const list = loadHighscores();
  if (list.length < HS_MAX_ENTRIES) return true;
  const sorted = [...list].sort((a, b) => b.score - a.score);
  return score > sorted[HS_MAX_ENTRIES - 1].score;
}

function addHighscore({ name, score, lines, maxCombo }) {
  const list = loadHighscores();
  const cleanName = (name && name.trim()) ? name.trim().slice(0, HS_NAME_MAX_LEN) : 'ANÓNIMO';
  const date = new Date().toISOString();
  const entry = { name: cleanName, score, lines, maxCombo, date };
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, HS_MAX_ENTRIES);
  saveHighscoresList(trimmed);
  return entry;
}

function resetHighscores() {
  try {
    localStorage.removeItem(HS_STORAGE_KEY);
  } catch (e) {
    // ignorar
  }
  hsLastSavedDate = null;
  renderAll();
}

function renderTable(tbodyEl, list) {
  if (!tbodyEl) return;
  tbodyEl.textContent = '';
  if (list.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'hs-empty';
    cell.textContent = 'Sin récords todavía';
    row.appendChild(cell);
    tbodyEl.appendChild(row);
    return;
  }
  list.forEach((entry, i) => {
    const row = document.createElement('tr');
    if (hsLastSavedDate && entry.date === hsLastSavedDate) {
      row.classList.add('hs-new');
    }

    const posCell = document.createElement('td');
    posCell.textContent = String(i + 1);

    const nameCell = document.createElement('td');
    nameCell.textContent = entry.name;

    const scoreCell = document.createElement('td');
    scoreCell.className = 'hs-num';
    scoreCell.textContent = entry.score.toLocaleString();

    const linesCell = document.createElement('td');
    linesCell.className = 'hs-num';
    linesCell.textContent = String(entry.lines);

    const comboCell = document.createElement('td');
    comboCell.className = 'hs-num';
    comboCell.textContent = String(entry.maxCombo);

    row.appendChild(posCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    row.appendChild(linesCell);
    row.appendChild(comboCell);
    tbodyEl.appendChild(row);
  });
}

function renderAll() {
  const list = loadHighscores();
  renderTable(hsListEl, list);
  renderTable(hsOverlayListEl, list);
}

function hideNameInput() {
  if (hsSaveEl) hsSaveEl.classList.add('hidden');
  if (hsNameInput) hsNameInput.value = '';
  hsPendingResult = null;
}

function onGameOver(result) {
  hsPendingResult = result;
  if (isTopScore(result.score)) {
    if (hsSaveEl) hsSaveEl.classList.remove('hidden');
    if (hsNameInput) {
      hsNameInput.value = '';
      hsNameInput.focus();
    }
  } else {
    hideNameInput();
  }
  renderAll();
}

function onGameStart() {
  // Si había una puntuación calificada para el top 5 sin guardar (p.ej. el
  // jugador pulsó "Reiniciar" en vez de "Guardar"), la guardamos igual con
  // el nombre que hubiera escrito (o "ANÓNIMO") en vez de descartarla.
  if (hsPendingResult) {
    saveCurrentResult();
  }
  hsLastSavedDate = null;
  hideNameInput();
  renderAll();
}

function saveCurrentResult() {
  if (!hsPendingResult) return;
  const name = hsNameInput ? hsNameInput.value : '';
  const saved = addHighscore({
    name,
    score: hsPendingResult.score,
    lines: hsPendingResult.lines,
    maxCombo: hsPendingResult.maxCombo,
  });
  hsLastSavedDate = saved.date;
  hideNameInput();
  renderAll();
}

if (hsSaveBtn) {
  hsSaveBtn.addEventListener('click', saveCurrentResult);
}

if (hsNameInput) {
  hsNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCurrentResult();
    }
  });
}

if (hsResetBtn) {
  hsResetBtn.addEventListener('click', resetHighscores);
}

renderAll();
