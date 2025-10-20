const fetch = require('node-fetch'); 

// Tokens necessários para autenticação
const ApplicationToken = '62ca18a8-aa3b-41b7-a54e-f669a437d326';
const CompanyToken = 'b5b984c5-cbfa-490b-8513-448fc67a39b6';

/**
 * Função para enviar os dados do pedido para a API externa.
 * @param {Object} data - Dados do pedido no formato esperado pela API.
 * @returns {Object} - Resposta da API.
 */
async function OrdersInput(data) {
  
    const apiUrl = 'http://kidszone-api-integracao.dbcorp.com.br/v1/PedidoVenda/Incluir'; 

    try {
        // Realiza a requisição POST para a API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ApplicationToken': ApplicationToken,
                'CompanyToken': CompanyToken,
            },
            body: JSON.stringify(data),
        });

        // Verifica o status da resposta
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(`Erro na API: ${errorResponse.ErrorMessages?.join(", ") || "Erro desconhecido"}`);
        }

        // Retorna a resposta da API
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Erro ao enviar dados para a API externa:", error.message);
        throw error; // Repassa o erro para o controlador lidar
    }
}

module.exports = {
    OrdersInput,
};
