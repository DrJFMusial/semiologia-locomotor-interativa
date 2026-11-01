// estados da aula que mostram (ou mostravam) figura corporal; usado pela verificação e pela comparação
const ck = (sel, txt) => `(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.offsetParent && x.textContent.trim().startsWith(${JSON.stringify(txt)})); if (b) b.click(); return !!b; })()`;
const rng = (sel, v) => `(() => { const r = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.offsetParent); if (!r) return false; r.value = String(${v}); r.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const TE = '[data-component="testes"]:not([data-regioes])';
const teste = (aba, i, t) => [ck(TE + ' .te-tabs .btn', aba), `(() => { const l = [...document.querySelectorAll('${TE} .te-list .gl-st')].filter((x) => x.offsetParent); if (l[${i}]) l[${i}].click(); return !!l[${i}]; })()`, rng(TE + ' .an-rng', t * 1000)];
const COT = '[data-component="cotovelo"]';
const E = [
  { nome: 'capa', s: 0, a: [], el: '[data-component="capa"]', tipo: 'traco' },
  { nome: 'movimentos_ombro_abducao', s: 3, a: [], el: '[data-component="movimentos"]' },
  { nome: 'postura_costas_escoliose', s: 9, a: [ck('[data-component="postura"] .btn', 'De costas'), ck('[data-component="postura"] .btn', 'Escoliose')], el: '[data-component="postura"]', tipo: 'esquema' },
  { nome: 'postura_costas_discrepancia', s: 9, a: [ck('[data-component="postura"] .btn', 'De costas'), ck('[data-component="postura"] .btn', 'Membro inferior')], el: '[data-component="postura"]', tipo: 'esquema' },
  { nome: 'postura_lado_cifose', s: 9, a: [ck('[data-component="postura"] .btn', 'De lado'), ck('[data-component="postura"] .btn', 'Cifose')], el: '[data-component="postura"]', tipo: 'esquema' },
  { nome: 'postura_lado_lordose', s: 9, a: [ck('[data-component="postura"] .btn', 'De lado'), ck('[data-component="postura"] .btn', 'Lordose')], el: '[data-component="postura"]', tipo: 'esquema' },
  { nome: 'postura_frente_varo', s: 9, a: [ck('[data-component="postura"] .btn', 'De frente'), ck('[data-component="postura"] .btn', 'Joelho varo')], el: '[data-component="postura"]', tipo: 'esquema' },
  { nome: 'marcha_pelve_caso2', s: 12, a: [ck('[data-component="mecanismos"] .btn', 'Pelve'), ck('.mk-pv .mk-cases .btn', 'Caso 2')], el: '[data-component="mecanismos"]' },
  { nome: 'marcha_pelve_caso3', s: 12, a: [ck('[data-component="mecanismos"] .btn', 'Pelve'), ck('.mk-pv .mk-cases .btn', 'Caso 3')], el: '[data-component="mecanismos"]' },
  { nome: 'marcha_pe_balanco_caso1', s: 12, a: [ck('[data-component="mecanismos"] .btn', 'Passagem'), ck('.mk-pe .mk-cases .btn', 'Caso 1'), rng('.mk-pe .cy-rng', 45)], el: '[data-component="mecanismos"]' },
  { nome: 'marcha_pe_balanco_caso3', s: 12, a: [ck('[data-component="mecanismos"] .btn', 'Passagem'), ck('.mk-pe .mk-cases .btn', 'Caso 3'), rng('.mk-pe .cy-rng', 55)], el: '[data-component="mecanismos"]' },
  { nome: 'marcha_pe_contato', s: 12, a: [ck('[data-component="mecanismos"] .btn', 'Passagem'), ck('.mk-pe .mk-cases .btn', 'Caso 1'), ck('[data-component="mecanismos"] .btn', 'O pé não sobe'), ck('.mk-pe .mk-vistas .btn', 'Contato')], el: '[data-component="mecanismos"]' },
  ...['Sem derrame', 'Pequeno', 'Moderado', 'Volumoso'].map((g, i) => ({ nome: `derrame_${i}`, s: 15, a: [ck('[data-component="derrame"] .btn', g)], el: '[data-component="derrame"]' })),
  ...['Supraespinal', 'Infraespinal', 'Redondo menor', 'Subescapular', 'Bolsa subacromial', 'Arco coracoacromial'].map((t, i) => ({ nome: `atlas_manguito_${i + 1}`, s: 18, a: [ck('[data-component="anatomia"] .btn', 'Manguito'), ck('[data-component="anatomia"] .btn', t)], el: '[data-component="anatomia"]' })),
  ...['Retináculo', 'Nervo mediano', 'Nove tendões', 'Canal de Guyon', '1º compartimento'].map((t, i) => ({ nome: `atlas_carpo_${i + 1}`, s: 18, a: [ck('[data-component="anatomia"] .btn', 'Túnel'), ck('[data-component="anatomia"] .btn', t)], el: '[data-component="anatomia"]' })),
  { nome: 'ativa_passiva', s: 16, a: [], el: '[data-component="ombro"]' },
  { nome: 'forca_grau1', s: 17, a: [ck('[data-component="forca"] .fc-b', '1')], el: '[data-component="forca"]' },
  { nome: 'forca_grau2', s: 17, a: [ck('[data-component="forca"] .fc-b', '2')], el: '[data-component="forca"]' },
  { nome: 'forca_grau4', s: 17, a: [ck('[data-component="forca"] .fc-b', '4')], el: '[data-component="forca"]' },
  { nome: 'anatomia_nervo_isquiatico', s: 18, a: [ck('[data-component="anatomia"] .btn', 'Nervo'), rng('[data-component="anatomia"] .an-rng', 600)], el: '[data-component="anatomia"]' },
  ...[['Ombro', 5], ['Punho e mão', 6], ['Coluna', 2], ['Quadril', 2], ['Joelho', 6], ['Tornozelo e pé', 1]].flatMap(([aba, n]) => Array.from({ length: n }, (_, i) => ({ nome: `teste_${aba.replace(/\W+/g, '')}_${i + 1}`, s: 19, a: teste(aba, i, 0.6), el: TE + ' .te-fig' }))),
  { nome: 'cotovelo_inspecao_valgo', s: 19, a: [ck(TE + ' .te-tabs .btn', 'Cotovelo'), ck(COT + ' .btn', 'Inspeção'), ck(COT + ' .btn', 'Cúbito valgo')], el: COT },
  { nome: 'cotovelo_palpacao_flexao', s: 19, a: [ck(TE + ' .te-tabs .btn', 'Cotovelo'), ck(COT + ' .btn', 'Palpação')], el: COT },
  ...['Teste de Cozen', 'Teste de Mill', 'Teste de Maudsley', 'Epicondilite medial'].map((t, i) => ({ nome: `cotovelo_teste_${i + 1}`, s: 19, a: [ck(TE + ' .te-tabs .btn', 'Cotovelo'), ck(COT + ' .btn', 'Testes especiais'), ck(COT + ' button, ' + COT + ' .gl-st', String(i + 1)), rng(COT + ' .an-rng', 600)], el: COT })),
  { nome: 'ddq_ortolani', s: 20, a: [ck('[data-component="ddq"] .btn', 'Ortolani'), rng('[data-component="ddq"] .an-rng', 600)], el: '[data-component="ddq"]', tipo: 'foto' },
  { nome: 'ddq_barlow', s: 20, a: [ck('[data-component="ddq"] .btn', 'Barlow'), rng('[data-component="ddq"] .an-rng', 600)], el: '[data-component="ddq"]', tipo: 'foto' },
];
const MANEQUINS = '.cp-svg, .mv-svg, .om-svg, .an-svg, .fc-svg, .mk-svg-pv, .mk-svg-pe, svg.gl-svg[aria-label^="Manequim"], svg.ct-svg, svg.dj-svg:has(> .dj-sag)';
module.exports = { E, MANEQUINS };
