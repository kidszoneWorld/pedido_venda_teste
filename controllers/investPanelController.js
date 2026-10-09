const nodemailer =
    require(
        'nodemailer'
    );

const pool =
    require(
        '../config/database'
    );

function criarTransportadorEmail(){

    if(
        !process.env.GMAIL_USER ||
        !process.env.GMAIL_APP_PASSWORD
    ){

        throw new Error(
            'As credenciais de e-mail não foram configuradas.'
        );

    }

    return nodemailer.createTransport({
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

}

function removerEmailsDuplicados(emails){

    return Array.from(
        new Set(
            emails
                .filter(email => {

                    return Boolean(
                        email &&
                        String(email).trim()
                    );

                })
                .map(email => {

                    return String(email)
                        .trim()
                        .toLowerCase();

                })
        )
    );

}

function extrairNumeroRepresentante(representante){

    const texto =
        String(representante || '')
            .trim();

    if(!texto){
        return '';
    }

    const numeroInicial =
        texto.match(
            /^\s*(\d+)/
        );

    if(numeroInicial){

        return numeroInicial[1];

    }

    return '';

}

async function buscarEmailRepresentante(
    client,
    representante
){

    const textoRepresentante =
        String(
            representante || ''
        )
        .trim();

    const numeroRepresentante =
        extrairNumeroRepresentante(
            textoRepresentante
        );

    console.log(
        'Localizando e-mail do representante:',
        {
            representante:
                textoRepresentante,

            numeroExtraido:
                numeroRepresentante
        }
    );

    if(!numeroRepresentante){

        console.error(
            'Não foi possível extrair o número do representante.'
        );

        return null;

    }

    const resultado =
        await client.query(
            `
                SELECT
                    "UsuNumero",
                    "UsuNome",
                    "UsuEmail"
                FROM public."TbUsuarios"
                WHERE REGEXP_REPLACE(
                    COALESCE(
                        CAST("UsuNumero" AS text),
                        ''
                    ),
                    '[^0-9]',
                    '',
                    'g'
                ) = $1
                LIMIT 1
            `,
            [
                String(numeroRepresentante)
                    .replace(/\D/g, '')
            ]
        );

    console.log(
        'Resultado da busca do representante:',
        resultado.rows
    );

    if(resultado.rows.length === 0){

        console.error(
            `Nenhum usuário encontrado com o número ${numeroRepresentante}.`
        );

        return null;

    }

    const usuario =
        resultado.rows[0];

    const email =
        String(
            usuario.UsuEmail ||
            usuario.usuemail ||
            ''
        )
        .trim()
        .toLowerCase();

    if(!email){

        console.error(
            `O usuário ${numeroRepresentante} foi encontrado, mas não possui e-mail cadastrado.`
        );

        return null;

    }

    return email;

}

function formatarNomeStatusEmail(status){

    const nomesStatus = {
        pendente:
            'Pendente',

        aprovacao_comercial:
            'Aprovado/Comercial',

        aprovacao_diretoria:
            'Aprovado/Diretoria',

        finalizado:
            'Finalizado',

        reprovado:
            'Reprovado'
    };

    return nomesStatus[status] ||
        status ||
        'Não informado';

}

exports.listarInvestimentos =
    async (req, res) => {

        try{

            const resultado =
                await pool.query(`
                    SELECT
                        I."CodigoInvestimento",
                        I."CnpjInvestimento",
                        I."EnderecoInvestimento",
                        I."RazaoSocialInvestimento",
                        I."TelefoneInvestimento",
                        I."ResponsavelInvestimento",
                        I."CargoInvestimento",
                        I."ResumoInvestimento",
                        I."VigenciaInicialInvestimento",
                        I."VigenciaFinalInvestimento",
                        I."TipoInvestimento",
                        I."DescricaoInvestimento",
                        I."ObservacaoDescricaoInvestimento",
                        I."ValorInvestimento",
                        I."ValorCompraInvestimento",
                        I."RepresentanteInvestimento",
                        I."StatusInvestimento",
                        I."ObservacaoInvestimento",
                        I."InvestimentoSobreCompra",
                        P."CodigoParcela",
                        P."Parcela",
                        P."ValorParcela"
                    FROM public."TbInvestimentoComercial" I
                    LEFT JOIN public."TbParcelaInvestimentoComercial" P
                        ON P."CodigoInvestimento" =
                           I."CodigoInvestimento"
                    ORDER BY
                        I."CodigoInvestimento" DESC,
                        P."CodigoParcela" ASC
                `);

            const investimentos =
                agruparInvestimentos(
                    resultado.rows
                );

            return res.json({
                success:
                    true,

                data:
                    investimentos
            });

        }catch(error){

            console.error(
                'Erro ao listar investimentos:',
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensagem:
                        'Erro ao listar investimentos.',

                    error:
                        error.message
                });

        }

    };

    

function montarDestinatariosNotificacao(
    status,
    emailRepresentante
){

    const emailLuis =
        'luis.henrique@kidszoneworld.com.br';

    const emailTi =
        'ti.kz@kidszoneworld.com.br';

    const emailComercial =
        'comercial.kz@kidszoneworld.com.br';

    const emailDiretor =
        'marcos@kidszoneworld.com.br';
    
    const emailFinanceiro = 
        'financeiro.kz@kidszoneworld.com.br'

    const emailFinanceiro2 =
        'financeiro01@kidszoneworld.com.br '

    const emailFinanceiro3 =
        'financeiro02@kidszoneworld.com.br '
    

    if(status === 'aprovacao_comercial'){

        return removerEmailsDuplicados([
            emailDiretor,
            emailLuis
        ]);

    }

    if(status === 'aprovacao_diretoria'){

        return removerEmailsDuplicados([
            emailComercial,
            emailFinanceiro,
            emailFinanceiro2,
            emailFinanceiro3,
            emailLuis
        ]);

    }

    if(
        status === 'finalizado' ||
        status === 'reprovado'
    ){

        return removerEmailsDuplicados([
            emailComercial,
            emailFinanceiro,
            emailFinanceiro2,
            emailRepresentante,
            emailLuis
        ]);

    }

    return [];

}

function statusExigeEmailRepresentante(
    status
){

    return (
        status === 'finalizado' ||
        status === 'reprovado'
    );

}

exports.buscarInvestimentoPorId =
    async (req, res) => {

        try{

            const codigoInvestimento =
                Number(
                    req.params.id
                );

            if(
                !Number.isInteger(
                    codigoInvestimento
                )
            ){

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Código de investimento inválido.'
                    });

            }

            const investimento =
                await pool.query(
                    `
                        SELECT
                            "CodigoInvestimento",
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
                        FROM public."TbInvestimentoComercial"
                        WHERE "CodigoInvestimento" = $1
                    `,
                    [
                        codigoInvestimento
                    ]
                );

            if(
                investimento.rows.length ===
                0
            ){

                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Investimento não encontrado.'
                    });

            }

            const parcelas =
                await pool.query(
                    `
                        SELECT
                            "CodigoParcela",
                            "CodigoInvestimento",
                            "Parcela",
                            "ValorParcela"
                        FROM public."TbParcelaInvestimentoComercial"
                        WHERE "CodigoInvestimento" = $1
                        ORDER BY "CodigoParcela"
                    `,
                    [
                        codigoInvestimento
                    ]
                );

            const registro =
                investimento.rows[0];

            return res.json({
                success:
                    true,

                data:
                    montarInvestimento(
                        registro,
                        parcelas.rows
                    )
            });

        }catch(error){

            console.error(
                'Erro ao buscar investimento:',
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensagem:
                        'Erro ao buscar investimento.',

                    error:
                        error.message
                });

        }

    };

