function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

let rebaixaAtual = null; // 👈 GLOBAL

async function carregarDetalhe() {
    const id = getIdFromUrl();

    if (!id) {
        alert('ID não informado');
        return;
    }

    try {
        const res = await fetch(`/api/rebaixa/${id}`);
        const reb = await res.json();

        rebaixaAtual = reb; // 👈 salva global

        renderizarDados(reb);
        renderizarProdutos(reb.produtos);
        renderizarResumo(reb.produtos);

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar rebaixa');
    }
}

function exportarDetalheExcel() {
    if (!rebaixaAtual) {
        alert("Dados ainda não carregados!");
        return;
    }

    const reb = rebaixaAtual;

    let csv = [];

    // ===== DADOS GERAIS =====
    csv.push(["REBAIXA"]);
    csv.push(["Pedido", reb.pedidoId]);
    csv.push(["Cliente", reb.razaosocial]);
    csv.push(["CNPJ", formatarCNPJ(reb.cnpj)]);
    csv.push(["Cidade", reb.cidade]);
    csv.push(["UF", reb.uf]);
    csv.push(["Representante", reb.representante]);
    csv.push(["Status", reb.status]);
    csv.push(["Finalizado", reb.finalizado === 1 ? "Sim" : "Não"]);
    csv.push(["NF Vinculada", reb.nfVinculada]);
    csv.push([]); // linha em branco

    // ===== PRODUTOS =====
    csv.push([
        "NF Origem",
        "CodigoItem",
        "Descricao",
        "Lote",
        "Precounitario",
        "Rebaixa",
        "Atual",
        "Quantidade",
        "Total"
    ]);

    reb.produtos.forEach(p => {
        csv.push([
            p.nforigem,
            p.codigoItem,
            p.descricao,
            p.lote,
            p.precounitario,
            p.rebaixa,
            p.atual,
            p.quantidade,
            p.total
        ]);
    });

    // ===== TOTAIS =====
    const { totalVolumes, totalValor } = calcularTotais(reb.produtos);

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
    link.download = `rebaixa_${reb.pedidoId}.csv`;

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

function renderizarDados(reb) {
    const container = document.getElementById('dadosPedido');
    const isFinalizado = reb.finalizado === 1;
    container.innerHTML = `
        <div><b>Rebaixa:</b> ${reb.pedidoId}</div>
        <div><b>Cliente:</b> ${reb.razaosocial}</div>
        <div><b>CNPJ:</b> ${formatarCNPJ(reb.cnpj)}</div>
        <div><b>Endereço:</b> ${reb.endereco}</div>
        <div><b>Cidade:</b> ${reb.cidade}</div>
        <div><b>UF:</b> ${reb.uf}</div>
        <div><b>CEP:</b> ${reb.Cep}</div>
        <div><b>Bairro:</b> ${reb.bairro}</div>
        <div><b>Telefone:</b> ${reb.telefone}</div>
        <div><b>Email:</b> ${reb.email}</div>
        <div><b>Email Fiscal:</b> ${reb.emailFiscal}</div>
        <div><b>Representante:</b> ${reb.representante}</div>
        <div><b>Status:</b> ${reb.status}</div>
        <div><b>Finalizado:</b> ${isFinalizado ? 'Finalizado' : 'Não FInalizado'}</div>
        <div><b>nfVinculada:</b> ${reb.nfVinculada}</div>
        <div><b>Motivo:</b> <textarea rows="4" cols="50" disabled>${reb.motivo}</textarea></div>
    `;
}

function renderizarProdutos(produtos) {
    const tbody = document.getElementById('tabelaProdutos');
    tbody.innerHTML = '';
    produtos.forEach(p => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${p.nforigem}</td>
            <td>${p.codigoItem}</td>
            <td>${p.descricao}</td>
            <td>${p.lote}</td>
            <td>${formatarMoeda(p.precounitario)}</td>
            <td>${formatarMoeda(p.rebaixa)}</td>
            <td>${formatarMoeda(p.atual)}</td>  
            <td>${p.quantidade}</td>          
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