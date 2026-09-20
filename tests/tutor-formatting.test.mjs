import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeTutorMarkdown } from '../src/lib/tutor-markdown.ts';
const render = text => renderToStaticMarkup(React.createElement(Markdown, {
  remarkPlugins: [remarkMath], rehypePlugins: [[rehypeKatex, { trust: false }]], skipHtml: true,
}, normalizeTutorMarkdown(text)));
const sample = String.raw`**Fórmula de Bhaskara:**
\[x=\frac{-b\pm\sqrt{\Delta}}{2a}\]

1. Calcular o discriminante.
2. Encontrar as raízes: \(x=2\) e \(x=3\).
`;
const html = render(sample);
assert.match(html, /class="katex"/);
assert.match(html, /<math/);
assert.match(html, /<ol>/);
assert.match(html, /<strong>Fórmula de Bhaskara/);
assert.doesNotMatch(html, /katex-error/);
assert.equal(normalizeTutorMarkdown('Primeiro\\n\\n**Segundo**\\n'), 'Primeiro\n\n**Segundo**\n');
assert.equal(normalizeTutorMarkdown(String.raw`\(\nu + \nabla f\)`), String.raw`$\nu + \nabla f$`);
assert.equal(normalizeTutorMarkdown('`\\n`'), '`\\n`');
assert.doesNotMatch(render('<script>alert(1)</script>\n\n[link](javascript:alert)'), /<script|href="javascript:/);
assert.doesNotMatch(render(String.raw`\[\frac{1}{\sqrt{x^2+1}}\]`), /katex-error/);
console.log('PASS: real/escaped newlines, nested formulas, lists, TeX nu/nabla, code and unsafe HTML.');
