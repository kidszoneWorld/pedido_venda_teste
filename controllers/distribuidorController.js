const pool = require('../config/database');

exports.atualizarDistribuidor = async (req,res)=>{

    try{

        if(req.session.userNumero){

            return res.status(403).json({
                sucesso:false,
                mensagem:'Sem permissão'
            });

        }

        const {
            RazaoSocial,
            CNPJ,
            Cidade,
            UF,
            Representante
        } = req.body;

        const resultado =
        await pool.query(`

            UPDATE "TbDistribuidor"

            SET
                "RazaoSocial"=$1,
                "CNPJ"=$2,
                "Cidade"=$3,
                "UF"=$4,
                "Representante"=$5

            WHERE
                "CodigoDistribuidor"=$6

            RETURNING *

        `,
        [
            RazaoSocial,
            CNPJ,
            Cidade,
            UF,
            Representante,
            req.params.codigo
        ]);

        res.json({
            sucesso:true,
            dados:resultado.rows[0]
        });

    }catch(err){

        res.status(500).json({
            sucesso:false,
            erro:err.message
        });

    }

};

exports.listarDistribuidores = async (req, res) => {

    try {

        const userNumero = req.session.userNumero;

        let query;
        let params = [];

        if(userNumero){

            query = `
                SELECT *
                FROM "TbDistribuidor"
                WHERE "Representante" = $1
                ORDER BY "RazaoSocial"
            `;

            params.push(userNumero);

        }else{

            query = `
                SELECT *
                FROM "TbDistribuidor"
                ORDER BY "RazaoSocial"
            `;
        }

        const resultado = await pool.query(
            query,
            params
        );

        res.json(resultado.rows);

    } catch(error){

        console.error(error);

        res.status(500).json({
            erro: 'Erro ao carregar distribuidores'
        });

    }

};


exports.salvarDistribuidor = async (req, res) => {

if(req.session.userNumero){

    return res.status(403).json({
        sucesso: false,
        mensagem: 'Sem permissão'
    });

}
console.log(req.body);
    try {

        const {
            RazaoSocial,
            CNPJ,
            Cidade,
            UF,
            Representante
        } = req.body;
        console.log(req.body);
        const sql = `
            INSERT INTO "TbDistribuidor"
            (
                "RazaoSocial",
                "CNPJ",
                "Cidade",
                "UF",
                "Representante"
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING *
        `;

        const resultado = await pool.query(
            sql,
            [
                RazaoSocial,
                CNPJ,
                Cidade,
                UF,
                Representante
            ]
        );

        return res.status(201).json({
            sucesso: true,
            distribuidor: resultado.rows[0]
        });

    } catch (erro) {

    console.error(
        'Erro ao cadastrar distribuidor:',
        erro
    );

    return res.status(500).json({
        sucesso: false,
        erro: erro.message,
        detalhe: erro
    });

}

};

exports.buscarDistribuidor = async (req,res)=>{

    try{

        const resultado =
        await pool.query(`

            SELECT *
            FROM "TbDistribuidor"
            WHERE "CodigoDistribuidor"=$1
            ORDER BY CodigoDistribuidor

        `,[req.params.codigo]);

        res.json(
            resultado.rows[0]
        );

    }
    catch(err){

        res.status(500).json({
            erro:err.message
        });

    }

}