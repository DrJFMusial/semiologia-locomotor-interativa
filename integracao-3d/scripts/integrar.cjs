/**
 * Monta a aula experimental com os modelos 3D integrados nas próprias telas.
 * Entrada: ../index.html (aula 1.6.1 publicada e aprovada, sem alteração) e motor/dist-aula/motor3d.js.
 * Saída:   dist/index.html (arquivo único, web e offline).
 * Altera o código compilado só em nove pontos (ganchos), cada um conferido como único, e acrescenta
 * estilo, stub e motor antes de </body>. Confere ao final que, desfeitas as inserções, o arquivo volta
 * a ser idêntico byte a byte ao original.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const raiz = path.resolve(__dirname, '..');
// A base aprovada permanece na história do repositório, separada do HTML integrado.
const {execFileSync}=require('child_process');
const original = process.env.LOCOMOTOR_BASE_HTML ? fs.readFileSync(process.env.LOCOMOTOR_BASE_HTML,'utf8') : execFileSync('git',['show','97641e8ee9dbd192a4a9d853b4727e622fd4910d:index.html'],{cwd:path.join(raiz,'..'),maxBuffer:40*1024*1024,encoding:'utf8'});
const motor = fs.readFileSync(path.join(raiz, 'motor', 'dist-aula', 'motor3d.js'), 'utf8');
const stub = fs.readFileSync(path.join(raiz, 'aula', 'stub.js'), 'utf8');
const css = fs.readFileSync(path.join(raiz, 'aula', 'estilo.css'), 'utf8');
const capaDados = fs.readFileSync(path.join(raiz, 'aula', 'capa-dados.json'), 'utf8');
const capa = fs.readFileSync(path.join(raiz, 'aula', 'capa.js'), 'utf8').replace('__CAPA_DADOS__', capaDados);
const ddq = fs.readFileSync(path.join(raiz, 'aula', 'ddq.js'), 'utf8');
const imagensJs = fs.readFileSync(path.join(raiz, 'aula', 'imagens.js'), 'utf8');
// imagens novas (integracao-3d/imagens/): entram em window.__img com o nome do arquivo, com e sem extensão
const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const pastaImg = path.join(raiz, 'imagens');
const imagens = fs.existsSync(pastaImg) ? fs.readdirSync(pastaImg).filter((f) => MIME[path.extname(f).toLowerCase()]).sort() : [];
const mapaImg = {};
for (const f of imagens) {
  const ext = path.extname(f).toLowerCase(), base = f.slice(0, -ext.length), url = `data:${MIME[ext]};base64,` + fs.readFileSync(path.join(pastaImg, f)).toString('base64');
  for (const k of [base, base + '.png', base + '.webp', f]) mapaImg[k] = url;
}
const scriptImg = `(()=>{const N=${JSON.stringify(mapaImg)};let v;Object.defineProperty(window,'__img',{configurable:true,get(){return v},set(x){v=Object.assign(x||{},N)}});})();`;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const GANCHOS = [
  { nome: 'Movimentos e amplitudes (componente movimentos)',
    de: 'const c=b=>{e.innerHTML=o.fig(b)}',
    para: 'const c=b=>{if(window.__loc3d&&window.__loc3d.mov(s,o,b))return;e.innerHTML=o.fig(b)}' },
  { nome: 'Mobilidade ativa × passiva (componente ombro)',
    de: 'const r=(v,L,y=!0,S=!1)=>{const b=Fe[o][i][L];',
    para: 'const r=(v,L,y=!0,S=!1)=>{window.__loc3d&&window.__loc3d.ombro(s,{th:v,modo:L,arcs:y,fim:S,pac:o,mov:i,d:Fe[o][i][L],crep:Fe[o].crep});const b=Fe[o][i][L];' },
  { nome: 'Testes especiais (reprodutor dos esquemas)',
    de: 'const p=()=>{o.innerHTML=e.cena(d),',
    para: 'const p=()=>{o.innerHTML=e.cena(d),window.__loc3d&&window.__loc3d.cena(s,e,d),' },
  { nome: 'Capa (abdução do ombro)',
    de: '"acima de 90°: a escápula gira sobre o tórax"};a(150)',
    para: '"acima de 90°: a escápula gira sobre o tórax",window.__loc3dCapa&&window.__loc3dCapa(s,r)};a(150)' },
  { nome: 'Força muscular 0 a 5 (cotovelo)',
    de: 'function Wt(s,e){const t=e%4/4,',
    para: 'function Wt(s,e){var __f=document.querySelector(".fc-g");__f&&window.__loc3d&&window.__loc3d.fig(__f.closest("svg").parentNode,"forca",{grau:s,t:e});const t=e%4/4,' },
  { nome: 'Marcha: pelve no apoio simples',
    de: 'const i=l=>{const r=ia[a],A=he(',
    para: 'const i=l=>{window.__loc3d&&window.__loc3d.fig(t.closest("svg").parentNode,"pelve",{caso:a,k:l,pel:ia[a].pel,tr:ia[a].tr});const r=ia[a],A=he(' },
  { nome: 'Marcha: passagem do pé (balanço e contato inicial)',
    de: 'P=()=>{o==="balanco"?c():o==="circ"?m():u()}',
    para: 'P=()=>{window.__loc3d&&window.__loc3d.fig(e.closest("svg").parentNode,"pe",{s:Math.min(l,ot[a].tipo==="caido"?Bn("caido"):1),tipo:ot[a].tipo,vista:o,m:ot[a].tipo==="normal"?"normal":t.dataset.m||"slap"});o==="balanco"?c():o==="circ"?m():u()}' },
  { nome: 'Palpação e derrame (joelho)',
    de: 'function c(){e.innerHTML=A(),t.innerHTML=d();',
    para: 'function c(){e.innerHTML=A(),t.innerHTML=d();window.__loc3d&&window.__loc3d.joelho(s,{grau:o,rech:i,ordenha:n,onda:l});' },
  { nome: 'Anatomia funcional (manguito rotador e túnel do carpo)',
    de: 'const l=(A,d)=>{t.querySelectorAll("[data-k]").forEach(m=>m.classList.toggle("sel",m.dataset.k===d))',
    para: 'const l=(A,d)=>{window.__loc3d&&window.__loc3d.atlas(s,{reg:i,k:d});t.querySelectorAll("[data-k]").forEach(m=>m.classList.toggle("sel",m.dataset.k===d))' },
];
let html = original;
for (const g of GANCHOS) {
  const n = html.split(g.de).length - 1;
  if (n !== 1) throw new Error(`Gancho "${g.nome}": esperado 1 ponto, encontrados ${n}. O HTML de base mudou; revise o gancho.`);
  html = html.replace(g.de, g.para);
}
const motorSeguro = motor.replace(/<\/script/gi, '<\\/script');
const seguro = (t) => t.replace(/<\/script/gi, '<\\/script');
const bloco = `\n<!-- loc3d: integração 3D experimental (não publicada) -->\n<style id="loc3d-estilo">\n${css}</style>\n<script id="loc3d-imagens">${seguro(scriptImg)}</script>\n<script id="loc3d-capa">\n${seguro(capa)}</script>\n<script id="loc3d-ddq">\n${seguro(ddq)}</script>\n<script id="loc3d-slots">\n${seguro(imagensJs)}</script>\n<script id="loc3d-stub">\n${stub}</script>\n<script type="text/plain" id="loc3d-motor">${motorSeguro}</script>\n`;
const fim = html.lastIndexOf('</body>');
html = html.slice(0, fim) + bloco + html.slice(fim);
// conferência: desfazer tudo devolve o original
let volta = html.replace(bloco, '');
for (const g of GANCHOS) volta = volta.replace(g.para, g.de);
if (volta !== original) throw new Error('Conferência falhou: o HTML integrado não se reduz ao original.');
fs.mkdirSync(path.join(raiz, 'dist'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'dist', 'index.html'), html);
const rel = { original: { sha256: sha(original), bytes: Buffer.byteLength(original) }, integrado: { sha256: sha(html), bytes: Buffer.byteLength(html) },
  motor: { sha256: sha(motor), bytes: Buffer.byteLength(motor) }, ganchos: GANCHOS.map((g) => g.nome), imagens, reversivel: true };
fs.writeFileSync(path.join(raiz, 'dist', 'integracao.json'), JSON.stringify(rel, null, 1));
console.log(JSON.stringify(rel, null, 1));
