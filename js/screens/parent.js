// Parent Corner: check every word against the paper list, re-record audio, see progress, print sheets.
import { data, reloadAudioIndex } from '../data.js';
import { profiles, progress, activeProfile, wordChecked, setWordChecked, resetProgress } from '../store.js';
import { t, tn, escapeHtml, dirOf, pick, num } from '../i18n.js';
import { icon } from '../icons.js';
import { topbar, toast, go } from '../ui.js';
import { sayWord, saySentence, bustAudio, stopAudio } from '../audio.js';
import { tilesHTML } from '../reveal.js';
import { isTricky, isMastered, isSeen, MAX_BOX } from '../scheduler.js';

const TABS = ['words', 'progress', 'print'];
let canRecord = null;

async function checkRecording() {
  if (canRecord !== null) return canRecord;
  canRecord = false;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return false;
  try {
    const res = await fetch('api/ping', { cache: 'no-store' });
    canRecord = res.ok && (await res.json()).canRecord === true;
  } catch { canRecord = false; }
  return canRecord;
}

function sourceLabel(id, kind) {
  const entry = data.audio[id] || {};
  const src = kind === 'word' ? entry.wordSource : entry.sentenceSource;
  if (src === 'recording') return t('parent.srcRecording');
  if (src && src.startsWith('dictionary')) return t('parent.srcDictionary');
  return entry[kind] ? t('parent.srcVoice') : t('parent.srcDevice');
}

function wordsTab(filter) {
  const words = data.words.filter((w) => filter === 'all' || w.lang === filter);
  const checked = data.words.filter((w) => wordChecked(w.id)).length;
  const filters = ['all', ...data.lists.map((l) => l.lang)].map((f) => `
    <label class="choice"><input type="radio" name="wfilter" value="${f}" ${f === filter ? 'checked' : ''}><span>${f === 'all' ? t('parent.all') : t(`langShort.${f}`)}</span></label>`).join('');

  const cards = words.map((w) => {
    const meanings = ['en', 'bn'].filter((l) => w.meaning?.[l]).map((l) =>
      `<p lang="${l}"><span class="lang-tag" data-lang="${l}">${t(`langShort.${l}`)}</span> ${escapeHtml(w.meaning[l])}</p>`).join('');
    return `<article class="card card-tight wc-card ${wordChecked(w.id) ? 'is-checked' : ''}" data-id="${w.id}">
      <div class="wc-head">
        <span class="lang-tag" data-lang="${w.lang}">${t(`langShort.${w.lang}`)}</span>
        <span class="wc-n">#${num(w.n)}</span>
        <label class="wc-ok"><input type="checkbox" data-check="${w.id}" ${wordChecked(w.id) ? 'checked' : ''}><span>${t('parent.matches')}</span></label>
      </div>
      <div class="wc-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</div>
      ${tilesHTML(w, { open: true, covers: false })}
      <div class="wc-meta">
        ${meanings}
        ${w.sentence ? `<p lang="${w.lang}" dir="${dirOf(w.lang)}"><span class="hint-label">${t('hint.sentence')}</span> ${escapeHtml(w.sentence)}</p>` : ''}
        <p><span class="hint-label">${t('bee.tip')}</span> ${escapeHtml(pick(w.tip))}</p>
        ${w.check ? `<p class="wc-note">${icon('tip')} ${escapeHtml(w.check)}</p>` : ''}
      </div>
      <div class="wc-audio">
        <div class="wc-audio-row">
          <button class="btn btn-small btn-honey" type="button" data-play="${w.id}">${icon('play')}<span>${t('parent.playWord')}</span></button>
          <span class="wc-src">${sourceLabel(w.id, 'word')}</span>
          <button class="btn btn-small btn-cream rec-btn" type="button" data-rec="${w.id}" data-kind="word" hidden>${icon('mic')}<span>${t('parent.record')}</span></button>
        </div>
        ${w.sentence ? `<div class="wc-audio-row">
          <button class="btn btn-small btn-cream" type="button" data-play-s="${w.id}">${icon('sentence')}<span>${t('parent.playSentence')}</span></button>
          <span class="wc-src">${sourceLabel(w.id, 'sentence')}</span>
          <button class="btn btn-small btn-cream rec-btn" type="button" data-rec="${w.id}" data-kind="sentence" hidden>${icon('mic')}<span>${t('parent.record')}</span></button>
        </div>` : ''}
      </div>
    </article>`;
  }).join('');

  return `<section class="card parent-intro">
      <p>${t('parent.wordsIntro')}</p>
      <p class="sub">${t('parent.checkedCount', { n: num(checked), total: num(data.words.length) })}</p>
      <p class="sub rec-note">${t('parent.recNote')}</p>
      <div class="choices">${filters}</div>
    </section>
    <div class="wc-grid">${cards}</div>`;
}

