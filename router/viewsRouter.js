const express = require('express');
const path = require('path');
const pdfController = require('../controllers/pdfController');
const orderController = require('../controllers/orderController'); // Importa o controlador
const invoicesController = require('../controllers/invoicesControllers');
const { authMiddleware, authenticateUser } = require('../middleware/authMiddleware');
const inputOrdersController = require('../controllers/inputOrdersControllers');
const eficienciaController = require('../controllers/eficienciaController');
 
 

const fernandoController = require('../controllers/fernandoController');
const clientController = require('../controllers/clientController');
const devController = require('../controllers/devController');
const rebController = require('../controllers/rebController');
const clientePdfController = require('../controllers/clientePdfController');
const pdfInvestComercialController = require('../controllers/pdf_invest_comercialController');
const pdfInvestPromotorController = require('../controllers/pdf_invest_promotorController');
const productController = require('../controllers/productController');
const distribuidorController = require('../controllers/distribuidorController');
const contatoController = require('../controllers/contatoDistribuidorController');
const router = express.Router();
const itemController = require('../controllers/itemController');
const estoqueDistribuidorController = require('../controllers/estoqueDistribuidorController');
const investimentoDistribuidorController = require('../controllers/investimentoDistribuidorController');
const positivacaoDistribuidorController = require('../controllers/positivacaoDistribuidorController')
const redesDistribuidorController = require('../controllers/redesDistribuidorController');
const displayDistribuidorController = require('../controllers/displayDistribuidorController');
const sellOutDistribuidorController = require('../controllers/sellOutDistribuidorController');
const sellInDistribuidorController = require('../controllers/sellInDistribuidorController');
const investPanelController = require('../controllers/investPanelController');

// Rota para a página inicial
router.get('/', authMiddleware, (req, res) => {
    console.log('Rota / acessada');
    res.sendFile(path.resolve(__dirname, '..', 'views', 'index.html'));
});

// Rota para a página de login
router.get('/login', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html'));
});

// Rota para a página de login2
router.get('/login2', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login2.html'));
});

// Rota para a página de devolução
router.get('/devolucao',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'devolucao.html'));
});

router.get('/rebaixa',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'rebaixa.html'));
});

// Rota para a página de administração
router.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'admin.html'));
});

// Rota para a página de pedidos comerciais (comercial.html)
router.get('/comercial', authMiddleware,(req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'comercial.html'));
});

// Rota para a página de detalhes do pedido (detalhes.html)
router.get('/detalhes',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'detalhes.html'));
});

router.get('/devolucaoPanel',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'devolucaoPanel.html'));
});

router.get('/rebaixaPanel',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'rebaixaPanel.html'));
});

// Rota para a página de detalhes do produto (Detalhes_Produtos.html)
router.get('/devolucaoDetalhe.html',authMiddleware, (req, res) => {
  res.sendFile(require('path').join(__dirname, '../views/devolucaoDetalhe.html'));
});

router.get('/rebaixaDetalhe.html',authMiddleware, (req, res) => {
  res.sendFile(require('path').join(__dirname, '../views/rebaixaDetalhe.html'));
});

//Rota para a pagina de detalhes de devoulção
router.get('/detalhesProdutos',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'Detalhes_Produtos.html'));
});
//rota distribuidores, sell pagina inicial
router.get(
    '/distribuidores',
    authMiddleware,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'distribuidores.html'
            )
        );
    }
);

router.get(
    '/session-data',
    authMiddleware,
    (req, res) => {

        const usuario =
            req.session?.user || {};

        return res.json({
            sucesso: true,

            isAuthenticated:
                req.session?.isAuthenticated === true,

            userNumero:
                usuario.numero ||
                req.session?.userNumero ||
                '',

            userNome:
                usuario.nome ||
                req.session?.userNome ||
                '',

            user: {
                id:
                    usuario.id || '',

                email:
                    usuario.email || '',

                nome:
                    usuario.nome ||
                    req.session?.userNome ||
                    '',

                numero:
                    usuario.numero ||
                    req.session?.userNumero ||
                    ''
            }
        });

    }
);

router.get(
    '/displayDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'displayDistribuidor.html'
            )
        );

    }
);
router.get(
    '/investimentoDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'investimentoDistribuidor.html'
            )
        );
    }
);

router.get(
    '/adminItens',
    authMiddleware,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'adminItens.html'
            )
        );

    }
);

router.get(
    '/sellOutDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req,res)=>{

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'sellOutDistribuidor.html'
            )
        );

    }
);

router.get(
    '/positivacaoDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req,res)=>{

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'positivacaoDistribuidor.html'
            )
        );

    }
);
router.get(
    '/sellInDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'sellInDistribuidor.html'
            )
        );

    }
);

