const nodemailer = require('nodemailer');

let emailsRecentes = new Map();

exports.sendPdf = async (req, res) => {
    const { pdfBase64, razaoSocial, codCliente, representante, emailRep } = req.body;

    if (!pdfBase64 || !razaoSocial || !codCliente || !representante) {
        return res.status(400).send('Dados incompletos para envio do PDF.');
    }

    const emailKey = `${razaoSocial}-${codCliente}-${representante}-${emailRep}-${Date.now()}`; // Adiciona timestamp para unicidade

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
            },
            tls: { rejectUnauthorized: false }
        });

        const subject = `Pedido de Venda ${razaoSocial} - ${codCliente}`;
        const fileName = `Pedido de Venda ${razaoSocial} - ${codCliente} e Rep ${representante}.pdf`;

        await transporter.sendMail({
            from: 'KidsZone Investimento Comercial <kidszoneworldinvestimento@gmail.com>',
            to: ['pedidos.kz@kidszoneworld.com.br', emailRep],
            subject,
            text: `Segue em anexo o PDF gerado para o cliente ${razaoSocial} - ${codCliente}, representante ${representante}.`,
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
        setTimeout(() => emailsRecentes.delete(emailKey), 10000); // Aumenta para 10 segundos
    }
};