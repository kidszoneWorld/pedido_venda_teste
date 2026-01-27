const apiForm = require('../utils/apiForm');
console.log('fetch existe?', typeof fetch);
const ApplicationToken = '62ca18a8-aa3b-41b7-a54e-f669a437d326';
const CompanyToken = 'b5b984c5-cbfa-490b-8513-448fc67a39b6';

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
console.log('DADOS RECEBIDOS DA API:', data.Result);
console.log('TAMANHO:', data.Result.length);


        if (!data.Result?.length) {
            return res.status(404).json({ message: 'Lista vazia' });
        }

        let itens = data.Result;

        if (codigo) {
            const cod = String(codigo).trim();
            console.log('CODIGO RECEBIDO:', codigo);
            console.log('TIPO:', typeof codigo);
            console.log('EXEMPLO API:', data.Result[0].ItemCodigo);

            itens = itens.filter(
                i => String(i.ItemCodigo).trim() === cod
            );

            if (!itens.length) {
                return res.status(404).json({ message: 'Item não encontrado' });
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


function formatProductsFromPriceList(products) {
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
}

module.exports = {
    getProductsDetails,
    getListaPreco
};