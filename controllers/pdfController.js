const nodemailer =
    require(
        'nodemailer'
    );

let emailsRecentes =
    new Map();

exports.sendPdf = async (
    req,
    res
) => {

    const {
        pdfBase64,
        razaoSocial,
        codCliente,
        representante,
        emailRep
    } =
        req.body;

    if(
        !pdfBase64 ||
        !razaoSocial ||
        !codCliente ||
        !representante ||
        !emailRep
    ){

        return res
            .status(400)
            .send(
                'Dados incompletos para envio do PDF.'
            );

    }

    const emailKey =
        `${razaoSocial}-${codCliente}-${representante}-${emailRep}`;

    if(emailsRecentes.has(emailKey)){

        return res
            .status(429)
            .send(
                'E-mail já enviado recentemente. Aguarde antes de tentar novamente.'
            );

    }

    try{

        emailsRecentes.set(
            emailKey,
            Date.now()
        );

        const transporter =
            nodemailer.createTransport({
                service:
                    'gmail',

                auth: {
                    user:
                        process.env.GMAIL_USER,

                    pass:
                        process.env.GMAIL_APP_PASSWORD
                },

                tls: {
                    rejectUnauthorized:
                        false
                }
            });

        const subject =
            `Pedido de Venda ${razaoSocial} - ${codCliente}`;

        const fileName =
            `Pedido de Venda ${razaoSocial} - ${codCliente} e Rep ${representante}.pdf`;

        const conteudoBase64 =
            pdfBase64.includes(',')
                ? pdfBase64.split(',')[1]
                : pdfBase64;

        await transporter.sendMail({
            from:
                'KidsZone Pedidos <pedidoskidszone@gmail.com>',

            to:
                [emailRep],

            subject:
                subject,

            text:
                `Segue em anexo o PDF gerado para o cliente ${razaoSocial} - ${codCliente}, representante ${representante}.`,

            attachments: [
                {
                    filename:
                        fileName,

                    content:
                        conteudoBase64,

                    encoding:
                        'base64',

                    contentType:
                        'application/pdf'
                }
            ]
        });

        return res
            .status(200)
            .send(
                'E-mail enviado com sucesso!'
            );

    }catch(error){

        console.error(
            'Erro ao enviar o e-mail:',
            error
        );

        return res
            .status(500)
            .send(
                'Erro ao enviar o e-mail.'
            );

    }finally{

        setTimeout(
            () => {

                emailsRecentes.delete(
                    emailKey
                );

            },
            10000
        );

    }

};