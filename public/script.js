const timestamp = Date.now();
// ======================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ======================================================================
let clientesData;
let promocaoData;
let foraDeLinhaData;
let icmsSTData;

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

function valorBooleanoAtivo(
    valor
){

    if(valor === true){
        return true;
    }

    if(valor === false){
        return false;
    }

    const valorNormalizado =
        String(
            valor ?? ''
        )
        .trim()
        .toLowerCase();

    return (
        valorNormalizado === 'true' ||
        valorNormalizado === '1' ||
        valorNormalizado === 'sim' ||
        valorNormalizado === 's' ||
        valorNormalizado === 'ativo'
    );

}

function verificarClienteInativoOuSuspenso(
    clienteApi
){

    const clienteAtivo =
        valorBooleanoAtivo(
            clienteApi.ATIVO
        );

    const clienteSuspenso =
        valorBooleanoAtivo(
            clienteApi.SUSPENSO
        );

    if(
        clienteAtivo &&
        !clienteSuspenso
    ){

        return true;

    }

    const motivos =
        [];

    if(!clienteAtivo){

        motivos.push(
            'inativo'
        );

    }

    if(clienteSuspenso){

        motivos.push(
            'suspenso'
        );

    }

    const mensagem =
        'Atenção: o cliente está ' +
        motivos.join(' e ') +
        '.\n\n' +
        'Deseja continuar com o pedido mesmo assim?';

    const desejaContinuar =
        window.confirm(
            mensagem
        );

    if(!desejaContinuar){

        window.location.reload();

        return false;

    }

    return true;

}



// Helper DOM
const el = id => document.getElementById(id);

// ======================================================================
// 📦 CACHE / FETCH DE DADOS INICIAIS
// ======================================================================
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



async function carregarListaPrecos(listaId) {
    const response = await fetch(`/api/lista-preco/${listaId}`);
    listaPrecosData = await response.json();

    console.log('LISTA ID CARREGADA:', listaId);
    console.log('QTD ITENS DA LISTA:', listaPrecosData.length);
    console.log('DADOS DA LISTA:', listaPrecosData);
}

function converterParaBooleano(
    valor
){

    if(valor === true){
        return true;
    }

    if(valor === false){
        return false;
    }

    if(valor === 1){
        return true;
    }

    if(valor === 0){
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
){

    if(!item){
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

    const possuiNomeNaoPermitido =
        descricao.includes(
            'display'
        ) ||
        descricao.includes(
            'bobina'
        );

    return (
        ativo &&
        !suspenso &&
        !foraLinha &&
        !bloqueado &&
        exibeConsultas &&
        !possuiNomeNaoPermitido
    );

}


async function carregarCatalogoCliente(
    clienteCodigo,
    listaCodigo = null
){

    const codigoCliente =
        String(
            clienteCodigo || ''
        )
        .trim();

    if(!codigoCliente){

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

    try{

        const parametros =
            new URLSearchParams();

        if(listaCodigo){

            parametros.set(
                'listaCodigo',
                listaCodigo
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

        const resultado =
            await response.json();

        if(!response.ok){

            throw new Error(
                resultado.mensagem ||
                resultado.message ||
                'Não foi possível carregar o catálogo do cliente.'
            );

        }

        const itensRecebidos =
            Array.isArray(
                resultado.itens
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
            resultado.listaPreco ||
            null;

        catalogoClientePorCodigo =
            new Map();

        itensDisponiveis.forEach(item => {

            const codigoItem =
                normalizarCodigoItem(
                    item.itemEmpresaId
                );

            if(!codigoItem){
                return;
            }

            catalogoClientePorCodigo.set(
                codigoItem,
                item
            );

        });

        catalogoClienteCarregado =
            true;

        if(dadosListaPrecoAtual){

            el('codgroup').value =
                dadosListaPrecoAtual.codigo ||
                '';

            el('group').value =
                dadosListaPrecoAtual.descricao ||
                '';

        }
    console.log(
        'Catálogo do cliente carregado:',
        {
            listaPreco:
                dadosListaPrecoAtual,

            totalRecebido:
                itensRecebidos.length,

            totalDisponivel:
                itensDisponiveis.length,

            totalRemovido:
                itensRecebidos.length -
                itensDisponiveis.length,

            totalIndexado:
                catalogoClientePorCodigo.size,

            erros:
                resultado.erros || []
        }
    );
        return resultado;

    }finally{

        catalogoClienteCarregando =
            false;

            let datalist = document.getElementById('lista-produtos-cliente');

        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'lista-produtos-cliente';
            document.body.appendChild(datalist);
        }

        datalist.innerHTML = '';

        catalogoClienteData.forEach(item => {
            const option = document.createElement('option');

            option.value =
                `${item.itemEmpresaId} - ${item.descricao}`;

            datalist.appendChild(option);
        });

        hideFeedback();

    }

}

function buscarItemNoCatalogo(
    codigoDigitado
){

    const codigo =
        normalizarCodigoItem(
            codigoDigitado
        );

    if(!codigo){
        return null;
    }

    return (
        catalogoClientePorCodigo.get(
            codigo
        ) ||
        null
    );

}

function limparProdutos(){

    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    tbody.innerHTML =
        '';

    catalogoClienteData =
        [];

    catalogoClientePorCodigo =
        new Map();

    catalogoClienteCarregado =
        false;

    catalogoClienteCarregando =
        false;

    dadosListaPrecoAtual =
        null;

    atualizarTotais();

}

function normalizarCodigoItem(
    valor
){

    return String(valor || '')
        .trim()
        .toUpperCase();

}

console.log('script.js carregado');



// limpar tudo ao atualizar page (run once)
 limparCamposCliente();
 atualizarTotais();

// ======================================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ======================================================================
function formatarCNPJ(valor){

    const numeros =
        String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 14);

    if(numeros.length <= 2){
        return numeros;
    }

    if(numeros.length <= 5){

        return numeros.replace(
            /^(\d{2})(\d+)/,
            '$1.$2'
        );

    }

    if(numeros.length <= 8){

        return numeros.replace(
            /^(\d{2})(\d{3})(\d+)/,
            '$1.$2.$3'
        );

    }

    if(numeros.length <= 12){

        return numeros.replace(
            /^(\d{2})(\d{3})(\d{3})(\d+)/,
            '$1.$2.$3/$4'
        );

    }

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/,
        '$1.$2.$3/$4-$5'
    );

}

function obterCNPJNumerico(valor){
    return ajustarCNPJ(
        String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 14)
    );
}

function montarSrcFotoItem(
    foto
){

    const valor =
        String(
            foto || ''
        )
        .trim();

    if(!valor){
        return '';
    }

    if(
        valor.startsWith(
            'data:image/'
        )
    ){
        return valor;
    }

    /*
     * Ajuste o tipo se a API puder retornar JPEG/WebP.
     * Pelo exemplo apresentado, a imagem começa com
     * iVBOR, indicando PNG.
     */
    return (
        `data:image/png;base64,${valor}`
    );

}

function limparDadosLinhaItem(
    tr,
    manterPesquisa = true
){

    if(!tr){
        return;
    }

    const campoPesquisa =
        tr.querySelector(
            '.campo-item-pesquisa'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const camposLimpar = [
        '.campo-unidade-item',
        '.campo-ipi-item',
        '.campo-preco-unitario-item',
        '.campo-preco-com-ipi-item',
        '.campo-total-item',
        '.campo-item-id'
    ];

    if(
        !manterPesquisa &&
        campoPesquisa
    ){

        campoPesquisa.value =
            '';

    }

    if(campoQuantidade){

        campoQuantidade.value =
            '';

        campoQuantidade.readOnly =
            true;

    }

    camposLimpar.forEach(seletor => {

        const campo =
            tr.querySelector(
                seletor
            );

        if(campo){

            campo.value =
                '';

        }

    });

    const imagem =
        tr.querySelector(
            '.foto-item-pedido'
        );

    if(imagem){

        imagem.removeAttribute(
            'src'
        );

        imagem.alt =
            'Foto do item';

        imagem.classList.add(
            'sem-foto'
        );

    }

    tr.dataset.itemId =
        '';

    tr.dataset.itemEmpresaId =
        '';

    tr.dataset.descricao =
        '';

    tr.dataset.preco =
        '';

    tr.dataset.ipi =
        '';

}

function preencherLinhaComItem(
    tr,
    item
){

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

    const campoIpi =
        tr.querySelector(
            '.campo-ipi-item'
        );

    const campoPreco =
        tr.querySelector(
            '.campo-preco-unitario-item'
        );

    const campoPrecoComIpi =
        tr.querySelector(
            '.campo-preco-com-ipi-item'
        );

    const campoItemId =
        tr.querySelector(
            '.campo-item-id'
        );

    const imagem =
        tr.querySelector(
            '.foto-item-pedido'
        );

    const preco =
        Number(
            item.preco || 0
        );

    if(
        !Number.isFinite(preco) ||
        preco <= 0
    ){

        throw new Error(
            'Preço do item inválido ou indisponível.'
        );

    }

    const ipi =
        obterIpiDoItem(
            item
        );

    const precoComIpi =
        preco *
        (
            1 + ipi
        );

    const codigo =
        String(
            item.itemEmpresaId || ''
        )
        .trim();

    const descricao =
        String(
            item.descricao || ''
        )
        .trim();

    campoPesquisa.value =
        `${codigo} - ${descricao}`;

    campoUnidade.value =
        item.unidade ||
        'CX';

    campoIpi.value =
        (ipi * 100)
            .toLocaleString(
                'pt-BR',
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            ) +
        '%';

    campoPreco.value =
        preco.toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );

    campoPrecoComIpi.value =
        precoComIpi.toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );

    campoItemId.value =
        String(
            item.itemId || ''
        );

    tr.dataset.itemId =
        String(
            item.itemId || ''
        );

    tr.dataset.itemEmpresaId =
        codigo;

    tr.dataset.descricao =
        descricao;

    tr.dataset.preco =
        String(
            preco
        );

    tr.dataset.ipi =
        String(
            ipi
        );

    const srcFoto =
        montarSrcFotoItem(
            item.foto
        );

    if(
        imagem &&
        srcFoto
    ){

        imagem.src =
            srcFoto;

        imagem.alt =
            `Foto do item ${codigo}`;

        imagem.classList.remove(
            'sem-foto'
        );

    }else if(imagem){

        imagem.removeAttribute(
            'src'
        );

        imagem.classList.add(
            'sem-foto'
        );

    }

    campoQuantidade.readOnly =
        false;

}

function validarDisponibilidadeItem(
    item
){

    if(!item){

        throw new Error(
            'Item não encontrado na lista de preços do cliente.'
        );

    }
    
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

    if(
        descricao.includes('display') ||
        descricao.includes('bobina')
    ){

        throw new Error(
            'Itens com descrição contendo DISPLAY ou BOBINA não podem ser adicionados ao pedido.'
        );

    }

    if(
        !converterParaBooleano(
            item.ativo
        )
    ){

        throw new Error(
            'Item inativo.'
        );

    }

    if(
        converterParaBooleano(
            item.suspenso
        )
    ){

        throw new Error(
            'Item suspenso.'
        );

    }

    if(
        converterParaBooleano(
            item.foraLinha
        )
    ){

        throw new Error(
            'Item fora de linha.'
        );

    }

    if(
        converterParaBooleano(
            item.bloqueado
        )
    ){

        throw new Error(
            'Item bloqueado.'
        );

    }

    if(
        item.exibeConsultasListaPreco !== undefined &&
        item.exibeConsultasListaPreco !== null &&
        !converterParaBooleano(
            item.exibeConsultasListaPreco
        )
    ){

        throw new Error(
            'Item indisponível para consulta na lista de preços.'
        );

    }

    return true;

}

function configurarMascaraCNPJ(){

    const campoCNPJ =
        document.getElementById(
            'cnpj'
        );

    if(!campoCNPJ){
        return;
    }

    campoCNPJ.type =
        'text';

    campoCNPJ.inputMode =
        'numeric';

    campoCNPJ.maxLength =
        18;

    campoCNPJ.autocomplete =
        'off';

    campoCNPJ.addEventListener(
        'input',
        () => {

            campoCNPJ.value =
                formatarCNPJ(
                    campoCNPJ.value
                );

        }
    );

    campoCNPJ.addEventListener(
        'paste',
        evento => {

            evento.preventDefault();

            const textoColado =
                evento.clipboardData
                    ?.getData('text') || '';

            campoCNPJ.value =
                formatarCNPJ(
                    textoColado
                );

            campoCNPJ.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );

        }
    );

}


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

