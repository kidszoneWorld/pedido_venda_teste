const pool =
    require(
        '../config/database'
    );

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

        try{

            const codigoInvestimento =
                Number(
                    req.params.id
                );

            const status =
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
                    status
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

            const resultado =
                await pool.query(
                    `
                        UPDATE public."TbInvestimentoComercial"
                        SET "StatusInvestimento" = $1
                        WHERE "CodigoInvestimento" = $2
                        RETURNING
                            "CodigoInvestimento",
                            "StatusInvestimento"
                    `,
                    [
                        status,
                        codigoInvestimento
                    ]
                );

            if(
                resultado.rows.length ===
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

            return res.json({
                success:
                    true,

                mensagem:
                    'Status atualizado com sucesso.',

                data:
                    resultado.rows[0]
            });

        }catch(error){

            console.error(
                'Erro ao atualizar status:',
                error
            );

            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensagem:
                        'Erro ao atualizar status.',

                    error:
                        error.message
                });

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