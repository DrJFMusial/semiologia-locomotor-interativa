const { chromium } = require('playwright');
const ck = (sel, txt) => `(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.offsetParent && x.textContent.trim().startsWith(${JSON.stringify(txt)})); if (b) b.click(); return !!b; })()`;
const rng = (sel, v) => `(() => { const r = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.offsetParent); if (!r) return false; r.value = String(${v}); r.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const CASOS = {
  capa: [0, []], capa2: [0, [], 4000],
  postura: [9, [ck('[data-component="postura"] .btn', 'De lado'), ck('[data-component="postura"] .btn', 'Cifose')]],
  derrame: [15, [ck('[data-component="derrame"] .btn', 'Moderado')]],
  rechaco: [15, [ck('[data-component="derrame"] .btn', 'Volumoso'), ck('[data-component="derrame"] .btn', 'Rechaçar')], 600],
  onda: [15, [ck('[data-component="derrame"] .btn', 'Pequeno'), ck('[data-component="derrame"] .btn', '1. Ordenhar'), ck('[data-component="derrame"] .btn', '2. Percutir')], 300],
  supra: [18, [ck('[data-component="anatomia"] .btn', 'Manguito'), ck('[data-component="anatomia"] .btn', 'Supraespinal')]],
  sub: [18, [ck('[data-component="anatomia"] .btn', 'Manguito'), ck('[data-component="anatomia"] .btn', 'Subescapular')]],
  arco: [18, [ck('[data-component="anatomia"] .btn', 'Manguito'), ck('[data-component="anatomia"] .btn', 'Arco')]],
  ret: [18, [ck('[data-component="anatomia"] .btn', 'Túnel'), ck('[data-component="anatomia"] .btn', 'Retináculo')]],
  mediano: [18, [ck('[data-component="anatomia"] .btn', 'Túnel'), ck('[data-component="anatomia"] .btn', 'Nervo mediano')]],
  tend: [18, [ck('[data-component="anatomia"] .btn', 'Túnel'), ck('[data-component="anatomia"] .btn', 'Nove')]],
  comp1: [18, [ck('[data-component="anatomia"] .btn', 'Túnel'), ck('[data-component="anatomia"] .btn', '1º')]],
  isq: [18, [ck('[data-component="anatomia"] .btn', 'Nervo isq')]],
  ortolani: [20, [ck('[data-component="ddq"] .btn', 'Ortolani'), rng('[data-component="ddq"] .an-rng', 600)]],
  barlow: [20, [ck('[data-component="ddq"] .btn', 'Barlow'), rng('[data-component="ddq"] .an-rng', 400)]],
};
(async () => {
  const filtro = process.argv[2] ? new RegExp(process.argv[2]) : null;
  const q = process.argv[3] || '?forcar3d';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  await p.goto('file:///home/claude/integ/repo/integracao-3d/dist/index.html' + q); await p.waitForTimeout(9000);
  for (const [nome, [i, acoes, espera]] of Object.entries(CASOS)) {
    if (filtro && !filtro.test(nome)) continue;
    await p.evaluate((i) => { location.hash = '#/' + i; }, i); await p.waitForTimeout(2000);
    const r = []; for (const a of acoes) { r.push(await p.evaluate(a)); await p.waitForTimeout(espera || 1500); }
    if (!espera) await p.waitForTimeout(6000);
    console.log(nome, JSON.stringify(r), JSON.stringify(await p.evaluate(() => window.__loc3d.estado())));
    await p.screenshot({ path: `dev/n_${nome}.png`, timeout: 180000 });
  }
  console.log(errs.slice(0, 15)); await b.close();
})();
