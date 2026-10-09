// My Garden — her own garden to build with honey and learned words, plus word flowers and badges.
//   Builder: buy items (honey + enough blooming words), drag them anywhere, tap for Smaller / Bigger,
//   Flip or To bag. Word treasures arrive free when a word starts blooming; a full practice session
//   earns a mystery seed that grows into a surprise flower the next day.
import { data } from '../data.js';
import {
  progress, gardenState, catchUpTreasures, pendingTreasures, pendingSeeds, claimTreasures, claimSeed, updateItem,
  itemToBag, placeFromBag, buyGardenItem, ownedCount, setGardenGoal, growSeeds, honeyBalance,
} from '../store.js';
import { t, tn, escapeHtml, dirOf, pick, num, getLang } from '../i18n.js';
import { plantHTML, badgeHTML, hasArt, artUrl, hillsHTML, beeFlyerHTML } from '../art.js';
import { icon } from '../icons.js';
import { topbar, toast, confirmDialog } from '../ui.js';
import { sayWord } from '../audio.js';
import { sfx } from '../sfx.js';
import { confetti } from '../fx.js';
import { BADGES } from '../badges.js';
import { isMastered, dayString } from '../scheduler.js';
import {
  ITEMS, CATEGORIES, SIZES, DEFAULT_SIZE, UNLOCK_MORE_GARDEN, MYSTERY_FLOWERS, itemArt, itemName, treasureFor,
} from '../garden-items.js';

const VIEWS = ['build', 'words', 'badges'];
const LAWN_TOP = 28;          // % of the garden's height where the grass starts
const LOCKED_FROM = 75;       // % of the width that stays locked until more words bloom
const CONFIRM_FROM = 30;      // ask "are you sure?" for items costing this much or more

// Box → plant stage for the word flowers: unseen = soil, box 1 = sprout, 2 = bud, 3 = opening, 4–5 = bloom.
const stageOf = (rec) => (!rec || !rec.attempts ? 0 : Math.min(4, rec.box));
const bloomingCount = () => data.words.filter((w) => isMastered(progress().words[w.id])).length;
const name = (k) => itemName(k, getLang());
const randomFlower = () => MYSTERY_FLOWERS[Math.floor(Math.random() * MYSTERY_FLOWERS.length)];

function wordsView() {
  const p = progress();
  return data.lists.map((l) => {
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
  }).join('') + `<p class="garden-key">${t('garden.key')}</p>`;
}

function badgesView() {
  const p = progress();
  const badges = BADGES.map((b) => `<div class="badge-item ${p.badges[b.id] ? '' : 'badge-locked'}" title="${t(`badgeHow.${b.id}`)}">
      <div class="badge-pic">${badgeHTML(b, icon(b.icon, { size: 24 }))}</div>
      <span>${t(`badge.${b.id}`)}</span>
    </div>`).join('');
  const earned = BADGES.filter((b) => p.badges[b.id]).length;
  return `<section class="card badge-shelf">
    <h2>${icon('trophy')} ${t('garden.badges', { n: num(earned), total: num(BADGES.length) })}</h2>
    <div class="badge-row">${badges}</div>
  </section>`;
}

