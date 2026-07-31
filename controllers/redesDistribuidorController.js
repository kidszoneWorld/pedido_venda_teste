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
            sucesso:false,
            erro:err.message,
            detalhe:err.detail
        });

    }

};

exports.inserirRede =
async(req,res)=>{

    try{

        const rede =
            req.body;

        console.log(
            'Nova rede recebida:',
            rede
        );

        if(!rede.RedeRazaoSocial){

            return res.status(400).json({
                sucesso:false,
                erro:'Informe a razão social da rede.'
            });

        }

        if(!rede.NomeFantasia){

            return res.status(400).json({
                sucesso:false,
                erro:'Informe o nome fantasia da rede.'
            });

        }

        if(!rede.DataInicioRede){

            return res.status(400).json({
                sucesso:false,
                erro:'Informe a data de início da rede.'
            });

        }

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
                "DataInicioRede",
                "ObservacaoRede"
            )

            VALUES
            (
                $1,$2,$3,$4,
                $5,$6,$7,$8,$9
            )
            `,
            [

                Number(
                    req.params.codigoDistribuidor
                ),

                rede.RedeRazaoSocial,

                rede.NomeFantasia,

                Number(
                    rede.LojaQuantidade || 0
                ),

                rede.UF || '',

                Number(
                    rede.SkuQuantidade || 0
                ),

                Number(
                    rede.ValorPrimeiraCompra || 0
                ),

                rede.DataInicioRede,

                rede.ObservacaoRede || ''

            ]

        );

        res.json({
            sucesso:true
        });

    }
    catch(err){

        console.error(
            'ERRO AO INSERIR REDE'
        );

        console.error(err);

        res.status(500).json({
            sucesso:false,
            erro:err.message,
            detalhe:err.detail
        });

    }

};

exports.atualizarRede =
async(req,res)=>{

    try{

        if(req.session.userNumero){

            return res.status(403).json({
                sucesso:false,
                erro:'Representantes não podem editar redes existentes.'
            });

        }

        const redes =
            req.body;

        for(const rede of redes){

            await pool.query(

                `
                UPDATE
                "TbRedes"

                SET

                    "RedeRazaoSocial" = $1,

                    "NomeFantasia" = $2,

                    "LojaQuantidade" = $3,

                    "UF" = $4,

                    "SkuQuantidade" = $5,

                    "ValorPrimeiraCompra" = $6,

                    "DataInicioRede" = $7,

                    "ObservacaoRede" = $8

                WHERE

                    "CodigoRede" = $9
                `,
                [

                    rede.RedeRazaoSocial,

                    rede.NomeFantasia,

                    Number(
                        rede.LojaQuantidade || 0
                    ),

                    rede.UF || '',

                    Number(
                        rede.SkuQuantidade || 0
                    ),

                    Number(
                        rede.ValorPrimeiraCompra || 0
                    ),

                    rede.DataInicioRede || null,

                    rede.ObservacaoRede || '',

                    Number(
                        rede.CodigoRede
                    )

                ]

            );

        }

        res.json({
            sucesso:true
        });

    }
    catch(err){

        console.error(
            'ERRO AO ATUALIZAR REDE'
        );

        console.error(err);

        res.status(500).json({
            sucesso:false,
            erro:err.message,
            detalhe:err.detail
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
            erro:err.message,
            detalhe:err.detail
        });

    }

};