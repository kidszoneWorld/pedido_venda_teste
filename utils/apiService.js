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

        // await aguardar(
        //     tempoEspera
        // );

        tentativa += 1;
    }

    throw new Error(
        'A API permaneceu limitada após várias tentativas.'
    );
}
function criarOpcoesGet() {
    return {
        method:
            'GET',

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

// Função para calcular as datas de início e fim (últimos 60 dias como padrão, se não fornecidas)
function getLast30Days(userDataInicio = null, userDataFim = null) {
  const hoje = new Date();
  const dataFim = userDataFim ? new Date(userDataFim).toISOString().split('T')[0] : hoje.toISOString().split('T')[0]; // Usa data fornecida ou hoje
  const dataInicio = userDataInicio 
    ? new Date(userDataInicio).toISOString().split('T')[0] 
    : new Date(hoje.setDate(hoje.getDate() - 60)).toISOString().split('T')[0]; // Usa data fornecida ou 60 dias atrás
  return { dataInicio, dataFim };
}


// Função para buscar os pedidos de venda com paginação e todos os detalhes relacionados
async function fetchOrderDetails(status = 6, userDataInicio = null, userDataFim = null, userStatusSeparacao = null , usercodCliente = null) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return [];
  }

  // Calcula as datas dinamicamente com base nos parâmetros fornecidos ou padrão
  const { dataInicio, dataFim } = getLast30Days(userDataInicio, userDataFim);
  
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
      let url = `/vendas-service/pedido?DataPedidoInicio=${dataInicio}&DataPedidoFim=${dataFim}&status=${status}&EmpresaCodigo=2&PageNumber=${currentPage}&PageSize=${pageSize}`;
      if (userStatusSeparacao !== null) {
        url += `&StatusSeparacao=${userStatusSeparacao}`;
      }
      if (usercodCliente !== null) {
        url += `&ClienteCodigo=${usercodCliente}`;
      }

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
  fetchOrderDetailsEndpoint
};
