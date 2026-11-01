/**
 * Relação escápula x gradil costal durante abdução e flexão (amostras de vértices do modelo).
 * Para cada ponto da escápula, procura costelas na mesma altura (±15 mm) e no mesmo setor angular (±6°)
 * em torno do eixo do tórax; se o ponto estiver mais perto do eixo que a superfície externa das costelas,
 * conta como interpenetração. Também mede a distância da face costal da escápula até a costela mais próxima.
 * Resultado computacional: não substitui a avaliação anatômica.
 */
import { readFileSync } from 'node:fs';
import { referencias, pose } from '../src/cinematica/pose.js';
import { porId, calibrarNeutro } from '../src/cinematica/movimentos.js';
import { v, af } from '../src/nucleo/mat.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const AM = JSON.parse(readFileSync(new URL('../src/modelos/amostras.json', import.meta.url)));
const ref = referencias(L); calibrarNeutro(L, ref, pose);
const costelas = AM['costelas.r'], esc0 = AM['escapula.r'];
const cz = costelas.reduce((s, p) => s + p[2], 0) / costelas.length;
const polar = (p) => [Math.atan2(p[0], p[2] - cz), Math.hypot(p[0], p[2] - cz)];
const C = costelas.map((p) => [p[1], ...polar(p), p]);
function avalia(A) {
  let dentro = 0, cont = 0; const folgas = [];
  for (const s0 of esc0) {
    const s = af.em(A['Escapula.r'], s0); const [th, r] = polar(s);
    let rmax = -1, dmin = Infinity;
    for (const [y, t2, r2, p] of C) {
      if (Math.abs(y - s[1]) < 0.015 && Math.abs(t2 - th) < 0.105) rmax = Math.max(rmax, r2);
      const d = v.len(v.sub(p, s)); if (d < dmin) dmin = d;
    }
    if (rmax < 0) continue; cont++;
    if (r < rmax - 0.004) dentro++;
    folgas.push(dmin);
  }
  folgas.sort((a, b) => a - b);
  const borda = ['TS.r', 'AI.r'].map((k) => { const q = af.em(A['Escapula.r'], L[k]); return Math.min(...costelas.map((p) => v.len(v.sub(p, q)))) * 1000; });
  return { borda, pct: (100 * dentro) / Math.max(1, cont), avaliados: cont, folgaMin: folgas[0] * 1000, folgaP10: folgas[Math.floor(folgas.length * 0.1)] * 1000 };
}
const linhas = []; let pior = 0, piorBorda = 0;
for (const id of ['ombroAbd', 'ombroFlex', 'ombroExt']) {
  const mv = porId[id];
  for (const a of id === 'ombroExt' ? [0, 30, 60] : [0, 45, 90, 120, 135, 180]) {
    ref.semContato = true; const r0 = avalia(pose(L, ref, mv.postura(a, 'normal')).A);
    ref.semContato = false; const r = avalia(pose(L, ref, mv.postura(a, 'normal')).A); pior = Math.max(pior, r.pct);
    piorBorda = Math.max(piorBorda, ...r.borda);
    linhas.push(`${id.padEnd(9)} ${String(a).padStart(3)}°: dentro do contorno ${r.pct.toFixed(1)}% (sem contato ${r0.pct.toFixed(1)}%) | menor distância ${r.folgaMin.toFixed(1)} mm (sem contato ${r0.folgaMin.toFixed(1)}) | TS e AI até a costela ${r.borda.map((x) => x.toFixed(1)).join(' e ')} mm (sem contato ${r0.borda.map((x) => x.toFixed(1)).join(' e ')})`);
  }
}
console.log(linhas.join('\n'));
console.log(`Maior distância da borda medial (TS ou AI) até a costela, com contato: ${piorBorda.toFixed(1)} mm`);
console.log(`Maior porcentagem de interpenetração: ${pior.toFixed(1)}% (critério de alerta: acima de 5%)`);
process.exit(0);