function validarTabelaPedido(){

    const linhas =
        Array.from(
            document.querySelectorAll(
                '#dadosPedido tbody .linha-item-pedido'
            )
        )
        .filter(tr => {

            return Boolean(
                tr.dataset.itemEmpresaId
            );

        });

    if(linhas.length === 0){

        alert(
            'Adicione pelo menos um item no pedido.'
        );

        return false;

    }

    for(
        let indice = 0;
        indice < linhas.length;
        indice++
    ){

        const tr =
            linhas[indice];

        const campoQuantidade =
            tr.querySelector(
                '.campo-quantidade-item'
            );

        const quantidade =
            Number(
                String(
                    campoQuantidade?.value || '0'
                )
                .replace(',', '.')
            );

        const codigo =
            String(
                tr.dataset.itemEmpresaId || ''
            )
            .trim();

        const descricao =
            String(
                tr.dataset.descricao || ''
            )
            .trim();

        const preco =
            Number(
                tr.dataset.preco || 0
            );

        if(
            !codigo ||
            !descricao ||
            !Number.isFinite(quantidade) ||
            quantidade <= 0 ||
            !Number.isFinite(preco) ||
            preco <= 0 ||
            !tr.dataset.itemId
        ){

            alert(
                `Preencha corretamente os dados da linha ${indice + 1}.`
            );

            campoQuantidade?.focus();

            return false;

        }

    }

    return true;

}

function buscarItemPorDescricao(texto) {
    const pesquisa = String(texto || '')
        .trim()
        .toUpperCase();

    if (!pesquisa) {
        return null;
    }

    return catalogoClienteData.find(item =>
        String(item.descricao || '')
            .toUpperCase()
            .includes(pesquisa)
    ) || null;
}

function validarPedidoMinimo() {

    totalComIpiPed = totalComIpi();
    const estado = el('uf').value
    console.log("estado:"+ estado)
    
    console.log("total:"+ totalComIpiPed)
    let limite = [];

    //limite com 4000
    limite['DF'] = 4000;
    limite['GO'] = 4000;
    limite['MS'] = 4000;
    limite['MT'] = 4000;
    limite['AL'] = 4000;
    limite['BA'] = 4000;
    limite['CE'] = 4000;
    limite['MA'] = 4000;
    limite['PB'] = 4000;
    limite['PE'] = 4000;
    limite['PI'] = 4000;
    limite['RN'] = 4000;
    limite['SE'] = 4000;
    limite['AC'] = 4000;
    limite['AM'] = 4000;
    limite['AP'] = 4000;
    limite['PA'] = 4000;
    limite['RO'] = 4000;
    limite['RR'] = 4000;
    limite['TO'] = 4000;

    //limite com 3500
    limite['ES'] = 3500;
    limite['MG'] = 3500;
    limite['RJ'] = 3500;
    limite['SP'] = 3500;

    //limite com 3000
    limite['PR'] = 3000;
    limite['RS'] = 3000;
    limite['SC'] = 3000;

    if(limite[estado]<=totalComIpiPed)
        return true;
    else
        alert(`Limite mínimo de R$${limite[estado]},00 não atingido!`);
        return false;
}

// ======================================================================
// 👤 CLIENTE / CNPJ
// ======================================================================
function limparCamposCliente() {
    [
        'razao_social','ie','representante','endereco','bairro','cidade','uf',
        'cep','telefone','email','email_fiscal','cod_cliente','pay','group',
        'transp','codgroup','email_rep'
    ].forEach(id => el(id).value = '');
}

// Feedback
const showFeedback = msg => { el('feedback1').style.display = 'block'; el('feedback1').textContent = msg; };
const hideFeedback = () => { el('feedback1').style.display = 'none'; el('feedback1').textContent = ''; };

// Modal bloqueio CNPJ
const cnpjInput1 = el('cnpj');
const codInput1 = el('cod_cliente');
// const blockModal = el('blockModal');
// el('okButton').onclick = () => blockModal.style.display = "none";
// blockModal.querySelector('.close-button').onclick = () => blockModal.style.display = "none";

cnpjInput1.addEventListener('focus', () => {
    if (cnpjInput1.readOnly) {
        // blockModal.style.display = "block";
        el('timestamp').textContent = new Date().toLocaleString('pt-BR');
        return;
    }
   // limparCamposCliente();
});

