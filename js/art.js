// Artwork: uses the illustrations listed in images/manifest.json when they exist,
// and falls back to hand-drawn SVG placeholders in the same sticker style.

const INK = '#3D2C29';
const STRIPE = '#5B3A29';
let manifest = {};
let uid = 0;

export async function loadArt() {
  try {
    const res = await fetch('images/manifest.json', { cache: 'no-cache' });
    manifest = res.ok ? await res.json() : {};
  } catch {
    manifest = {};
  }
}

export const hasArt = (name) => Boolean(manifest[name]);
export const artUrl = (name) => manifest[name];
const img = (name, cls = '', alt = '') =>
  `<img src="${artUrl(name)}" alt="${alt}" class="${cls}" draggable="false" decoding="async">`;

// ---------- Buzzy ----------
export const AVATARS = {
  honey: { body: '#FFC93C', scarf: '#9B5DE5' },
  pink: { body: '#FF9EC0', scarf: '#FFC93C' },
  mint: { body: '#9EE6B8', scarf: '#FF6B9D' },
  sky: { body: '#9AD8F5', scarf: '#FF8C42' },
  lavender: { body: '#C7A6F2', scarf: '#7BD389' },
  peach: { body: '#FFB98A', scarf: '#5BC0EB' },
};

const ARM_SHAPES = {
  down: ['<ellipse cx="38" cy="150" rx="15" ry="11" transform="rotate(25 38 150)"/>', '<ellipse cx="162" cy="150" rx="15" ry="11" transform="rotate(-25 162 150)"/>'],
  wave: ['<ellipse cx="38" cy="150" rx="15" ry="11" transform="rotate(25 38 150)"/>', '<ellipse cx="172" cy="96" rx="15" ry="11" transform="rotate(-60 172 96)"/>'],
  up: ['<ellipse cx="28" cy="96" rx="15" ry="11" transform="rotate(60 28 96)"/>', '<ellipse cx="172" cy="96" rx="15" ry="11" transform="rotate(-60 172 96)"/>'],
  ear: ['<ellipse cx="38" cy="150" rx="15" ry="11" transform="rotate(25 38 150)"/>', '<ellipse cx="164" cy="92" rx="14" ry="11" transform="rotate(-80 164 92)"/>'],
  chin: ['<ellipse cx="38" cy="150" rx="15" ry="11" transform="rotate(25 38 150)"/>', '<ellipse cx="124" cy="146" rx="14" ry="11" transform="rotate(-30 124 146)"/>'],
};

