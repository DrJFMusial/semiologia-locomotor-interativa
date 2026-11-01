/**
 * CENAS 3D DA AULA. Cada cena substitui um manequim esquemático da aula 1.6.1 e devolve, a partir dos mesmos
 * parâmetros que o esquema usava (tempo da linha do tempo, caso, grau, vista), uma descrição para o motor:
 *   { P (postura), vista, foco, apoio ('dorsal' | 'ventral' | 'sentado'), fixos, moveis, tag, mv, gonioUmero,
 *     dor, dorAgora, extra(A, P, ctx) -> { maos, forcas, itens } }
 * As fases e os tempos seguem os esquemas aprovados (o texto de fase continua sendo o da aula).
 * Ângulos marcados como ILUSTRATIVOS não vêm de medida; a etiqueta (tag) aparece na cena.
 */
import { v, m, af, clamp } from '../nucleo/mat.js';
import { posturaNeutra } from '../cinematica/pose.js';
import { porId } from '../cinematica/movimentos.js';
import { testePorId, HK_ROT0, conduz, eixoAnt, pontoAntebraco, estabilizaEscapula } from '../cinematica/testes-ombro.js';
import { tipoValor } from '../cinematica/cintura-escapular.js';

const ease = (x) => (1 - Math.cos(Math.PI * clamp(x))) / 2;
const seg = (t, a, b) => ease((t - a) / (b - a));
const lerp = (a, b, s) => a + (b - a) * s;
const ortog = (a, n) => v.norm(v.sub(a, v.mul(n, v.dot(a, n))));
const ILU = 'ângulos e posição ilustrativos';
const SEM_DEDOS = 'dedos sem articulação no modelo: a posição da mão é aproximada';

/* ------------------------------------------------------------------ utilitários de cena */
/** Ponto (de repouso) de um segmento, na pose A. */
const em = (A, s, p) => af.em(A[s], p);
/** Direção de repouso de um segmento, na pose A: ant [0,0,1], cima [0,1,0], dir (lado direito do paciente) [-1,0,0]. */
const dir = (A, s, d) => v.norm(m.app(A[s].R, d));
const ANT = [0, 0, 1], CIMA = [0, 1, 0], DIR = [-1, 0, 0];
/** Mão do examinador apoiada num ponto: a palma empurra na direção "palma"; recuo afasta a mão do osso (partes moles). */
function mao(lado, ponto, palma, dedos, recuo = 0.03) {
  const pa = v.norm(palma);
  return { mao: lado, ponto: v.sub(ponto, v.mul(pa, recuo)), palma: pa, dedos: ortog(dedos, pa) };
}
/** Seta de força: começa afastada do ponto e aponta para ele. */
const seta = (ponto, d, comp = 0.1, afast = 0.05) => ({ origem: v.sub(ponto, v.mul(v.norm(d), comp + afast)), dir: v.norm(d), comp });
const sentar = (P) => { P.decubito = 'sentado'; for (const s of ['r', 'l']) { P[s].quadril.flex = 90; P[s].joelho = 90; } return P; };
const OLE = (L, ref) => v.add(ref.EC, [0, 0.012, -0.028]);            // ponta do olécrano: posição aproximada a partir do eixo do cotovelo
const BRACO = { fixos: ['Umero.r'], moveis: ['Ulna.r', 'Radio.r', 'Mao.r'] };
const PERNA = { fixos: ['Femur.r'], moveis: ['Perna.r', 'Pe.r', 'Patela.r'] };
const QUADRIL = { fixos: ['Pelve'], moveis: ['Femur.r', 'Perna.r', 'Pe.r', 'Patela.r'] };
const MAO = { fixos: ['Radio.r', 'Ulna.r'], moveis: ['Mao.r'] };
const focoBraco = { alvo: [-0.22, 1.1, 0.12], altura: 0.75, largura: 0.75 };
const focoMao = { alvo: [-0.22, 0.95, 0.25], altura: 0.55, largura: 0.6 };
const focoPerna = { alvo: [-0.1, 0.55, 0.05], altura: 1.1, largura: 1.0 };
const rotEscapula = (a, plano) => {
  const t = tipoValor(a, plano);
  return t === 'extrapolado' ? 'escápula acima de 120°: extrapolação, sem medida de referência' : t === 'ilustrativo' ? 'escápula: movimento ilustrativo' : 'escápula: incrementos medidos (Ludewig, 2009)';
};
/** Antebraço à frente do tronco, cotovelo a 90°: postura de partida dos testes de punho (lado direito). */
function antebracoFrente(P, s, { pron = 90, flexOmbro = 10 } = {}) {
  P[s].ombro.elev = flexOmbro; P[s].ombro.plano = 90; P[s].cotovelo = 90; P[s].antebraco = pron;
  return P;
}

