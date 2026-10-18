/**
 * store.js — Data layer for the Link-in-Bio Builder.
 *
 * Current adapter: browser LocalStorage (prototype only).
 * Future Supabase integration: implement the same ProfileStore interface
 * with async calls (e.g. supabase.from('profiles').select()) and swap it in
 * here. Never place service-role or secret API keys in this frontend code —
 * only public, publishable anon keys via environment/config, and only after
 * Row Level Security policies are in place.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'linkinbio.profiles.v1';

  function uid() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function linkId() {
    return 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function defaultDesign() {
    return {
      theme: 'aurora',
      background: '',   // '' = use theme default
      buttonColor: '',  // '' = use theme default
      textColor: '',    // '' = use theme default
      shape: 'rounded'  // 'pill' | 'rounded' | 'square'
    };
  }

  function normalizeLink(raw) {
    raw = raw || {};
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : linkId(),
      title: typeof raw.title === 'string' ? raw.title : '',
      url: typeof raw.url === 'string' ? raw.url : '',
      icon: typeof raw.icon === 'string' ? raw.icon : 'auto',
      enabled: raw.enabled !== false
    };
  }

  function normalizeProfile(raw) {
    raw = raw || {};
    var design = raw.design || {};
    var links = Array.isArray(raw.links) ? raw.links.map(normalizeLink) : [];
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      name: typeof raw.name === 'string' ? raw.name : '',
      bio: typeof raw.bio === 'string' ? raw.bio : '',
      avatar: typeof raw.avatar === 'string' ? raw.avatar : '',
      design: {
        theme: typeof design.theme === 'string' ? design.theme : 'aurora',
        background: typeof design.background === 'string' ? design.background : '',
        buttonColor: typeof design.buttonColor === 'string' ? design.buttonColor : '',
        textColor: typeof design.textColor === 'string' ? design.textColor : '',
        shape: ['pill', 'rounded', 'square'].indexOf(design.shape) !== -1 ? design.shape : 'rounded'
      },
      links: links,
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now()
    };
  }

  function readAll() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeProfile);
    } catch (err) {
      console.warn('ProfileStore: failed to read storage', err);
      return [];
    }
  }

  function writeAll(list) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.error('ProfileStore: failed to write storage', err);
      return false;
    }
  }

  var ProfileStore = {
    /** Returns every profile saved in this browser, newest first. */
    list: function () {
      return readAll().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    },

    /** Returns a single profile by id, or null. */
    get: function (id) {
      if (!id) return null;
      var all = readAll();
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === id) return all[i];
      }
      return null;
    },

    /** Creates a profile (optional seed object) and persists it. */
    create: function (seed) {
      var profile = normalizeProfile(seed || {});
      profile.createdAt = Date.now();
      profile.updatedAt = profile.createdAt;
      var all = readAll();
      all.push(profile);
      writeAll(all);
      return profile;
    },

    /** Persists an existing profile (updates updatedAt). Returns normalized copy. */
    save: function (profile) {
      if (!profile) throw new Error('ProfileStore.save: profile is required');
      var normalized = normalizeProfile(profile);
      var all = readAll();
      var idx = -1;
      for (var i = 0; i < all.length; i++) {
        if (all[i].id === normalized.id) { idx = i; break; }
      }
      normalized.updatedAt = Date.now();
      if (idx === -1) {
        normalized.createdAt = normalized.createdAt || Date.now();
        all.push(normalized);
      } else {
        normalized.createdAt = all[idx].createdAt;
        all[idx] = normalized;
      }
      if (!writeAll(all)) throw new Error('Could not save profile — browser storage may be full.');
      return normalized;
    },

    /** Removes a profile by id. Returns true when found and removed. */
    remove: function (id) {
      var all = readAll();
      var next = all.filter(function (p) { return p.id !== id; });
      if (next.length === all.length) return false;
      return writeAll(next);
    },

    /** Creates a copy of a profile with a new id. */
    duplicate: function (id) {
      var original = this.get(id);
      if (!original) return null;
      var copy = normalizeProfile(original);
      copy.id = uid();
      copy.name = (copy.name || 'Untitled') + ' (copy)';
      copy.links = copy.links.map(function (l) { return normalizeLink(l); });
      return this.save(copy);
    },

    /** Builds the shareable URL for a profile (same device/browser only). */
    shareUrl: function (id) {
      var base = global.location.href.replace(/[^/]*$/, 'profile.html');
      return base + '?id=' + encodeURIComponent(id);
    }
  };

  global.ProfileStore = ProfileStore;
  global.ProfileStore.helpers = { uid: uid, linkId: linkId, defaultDesign: defaultDesign };
})(window);
