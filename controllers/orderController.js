const apiService = require('../utils/apiService');

async function getOrderDetails(req, res) {

  const status = req.query.status || 3; // Usa status 3 como padrão
  const codRep = req.query.codRep || null; // Novo parâmetro codRep
  const cnpj = req.query.clienteCNPJ || null; // Filtro por CNPJ do cliente
  const codCliente = req.query.ClienteCodigo ? Number(req.query.ClienteCodigo) : null; // Filtro por codigo do cliente, convertido para número
  const dataInicio = req.query.DataPedidoInicio ? new Date(req.query.DataPedidoInicio) : null; // Filtro de data início
  const dataFim = req.query.DataPedidoFim ? new Date(req.query.DataPedidoFim) : null; // Filtro de data fim
  const statusSeparacao = req.query.statusSeparacao ? Number(req.query.statusSeparacao) : null;

  console.log(`Recebendo pedidos para o status: ${status}`); // Log para depuração

  try {

    // Passa as datas e statusSeparacao fornecidos pelo usuário (ou null, para usar padrão)
    const orders = await apiService.fetchOrderDetails(status, dataInicio, dataFim, statusSeparacao, codCliente);

    // Filtrar por codRep e CNPJ, se fornecidos
    const filteredOrders = orders.filter(order => {
      const matchRep = !codRep || (order.representante?.codigo?.toString() === codRep.toString());
      const matchCNPJ = !cnpj || (order.cliente?.documento?.numeroTexto === cnpj);
      const matchCodCliente = !codCliente || (order.cliente?.codigo === codCliente);
      const matchDataInicio = !dataInicio || new Date(order.dataPedido) >= dataInicio;
      const matchDataFim = !dataFim || new Date(order.dataPedido) <= dataFim;
      //const matchStatusSeparacao = (statusSeparacao === null || statusSeparacao === undefined)  || order.statusSeparacao === statusSeparacao;
      //const matchStatusSeparacao = statusSeparacao != null ? order.statusSeparacao === statusSeparacao : true;
      const matchStatusSeparacao = !statusSeparacao || order.statusSeparacao === statusSeparacao;
      return matchRep && matchCNPJ && matchCodCliente && matchDataInicio && matchDataFim && matchStatusSeparacao;
    });

    if (filteredOrders.length === 0) {
      console.warn('Nenhum pedido encontrado com os filtros aplicados.');
      return res.status(404).send('Nenhum pedido encontrado.');
    }

    res.status(200).json(filteredOrders);
  } catch (error) {
    console.error('Erro ao obter detalhes dos pedidos com representantes:', error);
    res.status(500).send('Erro ao obter detalhes dos pedidos com representantes');
  }
}


async function getClientDetailsEndpoint(req, res) {

  const { codPedido } = req.params;

  try {
    const pedidoCod1 = await apiService.fetchOrderDetailsEndpoint(codPedido);

    if (!pedidoCod1) {
      res.status(404).json({ message: 'pedido não encontrado' });
    } else {
      res.status(200).json(pedidoCod1);
    }

  } catch (error) {
    console.error('Erro ao obter detalhes dos clientes:', error);
    res.status(500).send('Erro ao obter detalhes dos clientes');
  }
}

module.exports = {
  getOrderDetails,
  getClientDetailsEndpoint
};
