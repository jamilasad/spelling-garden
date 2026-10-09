// Parent Corner → Report: how practice is going this week, readiness per language, and focus words.
// Chart colours were checked with the colour-blind validator (dataviz skill):
//   daily answers — right #2E8B47 / not yet #9B5DE5 (passes CVD + contrast on white)
//   readiness     — ordinal green ramp, not started → blooming (passes monotone + contrast)
import { data } from './data.js';
import { progress, profiles, settings } from './store.js';
import { t, tn, num, escapeHtml, dirOf, pick, getLang } from './i18n.js';
import { icon } from './icons.js';
import { dayString, addDays, daysBetween, isMastered, isTricky, isSeen } from './scheduler.js';
import { sayWord } from './audio.js';

const DAILY = { right: '#2E8B47', notYet: '#9B5DE5' };
const READY = ['#7FC48B', '#4FA862', '#2E8A47', '#17602F']; // not started, tricky, learning, blooming
const READY_KEYS = ['notStarted', 'tricky', 'learning', 'blooming'];

function dayData(p, day) {
  const d = p.days?.[day];
  if (d) return { test: 0, right: 0, learn: 0, game: 0, seconds: 0, ...d };
  // Practice from before daily tracking existed: rebuild from the session log.
  const ss = (p.sessions || []).filter((s) => s.day === day);
  return {
    test: ss.reduce((n, s) => n + (s.total || 0), 0),
    right: ss.reduce((n, s) => n + (s.firstTry || 0), 0),
    learn: 0, game: 0, seconds: 0,
  };
}

const minutesText = (sec) => {
  const m = Math.round(sec / 60);
  if (m < 60) return t('report.min', { n: m });
  return t('report.hmin', { h: Math.floor(m / 60), m: m % 60 });
};

function niceMax(v) {
  if (v <= 4) return 4;
  const steps = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200];
  return steps.find((s) => s >= v) || Math.ceil(v / 50) * 50;
}

