> Documento original da etapa experimental. Para a construção e publicação da versão 1.8.1, consulte o README.md e REVISAO_PUBLICACAO_1.8.1.md na raiz do repositório.

# Instruções de publicação futura (não executadas)

Pré-condição: sua aprovação expressa, depois da revisão desta versão experimental.

## Antes de publicar

1. Revisar as capturas e os itens de `RELATORIO_INTEGRACAO.md`, seção "Depende da sua revisão".
2. Abrir `dist/index.html` com duplo clique num notebook de sala e num celular reais. O teste automatizado usou WebGL por software.
3. Se o `index.html` da `main` tiver mudado depois do commit `97641e8`, gerar de novo com `npm run build:aula`. Se algum dos sete ganchos tiver mudado, o script de integração para e avisa.

## Imagens novas

Copie as imagens aprovadas para `integracao-3d/imagens/` com os nomes de `PROMPTS_IMAGENS_v6.md` (PNG ou WEBP; de preferência WEBP, com cerca de 1500 px no lado maior) e gere de novo com `npm run build:aula`. A aula passa a mostrá-las no lugar do esquema.

## Publicação

O repositório publica o `index.html` da raiz pelo GitHub Pages. Publicar a aula integrada significa colocar o conteúdo de `integracao-3d/dist/index.html` no `index.html` da raiz da `main`.

1. Criar uma branch de publicação a partir da `main`:
   ```
   git checkout main && git pull
   git checkout -b publicacao/1.8.1
   ```
2. Trazer a pasta `integracao-3d/` deste ramo e gerar a aula:
   ```
   git checkout experimental/integracao-3d -- integracao-3d
   cd integracao-3d/motor && npm ci && npm test && node test/cenas.test.mjs && npm run build:aula
   ```
3. Copiar o resultado para a raiz, atualizar a versão (`package.json` 1.8.1) e o `CHANGELOG.md`.
4. Rodar a verificação: `node integracao-3d/testes/qa.cjs integracao-3d/dist/index.html <pasta>`.
5. Abrir o pull request para a `main` e conferir a prévia. O merge só acontece com sua aprovação.
6. Depois do merge, conferir a página publicada: capa, movimentos, inspeção estática, marcha, ativa × passiva, força, anatomia funcional, testes (todas as abas), Ortolani e Barlow; tema escuro; modo estudo; celular.

## Reversão

O `index.html` publicado atual (SHA-256 `f5d30685…`) continua na história da `main`. Para voltar à 1.6.1, basta reverter o commit de publicação.

Para desligar o 3D sem republicar, abra a aula com `?2d` no endereço: o motor não é carregado e a aula funciona como a 1.6.1. Esse parâmetro é recurso de contingência, não modo de uso.

## Créditos que entram com a publicação

Modelos derivados do Z-Anatomy (CC BY-SA 4.0), sobre o BodyParts3D (CC BY-SA 2.1 JP). Nesta versão experimental, a atribuição aparece em letra pequena no canto de cada cena 3D. Ela ainda precisa ir para a tela "Referências e créditos" e para o `COPYRIGHT.md`; isso não foi feito agora para não mexer em conteúdo aprovado sem a sua revisão. Proposta de texto: "Modelos anatômicos 3D: Z-Anatomy (CC BY-SA 4.0), derivado de BodyParts3D (CC BY-SA 2.1 JP)."
