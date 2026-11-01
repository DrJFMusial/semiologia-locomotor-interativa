# Inventário dos manequins da aula e substituição pelo modelo 3D (1.8.0-exp e ajustes da 1.8.1-exp)

Base: aula 1.6.1 publicada (`main`, `97641e8`, `index.html` SHA-256 `f5d30685…`). O levantamento juntou duas fontes: a leitura do código compilado (cada função que desenha um corpo esquemático) e a navegação automática por todas as telas e abas da aula publicada.

Critério: "manequim" é qualquer figura de corpo humano inteiro ou de segmento corporal desenhada em esquema de linhas. Cortes anatômicos, diagramas de estruturas, linhas do tempo e pegadas não são manequins e ficam como estão (seção 3).

## 1. Manequins encontrados e onde o 3D os substitui

| # | Tela (número na aula) | Manequim na 1.6.1 | Variações | No lugar dele, na aula integrada | Natureza dos ângulos |
|---|---|---|---|---|---|
| 1 | Capa (1) | Corpo de frente, abdução animada do ombro de 0° a 180° | 1 animação | **1.8.1, por decisão sua:** sem 3D. Animação 2D em traço de esqueleto (contornos do atlas Z-Anatomy, vista anterior) com o arco de 0° a 180° atravessando o slide; o texto de fase aprovado continua abaixo da figura | Escápula: mesma cinemática do motor (medido até 120°, extrapolado acima) |
| 2 | Movimentos e amplitudes (4) | Manequim do movimento escolhido | 17 movimentos, Explorar e Desafio | Modelo 3D do movimento (feito na 1.7.0-exp) | Conforme a v0.3: medido, extrapolado ou ilustrativo, por movimento |
| 3 | Triagem GALS (9) | Dois manequins no código ("meio passo" e "de pé, de perfil") | 2 | Nenhuma troca visível: na 1.6.1 esses manequins já não aparecem, porque as fotografias aprovadas ocupam o lugar deles. O leitor de figuras do 3D está pronto caso voltem | Não se aplica |
| 4 | Inspeção estática (10) | Corpo de costas, de lado e de frente, com fio de prumo e linhas de nível | 9 (3 vistas × 3 situações) | **1.8.1, por decisão sua:** sem 3D (a cifose e a lordose não apareciam na coluna do modelo). Um espaço de imagem por situação (`om60` a `om68`); até a imagem chegar, aparece o esquema aprovado da 1.6.1. Sobre a imagem, a aula desenha o fio de prumo e as linhas de nível | Imagens pendentes: prompts em `PROMPTS_IMAGENS_v6.md` |
| 5 | Marcha: dor, pelve e pé (13), aba Pelve | Paciente de costas em apoio simples direito | 3 casos | Esqueleto 3D de costas, com a pelve inclinando e a linha de nível da pelve | Ilustrativos (mesmos valores do esquema) |
| 6 | Marcha (13), aba Passagem do pé, Balanço | Membro inferior direito de lado | 3 casos, barra de posição | Esqueleto 3D de lado, com os ângulos de quadril, joelho e tornozelo do esquema, trajetória dos dedos e marca de toque no chão | Ilustrativos (mesma função de ângulos do esquema) |
| 7 | Marcha (13), Contato inicial | Pé no contato inicial | 3 modos (calcanhar, batida do antepé, antepé) | Pé e perna 3D em animação contínua do contato | Ilustrativos |
| 8 | Mobilidade ativa × passiva (17) | Manequim frontal | Abdução e rotação externa, 5 pacientes, ativo e passivo | Modelo 3D com as mãos do examinador no passivo (feito na 1.7.0-exp) | Amplitude de cada paciente; cinemática escapular normal |
| 9 | Força muscular (18) | Braço em flexão do cotovelo | Graus 0 a 5, Explorar e Desafio | Esqueleto 3D na mesma linha do tempo de 4 s: marca de contração (grau 1), braço apoiado visto de cima (grau 2), mãos do examinador e seta de resistência (graus 3 a 5) | Ilustrativos |
| 10 | Anatomia funcional (19), Nervo isquiático | Elevação da perna estendida animada | 1 | Esqueleto 3D em decúbito dorsal, mãos do examinador, goniômetro do quadril e traçado esquemático do nervo isquiático | Ilustrativos; nervo esquemático |
| 11 | Testes especiais (20) | Esquema animado ao lado da foto | 23 testes em 6 abas | Modelo 3D na mesma linha do tempo do esquema; foto aprovada mantida ao lado | Ilustrativos, exceto o que a v0.3 mediu no ombro |
| 12 | Testes especiais (20), aba Cotovelo: Inspeção | Membro superior de frente, ângulo de carregamento | 3 (varo, normal, valgo) | Esqueleto 3D de frente com os eixos do braço e do antebraço | Deformidade simulada por angulação no cotovelo |
| 13 | Aba Cotovelo: Palpação | Cotovelo visto por trás, três pontos | 2 (flexão e extensão) | Esqueleto 3D por trás, com os epicôndilos, o olécrano e o triângulo | Ponta do olécrano aproximada |
| 14 | Aba Cotovelo: Testes especiais | Esquema animado | 4 (Cozen, Mill, Maudsley, epicondilite medial) | Modelo 3D na linha do tempo do esquema | Ilustrativos |
| 15 | Barlow e Ortolani (21) | Quadril em corte visto de cima, com a mão do examinador | 2 | **1.8.1, por decisão sua:** sem 3D e sem esquema. Só as três fotos do recém-nascido (`om50`, `om51`, `om52`, antes marcadas como rascunho), com setas da aula sobre a foto: abdução e elevação do trocanter (Ortolani), adução e pressão no eixo do fêmur (Barlow), mão que estabiliza a pelve | Setas ilustrativas |

