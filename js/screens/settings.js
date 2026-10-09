// Settings: language, sound, motion, speech speed, reveal style, contest date, players and backups.
import { settings, setSetting, exportBackup, importBackup, activeProfile } from '../store.js';
import { t, escapeHtml } from '../i18n.js';
import { icon } from '../icons.js';
import { topbar, toast, downloadFile, go, holdButton } from '../ui.js';
import { applySettings } from '../app.js';
import { dayString } from '../scheduler.js';

const radio = (name, value, label, checked, extra = '') =>
  `<label class="choice"><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span ${extra}>${label}</span></label>`;

export default {
  title: () => t('settings.title'),

  render() {
    const s = settings();
    return `<div class="page settings-page">
      ${topbar({ title: t('settings.title'), back: activeProfile() ? 'home' : 'profiles' })}
      <form class="settings-form">
        <section class="card">
          <fieldset class="field"><legend class="field-label">${icon('language')} ${t('settings.uiLang')}</legend>
            <div class="choices">
              ${radio('uiLang', 'en', 'English', s.uiLang === 'en', 'lang="en"')}
              ${radio('uiLang', 'bn', 'বাংলা', s.uiLang === 'bn', 'lang="bn"')}
              ${radio('uiLang', 'ar', 'العربية', s.uiLang === 'ar', 'lang="ar" dir="rtl"')}
            </div>
          </fieldset>
        </section>

        <section class="card settings-stack">
          <label class="switch"><span class="field-label">${icon('play')} ${t('settings.sound')}</span><input type="checkbox" name="sound" ${s.sound ? 'checked' : ''}></label>
          <label class="switch"><span class="field-label">${icon('motion')} ${t('settings.motion')}</span><input type="checkbox" name="motion" ${s.motion ? 'checked' : ''}></label>
          <fieldset class="field"><legend class="field-label">${icon('slow')} ${t('settings.speed')}</legend>
            <div class="choices">
              ${radio('speechRate', '0.75', t('settings.speedSlow'), s.speechRate === 0.75)}
              ${radio('speechRate', '0.9', t('settings.speedNormal'), s.speechRate === 0.9)}
              ${radio('speechRate', '1.05', t('settings.speedFast'), s.speechRate === 1.05)}
            </div>
          </fieldset>
          <fieldset class="field"><legend class="field-label">${icon('eye')} ${t('settings.reveal')}</legend>
            <div class="choices">
              ${radio('reveal', 'letters', t('settings.revealLetters'), s.reveal === 'letters')}
              ${radio('reveal', 'word', t('settings.revealWord'), s.reveal === 'word')}
            </div>
          </fieldset>
          <label class="field"><span class="field-label">${icon('calendar')} ${t('settings.contestDate')}</span>
            <input class="text-input" type="date" name="contestDate" value="${escapeHtml(s.contestDate || '')}" min="${dayString()}">
          </label>
        </section>
      </form>

      <section class="card settings-stack">
        <h2>${icon('users')} ${t('settings.players')}</h2>
        <a class="btn btn-cream" href="#/profiles">${icon('users')}<span>${t('settings.switchPlayer')}</span></a>
      </section>

      <section class="card settings-stack">
        <h2>${icon('download')} ${t('settings.backup')}</h2>
        <p class="sub">${t('settings.backupHint')}</p>
        <div class="form-actions">
          <button class="btn btn-sky" type="button" data-act="export">${icon('download')}<span>${t('settings.export')}</span></button>
          <label class="btn btn-cream file-btn">${icon('upload')}<span>${t('settings.import')}</span><input type="file" accept="application/json,.json" hidden></label>
        </div>
      </section>

      <section class="card settings-stack">
        <h2>${icon('lock')} ${t('parent.title')}</h2>
        <p class="sub">${t('settings.parentHint')}</p>
        <button class="btn btn-cream hold-btn parent-hold" type="button">${icon('hand')}<span>${t('settings.parentHold')}</span></button>
      </section>
    </div>`;
  },

  mount(root) {
    const form = root.querySelector('.settings-form');
    const onChange = async (e) => {
      const el = e.target;
      if (!el.name) return;
      if (el.type === 'checkbox') setSetting(el.name, el.checked);
      else if (el.name === 'speechRate') setSetting('speechRate', Number(el.value));
      else setSetting(el.name, el.value);
      if (el.name === 'uiLang' || el.name === 'motion') await applySettings();
      else toast(t('settings.saved'), 1200);
    };
    form.addEventListener('change', onChange);

    const onClick = (e) => {
      if (e.target.closest('[data-act="export"]')) {
        downloadFile(`spelling-garden-backup-${dayString()}.json`, exportBackup());
        toast(t('settings.exported'));
      }
    };
    root.addEventListener('click', onClick);

    const file = root.querySelector('.file-btn input');
    const onFile = async () => {
      const f = file.files?.[0];
      if (!f) return;
      try {
        importBackup(await f.text());
        toast(t('settings.imported'));
        await applySettings();
      } catch {
        toast(t('settings.importFailed'));
      }
    };
    file.addEventListener('change', onFile);
    const stopHold = holdButton(root.querySelector('.parent-hold'), 1200, () => go('parent'), null, { meter: t('home.holdMeter') });

    return () => {
      form.removeEventListener('change', onChange);
      root.removeEventListener('click', onClick);
      stopHold();
    };
  },
};
