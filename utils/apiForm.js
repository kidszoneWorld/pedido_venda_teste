const fetch = require('node-fetch');

let authToken = null;
let tokenExpirationTime = null;
// Tokens necessários para autenticação
const ApplicationToken = '62ca18a8-aa3b-41b7-a54e-f669a437d326';
const CompanyToken = 'b5b984c5-cbfa-490b-8513-448fc67a39b6';


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

async function fetchClientDetails(cnpj) {

      await checkToken();
    
      if (!authToken) {
        console.error('Erro: Token não obtido.');
        return;
      }
    
      try {
        const response = await fetch(`https://gateway-ng.dbcorp.com.br:55500/pessoa-service/cliente/documento/${cnpj}`, {
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
      const representativeEndpoint = `https://gateway-ng.dbcorp.com.br:55500/pessoa-service/representante/cliente/${clienteId}`;
      
      const repResponse = await fetch(representativeEndpoint, {
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
         const transResponse = await fetch(transportEndpoint, {
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
  
      const cnpjID= clientRepresentativeWithTransport.documento.numeroTexto;
  
      const cnpjEndpoint = `http://kidszone-api-integracao.dbcorp.com.br/v1/Cliente/BuscarPorCnpjCpf/${cnpjID}`;
  
      let cnpjData = [];
  
      try {
        const cnpjResponse = await fetch(cnpjEndpoint, {
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
  
      const priceListtEndpoint = `https://gateway-ng.dbcorp.com.br:55500/vendas-service/listapreco/cliente/${codClientId}`;
  
      let priceListData = [];
  
      try {
        const priceListResponse = await fetch(priceListtEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Origin': 'https://kidszone-ng.dbcorp.com.br'
          }
        });
  
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
        listaPreco: priceListData || []
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
         const payResponse = await fetch(payEndpoint, {
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
  
       const payMethodEndpoint = `https://gateway-ng.dbcorp.com.br:55500/financeiro-service/forma-de-pagamento?ClienteCodigo=${payMethodtId}`
  
      let payMethodData = [];
  
      try {
         const payMethodResponse = await fetch(payMethodEndpoint, {
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
         const contatResponse = await fetch(contatEndpoint, {
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
    fetchcontat


  };
  