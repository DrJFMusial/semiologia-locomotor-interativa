const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
let h=fs.readFileSync(path.join(root,'integracao-3d/dist/index.html'),'utf8');
h=h.replace('</ol>\r\n    <div class="cred">','    <li>Ludewig PM, Phadke V, Braman JP, Hassett DR, Cieminski CJ, LaPrade RF. Motion of the shoulder complex during multiplanar humeral elevation. J Bone Joint Surg Am. 2009;91(2):378-389. doi:10.2106/JBJS.G.01483.</li><li>Wu G, van der Helm FCT, Veeger HEJ, Makhsous M, Van Roy P, Anglin C, et al. ISB recommendation on definitions of joint coordinate systems of various joints for the reporting of human joint motion. Part II: shoulder, elbow, wrist and hand. J Biomech. 2005;38(5):981-992. doi:10.1016/j.jbiomech.2004.05.042.</li></ol>\n    <div class="cred">');
h=h.replace('<meta name="application-version" content="1.6.1">','<meta name="application-version" content="1.8.1">');
h=h.replace('<!-- loc3d: integração 3D experimental (não publicada) -->','<!-- loc3d: integração 3D v1.8.1 -->');
const old='Ilustrações fotográficas geradas com auxílio de inteligência artificial a partir de descrições preparadas para esta aula; não reproduzem figuras dos livros. Manequins, esquemas e simuladores desenhados para esta aula. As animações de marcha, movimento e força são esquemáticas: mostram o padrão, não medem.';
const cred='Ilustrações fotográficas produzidas com auxílio de inteligência artificial. Esquemas e simuladores preparados para esta aula; movimentos e volumes ilustrativos não constituem medidas clínicas.';
if(!h.includes(old))throw Error('Créditos de base não encontrados');h=h.replace(old,cred+'<br><br>Modelos e contornos anatômicos: <a href="https://github.com/LluisV/Z-Anatomy" target="_blank" rel="noopener noreferrer">Z-Anatomy</a>, CC BY-SA 4.0, derivados de BodyParts3D, The Database Center for Life Science, CC BY-SA 2.1 Japan. Adaptações: recorte, simplificação, compressão, projeção 2D e animação didática. As malhas e os contornos derivados mantêm a licença CC BY-SA 4.0. <a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener noreferrer">Créditos e licenças</a>.');
const rights='Componentes, bibliotecas, imagens e outros materiais de terceiros permanecem sujeitos às respectivas licenças e condições de utilização.';
h=h.replace(rights,rights+' Modelos e contornos derivados do Z-Anatomy (sobre BodyParts3D) são disponibilizados sob <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>; essa licença permite reutilização com atribuição e compartilhamento pela mesma licença. As restrições sobre os elementos originais da aula não restringem esses materiais.');
// O aviso detalhado também fica embutido, para consulta sem internet.
h=h.replace('<a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener noreferrer">Créditos e licenças</a>.','Three.js: licença MIT. Licenças de terceiros preservadas nos arquivos do projeto.');
const css=fs.readFileSync(path.join(root,'scripts/publicacao.css'),'utf8');
const fim=h.lastIndexOf('</body>');
if(fim<0)throw Error('Fechamento do documento não encontrado');
h=h.slice(0,fim)+'<style id="acabamentos-publicacao-181">'+css+'</style>\n'+h.slice(fim);
for(const dir of ['dist','dist-offline']){fs.mkdirSync(path.join(root,dir),{recursive:true});fs.writeFileSync(path.join(root,dir,'index.html'),h)}
fs.writeFileSync(path.join(root,'index.html'),h);
console.log('Aula 1.8.1 web e offline: '+Buffer.byteLength(h)+' bytes');

