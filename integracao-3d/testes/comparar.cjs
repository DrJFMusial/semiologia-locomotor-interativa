// node comparar.cjs <arquivo> <sufixo> <espera ms> [filtro]
const { chromium } = require('playwright');
const { E, MANEQUINS } = require('./estados.cjs');
(async () => {
  const [arq, suf, espera, filtro] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + arq + '#/0'); await p.waitForTimeout(suf === 'depois' ? 8000 : 2000);
  const res = [];
  for (const e of E) {
    if (filtro && !new RegExp(filtro).test(e.nome)) continue;
    await p.evaluate((i) => { location.hash = '#/' + i; }, e.s); await p.waitForTimeout(1500);
    const ok = []; for (const a of e.a) { ok.push(await p.evaluate(a)); await p.waitForTimeout(900); }
    await p.waitForTimeout(Number(espera));
    const info = await p.evaluate(([sel, M]) => { const el = [...document.querySelectorAll(sel)].find((x) => x.offsetParent); if (!el) return null; const r = el.getBoundingClientRect();
      const vis = [...el.querySelectorAll(M)].filter((s) => { const c = getComputedStyle(s), q = s.getBoundingClientRect(); return c.visibility !== 'hidden' && c.display !== 'none' && q.width > 20 && q.height > 20 && q.bottom > 0 && q.top < innerHeight; }).map((s) => s.getAttribute('class').split(' ')[0]);
      return { clip: { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, 1600 - r.x), height: Math.min(r.height, 900 - Math.max(0, r.y)) }, manequinsVisiveis: vis, estado: window.__loc3d && window.__loc3d.estado ? window.__loc3d.estado() : null }; }, [e.el, MANEQUINS]);
    if (info) await p.screenshot({ path: `cmp/${e.nome}_${suf}.png`, clip: info.clip, timeout: 180000 });
    res.push({ nome: e.nome, acoes: ok, manequinsVisiveis: info?.manequinsVisiveis, chave3D: info?.estado?.chave, dono: info?.estado?.dono });
    console.log(e.nome, JSON.stringify(ok), JSON.stringify(info?.manequinsVisiveis), info?.estado?.chave || '');
  }
  require('fs').writeFileSync(`cmp/estados_${suf}.json`, JSON.stringify({ erros: errs, estados: res }, null, 1));
  await b.close();
})();
