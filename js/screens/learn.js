// Learn words — Look, Say, Cover, Write, Check. A calm way to memorise before testing.
// Learning is tracked separately from test results, so review timing stays honest.
import { data, listById } from '../data.js';
import { progress, recordLearned, activeProfile, honeyBalance } from '../store.js';
import { t, tn, pick, escapeHtml, num, dirOf, getLang } from '../i18n.js';
import { mascotHTML, flowerHTML, setFlowerStage, hasArt, artUrl } from '../art.js';
import { icon } from '../icons.js';
import { go, toast } from '../ui.js';
import { sayWord, stopAudio, voicesForWord, voiceName } from '../audio.js';
import { spellingOf } from '../spellnames.js';
import { sfx } from '../sfx.js';
import { setCalm, motionAllowed } from '../ambient.js';
import { tilesHTML, bigWordHTML } from '../reveal.js';
import { petalBurst, confetti, honeyFly } from '../fx.js';
import { shuffle } from '../scheduler.js';

const STEPS = [
  { id: 'look', icon: 'eye' },
  { id: 'say', icon: 'play' },
  { id: 'cover', icon: 'sprout' },
  { id: 'write', icon: 'write' },
  { id: 'check', icon: 'check' },
];

function buildQueue(params) {
  if (params.ids) return params.ids.split(',').filter((id) => data.byId.has(id));
  const words = params.list ? data.words.filter((w) => w.listId === params.list) : data.words;
  let ids = words.map((w) => w.id);
  if (params.order === 'shuffle') ids = shuffle(ids);
  const count = params.count && params.count !== 'all' ? Number(params.count) : Infinity;
  return ids.slice(0, count);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  title: () => t('learn.title'),

  render({ params }) {
    const list = listById(params.list);
    const title = list ? `${t('learn.title')} · ${pick(list.title)}` : t('learn.title');
    const steps = STEPS.map((s, i) => `<li class="step" data-step="${s.id}">${icon(s.icon)}<span>${num(i + 1)}. ${t(`learn.step.${s.id}`)}</span></li>`).join('');
    return `<div class="page bee-page learn-page" data-step="look">
      <header class="topbar">
        <button class="icon-btn" type="button" data-act="exit" aria-label="${t('common.back')}">${icon('close')}</button>
        <h1 class="title">${escapeHtml(title)}</h1>
        <button class="chip chip-honey honey-chip" type="button" data-act="honey-info" aria-label="${t('bee.honeyLabel')}">${icon('honey')}<span class="honey-n">${num(honeyBalance())}</span></button>
      </header>
      <ol class="steps" aria-label="${t('learn.title')}">${steps}</ol>
      <div class="bee-main">
        <section class="stage" aria-hidden="true">
          <div class="buddy">
            <div class="mascot-slot">${mascotHTML('think')}</div>
            <p class="bubble" aria-live="polite"></p>
          </div>
          <div class="flower-slot">${flowerHTML(2, 'stage-flower')}</div>
        </section>
        <section class="work">
          <div class="ask learn-card">
            <p class="word-meta"><span class="lang-tag"></span><span class="word-count"></span></p>
            <div class="learn-word"></div>
            <div class="learn-tiles"></div>
            <p class="spell-name" aria-live="polite"></p>
            <div class="learn-info"></div>
            <div class="learn-actions"></div>
          </div>
        </section>
      </div>
      <section class="summary" hidden></section>
    </div>`;
  },

  mount(root, { params }) {
    const $ = (s) => root.querySelector(s);
    const page = $('.learn-page');
    const bubble = $('.bubble');
    const mascotSlot = $('.mascot-slot');
    const flowerEl = $('.stage-flower');
    const wordBox = $('.learn-word');
    const tilesBox = $('.learn-tiles');
    const infoBox = $('.learn-info');
    const actions = $('.learn-actions');
    const honeyChip = $('.honey-chip');
    const summary = $('.summary');

    const queue = buildQueue(params);
    const done = new Map(); // id → got it on the first check
    let i = 0;
    let word = null;
    let alive = true;
    let run = 0; // cancels older animations when the step changes
    let voices = [];
    let voiceAt = 0;

    const setBubble = (text) => {
      bubble.textContent = text;
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    };
    const setPose = (pose) => { mascotSlot.innerHTML = mascotHTML(pose, { avatar: activeProfile()?.avatar }); };
    const tiles = () => [...tilesBox.querySelectorAll('.tile:not(.tile-space)')];

    function setStep(step) {
      page.dataset.step = step;
      const at = STEPS.findIndex((s) => s.id === step);
      root.querySelectorAll('.step').forEach((el, k) => {
        el.classList.toggle('is-done', k < at);
        el.classList.toggle('is-now', k === at);
      });
    }
    function setActions(html) {
      actions.innerHTML = html;
      actions.querySelector('.btn-honey, .btn-leaf')?.focus({ preventScroll: true });
    }
    const btn = (act, tone, ic, label) =>
      `<button class="btn btn-${tone} btn-big" type="button" data-act="${act}">${icon(ic, { className: act === 'next' ? 'flip-rtl' : '' })}<span>${label}</span></button>`;

    function meaningHTML() {
      const order = [...new Set([getLang(), 'bn', 'en'])];
      const lines = order.filter((l) => word.meaning?.[l]).map((l) =>
        `<p lang="${l}" dir="${dirOf(l)}"><span class="lang-tag" data-lang="${l}">${t(`langShort.${l}`)}</span> ${escapeHtml(word.meaning[l])}</p>`).join('');
      const tip = pick(word.tip);
      const pic = hasArt(`word-${word.id}`) ? `<img class="learn-pic" src="${artUrl(`word-${word.id}`)}" alt="">` : '';
      return `${pic}<div class="hint-panel learn-meaning">${lines}</div>
        ${tip ? `<div class="tip-box">${icon('tip')}<div><p>${escapeHtml(tip)}</p></div></div>` : ''}`;
    }

    // ---- Steps ----
    function look() {
      run++;
      setStep('look');
      setCalm(true);
      setPose('think');
      setFlowerStage(flowerEl, 2);
      setBubble(word.lang === 'bn' ? t('learn.lookBubbleTap') : t('learn.lookBubble'));
      wordBox.innerHTML = bigWordHTML(word);
      tilesBox.innerHTML = tilesHTML(word, { open: true, covers: 'always' });
      tilesBox.querySelector('.tiles').classList.add('learn');
      makeTilesTappable();
      infoBox.innerHTML = meaningHTML();
      setActions(`${btn('hear', 'cream', 'play', t('learn.hear'))}${voices.length > 1 ? btn('voice', 'cream', 'users', t('hint.voice')) : ''}${btn('say', 'honey', 'next', t('learn.spellAlong'))}`);
      setTimeout(() => { if (alive && page.dataset.step === 'look') sayWord(word, { voice: voices[voiceAt] }); }, 450);
    }

    async function say() {
      const me = ++run;
      setStep('say');
      setPose('listen');
      setFlowerStage(flowerEl, 3);
      setBubble(t('learn.sayBubble'));
      setActions(`${btn('say', 'cream', 'again', t('learn.again'))}${btn('cover', 'honey', 'next', t('learn.coverIt'))}`);
      const list = tiles();
      const pieces = spellingOf(word);
      const named = pieces.some((x) => x.name && x.name !== x.tile);
      // Each piece lights up; for Bangla its spoken name shows underneath (ম · উঁয়ো-এ গ · ল …).
      const step = !motionAllowed() ? 400 : named ? 1400 : 650;
      for (let k = 0; k < list.length; k++) {
        if (!alive || me !== run) return;
        showPiece(k, named);
        sfx.pop(k);
        await sleep(step);
      }
      showPiece(-1);
      if (alive && me === run) sayWord(word, { voice: voices[voiceAt] });
    }

    /** Lights up tile k and, when it has one, shows how it is said. k = -1 clears. */
    function showPiece(k, withName = true) {
      const list = tiles();
      list.forEach((el, n) => el.classList.toggle('walk', n === k));
      const nameBox = $('.spell-name');
      const piece = k >= 0 ? spellingOf(word)[k] : null;
      nameBox.innerHTML = piece && withName && piece.name && piece.name !== piece.tile
        ? `<span lang="${word.lang}" dir="${dirOf(word.lang)}"><b>${escapeHtml(piece.display)}</b> = ${escapeHtml(piece.name)}</span>`
        : '';
    }

    /** Makes the letter tiles tappable: tap one to see how that piece is said. */
    function makeTilesTappable() {
      const box = tilesBox.querySelector('.tiles');
      if (!box || word.lang !== 'bn') return; // names exist for Bangla pieces for now
      box.removeAttribute('aria-hidden');
      box.classList.add('tappable');
      const pieces = spellingOf(word);
      tiles().forEach((el, k) => {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `${pieces[k].tile}: ${pieces[k].name}`);
      });
    }

    function cover() {
      run++;
      setStep('cover');
      setPose('think');
      showPiece(-1);
      tiles().forEach((el) => { el.classList.remove('open', 'walk'); el.classList.add('covered'); });
      sfx.whoosh();
      setBubble(t('learn.coverBubble'));
      setActions('');
      setTimeout(() => {
        if (!alive || page.dataset.step !== 'cover') return;
        setStep('write');
        setBubble(t('learn.writeBubble'));
        setActions(`${btn('hear', 'cream', 'play', t('learn.hear'))}${btn('check', 'honey', 'check', t('learn.check'))}`);
      }, motionAllowed() ? 900 : 100);
    }

    function check() {
      run++;
      setStep('check');
      setCalm(false);
      const box = tilesBox.querySelector('.tiles');
      box.classList.add('revealing');
      const list = tiles();
      list.forEach((el, k) => setTimeout(() => {
        el.classList.remove('covered');
        el.classList.add('open');
        sfx.pop(k);
      }, 150 + k * 220));
      setActions('');
      setTimeout(() => {
        if (!alive || page.dataset.step !== 'check') return;
        setBubble(t('learn.checkBubble'));
        setActions(`${btn('got', 'leaf', 'check', t('bee.gotIt'))}${btn('notyet', 'orange', 'sprout', t('bee.notYet'))}`);
      }, 150 + list.length * 220 + 450);
    }

    function answer(got) {
      run++;
      const { goalReached } = recordLearned(word.id, got);
      if (goalReached) setTimeout(() => { if (alive) { sfx.badge(); confetti(70); toast(t('honey.goalToast'), 4000); } }, 900);
      if (!done.has(word.id)) done.set(word.id, got);
      if (got) {
        setFlowerStage(flowerEl, 4);
        petalBurst(flowerEl);
        sfx.chime();
        setPose('cheer');
        setBubble(t(`praise.${1 + Math.floor(Math.random() * 6)}`));
        honeyFly(flowerEl, honeyChip);
        setTimeout(() => { if (alive) $('.honey-n').textContent = num(honeyBalance()); }, 750);
        setActions(btn('next', 'honey', 'next', i === queue.length - 1 ? t('bee.finish') : t('bee.next')));
      } else {
        setFlowerStage(flowerEl, 5);
        sfx.soft();
        setPose('oops');
        setBubble(t('learn.lookAgain'));
        setActions(`${btn('next', 'cream', 'next', i === queue.length - 1 ? t('bee.finish') : t('bee.next'))}${btn('again-word', 'honey', 'eye', t('learn.lookAgainBtn'))}`);
      }
    }

    function showWord() {
      word = data.byId.get(queue[i]);
      voices = voicesForWord(word);
      voiceAt = 0;
      $('.lang-tag').dataset.lang = word.lang;
      $('.lang-tag').textContent = t(`langShort.${word.lang}`);
      $('.word-count').textContent = t('bee.wordOf', { n: i + 1, total: queue.length });
      flowerEl.classList.add('instant');
      setFlowerStage(flowerEl, 1);
      requestAnimationFrame(() => requestAnimationFrame(() => flowerEl.classList.remove('instant')));
      look();
    }

    function next() {
      i += 1;
      if (i >= queue.length) showSummary();
      else showWord();
    }

    function showSummary() {
      run++;
      setCalm(false);
      const ids = [...done.keys()];
      const right = ids.filter((id) => done.get(id)).length;
      root.querySelector('.bee-main').hidden = true;
      root.querySelector('.steps').hidden = true;
      summary.hidden = false;
      summary.innerHTML = `<div class="card summary-card">
        <div class="summary-top">
          <div class="summary-mascot">${mascotHTML('trophy', { avatar: activeProfile()?.avatar })}</div>
          <div>
            <h2>${tn('learn.doneTitle', ids.length)}</h2>
            <p class="lead">${t('learn.doneLead')}</p>
          </div>
        </div>
        <div class="mini-garden" aria-hidden="true">${ids.map((id) => `<div class="mini-plant">${flowerHTML(done.get(id) ? 4 : 2)}</div>`).join('')}</div>
        <div class="summary-actions">
          <button class="btn btn-honey btn-big" type="button" data-act="test">${icon('play')}<span>${t('learn.testNow')}</span></button>
          <a class="btn btn-cream btn-big" href="#/words">${icon('list')}<span>${t('learn.backToList')}</span></a>
        </div>
      </div>`;
      sfx.tada();
      confetti(right === ids.length ? 80 : 40);
      summary.dataset.ids = ids.join(',');
    }

    const tapTile = (el) => {
      const step = page.dataset.step;
      if (step === 'cover' || step === 'write') return; // the word is hidden — no peeking
      run++; // stop the spell-along so the tapped piece stays
      const k = tiles().indexOf(el);
      if (k >= 0) { showPiece(k); sfx.tap(); }
    };
    const onKey = (e) => {
      const el = e.target.closest?.('.tiles.tappable .tile');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tapTile(el); }
    };
    root.addEventListener('keydown', onKey);

    const onClick = (e) => {
      const tileEl = e.target.closest('.tiles.tappable .tile');
      if (tileEl) return tapTile(tileEl);
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'hear') sayWord(word, { voice: voices[voiceAt] });
      else if (act === 'voice') {
        voiceAt = (voiceAt + 1) % voices.length;
        sayWord(word, { voice: voices[voiceAt] });
        setBubble(t('voice.nowSpeaking', { name: voiceName(word.lang, voices[voiceAt]) }));
      }
      else if (act === 'say') say();
      else if (act === 'cover') cover();
      else if (act === 'check') check();
      else if (act === 'got') answer(true);
      else if (act === 'notyet') answer(false);
      else if (act === 'again-word') look();
      else if (act === 'next') next();
      else if (act === 'test') go('bee', { mode: 'retry', ids: summary.dataset.ids });
      else if (act === 'honey-info') toast(t('honey.explainShort'), 4200);
      else if (act === 'exit') { if (history.length > 1) history.back(); else go('words'); }
    };
    root.addEventListener('click', onClick);

    if (!queue.length) {
      root.querySelector('.bee-main').hidden = true;
      summary.hidden = false;
      summary.innerHTML = `<div class="card summary-card empty-card"><h2>${t('bee.nothing')}</h2><a class="btn btn-honey btn-big" href="#/words">${t('learn.backToList')}</a></div>`;
    } else {
      showWord();
    }

    return () => {
      alive = false;
      run++;
      stopAudio();
      setCalm(false);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
    };
  },
};