router.get(
    '/investDetalhe.html',
    authMiddleware,
    (req, res) => {

        return res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'investDetalhe.html'
            )
        );

    }
);

router.get(
    '/devolucaoEditar.html',
    authMiddleware,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'devolucaoEditar.html'
            )
        );
    }
);

router.get(
    '/api/investimentos-comerciais',
    authMiddleware,
    investPanelController.listarInvestimentos
);

router.get(
    '/api/investimentos-comerciais/:id',
    authMiddleware,
    investPanelController.buscarInvestimentoPorId
);

router.put(
    '/api/investimentos-comerciais/:id/status',
    authMiddleware,
    investPanelController.atualizarStatusInvestimento
);


// Rota para a página de eficiencia cliente (eficiencia.html)
router.get('/eficiencia',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'eficiencia.html'));
});


// Rota para a página de eficiencia cliente (sellOutMenu.html)
router.get('/sellOutMenu',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'sellOutMenu.html'));
});



// Rota para a página de cadastro de sellOut cliente (sellOutCadastro.html)
router.get('/sellOutCadastro',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'sellOutCadastro.html'));
});

// Rota para a página de eficiencia cliente (display.html)
router.get('/display',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'display.html'));
});

// Rota para a página de eficiencia cliente (redes.html)
router.get('/redes',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'redes.html'));
});

// Rota para a página de detalhes do pedido (detalhes.html)
router.get('/logistica',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'logistica.html'));
});

// Rota para a página de detalhes do pedido (detalhes.html)
router.get('/logistica03', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'logisticaFernando.html'));
});

router.get('/logistica02', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'logisticaJoao.html'));
});

router.get('/PainelInvestimento',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'investPanel.html'));
});


router.get(
    '/estoqueDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req,res)=>{

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'estoqueDistribuidor.html'
            )
        );

    }
);

router.get(
    '/redesDistribuidor/:codigoDistribuidor',
    authMiddleware,
    (req,res)=>{

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'redesDistribuidor.html'
            )
        );

    }
);

// Rota para a página (video.html)
router.get('/video',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'video.html'));
});

// Rota para a página (cadastroCliente.html)
router.get('/cadastroCliente',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'cadastroCliente.html'));
});


// Rota para a página (invest.html)
router.get('/investComercial',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'invest_comercial.html'));
});

router.get('/investPromotor',authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'invest_promotor.html'));
});


// Rotas da API de pedidos
router.get('/api/pedidos', orderController.getOrderDetails); // Pedidos com representantes
router.get('/api/pedidos1/:codPedido', orderController.getClientDetailsEndpoint); // Detalhes do pedido por codPedido
router.get('/api/cliente/:api/:cnpj', clientController.getClientDetails); // Detalhes do cliente por cnpj
router.get('/api/cliente1/:cnpj', clientController.getClientDetailsTest); // Detalhes do cliente por cnpj full


// Rotas da API de Logistica
router.get('/api/logistica/onedrive', invoicesController.fetchLogisticsData);
router.get('/api/logistica/logistica03', fernandoController.fetchLogisticsData);
router.get('/api/logistica/logistica02', fernandoController.fetchLogisticsData1);

// salvar
router.post('/api/devolucao', devController.salvarDevolucao);
router.get('/api/devolucao/:id', devController.buscarDevolucaoPorId);

// Devolucao
router.get('/api/devolucoes', devController.listarDevolucoes);
router.put('/devolucao/:id', devController.atualizarDevolucao);

router.put(
    '/api/devolucao/:id/editar',
    authMiddleware,
    devController.editarDevolucaoPendente
);

router.get(
    '/api/itens',
    authMiddleware,
    itemController.listarItens
);

router.post(
    '/api/itens',
    authMiddleware,
    itemController.salvarItem
);

router.get('/cliente/:cnpj', async (req, res) => {

    try {

        const cliente =
            await obterClientePorCnpj(
                req.params.cnpj
            );
            
        const endereco =
            cliente.enderecos?.[0];

        const enderecoFormatado =
            endereco
                ? `${endereco.logradouro || ''}, ${endereco.numero || ''} - ${endereco.bairro || ''}, ${endereco.cidade?.nome || ''}`
                : '';

        const telefoneFormatado =
            cliente.telefone?.numero
                ? `(${cliente.telefone.ddd}) ${cliente.telefone.numero}`
                : '';
     
        res.json({
            razaoSocial:
                cliente.razaoSocial || '',

            endereco:
                enderecoFormatado,

            telefone:
                telefoneFormatado
        });

    } catch (error) {

        console.error(
            'Erro ao consultar cliente:',
            error
        );

        res.status(500).json({
            erro: error.message
        });
    }

});


