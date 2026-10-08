import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyResult, addDays, daysBetween, buildQueue, isDue, isTricky, isMastered,
  requeuePosition, nextStreak,
} from '../js/scheduler.js';

const DAY = '2026-10-08';

test('day maths', () => {
  assert.equal(addDays(DAY, 1), '2026-10-09');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(daysBetween(DAY, '2026-10-15'), 7);
});

test('a new word answered right moves to box 2, due tomorrow', () => {
  const r = applyResult(null, true, DAY);
  assert.equal(r.box, 2);
  assert.equal(r.due, '2026-10-09');
  assert.equal(r.attempts, 1);
});

test('a miss drops to box 1, due again today', () => {
  let r = applyResult(null, true, DAY);
  r = applyResult(r, true, '2026-10-09'); // box 3
  r = applyResult(r, false, '2026-10-11');
  assert.equal(r.box, 1);
  assert.equal(r.due, '2026-10-11');
  assert.ok(isDue(r, '2026-10-11'));
  assert.ok(isTricky(r));
});

test('intervals grow 1 → 2 → 4 → 7 days and cap at box 5', () => {
  let r = applyResult(null, false, DAY); // box 1
  const dues = [];
  for (let i = 0; i < 6; i++) {
    r = applyResult(r, true, DAY);
    dues.push(daysBetween(DAY, r.due));
  }
  assert.deepEqual(dues, [1, 2, 4, 7, 7, 7]);
  assert.equal(r.box, 5);
  assert.ok(isMastered(r));
  assert.ok(!isTricky(r));
});

test('queue: due words first, then new words, then the rest', () => {
  const progress = {
    a: applyResult(null, true, '2026-10-07'),  // due 10-08 (box 2)
    b: applyResult(null, false, DAY),          // due today (box 1)
    c: applyResult(null, true, DAY),           // due tomorrow
  };
  const q = buildQueue({ ids: ['a', 'b', 'c', 'd', 'e'], progress, day: DAY, size: 4, order: 'list' });
  assert.deepEqual(q, ['a', 'b', 'd', 'e']);
  const all = buildQueue({ ids: ['a', 'b', 'c', 'd', 'e'], progress, day: DAY, size: Infinity, order: 'shuffle' });
  assert.equal(all.length, 5);
  assert.deepEqual([...all].sort(), ['a', 'b', 'c', 'd', 'e']);
});

test('missed words come back three words later', () => {
  assert.equal(requeuePosition(0, 10), 4);
  assert.equal(requeuePosition(8, 10), 10);
});

test('streaks count consecutive days', () => {
  let s = nextStreak(null, DAY);
  assert.equal(s.count, 1);
  s = nextStreak(s, DAY);
  assert.equal(s.count, 1);
  s = nextStreak(s, '2026-10-09');
  assert.equal(s.count, 2);
  s = nextStreak(s, '2026-10-12');
  assert.equal(s.count, 1);
  assert.equal(s.best, 2);
});
