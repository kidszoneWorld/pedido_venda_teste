const fetch = require('node-fetch');

let authToken = null;
let tokenExpirationTime = null;
const ApplicationToken = process.env.APPLICATION_TOKEN;
const CompanyToken = process.env.COMPANY_TOKEN;
const NgLink = process.env.NG_LINK
const PcrLink = process.env.PCR_LINK
const usuarioDbCorp = process.env.USUARIO_DBCORP
const senhabCorp = process.env.SENHA_DBCORP

function aguardar(tempo) {
    return new Promise(resolve => {
        setTimeout(
            resolve,
            tempo
        );
    });
}

async function executarFetchComRetentativa(
    url,
    opcoes,
    limiteTentativas = 5
) {
    let tentativa = 1;

    while (tentativa <= limiteTentativas) {
        const response =
            await fetch(
                url,
                opcoes
            );

        if (response.status !== 429) {
            return response;
        }

        const retryAfter =
            response.headers.get(
                'retry-after'
            );

        const segundosInformados =
            Number(
                retryAfter
            );

        const tempoEspera =
            Number.isFinite(
                segundosInformados
            ) &&
            segundosInformados > 0
                ? segundosInformados * 1000
                : tentativa * 1500;

        console.warn(
            `Limite da API atingido. Aguardando ${tempoEspera} ms. ` +
            `Tentativa ${tentativa} de ${limiteTentativas}.`
        );

        await aguardar(
            tempoEspera
        );

        tentativa += 1;
    }

    throw new Error(
        'A API permaneceu limitada após várias tentativas.'
    );
}

function criarOpcoesGet() {
    return {
        method: 'GET',

        headers: {
            Authorization:
                `Bearer ${authToken}`,

            'Content-Type':
                'application/json',

            Origin:
                'https://kidszone-ng.dbcorp.com.br'
        }
    };
}

