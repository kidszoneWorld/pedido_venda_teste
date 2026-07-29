const pool = require('../config/database');

exports.excluirContato = async (req,res)=>{

    try{

        await pool.query(

            `
            DELETE
            FROM "TbContatoDistribuidor"
            WHERE "CodigoContato" = $1
            `,
            [
                req.params.codigoContato
            ]

        );

        res.json({
            sucesso:true
        });

    }
    catch(err){

        res.status(500).json({
            sucesso:false,
            erro:err.message
        });

    }

};


exports.salvarContato = async (req,res)=>{

    try{

        const {
            NomeContato,
            FuncaoContato,
            DataNascimentoContato,
            HobbyContato,
            EmailContato,
            TelefoneContato,
            ObservacaoContato
        } = req.body;

        if(
            !NomeContato ||
            !FuncaoContato ||
            !EmailContato ||
            !TelefoneContato
        ){

            return res.status(400).json({
                sucesso:false,
                mensagem:'Nome, Função, E-mail e Telefone são obrigatórios.'
            });

        }

        const resultado =
        await pool.query(

            `
            INSERT INTO
            "TbContatoDistribuidor"
            (
                "CodigoDistribuidor",
                "NomeContato",
                "FuncaoContato",
                "DataNascimentoContato",
                "HobbyContato",
                "EmailContato",
                "TelefoneContato",
                "ObservacaoContato"
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8
            )
            RETURNING *
            `,
            [
                req.params.codigo,
                NomeContato,
                FuncaoContato,
                DataNascimentoContato,
                HobbyContato,
                EmailContato,
                TelefoneContato,
                ObservacaoContato
            ]

        );

        res.json({
            sucesso:true,
            contato:resultado.rows[0]
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

exports.buscarContato = async (req,res)=>{

    try{

        const resultado =
        await pool.query(

            `
            SELECT *
            FROM "TbContatoDistribuidor"
            WHERE "CodigoContato" = $1
            `,
            [
                req.params.codigoContato
            ]

        );

        res.json(
            resultado.rows[0]
        );

    }
    catch(err){

        res.status(500).json({
            erro:err.message
        });

    }

};

exports.atualizarContato = async (req,res)=>{

    try{

        const isRepresentante =
            !!req.session.userNumero;

        if(isRepresentante){

            const {
                ObservacaoContato
            } = req.body;

            const resultado =
            await pool.query(

                `
                UPDATE
                "TbContatoDistribuidor"

                SET
                    "ObservacaoContato" = $1

                WHERE
                    "CodigoContato" = $2

                RETURNING *
                `,
                [
                    ObservacaoContato,
                    req.params.codigoContato
                ]

            );

            return res.json({
                sucesso:true,
                contato:
                    resultado.rows[0]
            });

        }

        const {
            NomeContato,
            FuncaoContato,
            DataNascimentoContato,
            HobbyContato,
            EmailContato,
            TelefoneContato,
            ObservacaoContato
        } = req.body;

        if(
            !NomeContato ||
            !FuncaoContato ||
            !EmailContato ||
            !TelefoneContato
        ){

            return res.status(400).json({
                sucesso:false,
                erro:'Nome, Função, E-mail e Telefone são obrigatórios.'
            });

        }

        const resultado =
        await pool.query(

            `
            UPDATE
            "TbContatoDistribuidor"

            SET

                "NomeContato"=$1,
                "FuncaoContato"=$2,
                "DataNascimentoContato"=$3,
                "HobbyContato"=$4,
                "EmailContato"=$5,
                "TelefoneContato"=$6,
                "ObservacaoContato"=$7

            WHERE

                "CodigoContato"=$8

            RETURNING *

            `,
            [
                NomeContato,
                FuncaoContato,
                DataNascimentoContato,
                HobbyContato,
                EmailContato,
                TelefoneContato,
                ObservacaoContato,
                req.params.codigoContato
            ]

        );

        res.json({
            sucesso:true,
            contato:
                resultado.rows[0]
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

exports.listarContatos =
async(req,res)=>{

    try{

        const resultado =
        await pool.query(`

            SELECT *
            FROM "TbContatoDistribuidor"

            WHERE
            "CodigoDistribuidor" = $1

            ORDER BY
            "NomeContato"

        `,
        [
            req.params.codigo
        ]);

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