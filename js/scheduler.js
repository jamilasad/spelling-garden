// Spaced review ("Leitner boxes"), tuned for a contest about two weeks away.
// box 0 = never seen · box 1 = missed, ask again today · boxes 2–5 = known, reviewed less and less often.

export const MAX_BOX = 5;
export const INTERVAL_DAYS = [0, 0, 1, 2, 4, 7]; // indexed by box
export const MASTERED_BOX = 4;

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD (not UTC, so "today" matches the child's clock). */
export function dayString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDay(day) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // midday avoids daylight-saving edge cases
}

export function addDays(day, n) {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return dayString(d);
}

export function daysBetween(fromDay, toDay) {
  return Math.round((parseDay(toDay) - parseDay(fromDay)) / 86400000);
}

export function emptyRecord() {
  return { box: 0, due: null, attempts: 0, correct: 0, misses: 0, last: null };
}

/** Returns a new record after one self-check. */
export function applyResult(record, gotIt, day) {
  const r = { ...emptyRecord(), ...(record || {}) };
  r.attempts += 1;
  r.last = day;
  if (gotIt) {
    r.correct += 1;
    r.box = Math.min(MAX_BOX, Math.max(1, r.box) + 1);
  } else {
    r.misses += 1;
    r.box = 1;
  }
  r.due = addDays(day, INTERVAL_DAYS[r.box]);
  return r;
}

export const isSeen = (r) => !!r && r.attempts > 0;
export const isDue = (r, day) => isSeen(r) && r.due <= day;
export const isMastered = (r) => isSeen(r) && r.box >= MASTERED_BOX;
/** A word she has missed at least once and hasn't mastered yet. */
export const isTricky = (r) => isSeen(r) && r.misses > 0 && r.box < MASTERED_BOX;

export function shuffle(items, rng = Math.random) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks the words for a session: due words first (weakest box first),
 * then words never seen (in list order), then the rest (soonest due first).
 * @param {object} o
 * @param {string[]} o.ids       candidate word ids, in list order
 * @param {object}  o.progress   wordId → record
 * @param {string}  o.day        today
 * @param {number}  o.size       how many words (Infinity for all)
 * @param {'shuffle'|'list'} o.order
 */
export function buildQueue({ ids, progress, day, size = 10, order = 'shuffle', rng = Math.random }) {
  const rec = (id) => progress[id];
  const due = ids
    .filter((id) => isDue(rec(id), day))
    .sort((a, b) => rec(a).box - rec(b).box || rec(a).due.localeCompare(rec(b).due));
  const fresh = ids.filter((id) => !isSeen(rec(id)));
  const rest = ids
    .filter((id) => isSeen(rec(id)) && !isDue(rec(id), day))
    .sort((a, b) => rec(a).due.localeCompare(rec(b).due) || rec(a).box - rec(b).box);
  const picked = [...due, ...fresh, ...rest].slice(0, size);
  if (order === 'list') {
    const pos = new Map(ids.map((id, i) => [id, i]));
    return picked.sort((a, b) => pos.get(a) - pos.get(b));
  }
  return shuffle(picked, rng);
}

/** Where a missed word goes back into the running session queue. */
export function requeuePosition(currentIndex, queueLength, gap = 3) {
  return Math.min(currentIndex + 1 + gap, queueLength);
}

/** Updates the daily streak after a finished session. */
export function nextStreak(streak, day) {
  const s = streak || { count: 0, last: null, best: 0 };
  if (s.last === day) return s;
  const count = s.last && daysBetween(s.last, day) === 1 ? s.count + 1 : 1;
  return { count, last: day, best: Math.max(s.best || 0, count) };
}
