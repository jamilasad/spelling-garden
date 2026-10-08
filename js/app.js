// Spelling Garden — app shell: loads everything, then shows screens by URL hash (#/bee?mode=today …).
import { loadData, data } from './data.js';
import { loadStore, settings, activeProfile } from './store.js';
import { setLang, t, pick } from './i18n.js';
import { loadArt } from './art.js';
import { buildScene, setCalm, applyMotionSetting } from './ambient.js';
import { unlockAudio, stopAudio } from './audio.js';
import { unlockSfx } from './sfx.js';
import { go } from './ui.js';

import home from './screens/home.js';
import profiles from './screens/profiles.js';
import setup from './screens/setup.js';
import bee from './screens/bee.js';
import hive from './screens/hive.js';
import garden from './screens/garden.js';
import settingsScreen from './screens/settings.js';
import parent from './screens/parent.js';

const ROUTES = { '': home, profiles, setup, bee, hive, garden, settings: settingsScreen, parent };
const NO_PROFILE_NEEDED = new Set(['profiles', 'settings', 'parent']);
let cleanup = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [name, qs] = raw.split('?');
  return { name: name || '', params: Object.fromEntries(new URLSearchParams(qs || '')) };
}

export async function render() {
  const { name, params } = parseHash();
  if (!activeProfile() && !NO_PROFILE_NEEDED.has(name)) return go('profiles');
  const screen = ROUTES[name] || home;

  if (cleanup) {
    try { cleanup(); } catch (err) { console.error(err); }
    cleanup = null;
  }
  stopAudio();
  setCalm(false);

  const root = document.getElementById('app');
  root.innerHTML = screen.render({ params });
  cleanup = screen.mount?.(root, { params, rerender: render }) || null;
  root.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  const appName = pick(data.config.appName) || 'Spelling Garden';
  document.title = screen.title ? `${screen.title()} · ${appName}` : appName;
}

/** Re-applies language/motion after a settings change and redraws. */
export async function applySettings() {
  await setLang(settings().uiLang);
  applyMotionSetting();
  render();
}

async function boot() {
  await Promise.all([loadData(), loadArt()]);
  loadStore(data.config);
  await setLang(settings().uiLang);
  buildScene();

  const unlock = () => {
    unlockAudio();
    unlockSfx();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('hashchange', render);
  await render();

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML = `<div class="page"><div class="card"><h2>${t('error.boot')}</h2><p>${String(err.message || err)}</p></div></div>`;
});
