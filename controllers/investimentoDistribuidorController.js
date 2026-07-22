const pool = require('../config/database');

exports.listarInvestimento =
async(req,res)=>{

    try{

        const resultado =
        await pool.query(

            `
            SELECT *

            FROM "TbInvestimentoDistribuidor"

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

        res.status(500).json({
            erro:err.message
        });

    }

};

exports.salvarInvestimentos =
async(req,res)=>{

    try{

        const codigoDistribuidor =
        req.params.codigoDistribuidor;

        for(
            const registro
            of req.body
        ){

            await pool.query(

                `
                INSERT INTO
                "TbInvestimentoDistribuidor"
                (
                    "CodigoDistribuidor",
                    "ValorInvestimento",
                    "MesAnoInvestimento"
                )

                VALUES
                (
                    $1,$2,$3
                )

                ON CONFLICT
                (
                    "CodigoDistribuidor",
                    "MesAnoInvestimento"
                )

                DO UPDATE

                SET

                    "ValorInvestimento" =
                    EXCLUDED
                    ."ValorInvestimento"
                `,
                [
                    codigoDistribuidor,
                    registro.ValorInvestimento,
                    registro.MesAnoInvestimento
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