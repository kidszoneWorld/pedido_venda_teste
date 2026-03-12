const mongoose = require('mongoose');

const RedeSchema = new mongoose.Schema({
    codigo_cliente: { type: String, required: true },
    nome: { type: String, required: true },
    representante:Number,
    razao_social: String,
    nome_fantasia: String,
    qtd_lojas: Number,
    uf: String, 
    qtd_sku: Number,
    modelo_display: String,
    jan25: Number,
    fev25: Number,
    mar25: Number,
    abr25: Number,
    mai25: Number,
    jun25: Number,
    jul25: Number,
    ago25: Number,
    set25: Number,
    out25: Number,
    nov25: Number,
    dez25: Number
    
}, { collection: 'redes' });

module.exports = mongoose.model('Redes', RedeSchema);