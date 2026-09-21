/**
 * Gubernajur - Advcontroller Reverse Engineering
 * Explora todas as telas do Advcontroller e gera mapa completo de funcionalidades
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Credenciais
const CREDENTIALS = {
  email: 'adv.davipereira@gmail.com',
  password: 'coringao123'
};

const BASE_URL = 'https://app.advcontroller.com.br';
const OUTPUT_DIR = 'C:/Users/davi9/gubernajur/reverse-engineering';

// Resultados
const results = {
  menus: [],
  pages: {},
  screenshots: [],
  errors: []
};

(async () => {
  console.log('🚀 Iniciando exploração do Advcontroller...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Ativar interceptação de rede para capturar APIs
  const apiCalls = [];
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      apiCalls.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
    }
  });

  try {
    // ========== LOGIN ==========
    console.log('1️⃣  Fazendo login...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"], input[name="email"], input[id="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"], input[id="password"]', CREDENTIALS.password);

    // Tentar encontrar e clicar no botão de login
    const loginBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")').first();
    await loginBtn.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`   URL após login: ${currentUrl}`);

    // Salvar screenshot do dashboard
    await page.screenshot({ path: `${OUTPUT_DIR}/01-dashboard.png`, fullPage: true });
    console.log('   ✅ Dashboard capturado\n');

    // ========== MAPEAR MENUS ==========
    console.log('2️⃣  Mapeando menus e navegação...');

    // Coletar todos os links do menu
    const menuSelectors = [
      'nav a', 'aside a', '[role="navigation"] a', '.sidebar a', '.menu a',
      'ul li a', '.nav a', '.sidebar-menu a', '[class*="menu"] a',
      'a[class*="nav"], a[class*="menu"], a[class*="sidebar"]'
    ];

    let allMenuLinks = [];
    for (const selector of menuSelectors) {
      try {
        const links = await page.locator(selector).all();
        for (const link of links) {
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          const className = await link.getAttribute('class');
          if (href && !allMenuLinks.find(l => l.href === href)) {
            allMenuLinks.push({ href, text: text?.trim(), className });
          }
        }
      } catch (e) {}
    }

    // Também capturar menus de dropdown
    const dropdownTriggers = await page.locator('[class*="dropdown"], [class*="submenu"], [data-toggle], [aria-haspopup]').all();
    for (const trigger of dropdownTriggers) {
      try {
        await trigger.hover();
        await page.waitForTimeout(500);
        const submenus = await page.locator('a[href]').all();
        for (const sub of submenus) {
          const href = await sub.getAttribute('href');
          const text = await sub.textContent();
          if (href && !allMenuLinks.find(l => l.href === href)) {
            allMenuLinks.push({ href, text: text?.trim(), type: 'dropdown' });
          }
        }
      } catch (e) {}
    }

    console.log(`   Encontrados ${allMenuLinks.length} links de menu`);
    results.menus = allMenuLinks;

    // ========== NAVEGAR POR CADA PÁGINA ==========
    console.log('3️⃣  Navegando por cada seção...\n');

    // Categorias comuns em sistemas de advocacia
    const categories = [
      // Processos
      { name: 'Processos', keywords: ['processo', 'pj', 'peça'] },
      { name: 'Clientes', keywords: ['cliente', 'parte', 'pessoa'] },
      { name: 'Agenda', keywords: ['agenda', 'audiência', 'compromisso', 'calendário'] },
      { name: 'Financeiro', keywords: ['financeiro', 'contas', 'pagamento', 'receber', 'pagar'] },
      { name: 'Modelos', keywords: ['modelo', 'peça', 'documento', 'template'] },
      { name: 'Dashboard', keywords: ['dashboard', 'painel', 'métricas'] },
      { name: 'Configurações', keywords: ['config', 'preferência', 'sistema'] },
      { name: 'Usuários', keywords: ['usuário', 'advogado', 'equipe'] },
      { name: 'Relatórios', keywords: ['relatório', 'relatorio'] },
      { name: 'Notificações', keywords: ['notificação', 'alerta'] }
    ];

    // Navegar por todos os links únicos do menu
    const visitedUrls = new Set();
    for (const menuItem of allMenuLinks) {
      if (!menuItem.href || menuItem.href.startsWith('#') || menuItem.href.includes('javascript')) continue;

      let fullUrl = menuItem.href.startsWith('http') ? menuItem.href : `${BASE_URL}${menuItem.href}`;
      if (visitedUrls.has(fullUrl)) continue;
      visitedUrls.add(fullUrl);

      try {
        console.log(`   📄 ${menuItem.text} → ${menuItem.href}`);

        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);

        // Categorizar a página
        let category = 'Outro';
        const urlLower = menuItem.href.toLowerCase();
        const textLower = (menuItem.text || '').toLowerCase();

        for (const cat of categories) {
          if (cat.keywords.some(k => urlLower.includes(k) || textLower.includes(k))) {
            category = cat.name;
            break;
          }
        }

        // Extrair conteúdo da página
        const pageData = await extractPageContent(page, menuItem.text);

        // Salvar screenshot
        const safeName = (menuItem.text || menuItem.href).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const screenshotPath = `${OUTPUT_DIR}/pages/${safeName}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        results.pages[menuItem.href] = {
          name: menuItem.text,
          category,
          url: fullUrl,
          screenshot: screenshotPath,
          ...pageData
        };

        console.log(`      ✅ ${category}: ${Object.keys(pageData.forms || {}).length} formulários, ${pageData.tables?.length || 0} tabelas`);

      } catch (e) {
        console.log(`      ❌ Erro: ${e.message}`);
        results.errors.push({ url: menuItem.href, error: e.message });
      }
    }

    // ========== VOLTAR AO DASHBOARD E CAPTURAR MAIS DETALHES ==========
    console.log('\n4️⃣  Capturando detalhes adicionais...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Capturar widgets do dashboard
    const dashboardWidgets = await page.evaluate(() => {
      const widgets = [];
      document.querySelectorAll('[class*="card"], [class*="widget"], [class*="tile"], section, [class*="stat"]').forEach(el => {
        const text = el.textContent?.substring(0, 100);
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 50) {
          widgets.push({
            tag: el.tagName,
            class: el.className.substring(0, 50),
            text: text?.trim(),
            position: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
          });
        }
      });
      return widgets;
    });

    results.pages['dashboard'] = {
      ...results.pages['dashboard'],
      widgets: dashboardWidgets
    };

    // ========== TENTAR NAVEGAR POR ROTAS COMUNS ==========
    console.log('5️⃣  Verificando rotas comuns...\n');

    const commonRoutes = [
      '/processos', '/processos/novo', '/processos/lista',
      '/clientes', '/clientes/novo', '/clientes/lista',
      '/agenda', '/calendario',
      '/financeiro', '/financeiro/contas', '/financeiro/receber', '/financeiro/pagar',
      '/modelos', '/modelos/lista',
      '/configuracoes', '/config', '/settings',
      '/usuarios', '/usuarios/lista',
      '/relatorios', '/dashboard',
      '/tarefas', '/atividades',
      '/documentos', '/arquivos'
    ];

    for (const route of commonRoutes) {
      const url = `${BASE_URL}${route}`;
      if (visitedUrls.has(url)) continue;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);

        const title = await page.title();
        if (title && !title.includes('404') && !title.includes('não encontrado')) {
          console.log(`   ✅ ${route} → ${title}`);

          const pageData = await extractPageContent(page, route);
          const safeName = route.replace(/\//g, '_').substring(0, 30);
          await page.screenshot({ path: `${OUTPUT_DIR}/routes/${safeName}.png`, fullPage: true });

          results.pages[route] = {
            name: title,
            url,
            screenshot: `${OUTPUT_DIR}/routes/${safeName}.png`,
            ...pageData
          };
        }
      } catch (e) {}
    }

    // ========== SALVAR RESULTADOS ==========
    console.log('\n6️⃣  Salvando resultados...');

    // Salvar JSON completo
    fs.writeFileSync(
      `${OUTPUT_DIR}/exploracao_completa.json`,
      JSON.stringify(results, null, 2)
    );

    // Gerar relatório em Markdown
    const report = generateMarkdownReport(results);
    fs.writeFileSync(`${OUTPUT_DIR}/RELATORIO_EXPLORACAO.md`, report);

    console.log('\n✅ Exploração concluída!');
    console.log(`📁 Resultados salvos em: ${OUTPUT_DIR}`);
    console.log(`📊 Páginas exploradas: ${Object.keys(results.pages).length}`);
    console.log(`🔗 Links de menu: ${results.menus.length}`);
    console.log(`❌ Erros: ${results.errors.length}`);

  } catch (error) {
    console.error('❌ Erro na exploração:', error);
    results.errors.push({ phase: 'main', error: error.message });
  } finally {
    await browser.close();
  }
})();

/**
 * Extrai conteúdo estruturado de uma página
 */
