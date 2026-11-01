/* Capa: abdução do ombro em traço de esqueleto (contornos do atlas Z-Anatomy, vista anterior) com o arco de 0° a 180°
   atravessando o slide. Desenho 2D: não depende de WebGL. A animação continua sendo comandada pela capa da aula
   (mesmo tempo, mesma pausa, mesmo texto de fase); este código só desenha. */
(() => {
  const D = __CAPA_DADOS__;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  // coordenadas em milímetros (números maiores evitam falhas de rasterização com escala grande)
  const caminho = (aneis) => aneis.map((a) => 'M' + a.map((p) => `${Math.round(p[0] * 1000)},${Math.round(p[1] * 1000)}`).join('L') + 'Z').join('');
  const mm = (m) => `matrix(${m[0]} ${m[1]} ${m[2]} ${m[3]} ${m[4] * 1000} ${m[5] * 1000})`;
  let st = null;
  function montar(s) {
    const sec = s.closest('section') || s.parentNode, fig = s.querySelector('.cp-svg');
    if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
    const svg = el('svg', { class: 'cpx', 'aria-hidden': 'true' });
    const fundo = el('g', { class: 'cpx-fundo' }), corpo = el('g', { class: 'cpx-corpo' }), frente = el('g', { class: 'cpx-frente' });
    svg.append(fundo, corpo, frente); sec.prepend(svg);
    const ossos = {};
    for (const [s2, an] of Object.entries(D.contornos)) {
      const p = el('path', { d: caminho(an), class: D.moveis.includes(s2) ? 'cpx-osso mv' : 'cpx-osso', 'vector-effect': 'non-scaling-stroke' });
      if (D.fixos[s2]) p.setAttribute('transform', mm(D.fixos[s2]));
      ossos[s2] = p; corpo.appendChild(p);
    }
    const legenda = el('text', { class: 'cpx-fase', 'text-anchor': 'middle' });
    svg.appendChild(legenda);
    st = { s, sec, fig, svg, fundo, corpo, frente, ossos, legenda, th: 0 };
    new ResizeObserver(() => { layout(); desenhar(st.th); }).observe(sec);
    layout();
  }
  function layout() {
    const r = st.sec.getBoundingClientRect(), f = st.fig.getBoundingClientRect();
    if (!r.width || !f.height) return;
    st.svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
    // escala: do pé (y = 0) à mão elevada (cerca de 2,25 m) dentro da altura que a figura da capa ocupava
    const k = (f.height * 0.9) / 2.3, cx = f.left - r.left + f.width / 2, base = f.top - r.top + f.height * 0.93;
    st.k = k; st.tx = cx; st.ty = base;
    st.corpo.setAttribute('transform', `translate(${cx} ${base}) scale(${k / 1000})`);
    st.legenda.setAttribute('x', cx); st.legenda.setAttribute('y', base + 34);
    const g0 = D.quadros[0].gh, c = [cx + g0[0] * k, base + g0[1] * k];
    st.c = c; st.R = Math.max(120, Math.min(c[1] - 40, r.height - c[1] - 40, c[0] - 80)); st.R2 = Math.max(st.R * 2.4, c[0] - 60); st.Rf = Math.hypot(...[D.quadros[0].co[0] - g0[0], D.quadros[0].co[1] - g0[1]]) * k * 1.9;
    // arco de fundo: de 0° (braço ao lado do corpo) a 180° (braço junto à cabeça), do lado do ombro direito
    const pt = (ang, R) => [c[0] - Math.sin(ang * Math.PI / 180) * R, c[1] + Math.cos(ang * Math.PI / 180) * R];
    st.pt = pt;
    st.fundo.replaceChildren();
    const arco = (R, a0, a1) => { const p0 = pt(a0, R), p1 = pt(a1, R); return `M${p0} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1}`; };
    st.fundo.appendChild(el('path', { class: 'cpx-eco', d: arco(st.R2, 0, 180) }));
    for (let a = 0; a <= 180; a += 10) { const p0 = pt(a, st.R2), p1 = pt(a, st.R2 - (a % 30 ? 10 : 22)); st.fundo.appendChild(el('line', { class: 'cpx-tick eco', x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] })); }
    st.fundo.appendChild(el('path', { class: 'cpx-arco', d: arco(st.R, 0, 180) }));
    for (let a = 0; a <= 180; a += 10) {
      const forte = a % 30 === 0, p0 = pt(a, st.R), p1 = pt(a, st.R + (forte ? 16 : 8));
      st.fundo.appendChild(el('line', { class: forte ? 'cpx-tick forte' : 'cpx-tick', x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] }));
      if (a % 90 === 0) { const q = pt(a, st.R + 34); const t = el('text', { class: 'cpx-num', x: q[0], y: q[1] + 5, 'text-anchor': 'middle' }); t.textContent = `${a}°`; st.fundo.appendChild(t); }
    }
    st.prog = el('path', { class: 'cpx-prog' }); st.raio = el('line', { class: 'cpx-raio' }); st.ponto = el('circle', { class: 'cpx-ponto', r: 5 });
    st.arcoF = el('path', { class: 'cpx-arcof' }); st.graus = el('text', { class: 'cpx-graus', 'text-anchor': 'middle' });
    st.fundo.append(st.prog, st.raio, st.ponto); st.frente.replaceChildren(st.arcoF, st.graus);
    st.arco = arco;
  }
  function desenhar(th) {
    if (!st || !st.k) return;
    const q = D.quadros[Math.max(0, Math.min(180, Math.round(th)))];
    for (const s of D.moveis) st.ossos[s].setAttribute('transform', mm(q.m[s]));
    const a = Math.max(0.5, th);
    st.prog.setAttribute('d', st.arco(st.R, 0, a));
    const p = st.pt(a, st.R2), g = [st.tx + q.gh[0] * st.k, st.ty + q.gh[1] * st.k];
    st.raio.setAttribute('x1', g[0]); st.raio.setAttribute('y1', g[1]); st.raio.setAttribute('x2', p[0]); st.raio.setAttribute('y2', p[1]);
    const pm = st.pt(a, st.R); st.ponto.setAttribute('cx', pm[0]); st.ponto.setAttribute('cy', pm[1]);
    st.arcoF.setAttribute('d', st.arco(st.Rf * 0.42, 0, a).replace(/M[^A]+/, () => { const p0 = st.pt(0, st.Rf * 0.42); return `M${p0}`; }));
    const m = st.pt(a / 2, st.Rf * 0.42 + 26); st.graus.setAttribute('x', m[0]); st.graus.setAttribute('y', m[1] + 5); st.graus.textContent = `${Math.round(th)}°`;
    // o arco pequeno fica centrado no ombro de cada quadro (goniômetro); o grande, no ombro de repouso
    st.arcoF.setAttribute('transform', `translate(${g[0] - st.c[0]} ${g[1] - st.c[1]})`); st.graus.setAttribute('transform', `translate(${g[0] - st.c[0]} ${g[1] - st.c[1]})`);
    const fase = st.fig.querySelector('.cp-fase'); if (fase && st.legenda.textContent !== fase.textContent) st.legenda.textContent = fase.textContent;
  }
  window.__loc3dCapa = (s, th) => {
    try { if (!st || st.s !== s || !st.svg.isConnected) montar(s); st.th = th; desenhar(th); } catch (e) { console.warn('capa', e); }
  };
})();
