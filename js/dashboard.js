/**
 * dashboard.js — profile list page: create, edit, preview, duplicate, delete.
 */
(function (global) {
  'use strict';

  var esc = function (s) { return global.UI.escapeHtml(s); };
  var content = document.getElementById('dashboard-content');

  function coverStyle(profile) {
    var d = global.Themes.resolve(profile.design);
    return 'style="background:' + esc(d.background) + '"';
  }

  function activeCount(profile) {
    return (profile.links || []).filter(function (l) { return l.enabled !== false; }).length;
  }

  function renderEmpty() {
    content.innerHTML =
      '<div class="empty">' +
        '<div class="empty__art">' + global.UI.icon('link') + '</div>' +
        '<h2>No profiles yet</h2>' +
        '<p>Create your first link-in-bio page — add your links, pick a theme, and preview it live.</p>' +
        '<button class="btn btn--primary" type="button" data-action="create">' +
          global.UI.icon('plus') + ' Create your first profile' +
        '</button>' +
      '</div>';
  }

  function renderList(profiles) {
    var cards = profiles.map(function (p) {
      var initial = esc((p.name || '?').trim().charAt(0).toUpperCase() || '?');
      var avatar = p.avatar
        ? '<img src="' + esc(p.avatar) + '" alt="">'
        : initial;
      var count = activeCount(p);
      return '' +
        '<article class="card" data-id="' + esc(p.id) + '">' +
          '<div class="card__cover" ' + coverStyle(p) + '>' +
            '<div class="card__avatar">' + avatar + '</div>' +
          '</div>' +
          '<div class="card__body">' +
            '<h2 class="card__name">' + esc(p.name || 'Untitled profile') + '</h2>' +
            '<p class="card__meta">' + count + ' active link' + (count === 1 ? '' : 's') +
              ' · updated ' + esc(global.UI.formatDate(p.updatedAt)) + '</p>' +
            (p.bio ? '<p class="card__bio">' + esc(p.bio) + '</p>' : '<p class="card__bio"></p>') +
            '<div class="card__badges">' +
              '<span class="badge">' + esc(global.Themes.resolve(p.design).themeName) + '</span>' +
              '<span class="badge">Local only</span>' +
            '</div>' +
          '</div>' +
          '<div class="card__actions">' +
            '<a class="btn btn--sm" href="editor.html?id=' + encodeURIComponent(p.id) + '">' +
              global.UI.icon('edit') + ' Edit</a>' +
            '<a class="btn btn--sm" href="profile.html?id=' + encodeURIComponent(p.id) + '" ' +
              'target="_blank" rel="noopener">' + global.UI.icon('eye') + ' Preview</a>' +
            '<button class="btn btn--sm" type="button" data-action="copy">' +
              global.UI.icon('copy') + ' Copy URL</button>' +
            '<button class="btn btn--sm btn--danger" type="button" data-action="delete" ' +
              'aria-label="Delete ' + esc(p.name || 'profile') + '">' +
              global.UI.icon('trash') + ' Delete</button>' +
          '</div>' +
        '</article>';
    }).join('');

    content.innerHTML =
      '<div class="page__head" style="margin-bottom:16px">' +
        '<p class="page__subtitle" style="margin:0">' + profiles.length +
        ' profile' + (profiles.length === 1 ? '' : 's') + ' stored in this browser.</p>' +
      '</div>' +
      '<div class="grid">' + cards + '</div>';
  }

  function render() {
    var profiles = global.ProfileStore.list();
    if (!profiles.length) renderEmpty();
    else renderList(profiles);
  }

  function createProfile() {
    var profile = global.ProfileStore.create({
      name: 'My profile',
      bio: '',
      links: [
        { title: 'My website', url: 'https://example.com', icon: 'auto', enabled: true }
      ]
    });
    global.location.href = 'editor.html?id=' + encodeURIComponent(profile.id);
  }

  document.getElementById('new-profile-btn').addEventListener('click', createProfile);

  content.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');

    if (action === 'create') return createProfile();

    var card = btn.closest('[data-id]');
    if (!card) return;
    var id = card.getAttribute('data-id');
    var profile = global.ProfileStore.get(id);
    if (!profile) return;

    if (action === 'copy') {
      var url = global.ProfileStore.shareUrl(id);
      global.UI.copyText(url).then(function (ok) {
        if (ok) {
          global.UI.toast('Profile URL copied — link works in this browser only.', 'success');
        } else {
          global.UI.toast('Could not copy automatically. URL: ' + url, 'error');
        }
      });
    }

    if (action === 'delete') {
      var ok = global.UI.confirmAction(
        'Delete "' + (profile.name || 'this profile') + '"?\n\n' +
        'This removes it from this browser permanently. This cannot be undone.'
      );
      if (!ok) return;
      global.ProfileStore.remove(id);
      global.UI.toast('Profile deleted.', 'info');
      render();
    }
  });

  render();
})(window);
