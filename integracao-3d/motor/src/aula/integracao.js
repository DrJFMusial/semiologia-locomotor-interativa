/**
 * INTEGRAÇÃO 3D NA AULA (experimental, substituição completa dos manequins).
 *
 * Um único motor (um contexto WebGL, um carregamento de modelos, um canvas) serve todas as figuras corporais da aula.
 * Fontes de estado, por ordem de preferência:
 *   1. ganchos no código da aula, chamados a cada quadro que o componente desenha (mov, ombro, cena, fig);
 *   2. leitura do DOM para figuras estáticas (GALS, inspeção estática, cotovelo), observadas por MutationObserver.
 * O esquema 2D original fica oculto (o código permanece no arquivo, como fonte de estado e de texto). Os textos que
 * o esquema escrevia dentro do desenho (fases, legendas) continuam visíveis numa legenda abaixo da cena.
 * O canvas fica com a figura mais visível; as outras mostram a última imagem 3D que tiveram.
 * Sem quadros pedidos e sem figura visível, nada roda.
 */
import { carregarModelo } from '../anatomia/modelo.js';
import { referencias, pose, posturaNeutra } from '../cinematica/pose.js';
import { porId, medidas, calibrarNeutro } from '../cinematica/movimentos.js';
import { conduz, eixoAnt, pontoAntebraco, estabilizaEscapula } from '../cinematica/testes-ombro.js';
import { tipoValor } from '../cinematica/cintura-escapular.js';
import { criarRenderizador, montarCorpo } from '../render/renderizador.js';
import { criarSobreposicao } from '../interface/goniometro.js';
import { v, m, af, clamp } from '../nucleo/mat.js';
import { cenaTeste, FIGURAS } from './cenas.js';
import { Box3, Vector3 } from 'three';
import { carregarAtlas } from './atlas.js';

const reduz = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
const NOMES_VISTA = { ant: 'anterior', post: 'posterior', lat: 'lateral', sup: 'superior' };
const PELE_EXPERIMENTAL = new Set(['ombroAbd', 'ombroFlex', 'quaFlex', 'colFlex']);
const rotuloEscapula = (a, plano) => {
  const t = tipoValor(a, plano);
  if (t === 'ilustrativo') return 'escápula: movimento ilustrativo';
  if (t === 'extrapolado') return 'escápula acima de 120°: extrapolação, sem medida de referência';
  return 'escápula: incrementos medidos (Ludewig, 2009)';
};

/* ------------------------------------------------------------------ motor (um só) */
let M = null, ATLAS = null;
const hosts = new Set();
let dono = null, raf = 0, ultimaMudanca = 0;

function criarMotor(modelo) {
  const wrap = document.createElement('div'); wrap.className = 'l3d-cena';
  wrap.innerHTML = '<canvas class="l3d-cv" aria-hidden="true"></canvas><svg class="l3d-ov" aria-hidden="true"></svg><p class="l3d-tag" hidden></p><p class="l3d-cred">Modelo 3D: Z-Anatomy (CC BY-SA 4.0), sobre BodyParts3D</p>';
  const canvas = wrap.querySelector('canvas');
  const R = criarRenderizador(canvas);
  const L = modelo.marcos, REF = referencias(L); calibrarNeutro(L, REF, pose);
  const CORPO = montarCorpo(R.scene, modelo, L, REF); CORPO.tema();
  const SOB = criarSobreposicao(wrap.querySelector('svg'), canvas, (p) => R.projetar(p));
  R.onMudanca = () => pedir();
  // Redesenhar também cenas estáticas quando o usuário alterna o tema.
  new MutationObserver(() => { for (const st of hosts) st.sujo = true; pedir(); })
    .observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
  new ResizeObserver(() => { R.redimensionar(); pedir(); }).observe(canvas);
  for (const ev of ['click', 'pointerdown', 'dblclick']) wrap.addEventListener(ev, (e) => e.stopPropagation());
  wrap.addEventListener('wheel', (e) => { if (dono?.cameraLivre) { e.stopPropagation(); e.preventDefault(); } }, { passive: false });
  return { R, CORPO, SOB, L, REF, wrap, canvas, tag: wrap.querySelector('.l3d-tag'), ctx: { L, ref: REF, pose: (P) => pose(L, REF, P) } };
}

function pedir() { ultimaMudanca = performance.now(); if (!raf) raf = requestAnimationFrame(laco); }
function laco(now) {
  raf = 0;
  if (!M || !dono || !dono.cont.isConnected) return;
  M.R.passo(now);
  if (dono.item?.animado && dono.repetir) dono.repetir(now); else desenhar(dono);
  if (M.R.animando() || now - ultimaMudanca < 350 || (dono.item?.animado && (visivel.get(dono.cont) ?? 0) > 0.05)) raf = requestAnimationFrame(laco);
}

/* ------------------------------------------------------------------ propriedade do canvas e imagens das demais figuras */
const visivel = new WeakMap();
const io = new IntersectionObserver((es) => { for (const e of es) { visivel.set(e.target, e.isIntersecting ? e.intersectionRatio : 0); if (e.isIntersecting) { const st = porCont.get(e.target); if (st && dono !== st) reagendar(st); } } }, { threshold: [0, 0.2, 0.5, 0.8, 1] });
const porCont = new WeakMap();

