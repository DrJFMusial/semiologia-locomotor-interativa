# Relatório: substituição completa dos manequins pelo modelo 3D (1.8.0-exp)

Data: 01/11/2026. Ramo `experimental/integracao-3d`, sobre a `main` em `97641e8` (1.6.1 publicada). Não houve publicação, push nem merge.

## 1. Resultado

Com WebGL disponível, nenhum manequim esquemático aparece na aula. Os 14 grupos de manequim visíveis na 1.6.1 foram substituídos no próprio slide pelo modelo 3D, sem slide extra, simulador paralelo ou botão de volta ao esquema. São eles:

- capa;
- movimentos e amplitudes;
- inspeção estática;
- pelve na marcha;
- passagem do pé (balanço e contato inicial);
- mobilidade ativa × passiva;
- força;
- elevação da perna estendida na anatomia funcional;
- os 23 testes especiais;
- cotovelo (inspeção, palpação e quatro testes);
- Ortolani e Barlow.

O inventário completo está em `INVENTARIO.md`.

O esquema da 1.6.1 só reaparece em dois casos:

- **Navegador sem WebGL ou aula aberta com `?2d`:** é impossibilidade técnica, não opção de interface.
- **"Vista de cima" da passagem do pé:** a figura não tem corpo, só trajetórias e pegadas, e por isso não é manequim.

Textos, fotografias, comandos e imagens aprovadas não foram alterados. A construção confere que, desfeitas as inserções, o HTML volta a ser idêntico byte a byte ao publicado (SHA-256 `f5d30685…`).

## 2. Módulos convertidos

| Módulo | Como entrou | Controles na cena |
|---|---|---|
| Capa | Gancho na animação original | Nenhum (capa) |
| Movimentos e amplitudes | Gancho (1.7.0) | Reproduzir, reiniciar, amplitude, velocidade, quatro vistas, pele, goniômetro, destaque, câmera |
| Inspeção estática | Leitura das escolhas do slide (vista, situação, prumo, níveis) | Três vistas, pele, câmera |
| Marcha: pelve; passagem do pé | Ganchos nas funções de quadro | Três vistas, pele, câmera; o tempo segue os controles do slide |
| Ativa × passiva | Gancho (1.7.0) | Vistas, pele, goniômetro, destaque, câmera |
| Força 0 a 5 | Gancho no desenho de cada quadro | Três vistas, pele, câmera |
| Testes especiais, cotovelo, Lasègue, Ortolani e Barlow | Gancho no reprodutor comum dos esquemas | Reprodutor do slide; vistas, pele, goniômetro, destaque, câmera |
| Cotovelo: inspeção e palpação | Leitura das escolhas do slide | Três vistas, pele, câmera |

Os controles da cena aparecem só onde servem. A capa não tem nenhum. Nas figuras estáticas ficam vista, pele e câmera. Nos testes, o goniômetro e o destaque se somam ao reprodutor original, que continua mandando no tempo.

Classificação do que a cena mostra, sempre na etiqueta do canto da cena:

- **Medido:** incrementos escapulares de Ludewig até 120° na capa, nos movimentos e nos testes do ombro.
- **Extrapolado:** escápula acima de 120°.
- **Interpolado:** as transições entre as fases de cada esquema (curvas suaves entre os pontos que o esquema define).
- **Ilustrativo:** os demais ângulos e posições, que reproduzem os valores dos esquemas aprovados ou foram escolhidos para mostrar a manobra.

As aproximações anatômicas estão listadas no `INVENTARIO.md`, seção 4.

## 3. Verificação

Ambiente: Chromium automatizado (Playwright) com WebGL por software (SwiftShader), sem placa de vídeo. Resultados em `capturas/qa.json`.

