const pool = require('../config/database');

function apenasNumeros(valor){

    return String(valor || '').replace(/\D/g, '');

}

function validarCNPJ(cnpj){

    cnpj = apenasNumeros(cnpj);

    if(cnpj.length !== 14){
        return false;
    }

    if(/^(\d)\1+$/.test(cnpj)){
        return false;
    }

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){

        soma += Number(
            numeros.charAt(tamanho - i)
        ) * pos--;

        if(pos < 2){
            pos = 9;
        }

    }

    let resultado =
        soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(0))){
        return false;
    }

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){

        soma += Number(
            numeros.charAt(tamanho - i)
        ) * pos--;

        if(pos < 2){
            pos = 9;
        }

    }

    resultado =
        soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(1))){
        return false;
    }

    return true;

}

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
        if(!display.CnpjDisplay){

                return res.status(400).json({
                    sucesso:false,
                    erro:'CNPJ obrigatório.'
                });

            }

            if(!validarCNPJ(display.CnpjDisplay)){

                return res.status(400).json({
                    sucesso:false,
                    erro:'CNPJ inválido.'
                });

            }
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
            if(!display.CnpjDisplay){

                return res.status(400).json({
                    sucesso:false,
                    erro:'CNPJ obrigatório.'
                });

            }

            if(!validarCNPJ(display.CnpjDisplay)){

                return res.status(400).json({
                    sucesso:false,
                    erro:'CNPJ inválido.'
                });

            }
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