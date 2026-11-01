// Desvio entre os ângulos da escápula aplicados (com contato no gradil) e os incrementos de Ludewig et al. (2009).
import { readFileSync } from 'node:fs';
import { referencias, pose } from '../src/cinematica/pose.js';
import { porId, calibrarNeutro } from '../src/cinematica/movimentos.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const ref = referencias(L); calibrarNeutro(L, ref, pose);
for (const id of ['ombroAbd','ombroFlex','ombroExt']) for (const a of [0,30,60,90,120,150,180]) {
  if (id==='ombroExt' && a>60) continue;
  const r = pose(L, ref, porId[id].postura(a,'normal')).info.r;
  console.log(id, a, Object.entries(r.escDesvio).map(([k,x])=>k.slice(3)+' '+x.toFixed(1)).join('  '), '| aplic', Object.values(r.escAplicada).map(x=>x.toFixed(1)).join(' '));
}
