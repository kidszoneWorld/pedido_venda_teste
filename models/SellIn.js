const mongoose = require('mongoose');

const SellInSchema = new mongoose.Schema({
    codigo_cliente: { type: String, required: true },
    nome: { type: String, required: true },
    representante:Number,
    ano: String,
    mes: String,
    meta: Number,
    realizado: Number,
    atingido: Number
    
}, { collection: 'sell_in' });

module.exports = mongoose.model('SellIn', SellInSchema);