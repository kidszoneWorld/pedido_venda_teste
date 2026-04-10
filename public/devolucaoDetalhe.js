const finalizado = "Não finalizado"

function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function carregarDetalhe() {
    const id = getIdFromUrl();

    if (!id) {
        alert('ID não informado');
        return;
    }

    try {
        const res = await fetch(`/api/devolucao/${id}`);
        const dev = await res.json();

        renderizarDados(dev);
        renderizarProdutos(dev.produtos);
        renderizarResumo(dev.produtos);

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar devolução');
    }
}

function calcularTotais(produtos) {
    let totalVolumes = 0;
    let totalValor = 0;

    produtos.forEach(p => {
        const qtd = parseFloat(p.quantidade) || 0;
        const total = parseFloat(p.total) || 0;

        totalVolumes += qtd;
        totalValor += total;
    });

    return {
        totalVolumes,
        totalValor
    };
}

function renderizarResumo(produtos) {
    const { totalVolumes, totalValor } = calcularTotais(produtos);

    const container = document.getElementById('resumoTotais');

    container.innerHTML = `
        <div><b>Total de Volumes:</b> ${totalVolumes}</div>
        <div><b>Total em R$:</b> ${formatarMoeda(totalValor)}</div>
    `;
}

function renderizarDados(dev) {
    const container = document.getElementById('dadosPedido');
    console.log(dev.finalizado, finalizado);
    const isFinalizado = dev.finalizado === 1;
    container.innerHTML = `
        <div><b>Devolução:</b> ${dev.pedidoId}</div>
        <div><b>Cliente:</b> ${dev.razaosocial}</div>
        <div><b>CNPJ:</b> ${formatarCNPJ(dev.cnpj)}</div>
        <div><b>Endereço:</b> ${dev.endereco}</div>
        <div><b>Cidade:</b> ${dev.cidade}</div>
        <div><b>UF:</b> ${dev.uf}</div>
        <div><b>CEP:</b> ${dev.Cep}</div>
        <div><b>Bairro:</b> ${dev.bairro}</div>
        <div><b>Telefone:</b> ${dev.telefone}</div>
        <div><b>Email:</b> ${dev.email}</div>
        <div><b>Email Fiscal:</b> ${dev.emailFiscal}</div>
        <div><b>Representante:</b> ${dev.representante}</div>
        <div><b>Status:</b> ${dev.status}</div>
        <div><b>Finalizado:</b> ${isFinalizado ? 'Finalizado' : 'Não FInalizado'}</div>
        <div><b>Motivo:</b> ${dev.motivo}</div>
    `;
}

function renderizarProdutos(produtos) {
    const tbody = document.getElementById('tabelaProdutos');
    tbody.innerHTML = '';
    produtos.forEach(p => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${p.nforigem}</td>
            <td>${formatarData(p.data)}</td>
            <td>${p.codigoItem}</td>
            <td>${p.lote}</td>
            <td>${p.quantidade}</td>
            <td>${p.uv}</td>
            <td>${p.descricao}</td>
            <td>${formatarMoeda(p.precounitario)}</td>
            <td>${formatarMoeda(p.total)}</td>
        `;

        tbody.appendChild(tr);
    });
}

// helpers
function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    return isNaN(d) ? '-' : d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
    return valor?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }) || 'R$ 0,00';
}

function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

carregarDetalhe();