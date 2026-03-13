const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '..', 'logs', 'auditoria.json');

function ensureLogFile() {
    if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '[]', 'utf8');
    }
}

function writeAuditLog({ usuario, acao, detalhes = '', ip = '', sucesso = true }) {
    try {
        ensureLogFile();

        const raw = fs.readFileSync(logPath, 'utf8');
        const logs = JSON.parse(raw);

        logs.unshift({
            dataHora: new Date().toISOString(),
            usuario,
            acao,
            detalhes,
            ip,
            sucesso
        });

        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao gravar log de auditoria:', error);
    }
}

function readAuditLogs() {
    ensureLogFile();
    const raw = fs.readFileSync(logPath, 'utf8');
    return JSON.parse(raw);
}

module.exports = {
    writeAuditLog,
    readAuditLogs
};