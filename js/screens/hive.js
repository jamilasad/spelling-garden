// Tricky Words Hive — words she has missed, until they bloom.
import { data } from '../data.js';
import { progress } from '../store.js';
import { t, tn, escapeHtml, dirOf, pick, num } from '../i18n.js';
import { mascotHTML } from '../art.js';
import { icon } from '../icons.js';
import { topbar, go } from '../ui.js';
import { sayWord } from '../audio.js';
import { isTricky, isDue, dayString, MAX_BOX } from '../scheduler.js';

const boxDots = (box) =>
  `<span class="box-dots" aria-label="${t('hive.level', { n: box, max: MAX_BOX })}">${Array.from({ length: MAX_BOX }, (_, k) => `<span class="${k < box ? 'on' : ''}"></span>`).join('')}</span>`;

export default {
  title: () => t('hive.title'),

  render() {
    const recs = progress().words;
    const day = dayString();
    const tricky = data.words.filter((w) => isTricky(recs[w.id]));
    const due = tricky.filter((w) => isDue(recs[w.id], day)).length;

    const groups = data.lists.map((l) => {
      const ws = tricky.filter((w) => w.listId === l.id);
      if (!ws.length) return '';
      return `<section class="card hive-group">
        <h2><span class="lang-tag" data-lang="${l.lang}">${t(`langShort.${l.lang}`)}</span> ${escapeHtml(pick(l.title))}</h2>
        <ul class="hive-list">${ws.map((w) => `<li>
          <button class="icon-btn" type="button" data-say="${w.id}" aria-label="${t('common.listen')}">${icon('play')}</button>
          <span class="hive-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</span>
          ${boxDots(recs[w.id].box)}
          <span class="hive-misses">${tn('hive.missed', recs[w.id].misses)}</span>
        </li>`).join('')}</ul>
      </section>`;
    }).join('');

    return `<div class="page hive-page">
      ${topbar({ title: t('hive.title'), back: 'home' })}
      <section class="card hive-intro">
        <div class="hive-mascot">${mascotHTML(tricky.length ? 'think' : 'cheer')}</div>
        <div>
          <p class="lead">${tricky.length ? t('hive.intro') : t('hive.empty')}</p>
          ${tricky.length ? `<p class="sub">${tn('hive.count', tricky.length)}${due ? ` · ${tn('hive.due', due)}` : ''}</p>` : ''}
        </div>
      </section>
      ${tricky.length
        ? `<button class="btn btn-honey btn-big" type="button" data-act="practise">${icon('play')}<span>${t('hive.practise', { n: num(Math.min(tricky.length, 15)) })}</span></button>${groups}`
        : `<a class="btn btn-honey btn-big" href="#/bee?mode=today">${icon('play')}<span>${t('home.today')}</span></a>`}
    </div>`;
  },

  mount(root) {
    const onClick = (e) => {
      const say = e.target.closest('[data-say]');
      if (say) return sayWord(data.byId.get(say.dataset.say));
      if (e.target.closest('[data-act="practise"]')) go('bee', { mode: 'hive' });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
