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

        return res.json({
            ok: true,
            email,
            senha
        });

    } catch (error) {

        console.error('ERRO REAL:', error);

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