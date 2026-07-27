const pool =
require('../config/database');

exports.listarRedes =
async(req,res)=>{

    try{

        const resultado =
        await pool.query(

            `
            SELECT *

            FROM "TbRedes"

            WHERE
            "CodigoDistribuidor" = $1

            ORDER BY
            "RedeRazaoSocial"
            `,
            [
                req.params.codigoDistribuidor
            ]

        );

        res.json(
            resultado.rows
        );

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            erro:err.message
        });

    }

};

exports.inserirRede =
async(req,res)=>{

    try{

        const rede =
        req.body;

        await pool.query(

            `
            INSERT INTO
            "TbRedes"
            (
                "CodigoDistribuidor",
                "RedeRazaoSocial",
                "NomeFantasia",
                "LojaQuantidade",
                "UF",
                "SkuQuantidade",
                "ValorPrimeiraCompra",
                "RedeMesAno",
                "ObservacaoRede"
            )

            VALUES
            (
                $1,$2,$3,$4,
                $5,$6,$7,$8,$9
            )
            `,
            [

                req.params.codigoDistribuidor,

                rede.RedeRazaoSocial,

                rede.NomeFantasia,

                rede.LojaQuantidade,

                rede.UF,

                rede.SkuQuantidade,

                rede.ValorPrimeiraCompra,

                rede.RedeMesAno,

                rede.ObservacaoRede

            ]

        );

        res.json({
            sucesso:true
        });

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            sucesso:false,
            erro:err.message
        });

    }

};

exports.atualizarRede =
async(req,res)=>{
    if(req.session.userNumero){

        return res.status(403).json({
            sucesso:false,
            erro:'Representantes não podem editar redes existentes.'
        });

    }
    try{

        const redes =
        req.body;

        for(const rede of redes){

            await pool.query(

                `
                UPDATE
                "TbRedes"

                SET

                "RedeRazaoSocial"=$1,

                "NomeFantasia"=$2,

                "LojaQuantidade"=$3,

                "UF"=$4,

                "SkuQuantidade"=$5,

                "ValorPrimeiraCompra"=$6,

                "RedeMesAno"=$7,

                "ObservacaoRede"=$8

                WHERE

                "CodigoRede"=$9
                `,
                [

                    rede.RedeRazaoSocial,

                    rede.NomeFantasia,

                    rede.LojaQuantidade,

                    rede.UF,

                    rede.SkuQuantidade,

                    rede.ValorPrimeiraCompra,

                    rede.RedeMesAno,

                    rede.ObservacaoRede,

                    rede.CodigoRede

                ]

            );

        }

        res.json({
            sucesso:true
        });

    }
catch(err){

    console.error('ERRO INSERT REDE');

    console.error(err);

    console.error(err.detail);

    console.error(err.message);

    res.status(500).json({

        sucesso:false,

        erro: err.message,

        detalhe: err.detail

    });

}

};

exports.excluirRede =
async(req,res)=>{

    try{

        if(req.session.userNumero){

            return res.status(403).json({
                sucesso:false,
                erro:'Representantes não podem excluir redes existentes.'
            });

        }

        await pool.query(

            `
            DELETE

            FROM "TbRedes"

            WHERE

            "CodigoRede" = $1
            `,
            [
                req.params.codigoRede
            ]

        );

        res.json({
            sucesso:true
        });

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            sucesso:false,
            erro:err.message
        });

    }

};