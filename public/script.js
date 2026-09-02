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

        const itens =
            Array.isArray(
                resultado.itens
            )
                ? resultado.itens
                : [];

        catalogoClienteData =
            itens;

        dadosListaPrecoAtual =
            resultado.listaPreco ||
            null;

        catalogoClientePorCodigo =
            new Map();

        itens.forEach(item => {

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
                    catalogoClienteData.length,

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
    manterCodigo = true
){

    const campoCodigo =
        tr.querySelector(
            '.campo-codigo-item'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const camposLimpar = [
        '.campo-unidade-item',
        '.campo-descricao-item',
        '.campo-ipi-item',
        '.campo-preco-unitario-item',
        '.campo-preco-com-ipi-item',
        '.campo-total-item',
        '.campo-item-id'
    ];

    if(!manterCodigo && campoCodigo){

        campoCodigo.value =
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

        imagem.classList.add(
            'sem-foto'
        );

    }

    tr.dataset.itemId =
        '';

    tr.dataset.itemEmpresaId =
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

    const campoCodigo =
        tr.querySelector(
            '.campo-codigo-item'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const campoUnidade =
        tr.querySelector(
            '.campo-unidade-item'
        );

    const campoDescricao =
        tr.querySelector(
            '.campo-descricao-item'
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
        preco * (
            1 + ipi
        );

    campoCodigo.value =
        item.itemEmpresaId;

    campoUnidade.value =
        item.unidade ||
        'CX';

    campoDescricao.value =
        item.descricao ||
        '';

    campoIpi.value =
        (ipi * 100)
            .toLocaleString(
                'pt-BR',
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            ) + '%';

    campoPreco.value =
        preco.toLocaleString(
            'pt-BR',
            {
                style:
                    'currency',

                currency:
                    'BRL'
            }
        );

    campoPrecoComIpi.value =
        precoComIpi.toLocaleString(
            'pt-BR',
            {
                style:
                    'currency',

                currency:
                    'BRL'
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
        String(
            item.itemEmpresaId || ''
        );

    tr.dataset.preco =
        String(preco);

    tr.dataset.ipi =
        String(ipi);

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
            `Foto do item ${item.itemEmpresaId}`;

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

    if(item.ativo !== true){

        throw new Error(
            'Item inativo.'
        );

    }

    if(item.suspenso === true){

        throw new Error(
            'Item suspenso.'
        );

    }

    if(item.foraLinha === true){

        throw new Error(
            'Item fora de linha.'
        );

    }

    if(item.bloqueado === true){

        throw new Error(
            'Item bloqueado.'
        );

    }

    if(item.exibeConsultasListaPreco === false){

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

            return (
                tr.querySelector(
                    '.campo-codigo-item'
                )
                ?.value
                .trim()
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

        const codigo =
            tr.querySelector(
                '.campo-codigo-item'
            )
            ?.value
            .trim();

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

        const descricao =
            tr.querySelector(
                '.campo-descricao-item'
            )
            ?.value
            .trim();

        const preco =
            Number(
                tr.dataset.preco || 0
            );

        if(
            !codigo ||
            !Number.isFinite(quantidade) ||
            quantidade <= 0 ||
            !descricao ||
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

function limparProdutos(){
        const tbody = document.querySelector('#dadosPedido tbody');
        tbody.innerHTML = '';
        atualizarTotais();
}

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
        <td>
            <input
                type="text"
                class="campo-codigo-item"
                autocomplete="off"
            >
        </td>

        <td class="celula-foto-item">
            <img
                class="foto-item-pedido sem-foto"
                alt="Foto do item"
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
            <button
                type="button"
                class="btn-remover-linha"
            >
                Excluir
            </button>
        </td>

        <td>
            <input
                type="text"
                class="campo-descricao-item"
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

function configurarLinhaItemPedido(
    tr
){

    const tbody =
        tr.closest(
            'tbody'
        );

    const campoCodigo =
        tr.querySelector(
            '.campo-codigo-item'
        );

    const campoQuantidade =
        tr.querySelector(
            '.campo-quantidade-item'
        );

    const botaoRemover =
        tr.querySelector(
            '.btn-remover-linha'
        );

    campoQuantidade.readOnly =
        true;

    campoCodigo.addEventListener(
        'blur',
        function(){

            const codigo =
                normalizarCodigoItem(
                    this.value
                );

            if(!codigo){
                return;
            }

            this.value =
                codigo;

            if(
                verificarCodigoDuplicadoNaTabela(
                    codigo,
                    tr
                )
            ){

                alert(
                    'Este item já foi adicionado ao pedido.'
                );

                limparDadosLinhaItem(
                    tr,
                    false
                );

                this.focus();

                return;

            }

            try{

                if(
                    catalogoClienteCarregando
                ){

                    throw new Error(
                        'A lista de produtos ainda está sendo carregada. Aguarde.'
                    );

                }

                if(
                    !catalogoClienteCarregado
                ){

                    throw new Error(
                        'Carregue um cliente antes de informar os itens.'
                    );

                }

                const item =
                    buscarItemNoCatalogo(
                        codigo
                    );

                validarDisponibilidadeItem(
                    item
                );

                limparDadosLinhaItem(
                    tr,
                    true
                );

                preencherLinhaComItem(
                    tr,
                    item
                );

                tr.dispatchEvent(
                    new CustomEvent(
                        'carregamento-item-finalizado',
                        {
                            detail: {
                                sucesso:
                                    true,

                                codigo:
                                    codigo,

                                mensagem:
                                    ''
                            }
                        }
                    )
                );

                campoQuantidade.focus();

            }catch(error){

                console.warn(
                    `Item ${codigo} não foi carregado:`,
                    error
                );

                limparDadosLinhaItem(
                    tr,
                    true
                );

                tr.dispatchEvent(
                    new CustomEvent(
                        'carregamento-item-finalizado',
                        {
                            detail: {
                                sucesso:
                                    false,

                                codigo:
                                    codigo,

                                mensagem:
                                    error.message ||
                                    'Item indisponível.'
                            }
                        }
                    )
                );

            }

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

    botaoRemover.addEventListener(
        'click',
        () => {

            tr.remove();

            atualizarTotais();

            garantirLinhaInicial();

        }
    );

    campoCodigo.addEventListener(
        'keydown',
        evento => {

            if(
                evento.key === 'Enter' ||
                evento.key === 'Tab'
            ){

                if(
                    evento.key === 'Enter'
                ){

                    evento.preventDefault();

                }

                campoQuantidade.focus();

            }

        }
    );

    campoQuantidade.addEventListener(
        'keydown',
        evento => {

            if(
                evento.key !== 'Enter' &&
                evento.key !== 'Tab'
            ){
                return;
            }

            if(evento.key === 'Enter'){

                evento.preventDefault();

            }

            const linhas =
                Array.from(
                    tbody.querySelectorAll(
                        '.linha-item-pedido'
                    )
                );

            const indice =
                linhas.indexOf(
                    tr
                );

            let proximaLinha =
                linhas[indice + 1];

            if(!proximaLinha){

                proximaLinha =
                    adicionarNovaLinha();

            }

            proximaLinha
                .querySelector(
                    '.campo-codigo-item'
                )
                ?.focus();

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
                row.querySelector(
                    '.campo-codigo-item'
                )
                ?.value
                .trim() || '';

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

            const descricao =
                row.querySelector(
                    '.campo-descricao-item'
                )
                ?.value
                .trim() || '';

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

        const campoCodigo =
            tr.querySelector(
                '.campo-codigo-item'
            );

        if(
            normalizarCodigoItem(
                campoCodigo?.value
            ) ===
            codigoNormalizado
        ){
            return true;
        }

    }

    return false;

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
                row.querySelector(
                    '.campo-codigo-item'
                )
                ?.value || '';

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
                    '.campo-codigo-item'
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
                linha.querySelector(
                    '.campo-codigo-item'
                )
                ?.value
                .trim() || '';

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

            const descricao =
                linha.querySelector(
                    '.campo-descricao-item'
                )
                ?.value
                .trim() || '';

            const preco =
                Number(
                    linha.dataset.preco || 0
                );

            const linhaInvalida =
                !codigo ||
                quantidade <= 0 ||
                !descricao ||
                preco <= 0 ||
                !linha.dataset.itemId;

            if(linhaInvalida){

                const codigoRemovido =
                    codigo || 'Sem código';

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

function criarHtmlPesquisavelDoPedido(){

    const clone =
        document
        .querySelector(
            '.container'
        )
        .cloneNode(
            true
        );

    clone
    .querySelectorAll(
        '.no-print, .button-group, #helpContainer, #overlay, #helpModal, #customModal, #customModal1'
    )
    .forEach(elemento => {

        elemento.remove();

    });

    clone
    .querySelectorAll(
        'input, textarea, select'
    )
    .forEach(campo => {

        const valor =
            campo.tagName === 'SELECT'
            ? campo.options[campo.selectedIndex]?.text || campo.value
            : campo.value;

        const span =
            document.createElement(
                'span'
            );

        span.textContent =
            valor || '';

        span.className =
            campo.className || '';

        span.style.display =
            'inline-block';

        span.style.minHeight =
            '18px';

        span.style.width =
            campo.style.width || '100%';

        span.style.boxSizing =
            'border-box';

        span.style.padding =
            campo.style.padding || '5px';

        span.style.border =
            '1px solid #999';

        span.style.backgroundColor =
            '#fff';

        span.style.color =
            '#000';

        if(campo.tagName === 'TEXTAREA'){

            span.style.whiteSpace =
                'pre-wrap';

            span.style.minHeight =
                '60px';

        }

        campo.replaceWith(
            span
        );

    });

    const estilos =
        Array
        .from(
            document.querySelectorAll(
                'link[rel="stylesheet"], style'
            )
        )
        .map(elemento => elemento.outerHTML)
        .join('\n');

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            ${estilos}
            <style>
                @page {
                    size: A4 landscape;
                    margin: 0;
                }

                body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .container {
                    width: 100%;
                    box-sizing: border-box;
                }

                table {
                    border-collapse: collapse;
                }

                th,
                td {
                    page-break-inside: avoid;
                }

                span {
                    font-family: Arial, sans-serif;
                    font-size: inherit;
                }
            </style>
        </head>
        <body>
            ${clone.outerHTML}
        </body>
        </html>
    `;

}


async function gerarPdfPesquisavelBlob(fileName){

    const html =
        criarHtmlPesquisavelDoPedido();

    const response =
        await fetch(
            '/api/pedido-venda/pdf-pesquisavel',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    html,
                    fileName
                })
            }
        );

    if(!response.ok){

        let mensagem =
            'Erro ao gerar PDF pesquisável.';

        try {

            const erro =
                await response.json();

            mensagem =
                erro.erro ||
                erro.error ||
                mensagem;

        } catch {}

        throw new Error(
            mensagem
        );

    }

    return await response.blob();

}




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

    async function gerarEEnviarPDF() {
        console.log('Botão de PDF clicado');

        // Validação das linhas da tabela
        let itemsToCheck = [];
        const tableRows = document.querySelectorAll('#dadosPedido tbody tr');

        // Verifica cada linha da tabela
        for (const row of tableRows) {
            // Garante que a linha tenha células e pelo menos 9 colunas (índices 0 a 8)
            if (row.cells.length >= 9) {
                const cell0 = row.cells[0];
                const cell1 = row.cells[1];
                const cell8 = row.cells[8];

                // Verifica se os inputs existem antes de acessá-los
                const input0 = cell0.querySelector('input');
                const input1 = cell1.querySelector('input');
                const input8 = cell8.querySelector('input');

                if (input0 && input1 && input8) {
                    const code = parseInt(input0.value);
                    const quantity = input1.value;
                    const total = input8.value;

                    // Verifica se o código é maior que 0 e se a quantidade é 0 ou o total está vazio
                    if (!isNaN(code) && code > 0 && (quantity === '0' || total === '')) {
                        itemsToCheck.push(input0.value);
                    }
                }
            }
        }

        // Se houver itens problemáticos, exibe o alerta e interrompe o processo
        if (itemsToCheck.length > 0) {
            const message = "Por favor, digite a quantidade dos seguintes itens: " + itemsToCheck.join(', ');
            alert(message);
            return;
        }

        const elementsToHide = document.querySelectorAll('.no-print');
        const elementsToHide1 = document.querySelectorAll('.button-group');

        elementsToHide.forEach(el => el.style.display = 'none');
        elementsToHide1.forEach(el1 => el1.style.display = 'none');
        helpWhats.style.display = 'none';

        const content = document.querySelector('.container');
        const razaoSocial = document.getElementById('razao_social').value;
        const codCliente = document.getElementById('cod_cliente').value;
        const representante = document.getElementById('representante').value;
        const emailRep = document.getElementById('email_rep').value;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Pedido de Venda ${razaoSocial} - ${codCliente} e Rep ${representante} - ${timestamp}.pdf`;
        const options = {
            margin: [0, 0, 0, 0],
            filename: filename,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
            pagebreak: {
                mode: ['css', 'legacy']
            }
        };

        try {
            btPdfGeneration.disabled = true;
            console.log('Iniciando geração do PDF...');

            const pdfBlob =
                await gerarPdfPesquisavelBlob(
                    filename
                );

            baixarBlob(
                pdfBlob,
                filename
            );

            console.log('PDF baixado com sucesso.');
            alert('PDF criado e salvo nos downloads.');

            if (!modal1) {
                throw new Error('Modal1 não encontrado no DOM.');
            }
            console.log('Exibindo modal de confirmação...');
            modal1.style.display = "block";

            function fecharModal() {
                console.log('Fechando modal...');
                modal1.style.display = "none";
                elementsToHide.forEach(el => el.style.display = 'block');
                elementsToHide1.forEach(el1 => el1.style.display = 'flex');
                helpWhats.style.display = 'block';
            }

            closeButton1.onclick = fecharModal;
            cancelButton1.onclick = fecharModal;

            const currentConfirmButton = document.getElementById('confirmButton1');
            currentConfirmButton.onclick = async () => {
                console.log('Confirmação de envio clicada.');
                modal1.style.display = "none";
                feedbackDiv.textContent = 'Aguarde, estamos enviando o e-mail...';
                feedbackDiv.style.display = 'block';
                helpWhats.style.display = 'none';
                elementsToHide.forEach(el => el.style.display = 'none');
                cnpjInput.readOnly = true;

                try {
                    // Oculta a mensagem de feedback antes de gerar o PDF para envio
                    feedbackDiv.style.display = 'none';
                    
                    // Reexibe os elementos antes de gerar o PDF para envio
                    elementsToHide1.forEach(el1 => el1.style.display = 'none');

                    const pdfBlobEnvio =
                        await gerarPdfPesquisavelBlob(
                            filename
                        );

                    const pdfBase64 =
                        await blobParaDataUri(
                            pdfBlobEnvio
                        );

                    console.log(
                        'PDF pesquisável gerado para envio, iniciando requisição...'
                    );

                    const response = await fetch('/send-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pdfBase64, razaoSocial, codCliente, representante, emailRep })
                    });

                    const result = await response.text();
                    console.log('Resposta do servidor:', result);
                    alert(result);
                } catch (error) {
                    console.error('Erro ao enviar o e-mail:', error);
                    alert('Erro ao enviar o e-mail.');
                } finally {
                    // Agora restauramos a visibilidade de todos os elementos, incluindo elementsToHide1 e feedbackDiv
                    feedbackDiv.style.display = 'none';
                    elementsToHide.forEach(el => el.style.display = 'block');
                    elementsToHide1.forEach(el1 => el1.style.display = 'flex');
                    helpWhats.style.display = 'block';
                }
            };
        } catch (error) {
            console.error('Erro ao salvar ou enviar o PDF:', error);
            alert('Erro no processo: ' + error.message);
        } finally {
            btPdfGeneration.disabled = false;
            elementsToHide.forEach(el => el.style.display = 'block');
            elementsToHide1.forEach(el1 => el1.style.display = 'flex');
            helpWhats.style.display = 'block';
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