function tentarAssumir(st) {
  if (!M) return false;
  if (dono === st && st.palco.contains(M.wrap)) return true;
  const vSt = visivel.get(st.cont) ?? 1;
  const livre = !dono || !dono.cont.isConnected || (visivel.get(dono.cont) ?? 0) < 0.05;
  if (!livre && vSt <= (visivel.get(dono.cont) ?? 0) + 0.15) return false;
  if (dono && dono !== st) congelar(dono);
  ajustarAltura(st);
  dono = st;
  st.foto.hidden = true;
  st.palco.appendChild(M.wrap);
  st.cont.classList.add('l3d-dono');
  st.camera = null;
  M.R.redimensionar();
  return true;
}
/** A figura que perde o canvas guarda a última imagem (a cena e os indicadores) para não ficar vazia. */
function congelar(st) {
  st.cont.classList.remove('l3d-dono');
  if (!st.item || !st.cont.isConnected) return;
  try { desenhar(st); st.foto.src = M.canvas.toDataURL('image/png'); st.foto.hidden = false; st.ovFoto.innerHTML = M.wrap.querySelector('.l3d-ov').innerHTML; st.ovFoto.setAttribute('viewBox', M.wrap.querySelector('.l3d-ov').getAttribute('viewBox') || ''); } catch (e) { /* imagem indisponível */ }
}
function reagendar(st) {
  if (st.retry) return;
  st.retry = setTimeout(() => { st.retry = 0; if (st.cont.isConnected && (visivel.get(st.cont) ?? 0) > 0.2) st.repetir?.(); }, 300);
}

/* ------------------------------------------------------------------ interface de cada figura */
function botao(texto, rotulo, cls = 'chip') {
  const b = document.createElement('button'); b.type = 'button'; b.className = `btn ${cls} l3d-b`; b.textContent = texto;
  b.setAttribute('aria-label', rotulo); b.title = rotulo; return b;
}
const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>',
  restart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4.5 4.5v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const inverso = (s) => Math.acos(1 - 2 * clamp(s)) / (2 * Math.PI) * 3.8;

/**
 * Cria a figura 3D no lugar de um esquema.
 * cont: elemento que recebe a figura; svg: o esquema 2D que deixa de aparecer; antes: onde inserir a cena;
 * reprodutor: controles próprios de tempo (só quando a tela não tem os seus); controles: 'completo' | 'basico' | 'nenhum'.
 */
