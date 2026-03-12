const { writeAuditLog } = require('../utils/auditLogger');

const fs = require('fs');
const path = require('path');
const { getPasswordField } = require('../middleware/authMiddleware');

const representantesPath = path.join(__dirname, '..', 'public', 'data', 'representantes.json');

function changePassword(req, res) {

    try {

        if (!req.session || !req.session.isAuthenticated || !req.session.userEmail) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        const { senhaAtual, novaSenha, confirmarSenha } = req.body;
        const email = req.session.userEmail;

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            return res.status(400).json({ error: 'Preencha todos os campos.' });
        }

        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({ error: 'A confirmação da nova senha não confere.' });
        }

        const raw = fs.readFileSync(representantesPath, 'utf8');
        const representantes = JSON.parse(raw);

        const passwordField = getPasswordField(email);

        if (representantes[email][passwordField] !== senhaAtual) {
            return res.status(400).json({ error: 'Senha atual incorreta.' });
        }

        representantes[email][passwordField] = novaSenha;

        fs.writeFileSync(representantesPath, JSON.stringify(representantes, null, 2));

writeAuditLog({
    usuario: email,
    acao: 'ALTERACAO_SENHA',
    detalhes: 'Senha alterada pelo próprio usuário',
    ip: req.ip,
    sucesso: true
});

return res.json({ message: 'Senha alterada com sucesso.' });

    } catch (error) {

        console.error(error);
        return res.status(500).json({ error: 'Erro interno ao alterar senha.' });

    }
}

module.exports = { changePassword };