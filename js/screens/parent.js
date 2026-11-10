// Parent Corner: check every word against the paper list, re-record audio, see progress, print sheets.
import { data, reloadAudioIndex } from '../data.js';
import { profiles, progress, activeProfile, wordChecked, setWordChecked, resetProgress } from '../store.js';
import { t, tn, escapeHtml, dirOf, pick, num } from '../i18n.js';
import { icon } from '../icons.js';
import { topbar, toast, go, confirmDialog } from '../ui.js';
import { sayWord, saySentence, bustAudio, stopAudio } from '../audio.js';
import { setAmbienceMuted } from '../ambience.js';
import { mascotHTML } from '../art.js';
import { tilesHTML } from '../reveal.js';
import { isTricky, isMastered, isSeen, MAX_BOX } from '../scheduler.js';
import { reportTab, mountReport, reportRows } from '../report.js';

const TABS = ['report', 'words', 'progress', 'print'];
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

/** A take as 16-bit mono WAV, trimmed to the voice. Browsers record in their own formats (Chrome's .m4a
 *  holds Opus, which the Mac can't convert and the iPad may not play); the Mac turns WAV into the app's .m4a. */
async function toWav(blob) {
  const audio = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(await blob.arrayBuffer());
  const n = audio.length, rate = audio.sampleRate;
  const mono = new Float32Array(n);
  for (let c = 0; c < audio.numberOfChannels; c++) audio.getChannelData(c).forEach((v, i) => { mono[i] += v / audio.numberOfChannels; });
  // Leave out the quiet before and after the voice, keeping a short breath of room.
  const peak = mono.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  let a = 0, b = n - 1;
  while (a < b && Math.abs(mono[a]) < peak * 0.05) a++;
  while (b > a && Math.abs(mono[b]) < peak * 0.05) b--;
  const pad = Math.round(rate * 0.2);
  const part = mono.subarray(Math.max(0, a - pad), Math.min(n, b + pad));
  const out = new DataView(new ArrayBuffer(44 + part.length * 2));
  const text = (at, s) => [...s].forEach((ch, i) => out.setUint8(at + i, ch.charCodeAt(0)));
  text(0, 'RIFF'); out.setUint32(4, 36 + part.length * 2, true); text(8, 'WAVEfmt '); out.setUint32(16, 16, true);
  out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true);
  out.setUint16(32, 2, true); out.setUint16(34, 16, true); text(36, 'data'); out.setUint32(40, part.length * 2, true);
  part.forEach((v, i) => out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true));
  return new Blob([out], { type: 'audio/wav' });
}

