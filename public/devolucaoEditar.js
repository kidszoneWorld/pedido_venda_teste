const timestamp = Date.now();

let devolucaoAtual = null;
let edicaoBloqueada = false;
let dataBaseDevolucao = null;
let catalogoClienteData = [];
let catalogoClientePorCodigo = new Map();
let catalogoClienteCarregado = false;
let catalogoClienteCarregando = false;
let dadosListaPrecoAtual = null;

const el = id => document.getElementById(id);

function getIdFromUrl() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
}

function mostrarFeedback(mensagem) {
    const feedback = el('feedback1');

    if (!feedback) {
        return;
    }

    feedback.style.display = 'block';
    feedback.textContent = mensagem;
}

function ocultarFeedback() {
    const feedback = el('feedback1');

    if (!feedback) {
        return;
    }

    feedback.style.display = 'none';
    feedback.textContent = '';
}

function formatarCNPJ(cnpj) {
    const numeros = String(cnpj || '').replace(/\D/g, '').padStart(14, '0');

    if (numeros.length !== 14) {
        return String(cnpj || '');
    }

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

function formatarCEP(cep) {
    const numeros = String(cep || '').replace(/\D/g, '').padStart(8, '0');

    if (numeros.length !== 8) {
        return String(cep || '');
    }

    return numeros.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
}

function formatarDataInput(valor) {
    if (!valor) {
        return '';
    }

    if (valor instanceof Date) {
        return Number.isNaN(valor.getTime()) ? '' : formatarDataISO(valor);
    }

    const texto = String(valor).trim();

    if (!texto) {
        return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return texto;
    }

    if (texto.includes('T')) {
        return texto.split('T')[0];
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
        const [dia, mes, ano] = texto.split('/');
        return `${ano}-${mes}-${dia}`;
    }

    const data = new Date(texto);
    return Number.isNaN(data.getTime()) ? '' : formatarDataISO(data);
}

function converterNumero(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return 0;
    }

    if (typeof valor === 'number') {
        return Number.isFinite(valor) ? valor : 0;
    }

    let texto = String(valor)
        .replace('R$', '')
        .replace('%', '')
        .replace(/\s/g, '')
        .trim();

    if (texto.includes('.') && texto.includes(',')) {
        texto = texto.replace(/\./g, '').replace(',', '.');
    } else {
        texto = texto.replace(',', '.');
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarPercentual(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + '%';
}

function normalizarCodigoItem(valor) {
    return String(valor || '').trim().toUpperCase();
}

function converterParaBooleano(valor) {
    if (valor === true || valor === 1) {
        return true;
    }

    if (valor === false || valor === 0) {
        return false;
    }

    const texto = String(valor ?? '').trim().toLowerCase();
    return ['true', '1', 'sim', 's', 'ativo'].includes(texto);
}

function itemPodeAparecerNaLista(item) {
    if (!item) {
        return false;
    }

    const ativo = item.ativo === undefined
        ? true
        : converterParaBooleano(item.ativo);

    const suspenso = converterParaBooleano(item.suspenso);
    const foraLinha = converterParaBooleano(item.foraLinha);
    const bloqueado = converterParaBooleano(item.bloqueado);

    const exibeConsultas = item.exibeConsultasListaPreco === undefined ||
        item.exibeConsultasListaPreco === null
        ? true
        : converterParaBooleano(item.exibeConsultasListaPreco);

    const descricao = String(item.descricao || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const descricaoBloqueada = descricao.includes('display') ||
        descricao.includes('bobina');

    return ativo &&
        !suspenso &&
        !foraLinha &&
        !bloqueado &&
        exibeConsultas &&
        !descricaoBloqueada;
}

function obterDataBaseDevolucao() {
    if (!dataBaseDevolucao) {
        return null;
    }

    return new Date(`${dataBaseDevolucao}T00:00:00`);
}

function obterDataBaseDevolucaoISO() {
    const data = obterDataBaseDevolucao();
    return data ? formatarDataISO(data) : '';
}

function obterDataLimite180DiasISO() {
    const data = obterDataBaseDevolucao();

    if (!data) {
        return '';
    }

    const limite = new Date(data);
    limite.setDate(limite.getDate() - 180);
    return formatarDataISO(limite);
}

function dataDentroDoLimite180Dias(valor) {
    if (!valor) {
        return false;
    }

    const dataBase = obterDataBaseDevolucao();

    if (!dataBase) {
        return false;
    }

    const informada = new Date(`${valor}T00:00:00`);
    const limite = new Date(dataBase);
    limite.setDate(limite.getDate() - 180);

    return informada >= limite && informada <= dataBase;
}

function getIpi(classificacao) {
    const somenteNumeros = String(classificacao || '').replace(/\D/g, '');

    if (!somenteNumeros) {
        return null;
    }

    const classificacaoNormalizada = Number(somenteNumeros);

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

    const registro = classificacoesFiscais.find(
        linha => linha[0] === classificacaoNormalizada
    );

    return registro ? registro[1] : null;
}

function obterIpiDoItem(item) {
    const ipiRecebido = item?.IPI ??
        item?.ipi ??
        item?.percentualIpi ??
        item?.PercentualIpi ??
        null;

    if (ipiRecebido !== null && ipiRecebido !== undefined && ipiRecebido !== '') {
        const numero = converterNumero(ipiRecebido);
        return numero > 1 ? numero / 100 : numero;
    }

    const origem = Number(item?.origem || 0);

    if (origem !== 2) {
        return 0;
    }

    const classificacao = String(
        item?.classificacaoFiscal ??
        item?.classificacaoFiscalCodigo ??
        item?.ncm ??
        item?.NCM ??
        ''
    ).replace(/\D/g, '');

    if (!classificacao) {
        throw new Error(
            `A classificação fiscal do item ${item?.itemEmpresaId || ''} não foi informada.`
        );
    }

    const ipi = getIpi(classificacao);

    if (ipi === null) {
        throw new Error(
            `A classificação fiscal ${classificacao} não está cadastrada na função getIpi.`
        );
    }

    return ipi;
}

async function carregarCatalogoCliente(clienteCodigo, listaCodigo = null) {
    const codigoCliente = String(clienteCodigo || '').trim();

    if (!codigoCliente) {
        throw new Error('Código do cliente não disponível para carregar o catálogo.');
    }

    catalogoClienteCarregado = false;
    catalogoClienteCarregando = true;
    catalogoClienteData = [];
    catalogoClientePorCodigo = new Map();
    dadosListaPrecoAtual = null;

    try {
        mostrarFeedback('Carregando catálogo do cliente...');

        const parametros = new URLSearchParams();

        if (listaCodigo !== null && listaCodigo !== undefined && listaCodigo !== '') {
            parametros.set('listaCodigo', String(listaCodigo));
        }

        const query = parametros.toString();
        const url = `/api/catalogo-cliente/${encodeURIComponent(codigoCliente)}` +
            (query ? `?${query}` : '');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        const texto = await response.text();
        let resultado = null;

        if (texto) {
            try {
                resultado = JSON.parse(texto);
            } catch {
                throw new Error('O catálogo retornou uma resposta inválida.');
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.mensagem ||
                resultado?.message ||
                texto ||
                `Erro HTTP ${response.status}`
            );
        }

        const itensRecebidos = Array.isArray(resultado?.itens)
            ? resultado.itens
            : [];

        catalogoClienteData = itensRecebidos.filter(itemPodeAparecerNaLista);
        dadosListaPrecoAtual = resultado?.listaPreco || null;
        catalogoClientePorCodigo = new Map();

        catalogoClienteData.forEach(item => {
            const codigo = normalizarCodigoItem(item.itemEmpresaId);

            if (codigo) {
                catalogoClientePorCodigo.set(codigo, item);
            }
        });

        catalogoClienteCarregado = true;
        criarDatalistCatalogo();

        console.log('Catálogo da edição carregado:', {
            recebidos: itensRecebidos.length,
            disponíveis: catalogoClienteData.length,
            indexados: catalogoClientePorCodigo.size
        });

        return resultado;
    } finally {
        catalogoClienteCarregando = false;
        ocultarFeedback();
    }
}

function criarDatalistCatalogo() {
    let datalist = el('lista-produtos-cliente');

    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'lista-produtos-cliente';
        document.body.appendChild(datalist);
    }

    datalist.innerHTML = '';

    catalogoClienteData.forEach(item => {
        const codigo = String(item.itemEmpresaId || '').trim();
        const descricao = String(item.descricao || '').trim();

        if (!codigo || !descricao) {
            return;
        }

        const opcao = document.createElement('option');
        opcao.value = `${codigo} - ${descricao}`;
        datalist.appendChild(opcao);
    });
}

function buscarItemPorPesquisa(valor) {
    const texto = String(valor || '').trim();

    if (!texto) {
        return null;
    }

    const separador = texto.indexOf(' - ');
    const codigo = separador >= 0
        ? normalizarCodigoItem(texto.substring(0, separador))
        : normalizarCodigoItem(texto);

    const itemPorCodigo = catalogoClientePorCodigo.get(codigo);

    if (itemPorCodigo) {
        return itemPorCodigo;
    }

    const pesquisa = texto.toUpperCase();
    const itens = catalogoClienteData.filter(item => {
        return String(item.descricao || '').trim().toUpperCase() === pesquisa;
    });

    return itens.length === 1 ? itens[0] : null;
}

function obterMovimentaEstoqueEdicao() {
    const campo =
        document.getElementById(
            'movimentaEstoque'
        );

    return campo?.checked
        ? 1
        : 0;
}

function obterUvEdicao() {
    return obterMovimentaEstoqueEdicao() === 1
        ? 'CX'
        : 'UN';
}

function atualizarUvTodasAsLinhasEdicao() {
    const uv =
        obterUvEdicao();

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
        }
    );

    console.log(
        'Movimenta estoque:',
        obterMovimentaEstoqueEdicao(),
        'UV aplicada:',
        uv
    );
}

