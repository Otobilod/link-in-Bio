/**
 * preview.js — shared renderer for profile cards.
 * Used by the live preview in the editor and by the public profile page.
 */
(function (global) {
  'use strict';

  var esc = function (s) { return global.UI.escapeHtml(s); };

  /**
   * Builds the full HTML markup for a profile.
   * @param {object} profile normalized profile
   * @param {object} opts { interactive: boolean } — when false, links render
   *   as non-navigating previews inside the editor.
   */
  function markup(profile, opts) {
    opts = opts || {};
    var interactive = opts.interactive !== false;
    var d = global.Themes.resolve(profile.design);
    var links = (profile.links || []).filter(function (l) { return l.enabled !== false; });

    var avatarHtml;
    if (profile.avatar) {
      avatarHtml = '<img class="pp__avatar" src="' + esc(profile.avatar) + '" alt="' +
        esc(profile.name || 'Profile') + ' — profile picture" loading="lazy">';
    } else {
      var initial = esc((profile.name || '?').trim().charAt(0).toUpperCase() || '?');
      avatarHtml = '<div class="pp__avatar pp__avatar--initial" aria-hidden="true">' + initial + '</div>';
    }

    var linksHtml = links.map(function (l) {
      var check = global.UI.validateUrl(l.url);
      var inner =
        '<span class="pp__link-icon">' + global.UI.iconForLink(l) + '</span>' +
        '<span class="pp__link-title">' + esc(l.title || 'Untitled link') + '</span>' +
        '<span class="pp__link-arrow" aria-hidden="true">' + global.UI.icon('external') + '</span>';
      if (!interactive) {
        return '<div class="pp__link" role="listitem">' + inner + '</div>';
      }
      if (!check.ok) {
        return '<div class="pp__link pp__link--disabled" role="listitem" title="Invalid link">' + inner + '</div>';
      }
      var isMail = /^(mailto:|tel:)/i.test(check.value);
      return '<a class="pp__link" role="listitem" href="' + esc(check.value) + '"' +
        (isMail ? '' : ' target="_blank" rel="noopener noreferrer"') +
        '><span class="pp__sr-only">Open ' + esc(l.title || 'link') + '</span>' + inner + '</a>';
    }).join('');

    if (!links.length) {
      linksHtml = '<div class="pp__empty">No active links yet.</div>';
    }

    return '' +
      '<div class="pp" style="--pp-bg:' + esc(d.background) + ';' +
        '--pp-text:' + esc(d.text) + ';' +
        '--pp-btn-bg:' + esc(d.buttonBg) + ';' +
        '--pp-btn-text:' + esc(d.buttonText) + ';' +
        '--pp-tint:' + esc(d.cardTint) + ';' +
        '--pp-radius:' + esc(d.radius) + ';">' +
      '<div class="pp__inner">' +
        avatarHtml +
        '<h1 class="pp__name">' + esc(profile.name || 'Your name') + '</h1>' +
        (profile.bio ? '<p class="pp__bio">' + esc(profile.bio) + '</p>' : '') +
        '<div class="pp__links" role="list">' + linksHtml + '</div>' +
        '<p class="pp__footer">Made with Link-in-Bio Builder</p>' +
      '</div>' +
      '</div>';
  }

  /** Renders a profile into a container element. */
  function render(container, profile, opts) {
    if (!container) return;
    container.innerHTML = markup(profile, opts);
  }

  global.ProfileView = { markup: markup, render: render };
})(window);
