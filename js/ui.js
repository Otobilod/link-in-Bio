/**
 * ui.js — shared helpers: SVG icons, toasts, confirmations, URL validation.
 */
(function (global) {
  'use strict';

  /* ----------------------------- URL validation ----------------------------- */

  /**
   * Validates a link URL. Accepts http(s), mailto, tel.
   * Returns { ok: boolean, value: string, error?: string }.
   */
  function validateUrl(raw) {
    var value = (raw || '').trim();
    if (!value) return { ok: false, value: value, error: 'Please enter a URL.' };

    if (/^(mailto:|tel:)/i.test(value)) {
      var after = value.replace(/^(mailto:|tel:)/i, '').trim();
      if (!after) return { ok: false, value: value, error: 'This link is missing an address.' };
      return { ok: true, value: value };
    }

    // Allow bare domains by prepending https://
    var candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : 'https://' + value;
    try {
      var u = new URL(candidate);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, value: value, error: 'Only http, https, mailto or tel links are allowed.' };
      }
      if (!u.hostname || u.hostname.indexOf('.') === -1) {
        return { ok: false, value: value, error: 'That does not look like a valid website address.' };
      }
      return { ok: true, value: candidate };
    } catch (e) {
      return { ok: false, value: value, error: 'That does not look like a valid website address.' };
    }
  }

  /** Returns hostname for a url, or '' when unparseable. */
  function hostname(url) {
    try {
      var candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : 'https://' + url;
      return new URL(candidate).hostname.replace(/^www\./, '');
    } catch (e) {
      return '';
    }
  }

  /* --------------------------------- Icons --------------------------------- */

  var S = function (inner) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      inner + '</svg>';
  };

  var ICONS = {
    globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>'),
    link: S('<path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.4 4.5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.6 19.5"/>'),
    mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    x: S('<path d="M4 4l16 16M20 4 4 20"/>'),
    instagram: S('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>'),
    github: S('<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'),
    youtube: S('<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10.5 9.5 5 2.5-5 2.5z" fill="currentColor" stroke="none"/>'),
    linkedin: S('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5V17M7.5 7.4v.1M11.5 17v-3.7a2.3 2.3 0 0 1 4.6 0V17"/>'),
    tiktok: S('<path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 4c.5 2.4 2 3.9 4.5 4.2"/>'),
    facebook: S('<path d="M14.5 8.5H17V5h-2.5A3.5 3.5 0 0 0 11 8.5V11H8.5v3.5H11V21h3.5v-6.5H17L17.5 11H14.5V8.9c0-.3.2-.4.5-.4z"/>'),
    twitch: S('<path d="M5 4h15v10l-4 4h-3l-3 3H8v-3H5z"/><path d="M12 8v4M16 8v4"/>'),
    discord: S('<path d="M8 7.5S6 8 5 9.5c-1 2-1.2 5-1 7 1.5 1.5 3 2 3 2l1-2m5 0 1 2s1.5-.5 3-2c.2-2 0-5-1-7-1-1.5-3-2-3-2"/><circle cx="9.5" cy="13" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="13" r="1.2" fill="currentColor" stroke="none"/>'),
    spotify: S('<circle cx="12" cy="12" r="9"/><path d="M7.5 9.5c3-.8 6.2-.5 8.8 1M8 13c2.4-.6 5-.4 7.2.8M8.6 16c1.9-.5 3.9-.3 5.7.6"/>'),
    phone: S('<path d="M6 3h4l1.5 4-2 1.5a12 12 0 0 0 6 6L17 12.5 21 14v4a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z"/>'),
    cart: S('<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.5 11h10L20 7H6.2"/>'),
    book: S('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19"/>'),
    calendar: S('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
    video: S('<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 11 5-3v8l-5-3z"/>'),
    article: S('<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    heart: S('<path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 7.6 4 4 0 0 1 19 10.5C19 15.6 12 20 12 20z"/>'),

    /* UI icons */
    plus: S('<path d="M12 5v14M5 12h14"/>'),
    trash: S('<path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6M14 11v6"/>'),
    edit: S('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 6.5 17.5 9.5"/>'),
    eye: S('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    copy: S('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
    up: S('<path d="m6 14 6-6 6 6"/>'),
    down: S('<path d="m6 10 6 6 6-6"/>'),
    grip: S('<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>'),
    back: S('<path d="M15 6l-6 6 6 6"/>'),
    check: S('<path d="m5 12.5 4.5 4.5L19 7"/>'),
    devicePhone: S('<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>'),
    deviceDesktop: S('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
    palette: S('<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.4-1.3-1.7-1.3-2.9 0-.9.7-1.6 1.7-1.6H16a5 5 0 0 0 5-5c0-3.6-4-6.7-9-6.7z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="1.1" fill="currentColor" stroke="none"/>'),
    user: S('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
    external: S('<path d="M14 5h5v5"/><path d="M19 5 10 14"/><path d="M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5"/>'),
    save: S('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'),
    alert: S('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17.2v.1"/>'),
    close: S('<path d="M6 6l12 12M18 6 6 18"/>')
  };

  /** Returns an SVG markup string for the given icon name (falls back to globe). */
  function icon(name) {
    if (name && name !== 'auto') {
      if (ICONS[name]) return ICONS[name];
      var host = hostname(name);
      var byHost = {
        'twitter.com': 'x', 'x.com': 'x', 't.co': 'x',
        'instagram.com': 'instagram', 'github.com': 'github',
        'youtube.com': 'youtube', 'youtu.be': 'youtube',
        'linkedin.com': 'linkedin', 'tiktok.com': 'tiktok',
        'facebook.com': 'facebook', 'twitch.tv': 'twitch',
        'discord.com': 'discord', 'discord.gg': 'discord',
        'open.spotify.com': 'spotify', 'spotify.com': 'spotify',
        'calendly.com': 'calendar', 'cal.com': 'calendar',
        'medium.com': 'article', 'substack.com': 'article',
        'linktr.ee': 'link', 'beacons.ai': 'link'
      };
      for (var key in byHost) {
        if (host === key || host.slice(-(key.length + 1)) === '.' + key) return ICONS[byHost[key]];
      }
      if (host) return ICONS.globe;
      return ICONS[name] || ICONS.globe;
    }
    return ICONS.globe;
  }

  /** Picks an icon for a link: explicit choice, else URL type, else domain guess. */
  function iconForLink(link) {
    if (link.icon && link.icon !== 'auto') return icon(link.icon);
    var url = link.url || '';
    if (/^mailto:/i.test(url)) return ICONS.mail;
    if (/^tel:/i.test(url)) return ICONS.phone;
    var host = hostname(url);
    if (!host) return ICONS.link;
    var map = {
      'twitter.com': 'x', 'x.com': 'x',
      'instagram.com': 'instagram', 'github.com': 'github',
      'youtube.com': 'youtube', 'youtu.be': 'youtube',
      'linkedin.com': 'linkedin', 'tiktok.com': 'tiktok',
      'facebook.com': 'facebook', 'twitch.tv': 'twitch',
      'discord.com': 'discord', 'discord.gg': 'discord',
      'open.spotify.com': 'spotify', 'spotify.com': 'spotify',
      'calendly.com': 'calendar', 'cal.com': 'calendar',
      'medium.com': 'article', 'substack.com': 'article',
      'amazon.com': 'cart', 'shopify.com': 'cart', 'etsy.com': 'cart',
      'netflix.com': 'video', 'vimeo.com': 'video', 'twitch.tv': 'video'
    };
    for (var key in map) {
      if (host === key || host.slice(-(key.length + 1)) === '.' + key) return ICONS[map[key]];
    }
    return ICONS.globe;
  }

  /** Icon names available for manual selection in the editor. */
  var ICON_CHOICES = [
    { id: 'auto', name: 'Auto', icon: 'globe' },
    { id: 'link', name: 'Link', icon: 'link' },
    { id: 'globe', name: 'Website', icon: 'globe' },
    { id: 'mail', name: 'Email', icon: 'mail' },
    { id: 'x', name: 'X / Twitter', icon: 'x' },
    { id: 'instagram', name: 'Instagram', icon: 'instagram' },
    { id: 'github', name: 'GitHub', icon: 'github' },
    { id: 'youtube', name: 'YouTube', icon: 'youtube' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
    { id: 'tiktok', name: 'TikTok', icon: 'tiktok' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'twitch', name: 'Twitch', icon: 'twitch' },
    { id: 'discord', name: 'Discord', icon: 'discord' },
    { id: 'spotify', name: 'Spotify', icon: 'spotify' },
    { id: 'phone', name: 'Phone', icon: 'phone' },
    { id: 'cart', name: 'Shop', icon: 'cart' },
    { id: 'calendar', name: 'Booking', icon: 'calendar' },
    { id: 'video', name: 'Video', icon: 'video' },
    { id: 'article', name: 'Article', icon: 'article' },
    { id: 'heart', name: 'Favorite', icon: 'heart' }
  ];

  /* --------------------------------- Toasts -------------------------------- */

  function toast(message, type) {
    var root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      root.className = 'toast-root';
      root.setAttribute('role', 'status');
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
    var el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'info');
    var glyph = type === 'error' ? ICONS.alert : ICONS.check;
    el.innerHTML = '<span class="toast__icon">' + glyph + '</span><span></span>';
    el.lastChild.textContent = message;
    root.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { el.remove(); }, 250);
    }, 3200);
  }

  /** Native confirm wrapper with a default message. */
  function confirmAction(message) {
    return global.confirm(message);
  }

  /** Copies text to the clipboard with a fallback for older browsers. */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  /** Fills every [data-icon] element with its SVG (safe to run repeatedly). */
  function hydrateIcons(root) {
    var nodes = (root || document).querySelectorAll('[data-icon]:not([data-icon-done])');
    Array.prototype.forEach.call(nodes, function (el) {
      el.innerHTML = ICONS[el.getAttribute('data-icon')] || ICONS.globe;
      el.setAttribute('data-icon-done', '1');
      el.style.display = 'inline-flex';
    });
  }
  hydrateIcons(document);

  global.UI = {
    hydrateIcons: hydrateIcons,
    validateUrl: validateUrl,
    hostname: hostname,
    icon: icon,
    iconForLink: iconForLink,
    ICON_CHOICES: ICON_CHOICES,
    toast: toast,
    confirmAction: confirmAction,
    copyText: copyText,
    escapeHtml: escapeHtml,
    formatDate: formatDate
  };
})(window);
