/**
 * Pele (modo externo): mede, sem renderizar, o estiramento dos triângulos e as fissuras entre malhas de regiões
 * vizinhas, com a mesma deformação linear por ossos do navegador (pesos de src/render/pesos-pele.js).
 * Fissura: vértices que ocupam o mesmo ponto no repouso (bordas entre regiões do atlas) e se separam na pose.
 * Resultado computacional; a avaliação visual continua necessária (capturas).
 */
import { readFileSync } from 'node:fs';
import { referencias, pose, posturaNeutra } from '../src/cinematica/pose.js';
import { porId, calibrarNeutro } from '../src/cinematica/movimentos.js';
import { calcularPesos } from '../src/render/pesos-pele.js';
import { SEGMENTOS } from '../src/cinematica/pose.js';
import { af } from '../src/nucleo/mat.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const ref = referencias(L); calibrarNeutro(L, ref, pose);
const b = readFileSync(new URL('../src/modelos/pele.glb', import.meta.url));
const jl = b.readUInt32LE(12), J = JSON.parse(b.slice(20, 20 + jl)), bin = b.slice(20 + jl + 8);
const acc = (i, T) => { const a = J.accessors[i], v = J.bufferViews[a.bufferView], o = (v.byteOffset || 0) + (a.byteOffset || 0);
  const n = a.count * { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]; return new T(bin.buffer.slice(bin.byteOffset + o, bin.byteOffset + o + n * T.BYTES_PER_ELEMENT)); };
const pr = J.meshes[0].primitives[0];
const pos = acc(pr.attributes.POSITION, Float32Array), col = acc(pr.attributes.COLOR_0, Uint16Array), idx = acc(pr.indices, Uint32Array.BYTES_PER_ELEMENT && J.accessors[pr.indices].componentType === 5125 ? Uint32Array : Uint16Array);
const n = pos.length / 3, classe = new Uint8Array(n); for (let i = 0; i < n; i++) classe[i] = Math.round((col[i * 4] / 65535) * 16);
const yQ = L['HJC.r'][1];
for (let i = 0; i < n; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; if (Math.abs(x) < 0.075 && y > yQ - 0.17 && y < yQ + 0.04 && z > 0.07) pos[i * 3 + 2] = 0.07 + (z - 0.07) * 0.15; }
const { indices, pesos } = calcularPesos(L, ref, pos, classe, idx);
// grupos de vértices coincidentes (bordas entre regiões)
const chave = (i) => [0, 1, 2].map((k) => Math.round(pos[i * 3 + k] / 0.0005)).join(',');
const grupos = new Map(); for (let i = 0; i < n; i++) { const k = chave(i); (grupos.get(k) || grupos.set(k, []).get(k)).push(i); }
const multi = [...grupos.values()].filter((g) => g.length > 1);
function deforma(A) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const p = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]; let x = 0, y = 0, z = 0;
    for (let q = 0; q < 4; q++) { const w = pesos[i * 4 + q]; if (!w) continue; const r = af.em(A[SEGMENTOS[indices[i * 4 + q]]], p); x += w * r[0]; y += w * r[1]; z += w * r[2]; }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z; }
  return out;
}
const d = (P, i, j) => Math.hypot(P[i * 3] - P[j * 3], P[i * 3 + 1] - P[j * 3 + 1], P[i * 3 + 2] - P[j * 3 + 2]);
function mede(A, filtro) {
  const D = deforma(A); let t2 = 0, t3 = 0, tot = 0, max = 0;
  for (let f = 0; f < idx.length; f += 3) { const a = idx[f], bb = idx[f + 1], c = idx[f + 2]; if (filtro && !filtro(a)) continue; tot++;
    let s = 0; for (const [i, j] of [[a, bb], [bb, c], [c, a]]) { const l0 = d(pos, i, j); if (l0 > 1e-5) s = Math.max(s, d(D, i, j) / l0); }
    if (s > 2) t2++; if (s > 3) t3++; max = Math.max(max, s); }
  let gap = 0, fiss = 0; for (const g of multi) { let m = 0; for (const i of g) for (const j of g) m = Math.max(m, d(D, i, j)); if (m > 0.002) fiss++; gap = Math.max(gap, m); }
  return { pct2: (100 * t2) / tot, pct3: (100 * t3) / tot, max, fiss, gap: gap * 1000 };
}
const casos = [['ombroAbd', 90], ['ombroAbd', 135], ['ombroAbd', 180], ['ombroFlex', 180], ['colFlex', 60], ['colFlex', 90], ['quaFlex', 120], ['cotFlex', 150]];
console.log(`pele: ${n} vértices, ${idx.length / 3} triângulos, ${multi.length} pontos de borda com vértices coincidentes`);
const tronco = (i) => pos[i * 3 + 1] > 1.0 && pos[i * 3 + 1] < 1.55 && Math.abs(pos[i * 3]) < 0.25;   // tronco superior, ombros e axilas
for (const [id, a] of casos) {
  const r = mede(pose(L, ref, porId[id].postura(a, 'normal')).A), rt = mede(pose(L, ref, porId[id].postura(a, 'normal')).A, tronco);
  console.log(`${id.padEnd(9)} ${String(a).padStart(3)}°: triângulos estirados >2x ${r.pct2.toFixed(2)}% (>3x ${r.pct3.toFixed(2)}%; tronco superior e axilas >2x ${rt.pct2.toFixed(2)}%), maior ${r.max.toFixed(1)}x | fissuras >2 mm: ${r.fiss}, maior ${r.gap.toFixed(1)} mm`);
}
