const timestamp = Date.now();
// ======================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ======================================================================
let clientesData;
let promocaoData;
let foraDeLinhaData;
let icmsSTData;
let listaPrecosIpiData;
let catalogoClienteData =
    [];

let catalogoClientePorCodigo =
    new Map();

let catalogoClienteCarregado =
    false;

let catalogoClienteCarregando =
    false;

let dadosListaPrecoAtual =
    null;
let step = 0;
let tutorialAtivo = false;

const estadosCamposTutorial =
    new Map();
    
// Helper DOM
const el = id => document.getElementById(id);

// ======================================================================
// 📦 CACHE / FETCH DE DADOS INICIAIS
// ======================================================================

fetch(`/data/Lista-precos.json?cacheBust=${timestamp}`)
  .then(r => r.json())
  .then(d => listaPrecosIpiData = d);

fetch(`/data/cliente.json?cacheBust=${timestamp}`)
  .then(r => r.json())
  .then(d => clientesData = d);

fetch(`/data/Promocao.json?cacheBust=${timestamp}`)
  .then(r => r.json())
  .then(d => promocaoData = d);

fetch(`/data/Fora de linha.json?cacheBust=${timestamp}`)
  .then(r => r.json())
  .then(d => foraDeLinhaData = d);

fetch(`/data/ICMS-ST.json?cacheBust=${timestamp}`)
  .then(r => r.json())
  .then(d => icmsSTData = d);

function normalizarCodigoItem(
    valor
) {
    return String(
        valor || ''
    )
        .trim()
        .toUpperCase();
}

function converterParaBooleano(
    valor
) {
    if (
        valor === true ||
        valor === 1
    ) {
        return true;
    }

    if (
        valor === false ||
        valor === 0
    ) {
        return false;
    }

    const texto =
        String(
            valor ?? ''
        )
            .trim()
            .toLowerCase();

    return (
        texto === 'true' ||
        texto === '1' ||
        texto === 'sim' ||
        texto === 's' ||
        texto === 'ativo'
    );
}

function normalizarTextoPesquisa(
    valor
) {
    return String(
        valor || ''
    )
        .normalize(
            'NFD'
        )
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .trim()
        .toUpperCase();
}

function itemPodeAparecerNaLista(
    item
) {
    if (!item) {
        return false;
    }

    const ativo =
        item.ativo === undefined ||
        item.ativo === null
            ? true
            : converterParaBooleano(
                item.ativo
            );

    const suspenso =
        converterParaBooleano(
            item.suspenso
        );

    const foraLinha =
        converterParaBooleano(
            item.foraLinha
        );

    const bloqueado =
        converterParaBooleano(
            item.bloqueado
        );

    const exibeConsultas =
        item.exibeConsultasListaPreco ===
            undefined ||
        item.exibeConsultasListaPreco ===
            null
            ? true
            : converterParaBooleano(
                item.exibeConsultasListaPreco
            );

    const descricao =
        normalizarTextoPesquisa(
            item.descricao
        );

    const descricoesBloqueadas = [
        'DISPLAY',
        'BOBINA',
        'CATALOGO',
        'CAMISETA',
        'SCOOTER',
        'SACOLA',
        'PATINETE',
        'LCD',
        'BICICLETA'
    ];

    const descricaoBloqueada =
        descricoesBloqueadas.some(
            texto => {
                return descricao.includes(
                    texto
                );
            }
        );

    return (
        // ativo &&
        // !suspenso &&
        // !foraLinha &&
        // !bloqueado &&
        // exibeConsultas &&
        !descricaoBloqueada
    );
}

async function carregarCatalogoCliente(
    clienteCodigo,
    listaCodigo = null
) {
    const codigoCliente =
        String(
            clienteCodigo || ''
        ).trim();

    if (!codigoCliente) {
        throw new Error(
            'Código do cliente não disponível para carregar o catálogo.'
        );
    }

    catalogoClienteCarregado =
        false;

    catalogoClienteCarregando =
        true;

    catalogoClienteData =
        [];

    catalogoClientePorCodigo =
        new Map();

    dadosListaPrecoAtual =
        null;

    showFeedback(
        'Carregando lista de produtos do cliente...'
    );

    try {
        const parametros =
            new URLSearchParams();

        if (
            listaCodigo !== null &&
            listaCodigo !== undefined &&
            listaCodigo !== ''
        ) {
            parametros.set(
                'listaCodigo',
                String(
                    listaCodigo
                )
            );
        }

        const queryString =
            parametros.toString();

        const url =
            `/api/catalogo-cliente/${encodeURIComponent(codigoCliente)}` +
            (
                queryString
                    ? `?${queryString}`
                    : ''
            );

        console.log(
            'Consultando catálogo da rebaixa:',
            url
        );

        const response =
            await fetch(
                url,
                {
                    method:
                        'GET',

                    headers: {
                        Accept:
                            'application/json'
                    }
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
                    'O catálogo retornou uma resposta inválida.'
                );
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.mensagem ||
                resultado?.message ||
                textoResposta ||
                `Erro HTTP ${response.status}`
            );
        }

        const itensRecebidos =
            Array.isArray(
                resultado?.itens
            )
                ? resultado.itens
                : [];

        const itensDisponiveis =
            itensRecebidos.filter(
                itemPodeAparecerNaLista
            );

        catalogoClienteData =
            itensDisponiveis;

        dadosListaPrecoAtual =
            resultado?.listaPreco ||
            null;

        catalogoClientePorCodigo =
            new Map();

        itensDisponiveis.forEach(
            item => {
                const codigo =
                    normalizarCodigoItem(
                        item.itemEmpresaId
                    );

                if (!codigo) {
                    return;
                }

                catalogoClientePorCodigo.set(
                    codigo,
                    item
                );
            }
        );

        catalogoClienteCarregado =
            true;

        if (dadosListaPrecoAtual) {
            const campoCodigoLista =
                document.getElementById(
                    'codgroup'
                );

            const campoNomeLista =
                document.getElementById(
                    'group'
                );

            if (campoCodigoLista) {
                campoCodigoLista.value =
                    dadosListaPrecoAtual.codigo ||
                    '';
            }

            if (campoNomeLista) {
                campoNomeLista.value =
                    dadosListaPrecoAtual.descricao ||
                    '';
            }
        }

        criarDatalistCatalogoRebaixa();

        console.log(
            'Catálogo da rebaixa carregado:',
            {
                clienteCodigo:
                    codigoCliente,

                listaPreco:
                    dadosListaPrecoAtual,

                totalRecebido:
                    itensRecebidos.length,

                totalDisponivel:
                    itensDisponiveis.length,

                totalIndexado:
                    catalogoClientePorCodigo.size,

                erros:
                    resultado?.erros || []
            }
        );

        return resultado;
    } catch (error) {
        catalogoClienteData =
            [];

        catalogoClientePorCodigo =
            new Map();

        catalogoClienteCarregado =
            false;

        console.error(
            'Erro ao carregar catálogo da rebaixa:',
            error
        );

        throw error;
    } finally {
        catalogoClienteCarregando =
            false;

        hideFeedback();
    }
}

function criarDatalistCatalogoRebaixa() {
    let datalist =
        document.getElementById(
            'lista-produtos-rebaixa'
        );

    if (!datalist) {
        datalist =
            document.createElement(
                'datalist'
            );

        datalist.id =
            'lista-produtos-rebaixa';

        document.body.appendChild(
            datalist
        );
    }

    datalist.innerHTML =
        '';

    catalogoClienteData.forEach(
        item => {
            const codigo =
                String(
                    item.itemEmpresaId ||
                    ''
                ).trim();

            const descricao =
                String(
                    item.descricao ||
                    ''
                ).trim();

            if (
                !codigo ||
                !descricao
            ) {
                return;
            }

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                `${codigo} - ${descricao}`;

            datalist.appendChild(
                option
            );
        }
    );
}

function buscarItemNoCatalogo(
    codigoDigitado
) {
    const codigo =
        normalizarCodigoItem(
            codigoDigitado
        );

    if (!codigo) {
        return null;
    }

    return (
        catalogoClientePorCodigo.get(
            codigo
        ) ||
        null
    );
}

function buscarItemPorPesquisa(
    valorDigitado
) {
    const texto =
        String(
            valorDigitado || ''
        ).trim();

    if (!texto) {
        return null;
    }

    const separador =
        texto.indexOf(
            ' - '
        );

    if (separador >= 0) {
        const codigoExtraido =
            normalizarCodigoItem(
                texto.substring(
                    0,
                    separador
                )
            );

        const itemPorCodigo =
            buscarItemNoCatalogo(
                codigoExtraido
            );

        if (itemPorCodigo) {
            return itemPorCodigo;
        }
    }

    const itemPorCodigo =
        buscarItemNoCatalogo(
            texto
        );

    if (itemPorCodigo) {
        return itemPorCodigo;
    }

    const pesquisa =
        normalizarTextoPesquisa(
            texto
        );

    const correspondencias =
        catalogoClienteData.filter(
            item => {
                const descricao =
                    normalizarTextoPesquisa(
                        item.descricao
                    );

                return (
                    descricao ===
                    pesquisa
                );
            }
        );

    return correspondencias.length === 1
        ? correspondencias[0]
        : null;
}

console.log('script.js carregado');

//run once

//  limparCamposCliente();
//  atualizarTotais();
// alert('Olá Sr(a).Representante,\nSomente serão aceitas devoluções com até 180 dias, a partir entrega da nota fiscal de origem!!!')
// ======================================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ======================================================================
const formatarCNPJ = cnpj =>
    cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

const formatarCEP = cep =>
    cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");

function ajustarCNPJ(cnpj) {
    while (cnpj.length < 14) cnpj = '0' + cnpj;
    return cnpj;
}

const cnpjInvalido = cnpj => /^0+$/.test(cnpj);

// ======================================================================
// 🔍 BUSCAS EM CACHE
// ======================================================================
function buscarCliente(cnpj) {
    if (!Array.isArray(clientesData)) return null;

    cnpj = ajustarCNPJ(cnpj);
    for (let i = 1; i < clientesData.length; i++) {
        if (ajustarCNPJ(clientesData[i][1].toString()) === cnpj) {
            return clientesData[i];
        }
    }
    return null;
}



