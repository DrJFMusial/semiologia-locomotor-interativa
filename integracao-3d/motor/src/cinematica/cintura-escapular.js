/**
 * Cintura escapular: orientação da clavícula e da escápula em relação ao tórax durante a elevação do úmero.
 * Convenções ISB (Wu et al., J Biomech 2005;38:981-992), sequência Y-X-Z:
 *   clavícula: retração, elevação, rotação posterior; escápula: rotação interna, rotação superior, inclinação posterior.
 *
 * Origem de cada valor (campo TIPO): 'medido' | 'interpolado' | 'aproximado' | 'extrapolado' | 'ilustrativo'.
 */
import { clamp, lerp } from '../nucleo/mat.js';

/**
 * Ludewig PM et al. J Bone Joint Surg Am. 2009;91(2):378-389. doi:10.2106/JBJS.G.01483.
 * 0°: Tabela I (braço ao lado do corpo). 30° e 120°: valores "inicial" e "final" do texto de Resultados
 * (médias dos três planos), interpretados como 30° e 120° de elevação umerotorácica.
 * 180°: sem dado; extrapolação didática (rotação superior escapular total de cerca de 60°).
 */
export const LUDEWIG = {
  nos: [0, 30, 120, 180],
  tipo: ['medido', 'medido (interpretação)', 'medido (interpretação)', 'extrapolado'],
  clavRetracao: [19.2, 23, 39, 44],
  clavElevacao: [5.9, 11, 17, 19],
  clavRotPosterior: [0.1, 0, 31, 38],
  escRotInterna: [41.1, 37, 35, 34],
  escRotSuperior: [5.4, 11, 50, 65.4],
  escInclPosterior: [-13.5, -13, 8, 15],
};
/**
 * Diferenças entre planos relatadas no texto do mesmo artigo (sem tabela por ângulo):
 *  clavícula: mais retraída na abdução e menos na flexão (diferença máxima de 15° entre as duas, na faixa média);
 *             mais elevada na abdução (4° a mais que na flexão; 2,5° a mais que no plano escapular);
 *  escápula: mais rodada internamente na flexão (+7° em relação ao plano escapular) e menos na abdução (−7,5°);
 *            rotação superior 3° maior na abdução a 90° e 120°.
 * Aplicadas como deslocamentos aproximados, crescendo até 60° de elevação (TIPO 'aproximado').
 */
export const AJUSTE_PLANO = {
  abducao: { clavRetracao: 7.5, clavElevacao: 2.5, escRotInterna: -7.5, escRotSuperiorAlto: 3 },
  flexao: { clavRetracao: -7.5, clavElevacao: -1.5, escRotInterna: 7, escRotSuperiorAlto: 0 },
};
export const CHAVES = ['clavRetracao', 'clavElevacao', 'clavRotPosterior', 'escRotInterna', 'escRotSuperior', 'escInclPosterior'];

const interp = (nos, val, x) => {
  if (x <= nos[0]) return val[0];
  for (let i = 1; i < nos.length; i++) if (x <= nos[i]) return lerp(val[i - 1], val[i], (x - nos[i - 1]) / (nos[i] - nos[i - 1]));
  return val[val.length - 1];
};

/**
 * Ângulos absolutos (graus) para elevação umerotorácica beta no plano alfa
 * (alfa 0 = abdução coronal; 90 = flexão sagital; negativo = extensão).
 * opcoes: { estabilizada: 0..1 (fração da escápula bloqueada pelo examinador), extra: {chave: graus} (compensações ilustrativas) }
 */
export function anguloCintura(beta, alfa = 0, opcoes = {}) {
  const a = {};
  if (alfa >= 0) {
    for (const k of CHAVES) a[k] = interp(LUDEWIG.nos, LUDEWIG[k], beta);
    const s = clamp(alfa / 90), kz = clamp(beta / 60), alto = clamp((beta - 60) / 30);
    const A = AJUSTE_PLANO.abducao, F = AJUSTE_PLANO.flexao;
    a.clavRetracao += lerp(A.clavRetracao, F.clavRetracao, s) * kz;
    a.clavElevacao += lerp(A.clavElevacao, F.clavElevacao, s) * kz;
    a.escRotInterna += lerp(A.escRotInterna, F.escRotInterna, s) * kz;
    a.escRotSuperior += lerp(A.escRotSuperiorAlto, F.escRotSuperiorAlto, s) * alto;
  } else {
    // extensão (até 60°): sem dado no estudo de referência; inclinação anterior e leve rotação inferior ILUSTRATIVAS
    for (const k of CHAVES) a[k] = LUDEWIG[k][0];
    const f = clamp(beta / 60);
    a.escInclPosterior -= 10 * f; a.escRotSuperior -= 4 * f; a.clavRetracao += 4 * f;
  }
  if (opcoes.estabilizada) {
    const z = anguloCintura(0, 0);
    for (const k of CHAVES) a[k] = lerp(a[k], z[k], opcoes.estabilizada);
  }
  if (opcoes.extra) for (const [k, d] of Object.entries(opcoes.extra)) a[k] += d;
  return a;
}

export function tipoValor(beta, alfa) {
  if (alfa < 0) return 'ilustrativo';
  if (beta > 120) return 'extrapolado';
  return alfa === 0 || alfa === 90 ? 'medido + ajuste de plano aproximado' : 'medido + interpolação entre planos';
}
