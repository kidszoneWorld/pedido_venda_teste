const apiForm = require('../utils/apiForm');
const ApplicationToken = process.env.APPLICATION_TOKEN;
const CompanyToken = process.env.COMPANY_TOKEN;
const ngLink = process.env.NG_LINK
const pcrLink = process.env.PCR_LINK
const usuarioDbCorp = process.env.USUARIO_DBCORP
const senhabCorp = process.env.SENHA_DBCORP

let authToken = null;
let tokenExpirationTime = null;
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

async function checkToken() {
  if (!authToken || Date.now() > tokenExpirationTime) {
    console.log('Token expirado ou inexistente. Autenticando...');
    await authenticate();
  }
}    

async function getCatalogoCliente(
    req,
    res
){

    try{

        const clienteCodigo =
            String(
                req.params.clienteCodigo || ''
            )
            .trim();

        const listaCodigo =
            req.query.listaCodigo
                ? String(
                    req.query.listaCodigo
                ).trim()
                : null;

        if(!clienteCodigo){

            return res
                .status(400)
                .json({
                    sucesso:
                        false,

                    mensagem:
                        'Código do cliente não informado.'
                });

        }

        const catalogo =
            await apiForm.fetchCatalogoCliente(
                clienteCodigo,
                listaCodigo
            );

        return res
            .status(200)
            .json({
                sucesso:
                    true,

                ...catalogo
            });

    }catch(error){

        console.error(
            'Erro ao carregar catálogo do cliente:',
            error
        );

        return res
            .status(500)
            .json({
                sucesso:
                    false,

                mensagem:
                    error.message ||
                    'Erro ao carregar o catálogo do cliente.'
            });

    }

}