/* ------------------------------------------------------------------ testes do ombro (já validados na 1ª etapa) */
const OMBRO = {
  'Arco doloroso': (t) => { const P = posturaNeutra(); const a = 180 * seg(t, 0.08, 0.88); P.r.ombro.elev = a;
    return { id: 'arco', P, vista: 'ant', dor: [60, 120], dorAgora: a > 60 && a < 120, gonioUmero: true, tag: rotEscapula(a, 0), def: 'arco', maosDe: (h) => h }; },
  'Sinal de Neer': (t) => { const P = posturaNeutra(); P.r.ombro.elev = lerp(4, 168, seg(t, 0.25, 0.85)); P.r.ombro.plano = 90; P.r.ombro.cintura = { estabilizada: 0.7 * seg(t, 0.08, 0.18) };
    return { id: 'neer', P, vista: 'lat', dorAgora: seg(t, 0.82, 0.9) > 0.5, tag: 'estabilização da escápula: ilustrativa', def: 'neer', maosDe: (h) => h.filter((x, i) => (i === 0 ? t >= 0.08 : t >= 0.2)) }; },
  'Sinal de Hawkins': (t) => { const P = posturaNeutra(); P.r.ombro.elev = 90; P.r.ombro.plano = 40; P.r.cotovelo = 90; P.r.antebraco = 0; P.r.ombro.rotAxial = HK_ROT0 - 80 * seg(t, 0.3, 0.85);
    return { id: 'hawkins', P, vista: 'lat', dorAgora: seg(t, 0.82, 0.9) > 0.5, tag: 'plano de 40° e rotação final: ilustrativos', def: 'hawkins', maosDe: (h) => h.filter((x, i) => (i === 0 ? t >= 0.12 : t >= 0.25)) }; },
  'Teste da lata vazia': (t) => { const P = posturaNeutra(); const r = seg(t, 0.15, 0.3), dip = 6 * seg(t, 0.45, 0.75);
    for (const s of ['r', 'l']) { P[s].ombro.elev = 90 - dip; P[s].ombro.plano = 30; P[s].ombro.rotAxial = -40 * r; P[s].antebraco = 90 - 170 * r; }
    return { id: 'lata', P, vista: 'ant', dorAgora: seg(t, 0.78, 0.86) > 0.5, tag: 'ângulos de rotação: ilustrativos', def: 'lata', maosDe: (h) => (t >= 0.35 ? h : []), forcasDe: (f) => (t >= 0.35 ? f : []) }; },
  'Teste da queda do braço': (t) => { const P = posturaNeutra(); P.r.ombro.elev = lerp(90, 8, seg(t, 0.25, 0.85));
    return { id: 'queda', P, vista: 'ant', gonioUmero: true, tag: '', def: 'queda', maosDe: () => [] }; },
};
const FOCO_OMBRO = {
  arco: { alvo: [0, 1.45, 0], altura: 1.1, largura: 1.2 }, queda: { alvo: [0, 1.4, 0], altura: 0.9, largura: 1.1 },
  neer: { alvo: [0, 1.48, 0.05], altura: 1.1, largura: 0.8 }, hawkins: { alvo: [0, 1.35, 0.15], altura: 0.85, largura: 0.9 },
  lata: { alvo: [0, 1.35, 0.1], altura: 0.8, largura: 1.7 },
};
function cenaOmbro(nome, t) {
  const c = OMBRO[nome](t), def = testePorId[c.def];
  const c2 = OMBRO[nome](Math.min(1, t + 0.01));
  return { P: c.P, focoFixo: true, vista: c.vista, foco: FOCO_OMBRO[c.id], fixos: ['Escapula.r', 'Clavicula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'],
    gonioUmero: c.gonioUmero, dor: c.dor, dorAgora: c.dorAgora, tag: c.tag, peleExp: true,
    extra: (A, P, { L, ref, pose }) => { const A2 = pose(c2.P).A; const h = def.maos(L, A, ref, P, A2) || []; const f = def.forcas(L, A, ref, P, A2, t) || [];
      return { maos: c.maosDe(h), forcas: c.forcasDe ? c.forcasDe(f) : f }; } };
}

