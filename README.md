# Fruit Drop: feedback, support, and the website

<p align="center"><img src="src/static/og-image.png" alt="Fruit Drop: drop fruit, merge up, pick your luck" width="720" /></p>

This is the public home of **Fruit Drop**, a physics merge game for iPhone with a roguelike twist. Open an issue to report a bug, suggest a blessing, or ask a question. Every issue gets read.

[**Report a bug →**](https://github.com/luongnv89/dropfruites/issues/new?template=bug_report.yml) · [**Suggest an idea →**](https://github.com/luongnv89/dropfruites/issues/new?template=feature_request.yml) · [**General feedback →**](https://github.com/luongnv89/dropfruites/issues/new?template=feedback.yml) · [**Email**](mailto:luongnv89@gmail.com)

> **Coming soon to the App Store.** Click **Watch → Custom → Releases** at the top of this page to get the App Store link the day it goes live.
> Website: [luongnv89.github.io/dropfruites](https://luongnv89.github.io/dropfruites/)

## Reporting a bug

| Include | Example |
|---|---|
| iPhone model and iOS version | iPhone 15, iOS 26.0 |
| App version | Settings → Apps → Fruit Drop |
| What happened | Two lemons touched but didn't merge |
| What you did just before | Held Magnet, used Cleaver on a Pear |

A screenshot or short screen recording helps a lot. [Search open issues](https://github.com/luongnv89/dropfruites/issues) first. If yours is already there, add a 👍 or a comment.

---

<details>
<summary>Website development (this repo)</summary>

A static site with no framework and no runtime dependencies. `scripts/build.mjs` wraps each page in `src/pages/` with `src/layout.html` and copies `src/static/` into `dist/`.

```bash
npm run build     # src/ → dist/ (pages, sitemap.xml, robots.txt, .nojekyll)
npm run check     # every local href/src and #anchor in dist/ resolves
npm run serve     # preview at http://localhost:4173/dropfruites/ (same base path as Pages)
npm test          # build + check
```

Requires Node 20+. Nothing to install.

| Path | What it is |
|---|---|
| `src/layout.html` | Shared `<head>`, header, and footer |
| `src/pages/*.html` | Page bodies, each with a `<!--meta {json} -->` header (title, description, path) |
| `scripts/content.mjs` | Fruit ladder, blessings, bot balance numbers, FAQ, inline icons |
| `src/static/assets/js/bin.js` | The playable mini bin in the hero (canvas and Verlet physics) |
| `scripts/og-image.py` | Regenerates `og-image.png` from the game art (needs Pillow) |

Fruit radii, scores, and blessing numbers mirror the game's engine tables. Update `scripts/content.mjs` when they change.

### Deploying

Every push to `main` runs [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml): build → link check → deploy `dist/` to GitHub Pages. Pull requests run build and check only.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

For a custom domain, add `src/static/CNAME`, then build with `SITE_URL=https://your.domain BASE_PATH=/` (in the workflow's build step).

### Launch day

When the App Store listing is live, replace the "Coming soon" badge and the **Get Notified** buttons in `src/pages/index.html` with the App Store link, and move the 1.0.0 changelog entry from *Upcoming* to its release date.

</details>

## Credits

Fruit art: Microsoft [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT). Blessing icons: Lorc and Delapouite, [game-icons.net](https://game-icons.net) (CC BY 3.0). Font: [Fredoka](https://fonts.google.com/specimen/Fredoka) (OFL 1.1). The full table is on the [credits page](https://luongnv89.github.io/dropfruites/credits.html).

© Fruit Drop. All rights reserved. Third-party assets remain under their own licenses.
