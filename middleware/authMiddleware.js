const pool = require('../config/database');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}

async function authenticateUser(req, res) {
    try {
        const { email, senha } = req.body;

        // Busca usuário no PostgreSQL
        const result = await pool.query(
            `SELECT * 
             FROM "TbUsuarios" 
             WHERE "UsuEmail" = $1`,
            [email]
        );

        // Verifica se encontrou usuário
        if (result.rows.length === 0) {
            console.warn('Usuário não encontrado');
            return res.redirect('/error-404');
        }

        const user = result.rows[0];

        // Verifica senha
        const user = result.rows[0];

        console.log('USER:', user);

        if (senha !== user.ususenha) {
            console.warn('Senha incorreta');
            return res.redirect('/error-401');
        }

        // Cria sessão
        req.session.isAuthenticated = true;

        req.session.user = {
            id: user.usuid,
            email: user.usuemail,
            nome: user.usunome,
            numero: user.usunumero || null
        };

        // Caso queira manter essa lógica
        if (email.startsWith('rep')) {
            req.session.userNumero = user.UsuNumero;
        }

        console.log(`Usuário autenticado: ${email}`);

        res.redirect('/');

    } catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        res.status(500).send('Erro interno do servidor');
    }
}

module.exports = {
    authMiddleware,
    authenticateUser
};