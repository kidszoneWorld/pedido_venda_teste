const ApplicationToken = process.env.APPLICATION_TOKEN;
const CompanyToken = process.env.COMPANY_TOKEN;
const ngLink = process.env.NG_LINK;
const pcrLink = process.env.PCR_LINK;
const usuarioDbCorp = process.env.USUARIO_DBCORP;
const senhaDbCorp = process.env.SENHA_DBCORP;

let authToken = null;
let tokenExpirationTime = null;

async function authenticate() {
    try {
        const response = await fetch(
            `${ngLink}/identidade-service/autenticar`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Origin: 'https://kidszone-ng.dbcorp.com.br'
                },
                body: JSON.stringify({
                    usuario: usuarioDbCorp,
                    senha: senhaDbCorp,
                    origin: 'kidszone-ng'
                })
            }
        );

        const textoResposta = await response.text();

        if (!response.ok) {
            throw new Error(
                `Erro na autenticação. Status ${response.status}. ${textoResposta}`
            );
        }

        const data = textoResposta
            ? JSON.parse(textoResposta)
            : {};

        authToken = data.tokenAcesso;

        if (!authToken) {
            throw new Error(
                'A autenticação não retornou tokenAcesso.'
            );
        }

        tokenExpirationTime = Date.now() + 7200000;

        return authToken;
    } catch (error) {
        authToken = null;
        tokenExpirationTime = null;

        console.error(
            'Erro ao autenticar:',
            error
        );

        throw error;
    }
}

async function checkToken() {
    if (
        !authToken ||
        !tokenExpirationTime ||
        Date.now() >= tokenExpirationTime
    ) {
        await authenticate();
    }
}

function extrairUrlImagem(urlImagem) {
    if (!urlImagem) {
        return '';
    }

    const texto = String(urlImagem).trim();

    if (
        texto.startsWith('http://') ||
        texto.startsWith('https://')
    ) {
        return texto
            .replace(/&quot;/g, '')
            .replace(/",$|",$/g, '')
            .trim();
    }

    const resultado = texto.match(
        /https?:\/\/[^"<\s]+/
    );

    if (!resultado) {
        return '';
    }

    return resultado[0]
        .replace(/&quot;/g, '')
        .replace(/",$|",$/g, '')
        .trim();
}
async function buscarSaldoItem(item) {
    const codigo = obterCodigoItem(item);
    const id = obterIdItem(item);

    if (codigo === null || id === null) {
        console.warn(
            'Item ignorado por falta de código ou ID:',
            item
        );

        return 0;
    }

    const parametros = new URLSearchParams();

    parametros.set(
        'ItemEmpresaId',
        String(codigo)
    );

    parametros.set(
        'ItemEmpresaAuxiliarId',
        String(id)
    );

    parametros.set(
        'EmpresaId',
        '2'
    );

    parametros.set(
        'Depositos',
        '3'
    );

    const url = `${ngLink}/estoque-service/deposito/saldo-item?${parametros.toString()}`;

    for (
        let tentativa = 1;
        tentativa <= 4;
        tentativa += 1
    ) {
        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: 'application/json',
                    Origin: 'https://kidszone-ng.dbcorp.com.br'
                }
            }
        );

        const textoResposta = await response.text();

        if (response.ok) {
            const data = textoResposta
                ? JSON.parse(textoResposta)
                : {};

            const saldo = Number(data.saldo);

            return Number.isFinite(saldo)
                ? saldo
                : 0;
        }

        if (response.status === 404) {
            console.warn(
                `Saldo não encontrado para código ${codigo} e ID ${id}.`
            );

            return 0;
        }

        if (response.status === 429) {
            const retryAfter = Number(
                response.headers.get('retry-after')
            );

            const tempoEspera = Number.isFinite(retryAfter)
                ? retryAfter * 1000
                : tentativa * 2000;

            console.warn(
                `Limite atingido no item ${codigo}. Nova tentativa em ${tempoEspera} ms.`
            );

            await esperar(tempoEspera);
            continue;
        }

        throw new Error(
            `Erro ao buscar saldo do item ${codigo}. Status ${response.status}. ${textoResposta}`
        );
    }

    console.warn(
        `Saldo não obtido após as tentativas para o item ${codigo}.`
    );

    return 0;
}

async function buscarItensPcr() {
    const parametros = new URLSearchParams();

    parametros.set(
        'tamanhoPagina',
        '999'
    );

    parametros.set(
        'paginaAtual',
        '1'
    );

    const response = await fetch(
        `${pcrLink}/v1/Item/Listar?${parametros.toString()}`,
        {
            method: 'GET',
            headers: {
                ApplicationToken,
                CompanyToken,
                Accept: 'application/json'
            }
        }
    );

    const textoResposta = await response.text();

    if (!response.ok) {
        throw new Error(
            `Erro ao buscar itens na PCR. Status ${response.status}. ${textoResposta}`
        );
    }

    const data = textoResposta
        ? JSON.parse(textoResposta)
        : {};

    if (!Array.isArray(data.Result)) {
        throw new Error(
            'A PCR não retornou o campo Result corretamente.'
        );
    }

    return data.Result;
}

function esperar(tempo) {
    return new Promise((resolve) => {
        setTimeout(resolve, tempo);
    });
}

function obterCodigoItem(item) {
    return item?.Codigo ??
        item?.codigo ??
        item?.ItemEmpresaId ??
        item?.itemEmpresaId ??
        null;
}

