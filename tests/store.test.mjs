import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// A tiny browser stand-in so the store can run in Node.
const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
globalThis.window = { addEventListener() {} };

const store = await import('../js/store.js');
const DAY = '2026-10-09';
const NEXT = '2026-10-10';

beforeEach(() => {
  mem.clear();
  store.loadStore({ defaultProfiles: [{ name: 'Test', avatar: 'honey' }] });
});

test('each word gives at most 2 honey drops a day, across all modes', () => {
  const a = store.recordResult('en-01', true, DAY);
  const b = store.recordLearned('en-01', true, DAY);
  const c = store.recordGameWord('en-01', true, DAY);
  assert.deepEqual([a.earned, b.earned, c.earned], [true, true, false]);
  assert.equal(store.honeyEarned(), 2);
  assert.equal(store.recordResult('en-02', true, DAY).earned, true, 'other words still pay');
  assert.equal(store.recordResult('en-01', true, NEXT).earned, true, 'the ceiling resets the next day');
  assert.equal(store.honeyEarned(), 4);
});

test('a wrong answer never earns honey', () => {
  assert.equal(store.recordResult('en-03', false, DAY).earned, false);
  assert.equal(store.honeyEarned(), 0);
});

test('a word reaching "blooming" queues its garden treasure once', () => {
  let treasure = null;
  const days = ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-08', '2026-10-15'];
  for (const d of days) treasure = store.recordResult('en-15', true, d).treasure || treasure;
  assert.equal(treasure, 'en-15');
  assert.equal(store.takePendingTreasure(), 'en-15');
  assert.equal(store.takePendingTreasure(), null);
  store.recordResult('en-15', true, '2026-10-22');
  assert.equal(store.takePendingTreasure(), null, 'no second treasure for the same word');
});

test('a full practice session earns one mystery seed a day', () => {
  store.finishSession({ total: 5, firstTry: 4, missed: [] }, DAY);
  store.finishSession({ total: 8, firstTry: 8, missed: [] }, DAY);
  store.finishSession({ total: 3, firstTry: 3, missed: [] }, NEXT);
  assert.equal(store.takePendingSeed(), true);
  assert.equal(store.takePendingSeed(), false, 'only one seed for the day; short sessions earn none');
});

test('buying spends honey; seeds grow the day after planting', () => {
  for (const w of ['en-01', 'en-02', 'en-04', 'en-05', 'en-06']) store.recordResult(w, true, DAY);
  assert.equal(store.honeyBalance(), 5);
  assert.equal(store.buyGardenItem('plant-tulip', 6), null, 'not enough honey');
  const it = store.buyGardenItem('plant-sunflower', 5);
  assert.ok(it);
  assert.equal(store.honeyBalance(), 0);
  assert.equal(store.ownedCount('plant-sunflower'), 1);
  store.itemToBag(it.id);
  assert.equal(store.ownedCount('plant-sunflower'), 1, 'still owned while in the bag');

  store.placeItem('seed', { planted: DAY });
  assert.equal(store.growSeeds(() => 'plant-rose', DAY).length, 0, 'not on the same day');
  const grown = store.growSeeds(() => 'plant-rose', NEXT);
  assert.equal(grown.length, 1);
  assert.equal(grown[0].k, 'plant-rose');
});
