const nodemailer = require('nodemailer');

let emailsRecentes = new Map();

exports.sendClientPdf = async (req, res) => {
    const { pdfBase64, razaoSocial, emailTo, emailCc, subject, message, additionalAttachments } = req.body;

    // Valida os dados obrigatórios
    if (!pdfBase64 || !razaoSocial || !emailTo || !subject || !message) {
        return res.status(400).send('Dados incompletos para envio do e-mail.');
    }

    // Cria uma chave única para evitar envios duplicados
    const emailKey = `${razaoSocial}-${emailTo}-${subject}-${Date.now()}`; // Adiciona timestamp para unicidade

    if (emailsRecentes.has(emailKey)) {
        return res.status(429).send('E-mail já enviado recentemente. Aguarde antes de tentar novamente.');
    }

    try {
        emailsRecentes.set(emailKey, Date.now());

        // Configura o transporter do Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        // Nome do arquivo PDF gerado
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const pdfFileName = `Cadastro_Cliente_${razaoSocial}_${timestamp}.pdf`;

        // Prepara os anexos
        const attachments = [
            {
                filename: pdfFileName,
                content: pdfBase64.split(",")[1], // Remove o prefixo "data:application/pdf;base64,"
                encoding: 'base64'
            }
        ];

        // Adiciona os anexos adicionais do usuário, se houver
        if (additionalAttachments && Array.isArray(additionalAttachments)) {
            additionalAttachments.forEach(attachment => {
                if (attachment.base64 && attachment.filename) {
                    attachments.push({
                        filename: attachment.filename,
                        content: attachment.base64.split(",")[1], // Remove o prefixo do base64
                        encoding: 'base64'
                    });
                }
            });
        }

        // Prepara os destinatários do campo "Cc"
        const ccEmails = emailCc ? emailCc.split(',').map(email => email.trim()) : [];

        // Envia o e-mail
        await transporter.sendMail({
            from: 'Cadastro clientes KidsZone <kidszoneworldinvestimento@gmail.com>',
            to: emailTo.split(',').map(email => email.trim()), // Suporta múltiplos e-mails no "Para"
            cc: ccEmails, // Adiciona os e-mails do "Cc"
            subject: subject,
            text: message,
            attachments: attachments
        });

        res.status(200).send('E-mail enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar o e-mail:', error);
        res.status(500).send('Erro ao enviar o e-mail');
    } finally {
        setTimeout(() => emailsRecentes.delete(emailKey), 10000); // Remove a chave após 10 segundos
    }
};