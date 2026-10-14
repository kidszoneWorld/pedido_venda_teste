const pool = require('../config/database');

function obterRepresentanteSessao(req) {
    return String(
        req.session?.user?.numero ||
        req.session?.userNumero ||
        ''
    ).trim();
}

function normalizarCodigos(valor) {
    if (!valor) {
        return [];
    }

    return String(valor)
        .split(',')
        .map((codigo) => Number(codigo))
        .filter((codigo) => Number.isInteger(codigo) && codigo > 0);
}

async function buscarDistribuidoresPermitidos(
    representante,
    codigosSelecionados = []
) {
    const parametros = [];
    const condicoes = [];

    if (representante) {
        parametros.push(representante);

        condicoes.push(
            `TRIM(COALESCE(d."Representante", '')) = $${parametros.length}`
        );
    }

    if (codigosSelecionados.length > 0) {
        parametros.push(codigosSelecionados);

        condicoes.push(
            `d."CodigoDistribuidor" = ANY($${parametros.length}::integer[])`
        );
    }

    const where = condicoes.length > 0
        ? `WHERE ${condicoes.join(' AND ')}`
        : '';

    const resultado = await pool.query(
        `
            SELECT
                d."CodigoDistribuidor",
                d."RazaoSocial",
                d."CNPJ",
                d."Representante"
            FROM "TbDistribuidor" d
            ${where}
            ORDER BY d."RazaoSocial"
        `,
        parametros
    );

    return resultado.rows;
}

exports.listarDistribuidores = async (req, res) => {
    try {
        const representante = obterRepresentanteSessao(req);

        const distribuidores =
            await buscarDistribuidoresPermitidos(representante);

        return res.status(200).json({
            sucesso: true,
            representante: representante || null,
            exibeTodos: !representante,
            distribuidores
        });
    } catch (error) {
        console.error(
            'Erro ao buscar distribuidores do dashboard:',
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar distribuidores.',
            erro: error.message
        });
    }
};