// ======================================================================
// 👤 CLIENTE / CNPJ
// ======================================================================
function limparCamposCliente() {
    [
        'razao_social','representante','endereco','bairro','cidade','uf',
        'cep','telefone','email','email_fiscal','cod_cliente','pay','group',
        'transp','codgroup','email_rep','observation'
    ].forEach(id => el(id).value = '');
}
const emailRep = document.getElementById('email_rep');
// Feedback
const showFeedback = msg => { el('feedback1').style.display = 'block'; el('feedback1').textContent = msg; };
const hideFeedback = () => { el('feedback1').style.display = 'none'; el('feedback1').textContent = ''; };

// Modal bloqueio CNPJ
const cnpjInput1 = el('cnpj');
const codInput1 = el('cod_cliente');
const blockModal = el('blockModal');

cnpjInput1.addEventListener(
    'focus',
    () => {
        if (!cnpjInput1.readOnly) {
            return;
        }

        if (blockModal) {
            blockModal.style.display =
                'block';
        }

        const campoTimestamp =
            el(
                'timestamp'
            );

        if (campoTimestamp) {
            campoTimestamp.textContent =
                new Date()
                    .toLocaleString(
                        'pt-BR'
                    );
        }
    }
);

// ======================================================================
// 🔄 BLUR CNPJ → API CLIENTE
// ======================================================================
cnpjInput1.addEventListener('blur', async function () {
    let cnpj = this.value.replace(/\D/g, '');
    if (!cnpj || cnpjInvalido(cnpj)) return alert("CNPJ inválido.");

    cnpj = ajustarCNPJ(cnpj);
    this.value = formatarCNPJ(cnpj);

    showFeedback('Carregando cliente...');
    this.readOnly = true;
    let api = "documento"
    let clienteApi;

    try {
        const res = await fetch(`/api/cliente/${api}/${cnpj}`);
        if (!res.ok) throw new Error();
        clienteApi = await res.json();

        if (!clienteApi.ATIVO || clienteApi.SUSPENSO) {
            alert('Cliente inativo ou suspenso.');
            return limparCamposCliente();
        }

        clientesData = [null, [
            null,
            clienteApi["CNPJ"], clienteApi["INSC. ESTADUAL"], clienteApi["RAZÃO SOCIAL"],
            clienteApi["TELEFONE"], clienteApi["LISTA NOME"], clienteApi["EMAIL COMERCIAL"],
            clienteApi["EMAIL FISCAL"], clienteApi["ENDEREÇO"], clienteApi["BAIRRO"],
            clienteApi["CIDADE"], clienteApi["UF"], clienteApi["CEP"],
            clienteApi["NOME CONTATO"], clienteApi["COND. DE PAGTO"],
            clienteApi["REPRESENTANTE"], clienteApi["REPRESENTANTE NOME"],
            clienteApi["COD CLIENTE 2"], clienteApi["LISTA"], clienteApi["LISTA NOME1"],
            clienteApi["TRANSPORTADORA"], clienteApi["CliDataHoraIncl"],
            clienteApi["REPRESENTANTE E-MAIL"], clienteApi["REP COMISSAO ITEM"],
            clienteApi["REP COMISSAO SERVICO"], clienteApi["FORMA DE PAGAMENTO ID"],
            clienteApi["FORMA DE PAGAMENTO DESCRICAO"], clienteApi["ID COND. DE PAGTO"],
            clienteApi["ID NOME CONTATO"], clienteApi["NOME GRUPO CLIENTE"],
            clienteApi["GRUPO CLIENTE"], clienteApi["ATIVO"], clienteApi["SUSPENSO"]
        ]];
        const c = buscarCliente(cnpj);
        if (!c) return alert('Cliente não encontrado.');

        preencherCliente(clientesData[1]);

        const clienteCodigo =
    clienteApi.codigo ??
    clienteApi.Codigo ??
    clienteApi['COD CLIENTE 2'] ??
    document
        .getElementById(
            'cod_cliente'
        )
        ?.value;

const listaCodigo =
    clienteApi.LISTA ??
    clienteApi.listaPrecoCodigo ??
    null;

await carregarCatalogoCliente(
    clienteCodigo,
    listaCodigo
);

    } catch (error) {
    console.error(
        'Erro ao carregar cliente ou catálogo:',
        error
    );

    alert(
        error.message ||
        'Não foi possível carregar o cliente e o catálogo.'
    );
}finally {
        hideFeedback();
        this.readOnly = false;
        garantirLinhaInicial();
    }
});



codInput1.addEventListener('blur', async function () {
    let cnpj = this.value



    showFeedback('Carregando cliente...');
    this.readOnly = true;
    let api = "codigo"
    let clienteApi;

    try {
        const res = await fetch(`/api/cliente/${api}/${cnpj}`);
        if (!res.ok) throw new Error();
        clienteApi = await res.json();

        if (!clienteApi.ATIVO || clienteApi.SUSPENSO) {
            alert('Cliente inativo ou suspenso.');
            return limparCamposCliente();
        }
        console.log('LISTA:', clienteApi["LISTA"]);
        console.log('LISTA NOME1:', clienteApi["LISTA NOME1"]);
        clientesData = [null, [
            null,
            clienteApi["CNPJ"], clienteApi["INSC. ESTADUAL"], clienteApi["RAZÃO SOCIAL"],
            clienteApi["TELEFONE"], clienteApi["LISTA NOME"], clienteApi["EMAIL COMERCIAL"],
            clienteApi["EMAIL FISCAL"], clienteApi["ENDEREÇO"], clienteApi["BAIRRO"],
            clienteApi["CIDADE"], clienteApi["UF"], clienteApi["CEP"],
            clienteApi["NOME CONTATO"], clienteApi["COND. DE PAGTO"],
            clienteApi["REPRESENTANTE"], clienteApi["REPRESENTANTE NOME"],
            clienteApi["COD CLIENTE 2"], clienteApi["LISTA"], clienteApi["LISTA NOME1"],
            clienteApi["TRANSPORTADORA"], clienteApi["CliDataHoraIncl"],
            clienteApi["REPRESENTANTE E-MAIL"], clienteApi["REP COMISSAO ITEM"],
            clienteApi["REP COMISSAO SERVICO"], clienteApi["FORMA DE PAGAMENTO ID"],
            clienteApi["FORMA DE PAGAMENTO DESCRICAO"], clienteApi["ID COND. DE PAGTO"],
            clienteApi["ID NOME CONTATO"], clienteApi["NOME GRUPO CLIENTE"],
            clienteApi["GRUPO CLIENTE"], clienteApi["ATIVO"], clienteApi["SUSPENSO"]
        ]];

        const c = clientesData[1];

        if (!c) {
            return alert('Cliente não encontrado.');
        }
        preencherCliente(clientesData[1]);
        const clienteCodigo =
            clienteApi.codigo ??
            clienteApi.Codigo ??
            clienteApi['COD CLIENTE 2'] ??
            document
                .getElementById(
                    'cod_cliente'
                )
                ?.value;

        const listaCodigo =
            clienteApi.LISTA ??
            clienteApi.listaPrecoCodigo ??
            null;

        await carregarCatalogoCliente(
            clienteCodigo,
            listaCodigo
        );

    } catch (error) {
        console.error(
            'Erro ao carregar cliente ou catálogo:',
            error
        );

        alert(
            error.message ||
            'Não foi possível carregar o cliente e o catálogo.'
        );
        } finally {
        hideFeedback();
        this.readOnly = false;
        garantirLinhaInicial();
    }
});

function preencherCliente(c) {
    el('cnpj').value = formatarCNPJ(c[1].toString());
    el('razao_social').value = c[3];
    el('ie').value = c[2];
    el('representante').value = `${c[15]} - ${c[16]}`;
    el('endereco').value = c[8];
    el('bairro').value = c[9];
    el('cidade').value = c[10];
    el('uf').value = c[11];
    el('cep').value = formatarCEP(c[12].toString());
    el('telefone').value = c[4];
    el('email').value = c[6];
    el('email_fiscal').value = c[7];
    el('cod_cliente').value = c[17];
    el('pay').value = c[14];
    el('group').value = c[19];
    el('transp').value = c[20];
    el('codgroup').value = c[18];
    el('representanteId').value = c[15];
    el('formPagId').value = c[25];
    el('condPagId').value = c[27];
    el('PercentualComissaoItem').value = c[23];
    el('PercentualComissaoServico').value = c[24];
    el('ContatoClienteId').value = c[28];
    el('formPagDescricao').value = c[26];
    el('email_rep').value = c[22];
}




// ======================================================================
// 📦 PEDIDO / TABELA
// ======================================================================



function atualizarTotais() {
    atualizarTotalProdutos();
    atualizarTotalVolumes();
}

function garantirLinhaInicial() {
    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    if (!tbody) {
        console.error(
            'Tabela de rebaixa não encontrada.'
        );

        return;
    }

    const linhas =
        tbody.querySelectorAll(
            '.linha-item-rebaixa'
        );

    if (linhas.length === 0) {
        adicionarNovaLinha();
    }
}

function moedaBRParaNumero(valor){

    if(
        valor === null ||
        valor === undefined ||
        valor === ''
    ){
        return 0;
    }

    const normalizado =
        String(valor)
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();

    const numero =
        Number(normalizado);

    return isNaN(numero)
        ? 0
        : numero;

}

function numeroParaMoedaBR(valor){

    const numero =
        Number(valor || 0);

    return numero.toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}

function formatarCampoMoedaBR(input){

    if(!input.value){
        input.value = '';
        return;
    }

    const numero =
        moedaBRParaNumero(
            input.value
        );

    input.value =
        numeroParaMoedaBR(
            numero
        );

}

function numeroQuantidade(valor){

    const numero =
        Number(
            String(valor || '')
                .replace(',', '.')
                .trim()
        );

    return isNaN(numero)
        ? 0
        : numero;

}


// ======================================================================
// 🚀 ENVIO DO PEDIDO
// ======================================================================



