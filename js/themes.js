/**
 * themes.js — Theme presets and design resolution for the Link-in-Bio Builder.
 * Each theme supplies: background (color or gradient), text color,
 * button background (solid hex so contrast can be calculated) and card tint.
 */
(function (global) {
  'use strict';

  var THEMES = {
    aurora: {
      id: 'aurora',
      name: 'Aurora',
      swatch: 'linear-gradient(135deg, #6d5dfc, #2dd4bf)',
      background: 'linear-gradient(160deg, #6d5dfc 0%, #8b5cf6 45%, #2dd4bf 100%)',
      text: '#ffffff',
      buttonBg: '#ffffff',
      cardTint: 'rgba(255,255,255,0.14)'
    },
    midnight: {
      id: 'midnight',
      name: 'Midnight',
      swatch: 'linear-gradient(135deg, #0f172a, #1e293b)',
      background: 'linear-gradient(180deg, #0b1120 0%, #111a2e 60%, #0b1120 100%)',
      text: '#e2e8f0',
      buttonBg: '#38bdf8',
      cardTint: 'rgba(148,163,184,0.12)'
    },
    paper: {
      id: 'paper',
      name: 'Paper',
      swatch: 'linear-gradient(135deg, #f6f3ee, #e7e0d5)',
      background: 'linear-gradient(180deg, #f7f4ef 0%, #ece6db 100%)',
      text: '#1f2430',
      buttonBg: '#1f2430',
      cardTint: 'rgba(31,36,48,0.06)'
    },
    sunset: {
      id: 'sunset',
      name: 'Sunset',
      swatch: 'linear-gradient(135deg, #ff7a59, #ff2e93)',
      background: 'linear-gradient(165deg, #ff9a54 0%, #ff5f6d 55%, #ff2e93 100%)',
      text: '#fff7f2',
      buttonBg: '#2b1a2e',
      cardTint: 'rgba(43,26,46,0.16)'
    },
    forest: {
      id: 'forest',
      name: 'Forest',
      swatch: 'linear-gradient(135deg, #14532d, #4ade80)',
      background: 'linear-gradient(170deg, #052e16 0%, #14532d 55%, #166534 100%)',
      text: '#e8fbe9',
      buttonBg: '#a7f3d0',
      cardTint: 'rgba(167,243,208,0.14)'
    },
    bubblegum: {
      id: 'bubblegum',
      name: 'Bubblegum',
      swatch: 'linear-gradient(135deg, #fbcfe8, #f472b6)',
      background: 'linear-gradient(165deg, #fde7f1 0%, #fbcfe8 45%, #f9a8d4 100%)',
      text: '#5b1749',
      buttonBg: '#5b1749',
      cardTint: 'rgba(91,23,73,0.10)'
    },
    ocean: {
      id: 'ocean',
      name: 'Ocean',
      swatch: 'linear-gradient(135deg, #0ea5e9, #0f766e)',
      background: 'linear-gradient(170deg, #0c4a6e 0%, #075985 50%, #0e7490 100%)',
      text: '#ecfeff',
      buttonBg: '#67e8f9',
      cardTint: 'rgba(103,232,249,0.14)'
    }
  };

  var SHAPES = {
    pill: { id: 'pill', name: 'Pill', radius: '999px' },
    rounded: { id: 'rounded', name: 'Rounded', radius: '14px' },
    square: { id: 'square', name: 'Square', radius: '4px' }
  };

  /** Parses #rgb / #rrggbb into {r,g,b} or null. */
  function hexToRgb(hex) {
    if (typeof hex !== 'string') return null;
    var m = /^#?([0-fA-F]{3}|[0-fA-F]{6})$/.exec(hex.trim());
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  /** Relative luminance of a hex color (0..1). */
  function luminance(hex) {
    var c = hexToRgb(hex);
    if (!c) return 0;
    function channel(v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  }

  /** Picks black or white text for readable contrast on `bg`. */
  function contrastText(bg) {
    var l = luminance(bg);
    return l > 0.45 ? '#111318' : '#ffffff';
  }

  /**
   * Resolves a profile's design into concrete styles for rendering.
   * Theme defaults are applied first; user customizations override them.
   */
  function resolveDesign(design) {
    design = design || {};
    var theme = THEMES[design.theme] || THEMES.aurora;
    var background = (design.background && hexToRgb(design.background))
      ? design.background
      : theme.background;
    var buttonBg = (design.buttonColor && hexToRgb(design.buttonColor))
      ? design.buttonColor
      : theme.buttonBg;
    var text = (design.textColor && hexToRgb(design.textColor))
      ? design.textColor
      : theme.text;
    var shape = SHAPES[design.shape] || SHAPES.rounded;

    return {
      themeId: theme.id,
      themeName: theme.name,
      background: background,
      text: text,
      textMuted: text, // opacity applied via rgba in CSS
      buttonBg: buttonBg,
      buttonText: contrastText(buttonBg),
      cardTint: theme.cardTint,
      radius: shape.radius,
      shapeName: shape.name
    };
  }

  global.Themes = {
    list: THEMES,
    shapes: SHAPES,
    resolve: resolveDesign,
    contrastText: contrastText,
    luminance: luminance
  };
})(window);