function obterIdItem(item) {
    return item?.Id ??
        item?.id ??
        item?.ItemEmpresaAuxiliarId ??
        item?.itemEmpresaAuxiliarId ??
        null;
}

async function buscarSaldoItem(item) {
    const codigo = obterCodigoItem(item);
    const id = obterIdItem(item);

    if (codigo === null || id === null) {
        console.warn(
            'Item ignorado por falta de código ou ID:',
            item
        );

        return 0;
    }

    const parametros = new URLSearchParams();

    parametros.set(
        'ItemEmpresaId',
        String(codigo)
    );

    parametros.set(
        'ItemEmpresaAuxiliarId',
        String(id)
    );

    parametros.set(
        'EmpresaId',
        '2'
    );

    parametros.set(
        'Depositos',
        '3'
    );

    const url = `${ngLink}/estoque-service/deposito/saldo-item?${parametros.toString()}`;

    for (
        let tentativa = 1;
        tentativa <= 4;
        tentativa += 1
    ) {
        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: 'application/json',
                    Origin: 'https://kidszone-ng.dbcorp.com.br'
                }
            }
        );

        const textoResposta = await response.text();

        if (response.ok) {
            const data = textoResposta
                ? JSON.parse(textoResposta)
                : {};

            const saldo = Number(data.saldo);

            return Number.isFinite(saldo)
                ? saldo
                : 0;
        }

        if (response.status === 404) {
            console.warn(
                `Saldo não encontrado para código ${codigo} e ID ${id}.`
            );

            return 0;
        }

        if (response.status === 429) {
            const retryAfter = Number(
                response.headers.get('retry-after')
            );

            const tempoEspera = Number.isFinite(retryAfter)
                ? retryAfter * 1000
                : tentativa * 2000;

            console.warn(
                `Limite atingido no item ${codigo}. Nova tentativa em ${tempoEspera} ms.`
            );

            await esperar(tempoEspera);
            continue;
        }

        throw new Error(
            `Erro ao buscar saldo do item ${codigo}. Status ${response.status}. ${textoResposta}`
        );
    }

    console.warn(
        `Saldo não obtido após as tentativas para o item ${codigo}.`
    );

    return 0;
}

async function enriquecerItem(item) {
    const codigo = obterCodigoItem(item);
    const id = obterIdItem(item);
    const saldo = await buscarSaldoItem(item);

    return {
        id,
        codigo: codigo ?? '',
        descricao: item?.Descricao ?? item?.descricao ?? '',
        foto: extrairUrlImagem(
            item?.UrlImagem ?? item?.urlImagem ?? ''
        ),
        qtd: saldo,
        ativo: item?.Ativo ?? item?.ativo ?? false
    };
}

async function enriquecerItensEmGrupos(itens, tamanhoGrupo) {
    const resultado = [];

    for (
        let indice = 0;
        indice < itens.length;
        indice += tamanhoGrupo
    ) {
        const grupo = itens.slice(
            indice,
            indice + tamanhoGrupo
        );

        const itensEnriquecidos = await Promise.all(
            grupo.map((item) => enriquecerItem(item))
        );

        resultado.push(
            ...itensEnriquecidos
        );

        console.log(
            `Saldos processados: ${resultado.length} de ${itens.length}`
        );

        if (indice + tamanhoGrupo < itens.length) {
            await esperar(100);
        }
    }

    console.log(
        'Enriquecimento finalizado.'
    );

    return resultado;
}

async function listarItens() {
    try {
        console.log(
            'Iniciando listagem de itens.'
        );

        await checkToken();

        const itensPcr = await buscarItensPcr();
        console.log(
            'Primeiro item completo da PCR:',
            JSON.stringify(itensPcr[0], null, 2)
        );
        console.log(
            `Itens recebidos da PCR: ${itensPcr.length}`
        );

        const codigosOcultos = new Set([
            'MB101571',
            'MB10533',
            'MB10366',
            'BOB1',
            'CAMISETA',
            'CATALOGO',
            'KITLCD',
            '3528'
        ]);

        const itensValidos = itensPcr.filter((item) => {
            const codigo = String(
                obterCodigoItem(item) || ''
            )
                .trim()
                .toUpperCase();

            const id = obterIdItem(item);

            const estaAtivo =
                item?.Ativo === true;

            const possuiMatriz =
                codigo.includes('MATRIZ');

            const iniciaComDs =
                codigo.startsWith('DS');

            const estaNaListaDeOcultos =
                codigosOcultos.has(codigo);

            return codigo !== '' &&
                id !== null &&
                estaAtivo &&
                !possuiMatriz &&
                !iniciaComDs &&
                !estaNaListaDeOcultos;
        });
        itensValidos.sort((itemA, itemB) => {
            const codigoA = String(
                obterCodigoItem(itemA) || ''
            ).trim();

            const codigoB = String(
                obterCodigoItem(itemB) || ''
            ).trim();

            return codigoA.localeCompare(
                codigoB,
                'pt-BR',
                {
                    numeric: true,
                    sensitivity: 'base'
                }
            );
        });

        const listaItens = await enriquecerItensEmGrupos(
            itensValidos,
            2
        );

        return listaItens;
    } catch (error) {
        console.error(
            'Erro ao listar itens:',
            error
        );
        await esperar(500);
        throw error;
    }
}

module.exports = {
    listarItens
};