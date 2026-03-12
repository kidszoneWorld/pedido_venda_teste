const fs = require('fs');
const path = require('path');

const representantesPath = path.join(__dirname, '..', 'public', 'data', 'representantes.json');

function readRepresentantes() {
    const raw = fs.readFileSync(representantesPath, 'utf8');
    return JSON.parse(raw);
}

function saveRepresentantes(data) {
    fs.writeFileSync(representantesPath, JSON.stringify(data, null, 2), 'utf8');
}

function listRepresentantes(req, res) {
    try {
        const data = readRepresentantes();

        const representantes = Object.entries(data)
            .filter(([email]) => email.startsWith('rep'))
            .map(([email, info]) => ({
                email,
                nome: info.nome || '',
                numero: info.numero || '',
                senha: info.senha || ''
            }))
            .sort((a, b) => Number(a.numero) - Number(b.numero));

        res.json(representantes);
    } catch (error) {
        console.error('Erro ao listar representantes:', error);
        res.status(500).json({ error: 'Erro ao listar representantes.' });
    }
}

function createRepresentante(req, res) {
    try {
        const { email, nome, numero, senha } = req.body;

        if (!email || !nome || !numero || !senha) {
            return res.status(400).json({ error: 'Email, nome, número e senha são obrigatórios.' });
        }

        const data = readRepresentantes();

        if (data[email]) {
            return res.status(400).json({ error: 'Já existe um representante com esse email.' });
        }

        data[email] = {
            nome,
            numero: String(numero),
            senha
        };

        saveRepresentantes(data);

        res.json({ message: 'Representante cadastrado com sucesso.' });
    } catch (error) {
        console.error('Erro ao cadastrar representante:', error);
        res.status(500).json({ error: 'Erro ao cadastrar representante.' });
    }
}

function updateRepresentante(req, res) {
    try {
        const { email } = req.params;
        const { nome, numero } = req.body;

        const data = readRepresentantes();

        if (!data[email]) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        if (nome !== undefined) data[email].nome = nome;
        if (numero !== undefined) data[email].numero = String(numero);

        saveRepresentantes(data);

        res.json({ message: 'Representante atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar representante:', error);
        res.status(500).json({ error: 'Erro ao atualizar representante.' });
    }
}

function updateSenha(req, res) {
    try {
        const { email } = req.params;
        const { senha } = req.body;

        if (!senha) {
            return res.status(400).json({ error: 'A nova senha é obrigatória.' });
        }

        const data = readRepresentantes();

        if (!data[email]) {
            return res.status(404).json({ error: 'Representante não encontrado.' });
        }

        data[email].senha = senha;

        saveRepresentantes(data);

        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
}

module.exports = {
    listRepresentantes,
    createRepresentante,
    updateRepresentante,
    updateSenha
};