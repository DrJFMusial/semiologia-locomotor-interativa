# Relatório da integração 3D na aula (experimental, 1.7.0-exp.1)

Data: 31/10/2026. Ramo `experimental/integracao-3d` do repositório `semiologia-locomotor-interativa`, a partir da `main` em `97641e8` (1.6.1 publicada).

Não houve publicação nem merge. A `main` e o GitHub Pages não foram tocados.

## 1. Consolidação da versão de base

Comparei três fontes:
- o repositório publicado (`main`, 1.6.1);
- o pacote-fonte Vite `E2M08_SEMIOLOGIA_LOCOMOTOR_INTERATIVA_v1.6.0.zip`;
- a pasta OSTEOMUSCULAR.

**Achado.** A fonte Vite parou antes das últimas correções aprovadas. Depois do zip, o HTML compilado foi corrigido diretamente em três rodadas:
- **REVISAO_AULA_v1.6.0_CODEX.md:** imagens de Apley, tabela de correções científicas, teclado e vídeos;
- **AJUSTES_AULA_v1.6.0.md:** cotovelo em aba, Hawkins, Finkelstein, GALS, Barlow e Ortolani;
- **1.6.1:** `correcoes-conteudo.js` e `slot-ddq.js`, aplicados por `scripts/build.cjs`.

Recompilar a fonte Vite apagaria essas correções. O HTML publicado tem 49 imagens embutidas; a fonte, 45.

**Decisão.** A base da integração é o `index.html` publicado e aprovado, sem nenhuma alteração de conteúdo. A integração entra do mesmo modo que as correções da 1.6.1: um script aplica mudanças conferidas ao HTML compilado.

O que muda:
1. Três ganchos de uma linha nos componentes que desenham os manequins.
2. Um bloco acrescentado antes de `</body>`: estilo, stub de carregamento e motor.

**Conferência automática.** Desfeitas as inserções, o arquivo volta a ser idêntico byte a byte ao publicado (SHA-256 `f5d30685…`). Assim, textos, referências, fotos, comandos clínicos e imagens aprovadas ficam intactos por construção.

**Pendente, fora do escopo desta etapa.** Levar à fonte Vite as correções feitas direto no HTML, para que a fonte volte a ser a origem da aula.

## 2. O que foi integrado

Detalhes no `INVENTARIO.md`. Em resumo:

| Tela | Antes | Agora | Controles |
|---|---|---|---|
| **Movimentos e amplitudes** (17 movimentos) | Manequim de segmentos rígidos | Modelo 3D do movimento escolhido. No modo Desafio, o 3D executa o movimento sorteado, sem legenda. | Reproduzir e pausar, reiniciar, amplitude (barra), velocidade (1× e 0,5×), vistas anterior, posterior, lateral e superior, câmera (girar e aproximar), pele, goniômetro, destaque, esquema 2D |
| **Mobilidade ativa × passiva** | Manequim frontal | Abdução e rotação externa em 3D. No passivo, as mãos do examinador; faixa de dor sobre o goniômetro. | Os da tela original (paciente, movimento, ativo e passivo), mais vistas, câmera, pele, goniômetro, destaque, esquema 2D |
| **Testes especiais, Ombro:** arco doloroso, Neer, Hawkins, lata vazia, queda do braço | Esquema animado ao lado da foto | 3D no lugar do esquema. A foto aprovada continua ao lado, sem alteração. | O reprodutor original (reproduzir, reiniciar, barra e fases); vistas, câmera, pele, goniômetro, destaque, esquema 2D |

Princípios aplicados:

- **Arquitetura.**
  - O motor é um só: um contexto WebGL, um carregamento dos modelos e um canvas, que passa para a tela visível.
  - Cada componente seleciona o seu item sozinho: o movimento escolhido, o teste aberto, o paciente e o modo.
  - O motor só é carregado quando a primeira tela com 3D aparece. Até então, as telas mostram o esquema 2D.
- **Testes.**
  - O 3D segue a linha do tempo do esquema 2D da aula (mesmas fases, mesma barra), e não uma linha própria. O texto de fase continua correto.
  - A foto continua a referência semiotécnica principal. O botão "Esquema 2D" devolve o esquema aprovado.
- **Dados.**
  - Esqueleto é o modo padrão.
  - A pele é marcada "experimental" nos movimentos com deformação relevante: abdução e flexão do ombro, flexão do quadril e flexão da coluna, além dos testes do ombro.
  - Os parâmetros não medidos aparecem identificados na cena: escápula acima de 120° como extrapolação; extensão do ombro como ilustrativa; plano e rotação final do Hawkins, ângulos da lata vazia e estabilização no Neer como ilustrativos.
- **Pedagogia.** Nenhuma questão ou exemplo incorreto do simulador foi levado à aula. Os modos Explorar e Desafio são os da aula.

## 3. Verificação

Ambiente: Chromium automatizado (Playwright) com WebGL por software (SwiftShader). Resultados em `testes/` e nas capturas.

