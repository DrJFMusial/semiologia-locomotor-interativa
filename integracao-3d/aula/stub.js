/* Integração 3D experimental: carregamento do motor anatômico.
   Com WebGL, as figuras corporais da aula passam a ser desenhadas pelo modelo 3D; os esquemas 2D ficam ocultos
   (html.l3d-ativo). O motor começa a carregar logo depois da abertura da aula, em segundo plano, ou antes, se um
   componente com figura pedir. Sem WebGL, ou com ?2d, nada muda em relação à 1.6.1. */
(() => {
  let estado = 'inicial', api = null;
  const pend = new Map();
  const raizHtml = document.documentElement;
  const temWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };
  const desligado = /[?&]2d\b/.test(location.search);
  const disponivel = !desligado && temWebGL();
  if (disponivel) raizHtml.classList.add('l3d-ativo'); else { estado = 'indisponivel'; raizHtml.classList.add('l3d-sem-webgl'); }
  function carregar() {
    if (estado !== 'inicial') return;
    estado = 'carregando';
    const fonte = document.getElementById('loc3d-motor');
    const sc = document.createElement('script'); sc.type = 'module'; sc.textContent = fonte.textContent; fonte.remove();
    document.head.appendChild(sc);
  }
  window.__loc3dPronto = (p) => p.then((a) => {
    api = a; estado = 'pronto';
    for (const [no, f] of pend) if (no.isConnected) f();
    pend.clear();
  }).catch((e) => {
    estado = 'falhou'; raizHtml.classList.remove('l3d-ativo'); raizHtml.classList.add('l3d-sem-webgl');
    console.warn('Modelo 3D indisponível neste equipamento; a aula mostra os esquemas da 1.6.1.', e);
  });
  const gancho = (nome) => (no, ...args) => {
    if (api) return api[nome](no, ...args);
    if (estado === 'inicial') carregar();
    if (estado === 'carregando' && no) pend.set(no, () => api[nome](no, ...args));
    return false;
  };
  if (disponivel) {
    const cedo = () => setTimeout(carregar, 300);
    if (document.readyState === 'complete') cedo(); else addEventListener('load', cedo, { once: true });
  }
  window.__loc3d = { mov: gancho('mov'), ombro: gancho('ombro'), cena: gancho('cena'), fig: gancho('fig'), atlas: gancho('atlas'), joelho: gancho('joelho'),
    estado: () => (api ? { carregamento: estado, ...api.estado() } : { carregamento: estado }), info: () => api && api.info() };
})();