router.get(
    '/api/itens',
    authMiddleware,
    itemController.listarItens
);

router.put(
    '/api/itens/:codigo',
    authMiddleware,
    itemController.atualizarItem
);

router.post(
    '/api/estoqueDistribuidor/:codigoDistribuidor',
    authMiddleware,
    estoqueDistribuidorController.salvarEstoque
);
router.get(
    '/api/sellOutDistribuidor/:codigoDistribuidor',
    authMiddleware,
    sellOutDistribuidorController.listarSellOut
);
router.post(
    '/api/sellOutDistribuidor/:codigoDistribuidor',
    authMiddleware,
    sellOutDistribuidorController.salvarSellOut
);
router.get(
    '/api/sellInDistribuidor/:codigoDistribuidor',
    authMiddleware,
    sellInDistribuidorController.listarSellIn
);
router.post(
    '/api/sellInDistribuidor/:codigoDistribuidor',
    authMiddleware,
    sellInDistribuidorController.salvarSellIn
);

router.get(
    '/infoDistribuidor/:codigo',
    authMiddleware,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                '..',
                'views',
                'infoDistribuidor.html'
            )
        );

    }
);


router.put(
    '/api/investimentoDistribuidor',
    authMiddleware,
    investimentoDistribuidorController.atualizarInvestimentos
);

router.get(
    '/api/tiposInvestimento',
    authMiddleware,
    investimentoDistribuidorController.listarTiposInvestimento
);

router.post(
    '/api/tiposInvestimento',
    authMiddleware,
    investimentoDistribuidorController.criarTipoInvestimento
);


router.get(
    '/api/displayDistribuidor/:codigoDistribuidor',
    authMiddleware,
    displayDistribuidorController.listarDisplays
);
router.post(
    '/api/displayDistribuidor/:codigoDistribuidor',
    authMiddleware,
    displayDistribuidorController.inserirDisplay
);
router.put(
    '/api/displayDistribuidor',
    authMiddleware,
    displayDistribuidorController.atualizarDisplays
);
router.delete(
    '/api/displayDistribuidor/:codigoDisplay',
    authMiddleware,
    displayDistribuidorController.excluirDisplay
);
router.get(
    '/api/itens-display',
    authMiddleware,
    itemController.listarItensDisplay
);

router.get(
    '/api/positivacaoDistribuidor/:codigoDistribuidor',

    authMiddleware,

    positivacaoDistribuidorController
    .listarPositivacoes
);
router.post(
    '/api/positivacaoDistribuidor/:codigoDistribuidor',

    authMiddleware,

    positivacaoDistribuidorController
    .salvarPositivacao
);


router.get(
    '/api/contatos/:codigoContato',
    authMiddleware,
    contatoController.buscarContato
);

router.put(
    '/api/contatos/:codigoContato',
    authMiddleware,
    contatoController.atualizarContato
);

router.get(
    '/api/itens-ativos',
    authMiddleware,
    itemController.listarItensAtivos
);

router.get(
    '/api/estoqueDistribuidor/:codigoDistribuidor',
    authMiddleware,
    estoqueDistribuidorController.listarEstoqueDistribuidor
);

// salvar Rebaixa
router.post('/api/rebaixa', rebController.salvarRebaixa);
router.get('/api/rebaixa/:id', rebController.buscarRebaixaPorId);

// Rebaixa
router.get('/api/rebaixas', rebController.listarRebaixas);
router.put('/rebaixa/:id', rebController.atualizarRebaixa);





// Rota para página de erro 401 (Senha incorreta)
router.get('/error-401', (req, res) => {
    res.status(401).sendFile(path.join(__dirname, '..', 'views', 'error-401.html'));
});

// Rota para página de erro 404 (Usuário não encontrado)
router.get('/error-404', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'views', 'error-404.html'));
});

//rota listar distribuidores
router.get(
    '/api/distribuidores',
    authMiddleware,
    distribuidorController.listarDistribuidores
);

router.get('/session-test', (req, res) => {
    res.json({
        session: req.session || 'Nenhuma sessão encontrada',
        cookies: req.cookies || 'Nenhum cookie encontrado',
    });
});

// Rota para envio de PDF
router.post('/send-pdf', pdfController.sendPdf);
router.post('/send-pdf-investComercial', pdfInvestComercialController.sendPdf);
router.post('/send-pdf-investPromotor', pdfInvestPromotorController.sendPdf);
router.post('/generate-upload-url', clientePdfController.generateUploadUrl);
router.post('/send-client-pdf', clientePdfController.sendClientPdf);
router.post('/generate-upload-url-dev', devController.generateUploadUrlDev);
router.post('/send-client-pdf-dev', devController.sendClientPdfDev);
router.post('/generate-upload-url-reb', rebController.generateUploadUrlReb);
router.post('/send-client-pdf-reb', rebController.sendClientPdfReb);

