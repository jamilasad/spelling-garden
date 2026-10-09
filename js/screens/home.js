// The home garden: greeting, today's practice, the three word lists and the rest of the garden.
import { data, wordsOfList } from '../data.js';
import { activeProfile, progress, settings, honeyBalance, honeyToday, honeyEarned } from '../store.js';
import { jarSVG, jarProgress } from '../honey.js';
import { t, tn, pick, escapeHtml, num, getLang } from '../i18n.js';
import { mascotHTML, avatarHTML, flowerHTML } from '../art.js';
import { icon } from '../icons.js';
import { go, toast, holdButton } from '../ui.js';
import { isMastered, isSeen, isTricky, isDue, dayString, daysBetween } from '../scheduler.js';

const LANG_COLOR = { en: 'var(--sky)', bn: 'var(--leaf-deep)', ar: 'var(--lavender)' };
const LOGO_COLORS = ['#FFC93C', '#FF6B9D', '#5BC0EB', '#7BD389', '#9B5DE5', '#FF8C42'];

/** The app name as sticker letters. English gets a colour per letter; Bangla and Arabic a colour
 *  per word, because splitting their letters into pieces would break how they join. */
function logoHTML(name, lang) {
  if (lang !== 'en') {
    return name.split(' ').map((w, i) => `<span style="color:${LOGO_COLORS[(i * 2) % 6]}">${escapeHtml(w)}</span>`).join(' ');
  }
  const tilt = [-6, 4, -3, 5, -4, 3];
  const lift = [0, -3, 2, -2, 3, -1];
  let k = 0;
  return [...name].map((ch) => {
    if (ch === ' ') return ' ';
    const i = k++;
    return `<span class="l" style="color:${LOGO_COLORS[i % 6]};transform:rotate(${tilt[i % 6]}deg) translateY(${lift[i % 6]}px)">${escapeHtml(ch)}</span>`;
  }).join('');
}

function counts() {
  const recs = progress().words;
  const day = dayString();
  const all = data.words;
  return {
    due: all.filter((w) => isDue(recs[w.id], day)).length,
    fresh: all.filter((w) => !isSeen(recs[w.id])).length,
    tricky: all.filter((w) => isTricky(recs[w.id])).length,
  };
}

function contestChip() {
  const date = settings().contestDate;
  if (!date) return '';
  const left = daysBetween(dayString(), date);
  if (left < 0) return '';
  const text = left === 0 ? t('home.contestToday') : tn('home.contestIn', left);
  return `<span class="chip chip-berry">${icon('calendar')}${text}</span>`;
}

