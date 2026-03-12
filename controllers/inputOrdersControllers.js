const { OrdersInput } = require('../utils/apiServicesInput');

async function fetchImputOrders(req, res) {
    try {
        const response = await OrdersInput(req.body);

        if (response.ErrorMessages && response.ErrorMessages.length > 0) {
            return res.status(400).json(response); // Retorna erros do endpoint
        }

        res.status(200).json(response);
    } catch (error) {
        console.error("Erro ao processar pedido:", error.message);
        res.status(500).json({ ErrorMessages: ["Erro interno ao processar pedido."] });
    }
}

module.exports = {
    fetchImputOrders,
};