// Função para zerar os campos da tabela "DADOS PEDIDO"
function zerarCamposPedido() {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    linhas.forEach(tr => {
        tr.querySelectorAll('input').forEach(input => {
            input.value = '';
            input.readOnly = false;
        });
    });

    garantirLinhaInicial();

    //foco automático no código do item
    setTimeout(() => {
        const primeiraLinha = document.querySelector('#dadosPedido tbody tr');
        primeiraLinha?.cells[0]?.querySelector('input')?.focus();
    }, 0);

    atualizarTotais();
}


// Adiciona o evento para zerar os campos quando o tipo de pedido for alterado

document.getElementById('tipo_pedido').addEventListener('change', function () {
 
    let tipoPedido1 = this.value;
    if (tipoPedido1 === 'Bonificação') {
        document.getElementById('referencia').value = 'BONIFICAÇÃO';
    } else {
        document.getElementById('referencia').value='';
}
});

const dataBR = new Date()
const dataFormatada = dataBR.toLocaleDateString('pt-BR', {
    timeZone: 'UTC'
});

function montarObjetoRebaixa() {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    const produtos = [];

    linhas.forEach(
        tr => {
            const codigo =
                String(
                    tr.dataset.itemEmpresaId ||
                    ''
                ).trim();

            if (!codigo) {
                return;
            }

            produtos.push({
                nforigem:
                    tr.querySelector(
                        '.campo-nf-origem-rebaixa'
                    )?.value || '',

                codigoItem:
                    codigo,

                descricao:
                    String(
                        tr.dataset.descricao ||
                        ''
                    ).trim(),

                lote:
                    tr.querySelector(
                        '.campo-lote-rebaixa'
                    )?.value || '',

                precounitario:
                    moedaBRParaNumero(
                        tr.querySelector(
                            '.campo-preco-rebaixa'
                        )?.value
                    ),

                rebaixa:
                    moedaBRParaNumero(
                        tr.querySelector(
                            '.campo-valor-rebaixa'
                        )?.value
                    ),

                atual:
                    moedaBRParaNumero(
                        tr.querySelector(
                            '.campo-preco-atual-rebaixa'
                        )?.value
                    ),

                quantidade:
                    numeroQuantidade(
                        tr.querySelector(
                            '.campo-quantidade-rebaixa'
                        )?.value
                    ),

                total:
                    moedaBRParaNumero(
                        tr.querySelector(
                            '.campo-total-rebaixa'
                        )?.value
                    ),

                itemId:
                    Number(
                        tr.dataset.itemId ||
                        tr.querySelector(
                            '.campo-item-id-rebaixa'
                        )?.value ||
                        0
                    )
            });
        }
    );

    const rebaixa = {
        cnpj: document.getElementById('cnpj').value.replace(/\D/g, ''),
        razaosocial: document.getElementById('razao_social').value,
        endereco: document.getElementById('endereco').value,
        cidade: document.getElementById('cidade').value,
        Cep: document.getElementById('cep').value,
        email: document.getElementById('email').value,
        representante: document.getElementById('representante').value,
        codCliente: Number(document.getElementById('cod_cliente').value),
        bairro: document.getElementById('bairro').value,
        uf: document.getElementById('uf').value,
        telefone: document.getElementById('telefone').value,
        emailFiscal: document.getElementById('email_fiscal').value,
        data: dataFormatada,
        motivo: document.getElementById('observation').value,
        status: "pendente",
        finalizado: 0,
        nfVinculada: '',
        produtos
    };

    return rebaixa;
}

async function salvarRebaixaMongo() {
    if (!validarTabelaPedido()) return;

    const dados = montarObjetoRebaixa();

    try {
        const res = await fetch('/api/rebaixa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await res.json();

        if (res.ok) {
            console.log('Rebaixa salva, Clique ok para enviar o email......');
        } else {
            throw new Error(result.error);
        }

    } catch (err) {
        console.error(err);
        alert('Erro ao salvar rebaixa');
    }
}



// Função para atualizar o total de volumes (quantidades) de todas as linhas
function atualizarTotalVolumes() {
    let totalVolumes =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody ' +
            '.linha-item-rebaixa'
        )
        .forEach(
            tr => {
                totalVolumes +=
                    numeroQuantidade(
                        tr.querySelector(
                            '.campo-quantidade-rebaixa'
                        )?.value
                    );
            }
        );

    const campoVolume =
        document.getElementById(
            'volume'
        );

    if (campoVolume) {
        campoVolume.value =
            totalVolumes;
    }
}

// Função para atualizar o total de produtos (quantidade * valor unitário)
function atualizarTotalProdutos() {
    let totalProdutos =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody ' +
            '.linha-item-rebaixa'
        )
        .forEach(
            tr => {
                totalProdutos +=
                    moedaBRParaNumero(
                        tr.querySelector(
                            '.campo-total-rebaixa'
                        )?.value
                    );
            }
        );

    const campoTotal =
        document.getElementById(
            'total'
        );

    if (campoTotal) {
        campoTotal.value =
            totalProdutos.toLocaleString(
                'pt-BR',
                {
                    style:
                        'currency',

                    currency:
                        'BRL'
                }
            );
    }
}

function dataMaiorQue6Meses(dataInput) {
    const dataSelecionada = new Date(dataInput);
    const hoje = new Date();

    const limite = new Date();
    limite.setMonth(limite.getMonth() - 6); // volta 6 meses

    return dataSelecionada < limite;
}

function validarTabelaPedido() {
    const linhas =
        Array.from(
            document.querySelectorAll(
                '#dadosPedido tbody ' +
                '.linha-item-rebaixa'
            )
        ).filter(
            tr => {
                return Boolean(
                    String(
                        tr.dataset.itemEmpresaId ||
                        ''
                    ).trim()
                );
            }
        );

    if (linhas.length === 0) {
        alert(
            'Adicione pelo menos um item na rebaixa.'
        );

        return false;
    }

    for (
        let indice = 0;
        indice < linhas.length;
        indice += 1
    ) {
        const tr =
            linhas[indice];

        const numeroLinha =
            indice + 1;

        const nf =
            tr.querySelector(
                '.campo-nf-origem-rebaixa'
            )?.value.trim();

        const codigo =
            String(
                tr.dataset.itemEmpresaId ||
                ''
            ).trim();

        const descricao =
            String(
                tr.dataset.descricao ||
                ''
            ).trim();

        const lote =
            tr.querySelector(
                '.campo-lote-rebaixa'
            )?.value.trim();

        const preco =
            moedaBRParaNumero(
                tr.querySelector(
                    '.campo-preco-rebaixa'
                )?.value
            );

        const rebaixa =
            moedaBRParaNumero(
                tr.querySelector(
                    '.campo-valor-rebaixa'
                )?.value
            );

        const atual =
            moedaBRParaNumero(
                tr.querySelector(
                    '.campo-preco-atual-rebaixa'
                )?.value
            );

        const quantidade =
            numeroQuantidade(
                tr.querySelector(
                    '.campo-quantidade-rebaixa'
                )?.value
            );

        const total =
            moedaBRParaNumero(
                tr.querySelector(
                    '.campo-total-rebaixa'
                )?.value
            );

        if (!nf) {
            alert(
                `Preencha a NF de origem na linha ${numeroLinha}.`
            );

            tr.querySelector(
                '.campo-nf-origem-rebaixa'
            )?.focus();

            return false;
        }

        if (
            !codigo ||
            !descricao
        ) {
            alert(
                `Selecione um item válido na linha ${numeroLinha}.`
            );

            tr.querySelector(
                '.campo-item-pesquisa-rebaixa'
            )?.focus();

            return false;
        }

        if (!lote) {
            alert(
                `Preencha o lote na linha ${numeroLinha}.`
            );

            tr.querySelector(
                '.campo-lote-rebaixa'
            )?.focus();

            return false;
        }

        if (preco <= 0) {
            alert(
                `Informe o preço unitário na linha ${numeroLinha}.`
            );

            tr.querySelector(
                '.campo-preco-rebaixa'
            )?.focus();

            return false;
        }

        if (
            rebaixa <= 0 ||
            rebaixa > preco
        ) {
            alert(
                `Informe uma rebaixa válida na linha ${numeroLinha}.`
            );

            tr.querySelector(
                '.campo-valor-rebaixa'
            )?.focus();

            return false;
        }

        if (
            atual < 0 ||
            quantidade <= 0 ||
            total <= 0
        ) {
            alert(
                `Verifique os valores da linha ${numeroLinha}.`
            );

            return false;
        }
    }

    return true;
}

function recalcularLinhaRebaixa(
    tr
) {
    const campoPreco =
        tr.querySelector(
            '.campo-preco-rebaixa'
        );

    const campoRebaixa =
        tr.querySelector(
            '.campo-valor-rebaixa'
        );

    const campoAtual =
        tr.querySelector(
            '.campo-preco-atual-rebaixa'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-rebaixa'
        );

    const campoTotal =
        tr.querySelector(
            '.campo-total-rebaixa'
        );

    const preco =
        moedaBRParaNumero(
            campoPreco?.value
        );

    const rebaixa =
        moedaBRParaNumero(
            campoRebaixa?.value
        );

    const quantidade =
        numeroQuantidade(
            campoQuantidade?.value
        );

    const atual =
        preco -
        rebaixa;

    const total =
        rebaixa *
        quantidade;

    if (campoAtual) {
        campoAtual.value =
            numeroParaMoedaBR(
                atual
            );
    }

    if (campoTotal) {
        campoTotal.value =
            numeroParaMoedaBR(
                total
            );
    }

    atualizarTotais();
}

function limparItemLinhaRebaixa(
    tr
) {
    const seletoresCampos = [
        '.campo-item-pesquisa-rebaixa',
        '.campo-lote-rebaixa',
        '.campo-preco-rebaixa',
        '.campo-valor-rebaixa',
        '.campo-preco-atual-rebaixa',
        '.campo-quantidade-rebaixa',
        '.campo-total-rebaixa',
        '.campo-item-id-rebaixa'
    ];

    seletoresCampos.forEach(
        seletor => {
            const campo =
                tr.querySelector(
                    seletor
                );

            if (campo) {
                campo.value =
                    '';
            }
        }
    );

    tr.dataset.itemId =
        '';

    tr.dataset.itemEmpresaId =
        '';

    tr.dataset.codigo =
        '';

    tr.dataset.descricao =
        '';

    tr.dataset.itemCarregado =
        'false';

    atualizarTotais();
}

