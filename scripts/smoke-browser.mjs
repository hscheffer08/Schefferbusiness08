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
  { path: '/como-funciona', title: /Como funciona.*Conectaê/i, minText: 40 },
  { path: '/metodologia', title: /Metodologia.*Conectaê/i, minText: 40 },
  { path: '/faq', title: /Perguntas frequentes.*Conectaê/i, minText: 40 },
  { path: '/privacidade', title: /Política de Privacidade.*Conectaê/i, minText: 40 },
  { path: '/termos', title: /Termos de Uso.*Conectaê/i, minText: 40 },
  { path: '/rota-que-nao-existe', body: /Página não encontrada/i, minText: 20 },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const failures = [];

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

await browser.close();

if (failures.length > 0) {
  console.error('\nSmoke browser encontrou problemas:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nTodos os fluxos públicos principais carregaram sem crash.');
