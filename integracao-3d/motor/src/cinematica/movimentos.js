/**
 * REGISTRO DE MOVIMENTOS. Cada movimento declara: dados da aula (nome, amplitude, fonte, instrução, nota,
 * copiados sem alteração de sim/movimentos.js da aula 1.6), plano, eixo, estruturas, mecanismo de animação,
 * limitações, postura em função do ângulo, goniômetro e vista. Nada aqui depende de Three.js.
 */
import { v, m, af, clamp } from '../nucleo/mat.js';
import { posturaNeutra } from './pose.js';
import AULA from '../dados/aula-1.6.json' with { type: 'json' };

const aula = Object.fromEntries(AULA.movimentos.map((x) => [x.k, x]));
const P0 = () => posturaNeutra();

/* ---------- utilitários para goniômetros (todas as funções recebem L, A (pose), ref) ---------- */
const em = (A, s, p) => af.em(A[s], p);
const dir = (A, s, d) => m.app(A[s].R, d);
const eixoUmero = (L, A, ref, s = 'r') => v.norm(v.sub(em(A, 'Umero.' + s, s === 'r' ? ref.EC : v.espelho(ref.EC)), em(A, 'Umero.' + s, L['GH.' + s])));
const eixoAntebraco = (L, A, ref) => v.norm(v.sub(em(A, 'Radio.r', ref.PU), em(A, 'Ulna.r', ref.EC)));
const eixoMao = (L, A) => v.norm(v.sub(em(A, 'Mao.r', L['MC3.r']), em(A, 'Mao.r', L['CAP.r'])));
const eixoFemur = (L, A, ref) => v.norm(v.sub(em(A, 'Femur.r', ref.KJC), em(A, 'Femur.r', L['HJC.r'])));
const eixoPerna = (L, A, ref) => v.norm(v.sub(em(A, 'Perna.r', ref.AJC), em(A, 'Perna.r', ref.KJC)));
const baixoTorax = (L, A, ref) => v.mul(dir(A, 'Torax', ref.Y), -1);

const ombro = (o) => (P) => { Object.assign(P.r.ombro, o); return P; };

export const GRUPOS = [
  { id: 'ombro', nome: 'Ombro' }, { id: 'cotovelo', nome: 'Cotovelo e antebraço' }, { id: 'punho', nome: 'Punho' },
  { id: 'quadril', nome: 'Quadril' }, { id: 'joelho', nome: 'Joelho' }, { id: 'coluna', nome: 'Coluna lombar' },
];

const LIM_OMBRO = 'Cabeça do úmero sempre centrada na glenoide (sem translação). Escápula mantida sobre o gradil por restrição de contato (elipsoide ajustado às costelas do modelo); o contato reduz a rotação superior em relação a Ludewig acima de 90°. Pele sem músculos.';