function preencherItemLinhaRebaixa(
    tr,
    item
) {
    const campoPesquisa =
        tr.querySelector(
            '.campo-item-pesquisa-rebaixa'
        );

    const campoLote =
        tr.querySelector(
            '.campo-lote-rebaixa'
        );

    const campoItemId =
        tr.querySelector(
            '.campo-item-id-rebaixa'
        );

    const codigo =
        String(
            item.itemEmpresaId || ''
        ).trim();

    const descricao =
        String(
            item.descricao || ''
        ).trim();

    const itemId =
        item.itemId ??
        item.ItemId ??
        item.codigo ??
        '';

    campoPesquisa.value =
        `${codigo} - ${descricao}`;

    if (campoItemId) {
        campoItemId.value =
            String(
                itemId
            );
    }

    tr.dataset.itemId =
        String(
            itemId
        );

    tr.dataset.itemEmpresaId =
        codigo;

    tr.dataset.codigo =
        codigo;

    tr.dataset.descricao =
        descricao;

    tr.dataset.itemCarregado =
        'true';

    recalcularLinhaRebaixa(
        tr
    );

    setTimeout(
        () => {
            campoLote?.focus();
            campoLote?.select();
        },
        0
    );
}

function configurarPesquisaItemRebaixa(
    tr,
    campoPesquisa
) {
    let processandoItem =
        false;

    async function processarItem() {
        if (processandoItem) {
            return false;
        }

        const valorDigitado =
            campoPesquisa.value.trim();

        if (!valorDigitado) {
            return false;
        }

        processandoItem =
            true;

        campoPesquisa.readOnly =
            true;

        try {
            if (catalogoClienteCarregando) {
                throw new Error(
                    'O catálogo ainda está sendo carregado. Aguarde.'
                );
            }

            if (!catalogoClienteCarregado) {
                throw new Error(
                    'Carregue um cliente antes de informar os itens.'
                );
            }

            const item =
                buscarItemPorPesquisa(
                    valorDigitado
                );

            if (!item) {
                throw new Error(
                    'Item não encontrado no catálogo do cliente.'
                );
            }

            const codigo =
                normalizarCodigoItem(
                    item.itemEmpresaId
                );

            if (!codigo) {
                throw new Error(
                    'O item selecionado não possui código de empresa.'
                );
            }

            const itemDuplicado =
                Array.from(
                    document.querySelectorAll(
                        '#dadosPedido tbody tr'
                    )
                ).some(
                    linha => {
                        if (linha === tr) {
                            return false;
                        }

                        const codigoLinha =
                            normalizarCodigoItem(
                                linha.dataset
                                    .itemEmpresaId
                            );

                        return (
                            codigoLinha &&
                            codigoLinha === codigo
                        );
                    }
                );

            if (itemDuplicado) {
                throw new Error(
                    'Este item já foi adicionado à rebaixa.'
                );
            }

            preencherItemLinhaRebaixa(
                tr,
                item
            );

            tr.dataset.itemCarregado =
                'true';

            return true;
        } catch (error) {
            console.error(
                'Erro ao carregar item da rebaixa:',
                error
            );

            limparItemLinhaRebaixa(
                tr
            );

            alert(
                error.message ||
                'Não foi possível carregar o item.'
            );

            setTimeout(
                () => {
                    campoPesquisa.focus();
                    campoPesquisa.select();
                },
                0
            );

            return false;
        } finally {
            processandoItem =
                false;

            campoPesquisa.readOnly =
                false;
        }
    }

    function limparItemSelecionadoAoEditar() {
        if (
            processandoItem ||
            !tr.dataset.itemEmpresaId
        ) {
            return;
        }

        const valorDigitado =
            String(
                campoPesquisa.value || ''
            ).trim();

        const separador =
            valorDigitado.indexOf(
                ' - '
            );

        const codigoDigitado =
            separador >= 0
                ? valorDigitado.substring(
                    0,
                    separador
                )
                : valorDigitado;

        const codigoNormalizado =
            normalizarCodigoItem(
                codigoDigitado
            );

        const codigoCarregado =
            normalizarCodigoItem(
                tr.dataset.itemEmpresaId
            );

        if (
            codigoNormalizado ===
            codigoCarregado
        ) {
            return;
        }

        const campoDescricao =
            tr.querySelector(
                '.campo-descricao-rebaixa'
            );

        const campoItemId =
            tr.querySelector(
                '.campo-item-id-rebaixa'
            );

        if (campoDescricao) {
            campoDescricao.value =
                '';
        }

        if (campoItemId) {
            campoItemId.value =
                '';
        }

        tr.dataset.itemId =
            '';

        tr.dataset.itemEmpresaId =
            '';

        tr.dataset.codigo =
            '';

        tr.dataset.descricao =
            '';

        tr.dataset.itemCarregado =
            'false';
    }

    campoPesquisa.addEventListener(
        'input',
        () => {
            limparItemSelecionadoAoEditar();

            const item =
                buscarItemPorPesquisa(
                    campoPesquisa.value
                );

            if (
                item &&
                !processandoItem
            ) {
                processarItem();
            }
        }
    );

    campoPesquisa.addEventListener(
        'change',
        () => {
            processarItem();
        }
    );

    campoPesquisa.addEventListener(
        'blur',
        () => {
            const possuiValor =
                Boolean(
                    campoPesquisa.value.trim()
                );

            const possuiItemCarregado =
                Boolean(
                    String(
                        tr.dataset.itemEmpresaId ||
                        ''
                    ).trim()
                );

            if (
                possuiValor &&
                !possuiItemCarregado &&
                !processandoItem
            ) {
                processarItem();
            }
        }
    );

    campoPesquisa.addEventListener(
        'keydown',
        async evento => {
            const pressionouEnter =
                evento.key ===
                'Enter';

            const pressionouTab =
                evento.key ===
                'Tab';

            if (
                !pressionouEnter &&
                !pressionouTab
            ) {
                return;
            }

            if (
                pressionouTab &&
                evento.shiftKey
            ) {
                return;
            }

            evento.preventDefault();
            evento.stopPropagation();

            const itemCarregado =
                await processarItem();

            if (!itemCarregado) {
                return;
            }

            const campoLote =
                tr.querySelector(
                    '.campo-lote-rebaixa'
                );

            setTimeout(
                () => {
                    campoLote?.focus();
                    campoLote?.select();
                },
                0
            );
        }
    );
}

