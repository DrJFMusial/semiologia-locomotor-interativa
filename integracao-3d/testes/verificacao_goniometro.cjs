const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file:///home/claude/integ/repo/integracao-3d/dist/index.html?forcar3d#/3'); await p.waitForTimeout(12000);
  const g = () => p.evaluate(() => [document.querySelectorAll('section.s-mov .l3d-ov .gon').length, document.querySelector('section.s-mov .l3d-ov').innerHTML.slice(0, 120), document.querySelector('section.s-mov [aria-label="Mostrar ou ocultar o goniômetro"]').getAttribute('aria-pressed')]);
  console.log(await g());
  await p.click('section.s-mov .l3d-barra .an-b'); await p.waitForTimeout(2000); console.log('pausado', await g());
  await p.click('section.s-mov .l3d-barra [aria-label="Mostrar ou ocultar o goniômetro"]'); await p.waitForTimeout(3000); console.log('clicado', await g());
  await b.close();
})();
