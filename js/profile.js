/**
 * profile.js — public profile page renderer + friendly not-found state.
 *
 * NOTE (prototype): profiles are stored in localStorage, so this page only
 * finds profiles saved in this same browser. Serving profiles to other
 * visitors requires a backend (e.g. Supabase) — intentionally not simulated.
 */
(function (global) {
  'use strict';

  var root = document.getElementById('profile-root');
  var UI = global.UI;

  function renderNotFound() {
    document.body.classList.remove('profile-body');
    document.title = 'Profile not found · Link-in-Bio Builder';
    root.innerHTML =
      '<div class="notfound">' +
        '<div class="notfound__box">' +
          '<div class="notfound__art">' + UI.icon('user') + '</div>' +
          '<h1>This profile isn\'t available here</h1>' +
          '<p>Profiles in this prototype are stored locally in the browser that ' +
            'created them. If the link was opened on another device or in a different ' +
            'browser, the profile cannot be found. It may also have been deleted.</p>' +
          '<a class="btn btn--primary" href="index.html">' + UI.icon('back') +
            ' Go to dashboard</a>' +
          '<a class="btn" href="index.html" id="nf-new">' + UI.icon('plus') +
            ' Create a profile</a>' +
        '</div>' +
      '</div>';
  }

  function renderProfile(profile) {
    document.title = (profile.name || 'Profile') + ' · Link-in-Bio';
    global.ProfileView.render(root, profile, { interactive: true });

    // Floating bar: back to the builder + share.
    var bar = document.createElement('div');
    bar.className = 'profile-topbar';
    bar.innerHTML =
      '<a class="profile-pill" href="index.html">' + UI.icon('back') + ' My dashboard</a>' +
      '<button class="profile-pill" type="button" id="share-profile-btn">' +
        UI.icon('copy') + ' Copy link</button>';
    document.body.appendChild(bar);

    document.getElementById('share-profile-btn').addEventListener('click', function () {
      UI.copyText(global.ProfileStore.shareUrl(profile.id)).then(function (ok) {
        UI.toast(ok ? 'Profile link copied.' : 'Could not copy the link.', ok ? 'success' : 'error');
      });
    });

    // Apply the theme background to the page shell too.
    var resolved = global.Themes.resolve(profile.design);
    document.body.style.background = resolved.background;
  }

  function init() {
    var params = new URLSearchParams(global.location.search);
    var id = params.get('id');
    var profile = id ? global.ProfileStore.get(id) : null;
    if (!profile) return renderNotFound();
    renderProfile(profile);
  }

  init();
})(window);
