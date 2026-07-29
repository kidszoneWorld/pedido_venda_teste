const pool =
require('../config/database');

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

            ORDER BY
                "DataInvestimento" DESC,
                "CodigoInvestimento" DESC
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

exports.inserirInvestimento =
async(req,res)=>{

    try{

        if(req.session.userNumero){

            return res.status(403).json({
                sucesso:false,
                erro:'Representantes não podem cadastrar investimentos.'
            });

        }

        const codigoDistribuidor =
            req.params.codigoDistribuidor;

        const investimento =
            req.body;

        if(
            !investimento.TipoInvestimento ||
            !investimento.DataInvestimento ||
            !investimento.ValorInvestimento
        ){

            return res.status(400).json({
                sucesso:false,
                erro:'Tipo, data e valor são obrigatórios.'
            });

        }

        await pool.query(

            `
            INSERT INTO
            "TbInvestimentoDistribuidor"
            (
                "CodigoDistribuidor",
                "TipoInvestimento",
                "DataInvestimento",
                "ValorInvestimento",
                "ObservacaoInvestimento"
            )

            VALUES
            (
                $1,$2,$3,$4,$5
            )
            `,
            [
                codigoDistribuidor,
                investimento.TipoInvestimento,
                investimento.DataInvestimento,
                investimento.ValorInvestimento,
                investimento.ObservacaoInvestimento
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

exports.atualizarInvestimentos =
async(req,res)=>{

    try{

        if(req.session.userNumero){

            return res.status(403).json({
                sucesso:false,
                erro:'Representantes não podem editar investimentos.'
            });

        }

        const investimentos =
            req.body;

        for(const investimento of investimentos){

            await pool.query(

                `
                UPDATE
                "TbInvestimentoDistribuidor"

                SET
                    "TipoInvestimento" = $1,
                    "DataInvestimento" = $2,
                    "ValorInvestimento" = $3,
                    "ObservacaoInvestimento" = $4

                WHERE
                    "CodigoInvestimento" = $5
                `,
                [
                    investimento.TipoInvestimento,
                    investimento.DataInvestimento,
                    investimento.ValorInvestimento,
                    investimento.ObservacaoInvestimento,
                    investimento.CodigoInvestimento
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

exports.listarTiposInvestimento =
async(req,res)=>{

    try{

        const resultado =
        await pool.query(
            `
            SELECT
                "CodigoTipoInvestimento",
                "TipoInvestimento"

            FROM "TbTipoInvestimento"

            WHERE
                "Ativo" = true

            ORDER BY
                "TipoInvestimento"
            `
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

exports.criarTipoInvestimento =
async(req,res)=>{

    try{

        if(req.session.userNumero){

            return res.status(403).json({
                sucesso:false,
                erro:'Representantes não podem criar tipos de investimento.'
            });

        }

        const {
            TipoInvestimento
        } = req.body;

        if(!TipoInvestimento){

            return res.status(400).json({
                sucesso:false,
                erro:'Informe o tipo de investimento.'
            });

        }

        await pool.query(

            `
            INSERT INTO
            "TbTipoInvestimento"
            (
                "TipoInvestimento"
            )

            VALUES
            (
                $1
            )

            ON CONFLICT
            (
                "TipoInvestimento"
            )

            DO NOTHING
            `,
            [
                TipoInvestimento
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