function registrar(cont, tipo, { reprodutor = false, antes = null, svg = null, controles = 'completo', legenda: comLegenda = false } = {}) {
  const toque = matchMedia('(pointer: coarse)').matches && document.body.classList.contains('modo-estudo');
  const st = { cont, tipo, svg, vista: null, vis: 'anat', gonio: true, destaque: true, camera: null, item: null, sujo: true,
    tocando: !reduz(), vel: 1, tau: 0, angulo: 0, ultimoNow: 0, cameraLivre: !toque && controles !== 'nenhum' };
  cont.classList.add('l3d-host', 'l3d-on');
  if (svg) svg.classList.add('l3d-oculto');
  const palco = document.createElement('div'); palco.className = 'l3d-palco';
  const foto = document.createElement('img'); foto.className = 'l3d-foto'; foto.alt = ''; foto.hidden = true;
  const ovFoto = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ovFoto.setAttribute('class', 'l3d-ov l3d-ovfoto'); ovFoto.setAttribute('aria-hidden', 'true');
  const espera = document.createElement('p'); espera.className = 'l3d-espera'; espera.textContent = 'Modelo 3D';
  palco.append(espera, foto, ovFoto);
  const rot = svg?.getAttribute('aria-label');
  if (rot) { palco.setAttribute('role', 'img'); palco.setAttribute('aria-label', `${rot} (modelo 3D)`); }
  if (tipo === 'fig' && svg) {
    const vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { palco.classList.add('l3d-proporcao'); palco.style.aspectRatio = `${vb[2]} / ${vb[3]}`; }
  }
  const legenda = document.createElement('p'); legenda.className = 'l3d-legenda'; legenda.setAttribute('aria-live', 'polite');
  const barra = document.createElement('div'); barra.className = 'l3d-barra'; barra.setAttribute('role', 'toolbar'); barra.setAttribute('aria-label', 'Controles do modelo 3D');
  const bloco = document.createElement('div'); bloco.className = 'l3d-bloco';
  Object.assign(st, { palco, foto, ovFoto, legenda, barra, bloco, comLegenda });
  if (reprodutor) {
    const bPlay = botao('', 'Pausar o movimento', 'chip an-b'); bPlay.innerHTML = ICON.pause;
    const bRe = botao('', 'Reiniciar o movimento', 'chip an-b'); bRe.innerHTML = ICON.restart;
    const rng = document.createElement('input'); rng.type = 'range'; rng.className = 'l3d-rng'; rng.min = '0'; rng.max = '1000'; rng.value = '0'; rng.setAttribute('aria-label', 'Amplitude: ângulo do movimento');
    const vel = botao('1×', 'Velocidade do movimento: normal', 'chip');
    const marcaPlay = () => { bPlay.innerHTML = st.tocando ? ICON.pause : ICON.play; bPlay.setAttribute('aria-label', st.tocando ? 'Pausar o movimento' : 'Reproduzir o movimento'); bPlay.title = bPlay.getAttribute('aria-label'); };
    bPlay.addEventListener('click', () => { st.tocando = !st.tocando; st.ultimoNow = 0; marcaPlay(); st.sujo = true; pedir(); });
    bRe.addEventListener('click', () => { st.tau = 0; st.ultimoNow = 0; st.tocando = !reduz(); marcaPlay(); st.sujo = true; pedir(); });
    rng.addEventListener('input', () => { st.tocando = false; marcaPlay(); const mx = st.max || 1; st.angulo = (Number(rng.value) / 1000) * mx; st.tau = inverso(st.angulo / mx); st.sujo = true; pedir(); });
    vel.addEventListener('click', () => { st.vel = st.vel === 1 ? 0.5 : 1; vel.textContent = st.vel === 1 ? '1×' : '0,5×'; vel.setAttribute('aria-label', `Velocidade do movimento: ${st.vel === 1 ? 'normal' : 'metade'}`); });
    const g = document.createElement('div'); g.className = 'l3d-g'; g.append(bPlay, bRe, rng, vel); barra.appendChild(g);
    st.rng = rng; st.marcaPlay = marcaPlay; marcaPlay();
  }
  if (controles !== 'nenhum') {
    const gv = document.createElement('div'); gv.className = 'l3d-g'; gv.setAttribute('role', 'group'); gv.setAttribute('aria-label', 'Vista');
    st.bVistas = (controles === 'basico' ? ['ant', 'post', 'lat'] : ['ant', 'post', 'lat', 'sup']).map((k) => { const b = botao(NOMES_VISTA[k][0].toUpperCase() + NOMES_VISTA[k].slice(1), `Vista ${NOMES_VISTA[k]}`, 'seg'); b.dataset.v = k; b.addEventListener('click', () => { st.vista = k; aplicarVista(st, false); }); gv.appendChild(b); return b; });
    barra.appendChild(gv);
    const gc = document.createElement('div'); gc.className = 'l3d-g';
    const bPele = botao('Pele', 'Alternar entre esqueleto e superfície corporal', 'seg'); bPele.setAttribute('aria-pressed', 'false');
    bPele.addEventListener('click', () => { st.vis = st.vis === 'ext' ? 'anat' : 'ext'; bPele.setAttribute('aria-pressed', String(st.vis === 'ext')); st.sujo = true; redesenhar(st); });
    gc.append(bPele); st.bPele = bPele;
    if (controles === 'completo') {
      const bGon = botao('Goniômetro', 'Mostrar ou ocultar o goniômetro', 'seg'); bGon.setAttribute('aria-pressed', 'true');
      bGon.addEventListener('click', () => { st.gonio = !st.gonio; bGon.setAttribute('aria-pressed', String(st.gonio)); redesenhar(st); });
      const bDest = botao('Destaque', 'Destacar o segmento fixo e o móvel', 'seg'); bDest.setAttribute('aria-pressed', 'true');
      bDest.addEventListener('click', () => { st.destaque = !st.destaque; bDest.setAttribute('aria-pressed', String(st.destaque)); redesenhar(st); });
      gc.append(bGon, bDest);
    }
    const bCam = botao('Câmera', 'Girar e aproximar o modelo com o mouse ou o toque', 'seg');
    bCam.addEventListener('click', () => { st.cameraLivre = !st.cameraLivre; aplicarCamera(st); });
    gc.append(bCam); st.bCam = bCam;
    barra.appendChild(gc);
  } else st.bVistas = [];
  bloco.append(palco);
  if (comLegenda) bloco.append(legenda);
  if (barra.children.length) bloco.append(barra);
  if (antes && antes.parentNode) antes.before(bloco); else cont.appendChild(bloco);
  if (svg) ajustarAltura(st);
  for (const h of hosts) if (!h.cont.isConnected) { io.unobserve(h.cont); hosts.delete(h); }
  io.observe(cont); porCont.set(cont, st);
  hosts.add(st);
  return st;
}
/** A cena ocupa a mesma altura que o esquema ocupava (medida uma vez, com o esquema ainda no fluxo da página). */
function ajustarAltura(st) {
  if (st.tipo !== 'fig' || st.alturaOk || !st.svg) return;
  const oculto = st.svg.classList.contains('l3d-oculto');
  st.svg.classList.remove('l3d-oculto'); st.bloco.style.display = 'none';
  const h = st.svg.getBoundingClientRect().height;
  st.bloco.style.display = ''; if (oculto) st.svg.classList.add('l3d-oculto');
  if (h < 120) return;
  const extra = (st.barra.isConnected ? st.barra.getBoundingClientRect().height + 6 : 0) + (st.comLegenda ? 24 : 0);
  st.palco.classList.remove('l3d-proporcao'); st.palco.style.aspectRatio = '';
  st.palco.style.height = `${Math.round(Math.max(220, Math.min(h - extra, innerHeight * 0.7)))}px`; st.palco.style.minHeight = '0';
  st.alturaOk = true;
}
addEventListener('resize', () => { for (const h of hosts) h.alturaOk = false; clearTimeout(ajustarAltura.t); ajustarAltura.t = setTimeout(() => { if (dono) { ajustarAltura(dono); M?.R.redimensionar(); pedir(); } }, 200); });
function redesenhar(st) { st.sujo = true; if (dono === st) pedir(); else st.repetir?.(); }
function aplicarCamera(st) {
  if (!M || dono !== st) return;
  const c = M.R.controls; if (c) c.enabled = st.cameraLivre;
  M.canvas.style.touchAction = st.cameraLivre ? 'none' : 'pan-y';
  st.bCam?.setAttribute('aria-pressed', String(st.cameraLivre));
}
/* ------------------------------------------------------------------ enquadramento automático */
const caixas = {};
/** Os 8 cantos da caixa de um segmento, no referencial de repouso do modelo (calculados uma vez). */
function cantosSegmento(s) {
  if (caixas[s]) return caixas[s];
  const b = new Box3();
  for (const me of M.CORPO.grupos[s]?.children || []) { me.geometry.computeBoundingBox(); b.union(me.geometry.boundingBox.clone().applyMatrix4(me.matrix)); }
  if (b.isEmpty()) return (caixas[s] = []);
  const { min: a, max: z } = b;
  return (caixas[s] = [[a.x, a.y, a.z], [z.x, a.y, a.z], [a.x, z.y, a.z], [z.x, z.y, a.z], [a.x, a.y, z.z], [z.x, a.y, z.z], [a.x, z.y, z.z], [z.x, z.y, z.z]]);
}
const DIRV = { ant: [0, 0, 1], post: [0, 0, -1], lat: [-1, 0, 0], sup: [0, 1, 0.0001], obl: [-0.7, 0.45, -0.7], oblAnt: [-0.7, 0.35, 0.7] };
/** Foco que enquadra, ao longo de todo o movimento, os segmentos em destaque e as mãos do examinador, na vista pedida. */
function focoAuto(it, vista) {
  const amostras = it.amostras(); if (!amostras.length) return null;
  const R0 = amostras[0].raiz.R;
  const d = v.norm(m.app(R0, DIRV[vista] || DIRV.ant)), cab = m.app(R0, [0, 1, 0]);
  const up0 = Math.abs(d[1]) > 0.95 ? (Math.abs(cab[1]) > 0.5 ? m.app(R0, [0, 0, -1]) : cab) : [0, 1, 0];
  const dir = v.norm(v.cross(up0, d)), up = v.cross(d, dir);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, cz = 0, n = 0;
  const soma = (p) => { const x = v.dot(p, dir), y = v.dot(p, up); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); cz += v.dot(p, d); n++; };
  for (const a of amostras) {
    for (const s of it.segsFoco) for (const c of cantosSegmento(s)) soma(af.em(a.A[s], c));
    for (const p of a.pontos) soma(p);
  }
  const mx = 0.06, w = Math.max(0.35, x1 - x0 + 2 * mx), h = Math.max(0.35, y1 - y0 + 2 * mx);
  const c = v.add(v.add(v.mul(dir, (x0 + x1) / 2), v.mul(up, (y0 + y1) / 2)), v.mul(d, cz / n));
  return { centro: c, altura: h, largura: w };
}
function aplicarVista(st, imediato) {
  if (!M || dono !== st || !st.item) return;
  if (st.item.atlas) {
    const r = ATLAS.regioes[st.item.atlas.reg], c = r.centro.toArray(), t = r.tamanho, f = st.item.atlas.zoom || 1.35;
    const lat = st.vista === 'lat';
    M.R.vista(st.vista, { alvo: c, altura: t.y * f, largura: (lat ? t.z : t.x) * f, imediato });
    aplicarCamera(st); st.bVistas.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === st.vista))); st.sujo = true; pedir();
    return;
  }
  const raiz = pose(M.L, M.REF, st.item.postura).raiz;
  const foco = st.item.foco || { alvo: [0, 1.4, 0], altura: 1.5 };
  const fa = st.item.amostras ? focoAuto(st.item, st.vista) : null;
  if (fa) M.R.vista(st.vista, { alvo: fa.centro, altura: fa.altura, largura: fa.largura, raiz: raiz.R, imediato });
  else M.R.vista(st.vista, { alvo: af.em(raiz, foco.alvo), altura: foco.altura, largura: foco.largura ?? foco.altura * 0.95, raiz: raiz.R, imediato });
  aplicarCamera(st);
  st.bVistas.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === st.vista)));
  st.sujo = true; pedir();
}
/** Textos que o esquema 2D escrevia dentro do desenho (fases, legendas): continuam visíveis abaixo da cena. */
function lerLegenda(st) {
  if (!st.svg || !st.comLegenda) return;
  const vistos = new Set(), out = [];
  for (const t of st.svg.querySelectorAll('text')) {
    const x = (t.textContent || '').trim();
    if (!x || vistos.has(x) || /^[−-]?\d+([,.]\d+)?\s*°?$/.test(x) || /unidades do esquema/.test(x) || x.length < 4) continue;
    vistos.add(x); out.push(x);
  }
  const txt = out.join(' · ');
  if (st.legenda.textContent !== txt) st.legenda.textContent = txt;
}

