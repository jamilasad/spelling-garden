// My word list — every word with its meaning and tricky part, all together or one language at a time.
import { data } from '../data.js';
import { progress } from '../store.js';
import { t, tn, escapeHtml, dirOf, pick, num } from '../i18n.js';
import { icon } from '../icons.js';
import { topbar } from '../ui.js';
import { sayWord } from '../audio.js';
import { markedWordHTML } from '../reveal.js';
import { isMastered, isTricky } from '../scheduler.js';

const TABS = ['all', 'en', 'bn', 'ar'];
const NATIVE = { en: 'English', bn: 'বাংলা', ar: 'العربية' };

function statusChip(rec, learned) {
  if (isMastered(rec)) return `<span class="chip chip-leaf wr-status">${icon('flower')}${t('words.stBlooming')}</span>`;
  if (isTricky(rec)) return `<span class="chip chip-berry wr-status">${icon('hive')}${t('words.stTricky')}</span>`;
  if (learned) return `<span class="chip chip-sky wr-status">${icon('check')}${t('words.stLearned')}</span>`;
  return '';
}

function meaningLine(w) {
  // English and Bangla meanings side by side help a Bangla-speaking child most.
  return ['en', 'bn'].filter((l) => w.meaning?.[l]).map((l) =>
    `<span lang="${l}">${escapeHtml(w.meaning[l])}</span>`).join('<span class="sep" aria-hidden="true"> · </span>');
}

export default {
  title: () => t('words.title'),

  render({ params }) {
    const tab = TABS.includes(params.lang) ? params.lang : 'all';
    const p = progress();
    const learned = p.learned || {};
    const lists = data.lists.filter((l) => tab === 'all' || l.lang === tab);
    const shownCount = data.words.filter((w) => tab === 'all' || w.lang === tab).length;

    const tabs = TABS.filter((x) => x === 'all' || data.lists.some((l) => l.lang === x)).map((x) =>
      `<a class="tab ${x === tab ? 'is-on' : ''}" href="#/words?lang=${x}" ${x === tab ? 'aria-current="page"' : ''} ${x !== 'all' ? `lang="${x}"` : ''}>${x === 'all' ? t('words.all') : NATIVE[x]}</a>`).join('');

    const sections = lists.map((l) => {
      const ws = data.words.filter((w) => w.listId === l.id);
      const rows = ws.map((w) => `<li class="word-row">
          <span class="wr-n">${num(w.n)}</span>
          <button class="icon-btn wr-play no-print" type="button" data-say="${w.id}" aria-label="${t('common.listen')}">${icon('play')}</button>
          <a class="wr-main" href="#/learn?ids=${w.id}">
            <span class="wr-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${markedWordHTML(w)}</span>
            <span class="wr-meaning">${meaningLine(w)}</span>
          </a>
          ${statusChip(p.words[w.id], learned[w.id])}
        </li>`).join('');
      return `<section class="card word-section">
        <div class="ws-head">
          <h2><span class="lang-tag" data-lang="${l.lang}">${t(`langShort.${l.lang}`)}</span> ${escapeHtml(pick(l.title))}
            <span class="ws-count">${tn('words.count', ws.length)}</span></h2>
          <div class="ws-actions no-print">
            <a class="btn btn-leaf btn-small" href="#/learn?list=${l.id}">${icon('sprout')}<span>${t('words.learnThese')}</span></a>
            <button class="btn btn-cream btn-small" type="button" data-print>${icon('print')}<span>${t('words.print')}</span></button>
          </div>
        </div>
        <ol class="word-rows">${rows}</ol>
      </section>`;
    }).join('');

    return `<div class="page words-page">
      ${topbar({ title: t('words.title'), back: 'home' })}
      <nav class="tabs no-print" aria-label="${t('words.title')}">${tabs}</nav>
      <p class="garden-key no-print">${t('words.intro', { n: shownCount })}</p>
      ${sections}
    </div>`;
  },

  mount(root) {
    const onClick = (e) => {
      const say = e.target.closest('[data-say]');
      if (say) return sayWord(data.byId.get(say.dataset.say));
      if (e.target.closest('[data-print]')) window.print();
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
