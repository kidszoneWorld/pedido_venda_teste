const pool =
require('../config/database');

exports.listarSellIn = async (req, res) => {

    try {

        const codigoDistribuidor =
            req.params.codigoDistribuidor;

        const metas =
        await pool.query(
            `
            SELECT *
            FROM "TbMetaSellIn"
            WHERE "CodigoDistribuidor" = $1
            `,
            [
                codigoDistribuidor
            ]
        );

        const sellIn =
        await pool.query(
            `
            SELECT *
            FROM "TbSellIn"
            WHERE "CodigoDistribuidor" = $1
            `,
            [
                codigoDistribuidor
            ]
        );

        res.json({
            sucesso: true,
            metas: metas.rows,
            sellIn: sellIn.rows
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            sucesso: false,
            erro: err.message
        });

    }

};

exports.salvarSellIn = async (req, res) => {

    try {

        const codigoDistribuidor =
            req.params.codigoDistribuidor;

        const {
            metas,
            sellIn
        } = req.body;

        const usuarioRepresentante =
            req.session.userNumero;

        const isOperador =
            !usuarioRepresentante;

        if (
            isOperador &&
            Array.isArray(metas)
        ) {

            for (const meta of metas) {

                if (
                    meta.MetaSellIn !== '' &&
                    meta.MetaSellIn !== null &&
                    meta.MetaSellIn !== undefined
                ) {

                    await pool.query(
                        `
                        INSERT INTO "TbMetaSellIn"
                        (
                            "CodigoDistribuidor",
                            "MetaSellIn",
                            "MesAnoMetaSellIn"
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3
                        )

                        ON CONFLICT
                        (
                            "CodigoDistribuidor",
                            "MesAnoMetaSellIn"
                        )

                        DO UPDATE SET

                            "MetaSellIn" =
                            EXCLUDED."MetaSellIn"
                        `,
                        [
                            codigoDistribuidor,
                            meta.MetaSellIn,
                            meta.MesAnoMetaSellIn
                        ]
                    );

                }

            }

        }

        if (
            Array.isArray(sellIn)
        ) {

            for (const item of sellIn) {

                if (
                    item.ValorSellIn !== '' &&
                    item.ValorSellIn !== null &&
                    item.ValorSellIn !== undefined
                ) {

                    await pool.query(
                        `
                        INSERT INTO "TbSellIn"
                        (
                            "CodigoDistribuidor",
                            "ValorSellIn",
                            "MesAnoSellIn"
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            $3
                        )

                        ON CONFLICT
                        (
                            "CodigoDistribuidor",
                            "MesAnoSellIn"
                        )

                        DO UPDATE SET

                            "ValorSellIn" =
                            EXCLUDED."ValorSellIn"
                        `,
                        [
                            codigoDistribuidor,
                            item.ValorSellIn,
                            item.MesAnoSellIn
                        ]
                    );

                }

            }

        }

        res.json({
            sucesso: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            sucesso: false,
            erro: err.message
        });

    }

};