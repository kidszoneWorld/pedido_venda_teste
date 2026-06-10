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

        console.log('EMAIL:', email);

        const result = await pool.query(
            'SELECT NOW()'
        );

        console.log(result.rows);

        return res.json({
            ok: true,
            db: result.rows
        });

    } catch (error) {

        console.error('ERRO DB:', error);

        return res.status(500).json({
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