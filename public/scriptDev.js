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
  
let step = 0;

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
    const response = await fetch(`/api/lista-preco-Sem-Verificar/${listaId}`);
    listaPrecosData = await response.json();
    console.log('LISTA DE PREÇOS CARREGADA:', Array.isArray(listaPrecosData) ? listaPrecosData.length : listaPrecosData);
}

console.log('script.js carregado');

//run once

//  limparCamposCliente();
//  atualizarTotais();

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
const blockModal = el('blockModal');

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
    }
});

// ======================================================================
// 📦 PEDIDO / TABELA
// ======================================================================



function atualizarTotais() {
    atualizarTotalProdutos();
    atualizarTotalVolumes();
}

function garantirLinhaInicial() {
    const tbody = el('dadosPedido').querySelector('tbody');
    tbody.querySelectorAll('tr').forEach(tr => !tr.querySelector('input') && tr.remove());
    if (!tbody.querySelector('tr')) adicionarNovaLinha();
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
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    const produtos = [];

    linhas.forEach(tr => {
        const cells = tr.querySelectorAll('input');

        if (!cells[1]?.value) return; // ignora linha vazia

        produtos.push({
            nforigem: cells[0]?.value,
            data: cells[1]?.value, // ou você pode ter um campo de data
            codigoItem: cells[2]?.value,
            lote: cells[3]?.value, // se tiver campo, mapeia aqui
            quantidade: cells[4]?.value || 0,
            uv: cells[5]?.value,
            descricao: cells[6]?.value,
            precounitario: parseFloat(
                cells[7]?.value.replace("R$", "").replace(/\./g, "").replace(",", ".")
            ) || 0,
            total: parseFloat(
                cells[8]?.value.replace("R$", "").replace(/\./g, "").replace(",", ".")
            ) || 0
        });
    });

    const devolucao = {
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

    return devolucao;
}

async function salvarDevolucaoMongo() {
    if (!validarTabelaPedido()) return;

    const dados = montarObjetoDevolucao();

    try {
        const res = await fetch('/api/devolucao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await res.json();

        if (res.ok) {
            console.log('Devolução salva, aperte ok para enviar o email......');
        } else {
            throw new Error(result.error);
        }

    } catch (err) {
        console.error(err);
        alert('Erro ao salvar devolução');
    }
}



// Função para atualizar o total de volumes (quantidades) de todas as linhas
function atualizarTotalVolumes() {
    let totalVolumes = 0;
    const linhas = document.querySelectorAll('#dadosPedido tbody tr');

    linhas.forEach(tr => {
        const cell = tr.cells[4]?.querySelector('input');
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
        const quantidadeCell = tr.cells[4]?.querySelector('input');
        const valorTotalLinhaCell = tr.cells[9]?.querySelector('input');
        console.log('Quantidade cell:', quantidadeCell);
        console.log('Valor unitário cell:', valorTotalLinhaCell);

        if (quantidadeCell && valorTotalLinhaCell && quantidadeCell.value && valorTotalLinhaCell.value) {
            const quantidade = parseFloat(quantidadeCell.value.replace(",", "."));
            const valorTotalLinha = parseFloat(valorTotalLinhaCell.value.replace("R$", "").replace(/\./g, "").replace(",", "."));
            if (!isNaN(quantidade) && !isNaN(valorTotalLinha)) {
                totalProdutos += valorTotalLinha;
            }
        }
    });

    document.getElementById('total').value = totalProdutos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataMaiorQue6Meses(dataInput) {
    const dataSelecionada = new Date(dataInput);
    const hoje = new Date();

    const limite = new Date();
    limite.setMonth(limite.getMonth() - 6); // volta 6 meses

    return dataSelecionada < limite;
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
        // 1 = código
        // 2 = quantidade
        // 5 = valor unitário
        // 6 = total

        const nf = inputs[0]?.value.trim()
        const data = inputs[1]?.value.trim();
        if (!data) {
            alert(`Preencha a data na linha ${i + 1}`);
            inputs[1]?.focus();
            return false;
        }

        // 🚫 BLOQUEIO DE 6 MESES
        if (dataMaiorQue6Meses(data)) {
            alert(`A data da linha ${i + 1} é superior a 6 meses. Não é permitido.`);
            inputs[1]?.focus();
            return false;
}
        const codigo = inputs[2]?.value.trim();
        const lote = inputs[3]?.value.trim();
        const quantidade = inputs[4]?.value.trim();
        const valor = inputs[7]?.value.trim();
        const total = inputs[8]?.value.trim();

        if (!codigo || !quantidade || !valor || !total || !nf || !lote || !data) {
            alert(`Preencha todos os campos da linha ${i + 1}`);
            inputs[0]?.focus();
            return false;
        }
    }

    return true;
}


// Função para adicionar uma nova linha à tabela
function adicionarNovaLinha() {
    const tbody = document.querySelector('#dadosPedido tbody');
    const tr = document.createElement('tr');



    for (let i = 0; i < 11; i++) {
        const td = document.createElement('td');

        // coluna oculta (ItemId)
        if (i === 10) {
            td.style.display = 'none';
        }

        // 🗑 BOTÃO REMOVER LINHA
        if (i === 6) {
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
            continue; 
        }

        
        
        // ✏️ INPUT NORMAL
        const input = document.createElement('input');
        if(i === 1){
            input.type = 'date';
        }
        else {
            input.type = 'text';
        }
        // TAB só em quase tudo
        input.tabIndex = (i === 0 || i === 1 || i === 2 || i === 3 || i === 4 || i === 8) ? 0 : -1;

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

                if (linhaAtual === linhas.length - 1 && i === 10) {
                    adicionarNovaLinha();
                    setTimeout(() => {
                        tbody.lastChild.cells[0].querySelector('input').focus();
                    }, 0);
                } else {
                    linhas[linhaAtual + 1]?.cells[i]?.querySelector('input')?.focus();
                }
            }

            if (e.key === 'Tab' && !e.shiftKey && i === 10 && linhaAtual === linhas.length - 1) {
                e.preventDefault();
                setTimeout(() => {
                    tbody.lastChild.cells[0].querySelector('input').focus();
                }, 0);
            }
            //enter = tab
            if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) {
    e.preventDefault();

    // se estiver no valor (coluna 6)
    if (i === 8) {
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
        // se estiver no NF Origem (coluna 0)
    if (i === 0) {
        tr.cells[1]?.querySelector('input')?.focus();
    }
    // se estiver no CÓDIGO (coluna 1)
    if (i === 1) {
        tr.cells[2]?.querySelector('input')?.focus();
    }
    // se estiver na quantidade (coluna 2)
    if (i === 2) {
        tr.cells[3]?.querySelector('input')?.focus();
    }
    if (i === 3) {
        tr.cells[4]?.querySelector('input')?.focus();
    }
    if (i === 4) {
        tr.cells[8]?.querySelector('input')?.focus();
    }
}


        });

        // =========================
        // CÓDIGO DO ITEM
        // =========================
       // =========================

if (i === 2) {
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
        cells[6].value = 'Carregando item, por favor aguarde...';
        this.readOnly = true;


        try {
            const response = await fetch(
                `/api/lista-preco-Sem-Verificar/${listaId}?codigo=${encodeURIComponent(cod)}`
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
            cells[5].value = 'UN';
            cells[5].readOnly = true;
            cells[6].value = item.ItemDescricao;
            cells[7].readOnly = false; 
            cells[8].readOnly = true;
            cells[6].readOnly = true;

            cells[2].addEventListener('input', (e) => {
                cells[7].value = '';
                cells[1].value = '';
                cells[0].value = '';
                cells[3].value = '';
                cells[4].value = '';
                const preco = parseFloat(cells[7].value.replace(',', '.')) || 0;
                const qtd = parseFloat(cells[4].value.replace(',', '.')) || 0;
                console.log(preco);
                const formatador = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                });

            totalLinha = preco * qtd;
                cells[8].value = formatador.format(totalLinha)
                tr.dataset.itemId = item.ItemId;
                atualizarTotais();
            });


            cells[4].addEventListener('input', (e) => {

                const preco = parseFloat(cells[7].value.replace(',', '.')) || 0;
                const qtd = parseFloat(cells[4].value.replace(',', '.')) || 0;
                console.log(preco);
                const formatador = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                });
                

            totalLinha = preco * qtd;
                cells[8].value = formatador.format(totalLinha)
                tr.dataset.itemId = item.ItemId;
                atualizarTotais();
            });

            cells[7].addEventListener('input', (e) => {

                const preco = parseFloat(cells[7].value.replace(',', '.')) || 0;
                const qtd = parseFloat(cells[4].value.replace(',', '.')) || 0;
                console.log(preco);
                const formatador = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                });
                

            totalLinha = preco * qtd;
                cells[8].value = formatador.format(totalLinha)
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
        const inputCodigo = tr.cells[2]?.querySelector('input');
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

        const inputCodigo = tr.cells[2]?.querySelector('input');
        if (inputCodigo && inputCodigo.value.trim().toUpperCase() === codigo) {
            return true;
        }
    }
    return false;
}

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
const modal = document.getElementById('customModal');
const closeButton = document.querySelector('.close-button');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');
const cnpjInput = document.getElementById('cnpj');

