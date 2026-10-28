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

function criarEstruturaNotaFiscalPedido(
    notaFiscal
) {
    if (!notaFiscal) {
        return {
            dados: []
        };
    }

    return {
        dados: [
            {
                id:
                    notaFiscal.id ??
                    null,

                codigo:
                    notaFiscal.codigo ??
                    null,

                numero:
                    notaFiscal.numero ??
                    null,

                serie:
                    notaFiscal.serie ??
                    null,

                chaveAcesso:
                    notaFiscal.chaveAcesso ??
                    null,

                dataEmissao:
                    notaFiscal.dataEmissao ??
                    null,

                valorTotal:
                    Number(
                        notaFiscal.valorTotal ||
                        0
                    ),

                valorTotalProdutos:
                    Number(
                        notaFiscal
                            .valorTotalProdutos ||
                        0
                    ),

                quantidadeVolumes:
                    Number(
                        notaFiscal
                            .quantidadeVolumes ||
                        0
                    ),

                status:
                    notaFiscal.status ??
                    '',

                statusEntrega:
                    notaFiscal.statusEntrega ??
                    ''
            }
        ],

        /*
         * Mantém o objeto completo disponível,
         * caso outras telas precisem dos itens.
         */
        notaFiscal:
            notaFiscal
    };
}

function removerPedidosDuplicados(
    pedidos
) {
    const pedidosPorCodigo =
        new Map();

    pedidos.forEach(
        pedido => {
            const codigo =
                String(
                    pedido?.codigo ??
                    pedido?.PedidoCodigo ??
                    pedido?.pedidoDeVendaCodigo ??
                    ''
                ).trim();

            if (!codigo) {
                console.warn(
                    'Pedido ignorado por não possuir código:',
                    pedido
                );

                return;
            }

            if (
                !pedidosPorCodigo.has(
                    codigo
                )
            ) {
                pedidosPorCodigo.set(
                    codigo,
                    pedido
                );
            }
        }
    );

    return Array.from(
        pedidosPorCodigo.values()
    );
}

