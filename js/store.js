// Everything she does is saved in this browser (per device), with export/import for backups.
import { applyResult, nextStreak, dayString } from './scheduler.js';

const KEY = 'spelling-garden:v1';

const DEFAULT_SETTINGS = {
  uiLang: 'en',
  speechRate: 0.9,
  sound: true,
  motion: true,
  reveal: 'letters',   // 'letters' | 'word'
  contestDate: '',
  mockTimer: 0,        // seconds per word in Mock Contest (0 = no timer)
};

let state = null;
let saveTimer = 0;

function blank() {
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, profiles: [], active: null, progress: {}, wordCheck: {} };
}

function safeRead() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadStore(config = {}) {
  const saved = safeRead();
  state = saved && saved.version === 1 ? saved : blank();
  state.settings = { ...DEFAULT_SETTINGS, ...state.settings };
  if (!state.settings.contestDate && config.defaultContestDate) state.settings.contestDate = config.defaultContestDate;
  if (!saved && config.defaultUiLang) state.settings.uiLang = config.defaultUiLang;
  if (!state.profiles.length && Array.isArray(config.defaultProfiles)) {
    for (const p of config.defaultProfiles) addProfile(p.name, p.avatar);
  }
  if (!state.active && state.profiles.length === 1) state.active = state.profiles[0].id;
  saveNow();
  return state;
}

function saveNow() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked: keep working in memory */ }
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 150);
}
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); if (state) saveNow(); });

// ---------- Settings ----------
export const settings = () => state.settings;
export function setSetting(key, value) {
  state.settings[key] = value;
  save();
}

// ---------- Profiles ----------
export const profiles = () => state.profiles;
export const activeProfile = () => state.profiles.find((p) => p.id === state.active) || null;

export function addProfile(name, avatar = 'honey') {
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  state.profiles.push({ id, name: name.trim().slice(0, 30) || 'Bee', avatar, created: dayString() });
  state.progress[id] = emptyProgress();
  save();
  return id;
}
export function updateProfile(id, patch) {
  const p = state.profiles.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  save();
}
export function removeProfile(id) {
  state.profiles = state.profiles.filter((p) => p.id !== id);
  delete state.progress[id];
  if (state.active === id) state.active = state.profiles[0]?.id ?? null;
  save();
}
export function setActiveProfile(id) {
  state.active = id;
  save();
}

// ---------- Progress ----------
function emptyProgress() {
  return { words: {}, streak: { count: 0, last: null, best: 0 }, honey: 0, badges: {}, sessions: [] };
}

export function progress(profileId = state.active) {
  if (!profileId) return emptyProgress();
  if (!state.progress[profileId]) state.progress[profileId] = emptyProgress();
  return state.progress[profileId];
}

export function recordResult(wordId, gotIt, day = dayString()) {
  const p = progress();
  p.words[wordId] = applyResult(p.words[wordId], gotIt, day);
  if (gotIt) p.honey += 1;
  save();
  return p.words[wordId];
}

export function finishSession(summary, day = dayString()) {
  const p = progress();
  p.streak = nextStreak(p.streak, day);
  p.sessions.push({ day, ...summary });
  if (p.sessions.length > 200) p.sessions = p.sessions.slice(-200);
  save();
  return p;
}

export function awardBadge(id, day = dayString()) {
  const p = progress();
  if (p.badges[id]) return false;
  p.badges[id] = day;
  save();
  return true;
}

// ---------- Parent: word list checked against the paper ----------
export const wordChecked = (id) => Boolean(state.wordCheck[id]);
export function setWordChecked(id, value) {
  if (value) state.wordCheck[id] = dayString(); else delete state.wordCheck[id];
  save();
}

// ---------- Backup ----------
export function exportBackup() {
  return JSON.stringify({ app: 'spelling-garden', exported: new Date().toISOString(), state }, null, 2);
}
export function importBackup(text) {
  const parsed = JSON.parse(text);
  const incoming = parsed.state || parsed;
  if (!incoming || incoming.version !== 1 || !Array.isArray(incoming.profiles)) throw new Error('not a Spelling Garden backup');
  state = { ...blank(), ...incoming, settings: { ...DEFAULT_SETTINGS, ...incoming.settings } };
  saveNow();
}
export function resetProgress(profileId) {
  state.progress[profileId] = emptyProgress();
  save();
}