function buildView() {
  const blooming = bloomingCount();
  const open = blooming >= UNLOCK_MORE_GARDEN;
  const lawn = hasArt('garden-lawn')
    ? `<div class="gb-lawn-art" style="background-image:url('${artUrl('garden-lawn')}')"></div>`
    : '<div class="gb-lawn-art gb-lawn-plain"></div>';
  return `<div class="gb-head">
      <span class="chip chip-honey">${icon('honey')}<span class="gb-honey">${num(honeyBalance())}</span></span>
      <span class="chip chip-leaf">${icon('flower')}${tn('garden.bloomingWords', blooming)}</span>
      <button class="chip gb-goal" type="button"></button>
    </div>
    <div class="gb-garden">
      <div class="gb-sun"></div>
      <div class="gb-hills">${hillsHTML('far')}</div>
      ${lawn}
      <div class="gb-visitors" aria-hidden="true"></div>
      <div class="gb-items"></div>
      ${open ? '' : `<div class="gb-locked" style="left:${LOCKED_FROM}%"><div>
        ${icon('lock')}<p>${t('garden.moreOpens', { n: UNLOCK_MORE_GARDEN })}</p>
        <span class="gb-bar"><i style="width:${Math.round((blooming / UNLOCK_MORE_GARDEN) * 100)}%"></i></span>
        <small>${t('garden.ofWords', { n: blooming, total: UNLOCK_MORE_GARDEN })}</small></div></div>`}
      <p class="gb-empty" hidden>${t('garden.emptyHint')}</p>
    </div>
    <section class="card gb-shelf">
      <div class="tabs gb-tabs"></div>
      <div class="gb-cards"></div>
    </section>`;
}

