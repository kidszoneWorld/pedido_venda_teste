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
const timestamp = Date.now();

fetch(`/data/cliente.json?cacheBust=${timestamp}`).then(r => r.json()).then(d => clientesData = d);
fetch(`/data/Promocao.json?cacheBust=${timestamp}`).then(r => r.json()).then(d => promocaoData = d);
fetch(`/data/Fora de linha.json?cacheBust=${timestamp}`).then(r => r.json()).then(d => foraDeLinhaData = d);
fetch(`/data/ICMS-ST.json?cacheBust=${timestamp}`).then(r => r.json()).then(d => icmsSTData = d);

async function carregarListaPrecos(listaId) {
    const response = await fetch(`/api/lista-preco/${listaId}`);
    listaPrecosData = await response.json();
    console.log('LISTA DE PREÇOS CARREGADA:', Array.isArray(listaPrecosData) ? listaPrecosData.length : listaPrecosData);
}

console.log('script.js carregado');

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
    cnpj = ajustarCNPJ(cnpj);
    for (let i = 1; i < clientesData.length; i++) {
        if (ajustarCNPJ(clientesData[i][1].toString()) === cnpj) {
            return clientesData[i];
        }
    }
    return null;
}

function buscarPromocao(cod) {
    for (let i = 1; i < promocaoData.length; i++) {
        if (promocaoData[i][0] == cod) return promocaoData[i];
    }
    return null;
}

