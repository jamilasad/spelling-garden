// Everything she can put in her garden: price in honey, how many learned ("blooming") words unlock it,
// its base size, and a drawn stand-in until the illustration (images/incoming/<id>.png) exists.
import { hasArt, artUrl } from './art.js';
import { decorSVG } from './honey.js';

const INK = '#3D2C29';
const S = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

export const CATEGORIES = ['plants', 'trees', 'garden', 'water', 'big', 'treasures'];

// w = width as % of the garden at normal size, front row. need = blooming words required. max = how many she can own.
export const ITEMS = {
  // Flowers & plants
  'plant-sunflower': { cat: 'plants', price: 5, need: 0, w: 7, art: 'sunflower-4-bloom', n: { en: 'Sunflower', bn: 'সূর্যমুখী', ar: 'عباد الشمس' } },
  'plant-bush': { cat: 'plants', price: 5, need: 0, w: 9, n: { en: 'Bush', bn: 'ঝোপ', ar: 'شجيرة' } },
  'plant-tulip': { cat: 'plants', price: 6, need: 0, w: 6, n: { en: 'Tulips', bn: 'টিউলিপ', ar: 'زنبق' } },
  'plant-daisy': { cat: 'plants', price: 6, need: 1, w: 6, n: { en: 'Daisies', bn: 'ডেইজি', ar: 'أقحوان' } },
  'plant-pot': { cat: 'plants', price: 7, need: 2, w: 6, n: { en: 'Flower pot', bn: 'ফুলের টব', ar: 'أصيص زهور' } },
  'plant-mushrooms': { cat: 'plants', price: 7, need: 3, w: 6, n: { en: 'Mushrooms', bn: 'ব্যাঙের ছাতা', ar: 'فطر' } },
  'plant-marigold': { cat: 'plants', price: 8, need: 3, w: 6, n: { en: 'Marigolds', bn: 'গাঁদা ফুল', ar: 'قطيفة' } },
  'plant-lavender': { cat: 'plants', price: 8, need: 4, w: 6, n: { en: 'Lavender', bn: 'ল্যাভেন্ডার', ar: 'خزامى' } },
  'plant-tagar': { cat: 'plants', price: 9, need: 5, w: 7, n: { en: 'Crape jasmine', bn: 'টগর', ar: 'ياسمين التاغار' } },
  'plant-rose': { cat: 'plants', price: 10, need: 6, w: 8, n: { en: 'Rose bush', bn: 'গোলাপ গাছ', ar: 'شجيرة ورد' } },
  'plant-jasmine': { cat: 'plants', price: 10, need: 7, w: 7, n: { en: 'Jasmine', bn: 'বেলি ফুল', ar: 'ياسمين' } },
  'plant-shapla': { cat: 'plants', price: 12, need: 8, w: 9, n: { en: 'Shapla lily', bn: 'শাপলা', ar: 'زنبق الماء' } },
  // Trees
  'tree-young': { cat: 'trees', price: 25, need: 8, w: 9, n: { en: 'Young tree', bn: 'ছোট গাছ', ar: 'شجرة صغيرة' } },
  'tree-blossom': { cat: 'trees', price: 35, need: 10, w: 11, n: { en: 'Blossom tree', bn: 'ফুলের গাছ', ar: 'شجرة مزهرة' } },
  'tree-datepalm': { cat: 'trees', price: 40, need: 12, w: 11, n: { en: 'Date palm', bn: 'খেজুর গাছ', ar: 'نخلة' } },
  'tree-mango': { cat: 'trees', price: 45, need: 14, w: 12, n: { en: 'Mango tree', bn: 'আম গাছ', ar: 'شجرة مانجو' } },
  'tree-jackfruit': { cat: 'trees', price: 45, need: 15, w: 12, n: { en: 'Jackfruit tree', bn: 'কাঁঠাল গাছ', ar: 'شجرة الكاكايا' } },
  // Garden pieces
  'item-path': { cat: 'garden', price: 6, need: 0, w: 12, n: { en: 'Stepping stones', bn: 'পাথরের পথ', ar: 'حجارة الممر' } },
  'item-fence': { cat: 'garden', price: 8, need: 2, w: 13, n: { en: 'Fence', bn: 'বেড়া', ar: 'سياج' } },
  'item-wateringcan': { cat: 'garden', price: 10, need: 3, w: 6, legacy: 'wateringcan', n: { en: 'Watering can', bn: 'ঝাঁঝরি', ar: 'مرشّة' } },
  'item-signpost': { cat: 'garden', price: 12, need: 5, w: 5, n: { en: 'Signpost', bn: 'দিকনির্দেশক', ar: 'لافتة' } },
  'item-lamp': { cat: 'garden', price: 15, need: 6, w: 4, n: { en: 'Garden lamp', bn: 'বাগানের বাতি', ar: 'مصباح الحديقة' } },
  'item-wheelbarrow': { cat: 'garden', price: 16, need: 7, w: 8, n: { en: 'Wheelbarrow', bn: 'ঠেলাগাড়ি', ar: 'عربة يد' } },
  'item-bench': { cat: 'garden', price: 18, need: 8, w: 10, n: { en: 'Bench', bn: 'বেঞ্চ', ar: 'مقعد' } },
  'item-birdhouse': { cat: 'garden', price: 20, need: 9, w: 5, legacy: 'birdhouse', n: { en: 'Birdhouse', bn: 'পাখির বাসা', ar: 'بيت العصافير' } },
  'item-swing': { cat: 'garden', price: 30, need: 12, w: 10, n: { en: 'Swing', bn: 'দোলনা', ar: 'أرجوحة' } },
  'decor-ladybug': { cat: 'garden', price: 10, need: 0, w: 4, legacy: 'ladybug', n: { en: 'Ladybug', bn: 'লেডিবাগ', ar: 'دعسوقة' } },
  'decor-butterfly': { cat: 'garden', price: 10, need: 0, w: 5, legacy: 'butterfly', n: { en: 'Butterfly', bn: 'প্রজাপতি', ar: 'فراشة' } },
  'decor-rainbow': { cat: 'garden', price: 50, need: 18, w: 14, legacy: 'rainbow', max: 1, n: { en: 'Rainbow', bn: 'রংধনু', ar: 'قوس قزح' } },
  // Water
  'water-stream': { cat: 'water', price: 35, need: 10, w: 16, n: { en: 'Stream', bn: 'ঝরনা ধারা', ar: 'جدول' } },
  'water-bridge': { cat: 'water', price: 35, need: 12, w: 15, n: { en: 'Bridge', bn: 'সাঁকো', ar: 'جسر' } },
  'water-pond': { cat: 'water', price: 50, need: 14, w: 17, legacy: 'pond', n: { en: 'Pond', bn: 'পুকুর', ar: 'بركة' } },
  'water-fountain': { cat: 'water', price: 60, need: 20, w: 9, n: { en: 'Fountain', bn: 'ফোয়ারা', ar: 'نافورة' } },
  // Big goals (one of each)
  'big-hive-home': { cat: 'big', price: 120, need: 20, w: 13, max: 1, n: { en: "Buzzy's home", bn: 'বাজির বাড়ি', ar: 'بيت بَزِّي' } },
  'big-arch': { cat: 'big', price: 90, need: 25, w: 10, max: 1, n: { en: 'Rose arch', bn: 'গোলাপের তোরণ', ar: 'قوس الورود' } },
  'big-gazebo': { cat: 'big', price: 150, need: 32, w: 14, max: 1, n: { en: 'Gazebo', bn: 'বাগানঘর', ar: 'كشك الحديقة' } },
  'big-treehouse': { cat: 'big', price: 200, need: 45, w: 14, max: 1, n: { en: 'Treehouse', bn: 'গাছবাড়ি', ar: 'بيت الشجرة' } },
  // Word treasures (free, won when that word starts blooming)
  'treasure-boat': { cat: 'treasures', w: 11, n: { en: 'Little boat', bn: 'ছোট নৌকা', ar: 'قارب صغير' } },
  'treasure-bowl': { cat: 'treasures', w: 7, n: { en: 'Bird bath', bn: 'পাখির জলপাত্র', ar: 'حوض الطيور' } },
  'treasure-milk': { cat: 'treasures', w: 6, n: { en: 'Milk crate', bn: 'দুধের বোতল', ar: 'صندوق الحليب' } },
  'treasure-sandpit': { cat: 'treasures', w: 9, n: { en: 'Sand dune', bn: 'বালির ঢিবি', ar: 'كثيب رمل' } },
  'treasure-picnic': { cat: 'treasures', w: 13, n: { en: 'Picnic blanket', bn: 'পিকনিকের চাদর', ar: 'بساط النزهة' } },
  'treasure-rockery': { cat: 'treasures', w: 9, n: { en: 'Little mountain', bn: 'ছোট পাহাড়', ar: 'جبل صغير' } },
  'treasure-sprinkler': { cat: 'treasures', w: 7, n: { en: 'Sprinkler', bn: 'পানি ছিটানো যন্ত্র', ar: 'رشاش ماء' } },
  'treasure-scooter': { cat: 'treasures', w: 7, n: { en: 'Scooter', bn: 'স্কুটার', ar: 'سكوتر' } },
  'treasure-cottage': { cat: 'treasures', w: 10, n: { en: 'Village cottage', bn: 'গ্রামের কুটির', ar: 'كوخ القرية' } },
  'treasure-giraffe': { cat: 'treasures', w: 9, n: { en: 'Giraffe', bn: 'জিরাফ', ar: 'زرافة' } },
  'treasure-gift': { cat: 'treasures', w: 6, n: { en: 'Present', bn: 'উপহার', ar: 'هدية' } },
  'treasure-cat': { cat: 'treasures', w: 6, n: { en: 'Sleepy cat', bn: 'ঘুমন্ত বিড়াল', ar: 'قطة نائمة' } },
  'treasure-chest': { cat: 'treasures', w: 7, n: { en: 'Treasure chest', bn: 'গুপ্তধনের বাক্স', ar: 'صندوق الكنز' } },
  'treasure-tallgrass': { cat: 'treasures', w: 7, n: { en: 'Tall grass', bn: 'লম্বা ঘাস', ar: 'عشب طويل' } },
  'treasure-raccoon': { cat: 'treasures', w: 6, n: { en: 'Raccoon', bn: 'র‍্যাকুন', ar: 'راكون' } },
  'treasure-boulder': { cat: 'treasures', w: 8, n: { en: 'Big rock', bn: 'বড় পাথর', ar: 'صخرة كبيرة' } },
  'treasure-balloons': { cat: 'treasures', w: 7, n: { en: 'Balloons', bn: 'বেলুন', ar: 'بالونات' } },
  'treasure-dancers': { cat: 'treasures', w: 6, n: { en: 'Dancing butterflies', bn: 'নাচুনে প্রজাপতি', ar: 'فراشات راقصة' } },
  'treasure-ribbon': { cat: 'treasures', w: 5, n: { en: 'First prize', bn: 'প্রথম পুরস্কার', ar: 'الجائزة الأولى' } },
  'treasure-school': { cat: 'treasures', w: 10, n: { en: 'Little school', bn: 'ছোট্ট বিদ্যালয়', ar: 'مدرسة صغيرة' } },
  'treasure-flag': { cat: 'treasures', w: 6, n: { en: 'Bangladesh flag', bn: 'বাংলাদেশের পতাকা', ar: 'علم بنغلاديش' } },
  'treasure-custardapple': { cat: 'treasures', w: 8, n: { en: 'Custard apple tree', bn: 'আতা গাছ', ar: 'شجرة القشطة' } },
  'treasure-cow': { cat: 'treasures', w: 9, n: { en: 'Cow', bn: 'গরু', ar: 'بقرة' } },
  'treasure-flute': { cat: 'treasures', w: 6, n: { en: 'Flute', bn: 'বাঁশি', ar: 'ناي' } },
  'treasure-paddy': { cat: 'treasures', w: 12, n: { en: 'Paddy field', bn: 'ধানক্ষেত', ar: 'حقل أرز' } },
  'treasure-elephant': { cat: 'treasures', w: 11, n: { en: 'White elephant', bn: 'সাদা হাতি', ar: 'فيل أبيض' } },
  'treasure-fish': { cat: 'treasures', w: 6, n: { en: 'Silver fish', bn: 'রুপালি মাছ', ar: 'سمكة فضية' } },
  'treasure-plough': { cat: 'treasures', w: 11, n: { en: 'Plough', bn: 'লাঙল', ar: 'محراث' } },
  'treasure-datepot': { cat: 'treasures', w: 6, n: { en: 'Date-juice pot', bn: 'খেজুর রসের হাঁড়ি', ar: 'جرة عصير التمر' } },
  'treasure-boots': { cat: 'treasures', w: 6, n: { en: 'Rain boots', bn: 'বুট জুতা', ar: 'حذاء المطر' } },
  'treasure-sundial': { cat: 'treasures', w: 6, n: { en: 'Sundial', bn: 'সূর্যঘড়ি', ar: 'مزولة' } },
  'treasure-penpot': { cat: 'treasures', w: 6, n: { en: 'Pen planter', bn: 'কলমের টব', ar: 'أصيص الأقلام' } },
  'treasure-family': { cat: 'treasures', w: 10, n: { en: 'Bee family bench', bn: 'মৌমাছি পরিবার', ar: 'عائلة النحل' } },
  'visitor-frog': { cat: 'treasures', w: 6, n: { en: 'Frog', bn: 'ব্যাঙ', ar: 'ضفدع' } },
  'visitor-doyel': { cat: 'treasures', w: 6, n: { en: 'Doyel bird', bn: 'দোয়েল', ar: 'طائر الدويل' } },
  'mystery-flower': { cat: 'treasures', w: 6, art: 'sunflower-3-half', n: { en: 'Mystery flower', bn: 'রহস্য ফুল', ar: 'زهرة مفاجأة' } },
  seed: { cat: 'hidden', w: 7, art: 'sunflower-1-sprout', n: { en: 'Mystery seed', bn: 'রহস্য বীজ', ar: 'بذرة مفاجأة' } },
};

