/**
 * Pesos da pele (deformação linear por ossos). Cada vértice traz a classe da região cutânea de origem
 * (pipeline); a classe decide quais segmentos podem puxá-lo, e a posição ao longo do segmento decide quanto.
 * Depois, os pesos são suavizados entre vértices vizinhos nas zonas de transição (ombro, axila, quadril, tronco).
 * Aproximação visual: sem músculos nem deslizamento da pele.
 *
 * Classes: 0 tronco/cabeça/pescoço · 1 escapular · 2 clavicular · 3 braço · 4 deltóidea · 5 coxa · 6 joelho e perna
 *          7 tornozelo e pé · 8 glútea, quadril e virilha · 9 tronco inferior (lombar e abdome) · 10 antebraço · 11 mão
 */
import { v, sstep, clamp } from '../nucleo/mat.js';
import { SEGMENTOS } from '../cinematica/pose.js';

const IDX = Object.fromEntries(SEGMENTOS.map((s, i) => [s, i]));
function distSeg(p, a, b) {
  const ab = v.sub(b, a), t = clamp(v.dot(v.sub(p, a), ab) / v.dot(ab, ab));
  return v.len(v.sub(p, v.add(a, v.mul(ab, t))));
}
function distTri(p, a, b, c) {
  const n = v.norm(v.cross(v.sub(b, a), v.sub(c, a))), d = v.dot(v.sub(p, a), n), q = v.sub(p, v.mul(n, d));
  const s = (u, w) => v.dot(v.cross(v.sub(w, u), v.sub(q, u)), n);
  const i1 = s(a, b), i2 = s(b, c), i3 = s(c, a);
  return (i1 >= 0 && i2 >= 0 && i3 >= 0) || (i1 <= 0 && i2 <= 0 && i3 <= 0) ? Math.abs(d) : Math.min(distSeg(p, a, b), distSeg(p, b, c), distSeg(p, c, a));
}
const param = (p, a, b) => { const ab = v.sub(b, a); return v.dot(v.sub(p, a), ab) / v.dot(ab, ab); };