export function buzzySVG({ avatar = 'honey', arms = 'down', mood = 'happy' } = {}) {
  const { body, scarf } = AVATARS[avatar] || AVATARS.honey;
  const id = `bz${++uid}`;
  const [armL, armR] = ARM_SHAPES[arms] || ARM_SHAPES.down;
  const mouth = mood === 'oops'
    ? '<path d="M90 128 Q100 122 110 128" fill="none" stroke="#3D2C29" stroke-width="5" stroke-linecap="round"/>'
    : mood === 'wow'
      ? '<ellipse cx="100" cy="127" rx="7" ry="8" fill="#3D2C29"/>'
      : '<path d="M88 121 Q100 134 112 121" fill="none" stroke="#3D2C29" stroke-width="5" stroke-linecap="round"/>';
  const eyes = mood === 'joy'
    ? '<path d="M66 108 Q78 94 90 108" fill="none" stroke="#3D2C29" stroke-width="6" stroke-linecap="round"/><path d="M110 108 Q122 94 134 108" fill="none" stroke="#3D2C29" stroke-width="6" stroke-linecap="round"/>'
    : '<circle cx="78" cy="104" r="13" fill="#3D2C29"/><circle cx="122" cy="104" r="13" fill="#3D2C29"/><circle cx="82" cy="99" r="4.5" fill="#fff"/><circle cx="75" cy="109" r="2.2" fill="#fff"/><circle cx="126" cy="99" r="4.5" fill="#fff"/><circle cx="119" cy="109" r="2.2" fill="#fff"/>';
  return `<svg viewBox="0 0 200 214" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs><clipPath id="${id}"><ellipse cx="100" cy="128" rx="66" ry="72"/></clipPath></defs>
  <g class="buzzy-wing"><ellipse cx="64" cy="54" rx="26" ry="38" transform="rotate(-28 64 54)" fill="#DDF3FF" stroke="${INK}" stroke-width="5"/></g>
  <g class="buzzy-wing" style="animation-delay:.07s"><ellipse cx="136" cy="54" rx="26" ry="38" transform="rotate(28 136 54)" fill="#DDF3FF" stroke="${INK}" stroke-width="5"/></g>
  <path d="M84 62 Q74 38 62 26" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M116 62 Q126 38 138 26" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="61" cy="24" r="9" fill="#FFC93C" stroke="${INK}" stroke-width="4.5"/>
  <circle cx="139" cy="24" r="9" fill="#FFC93C" stroke="${INK}" stroke-width="4.5"/>
  <g fill="#6B4A3A" stroke="${INK}" stroke-width="4.5">${armL}${armR}
    <ellipse cx="80" cy="200" rx="12" ry="9"/><ellipse cx="120" cy="200" rx="12" ry="9"/></g>
  <ellipse cx="100" cy="128" rx="66" ry="72" fill="${body}"/>
  <g clip-path="url(#${id})" fill="${STRIPE}">
    <path d="M20 158 Q100 176 180 158 L180 172 Q100 190 20 172Z"/>
    <path d="M20 182 Q100 200 180 182 L180 194 Q100 212 20 194Z"/>
    <path d="M20 204 Q100 220 180 204 L180 230 L20 230Z"/>
  </g>
  <ellipse cx="100" cy="128" rx="66" ry="72" fill="none" stroke="${INK}" stroke-width="6"/>
  <path d="M42 136 Q100 160 158 136 L160 150 Q100 175 40 150Z" fill="${scarf}" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M126 152 l10 22 l12 -6 l-8 -20z" fill="${scarf}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${eyes}
  <ellipse cx="62" cy="123" rx="10" ry="6" fill="#FF9EC0"/>
  <ellipse cx="138" cy="123" rx="10" ry="6" fill="#FF9EC0"/>
  ${mouth}
</svg>`;
}

const POSE_SHAPE = {
  wave: { arms: 'wave' }, listen: { arms: 'ear', mood: 'wow' }, think: { arms: 'chin' },
  cheer: { arms: 'up', mood: 'joy' }, oops: { arms: 'down', mood: 'oops' }, trophy: { arms: 'up' },
  read: { arms: 'down' }, point: { arms: 'wave' }, face: {}, sleep: { mood: 'joy' },
};

/** Buzzy in a pose: the real illustration if it exists, otherwise the placeholder. */
export function mascotHTML(pose = 'wave', { avatar = 'honey' } = {}) {
  const name = `mascot-${pose}`;
  const inner = hasArt(name)
    ? img(name)
    : hasArt('mascot-wave') && avatar === 'honey'
      ? img('mascot-wave')
      : buzzySVG({ avatar, ...(POSE_SHAPE[pose] || {}) });
  return `<div class="mascot" data-pose="${pose}">${inner}</div>`;
}

export function setMascotPose(el, pose) {
  if (!el) return;
  const box = el.classList.contains('mascot') ? el : el.querySelector('.mascot');
  if (!box) return;
  box.outerHTML = mascotHTML(pose);
}

// Colour variants of Buzzy's face until separate avatar illustrations exist.
const AVATAR_TINT = {
  honey: 'none',
  pink: 'hue-rotate(-62deg) saturate(1.05)',
  mint: 'hue-rotate(95deg) saturate(.85)',
  sky: 'hue-rotate(150deg) saturate(.9)',
  lavender: 'hue-rotate(-140deg) saturate(.85)',
  peach: 'hue-rotate(-22deg) saturate(1.1)',
};

export function avatarHTML(avatar = 'honey') {
  if (hasArt(`avatar-${avatar}`)) return img(`avatar-${avatar}`);
  if (hasArt('mascot-face')) {
    return `<img src="${artUrl('mascot-face')}" alt="" draggable="false" decoding="async" style="filter:${AVATAR_TINT[avatar] || 'none'}">`;
  }
  return buzzySVG({ avatar });
}

