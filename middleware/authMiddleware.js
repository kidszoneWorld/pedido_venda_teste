const pool = require('../config/database');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}

async function authenticateUser(req, res) {

    console.log('AUTH INICIOU');

    try {

        console.log('BODY:', req.body);

        const { email, senha } = req.body;

        console.log('EMAIL:', email);

        const result = await pool.query('SELECT NOW()');

        console.log('DB OK:', result.rows);

        return res.json({
            ok: true,
            body: req.body,
            db: result.rows
        });

    } catch (error) {

        console.error('ERRO REAL:', error);

        return res.status(500).json({
            ok: false,
            message: error.message,
            stack: error.stack,
            code: error.code
        });
    }
}

module.exports = {
    authMiddleware,
    authenticateUser
};