exports.atualizarStatusInvestimento =
    async (req, res) => {
        const observacaoInvestimento =
        String(
            req.body
                ?.observacaoInvestimento ??
            req.body
                ?.ObservacaoInvestimento ??
            ''
        ).trim();
        let client;
        let transacaoAberta =
            false;

        try{

            const codigoInvestimento =
                Number(
                    req.params.id
                );

            const novoStatus =
                String(
                    req.body?.status || ''
                )
                .trim()
                .toLowerCase();

            const statusPermitidos = [
                'pendente',
                'aprovacao_comercial',
                'aprovacao_diretoria',
                'finalizado',
                'reprovado'
            ];

            if(
                !Number.isInteger(
                    codigoInvestimento
                )
            ){

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Código de investimento inválido.'
                    });

            }

            if(
                !statusPermitidos.includes(
                    novoStatus
                )
            ){

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Status de investimento inválido.'
                    });

            }
            if (
                observacaoInvestimento.length >
                600
            ) {
                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        mensagem:
                            'A observação deve possuir no máximo 600 caracteres.'
                    });
            }

            client =
                await pool.connect();

            await client.query(
                'BEGIN'
            );

            transacaoAberta =
                true;

            const resultadoInvestimento =
                await client.query(
                    `
                        SELECT
                            "CodigoInvestimento",
                            "CnpjInvestimento",
                            "RazaoSocialInvestimento",
                            "RepresentanteInvestimento",
                            "ValorInvestimento",
                            "StatusInvestimento",
                            "ObservacaoInvestimento"
                        FROM public."TbInvestimentoComercial"
                        WHERE "CodigoInvestimento" = $1
                        FOR UPDATE
                    `,
                    [
                        codigoInvestimento
                    ]
                );
            if(
                resultadoInvestimento.rows.length ===
                0
            ){

                await client.query(
                    'ROLLBACK'
                );

                transacaoAberta =
                    false;

                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Investimento não encontrado.'
                    });

            }

            const investimento =
                resultadoInvestimento.rows[0];

            const statusAnterior =
                String(
                    investimento.StatusInvestimento ||
                    'pendente'
                )
                    .trim()
                    .toLowerCase();

            const observacaoAnterior =
                String(
                    investimento.ObservacaoInvestimento ??
                    ''
                ).trim();

            const statusFoiAlterado =
                statusAnterior !==
                novoStatus;

            const observacaoFoiAlterada =
                observacaoAnterior !==
                observacaoInvestimento;

            if (
                !statusFoiAlterado &&
                !observacaoFoiAlterada
            ) {
                await client.query(
                    'ROLLBACK'
                );

                transacaoAberta =
                    false;

                return res.json({
                    success:
                        true,

                    emailEnviado:
                        false,

                    mensagem:
                        'Nenhuma alteração foi identificada.',

                    data: {
                        CodigoInvestimento:
                            codigoInvestimento,

                        StatusInvestimento:
                            novoStatus,

                        ObservacaoInvestimento:
                            observacaoInvestimento
                    }
                });
            }
            let emailRepresentante =
                null;

            if (
                statusFoiAlterado &&
                statusExigeEmailRepresentante(
                    novoStatus
                )
            ) {

                emailRepresentante =
                    await buscarEmailRepresentante(
                        client,
                        investimento
                            .RepresentanteInvestimento
                    );

                // if(!emailRepresentante){

                //     await client.query(
                //         'ROLLBACK'
                //     );

                //     transacaoAberta =
                //         false;

                //     return res
                //         .status(400)
                //         .json({
                //             success:
                //                 false,

                //             mensagem:
                //                 'O e-mail do representante responsável não foi encontrado. O status não foi alterado.'
                //         });

                // }

            }

            const destinatarios =
                statusFoiAlterado
                    ? montarDestinatariosNotificacao(
                        novoStatus,
                        emailRepresentante
                    )
                    : [];

            const resultadoAtualizacao =
                await client.query(
                    `
                        UPDATE public."TbInvestimentoComercial"
                        SET
                            "StatusInvestimento" = $1,
                            "ObservacaoInvestimento" = $2
                        WHERE
                            "CodigoInvestimento" = $3
                        RETURNING
                            "CodigoInvestimento",
                            "StatusInvestimento",
                            "ObservacaoInvestimento"
                    `,
                    [
                        novoStatus,

                        observacaoInvestimento ||
                            null,

                        codigoInvestimento
                    ]
                );

            let emailEnviado =
                false;

            if (
                statusFoiAlterado &&
                destinatarios.length > 0
            ) {

                await enviarNotificacaoStatus({
                    investimento:
                        investimento,

                    statusAnterior:
                        statusAnterior,

                    novoStatus:
                        novoStatus,

                    destinatarios:
                        destinatarios
                });

                emailEnviado =
                    true;

            }

            await client.query(
                'COMMIT'
            );

            transacaoAberta =
                false;

            return res.json({
                success:
                    true,

                emailEnviado:
                    emailEnviado,

                destinatarios:
                    destinatarios,

                mensagem:
                    emailEnviado
                        ? 'Status e observação atualizados; notificação enviada com sucesso.'
                        : statusFoiAlterado
                            ? 'Status e observação atualizados com sucesso.'
                            : 'Observação atualizada com sucesso.',
                data:
                    resultadoAtualizacao.rows[0]
            });

        }catch(error){

            if(
                client &&
                transacaoAberta
            ){

                await client
                    .query('ROLLBACK')
                    .catch(rollbackError => {

                        console.error(
                            'Erro ao desfazer atualização:',
                            rollbackError
                        );

                    });

            }

            console.error(
                'Erro ao atualizar status do investimento:',
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensagem:
                        'Não foi possível atualizar o status ou enviar a notificação.',

                    error:
                        process.env.NODE_ENV ===
                        'development'
                            ? error.message
                            : undefined
                });

        }finally{

            if(client){

                client.release();

            }

        }

    };