exports.buscarDados = async (req, res) => {
    try {
        const representante = obterRepresentanteSessao(req);

        const codigosSolicitados =
            normalizarCodigos(req.query.distribuidores);

        const distribuidores =
            await buscarDistribuidoresPermitidos(
                representante,
                codigosSolicitados
            );

        const codigosPermitidos = distribuidores.map(
            (distribuidor) =>
                Number(distribuidor.CodigoDistribuidor)
        );

        if (codigosPermitidos.length === 0) {
            return res.status(200).json({
                sucesso: true,
                distribuidores: [],
                resumo: {
                    distribuidores: 0,
                    sellIn: 0,
                    metaSellIn: 0,
                    atingimento: 0,
                    sellOut: 0,
                    positivacao: 0,
                    displays: 0,
                    estoque: 0,
                    investimentos: 0,
                    redes: 0
                },
                graficos: {
                    sellIn: [],
                    sellOut: [],
                    positivacao: [],
                    displays: [],
                    estoque: [],
                    investimentos: [],
                    redes: []
                }
            });
        }

        const [
            sellInResultado,
            metaResultado,
            sellOutResultado,
            positivacaoResultado,
            displaysResultado,
            estoqueResultado,
            investimentosResultado,
            redesResultado
        ] = await Promise.all([
            pool.query(
                `
                    SELECT
                        s."CodigoDistribuidor",
                        COALESCE(
                            SUM(s."ValorSellIn"),
                            0
                        )::numeric AS total
                    FROM "TbSellIn" s
                    WHERE
                        s."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        s."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        m."CodigoDistribuidor",
                        COALESCE(
                            SUM(m."MetaSellIn"),
                            0
                        )::numeric AS total
                    FROM "TbMetaSellIn" m
                    WHERE
                        m."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        m."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        s."CodigoDistribuidor",
                        COALESCE(
                            SUM(s."SellOutQuantidade"),
                            0
                        )::integer AS total
                    FROM "TbSellOut" s
                    WHERE
                        s."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        s."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        p."CodigoDistribuidor",
                        COALESCE(
                            SUM(p."QuantidadePositivada"),
                            0
                        )::integer AS total
                    FROM "TbPositivacaoDistribuidor" p
                    WHERE
                        p."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        p."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        d."CodigoDistribuidor",
                        COALESCE(
                            SUM(d."QuantidadeDisplay"),
                            0
                        )::integer AS total
                    FROM "TbDisplay" d
                    WHERE
                        d."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        d."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        e."CodigoDistribuidor",
                        COALESCE(
                            SUM(e."Quantidade"),
                            0
                        )::integer AS total
                    FROM "TbEstoqueDistribuidor" e
                    WHERE
                        e."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        e."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        i."CodigoDistribuidor",
                        COALESCE(
                            SUM(i."ValorInvestimento"),
                            0
                        )::numeric AS total
                    FROM "TbInvestimentoDistribuidor" i
                    WHERE
                        i."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        i."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            ),

            pool.query(
                `
                    SELECT
                        r."CodigoDistribuidor",
                        COUNT(*)::integer AS total
                    FROM "TbRedes" r
                    WHERE
                        r."CodigoDistribuidor" =
                        ANY($1::integer[])
                    GROUP BY
                        r."CodigoDistribuidor"
                `,
                [codigosPermitidos]
            )
        ]);

        function criarMapa(rows) {
            return new Map(
                rows.map((row) => [
                    Number(row.CodigoDistribuidor),
                    Number(row.total) || 0
                ])
            );
        }

        const mapaSellIn = criarMapa(sellInResultado.rows);
        const mapaMeta = criarMapa(metaResultado.rows);
        const mapaSellOut = criarMapa(sellOutResultado.rows);
        const mapaPositivacao =
            criarMapa(positivacaoResultado.rows);
        const mapaDisplays = criarMapa(displaysResultado.rows);
        const mapaEstoque = criarMapa(estoqueResultado.rows);
        const mapaInvestimentos =
            criarMapa(investimentosResultado.rows);
        const mapaRedes = criarMapa(redesResultado.rows);

        function montarGrafico(mapa) {
            return distribuidores.map((distribuidor) => {
                const codigo =
                    Number(distribuidor.CodigoDistribuidor);

                return {
                    codigo,
                    nome: distribuidor.RazaoSocial,
                    total: mapa.get(codigo) || 0
                };
            });
        }

        const totalSellIn = Array.from(
            mapaSellIn.values()
        ).reduce((total, valor) => total + valor, 0);

        const totalMeta = Array.from(
            mapaMeta.values()
        ).reduce((total, valor) => total + valor, 0);

        const somarMapa = (mapa) =>
            Array.from(mapa.values()).reduce(
                (total, valor) => total + valor,
                0
            );

        const atingimento = totalMeta > 0
            ? (totalSellIn / totalMeta) * 100
            : 0;

        return res.status(200).json({
            sucesso: true,

            representante: representante || null,

            distribuidores,

            resumo: {
                distribuidores: distribuidores.length,
                sellIn: totalSellIn,
                metaSellIn: totalMeta,
                atingimento,
                sellOut: somarMapa(mapaSellOut),
                positivacao: somarMapa(mapaPositivacao),
                displays: somarMapa(mapaDisplays),
                estoque: somarMapa(mapaEstoque),
                investimentos: somarMapa(mapaInvestimentos),
                redes: somarMapa(mapaRedes)
            },

            graficos: {
                sellIn: montarGrafico(mapaSellIn),
                metaSellIn: montarGrafico(mapaMeta),
                sellOut: montarGrafico(mapaSellOut),
                positivacao: montarGrafico(mapaPositivacao),
                displays: montarGrafico(mapaDisplays),
                estoque: montarGrafico(mapaEstoque),
                investimentos: montarGrafico(
                    mapaInvestimentos
                ),
                redes: montarGrafico(mapaRedes)
            }
        });
    } catch (error) {
        console.error(
            'Erro ao montar dashboard de distribuidores:',
            error
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao carregar o dashboard.',
            erro: error.message
        });
    }
};