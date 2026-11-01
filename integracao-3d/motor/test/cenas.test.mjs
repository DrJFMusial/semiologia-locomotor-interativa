/** Fumaça das cenas da aula: toda cena e figura gera pose válida e indicadores finitos (sem navegador). */
import { readFileSync } from 'node:fs';
import { referencias, pose, SEGMENTOS } from '../src/cinematica/pose.js';
import { calibrarNeutro } from '../src/cinematica/movimentos.js';
import { cenaTeste, FIGURAS } from '../src/aula/cenas.js';
const L = JSON.parse(readFileSync(new URL('../src/modelos/marcos.json', import.meta.url)));
const ref = referencias(L); calibrarNeutro(L, ref, pose);
const labs = JSON.parse(readFileSync(new URL('./labs-aula.json', import.meta.url), 'utf8'));
let falhas = 0, total = 0;
const finito = (x) => JSON.stringify(x, (k, val) => (typeof val === 'number' && !Number.isFinite(val) ? (() => { throw new Error('não finito em ' + k); })() : val));
function checa(nome, c) {
  total++;
  try {
    if (!c) throw new Error('cena nula');
    const { A } = pose(L, ref, c.P);
    for (const s of SEGMENTOS) if (!A[s]) throw new Error('segmento ausente ' + s);
    finito(A);
    if (c.extra) { const r = c.extra(A, c.P, { L, ref, pose: (P) => pose(L, ref, P) }) || {}; finito(r); }
    for (const s of [...(c.fixos || []), ...(c.moveis || [])]) if (!A[s]) throw new Error('destaque inexistente ' + s);
  } catch (e) { falhas++; console.log('FALHA', nome, e.message); }
}
const vistos = new Set();
for (const lab of Object.keys(labs)) { for (const t of [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]) { const c = cenaTeste(lab, t); if (!c) { console.log('SEM CENA', lab); break; } vistos.add(c.id); checa(`${lab.slice(0, 40)} t=${t}`, c); } }
for (const lab of ['Teste de Eichhoff', 'Teste de Finkelstein: o examinador', 'Apley por compressão', 'Apley por distração', 'Teste de Cozen', 'Teste de Mill', 'Teste de Maudsley', 'Epicondilite medial', 'Ortolani', 'Barlow']) for (const t of [0, 0.5, 1]) { const c = cenaTeste(lab, t); if (!c) { console.log('SEM CENA', lab); break; } checa(lab + ' ' + t, c); }
const P = { capa: [{ th: 0 }, { th: 90 }, { th: 180 }], forca: [0, 1, 2, 3, 4, 5].flatMap((g) => [0.3, 1.5, 2.2, 3.5].map((t) => ({ grau: g, t }))),
  pelve: [{ k: 1, pel: 8, tr: 0 }, { k: 0.5, pel: -6, tr: 10 }], pe: ['normal', 'caido', 'rigido'].flatMap((tipo) => [0, 0.4, 0.8, 1].map((s) => ({ s, tipo }))),
  contato: ['slap', 'antepe', 'normal'].map((modo) => ({ u: 0.3, modo })), galsPasso: [{}], galsPerfil: [{}],
  postura: [['post', 'normal'], ['post', 'escol'], ['post', 'disc'], ['lat', 'normal'], ['lat', 'cifose'], ['lat', 'lordose'], ['ant', 'normal'], ['ant', 'varo'], ['ant', 'valgo']].map(([vista, cena]) => ({ vista, cena, niveis: true, prumo: true })),
  carga: [{ ang: 0 }, { ang: 12 }, { ang: 26 }], pontos: [{ flex: true }, { flex: false }] };
for (const [k, ps] of Object.entries(P)) for (const p of ps) checa(`fig ${k} ${JSON.stringify(p)}`, FIGURAS[k](p));
console.log(`cenas distintas: ${vistos.size}; verificações: ${total}; falhas: ${falhas}`);
process.exit(falhas ? 1 : 0);