/* ------------------------------------------------------------------ qualidade adaptativa (nunca volta ao manequim) */
let quadros = [], qualidade = 2;
function medir(now) {
  quadros.push(now); if (quadros.length > 40) quadros.shift();
  if (quadros.length < 40 || /[?&]forcar3d\b/.test(location.search)) return;
  const dt = (quadros[39] - quadros[0]) / 39;
  if (dt > 70 && qualidade > 0) {         // menos de cerca de 14 quadros/s: reduz resolução e depois a pele
    qualidade--; quadros = [];
    M.R.renderer.setPixelRatio(qualidade === 1 ? 1 : 0.75); M.R.redimensionar();
    document.documentElement.dataset.l3dQualidade = String(qualidade);
  }
}

/* ------------------------------------------------------------------ desenho */
function desenharAtlas(st) {
  const it = st.item, a = it.atlas, { R, CORPO, SOB } = M;
  CORPO.tema(); CORPO.ocultar(true); CORPO.setas([]); ATLAS.mostrar(a.reg);
  if (st.camera !== it.chave) { st.camera = it.chave; if (!st.vista || it.novaVista) st.vista = it.vista; aplicarVista(st, true); }
  ATLAS.destacar(a.reg, st.destaque ? a.chaves : []);
  const itens = { rotulos: [] };
  if (a.reg === 'joelho') {
    const j = ATLAS.joelho(a.prm), pat = j.patela, setas = [];
    if (a.prm.rech > 0.02) setas.push({ origem: [pat[0], pat[1], pat[2] + 0.075], dir: [0, 0, -1], comp: 0.04 });
    const rm = ATLAS.regioes.joelho.recMed.getWorldPosition(new Vector3()).toArray();
    if (a.prm.ordenha < 0.98 && a.prm.ordenha > 0.02) setas.push({ origem: [rm[0] + 0.012, rm[1] - 0.05, rm[2] + 0.02], dir: [0, 1, 0], comp: 0.05 });
    if (a.prm.onda > 0.02) setas.push({ origem: [rm[0] - 0.09, rm[1], rm[2] + 0.02], dir: [1, 0, 0], comp: 0.05 });
    CORPO.setas(setas);
    const P = ATLAS.pontos('joelho', ['femur', 'tibia', 'suprapatelar']);
    itens.pontos = [{ p: pat, rotulo: 'patela', dx: 14, r: 4 }];
    if (P.femur) itens.pontos.push({ p: [P.femur[0], P.femur[1] + 0.08, P.femur[2]], rotulo: 'fêmur', dx: -14, r: 3 });
    if (P.tibia) itens.pontos.push({ p: [P.tibia[0], P.tibia[1] - 0.06, P.tibia[2]], rotulo: 'tíbia', dx: -14, r: 3 });
    if (P.suprapatelar && a.prm.grau) itens.pontos.push({ p: P.suprapatelar, rotulo: 'bolsa suprapatelar com líquido', dx: 14, r: 4 });
    if (j.toque) itens.dorEm = { p: pat, texto: 'toque!' };
  } else if (a.rotulos) {
    const P = ATLAS.pontos(a.reg, Object.keys(a.rotulos));
    itens.pontos = Object.entries(P).map(([k, p]) => ({ p, rotulo: a.rotulos[k], dx: 14, r: 4 }));
  }
  R.render(); SOB.desenhar(itens);
  M.tag.hidden = !it.tipoDado; M.tag.textContent = it.tipoDado || '';
  st.sujo = false; medir(performance.now());
  window.__loc3dEstado = { tipo: st.tipo, chave: it.chave, vista: st.vista, atlas: a.reg, chaves: a.chaves };
}
function desenhar(st) {
  const it = st.item; if (!it) return;
  if (it.atlas) return desenharAtlas(st);
  const { R, CORPO, SOB, L, REF } = M;
  CORPO.tema(); CORPO.ocultar(false); ATLAS?.mostrar(null);
  if (st.camera !== it.chave) {
    st.camera = it.chave; if (!st.vista || it.novaVista) st.vista = it.vista;
    CORPO.mesa(it.apoio || (it.postura.decubito === 'dorsal' ? 'dorsal' : it.postura.decubito === 'ventral' ? 'ventral' : false));
    aplicarVista(st, true);
  }
  const P = it.postura, { A } = pose(L, REF, P);
  CORPO.aplicar(A);
  CORPO.modo(qualidade === 0 ? 'anat' : st.vis, qualidade === 0 ? 0 : 0.12);
  CORPO.destacar(it.fixos || [], it.moveis || [], st.destaque);
  const itens = { rotulos: [] };
  let maos = [], forcas = [];
  if (it.extra) { const r = it.extra(A, P, M.ctx) || {}; maos = r.maos || []; forcas = r.forcas || []; Object.assign(itens, r.itens || {}); }
  if (st.gonio && it.mv?.gonio) {
    const nVista = R.direcaoCamera();
    const me = medidas(it.mv, L, A, REF, nVista);
    const raiz = pose(L, REF, P).raiz;
    const ok = it.mv.gonio.vista.some((vn) => { const dd = { ant: [0, 0, 1], post: [0, 0, -1], lat: [-1, 0, 0], sup: [0, 1, 0] }[vn]; return dd && Math.abs(v.dot(m.app(raiz.R, dd), nVista)) > 0.97; });
    if (ok) { itens.gonio = { centro: me.centro, fixo: me.fixo, movel: me.movel }; if (it.dor) itens.dor = { faixa: it.dor, valor: it.angulo ?? me.modelo }; }
    else if (!it.semAviso) itens.aviso = `Goniômetro: use a vista ${it.mv.gonio.vista.map((x) => NOMES_VISTA[x]).join(' ou ')}`;
  } else if (st.gonio && it.gonioUmero) {
    const c = af.em(A['Umero.r'], L['GH.r']);
    itens.gonio = { centro: c, fixo: v.mul(m.app(A.Torax.R, REF.Y), -1), movel: v.norm(v.sub(af.em(A['Umero.r'], REF.EC), c)) };
    if (it.dor) itens.dor = { faixa: it.dor, valor: P.r.ombro.elev };
  }
  if (it.dorAgora) itens.dorTexto = af.em(A['Torax'], [L['AC.r'][0], L['AC.r'][1] + 0.12, L['AC.r'][2]]);
  CORPO.maos(maos); CORPO.setas(forcas);
  R.render();
  SOB.desenhar(itens);
  const tags = [];
  if (it.tipoDado) tags.push(it.tipoDado);
  if (st.vis === 'ext' && it.peleExp) tags.push('pele: deformação experimental neste movimento');
  M.tag.hidden = !tags.length; M.tag.textContent = tags.join(' · ');
  lerLegenda(st);
  st.sujo = false;
  medir(performance.now());
  window.__loc3dEstado = { tipo: st.tipo, chave: it.chave, angulo: it.angulo, maos: maos.length, setas: forcas.length, vista: st.vista };
}

