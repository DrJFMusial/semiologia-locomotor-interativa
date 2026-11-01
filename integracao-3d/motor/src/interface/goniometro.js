/**
 * Goniômetro e indicadores em SVG sobre a cena (não são geometria 3D).
 * Desenha a leitura PROJETADA na vista atual; o painel mostra também o ângulo 3D do modelo.
 */
const n1 = (x) => Math.round(x * 10) / 10;
function arco(c, r, a0, a1) {
  const p0 = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)], p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)];
  const d = a1 - a0;
  return `M${n1(p0[0])} ${n1(p0[1])} A${r} ${r} 0 ${Math.abs(d) > Math.PI ? 1 : 0} ${d > 0 ? 1 : 0} ${n1(p1[0])} ${n1(p1[1])}`;
}
export function criarSobreposicao(svg, canvas, projetar) {
  return {
    /**
     * itens.gonio: { centro, fixo, movel, cor?, rotulo? } (vetores no mundo); itens.dor: { faixa:[a,b], valor };
     * itens.rotulos: [[texto, ponto, dx, dy]]; itens.aviso: texto; itens.extra: [{ centro, fixo, movel, classe, rotulo }]
     */
    desenhar(itens) {
      const W = canvas.clientWidth, H = canvas.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      let out = '', lida = null;
      const um = (q) => { const l = Math.hypot(q[0], q[1]) || 1; return [q[0] / l, q[1] / l]; };
      const gon = (g, R, classe = '') => {
        const c = projetar(g.centro);
        const f = projetar([g.centro[0] + g.fixo[0] * 0.2, g.centro[1] + g.fixo[1] * 0.2, g.centro[2] + g.fixo[2] * 0.2]);
        const mv = projetar([g.centro[0] + g.movel[0] * 0.2, g.centro[1] + g.movel[1] * 0.2, g.centro[2] + g.movel[2] * 0.2]);
        const vf = um([f[0] - c[0], f[1] - c[1]]), vm = um([mv[0] - c[0], mv[1] - c[1]]);
        const a0 = Math.atan2(vf[1], vf[0]); let d = Math.atan2(vm[1], vm[0]) - a0;
        while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const graus = Math.abs(d) * 180 / Math.PI, L = R + 22;
        let s = `<g class="gon ${classe}"><line class="g-arm" x1="${n1(c[0])}" y1="${n1(c[1])}" x2="${n1(c[0] + vf[0] * L)}" y2="${n1(c[1] + vf[1] * L)}"/>`;
        if (graus > 0.5) s += `<path class="g-arc" d="${arco(c, R, a0, a0 + d)}"/>`;
        s += `<line class="g-arm mv" x1="${n1(c[0])}" y1="${n1(c[1])}" x2="${n1(c[0] + vm[0] * L)}" y2="${n1(c[1] + vm[1] * L)}"/><circle class="g-eixo" cx="${n1(c[0])}" cy="${n1(c[1])}" r="6"/>`;
        if (graus > 4) { const am = a0 + d / 2; s += `<text class="t gn" x="${n1(c[0] + Math.cos(am) * (R + 40))}" y="${n1(c[1] + Math.sin(am) * (R + 40) + 7)}" text-anchor="middle">${g.rotulo ? g.rotulo + ' ' : ''}${Math.round(graus)}°</text>`; }
        s += '</g>';
        return { s, graus, c, a0, d };
      };
      const R = Math.min(W, H) * 0.15;
      if (itens.gonio) {
        const g = gon(itens.gonio, R); out += g.s; lida = g.graus;
        if (itens.dor) {
          const r = R + 16, sg = Math.sign(g.d) || 1, A = (x) => g.a0 + sg * x * Math.PI / 180, on = itens.dor.valor >= itens.dor.faixa[0] && itens.dor.valor <= itens.dor.faixa[1];
          out = `<path class="band-ok" d="${arco(g.c, r, A(0), A(itens.dor.faixa[0]))}"/><path class="band${on ? ' on' : ''}" d="${arco(g.c, r, A(itens.dor.faixa[0]), A(itens.dor.faixa[1]))}"/><path class="band-ok" d="${arco(g.c, r, A(itens.dor.faixa[1]), A(180))}"/>` + out;
        }
      }
      for (const e of itens.extra || []) out += gon(e, R * 0.7, e.classe).s;
      if (itens.dorTexto) { const q = projetar(itens.dorTexto); out += `<text class="t pain" x="${n1(q[0])}" y="${n1(q[1] - 40)}" text-anchor="middle">dor</text>`; }
      for (const [txt, p, dx, dy] of itens.rotulos || []) {
        const q = projetar(p);
        out += `<line class="rot-l" x1="${n1(q[0])}" y1="${n1(q[1])}" x2="${n1(q[0] + dx)}" y2="${n1(q[1] + dy)}"/><text class="t rot" x="${n1(q[0] + dx + (dx >= 0 ? 4 : -4))}" y="${n1(q[1] + dy + 4)}" text-anchor="${dx >= 0 ? 'start' : 'end'}">${txt}</text>`;
      }
      // linhas de referência (fio de prumo, níveis, trajetos) e pontos marcados, em coordenadas do mundo
      for (const ln of itens.linhas || []) {
        const q = ln.pts.map(projetar); if (q.length < 2) continue;
        out += `<polyline class="ln ${ln.classe || ''}" points="${q.map((x) => `${n1(x[0])},${n1(x[1])}`).join(' ')}"/>`;
        if (ln.rotulo) { const z = q[ln.rotuloEm ?? q.length - 1]; out += `<text class="t ln-t ${ln.classe || ''}" x="${n1(z[0] + (ln.dx ?? 8))}" y="${n1(z[1] + (ln.dy ?? 4))}" text-anchor="${(ln.dx ?? 8) >= 0 ? 'start' : 'end'}">${ln.rotulo}</text>`; }
      }
      for (const pt of itens.pontos || []) {
        const q = projetar(pt.p);
        out += `<circle class="pt ${pt.classe || ''}" cx="${n1(q[0])}" cy="${n1(q[1])}" r="${pt.r || 6}"/>`;
        if (pt.rotulo) out += `<text class="t pt-t" x="${n1(q[0] + (pt.dx ?? 10))}" y="${n1(q[1] + (pt.dy ?? -8))}" text-anchor="${(pt.dx ?? 10) >= 0 ? 'start' : 'end'}">${pt.rotulo}</text>`;
      }
      if (itens.poligono) { const q = itens.poligono.map(projetar); out += `<polygon class="poli" points="${q.map((x) => `${n1(x[0])},${n1(x[1])}`).join(' ')}"/>`; }
      if (itens.dorEm) { const q = projetar(itens.dorEm.p); out += `<text class="t pain" x="${n1(q[0] + (itens.dorEm.dx || 0))}" y="${n1(q[1] + (itens.dorEm.dy ?? -18))}" text-anchor="middle">${itens.dorEm.texto || 'dor'}</text>`; }
      if (itens.aviso) out += `<text class="t aviso" x="12" y="22">${itens.aviso}</text>`;
      if (itens.faixa) out += `<g><rect class="faixa-erro" x="0" y="${H - 34}" width="${W}" height="34"/><text class="t faixa-t" x="${W / 2}" y="${H - 12}" text-anchor="middle">${itens.faixa}</text></g>`;
      svg.innerHTML = out;
      return lida;
    },
  };
}
