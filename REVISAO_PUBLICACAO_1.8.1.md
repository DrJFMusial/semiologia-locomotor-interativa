# Revisão e publicação da aula de Semiologia do Sistema Locomotor 1.8.1

Data: 01/11/2026. Arquivo recebido: AULA_OFFLINE_Semiologia_Locomotor_v1.8.1-exp3d.html. Base aprovada: 1.6.1, commit 97641e8ee9dbd192a4a9d853b4727e622fd4910d, SHA-256 f5d30685f0e94a524419f6a0a1dc6c1af6b4aa7df4eec414d4af4890fbd8350b. Publicação solicitada expressamente pelo professor nesta conversa.

## Avaliação e ajustes

A versão recebida mantém a base validada e acrescenta a integração anatômica. A revisão desta rodada se concentra nessas alterações e na publicação; não equivale à validação clínica independente de cada contato manual dos modelos.

- Mantidos os movimentos 3D, marcha, ativa × passiva, força, derrame, atlas de ombro e punho e testes especiais. Capa em contornos 2D, inspeção estática com esquemas provisórios e sequência fotográfica de Ortolani/Barlow do pacote recebido.
- Tema escuro preservado com persistência local; contraste das setas, controles e legendas 3D ajustado. Cenas estáticas redesenham após trocar o tema. Setas sobre fotografias brancas mantêm cores de contraste próprio em ambos os temas.
- Última página com links para cardiovascular, respiratória e abdominal em novas abas, autoria, direitos autorais e diálogo de condições de utilização.
- Créditos Z-Anatomy/BodyParts3D nas referências e no diálogo de direitos, com declaração das adaptações e preservação da licença CC BY-SA 4.0. Avisos de terceiros e licença MIT do Three.js incluídos no repositório. A atribuição e a licença foram conferidas na fonte: https://github.com/LluisV/Z-Anatomy/blob/PC-Version/Resources/Models/License.txt.
- Incluídas nas referências as fontes de cinemática já utilizadas pelo motor: Ludewig et al., 2009, DOI 10.2106/JBJS.G.01483; Wu et al., 2005, DOI 10.1016/j.jbiomech.2004.05.042. Dados bibliográficos conferidos no portal da Universidade de Minnesota e PubMed/ISB.
- Retirada a seta de pressão posterior em Barlow. Ela contrariava a legenda aprovada e a recomendação AAP 2016, já citada na aula: adução suave, sem força posterior. Fonte: https://publications.aap.org/pediatrics/article-abstract/138/6/e20163107/52541.
- Versão da aplicação e projeto: 1.8.1. Arquivo experimental recebido preservado. Construção com base fixa no histórico Git para não integrar novamente sobre um HTML já integrado.

## Verificação executada

- 8.691 verificações de cinemática aprovadas; geometria com interpenetração máxima de 1%, abaixo do critério computacional de alerta de 5%; 251 verificações de 23 cenas sem falhas. Esses números verificam o modelo computacional, não comprovam equivalência clínica.
- 62 estados com figuras percorridos: 54 com 3D, cinco de postura com esquema provisório, capa em traço e duas sequências de quadril neonatal. Nenhum estado com falha.
- 336 estados de slides em 1280×720, 1920×1080 e 390×844, apresentação e estudo, claro e escuro. Sem transbordamento ou imagens quebradas.
- Zero erros JavaScript e zero requisições externas no teste offline.
- Barra de amplitude com 90° ao meio; tema dark armazenado e recuperado após recarga; diálogo de direitos abre e fecha; três links finais com target _blank e rel noopener noreferrer.
- Contingência ?2d: motor não carrega e esquemas permanecem visíveis.
- Capturas revistas: capa, movimentos, derrame volumoso, manguito, carpo, Finkelstein, Barlow, referências e encerramento, incluindo tema escuro e celular.
- Geração mantém os nove ganchos únicos e confere reversibilidade da integração à base aprovada antes dos acabamentos de publicação.

## Pendências preservadas

As 20 imagens dos prompts v6 ainda não constam no pacote; os esquemas provisórios seguem visíveis. Não foram geradas nem substituídas nesta rodada. A artéria ulnar não faz parte do recorte 3D de Guyon. Líquido, afastamento da patela, deformação de pele e contatos manuais são representações didáticas, com aproximações documentadas na integração. O teste automatizado utiliza WebGL por software; desempenho em notebook de sala e celular físicos não foi medido nesta rodada.

Os PDFs dos livros, ZIPs de pesquisa, vídeos sem procedência definida e dependências node_modules não são enviados ao repositório.
