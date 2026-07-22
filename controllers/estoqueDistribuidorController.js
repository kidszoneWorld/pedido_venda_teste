const pool = require('../config/database');

exports.listarEstoqueDistribuidor =
async(req,res)=>{

    const resultado =
    await pool.query(`

        SELECT *

        FROM "TbEstoqueDistribuidor"

        WHERE
        "CodigoDistribuidor"=$1

    `,
    [
        req.params.codigoDistribuidor
    ]);

    res.json(
        resultado.rows
    );

};

exports.salvarEstoque = async (req,res)=>{
    console.log('Salvar estoque clicado');
    try{

        const codigoDistribuidor =
            req.params.codigoDistribuidor;

        const registros =
            req.body;
        console.log(registros);
        for(const registro of registros){

            await pool.query(

                `
                INSERT INTO
                "TbEstoqueDistribuidor"
                (
                    "CodigoDistribuidor",
                    "CodigoItem",
                    "Quantidade",
                    "MesAnoEstoque"
                )
                VALUES
                (
                    $1,$2,$3,$4
                )

                ON CONFLICT
                (
                    "CodigoDistribuidor",
                    "CodigoItem",
                    "MesAnoEstoque"
                )

                DO UPDATE SET

                    "Quantidade" =
                    EXCLUDED."Quantidade"
                `,
                [
                    codigoDistribuidor,
                    registro.CodigoItem,
                    registro.Quantidade,
                    registro.MesAnoEstoque
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