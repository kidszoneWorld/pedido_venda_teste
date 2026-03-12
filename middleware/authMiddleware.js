const REPRESENTANTES = require('../public/data/representantes.json');

function authMiddleware(req, res, next) {

    console.log('Middleware de autenticação - Sessão:', req.session);
    console.log('Sessão autenticada?', req.session.isAuthenticated);

    if (req.session && req.session.isAuthenticated) {

        console.log('Usuário autenticado:', req.session.user);

        // Usuário autenticado, permitir acesso
        return next();
    }
    // Redirecionar para a página de login caso não esteja autenticado
    console.warn('Usuário não autenticado, redirecionando para login2');
    res.redirect('/login2');
}

function authenticateUser(req, res) {

    const { email, senha } = req.body;

    // Verifica se o e-mail está na lista de representantes
    if (REPRESENTANTES[email]) {
        const user = REPRESENTANTES[email];

        // Valida senha para o usuário "ti.kz" ou demais representantes
        if (
            (email === "ti.kz@kidszoneworld.com.br" && senha === user.dadoTi) ||
            (email === "comercial.kz@kidszoneworld.com.br" && senha === user.dadocm) ||
            (email === "financeiro.kz@kidszoneworld.com.br" && senha === user.dadofn) ||
            (email === "gerencia.kz@kidszoneworld.com.br" && senha === user.dadogr) ||
            (email === "logistica.kz@kidszoneworld.com.br" && senha === user.dadolg) ||
            (email === "marketing.kz@kidszoneworld.com.br" && senha === user.dadolg) ||
            (email.startsWith("rep") && senha === "Repkz@2024")
        ) {
            req.session.isAuthenticated = true;
            req.session.user = user;

            // Se for um representante, salva o número do representante na sessão
            if (email.startsWith("rep")) {
                req.session.userNumero = user.numero;
            }

            console.log(`Usuário autenticado: ${email}`);
            res.redirect("/");
        } else {

             console.warn('Senha incorreta');
              // Redireciona para a página de erro 401
              res.redirect('/error-401');
        }
    } else {

          console.warn('Usuário não encontrado');
           // Redireciona para a página de erro 404
           res.redirect('/error-404');
    }
}

module.exports = { authMiddleware, authenticateUser };
