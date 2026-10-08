// One-off celebration effects: petal burst, confetti and a honey drop flying to the counter.
import { petalHTML } from './art.js';
import { motionAllowed } from './ambient.js';

const layer = () => document.getElementById('fx');
const rand = (a, b) => a + Math.random() * (b - a);

function addTemp(el, ms) {
  layer().appendChild(el);
  setTimeout(() => el.remove(), ms);
}

export function petalBurst(target, count = 16) {
  if (!target || !motionAllowed()) return;
  const r = target.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height * 0.34;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
    const dist = rand(90, 180);
    const el = document.createElement('div');
    el.className = 'burst-bit';
    el.style.cssText = `--x:${x}px;--y:${y}px;--dx:${(Math.cos(angle) * dist).toFixed(0)}px;--dy:${(Math.sin(angle) * dist - 40).toFixed(0)}px;--rot:${rand(-300, 300).toFixed(0)}deg;--size:${rand(16, 26).toFixed(0)}px`;
    el.innerHTML = petalHTML(i % 4 === 0 ? 'pink' : 'yellow');
    addTemp(el, 1200);
  }
}

const CONFETTI = ['#FFC93C', '#FF6B9D', '#5BC0EB', '#7BD389', '#9B5DE5', '#FF8C42'];
export function confetti(count = 70) {
  if (!motionAllowed()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    const dur = rand(2.2, 3.6);
    const delay = rand(0, 0.8);
    el.style.cssText = `--x:${rand(0, 100).toFixed(1)}vw;--c:${CONFETTI[i % CONFETTI.length]};--w:${rand(8, 13).toFixed(0)}px;--h:${rand(12, 20).toFixed(0)}px;--dx:${rand(-80, 80).toFixed(0)}px;--rot:${rand(-720, 720).toFixed(0)}deg;--dur:${dur.toFixed(2)}s;--delay:${delay.toFixed(2)}s`;
    addTemp(el, (dur + delay) * 1000 + 100);
  }
}

export function honeyFly(from, to) {
  if (!from || !to || !motionAllowed()) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const x = a.left + a.width / 2;
  const y = a.top + a.height * 0.3;
  const el = document.createElement('div');
  el.className = 'honey-fly';
  el.style.cssText = `--x:${x}px;--y:${y}px;--dx:${(b.left + b.width / 2 - x).toFixed(0)}px;--dy:${(b.top + b.height / 2 - y).toFixed(0)}px`;
  el.innerHTML = '<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 3 C30 18 36 26 36 32 a16 16 0 0 1-32 0 C4 26 10 18 20 3Z" fill="#FFC93C" stroke="#3D2C29" stroke-width="3.5"/><ellipse cx="14" cy="30" rx="4" ry="6" fill="#fff" opacity=".7"/></svg>';
  addTemp(el, 950);
}