async function extractPageContent(page, pageName) {
  const data = {
    title: await page.title(),
    headings: [],
    forms: {},
    tables: [],
    buttons: [],
    inputs: [],
    cards: [],
    links: []
  };

  try {
    // Headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    data.headings = headings.filter(h => h?.trim()).map(h => h.trim());

    // Formulários
    const forms = await page.locator('form').all();
    for (let i = 0; i < forms.length; i++) {
      const formData = {
        id: await forms[i].getAttribute('id') || `form-${i}`,
        action: await forms[i].getAttribute('action'),
        inputs: []
      };

      const inputs = await forms[i].locator('input, select, textarea').all();
      for (const input of inputs) {
        formData.inputs.push({
          type: await input.getAttribute('type') || await input.locator('select, textarea').count() ? 'select/textarea' : 'unknown',
          name: await input.getAttribute('name'),
          id: await input.getAttribute('id'),
          placeholder: await input.getAttribute('placeholder'),
          required: await input.getAttribute('required') !== null
        });
      }
      data.forms[formData.id] = formData;
    }

    // Tabelas
    const tables = await page.locator('table').all();
    for (let i = 0; i < tables.length; i++) {
      const headers = await tables[i].locator('thead th').allTextContents();
      const rows = await tables[i].locator('tbody tr').count();
      data.tables.push({ index: i, columns: headers, rowCount: rows });
    }

    // Botões
    const buttons = await page.locator('button, [role="button"], input[type="submit"], input[type="button"]').allTextContents();
    data.buttons = buttons.filter(b => b?.trim()).map(b => b.trim());

    // Cards/Painéis
    const cards = await page.locator('[class*="card"], [class*="panel"], [class*="tile"]').allTextContents();
    data.cards = cards.slice(0, 10).map(c => c?.trim().substring(0, 100));

    // Links internos
    const links = await page.locator('a[href^="/"], a[href^="' + BASE_URL + '"]').all();
    for (const link of links) {
      data.links.push({
        text: await link.textContent(),
        href: await link.getAttribute('href')
      });
    }

  } catch (e) {
    data.extractionError = e.message;
  }

  return data;
}

