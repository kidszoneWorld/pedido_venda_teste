const pool =
require('../config/database');

exports.listarSellOut =
async(req,res)=>{

    try{

        const resultado =
        await pool.query(
            `
            SELECT *
            FROM "TbSellOut"
            WHERE "CodigoDistribuidor" = $1
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
            erro:err.message
        });

    }

};

exports.salvarSellOut =
async(req,res)=>{

    try{

        const codigoDistribuidor =
        req.params.codigoDistribuidor;

        const registros =
        req.body;

        for(const registro of registros){

            await pool.query(
                `
                INSERT INTO "TbSellOut"
                (
                    "CodigoDistribuidor",
                    "CodigoItem",
                    "SellOutQuantidade",
                    "MesAnoSellOut"
                )
                VALUES
                (
                    $1,$2,$3,$4
                )

                ON CONFLICT
                (
                    "CodigoDistribuidor",
                    "CodigoItem",
                    "MesAnoSellOut"
                )

                DO UPDATE SET

                    "SellOutQuantidade" =
                    EXCLUDED."SellOutQuantidade"
                `,
                [
                    codigoDistribuidor,
                    registro.CodigoItem,
                    registro.SellOutQuantidade,
                    registro.MesAnoSellOut
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