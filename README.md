Introdução

Esta documentação tem como objetivo apresentar de forma clara e organizada todas as informações necessárias para o entendimento, utilização e manutenção do site. Aqui você encontrará detalhes sobre a estrutura do projeto, funcionalidades disponíveis, requisitos técnicos, além de orientações para usuários, desenvolvedores e equipes de suporte.

O conteúdo foi elaborado para servir como referência tanto para consultas rápidas quanto para aprofundamento técnico, garantindo que o site possa ser operado, atualizado e evoluído de maneira eficiente e segura.

Recomenda-se a leitura completa desta documentação antes de realizar qualquer alteração no sistema, a fim de evitar inconsistências, falhas de funcionamento ou impactos indesejados na experiência do usuário.

Este site tem como objetivo ser uma plataforma que permita o envio de pedidos dos representantes para o sistema ERP por meio de APIs do DBCorp e também conta com páginas para verificar informações dos pedidos enviados, verificar status de pedido, verificar detalhes de um produto, solicitar cadastro de clientes e solicitar investimentos

Para este site foram utilizados node com javascript e HTML, não contendo um banco de dados próprio, mas, consultando e inclundo dados via API em um banco de dados SQL.
O versionamento do site é controlado apenas pela branch main do site do github sendo hospedado na VERCEL.

Estrutura do projeto:

/pedido-de-venda-producao
|-/controllers
|   |-ClientController.js
|   |-clientePdfController.js
|   |-displayController.js
|   |-eficienciaController.js
|   |-fernandoController.js
|   |-inputOrdersController.js
|   |-invoicesController.js
|   |-orderController.js
|   |-pdf_invest_comercialController.js
|   |-pdf_invest_promotorController.js
|   |-pdfController.js
|   |-productController.js
|   |-redesController.js
|   |-sellOutController.js
|-/middleware
|   |-authMiddleware.js
|-/models
|   |-/Display
|       |-Display.js
|   |-/Redes
|       |-Redes.js
|   |-/SellOut
|       |SellOut2.js
|   |-Cliente.js
|   |-Investimentos.js
|   |-Mercado.js
|   |-Positicacao,js
|   |-Sellin.js
|   |-sellOut.js
|-/public
|   |-/css
|       |-cadastroCliente.css
|       |-comercial.css
|       |-detalhes.css
|       |-detalhesProdutos.css
|       |-display.css
|       |-eficiencia.css
|       |-invest_comercial.css
|       |-invest_promotor.css
|       |-login2.css
|       |-logistica.css
|       |-sellOut.css
|       |-styles2.css
|       |-theme-toggle.css
|       |-video.css
|   |-/data
|       |-/data_teste
|           |-apiCliente.json
|           |-cliente_rep.json
|           |-fetchOrdersWithRepresentatives.json
|           |-id_pedido_venda.json
|           |-notas_fiscais.json
|           |-pedido_com_transportadora.json
|           |-pedido_detalhes_representante.json
|           |-pedido_venda.json
|           |-planilha_logistica.json
|           |-transportadora.json
|       |-cliente.json
|       |-Config.json
|       |-detalhesProdutos.json
|       |-fora de linha.json
|       |-ICMS-ST.json
|       |-img_produtos.json
|       |-item_ativos_detalhes.json
|       |-Lista-precos.json
|       |-Promocao.json
|       |-representantes.json
|   |-/imagens
|       |-android-chrome-192x192.png
|       |-apple-touch-icon.png
|       |-background.jpg
|       |-erro-401.jpg
|       |-erro-404.jpg
|       |-excel.png
|       |-favicon-16x16.png
|       |-favicon-32x32.png
|       |-favicon.ico
|       |-logo.png
|       |-site.webmanifest
|       |-whatsapp.png
|   |-/video
|       |-manual_site2.pdf
|       |-pedido-venda2.mp4
|   |-acess.js
|   |-cadastroCliente.js
|   |-comercial.js
|   |-detalges-item-ativos.xlsx
|   |-detalhes.js
|   |-detalhesProdutos.js
|   |-display.js
|   |-eficiencia.js
|   |-invest_comercial.js
|   |-invest_promotor.js
|   |-logistica.js
|   |-logistica02.js
|   |-logistica03.js
|   |-pdf_invest_comercial.js
|   |-pdf_invest_promotor.js
|   |-pdf.js
|   |-redes.js
|   |-script.js
|   |-sellOut.js
|   |-theme-toggle.js
|   |-video.js
|-/router
|   |-viewsRouter.js
|-/utils
|   |-apiForm.js
|   |-apiLogisticaFernando.js
|   |-apiService_backup.txt
|   |-apiService.js
|   |-apiServiceLogistica.js
|   |-apiServicerInput.js
|   |-aptService_backup2.txt
|   |-backup_apiServiceLogistica.txt
|   |-comercial_backup_2.txt
|   |-comercial_backup.txt
|   |-danfe_simplificada.txt
|   |-htm_backup.txt
|   |-javascript_backup.txt
|-/views
|   |-admin.html
|   |-cadastroCliente.html
|   |-comercial.html
|   |-Detalhes dos produtos.html
|   |-detalhes.html
|   |-display.html
|   |-eficiencia.html
|   |-error-401.html
|   |-error-404.html
|   |-index.html
|   |-invest_comercial.html
|   |-invest_promotor.html
|   |-login.html
|   |-login2.html
|   |-logistica.html
|   |-logisticaFernando.html
|   |-logisticaJoao.html
|   |-redes.html
|   |-sellOut.html
|   |-test.html
|   |-video.html
|-.env
|-.gitattributes
|-.gitignore
|-add-cache-bust.js
|-app.js
|-package-lock.json
|-package.json
|-README.md
|-vercel.json

Requisitos:
conexão com a internet (obrigatorio :)

Variáveis de Ambiente:
GMAIL_USER - endereço de email para envio de E-mails
GMAIL_APP_PASSWORD - Senha criptografada do email

GMAIL_USER1 - endereço de email para envio de E-mails
GMAIL_APP_PASSWORD1- Senha criptografada do email

PASSWORD_KZ - Senha do site da area de TI

TENANTID - id sharepoint Sul e sudeste
CLIENTID - id Cliente sharepoint Sul e sudeste
CLIENTSECRET - Id Secreto Sharepoint Sul e sudeste

TENANTID1 - id sharepoint Norte, Nordeste e Centro-Oeste (Fernando)
CLIENTID1 - id Cliente sharepoint  Norte, Nordeste e Centro-Oeste (Fernando)
CLIENTSECRET1 - Id Secreto Sharepoint  Norte, Nordeste e Centro-Oeste (Fernando)

MONGO_URI - Não faço ideia, mas foi descontinuado (momentáriamente)

ARQUITETURA


Rotas
Rotas publicas

Rotas protegidas

estrutura Front-end

Estrutura do Back-end

integrações
(apis)

Banco de dados

autenticação e autorização
(como funciona as autenticações e fluxos de login)

Segurança (proteções implementadas)

Testes (tipos de testes e ferramentas)

Logs e Monitoramento

Deploy(homologação e produção com passo a passo de publicação)

Manutenção e Boas práticas (Padrões)
(versionamento)

Problemas Conhecidos e planos para o futuro
- adicionar campo de estoque no pedido de item 
- adicionar funcionalidade para observar a nota na Área Comercial semelhante aos detalhes

Histórico de Versões

Contato e suporte
