const pool = require('../config/database');
function apenasNumeros(valor){

    return String(valor || '').replace(/\D/g, '');

}

function validarCNPJ(cnpj){

    cnpj = apenasNumeros(cnpj);

    if(cnpj.length !== 14){
        return false;
    }

    if(/^(\d)\1+$/.test(cnpj)){
        return false;
    }

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){

        soma += Number(numeros.charAt(tamanho - i)) * pos--;

        if(pos < 2){
            pos = 9;
        }

    }

    let resultado = soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(0))){
        return false;
    }

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){

        soma += Number(numeros.charAt(tamanho - i)) * pos--;

        if(pos < 2){
            pos = 9;
        }

    }

    resultado = soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(1))){
        return false;
    }

    return true;

}
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
        if(
            !RazaoSocial ||
            !CNPJ ||
            !Cidade ||
            !UF ||
            !Representante
        ){

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Preencha todos os campos obrigatórios.'
            });

        }

        if(!validarCNPJ(CNPJ)){

            return res.status(400).json({
                sucesso: false,
                mensagem: 'CNPJ inválido.'
            });

        }
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
            ORDER BY "CodigoDistribuidor"

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