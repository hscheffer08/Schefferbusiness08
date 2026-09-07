import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const sourcePath = join(distDir, 'index.html');
const baseHtml = await readFile(sourcePath, 'utf8');
const origin = 'https://xn--conecta-pya.app';

const pages = [
  {
    path: '/treino-entrevista',
    title: 'Treino de entrevista para Insper e Link | Conectaê',
    description: 'Pratique entrevistas de admissão para Insper e Link com 10 perguntas adaptativas, feedback por competência e plano de melhoria.',
  },
  {
    path: '/como-funciona',
    title: 'Como funciona | Conectaê',
    description: 'Entenda como o Conectaê transforma seu perfil, suas notas e suas dificuldades em recomendações e um plano de estudo adaptativo.',
  },
  {
    path: '/metodologia',
    title: 'Metodologia | Conectaê',
    description: 'Conheça os critérios usados pelo Conectaê no match de faculdades, diagnóstico de dificuldades e personalização do plano de estudos.',
  },
  {
    path: '/faq',
    title: 'Perguntas frequentes | Conectaê',
    description: 'Respostas sobre conta, privacidade, plano de estudos, questões, simulados, match de faculdades e funcionamento do Conectaê.',
  },
  {
    path: '/privacidade',
    title: 'Política de Privacidade | Conectaê',
    description: 'Saiba como o Conectaê trata, protege e compartilha dados mediante consentimento.',
  },
  {
    path: '/termos',
    title: 'Termos de Uso | Conectaê',
    description: 'Consulte os termos de uso da plataforma Conectaê.',
  },
];

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function replaceMeta(html, selector, value) {
  const escaped = escapeAttribute(value);
  const expression = new RegExp(`(<meta\\s+${selector}\\s+content=")[^"]*("\\s*\\/?>)`, 'i');
  return html.replace(expression, `$1${escaped}$2`);
}

function renderPage(page) {
  const canonicalUrl = `${origin}${page.path}`;
  let html = baseHtml;

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${page.title}</title>`);
  html = replaceMeta(html, 'name="description"', page.description);
  html = replaceMeta(html, 'property="og:url"', canonicalUrl);
  html = replaceMeta(html, 'property="og:title"', page.title);
  html = replaceMeta(html, 'property="og:description"', page.description);
  html = replaceMeta(html, 'name="twitter:title"', page.title);
  html = replaceMeta(html, 'name="twitter:description"', page.description);
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );

  const webPageJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title.replace(/ \| Conectaê$/, ''),
    url: canonicalUrl,
    description: page.description,
    inLanguage: 'pt-BR',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Conectaê',
      url: `${origin}/`,
    },
  });

  html = html.replace(
    '</head>',
    `    <script type="application/ld+json">${webPageJsonLd}</script>\n  </head>`,
  );

  return html;
}

for (const page of pages) {
  const targetDir = join(distDir, page.path.slice(1));
  await mkdir(targetDir, { recursive: true });
  await writeFile(join(targetDir, 'index.html'), renderPage(page), 'utf8');
}

console.log(`Generated ${pages.length} route-specific HTML shells.`);
