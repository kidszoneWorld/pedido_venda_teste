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

        const senhaBanco =
            user.UsuSenha ||
            user.ususenha;

        if (senha !== senhaBanco) {
            return res.status(401).send('Senha incorreta');
        }

        // AQUI DENTRO
        req.session.isAuthenticated = true;

        req.session.user = {
             id:
                user.UsuId ||
                user.usuid,

            email:
                user.UsuEmail ||
                user.usuemail,

            nome:
                user.UsuNome ||
                user.usunome,

            numero:
                user.UsuNumero ||
                user.usunumero
        
        };

        
        req.session.userNumero =
            user.UsuNumero ||
            user.usunumero;

        return res.redirect('/');
        
    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: error.message
        });
    }
}


module.exports = {
    authMiddleware,
    authenticateUser
};