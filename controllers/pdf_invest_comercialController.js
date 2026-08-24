const nodemailer =
    require(
        'nodemailer'
    );

const pool = require('../config/database');

const emailsRecentes =
    new Map();

function textoOuNull(valor){

    if(
        valor === null ||
        valor === undefined
    ){
        return null;
    }

    const texto =
        String(valor).trim();

    return texto || null;

}

function numeroOuZero(valor){

    const numero =
        Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;

}

exports.sendPdf =
    async (req, res) => {

       if(
            !pdfBase64 ||
            !razaoSocial ||
            !codCliente ||
            !dadosInvestimento
        ){

            return res
                .status(400)
                .json({
                    sucesso:
                        false,

                    mensagem:
                        'Dados incompletos para salvar e enviar o PDF.'
                });

        }

        const usuarioSessao =
         req.session?.user || {};

        const numeroRepresentante =
            usuarioSessao.numero ||
            req.session?.userNumero ||
            '';

        const nomeRepresentante =
            usuarioSessao.nome ||
            req.session?.userNome ||
            '';

        const representanteDigitado =
            textoOuNull(
                dadosInvestimento
                    ?.representanteInvestimento
            );

        let representanteResponsavel =
            null;

        if(numeroRepresentante){

            representanteResponsavel =
                nomeRepresentante
                    ? `${numeroRepresentante} - ${nomeRepresentante}`
                    : String(numeroRepresentante);

        }else{

            representanteResponsavel =
                representanteDigitado;

        }

        if(!representanteResponsavel){

            return res
                .status(400)
                .json({
                    sucesso:
                        false,

                    mensagem:
                        'Representante responsável não informado.'
                });

        }

        const emailKey =
            `${razaoSocial}-${codCliente}`;

        if(emailsRecentes.has(emailKey)){

            return res
                .status(429)
                .json({
                    sucesso: false,
                    mensagem:
                        'E-mail já enviado recentemente. Aguarde antes de tentar novamente.'
                });

        }

        let client;

        try{

            emailsRecentes.set(
                emailKey,
                Date.now()
            );

            client =
                await pool.connect();

            await client.query(
                'BEGIN'
            );

            const insertSql = `
                INSERT INTO public."TbInvestimentoComercial"
                (
                    "CnpjInvestimento",
                    "EnderecoInvestimento",
                    "RazaoSocialInvestimento",
                    "TelefoneInvestimento",
                    "ResponsavelInvestimento",
                    "CargoInvestimento",
                    "ResumoInvestimento",
                    "VigenciaInicialInvestimento",
                    "VigenciaFinalInvestimento",
                    "TipoInvestimento",
                    "DescricaoInvestimento",
                    "ObservacaoDescricaoInvestimento",
                    "ValorInvestimento",
                    "ValorCompraInvestimento",
                    "RepresentanteInvestimento",
                    "StatusInvestimento",
                    "ObservacaoInvestimento",
                    "InvestimentoSobreCompra"
                )
                VALUES
                (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15,
                    $16, $17, $18
                )
                RETURNING
                    "CodigoInvestimento"
                    AS "codigoInvestimento"
            `;

            const valores = [

                textoOuNull(
                    dadosInvestimento
                        .cnpjInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .enderecoInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .razaoSocialInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .telefoneInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .responsavelInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .cargoInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .resumoInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .vigenciaInicialInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .vigenciaFinalInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .tipoInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .descricaoInvestimento
                ),

                textoOuNull(
                    dadosInvestimento
                        .observacaoDescricaoInvestimento
                ),

                numeroOuZero(
                    dadosInvestimento
                        .valorInvestimento
                ),

                numeroOuZero(
                    dadosInvestimento
                        .valorCompraInvestimento
                ),

                textoOuNull(
                    representanteResponsavel
                ),

                textoOuNull(
                    dadosInvestimento
                        .statusInvestimento
                ) || 'pendente',

                textoOuNull(
                    dadosInvestimento
                        .observacaoInvestimento
                ),
                numeroOuZero(
                    dadosInvestimento
                        .investimentoSobreCompra
                )


            ];

            const resultadoInsert =
                await client.query(
                    insertSql,
                    valores
                );

            const codigoInvestimento =
                resultadoInsert.rows[0]
                    .codigoInvestimento;

            const parcelas =
                Array.isArray(
                    dadosInvestimento.parcelas
                )
                    ? dadosInvestimento.parcelas
                    : [];

                const diagnosticoParcelas =
    await client.query(`
        SELECT
            current_database() AS banco,
            current_schema() AS schema,
            c.column_name,
            c.data_type,
            c.udt_name,
            c.character_maximum_length
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'TbParcelaInvestimentoComercial'
        ORDER BY c.ordinal_position
    `);

console.log(
    'Estrutura da tabela de parcelas vista pelo Node.js:',
    diagnosticoParcelas.rows
);

            for(const parcela of parcelas){

                const parcelaTexto =
                    textoOuNull(
                        parcela.parcela
                    );

                const valorParcela =
                    numeroOuZero(
                        parcela.valorParcela
                    );

                const valorPagamento =
                    numeroOuZero(
                        parcela.valorPagamento
                    );

                /*
                * Ignora uma linha completamente vazia.
                */
                if(
                    !parcelaTexto &&
                    valorParcela === 0 &&
                    valorPagamento === 0
                ){
                    continue;
                }

                await client.query(
                    `
                        INSERT INTO public."TbParcelaInvestimentoComercial"
                        (
                            "CodigoInvestimento",
                            "Parcela",
                            "ValorParcela",
                            "ValorPagamento"
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3,
                            $4
                        )
                    `,
                    [
                        codigoInvestimento,
                        parcelaTexto,
                        valorParcela,
                        valorPagamento
                    ]
                );

            }

            const transporter =
                nodemailer.createTransport({

                    service:
                        'gmail',

                    auth: {

                        user:
                            process.env.GMAIL_USER,

                        pass:
                            process.env
                                .GMAIL_APP_PASSWORD

                    },

                    tls: {
                        rejectUnauthorized:
                            false
                    }

                });

            const subject =
                `Solicitação de Investimento comercial ${razaoSocial} - ${codCliente}`;

            const fileName =
                `Solicitacao_Investimento_comercial_${codigoInvestimento}_${razaoSocial}.pdf`;

            const conteudoBase64 =
                pdfBase64.includes(',')
                    ? pdfBase64.split(',')[1]
                    : pdfBase64;

            await transporter.sendMail({

                from:
                    'KidsZone Investimento Comercial <kidzonekidszonemail@gmail.com>',

                // to: [
                //     'verbas@kidszoneworld.com.br'
                // ],

                to: [
                    'luis.henrique@kidszoneworld.com.br'
                ],

                subject:
                    subject,

                text:
                    `Segue em anexo a solicitação de investimento comercial nº ${codigoInvestimento}, referente ao cliente ${razaoSocial} - ${codCliente}.`,

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

            /*
             * Só confirma o INSERT quando o e-mail
             * também tiver sido enviado.
             */
            await client.query(
                'COMMIT'
            );

            return res
                .status(200)
                .json({

                    sucesso:
                        true,

                    mensagem:
                        'Informações salvas e e-mail enviado com sucesso.',

                    codigoInvestimento:
                        codigoInvestimento

                });

        }catch(error){

            if(client){

                await client
                    .query('ROLLBACK')
                    .catch(rollbackError => {

                        console.error(
                            'Erro ao executar rollback:',
                            rollbackError
                        );

                    });

            }

            console.error(
                'Erro ao salvar ou enviar investimento:',
                error
            );

            console.error(
    'Erro detalhado no investimento:',
    {
        message:
            error.message,

        code:
            error.code,

        detail:
            error.detail,

        hint:
            error.hint,

        table:
            error.table,

        column:
            error.column,

        constraint:
            error.constraint,

        stack:
            error.stack
    }
);

return res
    .status(500)
    .json({
        sucesso:
            false,

        mensagem:
            'Erro ao salvar as informações ou enviar o e-mail.',

        detalhe:
            error.message,

        codigoErro:
            error.code || null,

        coluna:
            error.column || null,

        tabela:
            error.table || null,

        restricao:
            error.constraint || null
    });

        }finally{

            if(client){
                client.release();
            }

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