async function verificarStatusItem(
    itemEmpresaId
){

    await checkToken();

    if(!authToken){

        throw new Error(
            'Não foi possível obter o token de autenticação.'
        );

    }

    const codigoItem =
        String(
            itemEmpresaId || ''
        )
        .trim();

    if(!codigoItem){

        throw new Error(
            'Código do item não informado.'
        );

    }

    const url =
        `${ngLink}/produto-service/item/${encodeURIComponent(codigoItem)}/empresa/2`;

    const response =
        await fetch(
            url,
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

    const textoResposta =
        await response.text();

    if(!response.ok){

        throw new Error(
            `Erro ao consultar o item ${codigoItem}. HTTP ${response.status}: ${textoResposta}`
        );

    }

    let respostaApi;

    try{

        respostaApi =
            JSON.parse(
                textoResposta
            );


            console.dir(
    respostaApi,
    {
        depth:
            null,

        colors:
            true
    }
);
    }catch(error){

        console.error(
            'Resposta recebida da API:',
            textoResposta
        );

        throw new Error(
            `A API retornou um JSON inválido para o item ${codigoItem}.`
        );

    }

    /*
     * Alguns endpoints retornam um objeto direto.
     * Outros retornam dentro de data, result ou Result.
     */
    let produto =
        respostaApi;

    if(
        respostaApi.data &&
        typeof respostaApi.data === 'object'
    ){

        produto =
            respostaApi.data;

    }else if(
        respostaApi.result &&
        typeof respostaApi.result === 'object'
    ){

        produto =
            respostaApi.result;

    }else if(
        respostaApi.Result &&
        typeof respostaApi.Result === 'object'
    ){

        produto =
            respostaApi.Result;

    }

    /*
     * Se o conteúdo encapsulado for um array,
     * utiliza o primeiro produto.
     */
    if(Array.isArray(produto)){

        produto =
            produto[0];

    }

    if(
        !produto ||
        typeof produto !== 'object'
    ){

        throw new Error(
            `A API não retornou os dados do item ${codigoItem}.`
        );

    }

    /*
     * Procura primeiro no produto selecionado.
     * Depois procura diretamente no objeto bruto.
     */
    const classificacaoFiscal =
        produto['classificacaoFiscal'] ??
        produto['ClassificacaoFiscal'] ??
        produto['classificacao_fiscal'] ??
        produto['CLASSIFICACAO_FISCAL'] ??
        produto['ncm'] ??
        produto['NCM'] ??
        respostaApi['classificacaoFiscal'] ??
        respostaApi['ClassificacaoFiscal'] ??
        respostaApi['ncm'] ??
        respostaApi['NCM'] ??
        null;

    const origem =
        produto['origem'] ??
        produto['Origem'] ??
        produto['ORIGEM'] ??
        respostaApi['origem'] ??
        respostaApi['Origem'] ??
        null;

    const ativo =
        produto['ativo'] ??
        produto['Ativo'] ??
        respostaApi['ativo'] ??
        respostaApi['Ativo'] ??
        false;

    const suspenso =
        produto['suspenso'] ??
        produto['Suspenso'] ??
        respostaApi['suspenso'] ??
        respostaApi['Suspenso'] ??
        false;

    const foraLinha =
        produto['foraLinha'] ??
        produto['ForaLinha'] ??
        respostaApi['foraLinha'] ??
        respostaApi['ForaLinha'] ??
        false;

    const bloqueado =
        produto['bloqueado'] ??
        produto['Bloqueado'] ??
        respostaApi['bloqueado'] ??
        respostaApi['Bloqueado'] ??
        false;



    return {
        ativo:
            Boolean(ativo),

        suspenso:
            Boolean(suspenso),

        foraLinha:
            Boolean(foraLinha),

        bloqueado:
            Boolean(bloqueado),

        classificacaoFiscal:
            classificacaoFiscal !== null
                ? String(classificacaoFiscal).trim()
                : null,

        origem:
            origem
    };

}

async function getListaPreco(req, res){

    try{

        const listaId =
            String(
                req.params.listaId || ''
            )
            .trim();

        const codigo =
            String(
                req.query.codigo || ''
            )
            .trim();

        if(!listaId){

            return res
                .status(400)
                .json({
                    message:
                        'Código da lista de preço não informado.'
                });

        }

        const endpoint =
            `/v1/ListaPreco/BuscarItemPorId/${encodeURIComponent(listaId)}`;

        const response =
            await fetch(
                `${pcrLink}${endpoint}`,
                {
                    method:
                        'GET',

                    headers: {
                        'Content-Type':
                            'application/json',

                        ApplicationToken:
                            ApplicationToken,

                        CompanyToken:
                            CompanyToken
                    }
                }
            );

        if(!response.ok){

            const erroTexto =
                await response.text()
                    .catch(() => '');

            console.warn(
                'Erro ao buscar lista de preço:',
                {
                    status:
                        response.status,

                    erro:
                        erroTexto
                }
            );

            return res
                .status(502)
                .json({
                    message:
                        'Erro ao buscar itens da lista de preço.'
                });

        }

        const data =
            await response.json();

        if(
            !Array.isArray(data.Result) ||
            data.Result.length === 0
        ){

            return res
                .status(404)
                .json({
                    message:
                        'Lista de preço vazia.'
                });

        }

        let itens =
            data.Result;

        if(codigo){

            itens =
                itens.filter(item => {

                    return (
                        String(
                            item.ItemCodigo || ''
                        )
                        .trim()
                        .toUpperCase() ===
                        codigo.toUpperCase()
                    );

                });

            if(itens.length === 0){

                return res
                    .status(404)
                    .json({
                        message:
                            'Item não encontrado.'
                    });

            }

            const itemLista =
                itens[0];

            /*
             * Usa ItemCodigo, que no seu exemplo
             * corresponde ao itemEmpresaId "1001".
             */
            const status =
                await verificarStatusItem(
                    itemLista.ItemCodigo
                );

            if(status.suspenso === true){

                return res
                    .status(400)
                    .json({
                        message:
                            'Item suspenso.'
                    });

            }

            if(status.ativo === false){

                return res
                    .status(400)
                    .json({
                        message:
                            'Item inativo.'
                    });

            }

            if(status.foraLinha === true){

                return res
                    .status(400)
                    .json({
                        message:
                            'Item fora de linha.'
                    });

            }

            if(status.bloqueado === true){

                return res
                    .status(400)
                    .json({
                        message:
                            'Item bloqueado.'
                    });

            }

            if(
                Number(status.origem) === 2 &&
                !status.classificacaoFiscal
            ){

                return res
                    .status(422)
                    .json({
                        message:
                            'A classificação fiscal do item não foi retornada pela API.'
                    });

            }

            itens =
                itens.map(item => {

                    return {
                        ...item,

                        classificacaoFiscal:
                            status.classificacaoFiscal,

                        origem:
                            status.origem,

                        ativo:
                            status.ativo,

                        suspenso:
                            status.suspenso,

                        foraLinha:
                            status.foraLinha,

                        bloqueado:
                            status.bloqueado
                    };

                });

        }



        return res.json(
            itens
        );

    }catch(error){

        console.error(
            'Erro em getListaPreco:',
            error
        );

        return res
            .status(500)
            .json({
                message:
                    error.message ||
                    'Erro interno ao consultar lista de preço.'
            });

    }

}

async function getListaPrecoSemVerificar(req, res) {
    try {
        const { listaId } = req.params;
        const { codigo } = req.query;

        const endpoint = `/v1/ListaPreco/BuscarItemPorId/${listaId}`;

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
    item.push(product.classificacaoFiscal);
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
    getListaPreco,
    getListaPrecoSemVerificar,
    getCatalogoCliente
};