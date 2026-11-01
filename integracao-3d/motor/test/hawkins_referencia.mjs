// Rotação axial que deixa o antebraço horizontal no Hawkins (elevação 90°, plano 40°, cotovelo 90°, palma para baixo).
import { readFileSync } from 'node:fs';
import { referencias, pose, posturaNeutra } from '../src/cinematica/pose.js';
import { calibrarNeutro } from '../src/cinematica/movimentos.js';
import { testePorId } from '../src/cinematica/testes-ombro.js';
import { v, af } from '../src/nucleo/mat.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const ref = referencias(L); calibrarNeutro(L, ref, pose);
const antebraco = (A) => v.norm(v.sub(af.em(A['Radio.r'], ref.PU), af.em(A['Ulna.r'], ref.EC)));
let melhor = null;
for (let r = 0; r >= -90; r -= 0.5) {
  const P = posturaNeutra(); Object.assign(P.r.ombro, { elev: 90, plano: 40, rotAxial: r }); P.r.cotovelo = 90; P.r.antebraco = 0;
  const y = Math.abs(antebraco(pose(L, ref, P).A)[1]); if (!melhor || y < melhor[1]) melhor = [r, y];
}
console.log(`antebraço horizontal com rotação axial de ${melhor[0]}°`);
for (const t of [0.35, 1]) { const d = antebraco(pose(L, ref, testePorId.hawkins.postura(t)).A); console.log(`t=${t}: inclinação do antebraço ${(Math.asin(d[1]) * 180 / Math.PI).toFixed(0)}° (negativo = para baixo)`); }