// Função para adicionar uma nova linha à tabela
function adicionarNovaLinha() {
    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    if (!tbody) {
        console.error(
            'O tbody da tabela de rebaixa não foi encontrado.'
        );

        return null;
    }

    const tr =
        document.createElement(
            'tr'
        );

    tr.classList.add(
        'linha-item-rebaixa'
    );

    const criarCelulaInput = ({
        classeCelula,
        classeInput,
        tipo = 'text',
        somenteLeitura = false,
        tabIndex = 0,
        placeholder = '',
        inputMode = '',
        oculto = false
    }) => {
        const td =
            document.createElement(
                'td'
            );

        if (classeCelula) {
            td.classList.add(
                classeCelula
            );
        }

        if (oculto) {
            td.style.display =
                'none';
        }

        const input =
            document.createElement(
                'input'
            );

        input.type =
            tipo;

        if (classeInput) {
            input.classList.add(
                classeInput
            );
        }

        input.readOnly =
            somenteLeitura;

        input.tabIndex =
            tabIndex;

        input.placeholder =
            placeholder;

        if (inputMode) {
            input.inputMode =
                inputMode;
        }

        input.autocomplete =
            'off';

        td.appendChild(
            input
        );

        tr.appendChild(
            td
        );

        return {
            td,
            input
        };
    };

    /*
     * 0 - NF origem
     */
    const campoNf =
        criarCelulaInput({
            classeCelula:
                'col-reb-nf',

            classeInput:
                'campo-nf-origem-rebaixa'
        }).input;

    /*
     * 1 - Código / descrição
     */
    const campoPesquisa =
        criarCelulaInput({
            classeCelula:
                'col-reb-codigo-descricao',

            classeInput:
                'campo-item-pesquisa-rebaixa',

            placeholder:
                'Digite o código ou a descrição'
        }).input;

    campoPesquisa.setAttribute(
        'list',
        'lista-produtos-rebaixa'
    );

    /*
     * 2 - Lote
     */
    const campoLote =
        criarCelulaInput({
            classeCelula:
                'col-reb-lote',

            classeInput:
                'campo-lote-rebaixa'
        }).input;

    /*
     * Função auxiliar para campos monetários.
     */
    function criarCampoMoeda(
        classeCelula,
        classeInput,
        somenteLeitura = false
    ) {
        const td =
            document.createElement(
                'td'
            );

        td.classList.add(
            classeCelula
        );

        const wrapper =
            document.createElement(
                'div'
            );

        wrapper.classList.add(
            'campo-moeda'
        );

        const simbolo =
            document.createElement(
                'span'
            );

        simbolo.textContent =
            'R$';

        const input =
            document.createElement(
                'input'
            );

        input.type =
            'text';

        input.classList.add(
            classeInput,
            'campo-dinheiro-reb'
        );

        input.inputMode =
            'decimal';

        input.autocomplete =
            'off';

        input.readOnly =
            somenteLeitura;

        input.tabIndex =
            somenteLeitura
                ? -1
                : 0;

        wrapper.appendChild(
            simbolo
        );

        wrapper.appendChild(
            input
        );

        td.appendChild(
            wrapper
        );

        tr.appendChild(
            td
        );

        return input;
    }

    /*
     * 3 - Preço unitário com impostos
     */
    const campoPreco =
        criarCampoMoeda(
            'col-reb-preco',
            'campo-preco-rebaixa'
        );

    /*
     * 4 - Valor da rebaixa
     */
    const campoRebaixa =
        criarCampoMoeda(
            'col-reb-rebaixa',
            'campo-valor-rebaixa'
        );

    /*
     * 5 - Preço atual calculado
     */
    const campoAtual =
        criarCampoMoeda(
            'col-reb-atual',
            'campo-preco-atual-rebaixa',
            true
        );

    /*
     * 6 - Quantidade
     */
    const campoQuantidade =
        criarCelulaInput({
            classeCelula:
                'col-reb-quantidade',

            classeInput:
                'campo-quantidade-rebaixa',

            inputMode:
                'decimal'
        }).input;

    /*
     * 7 - Total calculado
     */
    const campoTotal =
        criarCampoMoeda(
            'col-reb-total',
            'campo-total-rebaixa',
            true
        );

    /*
     * 8 - Excluir
     */
    const celulaExcluir =
        document.createElement(
            'td'
        );

    celulaExcluir.classList.add(
        'col-reb-excluir'
    );

    const botaoRemover =
        document.createElement(
            'button'
        );

    botaoRemover.type =
        'button';

    botaoRemover.classList.add(
        'btn-remover-linha'
    );

    botaoRemover.textContent =
        'Excluir';

    celulaExcluir.appendChild(
        botaoRemover
    );

    tr.appendChild(
        celulaExcluir
    );

    /*
     * 9 - Item ID oculto
     */
    const campoItemId =
        criarCelulaInput({
            classeCelula:
                'col-reb-itemid',

            classeInput:
                'campo-item-id-rebaixa',

            tipo:
                'hidden',

            tabIndex:
                -1,

            oculto:
                true
        }).input;

    /*
     * A linha precisa ser adicionada antes da configuração
     * dos eventos que consultam os campos dentro de "tr".
     */
    tbody.appendChild(
        tr
    );

    configurarPesquisaItemRebaixa(
        tr,
        campoPesquisa
    );

    const camposCalculados = [
        campoPreco,
        campoRebaixa,
        campoQuantidade
    ];

    camposCalculados.forEach(
        campo => {
            campo.addEventListener(
                'input',
                () => {
                    recalcularLinhaRebaixa(
                        tr
                    );
                }
            );
        }
    );

    [
        campoPreco,
        campoRebaixa
    ].forEach(
        campo => {
            campo.addEventListener(
                'focus',
                () => {
                    campo.select();
                }
            );

            campo.addEventListener(
                'blur',
                () => {
                    formatarCampoMoedaBR(
                        campo
                    );

                    recalcularLinhaRebaixa(
                        tr
                    );
                }
            );
        }
    );

    function configurarEnterTab(
        campo,
        proximoCampo,
        callback = null
    ) {
        campo.addEventListener(
            'keydown',
            evento => {
                const enter =
                    evento.key ===
                    'Enter';

                const tab =
                    evento.key ===
                    'Tab';

                if (
                    !enter &&
                    !tab
                ) {
                    return;
                }

                if (
                    tab &&
                    evento.shiftKey
                ) {
                    return;
                }

                evento.preventDefault();

                callback?.();

                setTimeout(
                    () => {
                        proximoCampo?.focus();
                        proximoCampo?.select();
                    },
                    0
                );
            }
        );
    }

    configurarEnterTab(
        campoNf,
        campoPesquisa
    );

    configurarEnterTab(
        campoLote,
        campoPreco
    );

    configurarEnterTab(
        campoPreco,
        campoRebaixa,
        () => {
            formatarCampoMoedaBR(
                campoPreco
            );

            recalcularLinhaRebaixa(
                tr
            );
        }
    );

    configurarEnterTab(
        campoRebaixa,
        campoQuantidade,
        () => {
            formatarCampoMoedaBR(
                campoRebaixa
            );

            recalcularLinhaRebaixa(
                tr
            );
        }
    );

    campoQuantidade.addEventListener(
        'keydown',
        evento => {
            const enter =
                evento.key ===
                'Enter';

            const tab =
                evento.key ===
                'Tab';

            if (
                !enter &&
                !tab
            ) {
                return;
            }

            if (
                tab &&
                evento.shiftKey
            ) {
                return;
            }

            evento.preventDefault();

            recalcularLinhaRebaixa(
                tr
            );

            let proximaLinha =
                tr.nextElementSibling;

            if (
                !proximaLinha ||
                !proximaLinha.classList.contains(
                    'linha-item-rebaixa'
                )
            ) {
                proximaLinha =
                    adicionarNovaLinha();
            }

            setTimeout(
                () => {
                    proximaLinha
                        ?.querySelector(
                            '.campo-nf-origem-rebaixa'
                        )
                        ?.focus();
                },
                0
            );
        }
    );

    botaoRemover.addEventListener(
        'click',
        () => {
            tr.remove();

            atualizarTotais();

            garantirLinhaInicial();
        }
    );

    /*
     * Referências opcionais no dataset.
     */
    tr.dataset.itemId =
        campoItemId.value || '';

    tr.dataset.itemEmpresaId =
        '';

    tr.dataset.descricao =
        '';

    return tr;
}

// Função para remover a última linha da tabela
document.getElementById('excluirLinha').addEventListener('click', function () {
    let tbody = document.querySelector('#dadosPedido tbody');
    if (tbody.rows.length > 0) {
        tbody.deleteRow(tbody.rows.length - 1);
        atualizarTotais();
    } else {
        alert("Nenhuma linha para remover");
    }
});
    //botão para adicionar linha caso a tela esteja do tamanho de um celular
    document.getElementById('adicionarLinha').addEventListener('click', function () {
                    adicionarNovaLinha(); 
    });


function obterValorCampoPdf(
    id,
    valorPadrao = '-'
) {
    const campo =
        document.getElementById(
            id
        );

    const valor =
        String(
            campo?.value ?? ''
        ).trim();

    return valor || valorPadrao;
}

function criarCampoClientePdf(
    rotulo,
    valor,
    classeExtra = ''
) {
    const campo =
        document.createElement(
            'div'
        );

    campo.className =
        `pdf-campo-cliente ${classeExtra}`
            .trim();

    const titulo =
        document.createElement(
            'strong'
        );

    titulo.textContent =
        rotulo;

    const conteudo =
        document.createElement(
            'span'
        );

    conteudo.textContent =
        String(
            valor || '-'
        );

    campo.appendChild(
        titulo
    );

    campo.appendChild(
        conteudo
    );

    return campo;
}

function criarCelulaPdf(
    valor,
    classe = ''
) {
    const td =
        document.createElement(
            'td'
        );

    if (classe) {
        td.className =
            classe;
    }

    td.textContent =
        String(
            valor ?? ''
        ).trim() || '-';

    return td;
}

function formatarNumeroPdf(
    valor
) {
    return Number(
        valor || 0
    ).toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );
}

function formatarMoedaPdf(
    valor
) {
    return Number(
        valor || 0
    ).toLocaleString(
        'pt-BR',
        {
            style:
                'currency',

            currency:
                'BRL'
        }
    );
}

function criarCabecalhoRebaixaPdf() {
    const cabecalho =
        document.createElement(
            'div'
        );

    cabecalho.className =
        'pdf-cabecalho';

    const areaLogo =
        document.createElement(
            'div'
        );

    areaLogo.className =
        'pdf-logo-container';

    const logoOriginal =
        document.querySelector(
            '.header img'
        );

    if (logoOriginal) {
        const logo =
            logoOriginal.cloneNode(
                true
            );

        areaLogo.appendChild(
            logo
        );
    }

    const titulo =
        document.createElement(
            'h1'
        );

    titulo.textContent =
        'SOLICITAÇÃO DE REBAIXA';

    const data =
        document.createElement(
            'div'
        );

    data.className =
        'pdf-data';

    data.textContent =
        new Date()
            .toLocaleString(
                'pt-BR'
            );

    cabecalho.appendChild(
        areaLogo
    );

    cabecalho.appendChild(
        titulo
    );

    cabecalho.appendChild(
        data
    );

    return cabecalho;
}

