

function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

let devolucaoAtual = null; // 👈 GLOBAL

async function carregarDetalhe() {
    const id = getIdFromUrl();

    if (!id) {
        alert('ID não informado');
        return;
    }

    try {
        const res = await fetch(`/api/devolucao/${id}`);
        const dev = await res.json();

        devolucaoAtual = dev; 

        renderizarDados(dev);
        renderizarProdutos(dev.produtos);
        renderizarResumo(dev.produtos);

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar devolução');
    }
}

function exportarDetalheExcel() {
    if (!devolucaoAtual) {
        alert("Dados ainda não carregados!");
        return;
    }

    const dev = devolucaoAtual;

    let csv = [];

    // ===== DADOS GERAIS =====
    csv.push(["DEVOLUÇÃO"]);
    csv.push(["Devolução", dev.id]);
    csv.push(["Cliente", dev.razaoSocial]);
    csv.push(["CNPJ", formatarCNPJ(dev.cnpj)]);
    csv.push(["Cidade", dev.cidade]);
    csv.push(["UF", dev.uf]);
    csv.push(["Representante", dev.representante]);
    csv.push(["Status", dev.status]);
    csv.push(["Finalizado", dev.finalizado === 1 ? "Sim" : "Não"]);
    csv.push(["NF Vinculada", dev.nfVinculada]);
    csv.push([]); // linha em branco

    // ===== PRODUTOS =====
    csv.push([
        "NF Origem",
        "ProdData",
        "Código",
        "Lote",
        "Quantidade",
        "UV",
        "Descrição",
        "Preço Unitário com IPI",
        "Total"
    ]);

    dev.produtos.forEach(p => {
        csv.push([
            p.nfOrigem,
            p.data,
            p.codigoItem,
            p.lote,
            p.quantidade,
            p.uv,
            p.descricao,
            p.precoUnitario,
            p.total
        ]);
    });

    // ===== TOTAIS =====
    const { totalVolumes, totalValor } = calcularTotais(dev.produtos);

    csv.push([]);
    csv.push(["Totais"]);
    csv.push(["Total Volumes", totalVolumes]);
    csv.push(["Total R$", totalValor]);

    // ===== CONVERTE CSV =====
    const conteudo = csv.map(linha => linha.join(";")).join("\n");

    const BOM = "\uFEFF"; // 👈 ESSENCIAL

    const blob = new Blob([BOM + conteudo], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `devolucao_${dev.id}.csv`;

    link.click();
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
    const isFinalizado = dev.finalizado === 1;
    container.innerHTML = `
        <div><b>Devolução:</b> ${dev.id}</div>
        <div><b>Cliente:</b> ${dev.razaoSocial}</div>
        <div><b>CNPJ:</b> ${formatarCNPJ(dev.cnpj)}</div>
        <div><b>Endereço:</b> ${dev.endereco}</div>
        <div><b>Cidade:</b> ${dev.cidade}</div>
        <div><b>UF:</b> ${dev.uf}</div>
        <div><b>CEP:</b> ${dev.cep}</div>
        <div><b>Bairro:</b> ${dev.bairro}</div>
        <div><b>Telefone:</b> ${dev.telefone}</div>
        <div><b>Email:</b> ${dev.email}</div>
        <div><b>Email Fiscal:</b> ${dev.emailFiscal}</div>
        <div><b>Representante:</b> ${dev.representante}</div>
        <div><b>Status:</b> ${dev.status}</div>
        <div><b>Finalizado:</b> ${isFinalizado ? 'Finalizado' : 'Não FInalizado'}</div>
        <div><b>nfVinculada:</b> ${dev.nfVinculada}</div>
        <div><b>Motivo:</b> <textarea rows="4" cols="50" disabled>${dev.motivo}</textarea></div>
    `;
}

function renderizarProdutos(produtos) {
    const tbody = document.getElementById('tabelaProdutos');
    tbody.innerHTML = '';
    produtos.forEach(p => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${p.nfOrigem}</td>
            <td>${formatarProdData(p.ProdData)}</td>
            <td>${p.codigoItem}</td>
            <td>${p.lote}</td>
            <td>${p.quantidade}</td>
            <td>${p.uv}</td>
            <td>${p.descricao}</td>
            <td>R$${formatarMoeda(p.precoUnitario)}</td>
            <td>R$${formatarMoeda(p.total)}</td>
        `;

        tbody.appendChild(tr);
    });
        // console.log(produtos)
}

// helpers
function formatarProdData(data) {
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