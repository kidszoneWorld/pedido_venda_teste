const pool = require('../config/database');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}
async function authenticateUser(req, res) {

    try {

        const email = req.body?.email;
        const senha = req.body?.senha;

        if (!email || !senha) {
            return res.status(400).send('Dados inválidos');
        }

        const result = await pool.query(
            `SELECT *
             FROM "TbUsuarios"
             WHERE "UsuEmail" = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).send('Usuário não encontrado');
        }

        const user = result.rows[0];

        console.log('USER:', user);

        // PostgreSQL pode retornar lowercase
        const senhaBanco =
            user.UsuSenha ||
            user.ususenha;

        if (senha !== senhaBanco) {
            return res.status(401).send('Senha incorreta');
        }

        // TESTE SEM SESSION PRIMEIRO
        return res.send('LOGIN OK');

    } catch (error) {

        console.error('ERRO AUTH:', error);

        return res.status(500).json({
            message: error.message,
            stack: error.stack
        });
    }
}

req.session.isAuthenticated = true;

module.exports = {
    authMiddleware,
    authenticateUser
};