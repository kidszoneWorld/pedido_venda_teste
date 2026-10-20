const apiService = require('../utils/apiService');

function normalizarNumero(valor) {
    return String(
        valor ?? ''
    ).replace(
        /\D/g,
        ''
    );
}

function removerPedidosDuplicados(
    pedidos
) {
    const pedidosPorCodigo =
        new Map();

    pedidos.forEach(
        pedido => {
            const codigoPedido =
                String(
                    pedido?.codigo ??
                    ''
                ).trim();

            if (!codigoPedido) {
                return;
            }

            /*
             * Se o mesmo pedido aparecer nas duas consultas,
             * somente uma linha será mantida.
             */
            if (
                !pedidosPorCodigo.has(
                    codigoPedido
                )
            ) {
                pedidosPorCodigo.set(
                    codigoPedido,
                    pedido
                );
            }
        }
    );

    return Array.from(
        pedidosPorCodigo.values()
    );
}

async function getOrderDetails(req, res) {
    const statusTexto =
        String(
            req.query.status || ''
        ).trim();

    const status =
        statusTexto
            ? Number(
                statusTexto
            )
            : 6;

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
                    codCliente,
                    codRep
                );
        } else if (status === 4) {
    /*
     * O filtro "Faturado Parcial" deve reunir:
     *
     * 4 = Faturado Parcial
     * 1 = Cancelado Parcial
     */

    const [
        pedidosFaturadosParciais,
        pedidosCanceladosParciais
    ] =
        await Promise.all([
            apiService.fetchOrderDetails(
                4,
                dataInicio,
                dataFim,
                statusSeparacao,
                codCliente
            ),

            apiService.fetchOrderDetails(
                1,
                dataInicio,
                dataFim,
                null,
                codCliente
            )
        ]);

    const pedidosUnificados =
        [
            ...(
                Array.isArray(
                    pedidosFaturadosParciais
                )
                    ? pedidosFaturadosParciais
                    : []
            ),

            ...(
                Array.isArray(
                    pedidosCanceladosParciais
                )
                    ? pedidosCanceladosParciais
                    : []
            )
        ];

    orders =
        removerPedidosDuplicados(
            pedidosUnificados
        )
            .map(
                pedido => {
                    const statusOriginal =
                        Number(
                            pedido.status
                        );

                    return {
                        ...pedido,

                        /*
                         * Guardamos o status real para diagnóstico,
                         * mas o painel receberá status 4.
                         */
                        statusOriginal:
                            statusOriginal,

                        status:
                            4
                    };
                }
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

                const notaFiscalDireta =
                    order.notas_fiscais?.notaFiscal ??
                    null;

                /*
                * A API possui dois identificadores:
                *
                * codigo: identificador utilizado no endpoint
                * numero: número fiscal do documento
                *
                * Exemplo:
                * codigo = 2499
                * numero = 2452
                */
                const codigoNotaDireta =
                    normalizarNumero(
                        notaFiscalDireta?.codigo
                    );

                const numeroNotaDireta =
                    normalizarNumero(
                        notaFiscalDireta?.codigo
                    );

                const matchNumeroNota =
                    !numeroNotaNormalizado ||

                    codigoNotaDireta ===
                        numeroNotaNormalizado ||

                    numeroNotaDireta ===
                        numeroNotaNormalizado ||

                    notasFiscais.some(
                        nota => {
                            const codigoAtual =
                                normalizarNumero(
                                    nota?.codigo
                                );

                            const numeroAtual =
                                normalizarNumero(
                                    nota?.codigo
                                );

                            return (
                                codigoAtual ===
                                    numeroNotaNormalizado ||

                                numeroAtual ===
                                    numeroNotaNormalizado
                            );
                        }
                    );

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
                    
                const statusOriginalPedido =
                    Number(
                        order.statusOriginal ??
                        order.status
                    );

                const pedidoEhCanceladoParcialAgrupado =
                    status === 4 &&
                    statusOriginalPedido === 1;

                const matchStatusSeparacao =
                    possuiBuscaDireta ||

                    statusSeparacao === null ||

                    pedidoEhCanceladoParcialAgrupado ||

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

async function downloadXmlNotaFiscal(
    req,
    res
) {
    try {
        const codigoNota =
            normalizarNumero(
                req.params.codigoNota
            );

        if (!codigoNota) {
            return res
                .status(400)
                .json({
                    mensagem:
                        'Código da nota fiscal não informado.'
                });
        }

        const notaFiscal =
            await apiService
                .fetchNotaFiscalComXml(
                    codigoNota
                );

        if (!notaFiscal) {
            return res
                .status(404)
                .json({
                    mensagem:
                        'Nota fiscal não encontrada.'
                });
        }

        const xml =
            String(
                notaFiscal.xml ??
                ''
            ).trim();

        if (!xml) {
            return res
                .status(404)
                .json({
                    mensagem:
                        'O XML da nota fiscal não está disponível.'
                });
        }

        const numeroNota =
            normalizarNumero(
                notaFiscal.codigo
            ) ||
            codigoNota;

        const serie =
            normalizarNumero(
                notaFiscal.serie
            );

        const nomeArquivo =
            serie
                ? `NFe-${numeroNota}-serie-${serie}.xml`
                : `NFe-${numeroNota}.xml`;

        /*
         * O XML retornado pela API já começa com:
         *
         * <?xml version="1.0" encoding="utf-8" ?>
         *
         * Não é necessário criar ou transformar o XML.
         */
        res.setHeader(
            'Content-Type',
            'application/xml; charset=utf-8'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${nomeArquivo}"`
        );

        res.setHeader(
            'Cache-Control',
            'no-store'
        );

        return res
            .status(200)
            .send(
                xml
            );
    } catch (error) {
        console.error(
            'Erro ao baixar XML da nota fiscal:',
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
                        'A API de notas fiscais está temporariamente limitada. ' +
                        'Aguarde alguns segundos e tente novamente.'
                });
        }

        return res
            .status(500)
            .json({
                mensagem:
                    mensagem ||
                    'Não foi possível baixar o XML da nota fiscal.'
            });
    }
}

module.exports = {
    getOrderDetails,
    getClientDetailsEndpoint,
    downloadXmlNotaFiscal
};