| Teste | Resultado |
|---|---|
| 1. Carregamento | Motor pronto em 19 s no ambiente de teste, com dois navegadores automáticos rodando ao mesmo tempo. A aula funciona antes disso, porque o motor carrega em segundo plano. Durante esse intervalo, a área da figura fica vazia (o esquema já está oculto). Um único canvas. |
| 2. Navegação | As 27 telas percorridas. Em tela sem figura: 0 quadros 3D em 3 s. A seta para a direita avança normalmente a partir da tela de movimentos. |
| 3. Offline | 0 requisições externas (`file://`). |
| 4. Controles | Funcionaram: <br>• reproduzir e pausar; <br>• amplitude (90° no meio da barra da abdução); <br>• vistas lateral e anterior; <br>• pele; <br>• barra do reprodutor de teste (o 3D foi de 10° a 79° ao mover a barra); <br>• foto do teste visível. <br>Não há botão de esquema 2D. <br>O goniômetro foi conferido à parte (`verificacao_goniometro.cjs`): ao desligá-lo, a cena ativa fica sem goniômetro. O teste automático original lia a cópia de imagem guardada da cena anterior e marcou "falso"; o seletor foi corrigido no script. |
| 5. WebGL | Com `?2d` e com o WebGL desligado no navegador, o motor não carrega e os esquemas da 1.6.1 aparecem. Sem erros. |
| 6. Tema escuro | Cena, barra e indicadores seguem os tokens escuros da aula. |
| 7. Modo estudo | 29 seções, sem rolagem horizontal. A figura mais visível fica com o canvas; as outras mostram a última imagem que tiveram. |
| Celular (390 × 844, toque) | Modo estudo, sem rolagem horizontal. A câmera começa presa, para não roubar a rolagem. |
| 8. Conflitos de CSS e JS | 0 erros de execução e de console nos oito cenários. As 64 regras de estilo têm prefixo `l3d`. Globais novas: só `__loc3d`, `__loc3dPronto` e `__loc3dEstado`. |
| 9. Integridade | A conferência de reversibilidade passou. O hash do arquivo gerado confere com `integracao.json`. |
| 10. Substituição em todos os estados | 47 estados com figura corporal percorridos (inventário, seção 1). Em todos: nenhum esquema de manequim visível e a cena 3D presente. Na vista de cima da passagem do pé, o esquema aparece e não tem corpo. |
| Qualidade adaptativa | Sem `?forcar3d`, o WebGL por software caiu ao nível 0 (resolução 0,75, pele desligada). O esquema continuou oculto. |
| Testes do motor | `npm test` (8.691 verificações) e `npm run test:pele` passaram. `test/cenas.test.mjs`: 251 verificações com 0 falhas; toda cena gera pose válida e indicadores finitos. |

## 4. Capturas

Em `capturas/comparacao/` há 47 imagens, uma por estado, com o esquema da 1.6.1 à esquerda e o 3D à direita. Em `capturas/` ficam as situações:

- tema escuro;
- modo estudo;
- celular;
- sem WebGL;
- qualidade reduzida;
- pele.

## 5. Pendências

### Técnicas

1. **Desempenho em hardware real.** O WebGL por software não representa o notebook da sala nem o celular. Medir em equipamento real é a principal pendência antes de publicar.
2. **Tempo até a primeira cena.** Enquanto o motor (3,3 MB) não fica pronto, a área da figura fica vazia por alguns segundos. Em hardware real deve ser mais curto; não foi medido.
3. **Fonte Vite da aula.** Continua defasada em relação ao HTML publicado (pendência herdada da 1.7.0).

### Anatômicas e semiotécnicas

Os limites que o modelo atual impõe estão no inventário, seção 4: tórax rígido, dedos sem articulação, cervical em bloco, esqueleto adulto no Ortolani e no Barlow. Para resolvê-los seriam necessários:

- modelo com coluna torácica articulada;
- mãos articuladas;
- modelo infantil.

Nada disso existe no atlas atual.

Revisão visual que vale fazer:

- **Mãos do examinador:** são mãos do atlas com parte do antebraço. Em Finkelstein, Barlow, Spurling e Cozen, o volume delas pesa na cena. A foto aprovada continua ao lado como referência.
- **Spurling:** ficou em vista lateral, para mostrar a extensão e a compressão. A vista de frente da foto pode ser escolhida no botão.
- **Escoliose e cifose:** são aproximações. O esquema 2D mostrava a curva da coluna, e o 3D não a mostra.
- **Pendências da 1.7.0 que continuam valendo:**
  - nota da abdução;
  - foto × legenda do Hawkins;
  - textos de plano;
  - atribuição Z-Anatomy na tela de créditos.

### Depende da sua revisão

1. As 47 comparações.
2. Se a aproximação da escoliose e da cifose atende ao objetivo do slide.
3. O teste em equipamento real.
4. A autorização para publicar (`PUBLICACAO.md`).