// Função para autenticar e obter o token
async function authenticate() {
  try {
    const response = await fetch(`${NgLink}/identidade-service/autenticar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      },
      body: JSON.stringify({
        usuario: usuarioDbCorp,
        senha: senhabCorp,
        origin: "kidszone-ng"
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na autenticação: ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.tokenAcesso; // Atualizado para tokenAcesso
    tokenExpirationTime = Date.now() + 2 * 60 * 60 * 1000;
    console.log('Autenticado com sucesso, token obtido.');
  } catch (error) {
    console.error('Erro ao autenticar:', error);
  }
}

// Função para verificar se o token está válido ou se precisamos renovar
async function checkToken() {
  if (!authToken || Date.now() > tokenExpirationTime) {
    console.log('Token expirado ou inexistente. Autenticando...');
    await authenticate();
  }
}

function normalizarNumeroNota(valor) {
    return String(
        valor ?? ''
    ).replace(
        /\D/g,
        ''
    );
}

async function fetchOrdersByInvoice(
    numeroNota,
    codigoCliente = null,
    codigoRepresentante = ''
) {
    const pedidos =
        await buscarPedidosPorNotaFiscal(
            numeroNota,
            codigoCliente,
            codigoRepresentante
        );

    const pedidosEnriquecidos =
        [];

    for (const pedido of pedidos) {
        const pedidoEnriquecido =
            await enriquecerPedidoEncontrado(
                pedido
            );

        pedidosEnriquecidos.push({
            ...pedidoEnriquecido,

            notas_fiscais:
                pedido.notas_fiscais
        });
    }

    return pedidosEnriquecidos;
}

async function buscarPedidosPorNotaFiscal(
    numeroNota,
    codigoCliente = null,
    codigoRepresentante = ''
) {
    await checkToken();

    if (!authToken) {
        throw new Error(
            'Token de autenticação não foi obtido.'
        );
    }

    const notaProcurada =
        normalizarNumeroNota(
            numeroNota
        );

    const representanteProcurado =
        String(
            codigoRepresentante || ''
        ).trim();

    if (!notaProcurada) {
        return [];
    }

    const pageSize =
        30;

    const maxRecords =
        300;

    let paginaAtual =
        1;

    let quantidadeProcessada =
        0;

    let continuar =
        true;

    const pedidosEncontrados =
        [];

    const endpointNotaFiscal =
        '/documentos-fiscais-service/nota-fiscal';

    const endpointRepresentante =
        '/pessoa-service/representante';

    console.log(
        `Procurando a nota ${notaProcurada} sem limitação de data.`
    );

    while (
        continuar &&
        quantidadeProcessada < maxRecords
    ) {
        const parametros =
            new URLSearchParams();

        parametros.set(
            'EmpresaCodigo',
            '2'
        );

        parametros.set(
            'PageNumber',
            String(
                paginaAtual
            )
        );

        parametros.set(
            'PageSize',
            String(
                pageSize
            )
        );

        if (
            codigoCliente !== null &&
            codigoCliente !== undefined &&
            codigoCliente !== ''
        ) {
            parametros.set(
                'ClienteCodigo',
                String(
                    codigoCliente
                )
            );
        }

        const urlPedidos =
            '/vendas-service/pedido?' +
            parametros.toString();

        const response =
            await executarFetchComRetentativa(
                `${NgLink}${urlPedidos}`,
                criarOpcoesGet()
            );

        if (!response.ok) {
            throw new Error(
                `Erro ao buscar pedidos: ${response.statusText}`
            );
        }

        const resultado =
            await response.json();

        const pedidosPagina =
            Array.isArray(
                resultado?.dados
            )
                ? resultado.dados
                : [];

        console.log(
            `Página ${paginaAtual}: ` +
            `${pedidosPagina.length} pedidos recebidos.`
        );

        for (const pedido of pedidosPagina) {
            if (
                quantidadeProcessada >=
                maxRecords
            ) {
                continuar =
                    false;

                break;
            }

            quantidadeProcessada +=
                1;

            if (representanteProcurado) {
                const clienteCodigo =
                    pedido.cliente?.codigo;

                if (!clienteCodigo) {
                    continue;
                }

                try {
                    const parametrosRepresentante =
                        new URLSearchParams();

                    parametrosRepresentante.set(
                        'ClienteCodigo',
                        String(
                            clienteCodigo
                        )
                    );

                    const urlRepresentante =
                        `${NgLink}${endpointRepresentante}?` +
                        parametrosRepresentante.toString();

                    const respostaRepresentante =
                        await executarFetchComRetentativa(
                            urlRepresentante,
                            criarOpcoesGet()
                        );

                    if (!respostaRepresentante.ok) {
                        continue;
                    }

                    const resultadoRepresentante =
                        await respostaRepresentante.json();

                    const codigoRepresentantePedido =
                        String(
                            resultadoRepresentante
                                ?.dados
                                ?.[0]
                                ?.codigo ?? ''
                        ).trim();

                    if (
                        codigoRepresentantePedido !==
                        representanteProcurado
                    ) {
                        continue;
                    }
                } catch (error) {
                    console.error(
                        `Erro ao verificar representante do pedido ${pedido.codigo}:`,
                        error
                    );

                    continue;
                }
            }

            try {
                const parametrosNota =
                    new URLSearchParams();

                parametrosNota.set(
                    'PedidoDeVendaCodigo',
                    String(
                        pedido.codigo
                    )
                );

                const urlNota =
                    `${NgLink}${endpointNotaFiscal}?` +
                    parametrosNota.toString();

                const respostaNota =
                    await executarFetchComRetentativa(
                        urlNota,
                        criarOpcoesGet()
                    );

                if (!respostaNota.ok) {
                    continue;
                }

                const notasFiscais =
                    await respostaNota.json();

                const notas =
                    Array.isArray(
                        notasFiscais?.dados
                    )
                        ? notasFiscais.dados
                        : [];

                const possuiNota =
                    notas.some(nota => {
                        return (
                            normalizarNumeroNota(
                                nota?.numero
                            ) ===
                            notaProcurada
                        );
                    });

                if (!possuiNota) {
                    await aguardar(
                        80
                    );

                    continue;
                }

                pedidosEncontrados.push({
                    ...pedido,

                    notas_fiscais:
                        notasFiscais
                });

                continuar =
                    false;

                break;
            } catch (error) {
                console.error(
                    `Erro ao consultar notas do pedido ${pedido.codigo}:`,
                    error
                );
            }

            await aguardar(
                80
            );
        }

        if (
            pedidosPagina.length === 0 ||
            pedidosPagina.length < pageSize
        ) {
            continuar =
                false;
        } else if (continuar) {
            paginaAtual +=
                1;

            await aguardar(
                300
            );
        }
    }

    console.log(
        `Pedidos encontrados para a nota ${notaProcurada}: ` +
        `${pedidosEncontrados.length}`
    );

    return pedidosEncontrados;
}

async function enriquecerPedidoEncontrado(
    pedido
) {
    const representativeEndpoint =
        '/pessoa-service/representante?ClienteCodigo=';

    const orderDetailsEndpoint =
        '/vendas-service/pedido/';

    const transportEndpoint =
        '/pessoa-service/transportadora/codigo/';

    let representante =
        null;

    let detalhes =
        null;

    let detalhesTransporte =
        null;

    if (pedido.cliente?.codigo) {
        try {
            const response =
                await executarFetchComRetentativa(
                    `${NgLink}${representativeEndpoint}${pedido.cliente.codigo}`,
                    criarOpcoesGet()
                );

            if (response.ok) {
                const resultado =
                    await response.json();

                representante =
                    resultado.dados?.[0] ??
                    null;
            }
        } catch (error) {
            console.error(
                `Erro ao buscar representante do pedido ${pedido.codigo}:`,
                error
            );
        }
    }

    if (pedido.id) {
        try {
            const response =
                await executarFetchComRetentativa(
                    `${NgLink}${orderDetailsEndpoint}${pedido.id}`,
                    criarOpcoesGet()
                );

            if (response.ok) {
                detalhes =
                    await response.json();
            }
        } catch (error) {
            console.error(
                `Erro ao buscar detalhes do pedido ${pedido.codigo}:`,
                error
            );
        }
    }

    if (pedido.transportadoraCodigo) {
        try {
            const response =
                await executarFetchComRetentativa(
                    `${NgLink}${transportEndpoint}${pedido.transportadoraCodigo}`,
                    criarOpcoesGet()
                );

            if (response.ok) {
                detalhesTransporte =
                    await response.json();
            }
        } catch (error) {
            console.error(
                `Erro ao buscar transportadora do pedido ${pedido.codigo}:`,
                error
            );
        }
    }

    return {
        ...pedido,

        representante:
            representante,

        detalhes:
            detalhes,

        detalhes_transporte:
            detalhesTransporte
    };
}

// Função para calcular as datas de início e fim (últimos 60 dias como padrão, se não fornecidas)
function obterPeriodoConsulta(
    userDataInicio = null,
    userDataFim = null
) {
    const possuiDataInicio =
        Boolean(
            userDataInicio
        );

    const possuiDataFim =
        Boolean(
            userDataFim
        );

    let dataInicioObjeto;
    let dataFimObjeto;

    if (
        possuiDataInicio &&
        possuiDataFim
    ) {
        dataInicioObjeto =
            new Date(
                userDataInicio
            );

        dataFimObjeto =
            new Date(
                userDataFim
            );
    } else if (possuiDataInicio) {
        dataInicioObjeto =
            new Date(
                userDataInicio
            );

        dataFimObjeto =
            new Date();
    } else if (possuiDataFim) {
        dataFimObjeto =
            new Date(
                userDataFim
            );

        dataInicioObjeto =
            new Date(
                dataFimObjeto
            );

        dataInicioObjeto.setDate(
            dataInicioObjeto.getDate() - 15
        );
    } else {
        dataFimObjeto =
            new Date();

        dataInicioObjeto =
            new Date();

        dataInicioObjeto.setDate(
            dataInicioObjeto.getDate() - 15
        );
    }

    if (
        Number.isNaN(
            dataInicioObjeto.getTime()
        ) ||
        Number.isNaN(
            dataFimObjeto.getTime()
        )
    ) {
        throw new Error(
            'O período informado para consulta é inválido.'
        );
    }

    if (
        dataInicioObjeto >
        dataFimObjeto
    ) {
        throw new Error(
            'A data inicial não pode ser maior que a data final.'
        );
    }

    const dataInicio =
        dataInicioObjeto
            .toISOString()
            .split('T')[0];

    const dataFim =
        dataFimObjeto
            .toISOString()
            .split('T')[0];

    return {
        dataInicio,
        dataFim
    };
}

// Função para buscar os pedidos de venda com paginação e todos os detalhes relacionados
async function fetchOrderDetails(status = 6, userDataInicio = null, userDataFim = null, userStatusSeparacao = null , usercodCliente = null) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return [];
  }

  // Calcula as datas dinamicamente com base nos parâmetros fornecidos ou padrão
  const {
      dataInicio,
      dataFim
  } = obterPeriodoConsulta(
      userDataInicio,
      userDataFim
  );

  
  console.log(`Buscando pedidos com status: ${status}, DataPedidoInicio: ${dataInicio}, DataPedidoFim: ${dataFim}, StatusSeparacao: ${userStatusSeparacao !== null ? userStatusSeparacao : 'todos'}`);

  const pageSize = 30; // Tamanho de cada página (lote)
  const maxRecords = 300; // Limite máximo de registros
  let currentPage = 1;
  let allOrders = [];
  let hasMoreData = true;

  // Endpoints para as requisições adicionais
  const representativeEndpoint = '/pessoa-service/representante?ClienteCodigo=';
  const orderDetailsEndpoint = '/vendas-service/pedido/';
  const transportEndpoint = '/pessoa-service/transportadora/codigo/';
  const invoiceEndpoint = '/documentos-fiscais-service/nota-fiscal?PedidoDeVendaCodigo=';

  while (hasMoreData && allOrders.length < maxRecords) {
    try {
      console.log(`Buscando página ${currentPage} com ${pageSize} registros por página...`);
      
      // 1. Buscar pedidos da página atual
      // Constrói a URL dinamicamente, incluindo StatusSeparacao apenas se fornecido
      const parametros =
            new URLSearchParams();

        parametros.set(
            'EmpresaCodigo',
            '2'
        );

        parametros.set(
            'DataPedidoInicio',
            dataInicio
        );

        parametros.set(
            'DataPedidoFim',
            dataFim
        );

        parametros.set(
            'Status',
            String(
                status
            )
        );

        parametros.set(
            'PageNumber',
            String(
                currentPage
            )
        );

        parametros.set(
            'PageSize',
            String(
                pageSize
            )
        );

        const statusNumerico =
            Number(
                status
            );

        const permiteFiltroSeparacao =
            statusNumerico === 3 ||
            statusNumerico === 4 ||
            statusNumerico === 5;

        if (
            permiteFiltroSeparacao &&
            userStatusSeparacao !== null &&
            userStatusSeparacao !== undefined &&
            userStatusSeparacao !== ''
        ) {
            parametros.set(
                'StatusSeparacao',
                String(
                    userStatusSeparacao
                )
            );
        }

        if (
            usercodCliente !== null &&
            usercodCliente !== undefined &&
            usercodCliente !== ''
        ) {
            parametros.set(
                'ClienteCodigo',
                String(
                    usercodCliente
                )
            );
        }

        const url =
            '/vendas-service/pedido?' +
            parametros.toString();

        console.log(
            'URL de pedidos:',
            `${NgLink}${url}`
        );

      const response =
        await executarFetchComRetentativa(
            `${NgLink}${url}`,
            criarOpcoesGet()
        );

      if (!response.ok) {
        throw new Error(`Erro ao buscar pedidos: ${response.statusText}`);
      }

      const ordersData = await response.json();
      const pageData = ordersData.dados || [];
      
      console.log(`Recebidos ${pageData.length} pedidos da página ${currentPage}`);
      
      // 2. Para cada pedido na página, buscar todos os detalhes relacionados
      const enrichedOrders = [];

      for (const order of pageData) {
          let representante =
              null;

          let detalhes =
              null;

          let detalhesTransporte =
              null;

          let notasFiscais =
              null;

          try {
              const repResponse =
                  await executarFetchComRetentativa(
                      `${NgLink}${representativeEndpoint}${order.cliente.codigo}`,
                      criarOpcoesGet()
                  );

              if (repResponse.ok) {
                  const repData =
                      await repResponse.json();

                  representante =
                      repData.dados?.[0] ||
                      null;
              }
          } catch (error) {
              console.error(
                  `Erro ao buscar representante do cliente ${order.cliente.codigo}:`,
                  error
              );
          }



          try {
              const detailsResponse =
                  await executarFetchComRetentativa(
                      `${NgLink}${orderDetailsEndpoint}${order.id}`,
                      criarOpcoesGet()
                  );

              if (detailsResponse.ok) {
                  detalhes =
                      await detailsResponse.json();
              }
          } catch (error) {
              console.error(
                  `Erro ao buscar detalhes do pedido ${order.codigo}:`,
                  error
              );
          }



          if (order.transportadoraCodigo) {
              try {
                  const transportResponse =
                      await executarFetchComRetentativa(
                          `${NgLink}${transportEndpoint}${order.transportadoraCodigo}`,
                          criarOpcoesGet()
                      );

                  if (transportResponse.ok) {
                      detalhesTransporte =
                          await transportResponse.json();
                  }
              } catch (error) {
                  console.error(
                      `Erro ao buscar transportadora do pedido ${order.codigo}:`,
                      error
                  );
              }
          }



          try {
              const invoiceResponse =
                  await executarFetchComRetentativa(
                      `${NgLink}${invoiceEndpoint}${order.codigo}`,
                      criarOpcoesGet()
                  );

              if (invoiceResponse.ok) {
                  notasFiscais =
                      await invoiceResponse.json();
              } else {
                  console.warn(
                      `Não foi possível carregar as notas do pedido ${order.codigo}. ` +
                      `Status HTTP: ${invoiceResponse.status}.`
                  );
              }
          } catch (error) {
              console.error(
                  `Erro ao buscar notas fiscais do pedido ${order.codigo}:`,
                  error
              );
          }

          enrichedOrders.push({
              ...order,

              representante:
                  representante,

              detalhes:
                  detalhes,

              detalhes_transporte:
                  detalhesTransporte,

              notas_fiscais:
                  notasFiscais
          });

          await aguardar(
              150
          );
      }
      
      // Adiciona os pedidos enriquecidos desta página ao array acumulado
      allOrders = [...allOrders, ...enrichedOrders];


            
      // Verifica se há mais páginas para buscar
      if (pageData.length < pageSize) {
        // Se recebemos menos registros que o tamanho da página, não há mais dados
        hasMoreData = false;
        console.log('Não há mais dados para buscar.');
      } else {
        // Avança para a próxima página
        currentPage++;
      }
      
      // Verifica se atingimos o limite máximo de registros
      if (allOrders.length >= maxRecords) {
        console.log(`Limite máximo de ${maxRecords} registros atingido.`);
        // Trunca o array para o limite máximo, caso tenha ultrapassado
        allOrders = allOrders.slice(0, maxRecords);
        break;
      }
      
    } catch (error) {
        console.error(
            `Erro ao buscar página ${currentPage}:`,
            error
        );

        throw new Error(
            `Não foi possível concluir a consulta. ` +
            `Falha ao carregar a página ${currentPage}. ` +
            `${error.message}`
        );
    }
  }

  console.log(`Total de pedidos recuperados e enriquecidos: ${allOrders.length}`);
  return allOrders;
}

async function fetchOrdersByCode(
    codigoPedido,
    codigoCliente = null
) {
    await checkToken();

    if (!authToken) {
        throw new Error(
            'Token de autenticação não foi obtido.'
        );
    }

    const codigo =
        String(
            codigoPedido || ''
        ).trim();

    if (!codigo) {
        return [];
    }

    const parametros =
        new URLSearchParams();

    parametros.set(
        'EmpresaCodigo',
        '2'
    );

    parametros.set(
        'PedidoCodigo',
        codigo
    );

    parametros.set(
        'PageNumber',
        '1'
    );

    parametros.set(
        'PageSize',
        '30'
    );

    if (
        codigoCliente !== null &&
        codigoCliente !== undefined &&
        codigoCliente !== ''
    ) {
        parametros.set(
            'ClienteCodigo',
            String(
                codigoCliente
            )
        );
    }

    const endpoint =
        '/vendas-service/pedido?' +
        parametros.toString();

    console.log(
        'Consultando pedido diretamente:',
        `${NgLink}${endpoint}`
    );

    const response =
        await executarFetchComRetentativa(
            `${NgLink}${endpoint}`,
            criarOpcoesGet()
        );

    if (!response.ok) {
        if (response.status === 404) {
            return [];
        }

        throw new Error(
            `Erro ao buscar pedido: ${response.statusText}`
        );
    }

    const resultado =
        await response.json();

    const pedidosRecebidos =
        Array.isArray(
            resultado?.dados
        )
            ? resultado.dados
            : [];

    const pedidos =
        pedidosRecebidos.filter(
            pedido => {
                return (
                    String(
                        pedido?.codigo ?? ''
                    ).trim() === codigo
                );
            }
        );

    if (pedidos.length === 0) {
        return [];
    }

    const pedido =
        pedidos[0];

    const pedidoEnriquecido =
        await enriquecerPedidoEncontrado(
            pedido
        );

    let notasFiscais =
        null;

    try {
        const parametrosNota =
            new URLSearchParams();

        parametrosNota.set(
            'PedidoDeVendaCodigo',
            String(
                pedido.codigo
            )
        );

        const endpointNota =
            '/documentos-fiscais-service/nota-fiscal?' +
            parametrosNota.toString();

        const respostaNota =
            await executarFetchComRetentativa(
                `${NgLink}${endpointNota}`,
                criarOpcoesGet()
            );

        if (respostaNota.ok) {
            notasFiscais =
                await respostaNota.json();
        }
    } catch (error) {
        console.error(
            `Erro ao buscar notas do pedido ${pedido.codigo}:`,
            error
        );
    }

    return [
        {
            ...pedidoEnriquecido,

            notas_fiscais:
                notasFiscais
        }
    ];
}

async function fetchOrderDetailsEndpoint(CodPedido) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return null;
  }

  try {
    // Endpoints para as requisições
    const representativeEndpoint = '/pessoa-service/representante?ClienteCodigo=';
    const orderDetailsEndpoint = '/vendas-service/pedido/';
    const transportEndpoint = '/pessoa-service/transportadora/codigo/';
    const detailsOrderEndpoint = `/vendas-service/pedido?PedidoCodigo=${CodPedido}`;

    // 1. Buscar dados básicos do pedido
    const detailsOrderResponse = await fetch(`${NgLink}${detailsOrderEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      }
    });

    if (!detailsOrderResponse.ok) {
      console.warn(`Erro ao buscar pedido: ${detailsOrderResponse.statusText}`);
      return null;
    }

    const detailsOrderData = await detailsOrderResponse.json();
    
    if (!detailsOrderData || detailsOrderData.length === 0) {
      console.warn('Nenhum dado de pedido encontrado');
      return null;
    }

    const order = detailsOrderData || []

    // 2. Buscar representante
    let representante = null;
    try {
      const repResponse = await fetch(`${NgLink}${representativeEndpoint}${order.dados[0].cliente.codigo}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (repResponse.ok) {
       console.log(`esta é teste repre ${repResponse}`)
        representante = await repResponse.json();
        
      }
    } catch (error) {
      console.error(`Erro ao buscar representante para cliente ${order.codigo}:`, error);
    }

    // 3. Buscar detalhes do pedido
    let detalhes = null;
    try {
      const detailsResponse = await fetch(`${NgLink}${orderDetailsEndpoint}${order.dados[0].id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (detailsResponse.ok) {
        detalhes = await detailsResponse.json();
        console.log(detalhes.representante[0]?.nomeAbreviado)
        console.log(detalhes.representante[0]?.id)
        
      }
    } catch (error) {
      console.error(`Erro ao buscar detalhes para o pedido com ID ${order.dados[0].id}:`, error);
    }

    // 4. Buscar detalhes da transportadora
    let detalhes_transporte = null;
    try {
      const transportResponse = await fetch(`${NgLink}${transportEndpoint}${order.dados[0].transportadoraCodigo}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (transportResponse.ok) {
        detalhes_transporte = await transportResponse.json();
      }
    } catch (error) {
      console.error(`Erro ao buscar detalhes da transportadora ${order.transportadoraCodigo}:`, error);
    }

    // Retornar o pedido com todos os detalhes
    return {
      ...order,
      representante,
      detalhes,
      detalhes_transporte,
    };

  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return null;
  }
}

setInterval(checkToken, 60 * 60 * 1000);  // Verifica o token a cada 1 hora

// Exportar as funções
module.exports = {
    authenticate,
    checkToken,
    fetchOrderDetails,
    fetchOrderDetailsEndpoint,
    fetchOrdersByInvoice,
    fetchOrdersByCode
};