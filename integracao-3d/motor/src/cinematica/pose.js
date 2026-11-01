/**
 * MODELO CINEMÁTICO DO CORPO (sem dependência de renderização).
 * Recebe os marcos anatômicos e uma "postura" (ângulos articulares) e devolve a transformação rígida
 * de cada segmento, x' = R·x + t, em coordenadas da cena (metros; Y para cima; +Z anterior; −X lado direito).
 *
 * Hierarquia:  raiz (decúbito) → Pelve → L5 → L4 → L3 → L2 → L1 → Tórax → CabecaPescoco
 *                                                         └→ Clavícula → Escápula → Úmero → Ulna → Rádio → Mão
 *                               Pelve → Fêmur → Perna (tíbia e fíbula) → Pé ;  Fêmur → Patela
 * O lado esquerdo é calculado como o direito e espelhado (o modelo é simétrico), depois composto com o tronco real.
 */
import { v, m, af, euler, clamp } from '../nucleo/mat.js';
import { anguloCintura, CHAVES } from './cintura-escapular.js';
import TORAX from '../modelos/torax.json' with { type: 'json' };

/**
 * Contato escapulotorácico. O gradil é representado por um elipsoide ajustado às costelas do próprio modelo
 * (pipeline/ajusta_torax.py), como o plano de deslizamento de van der Helm (1994) e a superfície de Seth et al. (2016).
 * A borda medial (TS e AI) mantém, durante o movimento, a mesma distância ao elipsoide que tem no repouso
 * (a espessura das partes moles entre a escápula e as costelas); o restante da
 * orientação da escápula segue os incrementos de Ludewig et al. (2009). A correção é a menor rotação em torno
 * da articulação acromioclavicular que satisfaz as duas condições; o desvio em relação a Ludewig vai em info.
 */
const nivel = (p) => Math.hypot(p[0] / TORAX.raios[0], (p[1] - TORAX.centro[1]) / TORAX.raios[1], (p[2] - TORAX.centro[2]) / TORAX.raios[2]);
/** Distância (aproximada, radial a partir do centro) do ponto à superfície do elipsoide; positiva fora. */
const folga = (p) => { const f = nivel(p); return ((f - 1) * Math.hypot(p[0] - TORAX.centro[0], p[1] - TORAX.centro[1], p[2] - TORAX.centro[2])) / f; };
const gradFolga = (p) => [0, 1, 2].map((i) => { const h = 1e-5, a = p.slice(), b = p.slice(); a[i] += h; b[i] -= h; return (folga(a) - folga(b)) / (2 * h); });
export function contatoEscapula(L, ref, Qs, AC0, AC) {
  let R = Qs; const alvo = [ref.contato.TS, ref.contato.AI], pts = [L['TS.r'], L['AI.r']];
  for (let it = 0; it < 12; it++) {
    const A = af.move(R, AC0, AC), P = pts.map((x) => af.em(A, x));
    const r = P.map((p, i) => folga(p) - alvo[i]);
    if (Math.max(Math.abs(r[0]), Math.abs(r[1])) < 1e-7) break;
    const J = P.map((p) => v.cross(v.sub(p, AC), gradFolga(p)));          // d(folga)/dw, com dp = w × (p − AC)
    const a = v.dot(J[0], J[0]), b = v.dot(J[0], J[1]), d = v.dot(J[1], J[1]), det = a * d - b * b;
    if (Math.abs(det) < 1e-12) break;
    const l0 = (d * r[0] - b * r[1]) / det, l1 = (a * r[1] - b * r[0]) / det;   // w = −Jᵀ (J Jᵀ)⁻¹ r (norma mínima)
    const w = v.mul(v.add(v.mul(J[0], l0), v.mul(J[1], l1)), -1), ang = v.len(w);
    if (ang < 1e-12) break;
    R = m.mul(m.eixo(w, (ang * 180) / Math.PI), R);
  }
  return R;
}

export const SEGMENTOS = ['Torax', 'CabecaPescoco', 'Pelve', 'L1', 'L2', 'L3', 'L4', 'L5',
  ...['r', 'l'].flatMap((s) => ['Clavicula', 'Escapula', 'Umero', 'Ulna', 'Radio', 'Mao', 'Femur', 'Patela', 'Perna', 'Pe'].map((n) => `${n}.${s}`))];

