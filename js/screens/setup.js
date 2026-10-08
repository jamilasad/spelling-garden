// Choose how to practise one list, or set up a Mock Contest.
import { data, listById, wordsOfList } from '../data.js';
import { settings } from '../store.js';
import { t, pick, escapeHtml, num } from '../i18n.js';
import { mascotHTML } from '../art.js';
import { icon } from '../icons.js';
import { topbar, go } from '../ui.js';

const radio = (name, value, label, checked, ic = '') =>
  `<label class="choice"><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${ic ? icon(ic) : ''}${label}</span></label>`;

export default {
  title: () => t('setup.title'),

  render({ params }) {
    const mock = params.mode === 'mock';
    const list = listById(params.list);
    const total = list ? wordsOfList(list.id).length : data.words.length;
    const heading = mock ? t('mock.title') : escapeHtml(pick(list?.title)) || t('setup.title');

    const langChoices = mock
      ? `<fieldset class="field"><legend class="field-label">${t('mock.which')}</legend><div class="choices">
          ${radio('lang', 'all', t('mock.allLangs'), true, 'globe')}
          ${data.lists.map((l) => radio('lang', l.id, escapeHtml(pick(l.title)), false)).join('')}
        </div></fieldset>`
      : '';

    const timer = settings().mockTimer || 0;
    return `<div class="page setup-page">
      ${topbar({ title: heading, back: 'home' })}
      <div class="setup-layout">
        <div class="setup-mascot">${mascotHTML(mock ? 'trophy' : 'think')}<p class="bubble">${mock ? t('mock.intro') : t('setup.intro')}</p></div>
        <form class="card setup-form">
          ${langChoices}
          <fieldset class="field"><legend class="field-label">${t('setup.howMany')}</legend><div class="choices">
            ${radio('count', '5', num(5), !mock)}
            ${radio('count', '10', num(10), mock)}
            ${radio('count', 'all', t('setup.all', { n: total }), false)}
          </div></fieldset>
          ${mock ? `<fieldset class="field"><legend class="field-label">${t('mock.timer')}</legend><div class="choices">
              ${radio('timer', '0', t('mock.noTimer'), timer === 0)}
              ${radio('timer', '30', t('mock.seconds', { n: 30 }), timer === 30)}
              ${radio('timer', '60', t('mock.seconds', { n: 60 }), timer === 60)}
            </div><span class="field-hint">${t('mock.timerHint')}</span></fieldset>`
            : `<fieldset class="field"><legend class="field-label">${t('setup.order')}</legend><div class="choices">
              ${radio('order', 'shuffle', t('setup.shuffle'), true, 'shuffle')}
              ${radio('order', 'list', t('setup.listOrder'), false, 'list')}
            </div></fieldset>`}
          <button class="btn btn-honey btn-big btn-wide" type="submit">${icon('play')} ${t('setup.start')}</button>
        </form>
      </div>
    </div>`;
  },

  mount(root, { params }) {
    const form = root.querySelector('.setup-form');
    const onSubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (params.mode === 'mock') {
        const lang = String(fd.get('lang'));
        go('bee', { mode: 'mock', count: String(fd.get('count')), timer: String(fd.get('timer') || 0), ...(lang !== 'all' ? { list: lang } : {}) });
      } else {
        go('bee', { mode: 'list', list: params.list, count: String(fd.get('count')), order: String(fd.get('order')) });
      }
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  },
};
