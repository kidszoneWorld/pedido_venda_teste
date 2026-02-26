const nodemailer = require('nodemailer');
const { S3Client} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
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

exports.generateUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const key = `clientes/${Date.now()}-${fileName}`;

    // ✅ AQUI estava faltando isso
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, putCommand, {
      expiresIn: 300,
    });

    res.json({ uploadUrl, key });

  } catch (error) {
    console.error("Erro ao gerar URL:", error);
    res.status(500).json({ error: "Erro ao gerar URL" });
  }
};
exports.sendClientPdf = async (req, res) => {
  try {
    const { files, razaoSocial, emailTo, emailCc, subject, message } = req.body;
console.log("sendClientPdf FOI CHAMADO");
console.log("BODY RECEBIDO:", req.body);
    if (!files || !files.length || !emailTo || !subject || !message) {
      return res.status(400).send("Dados incompletos.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const downloadLinks = files.map(file => {
      return `- ${file.name}\n${process.env.DOWNLOAD_BASE_URL}/download/${file.key}\n`;
    }).join("\n");

    await transporter.sendMail({
      from: 'Cadastro clientes KidsZone <kidszoneworldinvestimento@gmail.com>',
      to: emailTo.split(";").map(email => email.trim()),
      cc: emailCc ? emailCc.split(";").map(email => email.trim()) : [],
      subject,
      text: `
${message}

Baixe os arquivos abaixo:

${downloadLinks}

(O download será iniciado automaticamente.)
      `
    });

    res.status(200).send("E-mail enviado com sucesso!");

  } catch (error) {
    console.error("ERRO REAL:", error);
    res.status(500).send(error.message);
  }
};
 
 
 //finally {
//     setTimeout(() => emailsRecentes.delete(emailKey), 10000);
//   }