export let ITER_AXILA = 80;
export const ajustaAxila = (k) => { ITER_AXILA = k; };
export function calcularPesos(L, ref, pos, classe, indice) {
  const n = pos.length / 3, NS = SEGMENTOS.length;
  const W = new Float32Array(n * NS);
  const EC = ref.EC, PU = ref.PU, KJC = ref.KJC, AJC = ref.AJC;
  const alturas = [['Pelve', L.S1[1]], ['L5', L['CORPO.L5'][1]], ['L4', L['CORPO.L4'][1]], ['L3', L['CORPO.L3'][1]], ['L2', L['CORPO.L2'][1]], ['L1', L['CORPO.L1'][1]], ['Torax', L['CORPO.T12'][1]]];
  const zonaSuave = new Uint8Array(n);
  // axila: faixa em que a pele do braço encosta na parede do tórax (braço pendente). Ali os pesos são difundidos
  // por mais iterações, para que o estiramento na elevação se distribua por vários centímetros, como na pele real.
  const GH = L['GH.r'], axBaixo = v.add(GH, [0, -0.2, 0]);
  const zonaAxila = new Uint8Array(n);
  const y0c = L.C7 ? L.C7[1] : null;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], sd = x < 0 ? 'r' : 'l';
    const p = [x < 0 ? x : -x, pos[i * 3 + 1], pos[i * 3 + 2]];
    const k = classe[i];
    const w = {}; const put = (s, val) => { if (val > 0) w[s] = (w[s] || 0) + val; };
    const lado = (nm) => `${nm}.${sd}`;
    const dS = () => distTri(p, L['AI.r'], L['TS.r'], L['AA.r']);
    if (k === 3) { // braço: úmero → ulna perto do cotovelo
      const u = param(p, L['GH.r'], EC), f = sstep(0.86, 1.02, u);
      put(lado('Ulna'), f); put(lado('Umero'), 1 - f);
      if (u < 0.15) { const g = 0.15 * (1 - Math.max(0, u) / 0.15); put(lado('Escapula'), g); w[lado('Umero')] -= g; zonaSuave[i] = 1; }
    } else if (k === 10) { // antebraço: ulna (proximal) → rádio (distal), distribuindo a torção da pronossupinação
      const u = param(p, EC, PU), r = sstep(0.1, 0.95, u);
      put(lado('Radio'), r); put(lado('Ulna'), 1 - r);
      if (u < 0.06) { const g = 0.4 * (1 - Math.max(0, u) / 0.06); put(lado('Umero'), g); w[lado('Ulna')] -= g; }
    } else if (k === 11) { // mão
      const u = param(p, PU, L['MC3.r']), h = sstep(-0.15, 0.25, u);
      put(lado('Mao'), h); put(lado('Radio'), 1 - h);
    } else if (k === 4) { // deltóidea
      const u = param(p, L['GH.r'], EC), h = clamp(0.35 + 1.6 * u, 0.35, 1);
      put(lado('Umero'), h); put(lado('Escapula'), (1 - h) * 0.7); put(lado('Clavicula'), (1 - h) * 0.3); zonaSuave[i] = 1;
    } else if (k === 1) {
      const s = Math.exp(-Math.max(0, dS() - 0.01) / 0.035); put(lado('Escapula'), s); put('Torax', 1 - s); zonaSuave[i] = 1;
    } else if (k === 2) {
      const c = Math.exp(-Math.max(0, distSeg(p, L['SC.r'], L['AC.r']) - 0.01) / 0.03); put(lado('Clavicula'), c); put('Torax', 1 - c); zonaSuave[i] = 1;
    } else if (k === 5) { // coxa
      const u = param(p, L['HJC.r'], KJC);
      const pe = u < 0.12 ? 0.35 * (1 - Math.max(0, u) / 0.12) : 0;
      const kn = sstep(0.93, 1.06, u);
      put('Pelve', pe); put(lado('Perna'), kn); put(lado('Femur'), 1 - pe - kn); zonaSuave[i] = u < 0.2 ? 1 : 0;
    } else if (k === 6) { // joelho e perna
      const sdist = v.dot(v.sub(p, KJC), v.mul(ref.femurD0, 1));
      const t = sstep(-0.03, 0.04, sdist), a = sstep(-0.05, 0.0, v.dot(v.sub(p, AJC), ref.femurD0));
      put(lado('Femur'), 1 - t); put(lado('Perna'), t * (1 - a)); put(lado('Pe'), t * a);
    } else if (k === 7) {
      put(lado('Pe'), 1);
    } else if (k === 8) { // glútea, quadril, virilha
      const f = sstep(-0.02, 0.11, L['HJC.r'][1] - p[1]);
      put(lado('Femur'), f); put('Pelve', 1 - f); zonaSuave[i] = 1;
    } else { // tronco: distribuição pela altura entre pelve, lombares e tórax; ombro e escápula como na v0.1
      const y = p[1];
      if (k === 9 || y < alturas[alturas.length - 1][1] + 0.03) {
        if (y <= alturas[0][1]) put('Pelve', 1);
        else if (y >= alturas[alturas.length - 1][1]) put('Torax', 1);
        else for (let j = 1; j < alturas.length; j++) if (y <= alturas[j][1]) {
          const s = (y - alturas[j - 1][1]) / (alturas[j][1] - alturas[j - 1][1]); put(alturas[j - 1][0], 1 - s); put(alturas[j][0], s); break;
        }
        zonaSuave[i] = 1;
      } else {
        const lateral = -p[0];
        let ws = 0, wh = 0;
        if (lateral > 0.06 && y < 1.47) {
          ws = 0.5 * Math.exp(-dS() / 0.025);
          wh = lateral > 0.09 && y > L['GH.r'][1] - 0.12 ? 0.2 * Math.exp(-Math.max(0, v.len(v.sub(p, L['GH.r'])) - 0.05) / 0.025) : 0;
          if (ws + wh > 0.02) zonaSuave[i] = 1;
        }
        put(lado('Escapula'), ws); put(lado('Umero'), wh); put('Torax', Math.max(0, 1 - ws - wh));
      }
    }
    if (k === 0 && y0c !== null && p[1] > y0c - 0.03 && -p[0] < 0.11) {   // cabeça e pescoço acompanham o bloco cervical
      const h = sstep(y0c - 0.03, y0c + 0.05, p[1]); for (const kk of Object.keys(w)) w[kk] *= 1 - h; put('CabecaPescoco', h); zonaSuave[i] = 1;
    }
    if ((k === 0 || k === 1 || k === 3 || k === 4) && -p[0] > 0.1 && distSeg(p, GH, axBaixo) < 0.095) { zonaAxila[i] = 1; zonaSuave[i] = 1; }
    for (const [s, val] of Object.entries(w)) W[i * NS + IDX[s]] = Math.max(0, val);
  }
  // costura: vértices que ocupam o mesmo ponto (bordas entre malhas de regiões do atlas) recebem os mesmos pesos,
  // para que a borda não se abra; a vizinhança também atravessa a costura, para a suavização passar de uma região à outra
  const chave = (i) => `${Math.round(pos[i * 3] / 0.0008)},${Math.round(pos[i * 3 + 1] / 0.0008)},${Math.round(pos[i * 3 + 2] / 0.0008)}`;
  const grupoDe = new Int32Array(n), grupos = []; { const mapa = new Map();
    for (let i = 0; i < n; i++) { const k = chave(i); let g = mapa.get(k); if (g === undefined) { g = grupos.length; grupos.push([]); mapa.set(k, g); } grupos[g].push(i); grupoDe[i] = g; } }
  const solda = () => { for (const g of grupos) { if (g.length < 2) continue;
    for (let s = 0; s < NS; s++) { let a = 0; for (const i of g) a += W[i * NS + s]; a /= g.length; for (const i of g) W[i * NS + s] = a; }
    if (g.some((i) => zonaSuave[i])) for (const i of g) zonaSuave[i] = 1;
    if (g.some((i) => zonaAxila[i])) for (const i of g) zonaAxila[i] = 1; } };
  solda();
  // suavização dos pesos nas zonas de transição (média com os vizinhos)
  if (indice) {
    const vizV = Array.from({ length: n }, () => []);
    for (let f = 0; f < indice.length; f += 3) {
      const a = indice[f], b = indice[f + 1], c = indice[f + 2];
      vizV[a].push(b, c); vizV[b].push(a, c); vizV[c].push(a, b);
    }
    const viz = Array.from({ length: n }, (_, i) => { const g = grupos[grupoDe[i]]; return g.length < 2 ? vizV[i] : g.flatMap((j) => vizV[j]); });
    const ativos = (f) => { const a = []; for (let i = 0; i < n; i++) if (f(i) && viz[i].length) a.push(i); return a; };
    const listaSuave = ativos((i) => zonaSuave[i]), listaAxila = ativos((i) => zonaAxila[i]);
    // só os ossos com peso na zona entram na média (os demais continuam zero): mesmo resultado, menos contas
    const ossosDe = (lista) => { const u = new Set(); for (const i of lista) for (const j of [i, ...viz[i]]) for (let s2 = 0; s2 < NS; s2++) if (W[j * NS + s2] > 0) u.add(s2); return [...u]; };
    const ossosSuave = ossosDe(listaSuave), ossosAxila = ossosDe(listaAxila);
    for (let it = 0; it < 6 + ITER_AXILA; it++) {          // média com os vizinhos (Jacobi: lê W, grava em tmp)
      const lista = it < 6 ? listaSuave : listaAxila, ossos = it < 6 ? ossosSuave : ossosAxila, no = ossos.length;
      const tmp = new Float32Array(lista.length * no);
      for (let q = 0; q < lista.length; q++) { const i = lista[q], vz = viz[i], inv = 0.5 / vz.length;
        for (let o = 0; o < no; o++) { const s2 = ossos[o]; let acc = 0; for (let k = 0; k < vz.length; k++) acc += W[vz[k] * NS + s2]; tmp[q * no + o] = 0.5 * W[i * NS + s2] + acc * inv; } }
      for (let q = 0; q < lista.length; q++) { const i = lista[q]; for (let o = 0; o < no; o++) W[i * NS + ossos[o]] = tmp[q * no + o]; }
    }
    solda();
  }
  const indices = new Uint16Array(n * 4), pesos = new Float32Array(n * 4);
  const melhor = new Float32Array(4), qual = new Int32Array(4);
  for (let i = 0; i < n; i++) {
    melhor.fill(0); qual.fill(-1);
    for (let s2 = 0; s2 < NS; s2++) { const val = W[i * NS + s2]; if (val <= melhor[3]) continue;   // 4 maiores pesos
      let q = 3; while (q > 0 && val > melhor[q - 1]) { melhor[q] = melhor[q - 1]; qual[q] = qual[q - 1]; q--; } melhor[q] = val; qual[q] = s2; }
    const soma = melhor[0] + melhor[1] + melhor[2] + melhor[3];
    if (soma <= 0) { indices[i * 4] = IDX.Torax; pesos[i * 4] = 1; continue; }
    for (let q = 0; q < 4; q++) { indices[i * 4 + q] = qual[q] < 0 ? 0 : qual[q]; pesos[i * 4 + q] = melhor[q] / soma; }
  }
  return { indices, pesos };
}
