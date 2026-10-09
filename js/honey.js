// Honey Pot: the shop catalogue and the hand-drawn jar, hats and garden decorations.
// Any item can be replaced by an illustration named hat-<id>.png or decor-<id>.png (see docs/image-prompts.md).
import { hasArt, artUrl } from './art.js';

export const JAR_SIZE = 25;

export const SHOP = {
  hats: [
    { id: 'flower', price: 15 },
    { id: 'bow', price: 15 },
    { id: 'party', price: 20 },
    { id: 'sunhat', price: 30 },
    { id: 'grad', price: 40 },
    { id: 'crown', price: 60 },
  ],
  colours: [
    { id: 'silver', price: 30 },
    { id: 'gold', price: 40 },
    { id: 'rainbow', price: 60 },
  ],
  decor: [
    { id: 'ladybug', price: 10 },
    { id: 'butterfly', price: 10 },
    { id: 'wateringcan', price: 15 },
    { id: 'birdhouse', price: 25 },
    { id: 'pond', price: 35 },
    { id: 'rainbow', price: 50 },
  ],
};

const INK = '#3D2C29';
const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

const HATS = {
  flower: `<path d="M8 56 Q50 30 92 56" fill="none" stroke="#3FA34D" stroke-width="7" stroke-linecap="round"/>
    ${[[14, 50, '#FF9EC0'], [32, 40, '#FFFFFF'], [50, 36, '#FFC93C'], [68, 40, '#C7A6F2'], [86, 50, '#FF9EC0']].map(([x, y, c]) =>
      `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-8" rx="6" ry="8" transform="rotate(${a})" fill="${c}" ${S} stroke-width="2.5"/>`).join('')}<circle r="4.5" fill="#FF8C42" ${S} stroke-width="2.5"/></g>`).join('')}`,
  bow: `<path d="M50 46 C30 22 8 30 12 48 C15 62 34 60 50 50Z" fill="#FF6B9D" ${S}/>
    <path d="M50 46 C70 22 92 30 88 48 C85 62 66 60 50 50Z" fill="#FF6B9D" ${S}/>
    <path d="M44 50 L36 66 M56 50 L64 66" ${S} stroke="#B0124F" stroke-width="6"/>
    <rect x="42" y="38" width="16" height="16" rx="6" fill="#FF9EC0" ${S}/>`,
  party: `<path d="M50 2 L76 62 L24 62Z" fill="#FF6B9D" ${S}/>
    <path d="M38 34 L62 34 M31 49 L69 49" stroke="#FFC93C" stroke-width="6" stroke-linecap="round"/>
    <path d="M50 2 L76 62 L24 62Z" fill="none" ${S}/>
    <circle cx="50" cy="6" r="8" fill="#FFFFFF" ${S}/>`,
  sunhat: `<ellipse cx="50" cy="58" rx="46" ry="11" fill="#F6D58E" ${S}/>
    <path d="M26 58 C26 26 74 26 74 58Z" fill="#FBE3A8" ${S}/>
    <path d="M27 50 Q50 56 73 50 L74 58 Q50 64 26 58Z" fill="#9B5DE5" ${S} stroke-width="3"/>
    <circle cx="70" cy="50" r="6" fill="#FF9EC0" ${S} stroke-width="3"/>`,
  grad: `<path d="M50 14 L94 30 L50 46 L6 30Z" fill="#4A3833" ${S}/>
    <path d="M28 38 L28 56 Q50 66 72 56 L72 38 L50 46Z" fill="#5A4640" ${S}/>
    <path d="M50 30 L86 36 L86 54" fill="none" stroke="#FFC93C" stroke-width="4" stroke-linecap="round"/>
    <circle cx="86" cy="58" r="5" fill="#FFC93C" ${S} stroke-width="3"/>
    <circle cx="50" cy="30" r="4" fill="#FFC93C"/>`,
  crown: `<path d="M12 60 L8 18 L30 38 L50 10 L70 38 L92 18 L88 60Z" fill="#FFC93C" ${S}/>
    <path d="M14 52 L86 52" stroke="#F2A900" stroke-width="5"/>
    <circle cx="30" cy="46" r="4.5" fill="#FF6B9D" ${S} stroke-width="2.5"/><circle cx="50" cy="44" r="5" fill="#5BC0EB" ${S} stroke-width="2.5"/><circle cx="70" cy="46" r="4.5" fill="#7BD389" ${S} stroke-width="2.5"/>
    <circle cx="8" cy="16" r="4" fill="#FFF8E7" ${S} stroke-width="2.5"/><circle cx="50" cy="8" r="4" fill="#FFF8E7" ${S} stroke-width="2.5"/><circle cx="92" cy="16" r="4" fill="#FFF8E7" ${S} stroke-width="2.5"/>`,
};