/* ------------------------------------------------------------------ itens */
/** Converte a descrição de uma cena (cenas.js) num item do motor. */
function itemDeCena(chave, c) {
  if (!c) return null;
  return { chave, postura: c.P, vista: c.vista, foco: c.foco, apoio: c.apoio, fixos: c.fixos, moveis: c.moveis, mv: c.mv, gonioUmero: c.gonioUmero,
    segsExtra: c.focoSegs, dor: c.dor || c.dorFaixa, dorAgora: c.dorAgora, angulo: c.angulo ?? c.P.r.ombro.elev, tipoDado: c.tag, peleExp: c.peleExp ?? true, extra: c.extra, animado: c.animado, semAviso: true };
}
/** Poses de amostra ao longo da linha do tempo (para o enquadramento); calculadas só quando a câmera muda. */
function amostrasDe(gerar, it) {
  it.segsFoco = [...new Set([...(it.fixos || []), ...(it.moveis || []), ...(it.segsExtra || [])])];
  let cache = null;
  return () => cache || (cache = [0, 0.2, 0.4, 0.6, 0.8, 1].map((tt) => {
    const c = gerar(tt); if (!c) return null;
    const pp = pose(M.L, M.REF, c.P); const r = c.extra ? c.extra(pp.A, c.P, M.ctx) || {} : {};
    return { A: pp.A, raiz: pp.raiz, pontos: (r.maos || []).map((h) => h.ponto) };
  }).filter(Boolean));
}
function itemMovimento(k, a) {
  const mv = porId[k]; if (!mv) return null;
  const P = mv.postura(a, 'normal');
  if (mv.bilateral) { const Pe = mv.postura(a, 'normal'); P.l = Pe.r; }
  const ombro = /^ombro(Abd|Flex|Ext)$/.test(k);
  return { chave: 'mov:' + k, mv, postura: P, vista: mv.vista, foco: mv.foco, fixos: mv.fixos, moveis: mv.moveis, angulo: a,
    peleExp: PELE_EXPERIMENTAL.has(k), tipoDado: ombro ? rotuloEscapula(a, k === 'ombroAbd' ? 0 : k === 'ombroFlex' ? 90 : -90) : '' };
}
function posturaOmbro(o, th) {
  if (o.mov === 'abd') { const P = posturaNeutra(); P.r.ombro.elev = th; return P; }
  return porId.ombroRE.postura(th, 'normal');
}
function itemOmbro(o) {
  const mv = o.mov === 'abd' ? porId.ombroAbd : porId.ombroRE;
  const P = posturaOmbro(o, o.th);
  const passivo = o.arcs && o.modo === 'pa';
  const dor = o.arcs && o.d && o.d.dor && o.d.dor.length ? o.d.dor : null;
  return { chave: 'ombro:' + o.mov, mv, postura: P, vista: o.mov === 'abd' ? 'ant' : 'lat', foco: mv.foco,
    fixos: ['Escapula.r', 'Clavicula.r'], moveis: ['Umero.r', 'Ulna.r', 'Radio.r', 'Mao.r'], angulo: o.th, peleExp: true,
    dor: dor && o.mov === 'abd' ? dor : null, dorAgora: !!dor && o.th >= dor[0] && o.th <= dor[1] + 1,
    tipoDado: o.mov === 'abd' && o.arcs ? rotuloEscapula(o.th, 0) : '',
    extra: passivo ? (A) => {
      const L = M.L, ref = M.REF, A2 = pose(L, ref, posturaOmbro(o, Math.min(o.th + 3, 179))).A;
      const ponto = o.mov === 'abd' ? af.em(A['Ulna.r'], ref.EC) : pontoAntebraco(L, A, ref, 'r', 0.85);
      const ponto2 = o.mov === 'abd' ? af.em(A2['Ulna.r'], ref.EC) : pontoAntebraco(L, A2, ref, 'r', 0.85);
      let dirMov = v.sub(ponto2, ponto); if (v.len(dirMov) < 1e-5) dirMov = m.app(A.Torax.R, ref.Y);
      const eixo = o.mov === 'abd' ? v.norm(v.sub(af.em(A['Ulna.r'], ref.EC), af.em(A['Umero.r'], L['GH.r']))) : eixoAnt(A, ref);
      return { maos: [estabilizaEscapula(L, A, ref, 'r', 'l'), conduz('r', ponto, dirMov, eixo, m.app(A.Torax.R, ref.X))] };
    } : null };
}

