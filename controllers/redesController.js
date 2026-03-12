// displayController.js
const Cliente = require('../models/Cliente');
const Redes = require('../models/Redes/Redes');

exports.getRedesBycodgroup = async (req, res) => {
    try {
        const { codgroup } = req.params;
        const cliente = await Cliente.findOne({ codigo_cliente: codgroup });
        if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

        const rede = await Redes.find({ codigo_cliente: codgroup });
        res.json({ cliente, rede });
    } catch (error) {
        console.error('Erro ao buscar redes:', error);
        res.status(500).json({ message: "Erro no servidor", error });
    }
};

exports.salvarRedes = async (req, res) => {
    try {
        const { codigo_cliente, nome, redes } = req.body;

        let cliente = await Cliente.findOne({ codigo_cliente });
        if (!cliente) {
            cliente = new Cliente({ codigo_cliente, nome });
            await cliente.save();
        }

        // Remove todos os displays existentes para sobrescrever
        await Redes.deleteMany({ codigo_cliente });

        // Salva os novos displays
        const redesDocs = redes.map(rede => new Redes(rede));
        await Redes.insertMany(redesDocs);

        res.json({ message: "Dados salvos com sucesso!" });
    } catch (error) {
        console.error('Erro ao salvar displays:', error);
        res.status(500).json({ message: "Erro ao salvar dados", error });
    }
};

exports.removerLinhaRedes = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ message: "ID da linha é obrigatório" });

        const result = await Redes.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ message: "Linha não encontrada" });

        res.json({ message: "Linha removida com sucesso" });
    } catch (error) {
        console.error('Erro ao remover linha:', error);
        res.status(500).json({ message: "Erro no servidor", error });
    }
};