function progressTab(pid) {
  const recs = progress(pid).words;
  const people = profiles();
  const who = people.map((p) => `<label class="choice"><input type="radio" name="who" value="${p.id}" ${p.id === pid ? 'checked' : ''}><span>${escapeHtml(p.name)}</span></label>`).join('');
  const rows = [...data.words].sort((a, b) => {
    const ra = recs[a.id] || {}, rb = recs[b.id] || {};
    return (rb.misses || 0) - (ra.misses || 0) || (ra.box || 0) - (rb.box || 0);
  }).map((w) => {
    const r = recs[w.id] || {};
    const status = isMastered(r) ? t('parent.stMastered') : isTricky(r) ? t('parent.stTricky') : isSeen(r) ? t('parent.stLearning') : t('parent.stNew');
    return `<tr>
      <td><span class="lang-tag" data-lang="${w.lang}">${t(`langShort.${w.lang}`)}</span></td>
      <td lang="${w.lang}" dir="${dirOf(w.lang)}" class="pt-word">${escapeHtml(w.word)}</td>
      <td>${num(r.attempts || 0)}</td><td>${num(r.correct || 0)}</td><td>${num(r.misses || 0)}</td>
      <td>${num(r.box || 0)}/${num(MAX_BOX)}</td><td>${status}</td><td>${r.last || '—'}</td>
    </tr>`;
  }).join('');
  const all = data.words.map((w) => recs[w.id]);
  return `<section class="card parent-intro">
      ${people.length > 1 ? `<div class="choices">${who}</div>` : ''}
      <div class="summary-stats">
        <div class="stat stat-leaf"><span class="stat-n">${num(all.filter(isMastered).length)}</span><span class="stat-l">${t('parent.stMastered')}</span></div>
        <div class="stat stat-orange"><span class="stat-n">${num(all.filter(isTricky).length)}</span><span class="stat-l">${t('parent.stTricky')}</span></div>
        <div class="stat stat-honey"><span class="stat-n">${num(all.filter((r) => !isSeen(r)).length)}</span><span class="stat-l">${t('parent.stNew')}</span></div>
      </div>
    </section>
    <section class="card table-card">
      <table class="progress-table">
        <thead><tr><th></th><th>${t('parent.colWord')}</th><th>${t('parent.colTries')}</th><th>${t('parent.colRight')}</th><th>${t('parent.colMissed')}</th><th>${t('parent.colLevel')}</th><th>${t('parent.colStatus')}</th><th>${t('parent.colLast')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <button class="btn btn-cream" type="button" data-act="reset" data-pid="${pid}">${icon('trash')}<span>${t('parent.reset')}</span></button>`;
}

function printTab(kind, pid) {
  const recs = progress(pid).words;
  const words = kind === 'tricky' ? data.words.filter((w) => isTricky(recs[w.id])) : data.words;
  const byList = data.lists.map((l) => {
    const ws = words.filter((w) => w.listId === l.id);
    if (!ws.length) return '';
    return `<section class="print-list">
      <h3>${escapeHtml(pick(l.title))}</h3>
      <ol class="print-words">${ws.map((w) => `<li><span class="pn">${num(w.n)}.</span><span class="pw" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</span><span class="pw-lines" aria-hidden="true"></span></li>`).join('')}</ol>
    </section>`;
  }).join('');
  return `<section class="card parent-intro no-print">
      <div class="choices">
        <label class="choice"><input type="radio" name="pkind" value="tricky" ${kind === 'tricky' ? 'checked' : ''}><span>${t('parent.printTricky')}</span></label>
        <label class="choice"><input type="radio" name="pkind" value="all" ${kind === 'all' ? 'checked' : ''}><span>${t('parent.printAll')}</span></label>
      </div>
      <button class="btn btn-honey" type="button" data-act="print">${icon('print')}<span>${t('parent.print')}</span></button>
    </section>
    <div class="card print-sheet">
      <h2>${kind === 'tricky' ? t('parent.printTricky') : t('parent.printAll')}</h2>
      <p class="sub">${escapeHtml(activeProfile()?.name || '')} · ${new Date().toLocaleDateString()}</p>
      ${byList || `<p>${t('hive.empty')}</p>`}
    </div>`;
}