/* ------------------------------------------------------------------ atlas: o que cada item da tela destaca */
const ATLAS_DEF = {
  ombro: { padrao: 'supra', itens: {
    supra: { chaves: ['supra'], vista: 'post', rotulos: { supra: 'supraespinal' } },
    infra: { chaves: ['infra'], vista: 'post', rotulos: { infra: 'infraespinal' } },
    redondo: { chaves: ['redondo'], vista: 'post', rotulos: { redondo: 'redondo menor' } },
    sub: { chaves: ['sub'], vista: 'ant', rotulos: { sub: 'subescapular' } },
    bolsa: { chaves: ['bolsa'], vista: 'ant', rotulos: { bolsa: 'bolsa subacromial' } },
    arco: { chaves: ['arco', 'bolsa'], vista: 'ant', rotulos: { arco: 'ligamento coracoacromial' } },
  } },
  punho: { padrao: 'ret', itens: {
    ret: { chaves: ['ret'], vista: 'ant', rotulos: { ret: 'retináculo dos flexores' } },
    mediano: { chaves: ['mediano'], vista: 'ant', rotulos: { mediano: 'nervo mediano' } },
    tend: { chaves: ['fds', 'fdp', 'fpl', 'bainha_comum', 'bainha_fpl'], vista: 'ant', rotulos: { bainha_comum: 'bainha comum dos flexores', bainha_fpl: 'bainha do flexor longo do polegar' } },
    guyon: { chaves: ['ulnar'], vista: 'ant', rotulos: { ulnar: 'nervo ulnar' } },
    comp1: { chaves: ['comp1'], vista: 'lat', rotulos: { comp1: 'bainha do abdutor longo e do extensor curto do polegar' } },
  } },
};

