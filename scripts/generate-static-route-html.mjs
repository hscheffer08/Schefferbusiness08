import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { SEO_PAGES, SITE_ORIGIN } from '../src/lib/seo-pages.ts';

const distDir = resolve('dist');
const baseHtml = await readFile(join(distDir, 'index.html'), 'utf8');
const temporaryDir = resolve('.seo-build');
// Render public content at build time. No account, database or AI calls are made.
await build({ build: { ssr: 'scripts/prerender-entry.tsx', outDir: temporaryDir, emptyOutDir: true, minify: false } });
const { render } = await import(pathToFileURL(join(temporaryDir, 'prerender-entry.js')).href);
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function replaceMeta(html, selector, value) {
  return html.replace(new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*("\\s*\\/?>)`, 'i'), (_match, start, end) => `${start}${escape(value)}${end}`);
}
for (const page of SEO_PAGES) {
  const url = `${SITE_ORIGIN}${page.path}`;
  let html = baseHtml.replace(/<title>[^<]*<\/title>/i, `<title>${escape(page.title)}</title>`);
  for (const [selector, value] of [['name="description"', page.description], ['property="og:url"', url], ['property="og:title"', page.title], ['property="og:description"', page.description], ['name="twitter:title"', page.title], ['name="twitter:description"', page.description]]) html = replaceMeta(html, selector, value);
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${url}"/>`);
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', '@id': `${url}#webpage`, name: page.heading, url, description: page.description, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE_ORIGIN}/#website` } }).replaceAll('<', '\\u003c');
  html = html.replace('</head>', `<script type="application/ld+json">${schema}</script></head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${render(page)}</div>`);
  const targetDir = page.path === '/' ? distDir : join(distDir, page.path.slice(1));
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, 'index.html'), html);
}
// Canonical public URLs only. Omit invented modification dates.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SEO_PAGES.map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(join(distDir, 'sitemap.xml'), sitemap);
await rm(temporaryDir, { recursive: true, force: true });
console.log(`Prerendered ${SEO_PAGES.length} public pages and generated canonical sitemap.`);
