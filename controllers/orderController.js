const apiService = require('../utils/apiService');

function normalizarNumero(valor) {
    return String(
        valor ?? ''
    ).replace(
        /\D/g,
        ''
    );
}

async function getOrderDetails(req, res) {
    const status =
        req.query.status || 3;

    const codRep =
        String(
            req.query.codRep || ''
        ).trim();

    const cnpj =
        String(
            req.query.clienteCNPJ || ''
        ).trim();

    const codigoClienteTexto =
        String(
            req.query.ClienteCodigo || ''
        ).trim();

    const codCliente =
        codigoClienteTexto
            ? Number(
                codigoClienteTexto
            )
            : null;

    const codigoPedido =
        String(
            req.query.codigoPedido || ''
        ).trim();

    const numeroNota =
        String(
            req.query.numeroNota || ''
        ).trim();

    const possuiBuscaDireta =
    Boolean(
        codigoPedido ||
        numeroNota
    );

    const dataInicio =
        String(
            req.query.DataPedidoInicio || ''
        ).trim() || null;

    const dataFim =
        String(
            req.query.DataPedidoFim || ''
        ).trim() || null;

    const statusSeparacaoTexto =
        String(
            req.query.statusSeparacao ?? ''
        ).trim();

    const statusSeparacao =
        statusSeparacaoTexto !== ''
            ? Number(
                statusSeparacaoTexto
            )
            : null;

    if (
        codigoClienteTexto &&
        !Number.isFinite(
            codCliente
        )
    ) {
        return res
            .status(400)
            .json({
                mensagem:
                    'O código do cliente informado é inválido.'
            });
    }

    if (
        statusSeparacao !== null &&
        !Number.isFinite(
            statusSeparacao
        )
    ) {
        return res
            .status(400)
            .json({
                mensagem:
                    'O status de separação informado é inválido.'
            });
    }
let dataInicioFiltro =
    null;

let dataFimFiltro =
    null;

if (
    dataInicio &&
    !possuiBuscaDireta
) {
    dataInicioFiltro =
        new Date(
            `${dataInicio}T00:00:00`
        );

    if (
        Number.isNaN(
            dataInicioFiltro.getTime()
        )
    ) {
        return res
            .status(400)
            .json({
                mensagem:
                    'A data inicial informada é inválida.'
            });
    }
}

if (
    dataFim &&
    !possuiBuscaDireta
) {
    dataFimFiltro =
        new Date(
            `${dataFim}T23:59:59.999`
        );

    if (
        Number.isNaN(
            dataFimFiltro.getTime()
        )
    ) {
        return res
            .status(400)
            .json({
                mensagem:
                    'A data final informada é inválida.'
            });
    }
}

if (
    !possuiBuscaDireta &&
    dataInicioFiltro &&
    dataFimFiltro &&
    dataInicioFiltro > dataFimFiltro
) {
    return res
        .status(400)
        .json({
            mensagem:
                'A data inicial não pode ser maior que a data final.'
        });
}

    try {
        let orders;

        if (codigoPedido) {
            orders =
                await apiService.fetchOrdersByCode(
                    codigoPedido,
                    codCliente
                );
        } else if (numeroNota) {
            orders =
                await apiService.fetchOrdersByInvoice(
                    numeroNota,
                    codCliente
                );
        } else {
            orders =
                await apiService.fetchOrderDetails(
                    status,
                    dataInicio,
                    dataFim,
                    statusSeparacao,
                    codCliente
                );
        }

        if (!Array.isArray(orders)) {
            console.error(
                'A consulta não retornou uma lista de pedidos:',
                orders
            );

            throw new Error(
                'A consulta retornou um formato inválido.'
            );
        }

        const numeroNotaNormalizado =
            normalizarNumero(
                numeroNota
            );

        const cnpjNormalizado =
            normalizarNumero(
                cnpj
            );

        const filteredOrders =
            orders.filter(order => {
                if (!order) {
                    return false;
                }

                const codigoRepresentante =
                    String(
                        order.representante?.codigo ?? ''
                    ).trim();

                const matchRep =
                    !codRep ||
                    codigoRepresentante === codRep;

                const documentoCliente =
                    normalizarNumero(
                        order.cliente
                            ?.documento
                            ?.numeroTexto
                    );

                const matchCNPJ =
                    possuiBuscaDireta ||
                    !cnpjNormalizado ||
                    documentoCliente === cnpjNormalizado;

                const codigoClientePedido =
                    Number(
                        order.cliente?.codigo
                    );

                const matchCodCliente =
                    possuiBuscaDireta ||
                    codCliente === null ||
                    codigoClientePedido === codCliente;

                const codigoAtualPedido =
                    String(
                        order.codigo ?? ''
                    ).trim();

                const matchCodigoPedido =
                    !codigoPedido ||
                    codigoAtualPedido ===
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
                        const numeroAtual =
                            normalizarNumero(
                                nota?.numero
                            );

                        return (
                            numeroAtual ===
                            numeroNotaNormalizado
                        );
                    });

                const dataPedido =
                    order.dataPedido
                        ? new Date(
                            order.dataPedido
                        )
                        : null;

                const dataPedidoValida =
                    dataPedido &&
                    !Number.isNaN(
                        dataPedido.getTime()
                    );

                const matchDataInicio =
                    possuiBuscaDireta ||
                    !dataInicioFiltro ||
                    (
                        dataPedidoValida &&
                        dataPedido >=
                            dataInicioFiltro
                    );

                const matchDataFim =
                    possuiBuscaDireta ||
                    !dataFimFiltro ||
                    (
                        dataPedidoValida &&
                        dataPedido <=
                            dataFimFiltro
                    );
                const matchStatusSeparacao =
                    possuiBuscaDireta ||
                    statusSeparacao === null ||
                    Number(
                        order.statusSeparacao
                    ) === statusSeparacao;

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

        if (filteredOrders.length === 0) {
            console.warn(
                'Nenhum pedido encontrado com os filtros aplicados.'
            );

            return res
                .status(404)
                .json({
                    mensagem:
                        'Nenhum pedido encontrado com os filtros aplicados.'
                });
        }

        return res
            .status(200)
            .json(
                filteredOrders
            );
    } catch (error) {
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
            ) ||
            mensagem.includes(
                '429'
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
}
