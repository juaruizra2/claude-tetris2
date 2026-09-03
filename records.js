'use strict';

// Persistencia local de records (top 5 puntuaciones + mejores marcas globales).
const Records = (() => {
  const STORAGE_KEY = 'tetris-records';
  const MAX_RECORDS = 5;
  const MAX_NAME_LEN = 12;

  const emptyState = () => ({
    version: 1,
    records: [],
    bestCombo: 0,
    bestLineClear: 0,
  });

  const sanitizeName = (name) => {
    const trimmed = String(name ?? '').trim().slice(0, MAX_NAME_LEN);
    return trimmed || 'ANÓNIMO';
  };

  const normalize = (raw) => {
    const state = emptyState();
    if (!raw || typeof raw !== 'object') return state;

    if (Array.isArray(raw.records)) {
      state.records = raw.records
        .filter(r => r && typeof r === 'object' && Number.isFinite(r.score))
        .map(r => ({
          name: sanitizeName(r.name),
          score: Math.max(0, Math.floor(r.score)),
          lines: Number.isFinite(r.lines) ? Math.floor(r.lines) : 0,
          level: Number.isFinite(r.level) ? Math.floor(r.level) : 1,
          date: typeof r.date === 'string' ? r.date : new Date().toISOString(),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RECORDS);
    }

    state.bestCombo = Number.isFinite(raw.bestCombo) ? Math.max(0, Math.floor(raw.bestCombo)) : 0;
    state.bestLineClear = Number.isFinite(raw.bestLineClear) ? Math.max(0, Math.floor(raw.bestLineClear)) : 0;

    return state;
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      return normalize(JSON.parse(raw));
    } catch {
      return emptyState();
    }
  };

  const save = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // cuota llena o localStorage no disponible: ignorar en silencio
    }
  };

  const qualifies = (score) => {
    if (!Number.isFinite(score) || score <= 0) return false;
    const { records } = load();
    if (records.length < MAX_RECORDS) return true;
    return score > records[records.length - 1].score;
  };

  const rankFor = (score) => {
    if (!Number.isFinite(score) || score <= 0) return -1;
    const { records } = load();
    if (records.length < MAX_RECORDS) {
      // posición donde caería entre las existentes
      let idx = records.findIndex(r => score > r.score);
      return idx === -1 ? records.length : idx;
    }
    const idx = records.findIndex(r => score > r.score);
    return idx;
  };

  const add = ({ name, score, lines, level }) => {
    const state = load();
    const entry = {
      name: sanitizeName(name),
      score: Math.max(0, Math.floor(score || 0)),
      lines: Math.max(0, Math.floor(lines || 0)),
      level: Math.max(1, Math.floor(level || 1)),
      date: new Date().toISOString(),
    };
    state.records.push(entry);
    state.records.sort((a, b) => b.score - a.score);
    state.records = state.records.slice(0, MAX_RECORDS);
    save(state);
    return state.records.indexOf(entry);
  };

  const updateBests = ({ combo, lineClear }) => {
    const state = load();
    let changed = false;
    if (Number.isFinite(combo) && combo > state.bestCombo) {
      state.bestCombo = Math.floor(combo);
      changed = true;
    }
    if (Number.isFinite(lineClear) && lineClear > state.bestLineClear) {
      state.bestLineClear = Math.floor(lineClear);
      changed = true;
    }
    if (changed) save(state);
    return state;
  };

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorar
    }
    return emptyState();
  };

  return { load, save, qualifies, rankFor, add, updateBests, reset, MAX_RECORDS };
})();
