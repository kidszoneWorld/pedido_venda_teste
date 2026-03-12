const { writeAuditLog } = require('../utils/auditLogger');
const REPRESENTANTES = require('../public/data/representantes.json');

const ADMIN_EMAILS = [
    "ti.kz@kidszoneworld.com.br",
    "comercial.kz@kidszoneworld.com.br",
    "financeiro.kz@kidszoneworld.com.br",
    "gerencia.kz@kidszoneworld.com.br",
    "logistica.kz@kidszoneworld.com.br",
    "marketing.kz@kidszoneworld.com.br"
];

function getPasswordField(email) {
    if (email === "ti.kz@kidszoneworld.com.br") return "dadoTi";
    if (email === "comercial.kz@kidszoneworld.com.br") return "dadocm";
    if (email === "financeiro.kz@kidszoneworld.com.br") return "dadofn";
    if (email === "gerencia.kz@kidszoneworld.com.br") return "dadogr";
    if (email === "logistica.kz@kidszoneworld.com.br") return "dadolg";
    if (email === "marketing.kz@kidszoneworld.com.br") return "dadolg";
    if (email.startsWith("rep")) return "senha";
    return null;
}

function authMiddleware(req, res, next) {
    console.log('Middleware de autenticação - Sessão:', req.session);

    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    return res.redirect('/login2');
}

function adminMiddleware(req, res, next) {
    if (!req.session || !req.session.isAuthenticated) {
        return res.redirect('/login2');
    }

    if (!req.session.userEmail || !ADMIN_EMAILS.includes(req.session.userEmail)) {
        return res.status(403).send('Acesso negado.');
    }

    return next();
}

function authenticateUser(req, res) {
    const { email, senha } = req.body;

    if (!REPRESENTANTES[email]) {
        writeAuditLog({
            usuario: email,
            acao: 'LOGIN',
            detalhes: 'Usuário não encontrado',
            ip: req.ip,
            sucesso: false
        });

        console.warn('Usuário não encontrado');
        return res.redirect('/error-404');
    }

    const user = REPRESENTANTES[email];
    const passwordField = getPasswordField(email);

    if (!passwordField || senha !== user[passwordField]) {
        writeAuditLog({
            usuario: email,
            acao: 'LOGIN',
            detalhes: 'Tentativa com senha incorreta',
            ip: req.ip,
            sucesso: false
        });

        console.warn('Senha incorreta');
        return res.redirect('/error-401');
    }

    req.session.isAuthenticated = true;
    req.session.user = user;
    req.session.userEmail = email;
    req.session.isAdmin = ADMIN_EMAILS.includes(email);

    if (email.startsWith("rep")) {
        req.session.userNumero = user.numero;
    }

    writeAuditLog({
        usuario: email,
        acao: 'LOGIN',
        detalhes: 'Login realizado com sucesso',
        ip: req.ip,
        sucesso: true
    });

    return req.session.save((err) => {
        if (err) {
            console.error('Erro ao salvar sessão:', err);
            return res.status(500).send('Erro ao salvar sessão.');
        }

        console.log(`Usuário autenticado: ${email}`);
        return res.redirect('/');
    });
}

module.exports = {
    authMiddleware,
    adminMiddleware,
    authenticateUser,
    getPasswordField
};