// Bee Mode — hear the word, write it on paper, hold to reveal, then check yourself.
import { data, listById } from '../data.js';
import { progress, recordResult, finishSession, awardBadge, activeProfile, settings, honeyBalance } from '../store.js';
import { buildQueue, requeuePosition, dayString, isTricky, shuffle } from '../scheduler.js';
import { t, tn, pick, escapeHtml, num, dirOf, getLang } from '../i18n.js';
import { mascotHTML, flowerHTML, setFlowerStage, hasArt, artUrl, badgeHTML } from '../art.js';
import { icon } from '../icons.js';
import { go, holdButton, confirmDialog, toast } from '../ui.js';
import { sayWord, saySentence, stopAudio, voicesForWord, voiceName, spellAloud, canSpellAloud } from '../audio.js';
import { sfx } from '../sfx.js';
import { setCalm } from '../ambient.js';
import { tilesHTML, bigWordHTML, runReveal } from '../reveal.js';
import { petalBurst, confetti, honeyFly } from '../fx.js';
import { maskWord } from '../segment.js';
import { BADGES, qualifyingBadges } from '../badges.js';

const TODAY_SIZE = 15;
const HINTS = ['again', 'slow', 'voice', 'meaning', 'sentence', 'type', 'picture'];

function buildSession(params) {
  const day = dayString();
  const recs = progress().words;
  const count = params.count === 'all' ? Infinity : Number(params.count) || 10;
  const all = data.words.map((w) => w.id);
  switch (params.mode) {
    case 'list': {
      const ids = data.words.filter((w) => w.listId === params.list).map((w) => w.id);
      return buildQueue({ ids, progress: recs, day, size: count, order: params.order || 'shuffle' });
    }
    case 'hive': {
      const ids = data.words.filter((w) => isTricky(recs[w.id])).map((w) => w.id);
      return buildQueue({ ids, progress: recs, day, size: TODAY_SIZE });
    }
    case 'retry':
      return shuffle((params.ids || '').split(',').filter((id) => data.byId.has(id)));
    case 'mock': {
      const ids = params.list ? data.words.filter((w) => w.listId === params.list).map((w) => w.id) : all;
      return shuffle(ids).slice(0, count);
    }
    default:
      return buildQueue({ ids: all, progress: recs, day, size: TODAY_SIZE });
  }
}

function sessionTitle(params) {
  if (params.mode === 'list') return pick(listById(params.list)?.title) || t('home.today');
  if (params.mode === 'hive') return t('hive.title');
  if (params.mode === 'retry') return t('bee.retryTitle');
  if (params.mode === 'mock') return t('mock.title');
  return t('home.today');
}

const hintButton = (h) =>
  `<button class="hint-btn" type="button" data-hint="${h}">${icon(h === 'voice' ? 'users' : h)}<span>${t(`hint.${h}`)}</span></button>`;

