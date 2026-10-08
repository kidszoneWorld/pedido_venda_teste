const timestamp = Date.now();
// ======================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ======================================================================
let clientesData;
let promocaoData;
let foraDeLinhaData;
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

let icmsSTData;
let listaPrecosIpiData;
  
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
    if (valor === true) {
        return true;
    }

    if (valor === false) {
        return false;
    }

    if (valor === 1) {
        return true;
    }

    if (valor === 0) {
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

function itemPodeAparecerNaLista(
    item
) {
    if (!item) {
        return false;
    }

    const ativo =
        converterParaBooleano(
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
        item.exibeConsultasListaPreco === undefined ||
        item.exibeConsultasListaPreco === null
            ? true
            : converterParaBooleano(
                item.exibeConsultasListaPreco
            );

    const descricao =
        String(
            item.descricao || ''
        )
            .normalize(
                'NFD'
            )
            .replace(
                /[\u0300-\u036f]/g,
                ''
            )
            .trim()
            .toLowerCase();

    const descricaoBloqueada =
        descricao.includes(
            'display'
        ) ||
        descricao.includes(
            'bobina'
        )
        ||
        descricao.includes(
            'CATÁLOGO'
        )
                ||
        descricao.includes(
            'CAMISETA'
        )
        ||
        descricao.includes(
            'Scooter'
        )
        ||
        descricao.includes(
            'SACOLA'
        )
        ||
        descricao.includes(
            'Patinete'
        )||
        descricao.includes(
            'LCD'
        )||
        descricao.includes(
            'BICICLETA'
        )
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
            'Consultando catálogo da devolução:',
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

        criarDatalistCatalogo();

        console.log(
            'Catálogo da devolução carregado:',
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
            'Erro ao carregar catálogo da devolução:',
            error
        );

        throw error;
    } finally {
        catalogoClienteCarregando =
            false;

        hideFeedback();
    }
}

function criarDatalistCatalogo() {
    let datalist =
        document.getElementById(
            'lista-produtos-cliente'
        );

    if (!datalist) {
        datalist =
            document.createElement(
                'datalist'
            );

        datalist.id =
            'lista-produtos-cliente';

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
                    item.itemEmpresaId || ''
                ).trim();

            const descricao =
                String(
                    item.descricao || ''
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
        texto.toUpperCase();

    const correspondencias =
        catalogoClienteData.filter(
            item => {
                const descricao =
                    String(
                        item.descricao || ''
                    )
                        .trim()
                        .toUpperCase();

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

function linhaDevolucaoEstaVazia(
    tr
) {
    if (!tr) {
        return true;
    }

    const campoItem =
        tr.querySelector(
            '.campo-item-pesquisa'
        );

    const possuiCodigo =
        Boolean(
            String(
                tr.dataset.itemEmpresaId || ''
            ).trim()
        );

    const possuiPesquisa =
        Boolean(
            String(
                campoItem?.value || ''
            ).trim()
        );

    return (
        !possuiCodigo &&
        !possuiPesquisa
    );
}

function obterProximaLinhaDevolucao(
    linhaAtual
) {
    if (!linhaAtual) {
        return null;
    }

    const proximaLinha =
        linhaAtual.nextElementSibling;

    if (
        proximaLinha &&
        proximaLinha.classList.contains(
            'linha-item-devolucao'
        )
    ) {
        return proximaLinha;
    }

    return adicionarNovaLinha();
}

function finalizarPrecoLinhaDevolucao(
    tr,
    campoPreco
) {
    const valor =
        converterNumero(
            campoPreco.value
        );

    if (valor <= 0) {
        campoPreco.value =
            '';

        campoPreco.focus();

        alert(
            'Informe um preço unitário válido.'
        );

        return false;
    }

    campoPreco.value =
        formatarMoeda(
            valor
        );

    recalcularLinhaDevolucao(
        tr
    );

    return true;
}

function configurarLinhaDevolucao(
    tr
) {
    const campoPesquisa =
        tr.querySelector(
            '.campo-item-pesquisa'
        );

    const campoLote =
        tr.querySelector(
            '.campo-lote-item'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const campoPreco =
        tr.querySelector(
            '.campo-preco-unitario-item'
        );

    const botaoRemover =
        tr.querySelector(
            '.btn-remover-linha'
        );

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

            const itemDuplicado =
                Array.from(
                    document.querySelectorAll(
                        '#dadosPedido tbody .linha-item-devolucao'
                    )
                ).some(
                    linha => {
                        return (
                            linha !== tr &&
                            normalizarCodigoItem(
                                linha.dataset.itemEmpresaId
                            ) === codigo
                        );
                    }
                );

            if (itemDuplicado) {
                throw new Error(
                    'Este item já foi adicionado à devolução.'
                );
            }

            preencherLinhaDevolucao(
                tr,
                item
            );

            setTimeout(
                () => {
                    campoLote.focus();
                    campoLote.select();
                },
                0
            );
            return true;
        } catch (error) {
            console.error(
                'Erro ao carregar item da devolução:',
                error
            );

            campoPesquisa.value =
                '';

            campoQuantidade.value =
                '';

            campoQuantidade.readOnly =
                true;

            campoPreco.value =
                '';

            campoPreco.readOnly =
                true;

            tr.dataset.itemId =
                '';

            tr.dataset.itemEmpresaId =
                '';

            tr.dataset.codigo =
                '';

            tr.dataset.descricao =
                '';

            tr.dataset.ipi =
                '';

            alert(
                error.message ||
                'Item indisponível.'
            );

            setTimeout(
                () => {
                    campoPesquisa.focus();
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

    campoPesquisa.addEventListener(
        'input',
        () => {
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
        processarItem
    );

    campoPesquisa.addEventListener(
        'blur',
        () => {
            if (
                campoPesquisa.value.trim() &&
                !tr.dataset.itemId
            ) {
                processarItem();
            }
        }
    );

    campoPesquisa.addEventListener(
        'keydown',
        evento => {
            if (
                evento.key !== 'Enter' &&
                evento.key !== 'Tab'
            ) {
                return;
            }

            if (evento.shiftKey) {
                return;
            }

            evento.preventDefault();

            processarItem();
        }
    );

    campoQuantidade.addEventListener(
        'input',
        () => {
            recalcularLinhaDevolucao(
                tr
            );
        }
    );

    campoPreco.addEventListener(
        'input',
        () => {
            tr.dataset.linhaFinalizada =
                'false';

            recalcularLinhaDevolucao(
                tr
            );
        }
    );

    campoPreco.addEventListener(
        'blur',
        () => {
            const valor =
                converterNumero(
                    campoPreco.value
                );

            if (valor <= 0) {
                campoPreco.value =
                    '';

                recalcularLinhaDevolucao(
                    tr
                );

                return;
            }

            campoPreco.value =
                formatarMoeda(
                    valor
                );

            recalcularLinhaDevolucao(
                tr
            );
        }
    );

    campoPreco.addEventListener(
        'keydown',
        evento => {
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

            const linhaFinalizada =
                finalizarPrecoLinhaDevolucao(
                    tr,
                    campoPreco
                );

            if (!linhaFinalizada) {
                return;
            }

            let proximaLinha =
                tr.nextElementSibling;

            if (
                !proximaLinha ||
                !proximaLinha.classList.contains(
                    'linha-item-devolucao'
                )
            ) {
                proximaLinha =
                    adicionarNovaLinha();
            }

            tr.dataset.linhaFinalizada =
                'true';

            const campoNfProximaLinha =
                proximaLinha?.querySelector(
                    '.campo-nf-origem'
                );

            setTimeout(
                () => {
                    campoNfProximaLinha?.focus();
                    campoNfProximaLinha?.select();
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
}

console.log('script.js carregado');

//run once

//  limparCamposCliente();
//  atualizarTotais();
alert('Olá Sr(a).Representante,\nSomente serão aceitas devoluções com até 180 dias, a partir do faturamento da nota fiscal de origem!!!')
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


cnpjInput1.addEventListener('focus', () => {
    if (cnpjInput1.readOnly) {
        blockModal.style.display = "block";
        el('timestamp').textContent = new Date().toLocaleString('pt-BR');
        return;
    }
   // limparCamposCliente();
});

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

    } catch {
        alert("Cliente não encontrado, verificar com o financeiro.");
    } finally {
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

    }   catch (error) {
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
    atualizarTotalProdutosIpi();
}

function garantirLinhaInicial() {
    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    if (!tbody) {
        console.error(
            'O corpo da tabela não foi encontrado.'
        );

        return;
    }

    const linhas =
        tbody.querySelectorAll(
            '.linha-item-devolucao'
        );

    if (linhas.length === 0) {
        adicionarNovaLinha();
    }
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

//mongo
const dataBR = new Date()
const dataFormatada = dataBR.toLocaleDateString('pt-BR', {
    timeZone: 'UTC'
});

function montarObjetoDevolucao() {
    const linhas =
        document.querySelectorAll(
            '#dadosPedido tbody tr'
        );

    const produtos =
        [];

    linhas.forEach(
    tr => {
        const codigo =
            String(
                tr.dataset.itemEmpresaId || ''
            ).trim();
            if (!codigo) {
                return;
            }

        produtos.push({
            nforigem:
                tr.querySelector(
                    '.campo-nf-origem'
                )?.value || '',

            data:
                tr.querySelector(
                    '.campo-data-nf'
                )?.value || '',

            codigoItem:
                codigo,

            descricao:
                String(
                    tr.dataset.descricao || ''
                ).trim(),

            lote:
                tr.querySelector(
                    '.campo-lote-item'
                )?.value || '',

            quantidade:
                converterNumero(
                    tr.querySelector(
                        '.campo-quantidade-item'
                    )?.value
                ),

            uv:
               obterUvDevolucao(),

            precoUnitario:
                converterNumero(
                    tr.dataset.precoUnitario
                ),

            ipi:
                converterNumero(
                    tr.dataset.percentualIpi
                ),

            precoUnitarioIPI:
                converterNumero(
                    tr.dataset.precoUnitarioIpi
                ),

            total:
                converterNumero(
                    tr.dataset.total
                ),
                
            totalIpi:
                converterNumero(
                        tr.dataset.totalIpi
                    ),

            itemId:
                Number(
                    tr.dataset.itemId || 0
                )
        });
    }
);

    return {
        movimentaEstoque:
            obterMovimentaEstoque(),

        cnpj:
            document
                .getElementById(
                    'cnpj'
                )
                .value
                .replace(
                    /\D/g,
                    ''
                ),

        razaosocial:
            document
                .getElementById(
                    'razao_social'
                )
                .value,

        endereco:
            document
                .getElementById(
                    'endereco'
                )
                .value,

        cidade:
            document
                .getElementById(
                    'cidade'
                )
                .value,

        Cep:
            document
                .getElementById(
                    'cep'
                )
                .value,

        email:
            document
                .getElementById(
                    'email'
                )
                .value,

        representante:
            document
                .getElementById(
                    'representante'
                )
                .value,

        codCliente:
            Number(
                document
                    .getElementById(
                        'cod_cliente'
                    )
                    .value
            ),

        bairro:
            document
                .getElementById(
                    'bairro'
                )
                .value,

        uf:
            document
                .getElementById(
                    'uf'
                )
                .value,

        telefone:
            document
                .getElementById(
                    'telefone'
                )
                .value,

        emailFiscal:
            document
                .getElementById(
                    'email_fiscal'
                )
                .value,

        data:
            dataFormatada,

        motivo:
            document
                .getElementById(
                    'observation'
                )
                .value,

        status:
            'pendente',

        finalizado:
            0,

        nfVinculada:
            '',

        produtos:
            produtos
    };
}

async function salvarDevolucaoMongo() {
    if (!validarTabelaPedido()) {
        return false;
    }

    const dados =
        montarObjetoDevolucao();

    try {
        const response =
            await fetch(
                '/api/devolucao',
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            dados
                        )
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
                resultado = {
                    error:
                        textoResposta
                };
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.error ||
                resultado?.message ||
                textoResposta ||
                `Erro HTTP ${response.status}`
            );
        }

        console.log(
            'Devolução salva:',
            resultado
        );

        return true;
    } catch (error) {
        console.error(
            'Erro ao salvar devolução:',
            error
        );

        alert(
            error.message ||
            'Erro ao salvar devolução.'
        );

        return false;
    }
}

async function gerarPdfNoNavegador(
    elemento,
    nomeArquivo
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

    if (!elemento) {
        throw new Error(
            'O relatório da devolução não foi criado.'
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

    console.log(
        'Dimensões do relatório:',
        {
            larguraCaptura:
                larguraCaptura,

            alturaCaptura:
                alturaCaptura
        }
    );

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

    const x =
        (
            larguraPagina -
            larguraFinal
        ) /
        2;

    const y =
        margem;

    pdf.addImage(
        canvas.toDataURL(
            'image/jpeg',
            0.96
        ),
        'JPEG',
        x,
        y,
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
            'O PDF foi gerado vazio.'
        );
    }

    console.log(
        'PDF gerado:',
        {
            nomeArquivo:
                nomeArquivo,

            larguraFinal:
                larguraFinal,

            alturaFinal:
                alturaFinal,

            tamanho:
                blob.size
        }
    );

    return blob;
}

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
            campo?.value || ''
        ).trim();

    return valor ||
        valorPadrao;
}

function converterCamposParaTextoPdf(
    clone
) {
    const campos =
        Array.from(
            clone.querySelectorAll(
                'input, textarea, select'
            )
        );

    campos.forEach(
        campo => {
            if (
                campo.type ===
                'hidden'
            ) {
                campo.remove();

                return;
            }

            if (
                campo.type ===
                'checkbox'
            ) {
                const textoCheckbox =
                    document.createElement(
                        'span'
                    );

                textoCheckbox.className =
                    'valor-checkbox-pdf';

                textoCheckbox.textContent =
                    campo.checked
                        ? 'Sim'
                        : 'Não';

                campo.replaceWith(
                    textoCheckbox
                );

                return;
            }

            let valor =
                '';

            if (
                campo.tagName ===
                'SELECT'
            ) {
                valor =
                    campo.options[
                        campo.selectedIndex
                    ]?.textContent || '';
            } else {
                valor =
                    campo.value || '';
            }

            const texto =
                document.createElement(
                    campo.tagName ===
                        'TEXTAREA'
                        ? 'div'
                        : 'span'
                );

            texto.className =
                campo.tagName ===
                    'TEXTAREA'
                    ? 'valor-textarea-pdf'
                    : 'valor-campo-pdf';

            texto.textContent =
                valor || '-';

            campo.replaceWith(
                texto
            );
        }
    );
}

function organizarCabecalhoPdf(
    clone
) {
    const cabecalho =
        clone.querySelector(
            '.header'
        );

    if (!cabecalho) {
        return;
    }

    cabecalho.classList.add(
        'cabecalho-relatorio-pdf'
    );

    const titulo =
        cabecalho.querySelector(
            'h1'
        );

    if (titulo) {
        titulo.textContent =
            'DEVOLUÇÃO DE PRODUTOS';
    }

    const logo =
        cabecalho.querySelector(
            'img'
        );

    if (logo) {
        logo.style.width =
            '145px';

        logo.style.height =
            'auto';

        logo.style.objectFit =
            'contain';
    }
}

function organizarDadosClientePdf(
    clone
) {
    const formulario =
        clone.querySelector(
            '.form-group'
        );

    if (!formulario) {
        return;
    }

    formulario.classList.add(
        'dados-cliente-pdf'
    );

    const elementos =
        Array.from(
            formulario.children
        );

    const grade =
        document.createElement(
            'div'
        );

    grade.className =
        'grade-cliente-pdf';

    for (
        let indice = 0;
        indice < elementos.length;
        indice += 2
    ) {
        const label =
            elementos[indice];

        const valor =
            elementos[
                indice + 1
            ];

        if (
            !label ||
            label.classList.contains(
                'esconder'
            )
        ) {
            continue;
        }

        const campo =
            document.createElement(
                'div'
            );

        campo.className =
            'campo-cliente-pdf';

        const titulo =
            document.createElement(
                'strong'
            );

        titulo.textContent =
            String(
                label.textContent || ''
            )
                .replace(
                    'Campo Obrigatório',
                    ''
                )
                .trim();

        const conteudo =
            document.createElement(
                'span'
            );

        conteudo.textContent =
            String(
                valor?.textContent || '-'
            ).trim() || '-';

        campo.appendChild(
            titulo
        );

        campo.appendChild(
            conteudo
        );

        grade.appendChild(
            campo
        );
    }

    formulario.replaceWith(
        grade
    );
}

function organizarTabelaPdf(
    clone
) {
    const tabela =
        clone.querySelector(
            '#dadosPedido'
        );

    if (!tabela) {
        return;
    }

    tabela.classList.add(
        'tabela-devolucao-pdf'
    );

    const cabecalhos =
        tabela.querySelectorAll(
            'thead th'
        );

    const larguras = [
        '7%',
        '8%',
        '22%',
        '8%',
        '5%',
        '4%',
        '9%',
        '6%',
        '9%',
        '9%',
        '9%'
    ];

    cabecalhos.forEach(
        (
            cabecalho,
            indice
        ) => {
            cabecalho.style.width =
                larguras[indice] ||
                '8%';
        }
    );

    tabela
        .querySelectorAll(
            '.campo-item-pesquisa'
        )
        .forEach(
            campo => {
                campo.style.whiteSpace =
                    'normal';
            }
        );
}

function criarCabecalhoPdf() {
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

        logo.removeAttribute(
            'width'
        );

        logo.removeAttribute(
            'height'
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
        'DEVOLUÇÃO DE PRODUTOS';

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
        valor || '-';

    campo.appendChild(
        titulo
    );

    campo.appendChild(
        conteudo
    );

    return campo;
}

function criarDadosClientePdf() {
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
            'CÓDIGO REP',
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

    const movimentaEstoque =
        document.getElementById(
            'movimentaEstoque'
        )?.checked
            ? 'Sim'
            : 'Não';

    grade.appendChild(
        criarCampoClientePdf(
            'MOVIMENTA ESTOQUE',
            movimentaEstoque
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

function criarMotivoPdf() {
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
        'MOTIVO DA DEVOLUÇÃO';

    const texto =
        document.createElement(
            'div'
        );

    texto.className =
        'pdf-motivo-texto';

    texto.textContent =
        obterValorCampoPdf(
            'observation',
            '-'
        );

    secao.appendChild(
        titulo
    );

    secao.appendChild(
        texto
    );

    return secao;
}

function criarCelulaPdf(
    texto,
    classe = ''
) {
    const td =
        document.createElement(
            'td'
        );

    td.className =
        classe;

    td.textContent =
        String(
            texto ?? ''
        ).trim() || '-';

    return td;
}

function obterValorLinhaPdf(
    tr,
    seletor,
    valorPadrao = '-'
) {
    const campo =
        tr.querySelector(
            seletor
        );

    const valor =
        String(
            campo?.value || ''
        ).trim();

    return valor ||
        valorPadrao;
}

function criarTabelaItensPdf() {
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
        'DADOS DEVOLUÇÃO';

    const tabela =
        document.createElement(
            'table'
        );

    tabela.className =
        'pdf-tabela-itens';

    const colgroup =
        document.createElement(
            'colgroup'
        );

    const larguras = [
        '8%',
        '9%',
        '24%',
        '8%',
        '5%',
        '4%',
        '9%',
        '6%',
        '9%',
        '9%',
        '9%'
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
        'DATA NF',
        'CÓDIGO / DESCRIÇÃO',
        'LOTE',
        'QTD',
        'UV',
        'R$ UNITÁRIO SEM IMPOSTOS',
        '% IPI',
        'R$ UNITÁRIO COM IPI',
        'TOTAL R$',
        'TOTAL COM IPI R$'
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
            '.linha-item-devolucao'
        );

    linhas.forEach(
        tr => {
            const codigo =
                String(
                    tr.dataset
                        .itemEmpresaId ||
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

            const linha =
                document.createElement(
                    'tr'
                );

            linha.appendChild(
                criarCelulaPdf(
                    obterValorLinhaPdf(
                        tr,
                        '.campo-nf-origem'
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarDataPdf(
                        obterValorLinhaPdf(
                            tr,
                            '.campo-data-nf',
                            ''
                        )
                    )
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
                    obterValorLinhaPdf(
                        tr,
                        '.campo-lote-item'
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    obterValorLinhaPdf(
                        tr,
                        '.campo-quantidade-item'
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    obterValorLinhaPdf(
                        tr,
                        '.campo-unidade-item'
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoeda(
                        converterNumero(
                            tr.dataset
                                .precoUnitario
                        )
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarPercentual(
                        converterNumero(
                            tr.dataset
                                .percentualIpi
                        )
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoeda(
                        converterNumero(
                            tr.dataset
                                .precoUnitarioIpi ??
                            tr.dataset
                                .PrecoUnitarioIPI
                        )
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoeda(
                        converterNumero(
                            tr.dataset.total
                        )
                    )
                )
            );

            linha.appendChild(
                criarCelulaPdf(
                    formatarMoeda(
                        converterNumero(
                            tr.dataset.totalIpi
                        )
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

function formatarDataPdf(
    valor
) {
    if (!valor) {
        return '-';
    }

    const partes =
        String(
            valor
        ).split(
            '-'
        );

    if (partes.length !== 3) {
        return valor;
    }

    return (
        `${partes[2]}/` +
        `${partes[1]}/` +
        `${partes[0]}`
    );
}

function criarCampoTotalPdf(
    rotulo,
    valor
) {
    const campo =
        document.createElement(
            'div'
        );

    campo.className =
        'pdf-total-campo';

    const label =
        document.createElement(
            'strong'
        );

    label.textContent =
        rotulo;

    const conteudo =
        document.createElement(
            'span'
        );

    conteudo.textContent =
        valor;

    campo.appendChild(
        label
    );

    campo.appendChild(
        conteudo
    );

    return campo;
}

function criarTotaisPdf() {
    const totais =
        document.createElement(
            'div'
        );

    totais.className =
        'pdf-totais';

    totais.appendChild(
        criarCampoTotalPdf(
            'VOLUMES',
            obterValorCampoPdf(
                'volume',
                '0'
            )
        )
    );

    totais.appendChild(
        criarCampoTotalPdf(
            'TOTAL PRODUTOS',
            obterValorCampoPdf(
                'total',
                'R$ 0,00'
            )
        )
    );

    totais.appendChild(
        criarCampoTotalPdf(
            'TOTAL PRODUTOS COM IPI',
            obterValorCampoPdf(
                'totalIpi',
                'R$ 0,00'
            )
        )
    );

    return totais;
}

function prepararDevolucaoParaPdf() {
    const relatorio =
        document.createElement(
            'div'
        );

    relatorio.className =
        'relatorio-devolucao-pdf';

    const cabecalho =
        criarCabecalhoPdf();

    const dadosCliente =
        criarDadosClientePdf();

    const motivo =
        criarMotivoPdf();

    const tabela =
        criarTabelaItensPdf();

    const totais =
        criarTotaisPdf();

    relatorio.appendChild(
        cabecalho
    );

    relatorio.appendChild(
        dadosCliente
    );

    relatorio.appendChild(
        motivo
    );

    relatorio.appendChild(
        tabela
    );

    relatorio.appendChild(
        totais
    );

    document.body.appendChild(
        relatorio
    );

    return relatorio;
}

function removerLinhasVaziasPdf(
    clone
) {
    clone
        .querySelectorAll(
            '#dadosPedido tbody tr'
        )
        .forEach(
            linha => {
                const campoItem =
                    linha.querySelector(
                        '.campo-item-pesquisa'
                    );

                const itemPreenchido =
                    String(
                        campoItem?.value ||
                        ''
                    ).trim();

                if (!itemPreenchido) {
                    linha.remove();
                }
            }
        );
}

function substituirObservacaoPdf(
    containerOriginal,
    clone
) {
    const observacaoOriginal =
        containerOriginal
            .querySelector(
                '#observation'
            );

    const observacaoClone =
        clone.querySelector(
            '#observation'
        );

    if (
        !observacaoOriginal ||
        !observacaoClone
    ) {
        return;
    }

    const observacaoPdf =
        document.createElement(
            'div'
        );

    observacaoPdf.id =
        'observation-pdf';

    observacaoPdf.className =
        'observacao-pdf';

    observacaoPdf.textContent =
        observacaoOriginal.value ||
        '';

    observacaoPdf.style.whiteSpace =
        'pre-wrap';

    observacaoPdf.style.overflowWrap =
        'anywhere';

    observacaoPdf.style.minHeight =
        '70px';

    observacaoPdf.style.padding =
        '10px';

    observacaoPdf.style.border =
        '1px solid #000000';

    observacaoPdf.style.backgroundColor =
        '#ffffff';

    observacaoPdf.style.color =
        '#000000';

    observacaoClone.replaceWith(
        observacaoPdf
    );
}

function configurarContainerPdf(
    clone
) {
    clone.style.setProperty(
        'position',
        'fixed',
        'important'
    );

    clone.style.setProperty(
        'top',
        '0',
        'important'
    );

    clone.style.setProperty(
        'left',
        '-100000px',
        'important'
    );

    clone.style.setProperty(
        'width',
        '1120px',
        'important'
    );

    clone.style.setProperty(
        'min-width',
        '1120px',
        'important'
    );

    clone.style.setProperty(
        'max-width',
        '1120px',
        'important'
    );

    clone.style.setProperty(
        'padding',
        '18px',
        'important'
    );

    clone.style.setProperty(
        'margin',
        '0',
        'important'
    );

    clone.style.setProperty(
        'display',
        'block',
        'important'
    );

    clone.style.setProperty(
        'visibility',
        'visible',
        'important'
    );

    clone.style.setProperty(
        'opacity',
        '1',
        'important'
    );

    clone.style.setProperty(
        'overflow',
        'visible',
        'important'
    );

    clone.style.setProperty(
        'background',
        '#ffffff',
        'important'
    );

    clone.style.setProperty(
        'color',
        '#000000',
        'important'
    );

    clone.style.setProperty(
        'box-sizing',
        'border-box',
        'important'
    );

    clone.style.setProperty(
        'z-index',
        '-1',
        'important'
    );
}

function copiarValoresParaClonePdf(
    containerOriginal,
    clone
) {
    const camposOriginais =
        containerOriginal
            .querySelectorAll(
                'input, textarea, select'
            );

    const camposClone =
        clone.querySelectorAll(
            'input, textarea, select'
        );

    camposOriginais.forEach(
        (
            campoOriginal,
            indice
        ) => {
            const campoClone =
                camposClone[
                    indice
                ];

            if (!campoClone) {
                return;
            }

            if (
                campoOriginal.type ===
                    'checkbox' ||
                campoOriginal.type ===
                    'radio'
            ) {
                campoClone.checked =
                    campoOriginal.checked;

                if (
                    campoOriginal.checked
                ) {
                    campoClone.setAttribute(
                        'checked',
                        'checked'
                    );
                } else {
                    campoClone.removeAttribute(
                        'checked'
                    );
                }

                return;
            }

            campoClone.value =
                campoOriginal.value;

            campoClone.setAttribute(
                'value',
                campoOriginal.value
            );

            if (
                campoOriginal.tagName ===
                'TEXTAREA'
            ) {
                campoClone.textContent =
                    campoOriginal.value;

                campoClone.style.whiteSpace =
                    'pre-wrap';
            }

            if (
                campoOriginal.tagName ===
                'SELECT'
            ) {
                campoClone.selectedIndex =
                    campoOriginal
                        .selectedIndex;

                Array.from(
                    campoClone.options
                ).forEach(
                    (
                        opcao,
                        indiceOpcao
                    ) => {
                        opcao.selected =
                            indiceOpcao ===
                            campoOriginal
                                .selectedIndex;
                    }
                );
            }
        }
    );
}
function removerElementosInterativosPdf(
    clone
) {
    const seletoresRemover = [
        '.no-print',
        '.button-group',
        '.btn-remover-linha',
        '.celula-excluir-item',
        '.esconder',
        '#esconder',
        '[hidden]',
        'input[type="hidden"]',
        '#helpContainer',
        '#emailModalDevolucao',
        '#sizeLimitModal',
        '#tutorialOverlay',
        '#tutorialBox',
        '#feedback1',
        '#excluirLinha',
        '#adicionarLinha',
        '#button_pdf',
        '#iniciarTutorial',
        '#emailForm',
        '.modal',
        '.modal1'
    ];

    clone
        .querySelectorAll(
            seletoresRemover.join(
                ','
            )
        )
        .forEach(
            elemento => {
                elemento.remove();
            }
        );
}

// Função para atualizar o total de volumes (quantidades) de todas as linhas
function atualizarTotalVolumes() {
    let totalVolumes =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody .linha-item-devolucao'
        )
        .forEach(
            tr => {
                const quantidade =
                    converterNumero(
                        tr.querySelector(
                            '.campo-quantidade-item'
                        )?.value
                    );

                totalVolumes +=
                    quantidade;
            }
        );

    document
        .getElementById(
            'volume'
        )
        .value =
            totalVolumes;
}

function atualizarTotalProdutos() {
    let totalProdutos =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody .linha-item-devolucao'
        )
        .forEach(
            tr => {
                totalProdutos +=
                    converterNumero(
                        tr.dataset.total
                    );
            }
        );

    document
        .getElementById(
            'total'
        )
        .value =
            formatarMoeda(
                totalProdutos
            );
}

function atualizarTotalProdutosIpi() {
    let totalProdutosIpi =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody .linha-item-devolucao'
        )
        .forEach(
            tr => {
                totalProdutosIpi +=
                    converterNumero(
                        tr.dataset.totalIpi
                    );
            }
        );

    document
        .getElementById(
            'totalIpi'
        )
        .value =
            formatarMoeda(
                totalProdutosIpi
            );
}



function dataMaiorQue6Meses(dataInput) {
    const dataSelecionada = new Date(dataInput);
    const hoje = new Date();
    const limite = new Date();
    limite.setMonth(limite.getMonth() - 6); // volta 6 meses

    return dataSelecionada < limite;
}

function validarTabelaPedido() {
    const todasAsLinhas =
        Array.from(
            document.querySelectorAll(
                '#dadosPedido tbody ' +
                '.linha-item-devolucao'
            )
        );

    const linhasPreenchidas =
        todasAsLinhas.filter(
            tr => {
                return Boolean(
                    String(
                        tr.dataset.itemEmpresaId || ''
                    ).trim()
                );
            }
        );

    if (
        linhasPreenchidas.length === 0
    ) {
        alert(
            'Adicione pelo menos um item na devolução.'
        );

        return false;
    }

    for (
        let indice = 0;
        indice < linhasPreenchidas.length;
        indice += 1
    ) {
        const tr =
            linhasPreenchidas[
                indice
            ];

        const nf =
            tr.querySelector(
                '.campo-nf-origem'
            )?.value.trim();

        const data =
            tr.querySelector(
                '.campo-data-nf'
            )?.value.trim();

        const codigo =
            String(
                tr.dataset.itemEmpresaId || ''
            ).trim();
            
        if (!codigo) {
            return;
        }

        const lote =
            tr.querySelector(
                '.campo-lote-item'
            )?.value.trim();

        const quantidade =
            converterNumero(
                tr.querySelector(
                    '.campo-quantidade-item'
                )?.value
            );

        const precoSemImpostos =
            converterNumero(
                tr.dataset.precoUnitario
            );

        const precoComIpi =
            converterNumero(
                tr.dataset.precoUnitarioIpi
            );

        const total =
            converterNumero(
                tr.dataset.total
            );
        
        const totalIpi =
            converterNumero(
                tr.dataset.totalIpi
            );

        if (!nf) {
            alert(
                `Preencha a NF de origem na linha ${indice + 1}.`
            );

            tr.querySelector(
                '.campo-nf-origem'
            )?.focus();

            return false;
        }

        if (!data) {
            alert(
                `Preencha a data da NF na linha ${indice + 1}.`
            );

            tr.querySelector(
                '.campo-data-nf'
            )?.focus();

            return false;
        }

        if (
            dataMaiorQue6Meses(
                data
            )
        ) {
            alert(
                `A data da linha ${indice + 1} é superior a 6 meses.`
            );

            tr.querySelector(
                '.campo-data-nf'
            )?.focus();

            return false;
        }

        if (!codigo) {
            alert(
                `Preencha o item na linha ${indice + 1}.`
            );

            tr.querySelector(
                '.campo-item-pesquisa'
            )?.focus();

            return false;
        }

        if (!lote) {
            alert(
                `Preencha o lote na linha ${indice + 1}.`
            );

            tr.querySelector(
                '.campo-lote-item'
            )?.focus();

            return false;
        }

        if (quantidade <= 0) {
            alert(
                `Informe uma quantidade válida na linha ${indice + 1}.`
            );

            tr.querySelector(
                '.campo-quantidade-item'
            )?.focus();

            return false;
        }

        if (precoSemImpostos <= 0) {
            alert(
                `Informe o preço sem impostos na linha ${indice + 1}.`
            );

            tr.querySelector(
                '.campo-preco-unitario-item'
            )?.focus();

            return false;
        }

        if (
            precoSemImpostos <= 0 ||
            total <= 0
        )
        if (
            precoComIpi <= 0 ||
            totalIpi <= 0
        ) {
            alert(
                `Não foi possível calcular os valores da linha ${indice + 1}.`
            );

            return false;
        }
    }

    return true;
}

function converterNumero(
    valor
) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 0;
    }

    if (
        typeof valor ===
        'number'
    ) {
        return Number.isFinite(valor)
            ? valor
            : 0;
    }

    let texto =
        String(
            valor
        )
        .trim()
        .replace(
            'R$',
            ''
        )
        .replace(
            /\s/g,
            ''
        );

    if (
        texto.includes('.') &&
        texto.includes(',')
    ) {
        texto =
            texto
                .replace(
                    /\./g,
                    ''
                )
                .replace(
                    ',',
                    '.'
                );
    } else {
        texto =
            texto.replace(
                ',',
                '.'
            );
    }

    const numero =
        Number(
            texto
        );

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function formatarMoeda(
    valor
) {
    const numero =
        Number(
            valor
        );

    return (
        Number.isFinite(numero)
            ? numero
            : 0
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

function formatarPercentual(
    valor
) {
    const numero =
        Number(
            valor
        );

    return (
        Number.isFinite(numero)
            ? numero
            : 0
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

function recalcularLinhaDevolucao(
    tr
) {
    const quantidadeInput =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const precoSemImpostosInput =
        tr.querySelector(
            '.campo-preco-unitario-item'
        );

    const ipiInput =
        tr.querySelector(
            '.campo-ipi-item'
        );

    const precoComIpiInput =
        tr.querySelector(
            '.campo-preco-com-ipi-item'
        );

    const totalInput =
        tr.querySelector(
            '.campo-total-item'
        );
    const totalIpiInput =
        tr.querySelector(
            '.campo-total-item-Ipi'
        );

    const quantidade =
        converterNumero(
            quantidadeInput?.value
        );

    const precoSemImpostos =
        converterNumero(
            precoSemImpostosInput?.value
        );

    const ipiDecimal =
        Number(
            tr.dataset.ipi || 0
        );

    const precoComIpi =
        precoSemImpostos *
        (
            1 + ipiDecimal
        );

    const totalLinhaIpi =
        precoComIpi *
        quantidade;
    
    const totalLinha =
        precoSemImpostos *
        quantidade;

    tr.dataset.precoUnitario =
        String(
            precoSemImpostos
        );

    tr.dataset.percentualIpi =
        String(
            ipiDecimal * 100
        );

    tr.dataset.precoUnitarioIpi =
        String(
            precoComIpi
        );

    tr.dataset.total =
        String(
            totalLinha
        );
    tr.dataset.totalIpi =
        String(
            totalLinhaIpi
        );

    if (ipiInput) {
        ipiInput.value =
            (ipiDecimal * 100)
                .toLocaleString(
                    'pt-BR',
                    {
                        minimumFractionDigits:
                            2,

                        maximumFractionDigits:
                            2
                    }
                ) +
            '%';
    }

    if (precoComIpiInput) {
        precoComIpiInput.value =
            precoSemImpostos > 0
                ? formatarMoeda(
                    precoComIpi
                )
                : '';
    }

    if (totalInput) {
        totalInput.value =
            quantidade > 0 &&
            precoSemImpostos > 0
                ? formatarMoeda(
                    totalLinha
                )
                : '';
    }
    if (totalIpiInput) {
        totalIpiInput.value =
            quantidade > 0 &&
            precoComIpi > 0
                ? formatarMoeda(
                    totalLinhaIpi
                )
                : '';
    }

    atualizarTotais();
}

function getIpi(
    classificacao
) {
    const somenteNumeros =
        String(
            classificacao || ''
        ).replace(
            /\D/g,
            ''
        );

    if (!somenteNumeros) {
        return null;
    }

    const classificacaoNormalizada =
        Number(
            somenteNumeros
        );

    const classificacoesFiscais = [
        [17041000, 0.0325],
        [17049020, 0.0325],
        [17049090, 0.0325],
        [18069000, 0.0325],
        [20079923, 0],
        [20079990, 0],
        [21069050, 0],
        [39201099, 0],
        [49019900, 0],
        [49111090, 0],
        [61091000, 0],
        [84729059, 0],
        [85061010, 0],
        [87120010, 0],
        [94033000, 0],
        [94037000, 0],
        [95030022, 0.065],
        [95030031, 0],
        [95030039, 0.065],
        [95030070, 0.065],
        [95030098, 0.065],
        [95030099, 0.065],
        [95049090, 0]
    ];

    const registro =
        classificacoesFiscais.find(
            linha => {
                return (
                    linha[0] ===
                    classificacaoNormalizada
                );
            }
        );

    return registro
        ? registro[1]
        : null;
}

function obterIpiDoItemDevolucao(
    item
) {
    const origem =
        Number(
            item?.origem || 0
        );

    if (origem !== 2) {
        return 0;
    }

    const classificacaoFiscal =
        String(
            item?.classificacaoFiscal || ''
        ).replace(
            /\D/g,
            ''
        );

    if (!classificacaoFiscal) {
        throw new Error(
            `A classificação fiscal do item ${item?.itemEmpresaId || ''} não foi informada.`
        );
    }

    const ipi =
        getIpi(
            classificacaoFiscal
        );

    if (ipi === null) {
        throw new Error(
            `A classificação fiscal ${classificacaoFiscal} não está cadastrada na função getIpi.`
        );
    }

    return ipi;
}

function obterMovimentaEstoque() {
    const campoMovimentaEstoque =
        document.getElementById(
            'movimentaEstoque'
        );

    return campoMovimentaEstoque?.checked
        ? 1
        : 0;
}

function obterUvDevolucao() {
    return obterMovimentaEstoque() === 1
        ? 'CX'
        : 'UN';
}

function atualizarUvTodasAsLinhas() {
    const uv =
        obterUvDevolucao();

    const linhas =
        document.querySelectorAll(
            '#dadosPedido tbody ' +
            '.linha-item-devolucao'
        );

    linhas.forEach(
        tr => {
            const campoUnidade =
                tr.querySelector(
                    '.campo-unidade-item'
                );

            if (campoUnidade) {
                campoUnidade.value =
                    uv;
            }

            tr.dataset.movimentaEstoque =
                String(
                    obterMovimentaEstoque()
                );
        }
    );
}

function configurarMovimentacaoEstoque() {
    const campoMovimentaEstoque =
        document.getElementById(
            'movimentaEstoque'
        );

    if (!campoMovimentaEstoque) {
        console.error(
            'Campo movimentaEstoque não encontrado.'
        );

        return;
    }

    campoMovimentaEstoque.addEventListener(
        'change',
        () => {
            atualizarUvTodasAsLinhas();

            console.log(
                'Movimenta estoque:',
                obterMovimentaEstoque(),
                'UV:',
                obterUvDevolucao()
            );
        }
    );

    atualizarUvTodasAsLinhas();
}

function preencherLinhaDevolucao(
    tr,
    item
) {
    const campoPesquisa =
        tr.querySelector(
            '.campo-item-pesquisa'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const campoUnidade =
        tr.querySelector(
            '.campo-unidade-item'
        );

    const campoPreco =
        tr.querySelector(
            '.campo-preco-unitario-item'
        );

    const campoIpi =
        tr.querySelector(
            '.campo-ipi-item'
        );

    const campoItemId =
        tr.querySelector(
            '.campo-item-id'
        );

    const codigo =
        String(
            item.itemEmpresaId || ''
        ).trim();

    const descricao =
        String(
            item.descricao || ''
        ).trim();

    const ipi =
        obterIpiDoItemDevolucao(
            item
        );

    campoPesquisa.value =
        `${codigo} - ${descricao}`;

    campoQuantidade.value =
        '';

    campoQuantidade.readOnly =
        false;

    campoUnidade.value =
        obterUvDevolucao();

    tr.dataset.movimentaEstoque =
        String(
            obterMovimentaEstoque()
        );

    campoPreco.value =
        '';

    campoPreco.readOnly =
        false;

    campoIpi.value =
        (ipi * 100).toLocaleString(
            'pt-BR',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ) + '%';

    campoItemId.value =
        String(
            item.itemId ||
            item.codigo ||
            ''
        );

    tr.dataset.itemId =
        campoItemId.value;

    tr.dataset.itemEmpresaId =
        codigo;

    tr.dataset.codigo =
        codigo;

    tr.dataset.descricao =
        descricao;

    tr.dataset.ipi =
        String(
            ipi
        );

    tr.dataset.percentualIpi =
        String(
            ipi * 100
        );

    tr.dataset.precoUnitario =
        '';

    tr.dataset.precoUnitarioIpi =
        '';

    tr.dataset.total =
        '';
    
    tr.dataset.totalIpi =
        '';
}

// Função para adicionar uma nova linha à tabela
function adicionarNovaLinha() {
    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    if (!tbody) {
        console.error(
            'Não foi possível adicionar a linha: tbody não encontrado.'
        );

        return null;
    }

    const tr =
        document.createElement(
            'tr'
        );

    tr.classList.add(
        'linha-item-devolucao'
    );

    tr.innerHTML = `
        <td>
            <input
                type="text"
                class="campo-nf-origem"
                autocomplete="off"
            >
        </td>

        <td>
            <input
                type="date"
                class="campo-data-nf"
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-item-pesquisa"
                list="lista-produtos-cliente"
                placeholder="Digite o código ou a descrição"
                autocomplete="off"
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-lote-item"
                autocomplete="off"
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-quantidade-item"
                inputmode="decimal"
                autocomplete="off"
                readonly
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-unidade-item"
                readonly
                tabindex="-1"
            >
        </td>

        <td class="celula-excluir-item">
            <button
                type="button"
                class="btn-remover-linha"
                tabindex="-1"
            >
                Excluir
            </button>
        </td>

        <td>
            <input
                type="text"
                class="campo-preco-unitario-item"
                placeholder="Preço sem impostos"
                inputmode="decimal"
                autocomplete="off"
                readonly
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-ipi-item"
                readonly
                tabindex="-1"
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-preco-com-ipi-item"
                readonly
                tabindex="-1"
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-total-item"
                readonly
                tabindex="-1"
            >
        </td>

        <td>
            <input
                type="text"
                class="campo-total-item-Ipi"
                readonly
                tabindex="-1"
            >
        </td>

        <td style="display: none;">
            <input
                type="hidden"
                class="campo-item-id"
            >
        </td>
    `;

    tbody.appendChild(
        tr
    );

    configurarLinhaDevolucao(
        tr
    );
    const campoUnidade =
        tr.querySelector(
            '.campo-unidade-item'
        );

    if (campoUnidade) {
        campoUnidade.value =
            obterUvDevolucao();
    }

    tr.dataset.movimentaEstoque =
        String(
            obterMovimentaEstoque()
        );
    console.log(
        'Nova linha adicionada. Total:',
        tbody.querySelectorAll(
            '.linha-item-devolucao'
        ).length
    );

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

// // Função para verificar duplicatas de código na tabela
// function verificarCodigoDuplicado(codigo) {
//     const linhas = document.querySelectorAll('#dadosPedido tbody tr');
//     let contador = 0;

//     linhas.forEach(tr => {
//         const inputCodigo = tr.cells[2]?.querySelector('input');
//         if (inputCodigo && inputCodigo.value === codigo) {
//             contador++;
//         }
//     });

//     return contador > 1;
// }

// function verificarCodigoDuplicadoNaTabela(codigo, linhaAtual) {
//     const linhas = document.querySelectorAll('#dadosPedido tbody tr');

//     for (const tr of linhas) {
//         if (tr === linhaAtual) continue; // ignora a própria linha

//         const inputCodigo = tr.cells[2]?.querySelector('input');
//         if (inputCodigo && inputCodigo.value.trim().toUpperCase() === codigo) {
//             return true;
//         }
//     }
//     return false;
// }

function verificarItensSemPreenchimento(codigo, linhaAtual) {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    for (const tr of linhas) {
        const inputCodigo = tr.cells[2]?.querySelector('input');
        if (inputCodigo && inputCodigo.value.trim().toUpperCase() === codigo) {
            return true;
        }
    }
    return false;
}



//--inicio-----envio de dados para o sistema DBCorp-----------------------------------------------------------------------------------------////
const feedbackDiv = document.getElementById('feedback1');

const closeButton = document.querySelector('.close-button');


const cnpjInput = document.getElementById('cnpj');

// Função para abrir o modal

// Fecha o modal ao clicar no botão "Não" ou no botão de fechar
closeButton.addEventListener("click", () => {
    modal.style.display = "none";
});



//--fim-----envio de dados para o sistema DBCorp------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

//consts email
    const emailModal = document.getElementById('emailModalDevolucao');
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
    const FIXED_EMAIL = `devolucao.kz@kidszoneworld.com.br`;
    
    let generatedPdfFile = null;
    // const FIXED_EMAIL = `luis.henrique@kidszoneworld.com.br; erick.almeida@kidszoneworld.com.br`;
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
        const response = await fetch('/generate-upload-url-dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type
            })
        });

const { uploadUrlDev, key } = await response.json();

        await fetch(uploadUrlDev, {
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
        document
            .getElementById(
                'razao_social'
            )
            ?.value ||
        'Cliente';

    const codCliente =
        document
            .getElementById(
                'cod_cliente'
            )
            ?.value ||
        '';

    const timestamp =
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
        `Devolucao - ` +
        `${nomeCliente} - ` +
        `${codCliente} - ` +
        `${timestamp}.pdf`;

    let clonePdf =
        null;

    try {
        buttonPdf.disabled =
            true;

        showFeedback(
            'Gerando PDF, aguarde...'
        );

        clonePdf =
            prepararDevolucaoParaPdf();

        const pdfBlob =
            await gerarPdfNoNavegador(
                clonePdf,
                nomeArquivo
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
            'Arquivo da devolução preparado:',
            {
                nome:
                    generatedPdfFile.name,

                tamanho:
                    generatedPdfFile.size,

                tipo:
                    generatedPdfFile.type
            }
        );

        return generatedPdfFile;
    } catch (error) {
        generatedPdfFile =
            null;

        console.error(
            'Erro ao gerar o PDF:',
            error
        );

        alert(
            'Erro ao gerar o PDF: ' +
            (
                error.message ||
                'Erro desconhecido.'
            )
        );

        return null;
    } finally {
        clonePdf?.remove();

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

    const fixedSubject = `Devolução ${razaoSocial}`;
    emailSubjectInput.value = fixedSubject;
    emailSubjectInput.setAttribute('data-fixed', fixedSubject);

    const fixedMessage = `Segue fotos solicitadas para a devolução do cliente ${razaoSocial}\n\n`;
    emailBodyInput.value = fixedMessage;
    emailBodyInput.setAttribute('data-fixed', fixedMessage);


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

        await gerarPDF();
        if (generatedPdfFile) {
            additionalFiles = [];
            preencherFormularioEmail();
            emailModal.style.display = 'block';
        }
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
        const devolucaoSalva =
            await salvarDevolucaoMongo();

        if (!devolucaoSalva) {
            return;
        }
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

const response = await fetch('/send-client-pdf-dev', {
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

    configurarMovimentacaoEstoque();
    garantirLinhaInicial();
    
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

// ======================================================================
// 🎓 TUTORIAL
// ======================================================================

const tutorialSteps = [

    {
        element: '#cnpj',
        text: 'Passo 1. Informe o CNPJ do cliente.\n\nAs demais informações serão carregadas automaticamente.\n\nClique em próximo para continuar com o tutorial ou pressione finalizar para sair.'
    },

    {
        element: '#observation',
        text: 'Passo 2. Informe o motivo da devolução.'
    },

    {
        element: '#dadosPedido',
        text:
            "Passo 3. Adicione os itens a serem devolvidos, preenchendo TODOS os campos:\n" +
            "- NF de origem\n" +
            "- Data da NF\n" +
            "- Código do item, que carrega automaticamente a descrição\n" +
            "- Lote\n" +
            "- Quantidade em unidade\n" +
            "- Valor unitário\n\n"
    },

    {
        element: '#button_pdf',
        text:
            "Passo 4. Clique em 'Enviar por e-mail'.\n" +
            "Anexe as imagens dos itens devolvidos e, se necessário, adicione destinatários em cópia, separando os e-mails por ;.\n\n"
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

function removerColunasTecnicasPdf(
    clone
) {
    if (!clone) {
        return;
    }

    const tabela =
        clone.querySelector(
            '#dadosPedido'
        );

    if (!tabela) {
        console.warn(
            'Tabela de itens não encontrada no clone do PDF.'
        );

        return;
    }

    const cabecalhos =
        Array.from(
            tabela.querySelectorAll(
                'thead th'
            )
        );

    const indicesRemover =
        cabecalhos
            .map(
                (
                    cabecalho,
                    indice
                ) => {
                    const texto =
                        String(
                            cabecalho.textContent ||
                            ''
                        )
                            .trim()
                            .toLowerCase();

                    const classe =
                        String(
                            cabecalho.className ||
                            ''
                        )
                            .trim()
                            .toLowerCase();

                    const deveRemover =
                        texto === 'excluir' ||
                        texto === 'item id' ||
                        texto === 'itemid' ||
                        classe.includes(
                            'pack'
                        ) ||
                        classe.includes(
                            'itemid'
                        );

                    return deveRemover
                        ? indice
                        : -1;
                }
            )
            .filter(
                indice => {
                    return indice >= 0;
                }
            )
            .sort(
                (
                    primeiro,
                    segundo
                ) => {
                    return segundo -
                        primeiro;
                }
            );

    indicesRemover.forEach(
        indice => {
            tabela
                .querySelectorAll(
                    'tr'
                )
                .forEach(
                    linha => {
                        const celula =
                            linha.children[
                                indice
                            ];

                        if (celula) {
                            celula.remove();
                        }
                    }
                );
        }
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