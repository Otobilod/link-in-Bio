# Link-in-Bio Builder

A polished, responsive **Link-in-Bio Builder** built with HTML5, CSS3 and vanilla JavaScript — no frameworks, no build step.

## Run it

Open the project folder in your IDE (e.g. Antigravity) and start **Live Server** on `index.html`.
Any static file server works; the app uses only relative paths.

## Pages

| Page | Purpose |
|------|---------|
| `index.html` | **Dashboard** — list, create, edit, preview, copy URL and delete profiles; clear empty state |
| `editor.html` | **Editor** — profile name/bio/image, link add/edit/delete/hide/reorder (drag + arrows), design customization, live mobile/desktop preview, validation |
| `profile.html` | **Public profile page** — image, name, bio, icons and active links; friendly not-found page for unknown ids |

## Files

```
index.html  editor.html  profile.html
css/styles.css      → app shell, dashboard, editor (SaaS dashboard styling)
css/profile.css     → public profile + shared .pp preview styles
js/store.js         → data layer (LocalStorage adapter, Supabase-ready interface)
js/themes.js        → 7 themes, button shapes, color contrast helpers
js/ui.js            → icons, toasts, clipboard, URL validation, escaping
js/preview.js       → shared profile renderer (editor preview + public page)
js/dashboard.js     → dashboard behaviour
js/editor.js        → editor behaviour
js/profile.js       → public page behaviour
```

## Features

- **Live preview** that updates on every keystroke, with mobile (375px) and desktop modes.
- **7 themes** (Aurora, Midnight, Paper, Sunset, Forest, Bubblegum, Ocean) plus custom
  background / button / text colors and pill / rounded / square button shapes.
- **Link management**: title, URL, optional icon (auto-detected from the domain), show/hide
  toggle, reorder by drag-and-drop or accessible arrow buttons, delete with confirmation.
- **Validation**: URLs (auto-prepends `https://` to bare domains; allows `http(s)`, `mailto`,
  `tel` only), required names/titles, image URL checks — invalid fields get inline errors.
- **Safe external links**: `target="_blank"` + `rel="noopener noreferrer"` (mailto/tel exempt).
- **Persistence** with `localStorage`; data survives refresh.
- **Copy profile URL** with an explicit dialog explaining the prototype's limits.

## Storage honesty (important)

Profiles live in this browser's `localStorage` only. The share URL works **only in the same
browser/device that created the profile** — other visitors get the not-found page. Nothing is
published to the internet, and no fake auth, analytics or cloud publishing is simulated.

## Backend integration path (Supabase)

`js/store.js` exposes the whole data surface as `ProfileStore` (`list`, `get`, `save`, `create`,
`remove`, `duplicate`, `shareUrl`). To go live:

1. Create a Supabase project and a `profiles` table mirroring the profile object shape.
2. Replace the LocalStorage adapter internals with `supabase.from('profiles')…` calls
   (keep the same function names so the UI code does not change).
3. Add Supabase Auth if profiles must be user-owned, plus Row Level Security policies.
4. Use only the **public anon key** in frontend code. Service-role keys must never ship
   to the browser.

## Known limitations

- Local-only storage (see above) — no cross-device publishing without a backend.
- Large uploaded avatar images are limited to ~900 KB to stay within localStorage quotas.
- Link thumbnails/previews and analytics are intentionally not implemented (would need a backend).
