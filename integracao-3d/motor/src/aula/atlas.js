/**
 * ATLAS REGIONAL 3D (ombro, punho, joelho): malhas do Z-Anatomy recortadas por scripts/atlas_regioes.py.
 * Cada nó se chama <categoria>__<chave>. As regiões ficam longe do corpo, na mesma cena e com a mesma câmera do motor.
 * O joelho também mostra o líquido articular (derrame) em quatro graus, o rechaço da patela e o sinal da onda.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import ombroUrl from '../modelos/atlas_ombro.m.glb?url';
import punhoUrl from '../modelos/atlas_punho.m.glb?url';
import joelhoUrl from '../modelos/atlas_joelho.m.glb?url';

export const POS = { ombro: [20, 0, 0], punho: [30, 0, 0], joelho: [40, 0, 0] };
const COR = {
  osso: ['#efe5d3', 1], musculo: ['#b5524a', 1], tendao: ['#e3cfc0', 1], bainha: ['#5b9bd5', 0.38], nervo: ['#e2b922', 1],
  ligamento: ['#c9d3d8', 0.85], bolsa: ['#4f8fd6', 0.45], capsula: ['#9fb8c8', 0.18], menisco: ['#dfe7ea', 1], gordura: ['#efd27a', 0.55],
};
/** Cor própria de cada músculo do manguito quando destacado (para ligar a cena à imagem do atlas). */
const COR_DESTAQUE = { supra: '#d9534f', infra: '#c46b2d', redondo: '#a8559e', sub: '#3f7fbf', bolsa: '#2f7fd6', arco: '#6b7d89',
  ret: '#7a8f99', mediano: '#f2c200', ulnar: '#f2c200', fds: '#e8b4a0', fdp: '#e8b4a0', fpl: '#e8b4a0', bainha_comum: '#2f7fd6', bainha_fpl: '#2f7fd6', comp1: '#2f7fd6' };
const CONTEXTO_JOELHO = new Set(['quadriceps']);

export async function carregarAtlas(scene) {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const [o, p, j] = await Promise.all([ombroUrl, punhoUrl, joelhoUrl].map((u) => loader.loadAsync(u)));
  const regioes = {};
  for (const [nome, g] of [['ombro', o], ['punho', p], ['joelho', j]]) {
    const raiz = new THREE.Group(); raiz.position.set(...POS[nome]); raiz.visible = false; scene.add(raiz); raiz.add(g.scene);
    const partes = [];
    g.scene.traverse((ob) => {
      if (!ob.isMesh) return;
      let n = ob; while (n && !/__/.test(n.name)) n = n.parent;
      const [cat, chave] = (n?.name || 'osso__x').split('__');
      const [cor, op] = COR[cat] || COR.osso;
      const mat = new THREE.MeshStandardMaterial({ color: cor, roughness: cat === 'nervo' ? 0.45 : 0.6, transparent: op < 1, opacity: op, depthWrite: op >= 1, side: op < 1 ? THREE.DoubleSide : THREE.FrontSide });
      ob.material = mat; ob.renderOrder = op < 1 ? 3 : 1;
      partes.push({ ob, cat, chave: chave.replace(/_\d+$/, ''), mat, cor, op });
    });
    raiz.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(raiz);
    regioes[nome] = { raiz, partes, centro: caixa.getCenter(new THREE.Vector3()), tamanho: caixa.getSize(new THREE.Vector3()) };
  }
  preparaJoelho(regioes.joelho);
  return {
    regioes,
    /** Mostra uma região (ou nenhuma). */
    mostrar(nome) { for (const [k, r] of Object.entries(regioes)) r.raiz.visible = k === nome; },
    /** Destaca as estruturas de uma lista de chaves; as demais partes moles ficam esmaecidas. */
    destacar(nome, chaves = []) {
      const r = regioes[nome]; const sel = new Set(chaves);
      for (const p of r.partes) {
        const on = sel.has(p.chave), mole = p.cat !== 'osso';
        const ctx = nome === 'joelho' && CONTEXTO_JOELHO.has(p.chave);
        p.mat.color.set(on && COR_DESTAQUE[p.chave] ? COR_DESTAQUE[p.chave] : p.cor);
        let op = p.op;
        if (sel.size && mole && !on) op = Math.min(op, p.cat === 'nervo' ? 0.35 : 0.22);
        if (ctx) op = 0.16;
        p.mat.opacity = op; p.mat.transparent = op < 1; p.mat.depthWrite = op >= 1; p.ob.renderOrder = op < 1 ? 3 : 1;
        p.mat.emissive?.set(on ? '#2a1a10' : '#000000');
      }
    },
    /** Pontos de rótulo (centro da caixa de cada chave), em coordenadas do mundo. */
    pontos(nome, chaves) {
      const r = regioes[nome]; const out = {};
      for (const k of chaves) { const b = new THREE.Box3(); for (const p of r.partes) if (p.chave === k) b.expandByObject(p.ob); if (!b.isEmpty()) out[k] = b.getCenter(new THREE.Vector3()).toArray(); }
      return out;
    },
    joelho: (prm) => atualizaJoelho(regioes.joelho, prm),
  };
}