function obterMovimentaEstoqueEdicao() {
    const campo =
        document.getElementById(
            'movimentaEstoque'
        );

    return campo?.checked
        ? 1
        : 0;
}

function obterUvEdicao() {
    return obterMovimentaEstoqueEdicao() === 1
        ? 'CX'
        : 'UN';
}

function atualizarUvTodasAsLinhasEdicao() {
    const uv =
        obterUvEdicao();

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
        }
    );

    console.log(
        'Movimenta estoque:',
        obterMovimentaEstoqueEdicao(),
        'UV aplicada:',
        uv
    );
}

function preencherDadosDevolucao(dev) {
    
    el('devId').value = dev.id || '';
    el('statusDevolucao').value = dev.status || '';
    el('cnpj').value = formatarCNPJ(dev.cnpj);
    el('cod_cliente').value = dev.codCliente || dev.cod_cliente || '';
    el('razao_social').value = dev.razaoSocial || dev.razaosocial || '';
    el('representante').value = dev.representante || '';
    el('endereco').value = dev.endereco || '';
    el('bairro').value = dev.bairro || '';
    el('cidade').value = dev.cidade || '';
    el('uf').value = dev.uf || '';
    el('cep').value = formatarCEP(dev.cep || dev.Cep);
    el('telefone').value = dev.telefone || '';
    el('email').value = dev.email || '';
    el('email_fiscal').value = dev.emailFiscal || '';
    el('observation').value = dev.motivo || '';
    const campoMovimentaEstoque =
        document.getElementById(
            'movimentaEstoque'
        );

    const movimentaEstoque =
        Number(
            dev.movimentaEstoque ??
            dev.MovimentaEstoque ??
            0
        ) === 1;

    if (campoMovimentaEstoque) {
        campoMovimentaEstoque.checked =
            movimentaEstoque;
    }
    el('codgroup').value = dev.codgroup ||
        dev.codGroup ||
        dev.listaId ||
        dev.listaPrecoId ||
        dev.ListaPrecoId ||
        '';
}

