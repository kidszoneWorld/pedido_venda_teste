const mongoose = require('mongoose');

const InvestimentosSchema = new mongoose.Schema({
    codigo_cliente: { type: String, required: true },
    nome: { type: String, required: true },
    representante:Number,
    ano: String,
    mes: String,
    realizado: Number,
    base_faturamento: Number,
    
    
}, { collection: 'investimentos' });

module.exports = mongoose.model('Investimentos', InvestimentosSchema);