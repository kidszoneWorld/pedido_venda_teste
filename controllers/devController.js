const nodemailer = require('nodemailer');
const { S3Client} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Devolucao = require('../models/Devolucao');
const Counter = require('../models/Counter');
const connectDB = require('../config/db');

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

// lista as devolucoes
exports.listarDevolucoes = async (req, res) => {
  try {
    const devolucoes = await Devolucao.find().sort({ data: -1 });

    res.json({
      success: true,
      data: devolucoes
    });

  } catch (err) {
    console.error("Erro listarDevolucoes:", err);

    res.status(500).json({
      success: false,
      data: [],
      error: err.message
    });
  }
};

exports.buscarDevolucaoPorId = async (req, res) => {
  try {
    const dev = await Devolucao.findById(req.params.id);

    if (!dev) {
      return res.status(404).json({ error: 'Devolução não encontrada' });
    }

    res.json(dev);

  } catch (err) {
    res.status(500).json({
  success: false,
  data: [],
  error: err.message
});
  }
};

exports.atualizarDevolucao = async (req, res) => {
  try {
    let { status, finalizado, nfVinculada } = req.body;

    const statusLower = status?.toLowerCase();

    // REGRAS DE NEGÓCIO
    if (statusLower === 'pendente') {
      finalizado = 0;
    }

    if (statusLower === 'reprovado') {
      finalizado = 1;
    }

    const dev = await Devolucao.findByIdAndUpdate(
      req.params.id,
      { status: statusLower, finalizado, nfVinculada},
      { new: true }
    );

    res.json(dev);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Salvar devolução
exports.salvarDevolucao = async (req, res) => {
  try {

    // gera número sequencial
    const contador = await Counter.findOneAndUpdate(
      { name: 'devolucao' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const novoNumero = contador.seq;

    const novaDevolucao = new Devolucao({
      ...req.body,
      pedidoId: novoNumero
    });

    await novaDevolucao.save();

    res.json(novaDevolucao);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Buscar devoluções
exports.listarDevolucoes = async (req, res) => {
  try {
    const devolucoes = await Devolucao.find();
    res.json({
  success: true,
  data: devolucoes
});
  } catch (err) {
    res.status(500).json({
  success: false,
  data: [],
  error: err.message
});
  }
};


exports.generateUploadUrlDev = async (req, res) => {
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

    const key = `devolucoes/${Date.now()}-${safeFileName}`;

const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: fileType,
    });
    
        const uploadUrlDev = await getSignedUrl(s3, putCommand, {
          expiresIn: 300,
        });
    
        res.json({ uploadUrlDev, key });
    
      } catch (error) {
        console.error("Erro ao gerar URL:", error);
        res.status(500).json({ error: "Erro ao gerar URL" });
      }
    };
    exports.sendClientPdfDev = async (req, res) => {
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
      from: "Devoluções KIDS ZONE <kidzonkidszonemail@gmail.com>",
      to: "devolucao.kz@kidszoneworld.com.br",
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
 