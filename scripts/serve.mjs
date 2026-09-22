// Serves dist/ under the GitHub Pages base path, so local previews catch
// the same path bugs production would. Missing files get dist/404.html.
//
//   npm run build && npm run serve   →  http://localhost:4173/dropfruites/

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from './content.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const BASE = process.env.BASE_PATH || site.basePath;
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/' || url + '/' === BASE) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }
  let rel = url.startsWith(BASE) ? url.slice(BASE.length) : null;
  if (rel !== null) {
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const file = join(DIST, normalize(rel));
    if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(readFileSync(file));
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': TYPES['.html'] });
  res.end(readFileSync(join(DIST, '404.html')));
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`));
