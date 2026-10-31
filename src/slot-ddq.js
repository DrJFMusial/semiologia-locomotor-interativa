/* L4. Só incorporar uma sequência completa com os três nomes aprovados. */
(()=>{
 const keys=['om50_ortolani_inicio.png','om51_ortolani_abducao.png','om52_barlow_aducao.png'];
 const captions=[
  'Posição de partida: quadril e joelho a 90°, um lado por vez, a outra mão estabiliza a pelve.',
  'Ortolani: abdução suave com elevação do trocanter maior; ressalto de entrada indica quadril luxado e redutível.',
  'Barlow: adução suave, sem força dirigida para trás; ressalto de saída indica quadril luxável.'
 ];
 let tries=0;const timer=setInterval(()=>{
  const dd=document.querySelector('[data-component="ddq"]');
  if(!dd?.querySelector('.an-rng')){if(++tries>400)clearInterval(timer);return}
  clearInterval(timer);
  if(!keys.every(k=>window.__img?.[k]))return;
  const figure=document.createElement('figure');figure.className='cc-ddq-sequencia';
  const im=document.createElement('img'),cap=document.createElement('figcaption');figure.append(im,cap);dd.querySelector('.ddq-anim').before(figure);
  const sync=()=>{const mode=dd.querySelector('.ddq-modos [aria-pressed="true"]')?.dataset.k,t=Number(dd.querySelector('.an-rng')?.value||0)/1000;
   const i=mode==='barlow'?(t<.12?0:t<.62?2:t<.66?0:1):(t<.25?0:1);
   if(figure.dataset.fase===String(i))return;figure.dataset.fase=String(i);im.src=window.__img[keys[i]];im.alt=captions[i];cap.textContent=captions[i];};
  new MutationObserver(sync).observe(dd.querySelector('.ddq-anim'),{subtree:true,childList:true});dd.querySelector('.ddq-modos').addEventListener('click',sync);sync();
 },25);
})();
