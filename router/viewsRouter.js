const express = require('express');
const path = require('path');
const pdfController = require('../controllers/pdfController');
const orderController = require('../controllers/orderController'); // Importa o controlador
const invoicesController = require('../controllers/invoicesControllers');
const { authMiddleware, authenticateUser } = require('../middleware/authMiddleware');
const { 
  apiLongTimeout, 
  apiStandardTimeout, 
  apiExtendedTimeout,
  pageTimeout, 
  pdfTimeout, 
  authTimeout,
  vercelCriticalTimeout 
} = require('../middleware/timeoutMiddleware');
const inputOrdersController = require('../controllers/inputOrdersControllers');
const eficienciaController = require('../controllers/eficienciaController');
const displayController = require('../controllers/displayController');  
const redesController = require('../controllers/redesController');  
const sellOutController = require('../controllers/sellOutController');
const fernandoController = require('../controllers/fernandoController');
const clientController = require('../controllers/clientController');
const clientePdfController = require('../controllers/clientePdfController');
const pdfInvestComercialController = require('../controllers/pdf_invest_comercialController');
const pdfInvestPromotorController = require('../controllers/pdf_invest_promotorController');

const router = express.Router();

// Rota para a página inicial
router.get('/', authMiddleware, pageTimeout, (req, res) => {
    console.log('Rota / acessada');
    res.sendFile(path.resolve(__dirname, '..', 'views', 'index.html'));
});

// Rota para a página de login
router.get('/login', pageTimeout, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html'));
});

// Rota para a página de login2
router.get('/login2', pageTimeout, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login2.html'));
});

// Rota para a página de administração
router.get('/admin', pageTimeout, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'admin.html'));
});

// Rota para a página de pedidos comerciais (comercial.html)
router.get('/comercial', authMiddleware, pageTimeout, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'comercial.html'));
});

// Rota para a página de detalhes do pedido (detalhes.html)
router.get('/detalhes', authMiddleware, pageTimeout, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'detalhes.html'));
});

// Rota para a página de detalhes do produto (Detalhes_Produtos.html)
router.get('/detalhesProdutos',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'Detalhes_Produtos.html'));
});

// Rota para a página de eficiencia cliente (eficiencia.html)
router.get('/eficiencia',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'eficiencia.html'));
});

// Rota para a página de eficiencia cliente (sellOut.html)
router.get('/sellOut',authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'sellOut.html'));
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
router.get('/api/pedidos', vercelCriticalTimeout, orderController.getOrderDetails); // Pedidos com representantes
router.get('/api/pedidos1/:codPedido', apiStandardTimeout, orderController.getClientDetailsEndpoint); // Detalhes do pedido por codPedido
router.get('/api/cliente/:cnpj', apiStandardTimeout, clientController.getClientDetails); // Detalhes do cliente por cnpj
router.get('/api/cliente1/:cnpj', vercelCriticalTimeout, clientController.getClientDetailsTest); // Detalhes do cliente por cnpj full


// Rotas da API de Logistica
router.get('/api/logistica/onedrive', vercelCriticalTimeout, invoicesController.fetchLogisticsData);
router.get('/api/logistica/logistica03', vercelCriticalTimeout, fernandoController.fetchLogisticsData);
router.get('/api/logistica/logistica02', vercelCriticalTimeout, fernandoController.fetchLogisticsData1);



// Rota para página de erro 401 (Senha incorreta)
router.get('/error-401', (req, res) => {
    res.status(401).sendFile(path.join(__dirname, '..', 'views', 'error-401.html'));
});

// Rota para página de erro 404 (Usuário não encontrado)
router.get('/error-404', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'views', 'error-404.html'));
});


// Rota para enviar os dados da sessão para o front-end
router.get('/session-data', authMiddleware, (req, res) => {
    res.json({
        userNumero: req.session.userNumero || '',
        isAuthenticated: req.session.isAuthenticated || false,
        user: req.session.user || null,
    });
});


router.get('/session-test', (req, res) => {
    res.json({
        session: req.session || 'Nenhuma sessão encontrada',
        cookies: req.cookies || 'Nenhum cookie encontrado',
    });
});

// Rota para envio de PDF
router.post('/send-pdf', pdfTimeout, pdfController.sendPdf);
router.post('/send-client-pdf', pdfTimeout, clientePdfController.sendClientPdf);
router.post('/send-pdf-investComercial', pdfTimeout, pdfInvestComercialController.sendPdf);
router.post('/send-pdf-investPromotor', pdfTimeout, pdfInvestPromotorController.sendPdf);


// Rota para autenticação
router.post('/auth', authTimeout, authenticateUser);

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

router.post('/api/pedidos/input', vercelCriticalTimeout, inputOrdersController.fetchImputOrders)


/////banco de dados mogondb atlas

router.get('/api/eficiencia/:codgroup', apiStandardTimeout, eficienciaController.getEficienciaBycodgroup);
router.post('/api/eficiencia/salvar', apiStandardTimeout, eficienciaController.salvarEficiencia);

router.get('/api/display/:codgroup', apiStandardTimeout, displayController.getDisplayBycodgroup);
router.post('/api/display/salvar', apiStandardTimeout, displayController.salvarDisplay);
router.delete('/api/display/remover', apiStandardTimeout, displayController.removerLinhaDisplay);

router.get('/api/redes/:codgroup', apiStandardTimeout, redesController.getRedesBycodgroup);
router.post('/api/redes/salvar', apiStandardTimeout, redesController.salvarRedes);
router.delete('/api/redes/remover', apiStandardTimeout, redesController.removerLinhaRedes);


router.get('/api/sellOut/:codgroup', apiStandardTimeout, sellOutController.getSellOutBycodgroup);
router.post('/api/sellOut/salvar', apiStandardTimeout, sellOutController.salvarSellOut);        
router.delete('/api/sellOut/remover', apiStandardTimeout, sellOutController.removerLinhaSellOut);



module.exports = router;