async function obterDadosClienteParaCatalogo(dev) {
    const codigoCliente = dev.codCliente ||
        dev.cod_cliente ||
        dev.ClienteId ||
        dev.clienteId ||
        el('cod_cliente')?.value;

    if (!codigoCliente) {
        throw new Error('Código do cliente não encontrado na devolução.');
    }

    let listaCodigo = el('codgroup')?.value || null;

    if (!listaCodigo) {
        const response = await fetch(`/api/cliente/codigo/${codigoCliente}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar os dados do cliente para carregar o catálogo.');
        }

        const cliente = await response.json();
        listaCodigo = cliente.LISTA ?? cliente.listaPrecoCodigo ?? null;

        if (el('codgroup')) {
            el('codgroup').value = listaCodigo || '';
        }
    }

    await carregarCatalogoCliente(codigoCliente, listaCodigo);
}

function verificarPermissaoEdicao(dev) {
    const status = String(dev.status || '').toLowerCase();
    const finalizado = Number(dev.finalizado || 0) === 1;
    edicaoBloqueada = status !== 'pendente' || finalizado;

    const aviso = el('avisoEdicao');
    const botaoSalvar = el('salvarEdicaoDevolucao');
    const botaoAdicionar = el('adicionarLinha');

    if (!edicaoBloqueada) {
        if (aviso) {
            aviso.style.display = 'none';
        }
        return;
    }

    if (aviso) {
        aviso.style.display = 'block';
        aviso.textContent = 'Esta devolução não pode mais ser editada.';
    }

    if (botaoSalvar) {
        botaoSalvar.disabled = true;
    }

    if (botaoAdicionar) {
        botaoAdicionar.disabled = true;
    }

    bloquearCamposEdicao();
}

function obterValorProduto(produto, nomes, valorPadrao = '') {
    for (const nome of nomes) {
        const valor = produto?.[nome];

        if (valor !== undefined && valor !== null && valor !== '') {
            return valor;
        }
    }

    return valorPadrao;
}

function preencherLinhaComProdutoSalvo(tr, produto) {
    const codigo = String(obterValorProduto(
        produto,
        ['codigoItem', 'CodigoItem', 'itemEmpresaId'],
        ''
    )).trim();

    const descricao = String(obterValorProduto(
        produto,
        ['descricao', 'Descricao'],
        ''
    )).trim();

    const quantidade = converterNumero(obterValorProduto(
        produto,
        ['quantidade', 'Quantidade'],
        0
    ));

    const precoUnitario = converterNumero(obterValorProduto(
        produto,
        ['precoUnitario', 'PrecoUnitario', 'precounitario'],
        0
    ));

    let percentualIpi = converterNumero(obterValorProduto(
        produto,
        ['ipi', 'IPI', 'percentualIpi', 'PercentualIpi'],
        0
    ));

    if (percentualIpi > 0 && percentualIpi < 1) {
        percentualIpi *= 100;
    }

    const ipiDecimal = percentualIpi / 100;

    const PrecoUnitarioIPIRecebido = converterNumero(obterValorProduto(
        produto,
        ['PrecoUnitarioIPI', 'PrecoUnitarioIPI', 'PrecoUnitarioIPI'],
        0
    ));

    const PrecoUnitarioIPI = PrecoUnitarioIPIRecebido > 0
        ? PrecoUnitarioIPIRecebido
        : precoUnitario * (1 + ipiDecimal);

    const totalRecebido = converterNumero(obterValorProduto(
        produto,
        ['total', 'Total'],
        0
    ));

    const total = totalRecebido > 0
        ? totalRecebido
        : precoUnitario * quantidade;

    const totalIpiRecebido = converterNumero(obterValorProduto(
        produto,
        ['totalIpi', 'TotalIpi', 'totalIPI'],
        0
    ));

    const totalIpi = totalIpiRecebido > 0
        ? totalIpiRecebido
        : PrecoUnitarioIPI * quantidade;

    tr.querySelector('.campo-nf-origem').value = obterValorProduto(
        produto,
        ['nfOrigem', 'nforigem', 'NfOrigem'],
        ''
    );

    const campoData = tr.querySelector('.campo-data-nf');
    campoData.value = formatarDataInput(obterValorProduto(
        produto,
        ['ProdData', 'data', 'prodData'],
        ''
    ));

    tr.querySelector('.campo-item-pesquisa').value = codigo && descricao
        ? `${codigo} - ${descricao}`
        : codigo || descricao;

    tr.querySelector('.campo-lote-item').value = obterValorProduto(
        produto,
        ['lote', 'Lote'],
        ''
    );

    tr.querySelector('.campo-quantidade-item').value = quantidade || '';
    tr.querySelector(
        '.campo-unidade-item'
    ).value =
        obterUvEdicao();

    tr.querySelector('.campo-preco-unitario-item').value = precoUnitario > 0
        ? formatarMoeda(precoUnitario)
        : '';

    tr.querySelector('.campo-ipi-item').value = formatarPercentual(percentualIpi);
    tr.querySelector('.campo-preco-com-ipi-item').value = PrecoUnitarioIPI > 0
        ? formatarMoeda(PrecoUnitarioIPI)
        : '';

    tr.querySelector('.campo-total-item').value = total > 0
        ? formatarMoeda(total)
        : '';

    tr.querySelector('.campo-total-item-Ipi').value = totalIpi > 0
        ? formatarMoeda(totalIpi)
        : '';

    const itemId = obterValorProduto(
        produto,
        ['itemId', 'ItemId', 'codigo', 'devProdId'],
        0
    );

    tr.querySelector('.campo-item-id').value = itemId || '';

    tr.dataset.itemId = String(itemId || '');
    tr.dataset.devProdId = String(produto?.devProdId || produto?.DevProdId || '');
    tr.dataset.itemEmpresaId = codigo;
    tr.dataset.codigo = codigo;
    tr.dataset.descricao = descricao;
    tr.dataset.ipi = String(ipiDecimal);
    tr.dataset.percentualIpi = String(percentualIpi);
    tr.dataset.precoUnitario = String(precoUnitario);
    tr.dataset.PrecoUnitarioIPI = String(PrecoUnitarioIPI);
    tr.dataset.total = String(total);
    tr.dataset.totalIpi = String(totalIpi);
    tr.dataset.linhaFinalizada = 'true';

    tr.querySelector('.campo-quantidade-item').readOnly = false;
    tr.querySelector('.campo-preco-unitario-item').readOnly = false;
}

function criarEstruturaLinha() {
    const tr = document.createElement('tr');
    tr.className = 'linha-item-devolucao';

    tr.innerHTML = `
        <td>
            <input type="text" class="campo-nf-origem" autocomplete="off">
        </td>
        <td>
            <input type="date" class="campo-data-nf">
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
            <input type="text" class="campo-lote-item" autocomplete="off">
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
            <input type="text" class="campo-unidade-item" readonly tabindex="-1">
        </td>
        <td class="celula-excluir-item">
            <button type="button" class="btn-remover-linha" tabindex="-1">
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
            <input type="text" class="campo-ipi-item" readonly tabindex="-1">
        </td>
        <td>
            <input type="text" class="campo-preco-com-ipi-item" readonly tabindex="-1">
        </td>
        <td>
            <input type="text" class="campo-total-item" readonly tabindex="-1">
        </td>
        <td>
            <input type="text" class="campo-total-item-Ipi" readonly tabindex="-1">
        </td>
        <td style="display: none;">
            <input type="hidden" class="campo-item-id">
        </td>
    `;

    const campoData = tr.querySelector('.campo-data-nf');
    campoData.min = obterDataLimite180DiasISO();
    campoData.max = obterDataBaseDevolucaoISO();

    return tr;
}

function adicionarNovaLinhaEditavel(produto = null) {
    const tbody = document.querySelector('#dadosPedido tbody');

    if (!tbody) {
        return null;
    }

    const tr = criarEstruturaLinha();
    tbody.appendChild(tr);
    configurarLinhaDevolucao(tr);

    if (produto) {
        preencherLinhaComProdutoSalvo(tr, produto);
    }

    if (edicaoBloqueada) {
        bloquearLinha(tr);
    }

    atualizarTotais();
    return tr;
}

function preencherLinhaComItemCatalogo(tr, item) {
    const campoPesquisa = tr.querySelector('.campo-item-pesquisa');
    const campoQuantidade = tr.querySelector('.campo-quantidade-item');
    const campoUnidade = tr.querySelector('.campo-unidade-item');
    const campoPreco = tr.querySelector('.campo-preco-unitario-item');
    const campoIpi = tr.querySelector('.campo-ipi-item');
    const campoItemId = tr.querySelector('.campo-item-id');

    const codigo = String(item.itemEmpresaId || '').trim();
    const descricao = String(item.descricao || '').trim();
    const ipiDecimal = obterIpiDoItem(item);
    const itemId = Number(item.itemId ?? item.codigo ?? 0);

    campoPesquisa.value = `${codigo} - ${descricao}`;
    campoQuantidade.value = '';
    campoQuantidade.readOnly = false;
    campoUnidade.value =
        obterUvEdicao();
    campoPreco.value = '';
    campoPreco.readOnly = false;
    campoIpi.value = formatarPercentual(ipiDecimal * 100);
    campoItemId.value = itemId > 0 ? String(itemId) : '';

    tr.dataset.itemId = campoItemId.value;
    tr.dataset.itemEmpresaId = codigo;
    tr.dataset.codigo = codigo;
    tr.dataset.descricao = descricao;
    tr.dataset.ipi = String(ipiDecimal);
    tr.dataset.percentualIpi = String(ipiDecimal * 100);
    tr.dataset.precoUnitario = '';
    tr.dataset.PrecoUnitarioIPI = '';
    tr.dataset.total = '';
    tr.dataset.totalIpi = '';
    tr.dataset.linhaFinalizada = 'false';
}

function recalcularLinhaDevolucao(tr) {
    const quantidade = converterNumero(
        tr.querySelector('.campo-quantidade-item')?.value
    );

    const precoUnitario = converterNumero(
        tr.querySelector('.campo-preco-unitario-item')?.value
    );

    const ipiDecimal = Number(tr.dataset.ipi || 0);
    const PrecoUnitarioIPI = precoUnitario * (1 + ipiDecimal);
    const total = precoUnitario * quantidade;
    const totalIpi = PrecoUnitarioIPI * quantidade;

    tr.dataset.precoUnitario = String(precoUnitario);
    tr.dataset.percentualIpi = String(ipiDecimal * 100);
    tr.dataset.PrecoUnitarioIPI = String(PrecoUnitarioIPI);
    tr.dataset.total = String(total);
    tr.dataset.totalIpi = String(totalIpi);

    tr.querySelector('.campo-ipi-item').value = formatarPercentual(ipiDecimal * 100);
    tr.querySelector('.campo-preco-com-ipi-item').value = precoUnitario > 0
        ? formatarMoeda(PrecoUnitarioIPI)
        : '';

    tr.querySelector('.campo-total-item').value = quantidade > 0 && precoUnitario > 0
        ? formatarMoeda(total)
        : '';

    tr.querySelector('.campo-total-item-Ipi').value = quantidade > 0 && precoUnitario > 0
        ? formatarMoeda(totalIpi)
        : '';

    atualizarTotais();
}

function finalizarPrecoLinha(tr, campoPreco) {
    const preco = converterNumero(campoPreco.value);

    if (preco <= 0) {
        campoPreco.value = '';
        campoPreco.focus();
        alert('Informe um preço unitário válido.');
        return false;
    }

    campoPreco.value = formatarMoeda(preco);
    recalcularLinhaDevolucao(tr);
    return true;
}

function configurarLinhaDevolucao(tr) {
    const campoUnidade =
        tr.querySelector(
            '.campo-unidade-item'
        );

    if (campoUnidade) {
        campoUnidade.value =
            obterUvEdicao();
    }
    const campoPesquisa = tr.querySelector('.campo-item-pesquisa');
    const campoLote = tr.querySelector('.campo-lote-item');
    const campoQuantidade = tr.querySelector('.campo-quantidade-item');
    const campoPreco = tr.querySelector('.campo-preco-unitario-item');
    const botaoRemover = tr.querySelector('.btn-remover-linha');

    let processandoItem = false;

    async function processarItem() {
        if (processandoItem || edicaoBloqueada) {
            return false;
        }

        const valor = campoPesquisa.value.trim();

        if (!valor) {
            return false;
        }

        processandoItem = true;
        campoPesquisa.readOnly = true;

        try {
            if (catalogoClienteCarregando) {
                throw new Error('O catálogo ainda está sendo carregado. Aguarde.');
            }

            if (!catalogoClienteCarregado) {
                throw new Error('O catálogo do cliente não foi carregado.');
            }

            const item = buscarItemPorPesquisa(valor);

            if (!item) {
                throw new Error('Item não encontrado no catálogo do cliente.');
            }

            const codigo = normalizarCodigoItem(item.itemEmpresaId);

            const duplicado = Array.from(
                document.querySelectorAll('#dadosPedido tbody .linha-item-devolucao')
            ).some(linha => {
                return linha !== tr &&
                    normalizarCodigoItem(linha.dataset.itemEmpresaId) === codigo;
            });

            if (duplicado) {
                throw new Error('Este item já foi adicionado à devolução.');
            }

            preencherLinhaComItemCatalogo(tr, item);
            campoLote.focus();
            return true;
        } catch (error) {
            campoPesquisa.value = '';
            campoQuantidade.value = '';
            campoQuantidade.readOnly = true;
            campoPreco.value = '';
            campoPreco.readOnly = true;
            tr.dataset.itemId = '';
            tr.dataset.itemEmpresaId = '';
            tr.dataset.codigo = '';
            tr.dataset.descricao = '';
            tr.dataset.ipi = '';
            alert(error.message || 'Item indisponível.');
            campoPesquisa.focus();
            return false;
        } finally {
            processandoItem = false;
            campoPesquisa.readOnly = false;
        }
    }

    campoPesquisa.addEventListener('change', processarItem);

    campoPesquisa.addEventListener('blur', () => {
        if (campoPesquisa.value.trim() && !tr.dataset.itemId) {
            processarItem();
        }
    });

    campoPesquisa.addEventListener('keydown', evento => {
        if (evento.key !== 'Enter' && evento.key !== 'Tab') {
            return;
        }

        if (evento.key === 'Tab' && evento.shiftKey) {
            return;
        }

        evento.preventDefault();
        processarItem();
    });

    campoQuantidade.addEventListener('input', () => {
        tr.dataset.linhaFinalizada = 'false';
        recalcularLinhaDevolucao(tr);
    });

    campoPreco.addEventListener('input', () => {
        tr.dataset.linhaFinalizada = 'false';
        recalcularLinhaDevolucao(tr);
    });

    campoPreco.addEventListener('blur', () => {
        const preco = converterNumero(campoPreco.value);

        if (preco <= 0) {
            campoPreco.value = '';
            recalcularLinhaDevolucao(tr);
            return;
        }

        campoPreco.value = formatarMoeda(preco);
        recalcularLinhaDevolucao(tr);
    });

    campoPreco.addEventListener('keydown', evento => {
        const enter = evento.key === 'Enter';
        const tab = evento.key === 'Tab';

        if (!enter && !tab) {
            return;
        }

        if (tab && evento.shiftKey) {
            return;
        }

        evento.preventDefault();

        if (!finalizarPrecoLinha(tr, campoPreco)) {
            return;
        }

        let proximaLinha = tr.nextElementSibling;

        if (!proximaLinha || !proximaLinha.classList.contains('linha-item-devolucao')) {
            proximaLinha = adicionarNovaLinhaEditavel();
        }

        tr.dataset.linhaFinalizada = 'true';

        setTimeout(() => {
            proximaLinha?.querySelector('.campo-nf-origem')?.focus();
        }, 0);
    });

    botaoRemover.addEventListener('click', () => {
        if (edicaoBloqueada) {
            alert('Esta devolução não pode ser editada.');
            return;
        }

        tr.remove();
        atualizarTotais();
        garantirLinhaInicial();
    });
}

function renderizarProdutos(produtos) {
    const tbody = document.querySelector('#dadosPedido tbody');
    tbody.innerHTML = '';

    produtos.forEach(produto => {
        adicionarNovaLinhaEditavel(produto);
    });

    garantirLinhaInicial();
    atualizarTotais();
}

function garantirLinhaInicial() {
    const tbody = document.querySelector('#dadosPedido tbody');

    if (!tbody || edicaoBloqueada) {
        return;
    }

    if (!tbody.querySelector('.linha-item-devolucao')) {
        adicionarNovaLinhaEditavel();
    }
}

function atualizarTotalVolumes() {
    let total = 0;

    document.querySelectorAll('#dadosPedido tbody .linha-item-devolucao')
        .forEach(tr => {
            total += converterNumero(
                tr.querySelector('.campo-quantidade-item')?.value
            );
        });

    if (el('volume')) {
        el('volume').value = total;
    }
}

function atualizarTotalProdutos() {
    let total = 0;

    document.querySelectorAll('#dadosPedido tbody .linha-item-devolucao')
        .forEach(tr => {
            total += converterNumero(tr.dataset.total);
        });

    if (el('total')) {
        el('total').value = formatarMoeda(total);
    }
}

function atualizarTotalProdutosIpi() {
    let total = 0;

    document.querySelectorAll('#dadosPedido tbody .linha-item-devolucao')
        .forEach(tr => {
            total += converterNumero(tr.dataset.totalIpi);
        });

    if (el('totalIpi')) {
        el('totalIpi').value = formatarMoeda(total);
    }
}

function atualizarTotais() {
    atualizarTotalVolumes();
    atualizarTotalProdutos();
    atualizarTotalProdutosIpi();
}

function obterLinhasPreenchidas() {
    return Array.from(
        document.querySelectorAll('#dadosPedido tbody .linha-item-devolucao')
    ).filter(tr => {
        return Boolean(String(tr.dataset.itemEmpresaId || '').trim());
    });
}

function validarTabelaPedido() {
    const linhas = obterLinhasPreenchidas();

    if (linhas.length === 0) {
        alert('Adicione pelo menos um item na devolução.');
        return false;
    }

    for (let indice = 0; indice < linhas.length; indice += 1) {
        const tr = linhas[indice];
        const numeroLinha = indice + 1;
        const nf = tr.querySelector('.campo-nf-origem')?.value.trim();
        const data = tr.querySelector('.campo-data-nf')?.value.trim();
        const lote = tr.querySelector('.campo-lote-item')?.value.trim();
        const quantidade = converterNumero(
            tr.querySelector('.campo-quantidade-item')?.value
        );
        const preco = converterNumero(tr.dataset.precoUnitario);
        const precoIpi = converterNumero(tr.dataset.PrecoUnitarioIPI);
        const total = converterNumero(tr.dataset.total);
        const totalIpi = converterNumero(tr.dataset.totalIpi);

        if (!nf) {
            alert(`Preencha a NF de origem na linha ${numeroLinha}.`);
            tr.querySelector('.campo-nf-origem')?.focus();
            return false;
        }

        if (!data || !dataDentroDoLimite180Dias(data)) {
            alert(
                `A data da NF na linha ${numeroLinha} deve estar entre ` +
                `${obterDataLimite180DiasISO()} e ${obterDataBaseDevolucaoISO()}.`
            );
            tr.querySelector('.campo-data-nf')?.focus();
            return false;
        }

        if (!lote) {
            alert(`Preencha o lote na linha ${numeroLinha}.`);
            tr.querySelector('.campo-lote-item')?.focus();
            return false;
        }

        if (quantidade <= 0) {
            alert(`Informe uma quantidade válida na linha ${numeroLinha}.`);
            tr.querySelector('.campo-quantidade-item')?.focus();
            return false;
        }

        if (preco <= 0 || precoIpi <= 0 || total <= 0 || totalIpi <= 0) {
            alert(`Informe um preço unitário válido na linha ${numeroLinha}.`);
            tr.querySelector('.campo-preco-unitario-item')?.focus();
            return false;
        }
    }

    return true;
}

function montarObjetoEdicao() {
    const produtos = obterLinhasPreenchidas().map(tr => {
        return {
            devProdId: Number(tr.dataset.devProdId || 0),
            itemId: Number(tr.dataset.itemId || 0),
            nforigem: tr.querySelector('.campo-nf-origem')?.value.trim() || '',
            data: tr.querySelector('.campo-data-nf')?.value || '',
            codigoItem: String(tr.dataset.itemEmpresaId || '').trim(),
            descricao: String(tr.dataset.descricao || '').trim(),
            lote: tr.querySelector('.campo-lote-item')?.value.trim() || '',
            quantidade: converterNumero(
                tr.querySelector('.campo-quantidade-item')?.value
            ),
            uv: tr.querySelector('.campo-unidade-item')?.value.trim() || 'UN',
            precoUnitario: converterNumero(tr.dataset.precoUnitario),
            ipi: converterNumero(tr.dataset.percentualIpi),
            PrecoUnitarioIPI: converterNumero(tr.dataset.PrecoUnitarioIPI),
            total: converterNumero(tr.dataset.total),
            totalIpi: converterNumero(tr.dataset.totalIpi)
        };
    });

    const movimentaEstoque =
        obterMovimentaEstoqueEdicao();

    const uv =
        obterUvEdicao();

    const produtosNormalizados =
        produtos.map(
            produto => {
                return {
                    ...produto,

                    uv:
                        uv
                };
            }
        );

    return {
        motivo:
            el(
                'observation'
            ).value.trim(),

        movimentaEstoque:
            movimentaEstoque,

        produtos:
            produtosNormalizados
    };
}

async function salvarEdicaoDevolucao() {
    if (edicaoBloqueada) {
        alert('Esta devolução não pode ser editada.');
        return;
    }

    if (!devolucaoAtual) {
        alert('Devolução ainda não carregada.');
        return;
    }

    const motivo = el('observation').value.trim();

    if (!motivo) {
        alert('Informe o motivo da devolução.');
        el('observation').focus();
        return;
    }

    if (!validarTabelaPedido()) {
        return;
    }

    if (!confirm('Deseja salvar as alterações desta devolução?')) {
        return;
    }

    const dados = montarObjetoEdicao();

    try {
        mostrarFeedback('Salvando devolução, aguarde...');

        const response = await fetch(
            `/api/devolucao/${devolucaoAtual.id}/editar`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            }
        );

        const texto = await response.text();
        let resultado = null;

        if (texto) {
            try {
                resultado = JSON.parse(texto);
            } catch {
                resultado = {
                    error: texto
                };
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.error ||
                resultado?.erro ||
                resultado?.message ||
                texto ||
                `Erro HTTP ${response.status}`
            );
        }

        alert('Devolução atualizada com sucesso.');
        window.location.href = '/devolucaoPanel';
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        alert(error.message || 'Erro ao salvar devolução.');
    } finally {
        ocultarFeedback();
    }
}

function bloquearCamposEdicao() {
    document
        .querySelectorAll(
            '#dadosPedido input, ' +
            '#observation'
        )
        .forEach(
            campo => {
                campo.readOnly =
                    true;

                campo.style.backgroundColor =
                    '#e9e9e9';

                campo.style.cursor =
                    'not-allowed';

                campo.title =
                    'Esta devolução não pode ser editada.';
            }
        );

    const campoMovimentaEstoque =
        document.getElementById(
            'movimentaEstoque'
        );

    if (campoMovimentaEstoque) {
        campoMovimentaEstoque.disabled =
            true;

        campoMovimentaEstoque.title =
            'Esta devolução não pode ser editada.';
    }

    document
        .querySelectorAll(
            '.btn-remover-linha'
        )
        .forEach(
            botao => {
                botao.disabled =
                    true;

                botao.style.opacity =
                    '0.5';

                botao.style.cursor =
                    'not-allowed';
            }
        );
}

function bloquearLinha(tr) {
    tr.querySelectorAll('input').forEach(input => {
        input.readOnly = true;
        input.style.backgroundColor = '#e9e9e9';
        input.style.cursor = 'not-allowed';
    });

    tr.querySelectorAll('button').forEach(botao => {
        botao.disabled = true;
        botao.style.opacity = '0.5';
        botao.style.cursor = 'not-allowed';
    });
}

async function carregarDevolucao() {
    const id = getIdFromUrl();

    if (!id) {
        alert('ID da devolução não informado.');
        window.location.href = '/devolucaoPanel';
        return;
    }

    try {
        mostrarFeedback('Carregando devolução...');

        const response = await fetch(`/api/devolucao/${id}`);
        const texto = await response.text();
        let dev = null;
        
        if (texto) {
            try {
                dev = JSON.parse(texto);
            } catch {
                throw new Error('A devolução retornou uma resposta inválida.');
            }
        }

        if (!response.ok) {
            throw new Error(
                dev?.error ||
                dev?.message ||
                texto ||
                'Erro ao buscar a devolução.'
            );
        }

        devolucaoAtual = dev;
        dataBaseDevolucao = formatarDataInput(dev.data || dev.Data);

        if (!dataBaseDevolucao) {
            edicaoBloqueada = true;
        }

        preencherDadosDevolucao(dev);

        await obterDadosClienteParaCatalogo(dev);

        renderizarProdutos(
            dev.produtos || []
        );

        atualizarUvTodasAsLinhasEdicao();

        verificarPermissaoEdicao(
            dev
        );

        atualizarTotais();
        console.log(
    'Devolução recebida:',
    dev
);

console.log(
    'MovimentaEstoque recebido:',
    dev.movimentaEstoque,
    dev.MovimentaEstoque
);
    } catch (error) {
        console.error('Erro ao carregar devolução:', error);
        alert(error.message || 'Erro ao carregar devolução.');
    } finally {
        ocultarFeedback();
    }
}

function configurarEventos() {
    const campoMovimentaEstoque =
        document.getElementById(
            'movimentaEstoque'
        );

    campoMovimentaEstoque?.addEventListener(
        'change',
        () => {
            if (edicaoBloqueada) {
                campoMovimentaEstoque.checked =
                    Number(
                        devolucaoAtual?.movimentaEstoque ??
                        devolucaoAtual?.MovimentaEstoque ??
                        0
                    ) === 1;

                return;
            }

            atualizarUvTodasAsLinhasEdicao();
        }
    );
    el('voltarPainel')?.addEventListener('click', () => {
        window.location.href = '/devolucaoPanel';
    });

    el('salvarEdicaoDevolucao')?.addEventListener(
        'click',
        salvarEdicaoDevolucao
    );

    el('adicionarLinha')?.addEventListener('click', () => {
        if (edicaoBloqueada) {
            alert('Esta devolução não pode ser editada.');
            return;
        }

        const novaLinha = adicionarNovaLinhaEditavel();
        novaLinha?.querySelector('.campo-nf-origem')?.focus();
    });

    el('excluirLinha')?.addEventListener('click', () => {
        if (edicaoBloqueada) {
            return;
        }

        const linhas = document.querySelectorAll(
            '#dadosPedido tbody .linha-item-devolucao'
        );

        linhas[linhas.length - 1]?.remove();
        atualizarTotais();
        garantirLinhaInicial();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    configurarEventos();
    await carregarDevolucao();
});