export default {
  title: () => t('parent.title'),

  render({ params }) {
    const tab = TABS.includes(params.tab) ? params.tab : 'words';
    const pid = params.who || activeProfile()?.id || profiles()[0]?.id;
    const tabs = TABS.map((x) => `<a class="tab ${x === tab ? 'is-on' : ''}" href="#/parent?tab=${x}" ${x === tab ? 'aria-current="page"' : ''}>${t(`parent.tab.${x}`)}</a>`).join('');
    const body = tab === 'progress' ? progressTab(pid) : tab === 'print' ? printTab(params.kind || 'tricky', pid) : wordsTab(params.f || 'all');
    return `<div class="page parent-page">
      ${topbar({ title: t('parent.title'), back: activeProfile() ? 'home' : 'profiles' })}
      <nav class="tabs no-print">${tabs}</nav>
      ${body}
    </div>`;
  },

  mount(root, { params }) {
    let recorder = null;
    let chunks = [];
    let stopTimer = 0;

    checkRecording().then((ok) => {
      if (!ok) return;
      root.querySelectorAll('.rec-btn').forEach((b) => { b.hidden = false; });
      const note = root.querySelector('.rec-note');
      if (note) note.hidden = true;
    });

    async function startRecording(btn) {
      if (recorder) return stopRecording();
      try {
        stopAudio();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported?.(m)) || '';
        recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        chunks = [];
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((tr) => tr.stop());
          const blob = new Blob(chunks, { type: (recorder.mimeType || type || 'audio/webm').split(';')[0] });
          recorder = null;
          btn.classList.remove('is-recording');
          btn.innerHTML = `${icon('mic')}<span>${t('parent.record')}</span>`;
          await upload(btn.dataset.rec, btn.dataset.kind, blob);
        };
        recorder.start();
        btn.classList.add('is-recording');
        btn.innerHTML = `${icon('stop')}<span>${t('parent.stop')}</span>`;
        stopTimer = setTimeout(stopRecording, btn.dataset.kind === 'sentence' ? 12000 : 6000);
      } catch {
        recorder = null;
        toast(t('parent.micDenied'));
      }
    }
    function stopRecording() {
      clearTimeout(stopTimer);
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    }
    async function upload(id, kind, blob) {
      try {
        const res = await fetch(`api/recording?id=${encodeURIComponent(id)}&kind=${kind}`, {
          method: 'POST', headers: { 'Content-Type': blob.type }, body: blob,
        });
        if (!res.ok) throw new Error(await res.text());
        await reloadAudioIndex();
        bustAudio(id);
        toast(t('parent.saved'));
        const w = data.byId.get(id);
        if (kind === 'word') sayWord(w); else saySentence(w);
        const src = root.querySelector(`[data-rec="${id}"][data-kind="${kind}"]`)?.parentElement?.querySelector('.wc-src');
        if (src) src.textContent = t('parent.srcRecording');
      } catch {
        toast(t('parent.saveFailed'));
      }
    }

    const onClick = (e) => {
      const el = e.target.closest('[data-play], [data-play-s], [data-rec], [data-act]');
      if (!el) return;
      if (el.dataset.play) sayWord(data.byId.get(el.dataset.play));
      else if (el.dataset.playS) saySentence(data.byId.get(el.dataset.playS));
      else if (el.dataset.rec) startRecording(el);
      else if (el.dataset.act === 'print') window.print();
      else if (el.dataset.act === 'reset') {
        if (window.confirm(t('parent.resetConfirm'))) {
          resetProgress(el.dataset.pid);
          toast(t('parent.resetDone'));
          go('parent', { tab: 'progress' });
        }
      }
    };
    const onChange = (e) => {
      const el = e.target;
      if (el.dataset.check) {
        setWordChecked(el.dataset.check, el.checked);
        el.closest('.wc-card')?.classList.toggle('is-checked', el.checked);
        const checked = data.words.filter((w) => wordChecked(w.id)).length;
        const sub = root.querySelector('.parent-intro .sub');
        if (sub) sub.textContent = t('parent.checkedCount', { n: num(checked), total: num(data.words.length) });
      } else if (el.name === 'wfilter') go('parent', { tab: 'words', f: el.value });
      else if (el.name === 'who') go('parent', { tab: params.tab || 'progress', who: el.value });
      else if (el.name === 'pkind') go('parent', { tab: 'print', kind: el.value });
    };
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => {
      stopRecording();
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
    };
  },
};
