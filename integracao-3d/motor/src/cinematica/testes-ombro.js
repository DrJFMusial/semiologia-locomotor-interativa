/**
 * TESTES ESPECIAIS DO OMBRO. Texto (finalidade, técnica, positividade, interpretação) copiado sem alteração
 * da aula 1.6 (sim/testes.js, REG.ombro). Cada teste define, para t de 0 a 1: a postura do paciente,
 * as mãos do examinador (pontos de contato, palma e dedos), as forças (setas) e as fases.
 * Ângulos finais de rotação e o grau de estabilização da escápula são ILUSTRATIVOS quando não constam da fonte.
 */
import { v, m, af, clamp, sstep, lerp } from '../nucleo/mat.js';
import { posturaNeutra } from './pose.js';
import AULA from '../dados/aula-1.6.json' with { type: 'json' };

const T = Object.fromEntries(AULA.testesOmbro.map((x) => [x.cena, x]));
const em = (A, s, p) => af.em(A[s], p);
const dir = (A, s, d) => m.app(A[s].R, d);
const ease = (x) => (1 - Math.cos(Math.PI * clamp(x))) / 2;
const seg = (t, a, b) => ease((t - a) / (b - a));

/** Mão que conduz: apoiada do lado de trás do movimento, empurrando na direção dele. */
function conduz(mao, ponto, movimento, eixoSegmento, frente) {
  // palma voltada para o movimento; dedos perpendiculares ao segmento, envolvendo-o (apontando para "frente")
  const d = v.norm(movimento); let dedos = v.norm(v.cross(d, eixoSegmento));
  if (frente && v.dot(dedos, frente) < 0) dedos = v.mul(dedos, -1);
  return { mao, ponto: v.sub(ponto, v.mul(d, 0.035)), palma: d, dedos };
}
const eixoAnt = (A, ref, s = 'r') => v.norm(v.sub(af.em(A['Radio.' + s], s === 'r' ? ref.PU : v.espelho(ref.PU)), af.em(A['Ulna.' + s], s === 'r' ? ref.EC : v.espelho(ref.EC))));
function pontoAntebraco(L, A, ref, s = 'r', f = 0.8) { // f = fração do cotovelo ao punho (0,8: terço distal; 0,9: junto ao punho)
  const ec = em(A, 'Ulna.' + s, s === 'r' ? ref.EC : v.espelho(ref.EC));
  const pu = em(A, 'Radio.' + s, s === 'r' ? ref.PU : v.espelho(ref.PU));
  return v.lerp(ec, pu, f);
}
const ortog = (a, n) => v.norm(v.sub(a, v.mul(n, v.dot(a, n))));
/** Neer (foto om11): mão espalmada sobre a face posterossuperior do ombro, sobre a espinha da escápula,
 *  pressionando para a frente e para baixo; dedos para cima e para a frente, sobre o trapézio. */
function estabilizaPosterior(L, A, ref, s = 'r', mao = 'l') {
  const esp = v.lerp(em(A, 'Escapula.' + s, L['TS.' + s]), em(A, 'Escapula.' + s, L['AA.' + s]), 0.55);
  const cima = dir(A, 'Torax', ref.Y), ant = dir(A, 'Torax', ref.X);
  const palma = v.norm(v.sub(v.mul(ant, 0.6), v.mul(cima, 0.8)));
  return { mao, ponto: v.sub(v.add(esp, v.mul(cima, 0.015)), v.mul(palma, 0.03)), palma, dedos: ortog(v.add(cima, ant), palma) };
}
/** Hawkins (foto om17b): mão sob a parte distal do braço, junto ao cotovelo, palma para cima, sustentando. */
function sustentaBraco(L, A, ref, s = 'r', mao = 'l') {
  const gh = em(A, 'Umero.' + s, L['GH.' + s]), ec = em(A, 'Ulna.' + s, s === 'r' ? ref.EC : v.espelho(ref.EC));
  const cima = dir(A, 'Torax', ref.Y), eixo = v.norm(v.sub(ec, gh));
  const palma = ortog(cima, eixo);
  return { mao, ponto: v.sub(v.lerp(gh, ec, 0.82), v.mul(palma, 0.035)), palma, dedos: v.norm(v.cross(eixo, palma)) };
}
function estabilizaEscapula(L, A, ref, s = 'r', mao = 'l') {
  const aa = em(A, 'Escapula.' + s, L['AA.' + s]);
  const cima = dir(A, 'Torax', ref.Y), ant = dir(A, 'Torax', ref.X);
  return { mao, ponto: v.add(aa, v.add(v.mul(cima, 0.03), v.mul(ant, -0.01))), palma: v.mul(cima, -1), dedos: ant };
}

/**
 * Hawkins: a rotação interna é contada a partir do antebraço horizontal (referência clínica a 90° de elevação).
 * No modelo, elevar 90° no plano de 40° por um eixo único inclina o antebraço para cima; a rotação axial que o deixa
 * horizontal, com a palma para baixo, é de −43° (calculada no modelo: test/hawkins_referencia.mjs).
 */
