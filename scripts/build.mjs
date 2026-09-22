// Builds the static site: src/pages/*.html wrapped in src/layout.html,
// plus src/static/ copied as-is, into dist/. Zero dependencies.
//
//   node scripts/build.mjs
//
// Env: SITE_URL (canonical origin + path, no trailing slash) and BASE_PATH
// (URL path the site is served from; used only by 404.html, which GitHub
// Pages serves at arbitrary depths so it cannot use relative links).

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, chain, blessings, bars, faq, icons } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const SITE_URL = (process.env.SITE_URL || site.url).replace(/\/$/, '');
const BASE_PATH = process.env.BASE_PATH || site.basePath;
const VERSION = Date.now().toString(36);

const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const fragments = {
  chain: chain
    .map(
      (f) => `<li>
                <img src="assets/fruits/${f.file}.png" alt="" width="128" height="128" loading="lazy" style="--s:${f.size}" />
                <span class="tier-name">${f.name}</span>
                <span class="tier-pts">${f.pts ? `+${f.pts}` : 'start'}</span>
              </li>`,
    )
    .join('\n              '),
  blessings: blessings
    .map(
      (b, i) => `<article class="blessing reveal${b.charges ? ' is-active' : ''}" style="--tone:${b.tone};--d:${i % 4}">
              <div class="blessing-icon"><img src="assets/icons/${b.icon}.svg" alt="" width="32" height="32" loading="lazy" /></div>
              <h3>${b.name}</h3>
              <p>${b.text}</p>
              <div class="tag"><span>${b.charges ? `${b.charges} uses · +1 every ${b.recharge} merges` : 'Passive'}</span></div>
            </article>`,
    )
    .join('\n            '),
  bars: bars
    .map(
      (b) => `<li class="bar${b.base ? ' is-base' : ''}" style="--v:${b.value}">
              <span class="bar-name">${b.name}</span>
              <span class="bar-track"><span class="bar-fill"></span></span>
              <span class="bar-val">${b.value.toFixed(2)}×</span>
            </li>`,
    )
    .join('\n            '),
  faq: faq
    .map(
      (q) => `<details>
              <summary>${q.q}</summary>
              <p>${q.a}</p>
            </details>`,
    )
    .join('\n            '),
};

function jsonLd() {
  const game = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Fruit Drop',
    description: site.description,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/og-image.png`,
    genre: ['Puzzle', 'Casual', 'Roguelike'],
    gamePlatform: 'iOS',
    operatingSystem: 'iOS',
    applicationCategory: 'GameApplication',
    playMode: 'SinglePlayer',
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a.replace(/<[^>]+>/g, '') },
    })),
  };
  return [game, faqPage]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n    ');
}

function parsePage(file) {
  const raw = readFileSync(join(SRC, 'pages', file), 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`${file}: missing <!--meta {...} --> header`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

function render(file) {
  const { meta, body } = parsePage(file);
  const is404 = file === '404.html';
  const root = is404 ? BASE_PATH : '';
  const canonical = `${SITE_URL}/${meta.path}`;
  const vars = {
    title: escapeHtml(meta.title),
    description: escapeHtml(meta.description),
    canonical,
    siteUrl: SITE_URL,
    root,
    version: VERSION,
    repo: site.repo,
    issues: site.issues,
    email: site.email,
    robots: is404 ? 'noindex' : 'index, follow',
    head: meta.jsonld ? jsonLd() : '',
    scripts: (meta.scripts || [])
      .map((s) => `<script type="module" src="${root}${s}?v=${VERSION}"></script>`)
      .join('\n    '),
  };

  const layout = readFileSync(join(SRC, 'layout.html'), 'utf8');
  let html = layout.replace('{{content}}', body.trimEnd());
  html = html.replace(/\{\{current:(\w+)\}\}/g, (_, n) => (n === meta.nav ? ' aria-current="page"' : ''));
  html = html.replace(/\{\{icon:(\w+)\}\}/g, (_, n) => {
    if (!icons[n]) throw new Error(`${file}: unknown icon "${n}"`);
    return icons[n];
  });
  html = html.replace(/\{\{(\w+)\}\}/g, (all, k) => {
    if (k in vars) return vars[k];
    if (k in fragments) return fragments[k];
    throw new Error(`${file}: unknown placeholder ${all}`);
  });
  return { html, meta };
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(SRC, 'static'), DIST, { recursive: true });

const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.html'));
const indexed = [];
for (const file of pages) {
  const { html, meta } = render(file);
  writeFileSync(join(DIST, file), html);
  if (file !== '404.html') indexed.push(meta.path);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexed
  .sort()
  .map((p) => `  <url><loc>${SITE_URL}/${p}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`,
);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writeFileSync(join(DIST, '.nojekyll'), '');

console.log(`Built ${pages.length} pages into dist/ (${SITE_URL}, base ${BASE_PATH})`);
