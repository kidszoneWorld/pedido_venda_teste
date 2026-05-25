const mongoose = require('mongoose');

const RebaixaSchema = new mongoose.Schema({
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
      status: String,
      finalizado: Number,
      nfVinculada: String,
  produtos: [
    {
      nforigem: String,
      codigoItem: String,
      descricao: String,
      lote: String,
      precounitario: Number,
      rebaixa: Number,
      atual: Number,
      quantidade: Number,
      total: Number
    }
  ],
});

module.exports = mongoose.model('Rebaixa', RebaixaSchema);