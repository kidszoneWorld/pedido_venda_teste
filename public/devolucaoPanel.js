let listaOriginal = [];

async function carregarDevolucoes() {
    try {
        const res = await fetch('/api/devolucao');
        const dados = await res.json();

        listaOriginal = dados; 
        renderizarTabela(dados);
    } catch (err) {
        console.error('Erro ao carregar devoluções', err);
    }
}
function formatarMoeda(valor) {
    return valor?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }) || 'R$ 0,00';
}
function renderizarTabela(lista) {
    
    const tbody = document.querySelector('#tabelaDevolucoes tbody');
    tbody.innerHTML = '';
    
    lista.forEach(dev => {
        const tr = document.createElement('tr');

        const totalItens = dev.produtos.reduce((acc, p) => acc + p.total, 0);

        const status = (dev.status || '').toLowerCase();
        const isPendente = status === 'pendente';
        const isReprovado = status === 'reprovado';

        let finalizado = dev.finalizado === 1;

        // regras de negócio
        if (isPendente) {
            finalizado = false;
        }

        if (isReprovado) {
            finalizado = true;
}
        

tr.innerHTML = `
    <td>${dev.pedidoId}</td>
    <td><font size="-5">${dev.razaosocial}</font></td>
    <td>${dev.status}</td>
    <td>${formatarCNPJ(dev.cnpj)}</td>
    <td>${dev.representante}</td>
    <td>${dev.data}</td>
    <td>${formatarMoeda(totalItens)}</td>
    <td>
    <center>
        <button onclick="verDetalhes('${dev._id}')">Ver</button>
    </center>
    </td>
    <td>
        <input type="radio" name="status-${dev._id}" value="Pendente"
        ${status === 'pendente' ? 'checked' : ''}
        onchange="controlarFinalizado('${dev._id}', this)">
        Pendente<br>
        <input type="radio" name="status-${dev._id}" value="Aprovado" ${status === 'aprovado' ? 'checked' : ''}> Aprovado<br>

        <input type="radio" name="status-${dev._id}" value="Reprovado" ${status === 'reprovado' ? 'checked' : ''}> Reprovado
    </td>
    <td><center>
    <input type="checkbox" 
    ${finalizado ? 'checked' : ''} 
    ${(isPendente || isReprovado) ? 'disabled' : ''}>
    <input type="number" name="nfVinculada" placeholder="nota vinculada" size="5" value="${dev.nfVinculada}" ${(isPendente || isReprovado) ? 'disabled' : ''}>
    </center></td>
    <td>
        <button onclick="salvar('${dev._id}', this)">Salvar</button>
    </td>
`;

        tbody.appendChild(tr);
    });
}

document.getElementById('filtroCliente').addEventListener('input', aplicarFiltros);
document.getElementById('filtroRepresentante').addEventListener('input', aplicarFiltros);
document.getElementById('filtroDevolucao').addEventListener('input', aplicarFiltros);
document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
document.getElementById('filtroFinalizado').addEventListener('change', aplicarFiltros);
document.getElementById('filtroNfVinculada').addEventListener('input', aplicarFiltros);

// helpers
function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR');
}

function controlarFinalizado(id, radio) {
    const tr = radio.closest('tr');
    const checkbox = tr.querySelector('input[type="checkbox"]');

    const valor = radio.value.toLowerCase();

    if (valor === 'pendente') {
        checkbox.checked = false;
        checkbox.disabled = true;
    } 
    else if (valor === 'reprovado') {
        checkbox.checked = true;
        checkbox.disabled = true;
    } 
    else {
        checkbox.disabled = false;
    }
}

function aplicarFiltros() {
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const representante = document.getElementById('filtroRepresentante').value.toLowerCase();
    const devolucao = document.getElementById('filtroDevolucao').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const finalizado = document.getElementById('filtroFinalizado').value;
    const nfVinculada = document.getElementById('filtroNfVinculada').value;

    const filtrados = listaOriginal.filter(dev => {

        const matchCliente =
            dev.razaosocial?.toLowerCase().includes(cliente) ||
            dev.cnpj?.includes(cliente);

        const matchRepresentante =
            !representante || dev.representante?.toLowerCase().includes(representante);

        const matchDevolucao =
            !devolucao || dev.pedidoId?.toString().includes(devolucao);

        const matchStatus =
            !status || dev.status === status;

        const matchFinalizado =
            !finalizado ||
            (finalizado === "1" && dev.finalizado === 1) ||
            (finalizado === "0" && dev.finalizado !== 1);

        const matchNfVinculada = 
            !nfVinculada || dev.nfVinculada?.includes(nfVinculada);


        return matchCliente && matchRepresentante && matchDevolucao && matchStatus && matchFinalizado && matchNfVinculada;
    });

    renderizarTabela(filtrados);
}
function salvar(id, btn) {
    const tr = btn.closest('tr');

    const statusSelecionado = tr.querySelector(`input[name="status-${id}"]:checked`)?.value;

    const finalizado = tr.querySelector('input[type="checkbox"]').checked;

    const nfVinculada = tr.querySelector('input[type="number"]')?.value;

    console.log({ id, statusSelecionado, finalizado, nfVinculada });

    if (!statusSelecionado) {
        alert("Selecione um status!");
        return;
    }
    //envia pro backend
    fetch(`/devolucao/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: statusSelecionado.toLowerCase(),
            finalizado,
            nfVinculada
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Salvo com sucesso!");
        carregarDevolucoes(); // recarrega tabela
    })
    .catch(err => {
        console.error(err);
        alert("Erro ao salvar");
    });
}

// 🔎 botão detalhes
function verDetalhes(id) {
    window.location.href = `/devolucaoDetalhe.html?id=${id}`;
}

carregarDevolucoes();