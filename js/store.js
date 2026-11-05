// Everything she does is saved in this browser (per device), with export/import for backups.
import { applyResult, nextStreak, dayString, MASTERED_BOX } from './scheduler.js';

const KEY = 'spelling-garden:v1';

const DEFAULT_SETTINGS = {
  uiLang: 'en',
  speechRate: 0.9,
  sound: true,
  ambient: true,       // garden sounds (birdsong and bees)
  motion: true,
  reveal: 'letters',   // 'letters' | 'word'
  answerMode: 'type',  // Bee Mode: 'type' (our keyboard, checked by the app) | 'paper' (write, then check yourself)
  keyboard: 'focused', // Type mode in Bangla and Arabic: 'focused' (word's letters + look-alikes) | 'full'
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
  const { earned, goalReached } = clean ? earnHoney(p, wordId, day) : { earned: false, goalReached: false };
  save();
  return { goalReached, earned };
}

// Each word gives at most this many honey drops a day (practice, Learn and games together),
// so honey comes from practising many different words, not repeating one easy word.
export const HONEY_PER_WORD_PER_DAY = 2;

/** Adds one honey drop for a word, unless that word has reached today's ceiling.
 *  Returns { earned, goalReached }. */
function earnHoney(p, wordId, day) {
  p.honeyWords = p.honeyWords || {};
  if (p.honeyWords.day !== day) p.honeyWords = { day, n: {} };
  const used = p.honeyWords.n[wordId] || 0;
  if (used >= HONEY_PER_WORD_PER_DAY) return { earned: false, goalReached: false };
  p.honeyWords.n[wordId] = used + 1;
  return { earned: true, goalReached: addHoney(p, day) };
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
  const before = p.words[wordId];
  p.words[wordId] = applyResult(before, gotIt, day);
  const d = dayLog(p, day);
  d.test += 1;
  if (gotIt) d.right += 1;
  const { earned, goalReached } = gotIt ? earnHoney(p, wordId, day) : { earned: false, goalReached: false };
  // First time a word reaches "blooming": its garden treasure is waiting.
  const nowBlooming = p.words[wordId].box >= MASTERED_BOX && !(before && before.box >= MASTERED_BOX);
  const treasure = nowBlooming ? queueTreasure(p, wordId) : null;
  save();
  return { record: p.words[wordId], goalReached, earned, treasure };
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
  const { earned, goalReached } = gotIt ? earnHoney(p, wordId, day) : { earned: false, goalReached: false };
  save();
  return { record: r, goalReached, earned };
}

// ---------- My Garden ----------
/** The garden's saved state: placed items, the bag, treasures waiting, seeds, saving goal. */
function garden(p = progress()) {
  if (!p.garden) {
    p.garden = { items: [], bag: [], pendingTreasures: [], wonTreasures: {}, pendingSeeds: 0, seedDay: null, goal: 'big-hive-home', nextId: 1 };
    // Decorations bought in the old Honey Shop move into the garden bag.
    const MOVE = { ladybug: 'decor-ladybug', butterfly: 'decor-butterfly', rainbow: 'decor-rainbow', wateringcan: 'item-wateringcan', birdhouse: 'item-birdhouse', pond: 'water-pond' };
    for (const d of p.owned?.decor || []) if (MOVE[d]) p.garden.bag.push(MOVE[d]);
  }
  return p.garden;
}
export const gardenState = () => garden();

function queueTreasure(p, wordId) {
  const g = garden(p);
  if (g.wonTreasures[wordId]) return null;
  g.wonTreasures[wordId] = true;
  g.pendingTreasures.push(wordId);
  return wordId;
}

/** Words that were already blooming before treasures existed get theirs too. */
export function catchUpTreasures() {
  const p = progress();
  const g = garden(p);
  let added = 0;
  for (const [id, r] of Object.entries(p.words)) {
    if (r.box >= MASTERED_BOX && !g.wonTreasures[id]) { queueTreasure(p, id); added++; }
  }
  if (added) save();
  return added;
}

