// Achievement badges and the rules for earning them.
import { isMastered } from './scheduler.js';

export const BADGES = [
  { id: 'first-bloom', icon: 'sprout', color: '#7BD389' },
  { id: 'ten-right', icon: 'flower', color: '#FFC93C' },
  { id: 'perfect', icon: 'star', color: '#FFD45C' },
  { id: 'streak-3', icon: 'flame', color: '#FF8C42' },
  { id: 'streak-7', icon: 'flame', color: '#FF6B9D' },
  { id: 'hive-hero', icon: 'hive', color: '#FFC93C' },
  { id: 'english', icon: 'meaning', color: '#5BC0EB', lang: 'en' },
  { id: 'bangla', icon: 'flower', color: '#3FA34D', lang: 'bn' },
  { id: 'arabic', icon: 'sprout', color: '#9B5DE5', lang: 'ar' },
  { id: 'all-three', icon: 'globe', color: '#FF6B9D' },
  { id: 'champion', icon: 'trophy', color: '#F2A900' },
];

/** Every badge whose rule is met right now (already-awarded ones included). */
export function qualifyingBadges(progress, words, session) {
  const recs = progress.words;
  const rec = (w) => recs[w.id];
  const totalCorrect = Object.values(recs).reduce((n, r) => n + (r.correct || 0), 0);
  const out = new Set();

  if (totalCorrect >= 1) out.add('first-bloom');
  if (totalCorrect >= 10) out.add('ten-right');
  if (session && session.total >= 5 && session.firstTry === session.total) out.add('perfect');
  if ((progress.streak?.count || 0) >= 3) out.add('streak-3');
  if ((progress.streak?.count || 0) >= 7) out.add('streak-7');
  if (Object.values(recs).filter((r) => r.misses > 0 && r.box >= 3).length >= 3) out.add('hive-hero');

  const langs = [...new Set(words.map((w) => w.lang))];
  const langDone = (lang) => {
    const ws = words.filter((w) => w.lang === lang);
    return ws.length > 0 && ws.every((w) => (rec(w)?.correct || 0) >= 1);
  };
  for (const b of BADGES) if (b.lang && langDone(b.lang)) out.add(b.id);
  if (langs.length >= 2 && langs.every(langDone)) out.add('all-three');
  if (words.length && words.every((w) => isMastered(rec(w)))) out.add('champion');
  return out;
}
