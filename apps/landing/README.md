# Layout Fixer — website

The landing page at [layoutfixer.dev](https://layoutfixer.dev). English at `/`, Arabic at `/ar/`.

Next.js (App Router, static export), React, TypeScript and CSS Modules. No analytics, no cookies, no
third-party requests. The live demo imports the real converter from `@layout-fixer/core`, and the design tokens
come from `@layout-fixer/ui`, so the site never drifts from the extension.

## Development

Run from the repository root:

```bash
npm install
npm run landing:dev      # http://localhost:3000
npm run check:landing    # lint, typecheck, unit tests, build, Playwright smoke tests
```

The first end-to-end run needs the browser: `npx playwright install chromium`.

This workspace keeps its own ESLint (`eslint-config-next`) and TypeScript 6: Next's type check needs the
TypeScript JS API, which TypeScript 7 doesn't have. Biome formats it like the rest of the repo.

Copy lives in `lib/i18n/en.ts` and `lib/i18n/ar.ts`. The tests fail if the two drift apart.

## Promo video

`public/video/layout-fixer.mp4` and its poster are rendered from `apps/promo-video`:

```bash
cd apps/promo-video && npm install && npm run render
cp out/layout-fixer.mp4 ../landing/public/video/
npx remotion still LayoutFixer ../landing/public/video/layout-fixer-poster.jpg --frame=560 --image-format=jpeg --scale=0.6667
```

## Deploying

Merging to `main` deploys automatically: `.github/workflows/deploy-landing.yml` runs the full check, then
`deploy/deploy.sh`, which rsyncs `out/` to the server and rebuilds the nginx container behind the shared Caddy
proxy. It needs these secrets in the `landing-production` environment:

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_KEY` | private half of a deploy-only SSH key |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan` output for the server |
| `DEPLOY_HOSTNAME` | server address |
| `DEPLOY_USER` | SSH user |

To deploy by hand from your machine (uses your `myserver-saber` SSH alias):

```bash
SITE_URL=https://layoutfixer.dev npm run deploy -w @layout-fixer/landing
```
