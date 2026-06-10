const pool = require('../config/database');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}

async function authenticateUser(req, res) {

    try {

        console.log('BODY:', req.body);

        const email = req.body?.email;
        const senha = req.body?.senha;

        if (!email || !senha) {
            return res.status(400).json({
                error: 'Email ou senha ausentes'
            });
        }

        const result = await pool.query(
            `SELECT *
             FROM "TbUsuarios"
             WHERE "UsuEmail" = $1`,
            [email]
        );

        console.log(result.rows);

        if (result.rows.length === 0) {
            return res.status(401).send('Usuário não encontrado');
        }

        const user = result.rows[0];

        console.log('USER:', user);

        // IMPORTANTE:
        // PostgreSQL geralmente retorna lowercase
        const senhaBanco = user.UsuSenha || user.ususenha;

        if (senha !== senhaBanco) {
            return res.status(401).send('Senha incorreta');
        }

        req.session.isAuthenticated = true;

        req.session.user = {
            id: user.UsuId || user.usuid,
            email: user.UsuEmail || user.usuemail,
            nome: user.UsuNome || user.usunome,
            numero: user.UsuNumero || user.usunumero
        };

        return res.redirect('/');

    } catch (error) {

        console.error('ERRO AUTH:', error);

        return res.status(500).json({
            message: error.message,
            stack: error.stack
        });
    }
}

module.exports = {
    authMiddleware,
    authenticateUser
};