// My Garden — one plant per word, growing from soil to full bloom, plus the badge shelf.
import { data } from '../data.js';
import { progress } from '../store.js';
import { t, escapeHtml, dirOf, pick, num } from '../i18n.js';
import { plantHTML, badgeHTML } from '../art.js';
import { icon } from '../icons.js';
import { topbar } from '../ui.js';
import { sayWord } from '../audio.js';
import { BADGES } from '../badges.js';

// Box → plant stage: unseen = soil, box 1 = sprout, 2 = bud, 3 = opening, 4–5 = bloom.
const stageOf = (rec) => (!rec || !rec.attempts ? 0 : Math.min(4, rec.box));

export default {
  title: () => t('garden.title'),

  render() {
    const p = progress();
    const badges = BADGES.map((b) => {
      const earned = Boolean(p.badges[b.id]);
      return `<div class="badge-item ${earned ? '' : 'badge-locked'}" title="${t(`badgeHow.${b.id}`)}">
        <div class="badge-pic">${badgeHTML(b, icon(b.icon, { size: 24 }))}</div>
        <span>${t(`badge.${b.id}`)}</span>
      </div>`;
    }).join('');
    const earnedCount = BADGES.filter((b) => p.badges[b.id]).length;

    const beds = data.lists.map((l) => {
      const ws = data.words.filter((w) => w.listId === l.id);
      const blooming = ws.filter((w) => stageOf(p.words[w.id]) >= 4).length;
      return `<section class="card garden-bed">
        <div class="bed-head">
          <h2><span class="lang-tag" data-lang="${l.lang}">${t(`langShort.${l.lang}`)}</span> ${escapeHtml(pick(l.title))}</h2>
          <span class="chip chip-leaf">${icon('flower')}${t('garden.blooming', { n: num(blooming), total: num(ws.length) })}</span>
        </div>
        <div class="plants">${ws.map((w) => `<button class="plant" type="button" data-say="${w.id}" aria-label="${escapeHtml(w.word)}">
            <span class="plant-art">${plantHTML(stageOf(p.words[w.id]), l.lang)}</span>
            <span class="plant-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</span>
          </button>`).join('')}</div>
      </section>`;
    }).join('');

    return `<div class="page garden-page">
      ${topbar({ title: t('garden.title'), back: 'home' })}
      <section class="card badge-shelf">
        <h2>${icon('trophy')} ${t('garden.badges', { n: num(earnedCount), total: num(BADGES.length) })}</h2>
        <div class="badge-row">${badges}</div>
      </section>
      <p class="garden-key">${t('garden.key')}</p>
      ${beds}
    </div>`;
  },

  mount(root) {
    const onClick = (e) => {
      const say = e.target.closest('[data-say]');
      if (say) sayWord(data.byId.get(say.dataset.say));
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
