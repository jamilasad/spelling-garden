// Everything she does is saved in this browser (per device), with export/import for backups.
import { applyResult, nextStreak, dayString } from './scheduler.js';

const KEY = 'spelling-garden:v1';

const DEFAULT_SETTINGS = {
  uiLang: 'en',
  speechRate: 0.9,
  sound: true,
  ambient: true,       // garden sounds (birdsong and bees)
  motion: true,
  reveal: 'letters',   // 'letters' | 'word'
  contestDate: '',
  mockTimer: 0,        // seconds per word in Mock Contest (0 = no timer)
  dailyGoal: 20,       // honey drops to collect each day
  narrator: {},        // lang → narrator id (the first voice in data/voices.json when unset)
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
  return {
    words: {}, streak: { count: 0, last: null, best: 0 }, badges: {}, sessions: [],
    honey: 0,            // every drop ever earned (fills the jars, never goes down)
    spent: 0,            // drops spent in the Honey Shop
    honeyDays: {},       // day → drops earned that day (for the daily goal)
    owned: { hats: [], colours: [], decor: [] },
    hat: null,           // the hat Buzzy is wearing
  };
}

/** Per-day totals for the parent report: answers, right answers, words learned, game words, active seconds. */
function dayLog(p, day) {
  p.days = p.days || {};
  if (!p.days[day]) p.days[day] = { test: 0, right: 0, learn: 0, game: 0, seconds: 0 };
  const keys = Object.keys(p.days).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - 120))) delete p.days[old];
  return p.days[day];
}

export function addActiveSeconds(seconds, day = dayString()) {
  if (!state.active) return;
  dayLog(progress(), day).seconds += seconds;
  save();
}

/** Missing-letters game: a word solved. Honey only when solved without a wrong tap. */
export function recordGameWord(wordId, clean, day = dayString()) {
  const p = progress();
  const d = dayLog(p, day);
  d.game += 1;
  p.games = p.games || {};
  const g = p.games[wordId] || { played: 0, clean: 0 };
  g.played += 1;
  if (clean) g.clean += 1;
  p.games[wordId] = g;
  const goalReached = clean ? addHoney(p, day) : false;
  save();
  return { goalReached };
}

/** Adds one honey drop. Returns true when this drop reaches today's goal. */
function addHoney(p, day) {
  p.honey = (p.honey || 0) + 1;
  p.honeyDays = p.honeyDays || {};
  p.honeyDays[day] = (p.honeyDays[day] || 0) + 1;
  const days = Object.keys(p.honeyDays).sort();
  for (const old of days.slice(0, Math.max(0, days.length - 90))) delete p.honeyDays[old];
  return p.honeyDays[day] === (state.settings.dailyGoal || 20);
}

export function progress(profileId = state.active) {
  if (!profileId) return emptyProgress();
  if (!state.progress[profileId]) state.progress[profileId] = emptyProgress();
  return state.progress[profileId];
}

/** @returns {{ record: object, goalReached: boolean }} */
export function recordResult(wordId, gotIt, day = dayString()) {
  const p = progress();
  p.words[wordId] = applyResult(p.words[wordId], gotIt, day);
  const d = dayLog(p, day);
  d.test += 1;
  if (gotIt) d.right += 1;
  const goalReached = gotIt ? addHoney(p, day) : false;
  save();
  return { record: p.words[wordId], goalReached };
}

/** Look–Say–Cover–Write–Check: counts as learning, not as a test, so review timing is untouched. */
export function recordLearned(wordId, gotIt, day = dayString()) {
  const p = progress();
  p.learned = p.learned || {};
  const r = p.learned[wordId] || { times: 0, last: null };
  r.times += 1;
  r.last = day;
  p.learned[wordId] = r;
  dayLog(p, day).learn += 1;
  const goalReached = gotIt ? addHoney(p, day) : false;
  save();
  return { record: r, goalReached };
}

// ---------- Honey Pot ----------
export const honeyEarned = () => progress().honey || 0;
export const honeyBalance = () => Math.max(0, (progress().honey || 0) - (progress().spent || 0));
export const honeyToday = (day = dayString()) => progress().honeyDays?.[day] || 0;

function ownedLists(p) {
  p.owned = { hats: [], colours: [], decor: [], ...(p.owned || {}) };
  return p.owned;
}
export const owns = (kind, id) => ownedLists(progress())[kind].includes(id);
export const ownedOf = (kind) => [...ownedLists(progress())[kind]];
export const wornHat = () => progress().hat || null;

/** Spends honey on an item. Returns false when there isn't enough. */
export function buyItem(kind, id, price) {
  const p = progress();
  if (owns(kind, id)) return true;
  if (honeyBalance() < price) return false;
  p.spent = (p.spent || 0) + price;
  ownedLists(p)[kind].push(id);
  save();
  return true;
}
export function wearHat(id) {
  progress().hat = id || null;
  save();
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