// ======================================================================
// 🔄 BLUR CNPJ → API CLIENTE
// ======================================================================
cnpjInput1.addEventListener('blur', async function () {
    limparProdutos();
    let cnpj =
    ajustarCNPJ(
        obterCNPJNumerico(
            this.value
        )
    );
    if (cnpj.length !== 14 || cnpjInvalido(cnpj)) {
        alert("CNPJ inválido.");
        this.focus();
        return;
    }

    this.value = formatarCNPJ(cnpj);

    showFeedback('Carregando cliente...');
    this.readOnly = true;
    let api = "documento"
    let clienteApi;

    try {
        const res = await fetch(`/api/cliente/${api}/${encodeURIComponent(cnpj)}`);
        if (!res.ok) throw new Error();
        clienteApi = await res.json();

        const podeContinuar =
            verificarClienteInativoOuSuspenso(
                clienteApi
            );

        if(!podeContinuar){

            return;

        }

        console.log(
            'LISTA:',
            clienteApi["LISTA"]
        );

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

        const c = buscarCliente(cnpj);
        if (!c) return alert('Cliente não encontrado.');

        preencherCliente(
            clientesData[1]
        );

        const clienteCodigo =
            clienteApi.codigo ??
            clienteApi.Codigo ??
            clienteApi['COD CLIENTE 2'] ??
            clienteApi['CODIGO'] ??
            document.getElementById(
                'cod_cliente'
            )?.value;

        const listaCodigoPreferida =
            clienteApi.LISTA ??
            clienteApi.listaPrecoCodigo ??
            null;

        await carregarCatalogoCliente(
            clienteCodigo,
            listaCodigoPreferida
        );
        hideFeedback();
        this.readOnly = false;
        garantirLinhaInicial();
        // setTimeout(() => document.querySelector('#dadosPedido tbody tr input')?.focus(), 0);
    } catch {
        alert("Cliente não encontrado, verificar com o financeiro.");
        hideFeedback();
    } finally {

    }
});



codInput1.addEventListener('blur', async function () {
    limparProdutos();
    let cnpj = this.value



    showFeedback('Carregando cliente...');
    this.readOnly = true;
    let api = "codigo"
    let clienteApi;

    try {
        const res = await fetch(`/api/cliente/${api}/${cnpj}`);
        if (!res.ok) throw new Error();
        clienteApi = await res.json();

        const podeContinuar =
            verificarClienteInativoOuSuspenso(
                clienteApi
            );

        if(!podeContinuar){

            return;

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
            clienteApi['CODIGO'] ??
            document.getElementById(
                'cod_cliente'
            )?.value;

        const listaCodigoPreferida =
            clienteApi.LISTA ??
            clienteApi.listaPrecoCodigo ??
            null;

        await carregarCatalogoCliente(
            clienteCodigo,
            listaCodigoPreferida
        );
                hideFeedback();
        this.readOnly = false;
        garantirLinhaInicial();
        // setTimeout(() => document.querySelector('#dadosPedido tbody tr input')?.focus(), 0);
    } catch {
        alert("Cliente não encontrado, verificar com o financeiro.");
        hideFeedback();
        return;
    } finally {

    }
});



function preencherCliente(c) {
    el('cnpj').value = formatarCNPJ(obterCNPJNumerico(c[1]));
      
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
    atualizarTotalComImposto();
}

function garantirLinhaInicial() {
    const tbody = el('dadosPedido').querySelector('tbody');
    tbody.querySelectorAll('tr').forEach(tr => !tr.querySelector('input') && tr.remove());
    if (!tbody.querySelector('tr')) adicionarNovaLinha();
}


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


    // setTimeout(() => {
    //     const primeiraLinha = document.querySelector('#dadosPedido tbody tr');
    //     primeiraLinha?.cells[0]?.querySelector('input')?.focus();
    // }, 0);

    atualizarTotais();
}
// Adiciona o evento para zerar os campos quando o tipo de pedido for alterado

document.getElementById('tipo_pedido').addEventListener('change', function () {
 
    let tipoPedido1 = this.value;
    if (tipoPedido1 === 'Bonificação') {
        document.getElementById('referencia').value = 'BONIFICAÇÃO';
    } else {
        document.getElementById('referencia').value = '';
}
});

// Função para atualizar o total de volumes (quantidades) de todas as linhas
function atualizarTotalVolumes(){

    let totalVolumes =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody .linha-item-pedido'
        )
        .forEach(tr => {

            const campoQuantidade =
                tr.querySelector(
                    '.campo-quantidade-item'
                );

            const quantidade =
                Number(
                    String(
                        campoQuantidade?.value || '0'
                    )
                    .replace(',', '.')
                );

            if(Number.isFinite(quantidade)){

                totalVolumes +=
                    quantidade;

            }

        });

    document.getElementById(
        'volume'
    ).value =
        totalVolumes;

}

// Função para atualizar o total de produtos (quantidade * valor unitário)
function atualizarTotalProdutos(){

    let totalProdutos =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody .linha-item-pedido'
        )
        .forEach(tr => {

            const campoQuantidade =
                tr.querySelector(
                    '.campo-quantidade-item'
                );

            const quantidade =
                Number(
                    String(
                        campoQuantidade?.value || '0'
                    )
                    .replace(',', '.')
                );

            const preco =
                Number(
                    tr.dataset.preco || 0
                );

            if(
                Number.isFinite(quantidade) &&
                Number.isFinite(preco)
            ){

                totalProdutos +=
                    quantidade *
                    preco;

            }

        });

    document.getElementById(
        'total'
    ).value =
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

