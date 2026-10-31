const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/\/\* L1\. Uma entrada,[\s\S]*?(?=const lr=\{)/,fs.readFileSync(path.join(root,'src/correcoes-conteudo.js'),'utf8')+'\n');
html=html.replace(/(<script type="module" id="slot-imagens-ddq">)[\s\S]*?(<\/script>)/,(_m,a,b)=>a+fs.readFileSync(path.join(root,'src/slot-ddq.js'),'utf8')+b);
const imgRoot=path.resolve(root,'../../../../IMAGENS_E_CONFERENCIAS/IMAGENS_GERADAS_v5');
const keys=['om50_ortolani_inicio.png','om51_ortolani_abducao.png','om52_barlow_aducao.png'];
// Não usar rascunhos ou nomes aproximados. A sequência é incorporada só se completa.
if(keys.every(k=>fs.existsSync(path.join(imgRoot,k)))){
 const assets=Object.fromEntries(keys.map(k=>[k,'data:image/png;base64,'+fs.readFileSync(path.join(imgRoot,k)).toString('base64')]));
 html=html.replace('const lr={','Object.assign(window.__img,'+JSON.stringify(assets)+');\nconst lr={');
}
for(const dir of ['dist','dist-offline']){fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,'index.html'),html)}
console.log('Locomotor 1.6.1: builds web e offline autocontidos. Sequência neonatal: '+(keys.every(k=>fs.existsSync(path.join(imgRoot,k)))?'incorporada':'esquema animado'));