/** Referenciais e eixos articulares em repouso, calculados uma vez a partir dos marcos. */
export function referencias(L) {
  const Y = v.norm(v.sub(v.mid(L.IJ, L.C7), v.mid(L.PX, L.T8)));
  let Z = v.norm(v.cross(v.sub(L.IJ, v.mid(L.PX, L.T8)), v.sub(L.C7, v.mid(L.PX, L.T8))));
  if (Z[0] > 0) Z = v.mul(Z, -1);                         // Z do tórax (ISB) = direita do paciente = −X da cena
  const X = v.norm(v.cross(Y, Z));                        // anterior
  const T = m.cols(X, Y, Z);
  const esc = () => {
    const z = v.norm(v.sub(L['AA.r'], L['TS.r'])); let x = v.norm(v.cross(v.sub(L['AA.r'], L['AI.r']), v.sub(L['TS.r'], L['AI.r'])));
    if (v.dot(x, X) < 0) x = v.mul(x, -1); return m.cols(x, v.cross(z, x), z);
  };
  const cla = () => { const z = v.norm(v.sub(L['AC.r'], L['SC.r'])), x = v.norm(v.cross(Y, z)); return m.cols(x, v.cross(z, x), z); };
  const eS = euler.decompYXZ(m.mul(m.t(T), esc())), eC = euler.decompYXZ(m.mul(m.t(T), cla()));
  const EC = v.mid(L['EL.r'], L['EM.r']), PU = v.mid(L['RS.r'], L['US.r']);
  const KJC = v.mid(L['LFE.r'], L['MFE.r']), AJC = v.mid(L['LM.r'], L['MM.r']);
  const ref = {
    X, Y, Z, T, EC, PU, KJC, AJC,
    repousoCintura: { escRotInterna: eS.a, escRotSuperior: -eS.b, escInclPosterior: eS.c, clavRetracao: -eC.a, clavElevacao: -eC.b, clavRotPosterior: eC.c },
    umeroD0: v.norm(v.sub(EC, L['GH.r'])),                      // direção distal do úmero no repouso do modelo
    eixoCotovelo: v.norm(v.sub(L['EM.r'], L['EL.r'])),          // lateral → medial
    eixoPronoSup: v.norm(v.sub(L['UH.r'], L['RH.r'])),          // cabeça do rádio → cabeça da ulna
    eixoPunhoFlex: v.norm(v.sub(L['US.r'], L['RS.r'])),         // radial → ulnar
    maoD0: v.norm(v.sub(L['MC3.r'], L['CAP.r'])),
    femurD0: v.norm(v.sub(KJC, L['HJC.r'])),
    eixoJoelho: v.norm(v.sub(L['MFE.r'], L['LFE.r'])),
    centroQuadris: v.mid(L['HJC.r'], L['HJC.l']),
    discos: {                                                    // centros de rotação intervertebrais (entre corpos)
      L5: v.mid(L['CORPO.L5'], L.S1), L4: v.mid(L['CORPO.L4'], L['CORPO.L5']), L3: v.mid(L['CORPO.L3'], L['CORPO.L4']),
      L2: v.mid(L['CORPO.L2'], L['CORPO.L3']), L1: v.mid(L['CORPO.L1'], L['CORPO.L2']), T12: v.mid(L['CORPO.T12'], L['CORPO.L1']),
    },
  };
  ref.elevRepouso = v.ang(ref.umeroD0, v.mul(Y, -1));
  ref.eixoTibia = v.norm(v.sub(AJC, KJC));
  ref.eixoTornozelo = v.norm(v.sub(L['MM.r'], L['LM.r']));
  ref.pivoCervical = v.lerp(L.C7, L.IJ, 0.35);
  ref.esc0 = esc();
  ref.contato = { TS: folga(L['TS.r']), AI: folga(L['AI.r']) };
  ref.eixoDesvio = v.norm(v.cross(ref.eixoPunhoFlex, ref.maoD0));
  return ref;
}

const orientEsc = (T, a) => m.mul(T, euler.yxz(a.escRotInterna, -a.escRotSuperior, a.escInclPosterior));
const orientCla = (T, a) => m.mul(T, euler.yxz(-a.clavRetracao, -a.clavElevacao, a.clavRotPosterior));

/** Postura neutra (posição anatômica de referência, com os braços ao longo do corpo). */
export function posturaNeutra() {
  const lado = () => ({
    ombro: { elev: 0, plano: 0, rotAxial: 0, cintura: {} },
    cotovelo: 0, antebraco: 90,            // 90 = supinação da posição anatômica; 0 = polegar para cima
    punho: { flex: 0, desvio: 0 },
    quadril: { flex: 0, abd: 0, rot: 0 }, joelho: 0,
    // extensões da integração na aula (todas ILUSTRATIVAS quando usadas nos testes):
    tornozelo: 0,        // + dorsiflexão, − flexão plantar
    joelhoRot: 0,        // rotação axial da tíbia: + externa
    joelhoVaro: 0,       // angulação frontal do joelho: + varo, − valgo
    gaveta: 0,           // translação anterior da tíbia (m)
    luxaFemur: [0, 0, 0],// translação da cabeça do fêmur (m), referencial de repouso
    cotoveloValgo: 0,    // ângulo de carregamento adicional: + valgo, − varo
  });
  return { decubito: 'pe', coluna: { flexLombar: 0, flexToracica: 0, inclinacao: 0 }, pelve: { anteversao: 0, obliquidade: 0 }, pescoco: { flex: 0, rot: 0, incl: 0 }, deslocamento: [0, 0, 0], r: lado(), l: lado() };
}