/** Word ids whose treasures are waiting (they stay waiting until she places them). */
export const pendingTreasures = () => [...garden().pendingTreasures];
export const pendingSeeds = () => garden().pendingSeeds || 0;

/** Places waiting treasures in one step, so nothing is lost if the app closes mid-way. */
export function claimTreasures(entries) {
  const g = garden();
  const items = entries.map(({ wordId, k }) => {
    g.pendingTreasures = g.pendingTreasures.filter((id) => id !== wordId);
    return placeItem(k);
  });
  save();
  return items;
}
export function claimSeed(day = dayString()) {
  const g = garden();
  if (!g.pendingSeeds) return null;
  g.pendingSeeds -= 1;
  return placeItem('seed', { planted: day });
}

// Kept for the tests and older callers.
export function takePendingTreasure() {
  const g = garden();
  const id = g.pendingTreasures.shift();
  save();
  return id || null;
}
export function takePendingSeed() {
  const g = garden();
  if (!g.pendingSeeds) return false;
  g.pendingSeeds -= 1;
  save();
  return true;
}

/** A free spot on the lawn: the best of several random tries, as far as possible from other items. */
function freeSpot(items, maxX = 72) {
  let best = null;
  for (let i = 0; i < 16; i++) {
    const c = { x: 8 + Math.random() * (maxX - 8), y: 25 + Math.random() * 65 };
    const gap = items.reduce((m, it) => Math.min(m, Math.hypot((it.x - c.x) * 1.5, it.y - c.y)), Infinity);
    if (!best || gap > best.gap) best = { ...c, gap };
  }
  return { x: Math.round(best.x * 10) / 10, y: Math.round(best.y * 10) / 10 };
}

export function placeItem(k, extra = {}) {
  const g = garden();
  const item = { id: g.nextId++, k, ...freeSpot(g.items), size: 2, flip: false, ...extra };
  g.items.push(item);
  save();
  return item;
}
export function updateItem(id, patch) {
  const it = garden().items.find((x) => x.id === id);
  if (it) Object.assign(it, patch);
  save();
  return it;
}
export function itemToBag(id) {
  const g = garden();
  const it = g.items.find((x) => x.id === id);
  if (!it) return;
  g.items = g.items.filter((x) => x.id !== id);
  g.bag.push(it.k);
  save();
}
export function placeFromBag(index) {
  const g = garden();
  const [k] = g.bag.splice(index, 1);
  save();
  return k ? placeItem(k) : null;
}
/** Spends honey on a garden item and places it. Returns the new item, or null if she can't afford it. */
export function buyGardenItem(k, price) {
  const p = progress();
  if (honeyBalance() < price) return null;
  p.spent = (p.spent || 0) + price;
  garden(p).bought = (garden(p).bought || 0) + 1;
  return placeItem(k);
}
/** How many of an item she has (placed + in the bag). */
export function ownedCount(k) {
  const g = garden();
  return g.items.filter((x) => x.k === k).length + g.bag.filter((x) => x === k).length;
}
export function setGardenGoal(k) {
  garden().goal = k;
  save();
}
/** Seeds planted on an earlier day grow into a surprise flower. Returns the items that grew. */
export function growSeeds(pickFlower, day = dayString()) {
  const g = garden();
  const grown = [];
  for (const it of g.items) {
    if (it.k === 'seed' && it.planted && it.planted < day) {
      it.k = pickFlower();
      delete it.planted;
      grown.push(it);
    }
  }
  if (grown.length) save();
  return grown;
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
  // A full practice session (5+ words) earns one mystery seed a day.
  const g = garden(p);
  let seed = false;
  if (!summary.partial && summary.total >= 5 && g.seedDay !== day) {
    g.seedDay = day;
    g.pendingSeeds = (g.pendingSeeds || 0) + 1;
    seed = true;
  }
  p.lastSeed = seed;
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