export const MOVIMENTOS = [
  {
    id: 'ombroAbd', grupo: 'ombro', aula: 'ombroAbd', max: 180, chaves: [0, 45, 90, 120, 135, 180], bilateral: true,
    eixo: 'Anteroposterior, passando pela cabeça do úmero',
    estruturas: 'Glenoumeral (deltoide, supraespinal), escapulotorácica (trapézio, serrátil anterior), esternoclavicular e acromioclavicular.',
    mecanismo: 'Elevação umerotorácica no plano coronal; clavícula e escápula com os incrementos de Ludewig et al. (2009) até 120°, ajuste de plano aproximado e extrapolação didática acima de 120°.',
    limitacoes: LIM_OMBRO + ' Acima de 120° não há medida no estudo de referência.',
    postura: (a, sit) => { const P = P0(); P.r.ombro.elev = a; P.r.ombro.plano = 0; if (sit === 'gu') { const f = a / 110; P.r.ombro.cintura = { extra: { escRotSuperior: 18 * f, clavElevacao: 14 * f } }; } return P; },
    gonio: { vista: ['post', 'ant'], centro: (L, A) => em(A, 'Umero.r', L['GH.r']), fixo: baixoTorax, movel: eixoUmero, ref: 'eixo longitudinal do tórax' },
    fixos: ['Escapula.r', 'Clavicula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'], vista: 'post', foco: { alvo: [0, 1.45, 0], altura: 1.5 },
    situacoes: { normal: { max: 180 }, arco: { max: 180, dor: [60, 120] }, gu: { max: 110, ilustrativa: true } },
  },
  {
    id: 'ombroFlex', grupo: 'ombro', aula: 'ombroFlex', max: 180, chaves: [0, 45, 90, 120, 180],
    eixo: 'Laterolateral, passando pela cabeça do úmero',
    estruturas: 'Glenoumeral (deltoide anterior, coracobraquial), escapulotorácica, esternoclavicular e acromioclavicular.',
    mecanismo: 'Elevação umerotorácica no plano sagital; cintura escapular de Ludewig et al. (2009) com o ajuste aproximado para a flexão (escápula mais rodada internamente, clavícula menos retraída).',
    limitacoes: LIM_OMBRO,
    postura: (a) => ombro({ elev: a, plano: 90 })(P0()),
    gonio: { vista: ['lat'], centro: (L, A) => em(A, 'Umero.r', L['GH.r']), fixo: baixoTorax, movel: eixoUmero, ref: 'eixo longitudinal do tórax' },
    fixos: ['Escapula.r', 'Clavicula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'], vista: 'lat', foco: { alvo: [0, 1.45, 0], altura: 1.5 },
  },
  {
    id: 'ombroExt', grupo: 'ombro', aula: 'ombroExt', max: 60, chaves: [0, 30, 60],
    eixo: 'Laterolateral, passando pela cabeça do úmero',
    estruturas: 'Glenoumeral (deltoide posterior, latíssimo do dorso, redondo maior).',
    mecanismo: 'Extensão do úmero no plano sagital. A participação da escápula (inclinação anterior) é ILUSTRATIVA: o estudo de referência não mediu a extensão.',
    limitacoes: LIM_OMBRO,
    postura: (a) => ombro({ elev: a, plano: -90 })(P0()),
    gonio: { vista: ['lat'], centro: (L, A) => em(A, 'Umero.r', L['GH.r']), fixo: baixoTorax, movel: eixoUmero, ref: 'eixo longitudinal do tórax' },
    fixos: ['Escapula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'], vista: 'lat', foco: { alvo: [0, 1.3, 0], altura: 1.3 },
  },
  {
    id: 'ombroAdu', grupo: 'ombro', aula: null, max: 75, chaves: [0, 40, 75],
    nome: 'Adução do ombro', plano: 'Frontal, com o braço em 30° de flexão para passar à frente do tórax',
    val: '75°', fonte: 'Exame Físico em Ortopedia', instr: 'Com o braço em 30° de flexão, leve-o em direção à linha média, à frente do tórax.',
    eixo: 'Anteroposterior, passando pela cabeça do úmero',
    estruturas: 'Glenoumeral (peitoral maior, latíssimo do dorso).',
    mecanismo: 'Flexão fixa de 30° e adução em torno do eixo anteroposterior do tórax. Movimento da escápula não modelado (simplificação).',
    limitacoes: LIM_OMBRO + ' Não consta da tela "Movimentos e amplitudes" da aula: incluído a pedido, com amplitude do Exame Físico em Ortopedia (cap. 6).',
    postura: (a) => ombro({ elev: 30, plano: 90, aducaoHorizontal: a })(P0()),
    gonio: { vista: ['ant'], centro: (L, A) => em(A, 'Umero.r', L['GH.r']), fixo: baixoTorax, movel: eixoUmero, ref: 'eixo longitudinal do tórax, na projeção anterior', normal: (L, A, ref) => dir(A, 'Torax', ref.X) },
    fixos: ['Escapula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'], vista: 'ant', foco: { alvo: [0, 1.3, 0], altura: 1.2 },
  },
  {
    id: 'ombroRE', grupo: 'ombro', aula: 'ombroRE', max: 90, chaves: [0, 45, 90],
    eixo: 'Longitudinal do úmero (abduzido a 90°)',
    estruturas: 'Glenoumeral (infraespinal, redondo menor).',
    mecanismo: 'Abdução de 90° com a cintura escapular correspondente, cotovelo a 90° e rotação do úmero no próprio eixo. A escápula não acompanha a rotação (simplificação).',
    limitacoes: LIM_OMBRO,
    postura: (a) => { const P = ombro({ elev: 90, plano: 0, rotAxial: a })(P0()); P.r.cotovelo = 90; P.r.antebraco = 0; return P; },
    gonio: { vista: ['lat'], centro: (L, A, ref) => em(A, 'Ulna.r', ref.EC), fixo: (L, A, ref) => dir(A, 'Torax', ref.X), movel: eixoAntebraco, ref: 'horizontal anterior (antebraço apontando para a frente = 0°)', normal: (L, A, ref) => eixoUmero(L, A, ref) },
    fixos: ['Umero.r'], moveis: ['Ulna.r', 'Radio.r', 'Mao.r'], vista: 'lat', foco: { alvo: [-0.35, 1.45, 0.1], altura: 1.1 },
  },
  {
    id: 'ombroRI', grupo: 'ombro', aula: 'ombroRI', max: 80, chaves: [0, 40, 80],
    eixo: 'Longitudinal do úmero (abduzido a 90°)',
    estruturas: 'Glenoumeral (subescapular, peitoral maior, latíssimo do dorso).',
    mecanismo: 'Como na rotação externa, em sentido oposto.',
    limitacoes: LIM_OMBRO,
    postura: (a) => { const P = ombro({ elev: 90, plano: 0, rotAxial: -a })(P0()); P.r.cotovelo = 90; P.r.antebraco = 0; return P; },
    gonio: { vista: ['lat'], centro: (L, A, ref) => em(A, 'Ulna.r', ref.EC), fixo: (L, A, ref) => dir(A, 'Torax', ref.X), movel: eixoAntebraco, ref: 'horizontal anterior', normal: (L, A, ref) => eixoUmero(L, A, ref) },
    fixos: ['Umero.r'], moveis: ['Ulna.r', 'Radio.r', 'Mao.r'], vista: 'lat', foco: { alvo: [-0.35, 1.4, 0.1], altura: 1.1 },
  },
  {
    id: 'cotFlex', grupo: 'cotovelo', aula: 'cotFlex', max: 150, chaves: [0, 45, 90, 150],
    eixo: 'Laterolateral, pelos epicôndilos do úmero',
    estruturas: 'Umeroulnar e umerorradial (bíceps braquial, braquial, braquiorradial).',
    mecanismo: 'Rotação da ulna, do rádio e da mão em torno do eixo epicondilar; antebraço em supinação.',
    limitacoes: 'Eixo fixo pelos epicôndilos (o eixo real varia alguns graus); ângulo de carregamento do modelo mantido; sem contato entre os segmentos do braço e do antebraço na flexão máxima.',
    postura: (a) => { const P = P0(); P.r.cotovelo = a; return P; },
    gonio: { vista: ['lat'], centro: (L, A, ref) => em(A, 'Ulna.r', ref.EC), fixo: (L, A, ref) => v.mul(eixoUmero(L, A, ref), 1), movel: eixoAntebraco, ref: 'eixo do úmero (extensão completa = 0°)', normal: (L, A, ref) => dir(A, 'Umero.r', ref.eixoCotovelo) },
    fixos: ['Umero.r'], moveis: ['Ulna.r', 'Radio.r', 'Mao.r'], vista: 'lat', foco: { alvo: [-0.22, 1.1, 0.05], altura: 0.9 },
  },
  {
    id: 'sup', grupo: 'cotovelo', aula: 'sup', max: 90, chaves: [0, 45, 90], pronoSup: true,
    eixo: 'Longitudinal do antebraço, da cabeça do rádio à cabeça da ulna',
    estruturas: 'Radioulnares proximal e distal (supinador, bíceps braquial).',
    mecanismo: 'O rádio (e a mão) gira em torno do eixo radioulnar; a ulna fica parada. Cotovelo a 90°, junto ao corpo.',
    limitacoes: 'Eixo de pronossupinação fixo, definido pelos centros das cabeças do rádio e da ulna; a pele do antebraço distribui a torção.',
    postura: (a) => { const P = P0(); P.r.cotovelo = 90; P.r.antebraco = a; return P; },
    gonio: { vista: ['ant'], centro: (L, A, ref) => em(A, 'Radio.r', ref.PU), fixo: (L, A, ref) => dir(A, 'Torax', ref.Y), movel: (L, A) => v.norm(v.sub(em(A, 'Radio.r', L['RS.r']), em(A, 'Radio.r', L['US.r']))), ref: 'vertical (polegar para cima = 0°)', normal: (L, A, ref) => dir(A, 'Ulna.r', ref.eixoPronoSup) },
    fixos: ['Ulna.r', 'Umero.r'], moveis: ['Radio.r', 'Mao.r'], vista: 'ant', foco: { alvo: [-0.2, 1.1, 0.25], altura: 0.7 },
  },
  {
    id: 'pro', grupo: 'cotovelo', aula: 'pro', max: 80, chaves: [0, 40, 80], pronoSup: true,
    eixo: 'Longitudinal do antebraço, da cabeça do rádio à cabeça da ulna',
    estruturas: 'Radioulnares proximal e distal (pronador redondo, pronador quadrado).',
    mecanismo: 'Como na supinação, em sentido oposto.',
    limitacoes: 'Como na supinação.',
    postura: (a) => { const P = P0(); P.r.cotovelo = 90; P.r.antebraco = -a; return P; },
    gonio: { vista: ['ant'], centro: (L, A, ref) => em(A, 'Radio.r', ref.PU), fixo: (L, A, ref) => dir(A, 'Torax', ref.Y), movel: (L, A) => v.norm(v.sub(em(A, 'Radio.r', L['RS.r']), em(A, 'Radio.r', L['US.r']))), ref: 'vertical (polegar para cima = 0°)', normal: (L, A, ref) => dir(A, 'Ulna.r', ref.eixoPronoSup) },
    fixos: ['Ulna.r', 'Umero.r'], moveis: ['Radio.r', 'Mao.r'], vista: 'ant', foco: { alvo: [-0.2, 1.1, 0.25], altura: 0.7 },
  },
  {
    id: 'punExt', grupo: 'punho', aula: 'punExt', max: 80, chaves: [0, 40, 70, 80],
    eixo: 'Laterolateral, pelo capitato', estruturas: 'Radiocarpal e mediocarpal (extensores radiais e ulnar do carpo).',
    mecanismo: 'Rotação da mão em torno do eixo que passa pelo capitato, paralelo à linha entre os processos estiloides. Cotovelo a 90°, palma para baixo.',
    limitacoes: 'Os ossos do carpo se movem como um bloco com a mão (o modelo não separa as fileiras do carpo).',
    postura: (a) => { const P = P0(); P.r.cotovelo = 90; P.r.antebraco = -80; P.r.punho.flex = -a; return P; },
    gonio: { vista: ['lat'], centro: (L, A) => em(A, 'Mao.r', L['CAP.r']), fixo: eixoAntebraco, movel: eixoMao, ref: 'eixo do antebraço', normal: (L, A, ref) => dir(A, 'Radio.r', ref.eixoPunhoFlex) },
    fixos: ['Radio.r', 'Ulna.r'], moveis: ['Mao.r'], vista: 'lat', foco: { alvo: [-0.25, 1.1, 0.3], altura: 0.6 },
  },
  {
    id: 'punFlex', grupo: 'punho', aula: 'punFlex', max: 80, chaves: [0, 40, 80],
    eixo: 'Laterolateral, pelo capitato', estruturas: 'Radiocarpal e mediocarpal (flexores radial e ulnar do carpo).',
    mecanismo: 'Como na extensão, em sentido oposto.', limitacoes: 'Carpo como bloco.',
    postura: (a) => { const P = P0(); P.r.cotovelo = 90; P.r.antebraco = -80; P.r.punho.flex = a; return P; },
    gonio: { vista: ['lat'], centro: (L, A) => em(A, 'Mao.r', L['CAP.r']), fixo: eixoAntebraco, movel: eixoMao, ref: 'eixo do antebraço', normal: (L, A, ref) => dir(A, 'Radio.r', ref.eixoPunhoFlex) },
    fixos: ['Radio.r', 'Ulna.r'], moveis: ['Mao.r'], vista: 'lat', foco: { alvo: [-0.25, 1.1, 0.3], altura: 0.6 },
  },
  {
    id: 'desRad', grupo: 'punho', aula: 'desRad', max: 20, chaves: [0, 10, 20],
    eixo: 'Dorsopalmar, pelo capitato', estruturas: 'Radiocarpal e mediocarpal (extensores e flexor radiais do carpo).',
    mecanismo: 'Rotação da mão em torno do eixo dorsopalmar que passa pelo capitato. Palma para baixo.', limitacoes: 'Carpo como bloco.',
    postura: (a) => { const P = P0(); P.r.cotovelo = 90; P.r.antebraco = -80; P.r.punho.desvio = a; return P; },
    gonio: { vista: ['sup'], centro: (L, A) => em(A, 'Mao.r', L['CAP.r']), fixo: eixoAntebraco, movel: eixoMao, ref: 'eixo do antebraço', normal: (L, A, ref) => dir(A, 'Radio.r', ref.eixoDesvio) },
    fixos: ['Radio.r', 'Ulna.r'], moveis: ['Mao.r'], vista: 'sup', foco: { alvo: [-0.25, 1.1, 0.3], altura: 0.6 },
  },
  {
    id: 'desUln', grupo: 'punho', aula: 'desUln', max: 30, chaves: [0, 15, 30],
    eixo: 'Dorsopalmar, pelo capitato', estruturas: 'Radiocarpal e mediocarpal (extensor e flexor ulnares do carpo).',
    mecanismo: 'Como no desvio radial, em sentido oposto.', limitacoes: 'Carpo como bloco.',
    postura: (a) => { const P = P0(); P.r.cotovelo = 90; P.r.antebraco = -80; P.r.punho.desvio = -a; return P; },
    gonio: { vista: ['sup'], centro: (L, A) => em(A, 'Mao.r', L['CAP.r']), fixo: eixoAntebraco, movel: eixoMao, ref: 'eixo do antebraço', normal: (L, A, ref) => dir(A, 'Radio.r', ref.eixoDesvio) },
    fixos: ['Radio.r', 'Ulna.r'], moveis: ['Mao.r'], vista: 'sup', foco: { alvo: [-0.25, 1.1, 0.3], altura: 0.6 },
  },
  {
    id: 'quaFlex', grupo: 'quadril', aula: 'quaFlex', max: 120, chaves: [0, 60, 90, 120], decubito: 'dorsal',
    eixo: 'Laterolateral, pelo centro da cabeça do fêmur', estruturas: 'Coxofemoral (iliopsoas, reto femoral).',
    mecanismo: 'Decúbito dorsal; flexão do quadril com o joelho acompanhando (até 115°), como na instrução do Bates. Pelve fixa.',
    limitacoes: 'Pelve não retroverte no fim do arco (no exame real, a retroversão pélvica soma alguns graus). Partes moles da coxa e do abdome não colidem.',
    postura: (a) => { const P = P0(); P.decubito = 'dorsal'; P.r.quadril.flex = a; P.r.joelho = Math.min(115, a * 1.1); return P; },
    gonio: { vista: ['lat'], centro: (L, A) => em(A, 'Femur.r', L['HJC.r']), fixo: (L, A) => dir(A, 'Pelve', [0, -1, 0]), movel: eixoFemur, ref: 'linha longitudinal do tronco', normal: (L, A) => dir(A, 'Pelve', [1, 0, 0]) },
    fixos: ['Pelve'], moveis: ['Femur.r', 'Perna.r', 'Pe.r', 'Patela.r'], vista: 'lat', foco: { alvo: [0, 0.95, 0.2], altura: 1.3 },
  },
  {
    id: 'quaAbd', grupo: 'quadril', aula: 'quaAbd', max: 45, chaves: [0, 20, 45], decubito: 'dorsal',
    eixo: 'Anteroposterior, pelo centro da cabeça do fêmur', estruturas: 'Coxofemoral (glúteos médio e mínimo, tensor da fáscia lata).',
    mecanismo: 'Decúbito dorsal; abdução em torno do eixo anteroposterior. Opção de compensação: a pelve inclina no fim do arco (o que a mão na espinha ilíaca anterossuperior percebe).',
    limitacoes: 'A compensação pélvica é ILUSTRATIVA (início e magnitude sem fonte quantitativa).',
    postura: (a, sit) => { const P = P0(); P.decubito = 'dorsal'; P.r.quadril.abd = a; if (sit === 'comp') { const c = Math.max(0, a - 35) * 1.2; P.pelve.obliquidade = -c; P.r.quadril.abd = a - c * 0.5; P.l.quadril.abd = -c; } return P; },
    gonio: { vista: ['ant'], centro: (L, A) => em(A, 'Femur.r', L['HJC.r']), fixo: (L, A) => dir(A, 'Pelve', [0, -1, 0]), movel: eixoFemur, ref: 'linha longitudinal do tronco (perpendicular à linha entre as espinhas ilíacas)', normal: (L, A) => dir(A, 'Pelve', [0, 0, 1]) },
    fixos: ['Pelve'], moveis: ['Femur.r', 'Perna.r', 'Pe.r', 'Patela.r'], vista: 'ant', foco: { alvo: [0, 0.85, 0.25], altura: 1.3 },
    situacoes: { normal: { max: 45 }, comp: { max: 45, ilustrativa: true } },
  },
  {
    id: 'quaAdu', grupo: 'quadril', aula: 'quaAdu', max: 20, chaves: [0, 10, 20], decubito: 'dorsal',
    eixo: 'Anteroposterior, pelo centro da cabeça do fêmur', estruturas: 'Coxofemoral (adutores).',
    mecanismo: 'Decúbito dorsal; leve flexão (10°) para a perna passar sobre a outra, e adução em torno do eixo anteroposterior.',
    limitacoes: 'Sem detecção de colisão entre as pernas.',
    postura: (a) => { const P = P0(); P.decubito = 'dorsal'; P.r.quadril.flex = 10 * Math.min(1, a / 5); P.r.quadril.abd = -a; return P; },
    gonio: { vista: ['ant'], centro: (L, A) => em(A, 'Femur.r', L['HJC.r']), fixo: (L, A) => dir(A, 'Pelve', [0, -1, 0]), movel: eixoFemur, ref: 'linha longitudinal do tronco', normal: (L, A) => dir(A, 'Pelve', [0, 0, 1]) },
    fixos: ['Pelve'], moveis: ['Femur.r', 'Perna.r', 'Pe.r', 'Patela.r'], vista: 'ant', foco: { alvo: [0, 0.85, 0.25], altura: 1.3 },
  },
  {
    id: 'joeFlex', grupo: 'joelho', aula: 'joeFlex', max: 130, chaves: [0, 45, 90, 130],
    eixo: 'Laterolateral, pelos epicôndilos do fêmur', estruturas: 'Femorotibial e femoropatelar (isquiotibiais; extensão pelo quadríceps).',
    mecanismo: 'De pé, apoio no membro oposto; a tíbia gira em torno do eixo epicondilar e a patela acompanha 70% do ângulo, contornando os côndilos.',
    limitacoes: 'Dobradiça simples: o rolamento e o deslizamento dos côndilos e a rotação terminal da tíbia não estão modelados. Trajeto da patela aproximado.',
    postura: (a) => { const P = P0(); P.r.joelho = a; return P; },
    gonio: { vista: ['lat'], centro: (L, A, ref) => em(A, 'Perna.r', ref.KJC), fixo: eixoFemur, movel: eixoPerna, ref: 'eixo do fêmur (extensão completa = 0°)', normal: (L, A, ref) => dir(A, 'Femur.r', ref.eixoJoelho) },
    fixos: ['Femur.r'], moveis: ['Perna.r', 'Pe.r', 'Patela.r'], vista: 'lat', foco: { alvo: [0, 0.5, -0.1], altura: 1.1 },
  },
  {
    id: 'colFlex', grupo: 'coluna', aula: 'colFlex', max: 90, chaves: [0, 30, 60, 90],
    eixo: 'Laterolateral, em cada disco lombar e no eixo entre os quadris', estruturas: 'Coluna lombar (discos e articulações facetárias) e coxofemorais.',
    mecanismo: 'Inclinação do tronco distribuída: metade pela coluna lombar (dividida igualmente entre os cinco níveis) e metade pela pelve sobre os quadris. Os braços pendem pela gravidade.',
    limitacoes: 'A divisão 50% lombar e 50% pelve e a distribuição igual entre os níveis são ILUSTRATIVAS (o ritmo lombopélvico varia ao longo do movimento). Coluna torácica não participa.',
    postura: (a) => { const P = P0(); P.coluna.flexLombar = a * 0.5; P.pelve.anteversao = a * 0.5; P.r.quadril.flex = P.l.quadril.flex = a * 0.5; P.r.ombro.elev = P.l.ombro.elev = a; P.r.ombro.plano = P.l.ombro.plano = 90; P.r.ombro.cintura = P.l.ombro.cintura = { estabilizada: 0.6 }; return P; },
    gonio: null, medida: (L, A, ref) => v.ang(dir(A, 'Torax', ref.Y), ref.Y),
    fixos: ['Pelve'], moveis: ['L1', 'L2', 'L3', 'L4', 'L5', 'Torax'], vista: 'lat', foco: { alvo: [0, 1.0, 0.2], altura: 1.9 },
  },
];

