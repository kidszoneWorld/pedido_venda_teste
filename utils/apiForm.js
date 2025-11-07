const fetch = require('node-fetch');

// Verificar se AbortController está disponível nativamente (Node.js 15+)
let AbortController;
try {
  AbortController = globalThis.AbortController;
} catch (error) {
  // Fallback para versões mais antigas do Node.js
  AbortController = require('node-abort-controller').AbortController;
}

let authToken = null;
let tokenExpirationTime = null;
// Tokens necessários para autenticação
const ApplicationToken = '62ca18a8-aa3b-41b7-a54e-f669a437d326';
const CompanyToken = 'b5b984c5-cbfa-490b-8513-448fc67a39b6';

// Configurações de timeout
const API_TIMEOUT = 240000; // 4 minutos
const EXTENDED_TIMEOUT = 300000; // 5 minutos para operações mais longas

// Função utilitária para fazer fetch com timeout
async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      timeout: timeout
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Função utilitária para retry com backoff exponencial
async function fetchWithRetry(url, options = {}, maxRetries = 3, timeout = API_TIMEOUT) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt}/${maxRetries} para ${url}`);
      return await fetchWithTimeout(url, options, timeout);
    } catch (error) {
      lastError = error;
      console.warn(`Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
      
      if (attempt < maxRetries) {
        // Backoff exponencial: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Falha após ${maxRetries} tentativas. Último erro: ${lastError.message}`);
}


// Função para autenticar e obter o token
async function authenticate() {
  try {
    const response = await fetchWithRetry('https://gateway-ng.dbcorp.com.br:55500/identidade-service/autenticar', {
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
    }, 2, 60000); // 2 tentativas, 1 minuto de timeout cada

    if (!response.ok) {
      throw new Error(`Erro na autenticação: ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.tokenAcesso; // Atualizado para tokenAcesso
    tokenExpirationTime = Date.now() + 2 * 60 * 60 * 1000;
    console.log('Autenticado com sucesso, token obtido.');
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    throw error; // Re-throw para permitir tratamento upstream
  }
}

// Função para verificar se o token está válido ou se precisamos renovar
async function checkToken() {
  if (!authToken || Date.now() > tokenExpirationTime) {
    console.log('Token expirado ou inexistente. Autenticando...');
    await authenticate();
  }
}

async function fetchClientDetails(cnpj) {

  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return;
  }

  try {
    const response = await fetchWithTimeout(`https://gateway-ng.dbcorp.com.br:55500/pessoa-service/cliente/documento/${cnpj}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes do cliente: ${response.statusText}`);
    }

    const clientData = await response.json();
    console.log('dados clientes recebidos:', clientData); // Log dos dados recebidos

    return clientData || []; // Retorna o array de pedidos
  } catch (error) {
    console.error('Erro ao buscar detalhes do cliente:', error);
    throw error; // Re-throw para permitir tratamento upstream
  }

}


// Função para buscar representantes para cada cliente
async function fetchClientsWithRepresentatives(cnpj) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return null;
  }

  try {
    // 1. Buscar os dados do cliente
    const clientData = await fetchClientDetails(cnpj);

    if (!clientData || !clientData.codigo) {
      console.error('Cliente não encontrado ou dados inválidos');
      return null;
    }

    const clienteId = clientData.codigo;

    // 2. Buscar os representantes desse cliente
    const representativeEndpoint = `https://gateway-ng.dbcorp.com.br:55500/pessoa-service/representante?ClienteCodigo=${clienteId}`;

    const repResponse = await fetchWithTimeout(representativeEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      }
    });

    if (!repResponse.ok) {
      throw new Error(`Erro ao buscar representantes: ${repResponse.statusText}`);
    }

    const repData = await repResponse.json();
    console.log('dados representantes recebidos:', repData);

    // 3. Retornar cliente + representantes
    return {
      ...clientData,
      representantes: repData || []
    };

  } catch (error) {
    console.error('Erro ao buscar cliente com representantes:', error);
    return null;
  }
}

async function fetchClientsWithdetailsAndRepresentativesWithTransport(cnpj) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return null;
  }

  try {
    const clientRepresentative = await fetchClientsWithRepresentatives(cnpj)

    const transportId = clientRepresentative.transportadoraId

    const transportEndpoint = `https://gateway-ng.dbcorp.com.br:55500/pessoa-service/transportadora/codigo/${transportId}`

    let transData = [];

    try {
      const transResponse = await fetchWithTimeout(transportEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://kidszone-ng.dbcorp.com.br'
        }
      });


      if (!transResponse.ok) {
        console.warn(`Erro ao buscar transportdora: ${transResponse.statusText}`);
      } else {
        transData = await transResponse.json();
        console.log('dados transporte recebidos:', transData);

      }
    } catch (transError) {
      console.warn('Erro ao buscar transportadoras, retornando transportadoras como vazia.', transError);
    }

    return {
      ...clientRepresentative,
      transportadora: transData || []
    };

  } catch (error) {
    console.error('Erro ao buscar cliente com transportadoras:', error);
    return null;
  }
}


