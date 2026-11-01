// Verificação com esperas maiores dos itens sensíveis à taxa de quadros (WebGL por software). Uso: node verificacao_lenta.cjs <aula.html>
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto('file://' + require('path').resolve(process.argv[2] || 'dist/index.html') + '?forcar3d'); await p.waitForTimeout(2500);
  await p.evaluate(() => { location.hash = '#/3'; }); await p.waitForTimeout(8000);
  const est = () => p.evaluate(() => window.__loc3d.estado());
  const out = {};
  for (const [k, max] of [['ombroFlex', 180], ['joeFlex', 130], ['ombroRI', 80]]) {
    await p.click(`.mv-list .btn[data-k="${k}"]`);
    for (let i = 0; i < 60 && (await est()).chave !== 'mov:' + k; i++) await p.waitForTimeout(250);
    await p.waitForTimeout(2000);
    if ((await p.getAttribute('section.s-mov .l3d-barra .an-b', 'aria-label')).startsWith('Pausar')) await p.click('section.s-mov .l3d-barra .an-b');
    await p.waitForTimeout(2000);
    await p.evaluate(() => { const r = document.querySelector('section.s-mov .l3d-rng'); r.value = '1000'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.waitForTimeout(4000);
    const e = await est(); out[k] = [Math.round(e.angulo * 10) / 10, max];
  }
  await p.click('section.s-mov .l3d-barra [aria-label="Mostrar ou ocultar o goniômetro"]'); await p.waitForTimeout(4000);
  out.goniometroOculto = await p.evaluate(() => !document.querySelector('section.s-mov .l3d-ov .gon'));
  await p.click('section.s-mov .l3d-barra [aria-label="Mostrar ou ocultar o goniômetro"]');
  await p.click('section.s-mov .l3d-barra [aria-label="Reiniciar o movimento"]'); await p.waitForTimeout(1000);
  out.aposReiniciar = Math.round((await est()).angulo);
  console.log(out); await b.close();
})();