//salvar distribuidor
router.post(
    '/api/distribuidores',
    authMiddleware,
    distribuidorController.salvarDistribuidor
);

router.get(
    '/api/distribuidor/:codigo',
    authMiddleware,
    distribuidorController.buscarDistribuidor
);

router.get(
    '/api/distribuidor/:codigo/contatos',
    authMiddleware,
    contatoController.listarContatos
);

router.put(
    '/api/distribuidor/:codigo',
    authMiddleware,
    distribuidorController.atualizarDistribuidor
);

router.post(
    '/api/distribuidor/:codigo/contatos',
    authMiddleware,
    contatoController.salvarContato
);

router.get(
    '/api/investimentoDistribuidor/:codigoDistribuidor',
    authMiddleware,
    investimentoDistribuidorController.listarInvestimento
);

router.post(
    '/api/investimentoDistribuidor/:codigoDistribuidor',
    authMiddleware,
    investimentoDistribuidorController.inserirInvestimento
);

router.delete(
    '/api/contatos/:codigoContato',
    authMiddleware,
    contatoController.excluirContato
);

router.get(

    '/api/redesDistribuidor/:codigoDistribuidor',

    authMiddleware,

    redesDistribuidorController
    .listarRedes

);

router.post(

    '/api/redesDistribuidor/:codigoDistribuidor',

    authMiddleware,

    redesDistribuidorController
    .inserirRede

);

router.put(

    '/api/redesDistribuidor',

    authMiddleware,

    redesDistribuidorController
    .atualizarRede

);

router.delete(

    '/api/redesDistribuidor/:codigoRede',

    authMiddleware,

    redesDistribuidorController
    .excluirRede

);

// Rota para autenticação
router.post('/auth', authenticateUser);

// Rota para Limpar os dados do usuario
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar a sessão:', err);
            return res.status(500).send('Erro ao encerrar a sessão.');
        }
        res.clearCookie('connect.sid'); // Limpa o cookie de sessão
        res.status(200).send('Sessão encerrada com sucesso.');
    });
});

//Rota post para pedidos

router.post('/api/pedidos/input', inputOrdersController.fetchImputOrders)
router.get('/api/lista-preco/:listaId', productController.getListaPreco);
router.get('/api/lista-preco-Sem-Verificar/:listaId', productController.getListaPrecoSemVerificar);


/////banco de dados mogondb atlas

router.get('/api/eficiencia/:codgroup', eficienciaController.getEficienciaBycodgroup);
router.post('/api/eficiencia/salvar', eficienciaController.salvarEficiencia);





router.post('/api/devolucoes', devController.salvarDevolucao);
router.get('/api/devolucoes/:id', devController.buscarDevolucaoPorId);
router.put('/api/devolucoes/:id', devController.atualizarDevolucao);

router.post('/api/rebaixas', rebController.salvarRebaixa);
router.get('/api/rebaixas/:id', rebController.buscarRebaixaPorId);
router.put('/api/rebaixas/:id', rebController.atualizarRebaixa);


let authToken = null;
let tokenExpirationTime = null;

const ngLink = process.env.NG_LINK;
const usuarioDbCorp = process.env.USUARIO_DBCORP;
const senhabCorp = process.env.SENHA_DBCORP;

async function authenticate() {
    const response = await fetch(
        `${ngLink}/identidade-service/autenticar`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://kidszone-ng.dbcorp.com.br'
            },
            body: JSON.stringify({
                usuario: usuarioDbCorp,
                senha: senhabCorp,
                origin: 'kidszone-ng'
            })
        }
    );

    const data = await response.json();

    authToken = data.tokenAcesso;
    tokenExpirationTime =
        Date.now() + (2 * 60 * 60 * 1000);
}

async function ensureAuthenticated() {
    if (
        !authToken ||
        !tokenExpirationTime ||
        Date.now() >= tokenExpirationTime
    ) {
        await authenticate();
    }
}

async function obterClientePorCnpj(cnpj) {

    await ensureAuthenticated();

    const response = await fetch(
        `${ngLink}/pessoa-service/cliente/documento/${cnpj}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                Origin: 'https://kidszone-ng.dbcorp.com.br'
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Erro ao consultar cliente: ${response.status}`
        );
    }

    return await response.json();
}


router.get(
    '/api/catalogo-cliente/:clienteCodigo',
    productController.getCatalogoCliente
);

module.exports = router;
