# Layout Fixer promo video

A 40-second promo (1920×1080, 30 fps) made with [Remotion](https://www.remotion.dev). The scenes import the
real converter and layout data from `packages/core`, so every converted string, keycap legend and count on
screen comes from the code, not from copy.

| Scene | Shows |
|-------|-------|
| Hook | `hgsghl ugd;l ;dt phg;?` typed with the wrong layout |
| Keyboard | Each key lights up while `convertBetween(text, 'en-us', 'ar-pc')` builds السلام عليكم |
| Fix | Select → Alt+Shift+F → replaced in place, Ctrl+Z undoes it |
| Both ways | `detectDirection` picks en → ar or ar → en |
| Everywhere | Chromium browsers, desktop app, four ways to fix |
| Private | 0 network calls, 0 sites read until you opt in, 47 keys, 3 layouts |
| Outro | The U key types ع — which becomes the logo |

It is not an npm workspace, so it never affects `npm run check` or CI.

```bash
cd apps/promo-video
npm install
npm run dev      # Remotion Studio
npm run render   # out/layout-fixer.mp4
```

On a filesystem that rejects `?` in file names (NTFS), Remotion can't save its browser download. Point it at
an installed Chromium instead: `npm run render -- --browser-executable=/path/to/chrome-headless-shell`.

Remotion is free for individuals and teams of up to three; larger companies need a
[company license](https://www.remotion.pro/license).
