/**
 * Testes do modelo cinemático (Node, sem navegador). Verificam propriedades computacionais,
 * NÃO a validade fisiológica do movimento.
 */
import { readFileSync } from 'node:fs';
import { referencias, pose, posturaNeutra, SEGMENTOS } from '../src/cinematica/pose.js';
import { MOVIMENTOS, medidas, calibrarNeutro } from '../src/cinematica/movimentos.js';
import { TESTES } from '../src/cinematica/testes-ombro.js';
import { v, af } from '../src/nucleo/mat.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const ref = referencias(L); const neutro = calibrarNeutro(L, ref, pose);
let falhas = 0, total = 0; const ok = (c, msg) => { total++; if (!c) { falhas++; console.log('  FALHA', msg); } };
const det = (R) => R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
const PARES = { 'Clavicula.r': ['SC.r', 'AC.r'], 'Escapula.r': ['AI.r', 'TS.r'], 'Umero.r': ['GH.r', 'EL.r'], 'Ulna.r': ['US.r', 'UH.r'], 'Radio.r': ['RS.r', 'RH.r'], 'Mao.r': ['CAP.r', 'MC3.r'], 'Femur.r': ['HJC.r', 'LFE.r'], 'Perna.r': ['LM.r', 'MM.r'] };
console.log('Desvios da postura de repouso do modelo corrigidos (graus):', Object.fromEntries(Object.entries(neutro).map(([k, x]) => [k, +x.toFixed(1)])));
// 1) postura neutra: tórax e pelve parados, membros só com a correção do neutro
{ const { A } = pose(L, ref, posturaNeutra()); ok(v.len(A.Torax.t) < 1e-9 && v.len(A.Pelve.t) < 1e-9, 'tronco parado na postura neutra'); }
const tabela = [];
for (const mv of MOVIMENTOS) {
  let maxErro = 0, maxDesvGU = 0; const S = mv.situacoes?.normal || { max: mv.max };
  for (let k = 0; k <= 12; k++) {
    const a = (S.max * k) / 12, P = mv.postura(a, 'normal'), { A } = pose(L, ref, P);
    // 2) rotações próprias (det = +1) e segmentos rígidos (distâncias preservadas)
    for (const s of SEGMENTOS) ok(Math.abs(det(A[s].R) - 1) < 1e-9, `${mv.id} ${s} rotação própria`);
    for (const [s, [p, q]] of Object.entries(PARES)) ok(Math.abs(v.len(v.sub(af.em(A[s], L[p]), af.em(A[s], L[q]))) - v.len(v.sub(L[p], L[q]))) < 1e-9, `${mv.id} ${s} rígido`);
    // 3) congruência glenoumeral: centro da cabeça do úmero x centro da glenoide, distância constante
    const d = v.len(v.sub(af.em(A['Umero.r'], L['GH.r']), af.em(A['Escapula.r'], L['GC.r']))), d0 = v.len(v.sub(L['GH.r'], L['GC.r']));
    maxDesvGU = Math.max(maxDesvGU, Math.abs(d - d0));
    // 4) goniômetro do modelo x ângulo comandado
    const me = medidas(mv, L, A, ref);
    if (me.modelo != null && !mv.pronoSup) maxErro = Math.max(maxErro, Math.abs(me.modelo - a));
  }
  ok(maxDesvGU < 1e-9, `${mv.id} congruência glenoumeral`);
  tabela.push(`${mv.id.padEnd(10)} amplitude ${String(S.max).padStart(3)}° | maior diferença goniômetro do modelo x comando: ${maxErro.toFixed(1)}° | desvio GU: ${(maxDesvGU * 1000).toFixed(3)} mm`);
}
console.log(tabela.join('\n'));
// 5) testes especiais: posturas válidas e mãos/forças finitas
for (const T of TESTES) for (const variante of Object.keys(T.variantes || { normal: 1 })) for (let k = 0; k <= 20; k++) {
  const tt = k / 20, P = T.postura(tt, variante), { A } = pose(L, ref, P), A2 = pose(L, ref, T.postura(Math.min(1, tt + 0.01), variante)).A;
  const ms = T.maos(L, A, ref, P, A2) || [], fs = T.forcas(L, A, ref, P, A2, tt) || [];
  for (const c of ms) ok([...c.ponto, ...c.palma, ...c.dedos].every(Number.isFinite), `${T.id} mão finita`);
  for (const f of fs) ok([...f.origem, ...f.dir].every(Number.isFinite), `${T.id} força finita`);
}
console.log(falhas ? `${falhas} de ${total} verificações falharam` : `cinemática: ${total} verificações, todas aprovadas`);
process.exit(falhas ? 1 : 0);