/* ------------------------------------------------------------------ joelho: líquido, patela, onda */
function pivo(ob) {
  // envolve o nó num grupo com o pivô no centro da sua caixa, para escalar e deslocar sem mexer no resto
  const b = new THREE.Box3().setFromObject(ob), c = b.getCenter(new THREE.Vector3());
  const pai = ob.parent, g = new THREE.Group(); pai.add(g); g.position.copy(pai.worldToLocal(c.clone()));
  g.updateMatrixWorld(true); g.attach(ob);
  return { g, caixa: b };
}
function preparaJoelho(r) {
  const parte = (k) => r.partes.find((p) => p.chave === k);
  const pat = parte('patela'), bol = parte('suprapatelar'), fem = parte('femur');
  r.pat = pivo(pat.ob); r.bol = pivo(bol.ob);
  const bf = new THREE.Box3().setFromObject(fem.ob), bp = r.pat.caixa;
  // recessos parapatelares: elipsoides de líquido ao lado da patela (medial: +X no joelho direito; lateral: −X)
  const geo = new THREE.SphereGeometry(1, 28, 18);
  const mat = () => new THREE.MeshStandardMaterial({ color: '#3f86d8', transparent: true, opacity: 0.55, roughness: 0.3, depthWrite: false });
  const pc = bp.getCenter(new THREE.Vector3()), ps = bp.getSize(new THREE.Vector3());
  const rec = (lado) => { const m = new THREE.Mesh(geo, mat()); m.renderOrder = 4; r.raiz.add(m); m.position.copy(r.raiz.worldToLocal(new THREE.Vector3(pc.x + lado * (ps.x * 0.75), pc.y + ps.y * 0.05, pc.z - ps.z * 0.6))); m.userData.base = m.position.clone(); return m; };
  r.recMed = rec(1); r.recLat = rec(-1);
  r.contatoZ = bf.max.z; // face anterior do fêmur (tróclea): a patela "bate" nela no rechaço
  r.patZ0 = r.pat.g.position.z;
  r.bolMat = bol.mat;
}
const ESCALA_BOLSA = [0.35, 0.9, 1.35, 1.9];
const AFASTA_PATELA = [0, 0.002, 0.005, 0.009]; // metros: patela flutuante no derrame moderado e volumoso (ilustrativo)
function atualizaJoelho(r, { grau = 2, rech = 0, ordenha = 1, onda = 0 } = {}) {
  const s = ESCALA_BOLSA[grau];
  r.bol.g.scale.set(1 + (s - 1) * 0.35, 1 + (s - 1) * 0.6, 1 + (s - 1) * 0.9);
  r.bolMat.opacity = grau ? 0.5 : 0.18;
  const afasta = AFASTA_PATELA[grau] * (1 - rech);
  r.pat.g.position.z = r.patZ0 + afasta;
  const vol = [0, 0.011, 0.013, 0.016][grau];
  // ordenha: esvazia o recesso medial (o líquido sobe para a bolsa); onda: o líquido volta e abaula o lado medial
  const med = grau ? vol * Math.max(0.15, Math.max(ordenha, onda)) : 0, lat = grau ? vol * (grau === 3 ? 1.1 : 0.85) : 0;
  for (const [m, v, lado] of [[r.recMed, med, 1], [r.recLat, lat, -1]]) {
    m.visible = v > 0.0005; m.scale.set(v * 0.55, v * 1.6, v * 0.75);
    m.position.copy(m.userData.base); m.position.x += lado * v * 0.2;
  }
  const toque = rech > 0.95 && grau >= 2;
  return { toque, patela: r.pat.g.getWorldPosition(new THREE.Vector3()).toArray() };
}