export default {
  render() {
    const me = activeProfile();
    const p = progress();
    const c = counts();
    const streak = p.streak?.last && daysBetween(p.streak.last, dayString()) <= 1 ? p.streak.count : 0;

    const listCards = data.lists.map((l) => {
      const words = wordsOfList(l.id);
      const mastered = words.filter((w) => isMastered(p.words[w.id])).length;
      const practised = words.filter((w) => isSeen(p.words[w.id])).length;
      const pct = words.length ? Math.round((mastered / words.length) * 100) : 0;
      return `<button class="tap-card list-card" data-list="${l.id}" type="button">
        <span class="ring" style="--p:${pct};--c:${LANG_COLOR[l.lang] || 'var(--honey)'}"><span>${num(pct)}%</span></span>
        <span class="list-text">
          <span class="label">${escapeHtml(pick(l.title))}</span>
          <span class="sub">${t('home.listProgress', { mastered, total: words.length })} · ${t('home.listPractised', { practised })}</span>
        </span>
        <span class="lang-tag" data-lang="${l.lang}">${t(`langShort.${l.lang}`)}</span>
      </button>`;
    }).join('');

    return `<div class="page home-page">
      <header class="topbar home-topbar">
        <a class="avatar-btn" href="#/profiles" aria-label="${t('home.switchPlayer')}">${avatarHTML(me.avatar)}</a>
        <p class="title app-name logo" aria-label="${escapeHtml(pick(data.config.appName))}">${logoHTML(pick(data.config.appName), getLang())}</p>
        <a class="icon-btn" href="#/settings" aria-label="${t('settings.title')}">${icon('settings')}</a>
        <button class="icon-btn parent-btn" type="button" aria-label="${t('home.parentHold')}">${icon('lock')}</button>
      </header>

      <section class="card hero">
        <div class="hero-mascot">${mascotHTML('wave', { avatar: me.avatar })}</div>
        <div class="hero-text">
          <h1>${t('home.hello', { name: `<bdi>${escapeHtml(me.name)}</bdi>` })}</h1>
          <p class="lead">${t('home.lead')}</p>
        </div>
        <div class="chips hero-chips">
          ${streak ? `<span class="chip chip-honey">${icon('flame')}${tn('home.streak', streak)}</span>` : ''}
          <a class="chip chip-honey honey-chip-link" href="#/honey"><span class="chip-jar">${jarSVG(jarProgress(honeyEarned()).level)}</span>${tn('home.honey', honeyBalance())}</a>
          <a class="chip chip-leaf goal-chip ${honeyToday() >= (settings().dailyGoal || 20) ? 'is-done' : ''}" href="#/honey" style="--p:${Math.min(1, honeyToday() / (settings().dailyGoal || 20))}">${icon('star')}${t('home.goalChip', { n: honeyToday(), goal: settings().dailyGoal || 20 })}</a>
          ${contestChip()}
        </div>
        <div class="hero-flower sway-flower">${flowerHTML(4)}</div>
      </section>

      <div class="cta-row">
        <button class="btn btn-leaf btn-big today-btn" data-go="setup?mode=learn" type="button">
          ${icon('sprout')}<span><span class="today-title">${t('home.learn')}</span>
          <span class="today-sub">${t('home.learnSub')}</span></span>
        </button>
        <button class="btn btn-honey btn-big today-btn" data-go="bee?mode=today" type="button">
          ${icon('play')}<span><span class="today-title">${t('home.today')}</span>
          <span class="today-sub">${c.due ? tn('home.todayDue', c.due) : c.fresh ? tn('home.todayNew', Math.min(c.fresh, 15)) : t('home.todayReview')}</span></span>
        </button>
      </div>

      <section class="home-section">
        <h2>${t('home.lists')}</h2>
        <div class="list-cards">${listCards}</div>
      </section>

      <section class="home-section more-grid">
        <button class="tap-card" data-go="words" type="button">
          <span class="art art-icon art-sky">${icon('list')}</span>
          <span><span class="label">${t('words.title')}</span><span class="sub">${t('home.wordListSub', { n: data.words.length })}</span></span>
        </button>
        <button class="tap-card" data-go="setup?mode=missing" type="button">
          <span class="art art-icon art-lavender">${icon('puzzle')}</span>
          <span><span class="label">${t('missing.title')}</span><span class="sub">${t('home.missingSub')}</span></span>
        </button>
        <button class="tap-card" data-go="hive" type="button">
          <span class="art art-icon art-honey">${icon('hive')}</span>
          <span><span class="label">${t('hive.title')}</span><span class="sub">${c.tricky ? tn('home.trickyCount', c.tricky) : t('home.trickyNone')}</span></span>
        </button>
        <button class="tap-card" data-go="setup?mode=mock" type="button">
          <span class="art art-icon art-berry">${icon('mock')}</span>
          <span><span class="label">${t('mock.title')}</span><span class="sub">${t('home.mockSub')}</span></span>
        </button>
        <button class="tap-card" data-go="garden" type="button">
          <span class="art art-icon art-leaf">${icon('flower')}</span>
          <span><span class="label">${t('garden.title')}</span><span class="sub">${t('home.gardenSub')}</span></span>
        </button>
      </section>
    </div>`;
  },

  mount(root) {
    const onClick = (e) => {
      const target = e.target.closest('[data-go], [data-list]');
      if (!target) return;
      if (target.dataset.list) return go('setup', { list: target.dataset.list });
      location.hash = `#/${target.dataset.go}`;
    };
    root.addEventListener('click', onClick);
    const parentBtn = root.querySelector('.parent-btn');
    const stopHold = holdButton(parentBtn, 1200, () => go('parent'), () => toast(t('home.parentHint')), { meter: t('home.holdMeter') });
    return () => {
      root.removeEventListener('click', onClick);
      stopHold();
    };
  },
};