async function fetchAllClientapiAntiga(cnpj) {


  try {

    const clientRepresentativeWithTransport = await fetchClientsWithdetailsAndRepresentativesWithTransport(cnpj);

    const cnpjID = clientRepresentativeWithTransport.documento.numeroTexto;

    const cnpjEndpoint = `http://kidszone-api-integracao.dbcorp.com.br/v1/Cliente/BuscarPorCnpjCpf/${cnpjID}`;

    let cnpjData = [];

    try {
      const cnpjResponse = await fetchWithTimeout(cnpjEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ApplicationToken': ApplicationToken,
          'CompanyToken': CompanyToken,
        }
      });

      if (!cnpjResponse.ok) {
        console.warn(`Lista de preço não encontrada ou erro de resposta: ${cnpjResponse.statusText}`);
      } else {
        cnpjData = await cnpjResponse.json();
        console.log('dados clientye atinga recebidos:', cnpjData);
      }
    } catch (cnpjError) {
      console.warn('Erro ao buscar lista de preço, retornando listaPreco como vazia.', cnpjError);
    }

    return {
      ...clientRepresentativeWithTransport,
      clienteDataOld: cnpjData || []
    };

  } catch (error) {
    console.error('Erro ao buscar cliente com lista de preço:', error);
    return null;
  }
}



async function fetchAllClientsWithPriceList(cnpj) {


  try {

    const clientOld = await fetchAllClientapiAntiga(cnpj);

    const codClientId = clientOld.codigo;

    const priceListtEndpoint = `https://gateway-ng.dbcorp.com.br:55500/vendas-service/lista-preco?ClienteCodigo=${codClientId}`;
    console.log(`Codigo do Cliente: ${codClientId}`);
    let priceListData = [];

    try {
      const priceListResponse = await fetchWithTimeout(priceListtEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://kidszone-ng.dbcorp.com.br'
        }
      }, EXTENDED_TIMEOUT);

      if (!priceListResponse.ok) {
        console.warn(`Lista de preço não encontrada ou erro de resposta: ${priceListResponse.statusText}`);
      } else {
        priceListData = await priceListResponse.json();
        console.log('dados lista preco atinga recebidos:', priceListData);
      }
    } catch (priceListError) {
      console.warn('Erro ao buscar lista de preço, retornando listaPreco como vazia.', priceListError);
    }

    return {
      ...clientOld,
      listaPreco: priceListData.dados || []
    };

  } catch (error) {
    console.error('Erro ao buscar cliente com lista de preço:', error);
    return null;
  }
}


async function fetchPaymentCondition(cnpj) {


  try {
    const clientWithPriceList = await fetchAllClientsWithPriceList(cnpj)

    const paytId = clientWithPriceList.condicaoPagamentoId

    const payEndpoint = `http://kidszone-api-integracao.dbcorp.com.br/v1/CondicaoPagamento/BuscarPorId/${paytId}`;

    let payData = [];

    try {
      const payResponse = await fetchWithTimeout(payEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ApplicationToken': ApplicationToken,
          'CompanyToken': CompanyToken,
        }
      });


      if (!payResponse.ok) {
        console.warn(`Erro ao buscar condição de pagamento: ${payResponse.statusText}`);
      } else {
        payData = await payResponse.json();
        console.log('dados cod de pagamento atinga recebidos:', payData);
      }
    } catch (payError) {
      console.warn('Erro ao buscar condição de pagamento, retornando condicaoPagamento como vazia.', payError);
    }

    return {
      ...clientWithPriceList,
      condicaoPagamento: payData || []
    };

  } catch (error) {
    console.error('Erro ao buscar condição de pagamento:', error);
    return null;
  }
}


