/**
 * RENDERIZADOR 3D (Three.js). Recebe transformações prontas; não calcula movimento.
 * Responsável por câmeras, luzes, materiais, pele deformada por ossos, mãos do examinador, setas e trajetos.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SEGMENTOS } from '../cinematica/pose.js';
import { calcularPesos } from './pesos-pele.js';
import { m as M3, v as V3 } from '../nucleo/mat.js';

const css = (n, d = '#888') => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || d;
export const mat4 = (A) => new THREE.Matrix4().set(A.R[0][0], A.R[0][1], A.R[0][2], A.t[0], A.R[1][0], A.R[1][1], A.R[1][2], A.t[1], A.R[2][0], A.R[2][1], A.R[2][2], A.t[2], 0, 0, 0, 1);

export function criarRenderizador(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.5));
  for (const [x, y, z, i] of [[-1.2, 2.6, 2.4, 1.4], [1.0, 2.4, -2.6, 1.1], [-3, 1.4, 0, 0.5], [2.5, 1.0, 1.5, 0.4]]) {
    const l = new THREE.DirectionalLight(0xffffff, i); l.position.set(x, y, z); scene.add(l);
  }
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 30);
  let controls = null;
  const estado = { alvo: new THREE.Vector3(0, 1.4, 0), altura: 1.4, raiz: new THREE.Matrix3(), vista: 'post' };

  function criarControles() {
    controls?.dispose();
    controls = new OrbitControls(cam, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.12; controls.enablePan = false;
    controls.minZoom = 0.6; controls.maxZoom = 6; controls.target.copy(estado.alvo); controls.update();
    controls.addEventListener('change', () => api.onMudanca?.());
  }
  function redimensionar() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    const a = w / h, H = Math.max(estado.altura, (estado.largura || 0) / a);   // enquadra altura e largura do foco
    cam.left = (-H * a) / 2; cam.right = (H * a) / 2; cam.top = H / 2; cam.bottom = -H / 2; cam.updateProjectionMatrix();
  }
  // direções de câmera no referencial do corpo (antes do decúbito): anterior +Z, direita do paciente −X
  const DIR = { ant: [0, 0, 1], post: [0, 0, -1], lat: [-1, 0, 0], med: [1, 0, 0], sup: [0, 1, 0.0001], obl: [-0.7, 0.45, -0.7], oblAnt: [-0.7, 0.35, 0.7] };
  let anima = null;
  function vista(nome, { alvo, altura, largura, raiz, imediato = false } = {}) {
    estado.vista = nome;
    if (alvo) estado.alvo.set(...alvo);
    if (altura) estado.altura = altura;
    if (largura !== undefined) estado.largura = largura;
    const R = raiz || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const d = V3.norm(M3.app(R, DIR[nome] || DIR.post));
    // "para cima" na tela: vertical do mundo; se a câmera olha na vertical, usa a direção da cabeça do corpo
    const cabeca = M3.app(R, [0, 1, 0]);
    let up = Math.abs(d[1]) > 0.95 ? (Math.abs(cabeca[1]) > 0.5 ? M3.app(R, [0, 0, -1]) : cabeca) : [0, 1, 0];
    const fim = estado.alvo.clone().add(new THREE.Vector3(...d).multiplyScalar(4));
    const trocouUp = !cam.up.equals(new THREE.Vector3(...up));
    cam.up.set(...up);
    redimensionar();
    if (imediato || trocouUp || !controls) { cam.position.copy(fim); cam.zoom = 1; cam.lookAt(estado.alvo); cam.updateProjectionMatrix(); criarControles(); anima = null; return; }
    const ini = cam.position.clone().sub(estado.alvo), z0 = cam.zoom, t0 = performance.now();
    const alvoIni = controls.target.clone();
    anima = (now) => {
      const k = Math.min(1, (now - t0) / 450), e = (1 - Math.cos(Math.PI * k)) / 2;
      const a = ini.clone().normalize(), b = fim.clone().sub(estado.alvo).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(a, b), qa = new THREE.Quaternion().slerp(q, e);
      controls.target.lerpVectors(alvoIni, estado.alvo, e);
      cam.position.copy(ini.clone().applyQuaternion(qa).setLength(4).add(controls.target));
      cam.zoom = z0 + (1 - z0) * e; cam.updateProjectionMatrix(); controls.update();
      if (k >= 1) anima = null;
    };
  }
  const api = {
    renderer, scene, cam, get controls() { return controls; }, redimensionar, vista, estado,
    passo(now) { anima?.(now); controls?.update(); },
    animando: () => !!anima,
    render() { renderer.render(scene, cam); },
    direcaoCamera() { const d = new THREE.Vector3(); cam.getWorldDirection(d); return [d.x, d.y, d.z]; },
    projetar(p) { const w = canvas.clientWidth, h = canvas.clientHeight; const q = new THREE.Vector3(...p).project(cam); return [(q.x + 1) / 2 * w, (1 - q.y) / 2 * h]; },
  };
  vista('post', { imediato: true });
  return api;
}

/** Monta esqueleto, pele, mãos do examinador e mesa. */
export function montarCorpo(scene, modelo, L, ref) {
  const raiz = new THREE.Group(); scene.add(raiz);
  const COR = { osso: '#efe5d3', torax: '#e3dccf', fixo: '#e9c98c', movel: '#b3cde3' };
  const mats = {}, grupos = {};
  for (const s of SEGMENTOS) {
    const g = new THREE.Group(); g.matrixAutoUpdate = false; g.name = 'g_' + s; raiz.add(g); grupos[s] = g;
    mats[s] = new THREE.MeshStandardMaterial({ color: COR.osso, roughness: 0.62 });
    for (const me of modelo.segmentos[s] || []) {
      const mw = me.matrixWorld.clone(); me.removeFromParent(); me.matrix.copy(mw); me.matrixAutoUpdate = false; me.material = mats[s]; g.add(me);
    }
  }
  // ---------- pele ----------
  const src = modelo.pele;
  const P = src.geometry.getAttribute('position'), N = src.geometry.getAttribute('normal'), C = src.geometry.getAttribute('color');
  const n = P.count, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), classe = new Uint8Array(n);
  const vv = new THREE.Vector3(), mw = src.matrixWorld, nm = new THREE.Matrix3().getNormalMatrix(mw);
  for (let i = 0; i < n; i++) {
    vv.fromBufferAttribute(P, i).applyMatrix4(mw); pos.set([vv.x, vv.y, vv.z], i * 3);
    vv.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.set([vv.x, vv.y, vv.z], i * 3);
    classe[i] = C ? Math.round(C.getX(i) * 16) : 0;
  }
  // paciente de bermuda: achata a região genital do modelo (|x| < 7,5 cm, altura do quadril, à frente da pelve)
  const yQ = L['HJC.r'][1];
  for (let i = 0; i < n; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; if (Math.abs(x) < 0.075 && y > yQ - 0.17 && y < yQ + 0.04 && z > 0.07) pos[i * 3 + 2] = 0.07 + (z - 0.07) * 0.15; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  const idx = src.geometry.index.array; geo.setIndex(new THREE.BufferAttribute(idx.slice(), 1));
  const { indices, pesos } = calcularPesos(L, ref, pos, classe, idx);
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(pesos, 4));
  const matPele = new THREE.MeshStandardMaterial({ color: '#e7c7ae', roughness: 0.8, transparent: true, opacity: 0.12, depthWrite: false });
  const pele = new THREE.SkinnedMesh(geo, matPele); pele.frustumCulled = false; pele.renderOrder = 2;
  const bones = SEGMENTOS.map((s) => { const b = new THREE.Bone(); b.matrixAutoUpdate = false; raiz.add(b); return b; });
  pele.bind(new THREE.Skeleton(bones, bones.map(() => new THREE.Matrix4())), new THREE.Matrix4());
  raiz.add(pele);
  // ---------- bermuda: cópia afastada 6 mm das faces da pelve e da raiz da coxa, com os mesmos pesos ----------
  const naBermuda = (i) => { const k = classe[i], y = pos[i * 3 + 1]; return k === 8 || (k === 5 && y > L['HJC.r'][1] - 0.2) || ((k === 9 || k === 0) && y < L['ASIS.r'][1] - 0.01 && y > L['HJC.r'][1] - 0.2); };
  const idxB = []; for (let f = 0; f < idx.length; f += 3) if (naBermuda(idx[f]) && naBermuda(idx[f + 1]) && naBermuda(idx[f + 2])) idxB.push(idx[f], idx[f + 1], idx[f + 2]);
  const posB = new Float32Array(pos); for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) posB[i * 3 + k] += nor[i * 3 + k] * 0.006;
  const geoB = new THREE.BufferGeometry();
  geoB.setAttribute('position', new THREE.BufferAttribute(posB, 3)); geoB.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geoB.setAttribute('skinIndex', geo.getAttribute('skinIndex')); geoB.setAttribute('skinWeight', geo.getAttribute('skinWeight'));
  geoB.setIndex(idxB);
  const matB = new THREE.MeshStandardMaterial({ color: '#46586a', roughness: 0.9, transparent: true, opacity: 0.12, depthWrite: false });
  const bermuda = new THREE.SkinnedMesh(geoB, matB); bermuda.frustumCulled = false; bermuda.renderOrder = 3;
  bermuda.bind(pele.skeleton, new THREE.Matrix4()); raiz.add(bermuda);
  // ---------- mãos do examinador ----------
  const matEx = new THREE.MeshStandardMaterial({ color: '#8a6cc4', roughness: 0.55, transparent: true, opacity: 0.88 });
  const maos = {};
  for (const s of ['r', 'l']) {
    const me = modelo.examinador[s]; const mwx = me.matrixWorld.clone(); me.removeFromParent();
    me.matrix.copy(mwx); me.matrixAutoUpdate = false; me.material = matEx;
    const g = new THREE.Group(); g.matrixAutoUpdate = false; g.add(me); g.visible = false; g.renderOrder = 4; scene.add(g); maos[s] = g;
  }
  const base = {}; // referencial de repouso de cada mão: centro da palma, direção dos dedos, normal da palma (anterior)
  for (const s of ['r', 'l']) base[s] = { c: L['PALMA.' + s], dedos: V3.norm(V3.sub(L['PONTA.' + s], L['PALMA.' + s])), palma: [0, 0, 1] };
  // ---------- mesa (decúbito) ----------
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 2.1), new THREE.MeshStandardMaterial({ color: '#c9d3da', roughness: 0.9 }));
  mesa.visible = false; scene.add(mesa);
  // ---------- setas ----------
  const setas = new THREE.Group(); scene.add(setas);
  const matSeta = new THREE.MeshBasicMaterial({ color: '#6f4bb0', depthTest: false, transparent: true, opacity: 0.95 });
  const corpoSeta = new THREE.CylinderGeometry(0.006, 0.006, 1, 10), pontaSeta = new THREE.ConeGeometry(0.018, 0.04, 14);

  return {
    grupos, pele,
    /** Esconde o corpo inteiro (atlas regional em uso). */
    ocultar(b) { raiz.visible = !b; if (b) { mesa.visible = false; for (const s of ['r', 'l']) maos[s].visible = false; } },
    aplicar(A) {
      SEGMENTOS.forEach((s, i) => { const T = mat4(A[s]); grupos[s].matrix.copy(T); bones[i].matrix.copy(T); });
      raiz.updateMatrixWorld(true);
    },
    destacar(fixos = [], moveis = [], ligado = true) {
      for (const s of SEGMENTOS) {
        const c = !ligado ? (/Torax|CabecaPescoco/.test(s) ? COR.torax : COR.osso) : fixos.includes(s) ? COR.fixo : moveis.includes(s) ? COR.movel : (/Torax|CabecaPescoco/.test(s) ? COR.torax : COR.osso);
        mats[s].color.set(c);
      }
    },
    modo(mod, opacidade) {
      const ext = mod === 'ext';
      for (const s of SEGMENTOS) grupos[s].visible = !ext;
      matPele.opacity = ext ? 1 : opacidade; matPele.transparent = !ext; matPele.depthWrite = ext;
      pele.visible = ext || opacidade > 0.005; matPele.needsUpdate = true;
      matB.opacity = ext ? 1 : Math.min(1, opacidade * 1.5); matB.transparent = !ext; matB.depthWrite = ext; bermuda.visible = pele.visible; matB.needsUpdate = true;
    },
    /** contatos: [{ mao: 'r'|'l', ponto, palma, dedos }] em coordenadas do mundo */
    maos(contatos = []) {
      for (const s of ['r', 'l']) maos[s].visible = false;
      for (const c of contatos) {
        const b = base[c.mao];
        const R = M3.bases(b.dedos, b.palma, V3.norm(c.dedos), V3.norm(c.palma));
        const alvo = V3.sub(c.ponto, V3.mul(V3.norm(c.palma), 0.022));
        const t = V3.sub(alvo, M3.app(R, b.c));
        maos[c.mao].matrix.copy(mat4({ R, t })); maos[c.mao].visible = true; maos[c.mao].updateMatrixWorld(true);
      }
    },
    setas(lista = []) {
      setas.clear();
      for (const s of lista) {
        const d = new THREE.Vector3(...V3.norm(s.dir)), L0 = s.comp || 0.12, o = new THREE.Vector3(...s.origem);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        const corpo = new THREE.Mesh(corpoSeta, matSeta); corpo.scale.set(1, L0, 1); corpo.quaternion.copy(q);
        corpo.position.copy(o.clone().add(d.clone().multiplyScalar(L0 / 2)));
        const ponta = new THREE.Mesh(pontaSeta, matSeta); ponta.quaternion.copy(q); ponta.position.copy(o.clone().add(d.clone().multiplyScalar(L0 + 0.02)));
        corpo.renderOrder = ponta.renderOrder = 7; setas.add(corpo, ponta);
      }
    },
    /** Apoio do corpo: true ou 'dorsal'/'ventral' = mesa de exame; 'sentado' = banqueta; false = nenhum. */
    mesa(tipo) {
      mesa.visible = !!tipo;
      if (!tipo) return;
      if (tipo === 'sentado') { mesa.scale.set(0.62, 1, 0.21); mesa.position.set(0, ref.centroQuadris[1] - 0.105, ref.centroQuadris[2] + 0.12); }
      else { mesa.scale.set(1, 1, 1); mesa.position.set(0, ref.centroQuadris[1] - (tipo === 'ventral' ? 0.125 : 0.155), ref.centroQuadris[2] - 0.05); }
    },
    tema() { matSeta.color.set(css('--exam', '#6f4bb0')); },
  };
}

export function criarTrilha(scene) {
  const geo = new THREE.BufferGeometry();
  const mat = new THREE.LineBasicMaterial({ color: css('--st', '#b77a0c'), depthTest: false, transparent: true, opacity: 0.95 });
  const linha = new THREE.Line(geo, mat); linha.renderOrder = 5; scene.add(linha);
  const ponto = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 12), new THREE.MeshBasicMaterial({ color: css('--st', '#b77a0c'), depthTest: false }));
  ponto.renderOrder = 6; scene.add(ponto);
  return {
    definir(pts, atual, vis) { linha.visible = ponto.visible = !!vis && pts.length > 1; if (!vis) return; geo.setFromPoints(pts.map((p) => new THREE.Vector3(...p))); ponto.position.set(...atual); },
    tema() { mat.color.set(css('--st', '#b77a0c')); ponto.material.color.set(css('--st', '#b77a0c')); },
  };
}
