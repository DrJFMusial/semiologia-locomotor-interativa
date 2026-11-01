/* Espaços de imagem da aula integrada. Cada espaço mostra a imagem combinada quando ela existe em window.__img
   (inserida na construção a partir de integracao-3d/imagens/); sem a imagem, o esquema aprovado da 1.6.1 continua.
   Inspeção estática (slide 10): uma imagem por situação, com fio de prumo e linhas de nível desenhados por cima.
   Palpação e derrame (slide 16): uma imagem por grau de derrame, no lugar da vista anterior.
   Anatomia funcional (slide 19): imagem de atlas do manguito (geral, cada músculo, parte óssea) e do túnel do carpo. */
(() => {
  const img = (k) => (window.__img || {})[k] || '';
  const POSTURA = {
    'Paciente visto por trás': { pasta: 'costas', cenas: { 'Alinhado': 'om60_postura_costas_alinhado', 'Escoliose torácica': 'om61_postura_costas_escoliose', 'Membro inferior esquerdo mais curto': 'om62_postura_costas_encurtamento' } },
    'Paciente visto de lado, olhando para a direita': { pasta: 'lado', cenas: { 'Curvaturas habituais': 'om63_postura_lado_habitual', 'Cifose torácica acentuada': 'om64_postura_lado_cifose', 'Lordose lombar acentuada': 'om65_postura_lado_lordose' } },
    'Membros inferiores vistos de frente': { pasta: 'frente', cenas: { 'Discreto valgo habitual': 'om66_postura_frente_habitual', 'Joelho varo': 'om67_postura_frente_varo', 'Joelho valgo': 'om68_postura_frente_valgo' } },
  };
  // linhas sobre a foto, em fração da largura e da altura; valem para o enquadramento pedido nos prompts (PROMPTS_IMAGENS)
  const LINHAS = {
    costas: { prumo: [[0.5, 0.04], [0.5, 0.975]], niveis: [[0.205, 'ombros'], [0.3, 'escápulas'], [0.47, 'cristas ilíacas']] },
    lado: { prumo: [[0.5, 0.04], [0.5, 0.975]], niveis: [] },
    frente: { prumo: null, niveis: [[0.55, 'joelhos'], [0.93, 'tornozelos']], sempre: true },
  };
  const DERRAME = ['om70_derrame_sem', 'om71_derrame_pequeno', 'om72_derrame_moderado', 'om73_derrame_volumoso'];
  const ATLAS = {
    manguito: { supra: 'om81_atlas_supraespinal', infra: 'om82_atlas_infraespinal', redondo: 'om83_atlas_redondo_menor', sub: 'om84_atlas_subescapular', bolsa: 'om80_atlas_manguito_geral', arco: 'om85_atlas_ombro_osseo' },
    carpo: { '*': 'om86_atlas_tunel_do_carpo' },
  };

  function slot(svg, chave, overlay) {
    const pai = svg.parentNode; let box = pai.querySelector(':scope > .imgx');
    const src = chave && img(chave);
    if (!src) { if (box) box.remove(); svg.classList.remove('imgx-oculto'); return false; }
    if (!box) { const h = svg.getBoundingClientRect().height; box = document.createElement('div'); box.className = 'imgx'; if (h > 100) box.style.setProperty('--imgx-h', `${Math.round(h)}px`); box.innerHTML = '<img alt=""><svg class="imgx-ov" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg>'; svg.before(box); }
    const im = box.querySelector('img'); if (im.getAttribute('src') !== src) im.src = src;
    im.alt = svg.getAttribute('aria-label') || '';
    box.querySelector('.imgx-ov').innerHTML = overlay || '';
    box.dataset.chave = chave;
    svg.classList.add('imgx-oculto');
    return true;
  }
  function postura() {
    for (const svg of document.querySelectorAll('svg.ps-svg')) {
      const [vista, nome] = (svg.getAttribute('aria-label') || '').split(': ');
      const def = POSTURA[vista]; if (!def) continue;
      const comp = svg.closest('[data-component]') || document;
      const ligado = (re) => [...comp.querySelectorAll('.btn')].some((b) => re.test(b.textContent) && b.getAttribute('aria-pressed') === 'true');
      const L = LINHAS[def.pasta]; let ov = '';
      if (L.prumo && ligado(/prumo|vertical/i)) ov += `<line class="imgx-prumo" x1="${L.prumo[0][0] * 1000}" y1="${L.prumo[0][1] * 1000}" x2="${L.prumo[1][0] * 1000}" y2="${L.prumo[1][1] * 1000}"/>`;
      if (L.sempre || ligado(/nív/i)) for (const [y, t] of L.niveis) ov += `<line class="imgx-nivel" x1="120" y1="${y * 1000}" x2="880" y2="${y * 1000}"/><text class="imgx-t" x="885" y="${y * 1000 + 8}">${t}</text>`;
      slot(svg, def.cenas[nome], ov);
    }
  }
  function derrame() {
    const svg = document.querySelector('svg .dj-ant')?.closest('svg'); if (!svg) return;
    const comp = svg.closest('[data-component]') || document;
    const i = [...comp.querySelectorAll('.dj-vb .btn')].findIndex((b) => b.getAttribute('aria-pressed') === 'true');
    slot(svg, DERRAME[i], '');
  }
  function atlas() {
    const fig = document.querySelector('.at2-fig'); if (!fig) return;
    const svg = fig.querySelector(':scope > svg.at2-svg'); if (!svg) return;
    const comp = fig.closest('[data-component]') || document;
    const aba = comp.querySelector('.at2-tabs .btn[aria-pressed="true"]')?.dataset.k;
    const item = comp.querySelector('.at2-lista .btn[aria-pressed="true"]')?.dataset.k;
    const def = ATLAS[aba]; slot(svg, def && (def[item] || def['*']), '');
  }
  let t = 0;
  const tudo = () => { t = 0; try { postura(); derrame(); atlas(); } catch (e) { console.warn('imagens', e); } };
  const agendar = () => { if (!t) t = requestAnimationFrame(tudo); };
  const obs = new MutationObserver((ms) => { if (ms.some((m) => !m.target.closest?.('.imgx, .l3d-bloco'))) agendar(); });
  const iniciar = () => { obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-pressed', 'aria-label'] }); tudo(); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.__loc3dImagens = { POSTURA, DERRAME, ATLAS, LINHAS };
})();