function criarDadosClienteRebaixaPdf() {
    const secao =
        document.createElement(
            'section'
        );

    secao.className =
        'pdf-secao pdf-dados-cliente';

    const titulo =
        document.createElement(
            'h2'
        );

    titulo.textContent =
        'DADOS DO CLIENTE';

    const grade =
        document.createElement(
            'div'
        );

    grade.className =
        'pdf-grade-cliente';

    grade.appendChild(
        criarCampoClientePdf(
            'CNPJ',
            obterValorCampoPdf(
                'cnpj'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'CÓD CLIENTE',
            obterValorCampoPdf(
                'cod_cliente'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'RAZÃO SOCIAL',
            obterValorCampoPdf(
                'razao_social'
            ),
            'pdf-campo-duplo'
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'REPRESENTANTE',
            obterValorCampoPdf(
                'representante'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'ENDEREÇO',
            obterValorCampoPdf(
                'endereco'
            ),
            'pdf-campo-duplo'
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'BAIRRO',
            obterValorCampoPdf(
                'bairro'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'CIDADE',
            obterValorCampoPdf(
                'cidade'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'UF',
            obterValorCampoPdf(
                'uf'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'CEP',
            obterValorCampoPdf(
                'cep'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'TELEFONE',
            obterValorCampoPdf(
                'telefone'
            )
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'E-MAIL',
            obterValorCampoPdf(
                'email'
            ),
            'pdf-campo-duplo'
        )
    );

    grade.appendChild(
        criarCampoClientePdf(
            'E-MAIL FISCAL',
            obterValorCampoPdf(
                'email_fiscal'
            ),
            'pdf-campo-duplo'
        )
    );

    secao.appendChild(
        titulo
    );

    secao.appendChild(
        grade
    );

    return secao;
}

function criarMotivoRebaixaPdf() {
    const secao =
        document.createElement(
            'section'
        );

    secao.className =
        'pdf-secao pdf-motivo';

    const titulo =
        document.createElement(
            'h2'
        );

    titulo.textContent =
        'MOTIVO DA REBAIXA';

    const texto =
        document.createElement(
            'div'
        );

    texto.className =
        'pdf-motivo-texto';

    texto.textContent =
        obterValorCampoPdf(
            'observation'
        );

    secao.appendChild(
        titulo
    );

    secao.appendChild(
        texto
    );

    return secao;
}

function criarTabelaRebaixaPdf() {
    const secao =
        document.createElement(
            'section'
        );

    secao.className =
        'pdf-secao pdf-itens';

    const titulo =
        document.createElement(
            'h2'
        );

    titulo.textContent =
        'DADOS DA REBAIXA';

    const tabela =
        document.createElement(
            'table'
        );

    tabela.className =
        'pdf-tabela-itens ' +
        'pdf-tabela-rebaixa';

    const colgroup =
        document.createElement(
            'colgroup'
        );

    const larguras = [
        '9%',
        '30%',
        '9%',
        '10%',
        '9%',
        '9%',
        '7%',
        '10%'
    ];

    larguras.forEach(
        largura => {
            const col =
                document.createElement(
                    'col'
                );

            col.style.width =
                largura;

            colgroup.appendChild(
                col
            );
        }
    );

    tabela.appendChild(
        colgroup
    );

    const thead =
        document.createElement(
            'thead'
        );

    const linhaCabecalho =
        document.createElement(
            'tr'
        );

    const titulos = [
        'NF ORIGEM',
        'CÓDIGO / DESCRIÇÃO',
        'LOTE',
        'R$ UNITÁRIO COM IMPOSTOS',
        'R$ REBAIXA',
        'R$ ATUAL',
        'QTD (UN)',
        'TOTAL R$'
    ];

    titulos.forEach(
        texto => {
            const th =
                document.createElement(
                    'th'
                );

            th.textContent =
                texto;

            linhaCabecalho.appendChild(
                th
            );
        }
    );

    thead.appendChild(
        linhaCabecalho
    );

    tabela.appendChild(
        thead
    );

    const tbody =
        document.createElement(
            'tbody'
        );

    const linhas =
        document.querySelectorAll(
            '#dadosPedido tbody ' +
            '.linha-item-rebaixa'
        );

    linhas.forEach(
        tr => {
            const codigo =
                String(
                    tr.dataset.itemEmpresaId ||
                    ''
                ).trim();

            if (!codigo) {
                return;
            }

            const descricao =
                String(
                    tr.dataset.descricao ||
                    ''
                ).trim();

            const nf =
                tr.querySelector(
                    '.campo-nf-origem-rebaixa'
                )?.value || '';

            const lote =
                tr.querySelector(
                    '.campo-lote-rebaixa'
                )?.value || '';

            const preco =
                moedaBRParaNumero(
                    tr.querySelector(
                        '.campo-preco-rebaixa'
                    )?.value
                );

            const rebaixa =
                moedaBRParaNumero(
                    tr.querySelector(
                        '.campo-valor-rebaixa'
                    )?.value
                );

            const atual =
                moedaBRParaNumero(
                    tr.querySelector(
                        '.campo-preco-atual-rebaixa'
                    )?.value
                );

            const quantidade =
                numeroQuantidade(
                    tr.querySelector(
                        '.campo-quantidade-rebaixa'
                    )?.value
                );

            const total =
                moedaBRParaNumero(
                    tr.querySelector(
                        '.campo-total-rebaixa'
                    )?.value
                );

            const linha =
                document.createElement(
                    'tr'
                );

            linha.appendChild(
                criarCelulaPdf(
                    nf
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    `${codigo} - ${descricao}`,
                    'pdf-descricao-item'
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    lote
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoedaPdf(
                        preco
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoedaPdf(
                        rebaixa
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoedaPdf(
                        atual
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarNumeroPdf(
                        quantidade
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoedaPdf(
                        total
                    )
                )
            );

            tbody.appendChild(
                linha
            );
        }
    );

    tabela.appendChild(
        tbody
    );

    secao.appendChild(
        titulo
    );

    secao.appendChild(
        tabela
    );

    return secao;
}

function criarCampoTotalRebaixaPdf(
    rotulo,
    valor
) {
    const campo =
        document.createElement(
            'div'
        );

    campo.className =
        'pdf-total-campo';

    const titulo =
        document.createElement(
            'strong'
        );

    titulo.textContent =
        rotulo;

    const conteudo =
        document.createElement(
            'span'
        );

    conteudo.textContent =
        valor;

    campo.appendChild(
        titulo
    );

    campo.appendChild(
        conteudo
    );

    return campo;
}

function criarTotaisRebaixaPdf() {
    const totais =
        document.createElement(
            'div'
        );

    totais.className =
        'pdf-totais';

    totais.appendChild(
        criarCampoTotalRebaixaPdf(
            'VOLUMES',
            obterValorCampoPdf(
                'volume',
                '0'
            )
        )
    );

    totais.appendChild(
        criarCampoTotalRebaixaPdf(
            'TOTAL DA REBAIXA',
            obterValorCampoPdf(
                'total',
                'R$ 0,00'
            )
        )
    );

    return totais;
}

function prepararRebaixaParaPdf() {
    const relatorio =
        document.createElement(
            'div'
        );

    /*
     * Usa a classe visual já criada para o PDF da devolução
     * e uma classe adicional específica da rebaixa.
     */
    relatorio.className =
        'relatorio-devolucao-pdf ' +
        'relatorio-rebaixa-pdf';

    relatorio.appendChild(
        criarCabecalhoRebaixaPdf()
    );

    relatorio.appendChild(
        criarDadosClienteRebaixaPdf()
    );

    relatorio.appendChild(
        criarMotivoRebaixaPdf()
    );

    relatorio.appendChild(
        criarTabelaRebaixaPdf()
    );

    relatorio.appendChild(
        criarTotaisRebaixaPdf()
    );

    document.body.appendChild(
        relatorio
    );

    return relatorio;
}

async function gerarBlobRebaixaPdf(
    elemento
) {
    if (
        typeof window.html2canvas !==
        'function'
    ) {
        throw new Error(
            'A biblioteca html2canvas não foi carregada.'
        );
    }

    if (
        typeof window.jspdf?.jsPDF !==
        'function'
    ) {
        throw new Error(
            'A biblioteca jsPDF não foi carregada.'
        );
    }

    await new Promise(
        resolve => {
            requestAnimationFrame(
                () => {
                    requestAnimationFrame(
                        resolve
                    );
                }
            );
        }
    );

    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    const imagens =
        Array.from(
            elemento.querySelectorAll(
                'img'
            )
        );

    await Promise.all(
        imagens.map(
            imagem => {
                if (imagem.complete) {
                    return Promise.resolve();
                }

                return new Promise(
                    resolve => {
                        imagem.addEventListener(
                            'load',
                            resolve,
                            {
                                once: true
                            }
                        );

                        imagem.addEventListener(
                            'error',
                            resolve,
                            {
                                once: true
                            }
                        );

                        setTimeout(
                            resolve,
                            3000
                        );
                    }
                );
            }
        )
    );

    const larguraCaptura =
        1120;

    const alturaCaptura =
        Math.ceil(
            Math.max(
                elemento.scrollHeight,
                elemento.offsetHeight,
                elemento
                    .getBoundingClientRect()
                    .height
            )
        );

    if (alturaCaptura <= 0) {
        throw new Error(
            'O relatório da rebaixa está vazio.'
        );
    }

    const canvas =
        await window.html2canvas(
            elemento,
            {
                scale:
                    2,

                useCORS:
                    true,

                allowTaint:
                    false,

                backgroundColor:
                    '#ffffff',

                logging:
                    false,

                width:
                    larguraCaptura,

                height:
                    alturaCaptura,

                windowWidth:
                    larguraCaptura,

                windowHeight:
                    alturaCaptura,

                scrollX:
                    0,

                scrollY:
                    0
            }
        );

    const jsPDF =
        window.jspdf.jsPDF;

    const pdf =
        new jsPDF({
            orientation:
                'landscape',

            unit:
                'mm',

            format:
                'a4',

            compress:
                true
        });

    const margem =
        4;

    const larguraPagina =
        pdf.internal.pageSize
            .getWidth();

    const alturaPagina =
        pdf.internal.pageSize
            .getHeight();

    const larguraDisponivel =
        larguraPagina -
        margem * 2;

    const alturaDisponivel =
        alturaPagina -
        margem * 2;

    const escalaHorizontal =
        larguraDisponivel /
        canvas.width;

    const escalaVertical =
        alturaDisponivel /
        canvas.height;

    const escalaFinal =
        Math.min(
            escalaHorizontal,
            escalaVertical
        );

    const larguraFinal =
        canvas.width *
        escalaFinal;

    const alturaFinal =
        canvas.height *
        escalaFinal;

    const posicaoX =
        (
            larguraPagina -
            larguraFinal
        ) /
        2;

    pdf.addImage(
        canvas.toDataURL(
            'image/jpeg',
            0.96
        ),
        'JPEG',
        posicaoX,
        margem,
        larguraFinal,
        alturaFinal,
        undefined,
        'FAST'
    );

    const blob =
        pdf.output(
            'blob'
        );

    if (
        !blob ||
        blob.size === 0
    ) {
        throw new Error(
            'O PDF da rebaixa foi gerado vazio.'
        );
    }

    return blob;
}



// Função para verificar duplicatas de código na tabela
function verificarCodigoDuplicado(codigo) {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');
    let contador = 0;

    linhas.forEach(tr => {
        const inputCodigo = tr.cells[1]?.querySelector('input');
        if (inputCodigo && inputCodigo.value === codigo) {
            contador++;
        }
    });
    return contador > 1;
}

function verificarCodigoDuplicadoNaTabela(codigo, linhaAtual) {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    for (const tr of linhas) {
        if (tr === linhaAtual) continue; // ignora a própria linha

        const inputCodigo = tr.cells[1]?.querySelector('input');
        if (inputCodigo && inputCodigo.value.trim().toUpperCase() === codigo) {
            return true;
        }
    }
    return false;
}

function verificarItensSemPreenchimento(codigo, linhaAtual) {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    for (const tr of linhas) {
        const inputCodigo = tr.cells[1]?.querySelector('input');
        if (inputCodigo && inputCodigo.value.trim().toUpperCase() === codigo) {
            return true;
        }
    }
    return false;
}



//--inicio-----envio de dados para o sistema DBCorp-----------------------------------------------------------------------------------------////
const feedbackDiv = document.getElementById('feedback1');
const cnpjInput = document.getElementById('cnpj');

//--fim-----envio de dados para o sistema DBCorp------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

// showStep();


//consts email
    const emailModal = document.getElementById('emailModalRebaixa');
    const buttonPdf = document.getElementById('button_pdf');
    const emailCloseButton = document.querySelector('.email-close-button');
    const sendEmailButton = document.getElementById('sendEmailButton');
    const cancelEmailButton = document.getElementById('cancelEmailButton');
    const emailToInput = document.getElementById('emailTo');
    const emailSubjectInput = document.getElementById('emailSubject');
    const emailBodyInput = document.getElementById('emailBody');
    const emailAttachmentInput = document.getElementById('emailAttachment');
    const attachmentList = document.getElementById('attachmentList');
    const totalSizeDisplay = document.getElementById('totalSizeDisplay');
  
    
    // Elementos do modal de limite de tamanho
    const sizeLimitModal = document.getElementById('sizeLimitModal');
    const sizeLimitMessage = document.getElementById('sizeLimitMessage');
    const sizeLimitOkButton = document.getElementById('sizeLimitOkButton');
    const sizeLimitCloseButton = sizeLimitModal.querySelector('.close-button1');

    
    // E-mail fixo que não pode ser removido
    const FIXED_EMAIL = `comercial.kz@kidszoneworld.com.br`; // Trocar depois
    
    // const FIXED_EMAIL = `luis.henrique@kidszoneworld.com.br`; // Trocar depois
    let generatedPdfFile = null;
    let additionalFiles = [];


    
    // Expressão regular para validar e-mails
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Função para validar um único e-mail
    function isValidEmail(email) {
        return emailRegex.test(email.trim());
    }


  // Função para validar uma lista de e-mails separados por ";"
    function validateEmailList(emailString) {
        if (!emailString) return true; // Campo vazio é válido (para "Cc")
        const emails = emailString.split(';').map(email => email.trim()).filter(email => email);
        return emails.every(email => isValidEmail(email));
    }
    async function uploadFileToR2(file) {
        const response = await fetch('/generate-upload-url-reb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type
            })
        });

const { uploadUrlReb, key } = await response.json();

        await fetch(uploadUrlReb, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            },
            body: file
        });

        return {
            name: file.name,
            key: key
        };
    }

    // Função para formatar a data no padrão brasileiro (DD-MM-YYYY-hora-HH-MM)
    function formatarDataBrasileira() {
        const agora = new Date();
        const dia = String(agora.getDate()).padStart(2, '0');
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const ano = agora.getFullYear();
        const hora = String(agora.getHours()).padStart(2, '0');
        const minuto = String(agora.getMinutes()).padStart(2, '0');
        return `${dia}-${mes}-${ano}-hora-${hora}-${minuto}`;
    }
     // Mostrar Feedback
    function showFeedback(message) {
        const feedback1 = document.getElementById('feedback1');
        feedback1.style.display = 'block';
        feedback1.textContent = message;
    }

    // Ocultar Feedback
    function hideFeedback() {
        const feedback1 = document.getElementById('feedback1');
        feedback1.style.display = 'none';
        feedback1.textContent = '';
    }

    // Função para calcular o tamanho total dos anexos em MB
    function calcularTamanhoTotal() {
        let totalSize = generatedPdfFile ? generatedPdfFile.size : 0;
        additionalFiles.forEach(file => {
            totalSize += file.size;
        });
        return (totalSize / (1024 * 1024)).toFixed(2);
    }


    
    // Função para atualizar a exibição do tamanho total
    function atualizarTamanhoTotal() {
        const totalSizeMB = calcularTamanhoTotal();
        totalSizeDisplay.textContent = `Tamanho total: ${totalSizeMB} MB`;
    }
    
    // Função para verificar se todos os campos obrigatórios estão preenchidos
        function verificarCamposObrigatorios() {
            const campos = [
                'razao_social',
                'cod_cliente',
                'representante',
                'observation',
            ];
            for (let campo of campos) {
                const input = document.getElementById(campo);
                if (!input.value.trim()) {
                    return false;
                }
            }
            return true;
        }

        // Função para gerar o PDF automaticamente
    async function gerarPDF() {
        const razaoSocial =
            obterValorCampoPdf(
                'razao_social',
                'Cliente'
            );

        const codigoCliente =
            obterValorCampoPdf(
                'cod_cliente',
                ''
            );

        const dataArquivo =
            formatarDataBrasileira();

        const nomeCliente =
            String(
                razaoSocial
            )
                .replace(
                    /[\\/:*?"<>|]/g,
                    ''
                )
                .trim();

        const nomeArquivo =
            `Rebaixa - ` +
            `${nomeCliente} - ` +
            `${codigoCliente} - ` +
            `${dataArquivo}.pdf`;

        let relatorio =
            null;

        try {
            buttonPdf.disabled =
                true;

            showFeedback(
                'Gerando PDF da rebaixa, aguarde...'
            );

            relatorio =
                prepararRebaixaParaPdf();

            const pdfBlob =
                await gerarBlobRebaixaPdf(
                    relatorio
                );

            generatedPdfFile =
                new File(
                    [
                        pdfBlob
                    ],
                    nomeArquivo,
                    {
                        type:
                            'application/pdf'
                    }
                );

            console.log(
                'PDF da rebaixa gerado:',
                {
                    nome:
                        generatedPdfFile.name,

                    tamanho:
                        generatedPdfFile.size
                }
            );

            return generatedPdfFile;
        } catch (error) {
            generatedPdfFile =
                null;

            console.error(
                'Erro ao gerar PDF da rebaixa:',
                error
            );

            alert(
                error.message ||
                'Não foi possível gerar o PDF da rebaixa.'
            );

            return null;
        } finally {
            relatorio?.remove();

            buttonPdf.disabled =
                false;

            hideFeedback();
        }
    }
    
    function atualizarListaAnexos() {
    attachmentList.innerHTML = '';

    // Exibe o PDF gerado (fixo, não removível)
    if (generatedPdfFile) {
        const li = document.createElement('li');
        li.textContent = generatedPdfFile.name;
        attachmentList.appendChild(li);
    }

    // Exibe os arquivos adicionais com botão de exclusão
    additionalFiles.forEach((file, index) => {
        const li = document.createElement('li');
        
        // Cria um contêiner para o nome do arquivo e o botão de exclusão
        const fileContainer = document.createElement('div');
        fileContainer.style.display = 'flex';
        fileContainer.style.alignItems = 'center';

        // Nome do arquivo
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = file.name;
        fileContainer.appendChild(fileNameSpan);

        // Botão de exclusão
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.style.marginLeft = '10px';
        deleteButton.style.color = 'red';
        deleteButton.style.border = 'none';
        deleteButton.style.background = 'none';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.fontWeight = 'bold';

        // Evento de clique para remover o arquivo
        deleteButton.addEventListener('click', () => {
            // Remove o arquivo da lista additionalFiles
            additionalFiles.splice(index, 1);
            // Atualiza os anexos no input de arquivo
            atualizarAnexos();
            // Atualiza a lista visual
            atualizarListaAnexos();
        });

        fileContainer.appendChild(deleteButton);
        li.appendChild(fileContainer);
        attachmentList.appendChild(li);
    });

    // Caso não haja arquivos (nem o PDF gerado, nem adicionais)
    if (!generatedPdfFile && additionalFiles.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum arquivo anexado';
        attachmentList.appendChild(li);
    }

    // Atualiza o tamanho total após atualizar a lista
    atualizarTamanhoTotal();
}


// Função para preencher o modal de e-mail com valores fixos
   function preencherFormularioEmail() {
    const razaoSocial = document.getElementById('razao_social').value || "Cliente";
    const emailRep = document.getElementById('email_rep').value;

    emailToInput.value = FIXED_EMAIL;
    emailToInput.setAttribute('data-fixed', FIXED_EMAIL);

    const fixedSubject = `Rebaixa ${razaoSocial}`;
    emailSubjectInput.value = fixedSubject;
    emailSubjectInput.setAttribute('data-fixed', fixedSubject);

    const fixedMessage = `Segue arquivos solicitados para a rebaixa do cliente ${razaoSocial}\n\n`;
    emailBodyInput.value = fixedMessage;
    emailBodyInput.setAttribute('data-fixed', fixedMessage);

    // 👇 AQUI É O QUE FALTAVA
    if (emailRep) {
        document.getElementById('emailCc').value = emailRep;
    }

    if (generatedPdfFile) {
        atualizarAnexos();
        atualizarListaAnexos();
    }
}

    
    // Função para atualizar os anexos, mantendo o PDF fixo
    function atualizarAnexos() {
        const dataTransfer = new DataTransfer();

        if (generatedPdfFile) {
            dataTransfer.items.add(generatedPdfFile);
        }

        additionalFiles.forEach(file => {
            dataTransfer.items.add(file);
        });

        emailAttachmentInput.files = dataTransfer.files;
        atualizarListaAnexos();
    }

    // Impede a remoção do e-mail fixo no campo "Para"
    emailToInput.addEventListener('input', function(e) {
        const fixedPart = this.getAttribute('data-fixed');
        if (!this.value.includes(fixedPart)) {
            this.value = fixedPart + (this.value ? ';' + this.value : '');
        }
    });

    
    // Impede a remoção do texto fixo no campo "Assunto"
    emailSubjectInput.addEventListener('input', function(e) {
        const fixedPart = this.getAttribute('data-fixed');
        if (!this.value.startsWith(fixedPart)) {
            this.value = fixedPart + (this.value ? ' ' + this.value : '');
        }
    });

    // Impede a remoção do texto fixo no campo "Mensagem"
    emailBodyInput.addEventListener('input', function(e) {
        const fixedPart = this.getAttribute('data-fixed');
        if (!this.value.startsWith(fixedPart)) {
            this.value = fixedPart + this.value;
        }
    });

    // Gerencia os anexos para acumular arquivos
    emailAttachmentInput.addEventListener('change', function(e) {
        const newFiles = Array.from(this.files);
        const novosArquivosAdicionais = newFiles.filter(file => file.name !== generatedPdfFile?.name);
        novosArquivosAdicionais.forEach(newFile => {
            if (!additionalFiles.some(file => file.name === newFile.name)) {
                additionalFiles.push(newFile);
            }
        });
        atualizarAnexos();
    });


     // Ao clicar no botão "ENVIAR E-MAIL COM ANEXOS", verifica os campos obrigatórios antes de gerar o PDF e abrir o modal
    buttonPdf.addEventListener('click', async () => {
        if (!verificarCamposObrigatorios()) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

          
        if (!validarTabelaPedido()) {
            return;
        }

        const arquivoPdf =
            await gerarPDF();

        if (!arquivoPdf) {
            return;
        }

        additionalFiles =
            [];

        preencherFormularioEmail();

        emailModal.style.display =
            'block';
    });

    // Fecha o modal ao clicar no botão de fechar
    emailCloseButton.addEventListener('click', () => {
        emailModal.style.display = 'none';
    });

    // Fecha o modal ao clicar no botão "Cancelar"
    cancelEmailButton.addEventListener('click', () => {
        emailModal.style.display = 'none';
    });

    // Fecha o modal de limite de tamanho ao clicar no botão "OK"
    sizeLimitOkButton.addEventListener('click', () => {
        sizeLimitModal.style.display = 'none';
    });

    // Fecha o modal de limite de tamanho ao clicar no botão de fechar
    sizeLimitCloseButton.addEventListener('click', () => {
        sizeLimitModal.style.display = 'none';
    });

    // Fecha o modal de limite de tamanho ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target == sizeLimitModal) {
            sizeLimitModal.style.display = 'none';
        }
        if (event.target == emailModal) {
            emailModal.style.display = 'none';
        }
    });

    // Envia o e-mail ao clicar no botão "Enviar"
    sendEmailButton.addEventListener('click', async () => {
        await salvarRebaixaMongo();
        let emailTo = emailToInput.value;
        let emailCc = document.getElementById('emailCc').value;
        const emailSubject = emailSubjectInput.value;
        const emailBody = emailBodyInput.value;
        // Verifica se os campos obrigatórios estão preenchidos
        if (!emailTo || !emailSubject || !emailBody) {
            alert('Por favor, preencha os campos obrigatórios (Para, Assunto e Mensagem).');
            return;
        }

        // Valida os e-mails no campo "Para"
        if (!validateEmailList(emailTo)) {
            alert('Por favor, insira e-mails válidos no campo "Para". Use ";" para separar os e-mails.');
            return;
        }

        // Valida os e-mails no campo "Cc"
        if (emailCc && !validateEmailList(emailCc)) {
            alert('Por favor, insira e-mails válidos no campo "Cc". Use ";" para separar os e-mails.');
            return;
        }

       try {
    emailModal.style.display = 'none';
    showFeedback('Estamos enviando o e-mail, aguarde...');

    if (!generatedPdfFile) {
        alert("PDF não gerado.");
        return;
    }
    
    const uploadedPdf = await uploadFileToR2(generatedPdfFile);

// Upload anexos adicionais
const uploadedAttachments = await Promise.all(
    additionalFiles.map(file => uploadFileToR2(file))
);
    const allFiles = [uploadedPdf, ...uploadedAttachments];

const response = await fetch('/send-client-pdf-reb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        files: allFiles,
        razaoSocial: document.getElementById('razao_social').value || "Cliente",
        emailTo,
        emailCc,
        subject: emailSubject,
        message: emailBody
    })
    });


     const result = await response.text();

    if (response.ok) {
        alert('E-mail enviado com sucesso!');
        document.getElementById('emailForm').reset();
        generatedPdfFile = null;
    } else {
        throw new Error(result);
    }

} catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    alert('Erro ao enviar o e-mail: ' + error.message);
} finally {
    hideFeedback();
    window.location.reload();
}
});
});



