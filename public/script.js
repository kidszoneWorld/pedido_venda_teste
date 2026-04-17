const timestamp = Date.now();
// ======================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ======================================================================
let clientesData;
let promocaoData;
let foraDeLinhaData;
let listaPrecosData;
let icmsSTData;
let listaPrecosIpiData;



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



async function carregarListaPrecos(listaId) {
    const response = await fetch(`/api/lista-preco/${listaId}`);
    listaPrecosData = await response.json();
    console.log('LISTA DE PREÇOS CARREGADA:', Array.isArray(listaPrecosData) ? listaPrecosData.length : listaPrecosData);
}

console.log('script.js carregado');

// limpar tudo ao atualizar page (run once)

// limparCamposCliente();
// atualizarTotais();

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
const blockModal = el('blockModal');
el('okButton').onclick = () => blockModal.style.display = "none";
blockModal.querySelector('.close-button').onclick = () => blockModal.style.display = "none";

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

    let clienteApi;

    try {
        const res = await fetch(`/api/cliente/${cnpj}`);
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

        if (clienteApi.LISTA) await carregarListaPrecos(clienteApi.LISTA);

    } catch {
        alert("Cliente não encontrado, verificar com o financeiro.");
    } finally {
        hideFeedback();
        this.readOnly = false;
        garantirLinhaInicial();
        setTimeout(() => document.querySelector('#dadosPedido tbody tr input')?.focus(), 0);
    }
});

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

// (demais funções de tabela permanecem exatamente como estão)

// ======================================================================
// 🚀 ENVIO DO PEDIDO
// ======================================================================
// (mantido igual, apenas usando atualizarTotais() onde aplicável)



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

    // 🔥 foco automático no código do item
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
function buscarIpiDoItem(codigoItem) {
    if (!Array.isArray(listaPrecosIpiData) || listaPrecosIpiData.length < 2) {
        return 0;
    }

    const header = listaPrecosIpiData[0];
    const idxCodigo = header.indexOf("ITEM COD");
    const idxIpi = header.indexOf("IPI");

    if (idxCodigo === -1 || idxIpi === -1) {
        console.warn('Coluna ITEM COD ou IPI não encontrada');
        return 0;
    }

    const linha = listaPrecosIpiData.find(
        (row, index) =>
            index > 0 &&
            String(row[idxCodigo]).trim().toUpperCase() ===
            String(codigoItem).trim().toUpperCase()
    );

    if (!linha) return 0;

    const ipi = Number(linha[idxIpi]);
    return isNaN(ipi) ? 0 : ipi;
}






// Função para adicionar uma nova linha à tabela
function adicionarNovaLinha() {
    const tbody = document.querySelector('#dadosPedido tbody');
    const tr = document.createElement('tr');



    for (let i = 0; i < 10; i++) {
        const td = document.createElement('td');

        // 🔴 coluna oculta (ItemId)
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

        // VERIFICA DUPLICIDADE
        if (verificarCodigoDuplicadoNaTabela(cod, tr)) {
            alert('Este item já foi adicionado ao pedido.');
            this.value = '';
            this.focus();
            return;
        }

        const listaId = document.getElementById('codgroup').value;
        const cells = tr.querySelectorAll('td input');

        // 🔄 FEEDBACK VISUAL
        cells[3].value = 'Carregando item, por favor aguarde...';
        this.readOnly = true;
        cells[1].readOnly = true;
        cells[1].value = '';
        cells[2].value = '';
        cells[4].value = '';
        cells[5].value = '';
        cells[6].value = '';
        cells[7].value = '';

        try {
            const response = await fetch(
                `/api/lista-preco/${listaId}?codigo=${encodeURIComponent(cod)}`
            );

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.message || 'Item não disponível');
            }

            const data = await response.json();
            if (!data.length) {
                throw new Error('Item não encontrado');
            }

            const item = data[0];
            const preco = Number(item.PrecoVenda);

            // ✅ IPI DINÂMICO
            const ipi = buscarIpiDoItem(cod);
            const ipiMult = 1 + ipi;

            cells[2].value = 'CX';
            cells[3].value = item.ItemDescricao;
            cells[4].value = (ipi * 100).toFixed(2) + '%';

            const precoComIpi = preco * ipiMult;

            cells[5].value = preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            cells[6].value = precoComIpi.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            cells[1].readOnly = false;
            cells[1].focus();

            cells[1].addEventListener('input', () => {
                const qtd = parseFloat(cells[1].value.replace(',', '.')) || 0;
                const totalLinha = qtd * preco;
                const totalComIpi = totalLinha * ipiMult;

                cells[7].value = totalComIpi.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                tr.dataset.itemId = item.ItemId;
                atualizarTotais();
            });

        } catch (error) {
            alert(error.message);
            this.value = '';
            this.focus();
        } finally {
            this.readOnly = false;
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

   // if(!validarPedidoMinimo())                                Habilitar 04/05/2026
     //   return;
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
        console.log("JSON enviado para a API:", requestBody);
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
            pagebreak: { mode: 'avoid-all' }
        };

        try {
            btPdfGeneration.disabled = true;
            console.log('Iniciando geração do PDF...');

            const pdfBlob = await html2pdf().set(options).from(content).output('blob');
            const pdfURL = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = pdfURL;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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

                    const pdfBase64 = await html2pdf().set(options).from(content).outputPdf('datauristring');
                    console.log('PDF gerado para envio, iniciando requisição...');

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
        document.getElementById('total_imp').value = '';

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

        // if(!validarPedidoMinimo())                       habilitar 04/05/2026
        //     return;

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