// Função para abrir o modal

// Fecha o modal ao clicar no botão "Não" ou no botão de fechar
closeButton.addEventListener("click", () => {
    modal.style.display = "none";
});



//--fim-----envio de dados para o sistema DBCorp------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

showStep();


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
    const selector = document.getElementById('seletor');
    
    // Elementos do modal de limite de tamanho
    const sizeLimitModal = document.getElementById('sizeLimitModal');
    const sizeLimitMessage = document.getElementById('sizeLimitMessage');
    const sizeLimitOkButton = document.getElementById('sizeLimitOkButton');
    const sizeLimitCloseButton = sizeLimitModal.querySelector('.close-button1');

    
    // E-mail fixo que não pode ser removido
    const FIXED_EMAIL = `devolucao.kz@kidszoneworld.com.br`;
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
        const content = document.querySelector('.container');
        const razaoSocial = document.getElementById('razao_social').value || "Cliente";
        const obs = document.getElementById('observation').value 
        const timestamp = formatarDataBrasileira();
        const filename = `Devolucao_${razaoSocial}_${timestamp}.pdf`;

        const options = {
            margin: [0, 0, 0, 0],
            filename: filename,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
        };
         try {
            hideFeedback();
            buttonPdf.style.display = 'none';
            selector.style.display = 'none';

            const pdfBlob = await html2pdf().set(options).from(content).output('blob');
            generatedPdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
            return generatedPdfFile;
        } catch (error) {
            console.error('Erro ao gerar o PDF:', error);
            alert('Erro ao gerar o PDF: ' + error.message);
            return null;
        } finally {
            buttonPdf.style.display = 'block';
            selector.style.display = 'inline-block';
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
        await salvarDevolucaoMongo();
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
        text: 'Olá Sr(a).Representante,\nSomente serão aceitas devoluções com até 180 dias da emissão da nota fiscal de origem!!!\n\n Aperte em próximo para continuar com o tutorial ou pressione finalizar para sair '
    },
    {
        element: '#cnpj',
        text: 'Passo 1. Informe o CNPJ do cliente.\n\n As demais informações serão carregadas automaticamente.'
    },
    {
        element: '#observation',
        text: 'Passo 2. Informe o motivo da devolução.'
    },
    {
        element: '#dadosPedido',
        text: "Passo 3. Adicione os itens a serem devolvidos, preenchendo TODOS os campos:\n" +
            "- NF de origem\n" +
            "- Data da NF\n" +
            "- Código do item (carrega automaticamente a descrição)\n" +
            "- Lote\n" +
            "- Quantidade (em unidade)\n" +
            "- Valor unitário\n\n" 
    },    
    {
        element: '#button_pdf',
        text: "Passo 4. Clique em 'Enviar por e-mail'.\n" +
            "Anexe as imagens dos itens devolvidos e, se necessário, adicione destinatários em cópia (CC) separando os emails por ;.\n\n"
    }
];

function showStep() {
    console.log("step" + step)
    const overlay = document.getElementById('tutorialOverlay');
    const box = document.getElementById('tutorialBox');
    const text = document.getElementById('tutorialText');

    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));

    const stepData = tutorialSteps[step];
    const element = document.querySelector(stepData.element);

    if (!element) return;

    element.classList.add('highlight');

    //TRATAMENTO ESPECIAL PARA O PRIMEIRO STEP
    if (step === 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });

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

function endTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'none';
    document.getElementById('tutorialBox').style.display = 'none';

    document.querySelectorAll('.highlight')
        .forEach(el => el.classList.remove('highlight'));

    step = 0; // reseta o tutorial
}
