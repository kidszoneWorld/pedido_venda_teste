const nodemailer = require('nodemailer');
const puppeteer =
    require(
        'puppeteer-core'
    );

const chromium =
    require(
        '@sparticuz/chromium'
    );

const fs =
    require(
        'fs'
    );

const path =
    require(
        'path'
    );

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
            from: 'KidsZone Pedidos <pedidoskidszone@gmail.com>',
            to: [emailRep],
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

exports.gerarPdfPesquisavel = async (
    req,
    res
) => {

    let browser =
        null;

    try {

        const {
            html,
            fileName
        } =
            req.body;

        if (
            typeof html !== 'string' ||
            !html.trim()
        ) {

            return res
                .status(400)
                .json({
                    sucesso:
                        false,

                    mensagem:
                        'O HTML do pedido não foi informado.'
                });

        }

        const tamanhoHtmlMB =
            (
                Buffer.byteLength(
                    html,
                    'utf8'
                ) /
                1024 /
                1024
            ).toFixed(2);

        console.log(
            'Gerando PDF pesquisável:',
            {
                fileName:
                    fileName,

                tamanhoHtmlMB:
                    tamanhoHtmlMB
            }
        );

      const executandoNaVercel =
            Boolean(
                process.env.VERCEL
            );

        const executablePath =
            executandoNaVercel
                ? await chromium.executablePath()
                : (
                    process.env.CHROME_EXECUTABLE_PATH ||
                    undefined
                );

        browser =
            await puppeteer.launch({
                args:
                    executandoNaVercel
                        ? chromium.args
                        : [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage'
                        ],

                defaultViewport:
                    chromium.defaultViewport,

                executablePath:
                    executablePath,

                headless:
                    true
            });

        const page =
            await browser.newPage();

        await page.setViewport({
            width:
                1600,

            height:
                900,

            deviceScaleFactor:
                1
        });

        await page.setContent(
            html,
            {
                waitUntil:
                    'networkidle0',

                timeout:
                    120000
            }
        );
        await page.emulateMediaType(
    'print'
);

    await page.evaluate(
        () => {

            document.body.classList.remove(
                'dark-theme'
            );

            document.body.classList.add(
                'light-theme'
            );

            window.scrollTo(
                0,
                0
            );

        }
    );

        /*
         * Aguarda fontes e imagens antes de gerar o PDF.
         */
        await page.evaluate(
            async () => {

                if (document.fonts?.ready) {

                    await document.fonts.ready;

                }

                const imagens =
                    Array.from(
                        document.images
                    );

                await Promise.all(
                    imagens.map(imagem => {

                        if (
                            imagem.complete &&
                            imagem.naturalWidth > 0
                        ) {

                            return Promise.resolve();

                        }

                        return new Promise(resolve => {

                            const finalizar =
                                () => resolve();

                            imagem.addEventListener(
                                'load',
                                finalizar,
                                {
                                    once:
                                        true
                                }
                            );

                            imagem.addEventListener(
                                'error',
                                finalizar,
                                {
                                    once:
                                        true
                                }
                            );

                            /*
                             * Evita espera indefinida caso uma
                             * imagem não consiga carregar.
                             */
                            setTimeout(
                                finalizar,
                                10000
                            );

                        });

                    })
                );

            }
        );

        await page.emulateMediaType(
            'print'
        );

    const pdf =
        await page.pdf({
            format:
                'A4',

            landscape:
                true,

            printBackground:
                true,

            preferCSSPageSize:
                true,

            margin: {
                top:
                    '5mm',

                right:
                    '5mm',

                bottom:
                    '5mm',

                left:
                    '5mm'
            }
        });

        if (
            !pdf ||
            pdf.length === 0
        ) {

            throw new Error(
                'O Puppeteer gerou um arquivo PDF vazio.'
            );

        }

        const nomeSeguro =
            String(
                fileName ||
                'pedido-de-venda.pdf'
            )
            .replace(
                /[\r\n"]/g,
                ''
            )
            .trim();

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${nomeSeguro}"`
        );

        res.setHeader(
            'Content-Length',
            pdf.length
        );

        return res
            .status(200)
            .send(pdf);

    } catch (error) {

        console.error(
            'Erro ao gerar PDF pesquisável:',
            {
                mensagem:
                    error.message,

                stack:
                    error.stack
            }
        );

        if (!res.headersSent) {

            return res
                .status(500)
                .json({
                    sucesso:
                        false,

                    mensagem:
                        error.message ||
                        'Erro interno ao gerar o PDF pesquisável.'
                });

        }

    } finally {

        if (browser) {

            await browser
                .close()
                .catch(error => {

                    console.error(
                        'Erro ao fechar o navegador do PDF:',
                        error
                    );

                });

        }

    }

};

function encontrarChromeLocal(){

    const caminhosPossiveis = [
        process.env.CHROME_EXECUTABLE_PATH,

        process.env.PROGRAMFILES
            ? path.join(
                process.env.PROGRAMFILES,
                'Google',
                'Chrome',
                'Application',
                'chrome.exe'
            )
            : null,

        process.env['PROGRAMFILES(X86)']
            ? path.join(
                process.env['PROGRAMFILES(X86)'],
                'Google',
                'Chrome',
                'Application',
                'chrome.exe'
            )
            : null,

        process.env.LOCALAPPDATA
            ? path.join(
                process.env.LOCALAPPDATA,
                'Google',
                'Chrome',
                'Application',
                'chrome.exe'
            )
            : null
    ]
    .filter(Boolean);

    return (
        caminhosPossiveis.find(caminho => {

            return fs.existsSync(
                caminho
            );

        }) ||
        null
    );

}