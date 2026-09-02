const fetch = require('node-fetch');

let authToken = null;
let tokenExpirationTime = null;
// Tokens necessários para autenticação
const ApplicationToken = process.env.APPLICATION_TOKEN;
const CompanyToken = process.env.COMPANY_TOKEN;
const ngLink = process.env.NG_LINK
const pcrLink = process.env.PCR_LINK
const usuarioDbCorp = process.env.USUARIO_DBCORP
const senhabCorp = process.env.SENHA_DBCORP

// Função para autenticar e obter o token
async function authenticate() {
  try {
    const response = await fetch(`${ngLink}/identidade-service/autenticar`, {
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

async function fetchClientDetails(api, cnpj) {

      await checkToken();
    
      if (!authToken) {
        console.error('Erro: Token não obtido.');
        return;
      }
      console.log(api, cnpj)
      try {
        const response = await fetch(`${ngLink}/pessoa-service/cliente/${api}/${cnpj}`, {
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
async function fetchClientsWithRepresentatives(api, cnpj) {
    await checkToken();
  
    if (!authToken) {
      console.error('Erro: Token não obtido.');
      return null;
    }
  
    try {
      // 1. Buscar os dados do cliente
      const clientData = await fetchClientDetails(api, cnpj);
  
      if (!clientData || !clientData.codigo) {
        console.error('Cliente não encontrado ou dados inválidos');
        return null;
      }
  
      const clienteId = clientData.codigo;
  
      // 2. Buscar os representantes desse cliente
      const representativeEndpoint = `/pessoa-service/representante?ClienteCodigo=${clienteId}`;
      
      const repResponse = await fetch(`${ngLink}${representativeEndpoint}`, {
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

async function fetchClientsWithdetailsAndRepresentativesWithTransport(api, cnpj) {
    await checkToken();
  
    if (!authToken) {
      console.error('Erro: Token não obtido.');
      return null;
    }
  
    try {
       const clientRepresentative = await fetchClientsWithRepresentatives(api, cnpj)
  
       const transportId = clientRepresentative.transportadoraId
  
       const transportEndpoint = `/pessoa-service/transportadora/codigo/${transportId}`
  
      let transData = [];
  
      try {
         const transResponse = await fetch(`${ngLink}${transportEndpoint}`, {
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
  

  async function fetchAllClientapiAntiga(api, cnpj) {
    

    try {

      const clientRepresentativeWithTransport = await fetchClientsWithdetailsAndRepresentativesWithTransport(api, cnpj);
  
      const cnpjID= clientRepresentativeWithTransport.documento.numeroTexto;
  
      const cnpjEndpoint = `/v1/Cliente/BuscarPorCnpjCpf/${cnpjID}`;
  
      let cnpjData = [];
  
      try {
        const cnpjResponse = await fetch(`${pcrLink}${cnpjEndpoint}`, {
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
  


  async function fetchAllClientsWithPriceList(api, cnpj) {
    

    try {

      const clientOld = await fetchAllClientapiAntiga(api, cnpj)
      const codClientId = clientOld.codigo;
  
      const priceListtEndpoint = `/vendas-service/lista-preco?ClienteCodigo=${codClientId}`;
      console.log(`Codigo do Cliente: ${codClientId}`);
      let priceListData = [];
  
      try {
        const priceListResponse = await fetch(`${ngLink}${priceListtEndpoint}`, {
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
        listaPreco: priceListData.dados || []
      };
  
    } catch (error) {
      console.error('Erro ao buscar cliente com lista de preço:', error);
      return null;
    }
  }
  

async function fetchPaymentCondition(api, cnpj) {

 
    try {
       const clientWithPriceList = await fetchAllClientsWithPriceList(api, cnpj)
  
       const paytId = clientWithPriceList.condicaoPagamentoId
  
       const payEndpoint = `/v1/CondicaoPagamento/BuscarPorId/${paytId}`;
  
      let payData = [];
  
      try {
         const payResponse = await fetch(`${pcrLink}${payEndpoint}`, {
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


  async function fetchPaymentMethod(api, cnpj) {
    await checkToken();
  
    if (!authToken) {
      console.error('Erro: Token não obtido.');
      return null;
    }
  
    try {
       const clientWithPaymentCondition = await fetchPaymentCondition(api, cnpj)
  
       const payMethodtId = clientWithPaymentCondition.codigo
  
       const payMethodEndpoint = `/financeiro-service/forma-de-pagamento?ClienteCodigo=${payMethodtId}&EmpresaCodigo=2`
  
      let payMethodData = [];
  
      try {
         const payMethodResponse = await fetch(`${ngLink}${payMethodEndpoint}`, {
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


  async function fetchcontat(api, cnpj) {
    await checkToken();
  
    if (!authToken) {
      console.error('Erro: Token não obtido.');
      return null;
    }
  
    try {
       const clientWithPaymentMethod = await fetchPaymentMethod(api, cnpj)
  
       const clientId = clientWithPaymentMethod.codigo
  
       const contatEndpoint = `/pessoa-service/cliente/${clientId}/contatos`
  
      let contatData = [];
  
      try {
         const contatResponse = await fetch(`${ngLink}${contatEndpoint}`, {
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
  
//Buscar lista de preço:
async function fetchPriceListItems(codigoLista) {
  const endpoint = `/v1/ListaPreco/BuscarItemPorId/${codigoLista}`;

  try {
    const response = await fetch(`${pcrLink}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ApplicationToken': ApplicationToken,
        'CompanyToken': CompanyToken
      }
    });

    if (!response.ok) {
      console.warn(`Erro ao buscar itens da lista de preço: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log('Itens da lista de preço recebidos:', data);

    return data.Result || [];
  } catch (error) {
    console.error('Erro ao buscar itens da lista de preço:', error);
    return [];
  }
}


//função composta para pegar o lista de preço
async function fetchClientWithPriceListItems(api, cnpj) {
  const client = await fetchcontat(api, cnpj);

  if (!client?.listaPreco?.[0]?.codigo) {
    return client;
  }

  const listaId = client.listaPreco[0].codigo;

  const itensLista = await fetchPriceListItems(listaId);

  return {
    ...client,
    itensListaPreco: itensLista
  };
}


async function fazerGetAutenticadoNg(endpoint){

    await checkToken();

    if(!authToken){

        throw new Error(
            'Não foi possível obter o token de autenticação.'
        );

    }

    const response =
        await fetch(
            `${ngLink}${endpoint}`,
            {
                method:
                    'GET',

                headers: {
                    Authorization:
                        `Bearer ${authToken}`,

                    Accept:
                        'application/json',

                    'Content-Type':
                        'application/json',

                    Origin:
                        'https://kidszone-ng.dbcorp.com.br'
                }
            }
        );

    const texto =
        await response.text();

    let dados =
        null;

    if(texto){

        try{

            dados =
                JSON.parse(
                    texto
                );

        }catch{

            throw new Error(
                `A API retornou um JSON inválido. Endpoint: ${endpoint}`
            );

        }

    }

    if(!response.ok){

        const mensagem =
            dados?.message ||
            dados?.mensagem ||
            dados?.erro ||
            `Erro HTTP ${response.status}`;

        throw new Error(
            `${mensagem}. Endpoint: ${endpoint}`
        );

    }

    return dados;

}

async function fetchPriceListsByClient(
    clienteCodigo
){

    const codigo =
        String(
            clienteCodigo || ''
        )
        .trim();

    if(!codigo){

        throw new Error(
            'Código do cliente não informado.'
        );

    }

    const endpoint =
        `/vendas-service/lista-preco?ClienteCodigo=${encodeURIComponent(codigo)}`;

    const resposta =
        await fazerGetAutenticadoNg(
            endpoint
        );

    const listas =
        resposta?.dados;

    if(
        !Array.isArray(listas) ||
        listas.length === 0
    ){

        throw new Error(
            `Nenhuma lista de preço foi encontrada para o cliente ${codigo}.`
        );

    }

    return listas;

}

async function fetchProductByItemId(
    itemId
){

    const id =
        String(
            itemId || ''
        )
        .trim();

    if(!id){

        throw new Error(
            'ItemId não informado.'
        );

    }

    const endpoint =
        `/produto-service/item/${encodeURIComponent(id)}`;

    const produto =
        await fazerGetAutenticadoNg(
            endpoint
        );

    if(
        !produto ||
        typeof produto !== 'object'
    ){

        throw new Error(
            `Dados inválidos para o itemId ${id}.`
        );

    }

    return produto;

}

async function mapearComLimite(
    valores,
    limite,
    processador
){

    const resultados =
        new Array(
            valores.length
        );

    let proximoIndice =
        0;

    async function trabalhador(){

        while(true){

            const indiceAtual =
                proximoIndice++;

            if(
                indiceAtual >=
                valores.length
            ){
                return;
            }

            try{

                resultados[indiceAtual] =
                    await processador(
                        valores[indiceAtual],
                        indiceAtual
                    );

            }catch(error){

                resultados[indiceAtual] = {
                    erro:
                        true,

                    mensagem:
                        error.message,

                    valor:
                        valores[indiceAtual]
                };

            }

        }

    }

    const quantidadeTrabalhadores =
        Math.min(
            limite,
            valores.length
        );

    await Promise.all(
        Array.from(
            {
                length:
                    quantidadeTrabalhadores
            },
            trabalhador
        )
    );

    return resultados;

}

async function fetchCatalogoCliente(
    clienteCodigo,
    listaCodigoSolicitada = null
){

    const listas =
        await fetchPriceListsByClient(
            clienteCodigo
        );

    /*
     * Se o cliente possuir mais de uma lista:
     * 1. tenta localizar a lista solicitada;
     * 2. caso contrário, utiliza a primeira.
     */
    let listaSelecionada =
        null;

    if(listaCodigoSolicitada){

        listaSelecionada =
            listas.find(lista => {

                return (
                    String(lista.codigo) ===
                    String(listaCodigoSolicitada)
                );

            });

    }

    if(!listaSelecionada){

        listaSelecionada =
            listas[0];

    }

    if(!listaSelecionada){

        throw new Error(
            `Nenhuma lista de preço foi encontrada para o cliente ${clienteCodigo}.`
        );

    }

    const itensPreco =
        Array.isArray(
            listaSelecionada.itemListaPreco
        )
            ? listaSelecionada.itemListaPreco
            : [];

    if(itensPreco.length === 0){

        throw new Error(
            `A lista de preço ${listaSelecionada.codigo} não possui itens.`
        );

    }

    const resultados =
        await mapearComLimite(
            itensPreco,
            8,
            async itemPreco => {

                const produto =
                    await fetchProductByItemId(
                        itemPreco.itemId
                    );

                const itemEmpresaId =
                    String(
                        produto.itemEmpresaId || ''
                    )
                    .trim();

                if(!itemEmpresaId){

                    throw new Error(
                        `O produto ${itemPreco.itemId} não possui itemEmpresaId.`
                    );

                }

                return {
                    itemListaPrecoId:
                        itemPreco.itemListaPrecoId,

                    listaPrecoId:
                        itemPreco.listaPrecoId,

                    itemId:
                        itemPreco.itemId,

                    itemEmpresaId:
                        itemEmpresaId,

                    preco:
                        Number(
                            itemPreco.precoVenda || 0
                        ),

                    descricao:
                        produto.descricao ||
                        produto.descricaoNotaFiscal ||
                        '',

                    descricaoNotaFiscal:
                        produto.descricaoNotaFiscal ||
                        '',

                    classificacaoFiscal:
                        produto.classificacaoFiscal
                            ? String(
                                produto.classificacaoFiscal
                            )
                            : null,

                    origem:
                        Number(
                            produto.origem || 0
                        ),

                    unidade:
                        produto.unidadeMedidaAbreviado ||
                        'CX',

                    foto:
                        produto.foto ||
                        null,

                    ativo:
                        produto.ativo === true,

                    suspenso:
                        produto.suspenso === true,

                    foraLinha:
                        produto.foraLinha === true,

                    bloqueado:
                        produto.bloqueado === true,

                    exibeConsultasListaPreco:
                        produto.exibeConsultasListaPreco !== false,

                    percentualDescontoMaximo:
                        Number(
                            itemPreco.percentualDescontoMaximo || 0
                        )
                };

            }
        );

    const itens =
        resultados.filter(resultado => {

            return (
                resultado &&
                resultado.erro !== true
            );

        });

    const erros =
        resultados
            .filter(resultado => {

                return (
                    resultado &&
                    resultado.erro === true
                );

            })
            .map(resultado => {

                return {
                    itemId:
                        resultado.valor?.itemId ||
                        null,

                    mensagem:
                        resultado.mensagem
                };

            });

    return {
        listaPreco: {
            codigo:
                listaSelecionada.codigo,

            descricao:
                listaSelecionada.descricao,

            moeda:
                listaSelecionada.moeda,

            ehLivre:
                listaSelecionada.ehLivre,

            descontoMaximo:
                listaSelecionada.descontoMaximo
        },

        itens:
            itens,

        erros:
            erros,

        totalItensLista:
            itensPreco.length,

        totalItensCarregados:
            itens.length,

        totalErros:
            erros.length
    };

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
    fetchPriceListItems,
    fazerGetAutenticadoNg,
    fetchPriceListsByClient,
    fetchProductByItemId,
    fetchCatalogoCliente
};