/* ------------------------------------------------------------------ demais testes (todas as regiões) */
const dorEm = (p, texto = 'dor') => ({ dorEm: { p, texto } });
export const TESTES = {
  /* ---------- punho e mão ---------- */
  'Teste de Phalen': (t) => {
    const P = posturaNeutra(); const s = seg(t, 0.12, 0.5);
    for (const l of ['r', 'l']) { P[l].ombro.elev = 70; P[l].ombro.plano = 80; P[l].ombro.rotAxial = -90; P[l].cotovelo = 70; P[l].antebraco = 60; P[l].punho.flex = 90 * s; }
    return { P, vista: 'oblAnt', foco: { alvo: [0, 1.15, 0.25], altura: 0.6, largura: 0.8 }, ...MAO, focoSegs: ['Radio.l', 'Ulna.l', 'Mao.l'], tag: `${SEM_DEDOS}; ${ILU}`,
      extra: (A, P2, { L }) => (t >= 0.85 ? { itens: dorEm(em(A, 'Mao.r', L['PALMA.r']), 'formigamento') } : {}) };
  },
  'Phalen invertido': (t) => {
    const P = posturaNeutra(); const s = seg(t, 0.12, 0.5);
    for (const l of ['r', 'l']) { P[l].ombro.elev = 40; P[l].ombro.plano = 70; P[l].ombro.rotAxial = -60; P[l].cotovelo = 80; P[l].antebraco = -30; P[l].punho.flex = -85 * s; }
    return { P, vista: 'oblAnt', foco: { alvo: [0, 1.2, 0.25], altura: 0.65, largura: 0.8 }, ...MAO, focoSegs: ['Radio.l', 'Ulna.l', 'Mao.l'], tag: `${SEM_DEDOS}; ${ILU}`,
      extra: (A, P2, { L }) => (t >= 0.85 ? { itens: dorEm(em(A, 'Mao.r', L['PALMA.r']), 'formigamento') } : {}) };
  },
  'Sinal de Tinel': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: 90 });
    const bate = t >= 0.12 && t < 0.6 ? Math.max(0, Math.sin(((t - 0.12) / 0.48) * Math.PI * 8)) : 0;
    return { P, vista: 'lat', foco: focoMao, ...MAO, tag: 'martelo representado pela seta de percussão; ' + ILU,
      extra: (A, P2, { L, ref }) => {
        const punho = v.lerp(em(A, 'Radio.r', ref.PU), em(A, 'Mao.r', L['CAP.r']), 0.35), cima = dir(A, 'Radio.r', [0, 0, 1]);
        const r = { forcas: t >= 0.12 && t < 0.6 ? [seta(punho, v.mul(cima, -1), 0.06, 0.02 + 0.05 * (1 - bate))] : [], itens: {} };
        if (t >= 0.6) Object.assign(r.itens, dorEm(em(A, 'Mao.r', L['PALMA.r']), 'formigamento'));
        return r;
      } };
  },
  'Teste de Finkelstein': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: 0 }); P.r.punho.desvio = -30 * seg(t, 0.38, 0.75);
    return { P, vista: 'ant', foco: focoMao, ...MAO, tag: `${SEM_DEDOS} (mão fechada sobre o polegar não representada); ${ILU}`,
      extra: (A, P2, { L, ref }) => {
        if (t < 0.38) return {};
        const ante = pontoAntebraco(L, A, ref, 'r', 0.55), mc = em(A, 'Mao.r', L['MC3.r']);
        const radial = dir(A, 'Mao.r', [0, 1, 0]);
        const r = { maos: [mao('l', ante, dir(A, 'Radio.r', [0, -1, 0]), dir(A, 'Radio.r', [0, 0, 1])), mao('r', mc, v.mul(radial, -1), dir(A, 'Mao.r', [0, 0, 1]))], forcas: [seta(mc, v.mul(radial, -1))], itens: {} };
        if (t >= 0.8) Object.assign(r.itens, dorEm(em(A, 'Radio.r', L['RS.r'])));
        return r;
      } };
  },
  'Teste de Durkan': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: 90 });
    return { P, vista: 'lat', foco: focoMao, ...MAO, tag: `${SEM_DEDOS}; ${ILU}`,
      extra: (A, P2, { L }) => {
        if (t < 0.12) return {};
        const pa = em(A, 'Mao.r', L['CAP.r']), baixo = v.mul(dir(A, 'Mao.r', [0, 0, 1]), -1);
        const r = { maos: [mao('r', pa, baixo, dir(A, 'Mao.r', [-1, 0, 0]), 0.02)], forcas: [seta(pa, baixo, 0.06)], itens: {} };
        if (t >= 0.8) Object.assign(r.itens, dorEm(em(A, 'Mao.r', L['PALMA.r']), 'formigamento'));
        return r;
      } };
  },
  'Teste de Allen': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: 90 });
    return { P, vista: 'lat', foco: focoMao, ...MAO, tag: `${SEM_DEDOS}; a palidez da palma não é representada`,
      extra: (A, P2, { L }) => {
        if (t < 0.1) return {};
        const rad = em(A, 'Radio.r', L['RS.r']), uln = em(A, 'Ulna.r', L['US.r']), baixo = v.mul(dir(A, 'Radio.r', [0, 0, 1]), -1), long = dir(A, 'Radio.r', [0, -1, 0]);
        const maos = [mao('l', rad, baixo, long, 0.02)]; if (t < 0.5) maos.push(mao('r', uln, baixo, long, 0.02));
        return { maos, itens: { pontos: [{ p: rad, rotulo: 'artéria radial' }, { p: uln, rotulo: 'artéria ulnar', dx: -10 }] } };
      } };
  },
  /* ---------- coluna ---------- */
  'Teste de Spurling': (t) => {
    const P = sentar(posturaNeutra()); const s = seg(t, 0.1, 0.35), alivio = seg(t, 0.9, 1);
    P.pescoco = { rot: -40 * s, flex: -25 * s, incl: -8 * s };
    return { P, vista: 'lat', apoio: 'sentado', foco: { alvo: [0, 1.25, 0], altura: 1.0, largura: 1.0 }, fixos: ['Torax'], moveis: ['CabecaPescoco'], tag: 'coluna cervical como bloco único: ' + ILU,
      extra: (A, P2, { L }) => {
        const topo = em(A, 'CabecaPescoco', v.add(L.C7, [0, 0.24, 0.04])), baixo = v.mul(dir(A, 'CabecaPescoco', CIMA), -1);
        const r = { maos: [], forcas: [], itens: {} };
        if (t >= 0.4) { r.maos.push(mao('r', topo, baixo, dir(A, 'CabecaPescoco', ANT), 0.03), mao('l', v.add(topo, v.mul(dir(A, 'CabecaPescoco', ANT), -0.04)), baixo, dir(A, 'CabecaPescoco', ANT), 0.05)); r.forcas.push(alivio > 0 ? seta(topo, v.mul(baixo, -1)) : seta(topo, baixo)); }
        if (t >= 0.65 && t < 0.9) Object.assign(r.itens, dorEm(em(A, 'Umero.r', v.lerp(L['GH.r'], L['EL.r'], 0.5)), 'dor irradiada'));
        return r;
      } };
  },
  'Elevação da perna estendida': (t) => cenaLasegue(t),
  /* ---------- quadril ---------- */
  'FABER': (t) => {
    const P = posturaNeutra(); P.decubito = 'dorsal'; const s = seg(t, 0.1, 0.45), pr = seg(t, 0.6, 0.8);
    P.r.quadril.flex = 55 * s; P.r.quadril.abd = (40 + 10 * pr) * s; P.r.quadril.rot = 45 * s; P.r.joelho = 100 * s;
    return { P, vista: 'ant', apoio: 'dorsal', foco: { alvo: [0, 0.95, 0.1], altura: 1.0, largura: 1.0 }, ...QUADRIL, tag: ILU,
      extra: (A, P2, { L }) => {
        const r = { maos: [], forcas: [], itens: {} }, baixo = v.mul(dir(A, 'Pelve', ANT), -1);
        if (t >= 0.5) r.maos.push(mao('l', em(A, 'Pelve', L['ASIS.l']), baixo, dir(A, 'Pelve', CIMA)));
        if (t >= 0.6) { const jo = em(A, 'Femur.r', v.mid(L['LFE.r'], L['MFE.r'])); r.maos.push(mao('r', jo, baixo, dir(A, 'Femur.r', [0, -1, 0]), 0.05)); r.forcas.push(seta(jo, baixo)); }
        if (t >= 0.85) Object.assign(r.itens, { pontos: [{ p: em(A, 'Pelve', L['HJC.r']), rotulo: 'virilha: quadril', classe: 'dor' }, { p: em(A, 'Pelve', v.lerp(L['PSIS.r'], L.S1, 0.4)), rotulo: 'sacroilíaca', classe: 'dor', dx: -10 }] });
        return r;
      } };
  },
  'Teste de Thomas': (t) => {
    const P = posturaNeutra(); P.decubito = 'dorsal'; const f = seg(t, 0.1, 0.35), e = seg(t, 0.45, 0.85);
    P.l.quadril.flex = 120 * f; P.l.joelho = 125 * f; P.r.quadril.flex = 120 * f * (1 - e); P.r.joelho = 125 * f * (1 - e);
    P.coluna.flexLombar = 10 * f; P.pelve.anteversao = -8 * f;
    return { P, vista: 'lat', apoio: 'dorsal', foco: { alvo: [0, 0.95, 0.1], altura: 0.9, largura: 1.8 }, ...QUADRIL, mv: porId.quaFlex, tag: ILU,
      extra: (A, P2, { L }) => {
        const r = { maos: [mao('r', em(A, 'L3', L['CORPO.L3']), dir(A, 'L3', ANT), dir(A, 'L3', DIR), 0.07)], itens: {} };
        if (t >= 0.35) r.maos.push(mao('l', em(A, 'Femur.l', v.mid(L['LFE.l'], L['MFE.l'])), v.mul(dir(A, 'Pelve', CIMA), -1), dir(A, 'Femur.l', ANT), 0.06));
        return r;
      } };
  },
  /* ---------- joelho ---------- */
  'Gaveta anterior': (t) => {
    const P = posturaNeutra(); P.decubito = 'dorsal'; P.r.quadril.flex = 45; P.r.joelho = 90; P.r.gaveta = 0.008 * seg(t, 0.25, 0.6);
    return { P, vista: 'lat', apoio: 'dorsal', foco: focoPerna, ...PERNA, tag: 'translação da tíbia (8 mm) ilustrativa',
      extra: (A, P2, { L, ref }) => {
        const r = { maos: [], forcas: [] }, tt = em(A, 'Perna.r', L['TT.r']), ant = dir(A, 'Perna.r', ANT), lat = dir(A, 'Perna.r', DIR);
        if (t >= 0.1) r.maos.push(mao('l', em(A, 'Pe.r', v.lerp(L['CAL.r'], L['HAL.r'], 0.6)), v.mul(dir(A, 'Pelve', ANT), -1), dir(A, 'Pe.r', ANT), 0.05));
        if (t >= 0.25) { r.maos.push(mao('r', v.add(em(A, 'Perna.r', v.lerp(ref.KJC, ref.AJC, 0.15)), v.mul(lat, 0.05)), v.mul(lat, -1), ant, 0.02)); r.forcas.push(seta(tt, ant, 0.08, 0.0)); }
        return r;
      } };
  },
  'Teste de Lachman': (t) => {
    const P = posturaNeutra(); P.decubito = 'dorsal'; P.r.quadril.flex = 15; P.r.joelho = 20; P.r.gaveta = 0.008 * seg(t, 0.25, 0.6);
    return { P, vista: 'lat', apoio: 'dorsal', foco: focoPerna, ...PERNA, tag: 'translação da tíbia (8 mm) ilustrativa',
      extra: (A, P2, { L, ref }) => {
        const r = { maos: [], forcas: [] }, ant = dir(A, 'Perna.r', ANT), lat = dir(A, 'Femur.r', DIR);
        if (t >= 0.12) r.maos.push(mao('l', v.add(em(A, 'Femur.r', v.lerp(L['HJC.r'], ref.KJC, 0.82)), v.mul(lat, 0.06)), v.mul(lat, -1), dir(A, 'Femur.r', ANT), 0.02));
        if (t >= 0.25) { const tt = em(A, 'Perna.r', L['TT.r']); r.maos.push(mao('r', v.add(em(A, 'Perna.r', v.lerp(ref.KJC, ref.AJC, 0.12)), v.mul(lat, 0.05)), v.mul(lat, -1), ant, 0.02)); r.forcas.push(seta(tt, ant, 0.08, 0)); }
        return r;
      } };
  },
  'Teste de McMurray': (t) => {
    const P = posturaNeutra(); P.decubito = 'dorsal'; const rot = seg(t, 0.12, 0.3), ext = seg(t, 0.35, 0.65), inv = seg(t, 0.85, 0.95);
    P.r.quadril.flex = lerp(115, 90, ext); P.r.joelho = lerp(140, 90, ext); P.r.joelhoRot = 25 * rot * (1 - 2 * inv); P.r.joelhoVaro = -6 * rot * (1 - 2 * inv);
    return { P, vista: 'lat', apoio: 'dorsal', foco: { alvo: [-0.1, 0.95, 0.35], altura: 0.9, largura: 1.0 }, ...PERNA, tag: 'rotação da tíbia e valgo ilustrativos',
      extra: (A, P2, { L, ref }) => {
        const r = { maos: [mao('l', em(A, 'Femur.r', v.mid(L['LFE.r'], L['MFE.r'])), dir(A, 'Femur.r', [0, -1, 0]), dir(A, 'Femur.r', ANT), 0.05), mao('r', em(A, 'Pe.r', L['CAL.r']), dir(A, 'Pe.r', ANT), dir(A, 'Pe.r', DIR), 0.03)], itens: {} };
        if (t >= 0.65 && t < 0.85) Object.assign(r.itens, dorEm(em(A, 'Perna.r', v.lerp(ref.KJC, L['MFE.r'], 0.5)), 'estalido na interlinha'));
        return r;
      } };
  },
  'Estresse em valgo': (t) => estresseJoelho(t, -1),
  'Estresse em varo': (t) => estresseJoelho(t, 1),
  'Teste de Apley': (t) => {
    const P = posturaNeutra(); P.decubito = 'ventral'; P.r.joelho = 90;
    const comp = t < 0.46, gira = comp ? seg(t, 0.18, 0.24) : seg(t, 0.69, 0.75);
    P.r.joelhoRot = 18 * Math.sin((t * 14) * Math.PI) * gira;
    return { P, vista: 'lat', apoio: 'ventral', foco: { alvo: [-0.1, 0.95, -0.55], altura: 0.9, largura: 1.2 }, ...PERNA, tag: `rotação ${ILU}`,
      extra: (A, P2, { L, ref }) => {
        const r = { maos: [], forcas: [] }, sola = em(A, 'Pe.r', v.lerp(L['CAL.r'], L['HAL.r'], 0.4)), eixo = v.norm(v.sub(em(A, 'Perna.r', ref.AJC), em(A, 'Perna.r', ref.KJC)));
        if (comp && t >= 0.06) { r.maos.push(mao('r', sola, v.mul(eixo, -1), dir(A, 'Pe.r', ANT), 0.04)); r.forcas.push(seta(sola, v.mul(eixo, -1))); }
        if (!comp) {
          r.maos.push(mao('l', em(A, 'Femur.r', v.lerp(L['HJC.r'], ref.KJC, 0.6)), dir(A, 'Pelve', [0, 0, 1]), dir(A, 'Femur.r', [0, -1, 0]), 0.07));
          if (t >= 0.58) { const tor = em(A, 'Perna.r', ref.AJC); r.maos.push(mao('r', tor, eixo, dir(A, 'Perna.r', DIR), 0.04)); r.forcas.push({ origem: v.add(tor, v.mul(eixo, 0.04)), dir: eixo, comp: 0.1 }); }
        }
        return r;
      } };
  },
  /* ---------- tornozelo e pé ---------- */
  'Teste de Thompson': (t) => {
    const P = posturaNeutra(); P.decubito = 'ventral'; P.r.joelho = 90; P.r.tornozelo = -28 * seg(t, 0.35, 0.55);
    return { P, vista: 'lat', apoio: 'ventral', foco: { alvo: [-0.1, 1.0, -0.55], altura: 0.8, largura: 1.1 }, fixos: ['Perna.r'], moveis: ['Pe.r'], tag: 'flexão plantar ilustrativa (tendão íntegro)',
      extra: (A, P2, { L, ref }) => {
        if (t < 0.12) return {};
        const pant = em(A, 'Perna.r', v.add(v.lerp(ref.KJC, ref.AJC, 0.35), [0, 0, -0.05]));
        return { maos: [mao('r', pant, dir(A, 'Perna.r', ANT), dir(A, 'Perna.r', DIR), 0.04)], forcas: [seta(pant, dir(A, 'Perna.r', ANT), 0.06)] };
      } };
  },
  /* ---------- cotovelo ---------- */
  'Teste de Cozen': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: -80 }); P.r.punho.flex = -35 * seg(t, 0.28, 0.6);
    return { P, vista: 'lat', foco: focoBraco, ...BRACO, tag: `${SEM_DEDOS}; ${ILU}`,
      extra: (A, P2, { L }) => {
        const r = { maos: [], forcas: [], itens: {} };
        if (t >= 0.12) r.maos.push(mao('l', em(A, 'Umero.r', L['EL.r']), dir(A, 'Umero.r', [1, 0, 0]), dir(A, 'Umero.r', CIMA), 0.025));
        if (t >= 0.28) { const dorso = em(A, 'Mao.r', L['MC3.r']), d = v.mul(dir(A, 'Mao.r', [0, 0, -1]), -1); r.maos.push(mao('r', dorso, d, dir(A, 'Mao.r', DIR), 0.025)); r.forcas.push(seta(dorso, d, 0.07)); }
        if (t >= 0.75) Object.assign(r.itens, dorEm(em(A, 'Umero.r', L['EL.r'])));
        return r;
      } };
  },
  'Teste de Mill': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: -80 }); const e = seg(t, 0.15, 0.45), f = seg(t, 0.45, 0.75);
    P.r.cotovelo = 90 * (1 - e); P.r.ombro.elev = 10 + 30 * e; P.r.punho.flex = lerp(-30, 60, f);
    return { P, vista: 'lat', foco: focoBraco, ...BRACO, tag: `${SEM_DEDOS}; ${ILU}`,
      extra: (A, P2, { L }) => {
        const r = { maos: [mao('l', em(A, 'Umero.r', L['EL.r']), dir(A, 'Umero.r', [1, 0, 0]), dir(A, 'Umero.r', CIMA), 0.025)], forcas: [], itens: {} };
        if (t >= 0.45) { const dorso = em(A, 'Mao.r', L['MC3.r']), d = dir(A, 'Mao.r', [0, 0, 1]); r.maos.push(mao('r', dorso, d, dir(A, 'Mao.r', DIR), 0.025)); r.forcas.push(seta(dorso, d, 0.07)); }
        if (t >= 0.8) Object.assign(r.itens, dorEm(em(A, 'Umero.r', L['EL.r'])));
        return r;
      } };
  },
  'Teste de Maudsley': (t) => {
    const P = posturaNeutra(); P.r.ombro.elev = 60; P.r.ombro.plano = 90; P.r.antebraco = -80; P.r.punho.flex = -10;
    return { P, vista: 'lat', foco: { alvo: [-0.2, 1.25, 0.4], altura: 0.7, largura: 0.9 }, ...BRACO, tag: 'dedo médio sem articulação no modelo: a resistência é mostrada na extremidade da mão',
      extra: (A, P2, { L }) => {
        const r = { maos: [], forcas: [], itens: {} };
        if (t >= 0.15) r.maos.push(mao('l', em(A, 'Radio.r', v.lerp(L['RH.r'], L['RS.r'], 0.5)), v.mul(dir(A, 'Pelve', CIMA), 1), dir(A, 'Radio.r', DIR), 0.04));
        if (t >= 0.35) { const ponta = em(A, 'Mao.r', L['PONTA.r']), d = v.mul(dir(A, 'Pelve', CIMA), -1); r.forcas.push(seta(ponta, d, 0.06)); r.maos.push(mao('r', ponta, d, dir(A, 'Mao.r', DIR), 0.02)); }
        if (t >= 0.75) Object.assign(r.itens, dorEm(em(A, 'Umero.r', L['EL.r'])));
        return r;
      } };
  },
  'Epicondilite medial': (t) => {
    const P = antebracoFrente(posturaNeutra(), 'r', { pron: 90 }); const e = seg(t, 0.15, 0.7);
    P.r.cotovelo = 90 * (1 - e); P.r.ombro.elev = 10 + 25 * e; P.r.punho.flex = -40;
    return { P, vista: 'lat', foco: focoBraco, ...BRACO, tag: ILU,
      extra: (A, P2, { L }) => (t >= 0.75 ? { itens: dorEm(em(A, 'Umero.r', L['EM.r'])) } : {}) };
  },
  /* ---------- quadril do recém-nascido (DDQ) ---------- */
  'Ortolani': (t) => cenaDDQ(t, 'ortolani'),
  'Barlow': (t) => cenaDDQ(t, 'barlow'),
};
function estresseJoelho(t, sinal) {
  const P = posturaNeutra(); P.decubito = 'dorsal'; P.r.quadril.flex = 15; P.r.joelho = 20; P.r.joelhoVaro = sinal * 7 * seg(t, 0.25, 0.6);
  return { P, vista: 'ant', apoio: 'dorsal', foco: { alvo: [-0.1, 0.9, 0.55], altura: 0.7, largura: 0.8 }, ...PERNA, tag: `abertura articular de 7° ${ILU.replace('ângulos e posição ', '')}`,
    extra: (A, P2, { L, ref }) => {
      const r = { maos: [], forcas: [] }, lat = dir(A, 'Femur.r', DIR); // valgo (sinal −1): joelho para dentro (mão lateral), tornozelo para fora
      const joelho = em(A, 'Femur.r', ref.KJC), torn = em(A, 'Perna.r', ref.AJC), dj = v.mul(lat, sinal < 0 ? -1 : 1);
      if (t >= 0.12) { r.maos.push(mao('l', v.sub(joelho, v.mul(dj, 0.05)), dj, dir(A, 'Femur.r', [0, -1, 0]), 0.02)); r.forcas.push(seta(v.sub(joelho, v.mul(dj, 0.05)), dj, 0.07)); }
      if (t >= 0.25) { r.maos.push(mao('r', v.add(torn, v.mul(dj, 0.04)), v.mul(dj, -1), dir(A, 'Perna.r', [0, -1, 0]), 0.02)); r.forcas.push(seta(v.add(torn, v.mul(dj, 0.04)), v.mul(dj, -1), 0.07)); }
      return r;
    } };
}
function cenaLasegue(t) {
  const P = posturaNeutra(); P.decubito = 'dorsal'; const a = 85 * seg(t, 0.12, 0.88); P.r.quadril.flex = a;
  return { P, vista: 'lat', apoio: 'dorsal', foco: { alvo: [0, 0.95, 0.35], altura: 1.0, largura: 2.0 }, ...QUADRIL, mv: porId.quaFlex, dorFaixa: [35, 70], angulo: a, tag: 'nervo isquiático: trajeto esquemático',
    extra: (A, P2, { L, ref }) => {
      const tenso = a > 35 && a <= 70;
      const nervo = [em(A, 'Pelve', v.add(L['HJC.r'], [0.015, 0.03, -0.07])), em(A, 'Femur.r', v.add(v.lerp(L['HJC.r'], ref.KJC, 0.3), [0, 0, -0.035])),
        em(A, 'Femur.r', v.add(v.lerp(L['HJC.r'], ref.KJC, 0.7), [0, 0, -0.035])), em(A, 'Femur.r', v.add(ref.KJC, [0, 0.03, -0.04])), em(A, 'Perna.r', v.add(v.lerp(ref.KJC, ref.AJC, 0.25), [-0.01, 0, -0.04]))];
      const r = { maos: [mao('r', em(A, 'Perna.r', ref.AJC), dir(A, 'Pelve', ANT), dir(A, 'Perna.r', DIR), 0.05), mao('l', em(A, 'Femur.r', v.mid(L['LFE.r'], L['MFE.r'])), v.mul(dir(A, 'Femur.r', [0, 0, 1]), -1), dir(A, 'Femur.r', DIR), 0.05)],
        itens: { linhas: [{ pts: nervo, classe: tenso ? 'nervo tenso' : 'nervo', rotulo: tenso ? 'nervo isquiático tensionado' : a > 70 ? 'nervo sem nova deformação' : 'nervo isquiático frouxo', rotuloEm: 1, dx: 10, dy: -10 }] } };
      return r;
    } };
}
function cenaDDQ(t, tipo) {
  const P = posturaNeutra(); P.decubito = 'dorsal'; P.r.quadril.flex = 90; P.r.joelho = 100;
  let lux = 0;
  if (tipo === 'ortolani') { P.r.quadril.abd = 60 * seg(t, 0.25, 0.55); lux = 1 - seg(t, 0.5, 0.56); }
  else { P.r.quadril.abd = -10 * seg(t, 0.12, 0.4); lux = seg(t, 0.4, 0.5) * (1 - seg(t, 0.62, 0.7)); }
  P.r.luxaFemur = [0, 0.006 * lux, -0.014 * lux];
  return { P, vista: 'ant', apoio: 'dorsal', foco: { alvo: [0, 0.95, 0.35], altura: 0.75, largura: 0.9 }, ...QUADRIL,
    tag: 'esqueleto adulto: mostra só a direção das manobras; o quadril do recém-nascido é cartilaginoso. Deslocamento da cabeça femoral ilustrativo',
    extra: (A, P2, { L }) => {
      const r = { maos: [], itens: {} };
      if (t >= 0.12) r.maos.push(mao('r', em(A, 'Femur.r', v.add(L['HJC.r'], [-0.07, -0.03, 0])), dir(A, 'Femur.r', [1, 0, 0]), dir(A, 'Femur.r', [0, -1, 0]), 0.03), mao('l', em(A, 'Pelve', L['ASIS.l']), v.mul(dir(A, 'Pelve', ANT), -1), dir(A, 'Pelve', CIMA)));
      if (lux > 0.5) Object.assign(r.itens, dorEm(em(A, 'Pelve', L['HJC.r']), tipo === 'ortolani' ? 'luxado' : 'sai do acetábulo'));
      else if ((tipo === 'ortolani' && t >= 0.55 && t < 0.85) || (tipo === 'barlow' && t >= 0.7)) Object.assign(r.itens, dorEm(em(A, 'Pelve', L['HJC.r']), tipo === 'ortolani' ? 'ressalto: reduz' : 'volta ao acetábulo'));
      return r;
    } };
}
/* variantes da aula que usam a mesma cena com outra linha do tempo */
const ALIAS = [
  ['Teste de Eichhoff', 'Teste de Finkelstein', (t) => t],
  ['Apley por compressão', 'Teste de Apley', (t) => t * 0.45],
  ['Apley por distração', 'Teste de Apley', (t) => 0.47 + t * 0.53],
];
export function cenaTeste(lab, t) {
  const al = ALIAS.find(([x]) => lab.startsWith(x)); if (al) { const c = cenaTeste(al[1], al[2](t)); return c && { ...c, id: al[0] }; }
  const k = Object.keys(OMBRO).find((x) => lab.startsWith(x)); if (k) return { id: k, ...cenaOmbro(k, t) };
  const j = Object.keys(TESTES).find((x) => lab.startsWith(x)); if (!j) return null;
  return { id: j, ...TESTES[j](t) };
}

