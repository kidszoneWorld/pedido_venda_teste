const apiService = require('../utils/apiService');

async function getOrderDetails(req, res) {

  const status = req.query.status || 6; // Usa status 6 como padrão
  const codRep = req.query.codRep || null; // Novo parâmetro codRep

  console.log(`Recebendo pedidos para o status: ${status}`); // Log para depuração

  try {
    const orders  = await apiService.fetchOrdersWithdetailsAndRepresentativesWithTransport(status);

       // Filtrar por código do representante, se fornecido
       const filteredOrders = codRep
       ? orders.filter(order => order.representante?.id?.toString() === codRep.toString())
       : orders;

       if (filteredOrders.length === 0 && codRep) {
        console.warn(`Nenhum pedido encontrado para o representante ${codRep}`);
       }


    res.status(200).json(filteredOrders);
  } catch (error) {
    console.error('Erro ao obter detalhes dos pedidos com representantes:', error);
    res.status(500).send('Erro ao obter detalhes dos pedidos com representantes');
  }
}



// Nova função para buscar detalhes de um pedido específico
async function getOrderDetailsById(req, res) {
  const { id } = req.params; // Obtém o ID do pedido a partir dos parâmetros da URL
  const { status } = req.query; // Opcional: Obtém o status da query string
  console.log(`Buscando detalhes do pedido com ID: ${id} e Status: ${status || 'não informado'}`); // Log para depuração


  try {
    const orders = await apiService.fetchOrdersWithdetailsAndRepresentativesWithTransport(status); // Busca todos os pedidos
    const order = orders.find((o) => o.id === id); // Filtra o pedido pelo ID fornecido

    if (!order) {
      res.status(404).send(`Pedido com ID ${id} não encontrado para o status ${status || 'padrão'}.`);
    } else {
      res.status(200).json(order); // Retorna os detalhes do pedido encontrado
    }
  } catch (error) {
    console.error(`Erro ao buscar detalhes do pedido com ID ${id} e Status ${status}:`, error);
    res.status(500).send('Erro ao carregar detalhes do pedido.');
  }
}

module.exports = { 
    getOrderDetails, 
    getOrderDetailsById  
};
