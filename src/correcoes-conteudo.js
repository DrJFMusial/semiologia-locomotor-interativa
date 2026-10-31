/* L1. Uma entrada, uma imagem e uma sequência de mão fechada sobre o polegar. */
const __ccFinkelstein = bo.mao.testes.find(t => t.cena === 'finkelstein');
Object.assign(__ccFinkelstein, {
  n: 'Teste de Finkelstein',
  foto: {f:'aj-finkelstein.png', alt:'Polegar fletido e aduzido dentro da mão fechada; punho neutro e em desvio ulnar'},
  cap: 'Mão fechada sobre o polegar, seguida de desvio ulnar do punho.',
  fin: 'Provocar os tendões do primeiro compartimento dorsal.',
  tec: 'O paciente fecha a mão sobre o polegar fletido e aduzido; o punho é desviado para o lado ulnar.',
  pos: 'Dor sobre o processo estiloide do rádio, no trajeto do abdutor longo e do extensor curto do polegar (1º compartimento dorsal).',
  sug: 'Tenossinovite estenosante de De Quervain.',
  obs: 'Também chamada manobra de Eichhoff.',
  numT: 'Fonte', num: 'Bates 13ª ed., fig. 23.48; Exame Físico em Ortopedia, fig. 8.18.'
});
bo.mao.testes = bo.mao.testes.filter(t => t.cena !== 'eichhoff');
Go.finkelstein = {...Go.eichhoff, lab:'Teste de Finkelstein: mão fechada sobre o polegar e desvio ulnar'};

/* L2/L3. Retirar apenas as fotos reprovadas; o renderizador usa so-esq. */
for (const t of [...bo.joelho.testes, ...bo.mao.testes]) {
  if (['mcmurray', 'valgo', 'durkan'].includes(t.cena)) { delete t.foto; delete t.cap; }
}

/* X1. Capas com os mesmos campos. O único encontro confirmado é o 15º. */
const __ccCover = document.querySelector('.s-capa .capa-text');
if (__ccCover) {
  const h = __ccCover.querySelector('h1'), sub = __ccCover.querySelector('.capa-sub');
  const e = document.createElement('p'); e.className='eyebrow';e.textContent='Curso de Medicina · 2026';
  const meeting=document.createElement('p');meeting.className='capa-encontro';meeting.textContent='E2M08 · Semiologia · 15º encontro';
  const author=document.createElement('div');author.className='capa-author';author.innerHTML='<p class="who">Prof. Dr. João Frederico Musial</p><p>Médico, Farmacêutico e Mestre</p>';
  __ccCover.replaceChildren(e,meeting,h,author,sub);
}
