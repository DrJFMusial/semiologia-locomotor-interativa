// Gera aula/capa-dados.json: contornos dos ossos (vista anterior, repouso) e, para cada grau de abdução do ombro direito
// (0 a 180), a transformação 2D de cada segmento, tirada da cinemática do motor (ritmo escapulo-umeral da v0.3).
import { readFileSync, writeFileSync } from 'node:fs';
import { referencias, pose, posturaNeutra, SEGMENTOS } from '../src/cinematica/pose.js';
import { calibrarNeutro } from '../src/cinematica/movimentos.js';
import { af } from '../src/nucleo/mat.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const ref = referencias(L); calibrarNeutro(L, ref, pose);
const C = JSON.parse(readFileSync('/tmp/contornos.json', 'utf8'));
const MOVEIS = ['Clavicula.r', 'Escapula.r', 'Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'];
const mat = (T, z) => { const R = T.R, t = T.t; return [R[0][0], -R[1][0], -R[0][1], R[1][1], R[0][2] * z + t[0], -(R[1][2] * z + t[1])].map((x) => +x.toFixed(4)); };
const fixos = {}, quadros = [];
{ const { A } = pose(L, ref, posturaNeutra()); for (const s of SEGMENTOS) if (!MOVEIS.includes(s)) fixos[s] = mat(A[s], C[s].z); }
for (let th = 0; th <= 180; th++) {
  const P = posturaNeutra(); P.r.ombro.elev = th; const { A } = pose(L, ref, P);
  const gh = af.em(A['Umero.r'], L['GH.r']), co = af.em(A['Ulna.r'], ref.EC);
  quadros.push({ m: Object.fromEntries(MOVEIS.map((s) => [s, mat(A[s], C[s].z)])), gh: [+gh[0].toFixed(4), +(-gh[1]).toFixed(4)], co: [+co[0].toFixed(4), +(-co[1]).toFixed(4)] });
}
const contornos = Object.fromEntries(Object.entries(C).map(([s, v]) => [s, v.aneis]));
writeFileSync(new URL('../../aula/capa-dados.json', import.meta.url), JSON.stringify({ contornos, fixos, quadros, moveis: MOVEIS }));
console.log('ok', quadros.length);
