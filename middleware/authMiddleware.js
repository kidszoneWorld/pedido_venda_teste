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
        console.warn('Usuário não encontrado:', email);
        return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const user = REPRESENTANTES[email];
    const passwordField = getPasswordField(email);

    if (!passwordField) {
        console.warn('Campo de senha não encontrado para:', email);
        return res.status(401).json({ error: 'Tipo de usuário inválido' });
    }

    if (senha !== user[passwordField]) {
        console.warn('Senha incorreta para:', email);
        return res.status(401).json({ error: 'Senha incorreta' });
    }

    req.session.isAuthenticated = true;
    req.session.user = user;
    req.session.userEmail = email;
    req.session.isAdmin = ADMIN_EMAILS.includes(email);

    if (email.startsWith('rep')) {
        req.session.userNumero = user.numero;
    }

    return req.session.save((err) => {
        if (err) {
            console.error('Erro ao salvar sessão:', err);
            return res.status(500).json({ error: 'Erro ao salvar sessão' });
        }

        console.log('Login realizado com sucesso:', email);
        return res.status(200).json({ ok: true });
    });
}

module.exports = {
    authMiddleware,
    adminMiddleware,
    authenticateUser,
    getPasswordField
};