/** Transformações locais de um lado (direito) em relação ao tronco/pelve em repouso. */
function ladoDireito(L, ref, p) {
  const out = {};
  const N = ref.neutro || {};             // desvios da postura de repouso do modelo (ver calibrarNeutro em movimentos.js)
  // ---- cintura escapular (incrementos sobre o repouso do próprio modelo) ----
  const o = p.ombro;
  const alvo = anguloCintura(o.elev, o.plano, o.cintura), zero = anguloCintura(0, 0);
  const aA = {}, aR = {};
  for (const k of CHAVES) { aR[k] = ref.repousoCintura[k]; aA[k] = aR[k] + (alvo[k] - zero[k]); }
  const Qc = m.mul(orientCla(ref.T, aA), m.t(orientCla(ref.T, aR)));
  const Qlud = m.mul(orientEsc(ref.T, aA), m.t(orientEsc(ref.T, aR)));
  const SC = L['SC.r'], AC0 = L['AC.r'];
  out['Clavicula'] = af.gira(SC, Qc);
  const AC = af.em(out['Clavicula'], AC0);
  const Qs = ref.semContato ? Qlud : contatoEscapula(L, ref, Qlud, AC0, AC);
  out['Escapula'] = af.move(Qs, AC0, AC);
  // ângulos da escápula efetivamente aplicados (ISB, YXZ) e desvio em relação aos incrementos de Ludewig
  const eA = euler.decompYXZ(m.mul(m.t(ref.T), m.mul(Qs, ref.esc0)));
  const aplic = { escRotInterna: eA.a, escRotSuperior: -eA.b, escInclPosterior: eA.c };
  const desvio = Object.fromEntries(Object.keys(aplic).map((k) => [k, aplic[k] - aA[k]]));
  const GH = af.em(out['Escapula'], L['GH.r']);
  // ---- úmero: neutraliza o repouso do modelo, eleva no plano escolhido, depois roda no eixo longo ----
  const baixo = v.mul(ref.Y, -1), lat = ref.Z, ant = ref.X;
  const Rn = m.arco(ref.umeroD0, baixo);
  const h = v.add(v.mul(lat, Math.cos((o.plano * Math.PI) / 180)), v.mul(ant, Math.sin((o.plano * Math.PI) / 180)));
  const Rs = m.eixo(v.norm(v.cross(baixo, h)), o.elev);
  let Rh = m.mul(Rs, Rn);
  if (o.aducaoHorizontal) Rh = m.mul(m.eixo(ant, o.aducaoHorizontal), Rh);        // adução (cruzando à frente do tórax)
  const d = m.app(Rh, ref.umeroD0);
  Rh = m.mul(m.eixo(d, o.rotAxial - (N.rotAxial || 0)), Rh);                                            // + rotação externa
  out['Umero'] = af.move(Rh, L['GH.r'], GH);
  // ---- cotovelo, antebraço, punho (em coordenadas de repouso, compostos com o segmento proximal) ----
  out['Ulna'] = af.comp(out['Umero'], af.gira(ref.EC, m.mul(m.eixo([0, 0, 1], -(p.cotoveloValgo || 0)), m.eixo(ref.eixoCotovelo, -(p.cotovelo - (N.cotovelo || 0))))));
  out['Radio'] = af.comp(out['Ulna'], af.gira(L['RH.r'], m.eixo(ref.eixoPronoSup, p.antebraco - 90 - (N.antebraco || 0))));
  const Rp = m.mul(m.eixo(ref.eixoPunhoFlex, -(p.punho.flex - (N.punhoFlex || 0))), m.eixo(ref.eixoDesvio, p.punho.desvio - (N.punhoDesvio || 0)));
  out['Mao'] = af.comp(out['Radio'], af.gira(L['CAP.r'], Rp));
  // ---- membro inferior ----
  const q = p.quadril;
  // flexão em torno do eixo laterolateral; abdução em torno do anteroposterior; rotação em torno do eixo do fêmur (+ externa)
  const lux = p.luxaFemur || [0, 0, 0];
  out['Femur'] = af.comp({ R: m.I(), t: lux }, af.gira(L['HJC.r'], m.mul(m.eixo([-1, 0, 0], q.flex - (N.quadrilFlex || 0)), m.mul(m.eixo([0, 0, 1], -(q.abd - (N.quadrilAbd || 0))), m.eixo(ref.femurD0, q.rot)))));
  const Rj = m.mul(m.eixo(ref.eixoJoelho, p.joelho - (N.joelho || 0)), m.mul(m.eixo([0, 0, 1], p.joelhoVaro || 0), m.eixo(ref.eixoTibia, p.joelhoRot || 0)));
  out['Perna'] = af.comp(out['Femur'], af.comp({ R: m.I(), t: [0, 0, p.gaveta || 0] }, af.gira(ref.KJC, Rj)));
  out['Patela'] = af.comp(out['Femur'], af.gira(ref.KJC, m.eixo(ref.eixoJoelho, 0.7 * (p.joelho - (N.joelho || 0)))));
  out['Pe'] = af.comp(out['Perna'], af.gira(ref.AJC, m.eixo(ref.eixoTornozelo, -(p.tornozelo || 0))));
  return { local: out, derivado: { GH, escAplicada: aplic, escDesvio: desvio } };
}