/* ------------------------------------------------------------------ figuras fora dos testes */
export const FIGURAS = {
  /** Capa: abdução do ombro direito de 0° a 180°, com goniômetro. */
  capa: ({ th }) => { const P = posturaNeutra(); P.r.ombro.elev = th;
    return { P, vista: 'ant', foco: { alvo: [0, 1.15, 0], altura: 1.9, largura: 1.0 }, mv: porId.ombroAbd, fixos: ['Escapula.r', 'Clavicula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'], tag: rotEscapula(th, 0), angulo: th, semControles: true }; },
  /** Força muscular: flexão do cotovelo, grau 0 a 5 (grau 2: braço apoiado, vista de cima). */
  forca: (prm) => {
    const { grau, cot, res, cede, pulso } = prm.t != null ? { grau: prm.grau, ...forcaLinha(prm.grau, prm.t) } : prm;
    const P = posturaNeutra();
    if (grau === 2) { P.r.ombro.elev = 90; P.r.ombro.plano = 90; P.r.ombro.rotAxial = -90; P.r.cotovelo = cot; P.r.antebraco = 0; }
    else { P.r.cotovelo = cot; }
    return { P, focoAuto: (tt) => ({ grau, t: tt * 4 }), sub: grau === 2 ? 'mesa' : 'pe', vista: grau === 2 ? 'sup' : 'lat', foco: grau === 2 ? { alvo: [-0.15, 1.3, 0.32], altura: 0.85, largura: 0.9 } : { alvo: [-0.2, 1.15, 0.2], altura: 0.95, largura: 0.9 }, mv: porId.cotFlex, ...BRACO,
      tag: grau === 2 ? 'braço apoiado: a mesa não é representada' : 'contração e resistência: representação esquemática', angulo: cot,
      extra: (A, P2, { L, ref }) => {
        const r = { maos: [], forcas: [], itens: {} };
        if (pulso > 0.05) { const b = em(A, 'Umero.r', v.add(v.lerp(L['GH.r'], ref.EC, 0.55), [0, 0, 0.04])); r.itens.pontos = [{ p: b, r: 8 + 10 * pulso, classe: 'pulso', rotulo: 'contração' }]; }
        if (res > 0) {
          const pu = pontoAntebraco(L, A, ref, 'r', 0.9);
          const d = ortog(v.mul(dir(A, 'Umero.r', [0, -1, 0]), 1), dir(A, 'Ulna.r', [0, -1, 0]));
          r.maos.push(mao('l', pu, d, dir(A, 'Radio.r', DIR), 0.03)); r.forcas.push({ ...seta(pu, d, 0.05 + 0.07 * res), cede });
          r.maos.push(mao('r', em(A, 'Umero.r', v.lerp(L['GH.r'], ref.EC, 0.5)), v.mul(dir(A, 'Umero.r', ANT), -1), dir(A, 'Umero.r', CIMA), 0.04));
        }
        return r;
      } };
  },
  /** Marcha: pelve no apoio simples sobre o membro direito, visto de trás. */
  pelve: ({ k, pel, tr }) => {
    const P = posturaNeutra(); P.pelve.obliquidade = -pel * k; P.coluna.inclinacao = -(tr + pel) * k;
    P.l.quadril.flex = 25; P.l.joelho = 45; P.r.quadril.abd = -pel * k * 0.8; P.l.quadril.abd = pel * k * 0.3;
    for (const s of ['r', 'l']) P[s].ombro.elev = 8;
    return { P, vista: 'post', foco: { alvo: [0, 0.95, 0], altura: 1.95, largura: 1.0 }, fixos: ['Femur.r'], moveis: ['Pelve'], tag: 'inclinações ilustrativas',
      extra: (A, P2, { L }) => {
        const e = em(A, 'Pelve', L['ASIS.l']), d = em(A, 'Pelve', L['ASIS.r']), meio = v.mid(e, d);
        return { itens: { linhas: [{ pts: [v.add(e, [0.12, 0, 0]), v.add(d, [-0.12, 0, 0])], classe: 'nivel', rotulo: 'pelve', dx: 8 }, { pts: [[meio[0] - 0.3, meio[1], meio[2]], [meio[0] + 0.3, meio[1], meio[2]]], classe: 'ref' }] } };
      } };
  },
  /** Marcha: balanço do membro direito visto de lado (mesmos ângulos do esquema da aula). */
  pe: ({ s, tipo }) => {
    const ang = pernaAngulos(s, tipo), P = posturaNeutra();
    P.r.quadril.flex = ang.q; P.r.joelho = ang.joelho; P.r.tornozelo = ang.tornozelo;
    return { P, vista: 'lat', foco: { alvo: [0, 0.55, 0.18], altura: 1.25, largura: 1.3 }, ...QUADRIL, tag: 'ângulos do esquema da aula (ilustrativos)',
      extra: (A, P2, { L, ref, pose }) => {
        const traj = []; const sc = tipo === 'caido' ? 0.86 : 1;
        for (let i = 0; i <= 24; i++) { const a = pernaAngulos((i / 24) * sc, tipo), Q = posturaNeutra(); Q.r.quadril.flex = a.q; Q.r.joelho = a.joelho; Q.r.tornozelo = a.tornozelo; traj.push(em(pose(Q).A, 'Pe.r', L['HAL.r'])); }
        const chao = Math.min(em(A, 'Pe.l', L['CAL.l'])[1], em(A, 'Pe.l', L['HAL.l'])[1]);
        const dedo = em(A, 'Pe.r', L['HAL.r']);
        const itens = { linhas: [{ pts: traj, classe: 'traj', rotulo: 'trajetória dos dedos', rotuloEm: 12, dy: -10 }, { pts: [[0.2, chao, -0.5], [0.2, chao, 0.8]], classe: 'chao' }] };
        if (dedo[1] < chao + 0.003) itens.pontos = [{ p: dedo, classe: 'dor', r: 9, rotulo: 'os dedos tocam o chão' }];
        return { itens };
      } };
  },
  /** Marcha: contato inicial (três momentos do pé no chão). u de 0 a 1 percorre os momentos. */
  contato: ({ u, modo }) => {
    const P = posturaNeutra(); const k = u < 0.5 ? seg(u, 0.05, 0.45) : 1;
    const ini = modo === 'antepe' ? -18 : 14; P.r.tornozelo = lerp(ini, 0, modo === 'slap' ? seg(u, 0.35, 0.42) : k);
    P.r.quadril.flex = 20; P.r.joelho = 5;
    return { P, focoAuto: (tt) => ({ u: tt, modo }), vista: 'lat', foco: { alvo: [0, 0.3, 0.12], altura: 0.8, largura: 1.0 }, fixos: ['Perna.r'], moveis: ['Pe.r'], tag: 'ângulos do tornozelo ilustrativos', animado: true };
  },
  /** GALS: manequins estáticos de apoio às fotos. */
  galsPasso: () => { const P = posturaNeutra(); P.r.quadril.flex = 22; P.r.joelho = 6; P.l.quadril.flex = -14; P.l.joelho = 18; P.r.ombro.elev = 14; P.r.ombro.plano = -90; P.l.ombro.elev = 16; P.l.ombro.plano = 90; P.r.cotovelo = P.l.cotovelo = 12; P.l.tornozelo = 8;
    return { P, vista: 'lat', foco: { alvo: [0, 0.9, 0], altura: 1.95, largura: 1.0 }, tag: 'meio passo: postura ilustrativa', semControles: true }; },
  galsPerfil: () => ({ P: posturaNeutra(), vista: 'lat', foco: { alvo: [0, 0.9, 0], altura: 1.95, largura: 1.0 }, tag: '', semControles: true }),
  /** Inspeção estática: três vistas e suas variações. */
  postura: ({ vista, cena, niveis, prumo }) => postura(vista, cena, niveis, prumo),
  /** Cotovelo: ângulo de carregamento (valgo fisiológico do modelo + ajuste). */
  carga: ({ ang }) => {
    const focoAuto = () => ({ ang });
    const P = posturaNeutra(); P.r.cotoveloValgo = ang - 12; // o atlas está perto do ângulo médio; o ajuste é relativo a ele
    return { P, focoAuto, vista: 'ant', foco: { alvo: [-0.2, 1.05, 0], altura: 0.95, largura: 0.6 }, ...BRACO, tag: 'deformidade simulada por angulação no cotovelo (ilustrativa)',
      extra: (A, P2, { L, ref }) => {
        const gh = em(A, 'Umero.r', L['GH.r']), ec = em(A, 'Ulna.r', ref.EC), pu = em(A, 'Radio.r', ref.PU);
        return { itens: { linhas: [{ pts: [gh, v.add(ec, v.mul(v.norm(v.sub(ec, gh)), 0.3))], classe: 'eixo' }, { pts: [ec, v.add(ec, v.mul(v.norm(v.sub(pu, ec)), 0.32))], classe: 'eixo mv' }] } };
      } };
  },
  /** Cotovelo: três pontos de palpação, em flexão e em extensão (vista posterior). */
  pontos: ({ flex }) => {
    const P = posturaNeutra(); P.r.cotovelo = flex ? 90 : 0; P.r.antebraco = 0;
    return { P, vista: 'post', foco: { alvo: [-0.215, 1.09, -0.04], altura: 0.3, largura: 0.34 }, ...BRACO, tag: 'ponta do olécrano: posição aproximada',
      extra: (A, P2, { L, ref }) => {
        const el = em(A, 'Umero.r', L['EL.r']), emd = em(A, 'Umero.r', L['EM.r']), ol = em(A, 'Ulna.r', OLE(L, ref));
        return { itens: { poligono: [el, emd, ol], pontos: [{ p: el, rotulo: 'epicôndilo lateral', dx: 12, dy: -10 }, { p: emd, rotulo: 'epicôndilo medial', dx: -12, dy: -10 }, { p: ol, rotulo: 'olécrano', dx: 12, dy: 24 }] } };
      } };
  },
};
/* linha do tempo da força, igual à do esquema da aula (ciclo de 4 s) */
function forcaLinha(g, e) {
  const t = (e % 4) / 4; let cot = 6, res = 0, cede = false, pulso = 0;
  if (g === 1) pulso = Math.max(0, Math.sin(t * Math.PI * 6));
  if (g === 2) cot = 120 * ease(t < 0.5 ? t * 2 : 2 - t * 2);
  if (g === 3) { if (t < 0.45) cot = 6 + 134 * ease(t / 0.45); else if (t < 0.6) { cot = 140; res = 0.6; } else { cot = 140 - 130 * ease((t - 0.6) / 0.25); res = 0.6; cede = true; } }
  if (g === 4) { if (t < 0.3) cot = 6 + 84 * ease(t / 0.3); else if (t < 0.55) { cot = 90; res = 0.7; } else { cot = 90 - 40 * ease((t - 0.55) / 0.3); res = 1; cede = true; } }
  if (g === 5) { if (t < 0.3) cot = 6 + 84 * ease(t / 0.3); else { cot = 90 + Math.sin(t * 60) * 0.8; res = 1; } }
  return { cot, res, cede, pulso };
}
/* ângulos do balanço, iguais aos do esquema da aula (mecanismos.js, pernaRel) */
function pernaAngulos(s, tipo) {
  let q = s <= 0.65 ? -18 + 56 * ease(s / 0.65) : 38 - 16 * ease((s - 0.65) / 0.35);
  let sh = -46 + 65 * ease(s) ** 1.8;
  let t = s < 0.25 ? 15 - 80 * s : -5;
  if (tipo === 'caido') { q += 18 * Math.sin(Math.PI * s); sh -= 22 * Math.sin(Math.PI * s); t = 32; }
  if (tipo === 'rigido') sh = q - 3;
  return { q, joelho: q - sh, tornozelo: -t };
}
function postura(vista, cena, niveis, prumo) {
  const P = posturaNeutra(); let tag = '', foco = { alvo: [0, 0.95, 0], altura: 1.95, largura: 1.0 }, vis = 'post';
  if (vista === 'post') {
    if (cena === 'escol') { P.coluna.inclinacao = 8; P.r.ombro.cintura = { extra: { clavElevacao: 6, escInclPosterior: -8 } }; tag = 'aproximação: o tórax do modelo é rígido; a curva torácica e a rotação das costelas não são representadas'; }
    if (cena === 'disc') { P.pelve.obliquidade = 4; P.coluna.inclinacao = -6; P.r.quadril.abd = 4; P.l.quadril.abd = -4; P.l.joelho = 4; tag = 'encurtamento simulado pela obliquidade da pelve (ilustrativo)'; }
  } else if (vista === 'lat') {
    vis = 'lat';
    if (cena === 'cifose') { P.coluna.flexToracica = 18; P.pescoco = { flex: -20, rot: 0, incl: 0 }; tag = 'aproximação: o tórax do modelo é rígido; a cifose é sugerida pela inclinação do tórax'; }
    if (cena === 'lordose') { P.pelve.anteversao = 14; P.coluna.flexLombar = -16; tag = 'lordose simulada pela anteversão da pelve e extensão lombar (ilustrativo)'; }
  } else {
    vis = 'ant'; foco = { alvo: [0, 0.55, 0], altura: 1.15, largura: 0.9 };
    const vr = cena === 'varo' ? 12 : cena === 'valgo' ? -12 : 0; P.r.joelhoVaro = P.l.joelhoVaro = vr;
    if (vr) tag = 'angulação no joelho simulada (ilustrativa)';
  }
  return { P, sub: vis, vista: vis, foco, tag, semControles: false,
    extra: (A, P2, { L, ref }) => {
      const itens = { linhas: [] };
      const chao = Math.min(em(A, 'Pe.r', L['CAL.r'])[1], em(A, 'Pe.l', L['CAL.l'])[1]);
      if (vista === 'post' || vista === 'lat') {
        if (prumo) {
          const topo = vista === 'post' ? em(A, 'CabecaPescoco', v.add(L.C7, [0, 0.16, -0.03])) : em(A, 'CabecaPescoco', v.add(L.C7, [0, 0.13, 0.06]));
          itens.linhas.push({ pts: [v.add(topo, [0, 0.12, 0]), [topo[0], chao, topo[2]]], classe: 'prumo', rotulo: vista === 'post' ? 'fio de prumo' : 'vertical de referência', rotuloEm: 0, dx: 10, dy: 10 });
        }
        if (niveis && vista === 'post') {
          const par = (s, a, b, txt) => { const p = em(A, s + '.r', L[a]), q = em(A, s + '.l', L[b]); itens.linhas.push({ pts: [v.add(p, [-0.06, 0, -0.05]), v.add(q, [0.06, 0, -0.05])], classe: 'nivel', rotulo: txt, rotuloEm: 1, dx: 10 }); };
          par('Clavicula', 'AC.r', 'AC.l', 'ombros'); par('Escapula', 'AI.r', 'AI.l', 'escápulas');
          const cr = (lado) => em(A, 'Pelve', v.add(v.lerp(L['ASIS.' + lado], L['PSIS.' + lado], 0.5), [0, 0.05, 0]));
          itens.linhas.push({ pts: [v.add(cr('r'), [-0.04, 0, -0.1]), v.add(cr('l'), [0.04, 0, -0.1])], classe: 'nivel', rotulo: 'cristas ilíacas', rotuloEm: 1, dx: 10 });
        }
        if (niveis && vista === 'lat') {
          for (const [s, p, txt] of [['CabecaPescoco', v.add(L.C7, [0, 0.06, 0]), 'cervical'], ['Torax', L.T8, 'torácica'], ['L3', L['CORPO.L3'], 'lombar']]) itens.pontos = [...(itens.pontos || []), { p: em(A, s, p), rotulo: txt, dx: -12 }];
        }
      } else {
        const jo = (l) => em(A, 'Femur.' + l, ref.KJC.map((x, i) => (i === 0 && l === 'l' ? -x : x))), to = (l) => em(A, 'Perna.' + l, ref.AJC.map((x, i) => (i === 0 && l === 'l' ? -x : x)));
        itens.linhas.push({ pts: [jo('r'), jo('l')], classe: 'nivel', rotulo: 'joelhos', dx: 10 }, { pts: [to('r'), to('l')], classe: 'nivel', rotulo: 'tornozelos', dx: 10 });
      }
      return { itens };
    } };
}