const HK_ROT0 = -43;

export const TESTES = [
  {
    id: 'arco', ...T.arco, foto: 'om16-arco-doloroso.webp', dur: 9000,
    descricaoAnimacao: 'Abdução ativa de 0° a 180° e retorno; a mão da examinadora apenas repousa sobre o ombro, como na foto da aula.',
    postura: (t) => { const P = posturaNeutra(); const s = t <= 0.45 ? ease(t / 0.45) : t < 0.55 ? 1 : 1 - ease((t - 0.55) / 0.45); P.r.ombro.elev = 180 * s; return P; },
    dor: (P) => P.r.ombro.elev >= 60 && P.r.ombro.elev <= 120,
    maos: (L, A, ref) => [estabilizaEscapula(L, A, ref, 'r', 'l')],
    forcas: () => [],
    fases: (t, P) => (P.r.ombro.elev < 2 ? 'Paciente de frente para o examinador, braço ao lado do corpo.' : P.r.ombro.elev >= 60 && P.r.ombro.elev <= 120 ? `<b>Positivo:</b> ${T.arco.pos}` : t < 0.5 ? 'Abdução ativa; abaixo de 60° e acima de 120° o movimento é indolor.' : 'Retorno: a dor costuma reaparecer na mesma faixa.'),
    vista: 'ant', gonio: true,
  },
  {
    id: 'neer', ...T.neer, foto: 'om11-neer-v2.webp', dur: 8000,
    descricaoAnimacao: 'Uma mão impede o movimento da escápula; a outra eleva passivamente o braço em flexão até o fim. Estabilização da escápula representada como bloqueio de 70% do movimento escapular (ILUSTRATIVO).',
    postura: (t) => { const P = posturaNeutra(); const s = seg(t, 0.15, 0.85); P.r.ombro.elev = 165 * s; P.r.ombro.plano = 90; P.r.ombro.cintura = { estabilizada: 0.7 }; return P; },
    dor: (P) => P.r.ombro.elev > 120,
    maos: (L, A, ref, P, A2) => {
      const p = pontoAntebraco(L, A, ref, 'r', 0.9), p2 = pontoAntebraco(L, A2, ref, 'r', 0.9);
      const d = v.sub(p2, p), mov = v.len(d) > 1e-5 ? d : dir(A, 'Torax', ref.Y);
      return [estabilizaPosterior(L, A, ref, 'r', 'l'), conduz('r', p, mov, eixoAnt(A, ref), v.mul(dir(A, 'Torax', ref.X), -1))];
    },
    forcas: (L, A, ref, P, A2) => {
      const p = pontoAntebraco(L, A, ref, 'r', 0.9), p2 = pontoAntebraco(L, A2, ref, 'r', 0.9); const d = v.sub(p2, p);
      const e = estabilizaPosterior(L, A, ref, 'r', 'l');
      return [{ origem: v.sub(e.ponto, v.mul(e.palma, 0.15)), dir: e.palma, comp: 0.08 }, ...(v.len(d) > 1e-5 ? [{ origem: v.sub(p, v.mul(v.norm(d), 0.17)), dir: d, comp: 0.1 }] : [])];
    },
    fases: (t, P) => (t < 0.15 ? 'Examinador atrás do paciente: uma mão espalmada sobre a face posterior do ombro impede o movimento da escápula; a outra segura o punho.' : P.r.ombro.elev > 120 ? `Elevação passiva até o fim do arco. <b>Positivo:</b> ${T.neer.pos}` : 'Elevação passiva em flexão, com a escápula estabilizada.'),
    vista: 'lat',
  },
  {
    id: 'hawkins', ...T.hawkins, foto: 'om17b-hawkins.webp', dur: 8000,
    descricaoAnimacao: 'Braço elevado a 90° à frente, perto do plano da escápula, e cotovelo a 90°, com a palma para baixo; uma mão sustenta o braço junto ao cotovelo e a outra leva o antebraço para baixo (rotação interna), como na foto. Plano de 40° e rotação interna final de 80° ILUSTRATIVOS.',
    postura: (t) => { const P = posturaNeutra(); const a = seg(t, 0, 0.3); P.r.ombro.elev = 90 * a; P.r.ombro.plano = 40; P.r.cotovelo = 90 * a; P.r.antebraco = 90 - 90 * a; P.r.ombro.rotAxial = HK_ROT0 * a - 80 * seg(t, 0.4, 0.85); return P; },
    dor: (P) => P.r.ombro.rotAxial < HK_ROT0 - 55,
    maos: (L, A, ref, P, A2) => {
      const apoio = sustentaBraco(L, A, ref, 'r', 'l');
      const p = pontoAntebraco(L, A, ref, 'r', 0.85), p2 = pontoAntebraco(L, A2, ref, 'r', 0.85), d = v.sub(p2, p);
      const baixo = v.mul(dir(A, 'Torax', ref.Y), -1);
      return [apoio, conduz('r', p, v.len(d) > 1e-5 ? d : baixo, eixoAnt(A, ref), dir(A, 'Torax', ref.X))];
    },
    forcas: (L, A, ref, P, A2) => { const p = pontoAntebraco(L, A, ref, 'r', 0.85), p2 = pontoAntebraco(L, A2, ref, 'r', 0.85), d = v.sub(p2, p); return P.r.ombro.rotAxial < HK_ROT0 - 1 && v.len(d) > 1e-5 ? [{ origem: v.sub(p, v.mul(v.norm(d), 0.17)), dir: d, comp: 0.1 }] : []; },
    fases: (t, P) => (t < 0.35 ? 'Posição: ombro e cotovelo a 90°, braço à frente, palma para baixo.' : P.r.ombro.rotAxial < HK_ROT0 - 55 ? `Rotação interna forçada. <b>Positivo:</b> ${T.hawkins.pos}` : 'Uma mão sustenta o braço junto ao cotovelo; a outra leva o antebraço para baixo.'),
    vista: 'lat',
  },
  {
    id: 'lata', ...T.lata, foto: 'om10-lata-vazia-v2.webp', dur: 9000, variantes: { normal: 'Resposta normal', positivo: 'Exemplo de resposta positiva (fraqueza)' },
    descricaoAnimacao: 'Braços elevados a 90° no plano da escápula (30° à frente do plano frontal), com rotação interna e polegares para baixo; o examinador, atrás, empurra os antebraços para baixo. Ângulos de rotação ILUSTRATIVOS.',
    postura: (t, variante) => {
      const P = posturaNeutra(); const a = seg(t, 0, 0.35); const cede = variante === 'positivo' ? 25 * seg(t, 0.6, 0.85) : 0;
      for (const s of ['r', 'l']) { P[s].ombro.elev = 90 * a - cede; P[s].ombro.plano = 30; P[s].ombro.rotAxial = -40 * a; P[s].antebraco = 90 - 170 * a; }
      return P;
    },
    dor: (P) => false,
    maos: (L, A, ref, P) => {
      if (P.r.ombro.elev < 80) return [];
      const cima = dir(A, 'Torax', ref.Y), ant = dir(A, 'Torax', ref.X);
      return ['r', 'l'].map((s) => conduz(s, pontoAntebraco(L, A, ref, s, 0.88), v.mul(cima, -1), eixoAnt(A, ref, s), ant));
    },
    forcas: (L, A, ref, P, A2, t) => { if (t < 0.4) return []; const cima = dir(A, 'Torax', ref.Y); return ['r', 'l'].map((s) => ({ origem: v.add(pontoAntebraco(L, A, ref, s, 0.88), v.mul(cima, 0.2)), dir: v.mul(cima, -1), comp: 0.1 })); },
    fases: (t, P, variante) => (t < 0.38 ? 'Braços elevados a 90°, um pouco à frente, polegares para baixo.' : t < 0.6 ? 'O paciente resiste enquanto o examinador empurra os antebraços para baixo.' : variante === 'positivo' ? `<b>Exemplo de resposta positiva:</b> ${T.lata.pos} ${T.lata.sug ? 'Sugere: ' + T.lata.sug : ''}` : 'Resposta normal: o braço sustenta a posição sem dor.'),
    vista: 'post',
  },
  {
    id: 'queda', ...T.queda, foto: 'om18-queda-braco.webp', dur: 9000, variantes: { normal: 'Resposta normal', positivo: 'Exemplo de resposta positiva' },
    descricaoAnimacao: 'O paciente abduz até 90° e abaixa lentamente. No exemplo positivo, o controle se perde abaixo de cerca de 80° e o braço cai (instante e ângulo ILUSTRATIVOS).',
    postura: (t, variante) => {
      const P = posturaNeutra(); let e;
      if (t < 0.3) e = 90 * seg(t, 0, 0.3); else if (variante === 'positivo') e = t < 0.45 ? 90 - 10 * seg(t, 0.3, 0.45) : 80 * (1 - clamp((t - 0.45) / 0.07) ** 2); else e = 90 * (1 - seg(t, 0.35, 0.95));
      P.r.ombro.elev = Math.max(0, e); return P;
    },
    dor: () => false,
    maos: () => [], forcas: () => [],
    fases: (t, P, variante) => (t < 0.3 ? 'O paciente abduz o braço até 90°.' : variante === 'positivo' ? (t > 0.45 ? `<b>Exemplo de resposta positiva:</b> ${T.queda.pos}` : 'Começa a abaixar o braço.') : 'Resposta normal: o braço desce devagar e controlado.'),
    vista: 'ant', gonio: true,
  },
];
export const testePorId = Object.fromEntries(TESTES.map((x) => [x.id, x]));
export { lerp, sstep, conduz, eixoAnt, pontoAntebraco, estabilizaPosterior, sustentaBraco, estabilizaEscapula, HK_ROT0 };
