const pool = require('../config/database');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}

async function authenticateUser(req, res){

    try{

        const email =
            req.body?.email;

        const senha =
            req.body?.senha;

        if(!email || !senha){

            return res
                .status(400)
                .json({
                    message:
                        'E-mail e senha são obrigatórios.'
                });

        }

        const result =
            await pool.query(
                `
                    SELECT *
                    FROM "TbUsuarios"
                    WHERE "UsuEmail" = $1
                `,
                [
                    email
                ]
            );

        if(result.rows.length === 0){

            return res.redirect(
                '/error-404'
            );

        }

        const user =
            result.rows[0];

        const senhaBanco =
            user.UsuSenha ||
            user.ususenha;

        if(senha !== senhaBanco){

            return res.redirect(
                '/error-404'
            );

        }

        const usuarioId =
            user.UsuId ||
            user.usuid ||
            '';

        const usuarioEmail =
            user.UsuEmail ||
            user.usuemail ||
            '';

        const usuarioNome =
            user.UsuNome ||
            user.usunome ||
            '';

        const usuarioNumero =
            user.UsuNumero ||
            user.usunumero ||
            '';

        req.session.isAuthenticated =
            true;

        req.session.user = {
            id:
                usuarioId,

            email:
                usuarioEmail,

            nome:
                usuarioNome,

            numero:
                usuarioNumero
        };

        req.session.userNumero =
            usuarioNumero;

        req.session.userNome =
            usuarioNome;

        req.session.save(error => {

            if(error){

                console.error(
                    'Erro ao salvar a sessão:',
                    error
                );

                return res
                    .status(500)
                    .json({
                        message:
                            'Erro ao salvar a sessão.'
                    });

            }

            return res.redirect('/');

        });

    }catch(error){

        console.error(
            'Erro na autenticação:',
            error
        );

        return res
            .status(500)
            .json({
                message:
                    error.message
            });

    }

}

module.exports = {
    authMiddleware,
    authenticateUser
};