/** Column with square base and 4px rounded data-end. */
function colPath(x, y, w, h, round) {
  if (h <= 0) return '';
  const r = round ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h}V${y + r}${r ? `Q${x},${y} ${x + r},${y}` : ''}H${x + w - r}${r ? `Q${x + w},${y} ${x + w},${y + r}` : ''}V${y + h}Z`;
}

function dailyChart(rows) {
  const W = 640, H = 230, L = 34, R = 8, T = 18, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const max = niceMax(Math.max(0, ...rows.map((r) => r.test)));
  const band = pw / rows.length;
  const bw = Math.min(24, band * 0.6);
  const y = (v) => T + ph - (v / max) * ph;
  const ticks = [0, max / 2, max];
  const fmt = new Intl.DateTimeFormat(getLang(), rows.length <= 7 ? { weekday: 'short' } : { day: 'numeric' });

  let svg = ticks.map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#E9E2D6" stroke-width="1"/>
    <text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="ax">${num(v)}</text>`).join('');
  rows.forEach((r, i) => {
    const cx = L + band * i + band / 2;
    const x = cx - bw / 2;
    const notYet = Math.max(0, r.test - r.right);
    const hRight = (r.right / max) * ph;
    const hNot = (notYet / max) * ph;
    const base = T + ph;
    const gap = r.right && notYet ? 2 : 0;
    svg += `<path d="${colPath(x, base - hRight, bw, hRight, !notYet)}" fill="${DAILY.right}"/>`;
    svg += `<path d="${colPath(x, base - hRight - gap - hNot, bw, hNot, true)}" fill="${DAILY.notYet}"/>`;
    if (r.test) svg += `<text x="${cx}" y="${base - hRight - gap - hNot - 5}" text-anchor="middle" class="val">${num(r.test)}</text>`;
    const label = i === rows.length - 1 ? t('report.today') : fmt.format(new Date(`${r.day}T12:00:00`));
    svg += `<text x="${cx}" y="${H - 9}" text-anchor="middle" class="ax">${escapeHtml(label)}</text>`;
    svg += `<rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${ph}" fill="transparent" tabindex="0" data-i="${i}" aria-label="${escapeHtml(label)}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart-svg" role="img" aria-label="${t('report.dailyTitle')}">${svg}</svg>`;
}

function readinessBars(p) {
  return data.lists.map((l) => {
    const ws = data.words.filter((w) => w.listId === l.id);
    const recs = ws.map((w) => p.words[w.id]);
    const counts = {
      notStarted: recs.filter((r) => !isSeen(r)).length,
      tricky: recs.filter(isTricky).length,
      blooming: recs.filter(isMastered).length,
    };
    counts.learning = ws.length - counts.notStarted - counts.tricky - counts.blooming;
    const segs = READY_KEYS.filter((k) => counts[k] > 0).map((k) => {
      const i = READY_KEYS.indexOf(k);
      const share = (counts[k] / ws.length) * 100;
      const ink = i >= 2 ? '#FFFFFF' : '#1E3B24';
      const label = share >= 9 ? `<span style="color:${ink}">${num(counts[k])}</span>` : '';
      return `<span class="seg" style="flex-basis:${share}%;background:${READY[i]}" tabindex="0"
        data-tip="${escapeHtml(`${pick(l.title)} · ${t(`report.st.${k}`)}: ${tn('report.words', counts[k])}`)}">${label}</span>`;
    }).join('');
    return `<div class="ready-row">
      <span class="ready-name"><span class="lang-tag" data-lang="${l.lang}">${t(`langShort.${l.lang}`)}</span> ${escapeHtml(pick(l.title))}</span>
      <span class="ready-bar">${segs}</span>
      <span class="ready-total">${t('report.bloomingOf', { n: counts.blooming, total: ws.length })}</span>
    </div>`;
  }).join('');
}

function suggestions(p, active, days, today) {
  const tips = [];
  for (const l of data.lists) {
    const notStarted = data.words.filter((w) => w.listId === l.id && !isSeen(p.words[w.id])).length;
    if (notStarted) tips.push(['sprout', t('report.tipNotStarted', { n: notStarted, list: pick(l.title) })]);
  }
  const tricky = data.words.filter((w) => isTricky(p.words[w.id])).length;
  if (tricky >= 3) tips.push(['hive', t('report.tipTricky', { n: tricky })]);
  if (active < Math.ceil(days / 2)) tips.push(['calendar', t('report.tipDaily')]);
  const contest = settings().contestDate;
  const left = contest ? daysBetween(today, contest) : -1;
  if (left >= 0 && left <= 4) tips.push(['mock', t('report.tipMock', { n: left })]);
  if (data.words.every((w) => isMastered(p.words[w.id]))) tips.push(['trophy', t('report.tipAllBlooming')]);
  return tips.slice(0, 4);
}

export function reportTab(pid, range = 7) {
  const p = progress(pid);
  const today = dayString();
  const days = Array.from({ length: range }, (_, i) => addDays(today, i - range + 1));
  const rows = days.map((day) => ({ day, ...dayData(p, day) }));
  const total = (k) => rows.reduce((n, r) => n + (r[k] || 0), 0);
  const active = rows.filter((r) => r.test + r.learn + r.game > 0 || r.seconds >= 60).length;
  const tests = total('test');
  const pct = tests ? Math.round((total('right') / tests) * 100) : null;
  const streak = p.streak?.last && daysBetween(p.streak.last, today) <= 1 ? p.streak.count : 0;
  const people = profiles();
  const who = people.length > 1
    ? `<div class="choices">${people.map((x) => `<label class="choice"><input type="radio" name="who" value="${x.id}" ${x.id === pid ? 'checked' : ''}><span>${escapeHtml(x.name)}</span></label>`).join('')}</div>`
    : '';
  const tricky = data.words.filter((w) => isTricky(p.words[w.id]))
    .sort((a, b) => p.words[b.id].misses - p.words[a.id].misses || p.words[a.id].box - p.words[b.id].box)
    .slice(0, 8);
  const tips = suggestions(p, active, range, today);
  const tile = (label, value, sub = '') =>
    `<div class="stat-tile"><span class="st-label">${label}</span><span class="st-value">${value}</span>${sub ? `<span class="st-sub">${sub}</span>` : ''}</div>`;

  const table = rows.map((r) => `<tr><td>${escapeHtml(r.day)}</td><td>${num(r.right)}</td><td>${num(Math.max(0, r.test - r.right))}</td>
    <td>${num(r.learn)}</td><td>${num(r.game)}</td><td>${num(Math.round(r.seconds / 60))}</td></tr>`).join('');

  return `<section class="card report-head">
      <div class="report-filters no-print">
        ${who}
        <div class="choices">
          <label class="choice"><input type="radio" name="range" value="7" ${range === 7 ? 'checked' : ''}><span>${t('report.last', { n: 7 })}</span></label>
          <label class="choice"><input type="radio" name="range" value="14" ${range === 14 ? 'checked' : ''}><span>${t('report.last', { n: 14 })}</span></label>
        </div>
        <button class="btn btn-cream btn-small" type="button" data-act="print">${icon('print')}<span>${t('parent.print')}</span></button>
      </div>
      <h2>${t('report.title', { name: escapeHtml(people.find((x) => x.id === pid)?.name || '') })} <span class="sub">${t('report.last', { n: range })}</span></h2>
      <div class="stat-row">
        ${tile(t('report.daysPracticed'), t('report.ofDays', { n: active, total: range }))}
        ${tile(t('report.wordsPracticed'), num(total('test') + total('learn') + total('game')), t('report.wordsSub', { test: total('test'), learn: total('learn'), game: total('game') }))}
        ${tile(t('report.rightAnswers'), pct === null ? '—' : `${num(pct)}%`)}
        ${tile(t('report.timeInApp'), minutesText(total('seconds')))}
        ${tile(t('report.streak'), tn('report.days', streak))}
      </div>
    </section>

    <section class="card chart-card">
      <h3>${t('report.dailyTitle')}</h3>
      <div class="legend"><span><i style="background:${DAILY.right}"></i>${t('report.right')}</span><span><i style="background:${DAILY.notYet}"></i>${t('report.notYet')}</span></div>
      <div class="chart-wrap">${dailyChart(rows)}<div class="chart-tip" hidden></div></div>
      <details class="no-print"><summary>${t('report.showTable')}</summary>
        <table class="progress-table"><thead><tr><th>${t('report.day')}</th><th>${t('report.right')}</th><th>${t('report.notYet')}</th><th>${t('report.learned')}</th><th>${t('report.games')}</th><th>${t('report.minutes')}</th></tr></thead><tbody>${table}</tbody></table>
      </details>
    </section>

    <section class="card chart-card">
      <h3>${t('report.readyTitle')}</h3>
      <div class="legend">${READY_KEYS.map((k, i) => `<span><i style="background:${READY[i]}"></i>${t(`report.st.${k}`)}</span>`).join('')}</div>
      <div class="ready-wrap">${readinessBars(p)}<div class="chart-tip" hidden></div></div>
    </section>

    <section class="card">
      <h3>${t('report.focusTitle')}</h3>
      ${tricky.length ? `<ul class="focus-list">${tricky.map((w) => `<li>
          <button class="icon-btn no-print" type="button" data-say="${w.id}" aria-label="${t('common.listen')}">${icon('play')}</button>
          <span class="lang-tag" data-lang="${w.lang}">${t(`langShort.${w.lang}`)}</span>
          <span class="focus-word" lang="${w.lang}" dir="${dirOf(w.lang)}">${escapeHtml(w.word)}</span>
          <span class="sub">${tn('hive.missed', p.words[w.id].misses)}</span>
        </li>`).join('')}</ul>
        <div class="form-actions no-print">
          <a class="btn btn-leaf btn-small" href="#/learn?ids=${tricky.map((w) => w.id).join(',')}">${icon('sprout')}<span>${t('report.learnThese')}</span></a>
          <a class="btn btn-honey btn-small" href="#/bee?mode=hive">${icon('hive')}<span>${t('report.practiceThese')}</span></a>
        </div>`
        : `<p class="sub">${t('report.noTricky')}</p>`}
    </section>

    ${tips.length ? `<section class="card"><h3>${t('report.tipsTitle')}</h3><ul class="tips">${tips.map(([ic, text]) => `<li>${icon(ic)}<span>${escapeHtml(text)}</span></li>`).join('')}</ul></section>` : ''}`;
}

/** Tooltips for both charts (hover, tap and keyboard focus). */
export function mountReport(root, rowsForTip) {
  const show = (wrap, text, x, y) => {
    const tip = wrap.querySelector('.chart-tip');
    tip.textContent = '';
    text.split('\n').forEach((line, i) => {
      const el = document.createElement(i === 0 ? 'strong' : 'span');
      el.textContent = line;
      tip.appendChild(el);
    });
    tip.hidden = false;
    const r = wrap.getBoundingClientRect();
    tip.style.left = `${Math.min(Math.max(0, x - r.left + 12), r.width - tip.offsetWidth)}px`;
    tip.style.top = `${Math.max(0, y - r.top - tip.offsetHeight - 10)}px`;
  };
  const hide = (wrap) => { const tip = wrap.querySelector('.chart-tip'); if (tip) tip.hidden = true; };
  const dailyText = (i) => {
    const r = rowsForTip[i];
    return `${r.day}\n${t('report.right')}: ${r.right}\n${t('report.notYet')}: ${Math.max(0, r.test - r.right)}\n${t('report.learned')}: ${r.learn}\n${t('report.games')}: ${r.game}\n${t('report.minutes')}: ${Math.round(r.seconds / 60)}`;
  };
  const onMove = (e) => {
    const hit = e.target.closest('.hit');
    const seg = e.target.closest('.seg');
    const wrap = e.target.closest('.chart-wrap, .ready-wrap');
    if (!wrap) return;
    root.querySelectorAll('.hit.on, .seg.on').forEach((el) => el.classList.remove('on'));
    if (hit) { hit.classList.add('on'); show(wrap, dailyText(+hit.dataset.i), e.clientX, e.clientY); }
    else if (seg) { seg.classList.add('on'); show(wrap, seg.dataset.tip, e.clientX, e.clientY); }
    else hide(wrap);
  };
  const onFocus = (e) => {
    const el = e.target.closest('.hit, .seg');
    if (!el) return;
    const r = el.getBoundingClientRect();
    onMove({ target: el, clientX: r.left + r.width / 2, clientY: r.top });
  };
  const onLeave = (e) => { const wrap = e.target.closest?.('.chart-wrap, .ready-wrap'); if (wrap) hide(wrap); };
  const onClick = (e) => {
    const say = e.target.closest('[data-say]');
    if (say) sayWord(data.byId.get(say.dataset.say));
  };
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerdown', onMove);
  root.addEventListener('focusin', onFocus);
  root.addEventListener('pointerleave', onLeave, true);
  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerdown', onMove);
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('pointerleave', onLeave, true);
    root.removeEventListener('click', onClick);
  };
}

export function reportRows(pid, range = 7) {
  const p = progress(pid);
  const today = dayString();
  return Array.from({ length: range }, (_, i) => addDays(today, i - range + 1)).map((day) => ({ day, ...dayData(p, day) }));
}
