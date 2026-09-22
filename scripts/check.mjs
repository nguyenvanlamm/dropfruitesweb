// Post-build check: every local href/src in dist/*.html must resolve to a
// file, and every #fragment on a local page must exist as an id.
//
//   node scripts/check.mjs

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './content.mjs';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE_PATH = process.env.BASE_PATH || site.basePath;

if (!existsSync(DIST)) {
  console.error('dist/ missing — run `npm run build` first.');
  process.exit(1);
}

const pages = readdirSync(DIST).filter((f) => f.endsWith('.html'));
const idsOf = new Map(
  pages.map((p) => [p, new Set([...readFileSync(join(DIST, p), 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]),
);

const errors = [];
for (const page of pages) {
  const html = readFileSync(join(DIST, page), 'utf8');
  for (const [, attr, url] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    const [pathPart, hash] = url.split('#');
    const path = pathPart.split('?')[0];
    let target = page;
    if (path) {
      if (path.startsWith('/')) {
        if (!path.startsWith(BASE_PATH)) {
          errors.push(`${page}: ${attr}="${url}" is absolute outside ${BASE_PATH}`);
          continue;
        }
        target = normalize(path.slice(BASE_PATH.length));
      } else {
        target = normalize(join(dirname(page), path));
      }
      const file = join(DIST, target);
      if (!existsSync(file) || !statSync(file).isFile()) {
        errors.push(`${page}: ${attr}="${url}" → missing ${target}`);
        continue;
      }
    }
    if (hash && target.endsWith('.html') && !idsOf.get(target)?.has(hash)) {
      errors.push(`${page}: ${attr}="${url}" → no #${hash} in ${target}`);
    }
  }
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${page}: missing <title>`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${page}: missing description`);
  if (/\{\{\w/.test(html)) errors.push(`${page}: unrendered placeholder`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${pages.length} pages, all local links resolve.`);
