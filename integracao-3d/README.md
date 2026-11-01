> Documento original da etapa experimental. Para a construção e publicação da versão 1.8.1, consulte o README.md e REVISAO_PUBLICACAO_1.8.1.md na raiz do repositório.

# Aula de Semiologia do Sistema Locomotor com modelo 3D (experimental, 1.8.1-exp)

Ramo: `experimental/integracao-3d`. A base é a `main` em `97641e8`, a aula 1.6.1 publicada e aprovada.

Nada aqui foi publicado. O `index.html` da raiz deste ramo continua idêntico ao publicado (SHA-256 `f5d30685…`), e o GitHub Pages da `main` não é afetado.

## O que é

É a aula 1.6.1 com os manequins esquemáticos substituídos, no próprio slide, pelo modelo anatômico 3D (Z-Anatomy). Na 1.8.1, por decisão do professor, a capa passou a traço 2D, a inspeção estática passou a imagens, e Ortolani e Barlow passaram a fotos com setas. Entraram ainda o joelho 3D do derrame e o atlas 3D do manguito rotador e do túnel do carpo. O modelo 3D aparece em:

- movimentos e amplitudes;
- pelve e passagem do pé na marcha;
- palpação e derrame (joelho);
- mobilidade ativa × passiva;
- força;
- anatomia funcional: atlas do manguito rotador e do túnel do carpo, e Lasègue;
- os 23 testes especiais;
- cotovelo.

As fotografias, os textos e os comandos aprovados não mudam. Não há botão de volta ao esquema. Sem WebGL, ou com `?2d`, o 3D não carrega e os slides com 3D voltam aos esquemas da 1.6.1; a capa em traço e as fotos de Ortolani e Barlow continuam, porque não dependem de WebGL.

## Documentos

| Arquivo | Conteúdo |
|---|---|
| `docs/RELATORIO_AJUSTES_1.8.1.md` | Ajustes pedidos na revisão da 1.8.0: capa em traço, inspeção estática em imagem, derrame 3D, atlas 3D do manguito e do túnel do carpo, Ortolani e Barlow em foto |
| `docs/PROMPTS_IMAGENS_v6.md` | Prompts das 20 imagens novas (slides 10, 16 e 19) |
| `docs/INVENTARIO.md` | Todos os manequins encontrados, onde cada um foi substituído, o que não é manequim e as aproximações |
| `docs/RELATORIO_SUBSTITUICAO.md` | Módulos convertidos, verificação, capturas e pendências |
| `docs/TECNICO.md` | Construção, peças, comportamento e testes |
| `docs/PUBLICACAO.md` | Instruções de publicação (não executadas) |
| `docs/RELATORIO_INTEGRACAO_1.7.0.md` | Relatório da etapa anterior (só movimentos, ativa × passiva e testes do ombro) |

## Construção rápida

```
cd motor && npm ci && npm test && node test/cenas.test.mjs && npm run build:aula
```

O resultado fica em `dist/index.html`, um arquivo único que funciona na web e offline.

## Créditos

Modelos anatômicos derivados do Z-Anatomy (CC BY-SA 4.0), sobre o BodyParts3D (CC BY-SA 2.1 JP).