async function buscarNotaFiscalPorNumero(
    numeroNota
) {
    await checkToken();

    if (!authToken) {
        throw new Error(
            'Token de autenticação não foi obtido.'
        );
    }

    const numeroNormalizado =
        normalizarNumeroNota(
            numeroNota
        );

    if (!numeroNormalizado) {
        return null;
    }

    const endpoint =
        '/documentos-fiscais-service/' +
        'nota-fiscal/' +
        encodeURIComponent(
            numeroNormalizado
        );
    const url =
        `${NgLink}${endpoint}`;

    console.log(
        'Consultando nota fiscal diretamente:',
        url
    );

    const response =
        await executarFetchComRetentativa(
            url,
            criarOpcoesGet()
        );

    if (response.status === 404) {
        return null;
    }

    const textoResposta =
        await response.text();

    let resultado =
        null;

    if (textoResposta) {
        try {
            resultado =
                JSON.parse(
                    textoResposta
                );
        } catch {
            throw new Error(
                'A API de nota fiscal retornou ' +
                'uma resposta inválida.'
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            resultado?.mensagem ||
            resultado?.message ||
            textoResposta ||
            `Erro HTTP ${response.status} ao buscar a nota fiscal.`
        );
    }

    /*
     * A resposta informada é um objeto direto.
     * Mas o código também aceita { dados: objeto }
     * ou { dados: [objeto] } para maior segurança.
     */
    if (
        Array.isArray(
            resultado?.dados
        )
    ) {
        return resultado.dados[0] ||
            null;
    }

    if (
        resultado?.dados &&
        typeof resultado.dados ===
            'object'
    ) {
        return resultado.dados;
    }

    if (
        resultado &&
        typeof resultado ===
            'object'
    ) {
        return resultado;
    }

    return null;
}

async function fetchNotaFiscalPedidoComXml(
    codigoPedido,
    numeroNota
) {
    await checkToken();

    if (!authToken) {
        throw new Error(
            'Token de autenticação não foi obtido.'
        );
    }

    const codigoPedidoNormalizado =
        normalizarNumeroNota(
            codigoPedido
        );

    const numeroNotaNormalizado =
        normalizarNumeroNota(
            numeroNota
        );

    if (!codigoPedidoNormalizado) {
        throw new Error(
            'Código do pedido não informado.'
        );
    }

    if (!numeroNotaNormalizado) {
        throw new Error(
            'Número da nota fiscal não informado.'
        );
    }

    const parametros =
        new URLSearchParams();

    parametros.set(
        'Status',
        '4'
    );

    parametros.set(
        'PedidoDeVendaCodigo',
        codigoPedidoNormalizado
    );

    const endpoint =
        '/documentos-fiscais-service/nota-fiscal?' +
        parametros.toString();

    const url =
        `${NgLink}${endpoint}`;

    console.log(
        'Consultando XML pela relação pedido/nota:',
        {
            codigoPedido:
                codigoPedidoNormalizado,

            numeroNota:
                numeroNotaNormalizado,

            url:
                url
        }
    );

    const response =
        await executarFetchComRetentativa(
            url,
            criarOpcoesGet()
        );

    if (response.status === 404) {
        return null;
    }

    const textoResposta =
        await response.text();

    let resultado =
        null;

    if (textoResposta) {
        try {
            resultado =
                JSON.parse(
                    textoResposta
                );
        } catch {
            throw new Error(
                'A API de notas fiscais retornou uma resposta inválida.'
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            resultado?.mensagem ||
            resultado?.message ||
            textoResposta ||
            `Erro HTTP ${response.status} ao consultar a nota fiscal.`
        );
    }

    const notas =
        Array.isArray(
            resultado?.dados
        )
            ? resultado.dados
            : [];

    /*
     * Procura explicitamente pelo campo numero.
     *
     * Para o exemplo:
     * pedido = 2600
     * nota.numero = 2499
     */
    const notaEncontrada =
        notas.find(
            nota => {
                const numeroAtual =
                    normalizarNumeroNota(
                        nota?.numero
                    );

                return (
                    numeroAtual ===
                    numeroNotaNormalizado
                );
            }
        ) ||
        null;

    if (!notaEncontrada) {
        console.warn(
            'A nota não foi encontrada entre os documentos do pedido:',
            {
                codigoPedido:
                    codigoPedidoNormalizado,

                numeroProcurado:
                    numeroNotaNormalizado,

                numerosRetornados:
                    notas.map(
                        nota => nota?.numero
                    )
            }
        );

        return null;
    }

    console.log(
        'Nota correta selecionada para download:',
        {
            codigoPedido:
                codigoPedidoNormalizado,

            numeroNota:
                notaEncontrada.numero,

            codigoInterno:
                notaEncontrada.codigo,

            chaveAcesso:
                notaEncontrada.chaveAcesso,

            possuiXml:
                Boolean(
                    notaEncontrada.xml
                )
        }
    );

    return notaEncontrada;
}

async function fetchNotaFiscalComXml(
    numeroNota
) {
    const numeroNormalizado =
        normalizarNumeroNota(
            numeroNota
        );

    if (!numeroNormalizado) {
        throw new Error(
            'Número da nota fiscal não informado.'
        );
    }

    const notaFiscal =
        await buscarNotaFiscalPorNumero(
            numeroNormalizado
        );

    if (!notaFiscal) {
        return null;
    }

    return notaFiscal;
}

function extrairCodigosPedidosNota(
    notaFiscal
) {
    const itens =
        Array.isArray(
            notaFiscal?.itens
        )
            ? notaFiscal.itens
            : [];

    const codigosUnicos =
        new Set();

    itens.forEach(
        (
            item,
            indice
        ) => {
            const codigo =
                Number(
                    item
                        ?.pedidoDeVendaCodigo
                );

            if (
                Number.isInteger(
                    codigo
                ) &&
                codigo > 0
            ) {
                codigosUnicos.add(
                    codigo
                );

                return;
            }

            console.warn(
                `O item ${indice + 1} da nota não possui ` +
                'pedidoDeVendaCodigo válido.',
                item?.pedidoDeVendaCodigo
            );
        }
    );

    return Array.from(
        codigosUnicos
    );
}

async function buscarRepresentanteDoPedido(
    pedido
) {
    const codigoCliente =
        pedido?.cliente?.codigo;

    if (!codigoCliente) {
        return null;
    }

    const endpoint =
        '/pessoa-service/representante?' +
        'ClienteCodigo=' +
        encodeURIComponent(
            codigoCliente
        );

    try {
        const response =
            await executarFetchComRetentativa(
                `${NgLink}${endpoint}`,
                criarOpcoesGet()
            );

        if (!response.ok) {
            console.warn(
                `Não foi possível consultar o representante ` +
                `do pedido ${pedido.codigo}. ` +
                `HTTP ${response.status}.`
            );

            return null;
        }

        const resultado =
            await response.json();

        return (
            resultado?.dados?.[0] ??
            null
        );
    } catch (error) {
        console.error(
            `Erro ao buscar representante do pedido ${pedido.codigo}:`,
            error
        );

        return null;
    }
}

async function buscarNotasFiscaisDoPedido(
    codigoPedido
) {
    const codigoNormalizado =
        normalizarNumeroNota(
            codigoPedido
        );

    if (!codigoNormalizado) {
        return {
            dados: []
        };
    }

    const parametros =
        new URLSearchParams();

    parametros.set(
        'Status',
        '4'
    );

    parametros.set(
        'PedidoDeVendaCodigo',
        codigoNormalizado
    );

    const endpoint =
        '/documentos-fiscais-service/nota-fiscal?' +
        parametros.toString();

    try {
        const response =
            await executarFetchComRetentativa(
                `${NgLink}${endpoint}`,
                criarOpcoesGet()
            );

        if (response.status === 404) {
            return {
                dados: []
            };
        }

        if (!response.ok) {
            console.warn(
                `Não foi possível consultar as notas do pedido ` +
                `${codigoNormalizado}. HTTP ${response.status}.`
            );

            return {
                dados: []
            };
        }

        const resultado =
            await response.json();

        return normalizarRespostaNotasFiscais(
            resultado
        );
    } catch (error) {
        console.error(
            `Erro ao consultar as notas do pedido ${codigoNormalizado}:`,
            error
        );

        return {
            dados: []
        };
    }
}

async function fetchOrdersByInvoice(
    numeroNota,
    dataInicioUsuario = null,
    dataFimUsuario = null,
    statusInformado = 6,
    statusSeparacaoInformado = null,
    codigoRepresentante = '',
    codigoCliente = null
) {
    await checkToken();

    if (!authToken) {
        throw new Error(
            'Token de autenticação não foi obtido.'
        );
    }

    const numeroNotaNormalizado =
        normalizarNumeroNota(
            numeroNota
        );

    if (!numeroNotaNormalizado) {
        return [];
    }

    const periodo =
        obterPeriodoConsulta(
            dataInicioUsuario,
            dataFimUsuario
        );

    let statusConsulta =
        Number(
            statusInformado
        );

    if (
        !Number.isFinite(
            statusConsulta
        )
    ) {
        statusConsulta =
            6;
    }

    // Uma nota fiscal pertence a um pedido faturado.
    // Se o filtro estiver como pendente, pesquisamos faturado.
    if (statusConsulta === 6) {
        statusConsulta =
            5;
    }

    let statusSeparacaoConsulta =
        obterStatusSeparacaoParaBuscaNota(
            statusConsulta
        );

    if (
        statusSeparacaoConsulta === null &&
        statusSeparacaoInformado !== null &&
        statusSeparacaoInformado !== undefined &&
        statusSeparacaoInformado !== ''
    ) {
        statusSeparacaoConsulta =
            Number(
                statusSeparacaoInformado
            );
    }

    const representanteFiltro =
        String(
            codigoRepresentante ?? ''
        ).trim();

    const pageSize =
        30;

    let paginaAtual =
        1;

    let totalPaginas =
        1;

    console.log(
        'Iniciando busca paginada pelo número da nota:',
        {
            numeroNota:
                numeroNotaNormalizado,

            dataInicio:
                periodo.dataInicio,

            dataFim:
                periodo.dataFim,

            status:
                statusConsulta,

            statusSeparacao:
                statusSeparacaoConsulta,

            representante:
                representanteFiltro ||
                'todos'
        }
    );

    while (
        paginaAtual <= totalPaginas
    ) {
        const parametros =
            new URLSearchParams();

        parametros.set(
            'EmpresaCodigo',
            '2'
        );

        parametros.set(
            'DataPedidoInicio',
            periodo.dataInicio
        );

        parametros.set(
            'DataPedidoFim',
            periodo.dataFim
        );

        parametros.set(
            'Status',
            String(
                statusConsulta
            )
        );

        if (
            statusSeparacaoConsulta !== null &&
            Number.isFinite(
                statusSeparacaoConsulta
            )
        ) {
            parametros.set(
                'StatusSeparacao',
                String(
                    statusSeparacaoConsulta
                )
            );
        }

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

        const endpoint =
            '/vendas-service/pedido?' +
            parametros.toString();

        console.log(
            `Buscando página ${paginaAtual} de ${totalPaginas}:`,
            `${NgLink}${endpoint}`
        );

        const response =
            await executarFetchComRetentativa(
                `${NgLink}${endpoint}`,
                criarOpcoesGet()
            );

        if (response.status === 404) {
            return [];
        }

        if (!response.ok) {
            const textoErro =
                await response.text();

            throw new Error(
                textoErro ||
                `Erro HTTP ${response.status} ao buscar os pedidos.`
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

        const paginasResposta =
            Number(
                resultado?.paginas
            );

        totalPaginas =
            Number.isInteger(
                paginasResposta
            ) &&
            paginasResposta > 0
                ? paginasResposta
                : 1;

        console.log(
            `Página ${paginaAtual} carregada:`,
            {
                pedidos:
                    pedidosPagina.length,

                totalPaginas:
                    totalPaginas,

                totalRegistros:
                    resultado?.totalRegistros ??
                    null
            }
        );

        for (
            const pedido of
            pedidosPagina
        ) {
            const representante =
                await buscarRepresentanteDoPedido(
                    pedido
                );

            const codigoRepresentantePedido =
                String(
                    representante?.codigo ??
                    ''
                ).trim();

            if (
                representanteFiltro &&
                codigoRepresentantePedido !==
                    representanteFiltro
            ) {
                console.log(
                    `Pedido ${pedido.codigo} ignorado pelo representante.`,
                    {
                        representantePedido:
                            codigoRepresentantePedido,

                        representanteFiltro:
                            representanteFiltro
                    }
                );

                continue;
            }

            const notasFiscais =
                await buscarNotasFiscaisDoPedido(
                    pedido.codigo
                );

            const notas =
                Array.isArray(
                    notasFiscais?.dados
                )
                    ? notasFiscais.dados
                    : [];

            const notaEncontrada =
                notas.find(
                    nota => {
                        const numeroAtual =
                            normalizarNumeroNota(
                                nota?.numero
                            );

                        return (
                            numeroAtual ===
                            numeroNotaNormalizado
                        );
                    }
                );

            if (!notaEncontrada) {
                await aguardar(
                    100
                );

                continue;
            }

            console.log(
                'Pedido encontrado pelo número da nota:',
                {
                    pedido:
                        pedido.codigo,

                    numeroNota:
                        notaEncontrada.numero,

                    chaveAcesso:
                        notaEncontrada.chaveAcesso,

                    pagina:
                        paginaAtual
                }
            );

            // Somente o pedido encontrado recebe as consultas
            // adicionais de detalhes e transportadora.
            const pedidoEnriquecido =
                await enriquecerPedidoEncontrado(
                    pedido
                );

            return [
                {
                    ...pedidoEnriquecido,

                    representante:
                        representante,

                    notas_fiscais:
                        notasFiscais
                }
            ];
        }

        paginaAtual +=
            1;
    }

    console.warn(
        'Nenhum pedido foi encontrado para a nota informada:',
        {
            numeroNota:
                numeroNotaNormalizado,

            paginasConsultadas:
                totalPaginas,

            dataInicio:
                periodo.dataInicio,

            dataFim:
                periodo.dataFim,

            status:
                statusConsulta,

            statusSeparacao:
                statusSeparacaoConsulta
        }
    );

    return [];
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
async function fetchOrderDetails(
    status = 6,
    userDataInicio = null,
    userDataFim = null,
    userStatusSeparacao = null,
    usercodCliente = null
) {
    await checkToken();

    if (!authToken) {
        console.error(
            'Erro: Token não obtido.'
        );

        return [];
    }

    const {
        dataInicio,
        dataFim
    } =
        obterPeriodoConsulta(
            userDataInicio,
            userDataFim
        );

    console.log(
        `Buscando pedidos com status: ${status}, ` +
        `DataPedidoInicio: ${dataInicio}, ` +
        `DataPedidoFim: ${dataFim}, ` +
        `StatusSeparacao: ${
            userStatusSeparacao !== null
                ? userStatusSeparacao
                : 'todos'
        }`
    );

    const pageSize = 30;
    const maxRecords = 450;

    let currentPage = 1;
    let allOrders = [];
    let hasMoreData = true;

    const representativeEndpoint =
        '/pessoa-service/representante?ClienteCodigo=';

    const orderDetailsEndpoint =
        '/vendas-service/pedido/';

    const transportEndpoint =
        '/pessoa-service/transportadora/codigo/';

    const invoiceEndpoint =
        '/documentos-fiscais-service/nota-fiscal?' +
        'Status=4&PedidoDeVendaCodigo=';

    while (
        hasMoreData &&
        allOrders.length < maxRecords
    ) {
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

    console.log(
        `Total de pedidos recuperados e enriquecidos: ${allOrders.length}`
    );

    return allOrders;
}

function obterStatusSeparacaoParaBuscaNota(
    status
) {
    const statusNumerico =
        Number(
            status
        );

    if (statusNumerico === 5) {
        return 2;
    }

    if (
        statusNumerico === 4 ||
        statusNumerico === 1
    ) {
        return 1;
    }

    if (statusNumerico === 3) {
        return 0;
    }

    return null;
}

async function fetchOrdersByInvoiceGrouped(
    numeroNota,
    dataInicio,
    dataFim,
    status,
    statusSeparacao,
    codigoRepresentante,
    codigoCliente
) {
    const statusNumerico =
        Number(
            status
        );

    if (statusNumerico !== 4) {
        return fetchOrdersByInvoice(
            numeroNota,
            dataInicio,
            dataFim,
            statusNumerico,
            statusSeparacao,
            codigoRepresentante,
            codigoCliente
        );
    }

    const pedidoStatus4 =
        await fetchOrdersByInvoice(
            numeroNota,
            dataInicio,
            dataFim,
            4,
            1,
            codigoRepresentante,
            codigoCliente
        );

    if (
        Array.isArray(
            pedidoStatus4
        ) &&
        pedidoStatus4.length > 0
    ) {
        return pedidoStatus4.map(
            pedido => {
                return {
                    ...pedido,

                    statusOriginal:
                        pedido.status,

                    status:
                        4
                };
            }
        );
    }

    const pedidoStatus1 =
        await fetchOrdersByInvoice(
            numeroNota,
            dataInicio,
            dataFim,
            1,
            1,
            codigoRepresentante,
            codigoCliente
        );

    return pedidoStatus1.map(
        pedido => {
            return {
                ...pedido,

                statusOriginal:
                    pedido.status,

                status:
                    4
            };
        }
    );
}

function normalizarRespostaNotasFiscais(
    respostaNotas
) {
    const notas =
        Array.isArray(
            respostaNotas?.dados
        )
            ? respostaNotas.dados
            : [];

    const notasUnicas =
        new Map();

    notas.forEach(
        nota => {
            const numero =
                normalizarNumeroNota(
                    nota?.numero
                );

            const chaveAcesso =
                String(
                    nota?.chaveAcesso ??
                    ''
                ).trim();

            if (!numero) {
                return;
            }

            /*
             * O número é o identificador usado no sistema
             * para pesquisar, exibir e baixar o XML.
             *
             * A chave de acesso ajuda a diferenciar documentos
             * em um eventual caso de números repetidos.
             */
            const chaveUnica =
                chaveAcesso ||
                numero;

            if (
                !notasUnicas.has(
                    chaveUnica
                )
            ) {
                notasUnicas.set(
                    chaveUnica,
                    {
                        ...nota,

                        /*
                         * Propriedade explícita para evitar
                         * confusão com nota.codigo.
                         */
                        numeroDownload:
                            numero
                    }
                );
            }
        }
    );

    const dados =
        Array.from(
            notasUnicas.values()
        );

    return {
        ...respostaNotas,

        dados:
            dados,

        totalRegistros:
            dados.length
    };
}

async function fetchOrdersByCode(
    codigoPedido,
    codigoCliente = null,
    buscarNotasFiscais = true
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

    if (response.status === 404) {
        return [];
    }

    const textoResposta =
        await response.text();

    let resultado =
        null;

    if (textoResposta) {
        try {
            resultado =
                JSON.parse(
                    textoResposta
                );
        } catch {
            throw new Error(
                `A consulta do pedido ${codigo} retornou uma resposta inválida.`
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            resultado?.mensagem ||
            resultado?.message ||
            textoResposta ||
            `Erro HTTP ${response.status} ao buscar o pedido ${codigo}.`
        );
    }

    const pedidosRecebidos =
        Array.isArray(
            resultado?.dados
        )
            ? resultado.dados
            : Array.isArray(
                resultado
            )
                ? resultado
                : [];

    /*
     * A API pode retornar mais de um registro.
     * Mantemos somente os que correspondem ao código solicitado.
     */
    const pedidosDoCodigo =
        pedidosRecebidos.filter(
            pedido => {
                return (
                    String(
                        pedido?.codigo ??
                        ''
                    ).trim() === codigo
                );
            }
        );

    if (pedidosDoCodigo.length === 0) {
        console.warn(
            `O endpoint respondeu, mas não retornou o pedido ${codigo}.`
        );

        return [];
    }

    const pedidosEnriquecidos =
        [];

    /*
     * Não usar somente pedidosDoCodigo[0].
     * Se a API devolver duas ocorrências válidas,
     * as duas serão processadas.
     */
    for (
        const pedido of
        pedidosDoCodigo
    ) {
        const pedidoEnriquecido =
            await enriquecerPedidoEncontrado(
                pedido
            );
            let notasFiscais = {
                dados: []
            };

            if (buscarNotasFiscais) {
                try {
                    const parametrosNota =
                        new URLSearchParams();

                    parametrosNota.set(
                        'Status',
                        '4'
                    );

                    parametrosNota.set(
                        'PedidoDeVendaCodigo',
                        String(
                            pedido.codigo
                        )
                    );

                    const endpointNota =
                        '/documentos-fiscais-service/nota-fiscal?' +
                        parametrosNota.toString();

                    console.log(
                        'Consultando notas do pedido:',
                        `${NgLink}${endpointNota}`
                    );

                    const respostaNota =
                        await executarFetchComRetentativa(
                            `${NgLink}${endpointNota}`,
                            criarOpcoesGet()
                        );

                    if (respostaNota.status === 404) {
                        notasFiscais = {
                            dados: []
                        };
                    } else if (!respostaNota.ok) {
                        const textoErro =
                            await respostaNota.text();

                        console.warn(
                            `Não foi possível consultar as notas do pedido ` +
                            `${pedido.codigo}. HTTP ${respostaNota.status}.`,
                            textoErro
                        );

                        notasFiscais = {
                            dados: []
                        };
                    } else {
                        const respostaNotas =
                            await respostaNota.json();

                        notasFiscais =
                            normalizarRespostaNotasFiscais(
                                respostaNotas
                            );

                        console.log(
                            `Notas do pedido ${pedido.codigo}:`,
                            {
                                recebidas:
                                    Array.isArray(
                                        respostaNotas?.dados
                                    )
                                        ? respostaNotas.dados.length
                                        : 0,

                                unicas:
                                    notasFiscais.dados.length,

                                numeros:
                                    notasFiscais.dados.map(
                                        nota => nota.numero
                                    )
                            }
                        );
                    }
                } catch (error) {
                    console.error(
                        `Erro ao buscar notas do pedido ${pedido.codigo}:`,
                        error
                    );

                    notasFiscais = {
                        dados: []
                    };
                }
            }

        pedidosEnriquecidos.push({
            ...pedidoEnriquecido,

            notas_fiscais:
                notasFiscais
        });

        await aguardar(
            100
        );
    }

    return pedidosEnriquecidos;
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

async function downloadPdfNotaFiscalPorChave(
    chaveAcesso
) {
    await checkToken();

    if (!authToken) {
        throw new Error(
            'Token de autenticação não foi obtido.'
        );
    }

    const chaveNormalizada =
        String(
            chaveAcesso ?? ''
        )
            .replace(
                /\D/g,
                ''
            );

    if (
        chaveNormalizada.length !== 44
    ) {
        throw new Error(
            'A chave de acesso da nota fiscal é inválida.'
        );
    }

    const endpoint =
        '/documentos-fiscais-service/' +
        'nota-fiscal/chave-de-acesso/' +
        encodeURIComponent(
            chaveNormalizada
        ) +
        '/pdf';

    const url =
        `${NgLink}${endpoint}`;

    console.log(
        'Solicitando PDF da nota fiscal:',
        {
            chaveAcesso:
                chaveNormalizada,

            url:
                url
        }
    );

    const response =
        await executarFetchComRetentativa(
            url,
            {
                method:
                    'POST',

                headers: {
                    Authorization:
                        `Bearer ${authToken}`,

                    Accept:
                        'application/json',

                    'Content-Type':
                        'application/json',

                    Origin:
                        'https://kidszone-ng.dbcorp.com.br'
                },

                /*
                 * Como a chave está na URL e não foi informado
                 * nenhum corpo obrigatório, não enviamos body.
                 */
            }
        );

    const textoResposta =
        await response.text();

    let resultado =
        null;

    if (textoResposta) {
        try {
            resultado =
                JSON.parse(
                    textoResposta
                );
        } catch {
            throw new Error(
                'A API retornou uma resposta inválida ao gerar o PDF.'
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            resultado?.mensagem ||
            resultado?.message ||
            textoResposta ||
            `Erro HTTP ${response.status} ao gerar o PDF da nota fiscal.`
        );
    }

    const bytesBase64 =
        String(
            resultado?.bytes ??
            ''
        ).trim();

    if (!bytesBase64) {
        throw new Error(
            'A API não retornou o conteúdo do PDF.'
        );
    }

    const nomeArquivo =
        String(
            resultado?.fileName ??
            `${chaveNormalizada}.pdf`
        )
            .replace(
                /[^A-Za-z0-9._-]/g,
                '_'
            );

    const contentType =
        String(
            resultado?.contentType ??
            'application/pdf'
        ).trim();

    return {
        fileName:
            nomeArquivo,

        contentType:
            contentType,

        bytes:
            bytesBase64,

        chaveAcesso:
            chaveNormalizada
    };
}

// Exportar as funções
module.exports = {
    authenticate,
    checkToken,
    fetchOrderDetails,
    fetchOrderDetailsEndpoint,
    fetchOrdersByInvoice,
    fetchOrdersByCode,
    fetchNotaFiscalComXml,
    fetchNotaFiscalPedidoComXml,
    downloadPdfNotaFiscalPorChave,
    fetchOrdersByInvoiceGrouped
};
