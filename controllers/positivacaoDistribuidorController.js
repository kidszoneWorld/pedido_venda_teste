const pool =
require('../config/database');

exports.listarPositivacoes =
async(req,res)=>{

    try{

        const resultado =
        await pool.query(

            `
            SELECT *

            FROM
            "TbPositivacaoDistribuidor"

            WHERE

            "CodigoDistribuidor" = $1
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

exports.salvarPositivacao =
async(req,res)=>{

    try{

        const codigoDistribuidor =
        req.params.codigoDistribuidor;

        const registros =
        req.body;

        for(
            const registro
            of registros
        ){

            await pool.query(

                `
                INSERT INTO
                "TbPositivacaoDistribuidor"
                (
                    "CodigoDistribuidor",
                    "QuantidadePositivada",
                    "MesAnoPositivada"
                )

                VALUES
                (
                    $1,$2,$3
                )

                ON CONFLICT
                (
                    "CodigoDistribuidor",
                    "MesAnoPositivada"
                )

                DO UPDATE

                SET

                "QuantidadePositivada" =
                EXCLUDED
                ."QuantidadePositivada"
                `,
                [
                    codigoDistribuidor,
                    registro.QuantidadePositivada,
                    registro.MesAnoPositivada
                ]

            );

        }

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