export default {
  title: () => t('bee.title'),

  render({ params }) {
    const mock = params.mode === 'mock';
    return `<div class="page bee-page" data-state="listen">
      <header class="topbar">
        <button class="icon-btn" type="button" data-act="exit" aria-label="${t('bee.exit')}">${icon('close')}</button>
        <h1 class="title">${escapeHtml(sessionTitle(params))}</h1>
        <button class="chip chip-honey honey-chip" type="button" data-act="honey-info" aria-label="${t('bee.honeyLabel')}">${icon('honey')}<span class="honey-n">${num(honeyBalance())}</span></button>
      </header>
      <div class="combs" aria-hidden="true"></div>
      <div class="bee-main">
        <section class="stage" aria-hidden="true">
          <div class="buddy">
            <div class="mascot-slot">${mascotHTML('listen')}</div>
            <p class="bubble" aria-live="polite"></p>
          </div>
          <div class="flower-slot">${flowerHTML(2, 'stage-flower')}</div>
          <span class="chip chip-berry timer-chip" hidden>${icon('timer')}<span class="timer-n"></span></span>
        </section>
        <section class="work">
          <div class="ask">
            <p class="word-meta"><span class="lang-tag"></span><span class="word-count"></span></p>
            <button class="btn btn-honey btn-big play-btn" type="button" data-act="play">${icon('play')}<span>${t('bee.hear')}</span></button>
            <div class="hints">${(mock ? ['slow', 'voice'] : HINTS.slice(1)).map(hintButton).join('')}</div>
            <div class="hint-panel" hidden></div>
            <button class="btn btn-big btn-wide hold-btn" type="button" data-act="reveal">${icon('hand')}<span>${t('bee.holdReveal')}</span></button>
            <p class="hold-help">${t('bee.holdHelp')}</p>
          </div>
          <div class="answer" hidden>
            <div class="answer-word"></div>
            <div class="answer-tiles"></div>
            <div class="tip-box" hidden></div>
            <div class="spell-row" hidden>
              <button class="btn btn-sky btn-small" type="button" data-act="spell">${icon('sentence')}<span>${t('spell.button')}</span></button>
              <p class="spell-line" aria-live="polite"></p>
            </div>
            <div class="check-row" hidden>
              <button class="btn btn-leaf btn-big" type="button" data-act="got">${icon('check')}<span>${t('bee.gotIt')}</span></button>
              <button class="btn btn-orange btn-big" type="button" data-act="notyet">${icon('sprout')}<span>${t('bee.notYet')}</span></button>
            </div>
            <button class="btn btn-honey btn-big btn-wide next-btn" type="button" data-act="next" hidden></button>
          </div>
        </section>
      </div>
      <section class="summary" hidden></section>
    </div>`;
  },

  mount(root, { params }) {
    const $ = (s) => root.querySelector(s);
    const page = $('.bee-page');
    const combs = $('.combs');
    const bubble = $('.bubble');
    const mascotSlot = $('.mascot-slot');
    const flowerEl = $('.stage-flower');
    const ask = $('.ask');
    const answer = $('.answer');
    const playBtn = $('.play-btn');
    const holdBtn = $('.hold-btn');
    const hintPanel = $('.hint-panel');
    const answerWord = $('.answer-word');
    const answerTiles = $('.answer-tiles');
    const tipBox = $('.tip-box');
    const checkRow = $('.check-row');
    const nextBtn = $('.next-btn');
    const honeyChip = $('.honey-chip');
    const timerChip = $('.timer-chip');
    const summary = $('.summary');

    const mode = params.mode || 'today';
    const queue = buildSession(params);
    const results = [];               // by queue position: true / false
    const firstTry = new Map();       // word id → first result this session
    const requeued = new Map();
    const timerSecs = mode === 'mock' ? Number(params.timer) || 0 : 0;
    let i = 0;
    let word = null;
    let state = 'listen';
    let alive = true;
    let timerId = 0;
    let timerStarted = false;
    let pendingPlay = 0;
    let voiceList = [];
    let voiceAt = 0;

    const setBubble = (text) => {
      bubble.textContent = text;
      bubble.classList.remove('pop');
      void bubble.offsetWidth;
      bubble.classList.add('pop');
    };
    const setPose = (pose) => { mascotSlot.innerHTML = mascotHTML(pose, { avatar: activeProfile()?.avatar }); };
    const setState = (s) => { state = s; page.dataset.state = s; };

    function renderCombs() {
      combs.innerHTML = queue.map((_, idx) => {
        let cls = '';
        if (idx < i || (idx === i && state === 'done')) cls = results[idx] ? 'done' : 'missed';
        else if (idx === i) cls = 'now';
        return `<span class="comb ${cls}"></span>`;
      }).join('');
    }

    function stopTimer() {
      clearInterval(timerId);
      timerId = 0;
    }
    function startTimer() {
      if (!timerSecs || timerStarted || state !== 'listen') return;
      timerStarted = true;
      let left = timerSecs;
      timerChip.hidden = false;
      timerChip.querySelector('.timer-n').textContent = num(left);
      timerId = setInterval(() => {
        left -= 1;
        timerChip.querySelector('.timer-n').textContent = num(Math.max(0, left));
        if (left <= 0) {
          stopTimer();
          setBubble(t('mock.timeUp'));
          sfx.soft();
          holdBtn.classList.add('nudge');
        }
      }, 1000);
    }

    async function play(slow = false) {
      if (!word || state !== 'listen') return;
      const current = word;
      playBtn.classList.add('is-playing');
      setBubble(t('bee.listening'));
      await sayWord(current, { slow, voice: voiceList[voiceAt] });
      if (!alive || word !== current) return;
      playBtn.classList.remove('is-playing');
      if (state === 'listen') setBubble(t('bee.writeIt'));
      startTimer();
    }

    function showHint(kind) {
      if (!word) return;
      sfx.tap();
      let html = '';
      if (kind === 'slow') { play(true); return; }
      if (kind === 'voice') {
        if (voiceList.length < 2) { setBubble(t('voice.onlyOne')); return; }
        voiceAt = (voiceAt + 1) % voiceList.length;
        play(false).then(() => {});
        setBubble(t('voice.nowSpeaking', { name: voiceName(word.lang, voiceList[voiceAt]) }));
        return;
      }
      if (kind === 'again') { play(false); return; }
      if (kind === 'meaning') {
        const order = [...new Set([getLang(), 'bn', 'en'])];
        html = order.filter((l) => word.meaning?.[l]).map((l) =>
          `<p lang="${l}" dir="${dirOf(l)}"><span class="lang-tag" data-lang="${l}">${t(`langShort.${l}`)}</span> ${escapeHtml(word.meaning[l])}</p>`).join('');
        html = `<span class="hint-label">${t('hint.meaning')}</span>${html}`;
      } else if (kind === 'sentence') {
        saySentence(word, { voice: voiceList[voiceAt] });
        html = `<span class="hint-label">${t('hint.sentence')}</span><p lang="${word.lang}" dir="${dirOf(word.lang)}">${escapeHtml(maskWord(word.sentence, word.word))}</p>`;
      } else if (kind === 'type') {
        html = `<span class="hint-label">${t('hint.type')}</span><p>${t(`type.${word.type}`)}</p>`;
      } else if (kind === 'picture' && hasArt(`word-${word.id}`)) {
        html = `<span class="hint-label">${t('hint.picture')}</span><img src="${artUrl(`word-${word.id}`)}" alt="">`;
      }
      hintPanel.innerHTML = html;
      hintPanel.hidden = !html;
    }

    function showWord() {
      word = data.byId.get(queue[i]);
      voiceList = voicesForWord(word);
      voiceAt = 0;
      setState('listen');
      stopTimer();
      timerStarted = false;
      timerChip.hidden = true;
      holdBtn.classList.remove('nudge');
      ask.hidden = false;
      answer.hidden = true;
      hintPanel.hidden = true;
      hintPanel.innerHTML = '';
      $('.lang-tag').dataset.lang = word.lang;
      $('.lang-tag').textContent = t(`langShort.${word.lang}`);
      $('.word-count').textContent = t('bee.wordOf', { n: i + 1, total: queue.length });
      root.querySelector('[data-hint="sentence"]')?.toggleAttribute('hidden', !word.sentence);
      root.querySelector('[data-hint="picture"]')?.toggleAttribute('hidden', !hasArt(`word-${word.id}`));

      flowerEl.classList.add('instant');
      setFlowerStage(flowerEl, 1);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        flowerEl.classList.remove('instant');
        setFlowerStage(flowerEl, 2);
      }));
      setPose('listen');
      setBubble(t('bee.listen'));
      renderCombs();
      setCalm(true);
      clearTimeout(pendingPlay);
      pendingPlay = setTimeout(() => { if (alive && state === 'listen') play(); }, 550);
    }

    async function reveal() {
      if (state !== 'listen') return;
      setState('reveal');
      stopTimer();
      stopAudio();
      clearTimeout(pendingPlay);
      ask.hidden = true;
      answer.hidden = false;
      answerWord.innerHTML = '';
      tipBox.hidden = true;
      checkRow.hidden = true;
      nextBtn.hidden = true;
      answerTiles.innerHTML = tilesHTML(word);
      $('.spell-row').hidden = true;
      setFlowerStage(flowerEl, 3);
      setPose('think');
      setBubble(t('bee.checkPaper'));
      await runReveal(answerTiles, { mode: settings().reveal });
      if (!alive || state !== 'reveal') return;
      answerWord.innerHTML = bigWordHTML(word);
      const tips = [pick(word.tip)];
      if ((word.lang === 'bn' || word.lang === 'ar') && word.tip?.bn && getLang() !== 'bn') tips.push(word.tip.bn);
      const tipText = tips.filter(Boolean);
      if (tipText.length) {
        tipBox.innerHTML = `${icon('tip')}<div>${tipText.map((s, k) => `<p ${k ? 'lang="bn"' : ''}>${escapeHtml(s)}</p>`).join('')}</div>`;
        tipBox.hidden = false;
      }
      const spellRow = $('.spell-row');
      spellRow.hidden = !canSpellAloud(word);
      spellRow.querySelector('.spell-line').innerHTML = '';
      checkRow.hidden = false;
      setState('check');
      setBubble(t('bee.didYouGetIt'));
      checkRow.querySelector('[data-act="got"]').focus({ preventScroll: true });
    }

    function answerWith(got) {
      if (state !== 'check') return;
      setState('done');
      const { goalReached } = recordResult(word.id, got);
      if (goalReached) setTimeout(() => celebrateGoal(), 900);
      if (!firstTry.has(word.id)) firstTry.set(word.id, got);
      results[i] = got;
      checkRow.hidden = true;
      if (got) {
        setFlowerStage(flowerEl, 4);
        petalBurst(flowerEl);
        sfx.chime();
        setPose('cheer');
        const n = 1 + Math.floor(Math.random() * 6);
        setBubble(t(`praise.${n}`));
        honeyFly(flowerEl, honeyChip);
        setTimeout(() => { if (alive) $('.honey-n').textContent = num(honeyBalance()); }, 750);
      } else {
        setFlowerStage(flowerEl, 5);
        sfx.soft();
        setPose('oops');
        const times = requeued.get(word.id) || 0;
        if (mode !== 'mock' && times < 2) {
          queue.splice(requeuePosition(i, queue.length), 0, word.id);
          requeued.set(word.id, times + 1);
          setBubble(t('bee.comeBack'));
        } else {
          setBubble(t('bee.keepGoing'));
        }
      }
      renderCombs();
      setCalm(false);
      nextBtn.innerHTML = i === queue.length - 1
        ? `${icon('trophy')}<span>${t('bee.finish')}</span>`
        : `<span>${t('bee.next')}</span>${icon('next', { className: 'flip-rtl' })}`;
      nextBtn.hidden = false;
      nextBtn.focus({ preventScroll: true });
    }

    function celebrateGoal() {
      if (!alive) return;
      sfx.badge();
      confetti(70);
      toast(t('honey.goalToast'), 4000);
    }

    function next() {
      if (state !== 'done') return;
      i += 1;
      if (i >= queue.length) showSummary();
      else showWord();
    }

    function showSummary() {
      setState('summary');
      setCalm(false);
      stopTimer();
      const ids = [...firstTry.keys()];
      const missed = ids.filter((id) => !firstTry.get(id));
      const right = ids.length - missed.length;
      const p = finishSession({ mode, total: ids.length, firstTry: right, missed });
      const qualified = qualifyingBadges(p, data.words, { total: ids.length, firstTry: right });
      const fresh = [...qualified].filter((id) => awardBadge(id));
      const name = `<bdi>${escapeHtml(activeProfile()?.name || '')}</bdi>`;

      const badgeBits = fresh.map((id) => {
        const b = BADGES.find((x) => x.id === id);
        return b ? `<div class="badge-item"><div class="badge-pic">${badgeHTML(b, icon(b.icon, { size: 24 }))}</div><span>${t(`badge.${id}`)}</span></div>` : '';
      }).join('');
      const missedChips = missed.map((id) => {
        const w = data.byId.get(id);
        return `<button class="chip word-chip" type="button" data-say="${id}" lang="${w.lang}" dir="${dirOf(w.lang)}">${icon('play')}<span>${escapeHtml(w.word)}</span></button>`;
      }).join('');

      root.querySelector('.bee-main').hidden = true;
      combs.hidden = true;
      summary.hidden = false;
      summary.innerHTML = `<div class="card summary-card">
        <div class="summary-top">
          <div class="summary-mascot">${mascotHTML(missed.length ? 'cheer' : 'trophy', { avatar: activeProfile()?.avatar })}</div>
          <div>
            <h2>${missed.length ? t('summary.titleGood', { name }) : t('summary.titlePerfect', { name })}</h2>
            <p class="lead">${missed.length ? tn('summary.leadMissed', missed.length) : t('summary.leadPerfect')}</p>
          </div>
        </div>
        <div class="summary-stats">
          <div class="stat stat-leaf"><span class="stat-n">${num(right)}</span><span class="stat-l">${t('summary.bloomed')}</span></div>
          <div class="stat stat-orange"><span class="stat-n">${num(missed.length)}</span><span class="stat-l">${t('summary.toPractise')}</span></div>
          <div class="stat stat-honey"><span class="stat-n">${num(p.streak?.count || 1)}</span><span class="stat-l">${t('summary.streak')}</span></div>
        </div>
        <div class="mini-garden" aria-hidden="true">${ids.map((id) => `<div class="mini-plant">${flowerHTML(firstTry.get(id) ? 4 : 1)}</div>`).join('')}</div>
        ${badgeBits ? `<div class="new-badges"><h3>${t('summary.newBadges')}</h3><div class="badge-row">${badgeBits}</div></div>` : ''}
        ${missedChips ? `<div class="missed"><h3>${t('summary.missedTitle')}</h3><div class="word-chips">${missedChips}</div></div>` : ''}
        <div class="summary-actions">
          ${missed.length ? `<button class="btn btn-orange btn-big" type="button" data-act="retry">${icon('again')}<span>${t('summary.retry')}</span></button>` : ''}
          <a class="btn btn-honey btn-big" href="#/">${icon('home')}<span>${t('summary.home')}</span></a>
        </div>
      </div>`;
      sfx.tada();
      if (fresh.length) setTimeout(() => sfx.badge(), 900);
      confetti(missed.length ? 40 : 90);
      summary.querySelector('h2')?.focus?.();
      summary.dataset.missed = missed.join(',');
    }

    async function exit() {
      if (state !== 'summary' && firstTry.size > 0) {
        stopAudio();
        const stop = await confirmDialog({
          title: t('bee.exitTitle'), message: t('bee.exitMessage'),
          yes: t('bee.exitStop'), no: t('bee.exitKeep'), pose: 'oops',
        });
        if (!stop || !alive) return;
        const ids = [...firstTry.keys()];
        const missed = ids.filter((id) => !firstTry.get(id));
        finishSession({ mode, total: ids.length, firstTry: ids.length - missed.length, missed, partial: true });
      }
      go('');
    }

    const onClick = (e) => {
      const hint = e.target.closest('[data-hint]');
      if (hint) return showHint(hint.dataset.hint);
      const say = e.target.closest('[data-say]');
      if (say) return sayWord(data.byId.get(say.dataset.say));
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'spell') {
        const line = root.querySelector('.spell-line');
        const tileEls = [...answerTiles.querySelectorAll('.tile:not(.tile-space)')];
        spellAloud(word, (k, piece) => {
          tileEls.forEach((el, n) => el.classList.toggle('walk', n === k));
          if (piece) line.innerHTML = `<span lang="${word.lang}">${escapeHtml(piece.name)}</span>`;
        });
        return;
      }
      if (act === 'play') play();
      else if (act === 'got') answerWith(true);
      else if (act === 'notyet') answerWith(false);
      else if (act === 'next') next();
      else if (act === 'exit') exit();
      else if (act === 'retry') go('bee', { mode: 'retry', ids: summary.dataset.missed });
      else if (act === 'honey-info') toast(t('honey.explainShort'), 4200);
    };
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey) return;
      if (document.querySelector('.dialog-backdrop')) return; // a question is open
      const k = e.key.toLowerCase();
      if (state === 'listen' && k === ' ' && document.activeElement !== holdBtn && !e.repeat) {
        e.preventDefault();
        play();
      } else if (state === 'check' && (k === 'y' || k === 'n')) {
        answerWith(k === 'y');
      }
    };
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    const stopHold = holdButton(holdBtn, 900, reveal, () => setBubble(t('bee.holdLonger')));

    if (!queue.length) {
      root.querySelector('.bee-main').hidden = true;
      combs.hidden = true;
      summary.hidden = false;
      summary.innerHTML = `<div class="card summary-card empty-card">
        <div class="summary-mascot">${mascotHTML('cheer')}</div>
        <h2>${mode === 'hive' ? t('hive.empty') : t('bee.nothing')}</h2>
        <a class="btn btn-honey btn-big" href="#/">${icon('home')}<span>${t('summary.home')}</span></a>
      </div>`;
    } else {
      showWord();
    }

    return () => {
      alive = false;
      stopTimer();
      clearTimeout(pendingPlay);
      stopHold();
      stopAudio();
      setCalm(false);
      root.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  },
};
