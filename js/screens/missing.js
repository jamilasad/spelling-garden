// Missing letters — the tricky parts of a word disappear; she picks the right piece for each gap.
import { data, listById } from '../data.js';
import { progress, recordGameWord, activeProfile, honeyBalance } from '../store.js';
import { shuffle } from '../scheduler.js';
import { t, tn, pick, escapeHtml, num, dirOf, getLang } from '../i18n.js';
import { mascotHTML, flowerHTML, setFlowerStage } from '../art.js';
import { icon } from '../icons.js';
import { go, toast } from '../ui.js';
import { sayWord, stopAudio } from '../audio.js';
import { sfx } from '../sfx.js';
import { setCalm } from '../ambient.js';
import { segment, highlightedTiles, displayable } from '../segment.js';
import { distractors, pickBlanks } from '../confusions.js';
import { bigWordHTML } from '../reveal.js';
import { petalBurst, confetti, honeyFly } from '../fx.js';

const CHOICES = 3;

function buildQueue(params) {
  const words = params.list ? data.words.filter((w) => w.listId === params.list) : data.words;
  const count = params.count && params.count !== 'all' ? Number(params.count) : Infinity;
  return shuffle(words.map((w) => w.id)).slice(0, count);
}

export default {
  title: () => t('missing.title'),

  render({ params }) {
    const list = listById(params.list);
    const title = list ? `${t('missing.title')} · ${pick(list.title)}` : t('missing.title');
    return `<div class="page bee-page missing-page">
      <header class="topbar">
        <button class="icon-btn" type="button" data-act="exit" aria-label="${t('common.back')}">${icon('close')}</button>
        <h1 class="title">${escapeHtml(title)}</h1>
        <button class="chip chip-honey honey-chip" type="button" data-act="honey-info" aria-label="${t('bee.honeyLabel')}">${icon('honey')}<span class="honey-n">${num(honeyBalance())}</span></button>
      </header>
      <div class="combs" aria-hidden="true"></div>
      <div class="bee-main">
        <section class="stage" aria-hidden="true">
          <div class="buddy">
            <div class="mascot-slot">${mascotHTML('think')}</div>
            <p class="bubble" aria-live="polite"></p>
          </div>
          <div class="flower-slot">${flowerHTML(2, 'stage-flower')}</div>
        </section>
        <section class="work">
          <div class="ask game-card">
            <p class="word-meta"><span class="lang-tag"></span><span class="word-count"></span></p>
            <div class="game-word"></div>
            <p class="game-meaning"></p>
            <div class="choice-tray" role="group" aria-label="${t('missing.choose')}"></div>
            <div class="game-actions">
              <button class="btn btn-cream" type="button" data-act="hear">${icon('play')}<span>${t('learn.hear')}</span></button>
              <button class="btn btn-honey btn-big next-btn" type="button" data-act="next" hidden></button>
            </div>
          </div>
        </section>
      </div>
      <section class="summary" hidden></section>
    </div>`;
  },

  mount(root, { params }) {
    const $ = (s) => root.querySelector(s);
    const bubble = $('.bubble');
    const mascotSlot = $('.mascot-slot');
    const flowerEl = $('.stage-flower');
    const wordBox = $('.game-word');
    const meaning = $('.game-meaning');
    const tray = $('.choice-tray');
    const nextBtn = $('.next-btn');
    const combs = $('.combs');
    const honeyChip = $('.honey-chip');
    const summary = $('.summary');

    const queue = buildQueue(params);
    const results = [];
    let i = 0;
    let word = null;
    let tiles = [];
    let blanks = [];
    let gap = 0;
    let mistakes = 0;
    let alive = true;

    const setBubble = (text) => {
      bubble.textContent = text;
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    };
    const setPose = (pose) => { mascotSlot.innerHTML = mascotHTML(pose, { avatar: activeProfile()?.avatar }); };

    function renderCombs() {
      combs.innerHTML = queue.map((_, k) => {
        const cls = k < results.length ? (results[k] ? 'done' : 'missed') : k === i ? 'now' : '';
        return `<span class="comb ${cls}"></span>`;
      }).join('');
    }

    function drawWord() {
      const body = tiles.map((tile, k) => {
        if (tile.space) return '<div class="tile tile-space"></div>';
        const b = blanks.indexOf(k);
        const filled = b === -1 || b < gap;
        const cls = filled ? 'open' : `gap${b === gap ? ' gap-now' : ''}`;
        return `<div class="tile ${cls}" data-k="${k}"><div class="hex"></div><div class="hex-in"></div>
          <div class="glyph">${filled ? escapeHtml(tile.display) : '?'}</div></div>`;
      }).join('');
      wordBox.innerHTML = `<div class="tiles" lang="${word.lang}" dir="${dirOf(word.lang)}" style="--n:${tiles.length}">${body}</div>`;
    }

    function drawChoices() {
      if (gap >= blanks.length) { tray.innerHTML = ''; return; }
      const correct = tiles[blanks[gap]].text;
      const others = tiles.filter((x) => !x.space).map((x) => x.text);
      const options = shuffle([correct, ...distractors(correct, word.lang, CHOICES - 1, others)]);
      tray.innerHTML = options.map((o) =>
        `<button class="choice-tile" type="button" data-choice="${escapeHtml(o)}" lang="${word.lang}">
          <span class="hex"></span><span class="hex-in"></span><span class="glyph">${escapeHtml(displayable(o))}</span>
        </button>`).join('');
      tray.querySelector('button')?.focus({ preventScroll: true });
    }

    function showWord() {
      word = data.byId.get(queue[i]);
      tiles = segment(word.word, word.lang);
      const letters = tiles.map((x, k) => (x.space ? -1 : k)).filter((k) => k >= 0);
      blanks = pickBlanks([...highlightedTiles(tiles, word.word, word.highlight)], letters);
      gap = 0;
      mistakes = 0;
      $('.lang-tag').dataset.lang = word.lang;
      $('.lang-tag').textContent = t(`langShort.${word.lang}`);
      $('.word-count').textContent = t('bee.wordOf', { n: i + 1, total: queue.length });
      const m = word.meaning?.[getLang()] || word.meaning?.en || '';
      meaning.textContent = m;
      nextBtn.hidden = true;
      flowerEl.classList.add('instant');
      setFlowerStage(flowerEl, 2);
      requestAnimationFrame(() => requestAnimationFrame(() => flowerEl.classList.remove('instant')));
      setPose('think');
      setBubble(blanks.length === 1 ? t('missing.findOne') : tn('missing.findMany', blanks.length));
      drawWord();
      drawChoices();
      renderCombs();
      setCalm(true);
      setTimeout(() => { if (alive && word === data.byId.get(queue[i])) sayWord(word); }, 450);
    }

    function choose(btn) {
      if (gap >= blanks.length || btn.disabled) return;
      const correct = tiles[blanks[gap]].text.normalize('NFC');
      if (btn.dataset.choice.normalize('NFC') === correct) {
        sfx.pop(gap + 2);
        gap += 1;
        drawWord();
        const placed = wordBox.querySelector(`[data-k="${blanks[gap - 1]}"]`);
        placed?.classList.add('just-filled');
        if (gap >= blanks.length) finishWord();
        else {
          if (gap >= blanks.length / 2) setFlowerStage(flowerEl, 3);
          setBubble(t('missing.good'));
          drawChoices();
        }
      } else {
        mistakes += 1;
        btn.disabled = true;
        btn.classList.add('wrong');
        sfx.soft();
        setPose('oops');
        setBubble(t('missing.tryAnother'));
      }
    }

    function finishWord() {
      const clean = mistakes === 0;
      results.push(clean);
      const { goalReached } = recordGameWord(word.id, clean);
      tray.innerHTML = '';
      wordBox.insertAdjacentHTML('afterbegin', bigWordHTML(word));
      setFlowerStage(flowerEl, 4);
      petalBurst(flowerEl);
      sfx.chime();
      setPose('cheer');
      setBubble(clean ? t(`praise.${1 + Math.floor(Math.random() * 6)}`) : t('missing.doneWithHelp'));
      if (clean) {
        honeyFly(flowerEl, honeyChip);
        setTimeout(() => { if (alive) $('.honey-n').textContent = num(honeyBalance()); }, 750);
      }
      if (goalReached) setTimeout(() => { if (alive) { sfx.badge(); confetti(70); toast(t('honey.goalToast'), 4000); } }, 900);
      renderCombs();
      setCalm(false);
      setTimeout(() => { if (alive) sayWord(word); }, 600);
      nextBtn.innerHTML = i === queue.length - 1
        ? `${icon('trophy')}<span>${t('bee.finish')}</span>`
        : `<span>${t('bee.next')}</span>${icon('next', { className: 'flip-rtl' })}`;
      nextBtn.hidden = false;
      nextBtn.focus({ preventScroll: true });
    }

    function showSummary() {
      setCalm(false);
      const clean = results.filter(Boolean).length;
      root.querySelector('.bee-main').hidden = true;
      combs.hidden = true;
      summary.hidden = false;
      summary.innerHTML = `<div class="card summary-card">
        <div class="summary-top">
          <div class="summary-mascot">${mascotHTML('trophy', { avatar: activeProfile()?.avatar })}</div>
          <div>
            <h2>${tn('missing.doneTitle', results.length)}</h2>
            <p class="lead">${tn('missing.doneLead', clean, { total: num(results.length) })}</p>
          </div>
        </div>
        <div class="mini-garden" aria-hidden="true">${results.map((r) => `<div class="mini-plant">${flowerHTML(r ? 4 : 3)}</div>`).join('')}</div>
        <div class="summary-actions">
          <button class="btn btn-honey btn-big" type="button" data-act="again">${icon('again')}<span>${t('missing.playAgain')}</span></button>
          <a class="btn btn-cream btn-big" href="#/">${icon('home')}<span>${t('summary.home')}</span></a>
        </div>
      </div>`;
      sfx.tada();
      confetti(clean === results.length ? 80 : 40);
    }

    const onClick = (e) => {
      const c = e.target.closest('[data-choice]');
      if (c) return choose(c);
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'hear') sayWord(word);
      else if (act === 'next') { i += 1; if (i >= queue.length) showSummary(); else showWord(); }
      else if (act === 'again') go('missing', { ...params, n: Date.now() });
      else if (act === 'honey-info') toast(t('honey.explainShort'), 4200);
      else if (act === 'exit') go('');
    };
    root.addEventListener('click', onClick);

    if (!queue.length) {
      root.querySelector('.bee-main').hidden = true;
      summary.hidden = false;
      summary.innerHTML = `<div class="card summary-card empty-card"><h2>${t('bee.nothing')}</h2><a class="btn btn-honey btn-big" href="#/">${t('summary.home')}</a></div>`;
    } else {
      showWord();
    }

    return () => {
      alive = false;
      stopAudio();
      setCalm(false);
      root.removeEventListener('click', onClick);
    };
  },
};
