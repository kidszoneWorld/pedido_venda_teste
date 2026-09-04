const apiService = require('../utils/apiService');

function normalizarNumero(valor){

    return String(
        valor ?? ''
    )
    .replace(
        /\D/g,
        ''
    );

}

async function getOrderDetails(
    req,
    res
){

    const status =
        req.query.status || 3;

    const codRep =
        req.query.codRep || null;

    const cnpj =
        req.query.clienteCNPJ || null;

    const codCliente =
        req.query.ClienteCodigo
            ? Number(
                req.query.ClienteCodigo
            )
            : null;

    const codigoPedido =
        String(
            req.query.codigoPedido || ''
        )
        .trim();

    const numeroNota =
        String(
            req.query.numeroNota || ''
        )
        .trim();

    const dataInicio =
        req.query.DataPedidoInicio
            ? new Date(
                req.query.DataPedidoInicio
            )
            : null;

    const dataFim =
        req.query.DataPedidoFim
            ? new Date(
                req.query.DataPedidoFim
            )
            : null;

    const statusSeparacao =
        req.query.statusSeparacao !== undefined &&
        req.query.statusSeparacao !== ''
            ? Number(
                req.query.statusSeparacao
            )
            : null;

    console.log(
        'Filtros recebidos:',
        {
            status,
            codRep,
            cnpj,
            codCliente,
            codigoPedido,
            numeroNota,
            dataInicio,
            dataFim,
            statusSeparacao
        }
    );

    try{

        const orders =
            await apiService.fetchOrderDetails(
                status,
                dataInicio,
                dataFim,
                statusSeparacao,
                codCliente
            );

        const numeroNotaNormalizado =
            normalizarNumero(
                numeroNota
            );

        const filteredOrders =
            orders.filter(order => {

                const matchRep =
                    !codRep ||
                    String(
                        order.representante?.codigo ?? ''
                    ) ===
                    String(
                        codRep
                    );

                const matchCNPJ =
                    !cnpj ||
                    normalizarNumero(
                        order.cliente?.documento?.numeroTexto
                    ) ===
                    normalizarNumero(
                        cnpj
                    );

                const matchCodCliente =
                    !codCliente ||
                    Number(
                        order.cliente?.codigo
                    ) ===
                    codCliente;

                const matchCodigoPedido =
                    !codigoPedido ||
                    String(
                        order.codigo ?? ''
                    ).trim() ===
                    codigoPedido;

                const notasFiscais =
                    Array.isArray(
                        order.notas_fiscais?.dados
                    )
                        ? order.notas_fiscais.dados
                        : [];

                const matchNumeroNota =
                    !numeroNotaNormalizado ||
                    notasFiscais.some(nota => {

                        return (
                            normalizarNumero(
                                nota?.numero
                            ) ===
                            numeroNotaNormalizado
                        );

                    });

                const matchDataInicio =
                    !dataInicio ||
                    new Date(
                        order.dataPedido
                    ) >=
                    dataInicio;

                const matchDataFim =
                    !dataFim ||
                    new Date(
                        order.dataPedido
                    ) <=
                    dataFim;

                const matchStatusSeparacao =
                    statusSeparacao === null ||
                    Number(
                        order.statusSeparacao
                    ) ===
                    statusSeparacao;

                return (
                    matchRep &&
                    matchCNPJ &&
                    matchCodCliente &&
                    matchCodigoPedido &&
                    matchNumeroNota &&
                    matchDataInicio &&
                    matchDataFim &&
                    matchStatusSeparacao
                );

            });

        if(filteredOrders.length === 0){

            console.warn(
                'Nenhum pedido encontrado com os filtros aplicados.'
            );

            return res
                .status(404)
                .send(
                    'Nenhum pedido encontrado.'
                );

        }

        return res
            .status(200)
            .json(
                filteredOrders
            );

    }catch (error) {
      console.error(
          'Erro ao obter detalhes dos pedidos:',
          error
      );

      const mensagem =
          String(
              error.message ||
              ''
          );

      const limiteAtingido =
          mensagem.includes(
              'limitada'
          ) ||
          mensagem.includes(
              'Too Many Requests'
          );

      if (limiteAtingido) {
          return res
              .status(503)
              .json({
                  mensagem:
                      'A API de pedidos está temporariamente limitada. ' +
                      'Aguarde alguns segundos e tente novamente.'
              });
      }

      return res
          .status(500)
          .json({
              mensagem:
                  mensagem ||
                  'Erro ao obter detalhes dos pedidos.'
          });
  }

}

async function getClientDetailsEndpoint(req, res) {

  const { codPedido } = req.params;

  try {
      const pedidoCod1 = await apiService.fetchOrderDetailsEndpoint(codPedido);

    // console.log('pedido'.pedidoCod1);

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
