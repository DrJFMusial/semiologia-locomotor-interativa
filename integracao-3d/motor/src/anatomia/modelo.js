/**
 * MODELO ANATÔMICO: carrega malhas (Z-Anatomy, CC BY-SA 4.0) e marcos. Não sabe nada de movimento.
 * ossos.m.glb: um nó por segmento (nomes em SEGMENTOS); pele.m.glb: pele com classe de região na cor;
 * examinador.m.glb: mãos e antebraços (pele) usados como mãos do examinador; marcos.json: marcos calculados.
 */
import { PropertyBinding } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { SEGMENTOS } from '../cinematica/pose.js';
import ossosUrl from '../modelos/ossos.m.glb?url';
import peleUrl from '../modelos/pele.m.glb?url';
import exUrl from '../modelos/examinador.m.glb?url';
import marcos from '../modelos/marcos.json';

export async function carregarModelo() {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const [ossos, pele, ex] = await Promise.all([ossosUrl, peleUrl, exUrl].map((u) => loader.loadAsync(u)));
  for (const g of [ossos, pele, ex]) g.scene.updateMatrixWorld(true);
  const limpo = (s) => PropertyBinding.sanitizeNodeName(s);
  const porNome = Object.fromEntries(SEGMENTOS.map((s) => [limpo(s), s]));
  const segmentos = {};
  ossos.scene.traverse((o) => {
    if (!o.isMesh) return; let p = o; while (p && !porNome[p.name]) p = p.parent; if (!p) return;
    (segmentos[porNome[p.name]] ||= []).push(o);
  });
  const faltando = SEGMENTOS.filter((s) => !segmentos[s]);
  if (faltando.length) throw new Error('Segmentos ausentes: ' + faltando.join(', '));
  let malhaPele = null; pele.scene.traverse((o) => { if (o.isMesh && !malhaPele) malhaPele = o; });
  const examinador = {};
  ex.scene.traverse((o) => { if (!o.isMesh) return; let p = o; while (p && !/MaoExaminador/.test(p.name)) p = p.parent; if (p) examinador[/l$/.test(p.name) ? 'l' : 'r'] = o; });
  return { segmentos, pele: malhaPele, examinador, marcos };
}
