const nodemailer =
    require(
        'nodemailer'
    );

const emailsRecentes =
    new Map();

exports.sendPdf = async function(
    req,
    res
){

    const {
        pdfBase64,
        razaoSocial,
        codCliente,
        representante,
        emailRep
    } =
        req.body || {};

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
        [
            razaoSocial,
            codCliente,
            representante,
            emailRep
        ].join('-');

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

        const usuarioGmail =
            process.env.GMAIL_USER;

        const senhaGmail =
            process.env.GMAIL_APP_PASSWORD;

        if(
            !usuarioGmail ||
            !senhaGmail
        ){

            throw new Error(
                'As credenciais de e-mail não foram configuradas.'
            );

        }

        const transporter =
            nodemailer.createTransport({
                service:
                    'gmail',

                auth: {
                    user:
                        usuarioGmail,

                    pass:
                        senhaGmail
                }
            });

        const conteudoBase64 =
            String(
                pdfBase64
            )
            .replace(
                /^data:application\/pdf;base64,/,
                ''
            );

        if(!conteudoBase64){

            throw new Error(
                'O conteúdo do PDF está vazio.'
            );

        }

        const nomeArquivo =
            [
                'Pedido de Venda',
                razaoSocial,
                codCliente,
                'Rep',
                representante
            ]
            .join(' - ')
            .replace(
                /[\\/:?"<>|]/g,
                ''
            ) +
            '.pdf';

        await transporter.sendMail({
            from:
                `"KidsZone Pedidos" <${usuarioGmail}>`,

            to:
                emailRep,

            subject:
                `Pedido de Venda ${razaoSocial} - ${codCliente}`,

            text:
                `Segue em anexo o PDF do pedido do cliente ${razaoSocial} - ${codCliente}.`,

            attachments: [
                {
                    filename:
                        nomeArquivo,

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
                'E-mail enviado com sucesso.'
            );

    }catch(error){

        console.error(
            'Erro ao enviar PDF por e-mail:',
            {
                mensagem:
                    error.message,

                stack:
                    error.stack
            }
        );

        return res
            .status(500)
            .send(
                error.message ||
                'Erro ao enviar o PDF por e-mail.'
            );

    }finally{

        setTimeout(
            function(){

                emailsRecentes.delete(
                    emailKey
                );

            },
            10000
        );

    }

};