/**
 * Gera relatório em Markdown
 */
function generateMarkdownReport(results) {
  let md = `# Relatório de Exploração - Advcontroller\n\n`;
  md += `> Gerado em: ${new Date().toISOString()}\n\n`;

  // Resumo
  md += `## Resumo\n\n`;
  md += `- **Total de páginas exploradas:** ${Object.keys(results.pages).length}\n`;
  md += `- **Links de menu:** ${results.menus.length}\n`;
  md += `- **Erros:** ${results.errors.length}\n\n`;

  // Menus
  md += `## Menu de Navegação\n\n`;
  md += `| Texto | URL | Tipo |\n`;
  md += `|-------|-----|------|\n`;
  for (const menu of results.menus) {
    md += `| ${menu.text || ''} | ${menu.href || ''} | ${menu.type || 'principal'} |\n`;
  }
  md += `\n`;

  // Páginas por categoria
  const categories = {};
  for (const [url, pageData] of Object.entries(results.pages)) {
    const cat = pageData.category || 'Outro';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(pageData);
  }

  md += `## Páginas por Categoria\n\n`;
  for (const [cat, pages] of Object.entries(categories)) {
    md += `### ${cat}\n\n`;
    for (const page of pages) {
      md += `#### ${page.name}\n`;
      md += `- **URL:** ${page.url || url}\n`;
      md += `- **Títulos:** ${page.headings?.join(' > ') || 'N/A'}\n`;
      md += `- **Formulários:** ${Object.keys(page.forms || {}).length}\n`;
      md += `- **Tabelas:** ${page.tables?.length || 0}\n`;
      md += `- **Botões:** ${page.buttons?.slice(0, 5).join(', ') || 'N/A'}\n`;
      if (page.forms) {
        md += `\n**Campos de formulário:**\n`;
        for (const [formId, form] of Object.entries(page.forms)) {
          md += `- ${formId}: ${form.inputs.map(i => `${i.name || i.id}(${i.type})`).join(', ')}\n`;
        }
      }
      md += `\n`;
    }
  }

  // Erros
  if (results.errors.length > 0) {
    md += `## Erros Encontrados\n\n`;
    for (const err of results.errors) {
      md += `- **${err.url}:** ${err.error}\n`;
    }
    md += `\n`;
  }

  // Screenshots
  md += `## Screenshots Capturados\n\n`;
  md += `Consulte a pasta \`${OUTPUT_DIR}\` para ver todos os screenshots:\n\n`;
  for (const [url, pageData] of Object.entries(results.pages)) {
    if (pageData.screenshot) {
      const filename = pageData.screenshot.split('/').pop();
      md += `- ${pageData.name}: \`${filename}\`\n`;
    }
  }
  md += `\n`;

  return md;
}
