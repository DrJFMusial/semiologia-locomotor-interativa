/* Ortolani e Barlow: só a sequência de fotos do recém-nascido (om50, om51, om52), com setas da aula sobre a foto.
   O reprodutor do slide (barra, fases e texto) continua mandando no tempo; o esquema animado deixa de aparecer.
   Coordenadas no referencial das fotos (1536 × 1024). */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const SETAS = {
    0: [],
    // Ortolani: abdução suave da coxa fletida e elevação do trocanter maior pelos dedos
    1: [{ d: 'M842 505 Q770 470 728 530', cls: 'mov', rot: 'abdução suave', tx: 700, ty: 455 },
        { d: 'M748 790 L752 718', cls: 'mov curta', rot: 'eleva o trocanter', tx: 600, ty: 830 }],
    // Barlow: adução suave, sem força dirigida para trás (AAP, 2016).
    2: [{ d: 'M790 560 Q850 545 890 610', cls: 'mov', rot: 'adução suave', tx: 470, ty: 600 }],
  };
  const est = { mao: 'M955 640 m-95 0 a95 60 0 1 0 190 0 a95 60 0 1 0 -190 0', rot: 'a outra mão estabiliza a pelve', tx: 1070, ty: 545 };
  function montar(fig) {
    if (fig.__setas) return; fig.__setas = true;
    const img = fig.querySelector('img');
    const box = document.createElement('div'); box.className = 'ddqx-foto'; img.before(box); box.appendChild(img);
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ddqx-setas'); svg.setAttribute('viewBox', '0 0 1536 1024');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><marker id="ddqx-ponta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker></defs><g class="ddqx-g"></g>';
    box.appendChild(svg);
    const g = svg.querySelector('.ddqx-g');
    const desenhar = () => {
      const f = Number(fig.dataset.fase || 0);
      let h = `<path class="ddqx-est" d="${est.mao}"/><text class="ddqx-t fraco" x="${est.tx}" y="${est.ty}">${est.rot}</text>`;
      for (const s of SETAS[f] || []) h += `<path class="ddqx-seta ${s.cls}" d="${s.d}" marker-end="url(#ddqx-ponta)"/><text class="ddqx-t" x="${s.tx}" y="${s.ty}">${s.rot}</text>`;
      g.innerHTML = h;
    };
    new MutationObserver(desenhar).observe(fig, { attributes: true, attributeFilter: ['data-fase'] });
    desenhar();
  }
  const procurar = () => { const f = document.querySelector('[data-component="ddq"] .cc-ddq-sequencia'); if (f) { montar(f); document.documentElement.classList.add('ddqx-on'); } return !!f; };
  let n = 0; const t = setInterval(() => { if (procurar() || ++n > 600) clearInterval(t); }, 50);
})();