// Função para atualizar o total com imposto de todas as linhas
function atualizarTotalComImposto() {
       totalComIpiat = totalComIpi()
    document.getElementById('totalComIpi').value = totalComIpiat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function totalComIpi(){

    let total =
        0;

    document
        .querySelectorAll(
            '#dadosPedido tbody .linha-item-pedido'
        )
        .forEach(tr => {

            const campoQuantidade =
                tr.querySelector(
                    '.campo-quantidade-item'
                );

            const quantidade =
                Number(
                    String(
                        campoQuantidade?.value || '0'
                    )
                    .replace(',', '.')
                );

            const preco =
                Number(
                    tr.dataset.preco || 0
                );

            const ipi =
                Number(
                    tr.dataset.ipi || 0
                );

            if(
                Number.isFinite(quantidade) &&
                Number.isFinite(preco) &&
                Number.isFinite(ipi)
            ){

                total +=
                    quantidade *
                    preco *
                    (
                        1 + ipi
                    );

            }

        });

    return total;

}

//Buscar IPI pelo código do item

function getIpi(classificacao){

    const somenteNumeros =
        String(classificacao || '')
            .replace(/\D/g, '');

    if(!somenteNumeros){
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

// Função para adicionar uma nova linha à tabela
function adicionarNovaLinha(){

    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    const tr =
        document.createElement(
            'tr'
        );

    tr.classList.add(
        'linha-item-pedido'
    );

    tr.innerHTML = `
        <td class="celula-foto-item">
            <img
                class="foto-item-pedido sem-foto"
                alt="Foto do item"
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
                class="campo-quantidade-item"
                inputmode="decimal"
                autocomplete="off"
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
                class="campo-preco-unitario-item"
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

        <td class="celula-excluir-item">
            <button
                type="button"
                class="btn-remover-linha"
                tabindex="-1"
            >
                Excluir
            </button>
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

    configurarLinhaItemPedido(
        tr
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

// Função para verificar duplicatas de código na tabela
function verificarCodigoDuplicado(codigo) {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');
    let contador = 0;

    linhas.forEach(tr => {
        const inputCodigo = tr.cells[0]?.querySelector('input');
        if (inputCodigo && inputCodigo.value === codigo) {
            contador++;
        }
    });

    return contador > 1;
}

function aguardarCarregamentoItem(
    linha,
    tempoLimite = 15000
){

    return new Promise(resolve => {

        let finalizado =
            false;

        const concluir =
            resultado => {

                if(finalizado){
                    return;
                }

                finalizado =
                    true;

                clearTimeout(
                    temporizador
                );

                linha.removeEventListener(
                    'carregamento-item-finalizado',
                    receberResultado
                );

                resolve(
                    resultado
                );

            };

        const receberResultado =
            evento => {

                concluir({
                    sucesso:
                        evento.detail?.sucesso ===
                        true,

                    codigo:
                        evento.detail?.codigo ||
                        '',

                    mensagem:
                        evento.detail?.mensagem ||
                        ''
                });

            };

        const temporizador =
            setTimeout(
                () => {

                    concluir({
                        sucesso: false,
                        codigo: '',
                        mensagem:
                            'Tempo limite excedido ao carregar o item.'
                    });

                },
                tempoLimite
            );

        linha.addEventListener(
            'carregamento-item-finalizado',
            receberResultado,
            {
                once: true
            }
        );

    });

}

function obterIpiDoItem(
    item
){

    const origem =
        Number(
            item.origem || 0
        );

    /*
     * Mantém a regra atual:
     * somente origem 2 utiliza a tabela getIpi.
     */
    if(origem !== 2){
        return 0;
    }

    const classificacaoFiscal =
        String(
            item.classificacaoFiscal || ''
        )
        .replace(/\D/g, '');

    if(!classificacaoFiscal){

        throw new Error(
            `A classificação fiscal do item ${item.itemEmpresaId || ''} não foi informada.`
        );

    }

    const ipi =
        getIpi(
            classificacaoFiscal
        );

    if(ipi === null){

        throw new Error(
            `A classificação fiscal ${classificacaoFiscal} não está cadastrada na função getIpi.`
        );

    }

    return ipi;

}

function atualizarTotalLinhaItem(
    tr
){

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const campoTotal =
        tr.querySelector(
            '.campo-total-item'
        );

    const quantidade =
        Number(
            String(
                campoQuantidade?.value || '0'
            )
            .replace(',', '.')
        );

    const preco =
        Number(
            tr.dataset.preco || 0
        );

    const ipi =
        Number(
            tr.dataset.ipi || 0
        );

    const totalComIpi =
        (
            Number.isFinite(quantidade)
                ? quantidade
                : 0
        ) *
        preco *
        (
            1 + ipi
        );

    campoTotal.value =
        totalComIpi.toLocaleString(
            'pt-BR',
            {
                style:
                    'currency',

                currency:
                    'BRL'
            }
        );

    atualizarTotais();

}

function buscarItemPorPesquisa(
    valorDigitado
){

    const texto =
        String(
            valorDigitado || ''
        )
        .trim();

    if(!texto){
        return null;
    }

    const separador =
        texto.indexOf(
            ' - '
        );

    if(separador >= 0){

        const codigoExtraido =
            normalizarCodigoItem(
                texto.substring(
                    0,
                    separador
                )
            );

        const itemPorCodigoExtraido =
            buscarItemNoCatalogo(
                codigoExtraido
            );

        if(itemPorCodigoExtraido){
            return itemPorCodigoExtraido;
        }

    }

    const codigoDireto =
        normalizarCodigoItem(
            texto
        );

    const itemPorCodigo =
        buscarItemNoCatalogo(
            codigoDireto
        );

    if(itemPorCodigo){
        return itemPorCodigo;
    }

    const pesquisa =
        texto.toUpperCase();

    const correspondenciasExatas =
        catalogoClienteData.filter(item => {

            const descricao =
                String(
                    item.descricao || ''
                )
                .trim()
                .toUpperCase();

            return descricao === pesquisa;

        });

    if(correspondenciasExatas.length === 1){
        return correspondenciasExatas[0];
    }

    return null;

}

function configurarLinhaItemPedido(
    tr
){

    if(!tr){
        return;
    }

    const tbody =
        tr.closest(
            'tbody'
        );

    const campoPesquisa =
        tr.querySelector(
            '.campo-item-pesquisa'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const botaoRemover =
        tr.querySelector(
            '.btn-remover-linha'
        );

    if(
        !tbody ||
        !campoPesquisa ||
        !campoQuantidade
    ){

        console.error(
            'A estrutura da linha do pedido está incompleta.',
            tr
        );

        return;

    }

    campoPesquisa.tabIndex =
        0;

    campoQuantidade.tabIndex =
        0;

    campoQuantidade.readOnly =
        true;

    let carregandoItem =
        false;

    let processandoItem =
        false;

    let ultimoItemCarregado =
        '';

    async function processarItemSelecionado(){

        if(processandoItem){
            return false;
        }

        const valorDigitado =
            campoPesquisa.value.trim();

        if(!valorDigitado){

            limparDadosLinhaItem(
                tr,
                false
            );

            return false;

        }

        processandoItem =
            true;

        carregandoItem =
            true;

        campoPesquisa.readOnly =
            true;

        try{

            if(catalogoClienteCarregando){

                throw new Error(
                    'A lista de produtos ainda está sendo carregada. Aguarde.'
                );

            }

            if(!catalogoClienteCarregado){

                throw new Error(
                    'Carregue um cliente antes de informar os itens.'
                );

            }

            const item =
                buscarItemPorPesquisa(
                    valorDigitado
                );

            validarDisponibilidadeItem(
                item
            );

            const codigo =
                normalizarCodigoItem(
                    item.itemEmpresaId
                );

            if(
                verificarCodigoDuplicadoNaTabela(
                    codigo,
                    tr
                )
            ){

                throw new Error(
                    'Este item já foi adicionado ao pedido.'
                );

            }

            limparDadosLinhaItem(
                tr,
                true
            );

            preencherLinhaComItem(
                tr,
                item
            );

            ultimoItemCarregado =
                codigo;

            tr.dispatchEvent(
                new CustomEvent(
                    'carregamento-item-finalizado',
                    {
                        detail: {
                            sucesso: true,
                            codigo: codigo,
                            mensagem: ''
                        }
                    }
                )
            );

            setTimeout(
                () => {

                    campoQuantidade.focus();

                    campoQuantidade.select();

                },
                0
            );

            return true;

        }catch(error){

            const mensagem =
                error.message ||
                'Item indisponível.';

            console.warn(
                'O item não foi carregado:',
                error
            );

            ultimoItemCarregado =
                '';

            limparDadosLinhaItem(
                tr,
                false
            );

            atualizarTotais();

            tr.dispatchEvent(
                new CustomEvent(
                    'carregamento-item-finalizado',
                    {
                        detail: {
                            sucesso: false,
                            codigo: '',
                            mensagem: mensagem
                        }
                    }
                )
            );

            const importandoPedido =
                document.body.classList.contains(
                    'importando-pedido'
                );

            if(!importandoPedido){

                alert(
                    mensagem
                );

                setTimeout(
                    () => {

                        campoPesquisa.focus();

                    },
                    0
                );

            }

            return false;

        }finally{

            campoPesquisa.readOnly =
                false;

            carregandoItem =
                false;

            processandoItem =
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

            if(!item){
                return;
            }

            const codigo =
                normalizarCodigoItem(
                    item.itemEmpresaId
                );

            if(
                codigo &&
                codigo !== ultimoItemCarregado &&
                !processandoItem
            ){

                processarItemSelecionado();

            }

        }
    );

    campoPesquisa.addEventListener(
        'change',
        () => {

            if(
                campoPesquisa.value.trim() &&
                !processandoItem
            ){

                processarItemSelecionado();

            }

        }
    );

    campoPesquisa.addEventListener(
        'blur',
        () => {

            if(
                campoPesquisa.value.trim() &&
                !tr.dataset.itemId &&
                !processandoItem
            ){

                processarItemSelecionado();

            }

        }
    );

    campoPesquisa.addEventListener(
        'keydown',
        evento => {

            if(
                evento.key !== 'Tab' &&
                evento.key !== 'Enter'
            ){
                return;
            }

            if(evento.shiftKey){
                return;
            }

            evento.preventDefault();

            if(carregandoItem){
                return;
            }

            processarItemSelecionado();

        }
    );

    campoQuantidade.addEventListener(
        'input',
        () => {

            atualizarTotalLinhaItem(
                tr
            );

        }
    );

    campoQuantidade.addEventListener(
        'keydown',
        evento => {

            if(
                evento.key !== 'Tab' &&
                evento.key !== 'Enter'
            ){
                return;
            }

            if(evento.shiftKey){
                return;
            }

            evento.preventDefault();

            const quantidade =
                Number(
                    String(
                        campoQuantidade.value || '0'
                    )
                    .replace(',', '.')
                );

            if(
                !Number.isFinite(quantidade) ||
                quantidade <= 0
            ){

                alert(
                    'Informe uma quantidade maior que zero.'
                );

                campoQuantidade.focus();

                campoQuantidade.select();

                return;

            }

            atualizarTotalLinhaItem(
                tr
            );

            const linhas =
                Array.from(
                    tbody.querySelectorAll(
                        '.linha-item-pedido'
                    )
                );

            const indiceLinhaAtual =
                linhas.indexOf(
                    tr
                );

            let proximaLinha =
                linhas[
                    indiceLinhaAtual + 1
                ];

            if(!proximaLinha){

                proximaLinha =
                    adicionarNovaLinha();

            }

            const campoProximoItem =
                proximaLinha?.querySelector(
                    '.campo-item-pesquisa'
                );

            setTimeout(
                () => {

                    campoProximoItem?.focus();

                    campoProximoItem?.select();

                },
                0
            );

        }
    );

    campoQuantidade.addEventListener(
        'keydown',
        evento => {

            if(
                evento.key === 'Tab' &&
                evento.shiftKey
            ){

                evento.preventDefault();

                campoPesquisa.focus();

                campoPesquisa.select();

            }

        }
    );

    botaoRemover?.addEventListener(
        'click',
        () => {

            tr.remove();

            atualizarTotais();

            garantirLinhaInicial();

        }
    );

}

function exportarPedidoExcel(){

    if(typeof XLSX === 'undefined'){

        alert(
            'A biblioteca de Excel não foi carregada.'
        );

        return;

    }

    const tableRows =
        document.querySelectorAll(
            '#dadosPedido tbody tr'
        );

    const requestBody = {
        cnpj:
            obterCNPJNumerico(
                document.getElementById('cnpj')
                    ?.value
            ),

        ie:
            document.getElementById('ie')
                ?.value || '',

        representante:
            document.getElementById('representante')
                ?.value || '',

        tipoPedido:
            document.getElementById('tipo_pedido')
                ?.value || '',

        razaoSocial:
            document.getElementById('razao_social')
                ?.value || '',

        codClienteTexto:
            document.getElementById('cod_cliente')
                ?.value || '',

        endereco:
            document.getElementById('endereco')
                ?.value || '',

        bairro:
            document.getElementById('bairro')
                ?.value || '',

        cidade:
            document.getElementById('cidade')
                ?.value || '',

        uf:
            document.getElementById('uf')
                ?.value || '',

        cep:
            document.getElementById('cep')
                ?.value || '',

        telefone:
            document.getElementById('telefone')
                ?.value || '',

        email:
            document.getElementById('email')
                ?.value || '',

        emailFiscal:
            document.getElementById('email_fiscal')
                ?.value || '',

        condicaoPagamentoTexto:
            document.getElementById('pay')
                ?.value || '',

        transporte:
            document.getElementById('transp')
                ?.value || '',

        tabelaTexto:
            document.getElementById('group')
                ?.value || '',

        formaPagamentoTexto:
            document.getElementById('formPagDescricao')
                ?.value || '',

        ListaPrecoId:
            Number(
                document.getElementById('codgroup')
                    ?.value || 0
            ),

        CondicaoPagamentoId:
            Number(
                document.getElementById('condPagId')
                    ?.value || 0
            ),

        FormaPagamentoId:
            Number(
                document.getElementById('formPagId')
                    ?.value || 0
            ),

        ClienteId:
            Number(
                document.getElementById('cod_cliente')
                    ?.value || 0
            ),

        ContatoClienteId:
            Number(
                document.getElementById('ContatoClienteId')
                    ?.value || 0
            ),

        NumeroReferencia:
            document.getElementById('referencia')
                ?.value || '',

        Observacao:
            document.getElementById('observation')
                ?.value || ''
    };

    const itensExcel =
    Array.from(tableRows)
        .map(row => {

            const codigo =
                String(
                    row.dataset.itemEmpresaId || ''
                )
                .trim();

            const descricao =
                String(
                    row.dataset.descricao || ''
                )
                .trim();

            const quantidade =
                Number(
                    String(
                        row.querySelector(
                            '.campo-quantidade-item'
                        )
                        ?.value || '0'
                    )
                    .replace(',', '.')
                );


            if(
                !codigo ||
                quantidade <= 0 ||
                !descricao ||
                !row.dataset.itemId
            ){
                return null;
            }

            return {
                Codigo:
                    codigo,

                Quantidade:
                    quantidade,

                Unidade:
                    row.querySelector(
                        '.campo-unidade-item'
                    )
                    ?.value || '',

                Descricao:
                    descricao,

                IPI:
                    row.querySelector(
                        '.campo-ipi-item'
                    )
                    ?.value || '',

                PrecoUnitario:
                    row.querySelector(
                        '.campo-preco-unitario-item'
                    )
                    ?.value || '',

                PrecoComIPI:
                    row.querySelector(
                        '.campo-preco-com-ipi-item'
                    )
                    ?.value || '',

                Total:
                    row.querySelector(
                        '.campo-total-item'
                    )
                    ?.value || ''
            };

        })
        .filter(Boolean);

    if(itensExcel.length === 0){

        alert(
            'Não existem itens válidos para exportar.'
        );

        return;

    }

    const workbook =
        XLSX.utils.book_new();

    /*
     * Aba Pedido.
     */
    const pedidoSheet =
        XLSX.utils.json_to_sheet([
            requestBody
        ]);

    XLSX.utils.book_append_sheet(
        workbook,
        pedidoSheet,
        'Pedido'
    );

    /*
     * Aba Itens.
     */
    const itensSheet =
        XLSX.utils.json_to_sheet(
            itensExcel
        );

    XLSX.utils.book_append_sheet(
        workbook,
        itensSheet,
        'Itens'
    );

    /*
     * Remove caracteres inválidos do nome do arquivo.
     */
    const nomeCliente =
        String(
            requestBody.razaoSocial ||
            'Pedido'
        )
        .replace(/[\\/:*?"<>|]/g, '')
        .trim();

    const dataHora =
        new Date()
            .toISOString()
            .replace(/[:.]/g, '-');

    const nomeArquivo =
        `${nomeCliente || 'Pedido'} - ${dataHora}.xlsx`;

    XLSX.writeFile(
        workbook,
        nomeArquivo
    );

}




//--inicio-----envio de dados para o sistema DBCorp-----------------------------------------------------------------------------------------////






const btSistema = document.getElementById('button_sistema');
const feedbackDiv = document.getElementById('feedback1');
const modal = document.getElementById('customModal');
const closeButton = document.querySelector('.close-button');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');
const cnpjInput = document.getElementById('cnpj');
const btPdfGeneration = document.getElementById('button_pdf');



// Função para abrir o modal
btSistema.addEventListener("click", () => {
    if(!validarTabelaPedido())
        return;
    if(document.getElementById('tipo_pedido').value == "Venda")
        if(!validarPedidoMinimo())                          
            return;
    modal.style.display = "block"; // Exibe o modal
});

// Fecha o modal ao clicar no botão "Não" ou no botão de fechar
closeButton.addEventListener("click", () => {
    modal.style.display = "none";
});

cancelButton.addEventListener("click", () => {
    modal.style.display = "none";
    console.log('Envio cancelado.');
});

// Executa a lógica de envio ao clicar no botão "Sim"
confirmButton.addEventListener("click", async () => {
    modal.style.display = "none"; // Fecha o modal


    // Exibe a mensagem de feedback
    feedbackDiv.textContent = 'Estamos enviando o pedido, aguarde...';
    feedbackDiv.style.display = "block";
    cnpjInput.readOnly = false; // Habilita o campo CNPJ

    

    try {

        // Captura as linhas da tabela
        const tableRows = document.querySelectorAll('#dadosPedido tbody tr');

        // Cria o array dinâmico para ItensPedidoVenda
 
        const itensPedidoVenda =
    Array.from(tableRows)
        .map(row => {

            const itemId =
                Number(
                    row.dataset.itemId || 0
                );

            const codigo =
                String(
                    row.dataset.itemEmpresaId || ''
                )
                .trim();

            const quantidade =
                Number(
                    String(
                        row.querySelector(
                            '.campo-quantidade-item'
                        )
                        ?.value || '0'
                    )
                    .replace(',', '.')
                );

            if(
                itemId <= 0 ||
                quantidade <= 0
            ){
                return null;
            }

            return {
                ItemValorDesconto:
                    0,

                ItemPercentualDesconto:
                    0,

                EntregasItemPedidoVenda: [
                    {
                        Data:
                            new Date()
                                .toISOString(),

                        DataPrevista:
                            new Date()
                                .toISOString(),

                        Quantidade:
                            quantidade
                    }
                ],

                ItemId:
                    itemId,

                Codigo:
                    codigo,

                Quantidade:
                    quantidade
            };

        })
        .filter(Boolean);

        // Cria o corpo da requisição com base nos inputs
        const requestBody = {
            ListaPrecoId: Number(document.getElementById('codgroup').value),
            CondicaoPagamentoId: Number(document.getElementById('condPagId').value),
            FormaPagamentoId: Number(document.getElementById('formPagId').value),
            ValorDesconto: 0,
            PercentualDesconto: 0,
            ItensPedidoVenda: itensPedidoVenda,
            RepresentantesPedidoVendas: [
                {
                    RepresentanteId: Number(document.getElementById('representanteId').value),
                    RepresentantePrincipal: true,
                    PercentualComissaoItem: Number(document.getElementById('PercentualComissaoItem').value),
                    PercentualComissaoServico: Number(document.getElementById('PercentualComissaoServico').value),
                }
            ],
            ClienteId: Number(document.getElementById('cod_cliente').value),
            ContatoClienteId: Number(document.getElementById('ContatoClienteId').value || 0),
            NumeroReferencia: document.getElementById('referencia').value,
            Observacao: document.getElementById('observation').value,
        };

        // Loga o JSON no console
        console.log("JSON enviado para a API:", requestBody); ////// BAIXAR ESTE ARQUIVO E IMPUTAR ESSE ARQUIVO
        console.log('ClienteId:', document.getElementById('cod_cliente').value);
console.log('Itens:', itensPedidoVenda);

        // Envia os dados para a API
        const response = await fetch('/api/pedidos/input', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.ok && (!result.ErrorMessages || result.ErrorMessages.length === 0)) {
            alert("Pedido enviado com sucesso!");
            console.log("Resposta da API:", result);
            location.reload();
        } else {
            alert(`Erro ao enviar pedido: ${result.ErrorMessages?.join(", ") || "Erro desconhecido"}`);
            console.error("Erro da API:", result);
        }
    } catch (error) {
        console.error("Erro de conexão:", error);
        alert("Erro ao conectar com o servidor.");
    } finally {
  //  limparCamposCliente();
    //zerarCamposPedido();   // ← ISSO É FUNDAMENTAL
    feedbackDiv.style.display = "none";
}
});

function escaparHtml(valor){

    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}
function iniciarBloqueioImportacao(
    mensagem = 'Aguarde enquanto as informações são importadas.'
){

    const overlay =
        document.getElementById(
            'overlayImportacaoPedido'
        );

    const mensagemElemento =
        document.getElementById(
            'mensagemImportacaoPedido'
        );

    const progressoElemento =
        document.getElementById(
            'progressoImportacaoPedido'
        );

    if(mensagemElemento){

        mensagemElemento.textContent =
            mensagem;

    }

    if(progressoElemento){

        progressoElemento.textContent =
            '';

    }

    if(overlay){

        overlay.classList.add(
            'ativo'
        );

        overlay.setAttribute(
            'aria-hidden',
            'false'
        );

    }

    document.body.classList.add(
        'importando-pedido'
    );

}

function atualizarProgressoImportacao(
    mensagem
){

    const progressoElemento =
        document.getElementById(
            'progressoImportacaoPedido'
        );

    if(progressoElemento){

        progressoElemento.textContent =
            mensagem || '';

    }

}

function finalizarBloqueioImportacao(){

    const overlay =
        document.getElementById(
            'overlayImportacaoPedido'
        );

    if(overlay){

        overlay.classList.remove(
            'ativo'
        );

        overlay.setAttribute(
            'aria-hidden',
            'true'
        );

    }

    document.body.classList.remove(
        'importando-pedido'
    );

}
async function importarPedidoExcel(event){
    

    const campoArquivo =
        event.target;

    const arquivo =
        campoArquivo.files?.[0];

    if(!arquivo){
        return;
    }

    iniciarBloqueioImportacao(
'Lendo o arquivo do pedido...'
);

    if(typeof XLSX === 'undefined'){
        finalizarBloqueioImportacao()
        alert(
            'A biblioteca de Excel não foi carregada.'
        );

        campoArquivo.value =
            '';

        return;

    }

    try{

        const dadosArquivo =
            await arquivo.arrayBuffer();

        const workbook =
            XLSX.read(
                dadosArquivo,
                {
                    type: 'array'
                }
            );

        const planilhaPedido =
            workbook.Sheets['Pedido'];

        const planilhaItens =
            workbook.Sheets['Itens'];

        if(!planilhaPedido){

            throw new Error(
                'A planilha Pedido não foi encontrada.'
            );

        }

        if(!planilhaItens){

            throw new Error(
                'A planilha Itens não foi encontrada.'
            );

        }

        const pedido =
            XLSX.utils.sheet_to_json(
                planilhaPedido
            )[0];

        const itens =
            XLSX.utils.sheet_to_json(
                planilhaItens
            );

        if(!pedido){

            throw new Error(
                'A planilha Pedido está vazia.'
            );

        }

        limparCamposCliente();
        limparProdutos();

        const campoCnpj =
            document.getElementById(
                'cnpj'
            );

        if(!campoCnpj){

            throw new Error(
                'Campo de CNPJ não encontrado.'
            );

        }

        campoCnpj.value =
            formatarCNPJ(
                obterCNPJNumerico(
                    pedido.cnpj
                )
            );
        atualizarProgressoImportacao(
    'Consultando os dados do cliente'
    );
        campoCnpj.dispatchEvent(
            new Event(
                'blur',
                {
                    bubbles: true
                }
            )
        );

        await aguardarClienteImportacao();

        document
            .getElementById(
                'referencia'
            )
            .value =
                pedido.NumeroReferencia || '';

        document
            .getElementById(
                'observation'
            )
            .value =
                pedido.Observacao || '';

        const tbody =
            document.querySelector(
                '#dadosPedido tbody'
            );

        if(!tbody){

            throw new Error(
                'Tabela do pedido não encontrada.'
            );

        }

        tbody.innerHTML =
            '';

        const itensRemovidos =
            [];

        const totalItens =
            itens.length;

        let indiceItem =
            0;

        for(const item of itens){
            indiceItem++;
            const codigoItem =
                String(
                    item.Codigo || ''
                )
                .trim()
                .toUpperCase();

            const quantidadeItem =
                Number(
                    item.Quantidade || 0
                );

            if(!codigoItem){

                itensRemovidos.push({
                    codigo:
                        'Sem código',

                    motivo:
                        'Código não informado.'
                });

                continue;

            }

            adicionarNovaLinha();

            const linha =
                tbody.lastElementChild;

            if(!linha){

                itensRemovidos.push({
                    codigo:
                        codigoItem,

                    motivo:
                        'Não foi possível criar a linha.'
                });

                continue;

            }

            const campoCodigo =
                linha.querySelector(
                    '.campo-item-pesquisa'
                );

            const campoQuantidade =
                linha.querySelector(
                    '.campo-quantidade-item'
                );

            if(
                !campoCodigo ||
                !campoQuantidade
            ){

                itensRemovidos.push({
                    codigo:
                        codigoItem,

                    motivo:
                        'A estrutura da linha está incompleta.'
                });

                linha.remove();

                continue;

            }

            const resultadoPendente =
                aguardarCarregamentoItem(
                    linha
                );

            campoCodigo.value =
                codigoItem;

            campoCodigo.dispatchEvent(
                new Event(
                    'blur',
                    {
                        bubbles: true
                    }
                )
            );

            const resultado =
                await resultadoPendente;

            if(!resultado.sucesso){

                itensRemovidos.push({
                    codigo:
                        codigoItem,

                    motivo:
                        resultado.mensagem ||
                        'Item suspenso, inativo ou indisponível.'
                });

                linha.remove();

                continue;

            }

            if(!linha.isConnected){

                itensRemovidos.push({
                    codigo:
                        codigoItem,

                    motivo:
                        'A linha foi removida durante o carregamento.'
                });

                continue;

            }

            campoQuantidade.value =
                String(
                    quantidadeItem
                );

            campoQuantidade.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );

        }

        const linhasRestantes =
    tbody.querySelectorAll(
        'tr'
    );

linhasRestantes.forEach(linha => {

    const codigo =
        String(
            linha.dataset.itemEmpresaId || ''
        )
        .trim();

    const descricao =
        String(
            linha.dataset.descricao || ''
        )
        .trim();

    const quantidade =
        Number(
            String(
                linha.querySelector(
                    '.campo-quantidade-item'
                )
                ?.value || '0'
            )
            .replace(',', '.')
        );

    const preco =
        Number(
            linha.dataset.preco || 0
        );

    const linhaInvalida =
        !codigo ||
        !Number.isFinite(quantidade) ||
        quantidade <= 0 ||
        !descricao ||
        !Number.isFinite(preco) ||
        preco <= 0 ||
        !linha.dataset.itemId;

    if(linhaInvalida){

        const codigoRemovido =
            codigo ||
            'Sem código';

        const jaRegistrado =
            itensRemovidos.some(item => {

                return (
                    item.codigo ===
                    codigoRemovido
                );

            });

        if(!jaRegistrado){

            itensRemovidos.push({
                codigo:
                    codigoRemovido,

                motivo:
                    'Item não pôde ser carregado.'
            });

        }

        linha.remove();

    }

});

        atualizarTotais();

        if(!tbody.querySelector('tr')){

            adicionarNovaLinha();

        }

        if(itensRemovidos.length > 0){

            const detalhes =
                itensRemovidos
                    .map(item => {

                        return (
                            `${item.codigo}: ` +
                            `${item.motivo}`
                        );

                    })
                    .join('\n');

            alert(
                'Pedido importado. Os itens abaixo foram removidos:\n\n' +
                detalhes
            );

        }else{

            alert(
                'Pedido carregado na tela com sucesso.'
            );

        }

    }catch(error){

        console.error(
            'Erro ao importar pedido:',
            error
        );

        alert(
            error.message ||
            'Erro ao processar o arquivo do pedido.'
        );

    }finally{
        finalizarBloqueioImportacao();
        campoArquivo.value =
            '';

    }

}

function verificarCodigoDuplicadoNaTabela(
    codigo,
    linhaAtual
){

    const codigoNormalizado =
        normalizarCodigoItem(
            codigo
        );

    const linhas =
        document.querySelectorAll(
            '#dadosPedido tbody .linha-item-pedido'
        );

    for(const tr of linhas){

        if(tr === linhaAtual){
            continue;
        }

        const codigoLinha =
            normalizarCodigoItem(
                tr.dataset.itemEmpresaId
            );

        if(
            codigoLinha ===
            codigoNormalizado
        ){

            return true;

        }

    }

    return false;

}

function aguardarClienteImportacao(
    tempoLimite = 120000
){

    return new Promise(
        (resolve, reject) => {

            const inicio =
                Date.now();

            const verificar =
                setInterval(
                    () => {

                        const clienteId =
                            document
                                .getElementById(
                                    'cod_cliente'
                                )
                                ?.value;

                        if(
                            clienteId &&
                            catalogoClienteCarregado &&
                            !catalogoClienteCarregando
                        ){

                            clearInterval(
                                verificar
                            );

                            resolve();

                            return;

                        }

                        if(
                            Date.now() - inicio >=
                            tempoLimite
                        ){

                            clearInterval(
                                verificar
                            );

                            reject(
                                new Error(
                                    'Não foi possível carregar o cliente e o catálogo de produtos.'
                                )
                            );

                        }

                    },
                    200
                );

        }
    );

}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        configurarMascaraCNPJ();
        const botaoExportarPedido =
            document.getElementById(
                'baixarJson'
            );

        const botaoImportarPedido =
            document.getElementById(
                'inputJson'
            );

        const campoArquivoPedido =
            document.getElementById(
                'jsonFileInput'
            );

        if(!botaoExportarPedido){

            console.error(
                'Botão #baixarJson não encontrado.'
            );

        }

        if(!botaoImportarPedido){

            console.error(
                'Botão #inputJson não encontrado.'
            );

        }

        if(!campoArquivoPedido){

            console.error(
                'Campo #jsonFileInput não encontrado.'
            );

        }

        botaoExportarPedido?.addEventListener(
            'click',
            exportarPedidoExcel
        );

        botaoImportarPedido?.addEventListener(
            'click',
            () => {

                campoArquivoPedido.value =
                    '';

                campoArquivoPedido.click();

            }
        );

        campoArquivoPedido?.addEventListener(
            'change',
            importarPedidoExcel
        );

    }
);

function baixarBlob(blob, fileName){

    const pdfURL =
        URL.createObjectURL(
            blob
        );

    const a =
        document.createElement(
            'a'
        );

    a.href =
        pdfURL;

    a.download =
        fileName;

    document.body.appendChild(
        a
    );

    a.click();

    document.body.removeChild(
        a
    );

    URL.revokeObjectURL(
        pdfURL
    );

}

function blobParaDataUri(blob){

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();

        reader.onloadend =
            () => resolve(
                reader.result
            );

        reader.onerror =
            reject;

        reader.readAsDataURL(
            blob
        );

    });

}

async function gerarPdfNoNavegador(
    elemento,
    nomeArquivo
){

    if(typeof html2pdf === 'undefined'){

        throw new Error(
            'A biblioteca html2pdf.js não foi carregada.'
        );

    }

    if(!elemento){

        throw new Error(
            'O elemento para geração do PDF não foi informado.'
        );

    }

    const largura =
        Math.max(
            elemento.scrollWidth,
            elemento.offsetWidth,
            1500
        );

    const altura =
        Math.max(
            elemento.scrollHeight,
            elemento.offsetHeight,
            1
        );

    console.log(
        'Dimensões do conteúdo do PDF:',
        {
            largura,
            altura,
            filhos:
                elemento.children.length
        }
    );

    if(altura <= 1){

        throw new Error(
            'O conteúdo preparado para o PDF está vazio.'
        );

    }

    const opcoes = {
        margin:
            [3, 3, 3, 3],

        filename:
            nomeArquivo,

        image: {
            type:
                'jpeg',

            quality:
                0.92
        },

        html2canvas: {
            scale:
                1.5,

            useCORS:
                true,

            allowTaint:
                false,

            logging:
                true,

            backgroundColor:
                '#ffffff',

            scrollX:
                0,

            scrollY:
                0,

            width:
                largura,

            windowWidth:
                largura,

            height:
                altura,

            windowHeight:
                altura
        },

        jsPDF: {
            unit:
                'mm',

            format:
                'a4',

            orientation:
                'landscape',

            compress:
                true
        },

        pagebreak: {
            mode: [
                'css',
                'legacy'
            ],

            avoid: [
                'tr',
                '.section-title',
                '.payment-conditions'
            ]
        }
    };

    await new Promise(resolve => {

        requestAnimationFrame(
            () => {

                requestAnimationFrame(
                    resolve
                );

            }
        );

    });

    const worker =
        html2pdf()
            .set(
                opcoes
            )
            .from(
                elemento
            )
            .toPdf();

    const pdf =
        await worker.get(
            'pdf'
        );

    const pdfBlob =
        pdf.output(
            'blob'
        );

    if(
        !pdfBlob ||
        pdfBlob.size === 0
    ){

        throw new Error(
            'O PDF gerado está vazio.'
        );

    }

    console.log(
        'PDF gerado no navegador:',
        {
            tamanho:
                pdfBlob.size,

            tipo:
                pdfBlob.type
        }
    );

    return pdfBlob;

}

function prepararPedidoParaPdf(){

    const containerOriginal =
        document.querySelector(
            '.container'
        );

    if(!containerOriginal){

        throw new Error(
            'O conteúdo do pedido não foi encontrado.'
        );

    }

    const clone =
        containerOriginal.cloneNode(
            true
        );

    clone.classList.add(
        'container-pdf'
    );

    const camposOriginais =
        containerOriginal.querySelectorAll(
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
                camposClone[indice];

            if(!campoClone){
                return;
            }

            if(
                campoOriginal.type === 'checkbox' ||
                campoOriginal.type === 'radio'
            ){

                campoClone.checked =
                    campoOriginal.checked;

            }else{

                campoClone.value =
                    campoOriginal.value;

            }

            if(
                campoOriginal.tagName === 'SELECT'
            ){

                campoClone.selectedIndex =
                    campoOriginal.selectedIndex;

            }

        }
    );

    clone
        .querySelectorAll([
            '.no-print',
            '.button-group',
            '.btn-remover-linha',
            '.celula-excluir-item',
            '.cabecalho-excluir-item',
            '.cabecalho-item-id',
            '.esconder',
            '#esconder',
            '[hidden]',
            'input[type="hidden"]',
            '#helpContainer',
            '#overlay',
            '#overlayImportacaoPedido',
            '#helpModal',
            '#customModal',
            '#customModal1',
            '#blockModal',
            '.modal',
            '.modal1',
            '.overlay',
            '.overlay-importacao-pedido',
            '#baixarJson',
            '#inputJson',
            '#jsonFileInput',
            '#feedback1'
        ].join(','))
        .forEach(elemento => {

            elemento.remove();

        });

    const tabela =
        clone.querySelector(
            '#dadosPedido'
        );

    if(tabela){

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
                                cabecalho.textContent || ''
                            )
                            .trim()
                            .toLowerCase();

                        if(
                            texto === 'excluir' ||
                            texto === 'itemid' ||
                            texto === 'item id'
                        ){

                            return indice;

                        }

                        return -1;

                    }
                )
                .filter(indice => {

                    return indice >= 0;

                })
                .sort(
                    (
                        primeiro,
                        segundo
                    ) => {

                        return segundo - primeiro;

                    }
                );

        indicesRemover.forEach(indice => {

            tabela
                .querySelectorAll(
                    'tr'
                )
                .forEach(linha => {

                    const celula =
                        linha.children[indice];

                    if(celula){

                        celula.remove();

                    }

                });

        });

    }

    clone
        .querySelectorAll(
            '#dadosPedido tbody tr'
        )
        .forEach(linha => {

            const campoItem =
                linha.querySelector(
                    '.campo-item-pesquisa'
                );

            if(
                !campoItem ||
                !String(
                    campoItem.value || ''
                ).trim()
            ){

                linha.remove();

            }

        });

    clone.style.position =
        'absolute';

    clone.style.left =
        '0';

    clone.style.top =
        '0';

    clone.style.width =
        '1500px';

    clone.style.maxWidth =
        'none';

    clone.style.margin =
        '0';

    clone.style.backgroundColor =
        '#ffffff';

    clone.style.color =
        '#000000';

    clone.style.zIndex =
        '999999';

    clone.style.visibility =
        'visible';

    clone.style.opacity =
        '1';

    clone.style.pointerEvents =
        'none';

    document.body.appendChild(
        clone
    );

    return clone;

}

//--fim-----envio de dados para o sistema DBCorp------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    //Botão PDF
     const btPdfGeneration = document.getElementById('button_pdf');
    const modal1 = document.getElementById('customModal1');
    const closeButton1 = document.querySelector('.close-button1');
    const confirmButton1 = document.getElementById('confirmButton1');
    const cancelButton1 = document.getElementById('cancelButton1');
    const helpWhats = document.getElementById('helpContainer');
    const feedbackDiv = document.getElementById('feedback1');
    const cnpjInput = document.getElementById('cnpj');

async function gerarEEnviarPDF(){

    console.log(
        'Botão de PDF clicado'
    );

    const razaoSocial =
        document.getElementById(
            'razao_social'
        ).value;

    const codCliente =
        document.getElementById(
            'cod_cliente'
        ).value;

    const representante =
        document.getElementById(
            'representante'
        ).value;

    const emailRep =
        document.getElementById(
            'email_rep'
        ).value;

    const dataHora =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                '-'
            );

    const filename =
        `Pedido de Venda ${razaoSocial} - ${codCliente} e Rep ${representante} - ${dataHora}.pdf`;

    let pdfBlob =
        null;

    let clonePdf =
        null;

    try{

        btPdfGeneration.disabled =
            true;

        feedbackDiv.textContent =
            'Gerando PDF, aguarde...';

        feedbackDiv.style.display =
            'block';

        clonePdf =
            prepararPedidoParaPdf();

        pdfBlob =
            await gerarPdfNoNavegador(
                clonePdf,
                filename
            );

        baixarBlob(
            pdfBlob,
            filename
        );

        alert(
            'PDF criado e salvo nos downloads.'
        );

        if(!modal1){

            throw new Error(
                'Modal de confirmação não encontrado.'
            );

        }

        modal1.style.display =
            'block';

        const fecharModal =
            () => {

                modal1.style.display =
                    'none';

            };

        if(closeButton1){

            closeButton1.onclick =
                fecharModal;

        }

        if(cancelButton1){

            cancelButton1.onclick =
                fecharModal;

        }

        const botaoConfirmar =
            document.getElementById(
                'confirmButton1'
            );

        if(botaoConfirmar){

            botaoConfirmar.onclick =
                async () => {

                    modal1.style.display =
                        'none';

                    feedbackDiv.textContent =
                        'Aguarde, enviando o e-mail...';

                    feedbackDiv.style.display =
                        'block';

                    try{

                        const pdfBase64 =
                            await blobParaDataUri(
                                pdfBlob
                            );

                        const response =
                            await fetch(
                                '/send-pdf',
                                {
                                    method:
                                        'POST',

                                    headers: {
                                        'Content-Type':
                                            'application/json'
                                    },

                                    body:
                                        JSON.stringify({
                                            pdfBase64:
                                                pdfBase64,

                                            razaoSocial:
                                                razaoSocial,

                                            codCliente:
                                                codCliente,

                                            representante:
                                                representante,

                                            emailRep:
                                                emailRep
                                        })
                                }
                            );

                        const resultado =
                            await response.text();

                        if(!response.ok){

                            throw new Error(
                                resultado ||
                                'Erro ao enviar o PDF.'
                            );

                        }

                        alert(
                            resultado
                        );

                    }catch(error){

                        console.error(
                            'Erro ao enviar o e-mail:',
                            error
                        );

                        alert(
                            error.message ||
                            'Erro ao enviar o e-mail.'
                        );

                    }finally{

                        feedbackDiv.style.display =
                            'none';

                    }

                };

        }

    }catch(error){

        console.error(
            'Erro ao gerar o PDF:',
            error
        );

        alert(
            'Erro no processo: ' +
            error.message
        );

    }finally{

        if(clonePdf){

            clonePdf.remove();

        }

        feedbackDiv.style.display =
            'none';

        btPdfGeneration.disabled =
            false;

    }

}

    function resetForm(excludeCnpj = false) {
        if (cnpjInput.readOnly) {
            return; // Sai da função se o campo estiver readonly
        }
        console.log('Resetando formulário...');

        // Limpa todos os campos da seção "DADOS DO CLIENTE", incluindo readonly
        document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Evita limpar o CNPJ se excludeCnpj for true
                if (excludeCnpj && element.id === 'cnpj') {
                    return;
                }
                element.value = ''; // Limpa todos os campos, incluindo readonly
            } else if (element.tagName === 'SELECT') {
                element.value = 'Venda'; // Reseta o select para "Venda"
            }
        });

        // Limpa a tabela "DADOS PEDIDO"
        document.querySelector('#dadosPedido tbody').innerHTML = '<tr class="tr_td"></tr>';

        // Limpa os campos de totais ("VOLUMES", "TOTAL PRODUTOS", "TOTAL C/IMP")
        document.getElementById('volume').value = '';
        document.getElementById('total').value = '';
        const campoTotalComIpi =
            document.getElementById(
                'totalComIpi'
            );

        if(campoTotalComIpi){

            campoTotalComIpi.value =
                '';

        }

        // Limpa o campo de observações
        document.getElementById('observation').value = '';

        // Reseta o botão de confirmação para evitar duplicatas de eventos
        const confirmButton1 = document.getElementById('confirmButton1');
        const newConfirmButton = confirmButton1.cloneNode(true);
        confirmButton1.parentNode.replaceChild(newConfirmButton, confirmButton1);
    }

    // Listener para limpar os campos ao clicar no campo CNPJ (evento focus)
    cnpjInput.addEventListener('focus', () => {
        console.log('Campo CNPJ clicado, resetando formulário...');
        resetForm(true); // Reseta o formulário, mas preserva o CNPJ
    });

    btPdfGeneration.addEventListener("click", () =>{
        if(!validarTabelaPedido())
            return;
        if(document.getElementById('tipo_pedido').value == "Venda")
            if(!validarPedidoMinimo())
                return;

        gerarEEnviarPDF();
    
});



    //fim do botão pdf
    const helpIcon = document.getElementById('helpIcon');
    const helpModal = document.getElementById('helpModal');
    const overlay = document.getElementById('overlay');
    const closeModal = document.getElementById('closeModal');

     const confirmButton = document.getElementById('confirmButton');

    

    if (!confirmButton) {
        console.error('confirmButton não encontrado no DOM');
        return;
    }

    confirmButton.addEventListener('click', async () => {
        console.log('BOTÃO CONFIRMAR CLICADO');
    });
    // Abrir modal
    helpIcon.addEventListener('click', () => {
        overlay.style.display = 'block'; // Exibe o overlay
        helpModal.style.display = 'block'; // Exibe o modal
    });

    // Fechar modal
    function closeHelpModal() {
        overlay.style.display = 'none'; // Oculta o overlay
        helpModal.style.display = 'none'; // Oculta o modal
    }

    closeModal.addEventListener('click', closeHelpModal);

    // Fechar modal ao clicar no overlay
    overlay.addEventListener('click', closeHelpModal);
});



// ======================================================================
// 🧩 MODAIS AJUDA
// ======================================================================
document.addEventListener("DOMContentLoaded", () => {
    el('helpIcon').onclick = () => {
        el('overlay').style.display = 'block';
        el('helpModal').style.display = 'block';
    };
    el('closeModal').onclick = closeHelp;
    el('overlay').onclick = closeHelp;

    function closeHelp() {
        el('overlay').style.display = 'none';
        el('helpModal').style.display = 'none';
    }
});
