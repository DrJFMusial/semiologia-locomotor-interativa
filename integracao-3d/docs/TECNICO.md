# Documentação técnica da integração 3D (1.8.0-exp)

## Construção

```
cd integracao-3d/motor
npm ci
npm test                 # cinemática e geometria (Node)
npm run test:pele        # deformação da pele
node test/cenas.test.mjs # todas as cenas da aula geram pose válida
npm run build:aula       # motor3d.js + integração no HTML publicado → integracao-3d/dist/index.html
```

`scripts/integrar.cjs` lê o `index.html` da raiz (aula publicada) e faz três coisas:

1. Aplica sete ganchos de uma linha. Cada um é conferido como ponto único no código.
2. Acrescenta, antes de `</body>`, o estilo, o stub e o motor (em `<script type="text/plain">`).
3. Confere que, desfeitas as inserções, o arquivo volta a ser idêntico byte a byte ao publicado.

Se o HTML de base mudar e algum gancho deixar de existir, a construção para com aviso.

## Peças

| Arquivo | Função |
|---|---|
| `aula/stub.js` | Detecta o WebGL. Com WebGL, marca `html.l3d-ativo`, o que oculta os esquemas corporais, e carrega o motor 300 ms depois do `load`, ou antes, se um componente pedir. Sem WebGL, ou com `?2d`, não faz nada. Se o motor falhar, remove `l3d-ativo` e os esquemas da 1.6.1 voltam. |
| `aula/estilo.css` | Estilos com prefixo `l3d-`, sobre os tokens da aula (claro e escuro). |
| `motor/src/aula/integracao.js` | Motor único: um contexto WebGL e um canvas, que passa para a figura mais visível. As demais figuras visíveis mostram a última imagem que tiveram. Também concentra os ganchos (`mov`, `ombro`, `cena`, `fig`), a leitura do DOM das figuras estáticas, o enquadramento automático, a qualidade adaptativa e a altura de cada cena (a mesma do esquema substituído). |
| `motor/src/aula/cenas.js` | Biblioteca de cenas: os 23 testes, cotovelo, Lasègue, Ortolani e Barlow (`cenaTeste`), além de capa, força, pelve, passagem do pé, contato, inspeção estática, ângulo de carregamento e pontos do cotovelo (`FIGURAS`). Cada cena devolve postura, vista, segmentos em destaque, mãos e setas do examinador, indicadores (linhas, pontos, dor) e a etiqueta do tipo de dado. |
| `motor/src/cinematica/pose.js` | Novas articulações. **Tornozelo:** dorsiflexão e flexão plantar. **Joelho:** rotação, varo e valgo, translação anterior da tíbia. **Cotovelo:** valgo. **Quadril:** translação da cabeça femoral. **Pescoço:** flexão, rotação e inclinação. **Corpo:** deslocamento global e decúbito ventral. Sinais conferidos numericamente. |
| `motor/src/render/renderizador.js` | Mesa (decúbito dorsal e ventral) e banqueta (sentado). |
| `motor/src/render/pesos-pele.js` | Pesos da pele do pescoço. |
| `motor/src/interface/goniometro.js` | Sobreposição com linhas, pontos, polígono e rótulo de dor, além do goniômetro. |

## Comportamento

- **Tempo.** O 3D segue a linha do tempo de cada esquema original. O reprodutor, a barra, as fases e os botões continuam sendo os da aula. Os textos que o esquema escrevia dentro do desenho (capa, força, passagem do pé) aparecem numa legenda abaixo da cena.
- **Enquadramento.** Nos testes e em parte das figuras, a câmera enquadra os segmentos em destaque e as mãos do examinador ao longo de todo o movimento, na vista escolhida. Os testes do ombro mantêm o enquadramento revisado na v0.3.
- **Qualidade adaptativa.** Abaixo de cerca de 14 quadros por segundo, a resolução cai para 1, depois para 0,75; no último nível, a pele é desligada. A cena nunca volta ao esquema. `?forcar3d` desliga essa reação, para os testes.
- **Fora da tela.** Nada é desenhado sem figura visível. A animação contínua do contato inicial para quando a figura sai da tela.
- **Teclado e apresentação.** A navegação da aula não muda. Cliques e arrastos sobre a cena não trocam de tela; a roda só gira a câmera quando ela está liberada.

## Verificação

- `testes/qa.cjs <aula.html> <pasta>`: os dez testes. Grava `qa.json`.
- `testes/comparar.cjs <aula.html> antes|depois <espera>`: captura cada estado de `testes/estados.cjs`.
- `testes/estados.cjs`: lista dos estados com figura corporal, usada nos dois scripts.

## Acréscimos da 1.8.1

| Arquivo | Função |
|---|---|
| `aula/capa.js` + `aula/capa-dados.json` | Capa em traço 2D, sem WebGL. Os contornos dos ossos vêm das malhas do motor, projetadas na vista anterior (`motor/scripts/capa-triangulos.mjs`, depois a união dos triângulos com shapely). A transformação 2D de cada segmento, grau a grau de 0° a 180°, vem da cinemática do motor (`motor/scripts/capa-dados.mjs`). A animação continua sendo comandada pela capa da aula. |
| `aula/ddq.js` | Ortolani e Barlow: usa o espaço de imagem que a 1.6.1 já tinha (`slot-imagens-ddq`) e desenha setas sobre a foto, conforme a fase do reprodutor. |
| `aula/imagens.js` | Espaços de imagem: inspeção estática (`om60` a `om68`, com fio de prumo e linhas de nível sobre a foto), derrame (`om70` a `om73`) e atlas (`om80` a `om86`). Sem a imagem, fica o esquema da 1.6.1. |
| `integracao-3d/imagens/` | Imagens novas. A construção as embute em `window.__img` com o nome do arquivo (com e sem extensão). Para incluir uma imagem aprovada, basta copiá-la para cá com o nome combinado e rodar `npm run build:aula`. |
| `motor/scripts/atlas_regioes.py` | Gera `atlas_ombro`, `atlas_punho` e `atlas_joelho` a partir do Z-Anatomy: Skeletal, Muscular, Joints e Nervous System, nos FBX da branch `PC-Version` do repositório LluisV/Z-Anatomy. Cada região é recortada por planos, simplificada e exportada; depois, comprimida com gltfpack (`-cc -kn -km`). |
| `motor/src/aula/atlas.js` | Atlas regional na mesma cena e com a mesma câmera do motor, longe do corpo, que fica oculto enquanto o atlas está em uso. Destaque por estrutura, rótulos, líquido do joelho (bolsa suprapatelar escalada, recessos parapatelares), afastamento da patela, rechaço e sinal da onda. |

Ganchos novos no código compilado:

- **Derrame:** `__loc3d.joelho`, no desenho do componente.
- **Anatomia funcional:** `__loc3d.atlas`, na seleção de item.
- **Capa:** `__loc3dCapa`, que substitui o gancho 3D da capa.

São nove ganchos ao todo, e a reversibilidade continua conferida na construção.