function agruparInvestimentos(rows){

    const mapa =
        new Map();

    rows.forEach(row => {

        const codigo =
            row.CodigoInvestimento;

        if(!mapa.has(codigo)){

            mapa.set(
                codigo,
                montarInvestimento(
                    row,
                    []
                )
            );

        }

        if(
            row.CodigoParcela !== null &&
            row.CodigoParcela !== undefined
        ){

            mapa
                .get(codigo)
                .parcelas
                .push({
                    codigoParcela:
                        row.CodigoParcela,

                    parcela:
                        row.Parcela,

                    valorParcela:
                        Number(
                            row.ValorParcela ||
                            0
                        )

                });

        }

    });

    return Array.from(
        mapa.values()
    );

}

exports.buscarInvestimentoParaEdicao =
    async (
        req,
        res
    ) => {
        const codigoInvestimento =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                codigoInvestimento
            ) ||
            codigoInvestimento <= 0
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    mensagem:
                        'Código do investimento inválido.'
                });
        }

        let client;

        try {
            client =
                await pool.connect();

            const resultadoInvestimento =
                await client.query(
                    `
                        SELECT
                            "CodigoInvestimento",
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
                        FROM public."TbInvestimentoComercial"
                        WHERE
                            "CodigoInvestimento" = $1
                    `,
                    [
                        codigoInvestimento
                    ]
                );

            if (
                resultadoInvestimento
                    .rows.length === 0
            ) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Investimento não encontrado.'
                    });
            }

            const investimento =
                resultadoInvestimento
                    .rows[0];

            const resultadoParcelas =
                await client.query(
                    `
                        SELECT
                            "Parcela",
                            "ValorParcela"
                        FROM public."TbParcelaInvestimentoComercial"
                        WHERE
                            "CodigoInvestimento" = $1
                        ORDER BY
                            "Parcela" ASC
                    `,
                    [
                        codigoInvestimento
                    ]
                );

            return res.json({
                success:
                    true,

                investimento: {
                    codigoInvestimento:
                        investimento
                            .CodigoInvestimento,

                    cnpjInvestimento:
                        investimento
                            .CnpjInvestimento,

                    enderecoInvestimento:
                        investimento
                            .EnderecoInvestimento,

                    razaoSocialInvestimento:
                        investimento
                            .RazaoSocialInvestimento,

                    telefoneInvestimento:
                        investimento
                            .TelefoneInvestimento,

                    responsavelInvestimento:
                        investimento
                            .ResponsavelInvestimento,

                    cargoInvestimento:
                        investimento
                            .CargoInvestimento,

                    resumoInvestimento:
                        investimento
                            .ResumoInvestimento,

                    vigenciaInicialInvestimento:
                        investimento
                            .VigenciaInicialInvestimento,

                    vigenciaFinalInvestimento:
                        investimento
                            .VigenciaFinalInvestimento,

                    tipoInvestimento:
                        investimento
                            .TipoInvestimento,

                    descricaoInvestimento:
                        investimento
                            .DescricaoInvestimento,

                    observacaoDescricaoInvestimento:
                        investimento
                            .ObservacaoDescricaoInvestimento,

                    valorInvestimento:
                        Number(
                            investimento
                                .ValorInvestimento ||
                            0
                        ),

                    valorCompraInvestimento:
                        Number(
                            investimento
                                .ValorCompraInvestimento ||
                            0
                        ),

                    representanteInvestimento:
                        investimento
                            .RepresentanteInvestimento,

                    statusInvestimento:
                        investimento
                            .StatusInvestimento,

                    observacaoInvestimento:
                        investimento
                            .ObservacaoInvestimento ||
                        '',

                    investimentoSobreCompra:
                        Number(
                            investimento
                                .InvestimentoSobreCompra ||
                            0
                        ),

                    parcelas:
                        resultadoParcelas.rows.map(
                            parcela => {
                                return {
                                    parcela:
                                        parcela.Parcela,

                                    valorParcela:
                                        Number(
                                            parcela.ValorParcela ||
                                            0
                                        )
                                };
                            }
                        )
                }
            });
        } catch (error) {
            console.error(
                'Erro ao buscar investimento para edição:',
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensagem:
                        error.message ||
                        'Erro ao buscar investimento.'
                });
        } finally {
            client?.release();
        }
    };