function sourceLabel(id, kind) {
  const entry = data.audio[id] || {};
  const src = kind === 'word' ? entry.wordSource : entry.sentenceSource;
  if (src === 'recording') return t('parent.srcRecording');
  if (src && src.startsWith('dictionary')) return t('parent.srcDictionary');
  if (src && src.startsWith('neural')) return t('parent.srcNeural');
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
      <p class="sub rec-where" hidden>${t('parent.recWhere')}</p>
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
    const tab = TABS.includes(params.tab) ? params.tab : 'report';
    const pid = params.who || activeProfile()?.id || profiles()[0]?.id;
    const tabs = TABS.map((x) => `<a class="tab ${x === tab ? 'is-on' : ''}" href="#/parent?tab=${x}" ${x === tab ? 'aria-current="page"' : ''}>${t(`parent.tab.${x}`)}</a>`).join('');
    const range = Number(params.range) === 14 ? 14 : 7;
    const body = tab === 'report' ? reportTab(pid, range) : tab === 'progress' ? progressTab(pid) : tab === 'print' ? printTab(params.kind || 'tricky', pid) : wordsTab(params.f || 'all');
    return `<div class="page parent-page">
      ${topbar({ title: t('parent.title'), back: activeProfile() ? 'home' : 'profiles' })}
      <nav class="tabs no-print">${tabs}</nav>
      ${body}
    </div>`;
  },

  mount(root, { params }) {
    checkRecording().then((ok) => {
      if (!ok) return;
      root.querySelectorAll('.rec-btn').forEach((b) => { b.hidden = false; });
      const note = root.querySelector('.rec-note');
      if (note) note.hidden = true;
      const where = root.querySelector('.rec-where');
      if (where) where.hidden = false;
    });

    // ---------- Recording: a dialog to record, listen to both versions, then choose ----------
    let closeRecorder = null;

    function openRecorder(id, kind) {
      const w = data.byId.get(id);
      stopAudio();
      const before = document.activeElement;
      const wrap = document.createElement('div');
      wrap.className = 'dialog-backdrop';
      wrap.innerHTML = `<div class="dialog card rec-dialog" role="dialog" aria-modal="true" aria-labelledby="rec-title">
          <div class="dialog-mascot" aria-hidden="true">${mascotHTML('listen')}</div>
          <h2 id="rec-title">${t(kind === 'word' ? 'parent.recTitleWord' : 'parent.recTitleSentence')}</h2>
          <p class="rec-text" lang="${w.lang}" dir="${dirOf(w.lang)}" data-kind="${kind}">${escapeHtml(kind === 'word' ? w.word : w.sentence)}</p>
          <p class="sub">${t('parent.recHint')}</p>
          <div class="rec-rows">
            <div class="rec-row">
              <span class="rec-row-label">${t('parent.recNow')}<small>${sourceLabel(id, kind)}</small></span>
              <button class="btn btn-small btn-cream" type="button" data-r="now">${icon('play')}<span>${t('parent.recPlay')}</span></button>
            </div>
            <div class="rec-row rec-new">
              <span class="rec-row-label">${t('parent.recNew')}<small data-r="state">${t('parent.recNone')}</small></span>
              <button class="btn btn-small btn-cream rec-btn" type="button" data-r="rec">${icon('mic')}<span>${t('parent.record')}</span></button>
              <button class="btn btn-small btn-cream" type="button" data-r="new" disabled>${icon('play')}<span>${t('parent.recPlay')}</span></button>
            </div>
          </div>
          <div class="dialog-actions">
            <button class="btn btn-honey" type="button" data-r="use" disabled>${t('parent.recUse')}</button>
            <button class="btn btn-cream" type="button" data-r="keep">${t('parent.recKeep')}</button>
          </div>
        </div>`;
      const $ = (r) => wrap.querySelector(`[data-r="${r}"]`);
      let recorder = null, stream = null, stopTimer = 0, take = null, takeUrl = '', preview = null, saving = false;

      const stopPreview = () => { preview?.pause(); preview = null; };
      const playTake = () => { stopAudio(); stopPreview(); preview = new Audio(takeUrl); preview.play().catch(() => {}); };
      const setRecButton = (on) => {
        $('rec').classList.toggle('is-recording', on);
        $('rec').innerHTML = `${icon(on ? 'stop' : 'mic')}<span>${t(on ? 'parent.stop' : take ? 'parent.recAgain' : 'parent.record')}</span>`;
      };
      function endStream() {
        stream?.getTracks().forEach((tr) => tr.stop());
        stream = null;
        setAmbienceMuted(false);
      }
      async function start() {
        try {
          stopAudio(); stopPreview();
          setAmbienceMuted(true);   // no garden sounds in the recording
          stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          await new Promise((r) => setTimeout(r, 400));   // let them fade out first
          if (!wrap.isConnected) return endStream();
          const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported?.(m)) || '';
          const chunks = [];
          recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
          recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
          recorder.onstop = async () => {
            const raw = new Blob(chunks, { type: (recorder.mimeType || type || 'audio/webm').split(';')[0] });
            recorder = null;
            endStream();
            take = (await toWav(raw).catch(() => null)) || raw;   // what she would hear: trimmed, as it will be saved
            if (takeUrl) URL.revokeObjectURL(takeUrl);
            takeUrl = URL.createObjectURL(take);
            setRecButton(false);
            $('new').disabled = false;
            $('use').disabled = false;
            $('state').textContent = t('parent.recReady');
            if (wrap.isConnected) playTake();
          };
          recorder.start();
          setRecButton(true);
          $('state').textContent = t('parent.recListening');
          stopTimer = setTimeout(stop, kind === 'sentence' ? 12000 : 6000);
        } catch {
          recorder = null;
          endStream();
          toast(t('parent.micDenied'));
        }
      }
      function stop() {
        clearTimeout(stopTimer);
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      }
      // Only now is the recording saved: it replaces the one in the app.
      async function use() {
        if (!take || saving) return;
        saving = true;
        $('use').disabled = true;
        try {
          const res = await fetch(`api/recording?id=${encodeURIComponent(id)}&kind=${kind}`, {
            method: 'POST', headers: { 'Content-Type': take.type }, body: take,
          });
          if (!res.ok) throw new Error(await res.text());
          await reloadAudioIndex();
          bustAudio(id);
          const src = root.querySelector(`[data-rec="${id}"][data-kind="${kind}"]`)?.parentElement?.querySelector('.wc-src');
          if (src) src.textContent = t('parent.srcRecording');
          toast(t('parent.saved'));
          close();
        } catch {
          saving = false;
          $('use').disabled = false;
          toast(t('parent.saveFailed'));
        }
      }
      function close() {
        if (!wrap.isConnected || wrap.classList.contains('closing')) return;
        clearTimeout(stopTimer);
        if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; recorder.stop(); }
        recorder = null;
        endStream();
        stopPreview();
        stopAudio();
        if (takeUrl) URL.revokeObjectURL(takeUrl);
        document.removeEventListener('keydown', onKey, true);
        wrap.classList.add('closing');
        setTimeout(() => wrap.remove(), 160);
        closeRecorder = null;
        if (before?.focus) before.focus({ preventScroll: true });
      }
      const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
      wrap.addEventListener('click', (e) => {
        if (e.target === wrap) { if (!recorder) close(); return; }
        const b = e.target.closest('[data-r]');
        if (!b || b.disabled) return;
        const r = b.dataset.r;
        if (r === 'now') { stopPreview(); if (kind === 'word') sayWord(w); else saySentence(w); }
        else if (r === 'rec') { if (recorder) stop(); else start(); }
        else if (r === 'new') playTake();
        else if (r === 'use') use();
        else if (r === 'keep') close();
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(wrap);
      $('rec').focus({ preventScroll: true });
      closeRecorder = close;
    }

    const onClick = (e) => {
      const el = e.target.closest('[data-play], [data-play-s], [data-rec], [data-act]');
      if (!el) return;
      if (el.dataset.play) sayWord(data.byId.get(el.dataset.play));
      else if (el.dataset.playS) saySentence(data.byId.get(el.dataset.playS));
      else if (el.dataset.rec) openRecorder(el.dataset.rec, el.dataset.kind);
      else if (el.dataset.act === 'print') window.print();
      else if (el.dataset.act === 'reset') {
        confirmDialog({
          title: t('parent.resetTitle'), message: t('parent.resetConfirm'),
          yes: t('parent.resetYes'), no: t('common.cancel'), yesTone: 'berry', noTone: 'cream',
        }).then((yes) => {
          if (!yes) return;
          resetProgress(el.dataset.pid);
          toast(t('parent.resetDone'));
          go('parent', { tab: 'progress' });
        });
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
      else if (el.name === 'who') go('parent', { tab: params.tab || 'report', who: el.value, ...(params.range ? { range: params.range } : {}) });
      else if (el.name === 'range') go('parent', { tab: 'report', range: el.value, ...(params.who ? { who: params.who } : {}) });
      else if (el.name === 'pkind') go('parent', { tab: 'print', kind: el.value });
    };
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    const tab = TABS.includes(params.tab) ? params.tab : 'report';
    const pid = params.who || activeProfile()?.id || profiles()[0]?.id;
    const stopReport = tab === 'report' ? mountReport(root, reportRows(pid, Number(params.range) === 14 ? 14 : 7)) : null;
    return () => {
      stopReport?.();
      closeRecorder?.();
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
    };
  },
};