// ======================================================================
// 🧩 MODAIS AJUDA
// ======================================================================
document.addEventListener("DOMContentLoaded", () => {
    el('helpIcon').onclick = () => {
        el('overlay').style.display = 'block';
        el('helpModal').style.display = 'block';
    };


});

//tutorial


const tutorialSteps = [

    {
        element: '#cnpj',
        text: 'Passo 1. Informe o CNPJ do cliente.\n\n As demais informações serão carregadas automaticamente.\n\nClique em próximo para continuar com o tutorial ou pressione finalizar para sair'
    },
    {
        element: '#observation',
        text: 'Passo 2. Informe o motivo da rebaixa.'
    },
    {
        element: '#dadosPedido',
        text: "Passo 3. Adicione os itens a sofrerem rebaixas, preenchendo TODOS os campos:\n" +
            "- NF de origem\n" +
            "- Código do item (carrega automaticamente a descrição)\n" +
            "- Lote\n" +
            "- Quantidade (em unidade)\n" +
            "- Valor unitário\n\n" 
    },    
    {
        element: '#button_pdf',
        text: "Passo 4. Clique em 'Enviar por e-mail'.\n" +
            "Anexe os arquivos dos itens que sofreram rebaixa e, se necessário, adicione destinatários em cópia (CC) separando os emails por ;.\n\n"
    }
];