function textoOuNull(
    valor
) {
    if (
        valor === null ||
        valor === undefined
    ) {
        return null;
    }

    const texto =
        String(
            valor
        ).trim();

    return texto ||
        null;
}

function numeroOuZero(
    valor
) {
    const numero =
        Number(
            valor
        );

    return Number.isFinite(
        numero
    )
        ? numero
        : 0;
}

exports.editarInvestimentoPendente =
    async (
        req,
        res
    ) => {
        const codigoInvestimento =
            Number(
                req.params.id
            );

        if (
            !Number.isInteger(
                codigoInvestimento
            ) ||
            codigoInvestimento <= 0
        ) {
            return res
                .status(400)
                .json({
                    success:
                        false,

                    mensagem:
                        'Código do investimento inválido.'
                });
        }

        const dados =
            req.body || {};

        const parcelas =
            Array.isArray(
                dados.parcelas
            )
                ? dados.parcelas
                : [];

        let client;
        let transacaoAberta =
            false;

        try {
            client =
                await pool.connect();

            await client.query(
                'BEGIN'
            );

            transacaoAberta =
                true;

            /*
             * O FOR UPDATE impede outra alteração concorrente
             * enquanto o investimento está sendo editado.
             */
            const resultadoAtual =
                await client.query(
                    `
                        SELECT
                            "CodigoInvestimento",
                            "StatusInvestimento"
                        FROM public."TbInvestimentoComercial"
                        WHERE
                            "CodigoInvestimento" = $1
                        FOR UPDATE
                    `,
                    [
                        codigoInvestimento
                    ]
                );

            if (
                resultadoAtual
                    .rows.length === 0
            ) {
                await client.query(
                    'ROLLBACK'
                );

                transacaoAberta =
                    false;

                return res
                    .status(404)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Investimento não encontrado.'
                    });
            }

            const statusAtual =
                String(
                    resultadoAtual
                        .rows[0]
                        .StatusInvestimento ||
                    ''
                )
                    .trim()
                    .toLowerCase();

            if (
                statusAtual !==
                'pendente'
            ) {
                await client.query(
                    'ROLLBACK'
                );

                transacaoAberta =
                    false;

                return res
                    .status(409)
                    .json({
                        success:
                            false,

                        mensagem:
                            'Somente investimentos pendentes podem ser editados.'
                    });
            }

            const observacaoInvestimento =
                String(
                    dados.observacaoInvestimento ??
                    ''
                ).trim();

            if (
                observacaoInvestimento.length >
                600
            ) {
                await client.query(
                    'ROLLBACK'
                );

                transacaoAberta =
                    false;

                return res
                    .status(400)
                    .json({
                        success:
                            false,

                        mensagem:
                            'A observação deve possuir no máximo 600 caracteres.'
                    });
            }

            await client.query(
                `
                    UPDATE public."TbInvestimentoComercial"
                    SET
                        "CnpjInvestimento" = $1,
                        "EnderecoInvestimento" = $2,
                        "RazaoSocialInvestimento" = $3,
                        "TelefoneInvestimento" = $4,
                        "ResponsavelInvestimento" = $5,
                        "CargoInvestimento" = $6,
                        "ResumoInvestimento" = $7,
                        "VigenciaInicialInvestimento" = $8,
                        "VigenciaFinalInvestimento" = $9,
                        "TipoInvestimento" = $10,
                        "DescricaoInvestimento" = $11,
                        "ObservacaoDescricaoInvestimento" = $12,
                        "ValorInvestimento" = $13,
                        "ValorCompraInvestimento" = $14,
                        "RepresentanteInvestimento" = $15,
                        "ObservacaoInvestimento" = $16,
                        "InvestimentoSobreCompra" = $17
                    WHERE
                        "CodigoInvestimento" = $18
                        AND LOWER(
                            COALESCE(
                                "StatusInvestimento",
                                ''
                            )
                        ) = 'pendente'
                    RETURNING
                        "CodigoInvestimento"
                `,
                [
                    textoOuNull(
                        dados.cnpjInvestimento
                    ),

                    textoOuNull(
                        dados.enderecoInvestimento
                    ),

                    textoOuNull(
                        dados.razaoSocialInvestimento
                    ),

                    textoOuNull(
                        dados.telefoneInvestimento
                    ),

                    textoOuNull(
                        dados.responsavelInvestimento
                    ),

                    textoOuNull(
                        dados.cargoInvestimento
                    ),

                    textoOuNull(
                        dados.resumoInvestimento
                    ),

                    textoOuNull(
                        dados.vigenciaInicialInvestimento
                    ),

                    textoOuNull(
                        dados.vigenciaFinalInvestimento
                    ),

                    textoOuNull(
                        dados.tipoInvestimento
                    ),

                    textoOuNull(
                        dados.descricaoInvestimento
                    ),

                    textoOuNull(
                        dados.observacaoDescricaoInvestimento
                    ),

                    numeroOuZero(
                        dados.valorInvestimento
                    ),

                    numeroOuZero(
                        dados.valorCompraInvestimento
                    ),

                    textoOuNull(
                        dados.representanteInvestimento
                    ),

                    textoOuNull(
                        observacaoInvestimento
                    ),

                    numeroOuZero(
                        dados.investimentoSobreCompra
                    ),

                    codigoInvestimento
                ]
            );

            /*
             * Como as parcelas pertencem ao investimento pendente,
             * elas podem ser substituídas dentro da mesma transação.
             */
            await client.query(
                `
                    DELETE FROM public."TbParcelaInvestimentoComercial"
                    WHERE
                        "CodigoInvestimento" = $1
                `,
                [
                    codigoInvestimento
                ]
            );

            for (
                const parcela of parcelas
            ) {
                const parcelaTexto =
                    textoOuNull(
                        parcela.parcela
                    );

                const valorParcela =
                    numeroOuZero(
                        parcela.valorParcela
                    );

                if (
                    !parcelaTexto ||
                    valorParcela <= 0
                ) {
                    continue;
                }

                await client.query(
                    `
                        INSERT INTO public."TbParcelaInvestimentoComercial"
                        (
                            "CodigoInvestimento",
                            "Parcela",
                            "ValorParcela"
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3
                        )
                    `,
                    [
                        codigoInvestimento,
                        parcelaTexto,
                        valorParcela                        
                    ]
                );
            }

            await client.query(
                'COMMIT'
            );

            transacaoAberta =
                false;

            return res.json({
                success:
                    true,

                mensagem:
                    'Investimento atualizado com sucesso.',

                codigoInvestimento:
                    codigoInvestimento
            });
        } catch (error) {
            if (
                client &&
                transacaoAberta
            ) {
                await client
                    .query(
                        'ROLLBACK'
                    )
                    .catch(
                        rollbackError => {
                            console.error(
                                'Erro no rollback da edição do investimento:',
                                rollbackError
                            );
                        }
                    );
            }

            console.error(
                'Erro ao editar investimento:',
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensagem:
                        error.message ||
                        'Erro ao editar investimento.'
                });
        } finally {
            client?.release();
        }
    };

