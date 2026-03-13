const REPRESENTANTES = require('../public/data/representantes.json');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}

function authenticateUser(req, res) {
    const { email, senha } = req.body;

    const user = REPRESENTANTES[email];

    if (!user) {
        console.warn('Usuário não encontrado');
        return res.redirect('/error-404');
    }

    if (senha !== user.senha) {
        console.warn('Senha incorreta');
        return res.redirect('/error-401');
    }

    req.session.isAuthenticated = true;
    req.session.user = {
        email,
        nome: user.nome,
        numero: user.numero || null
    };

    if (email.startsWith('rep')) {
        req.session.userNumero = user.numero;
    }

    console.log(`Usuário autenticado: ${email}`);
    res.redirect('/');
}

module.exports = { authMiddleware, authenticateUser };