// Exporta os triângulos dos ossos (repouso) projetados na vista anterior, por segmento, para gerar o traço da capa.
import { readFileSync, writeFileSync } from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { PropertyBinding, Vector3 } from 'three';
import { SEGMENTOS } from '../src/cinematica/pose.js';
const buf = readFileSync(new URL('../src/modelos/ossos.m.glb', import.meta.url));
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
await MeshoptDecoder.ready;
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const g = await new Promise((ok, err) => loader.parse(ab, '', ok, err));
g.scene.updateMatrixWorld(true);
const porNome = Object.fromEntries(SEGMENTOS.map((s) => [PropertyBinding.sanitizeNodeName(s), s]));
const out = {};
g.scene.traverse((o) => {
  if (!o.isMesh) return; let p = o; while (p && !porNome[p.name]) p = p.parent; if (!p) return;
  const s = porNome[p.name], pos = o.geometry.getAttribute('position'), idx = o.geometry.index;
  const v = new Vector3(), P = [];
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); P.push([+v.x.toFixed(5), +v.y.toFixed(5), +v.z.toFixed(5)]); }
  const T = []; const n = idx ? idx.count : pos.count;
  for (let i = 0; i < n; i += 3) T.push(idx ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] : [i, i + 1, i + 2]);
  (out[s] ||= []).push({ P, T });
});
writeFileSync('/tmp/tri.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'segmentos');