/* ------------------------------------------------------------------ figuras estáticas lidas do DOM */
const ESTATICAS = [
  { sel: 'svg.gl-svg[aria-label^="Manequim em meio passo"]', chave: () => 'galsPasso', params: () => ({}) },
  { sel: 'svg.gl-svg[aria-label^="Manequim de pé"]', chave: () => 'galsPerfil', params: () => ({}) },
  { sel: 'svg.ct-svg[aria-label^="Ângulo de carregamento"]', chave: () => 'carga', params: (svg) => { const p = svg.parentNode.querySelector('.ct-ops [aria-pressed="true"]')?.textContent || 'Normal'; return { ang: /varo/i.test(p) ? 0 : /valgo/i.test(p) ? 26 : 12 }; }, controles: 'basico' },
  { sel: 'svg.ct-svg[aria-label^="Cotovelo direito visto por trás"]', chave: () => 'pontos', params: (svg) => ({ flex: !/extens/i.test(svg.parentNode.querySelector('.ct-ops [aria-pressed="true"]')?.textContent || '') }), controles: 'basico' },
];
let api = null;
function varrer() {
  for (const e of ESTATICAS) for (const svg of document.querySelectorAll(e.sel)) {
    if (svg.__l3d) continue;
    svg.__l3d = true;
    const cont = svg.parentNode;
    const atualizar = () => { if (svg.isConnected) api.fig(cont, e.chave(svg), e.params(svg), { svg, controles: e.controles || 'nenhum' }); };
    new MutationObserver(atualizar).observe(svg, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
    const ops = cont.querySelector('.ct-ops') || svg.closest('[data-component]');
    if (ops) new MutationObserver(atualizar).observe(ops, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
    atualizar();
  }
}

/* ------------------------------------------------------------------ ganchos chamados pela aula */
const estados = new WeakMap();
const LEGENDA = new Set(['capa', 'forca', 'pe', 'contato']);   // figuras cujo texto de fase estava dentro do desenho
function estadoDe(no, criar) {
  let st = estados.get(no);
  if (st && (!st.palco.isConnected || (st.svg && !st.svg.isConnected))) {   // o componente refez o próprio HTML
    if (dono === st) { dono = null; M.wrap.remove(); }
    st.bloco.remove(); io.unobserve(st.cont); hosts.delete(st); st = null;
  }
  if (!st && criar) { st = criar(); estados.set(no, st); }
  return st;
}
function exibir(st, item) {
  if (!st.item || st.item.chave !== item.chave) st.vista = null;
  st.item = item; item.novaVista = !st.vista;
  if (!tentarAssumir(st)) { reagendar(st); return false; }
  desenhar(st);
  return true;
}

export function instalar() {
  return carregarModelo().then(async (modelo) => {
    M = criarMotor(modelo);
    ATLAS = await carregarAtlas(M.R.scene);
    document.documentElement.classList.add('l3d-pronto');
    api = {
      /** Movimentos e amplitudes: s = componente, o = movimento atual da aula, b = ângulo do esquema 2D. */
      mov(s, o, b) {
        const fig = s.querySelector('.mv-fig'); if (!fig || !porId[o.k]) return false;
        const st = estadoDe(s, () => registrar(fig, 'mov', { reprodutor: true, svg: fig.querySelector('.mv-svg') }));
        st.repetir = () => api.mov(s, o, b);
        if (!tentarAssumir(st)) { reagendar(st); return true; }
        const now = performance.now();
        if (st.k !== o.k) { st.k = o.k; st.max = o.max; st.tau = 0; st.ultimoNow = 0; st.tocando = !reduz(); st.marcaPlay(); st.vista = null; }
        if (reduz() && st.tocando) { st.tocando = false; st.marcaPlay(); st.angulo = o.max; st.tau = inverso(1); }
        if (st.tocando) { if (st.ultimoNow) st.tau += ((now - st.ultimoNow) / 1000) * st.vel; st.ultimoNow = now; st.angulo = o.max * (1 - Math.cos((2 * Math.PI * st.tau) / 3.8)) / 2; }
        else st.ultimoNow = 0;
        st.rng.value = String(Math.round((st.angulo / o.max) * 1000));
        const it = itemMovimento(o.k, st.angulo);
        const mudou = !st.item || st.item.chave !== it.chave || Math.abs(st.item.angulo - it.angulo) > 0.05 || st.sujo;
        st.item = it; it.novaVista = !st.vista;
        if (mudou) { M.R.passo(now); desenhar(st); }
        return true;
      },
      /** Mobilidade ativa × passiva. */
      ombro(s, o) {
        const left = s.querySelector('.om-left'); if (!left) return false;
        const st = estadoDe(s, () => registrar(left, 'ombro', { antes: left.querySelector('.om-svg'), svg: left.querySelector('.om-svg') }));
        st.repetir = () => api.ombro(s, o);
        exibir(st, itemOmbro(o));
        return true;
      },
      /** Esquemas animados (testes especiais, cotovelo, Barlow e Ortolani, nervo isquiático): mesma linha do tempo. */
      cena(host, def, t) {
        if (!def || !def.lab || host.closest('.ddq-anim')) return false;   // Ortolani e Barlow: só as fotos (ddq.js)
        const c = cenaTeste(def.lab, t);
        if (!c) { host.querySelector('svg')?.classList.add('l3d-mostrar'); return false; }   // cena sem modelo: o esquema continua (não ocorre na 1.6.1)
        const st = estadoDe(host, () => registrar(host, 'teste', { antes: host.querySelector('.an-bar'), svg: host.querySelector('svg') }));
        st.repetir = () => api.cena(host, def, t);
        const it = itemDeCena('teste:' + c.id, c);
        if (!c.focoFixo) it.amostras = amostrasDe((tt) => cenaTeste(def.lab, tt), it);
        exibir(st, it);
        return true;
      },
      /** Demais figuras: capa, força, marcha (pelve, passagem do pé), GALS, inspeção estática, cotovelo. */
      fig(cont, chave, params, { svg = null, controles = 'basico', antes = null } = {}) {
        if (!cont) return false;
        if (chave === 'pe' && params.vista === 'circ') {      // vista de cima: só trajetórias e pegadas, sem corpo
          const st0 = estados.get(cont); if (st0) { st0.cont.classList.remove('l3d-on'); st0.svg?.classList.remove('l3d-oculto'); st0.item = null; if (dono === st0) { dono = null; M.wrap.remove(); } }
          (svg || cont.querySelector(':scope > svg'))?.classList.add('l3d-mostrar');
          return false;
        }
        if (chave === 'pe' && params.vista === 'contato') { chave = 'contato'; }
        const fn = FIGURAS[chave]; if (!fn) return false;
        const svgEl = svg || cont.querySelector(':scope > svg');
        const c = chave === 'contato' ? null : fn(params);
        const ctl = c?.semControles ? 'nenhum' : controles;
        const st = estadoDe(cont, () => registrar(cont, 'fig', { svg: svgEl, controles: ctl, antes: antes || svgEl, legenda: LEGENDA.has(chave) }));
        st.cont.classList.add('l3d-on', 'l3d-f-' + chave); st.svg?.classList.add('l3d-oculto'); st.svg?.classList.remove('l3d-mostrar');
        if (chave === 'contato') {
          st.repetir = (now = performance.now()) => { const u = ((now / 3200) % 1), c = FIGURAS.contato({ u, modo: params.m }); const it = { ...itemDeCena('fig:contato:' + params.m, c), animado: true }; it.amostras = amostrasDe((tt) => FIGURAS.contato({ u: tt, modo: params.m }), it); exibir(st, it); };
          st.repetir(); pedir(); return true;
        }
        st.repetir = () => api.fig(cont, chave, params, { svg, controles, antes });
        const it = itemDeCena('fig:' + chave + (params.vista ? ':' + params.vista : '') + (c.sub ? ':' + c.sub : ''), c);
        if (c.focoAuto) it.amostras = amostrasDe((tt) => fn(c.focoAuto(tt)), it);
        exibir(st, it);
        return true;
      },
      /** Anatomia funcional: atlas 3D do manguito rotador e do túnel do carpo, ao lado da imagem (ou do esquema). */
      atlas(s, { reg, k }) {
        const fig = s.querySelector('.at2-fig'); if (!fig || !ATLAS) return false;
        const R = { manguito: 'ombro', carpo: 'punho' }[reg]; if (!R) { fig.classList.remove('at2-com3d'); return false; }
        let host = fig.querySelector(':scope > .at2-3d');
        if (!host) { host = document.createElement('div'); host.className = 'at2-3d'; fig.appendChild(host); fig.classList.add('dupla', 'at2-com3d'); }
        const st = estadoDe(host, () => registrar(host, 'atlas', { controles: 'basico' }));
        const DEF = ATLAS_DEF[R], d = DEF.itens[k] || DEF.itens[DEF.padrao];
        st.repetir = () => api.atlas(s, { reg, k });
        const it = { chave: 'atlas:' + R + ':' + d.vista, atlas: { reg: R, chaves: d.chaves, rotulos: d.rotulos }, vista: d.vista, tipoDado: 'Z-Anatomy: malhas reais, recortadas da região', fixos: [], moveis: [] };
        if (st.item?.chave !== it.chave) st.vista = null;
        exibir(st, it);
        return true;
      },
      /** Palpação e derrame: joelho 3D com o líquido em quatro graus, rechaço da patela e sinal da onda. */
      joelho(s, prm) {
        const svg = s.querySelector('.dj-sag')?.closest('svg'); if (!svg || !ATLAS) return false;
        const cont = svg.parentNode;
        const st = estadoDe(cont, () => registrar(cont, 'fig', { svg, controles: 'basico', antes: svg }));
        st.repetir = () => api.joelho(s, prm);
        exibir(st, { chave: 'joelho', atlas: { reg: 'joelho', chaves: prm.grau ? ['suprapatelar'] : [], prm }, vista: 'lat',
          tipoDado: 'líquido articular e afastamento da patela: ilustrativos' });
        return true;
      },
      estado: () => ({ dono: dono?.tipo || null, hosts: hosts.size, qualidade, ...(window.__loc3dEstado || {}) }),
      info: () => ({ ...M.R.renderer.info.render, memoria: M.R.renderer.info.memory }),
    };
    varrer();
    new MutationObserver(() => { clearTimeout(varrer.t); varrer.t = setTimeout(varrer, 120); }).observe(document.body, { childList: true, subtree: true });
    return api;
  });
}