Os 23 testes do item 11: arco doloroso, Neer, Hawkins, lata vazia, queda do braço; Phalen, Tinel, Finkelstein, Phalen invertido, Durkan, Allen; Spurling, elevação da perna estendida; FABER, Thomas; gaveta anterior, Lachman, McMurray, estresse em valgo, estresse em varo, Apley (compressão e distração); Thompson.

Três esquemas existem no código, mas não aparecem na interface atual: Eichhoff e Apley por compressão e por distração em separado. Eles também foram ligados ao 3D, para o caso de voltarem.

Contagem. Na aula publicada há 15 grupos de manequim. Na 1.8.0, os 14 que aparecem na interface passaram ao 3D; o grupo restante é o da GALS, cujo manequim a 1.6.1 já não exibia. Na 1.8.1, por decisão sua, três grupos saíram do 3D:

- a capa passou a traço 2D;
- a inspeção estática passou a imagem, com o esquema da 1.6.1 enquanto a imagem não chega;
- Ortolani e Barlow passaram a foto com setas.

## 1.1 Acréscimos da 1.8.1 em telas sem manequim

| Tela | Antes | Agora |
|---|---|---|
| Palpação e derrame (16) | Corte sagital e vista anterior do joelho em esquema | **3D no lugar do corte sagital.** Joelho do Z-Anatomy (fêmur, patela, tíbia, fíbula, cápsula, bolsa suprapatelar, meniscos, gordura de Hoffa, quadríceps em transparência). O líquido cresce nos quatro graus, a patela se afasta do fêmur, e o rechaço e o sinal da onda seguem os botões do slide. <br>**Espaço de imagem no lugar da vista anterior.** Uma imagem por grau (`om70` a `om73`); até chegar, fica o esquema. |
| Anatomia funcional (19), manguito rotador | Esquema do ombro visto de lado | **Atlas 3D ao lado da imagem.** Escápula, clavícula, úmero, supraespinal, infraespinal, redondo menor, subescapular, bolsa subacromial e ligamento coracoacromial. Cada botão destaca a estrutura e escolhe a vista. <br>**Espaço de imagem de atlas:** geral (`om80`), cada músculo (`om81` a `om84`), parte óssea (`om85`). Até chegarem, fica o esquema. |
| Anatomia funcional (19), túnel do carpo | Esquema do corte do punho | **Atlas 3D ao lado da imagem.** Rádio, ulna, ossos do carpo, metacarpos, retináculo dos flexores, flexores superficial, profundo e longo do polegar, bainhas sinoviais (comum, do flexor longo do polegar, do flexor radial do carpo e do 1º compartimento dorsal), nervos mediano e ulnar. <br>**Espaço de imagem de atlas:** `om86`. |

## 2. O que fica fora do 3D, com justificativa

| Situação | O que aparece | Justificativa |
|---|---|---|
| Passagem do pé, "Vista de cima" (só no caso 2) | O esquema da 1.6.1 | Não é manequim. Mostra só as duas trajetórias do pé, as pegadas e o pé de apoio, sem corpo. Uma vista superior do esqueleto inteiro esconderia a curva da circundução, que é o conteúdo da figura. |
| Navegador sem WebGL, ou aula aberta com `?2d` | Os esquemas da 1.6.1 | Sem WebGL não existe cena 3D possível. Essa é a única queda para o esquema, e acontece só por impossibilidade técnica. Equipamento lento não cai para o esquema: a cena reduz a resolução e, se preciso, desliga a pele (seção 5 do relatório). |

