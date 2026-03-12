const mongoose = require('mongoose');

const SellOutSchema = new mongoose.Schema({
    codigo_cliente: { type: String, required: true },
    nome: { type: String, required: true },
    representante:Number,
    ano: String,
    mes: String,
    meta: Number,
    realizado: Number,
    atingido: Number
    
    
}, { collection: 'sell_out' });

module.exports = mongoose.model('SellOut', SellOutSchema);