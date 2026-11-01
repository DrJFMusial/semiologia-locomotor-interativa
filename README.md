# Semiologia do Sistema Locomotor · 1.8.1

[Abrir aula](https://drjfmusial.github.io/semiologia-locomotor-interativa/)

Aula web e offline em arquivo único. Modo claro/escuro, apresentação/estudo, anatomia 3D com alternativa automática em esquemas quando WebGL não está disponível. Use ?2d para desativar o motor. Última tela com acessos às aulas cardiovascular, respiratória e abdominal e direitos autorais.

## Construção

Instale as dependências de integracao-3d/motor com npm ci. Execute npm run build na raiz. O script recupera a base aprovada 1.6.1 do commit 97641e8ee9dbd192a4a9d853b4727e622fd4910d, integra o motor e aplica os acabamentos de publicação. Necessita do histórico Git contendo esse commit. Também aceita LOCOMOTOR_BASE_HTML para indicar uma cópia da base. Saídas: index.html, dist/index.html e dist-offline/index.html.

npm test executa os testes de cinemática, geometria e cenas. Modelos e licenças: THIRD_PARTY_NOTICES.md e COPYRIGHT.md.

## Limites desta versão

As 20 imagens dos prompts v6 permanecem pendentes, com esquemas provisórios. As animações são didáticas, não constituem mensuração clínica. A documentação da integração registra aproximações e limitações do atlas. A verificação automatizada usa WebGL por software; desempenho em equipamento de sala deve ser conferido nesse equipamento.
