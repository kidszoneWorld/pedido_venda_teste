// Variáveis globais
let clientesData;

// Função para atualizar o cache
const timestamp = new Date().getTime();

// Carregar dados do cliente.json
fetch(`/data/cliente.json?cacheBust=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        clientesData = data;
    })
    .catch(error => console.error('Erro ao carregar cliente.json:', error));

// Funções auxiliares
function ajustarCNPJ(cnpj) {
    while (cnpj.length < 14) {
        cnpj = '0' + cnpj;
    }
    return cnpj;
}

function cnpjInvalido(cnpj) {
    return /^0+$/.test(cnpj);
}

function limparCamposCliente() {
    document.getElementById('cliente').value = '';
    document.getElementById('codgroup').value = '';
    document.getElementById("rep").value = '';
    document.getElementById('table-body').innerHTML = '';
}

// Buscar cliente pelo CNPJ
function buscarCliente(cnpj) {
    cnpj = ajustarCNPJ(cnpj);
    for (let i = 1; i < clientesData.length; i++) {
        let cnpjCliente = ajustarCNPJ(clientesData[i][1].toString());
        if (cnpjCliente === cnpj) return clientesData[i];
    }
    return null;
}

// Adicionar linha na tabela
function adicionarLinha(dados = {}) {
    const tableBody = document.getElementById('table-body');
    const row = document.createElement('tr');
    const campos = [
        'razao_social', 'nome_fantasia', 'qtd_lojas', 'uf', 'qtd_sku',
         'modelo_display', 'jan25', 'fev25', 'mar25', 
        'abr25', 'mai25', 'jun25', 'jul25', 'ago25', 'set25', 'out25', 
        'nov25', 'dez25'
    ];

    campos.forEach(campo => {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = dados[campo] || '';
        cell.appendChild(input);
        row.appendChild(cell);
    });

    const deleteCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Remover';
    deleteButton.onclick = () => removerLinha(row, dados._id);
    deleteCell.appendChild(deleteButton);
    row.appendChild(deleteCell);

    tableBody.appendChild(row);
}

// Remover linha
async function removerLinha(row, id) {
    if (id) {
        try {
            const response = await fetch('/api/redes/remover', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!response.ok) throw new Error('Erro ao remover linha');
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao remover linha');
            return;
        }
    }
    row.parentNode.removeChild(row);
}

// Buscar dados do MongoDB
async function buscarDadosRedes(codgroup) {
    try {
        const response = await fetch(`/api/redes/${codgroup}`);
        if (!response.ok) {
            if (response.status === 404) return;
            throw new Error('Erro na requisição');
        }
        const { cliente, rede } = await response.json();
        console.log(rede);
        
        document.getElementById('cliente').value = cliente.nome;
        document.getElementById('codgroup').value = cliente.codigo_cliente;
        
        rede.forEach(dados => adicionarLinha(dados));
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}

// Salvar dados
async function salvarDados() {
    const codgroup = document.getElementById('codgroup').value;
    const nome = document.getElementById('cliente').value;
    const representante = document.getElementById("rep").value.trim();
    const cnpj = document.getElementById('cnpj').value.trim();

    if (!cnpj || !codgroup) {
        alert('Preencha o CNPJ e o Código do Cliente.');
        return;
    }

    const linhas = Array.from(document.getElementById('table-body').rows);
    const dados = linhas.map(row => {
        const inputs = row.querySelectorAll('input');
        return {
            codigo_cliente: codgroup,
            nome:nome,
            representante: representante,
            razao_social: inputs[0].value,
            nome_fantasia: inputs[1].value,
            qtd_lojas: parseFloat(inputs[2].value) || 0,
            uf: inputs[3].value,
            qtd_sku: parseFloat(inputs[4].value) || 0,
            modelo_display: inputs[5].value,
            jan25: parseFloat(inputs[6].value) || 0,
            fev25: parseFloat(inputs[7].value) || 0,
            mar25: parseFloat(inputs[8].value) || 0,
            abr25: parseFloat(inputs[9].value) || 0,
            mai25: parseFloat(inputs[10].value) || 0,
            jun25: parseFloat(inputs[11].value) || 0,
            jul25: parseFloat(inputs[12].value) || 0,
            ago25: parseFloat(inputs[13].value) || 0,
            set25: parseFloat(inputs[14].value) || 0,
            out25: parseFloat(inputs[15].value) || 0,
            nov25: parseFloat(inputs[16].value) || 0,
            dez25: parseFloat(inputs[17].value) || 0
        };
    });

    try {
        const response = await fetch('/api/redes/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo_cliente: codgroup, nome, representante:representante ,redes: dados })
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados');
    }
}

// Eventos
document.getElementById('cnpj').addEventListener('focus', limparCamposCliente);

document.getElementById('cnpj').addEventListener('blur', async function () {
    const cnpj = this.value.replace(/\D/g, '');
    if (!cnpj) {
        limparCamposCliente();
        return;
    }
    if (cnpjInvalido(cnpj)) {
        alert('CNPJ inválido.');
        this.value = '';
        limparCamposCliente();
        return;
    }

    const cliente = buscarCliente(cnpj);
    if (cliente) {
        document.getElementById('cliente').value = cliente[29];
        document.getElementById('codgroup').value = cliente[30];
        document.getElementById('rep').value = cliente[15];
        await buscarDadosRedes(cliente[30]);
    } else {
        alert('Cliente não encontrado.');
        limparCamposCliente();
    }
});

document.getElementById('adicionaLinha').addEventListener('click', () => adicionarLinha());

document.getElementById('btnSalvarDados1').addEventListener('click', salvarDados);