## 3. Esquemas que não são manequins (mantidos)

- **Articulações (3):** articulação sinovial em corte e tipos de articulação.
- **Raciocínio da dor (6):** casos e perguntas, sem figura corporal.
- **Marcha, o ciclo (12):** pegadas e linha do tempo do ciclo.
- **Marcha, dor ao apoiar (13):** pegadas e linhas do tempo do apoio.
- **Palpação e derrame (16):** corte sagital e vista anterior do joelho com o derrame.
- **Anatomia funcional (19):**
  - manguito rotador em corte lateral;
  - túnel do carpo em corte;
  - trajeto do nervo isquiático. Esta é uma figura anatômica do nervo, ao lado da animação, que agora é 3D.

As fotografias aprovadas de todas as telas estão preservadas sem alteração.

## 4. Aproximações declaradas na própria cena

Cada uma aparece como etiqueta no canto da cena 3D:

- **Inspeção estática (escoliose, cifose, lordose, discrepância, varo, valgo):** na 1.8.0, aproximadas no esqueleto rígido. Na 1.8.1 saíram do 3D: o tórax rígido não mostrava a curva da coluna.
- **Cúbito varo e valgo:** simulados por angulação no cotovelo. O osso não é deformado.
- **Derrame (1.8.1):** o volume da bolsa suprapatelar, os recessos parapatelares e o afastamento da patela são ilustrativos. As estruturas do joelho são malhas reais do Z-Anatomy, recortadas da região.
- **Atlas (1.8.1):** malhas reais do Z-Anatomy, recortadas da região e simplificadas. Os flexores do punho incluem o ventre muscular na parte proximal do recorte. A artéria ulnar não está no atlas 3D: o canal de Guyon aparece pelo nervo ulnar.
- **Mãos:**
  - os dedos do modelo não têm articulação (Phalen, Phalen invertido, Finkelstein, Durkan, Allen, Maudsley);
  - a mão fechada sobre o polegar não é representada;
  - a palidez da palma no Allen não é representada.
- **Coluna cervical:** um bloco único gira sobre o tórax (Spurling, cifose).
- **Martelo do Tinel:** representado pela seta de percussão.
- **Ortolani e Barlow:** na 1.8.0, esqueleto adulto. Na 1.8.1 saíram do 3D: são as fotos do recém-nascido com setas.
- **Nervo isquiático:** traçado esquemático sobre o esqueleto.
- **Força, grau 2:** a mesa de apoio não é representada.
- **Examinador:** as mãos são mãos do atlas, sem o corpo do examinador. Onde a foto mostra melhor a pegada, ela continua sendo a referência semiotécnica, ao lado da cena.

## 5. Mapa técnico (para manutenção)

| Grupo | Gancho no código compilado | Cena no motor |
|---|---|---|
| Capa (1.8.1) | `window.__loc3dCapa(s, r)` na função de quadro da capa | `aula/capa.js` (2D) e `aula/capa-dados.json` |
| Derrame (1.8.1) | `__loc3d.joelho(s,{grau,rech,ordenha,onda})` no desenho do componente | `atlas.js`, região joelho |
| Anatomia funcional (1.8.1) | `__loc3d.atlas(s,{reg,k})` na seleção de item | `atlas.js`, regiões ombro e punho |
| Espaços de imagem (1.8.1) | Sem gancho: leitura do DOM | `aula/imagens.js`; imagens em `integracao-3d/imagens/` |
| Ortolani e Barlow (1.8.1) | Espaço de imagem já existente na 1.6.1 (`slot-imagens-ddq`) | `aula/ddq.js` (setas) |
| Movimentos | `__loc3d.mov` | `itemMovimento` |
| Ativa × passiva | `__loc3d.ombro` | `itemOmbro` |
| Testes, cotovelo, Lasègue, Ortolani e Barlow | `__loc3d.cena` no reprodutor comum dos esquemas | `cenaTeste(lab, t)` |
| Força | `__loc3d.fig(…,"forca",{grau,t})` no início da função de desenho | `FIGURAS.forca` + `forcaLinha` |
| Pelve | `__loc3d.fig(…,"pelve",{caso,k,pel,tr})` | `FIGURAS.pelve` |
| Passagem do pé | `__loc3d.fig(…,"pe",{s,tipo,vista,m})` | `FIGURAS.pe`, `FIGURAS.contato` |
| Cotovelo (inspeção e palpação) e GALS | Sem gancho: leitura do DOM (`aria-label` e botões pressionados) | `FIGURAS.carga`, `pontos`, `galsPasso`, `galsPerfil` |
