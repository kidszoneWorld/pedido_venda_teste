const fetch = require('node-fetch');

let authToken = null;
let tokenExpirationTime = null;

// Função para autenticar e obter o token
async function authenticate() {
  try {
    const response = await fetch('https://gateway-ng.dbcorp.com.br:55500/identidade-service/autenticar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      },
      body: JSON.stringify({
        usuario: "alex.l",
        senha: "@Al@2313",
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
async function fetchOrderDetails(status = 6, userDataInicio = null, userDataFim = null, userStatusSeparacao = null, usercodCliente = null) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return [];
  }

  // Calcula as datas dinamicamente com base nos parâmetros fornecidos ou padrão
  const { dataInicio, dataFim } = getLast30Days(userDataInicio, userDataFim);

  console.log(`Buscando pedidos com status: ${status}, DataPedidoInicio: ${dataInicio}, DataPedidoFim: ${dataFim}, StatusSeparacao: ${userStatusSeparacao !== null ? userStatusSeparacao : 'todos'}`);

  const pageSize = 15; // Tamanho de cada página (lote)
  const maxRecords = 150; // Limite máximo de registros
  let currentPage = 1;
  let allOrders = [];
  let hasMoreData = true;

  // Endpoints para as requisições adicionais
  const representativeEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/pessoa-service/representante?ClienteCodigo=';
  const orderDetailsEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/vendas-service/pedido/';
  const transportEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/pessoa-service/transportadora/codigo/';
  const invoiceEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/documentos-fiscais-service/nota-fiscal?PedidoDeVendaCodigo=';

  while (hasMoreData && allOrders.length < maxRecords) {
    try {
      console.log(`Buscando página ${currentPage} com ${pageSize} registros por página...`);

      // 1. Buscar pedidos da página atual
      // Constrói a URL dinamicamente, incluindo StatusSeparacao apenas se fornecido
      let url = `https://gateway-ng.dbcorp.com.br:55500/vendas-service/pedido?DataPedidoInicio=${dataInicio}&DataPedidoFim=${dataFim}&status=${status}&EmpresaCodigo=2&PageNumber=${currentPage}&PageSize=${pageSize}`;
      if (userStatusSeparacao !== null) {
        url += `&StatusSeparacao=${userStatusSeparacao}`;
      }
      if (usercodCliente !== null) {
        url += `&ClienteCodigo=${usercodCliente}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar pedidos: ${response.statusText}`);
      }

      const ordersData = await response.json();
      const pageData = ordersData.dados || [];

      console.log(`Recebidos ${pageData.length} pedidos da página ${currentPage}`);

      // 2. Para cada pedido na página, buscar todos os detalhes relacionados
      const enrichedOrders = await Promise.all(pageData.map(async (order) => {
        try {
          // 2.1 Buscar representante
          let representante = null;
          try {
            const repResponse = await fetch(`${representativeEndpoint}${order.cliente.codigo}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (repResponse.ok) {
              const repData = await repResponse.json();
              representante = repData.dados[0] || null;
            }
          } catch (error) {
            console.error(`Erro ao buscar representante para cliente ${order.cliente.codigo}:`, error);
          }

          // 2.2 Buscar detalhes do pedido
          let detalhes = null;
          try {
            const detailsResponse = await fetch(`${orderDetailsEndpoint}${order.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (detailsResponse.ok) {
              detalhes = await detailsResponse.json();
            }
          } catch (error) {
            console.error(`Erro ao buscar detalhes para o pedido com ID ${order.id}:`, error);
          }

          // 2.3 Buscar detalhes da transportadora
          let detalhes_transporte = null;
          try {
            const transportResponse = await fetch(`${transportEndpoint}${order.transportadoraCodigo}`, {
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

          // 2.4 Buscar notas fiscais
          let notas_fiscais = null;
          try {
            const invoiceResponse = await fetch(`${invoiceEndpoint}${order.codigo}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (invoiceResponse.ok) {
              notas_fiscais = await invoiceResponse.json();
            }
          } catch (error) {
            console.error(`Erro ao buscar detalhes da NF ${order.codigo}:`, error);
          }

          // Retornar o pedido com todos os detalhes
          return {
            ...order,
            representante,
            detalhes,
            detalhes_transporte,
            notas_fiscais
          };
        } catch (error) {
          console.error(`Erro ao processar pedido:`, error);
          return order; // Retorna o pedido original em caso de erro
        }
      }));

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
      console.error(`Erro ao buscar página ${currentPage}:`, error);
      hasMoreData = false; // Para o loop em caso de erro
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
    const representativeEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/pessoa-service/representante?ClienteCodigo=';
    const orderDetailsEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/vendas-service/pedido/';
    const transportEndpoint = 'https://gateway-ng.dbcorp.com.br:55500/pessoa-service/transportadora/codigo/';
    const detailsOrderEndpoint = `https://gateway-ng.dbcorp.com.br:55500/vendas-service/pedido?PedidoCodigo=${CodPedido}`;

    // 1. Buscar dados básicos do pedido
    const detailsOrderResponse = await fetch(detailsOrderEndpoint, {
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
      const repResponse = await fetch(`${representativeEndpoint}${order.dados[0].cliente.codigo}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (repResponse.ok) {
        console.log(`esta é teste repre ${repResponse}`)
        representante = await repResponse.json();
        representante = representante.dados
      }
    } catch (error) {
      console.error(`Erro ao buscar representante para cliente ${order.codigo}:`, error);
    }

    // 3. Buscar detalhes do pedido
    let detalhes = null;
    try {
      const detailsResponse = await fetch(`${orderDetailsEndpoint}${order.dados[0].id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (detailsResponse.ok) {
        detalhes = await detailsResponse.json();
      }
    } catch (error) {
      console.error(`Erro ao buscar detalhes para o pedido com ID ${order.dados[0].id}:`, error);
    }

    // 4. Buscar detalhes da transportadora
    let detalhes_transporte = null;
    try {
      const transportResponse = await fetch(`${transportEndpoint}${order.dados[0].transportadoraCodigo}`, {
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
