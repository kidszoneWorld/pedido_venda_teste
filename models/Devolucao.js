const mongoose = require('mongoose');

const DevolucaoSchema = new mongoose.Schema({
      pedidoId: String,
      cnpj: String,
      razaosocial: String,
      endereco: String,
      cidade: String,
      Cep: String,
      email: String,
      representante: String,
      codCliente: Number,
      bairro: String,
      uf: String,
      telefone: String,
      emailFiscal: String,
      data: String,
      motivo: String,
  produtos: [
    {
      nforigem: String,
      data: Date,
      codigoItem: String,
      lote: String,
      quantidade: Number,
      uv: String,
      descricao: String,
      precounitario: Number,
      total: Number
    }
  ],
});

module.exports = mongoose.model('Devolucao', DevolucaoSchema);