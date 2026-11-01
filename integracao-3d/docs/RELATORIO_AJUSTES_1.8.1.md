# Relatório dos ajustes 1.8.1-exp (sobre a 1.8.0-exp)

Data: 01/11/2026. Ramo `experimental/integracao-3d`. Não houve publicação, push nem merge. O `index.html` da raiz continua o publicado (SHA-256 `f5d30685…`).

## 1. O que mudou, slide a slide

| Slide | Pedido | Feito |
|---|---|---|
| 1 Capa | Sem 3D; animação 2D estilizada, integrada ao slide, sem exagero | **Traço de esqueleto.** Contornos reais dos ossos do atlas, vista anterior. O braço direito faz a abdução com a mesma cinemática do motor, e a escápula gira sobre o tórax. <br>**Arcos.** Um arco de 0° a 180° com marcas a cada 10° e um arco-eco discreto atravessam o slide por trás do título. O raio acompanha o úmero. <br>**Texto.** O texto de fase aprovado segue abaixo da figura. <br>**Tecnologia.** Não usa WebGL. |
| 10 Inspeção estática | Cifose e lordose não apareciam na coluna; trocar o 3D por imagens e deixar aberto | **3D removido.** <br>**Espaços de imagem.** Um por situação, nove ao todo (`om60` a `om68`). Até as imagens chegarem, aparece o esquema aprovado da 1.6.1. Quando a imagem entra, a aula desenha sobre ela o fio de prumo e as linhas de nível, em posições fixadas pelo enquadramento dos prompts. <br>**Prompts.** Em `PROMPTS_IMAGENS_v6.md`. |
| 16 Palpação e derrame | Melhorar a animação com o 3D; imagens ilustrativas dos graus | **Corte sagital.** Passou a ser um joelho 3D com malhas reais (fêmur, patela, tíbia, fíbula, cápsula, bolsa suprapatelar, meniscos, gordura de Hoffa, quadríceps em transparência). Nos quatro graus, a bolsa e os recessos se enchem e a patela se afasta do fêmur. <br>**Botões do slide.** "Rechaçar a patela" leva a patela de volta ao fêmur, com seta e "toque!" nos graus moderado e volumoso, como no esquema. "Ordenhar" e "Percutir" mostram o recesso medial esvaziando e voltando a abaular. <br>**Vista anterior.** Virou espaço de imagem, uma por grau (`om70` a `om73`). <br>**Prompts.** Em `PROMPTS_IMAGENS_v6.md`. |
| 19 Anatomia funcional | Imagem de atlas do manguito (geral, cada músculo, parte óssea) e, ao lado, atlas 3D; túnel do carpo com uma imagem e 3D de bainhas e nervos | **Manguito.** Espaço de imagem (`om80` a `om85`) e, ao lado, atlas 3D: escápula, clavícula, úmero, os quatro músculos, bolsa subacromial e ligamento coracoacromial. Cada botão destaca a estrutura na cor do atlas e escolhe a vista. <br>**Túnel do carpo.** Espaço de imagem (`om86`) e atlas 3D: ossos do carpo e metacarpos, retináculo dos flexores, flexores superficial, profundo e longo do polegar, bainhas sinoviais e nervos mediano e ulnar. <br>**Nervo isquiático.** Sem mudança. <br>**Prompts.** Em `PROMPTS_IMAGENS_v6.md`. |
| 21 Barlow e Ortolani | Sem 3D; só as imagens dos bebês, com setas | **Fotos.** O esquema e o 3D saíram. Ficaram as três fotos (`om50`, `om51`, `om52`), que estavam como rascunho em `IMAGENS_GERADAS_v5` e foram escolhidas por você. Elas trocam conforme a fase do reprodutor do slide. <br>**Setas sobre a foto.** <br>• Ortolani: abdução suave e elevação do trocanter. <br>• Barlow: adução leve e pressão suave no eixo do fêmur. <br>• Nas duas: contorno da mão que estabiliza a pelve. |

Os demais slides com 3D (movimentos, marcha, ativa × passiva, força, testes especiais, cotovelo) continuam como na 1.8.0.

**Fonte dos modelos.** Os modelos do atlas vêm dos arquivos do Z-Anatomy (CC BY-SA 4.0, sobre BodyParts3D). São malhas reais, recortadas da região e simplificadas, sem desenho próprio. Somam 360 kB comprimidos.

## 2. Verificação

Ambiente: Chromium automatizado com WebGL por software, como antes. Resultados em `capturas/qa.json`.

| Teste | Resultado |
|---|---|
| Carregamento | Motor e atlas prontos em 6 s neste ambiente; um canvas |
| Navegação | 27 telas. Fora das telas com 3D: 0 quadros em 3 s. A seta para a direita avança. |
| Offline | 0 requisições externas |
| Controles | Todos funcionaram: reproduzir e pausar, amplitude (90° no meio da barra), vistas, goniômetro (desliga), pele e barra do teste. A foto do teste fica visível. Não há botão de esquema 2D. |
| Estados com figura | 62 estados percorridos, todos dentro do esperado: <br>• 54 em 3D: incluem os 4 graus de derrame e os 11 itens do atlas; <br>• 5 da inspeção estática com o esquema provisório; <br>• a capa em traço; <br>• os 2 de Ortolani e Barlow em foto com setas. <br>Nenhum manequim visível onde o 3D, o traço ou a foto o substituem. |
| Espaços de imagem | Uma imagem de teste, injetada durante a verificação, substituiu o esquema e trouxe o fio de prumo. Sem ela, o esquema voltou. |
| Qualidade adaptativa | Em WebGL por software, caiu ao nível 0, sem voltar a manequim |
| Sem WebGL (`?2d` e WebGL desligado) | Motor não carrega. A capa em traço e as fotos de Ortolani e Barlow funcionam, porque não dependem de WebGL. |
| Erros | 0 em todos os cenários |
| Motor | `npm test` e as 251 verificações de `cenas.test.mjs` passaram |

Comparações antes e depois dos slides alterados estão em `capturas/comparacao_1.8.1/`.

## 3. Pendências

1. **Imagens.** As 20 imagens de `PROMPTS_IMAGENS_v6.md`. Até chegarem, os slides 10, 16 e 19 mostram o esquema da 1.6.1 no espaço da imagem.
2. **Fotos de Ortolani e Barlow.** Continuam sendo as v5 marcadas como rascunho. A posição das setas foi feita sobre elas. Se forem refeitas com o mesmo enquadramento, as setas continuam servindo; se o enquadramento mudar, eu reposiciono.
3. **Derrame.** O volume de líquido e o afastamento da patela são ilustrativos. A cápsula do atlas aparece sem a deformação do grau volumoso.
4. **Atlas.**
   - A artéria ulnar não entrou no 3D do canal de Guyon (está no sistema cardiovascular do Z-Anatomy, um arquivo de 65 MB); por enquanto o canal de Guyon aparece pelo nervo ulnar.
   - Os flexores do punho mostram parte do ventre muscular no recorte.
5. **Hardware real.** O teste em notebook e celular reais continua pendente, como na 1.8.0.