// The word each treasure comes from. Words without a sensible object give a mystery flower.
export const TREASURES = {
  'en-02': 'treasure-milk', 'en-04': 'treasure-boat', 'en-05': 'treasure-bowl',
  'en-06': 'water-stream', 'en-07': 'treasure-sandpit', 'en-08': 'treasure-picnic', 'en-09': 'treasure-rockery', 'en-10': 'treasure-sprinkler',
  'en-11': 'treasure-scooter', 'en-12': 'treasure-cottage', 'en-15': 'tree-mango', 'en-16': 'treasure-giraffe', 'en-17': 'treasure-gift',
  'en-19': 'treasure-cat', 'en-20': 'treasure-chest', 'en-21': 'treasure-tallgrass', 'en-22': 'treasure-raccoon', 'en-23': 'treasure-dancers',
  'en-24': 'treasure-boulder', 'en-25': 'treasure-balloons',
  'bn-01': 'treasure-ribbon', 'bn-03': 'treasure-school', 'bn-05': 'treasure-flag', 'bn-06': 'visitor-doyel', 'bn-07': 'plant-tagar',
  'bn-08': 'treasure-custardapple', 'bn-09': 'treasure-cow', 'bn-10': 'treasure-flute', 'bn-12': 'treasure-paddy', 'bn-13': 'treasure-elephant',
  'bn-14': 'visitor-frog', 'bn-15': 'treasure-fish', 'bn-16': 'treasure-plough', 'bn-19': 'treasure-datepot', 'bn-20': 'tree-jackfruit',
  'ar-01': 'treasure-family', 'ar-06': 'treasure-boots', 'ar-07': 'treasure-sundial', 'ar-09': 'treasure-penpot',
};
export const treasureFor = (wordId) => TREASURES[wordId] || 'mystery-flower';

