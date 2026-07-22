const pool = require('../config/database');


exports.listarItensAtivos =
async(req,res)=>{

    const resultado =
    await pool.query(`
    
        SELECT
            "CodigoItem",
            "ItemDescricao"

        FROM "TbItem"

        WHERE
            "Ativo" = true

        ORDER BY
            "ItemDescricao"

    `);

    res.json(
        resultado.rows
    );

};

exports.listarItens = async (req, res) => {

    try {

        const resultado =
            await pool.query(`

                SELECT *
                FROM "TbItem"
                ORDER BY "CodigoItem"

            `);

        res.json(resultado.rows);

    }
    catch(erro){

        res.status(500).json({
            erro: erro.message
        });

    }

};

exports.atualizarItem = async (req, res) => {

    try {

        const {
            ItemDescricao,
            Ativo,
            Display
        } = req.body;

        const resultado =
            await pool.query(`

                UPDATE "TbItem"

                SET

                    "ItemDescricao" = $1,
                    "Ativo" = $2,
                    "Display" = $3

                WHERE "CodigoItem" = $4

                RETURNING *

            `,
            [
                ItemDescricao,
                Ativo,
                Display,
                req.params.codigo
            ]);

        res.json(resultado.rows[0]);

    }
    catch(erro){

        res.status(500).json({
            erro: erro.message
        });

    }

};

exports.salvarItem = async (req, res) => {

    try {

        // Apenas operadores

        if (req.session.userNumero) {

            return res.status(403).json({
                sucesso: false,
                mensagem: 'Sem permissão'
            });

        }

        const {
            CodigoItem,
            ItemDescricao,
            Ativo,
            Display
        } = req.body;

        const resultado = await pool.query(`
            
            INSERT INTO "TbItem"
            (
                "CodigoItem",
                "ItemDescricao",
                "Ativo",
                "Display"
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4
            )
            RETURNING *

        `,
        [
            CodigoItem,
            ItemDescricao,
            Ativo,
            Display
        ]);

        res.status(201).json({
            sucesso: true,
            item: resultado.rows[0]
        });

    } catch (erro) {

        console.error(
            'Erro ao cadastrar item:',
            erro
        );

        res.status(500).json({
            sucesso: false,
            erro: erro.message
        });

    }


};