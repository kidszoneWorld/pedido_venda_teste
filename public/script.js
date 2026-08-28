const timestamp = Date.now();
// ======================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ======================================================================
let clientesData;
let promocaoData;
let foraDeLinhaData;
let listaPrecosData;
let icmsSTData;




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

console.log('script.js carregado');

// limpar tudo ao atualizar page (run once)
 limparCamposCliente();
 atualizarTotais();

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

function validarTabelaPedido() {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    if (!linhas.length) {
        alert("Adicione pelo menos um item no pedido.");
        return false;
    }

    for (let i = 0; i < linhas.length; i++) {
        const tr = linhas[i];
        const inputs = tr.querySelectorAll('input');

        // Campos obrigatórios por índice da coluna:
        // 0 = código
        // 1 = quantidade
        // 5 = valor unitário
        // 6 = total

        const codigo = inputs[0]?.value.trim()
        const quantidade = inputs[1]?.value.trim();
        const valor = inputs[5]?.value.trim();
        const total = inputs[6]?.value.trim();

        if (!codigo || !quantidade || !valor || !total || quantidade == 0 || isNaN(quantidade)) {
            alert(`Preencha todos os campos da linha ${i + 1}`);
            inputs[1]?.focus();
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

        preencherCliente(clientesData[1]);

        if (clienteApi.LISTA) await carregarListaPrecos(clienteApi.LISTA);
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
        if (clienteApi.LISTA) await carregarListaPrecos(clienteApi.LISTA);
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
function atualizarTotalVolumes() {
    let totalVolumes = 0;
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    linhas.forEach(tr => {
        const cell = tr.cells[1]?.querySelector('input');
        if (cell && cell.value) {
            const quantidade = parseFloat(cell.value.replace(",", "."));
            if (!isNaN(quantidade)) {
                totalVolumes += quantidade;
                console.log('Quantidade adicionada:', quantidade);
                console.log('Total de volumes até agora:', totalVolumes);
            }
        }
    });

    document.getElementById('volume').value = totalVolumes;
}

// Função para atualizar o total de produtos (quantidade * valor unitário)
function atualizarTotalProdutos() {
    let totalProdutos = 0;
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    linhas.forEach(tr => {
        const quantidadeCell = tr.cells[1]?.querySelector('input');
        const valorUnitarioCell = tr.cells[6]?.querySelector('input');
        console.log('Quantidade cell:', quantidadeCell);
        console.log('Valor unitário cell:', valorUnitarioCell);

        if (quantidadeCell && valorUnitarioCell && quantidadeCell.value && valorUnitarioCell.value) {
            const quantidade = parseFloat(quantidadeCell.value.replace(",", "."));
            const valorUnitario = parseFloat(valorUnitarioCell.value.replace("R$", "").replace(/\./g, "").replace(",", "."));
            if (!isNaN(quantidade) && !isNaN(valorUnitario)) {
                totalProdutos += quantidade * valorUnitario;
            }
        }
    });

    document.getElementById('total').value = totalProdutos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para atualizar o total com imposto de todas as linhas
function atualizarTotalComImposto() {
       totalComIpiat = totalComIpi()
    document.getElementById('totalComIpi').value = totalComIpiat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function totalComIpi(){
       let total = 0;
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');
    
    linhas.forEach(tr => {
        const cell = tr.cells[8]?.querySelector('input');
        if (cell && cell.value) {
            const cellValue = cell.value.replace("R$", "").replace(/\./g, "").replace(",", ".");
            const valor = parseFloat(cellValue);
            if (!isNaN(valor)) {
                total += valor;
            }
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
function adicionarNovaLinha() {
    const tbody = document.querySelector('#dadosPedido tbody');
    const tr = document.createElement('tr');



    for (let i = 0; i < 10; i++) {
        const td = document.createElement('td');

        // coluna oculta (ItemId)
        if (i === 9) {
            td.style.display = 'none';
        }

        // 🗑 BOTÃO REMOVER LINHA
        if (i === 3) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('btn-remover-linha');
            btn.textContent = 'REMOVER';


                btn.gradient = 'linear-gradient(90deg,rgba(225,0,152) 0%,#f18fc7 100%)';
                btn.color = '#fafcfa';
            
            btn.innerText = 'Excluir';
            

            btn.addEventListener('click', () => {
                tr.remove();
                atualizarTotais();
                garantirLinhaInicial();
            });
             

            td.appendChild(btn);
            tr.appendChild(td);
            continue; // ⬅️ CRÍTICO
        }

        // ✏️ INPUT NORMAL
        const input = document.createElement('input');
        input.type = 'text';
        
        // TAB só código e quantidade
        input.tabIndex = (i === 0 || i === 1) ? 0 : -1;

        input.style.padding = '5px';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';

        td.appendChild(input);
        tr.appendChild(td);
        
        // =========================
        // NAVEGAÇÃO ↑ ↓ TAB
        // =========================
        input.addEventListener('keydown', (e) => {
            const linhas = Array.from(tbody.querySelectorAll('tr'));
            const linhaAtual = linhas.indexOf(tr);

            if (e.key === 'ArrowUp' && linhaAtual > 0) {
                e.preventDefault();
                linhas[linhaAtual - 1].cells[i]?.querySelector('input')?.focus();
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();

                if (linhaAtual === linhas.length - 1 && i === 1) {
                    adicionarNovaLinha();
                    setTimeout(() => {
                        tbody.lastChild.cells[0].querySelector('input').focus();
                    }, 0);
                } else {
                    linhas[linhaAtual + 1]?.cells[i]?.querySelector('input')?.focus();
                }
            }

            if (e.key === 'Tab' && !e.shiftKey && i === 1 && linhaAtual === linhas.length - 1) {
                e.preventDefault();
                setTimeout(() => {
                    tbody.lastChild.cells[0].querySelector('input').focus();
                }, 0);
            }
            //enter = tab
            if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) {
    e.preventDefault();

    // se estiver na QUANTIDADE (coluna 1)
    if (i === 1) {
        if (linhaAtual === linhas.length - 1) {
            // última linha → cria nova
            adicionarNovaLinha();
            setTimeout(() => {
                tbody.lastChild.cells[0].querySelector('input')?.focus();
            }, 0);
        } else {
            // próxima linha
            linhas[linhaAtual + 1]?.cells[0]?.querySelector('input')?.focus();
        }
        
    }

    // se estiver no CÓDIGO (coluna 0)
    if (i === 0) {
        tr.cells[1]?.querySelector('input')?.focus();
    }
}


        });

        // =========================
        // CÓDIGO DO ITEM
        // =========================
       // =========================

if (i === 0) {

    input.addEventListener('blur', async function () {

        const cod = this.value.trim().toUpperCase();

        if (!cod) return;

        if (verificarCodigoDuplicadoNaTabela(cod, tr)) {
            alert('Este item já foi adicionado ao pedido.');
            this.value = '';
            this.focus();
            return;
        }

        const listaId = document.getElementById('codgroup').value;

        const cells = tr.querySelectorAll('td input');

        this.readOnly = true;

        // quantidade
        cells[1].readOnly = true;
        cells[1].value = '';

        // UV
        cells[2].value = '';

        // descrição
        cells[3].value = 'Carregando item...';

        // IPI
        cells[4].value = '';

        // unitário
        cells[5].value = '';

        // c/ ipi
        cells[6].value = '';

        // total
        cells[7].value = '';

        try {

            const response =
                await fetch(
                    `/api/lista-preco/${listaId}?codigo=${encodeURIComponent(cod)}`
                );

            if(!response.ok){

                let mensagemErro =
                    'Item não disponível.';

                try{

                    const erro =
                        await response.json();

                    mensagemErro =
                        erro.message ||
                        erro.mensagem ||
                        mensagemErro;

                }catch{

                    const textoErro =
                        await response.text()
                            .catch(() => '');

                    mensagemErro =
                        textoErro ||
                        mensagemErro;

                }

                throw new Error(
                    mensagemErro
                );

            }

            const data =
                await response.json();

            if(
                !Array.isArray(data) ||
                data.length === 0
            ){

                throw new Error(
                    'Item não encontrado.'
                );

            }

            const item =
                data[0];

            const itemAtivo =
                item.ATIVO ??
                item.Ativo ??
                item.ativo ??
                true;

            const itemSuspenso =
                item.SUSPENSO ??
                item.Suspenso ??
                item.suspenso ??
                false;

            const ativoNormalizado =
                String(itemAtivo)
                    .trim()
                    .toLowerCase();

            const suspensoNormalizado =
                String(itemSuspenso)
                    .trim()
                    .toLowerCase();

            if(
                itemAtivo === false ||
                itemAtivo === 0 ||
                ativoNormalizado === '0' ||
                ativoNormalizado === 'false' ||
                ativoNormalizado === 'não' ||
                ativoNormalizado === 'nao'
            ){

                throw new Error(
                    'Item inativo.'
                );

            }

            if(
                itemSuspenso === true ||
                itemSuspenso === 1 ||
                suspensoNormalizado === '1' ||
                suspensoNormalizado === 'true' ||
                suspensoNormalizado === 'sim'
            ){

                throw new Error(
                    'Item suspenso.'
                );

            }

            const preco =
                Number(
                    item.PrecoVenda
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

            const ipiMult =
                1 + ipi;

            cells[2].value =
                'CX';

            cells[3].value =
                item.ItemDescricao || '';

            cells[4].value =
                (ipi * 100)
                    .toLocaleString(
                        'pt-BR',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    ) + '%';

            const precoComIpi =
                preco * ipiMult;

            cells[5].value =
                preco.toLocaleString(
                    'pt-BR',
                    {
                        style: 'currency',
                        currency: 'BRL'
                    }
                );

            cells[6].value =
                precoComIpi.toLocaleString(
                    'pt-BR',
                    {
                        style: 'currency',
                        currency: 'BRL'
                    }
                );

            cells[1].readOnly =
                false;

            cells[1].oninput =
                () => {

                    const qtd =
                        parseFloat(
                            cells[1].value.replace(
                                ',',
                                '.'
                            )
                        ) || 0;

                    const totalLinha =
                        qtd * preco;

                    const totalComIpi =
                        totalLinha * ipiMult;

                    cells[7].value =
                        totalComIpi.toLocaleString(
                            'pt-BR',
                            {
                                style: 'currency',
                                currency: 'BRL'
                            }
                        );

                    atualizarTotais();

                };

            tr.dataset.itemId =
                String(
                    item.ItemId || ''
                );

            if(!tr.dataset.itemId){

                throw new Error(
                    'O item não possui identificador válido.'
                );

            }

            tr.dispatchEvent(
                new CustomEvent(
                    'carregamento-item-finalizado',
                    {
                        detail: {
                            sucesso: true,
                            codigo: cod,
                            mensagem: ''
                        }
                    }
                )
            );

        }catch(error){

            console.warn(
                `Item ${cod} não foi carregado:`,
                error
            );

            tr.dataset.itemId =
                '';

            cells[1].value =
                '';

            cells[1].readOnly =
                true;

            cells[2].value =
                '';

            cells[3].value =
                '';

            cells[4].value =
                '';

            cells[5].value =
                '';

            cells[6].value =
                '';

            cells[7].value =
                '';

            tr.dispatchEvent(
                new CustomEvent(
                    'carregamento-item-finalizado',
                    {
                        detail: {
                            sucesso: false,
                            codigo: cod,
                            mensagem:
                                error.message ||
                                'Item suspenso, inativo ou indisponível.'
                        }
                    }
                )
            );

        }finally{

            this.readOnly =
                false;

        }
            });
        }



    }

    tbody.appendChild(tr);
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

function obterIpiDoItem(item){

    const origem =
        Number(
            item.origem ??
            item.Origem ??
            0
        );

    const classificacaoFiscal =
        item.classificacaoFiscal ??
        item.ClassificacaoFiscal ??
        item.NCM ??
        item.ncm ??
        null;

    console.log(
        'Buscando IPI com getIpi:',
        {
            ItemCodigo:
                item.ItemCodigo,

            origem:
                origem,

            classificacaoFiscal:
                classificacaoFiscal
        }
    );

    if(origem !== 2){
        return 0;
    }

    if(
        classificacaoFiscal === null ||
        classificacaoFiscal === undefined ||
        String(classificacaoFiscal).trim() === ''
    ){

        throw new Error(
            `A API não retornou a classificação fiscal do item ${item.ItemCodigo || ''}.`
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
            document.getElementById('cnpj')
                ?.value || '',

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

                const cells =
                    row.querySelectorAll(
                        'td input'
                    );

                const codigo =
                    String(
                        cells[0]?.value || ''
                    )
                    .trim();

                const quantidade =
                    Number(
                        cells[1]?.value || 0
                    );

                const descricao =
                    String(
                        cells[3]?.value || ''
                    )
                    .trim();

                const precoUnitario =
                    String(
                        cells[5]?.value || ''
                    )
                    .trim();

                /*
                 * Ignora apenas linhas vazias ou inválidas.
                 * Isso não interrompe o processamento das
                 * linhas seguintes.
                 */
                if(
                    !codigo ||
                    quantidade <= 0 ||
                    !descricao ||
                    !precoUnitario
                ){
                    return null;
                }

                return {
                    Codigo:
                        codigo,

                    Quantidade:
                        quantidade,

                    Unidade:
                        cells[2]?.value || '',

                    Descricao:
                        descricao,

                    IPI:
                        cells[4]?.value || '',

                    PrecoUnitario:
                        precoUnitario,

                    PrecoComIPI:
                        cells[6]?.value || '',

                    Total:
                        cells[7]?.value || ''
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

function verificarCodigoDuplicadoNaTabela(codigo, linhaAtual) {
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    for (const tr of linhas) {
        if (tr === linhaAtual) continue; // ignora a própria linha

        const inputCodigo = tr.cells[0]?.querySelector('input');
        if (inputCodigo && inputCodigo.value.trim().toUpperCase() === codigo) {
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
        const itensPedidoVenda = Array.from(tableRows)
            .map(row => {
                const cells = row.querySelectorAll('td input'); // Captura os inputs da linha

                // Verifica se a linha tem dados válidos antes de adicioná-la
                const itemId = row.dataset.itemId || 0;
                const quantidade = Number(cells[1]?.value || 0); // Quantidade na segunda célula

                // Só adiciona a linha se tiver um ItemId e Quantidade válidos
                if (itemId > 0 && quantidade > 0) {
                    return {
                        ItemValorDesconto: 0,
                        ItemPercentualDesconto: 0,
                        EntregasItemPedidoVenda: [
                            {
                                Data: new Date().toISOString(), 
                                DataPrevista: new Date().toISOString(),
                                Quantidade: quantidade,
                            }
                        ],
                        ItemId: itemId,
                        Codigo: cells[0]?.value || '',
                        Quantidade: quantidade,
                    };
                }

                return null; // Retorna null para linhas inválidas
            })
            .filter(item => item !== null); // Remove itens nulos do array

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
            pedido.cnpj || '';
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

            const campos =
                linha.querySelectorAll(
                    'td input'
                );

            const campoCodigo =
                campos[0];

            const campoQuantidade =
                campos[1];

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

            const campos =
                linha.querySelectorAll(
                    'td input'
                );

            const codigo =
                String(
                    campos[0]?.value || ''
                )
                .trim();

            const quantidade =
                Number(
                    campos[1]?.value || 0
                );

            const descricao =
                String(
                    campos[3]?.value || ''
                )
                .trim();

            const preco =
                String(
                    campos[5]?.value || ''
                )
                .trim();

            const linhaInvalida =
                !codigo ||
                quantidade <= 0 ||
                !descricao ||
                descricao === 'Carregando item...' ||
                !preco ||
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
    tempoLimite = 15000
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

                        if(clienteId){

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
                                    'Não foi possível carregar o cliente informado no arquivo.'
                                )
                            );

                        }

                    },
                    100
                );

        }
    );

}

document.addEventListener(
    'DOMContentLoaded',
    () => {

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
