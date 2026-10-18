/**
 * editor.js — profile editor: profile fields, link CRUD + reorder,
 * design customization, live preview, validation and saving.
 */
(function (global) {
  'use strict';

  var UI = global.UI;
  var esc = UI.escapeHtml;
  var store = global.ProfileStore;

  var form = document.getElementById('editor-form');
  var linksList = document.getElementById('links-list');
  var previewBox = document.getElementById('profile-preview');
  var saveState = document.getElementById('save-state');

  var profile = null;
  var dirty = false;

  /* ------------------------------- Bootstrap ------------------------------- */

  function init() {
    var params = new URLSearchParams(global.location.search);
    var id = params.get('id');
    var existing = id ? store.get(id) : null;

    if (id && !existing) {
      UI.toast('That profile was not found in this browser.', 'error');
      global.location.replace('index.html');
      return;
    }
    if (!existing) {
      // New profile: create it, then normalize the URL so refresh keeps working.
      existing = store.create({ name: '', bio: '', links: [] });
      global.location.replace('editor.html?id=' + encodeURIComponent(existing.id));
      return;
    }

    profile = existing;
    document.getElementById('editor-title').textContent =
      profile.name ? 'Edit · ' + profile.name : 'Edit profile';
    document.title = (profile.name || 'Profile') + ' · Editor';

    fillProfileFields();
    renderLinks();
    buildThemeGrid();
    fillDesignControls();
    renderPreview();
    updateSaveState('saved');
  }

  function markDirty() {
    if (!dirty) {
      dirty = true;
      updateSaveState('dirty');
    }
  }

  function updateSaveState(state) {
    if (state === 'dirty') {
      saveState.textContent = 'Unsaved changes';
      saveState.className = 'save-state is-dirty';
    } else {
      saveState.textContent = 'All changes saved';
      saveState.className = 'save-state is-saved';
    }
  }

  /* ------------------------------ Profile fields ---------------------------- */

  function fillProfileFields() {
    var nameEl = document.getElementById('profile-name');
    var bioEl = document.getElementById('profile-bio');
    var avatarEl = document.getElementById('profile-avatar');
    nameEl.value = profile.name || '';
    bioEl.value = profile.bio || '';
    avatarEl.value = profile.avatar && /^data:/i.test(profile.avatar) ? '' : (profile.avatar || '');
    document.getElementById('name-count').textContent = (profile.name || '').length;
    document.getElementById('bio-count').textContent = (profile.bio || '').length;
    renderAvatarPreview();
  }

  function renderAvatarPreview() {
    var box = document.getElementById('avatar-preview');
    if (profile.avatar) {
      box.innerHTML = '<img src="' + esc(profile.avatar) + '" alt="">';
    } else {
      box.textContent = (profile.name || '?').trim().charAt(0).toUpperCase() || '?';
    }
  }

  document.getElementById('profile-name').addEventListener('input', function () {
    profile.name = this.value;
    document.getElementById('name-count').textContent = this.value.length;
    clearFieldError('profile-name');
    renderAvatarPreview();
    markDirty();
    renderPreview();
  });

  document.getElementById('profile-bio').addEventListener('input', function () {
    profile.bio = this.value;
    document.getElementById('bio-count').textContent = this.value.length;
    markDirty();
    renderPreview();
  });

  document.getElementById('profile-avatar').addEventListener('input', function () {
    profile.avatar = this.value.trim();
    clearFieldError('profile-avatar');
    renderAvatarPreview();
    markDirty();
    renderPreview();
  });

  document.getElementById('avatar-clear').addEventListener('click', function () {
    profile.avatar = '';
    document.getElementById('profile-avatar').value = '';
    document.getElementById('avatar-file').value = '';
    renderAvatarPreview();
    markDirty();
    renderPreview();
  });

  document.getElementById('avatar-file').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      UI.toast('Please choose an image file.', 'error');
      this.value = '';
      return;
    }
    if (file.size > 900 * 1024) {
      UI.toast('Image is larger than 900 KB. Browser storage is limited — use a smaller image or a URL.', 'error');
      this.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      profile.avatar = String(reader.result);
      document.getElementById('profile-avatar').value = '';
      renderAvatarPreview();
      markDirty();
      renderPreview();
      UI.toast('Image added (stored inside this browser).', 'success');
    };
    reader.onerror = function () {
      UI.toast('Could not read that file.', 'error');
    };
    reader.readAsDataURL(file);
  });

  /** Scrolls an element into view when the browser supports it. */
  function scrollTo(el) {
    if (el && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      catch (e) { el.scrollIntoView(); }
    }
  }

  function setFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + '-error');
    if (input) input.classList.add('is-invalid');
    if (error) {
      if (message) error.textContent = message;
      error.classList.add('is-visible');
    }
  }

  function clearFieldError(fieldId) {
    var input = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + '-error');
    if (input) input.classList.remove('is-invalid');
    if (error) error.classList.remove('is-visible');
  }

  /* --------------------------------- Links --------------------------------- */

  function newLink() {
    return { id: 'l_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
             title: '', url: '', icon: 'auto', enabled: true };
  }

  function iconOptions(selected) {
    return UI.ICON_CHOICES.map(function (choice) {
      return '<option value="' + esc(choice.id) + '"' +
        (choice.id === selected ? ' selected' : '') + '>' +
        esc(choice.name) + '</option>';
    }).join('');
  }

  function linkTemplate(link, index, total) {
    return '' +
      '<div class="link-item' + (link.enabled ? '' : ' is-off') + '" data-link-id="' + esc(link.id) + '" draggable="true">' +
        '<div class="link-item__head">' +
          '<span class="link-item__grip" title="Drag to reorder" aria-hidden="true">' + UI.icon('grip') + '</span>' +
          '<span class="link-item__title" data-role="title">' + esc(link.title || 'Untitled link') + '</span>' +
          '<span class="link-item__state" data-role="state">' + (link.enabled ? 'Visible' : 'Hidden') + '</span>' +
          '<label class="switch" title="Show or hide this link">' +
            '<input type="checkbox" data-role="toggle"' + (link.enabled ? ' checked' : '') + '>' +
            '<span class="switch__track"></span>' +
            '<span class="sr-only">Enable link</span>' +
          '</label>' +
          '<button class="icon-btn" type="button" data-role="up" aria-label="Move link up"' +
            (index === 0 ? ' disabled' : '') + '>' + UI.icon('up') + '</button>' +
          '<button class="icon-btn" type="button" data-role="down" aria-label="Move link down"' +
            (index === total - 1 ? ' disabled' : '') + '>' + UI.icon('down') + '</button>' +
          '<button class="icon-btn icon-btn--danger" type="button" data-role="remove" ' +
            'aria-label="Delete link">' + UI.icon('trash') + '</button>' +
        '</div>' +
        '<div class="link-item__grid">' +
          '<div class="field">' +
            '<label class="label">Title <span class="req">*</span></label>' +
            '<input class="input" type="text" maxlength="70" data-role="title-input" ' +
              'placeholder="e.g. YouTube channel" value="' + esc(link.title) + '">' +
            '<p class="field__error" data-role="title-error">Please enter a title.</p>' +
          '</div>' +
          '<div class="field">' +
            '<label class="label">Icon</label>' +
            '<select class="select" data-role="icon">' + iconOptions(link.icon) + '</select>' +
          '</div>' +
          '<div class="field field--full">' +
            '<label class="label">URL <span class="req">*</span></label>' +
            '<input class="input" type="text" data-role="url" ' +
              'placeholder="https://example.com" value="' + esc(link.url) + '" ' +
              'inputmode="url" autocomplete="off">' +
            '<p class="field__error" data-role="url-error">Please enter a valid URL.</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderLinks() {
    if (!profile.links.length) {
      linksList.innerHTML =
        '<div class="empty" style="padding:32px 20px">' +
          '<div class="empty__art" style="width:52px;height:52px;border-radius:16px">' + UI.icon('plus') + '</div>' +
          '<h2 style="font-size:16px">No links yet</h2>' +
          '<p style="margin-bottom:16px">Add your first link — a website, social profile, shop or booking page.</p>' +
          '<button class="btn btn--primary" type="button" data-action="add-empty">' +
            UI.icon('plus') + ' Add a link</button>' +
        '</div>';
      return;
    }
    linksList.innerHTML = profile.links.map(function (l, i) {
      return linkTemplate(l, i, profile.links.length);
    }).join('');
    UI.hydrateIcons(linksList);
  }

  function findLink(id) {
    return profile.links.filter(function (l) { return l.id === id; })[0] || null;
  }

  function findIndex(id) {
    for (var i = 0; i < profile.links.length; i++) {
      if (profile.links[i].id === id) return i;
    }
    return -1;
  }

  function addLink() {
    profile.links.push(newLink());
    markDirty();
    renderLinks();
    renderPreview();
    var items = linksList.querySelectorAll('.link-item');
    if (items.length) {
      var last = items[items.length - 1];
      scrollTo(last);
      var titleInput = last.querySelector('[data-role="title-input"]');
      if (titleInput) titleInput.focus();
    }
  }

  function moveLink(id, delta) {
    var idx = findIndex(id);
    var target = idx + delta;
    if (idx === -1 || target < 0 || target >= profile.links.length) return;
    var moved = profile.links.splice(idx, 1)[0];
    profile.links.splice(target, 0, moved);
    markDirty();
    renderLinks();
    renderPreview();
    var items = linksList.querySelectorAll('.link-item');
    if (items[target]) {
      var focusBtn = items[target].querySelector(delta < 0 ? '[data-role="up"]' : '[data-role="down"]');
      if (focusBtn && !focusBtn.disabled) focusBtn.focus();
    }
  }

  function removeLink(id) {
    var link = findLink(id);
    if (!link) return;
    if (link.title || link.url) {
      var ok = UI.confirmAction('Remove "' + (link.title || 'this link') + '"?');
      if (!ok) return;
    }
    profile.links = profile.links.filter(function (l) { return l.id !== id; });
    markDirty();
    renderLinks();
    renderPreview();
  }

  linksList.addEventListener('click', function (event) {
    var addBtn = event.target.closest('[data-action="add-empty"]');
    if (addBtn) return addLink();

    var btn = event.target.closest('[data-role]');
    if (!btn || btn.tagName === 'INPUT' || btn.tagName === 'SELECT') return;
    var item = btn.closest('.link-item');
    if (!item) return;
    var id = item.getAttribute('data-link-id');

    if (btn.getAttribute('data-role') === 'remove') removeLink(id);
    if (btn.getAttribute('data-role') === 'up') moveLink(id, -1);
    if (btn.getAttribute('data-role') === 'down') moveLink(id, 1);
  });

  linksList.addEventListener('input', function (event) {
    var el = event.target;
    var item = el.closest('.link-item');
    if (!item) return;
    var link = findLink(item.getAttribute('data-link-id'));
    if (!link) return;

    var role = el.getAttribute('data-role');
    if (role === 'title-input') {
      link.title = el.value;
      item.querySelector('[data-role="title"]').textContent = el.value || 'Untitled link';
      el.classList.remove('is-invalid');
      item.querySelector('[data-role="title-error"]').classList.remove('is-visible');
      markDirty();
      renderPreview();
    }
    if (role === 'url') {
      link.url = el.value;
      el.classList.remove('is-invalid');
      item.querySelector('[data-role="url-error"]').classList.remove('is-visible');
      markDirty();
      renderPreview();
    }
  });

  linksList.addEventListener('change', function (event) {
    var el = event.target;
    var item = el.closest('.link-item');
    if (!item) return;
    var link = findLink(item.getAttribute('data-link-id'));
    if (!link) return;

    if (el.getAttribute('data-role') === 'toggle') {
      link.enabled = el.checked;
      item.classList.toggle('is-off', !link.enabled);
      item.querySelector('[data-role="state"]').textContent = link.enabled ? 'Visible' : 'Hidden';
      markDirty();
      renderPreview();
    }
    if (el.getAttribute('data-role') === 'icon') {
      link.icon = el.value;
      markDirty();
      renderPreview();
    }
  });

  /* ---------------------------- Drag and drop ------------------------------ */

  var dragId = null;

  linksList.addEventListener('dragstart', function (event) {
    var item = event.target.closest('.link-item');
    if (!item) return;
    dragId = item.getAttribute('data-link-id');
    item.classList.add('is-dragging');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      try { event.dataTransfer.setData('text/plain', dragId); } catch (e) { /* older browsers */ }
    }
  });

  linksList.addEventListener('dragover', function (event) {
    if (!dragId) return;
    event.preventDefault();
    var item = event.target.closest('.link-item');
    Array.prototype.forEach.call(linksList.children, function (c) { c.classList.remove('is-drag-over'); });
    if (item && item.getAttribute('data-link-id') !== dragId) item.classList.add('is-drag-over');
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  });

  linksList.addEventListener('drop', function (event) {
    if (!dragId) return;
    event.preventDefault();
    var item = event.target.closest('.link-item');
    if (!item) return;
    var targetId = item.getAttribute('data-link-id');
    if (targetId === dragId) return cleanupDrag();

    var from = findIndex(dragId);
    var to = findIndex(targetId);
    if (from === -1 || to === -1) return cleanupDrag();

    var moved = profile.links.splice(from, 1)[0];
    profile.links.splice(to, 0, moved);
    markDirty();
    renderLinks();
    renderPreview();
    cleanupDrag();
  });

  linksList.addEventListener('dragend', cleanupDrag);

  function cleanupDrag() {
    dragId = null;
    Array.prototype.forEach.call(linksList.children, function (c) {
      c.classList.remove('is-drag-over', 'is-dragging');
    });
  }

  document.getElementById('add-link-btn').addEventListener('click', addLink);

  /* -------------------------------- Design --------------------------------- */

  function buildThemeGrid() {
    var grid = document.getElementById('theme-grid');
    grid.innerHTML = Object.keys(global.Themes.list).map(function (key) {
      var t = global.Themes.list[key];
      return '<button class="theme-opt' + (profile.design.theme === t.id ? ' is-active' : '') +
        '" type="button" role="radio" data-theme="' + esc(t.id) + '" ' +
        'aria-checked="' + (profile.design.theme === t.id ? 'true' : 'false') + '">' +
        '<span class="theme-opt__swatch" style="background:' + esc(t.swatch) + '"></span>' +
        esc(t.name) + '</button>';
    }).join('');
  }

  function fillDesignControls() {
    var design = profile.design;

    ['background', 'button', 'text'].forEach(function (key) {
      var prop = key === 'button' ? 'buttonColor' : key === 'text' ? 'textColor' : 'background';
      var input = document.getElementById('color-' + key);
      var label = document.getElementById('color-' + key + '-value');
      var value = design[prop];
      if (value) {
        input.value = value;
        label.textContent = value;
      } else {
        label.textContent = 'Theme default';
        var theme = global.Themes.list[design.theme] || global.Themes.list.aurora;
        input.value = key === 'background' ? '#6d5df6'
          : key === 'button' ? '#ffffff'
          : (theme.text || '#ffffff');
      }
    });

    var shapeBtns = document.querySelectorAll('#shape-control [data-shape]');
    Array.prototype.forEach.call(shapeBtns, function (btn) {
      var active = btn.getAttribute('data-shape') === design.shape;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  document.getElementById('theme-grid').addEventListener('click', function (event) {
    var btn = event.target.closest('[data-theme]');
    if (!btn) return;
    profile.design.theme = btn.getAttribute('data-theme');
    // Reset overrides to the new theme's defaults for predictable results.
    profile.design.background = '';
    profile.design.buttonColor = '';
    profile.design.textColor = '';
    buildThemeGrid();
    fillDesignControls();
    markDirty();
    renderPreview();
  });

  [['background', 'background'], ['button', 'buttonColor'], ['text', 'textColor']]
    .forEach(function (pair) {
      var key = pair[0];
      var prop = pair[1];
      var input = document.getElementById('color-' + key);
      var label = document.getElementById('color-' + key + '-value');

      input.addEventListener('input', function () {
        profile.design[prop] = input.value;
        label.textContent = input.value;
        markDirty();
        renderPreview();
      });
      document.getElementById('color-' + key + '-reset').addEventListener('click', function () {
        profile.design[prop] = '';
        label.textContent = 'Theme default';
        fillDesignControls();
        markDirty();
        renderPreview();
      });
    });

  document.getElementById('shape-control').addEventListener('click', function (event) {
    var btn = event.target.closest('[data-shape]');
    if (!btn) return;
    profile.design.shape = btn.getAttribute('data-shape');
    fillDesignControls();
    markDirty();
    renderPreview();
  });

  /* -------------------------------- Preview -------------------------------- */

  function renderPreview() {
    global.ProfileView.render(previewBox, profile, { interactive: false });
  }

  document.getElementById('device-control').addEventListener('click', function (event) {
    var btn = event.target.closest('[data-device]');
    if (!btn) return;
    var device = btn.getAttribute('data-device');
    Array.prototype.forEach.call(this.querySelectorAll('button'), function (b) {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    var stage = document.getElementById('preview-stage');
    stage.classList.toggle('is-mobile', device === 'mobile');
    stage.classList.toggle('is-desktop', device === 'desktop');
  });

  /* -------------------------------- Saving --------------------------------- */

  function validateAll() {
    var valid = true;

    var name = profile.name.trim();
    if (!name) {
      setFieldError('profile-name', 'Please enter a profile name.');
      valid = false;
    } else {
      clearFieldError('profile-name');
    }

    var avatar = profile.avatar.trim();
    if (avatar && !/^(https?:\/\/|data:image\/)/i.test(avatar)) {
      setFieldError('profile-avatar', 'Enter an https:// image URL or upload a file.');
      valid = false;
    } else {
      clearFieldError('profile-avatar');
    }

    var linksError = document.getElementById('links-error');
    linksError.classList.remove('is-visible');

    profile.links.forEach(function (link) {
      var item = linksList.querySelector('[data-link-id="' + link.id + '"]');
      if (!item) return;
      var titleInput = item.querySelector('[data-role="title-input"]');
      var urlInput = item.querySelector('[data-role="url"]');
      var titleError = item.querySelector('[data-role="title-error"]');
      var urlError = item.querySelector('[data-role="url-error"]');

      if (!link.title.trim()) {
        valid = false;
        titleInput.classList.add('is-invalid');
        titleError.classList.add('is-visible');
      } else {
        titleInput.classList.remove('is-invalid');
        titleError.classList.remove('is-visible');
      }

      var check = UI.validateUrl(link.url);
      if (!check.ok) {
        valid = false;
        urlInput.classList.add('is-invalid');
        urlError.textContent = check.error;
        urlError.classList.add('is-visible');
      } else {
        link.url = check.value; // normalized (e.g. https:// prepended)
        urlInput.classList.remove('is-invalid');
        urlError.classList.remove('is-visible');
        urlInput.value = check.value;
      }
    });

    if (!valid) {
      linksError.classList.add('is-visible');
      var firstBad = linksList.querySelector('.is-invalid');
      if (firstBad) {
        scrollTo(firstBad);
        firstBad.focus({ preventScroll: true });
      } else if (!name || (avatar && !/^(https?:\/\/|data:image\/)/i.test(avatar))) {
        var firstField = !name
          ? document.getElementById('profile-name')
          : document.getElementById('profile-avatar');
        scrollTo(firstField);
        firstField.focus({ preventScroll: true });
      }
    }
    return valid;
  }

  function save(silent) {
    if (!profile) return false;
    if (!validateAll()) {
      if (!silent) UI.toast('Please fix the highlighted fields.', 'error');
      return false;
    }
    try {
      profile = store.save(profile);
      dirty = false;
      updateSaveState('saved');
      document.getElementById('editor-title').textContent = 'Edit · ' + profile.name;
      document.title = profile.name + ' · Editor';
      if (!silent) UI.toast('Profile saved in this browser.', 'success');
      return true;
    } catch (err) {
      console.error(err);
      if (!silent) UI.toast(err.message || 'Could not save the profile.', 'error');
      return false;
    }
  }

  document.getElementById('save-btn').addEventListener('click', function () { save(false); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    save(false);
  });

  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      save(false);
    }
  });

  document.getElementById('copy-url-btn').addEventListener('click', function () {
    if (!save(true)) {
      UI.toast('Fix the form errors before copying a URL.', 'error');
      return;
    }
    openShareDialog();
  });

  document.getElementById('preview-btn').addEventListener('click', function () {
    if (!save(true)) {
      UI.toast('Fix the form errors before previewing.', 'error');
      return;
    }
    global.open('profile.html?id=' + encodeURIComponent(profile.id), '_blank', 'noopener');
  });

  window.addEventListener('beforeunload', function (event) {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  /* ------------------------------ Share dialog ----------------------------- */

  function openShareDialog() {
    var url = store.shareUrl(profile.id);
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="share-title">' +
        '<h2 id="share-title">Share this profile</h2>' +
        '<p>Anyone with this link can open the profile — but only in this browser ' +
          'and on this device.</p>' +
        '<div class="local-note">' + UI.icon('alert') +
          '<span><strong>Not published publicly.</strong> The profile lives in this ' +
          'browser\'s localStorage. On another device this URL shows a not-found page. ' +
          'Real publishing needs a backend (e.g. Supabase) — no fake cloud saving here.</span>' +
        '</div>' +
        '<div class="modal__url">' +
          '<input class="input" type="text" readonly value="' + esc(url) + '" ' +
            'aria-label="Profile URL" onclick="this.select()">' +
        '</div>' +
        '<div class="modal__actions">' +
          '<button class="btn" type="button" data-modal="close">Close</button>' +
          '<button class="btn btn--primary" type="button" data-modal="copy">' +
            UI.icon('copy') + ' Copy link</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(backdrop);

    var input = backdrop.querySelector('input');
    input.focus();
    input.select();

    function close() { backdrop.remove(); }

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) return close();
      var btn = event.target.closest('[data-modal]');
      if (!btn) return;
      if (btn.getAttribute('data-modal') === 'close') return close();
      UI.copyText(url).then(function (ok) {
        if (ok) {
          UI.toast('Copied! Remember: the link only works in this browser.', 'success');
          close();
        } else {
          UI.toast('Copy failed — select the URL manually.', 'error');
        }
      });
    });

    document.addEventListener('keydown', function escHandler(event) {
      if (event.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  init();
})(window);