function verificarForaDeLinha(cod) {
    for (let i = 1; i < foraDeLinhaData.length; i++) {
        if (foraDeLinhaData[i][0] == cod) return true;
    }
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
    limparCamposCliente();
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
    atualizarTotalComImposto();
    atualizarTotalVolumes();
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

    atualizarTotalComImposto();
    atualizarTotalVolumes();
    atualizarTotalProdutos();
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



// Função para atualizar o total com imposto de todas as linhas
function atualizarTotalComImposto() {
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
    
    document.getElementById('total_imp').value = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
                atualizarTotalProdutos();
                atualizarTotalComImposto();
                atualizarTotalVolumes();
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

        // 🚫 VERIFICA DUPLICIDADE
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
            const ipi = 0.0325;

            cells[2].value = 'CX';
            cells[3].value = item.ItemDescricao;
            cells[5].value = preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            cells[4].value = '3,25%';

            cells[1].readOnly = false;
            cells[1].focus();

            cells[1].addEventListener('input', () => {
                const qtd = parseFloat(cells[1].value.replace(',', '.')) || 0;
                const precoIpi = preco * (1 + ipi);
                const totalLinha = qtd * precoIpi;

                cells[6].value = precoIpi.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                cells[7].value = totalLinha.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                tr.dataset.itemId = item.ItemId;

                atualizarTotalProdutos();
                atualizarTotalComImposto();
                atualizarTotalVolumes();
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
        atualizarTotalComImposto();
        atualizarTotalVolumes();
        atualizarTotalProdutos();
    } else {
        alert("Nenhuma linha para remover");
    }
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

// Função para abrir o modal
btSistema.addEventListener("click", () => {
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
    console.log('CONFIRM BUTTON CLICADO');
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
        } else {
            alert(`Erro ao enviar pedido: ${result.ErrorMessages?.join(", ") || "Erro desconhecido"}`);
            console.error("Erro da API:", result);
        }
    } catch (error) {
        console.error("Erro de conexão:", error);
        alert("Erro ao conectar com o servidor.");
    } finally {
    limparCamposCliente();
    zerarCamposPedido();   // ← ISSO É FUNDAMENTAL
    feedbackDiv.style.display = "none";
}
});

//--fim-----envio de dados para o sistema DBCorp------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
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


/*

//// Variáveis globais 
let clientesData;
let promocaoData;
let foraDeLinhaData;
let listaPrecosData;
let icmsSTData;
//// Variáveis globais 

//Função para atualizar os caches no navegador
const timestamp = new Date().getTime();

// Função para carregar os JSONs 
fetch(`/data/cliente.json?cacheBust=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        clientesData = data;
    });

fetch(`/data/Promocao.json?cacheBust=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        promocaoData = data;
    });

fetch(`/data/Fora de linha.json?cacheBust=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        foraDeLinhaData = data;
    });

async function carregarListaPrecos(listaId) {
    const response = await fetch(`/api/lista-preco/${listaId}`);
    listaPrecosData = await response.json();

    console.log(
  'LISTA DE PREÇOS CARREGADA:',
  Array.isArray(listaPrecosData) ? listaPrecosData.length : listaPrecosData
);
}



// fetch(`/data/Lista-precos.json?cacheBust=${timestamp}`)
//     .then(response => response.json())
//     .then(data => {
//         listaPrecosData = data;
//     });

fetch(`/data/ICMS-ST.json?cacheBust=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        icmsSTData = data;
    });
console.log('script.js carregado');
// Função para formatar o CNPJ com máscara
function formatarCNPJ(cnpj) {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

// Função para formatar o CEP com máscara
function formatarCEP(cep) {
    return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

// Função para ajustar o CNPJ com zeros à esquerda, se necessário
function ajustarCNPJ(cnpj) {
    while (cnpj.length < 14) {
        cnpj = '0' + cnpj;
    }
    return cnpj;
}

// Função para buscar o produto em promoção
function buscarPromocao(cod) {
    for (let i = 1; i < promocaoData.length; i++) {
        if (promocaoData[i][0] == cod) {
            return promocaoData[i];
        }
    }
    return null;
}

// Função para verificar se o código está fora de linha
function verificarForaDeLinha(cod) {
    for (let i = 1; i < foraDeLinhaData.length; i++) {
        if (foraDeLinhaData[i][0] == cod) {
            return true;
        }
    }
    return false;
}



// Função para buscar os dados do cliente pelo CNPJ
function buscarCliente(cnpj) {
    // Ajusta o CNPJ com zeros à esquerda
    cnpj = ajustarCNPJ(cnpj);

    for (let i = 1; i < clientesData.length; i++) {
        let cnpjCliente = ajustarCNPJ(clientesData[i][1].toString());
        if (cnpjCliente === cnpj) {
            return clientesData[i];
        }
    }
    return null;
}



// Função para verificar se o CNPJ é composto apenas de zeros
function cnpjInvalido(cnpj) {
    return /^0+$/.test(cnpj);
}


// Função para limpar todos os campos relacionados ao cliente
function limparCamposCliente() {
    document.getElementById('razao_social').value = '';
    document.getElementById('ie').value = '';
    document.getElementById('representante').value = '';
    document.getElementById('endereco').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('uf').value = '';
    document.getElementById('cep').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('email_fiscal').value = '';
    document.getElementById('cod_cliente').value = '';
    document.getElementById('pay').value = '';
    document.getElementById('group').value = '';
    document.getElementById('transp').value = '';
    document.getElementById('codgroup').value = '';
    document.getElementById('email_rep').value = '';
}

// Adiciona o evento de focus no campo CNPJ
const cnpjInput1 = document.getElementById('cnpj');
const blockModal = document.getElementById('blockModal');
const okButton = document.getElementById('okButton');
const closeButtonBlock = blockModal.querySelector('.close-button');

cnpjInput1.addEventListener('focus', function () {
    if (cnpjInput1.readOnly) {
        blockModal.style.display = "block";
        const now = new Date();
        const timestamp = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
        document.getElementById('timestamp').textContent = timestamp;
        return;
    }
    limparCamposCliente();
});

okButton.addEventListener('click', () => {
    blockModal.style.display = "none";
});

closeButtonBlock.addEventListener('click', () => {
    blockModal.style.display = "none";
});

window.addEventListener('click', (event) => {
    if (event.target == blockModal) {
        blockModal.style.display = "none";
    }
});

// Função para buscar os dados do cliente pelo CNPJ
function buscarCliente(cnpj) {
    // Ajusta o CNPJ com zeros à esquerda
    cnpj = ajustarCNPJ(cnpj);

    for (let i = 1; i < clientesData.length; i++) {
        let cnpjCliente = ajustarCNPJ(clientesData[i][1].toString());
        if (cnpjCliente === cnpj) {
            return clientesData[i];
        }
    }
    return null;
}

// Mostrar Feedback
function showFeedback(message) {
    const feedback1 = document.getElementById('feedback1'); // Alterado para feedback1 conforme o HTML
    feedback1.style.display = 'block';
    feedback1.textContent = message;
}


// Ocultar Feedback
function hideFeedback() {
    const feedback1 = document.getElementById('feedback1'); // Alterado para feedback1 conforme o HTML
    feedback1.style.display = 'none';
    feedback1.textContent = '';
}


// Função para preencher os campos ao digitar o CNPJ
document.getElementById('cnpj').addEventListener('blur', async function (event) {
    
    let cnpj = this.value.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Verifica se o campo está vazio
    if (cnpj === '') {
            return; // Sai da função sem buscar dados
    }

    // Verifica se o CNPJ é inválido (apenas zeros)
    if (cnpjInvalido(cnpj)) {
        alert("CNPJ inválido.");
        this.value = ''; // Limpa o campo CNPJ
        return; // Sai da função sem buscar dados
    }


    cnpj = ajustarCNPJ(cnpj);

    // Aplica a máscara ao CNPJ
    this.value = formatarCNPJ(cnpj);

////////////////////////////////////////////////
// 🔄 feedback visual de carregamento do cliente
showFeedback('Carregando cliente...');
this.readOnly = true;
let clienteApi
    try {
        // Faz a requisição à API
        const response = await fetch(`/api/cliente/${cnpj}`);
        if (!response.ok) {
            throw new Error('Cliente não encontrado');
        }

        clienteApi = await response.json();

        // Verifica os campos ATIVO e SUSPENSO antes de prosseguir
        const ativo = clienteApi["ATIVO"];
        const suspenso = clienteApi["SUSPENSO"];

        if (ativo === false) {
            alert("Cliente inativo.");
            limparCamposCliente(); // Limpa os campos para evitar preenchimento
            return; // Interrompe o processo
        }

        if (suspenso === true) {
            alert("Cliente suspenso.");
            limparCamposCliente(); // Limpa os campos para evitar preenchimento
            return; // Interrompe o processo
        }

        // Simula o formato do clientesData como um array de arrays
        clientesData = [
            null, // Índice 0 não era usado no JSON antigo
            [
                null, // Índice 0 interno não usado
                clienteApi["CNPJ"],
                clienteApi["INSC. ESTADUAL"],
                clienteApi["RAZÃO SOCIAL"],
                clienteApi["TELEFONE"],
                clienteApi["LISTA NOME"],
                clienteApi["EMAIL COMERCIAL"],
                clienteApi["EMAIL FISCAL"],
                clienteApi["ENDEREÇO"],
                clienteApi["BAIRRO"],
                clienteApi["CIDADE"],
                clienteApi["UF"],
                clienteApi["CEP"],
                clienteApi["NOME CONTATO"],
                clienteApi["COND. DE PAGTO"],
                clienteApi["REPRESENTANTE"],
                clienteApi["REPRESENTANTE NOME"],
                clienteApi["COD CLIENTE 2"],
                clienteApi["LISTA"],
                clienteApi["LISTA NOME1"],
                clienteApi["TRANSPORTADORA"],
                clienteApi["CliDataHoraIncl"],
                clienteApi["REPRESENTANTE E-MAIL"],
                clienteApi["REP COMISSAO ITEM"],
                clienteApi["REP COMISSAO SERVICO"],
                clienteApi["FORMA DE PAGAMENTO ID"],
                clienteApi["FORMA DE PAGAMENTO DESCRICAO"],
                clienteApi["ID COND. DE PAGTO"],
                clienteApi["ID NOME CONTATO"],
                clienteApi["NOME GRUPO CLIENTE"],
                clienteApi["GRUPO CLIENTE"],
                clienteApi["ATIVO"],
                clienteApi["SUSPENSO"]
            ]
        ];

        // Busca o cliente no formato esperado pela função original
        let cliente = buscarCliente(cnpj);
        if (cliente) {
            document.getElementById('razao_social').value = cliente[3];
            document.getElementById('ie').value = cliente[2];
            document.getElementById('representante').value = `${cliente[15]} - ${cliente[16]}`;
            document.getElementById('endereco').value = cliente[8];
            document.getElementById('bairro').value = cliente[9];
            document.getElementById('cidade').value = cliente[10];
            document.getElementById('uf').value = cliente[11];

            // Aplica a máscara ao CEP
            let cep = cliente[12].toString();
            document.getElementById('cep').value = formatarCEP(cep);

            document.getElementById('telefone').value = cliente[4];
            document.getElementById('email').value = cliente[6];
            document.getElementById('email_fiscal').value = cliente[7];
            document.getElementById('cod_cliente').value = cliente[17];
            document.getElementById('pay').value = cliente[14];
            document.getElementById('group').value = cliente[19];
            document.getElementById('transp').value = cliente[20];
            document.getElementById('codgroup').value = cliente[18];
            document.getElementById('representanteId').value = cliente[15];
            document.getElementById('formPagId').value = cliente[25];
            document.getElementById('condPagId').value = cliente[27];
            document.getElementById('PercentualComissaoItem').value = cliente[23];
            document.getElementById('PercentualComissaoServico').value = cliente[24];
            document.getElementById('ContatoClienteId').value = cliente[28];
            document.getElementById('formPagDescricao').value = cliente[26];
            document.getElementById('email_rep').value = cliente[22];
        } else {
            alert("Cliente não encontrado.");
        }
    } catch (error) {
        console.error('Erro ao buscar cliente na API:', error);
        alert("Cliente não encontrado por favor verificar com o financeiro.");
    } finally {
        // Oculta a mensagem de feedback após o carregamento
        hideFeedback();
        this.readOnly = false;
        garantirLinhaInicial();
    }
if (clienteApi?.LISTA) {
    await carregarListaPrecos(clienteApi["LISTA"]);
}

garantirLinhaInicial();

// foco direto no código do primeiro item
setTimeout(() => {
    const primeiraLinha = document.querySelector('#dadosPedido tbody tr');
    if (primeiraLinha) {
        primeiraLinha.cells[0].querySelector('input')?.focus();
    }
}, 0);


////////////////////////////////////////
/// Busca o cliente no formato original JSON.
    // let cliente = buscarCliente(cnpj);
    // if (cliente) {
    //     document.getElementById('razao_social').value = cliente[3];
    //     document.getElementById('ie').value = cliente[2];
    //     document.getElementById('representante').value = `${cliente[15]} - ${cliente[16]}`;
    //     document.getElementById('endereco').value = cliente[8];
    //     document.getElementById('bairro').value = cliente[9];
    //     document.getElementById('cidade').value = cliente[10];
    //     document.getElementById('uf').value = cliente[11];

    //     // Aplica a máscara ao CEP
    //     let cep = cliente[12].toString();
    //     document.getElementById('cep').value = formatarCEP(cep);

    //     document.getElementById('telefone').value = cliente[4];
    //     document.getElementById('email').value = cliente[6];
    //     document.getElementById('email_fiscal').value = cliente[7];
    //     document.getElementById('cod_cliente').value = cliente[17];
    //     document.getElementById('pay').value = cliente[14];
    //     document.getElementById('group').value = cliente[19];
    //     document.getElementById('transp').value = cliente[20];
    //     document.getElementById('codgroup').value = cliente[18];
    //     document.getElementById('representanteId').value = cliente[15];
    //     document.getElementById('formPagId').value = cliente[25];
    //     document.getElementById('condPagId').value = cliente[27];
    //     document.getElementById('PercentualComissaoItem').value = cliente[23];
    //     document.getElementById('PercentualComissaoServico').value = cliente[24];
    //     document.getElementById('ContatoClienteId').value = cliente[28];
    //     document.getElementById('formPagDescricao').value = cliente[26];
    //     document.getElementById('email_rep').value = cliente[22];

    // } else {
    //     alert("Cliente não encontrado.");
    // }
});
function garantirLinhaInicial() {
    const tbody = document.querySelector('#dadosPedido tbody');

    // remove linhas vazias ou corrompidas
    tbody.querySelectorAll('tr').forEach(tr => {
        if (!tr.querySelector('input')) {
            tr.remove();
        }
    });

    if (!tbody.querySelector('tr')) {
        adicionarNovaLinha();
    }
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

    // 🔥 foco automático no código do item
    setTimeout(() => {
        const primeiraLinha = document.querySelector('#dadosPedido tbody tr');
        primeiraLinha?.cells[0]?.querySelector('input')?.focus();
    }, 0);

    atualizarTotalComImposto();
    atualizarTotalVolumes();
    atualizarTotalProdutos();
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



// Função para atualizar o total com imposto de todas as linhas
function atualizarTotalComImposto() {
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
    
    document.getElementById('total_imp').value = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
                atualizarTotalProdutos();
                atualizarTotalComImposto();
                atualizarTotalVolumes();
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
// CÓDIGO DO ITEM
// =========================
if (i === 0) {
    input.addEventListener('blur', async function () {
        const cod = this.value.trim().toUpperCase();
        if (!cod) return;

        // 🚫 VERIFICA DUPLICIDADE
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
            const ipi = 0.0325;

            cells[2].value = 'CX';
            cells[3].value = item.ItemDescricao;
            cells[5].value = preco.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            cells[4].value = '3,25%';

            cells[1].readOnly = false;
            cells[1].focus();

            cells[1].addEventListener('input', () => {
                const qtd = parseFloat(cells[1].value.replace(',', '.')) || 0;
                const precoIpi = preco * (1 + ipi);
                const totalLinha = qtd * precoIpi;

                cells[6].value = precoIpi.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                cells[7].value = totalLinha.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });

                tr.dataset.itemId = item.ItemId;

                atualizarTotalProdutos();
                atualizarTotalComImposto();
                atualizarTotalVolumes();
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
        atualizarTotalComImposto();
        atualizarTotalVolumes();
        atualizarTotalProdutos();
    } else {
        alert("Nenhuma linha para remover");
    }
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

// Função para abrir o modal
btSistema.addEventListener("click", () => {
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
    console.log('CONFIRM BUTTON CLICADO');
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
        } else {
            alert(`Erro ao enviar pedido: ${result.ErrorMessages?.join(", ") || "Erro desconhecido"}`);
            console.error("Erro da API:", result);
        }
    } catch (error) {
        console.error("Erro de conexão:", error);
        alert("Erro ao conectar com o servidor.");
    } finally {
    limparCamposCliente();
    zerarCamposPedido();   // ← ISSO É FUNDAMENTAL
    feedbackDiv.style.display = "none";
}
});

//--fim-----envio de dados para o sistema DBCorp------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
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




*/