| Verificação | Resultado |
|---|---|
| 1. A animação corresponde ao conteúdo | Os 17 movimentos e os 5 testes selecionam o item certo (chave do 3D igual à da tela). No percurso automático, 14 dos 17 movimentos chegaram ao máximo da aula pela barra de amplitude. Os outros 3 (flexão do ombro, rotação interna, flexão do joelho) falharam por tempo: o WebGL por software faz 1 a 2 quadros por segundo. Refeitos com esperas maiores, chegaram a 180°, 80° e 130° (`verificacao_lenta.json`). |
| 2. Anatomia | Inspeção das capturas: esqueleto Z-Anatomy, cintura escapular com contato no gradil. Limitações na seção 5. |
| 3. Controles | Reproduzir, pausar, amplitude (90° no meio da barra da abdução), reiniciar, vistas, pele, goniômetro, câmera (arrasto e roda), esquema 2D e volta ao 3D: todos funcionaram. O teste segue o reprodutor original. |
| 4. Navegação | A seta para a direita troca de tela normalmente (a roda sobre o 3D não troca). Fora da tela, 0 quadros 3D em 3 s. Ao voltar, a animação retoma. |
| 5. Modo estudo | 29 seções. O 3D aparece no componente visível; os demais seguem em 2D. Sem rolagem horizontal. |
| 6. Conflitos de CSS e JavaScript | Nenhum erro de execução nem de console nos sete cenários (apresentação, original, estudo, escuro, celular, queda automática, sem WebGL). Estilos com prefixo `l3d-`, usando os tokens da aula. |
| 7. Offline | Nenhuma requisição externa (`file://`); modelos, Three.js e scripts embutidos. |
| 8. Conteúdo aprovado intacto | Conferência byte a byte no build (seção 1). As 5 fotos dos testes do ombro aparecem ao lado do 3D. |
| 9. Sem duplicação | Um módulo do motor e um canvas. Memória da GPU estável ao trocar de tela (35 geometrias e 2 texturas ao fim do percurso). |
| 10. Sem WebGL | Com `?2d` ou sem WebGL, o motor não é carregado e a aula funciona como a 1.6.1. |
| Desempenho insuficiente | Se o 3D cai abaixo de cerca de 8 quadros por segundo, a tela volta sozinha ao esquema 2D, com aviso; "Ver em 3D" força o 3D. No ambiente de teste, a queda ocorreu em 24 s. |
| Tema escuro | Cena, barra e goniômetro seguem os tokens escuros da aula. |
| Celular (390 × 844, toque) | A aula abre em modo estudo, como a 1.6.1. Câmera desligada de início para não prender a rolagem; botão "Câmera" a liga. Sem rolagem horizontal. |

**Desempenho.**
- Tamanho: o HTML integrado tem 21,5 MB, contra 18,2 MB da 1.6.1. O motor tem 3,25 MB (1,55 MB compactado), carregado uma vez.
- No ambiente de teste, sem placa de vídeo, a tela de movimentos roda a cerca de 2 quadros por segundo, contra 35 a 40 do esquema 2D.
- O WebGL por software não representa o notebook nem o celular da sala. A medida em hardware real não foi feita e é a principal pendência técnica antes de qualquer publicação.
- A queda automática para o 2D protege a aula num equipamento fraco.

## 4. Capturas comparativas

Pasta `capturas/` do pacote:
- **Movimentos:** `comparacao_movimentos_*.png`, com o esquema 2D original e o 3D lado a lado, para os 17 movimentos.
- **Testes:** `comparacao_testes_*.png`, com a área do esquema antes e depois, com a foto preservada.
- **Mobilidade ativa × passiva:** `comparacao_ativa_passiva.png`.
- **Outras situações:** estudo, escuro, celular, queda automática para o 2D e região sem 3D (joelho em 2D).

## 5. Limitações anatômicas pendentes

1. **Escápula.** O contato com o gradil reduz a rotação superior em até 15° na abdução e 18° na flexão em relação a Ludewig, a 180°. O ângulo inferior ainda se afasta 12 a 18 mm além do repouso. Acima de 120°, a cinemática é extrapolação, e a tela diz isso.
2. **Nota da aula sobre a abdução.** A nota aprovada diz: "Até cerca de 90° predomina a glenoumeral; acima disso, a escápula gira sobre o tórax". O 3D mostra a escápula participando desde o início, como em Ludewig. A nota não foi alterada; peço a sua decisão.
3. **Pele.**
   - Axila estirada acima de 120°.
   - Virilha na flexão máxima do quadril.
   - Na superfície, o modelo é masculino e as fotos são de mulheres. No modo esqueleto, padrão, isso não aparece.
4. **Testes.**
   - Hawkins: na foto publicada (1.6.1), uma mão da examinadora está sobre o ombro e a outra no antebraço distal. A legenda aprovada diz que ela "sustenta o cotovelo". O 3D segue a legenda: mão sob o braço, junto ao cotovelo. Foto e legenda não coincidem; peço a sua revisão.
   - As mãos do examinador são mãos do atlas, sem corpo do examinador.
   - O braço do Neer sobe sem rotação interna.
   - O plano de 40° e a rotação de 80° do Hawkins, e os ângulos da lata vazia, são ilustrativos.
   - Por isso a foto segue como referência principal.
5. **Desvios do punho.** O goniômetro pede a vista superior, coerente com a mão vista de cima da aula.
6. **Mobilidade ativa × passiva.** O 3D mostra o ângulo de cada paciente com o ritmo escapular normal. A diferença de cinemática na capsulite ou na ruptura do manguito não é modelada; a tela mede amplitude, não padrão de movimento.
7. **Itens já apontados na v0.3.** Os dois textos de plano da aula (rotações do ombro com o braço abduzido; desvios do punho com a palma para baixo) continuam como estão e dependem da sua revisão.

## 6. Depende da sua revisão

1. As capturas comparativas de cada tela.
2. Se a pele deve ficar disponível na aula ou só no esqueleto.
3. A nota sobre a abdução (item 5.2), a foto e a legenda do Hawkins (item 5.4) e os dois textos de plano (item 5.7).
4. O teste em notebook e celular reais.
5. A atribuição Z-Anatomy na tela de referências (`PUBLICACAO.md`).
