/**
 * Verificação da aula integrada, versão com substituição completa dos manequins (Chromium automatizado, WebGL por software).
 * Uso: node qa.cjs <aula_integrada.html> <pasta_saida>
 * Grava qa.json e algumas capturas de situação. A comparação antes e depois de cada módulo fica em comparar.cjs.
 */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const { E, MANEQUINS } = require('./estados.cjs');
const [, , INTEG, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'];
const R = { erros: {}, externas: [], carregamento: {}, navegacao: {}, controles: {}, webgl: {}, escuro: {}, estudo: {}, celular: {}, conflitos: {}, integridade: {}, manequins: {}, qualidade: {} };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function abrir(b, q = '', { vp = { width: 1600, height: 900 }, escuro = false, movel = false, nome = 'x', args } = {}) {
  const ctx = await b.newContext({ viewport: vp, colorScheme: escuro ? 'dark' : 'light', isMobile: movel, hasTouch: movel });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  p.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) R.externas.push(r.url()); });
  await p.goto('file://' + path.resolve(INTEG) + q); R.erros[nome] = errs;
  return { p, ctx };
}
const ate = async (p, fn, arg, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return Date.now() - t0; await p.waitForTimeout(200); } return -1; };
const ir = async (p, i, ms = 1500) => { await p.evaluate((i) => { location.hash = '#/' + i; }, i); await p.waitForTimeout(ms); };
const shot = (p, f, sel) => p.evaluate((sel) => { const e = sel ? document.querySelector(sel) : null; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth - Math.max(0, r.x)), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) }; }, sel)
  .then((clip) => p.screenshot({ path: path.join(OUT, f), timeout: 180000, ...(clip ? { clip } : {}) }));

