// Honey Pot: the honey jar, today's goal and the Honey Shop.
import { activeProfile, updateProfile, honeyEarned, honeyBalance, honeyToday, owns, buyItem, wearHat, wornHat, settings } from '../store.js';
import { t, tn, num } from '../i18n.js';
import { icon } from '../icons.js';
import { topbar, toast, confirmDialog } from '../ui.js';
import { mascotHTML, avatarHTML, setWornHat, AVATARS } from '../art.js';
import { SHOP, JAR_SIZE, jarSVG, jarProgress, hatSVG, decorSVG } from '../honey.js';
import { sfx } from '../sfx.js';
import { confetti } from '../fx.js';

const priceChip = (price) => `<span class="price">${icon('honey')}${num(price)}</span>`;

function itemCard(kind, item) {
  const me = activeProfile();
  const have = item.price === 0 || owns(kind, item.id);
  const name = item.price === 0 && kind === 'colours' ? t(`avatar.${item.id}`) : t(`shop.${kind}.${item.id}`);
  const afford = honeyBalance() >= item.price;
  let preview = '';
  if (kind === 'hats') preview = mascotHTML('face', { hat: item.id });
  else if (kind === 'colours') preview = avatarHTML(item.id);
  else preview = decorSVG(item.id);

  let action;
  if (!have) {
    action = `<button class="btn btn-small ${afford ? 'btn-honey' : 'btn-cream'}" type="button" data-buy="${kind}:${item.id}" ${afford ? '' : 'disabled'}>${priceChip(item.price)}<span>${afford ? t('honey.buy') : t('honey.needMore', { n: item.price - honeyBalance() })}</span></button>`;
  } else if (kind === 'hats') {
    const on = wornHat() === item.id;
    action = `<button class="btn btn-small ${on ? 'btn-leaf' : 'btn-cream'}" type="button" data-wear="${item.id}">${on ? `${icon('check')}<span>${t('honey.wearing')}</span>` : `<span>${t('honey.wear')}</span>`}</button>`;
  } else if (kind === 'colours') {
    const on = me?.avatar === item.id;
    action = `<button class="btn btn-small ${on ? 'btn-leaf' : 'btn-cream'}" type="button" data-colour="${item.id}">${on ? `${icon('check')}<span>${t('honey.using')}</span>` : `<span>${t('honey.use')}</span>`}</button>`;
  } else {
    action = `<span class="chip chip-leaf">${icon('flower')}${t('honey.inGarden')}</span>`;
  }
  return `<article class="shop-item ${have ? 'is-owned' : ''}">
    <div class="shop-preview shop-${kind}">${preview}</div>
    <h3>${name}</h3>
    ${action}
  </article>`;
}

export default {
  title: () => t('honey.title'),

  render() {
    const earned = honeyEarned();
    const jar = jarProgress(earned);
    const goal = settings().dailyGoal || 20;
    const today = honeyToday();
    const done = today >= goal;
    const fullJars = Array.from({ length: Math.min(jar.full, 12) }, () => `<span class="mini-jar">${jarSVG(1, { full: true })}</span>`).join('');

    const shopSection = (kind) => `<section class="shop-group">
      <h3 class="shop-title">${t(`honey.shop.${kind}`)}</h3>
      <div class="shop-grid">${(kind === 'colours' ? [...Object.keys(AVATARS).map((id) => ({ id, price: 0 })), ...SHOP.colours] : SHOP[kind]).map((item) => itemCard(kind, item)).join('')}</div>
    </section>`;

    return `<div class="page honey-page">
      ${topbar({ title: t('honey.title'), back: 'home' })}
      <section class="card honey-hero">
        <div class="jar-big">${jarSVG(jar.level)}</div>
        <div class="honey-hero-text">
          <h2>${tn('honey.balance', honeyBalance())}</h2>
          <p class="lead">${t('honey.explain')}</p>
          <p class="sub">${t('honey.jarLine', { n: jar.inJar, size: JAR_SIZE })}</p>
          ${jar.full ? `<div class="full-jars" aria-label="${tn('honey.jarsFull', jar.full)}">${fullJars}${jar.full > 12 ? `<span class="sub">+${num(jar.full - 12)}</span>` : ''}<span class="sub">${tn('honey.jarsFull', jar.full)}</span></div>` : ''}
        </div>
      </section>

      <section class="card goal-card ${done ? 'is-done' : ''}">
        <h2>${icon('star')} ${t('honey.goalTitle')}</h2>
        <div class="goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(today, goal)}"><span style="--p:${Math.min(1, today / goal)}"></span></div>
        <p class="lead">${done ? t('honey.goalDone') : t('honey.goalLine', { n: today, goal })}</p>
      </section>

      <section class="card shop-card">
        <div class="shop-head">
          <h2>${icon('honey')} ${t('honey.shopTitle')}</h2>
          <span class="chip chip-honey">${icon('honey')}${tn('honey.toSpend', honeyBalance())}</span>
        </div>
        ${shopSection('hats')}
        ${shopSection('colours')}
        ${shopSection('decor')}
      </section>
    </div>`;
  },

  mount(root, { rerender }) {
    const onClick = async (e) => {
      const buy = e.target.closest('[data-buy]');
      const wear = e.target.closest('[data-wear]');
      const colour = e.target.closest('[data-colour]');
      if (buy) {
        const [kind, id] = buy.dataset.buy.split(':');
        const item = SHOP[kind].find((x) => x.id === id);
        const name = t(`shop.${kind}.${id}`);
        const yes = await confirmDialog({
          title: t('honey.buyTitle', { name }), message: tn('honey.buyMessage', item.price),
          yes: t('honey.buy'), no: t('honey.notNow'), yesTone: 'honey', noTone: 'cream', pose: 'think',
        });
        if (!yes || !buyItem(kind, id, item.price)) return;
        if (kind === 'hats') { wearHat(id); setWornHat(id); }
        if (kind === 'colours') updateProfile(activeProfile().id, { avatar: id });
        sfx.chime();
        confetti(40);
        toast(t(`honey.bought.${kind}`, { name }));
        rerender();
      } else if (wear) {
        const id = wornHat() === wear.dataset.wear ? null : wear.dataset.wear;
        wearHat(id);
        setWornHat(id);
        sfx.pop(2);
        rerender();
      } else if (colour) {
        updateProfile(activeProfile().id, { avatar: colour.dataset.colour });
        sfx.pop(2);
        rerender();
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