const DECOR = {
  ladybug: `<ellipse cx="50" cy="88" rx="30" ry="5" fill="#000" opacity=".08"/>
    <circle cx="30" cy="56" r="13" fill="#3D2C29"/><circle cx="25" cy="52" r="3.5" fill="#fff"/><circle cx="33" cy="51" r="3.5" fill="#fff"/>
    <ellipse cx="56" cy="60" rx="30" ry="24" fill="#FF4D4D" ${S}/><path d="M56 36 L56 84" ${S}/>
    <circle cx="44" cy="52" r="5" fill="#3D2C29"/><circle cx="68" cy="52" r="5" fill="#3D2C29"/><circle cx="46" cy="70" r="4.5" fill="#3D2C29"/><circle cx="68" cy="70" r="4.5" fill="#3D2C29"/>
    <path d="M24 44 Q20 32 12 30 M32 43 Q34 30 30 22" fill="none" ${S} stroke-width="3"/>`,
  butterfly: `<path d="M50 50 C30 14 6 22 12 44 C16 58 36 58 50 52Z" fill="#FF9EC0" ${S}/>
    <path d="M50 50 C70 14 94 22 88 44 C84 58 64 58 50 52Z" fill="#FF9EC0" ${S}/>
    <path d="M50 54 C34 64 22 78 32 84 C40 88 48 74 50 60Z" fill="#C7A6F2" ${S}/>
    <path d="M50 54 C66 64 78 78 68 84 C60 88 52 74 50 60Z" fill="#C7A6F2" ${S}/>
    <circle cx="26" cy="38" r="4" fill="#FFC93C"/><circle cx="74" cy="38" r="4" fill="#FFC93C"/>
    <ellipse cx="50" cy="56" rx="4.5" ry="20" fill="#3D2C29"/><path d="M48 38 Q42 24 36 22 M52 38 Q58 24 64 22" fill="none" ${S} stroke-width="3"/>`,
  wateringcan: `<ellipse cx="46" cy="90" rx="34" ry="5" fill="#000" opacity=".08"/>
    <path d="M70 52 L94 30 L98 36 L76 60" fill="#5BC0EB" ${S}/>
    <rect x="18" y="40" width="56" height="46" rx="10" fill="#5BC0EB" ${S}/>
    <path d="M26 40 Q46 14 66 40" fill="none" ${S} stroke-width="6"/>
    <path d="M28 56 L64 56" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <circle cx="96" cy="44" r="2.5" fill="#5BC0EB"/><circle cx="90" cy="50" r="2.5" fill="#5BC0EB"/>`,
  birdhouse: `<rect x="46" y="58" width="8" height="38" fill="#B98A5E" ${S}/>
    <path d="M24 40 L50 16 L76 40" fill="#FF6B9D" ${S}/>
    <rect x="28" y="38" width="44" height="28" rx="4" fill="#FFC93C" ${S}/>
    <circle cx="50" cy="50" r="7" fill="#3D2C29"/><path d="M42 62 L58 62" ${S}/>`,
  pond: `<ellipse cx="50" cy="72" rx="46" ry="20" fill="#5BC0EB" ${S}/>
    <ellipse cx="32" cy="74" rx="12" ry="5" fill="#7BD389" ${S} stroke-width="3"/>
    <path d="M58 66 C58 54 76 52 78 60 L86 58 L82 64 C82 72 62 74 58 66Z" fill="#FFC93C" ${S} stroke-width="3"/>
    <circle cx="74" cy="58" r="1.8" fill="#3D2C29"/><path d="M62 78 Q70 80 78 78" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  rainbow: `${['#FF6B9D', '#FF8C42', '#FFC93C', '#7BD389', '#5BC0EB'].map((c, i) =>
      `<path d="M${10 + i * 6} 80 A${40 - i * 6} ${40 - i * 6} 0 0 1 ${90 - i * 6} 80" fill="none" stroke="${c}" stroke-width="7"/>`).join('')}
    <path d="M7 80 A43 43 0 0 1 93 80" fill="none" ${S} stroke-width="3"/><path d="M37 80 A13 13 0 0 1 63 80" fill="none" ${S} stroke-width="3"/>
    <path d="M2 84 C2 72 18 70 22 78 C30 74 36 82 30 88 L4 88Z" fill="#fff" ${S} stroke-width="3"/>
    <path d="M98 84 C98 72 82 70 78 78 C70 74 64 82 70 88 L96 88Z" fill="#fff" ${S} stroke-width="3"/>`,
};

export function hatSVG(id) {
  if (hasArt(`hat-${id}`)) return `<img src="${artUrl(`hat-${id}`)}" alt="" draggable="false">`;
  return HATS[id] ? `<svg viewBox="0 0 100 70" aria-hidden="true">${HATS[id]}</svg>` : '';
}

export function decorSVG(id) {
  if (hasArt(`decor-${id}`)) return `<img src="${artUrl(`decor-${id}`)}" alt="" draggable="false">`;
  return DECOR[id] ? `<svg viewBox="0 0 100 100" aria-hidden="true">${DECOR[id]}</svg>` : '';
}

/** A glass jar filled to `level` (0–1). */
export function jarSVG(level = 0, { full = false } = {}) {
  const l = full ? 1 : Math.max(0, Math.min(1, level));
  const top = 128 - l * 84; // honey surface between the bottom (128) and the neck (44)
  const id = `jar${Math.random().toString(36).slice(2, 7)}`;
  return `<svg viewBox="0 0 120 140" aria-hidden="true" class="jar">
    <defs><clipPath id="${id}"><path d="M24 44 C14 52 12 66 12 84 L12 116 C12 128 22 134 34 134 L86 134 C98 134 108 128 108 116 L108 84 C108 66 106 52 96 44Z"/></clipPath></defs>
    <path d="M24 44 C14 52 12 66 12 84 L12 116 C12 128 22 134 34 134 L86 134 C98 134 108 128 108 116 L108 84 C108 66 106 52 96 44Z" fill="#FFFDF6"/>
    <g clip-path="url(#${id})">
      <path class="jar-honey" d="M0 ${top} Q30 ${top - 6} 60 ${top} T120 ${top} L120 140 L0 140Z" fill="#FFC93C"/>
      <path d="M0 ${top + 4} Q30 ${top - 2} 60 ${top + 4} T120 ${top + 4}" fill="none" stroke="#F2A900" stroke-width="3" opacity="${l > 0 ? 1 : 0}"/>
    </g>
    <path d="M30 62 C26 72 26 92 28 104" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/>
    <path d="M24 44 C14 52 12 66 12 84 L12 116 C12 128 22 134 34 134 L86 134 C98 134 108 128 108 116 L108 84 C108 66 106 52 96 44Z" fill="none" ${S} stroke-width="5"/>
    <rect x="20" y="22" width="80" height="24" rx="8" fill="#FF8C42" ${S} stroke-width="5"/>
    <path d="M32 30 L88 30" stroke="#FFC28F" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

export const jarProgress = (earned) => ({
  full: Math.floor(earned / JAR_SIZE),
  inJar: earned % JAR_SIZE,
  level: (earned % JAR_SIZE) / JAR_SIZE,
});
