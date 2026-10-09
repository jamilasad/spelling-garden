// The living garden: drifting clouds, bees that come and go, falling petals and twinkles.
// It goes quiet while she listens and writes, and stays still when motion is off.
import { cloudHTML, beeFlyerHTML, petalHTML, leafHTML, hillsHTML, hasArt } from './art.js';
import { settings } from './store.js';
import { setAmbienceMode, buzz } from './ambience.js';

const MAX_FALLERS = 6;
let scene = null;
let ambient = null;
let spawnTimer = 0;
let calm = false;

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const motionAllowed = () =>
  settings().motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function applyMotionSetting() {
  document.documentElement.classList.toggle('no-motion', !settings().motion);
  if (motionAllowed()) scheduleSpawn(); else clearTimeout(spawnTimer);
}

export function buildScene() {
  scene = document.getElementById('scene');
  const clouds = [
    { v: 1, top: 4, w: 230 }, { v: 2, top: 15, w: 150 }, { v: 3, top: 27, w: 190 }, { v: 1, top: 9, w: 120 },
  ].map((c) => {
    const dur = rand(95, 170);
    return `<div class="cloud" style="top:${c.top}%;--w:${c.w}px;--dur:${dur.toFixed(0)}s;--delay:-${rand(0, dur).toFixed(0)}s;--still-x:${rand(2, 80).toFixed(0)}vw">${cloudHTML(c.v)}</div>`;
  }).join('');
  const sparkles = Array.from({ length: 5 }, () =>
    `<span class="sparkle" style="--x:${rand(6, 94).toFixed(0)}%;--y:${rand(58, 82).toFixed(0)}%;--dur:${rand(2.4, 4.2).toFixed(1)}s;--delay:-${rand(0, 4).toFixed(1)}s"></span>`).join('');

  scene.innerHTML = `
    <div class="sun"><div class="sun-rays"></div><div class="sun-disc"></div></div>
    <div class="clouds">${clouds}</div>
    <div class="hills">
      <div class="hill-layer hill-far">${hillsHTML('far')}</div>
      <div class="hill-layer hill-near">${hillsHTML('near')}</div>
      <div class="hill-layer hill-front">${hillsHTML('front')}</div>
    </div>
    <div class="ambient">${sparkles}</div>`;
  scene.classList.toggle('scene-art', hasArt('scene-hills-far'));
  ambient = scene.querySelector('.ambient');
  applyMotionSetting();
  scheduleBee(1500);
}

// ---------- Bees that come and go ----------
// A bee flies in now and then, sometimes stops by a flower for a moment, then leaves.
// On the home, garden and honey screens a tap sends it looping away with a buzz.
const MAX_BEES = 3;
const TAP_SCREENS = new Set(['', 'garden', 'honey']);
const NOT_A_BEE_TAP = 'button, a, input, select, textarea, label, .card, .tap-card, .chip, .tile, .bubble, .dialog-backdrop, .word-row, .hint-btn, .topbar';
const bees = new Set();
let beeTimer = 0;
let beeFrame = 0;
let lastFrame = 0;