function bloquearCamposDuranteTutorial(){

    tutorialAtivo =
        true;

    const campos =
        document.querySelectorAll(
            'input, textarea, select, button'
        );

    campos.forEach(campo => {

        if(
            campo.closest('#tutorialBox') ||
            campo.closest('#tutorialOverlay')
        ){
            return;
        }

        if(!estadosCamposTutorial.has(campo)){

            estadosCamposTutorial.set(
                campo,
                {
                    disabled: campo.disabled,
                    readOnly: campo.readOnly || false,
                    pointerEvents: campo.style.pointerEvents || '',
                    cursor: campo.style.cursor || '',
                    tabIndex: campo.getAttribute('tabindex')
                }
            );

        }

        campo.disabled =
            true;

        if(
            campo.tagName === 'INPUT' ||
            campo.tagName === 'TEXTAREA'
        ){

            campo.readOnly =
                true;

        }

        campo.style.pointerEvents =
            'none';

        campo.style.cursor =
            'not-allowed';

        campo.setAttribute(
            'tabindex',
            '-1'
        );

    });

}

function liberarCamposAposTutorial(){

    tutorialAtivo =
        false;

    estadosCamposTutorial.forEach((estado, campo) => {

        campo.disabled =
            estado.disabled;

        if(
            campo.tagName === 'INPUT' ||
            campo.tagName === 'TEXTAREA'
        ){

            campo.readOnly =
                estado.readOnly;

        }

        campo.style.pointerEvents =
            estado.pointerEvents;

        campo.style.cursor =
            estado.cursor;

        if(estado.tabIndex === null){

            campo.removeAttribute(
                'tabindex'
            );

        }else{

            campo.setAttribute(
                'tabindex',
                estado.tabIndex
            );

        }

    });

    estadosCamposTutorial.clear();

}

function bloquearEventosForaDoTutorial(){

    document.addEventListener(
        'click',
        function(e){

            if(
                tutorialAtivo &&
                !e.target.closest('#tutorialBox')
            ){

                e.preventDefault();
                e.stopPropagation();

            }

        },
        true
    );

    document.addEventListener(
        'keydown',
        function(e){

            if(
                tutorialAtivo &&
                !e.target.closest('#tutorialBox')
            ){

                e.preventDefault();
                e.stopPropagation();

            }

        },
        true
    );

}

function iniciarTutorial(){

    step =
        0;

    bloquearEventosForaDoTutorial();

    bloquearCamposDuranteTutorial();

    showStep();

}

function showStep(){

    console.log(
        'step ' + step
    );
    bloquearCamposDuranteTutorial();

    const overlay =
        document.getElementById(
            'tutorialOverlay'
        );

    const box =
        document.getElementById(
            'tutorialBox'
        );

    const text =
        document.getElementById(
            'tutorialText'
        );

    if(
        !overlay ||
        !box ||
        !text
    ){

        console.error(
            'Elementos do tutorial não encontrados.'
        );

        return;

    }

    document
    .querySelectorAll(
        '.highlight'
    )
    .forEach(el => {

        el.classList.remove(
            'highlight'
        );

    });

    const stepData =
        tutorialSteps[step];

    const element =
        document.querySelector(
            stepData.element
        );

    if(!element){

        console.error(
            'Elemento do passo não encontrado:',
            stepData.element
        );

        return;

    }

    element.classList.add(
        'highlight'
    );

    overlay.style.display =
        'block';

    box.style.display =
        'block';

    text.innerText =
        stepData.text;

    if(step === 0){

        window.scrollTo({
            top: 0, behavior: 'smooth' });

        setTimeout(() => {
            const rect = element.getBoundingClientRect();

            box.style.top = (rect.bottom + window.scrollY + 10) + 'px';
            box.style.left = (rect.left + window.scrollX) + 'px';

            text.innerText = stepData.text;
            overlay.style.display = 'block';
        }, 100); // tempo maior pra garantir render

    }

    // outros steps
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });

    setTimeout(() => {
        const rect = element.getBoundingClientRect();

        box.style.top = (rect.bottom + window.scrollY + 10) + 'px';
        box.style.left = (rect.left + window.scrollX) + 'px';

        text.innerText = stepData.text;
        overlay.style.display = 'block';
    }, 300);

}

function nextStep() {
    if (step < tutorialSteps.length - 1) {
        step++;
        showStep();
    } else {
        endTutorial();
    }
}

function prevStep() {
    if (step > 0) {
        step--;
        showStep();
    }
}

function endTutorial(){

    document.getElementById(
        'tutorialOverlay'
    ).style.display =
        'none';

    document.getElementById(
        'tutorialBox'
    ).style.display =
        'none';

    document
    .querySelectorAll(
        '.highlight'
    )
    .forEach(el => {

        el.classList.remove(
            'highlight'
        );

    });

    liberarCamposAposTutorial();

    step =
        0;

}

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const botaoTutorial =
            document.getElementById(
                'iniciarTutorial'
            );

        if(botaoTutorial){

            botaoTutorial.addEventListener(
                'click',
                iniciarTutorial
            );

        }

    }
);