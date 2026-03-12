// displayController.js
const Cliente = require('../models/Cliente');
const Display = require('../models/Display/Display');

exports.getDisplayBycodgroup = async (req, res) => {
    try {
        const { codgroup } = req.params;
        const cliente = await Cliente.findOne({ codigo_cliente: codgroup });
        if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });

        const display = await Display.find({ codigo_cliente: codgroup });
        res.json({ cliente, display });
    } catch (error) {
        console.error('Erro ao buscar displays:', error);
        res.status(500).json({ message: "Erro no servidor", error });
    }
};

exports.salvarDisplay = async (req, res) => {
    try {
        const { codigo_cliente, nome,representante, displays } = req.body;

        let cliente = await Cliente.findOne({ codigo_cliente });
        if (!cliente) {
            cliente = new Cliente({ codigo_cliente, nome , representante });
            await cliente.save();
        }

        // Remove todos os displays existentes para sobrescrever
        await Display.deleteMany({ codigo_cliente });

        // Salva os novos displays
        const displayDocs = displays.map(display => new Display(display));
        await Display.insertMany(displayDocs);

        res.json({ message: "Dados salvos com sucesso!" });
    } catch (error) {
        console.error('Erro ao salvar displays:', error);
        res.status(500).json({ message: "Erro ao salvar dados", error });
    }
};

exports.removerLinhaDisplay = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ message: "ID da linha é obrigatório" });

        const result = await Display.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ message: "Linha não encontrada" });

        res.json({ message: "Linha removida com sucesso" });
    } catch (error) {
        console.error('Erro ao remover linha:', error);
        res.status(500).json({ message: "Erro no servidor", error });
    }
};