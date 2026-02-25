const nodemailer = require('nodemailer');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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

exports.sendClientPdf = async (req, res) => {
console.log("Tamanho do body:", JSON.stringify(req.body).length);

    const { pdfBase64, additionalAttachments, razaoSocial, emailTo, emailCc, subject, message } = req.body;

  if (!pdfBase64 || !razaoSocial || !emailTo || !subject || !message) {
    return res.status(400).send('Dados incompletos.');
  }

  const emailKey = `${razaoSocial}-${emailTo}-${subject}-${Date.now()}`;

  if (emailsRecentes.has(emailKey)) {
    return res.status(429).send('E-mail já enviado recentemente.');
  }

  try {
    emailsRecentes.set(emailKey, Date.now());

    // 🔥 1️⃣ Gerar ID único
    const fileId = crypto.randomUUID() + ".pdf";

    // 🔥 2️⃣ Converter base64 para buffer
    const pdfBuffer = Buffer.from(pdfBase64.split(",")[1], "base64");

    // 🔥 Upload anexos adicionais
let uploadedFiles = [];

if (additionalAttachments && additionalAttachments.length > 0) {
  for (const file of additionalAttachments) {

    const fileId = crypto.randomUUID() + "-" + file.filename;
    const buffer = Buffer.from(file.base64.split(",")[1], "base64");

    await s3.send(
      new PutObjectCommand({
        Bucket: "cadastro-clientes",
        Key: fileId,
        Body: buffer,
        ContentType: "application/octet-stream"
      })
    );

    const fileLink = `${process.env.DOWNLOAD_BASE_URL}/download/${fileId}`;
uploadedFiles.push({
  name: file.filename,
  link: fileLink
});
  }
}

    // 🔥 3️⃣ Upload para R2
    await s3.send(
      new PutObjectCommand({
        Bucket: "cadastro-clientes",
        Key: fileId,
        Body: pdfBuffer,
        ContentType: "application/pdf"
      })
    );

    // 🔥 4️⃣ Gerar link de download (Worker)
    const downloadLink = `${process.env.DOWNLOAD_BASE_URL}/download/${fileId}`;


    let attachmentsText = `PDF Pedido:\n${downloadLink}\n\n`;

if (uploadedFiles.length > 0) {
  attachmentsText += `Anexos adicionais:\n`;

  uploadedFiles.forEach(file => {
    attachmentsText += `- ${file.name}\n${file.link}\n\n`;
  });
}

    // 🔥 5️⃣ Configurar transporte Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const ccEmails = emailCc
      ? emailCc.split(';').map(email => email.trim())
      : [];
    console.log(ccEmails)
    // 🔥 6️⃣ Enviar email apenas com link
    console.log("Antes do sendMail");
    await transporter.sendMail({
      from: 'Cadastro clientes KidsZone <kidszoneworldinvestimento@gmail.com>',
      to: emailTo.split(';').map(email => email.trim()),
      cc: 'ti.kz@kidszoneworld.com.br',
      subject: subject,
      text: `
${message}

Baixe os arquivos clicando nos links abaixo:

${attachmentsText}

(O download será iniciado automaticamente.)
`
    });
console.log("Depois do sendMail");
    res.status(200).send('E-mail enviado com sucesso!');
  } catch (error) {
  console.error("ERRO REAL:", error);
  res.status(500).send(error.message);
 }//finally {
//     setTimeout(() => emailsRecentes.delete(emailKey), 10000);
//   }
};