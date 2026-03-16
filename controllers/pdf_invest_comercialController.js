const nodemailer = require('nodemailer');

let emailsRecentes = new Map();

exports.sendPdf = async (req, res) => {
    const { pdfBase64, razaoSocial, codCliente } = req.body;

    if (!pdfBase64 || !razaoSocial || !codCliente) {
        return res.status(400).send('Dados incompletos para envio do PDF.');
    }

    const emailKey = `${razaoSocial}-${codCliente}-${Date.now()}`; // Adiciona timestamp para unicidade

    if (emailsRecentes.has(emailKey)) {
        return res.status(429).send('E-mail já enviado recentemente. Aguarde antes de tentar novamente.');
    }

    try {
        emailsRecentes.set(emailKey, Date.now());

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },//att
            tls: { rejectUnauthorized: false }
        });

        const subject = `Solicitação de Investimento comercial ${razaoSocial} - ${codCliente}`;
        const fileName = `Solicitacao_Investimento_comercial_${razaoSocial}_${codCliente}.pdf`;

        await transporter.sendMail({
            from: 'KidsZone Investimento Comercial <kidzonekidszonemail@gmail.com>',
            to: ['ti.kz@kidszoneworld.com.br' , 'marcos@kidszoneworld.com.br'],
            subject,
            text: `Segue em anexo o PDF da solicitação de investimento comercial para o cliente ${razaoSocial} - ${codCliente}.`,
            attachments: [{
                filename: fileName,
                content: pdfBase64.split(",")[1],
                encoding: 'base64'
            }]
        });

        res.status(200).send('E-mail enviado com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar o e-mail:', error);
        res.status(500).send('Erro ao enviar o e-mail');
    } finally {
        setTimeout(() => emailsRecentes.delete(emailKey), 10000); // Remove após 10 segundos
    }
};