/** Completa com os dados da aula (nome, plano, amplitude, fonte, instrução, nota). */
for (const mv of MOVIMENTOS) {
  const a = mv.aula ? aula[mv.aula] : null;
  if (a) Object.assign(mv, { nome: a.nome, plano: a.plano, val: a.val, fonte: a.fonte, instr: a.instr, nota: a.nota || '' });
}
export const porId = Object.fromEntries(MOVIMENTOS.map((x) => [x.id, x]));

/** Ângulo "do modelo" (3D) entre os braços do goniômetro e leitura projetada numa vista (normal n). */
export function medidas(mv, L, A, ref, nVista) {
  if (!mv.gonio) return { modelo: mv.medida ? mv.medida(L, A, ref) : null, projetado: null };
  const f = mv.gonio.fixo(L, A, ref), mo = mv.gonio.movel(L, A, ref);
  let modelo = v.ang(f, mo);
  if (mv.gonio.normal) { // ângulo no plano do movimento (exclui componentes fora do plano, como o ângulo de carregamento)
    const nn = v.norm(mv.gonio.normal(L, A, ref)), pr = (d) => v.sub(d, v.mul(nn, v.dot(d, nn)));
    modelo = v.ang(pr(f), pr(mo));
  }
  let projetado = null;
  if (nVista) {
    const pr = (d) => v.sub(d, v.mul(nVista, v.dot(d, nVista)));
    const fp = pr(f), mp = pr(mo);
    if (v.len(fp) > 1e-3 && v.len(mp) > 1e-3) projetado = v.ang(fp, mp);
  }
  return { modelo, projetado, centro: mv.gonio.centro(L, A, ref), fixo: f, movel: mo };
}
/**
 * Calibração da posição neutra: mede, com o próprio goniômetro de cada movimento, quanto a postura de repouso
 * do modelo se afasta de 0° e guarda o desvio (com sinal) em ref.neutro; pose() desconta esse desvio.
 */
export function calibrarNeutro(L, ref, poseFn) {
  ref.neutro = {};
  const alvo = [['cotovelo', 'cotFlex'], ['antebraco', 'sup'], ['punhoFlex', 'punFlex'], ['punhoDesvio', 'desRad'], ['rotAxial', 'ombroRE'], ['quadrilFlex', 'quaFlex'], ['quadrilAbd', 'quaAbd'], ['joelho', 'joeFlex']];
  const med = (mv, a) => medidas(mv, L, poseFn(L, ref, mv.postura(a)).A, ref).modelo;
  for (let it = 0; it < 4; it++) for (const [k, id] of alvo) {
    const mv = porId[id], m0 = med(mv, 0), m5 = med(mv, 5);
    ref.neutro[k] = (ref.neutro[k] || 0) + (m5 > m0 ? m0 : -m0);
  }
  return ref.neutro;
}
export { clamp };