// ---------- Sunflower ----------
export function flowerSVG() {
  const petals = Array.from({ length: 14 }, (_, i) =>
    `<g transform="rotate(${(i * 360) / 14})"><ellipse class="f-petal" style="--i:${i}" cx="0" cy="-46" rx="13" ry="30" fill="#FFC93C" stroke="${INK}" stroke-width="4"/></g>`).join('');
  const seeds = [[-10, -8], [8, -12], [12, 6], [-4, 10], [-14, 6], [2, -1], [14, -2], [-8, -16]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#5B3A29"/>`).join('');
  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="f-sprout">
    <path d="M100 292 Q99 276 100 262" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
    <path d="M100 292 Q99 276 100 262" fill="none" stroke="#3FA34D" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="86" cy="258" rx="16" ry="9" transform="rotate(-28 86 258)" fill="#7BD389" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="114" cy="258" rx="16" ry="9" transform="rotate(28 114 258)" fill="#7BD389" stroke="${INK}" stroke-width="4"/>
  </g>
  <g class="f-stem">
    <path d="M100 296 C97 250 104 200 100 140" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
    <path d="M100 296 C97 250 104 200 100 140" fill="none" stroke="#3FA34D" stroke-width="7" stroke-linecap="round"/>
  </g>
  <g class="f-leaves">
    <path d="M100 246 C72 222 48 232 40 252 C64 260 86 258 100 246Z" fill="#7BD389" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M98 246 C80 246 62 248 50 251" fill="none" stroke="#3FA34D" stroke-width="3" stroke-linecap="round"/>
    <path d="M101 214 C128 190 152 198 162 218 C138 228 116 226 101 214Z" fill="#7BD389" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M103 214 C122 214 140 216 152 219" fill="none" stroke="#3FA34D" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="f-nod"><g transform="translate(100 112)"><g class="f-face">
    ${petals}
    <g class="f-center"><circle r="30" fill="#9A6A45" stroke="${INK}" stroke-width="4.5"/>${seeds}</g>
    <g class="f-bud">
      <path d="M0 -36 C22 -30 28 -4 22 14 C16 30 -16 30 -22 14 C-28 -4 -22 -30 0 -36Z" fill="#7BD389" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M-8 -34 Q0 -46 8 -34" fill="#FFC93C" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M-13 -22 Q-2 0 0 26 M13 -22 Q2 0 0 26" fill="none" stroke="#3FA34D" stroke-width="3.5" stroke-linecap="round"/>
    </g>
  </g></g></g>
  <path d="M62 300 L70 276 L78 300 L86 270 L94 300 L102 274 L110 300 L118 268 L126 300 L134 278 L140 300Z" fill="#7BD389" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
</svg>`;
}

const STAGE_FILES = ['sunflower-1-sprout', 'sunflower-2-bud', 'sunflower-3-half', 'sunflower-4-bloom', 'sunflower-5-droop'];

export function flowerHTML(stage = 2, extraClass = '') {
  const useImages = STAGE_FILES.every(hasArt);
  const inner = useImages
    ? STAGE_FILES.map((n, i) => img(n, `stage-img${i + 1 === stage ? ' on' : ''}`)).join('')
    : flowerSVG();
  return `<div class="flower ${extraClass}" data-stage="${stage}">${inner}</div>`;
}

export function setFlowerStage(el, stage) {
  if (!el) return;
  el.dataset.stage = String(stage);
  el.querySelectorAll('.stage-img').forEach((im, i) => im.classList.toggle('on', i + 1 === stage));
}

// ---------- Small nature pieces ----------
export function cloudSVG(variant = 1) {
  const shapes = {
    1: 'M44 96 Q12 96 14 70 Q16 46 44 50 Q48 20 82 22 Q100 2 128 16 Q156 6 168 36 Q204 32 206 64 Q208 96 174 96Z',
    2: 'M30 70 Q8 70 12 52 Q16 36 38 40 Q48 22 76 28 Q96 14 120 26 Q150 20 160 40 Q190 40 190 56 Q190 70 168 70Z',
    3: 'M46 92 Q16 92 20 68 Q24 48 48 52 Q50 26 80 26 Q98 8 122 22 Q150 16 156 46 Q184 50 180 72 Q178 92 152 92Z',
  };
  return `<svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="${shapes[variant] || shapes[1]}" fill="#fff" stroke="${INK}" stroke-opacity=".28" stroke-width="4" stroke-linejoin="round"/>
</svg>`;
}

export function cloudHTML(variant) {
  return hasArt(`cloud-${variant}`) ? img(`cloud-${variant}`) : cloudSVG(variant);
}

const PETAL_COLORS = { yellow: '#FFC93C', pink: '#FF9EC0', white: '#FFFFFF' };
export function petalHTML(color = 'yellow') {
  if (hasArt(`petal-${color}`)) return img(`petal-${color}`);
  return `<svg viewBox="0 0 40 60" aria-hidden="true"><path d="M20 3 C34 14 36 40 20 57 C4 40 6 14 20 3Z" fill="${PETAL_COLORS[color] || PETAL_COLORS.yellow}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></svg>`;
}

const LEAF_COLORS = { 1: '#7BD389', 2: '#A8E6A1', 3: '#3FA34D' };
export function leafHTML(variant = 1) {
  if (hasArt(`leaf-${variant}`)) return img(`leaf-${variant}`);
  const fill = LEAF_COLORS[variant] || LEAF_COLORS[1];
  return `<svg viewBox="0 0 64 44" aria-hidden="true"><path d="M4 22 C16 2 46 0 60 22 C46 44 16 42 4 22Z" fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M8 22 C24 20 40 20 56 22" fill="none" stroke="${INK}" stroke-opacity=".45" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}

/** Big leaf that covers a letter tile before the reveal. */
export function coverLeafHTML(i) {
  const variant = (i % 2) + 1; // the broad leaves cover a tile best
  if (hasArt(`leaf-${variant}`)) return img(`leaf-${variant}`, `cover-leaf cover-leaf-${variant}`);
  const fill = ['#7BD389', '#5FC071', '#8FDC97'][i % 3];
  return `<svg viewBox="0 0 80 92" aria-hidden="true"><path d="M40 4 C70 20 76 62 40 88 C4 62 10 20 40 4Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M40 12 L40 80 M40 36 L56 26 M40 52 L24 42 M40 64 L54 56" fill="none" stroke="#2F7D3B" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></svg>`;
}

export function beeFlyerHTML() {
  if (hasArt('bee-flyer')) {
    // The illustrated bee has no wings on purpose: one flaps behind its back and a see-through,
    // shiny one flaps on the near side (style C from the mockup).
    return `<svg viewBox="-36 0 136 186" aria-hidden="true">
      <g class="wing"><ellipse cx="2" cy="86" rx="14" ry="28" transform="rotate(-64 2 86)" fill="#DDF3FF" fill-opacity=".95" stroke="${INK}" stroke-width="3.5"/></g>
      <image href="${artUrl('bee-flyer')}" x="0" y="0" width="100" height="186"/>
      <g class="wing front"><ellipse cx="8" cy="96" rx="18" ry="34" transform="rotate(-54 8 96)" fill="#F4FBFF" fill-opacity=".62" stroke="${INK}" stroke-width="3.5"/><path d="M-10 82 Q-6 96 6 104" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".95"/></g>
    </svg>`;
  }
  return `<svg viewBox="0 0 64 56" aria-hidden="true">
  <g class="wing"><ellipse cx="26" cy="16" rx="10" ry="13" fill="#DDF3FF" stroke="${INK}" stroke-width="2.5"/></g>
  <g class="wing" style="animation-delay:.06s"><ellipse cx="38" cy="16" rx="9" ry="12" fill="#DDF3FF" stroke="${INK}" stroke-width="2.5"/></g>
  <path d="M6 34 L1 36 L6 38" fill="${INK}"/>
  <ellipse cx="30" cy="34" rx="23" ry="16" fill="#FFC93C" stroke="${INK}" stroke-width="3"/>
  <path d="M22 19 Q18 34 22 49 M32 18 Q28 34 32 50" fill="none" stroke="#5B3A29" stroke-width="5"/>
  <circle cx="45" cy="30" r="3.4" fill="${INK}"/><circle cx="46.2" cy="28.8" r="1.1" fill="#fff"/>
  <path d="M43 38 Q47 41 51 38" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;
}

// ---------- Hills ----------
export function hillsHTML(layer) {
  const files = { far: 'scene-hills-far', near: 'scene-hills-near', front: 'scene-grass-front' };
  if (hasArt(files[layer])) return img(files[layer]);
  if (layer === 'far') {
    return `<svg viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120 C120 60 230 70 330 110 C430 150 520 60 640 70 C760 80 820 140 930 120 C1040 100 1110 60 1200 90 L1200 260 L0 260Z" fill="#B6E3C2" stroke="${INK}" stroke-opacity=".18" stroke-width="4"/>
    <g fill="#8FD0A2" stroke="${INK}" stroke-opacity=".25" stroke-width="3"><circle cx="210" cy="86" r="16"/><circle cx="236" cy="92" r="12"/><circle cx="880" cy="104" r="15"/><circle cx="1040" cy="88" r="13"/></g></svg>`;
  }
  if (layer === 'near') {
    return `<svg viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true"><path d="M0 110 C160 50 300 60 430 100 C560 140 650 70 800 60 C950 50 1060 110 1200 80 L1200 220 L0 220Z" fill="#8EDB98" stroke="${INK}" stroke-opacity=".35" stroke-width="5"/>
    <g stroke="${INK}" stroke-width="2.5"><circle cx="160" cy="110" r="6" fill="#FF9EC0"/><circle cx="330" cy="104" r="6" fill="#FFC93C"/><circle cx="560" cy="128" r="6" fill="#C7A6F2"/><circle cx="760" cy="96" r="6" fill="#FF9EC0"/><circle cx="1010" cy="110" r="6" fill="#FFC93C"/><circle cx="1120" cy="96" r="6" fill="#C7A6F2"/></g></svg>`;
  }
  // Two rows of soft, curved grass blades.
  const row = (offset, base, step, tall, seed) => {
    let d = `M0 ${base} `;
    for (let x = offset; x <= 1200 + step; x += step) {
      const h = tall * 0.55 + ((x * seed) % (tall * 0.45));
      const lean = ((x * 7) % 9) - 4;
      d += `Q${x + step * 0.25} ${base - h * 0.5} ${x + step * 0.5 + lean} ${base - h} Q${x + step * 0.6} ${base - h * 0.45} ${x + step} ${base} `;
    }
    return `${d}L1200 120 L0 120Z`;
  };
  return `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
    <path d="${row(0, 96, 26, 52, 37)}" fill="#4FAE5E" stroke="${INK}" stroke-opacity=".3" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${row(11, 104, 30, 40, 53)}" fill="#6CC77A" stroke="${INK}" stroke-opacity=".3" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}

// ---------- Badges ----------
export function badgeHTML(badge, iconSvg) {
  if (hasArt(`badge-${badge.id}`)) return img(`badge-${badge.id}`, 'badge-art');
  return `<svg class="badge-art" viewBox="0 0 100 110" aria-hidden="true">
  <path d="M36 82 L30 106 L42 98 L50 108 L54 84Z M64 82 L70 106 L58 98 L50 108 L46 84Z" fill="${badge.color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="50" cy="48" r="44" fill="${badge.color}" stroke="${INK}" stroke-width="4"/>
  <circle cx="50" cy="48" r="32" fill="#FFF8E7" stroke="${INK}" stroke-width="3"/>
  <g transform="translate(32 30) scale(1.5)" color="${INK}">${iconSvg}</g>
</svg>`;
}

// ---------- Garden plants ----------
export function plantHTML(stage, lang) {
  // Stage 0 = soil, 1–4 = sprout → bloom. Language flowers appear at full bloom when drawn.
  const bloomArt = { en: ['garden-sunflower', 'garden-tulip', 'garden-daisy'], bn: ['garden-shapla', 'garden-marigold', 'garden-tagar'], ar: ['garden-jasmine', 'garden-rose', 'garden-datepalm'] }[lang] || [];
  if (stage >= 4) {
    const found = bloomArt.find(hasArt);
    if (found) return img(found);
  }
  if (stage === 1 && hasArt('garden-sprout')) return img('garden-sprout');
  if (stage === 0) {
    return `<svg viewBox="0 0 200 300" aria-hidden="true"><path d="M28 296 C40 258 160 258 172 296Z" fill="#B98A5E" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M70 276 q8 -6 16 0 M112 270 q8 -6 16 0" fill="none" stroke="#8A5E3B" stroke-width="5" stroke-linecap="round"/></svg>`;
  }
  return flowerHTML(Math.min(stage, 4));
}