const screenName = () => location.hash.replace(/^#\/?/, '').split('?')[0];
const tapsAllowed = () => TAP_SCREENS.has(screenName());

function scheduleBee(delay = rand(4000, 9000)) {
  clearTimeout(beeTimer);
  beeTimer = setTimeout(() => { spawnBee(); scheduleBee(); }, delay);
}

function spawnBee() {
  if (!ambient || calm || !motionAllowed() || document.visibilityState !== 'visible' || bees.size >= MAX_BEES) return;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const size = rand(30, 46);
  const toRight = Math.random() < 0.5;
  const y = rand(H * 0.1, H * 0.6);
  const visits = Math.random() < 0.45;
  const el = document.createElement('div');
  el.className = `bee-sprite${toRight ? '' : ' facing-left'}`;
  el.style.setProperty('--size', `${size.toFixed(0)}px`);
  el.innerHTML = `<div class="bee-inner">${beeFlyerHTML()}</div>`;
  ambient.appendChild(el);
  const bee = {
    el, size, dir: toRight ? 1 : -1, x: toRight ? -size * 1.6 : W + size * 0.6, y, baseY: y,
    speed: rand(70, 115), phase: 'in', born: performance.now(), hoverUntil: 0, scale: 1,
    stop: visits ? { x: toRight ? rand(W * 0.55, W * 0.9) : rand(W * 0.1, W * 0.45), y: rand(H * 0.32, H * 0.66) } : null,
  };
  bees.add(bee);
  if (tapsAllowed() && Math.random() < 0.4) buzz({ volume: 0.1, from: -bee.dir * 0.9, to: bee.dir * 0.9, rate: rand(0.9, 1.1) });
  if (!beeFrame) { lastFrame = performance.now(); beeFrame = requestAnimationFrame(moveBees); }
}

function moveBees(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const W = window.innerWidth;
  for (const b of bees) {
    const t = (now - b.born) / 1000;
    if (b.phase === 'in' && b.stop) {
      const dx = b.stop.x - b.x;
      const dy = b.stop.y - b.baseY;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) { b.phase = 'hover'; b.hoverUntil = now + rand(1500, 3500); b.hoverAt = { ...b.stop }; }
      else { b.x += (dx / dist) * b.speed * dt; b.baseY += (dy / dist) * b.speed * dt; b.y = b.baseY + Math.sin(t * 3) * 10; }
    } else if (b.phase === 'in') {
      b.x += b.dir * b.speed * dt;
      b.y = b.baseY + Math.sin(t * 2.8) * 14;
    } else if (b.phase === 'hover') {
      b.x = b.hoverAt.x + Math.sin(t * 4.5) * 7;
      b.y = b.hoverAt.y + Math.sin(t * 6) * 5;
      if (now > b.hoverUntil) { b.phase = 'out'; b.baseY = b.y; b.exitRise = rand(60, 160); }
    } else if (b.phase === 'out') {
      b.x += b.dir * b.speed * 1.15 * dt;
      b.baseY -= (b.exitRise / 3) * dt;
      b.y = b.baseY + Math.sin(t * 2.8) * 12;
    } else if (b.phase === 'zoom') {
      b.x += b.dir * b.speed * 6 * dt;
      b.y -= b.speed * 2.2 * dt;
      b.scale = Math.max(0.4, b.scale - 0.6 * dt);
    }
    b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) scale(${b.scale.toFixed(2)})`;
    if (b.x < -b.size * 3 || b.x > W + b.size * 3 || b.y < -b.size * 3) {
      b.el.remove();
      bees.delete(b);
    }
  }
  beeFrame = bees.size ? requestAnimationFrame(moveBees) : 0;
}

function tapBee(b) {
  if (b.phase === 'zoom') return;
  if (b.phase === 'hover') b.baseY = b.y;
  b.phase = 'zoom';
  b.el.classList.add('tapped');
  const pan = (b.x / window.innerWidth) * 2 - 1;
  buzz({ volume: 0.4, from: pan, to: b.dir * 0.95, rate: 1.25 });
}

window.addEventListener('pointerdown', (e) => {
  if (!bees.size || !tapsAllowed() || e.target.closest(NOT_A_BEE_TAP)) return;
  const pad = 16; // generous target for small fingers
  for (const b of bees) {
    const r = b.el.getBoundingClientRect();
    if (e.clientX >= r.left - pad && e.clientX <= r.right + pad && e.clientY >= r.top - pad && e.clientY <= r.bottom + pad) {
      tapBee(b);
      break;
    }
  }
});

function spawnFaller() {
  if (!ambient || calm || !motionAllowed() || document.visibilityState !== 'visible') return;
  if (ambient.querySelectorAll('.faller').length >= MAX_FALLERS) return;
  const isLeaf = Math.random() < 0.35;
  const art = isLeaf ? leafHTML(pickOne([1, 2, 3])) : petalHTML(pickOne(['yellow', 'yellow', 'pink', 'white']));
  const el = document.createElement('div');
  el.className = 'faller';
  el.style.cssText = `--x:${rand(2, 96).toFixed(1)}%;--size:${rand(isLeaf ? 26 : 18, isLeaf ? 38 : 30).toFixed(0)}px;--dur:${rand(10, 16).toFixed(1)}s;--sway:${rand(2.4, 4).toFixed(1)}s;--spin:${rand(4, 8).toFixed(1)}s;--turn:${pickOne([-1, 1]) * rand(200, 540).toFixed(0)}deg`;
  el.innerHTML = `<div class="sway">${art}</div>`;
  el.addEventListener('animationend', (e) => { if (e.target === el) el.remove(); });
  ambient.appendChild(el);
}

function scheduleSpawn() {
  clearTimeout(spawnTimer);
  if (!motionAllowed()) return;
  spawnTimer = setTimeout(() => { spawnFaller(); scheduleSpawn(); }, rand(2600, 4800));
}

/** Quiet garden while she concentrates. */
export function setCalm(on) {
  calm = on;
  if (scene) scene.classList.toggle('calm', on);
  setAmbienceMode(on ? 'calm' : 'normal');
}
