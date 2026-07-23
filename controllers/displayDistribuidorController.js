const pool = require('../config/database');

exports.listarDisplays = async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT *
            FROM "TbDisplay"
            WHERE "CodigoDistribuidor" = $1
            ORDER BY "MesAnoDisplay", "RazaoSocialDisplay"
            `,
            [
                req.params.codigoDistribuidor
            ]
        );

        res.json(resultado.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            sucesso: false,
            erro: err.message
        });

    }

};

exports.inserirDisplay = async (req, res) => {

    try {

        const display = req.body;

        await pool.query(
            `
            INSERT INTO "TbDisplay"
            (
                "CodigoDistribuidor",
                "CodigoItem",
                "RazaoSocialDisplay",
                "CnpjDisplay",
                "EnderecoDisplay",
                "BairroDisplay",
                "CidadeDisplay",
                "UF",
                "ValorDisplay",
                "MesAnoDisplay"
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
            )
            `,
            [
                req.params.codigoDistribuidor,
                display.CodigoItem,
                display.RazaoSocialDisplay,
                display.CnpjDisplay,
                display.EnderecoDisplay,
                display.BairroDisplay,
                display.CidadeDisplay,
                display.UF,
                display.ValorDisplay,
                display.MesAnoDisplay
            ]
        );

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

exports.atualizarDisplays = async (req, res) => {

    try {

        const displays = req.body;

        for (const display of displays) {

            await pool.query(
                `
                UPDATE "TbDisplay"

                SET
                    "CodigoItem" = $1,
                    "RazaoSocialDisplay" = $2,
                    "CnpjDisplay" = $3,
                    "EnderecoDisplay" = $4,
                    "BairroDisplay" = $5,
                    "CidadeDisplay" = $6,
                    "UF" = $7,
                    "ValorDisplay" = $8,
                    "MesAnoDisplay" = $9

                WHERE
                    "CodigoDisplay" = $10
                `,
                [
                    display.CodigoItem,
                    display.RazaoSocialDisplay,
                    display.CnpjDisplay,
                    display.EnderecoDisplay,
                    display.BairroDisplay,
                    display.CidadeDisplay,
                    display.UF,
                    display.ValorDisplay,
                    display.MesAnoDisplay,
                    display.CodigoDisplay
                ]
            );

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

exports.excluirDisplay = async (req, res) => {

    try {

        await pool.query(
            `
            DELETE
            FROM "TbDisplay"
            WHERE "CodigoDisplay" = $1
            `,
            [
                req.params.codigoDisplay
            ]
        );

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