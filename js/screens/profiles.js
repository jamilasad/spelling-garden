// "Who's practising?" — pick or add a player.
import { profiles, activeProfile, addProfile, setActiveProfile } from '../store.js';
import { t, escapeHtml } from '../i18n.js';
import { avatarHTML, mascotHTML, AVATARS } from '../art.js';
import { icon } from '../icons.js';
import { topbar, go } from '../ui.js';

export default {
  title: () => t('profiles.title'),

  render() {
    const list = profiles().map((p) => `
      <button class="tap-card profile-card" data-id="${p.id}" type="button">
        <span class="art">${avatarHTML(p.avatar)}</span>
        <span class="label">${escapeHtml(p.name)}</span>
      </button>`).join('');
    const avatars = Object.keys(AVATARS).map((a, i) => `
      <label class="choice avatar-choice">
        <input type="radio" name="avatar" value="${a}" ${i === 0 ? 'checked' : ''} aria-label="${t(`avatar.${a}`)}">
        <span>${avatarHTML(a)}</span>
      </label>`).join('');

    return `<div class="page profiles-page">
      ${topbar({ title: t('profiles.title'), back: activeProfile() ? 'home' : '' })}
      <div class="profiles-hero">
        <div class="profiles-mascot">${mascotHTML('wave')}</div>
        <p class="bubble">${profiles().length ? t('profiles.prompt') : t('profiles.firstPrompt')}</p>
      </div>
      <div class="profile-grid">
        ${list}
        ${profiles().length ? `<button class="tap-card add-card" data-action="add" type="button">
          <span class="art add-art">${icon('plus')}</span>
          <span class="label">${t('profiles.add')}</span>
        </button>` : ''}
      </div>
      <form class="card add-form" ${profiles().length ? 'hidden' : ''}>
        <h2>${t('profiles.newTitle')}</h2>
        <label class="field">
          <span class="field-label">${t('profiles.name')}</span>
          <input class="text-input" name="name" maxlength="30" autocomplete="off" required>
        </label>
        <fieldset class="field avatar-field">
          <legend class="field-label">${t('profiles.pickBee')}</legend>
          <div class="choices avatar-choices">${avatars}</div>
        </fieldset>
        <div class="form-actions">
          <button class="btn btn-honey" type="submit">${icon('check')} ${t('profiles.save')}</button>
          <button class="btn btn-cream" type="button" data-action="cancel">${t('common.cancel')}</button>
        </div>
      </form>
    </div>`;
  },

  mount(root) {
    const form = root.querySelector('.add-form');
    const onClick = (e) => {
      const card = e.target.closest('.profile-card');
      if (card) {
        setActiveProfile(card.dataset.id);
        go('');
        return;
      }
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'add') {
        form.hidden = false;
        form.querySelector('input[name=name]').focus();
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (action === 'cancel') {
        form.hidden = true;
      }
    };
    const onSubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      if (!name) return;
      const id = addProfile(name, String(fd.get('avatar') || 'honey'));
      setActiveProfile(id);
      go('');
    };
    root.addEventListener('click', onClick);
    form.addEventListener('submit', onSubmit);
    return () => root.removeEventListener('click', onClick);
  },
};