/**
 * Pose completa. Devolve { A: {segmento: {R, t}}, info } com grandezas derivadas para os indicadores.
 */
export function pose(L, ref, P) {
  const A = {};
  // raiz: decúbito dorsal = corpo deitado com a face anterior para cima (rotação em torno de X na altura da pelve)
  let raiz = P.decubito === 'dorsal' ? af.gira(ref.centroQuadris, m.rx(-90)) : P.decubito === 'ventral' ? af.gira(ref.centroQuadris, m.rx(90)) : af.I();
  if (P.deslocamento) raiz = af.comp({ R: m.I(), t: P.deslocamento }, raiz);
  const c = P.coluna, pe = P.pelve;
  // pelve: anteversão (rotação em torno do eixo entre os quadris) e obliquidade (em torno do eixo anteroposterior)
  A['Pelve'] = af.comp(raiz, af.gira(ref.centroQuadris, m.mul(m.eixo([1, 0, 0], pe.anteversao), m.eixo([0, 0, 1], pe.obliquidade))));
  // coluna lombar: flexão e inclinação lateral distribuídas igualmente entre L5-S1 e T12-L1
  const niveis = ['L5', 'L4', 'L3', 'L2', 'L1'];
  let pai = A['Pelve'];
  const fl = c.flexLombar / 6, il = c.inclinacao / 6;
  const Rl = m.mul(m.eixo([1, 0, 0], fl), m.eixo([0, 0, -1], il));
  for (const n of niveis) { pai = af.comp(pai, af.gira(ref.discos[n], Rl)); A[n] = pai; }
  A['Torax'] = af.comp(pai, af.gira(ref.discos.T12, m.mul(Rl, m.eixo([1, 0, 0], c.flexToracica))));
  const pc = P.pescoco || { flex: 0, rot: 0, incl: 0 };   // bloco cabeça e coluna cervical, girando junto a C7-T1 (ILUSTRATIVO)
  A['CabecaPescoco'] = af.comp(A['Torax'], af.gira(ref.pivoCervical, m.mul(m.eixo([0, 1, 0], pc.rot), m.mul(m.eixo([0, 0, 1], -pc.incl), m.eixo([1, 0, 0], pc.flex)))));
  const info = {};
  for (const s of ['r', 'l']) {
    const ld = ladoDireito(L, ref, P[s]);
    for (const [k, T] of Object.entries(ld.local)) {
      const loc = s === 'r' ? T : af.espelho(T);
      const base = /Femur|Perna|Patela|Pe$/.test(k) ? A['Pelve'] : A['Torax'];
      A[`${k}.${s}`] = af.comp(base, loc);
    }
    info[s] = ld.derivado;
  }
  return { A, info, raiz };
}

/** Ponto de um marco (lado direito ou esquerdo) transformado pela pose do segmento indicado. */
export function ponto(L, A, seg, marco) {
  return af.em(A[seg], L[marco]);
}
/** Direção (vetor livre) de repouso transformada pela rotação do segmento. */
export function direcao(A, seg, d) { return m.app(A[seg].R, d); }

/** Ângulos derivados da cintura escapular para o painel (incrementos desde a posição neutra). */
export function derivadosOmbro(L, ref, P, lado = 'r') {
  const o = P[lado].ombro;
  const z = anguloCintura(0, 0), a = anguloCintura(o.elev, o.plano, o.cintura);
  const inc = Object.fromEntries(CHAVES.map((k) => [k, a[k] - z[k]]));   // incrementos de Ludewig (alvo)
  const ap = ladoDireito(L, ref, P[lado]).derivado.escAplicada;              // aplicados no modelo, após o contato com o gradil
  const incModelo = { ...inc, ...Object.fromEntries(Object.keys(ap).map((k) => [k, ap[k] - ref.repousoCintura[k]])) };
  return { inc, incModelo, abs: a };
}
export { clamp };
