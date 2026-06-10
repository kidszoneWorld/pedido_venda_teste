const pool = require('../config/database');

function authMiddleware(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }

    res.redirect('/login2');
}

async function authenticateUser(req, res) {

    console.log('ROTA CHAMADA');

    console.log('BODY:', req.body);

    return res.json({
        ok: true,
        body: req.body
    });
}

module.exports = {
    authMiddleware,
    authenticateUser
};