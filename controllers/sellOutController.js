// displayController.js
const Cliente = require('../models/Cliente');
const SellOut2 = require('../models/SellOut/SellOut2');

exports.getSellOutBycodgroup = async (req, res) => {
    try {
        const { codgroup } = req.params;
        const cliente = await Cliente.findOne({ codigo_cliente: codgroup });
        if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

        const sellOut = await SellOut2.find({ codigo_cliente: codgroup });
        res.json({ cliente, sellOut });
    } catch (error) {
        console.error('Erro ao buscar sellOut:', error);
        res.status(500).json({ message: "Erro no servidor", error });
    }
};

exports.salvarSellOut = async (req, res) => {
    try {

                const { codigo_cliente, nome, representante, sellOut } = req.body;
        
                let cliente = await Cliente.findOne({ codigo_cliente });
                if (!cliente) {
                    cliente = new Cliente({ codigo_cliente, nome ,representante});
                    await cliente.save();
                }
        
                // Remove todos os SellOut2 existentes para sobrescrever
                await SellOut2.deleteMany({ codigo_cliente });
        
                // Salva os novos SellOut2
                const sellOutDocs = sellOut.map(sellOut => new SellOut2(sellOut));
                await sellOut.insertMany(sellOutDocs);
        
        res.json({ message: "Dados salvos com sucesso!" });
    } catch (error) {
        console.error('Erro ao salvar SellOut2:', error);
        res.status(500).json({ message: "Erro ao salvar dados", error });
    }
};

exports.removerLinhaSellOut = async (req, res) => {
    try {

              const { id } = req.body;
                if (!id) return res.status(400).json({ message: "ID da linha é obrigatório" });
        
                const result = await SellOut2.findByIdAndDelete(id);
                if (!result) return res.status(404).json({ message: "Linha não encontrada" });
        
        res.json({ message: "Linha removida com sucesso" });
    } catch (error) {
        console.error('Erro ao remover linha:', error);
        res.status(500).json({ message: "Erro no servidor", error });
    }
};