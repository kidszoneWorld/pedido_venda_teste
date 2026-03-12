const { readAuditLogs, writeAuditLog } = require('../utils/auditLogger');

const express = require('express');
const path = require('path');
const pdfController = require('../controllers/pdfController');
const orderController = require('../controllers/orderController');
const invoicesController = require('../controllers/invoicesControllers');
const { authMiddleware, adminMiddleware, authenticateUser } = require('../middleware/authMiddleware');
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
const changePasswordController = require('../controllers/changePasswordController');
const adminUsersController = require('../controllers/adminUsersController');
const productController = require('../controllers/productController');

const router = express.Router();

// Rota para a página inicial
router.get('/', authMiddleware, (req, res) => {
    console.log('Rota / acessada');
    res.sendFile(path.resolve(__dirname, '..', 'views', 'index.html'));
});

// Login
router.get('/login', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login.html'));
});

router.get('/login2', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'login2.html'));
});

router.get('/alterar-senha', authMiddleware, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'alterarSenha.html'));
});

// Admin protegido
router.get('/admin', adminMiddleware, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'admin.html'));
});

// Demais páginas protegidas
router.get('/comercial', authMiddleware, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'comercial.html'));
});

router.get('/detalhes', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'detalhes.html'));
});

router.get('/detalhesProdutos', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'Detalhes_Produtos.html'));
});

router.get('/eficiencia', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'eficiencia.html'));
});

router.get('/sellOut', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'sellOut.html'));
});

router.get('/display', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'display.html'));
});

router.get('/redes', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'redes.html'));
});

router.get('/logistica', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'logistica.html'));
});

router.get('/logistica03', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'logisticaFernando.html'));
});

router.get('/logistica02', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'logisticaJoao.html'));
});

router.get('/video', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'video.html'));
});

router.get('/cadastroCliente', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'cadastroCliente.html'));
});

router.get('/investComercial', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'invest_comercial.html'));
});

router.get('/investPromotor', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'invest_promotor.html'));
});

// APIs existentes
router.get('/api/pedidos', orderController.getOrderDetails);
router.get('/api/pedidos1/:codPedido', orderController.getClientDetailsEndpoint);
router.get('/api/cliente/:cnpj', clientController.getClientDetails);
router.get('/api/cliente1/:cnpj', clientController.getClientDetailsTest);

router.get('/api/logistica/onedrive', invoicesController.fetchLogisticsData);
router.get('/api/logistica/logistica03', fernandoController.fetchLogisticsData);
router.get('/api/logistica/logistica02', fernandoController.fetchLogisticsData1);

// Erros
router.get('/error-401', (req, res) => {
    res.status(401).sendFile(path.join(__dirname, '..', 'views', 'error-401.html'));
});

router.get('/error-404', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'views', 'error-404.html'));
});

// Sessão
router.get('/session-data', authMiddleware, (req, res) => {
    res.json({
        userNumero: req.session.userNumero || '',
        isAuthenticated: req.session.isAuthenticated || false,
        user: req.session.user || null,
        userEmail: req.session.userEmail || null,
        isAdmin: req.session.isAdmin || false
    });
});

router.get('/session-test', (req, res) => {
    res.json({
        session: req.session || 'Nenhuma sessão encontrada',
        cookies: req.cookies || 'Nenhum cookie encontrado',
    });
});

// PDF
router.post('/send-pdf', pdfController.sendPdf);
router.post('/send-pdf-investComercial', pdfInvestComercialController.sendPdf);
router.post('/send-pdf-investPromotor', pdfInvestPromotorController.sendPdf);
router.post('/generate-upload-url', clientePdfController.generateUploadUrl);
router.post('/send-client-pdf', clientePdfController.sendClientPdf);

// Auth
router.post('/auth', authenticateUser);

router.post('/api/alterar-senha', authMiddleware, changePasswordController.changePassword);

router.post('/logout', (req, res) => {
    const usuario = req.session?.userEmail || 'desconhecido';

    writeAuditLog({
        usuario,
        acao: 'LOGOUT',
        detalhes: 'Logout realizado',
        ip: req.ip,
        sucesso: true
    });

    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar a sessão:', err);
            return res.status(500).send('Erro ao encerrar a sessão.');
        }
        res.clearCookie('connect.sid');
        res.status(200).send('Sessão encerrada com sucesso.');
    });
});

// Pedidos
router.post('/api/pedidos/input', inputOrdersController.fetchImputOrders);
router.get('/api/lista-preco/:listaId', productController.getListaPreco);

// Mongo
router.get('/api/eficiencia/:codgroup', eficienciaController.getEficienciaBycodgroup);
router.post('/api/eficiencia/salvar', eficienciaController.salvarEficiencia);

router.get('/api/display/:codgroup', displayController.getDisplayBycodgroup);
router.post('/api/display/salvar', displayController.salvarDisplay);
router.delete('/api/display/remover', displayController.removerLinhaDisplay);

router.get('/api/redes/:codgroup', redesController.getRedesBycodgroup);
router.post('/api/redes/salvar', redesController.salvarRedes);
router.delete('/api/redes/remover', redesController.removerLinhaRedes);

router.get('/api/sellOut/:codgroup', sellOutController.getSellOutBycodgroup);
router.post('/api/sellOut/salvar', sellOutController.salvarSellOut);
router.delete('/api/sellOut/remover', sellOutController.removerLinhaSellOut);

// NOVAS ROTAS ADMIN
router.get('/api/admin/representantes', adminMiddleware, adminUsersController.listRepresentantes);
router.post('/api/admin/representantes', adminMiddleware, adminUsersController.createRepresentante);
router.put('/api/admin/representantes/:email', adminMiddleware, adminUsersController.updateRepresentante);
router.put('/api/admin/representantes/:email/senha', adminMiddleware, adminUsersController.updateSenha);
router.get('/auditoria', adminMiddleware, (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'views', 'auditoria.html'));
});
router.get('/api/auditoria', adminMiddleware, (req, res) => {
    const logs = readAuditLogs();
    res.json(logs);
});

module.exports = router;