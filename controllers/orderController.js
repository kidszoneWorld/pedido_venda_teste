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

                const numeroNotaDireta =
                    normalizarNumero(
                        notaFiscalDireta?.numero
                    );

                const matchNumeroNota =
                    !numeroNotaNormalizado ||

                    numeroNotaDireta ===
                        numeroNotaNormalizado ||

                    notasFiscais.some(
                        nota => {
                            const numeroAtual =
                                normalizarNumero(
                                    nota?.numero
                                );

                            return (
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

    console.log('pedido'.pedidoCod1);

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

function extrairNumeroNotaDoXml(
    xml
) {
    const conteudo =
        String(
            xml ?? ''
        );

    /*
     * Procura o conteúdo da tag:
     *
     * <nNF>2499</nNF>
     *
     * Também aceita namespace:
     * <nfe:nNF>2499</nfe:nNF>
     */
    const correspondencia =
        conteudo.match(
            /<(?:[A-Za-z0-9_-]+:)?nNF>\s*(\d+)\s*<\/(?:[A-Za-z0-9_-]+:)?nNF>/i
        );

    if (!correspondencia) {
        return '';
    }

    return normalizarNumero(
        correspondencia[1]
    );
}

async function downloadXmlNotaFiscal(
    req,
    res
) {
    try {
        const codigoPedido =
            normalizarNumero(
                req.params.codigoPedido
            );

        const numeroNota =
            normalizarNumero(
                req.params.numeroNota
            );

        if (!codigoPedido) {
            return res
                .status(400)
                .json({
                    mensagem:
                        'Código do pedido não informado.'
                });
        }

        if (!numeroNota) {
            return res
                .status(400)
                .json({
                    mensagem:
                        'Número da nota fiscal não informado.'
                });
        }

        /*
         * A consulta será:
         *
         * /documentos-fiscais-service/nota-fiscal
         * ?Status=4
         * &PedidoDeVendaCodigo=2600
         *
         * Depois, selecionará a nota.numero = 2499.
         */
        const notaFiscal =
            await apiService
                .fetchNotaFiscalPedidoComXml(
                    codigoPedido,
                    numeroNota
                );

        if (!notaFiscal) {
            return res
                .status(404)
                .json({
                    mensagem:
                        `A nota fiscal ${numeroNota} não foi encontrada ` +
                        `para o pedido ${codigoPedido}.`
                });
        }

        const numeroNotaRetornado =
            normalizarNumero(
                notaFiscal.numero
            );

        /*
         * Proteção adicional:
         * o backend não envia um XML de outra nota.
         */
        if (
            numeroNotaRetornado !==
            numeroNota
        ) {
            console.error(
                'A API retornou uma nota diferente da solicitada:',
                {
                    codigoPedido:
                        codigoPedido,

                    numeroSolicitado:
                        numeroNota,

                    numeroRetornado:
                        numeroNotaRetornado,

                    codigoInterno:
                        notaFiscal.codigo
                }
            );

            return res
                .status(409)
                .json({
                    mensagem:
                        'A API retornou uma nota fiscal diferente da solicitada.'
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
                        `O XML da nota fiscal ${numeroNota} não está disponível.`
                });
        }

        /*
         * Validação adicional do próprio XML.
         *
         * No exemplo, procura:
         * <nNF>2499</nNF>
         */
        const numeroXml =
            extrairNumeroNotaDoXml(
                xml
            );

        if (
            numeroXml &&
            numeroXml !==
                numeroNota
        ) {
            console.error(
                'O número dentro do XML não corresponde à nota solicitada:',
                {
                    numeroSolicitado:
                        numeroNota,

                    numeroObjeto:
                        numeroNotaRetornado,

                    numeroXml:
                        numeroXml
                }
            );

            return res
                .status(409)
                .json({
                    mensagem:
                        'O conteúdo do XML não corresponde à nota fiscal solicitada.'
                });
        }

        const serie =
            String(
                notaFiscal.serie ??
                ''
            )
                .replace(
                    /[^\dA-Za-z_-]/g,
                    ''
                );

        const nomeArquivo =
            serie
                ? `NFe-${numeroNotaRetornado}-serie-${serie}.xml`
                : `NFe-${numeroNotaRetornado}.xml`;

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
            'no-store, no-cache, must-revalidate'
        );

        res.setHeader(
            'Pragma',
            'no-cache'
        );

        res.setHeader(
            'Expires',
            '0'
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
                '429'
            ) ||
            mensagem.includes(
                'Too Many Requests'
            ) ||
            mensagem.includes(
                'limitada'
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