export const SIZES = [0.6, 0.8, 1, 1.3, 1.65]; // Smaller ← → Bigger
export const DEFAULT_SIZE = 2;
export const UNLOCK_MORE_GARDEN = 10;           // blooming words that open the rest of the garden
export const MYSTERY_FLOWERS = ['plant-tulip', 'plant-daisy', 'plant-marigold', 'plant-rose', 'plant-lavender', 'plant-shapla', 'plant-jasmine'];

// ---------- Drawn stand-ins (used until the illustration exists) ----------
const BFLY = (c) => `<svg viewBox="0 0 60 50"><path d="M30 25 C14 0 0 6 4 20 C6 30 20 30 30 26Z M30 25 C46 0 60 6 56 20 C54 30 40 30 30 26Z" fill="${c}" ${S} stroke-width="3"/><ellipse cx="30" cy="27" rx="3" ry="12" fill="${INK}"/></svg>`;
function treeSVG(fruit, jack) {
  const fr = jack
    ? [[48, 98], [78, 104], [62, 114]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="13" fill="${fruit}" ${S} stroke-width="3"/>`).join('')
    : [[40, 60], [80, 52], [64, 80], [92, 78], [34, 86]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="9" fill="${fruit}" ${S} stroke-width="2.5"/>`).join('');
  return `<svg viewBox="0 0 130 170"><path d="M65 166 V90" stroke="${INK}" stroke-width="24" stroke-linecap="round"/><path d="M65 166 V90" stroke="#8A5E3B" stroke-width="15" stroke-linecap="round"/><path d="M14 74 C4 30 40 6 65 10 C92 6 128 30 116 74 C112 100 18 104 14 74Z" fill="${fruit === '#FF9EC0' ? '#FFD3E2' : '#5CBF6B'}" ${S}/><path d="M40 40 q10 -8 20 0 M76 34 q10 -8 20 0" fill="none" stroke="#3FA34D" stroke-width="3"/>${fr}</svg>`;
}
const STAND_INS = {
  'plant-bush': `<svg viewBox="0 0 110 80"><path d="M8 76 C-2 40 22 26 36 32 C40 10 74 8 80 30 C96 24 112 44 102 76Z" fill="#7BD389" ${S}/><path d="M30 46 q8 -6 14 0 M66 40 q8 -6 14 0" fill="none" stroke="#3FA34D" stroke-width="3"/></svg>`,
  'plant-tulip': `<svg viewBox="0 0 100 110"><path d="M30 106 Q32 70 30 50 M50 106 Q50 66 50 40 M70 106 Q68 70 70 50" fill="none" stroke="#3FA34D" stroke-width="6"/><path d="M18 100 Q10 70 30 72 Q34 92 18 100Z M82 100 Q90 70 70 72 Q66 92 82 100Z" fill="#7BD389" ${S}/>${[[30, 50], [50, 40], [70, 50]].map(([x, y]) => `<path d="M${x - 12} ${y} Q${x - 13} ${y - 24} ${x - 6} ${y - 28} L${x} ${y - 18} L${x + 6} ${y - 28} Q${x + 13} ${y - 24} ${x + 12} ${y} Q${x} ${y + 10} ${x - 12} ${y}Z" fill="#FF6B9D" ${S}/>`).join('')}</svg>`,
  'plant-daisy': `<svg viewBox="0 0 100 100"><path d="M30 98 Q30 70 32 60 M52 98 Q52 60 52 46 M72 98 Q70 72 70 62" fill="none" stroke="#3FA34D" stroke-width="6"/>${[[32, 58, 14], [52, 44, 16], [70, 60, 13]].map(([x, y, r]) => `<g transform="translate(${x} ${y})">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="${-r * 0.75}" rx="${r * 0.32}" ry="${r * 0.55}" transform="rotate(${a})" fill="#fff" ${S} stroke-width="2.5"/>`).join('')}<circle r="${r * 0.38}" fill="#FFC93C" ${S} stroke-width="3"/></g>`).join('')}</svg>`,
  'plant-rose': `<svg viewBox="0 0 110 90"><path d="M10 86 C0 50 30 20 55 24 C80 20 110 50 100 86Z" fill="#5CBF6B" ${S}/>${[[30, 52], [55, 40], [80, 52], [42, 70], [70, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#FF6B9D" ${S} stroke-width="3"/>`).join('')}</svg>`,
  'plant-marigold': `<svg viewBox="0 0 100 90"><path d="M20 86 Q30 60 50 64 Q70 60 80 86Z" fill="#7BD389" ${S}/>${[[30, 50], [50, 38], [70, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#FF8C42" ${S}/><circle cx="${x}" cy="${y}" r="8" fill="#FFC93C"/>`).join('')}</svg>`,
  'plant-lavender': `<svg viewBox="0 0 90 100"><path d="M20 96 Q45 80 70 96Z" fill="#7BD389" ${S} stroke-width="3"/>${[25, 38, 52, 65].map((x, i) => `<path d="M${x} 94 V${30 + (i % 2) * 10}" stroke="#3FA34D" stroke-width="4"/>${[0, 1, 2, 3].map((k) => `<ellipse cx="${x}" cy="${36 + (i % 2) * 10 + k * 8}" rx="5" ry="4" fill="#9B5DE5" ${S} stroke-width="2"/>`).join('')}`).join('')}</svg>`,
  'plant-shapla': `<svg viewBox="0 0 120 70"><ellipse cx="60" cy="50" rx="56" ry="18" fill="#5BC0EB" ${S}/><ellipse cx="34" cy="50" rx="18" ry="8" fill="#7BD389" ${S} stroke-width="3"/><g transform="translate(60 40)">${[-50, -25, 0, 25, 50].map((a) => `<ellipse cx="0" cy="-12" rx="7" ry="15" transform="rotate(${a})" fill="#fff" ${S} stroke-width="3"/>`).join('')}<circle r="5" fill="#FFC93C"/></g></svg>`,
  'plant-mushrooms': `<svg viewBox="0 0 100 80">${[[28, 46, 16], [58, 36, 22], [82, 54, 12]].map(([x, y, r]) => `<rect x="${x - r * 0.35}" y="${y}" width="${r * 0.7}" height="${78 - y}" rx="5" fill="#FFF8E7" ${S} stroke-width="3"/><path d="M${x - r} ${y + 2} Q${x - r} ${y - r} ${x} ${y - r} Q${x + r} ${y - r} ${x + r} ${y + 2}Z" fill="#FF4D4D" ${S} stroke-width="3"/><circle cx="${x - r * 0.4}" cy="${y - r * 0.45}" r="${r * 0.16}" fill="#fff"/>`).join('')}</svg>`,
  'plant-pot': `<svg viewBox="0 0 90 100"><path d="M24 60 H66 L60 96 H30Z" fill="#E07A4F" ${S}/><rect x="20" y="54" width="50" height="10" rx="3" fill="#E07A4F" ${S} stroke-width="3"/>${[[30, 40, '#FF6B9D'], [45, 30, '#FFC93C'], [60, 40, '#9B5DE5']].map(([x, y, c]) => `<path d="M${x} 56 V${y + 8}" stroke="#3FA34D" stroke-width="4"/><circle cx="${x}" cy="${y}" r="9" fill="${c}" ${S} stroke-width="3"/>`).join('')}</svg>`,
  'plant-jasmine': `<svg viewBox="0 0 100 80"><path d="M10 76 C0 44 26 26 50 30 C74 26 100 44 90 76Z" fill="#5CBF6B" ${S}/>${[[30, 44], [50, 36], [70, 44], [40, 58], [62, 60], [22, 62], [80, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#fff" ${S} stroke-width="2"/>`).join('')}</svg>`,
  'plant-tagar': `<svg viewBox="0 0 100 80"><path d="M10 76 C0 44 26 26 50 30 C74 26 100 44 90 76Z" fill="#3FA34D" ${S}/>${[[32, 46], [56, 38], [74, 52], [44, 62]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="4" cy="-6" rx="4" ry="7" transform="rotate(${a})" fill="#fff" ${S} stroke-width="2"/>`).join('')}</g>`).join('')}</svg>`,
  'tree-young': `<svg viewBox="0 0 90 130"><path d="M45 126 V60" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M45 126 V60" stroke="#8A5E3B" stroke-width="6" stroke-linecap="round"/><circle cx="45" cy="44" r="36" fill="#7BD389" ${S}/></svg>`,
  'tree-blossom': treeSVG('#FF9EC0', false),
  'tree-mango': treeSVG('#FFB43C', false),
  'tree-jackfruit': treeSVG('#9ACD32', true),
  'tree-datepalm': `<svg viewBox="0 0 120 170"><path d="M60 166 C56 120 64 90 58 50" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M60 166 C56 120 64 90 58 50" fill="none" stroke="#B98A5E" stroke-width="9" stroke-linecap="round"/>${[[-60, '#3FA34D'], [-20, '#7BD389'], [20, '#7BD389'], [60, '#3FA34D']].map(([a, c]) => `<path d="M58 50 q${a} -24 ${a * 1.6} 14" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M58 50 q${a} -24 ${a * 1.6} 14" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`).join('')}<circle cx="52" cy="60" r="6" fill="#C0702A" ${S} stroke-width="2.5"/><circle cx="62" cy="62" r="6" fill="#C0702A" ${S} stroke-width="2.5"/></svg>`,
  'item-fence': `<svg viewBox="0 0 160 70"><rect x="0" y="34" width="160" height="8" fill="#fff" ${S} stroke-width="3"/><rect x="0" y="52" width="160" height="8" fill="#fff" ${S} stroke-width="3"/>${[8, 40, 72, 104, 136].map((x) => `<path d="M${x} 68 V14 L${x + 8} 4 L${x + 16} 14 V68Z" fill="#fff" ${S} stroke-width="3"/>`).join('')}</svg>`,
  'item-path': `<svg viewBox="0 0 160 50">${[[30, 34, 22], [80, 24, 20], [130, 32, 21]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.55}" fill="#C9CFCB" ${S} stroke-width="3"/>`).join('')}</svg>`,
  'item-bench': `<svg viewBox="0 0 120 70"><rect x="14" y="40" width="8" height="28" fill="#8A5E3B" ${S} stroke-width="3"/><rect x="98" y="40" width="8" height="28" fill="#8A5E3B" ${S} stroke-width="3"/><rect x="6" y="34" width="108" height="10" rx="3" fill="#C8925A" ${S} stroke-width="3"/><rect x="10" y="8" width="100" height="9" rx="3" fill="#C8925A" ${S} stroke-width="3"/><rect x="10" y="20" width="100" height="9" rx="3" fill="#C8925A" ${S} stroke-width="3"/></svg>`,
  'item-swing': `<svg viewBox="0 0 120 120"><path d="M20 116 L44 6 M100 116 L76 6 M36 8 H84" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M20 116 L44 6 M100 116 L76 6 M36 8 H84" fill="none" stroke="#C8925A" stroke-width="6" stroke-linecap="round"/><path d="M50 10 V80 M70 10 V80" stroke="${INK}" stroke-width="3"/><rect x="42" y="78" width="36" height="9" rx="3" fill="#FF6B9D" ${S} stroke-width="3"/></svg>`,
  'item-lamp': `<svg viewBox="0 0 60 140"><rect x="27" y="40" width="6" height="96" fill="${INK}"/><rect x="18" y="132" width="24" height="6" rx="2" fill="${INK}"/><circle cx="30" cy="28" r="22" fill="#FFE27A" opacity=".45"/><path d="M18 16 H42 L38 40 H22Z" fill="#FFE9A8" ${S} stroke-width="3"/><path d="M14 16 L30 4 L46 16Z" fill="${INK}"/></svg>`,
  'item-wheelbarrow': `<svg viewBox="0 0 120 80"><path d="M10 30 H86 L76 60 H24Z" fill="#C8925A" ${S}/>${[[30, 22, '#FF6B9D'], [50, 18, '#FFC93C'], [70, 22, '#9B5DE5']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}" ${S} stroke-width="3"/>`).join('')}<circle cx="80" cy="66" r="11" fill="#fff" ${S}/><path d="M86 34 L114 22 M28 60 L22 76" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></svg>`,
  'item-signpost': `<svg viewBox="0 0 70 130"><rect x="31" y="20" width="8" height="108" fill="#8A5E3B" ${S} stroke-width="3"/><path d="M6 22 H52 L64 34 L52 46 H6Z" fill="#C8925A" ${S}/></svg>`,
  'water-stream': `<svg viewBox="0 0 170 60"><path d="M4 40 C40 10 70 50 100 28 C130 8 150 30 166 22 L166 40 C150 48 130 26 100 46 C70 66 40 26 4 56Z" fill="#5BC0EB" ${S}/></svg>`,
  'water-bridge': `<svg viewBox="0 0 170 70"><path d="M6 66 Q85 0 164 66" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M6 66 Q85 0 164 66" fill="none" stroke="#C8925A" stroke-width="11" stroke-linecap="round"/></svg>`,
  'water-fountain': `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="86" rx="44" ry="12" fill="#C9CFCB" ${S}/><ellipse cx="50" cy="82" rx="34" ry="7" fill="#5BC0EB"/><rect x="44" y="40" width="12" height="42" fill="#C9CFCB" ${S} stroke-width="3"/><ellipse cx="50" cy="40" rx="20" ry="6" fill="#C9CFCB" ${S} stroke-width="3"/><path d="M50 36 C40 10 30 20 26 36 M50 36 C60 10 70 20 74 36" fill="none" stroke="#5BC0EB" stroke-width="4" stroke-linecap="round"/></svg>`,
  'big-hive-home': `<svg viewBox="0 0 140 140"><rect x="30" y="118" width="80" height="20" rx="6" fill="#B98A5E" ${S}/><path d="M22 120 C10 60 40 18 70 18 C100 18 130 60 118 120Z" fill="#FFC93C" ${S}/>${[50, 70, 90, 108].map((y) => `<path d="M${22 - (y - 120) * 0.12} ${y} Q70 ${y + 8} ${118 + (y - 120) * 0.12} ${y}" fill="none" stroke="#F2A900" stroke-width="5"/>`).join('')}<path d="M58 120 V92 Q70 78 82 92 V120Z" fill="#8A5E3B" ${S} stroke-width="3"/><circle cx="96" cy="70" r="11" fill="#CDEFFC" ${S} stroke-width="3"/><rect x="84" y="12" width="12" height="18" fill="#FF8C42" ${S} stroke-width="3"/></svg>`,
  'big-arch': `<svg viewBox="0 0 110 150"><path d="M14 148 V60 Q55 -10 96 60 V148" fill="none" stroke="${INK}" stroke-width="14"/><path d="M14 148 V60 Q55 -10 96 60 V148" fill="none" stroke="#fff" stroke-width="8"/>${[[14, 120], [14, 90], [18, 62], [34, 34], [55, 24], [76, 34], [92, 62], [96, 90], [96, 120]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="8" fill="${i % 2 ? '#FF6B9D' : '#fff'}" ${S} stroke-width="2.5"/>`).join('')}</svg>`,
  'big-gazebo': `<svg viewBox="0 0 140 130"><path d="M10 50 L70 10 L130 50Z" fill="#FFC93C" ${S}/><rect x="20" y="50" width="100" height="10" fill="#fff" ${S} stroke-width="3"/>${[26, 58, 82, 112].map((x) => `<rect x="${x}" y="60" width="8" height="64" fill="#fff" ${S} stroke-width="3"/>`).join('')}<rect x="14" y="120" width="112" height="8" rx="2" fill="#C9CFCB" ${S} stroke-width="3"/></svg>`,
  'big-treehouse': `<svg viewBox="0 0 130 170"><path d="M65 166 V70" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M65 166 V70" stroke="#8A5E3B" stroke-width="14" stroke-linecap="round"/><circle cx="65" cy="52" r="48" fill="#7BD389" ${S}/><rect x="36" y="58" width="58" height="40" rx="4" fill="#C8925A" ${S}/><path d="M30 60 L65 34 L100 60Z" fill="#FF6B9D" ${S}/><circle cx="65" cy="76" r="8" fill="#CDEFFC" ${S} stroke-width="3"/></svg>`,
  'treasure-boat': `<svg viewBox="0 0 140 60"><path d="M6 20 H134 L116 54 H24Z" fill="#FF8C42" ${S}/><path d="M12 28 H128" stroke="#fff" stroke-width="5"/></svg>`,
  'treasure-flag': `<svg viewBox="0 0 100 150"><rect x="14" y="6" width="7" height="140" rx="3" fill="#B98A5E" ${S} stroke-width="3"/><path d="M21 12 Q50 4 92 14 V64 Q50 56 21 66Z" fill="#006A4E" ${S}/><circle cx="50" cy="38" r="14" fill="#F42A41"/></svg>`,
  'visitor-frog': `<svg viewBox="0 0 90 60"><ellipse cx="45" cy="44" rx="40" ry="14" fill="#B8C2BC" ${S}/><circle cx="45" cy="26" r="16" fill="#7BD389" ${S}/><circle cx="37" cy="14" r="6" fill="#fff" ${S} stroke-width="2.5"/><circle cx="53" cy="14" r="6" fill="#fff" ${S} stroke-width="2.5"/><circle cx="37" cy="14" r="2.5" fill="${INK}"/><circle cx="53" cy="14" r="2.5" fill="${INK}"/><path d="M38 30 q7 5 14 0" fill="none" stroke="${INK}" stroke-width="2.5"/></svg>`,
  'visitor-butterfly-pink': BFLY('#FF9EC0'),
  'visitor-butterfly-blue': BFLY('#9AD8F5'),
};
// Simple picture stand-ins for treasures that don't have a drawing yet.
const EMOJI = {
  'treasure-bowl': '🪺', 'treasure-milk': '🥛', 'treasure-sandpit': '🏖️', 'treasure-picnic': '🧺', 'treasure-rockery': '⛰️',
  'treasure-sprinkler': '💦', 'treasure-scooter': '🛴', 'treasure-cottage': '🛖', 'treasure-giraffe': '🦒', 'treasure-gift': '🎁',
  'treasure-cat': '🐈', 'treasure-chest': '🧰', 'treasure-tallgrass': '🌾', 'treasure-raccoon': '🦝', 'treasure-boulder': '🪨',
  'treasure-balloons': '🎈', 'treasure-dancers': '🦋', 'treasure-ribbon': '🏅', 'treasure-school': '🏫', 'treasure-custardapple': '🌳',
  'treasure-cow': '🐄', 'treasure-flute': '🎶', 'treasure-paddy': '🌾', 'treasure-elephant': '🐘', 'treasure-fish': '🐟',
  'treasure-plough': '🪓', 'treasure-datepot': '🏺', 'treasure-boots': '🥾', 'treasure-sundial': '🕰️', 'treasure-penpot': '🖊️',
  'treasure-family': '🐝', 'visitor-doyel': '🐦', 'visitor-duck': '🦆', 'visitor-rabbit': '🐇', 'visitor-snail': '🐌', 'visitor-ladybug': '🐞',
};
const LEGACY_DECOR = { 'decor-ladybug': 'ladybug', 'decor-butterfly': 'butterfly', 'decor-rainbow': 'rainbow', 'item-wateringcan': 'wateringcan', 'item-birdhouse': 'birdhouse', 'water-pond': 'pond' };

/** The picture for an item: the illustration if it exists, otherwise a drawn stand-in. */
export function itemArt(id) {
  const def = ITEMS[id] || {};
  const name = def.art || id;
  if (hasArt(name)) return `<img src="${artUrl(name)}" alt="" draggable="false">`;
  if (STAND_INS[id]) return STAND_INS[id];
  if (LEGACY_DECOR[id]) return decorSVG(LEGACY_DECOR[id]);
  return `<span class="emoji-art" data-e="${EMOJI[id] || '🌼'}" aria-hidden="true"></span>`;
}

export const itemName = (id, lang) => ITEMS[id]?.n?.[lang] || ITEMS[id]?.n?.en || id;