function montarInvestimento(
    registro,
    parcelas
){

    return {
        codigoInvestimento:
            registro.CodigoInvestimento,

        cnpj:
            registro.CnpjInvestimento,

        endereco:
            registro.EnderecoInvestimento,

        razaoSocial:
            registro.RazaoSocialInvestimento,

        telefone:
            registro.TelefoneInvestimento,

        responsavel:
            registro.ResponsavelInvestimento,

        cargo:
            registro.CargoInvestimento,

        resumo:
            registro.ResumoInvestimento,

        vigenciaInicial:
            registro.VigenciaInicialInvestimento,

        vigenciaFinal:
            registro.VigenciaFinalInvestimento,

        tipoInvestimento:
            registro.TipoInvestimento,

        descricaoInvestimento:
            registro.DescricaoInvestimento,

        observacaoDescricao:
            registro.ObservacaoDescricaoInvestimento,

        valorInvestimento:
            Number(
                registro.ValorInvestimento ||
                0
            ),

        valorCompra:
            Number(
                registro.ValorCompraInvestimento ||
                0
            ),

        representante:
            registro.RepresentanteInvestimento,

        status:
            registro.StatusInvestimento,

        observacao:
            registro.ObservacaoInvestimento,

        investimentoSobreCompra:
            Number(
                registro.InvestimentoSobreCompra ||
                0
            ),

        parcelas:
            parcelas.map(parcela => ({
                codigoParcela:
                    parcela.CodigoParcela,

                parcela:
                    parcela.Parcela,

                valorParcela:
                    Number(
                        parcela.ValorParcela ||
                        0
                    )

            }))
    };

}
async function enviarNotificacaoStatus({
    investimento,
    statusAnterior,
    novoStatus,
    destinatarios
}){

    if(destinatarios.length === 0){
        return null;
    }

    const transportador =
        criarTransportadorEmail();

    const statusAnteriorFormatado =
        formatarNomeStatusEmail(
            statusAnterior
        );

    const novoStatusFormatado =
        formatarNomeStatusEmail(
            novoStatus
        );

    const valorInvestimento =
        Number(
            investimento.ValorInvestimento ||
            0
        )
        .toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );

    const assunto =
        `Investimento comercial nº ${investimento.CodigoInvestimento} - ${novoStatusFormatado}`;

    const texto = [
        'Atualização de investimento comercial',
        '',
        `Número do investimento: ${investimento.CodigoInvestimento}`,
        `Cliente: ${investimento.RazaoSocialInvestimento || 'Não informado'}`,
        `CNPJ: ${investimento.CnpjInvestimento || 'Não informado'}`,
        `Representante: ${investimento.RepresentanteInvestimento || 'Não informado'}`,
        `Valor do investimento: ${valorInvestimento}`,
        `Status anterior: ${statusAnteriorFormatado}`,
        `Novo status: ${novoStatusFormatado}`,
        '',
        montarMensagemStatus(
            novoStatus
        ),
        '',
        'Esta é uma notificação automática do sistema.'
    ]
    .join('\n');

    return transportador.sendMail({
        from: 
            `KidsZone Investimento Comercial <${process.env.GMAIL_USER}>`,

        to:
            destinatarios,

        subject:
            assunto,

        text:
            texto
    });

}

function montarMensagemStatus(status){

    if(status === 'aprovacao_comercial'){

        return 'O investimento foi aprovado pelo setor comercial e aguarda a aprovação da diretoria.';

    }

    if(status === 'aprovacao_diretoria'){

        return 'O investimento foi aprovado pela diretoria e pode seguir para finalização.';

    }

    if(status === 'finalizado'){

        return 'O investimento foi finalizado.';

    }

    if(status === 'reprovado'){

        return 'O investimento foi reprovado.';

    }

    return 'O status do investimento foi atualizado.';

}