(async () => {
  const b = await chromium.launch({ args: ARGS });
  /* 1. carregamento */
  {
    const t0 = Date.now(); const { p, ctx } = await abrir(b, '?forcar3d#/0', { nome: 'apresentacao' });
    const ms = await ate(p, () => window.__loc3d?.estado().carregamento === 'pronto');
    R.carregamento = { prontoEmMs: ms, totalMs: Date.now() - t0, estado: await p.evaluate(() => window.__loc3d.estado()), canvas: await p.evaluate(() => document.querySelectorAll('canvas.l3d-cv').length),
      classes: await p.evaluate(() => document.documentElement.className) };
    log('carregamento', JSON.stringify(R.carregamento));
    /* 2. navegação: todas as telas, ida e volta, e nenhum quadro 3D fora das telas com figura */
    const n = await p.evaluate(() => document.querySelectorAll('section[data-menu-title]').length);
    const telas = [];
    for (let i = 0; i < n; i++) { await ir(p, i, 1200); telas.push({ i, hash: await p.evaluate(() => location.hash), dono: (await p.evaluate(() => window.__loc3d.estado())).dono }); }
    await ir(p, 1, 2500); const f0 = (await p.evaluate(() => window.__loc3d.info())).frame; await p.waitForTimeout(3000); const f1 = (await p.evaluate(() => window.__loc3d.info())).frame;
    await ir(p, 3, 4000); const g0 = (await p.evaluate(() => window.__loc3d.info())).frame; await p.waitForTimeout(3000); const g1 = (await p.evaluate(() => window.__loc3d.info())).frame;
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(800); const depoisSeta = await p.evaluate(() => location.hash);
    R.navegacao = { telas: n, percorridas: telas.length, quadrosForaDeTelaCom3D_3s: f1 - f0, quadrosNaTelaDeMovimentos_3s: g1 - g0, setaDireitaDe3Para: depoisSeta };
    log('navegacao', JSON.stringify(R.navegacao));
    /* 4. controles (tela de movimentos e testes) */
    await ir(p, 3, 4000);
    const C = {};
    const ang = () => p.evaluate(() => window.__loc3d.estado().angulo);
    const a0 = await ang(); await p.waitForTimeout(3000); C.reproduzAnda = Math.abs((await ang()) - a0) > 1;
    await p.click('section.s-mov .l3d-barra .an-b'); await p.waitForTimeout(1500); const a1 = await ang(); await p.waitForTimeout(2000); C.pausaPara = Math.abs((await ang()) - a1) < 0.01;
    await p.evaluate(() => { const r = document.querySelector('section.s-mov .l3d-rng'); r.value = '500'; r.dispatchEvent(new Event('input', { bubbles: true })); }); await p.waitForTimeout(2500);
    C.amplitudeMeio = Math.round(await ang());
    for (const v of ['Lateral', 'Anterior']) { await p.click(`section.s-mov .l3d-barra [aria-label="Vista ${v.toLowerCase()}"]`); await p.waitForTimeout(2500); C['vista' + v] = (await p.evaluate(() => window.__loc3d.estado())).vista; }
    await p.click('section.s-mov .l3d-barra [aria-label="Mostrar ou ocultar o goniômetro"]'); await p.waitForTimeout(2500); C.goniometroOculto = await p.evaluate(() => !document.querySelector('section.s-mov .l3d-cena .l3d-ov .gon'));
    await p.click('section.s-mov .l3d-barra [aria-label="Mostrar ou ocultar o goniômetro"]'); await p.waitForTimeout(1500);
    await p.click('section.s-mov .l3d-barra [aria-label^="Alternar entre esqueleto"]'); await p.waitForTimeout(3000); C.pelePressionada = await p.evaluate(() => document.querySelector('section.s-mov .l3d-barra [aria-label^="Alternar entre esqueleto"]').getAttribute('aria-pressed'));
    await shot(p, 'controles_pele.png', 'section.s-mov .mv-fig');
    await p.click('section.s-mov .l3d-barra [aria-label^="Alternar entre esqueleto"]'); await p.waitForTimeout(1500);
    C.semBotaoEsquema2D = await p.evaluate(() => ![...document.querySelectorAll('.l3d-barra .btn')].some((b) => /2D/.test(b.textContent)));
    await ir(p, 19, 4000);
    const TE = '[data-component="testes"]:not([data-regioes])';
    await p.evaluate((TE) => { const r = document.querySelector(TE + ' .an-rng'); r.value = '200'; r.dispatchEvent(new Event('input', { bubbles: true })); }, TE); await p.waitForTimeout(2500);
    const t1 = await ang();
    await p.evaluate((TE) => { const r = document.querySelector(TE + ' .an-rng'); r.value = '450'; r.dispatchEvent(new Event('input', { bubbles: true })); }, TE); await p.waitForTimeout(2500);
    C.barraDoTesteMoveO3D = { t02: Math.round(t1), t045: Math.round(await ang()) };
    C.fotoDoTesteVisivel = await p.evaluate((TE) => { const i = document.querySelector(TE + ' .te-ph img'); return !!i && i.getBoundingClientRect().width > 50; }, TE);
    R.controles = C; log('controles', JSON.stringify(C));
    /* 8. conflitos de CSS e JavaScript */
    R.conflitos = await p.evaluate(() => {
      const css = document.getElementById('loc3d-estilo').textContent;
      const seletores = css.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((r) => r.split('{')[0].trim()).filter(Boolean).filter((s) => !s.startsWith('@'));
      const semPrefixo = seletores.filter((s) => !/l3d/.test(s));
      return { regras: seletores.length, regrasSemPrefixoL3d: semPrefixo, globais: Object.keys(window).filter((k) => /loc3d/i.test(k)) };
    });
    await ctx.close();
  }
  /* 10. figura corporal em cada estado: nenhum manequim 2D visível com WebGL */
  {
    const { p, ctx } = await abrir(b, '?forcar3d#/0', { nome: 'manequins' });
    await ate(p, () => window.__loc3d?.estado().carregamento === 'pronto');
    const lista = [];
    for (const e of E) {
      await ir(p, e.s, 1200); for (const a of e.a) { await p.evaluate(a); await p.waitForTimeout(700); }
      await p.waitForTimeout(2500);
      const r = await p.evaluate(([sel, M]) => { const el = [...document.querySelectorAll(sel)].find((x) => x.offsetParent); if (!el) return { semElemento: true };
        const vis = [...el.querySelectorAll(M)].filter((s) => { const c = getComputedStyle(s), q = s.getBoundingClientRect(); return c.visibility !== 'hidden' && c.display !== 'none' && q.width > 20 && q.height > 20; }).map((s) => s.getAttribute('class').split(' ')[0]);
        const palco = [...el.querySelectorAll('.l3d-palco')].some((x) => x.getBoundingClientRect().height > 100);
        const visivel = (q) => { const x = el.querySelector(q); if (!x) return false; const c = getComputedStyle(x), b = x.getBoundingClientRect(); return c.visibility !== 'hidden' && c.display !== 'none' && b.width > 20 && b.height > 20; };
        return { manequinsVisiveis: vis, palco3D: palco, chave: window.__loc3d.estado().chave,
          esquemaPostura: visivel('.ps-svg') || visivel('.imgx img'), tracoCapa: !!document.querySelector('svg.cpx .cpx-osso'), fotoDDQ: visivel('.cc-ddq-sequencia img'), setasDDQ: !!el.querySelector('.ddqx-setas') }; }, [e.el, MANEQUINS]);
      const t = e.tipo || '3d';
      r.ok = t === '3d' ? r.palco3D && !r.manequinsVisiveis.length : t === 'esquema' ? r.esquemaPostura && !r.palco3D : t === 'traco' ? r.tracoCapa && !r.manequinsVisiveis.length && !r.palco3D : r.fotoDDQ && r.setasDDQ && !r.manequinsVisiveis.length && !r.palco3D;
      lista.push({ nome: e.nome, tipo: t, ...r }); log('estado', e.nome, JSON.stringify(r));
    }
    // vista de cima da passagem do pé: só trajetórias, sem corpo (o esquema permanece)
    await ir(p, 12, 1200);
    for (const a of [`[...document.querySelectorAll('[data-component="mecanismos"] .btn')].find((x) => x.textContent.startsWith('Passagem')).click()`, `[...document.querySelectorAll('.mk-pe .mk-cases .btn')].find((x) => x.textContent.startsWith('Caso 2')).click()`, `[...document.querySelectorAll('[data-component="mecanismos"] .btn')].find((x) => x.offsetParent && x.textContent.startsWith('O joelho')).click()`, `[...document.querySelectorAll('.mk-pe .mk-vistas .btn')].find((x) => x.textContent.startsWith('Vista de cima')).click()`]) { await p.evaluate(a).catch(() => {}); await p.waitForTimeout(800); }
    await p.waitForTimeout(1500);
    const circ = await p.evaluate(() => { const s = document.querySelector('.mk-svg-pe'); return { esquemaVisivel: getComputedStyle(s).visibility !== 'hidden' && getComputedStyle(s).display !== 'none', temCorpo: !!s.querySelector('.mq, .mq-head') }; });
    R.manequins = { estados: lista, total: lista.length, comManequimVisivel: lista.filter((x) => x.manequinsVisiveis?.length).map((x) => x.nome), falhas: lista.filter((x) => !x.ok).map((x) => x.nome), porTipo: lista.reduce((o, x) => ((o[x.tipo] = (o[x.tipo] || 0) + 1), o), {}), vistaDeCimaDoPe: circ };
    log('manequins', JSON.stringify({ total: lista.length, porTipo: R.manequins.porTipo, falhas: R.manequins.falhas, circ }));
    /* espaços de imagem: uma imagem de teste injetada em tempo de execução substitui o esquema e volta a sair */
    {
      const teste = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 40; c.height = 60; c.getContext('2d').fillRect(0, 0, 40, 60); return c.toDataURL(); });
      await ir(p, 9, 1200);
      await p.evaluate((u) => { window.__img.om63_postura_lado_habitual = u; window.__img.om64_postura_lado_cifose = u; }, teste);
      for (const t of ['De lado', 'Cifose']) { await p.evaluate((t) => [...document.querySelectorAll('[data-component="postura"] .btn')].find((x) => x.offsetParent && x.textContent.trim().startsWith(t)).click(), t); await p.waitForTimeout(800); }
      const comImagem = await p.evaluate(() => ({ img: !!document.querySelector('[data-component="postura"] .imgx img[src^="data:"]'), esquemaOculto: document.querySelector('.ps-svg').classList.contains('imgx-oculto'), prumo: !!document.querySelector('.imgx-ov .imgx-prumo') }));
      await p.screenshot({ path: path.join(OUT, 'espaco_imagem_teste.png') });
      await p.evaluate(() => [...document.querySelectorAll('[data-component="postura"] .btn')].find((x) => x.offsetParent && x.textContent.trim().startsWith('Lordose')).click()); await p.waitForTimeout(800);
      const semImagem = await p.evaluate(() => ({ img: !!document.querySelector('[data-component="postura"] .imgx'), esquemaVisivel: !document.querySelector('.ps-svg').classList.contains('imgx-oculto') }));
      R.espacosDeImagem = { comImagem, semImagem };
      log('espacos', JSON.stringify(R.espacosDeImagem));
    }
    await ctx.close();
  }
  /* qualidade adaptativa (sem ?forcar3d): o WebGL por software fica lento; a cena reduz resolução e pele, sem voltar ao manequim */
  {
    const { p, ctx } = await abrir(b, '#/3', { nome: 'qualidade' });
    await ate(p, () => window.__loc3d?.estado().carregamento === 'pronto'); await p.waitForTimeout(40000);
    R.qualidade = await p.evaluate(() => ({ qualidade: window.__loc3d.estado().qualidade, atributo: document.documentElement.dataset.l3dQualidade || null, manequimVisivel: getComputedStyle(document.querySelector('section.s-mov .mv-svg')).visibility !== 'hidden' && getComputedStyle(document.querySelector('section.s-mov .mv-svg')).display !== 'none' }));
    log('qualidade', JSON.stringify(R.qualidade)); await shot(p, 'qualidade_reduzida.png', 'section.s-mov .mv-fig'); await ctx.close();
  }
  /* 6. tema escuro */
  {
    const { p, ctx } = await abrir(b, '?forcar3d#/9', { nome: 'escuro', escuro: true });
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await ate(p, () => window.__loc3d?.estado().dono === 'fig'); await p.waitForTimeout(5000);
    R.escuro = await p.evaluate(() => ({ tema: document.documentElement.dataset.theme, fundoPalco: getComputedStyle(document.querySelector('.l3d-palco')).backgroundImage.slice(0, 80), corLegenda: getComputedStyle(document.querySelector('.l3d-barra .btn')).color }));
    await shot(p, 'escuro_postura.png'); await ir(p, 17, 6000); await shot(p, 'escuro_forca.png'); await ctx.close();
  }
  /* 7. modo estudo */
  {
    const { p, ctx } = await abrir(b, '?modo=estudo&forcar3d', { nome: 'estudo' });
    await ate(p, () => window.__loc3d?.estado().carregamento === 'pronto');
    await p.evaluate(() => document.querySelector('[data-component="forca"]').scrollIntoView()); await p.waitForTimeout(6000);
    R.estudo = await p.evaluate(() => ({ modo: document.body.classList.contains('modo-estudo'), secoes: document.querySelectorAll('section[data-menu-title]').length, rolagemHorizontal: document.documentElement.scrollWidth > innerWidth + 1, hosts: document.querySelectorAll('.l3d-host').length, dono: window.__loc3d.estado().dono }));
    await p.screenshot({ path: path.join(OUT, 'estudo_forca.png') }); await ctx.close();
  }
  /* celular */
  {
    const { p, ctx } = await abrir(b, '?forcar3d#/17', { nome: 'celular', vp: { width: 390, height: 844 }, movel: true });
    await ate(p, () => window.__loc3d?.estado().carregamento === 'pronto');
    await p.evaluate(() => document.querySelector('[data-component="forca"]').scrollIntoView()); await p.waitForTimeout(6000);
    R.celular = await p.evaluate(() => ({ estudo: document.body.classList.contains('modo-estudo'), rolagemHorizontal: document.documentElement.scrollWidth > innerWidth + 1, cameraLivre: document.querySelector('.l3d-cv')?.style.touchAction || null }));
    await p.screenshot({ path: path.join(OUT, 'celular_forca.png') }); await ctx.close();
  }
  /* 5. sem WebGL (?2d e WebGL desligado no navegador) */
  {
    const { p, ctx } = await abrir(b, '?2d#/9', { nome: 'semWebGL_2d' }); await p.waitForTimeout(3000);
    R.webgl.parametro2d = await p.evaluate(() => ({ estado: window.__loc3d.estado(), classe: document.documentElement.className, esquemaVisivel: getComputedStyle(document.querySelector('.ps-svg')).visibility !== 'hidden', motorCarregado: !document.getElementById('loc3d-motor') }));
    await ctx.close();
    const b2 = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
    const ctx2 = await b2.newContext({ viewport: { width: 1600, height: 900 } }); const p2 = await ctx2.newPage(); const errs = []; p2.on('pageerror', (e) => errs.push(e.message));
    await p2.goto('file://' + path.resolve(INTEG) + '#/9'); await p2.waitForTimeout(4000);
    R.webgl.navegadorSemWebGL = await p2.evaluate(() => ({ estado: window.__loc3d.estado(), classe: document.documentElement.className, esquemaVisivel: getComputedStyle(document.querySelector('.ps-svg')).visibility !== 'hidden' })); R.erros.semWebGL = errs;
    await p2.screenshot({ path: path.join(OUT, 'sem_webgl_postura.png') }); await b2.close();
    log('webgl', JSON.stringify(R.webgl));
  }
  /* 9. integridade */
  {
    const crypto = require('crypto'); const rel = JSON.parse(fs.readFileSync(path.join(path.dirname(INTEG), 'integracao.json'), 'utf8'));
    R.integridade = { reversivelAoOriginal: rel.reversivel, sha256Original: rel.original.sha256, ganchos: rel.ganchos, sha256Integrado: crypto.createHash('sha256').update(fs.readFileSync(INTEG)).digest('hex') === rel.integrado.sha256 };
  }
  /* 3. offline */
  R.offline = { requisicoesExternas: [...new Set(R.externas)].length };
  fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify(R, null, 1));
  log('fim', JSON.stringify({ erros: Object.fromEntries(Object.entries(R.erros).map(([k, v]) => [k, v.length])), offline: R.offline }));
  await b.close();
})();
