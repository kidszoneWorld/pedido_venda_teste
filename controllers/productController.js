const apiForm = require('../utils/apiForm');
console.log('fetch existe?', typeof fetch);
const ApplicationToken = '62ca18a8-aa3b-41b7-a54e-f669a437d326';
const CompanyToken = 'b5b984c5-cbfa-490b-8513-448fc67a39b6';


let authToken = null;
let tokenExpirationTime = null;

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

async function checkToken() {
  if (!authToken || Date.now() > tokenExpirationTime) {
    console.log('Token expirado ou inexistente. Autenticando...');
    await authenticate();
  }
}    

async function verificarStatusItem(itemEmpresaId) {
    await checkToken();

    const url = `https://gateway-ng.dbcorp.com.br:55500/produto-service/item/${itemEmpresaId}/empresa/2`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Origin': 'https://kidszone-ng.dbcorp.com.br'
        }
    });


    const text = await response.text();

    if (!response.ok) {
        throw new Error(`Erro ao consultar status do item - HTTP ${response.status}`);
    }

    const data = JSON.parse(text);

    return {
        ativo: data.ativo,
        suspenso: data.suspenso,
        foraLinha: data.foraLinha
    };
}


async function getListaPreco(req, res) {
    try {
        const { listaId } = req.params;
        const { codigo } = req.query;

        const endpoint = `http://kidszone-api-integracao.dbcorp.com.br/v1/ListaPreco/BuscarItemPorId/${listaId}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'ApplicationToken': ApplicationToken,
                'CompanyToken': CompanyToken
            }
        });

        if (!response.ok) {
            console.warn(`Erro ao buscar itens da lista de preço: ${response.statusText}`);
            return res.status(502).json({ error: 'Erro ao buscar itens da lista de preço' });
        }

        const data = await response.json();


        if (!data.Result?.length) {
            return res.status(404).json({ message: 'Lista vazia' });
        }

        let itens = data.Result;

        if (codigo) {
    const cod = String(codigo).trim();

    itens = itens.filter(
        i => String(i.ItemCodigo).trim() === cod
    );

    if (!itens.length) {
        return res.status(404).json({ message: 'Item não encontrado' });
    }

    // 🔍 VERIFICA STATUS DO ITEM
    const item = itens[0];

    const status = await verificarStatusItem(item.ItemCodigo);

    if (status.suspenso == true) {
        return res.status(400).json({ message: 'Item suspenso' });
    }

    else if (status.ativo == false) {
        return res.status(400).json({ message: 'Item inativo' });
    }

    else if (status.foraLinha == true) {
        return res.status(400).json({ message: 'Item fora de linha' });
    }
}


        res.json(itens);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno' });
    }
}

async function getProductsDetails(req, res) {
  try {
    const { listaId } = req.params;

    const itensLista = await apiForm.fetchPriceListItems(listaId);

    if (!itensLista.length) {
      return res.status(404).json({ message: 'Itens não encontrados' });
    }

    const formatedProducts = formatProductsFromPriceList(itensLista);

    return res.status(200).json({ data: formatedProducts });
  } catch (error) {
    console.error('Erro ao obter dados dos produtos:', error);
    res.status(500).send('Erro ao obter dados dos produtos');
  }
}


/*function formatProductsFromPriceList(products) {
  let formated = [[
    "LISTA ID - ITEM ID",
    "LISTA NOME",
    "ITEM COD",
    "DV",
    "ITEM DESCRIÇÃO",
    "PREVISÃO DE CHEGADA",
    "EAN",
    "CLASSIFIC. FISCAL",
    "MASTER",
    "UV",
    "EMB",
    "PRECO",
    "IPI",
    "ItemId"
  ]];

  products.forEach(product => {
    let item = [];

    item.push(`${product.ListaPrecoId}-${product.ItemId}`);
    item.push('');
    item.push(product.ItemCodigo);
    item.push('S');
    item.push(product.ItemDescricao);
    item.push('null');
    item.push('null');
    item.push('null');
    item.push('null');
    item.push('CX');
    item.push('null');
    item.push(product.PrecoVenda);
    item.push(0.0325);
    item.push(product.ItemId);

    formated.push(item);
  });

  return formated;
}*/

module.exports = {
    getProductsDetails,
    getListaPreco
};