export default {
  title: () => t('garden.title'),

  render({ params }) {
    const view = VIEWS.includes(params.view) ? params.view : 'build';
    const tabs = VIEWS.map((v) => `<a class="tab ${v === view ? 'is-on' : ''}" href="#/garden?view=${v}" ${v === view ? 'aria-current="page"' : ''}>${t(`garden.view.${v}`)}</a>`).join('');
    const body = view === 'words' ? wordsView() : view === 'badges' ? badgesView() : buildView();
    return `<div class="page garden-page view-${view}">
      ${topbar({ title: t('garden.title'), back: 'home' })}
      <nav class="tabs">${tabs}</nav>
      ${body}
    </div>`;
  },

  mount(root, { params }) {
    const onSay = (e) => {
      const say = e.target.closest('[data-say]');
      if (say) sayWord(data.byId.get(say.dataset.say));
    };
    root.addEventListener('click', onSay);
    const view = VIEWS.includes(params.view) ? params.view : 'build';
    if (view !== 'build') return () => root.removeEventListener('click', onSay);

    const $ = (s) => root.querySelector(s);
    const gardenEl = $('.gb-garden');
    const itemsEl = $('.gb-items');
    const visitorsEl = $('.gb-visitors');
    let tab = 'plants';
    let selected = null;
    let drag = null;
    let alive = true;

    const maxX = () => (bloomingCount() >= UNLOCK_MORE_GARDEN ? 96 : LOCKED_FROM - 3);
    const depth = (y) => 0.62 + (y / 100) * 0.55;

    function place(el, it) {
      const def = ITEMS[it.k] || { w: 6 };
      el.style.left = `${it.x}%`;
      el.style.top = `${LAWN_TOP + (it.y / 100) * (100 - LAWN_TOP)}%`;
      el.style.width = `${def.w * depth(it.y) * SIZES[it.size ?? DEFAULT_SIZE]}%`;
      el.style.zIndex = String(100 + Math.round(it.y * 10));
      el.classList.toggle('flip', Boolean(it.flip));
    }

    function drawItems(popId) {
      const g = gardenState();
      itemsEl.innerHTML = '';
      for (const it of g.items) {
        const el = document.createElement('div');
        el.className = `gb-item${it.id === selected ? ' sel' : ''}${it.id === popId ? ' pop' : ''}`;
        el.dataset.id = it.id;
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', name(it.k));
        el.innerHTML = `<div class="gb-shadow"></div><div class="gb-art">${itemArt(it.k)}</div>`;
        place(el, it);
        itemsEl.appendChild(el);
      }
      $('.gb-empty').hidden = g.items.length > 0;
      drawVisitors();
      drawToolbar();
    }

    // Free visitors that arrive as the garden grows.
    function drawVisitors() {
      const g = gardenState();
      const plants = g.items.filter((x) => ITEMS[x.k]?.cat === 'plants').length;
      const pond = g.items.find((x) => x.k === 'water-pond');
      const out = [];
      const v = (k, x, y, cls = '') => out.push(`<div class="gb-visitor ${cls}" style="left:${x}%;top:${y}%">${itemArt(k)}</div>`);
      if (plants >= 3) v('visitor-butterfly-pink', 18, 36, 'flutter');
      if (plants >= 6) v('visitor-butterfly-blue', 52, 44, 'flutter late');
      if (plants >= 4) v('visitor-ladybug', 30, 86, 'crawl');
      if (pond) v('visitor-duck', Math.min(90, pond.x + 4), LAWN_TOP + (pond.y / 100) * (100 - LAWN_TOP) - 6, 'bob');
      if (g.items.length >= 10) v('visitor-rabbit', 70, 70, 'hop');
      if (g.items.length >= 15) v('visitor-snail', 40, 92, 'crawl slow');
      out.push(`<div class="gb-visitor gb-bee">${beeFlyerHTML()}</div>`);
      visitorsEl.innerHTML = out.join('');
    }

    function drawToolbar() {
      gardenEl.querySelector('.gb-toolbar')?.remove();
      const it = gardenState().items.find((x) => x.id === selected);
      const el = it && itemsEl.querySelector(`[data-id="${it.id}"]`);
      if (!it || !el) return;
      const sz = it.size ?? DEFAULT_SIZE;
      const tb = document.createElement('div');
      tb.className = 'gb-toolbar';
      tb.innerHTML = `<button type="button" class="gb-size" data-t="small" ${sz === 0 ? 'disabled' : ''} aria-label="${t('garden.smaller')}">－</button>
        <span class="gb-dots" aria-hidden="true">${SIZES.map((_, i) => `<i class="${i === sz ? 'on' : ''}"></i>`).join('')}</span>
        <button type="button" class="gb-size" data-t="big" ${sz === SIZES.length - 1 ? 'disabled' : ''} aria-label="${t('garden.bigger')}">＋</button>
        <button type="button" data-t="flip">${t('garden.flip')}</button>
        <button type="button" data-t="bag">${t('garden.toBag')}</button>
        <button type="button" data-t="done" aria-label="${t('garden.done')}">${icon('check')}</button>`;
      gardenEl.appendChild(tb);
      const gw = gardenEl.clientWidth;
      const tw = tb.offsetWidth;
      const th = tb.offsetHeight;
      const cx = (it.x / 100) * gw;
      tb.style.left = `${Math.min(gw - tw / 2 - 6, Math.max(tw / 2 + 6, cx))}px`;
      const top = el.offsetTop - el.offsetHeight - 10;
      tb.style.top = `${top - th < 6 ? Math.min(gardenEl.clientHeight - 6, el.offsetTop + th + 10) : top}px`;
    }

    gardenEl.addEventListener('click', (e) => {
      const b = e.target.closest('.gb-toolbar button');
      if (!b) return;
      const it = gardenState().items.find((x) => x.id === selected);
      if (!it) return;
      const act = b.dataset.t;
      if (act === 'small' || act === 'big') {
        updateItem(it.id, { size: Math.max(0, Math.min(SIZES.length - 1, (it.size ?? DEFAULT_SIZE) + (act === 'big' ? 1 : -1))) });
        sfx.pop(act === 'big' ? 4 : 1);
      } else if (act === 'flip') {
        updateItem(it.id, { flip: !it.flip });
        sfx.tap();
      } else if (act === 'bag') {
        itemToBag(it.id);
        selected = null;
        toast(t('garden.putAway'));
        drawShelf();
      } else {
        selected = null;
      }
      drawItems();
    });

    // Dragging and tapping items
    gardenEl.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.gb-toolbar')) return;
      const el = e.target.closest('.gb-item');
      if (!el) {
        if (selected) { selected = null; drawItems(); }
        return;
      }
      const it = gardenState().items.find((x) => x.id === Number(el.dataset.id));
      if (!it) return;
      drag = { it, el, sx: e.clientX, sy: e.clientY, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      el.classList.add('drag');
      e.preventDefault();
    });
    gardenEl.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      if (!drag.moved) { drag.moved = true; gardenEl.querySelector('.gb-toolbar')?.remove(); }
      const r = gardenEl.getBoundingClientRect();
      const xPct = ((e.clientX - r.left) / r.width) * 100;
      const yPct = ((e.clientY - r.top) / r.height) * 100;
      drag.it.x = Math.min(maxX(), Math.max(3, xPct));
      drag.it.y = Math.min(100, Math.max(0, ((yPct - LAWN_TOP) / (100 - LAWN_TOP)) * 100));
      place(drag.el, drag.it);
    });
    const endDrag = () => {
      if (!drag) return;
      const { it, moved } = drag;
      drag.el.classList.remove('drag');
      drag = null;
      if (moved) updateItem(it.id, { x: Math.round(it.x * 10) / 10, y: Math.round(it.y * 10) / 10 });
      else selected = selected === it.id ? null : it.id;
      drawItems();
    };
    gardenEl.addEventListener('pointerup', endDrag);
    gardenEl.addEventListener('pointercancel', endDrag);
    gardenEl.addEventListener('keydown', (e) => {
      const el = e.target.closest('.gb-item');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selected = Number(el.dataset.id); drawItems(); }
    });

    // ---------- Shelf ----------
    function drawShelf() {
      const g = gardenState();
      root.querySelector('.gb-tabs').innerHTML = [...CATEGORIES, 'bag'].map((c) => {
        const n = c === 'bag' ? g.bag.length : 0;
        return `<button class="tab ${c === tab ? 'is-on' : ''}" type="button" data-tab="${c}">${t(`garden.cat.${c}`)}${n ? ` <span class="gb-count">${num(n)}</span>` : ''}</button>`;
      }).join('');
      root.querySelector('.gb-cards').innerHTML = tab === 'bag' ? bagCards() : tab === 'treasures' ? treasureCards() : shopCards(tab);
      root.querySelector('.gb-honey').textContent = num(honeyBalance());
      drawGoal();
    }

    function shopCards(cat) {
      const blooming = bloomingCount();
      return Object.entries(ITEMS).filter(([, d]) => d.cat === cat).map(([k, d]) => {
        const locked = blooming < d.need;
        const full = d.max && ownedCount(k) >= d.max;
        let action;
        if (locked) action = `<span class="gb-need">${icon('lock')}${t('garden.needWords', { n: d.need })}</span><span class="gb-bar small"><i style="width:${Math.round((blooming / d.need) * 100)}%"></i></span>`;
        else if (full) action = `<span class="chip chip-leaf">${icon('check')}${t('garden.youHaveIt')}</span>`;
        else action = `<button class="btn btn-small ${honeyBalance() >= d.price ? 'btn-honey' : 'btn-cream'}" type="button" data-buy="${k}">${icon('honey')}<span>${num(d.price)}</span></button>`;
        return `<article class="gb-card ${locked ? 'is-locked' : ''}">
          <div class="gb-pic">${itemArt(k)}</div>
          <h3>${escapeHtml(name(k))}</h3>
          ${action}
        </article>`;
      }).join('');
    }

    function treasureCards() {
      const won = gardenState().wonTreasures;
      const rows = data.words.map((w) => {
        const k = treasureFor(w.id);
        const has = won[w.id];
        return `<article class="gb-card ${has ? '' : 'is-locked'}">
          <div class="gb-pic">${itemArt(k)}</div>
          <h3>${escapeHtml(name(k))}</h3>
          <span class="gb-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</span>
          <span class="sub">${has ? t('garden.won') : t('garden.learnToWin')}</span>
        </article>`;
      });
      return `<p class="gb-hint">${t('garden.treasureHint')}</p>${rows.join('')}`;
    }

    function bagCards() {
      const g = gardenState();
      if (!g.bag.length) return `<p class="gb-hint">${t('garden.bagEmpty')}</p>`;
      return g.bag.map((k, i) => `<article class="gb-card">
          <div class="gb-pic">${itemArt(k)}</div>
          <h3>${escapeHtml(name(k))}</h3>
          <button class="btn btn-small btn-leaf" type="button" data-place="${i}">${t('garden.place')}</button>
        </article>`).join('');
    }

    function drawGoal() {
      const g = gardenState();
      const goal = ITEMS[g.goal] ? g.goal : 'big-hive-home';
      const d = ITEMS[goal];
      const owned = d.max && ownedCount(goal) >= d.max;
      const chip = root.querySelector('.gb-goal');
      const p = Math.min(1, honeyBalance() / d.price);
      chip.style.setProperty('--p', owned ? 1 : p);
      chip.classList.toggle('ready', !owned && p >= 1 && bloomingCount() >= d.need);
      chip.innerHTML = `<span class="gb-goal-pic">${itemArt(goal)}</span><span>${owned
        ? t('garden.goalDone', { name: name(goal) })
        : t('garden.saving', { name: name(goal), n: Math.min(honeyBalance(), d.price), total: d.price })}</span>`;
    }

    function chooseGoal() {
      const g = gardenState();
      const options = Object.entries(ITEMS).filter(([k, d]) => ['big', 'water', 'trees'].includes(d.cat) && !(d.max && ownedCount(k) >= d.max));
      const wrap = document.createElement('div');
      wrap.className = 'dialog-backdrop';
      wrap.innerHTML = `<div class="dialog card gb-goal-dialog" role="dialog" aria-modal="true" aria-labelledby="goal-title">
        <h2 id="goal-title">${t('garden.chooseGoal')}</h2>
        <div class="gb-goal-list">${options.map(([k, d]) => `<button type="button" class="gb-goal-opt ${g.goal === k ? 'on' : ''}" data-goal="${k}">
            <span class="gb-pic">${itemArt(k)}</span>
            <span><b>${escapeHtml(name(k))}</b><small>${icon('honey')} ${num(d.price)} · ${icon('flower')} ${t('garden.needWordsShort', { n: d.need })}</small></span>
            ${g.goal === k ? icon('check') : ''}
          </button>`).join('')}</div>
        <button class="btn btn-cream" type="button" data-goal-close>${t('common.cancel')}</button>
      </div>`;
      const close = () => wrap.remove();
      wrap.addEventListener('click', (e) => {
        const opt = e.target.closest('[data-goal]');
        if (opt) { setGardenGoal(opt.dataset.goal); sfx.tap(); drawGoal(); close(); }
        else if (e.target === wrap || e.target.closest('[data-goal-close]')) close();
      });
      document.body.appendChild(wrap);
      wrap.querySelector('.gb-goal-opt')?.focus();
    }

    async function buy(k) {
      const d = ITEMS[k];
      if (honeyBalance() < d.price) { toast(t('garden.needHoney', { n: d.price - honeyBalance() })); return; }
      if (d.price >= CONFIRM_FROM) {
        const yes = await confirmDialog({
          title: t('honey.buyTitle', { name: name(k) }), message: tn('honey.buyMessage', d.price),
          yes: t('honey.buy'), no: t('honey.notNow'), yesTone: 'honey', noTone: 'cream', pose: 'think',
        });
        if (!yes || !alive) return;
      }
      const it = buyGardenItem(k, d.price);
      if (!it) return;
      sfx.chime();
      if (d.cat === 'big') confetti(60);
      toast(t('garden.planted', { name: name(k) }));
      if (gardenState().goal === k && d.max) setGardenGoal('big-hive-home');
      drawItems(it.id);
      drawShelf();
    }

    root.querySelector('.gb-shelf').addEventListener('click', (e) => {
      const tb = e.target.closest('[data-tab]');
      const by = e.target.closest('[data-buy]');
      const pl = e.target.closest('[data-place]');
      if (tb) { tab = tb.dataset.tab; drawShelf(); }
      else if (by) buy(by.dataset.buy);
      else if (pl) {
        const it = placeFromBag(Number(pl.dataset.place));
        if (it) { sfx.pop(3); drawItems(it.id); drawShelf(); }
      }
    });
    root.querySelector('.gb-goal').addEventListener('click', chooseGoal);

    // ---------- Gifts waiting: grown seeds, word treasures, new seeds ----------
    function giftDialog(html, many = false) {
      return new Promise((resolve) => {
        const wrap = document.createElement('div');
        wrap.className = 'dialog-backdrop';
        wrap.innerHTML = `<div class="dialog card gb-gift" role="dialog" aria-modal="true">${html}<button class="btn btn-honey btn-big" type="button" data-ok>${many ? t('garden.putAllInGarden') : t('garden.putInGarden')}</button></div>`;
        wrap.querySelector('[data-ok]').addEventListener('click', () => { wrap.remove(); resolve(); });
        document.body.appendChild(wrap);
        wrap.querySelector('[data-ok]').focus();
      });
    }

    async function gifts() {
      const grown = growSeeds(randomFlower, dayString());
      if (grown.length) {
        drawItems(grown[0].id);
        toast(t('garden.seedGrew', { name: name(grown[0].k) }), 3500);
      }
      catchUpTreasures();
      const won = pendingTreasures().map((wordId) => {
        const k = treasureFor(wordId);
        return { wordId, k: k === 'mystery-flower' ? randomFlower() : k };
      });
      if (won.length && alive) {
        sfx.badge();
        confetti(50);
        const one = won.length === 1 ? won[0] : null;
        const w = one && data.byId.get(one.wordId);
        await giftDialog(one
          ? `<p class="gb-gift-kicker">${icon('flower')} ${t('garden.wordBlooming')}</p>
            ${w ? `<p class="gb-gift-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</p>` : ''}
            <div class="gb-gift-pic">${itemArt(one.k)}</div>
            <h2>${t('garden.youWon', { name: name(one.k) })}</h2>
            <p class="sub">${t('garden.wordsGrowGarden')}</p>`
          : `<p class="gb-gift-kicker">${icon('flower')} ${tn('garden.wordsBlooming', won.length)}</p>
            <div class="gb-gift-grid">${won.map(({ wordId, k }) => {
              const ww = data.byId.get(wordId);
              return `<figure><div class="gb-pic">${itemArt(k)}</div><figcaption lang="${ww?.lang || 'en'}">${escapeHtml(ww?.word || '')}</figcaption></figure>`;
            }).join('')}</div>
            <h2>${tn('garden.youWonMany', won.length)}</h2>
            <p class="sub">${t('garden.wordsGrowGarden')}</p>`, won.length > 1);
        if (!alive) return;
        const placed = claimTreasures(won);
        drawItems(placed[placed.length - 1]?.id);
        drawShelf();
      }
      while (alive && pendingSeeds() > 0) {
        await giftDialog(`<div class="gb-gift-pic">${itemArt('seed')}</div>
          <h2>${t('garden.seedTitle')}</h2>
          <p class="sub">${t('garden.seedText')}</p>`);
        if (!alive) return;
        const it = claimSeed();
        if (it) drawItems(it.id);
      }
    }

    drawItems();
    drawShelf();
    gifts();
    const onResize = () => drawToolbar();
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      root.removeEventListener('click', onSay);
      window.removeEventListener('resize', onResize);
      document.querySelectorAll('.gb-goal-dialog, .gb-gift').forEach((d) => d.closest('.dialog-backdrop')?.remove());
    };
  },
};