async function fetchPaymentMethod(cnpj) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return null;
  }

  try {
    const clientWithPaymentCondition = await fetchPaymentCondition(cnpj)

    const payMethodtId = clientWithPaymentCondition.codigo

    const payMethodEndpoint = `https://gateway-ng.dbcorp.com.br:55500/financeiro-service/forma-de-pagamento?ClienteCodigo=${payMethodtId}&EmpresaCodigo=2`

    let payMethodData = [];

    try {
      const payMethodResponse = await fetchWithTimeout(payMethodEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://kidszone-ng.dbcorp.com.br'
        }
      });


      if (!payMethodResponse.ok) {
        console.warn(`Erro ao buscar forma de pagamento: ${payMethodResponse.statusText}`);
      } else {
        payMethodData = await payMethodResponse.json();
        console.log('dados forma de pagamentos recebidos:', payMethodData);
      }
    } catch (payMethodError) {
      console.warn('Erro ao buscar froma de pagamento, retornando formaPagamento como vazia.', payMethodError);
    }

    return {
      ...clientWithPaymentCondition,
      formaPagamento: payMethodData || []
    };

  } catch (error) {
    console.error('Erro ao buscar forma de pagamento:', error);
    return null;
  }
}


async function fetchcontat(cnpj) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return null;
  }

  try {
    const clientWithPaymentMethod = await fetchPaymentMethod(cnpj)

    const clientId = clientWithPaymentMethod.codigo

    const contatEndpoint = `https://gateway-ng.dbcorp.com.br:55500/pessoa-service/cliente/${clientId}/contatos`

    let contatData = [];

    try {
      const contatResponse = await fetchWithTimeout(contatEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Origin': 'https://kidszone-ng.dbcorp.com.br'
        }
      });


      if (!contatResponse.ok) {
        console.warn(`Erro ao buscar contato: ${contatResponse.statusText}`);
      } else {
        contatData = await contatResponse.json();
        console.log('dados contato recebidos:', contatData);

      }
    } catch (contatError) {
      console.warn('Erro ao buscar contato, retornando contato como vazia.', contatError);
    }

    return {
      ...clientWithPaymentMethod,
      contatoCliente: contatData || []
    };

  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return null;
  }
}

async function fetchItems(lista_id) {
  await checkToken();

  if (!authToken) {
    console.error('Erro: Token não obtido.');
    return null;
  }

  try {
    const endpoint_lista = `https://gateway-ng.dbcorp.com.br:55500/produto-service/v1.1/item/lista-preco/${lista_id}`
    const endpoint_produto = `https://gateway-ng.dbcorp.com.br:55500/produto-service/item/`
    const endpoint_preco = `https://gateway-ng.dbcorp.com.br:55500/vendas-service/lista-preco/preco-unitario`

    const response = await fetchWithTimeout(endpoint_lista, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      }
    });


    if (!response.ok) {
      throw new Error(response.statusText)
    }

    const lista_response = await response.json()
    console.log("ITEM: ", lista_response.dados[0])
    const itemsDetails = [];

    for (const item of lista_response.dados) {
      try {
        const prodResponse = await fetchWithTimeout(`${endpoint_produto}${item.codigo}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Origin': 'https://kidszone-ng.dbcorp.com.br'
          }
        });

        if (!prodResponse.ok) {
          console.warn(`Erro ao buscar detalhe do item ${item.codigo}: ${prodResponse.statusText}`);
          continue;
        }

        const prodData = await prodResponse.json();
        try {
          const precoResponse = await fetchWithTimeout(`${endpoint_preco}?ListaPrecoCodigo=${lista_id}&ItemCodigo=${item.codigo}&EmpresaCodigo=${2}&MoedaCodigo=${3}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Origin': 'https://kidszone-ng.dbcorp.com.br'
            }
          });

          if (!precoResponse.ok) {
            console.warn(`Erro ao buscar preço do item ${item.codigo}: ${precoResponse.statusText}`);
            continue;
          }

          const precoData = await precoResponse.json();
          itemsDetails.push({ ...prodData, precoData });
        } catch (err) {
          console.warn(`Erro ao buscar preço do item ${item.codigo}:`, err);
        }
      } catch (err) {
        console.warn(`Erro ao buscar detalhe do item ${item.codigo}:`, err);
      }
    }
    return itemsDetails;
  } catch (error) {
    console.error('Erro ao buscar contato:', error);
    return [];
  }
}

setInterval(checkToken, 60 * 60 * 1000);  // Verifica o token a cada 1 hora



// Exportar as funções
module.exports = {
  authenticate,
  checkToken,
  fetchClientDetails,
  fetchClientsWithRepresentatives,
  fetchClientsWithdetailsAndRepresentativesWithTransport,
  fetchAllClientsWithPriceList,
  fetchPaymentCondition,
  fetchPaymentMethod,
  fetchcontat,
  fetchItems
};
