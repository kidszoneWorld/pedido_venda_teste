const nodemailer = require('nodemailer');
const { S3Client} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Rebaixa = require('../models/Rebaixa');
const Counter = require('../models/Counter');
const connectDB = require('../config/database');

const crypto = require("crypto");

let emailsRecentes = new Map();

// Cliente R2 (Cloudflare)
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});
const { PutObjectCommand } = require("@aws-sdk/client-s3");

// lista as Rebaixas
exports.listarRebaixas = async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT *
            FROM "TbRebaixas"
            ORDER BY "RebId" DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            data: [],
            error: err.message
        });

    }
};

exports.buscarRebaixaPorId = async (req, res) => {

    try {

        const id = req.params.id;

        const reb = await pool.query(`
            SELECT *
            FROM "TbRebaixas"
            WHERE "RebId" = $1
        `,[id]);

        if(reb.rows.length === 0){
            return res.status(404).json({
                error:"Rebaixa não encontrada"
            });
        }

        const produtos = await pool.query(`
            SELECT *
            FROM "TbRebaixaProdutos"
            WHERE "RebId"=$1
            ORDER BY "RebProdId"
        `,[id]);

        const retorno = reb.rows[0];

        retorno.produtos = produtos.rows;

        res.json(retorno);

    } catch(err){

        res.status(500).json({
            success:false,
            error:err.message
        });

    }

};

exports.atualizarRebaixa = async (req,res)=>{

    try{

        let {status, finalizado, nfVinculada} = req.body;

        status = status?.toLowerCase();

        if(status=="pendente")
            finalizado=0;

        if(status=="reprovado")
            finalizado=1;

        const result = await pool.query(`

            UPDATE "TbRebaixas"

            SET
                "Status"=$1,
                "Finalizado"=$2,
                "NfVinculada"=$3

            WHERE "RebId"=$4

            RETURNING *

        `,[
            status,
            finalizado,
            nfVinculada,
            req.params.id
        ]);

        res.json(result.rows[0]);

    }
    catch(err){

        res.status(500).json({
            error:err.message
        });

    }

};
// Salvar rebaixa
exports.salvarRebaixa = async (req,res)=>{

    const client = await pool.connect();

    try{

        await client.query("BEGIN");

        const {

            produtos,

            cnpj,
            razaosocial,
            endereco,
            cidade,
            Cep,
            email,
            representante,
            codCliente,
            bairro,
            uf,
            telefone,
            emailFiscal,
            data,
            motivo,
            status,
            finalizado,
            nfVinculada

        } = req.body;

        const reb = await client.query(`

            INSERT INTO "TbRebaixas"
            (

                "Cnpj",
                "RazaoSocial",
                "Endereco",
                "Cidade",
                "Cep",
                "Email",
                "Representante",
                "CodCliente",
                "Bairro",
                "Uf",
                "Telefone",
                "EmailFiscal",
                "Data",
                "Motivo",
                "Status",
                "Finalizado",
                "NfVinculada"

            )

            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,
                $10,$11,$12,$13,$14,$15,$16,$17
            )

            RETURNING *

        `,[

            cnpj,
            razaosocial,
            endereco,
            cidade,
            Cep,
            email,
            representante,
            codCliente,
            bairro,
            uf,
            telefone,
            emailFiscal,
            data,
            motivo,
            status,
            finalizado,
            nfVinculada

        ]);

        const rebId = reb.rows[0].RebId;

        for(const item of produtos){

            await client.query(`

                INSERT INTO "TbRebaixaProdutos"
                (

                    "RebId",
                    "NfOrigem",
                    "CodigoItem",
                    "Descricao",
                    "Lote",
                    "PrecoUnitario",
                    "Rebaixa",
                    "Atual",
                    "Quantidade",
                    "Total"

                )

                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)

            `,[

                rebId,
                item.nforigem,
                item.codigoItem,
                item.descricao,
                item.lote,
                item.precounitario,
                item.rebaixa,
                item.atual,
                item.quantidade,
                item.total

            ]);

        }

        await client.query("COMMIT");

        res.json(reb.rows[0]);

    }
    catch(err){

        await client.query("ROLLBACK");

        res.status(500).json({
            error:err.message
        });

    }
    finally{

        client.release();

    }

};

// Buscar Rebaixas
exports.listarRebaixas = async (req, res) => {
  try {
    const rebaixas = await Rebaixa.find();
    res.json({
  success: true,
  data: rebaixas
});
  } catch (err) {
    res.status(500).json({
  success: false,
  data: [],
  error: err.message
});
  }
};


exports.generateUploadUrlReb = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

  //  substitui espaços por "-"

    const normalizeFileName = (name) => {
  return name
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "-") // espaço vira "-"
    .replace(/[^a-zA-Z0-9.-]/g, "") // remove caracteres especiais
    .toLowerCase();
};
  const safeFileName = normalizeFileName(fileName);

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const key = `rebaixas/${Date.now()}-${safeFileName}`;

const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: fileType,
    });
    
        const uploadUrlReb = await getSignedUrl(s3, putCommand, {
          expiresIn: 300,
        });
    
        res.json({ uploadUrlReb, key });
    
      } catch (error) {
        console.error("Erro ao gerar URL:", error);
        res.status(500).json({ error: "Erro ao gerar URL" });
      }
    };
    exports.sendClientPdfReb = async (req, res) => {
      try {
        const { files, razaoSocial, emailTo, emailCc, subject, message } = req.body;
    
        console.log("sendClientPdf FOI CHAMADO");
        console.log("BODY RECEBIDO:", req.body);
    
        if (!files || !files.length || !emailTo || !subject || !message) {
          return res.status(400).send("Dados incompletos.");
        }
    
        console.log("📎 Arquivos recebidos:", files);
    
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });
    
        const downloadLinks = files.map(file => {
          return `- ${file.name}\n${process.env.DOWNLOAD_BASE_URL}/baixar/${file.key}\n`;
        }).join("\n");
    
        console.log("📧 Tentando enviar e-mail...");
    const info = await transporter.sendMail({
      from: "Rebaixas KIDS ZONE <kidzonkidszonemail@gmail.com>",
      to: "comercial.kz@kidszoneworld.com.br", //trocar depois
      cc: emailCc ? emailCc.split(";").map(email => email.trim()) : [],
      subject,
      text: `
${message}


Baixe os arquivos abaixo:

${downloadLinks}

(O download será iniciado automaticamente.)
      `
    });

    console.log("✅ E-mail enviado:", info.response);
    return res.status(200).send("E-mail enviado com sucesso!");
    
  } catch (error) {
    console.error("❌ ERRO REAL:", error);
    return res.status(500).send(error.message);
  }
  finally {
    //setTimeout(() => emailsRecentes.delete(emailKey), 10000);

  }
};
 