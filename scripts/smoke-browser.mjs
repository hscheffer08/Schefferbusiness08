import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173';

const routes = [
  { path: '/', title: /Conectaê/i, minText: 40 },
  { path: '/?planner=aprovacao', minText: 40 },
  { path: '/?experience=vestibulares-oficiais', minText: 40 },
  { path: '/?experience=faculdades', minText: 40 },
  { path: '/?experience=vocacional', minText: 40 },
  { path: '/?experience=match-faculdades', minText: 40 },
  { path: '/treino-entrevista', title: /Treino de entrevista.*Conectaê/i, minText: 40 },
  { path: '/como-funciona', minText: 40 },
  { path: '/metodologia', minText: 40 },
  { path: '/faq', minText: 40 },
  { path: '/privacidade', minText: 40 },
  { path: '/termos', minText: 40 },
  { path: '/rota-que-nao-existe', body: /Página não encontrada/i, minText: 20 },
];

const staticTitles = [
  { file: 'como-funciona/index.html', title: /<title>Como funciona \| Conectaê<\/title>/i },
  { file: 'metodologia/index.html', title: /<title>Metodologia \| Conectaê<\/title>/i },
  { file: 'faq/index.html', title: /<title>Perguntas frequentes \| Conectaê<\/title>/i },
  { file: 'privacidade/index.html', title: /<title>Política de Privacidade \| Conectaê<\/title>/i },
  { file: 'termos/index.html', title: /<title>Termos de Uso \| Conectaê<\/title>/i },
];

const failures = [];

for (const route of staticTitles) {
  try {
    const html = await readFile(join(process.cwd(), 'dist', route.file), 'utf8');
    if (!route.title.test(html)) throw new Error('title estático não corresponde ao esperado');
    console.log(`✓ static ${route.file}`);
  } catch (error) {
    failures.push(`static ${route.file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on('pageerror', (error) => {
  failures.push(`pageerror: ${error.message}`);
});

for (const route of routes) {
  try {
    const response = await page.goto(`${baseUrl}${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response?.status() ?? 'sem resposta'}`);
    }

    const title = await page.title();
    const bodyText = ((await page.locator('body').innerText()) || '').trim();

    if (route.title && !route.title.test(title)) {
      throw new Error(`título inesperado: ${JSON.stringify(title)}`);
    }

    if (route.body && !route.body.test(bodyText)) {
      throw new Error('conteúdo esperado não apareceu');
    }

    if (bodyText.length < route.minText) {
      throw new Error(`página praticamente vazia (${bodyText.length} caracteres)`);
    }

    console.log(`✓ ${route.path}`);
  } catch (error) {
    failures.push(`${route.path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

try {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${baseUrl}/treino-entrevista`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  });
  if (!response || !response.ok()) throw new Error(`HTTP ${response?.status() ?? 'sem resposta'}`);

  await page.getByRole('button', { name: 'Avaliar portfólio Link' }).click();
  await page.getByRole('heading', { name: 'O que sua trajetória demonstra?' }).waitFor({ state: 'visible' });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`overflow horizontal de ${overflow}px`);

  const controls = await page.locator('#activity-0-title, #activity-0-category, #activity-0-actions, #portfolio-context').evaluateAll((nodes) =>
    nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { id: node.id, left: rect.left, right: rect.right, width: rect.width };
    }),
  );
  const outOfViewport = controls.find((control) => control.left < -1 || control.right > 391 || control.width < 120);
  if (outOfViewport) throw new Error(`controle fora da viewport: ${outOfViewport.id}`);

  const optionalContext = page.getByText('Adicionar etapa escolar, motivação e documentos', { exact: true });
  await optionalContext.click();
  const fileInput = page.locator('#portfolio-file');
  const fileBox = await fileInput.boundingBox();
  if (!fileBox || fileBox.width < 120) throw new Error('upload opcional não abriu corretamente');

  const addButton = page.getByRole('button', { name: 'Adicionar experiência' });
  const box = await addButton.boundingBox();
  if (!box || box.height < 44) throw new Error('botão Adicionar experiência menor que 44px');

  console.log('✓ mobile /treino-entrevista → Avaliar portfólio Link');
} catch (error) {
  failures.push(`mobile portfolio: ${error instanceof Error ? error.message : String(error)}`);
}

await browser.close();

if (failures.length > 0) {
  console.error('\nSmoke browser encontrou problemas:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nTodos os fluxos públicos principais carregaram sem crash; títulos estáticos e avaliador de portfólio mobile foram validados.');
