async function carregarDevolucoes() {
    try {
        const res = await fetch('/api/devolucao');
        const dados = await res.json();

        renderizarTabela(dados);
    } catch (err) {
        console.error('Erro ao carregar devoluções', err);
    }
}

function renderizarTabela(lista) {
    const tbody = document.querySelector('#tabelaDevolucoes tbody');
    tbody.innerHTML = '';

    lista.forEach(dev => {
        const tr = document.createElement('tr');

        const totalItens = dev.produtos.reduce((acc, p) => acc + p.quantidade, 0);

        tr.innerHTML = `
            <td>${dev.pedidoId}</td>
            <td>${dev.razaosocial}</td>
            <td>${formatarCNPJ(dev.cnpj)}</td>
            <td>${dev.cidade}</td>
            <td>${dev.data}</td>
            <td>${totalItens}</td>
            <td>
                <button onclick="verDetalhes('${dev._id}')">Ver</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// 🔍 filtro simples
document.getElementById('filtro').addEventListener('input', function () {
    const texto = this.value.toLowerCase();

    const linhas = document.querySelectorAll('#tabelaDevolucoes tbody tr');

    linhas.forEach(tr => {
        const cliente = tr.children[1].textContent.toLowerCase();
        const cnpj = tr.children[2].textContent.toLowerCase();

        tr.style.display = (cliente.includes(texto) || cnpj.includes(texto))
            ? ''
            : 'none';
    });
});

// helpers
function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR');
}

// 🔎 botão detalhes
function verDetalhes(id) {
    window.location.href = `/devolucaoDetalhe.html?id=${id}`;
}

carregarDevolucoes();