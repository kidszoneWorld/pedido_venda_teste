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
            'Aprovação Comercial',

        aprovacao_diretoria:
            'Aprovação Diretoria',

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
                        P."ValorParcela",
                        P."ValorPagamento"
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
    

    if(status === 'aprovacao_comercial'){

        return removerEmailsDuplicados([
            emailDiretor
        ]);

    }

    if(status === 'aprovacao_diretoria'){

        return removerEmailsDuplicados([
            emailComercial,
            emailFinanceiro,
            emailFinanceiro2
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
            emailRepresentante
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
                            "ValorParcela",
                            "ValorPagamento"
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
                            "StatusInvestimento"
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

            if(statusAnterior === novoStatus){

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
                        'O investimento já possui o status selecionado.',

                    data: {
                        CodigoInvestimento:
                            codigoInvestimento,

                        StatusInvestimento:
                            novoStatus
                    }
                });

            }

            let emailRepresentante =
                null;

            if(
                statusExigeEmailRepresentante(
                    novoStatus
                )
            ){

                emailRepresentante =
                    await buscarEmailRepresentante(
                        client,
                        investimento
                            .RepresentanteInvestimento
                    );

                if(!emailRepresentante){

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
                                'O e-mail do representante responsável não foi encontrado. O status não foi alterado.'
                        });

                }

            }

            const destinatarios =
            montarDestinatariosNotificacao(
                novoStatus,
                emailRepresentante
            );

            const resultadoAtualizacao =
                await client.query(
                    `
                        UPDATE public."TbInvestimentoComercial"
                        SET "StatusInvestimento" = $1
                        WHERE "CodigoInvestimento" = $2
                        RETURNING
                            "CodigoInvestimento",
                            "StatusInvestimento"
                    `,
                    [
                        novoStatus,
                        codigoInvestimento
                    ]
                );

            let emailEnviado =
                false;

            if(destinatarios.length > 0){

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
                        ? 'Status atualizado e notificação enviada com sucesso.'
                        : 'Status atualizado com sucesso.',

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
                        ),

                    valorPagamento:
                        Number(
                            row.ValorPagamento ||
                            0
                        )
                });

        }

    });

    return Array.from(
        mapa.values()
    );

}

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
                    ),

                valorPagamento:
                    Number(
                        parcela.ValorPagamento ||
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