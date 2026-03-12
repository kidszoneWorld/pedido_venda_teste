const mongoose = require('mongoose');

const SellOutSchema = new mongoose.Schema({
    codigo_cliente: { type: String, required: true },
    nome: { type: String, required: true },
    representante:Number,
    cod_item: String,
    sku: String,
    
    meses: {
        jan25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        fev25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        mar25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        abr25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        mai25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        jun25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        jul25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        ago25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        set25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        out25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        nov25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number },
        dez25: { sellIn: Number, sellOut: Number, saldo: Number, sold: Number }
    }

}, { collection: 'sell_out2' });

module.exports = mongoose.model('SellOut2', SellOutSchema);
