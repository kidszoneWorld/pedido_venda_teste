let listaOriginal = [];

document.addEventListener("DOMContentLoaded", () => {
    aplicarRestricaoRepresentante();
});

async function aplicarRestricaoRepresentante() {
    try {
        window.isRepresentante = true;
        
        // Faz a requisição para obter os dados da sessão
        const response = await fetch('/session-data');
        const sessionData = await response.json();

        // Define os dados no front-end
        if (sessionData.isAuthenticated) {
            window.sessionData = sessionData;

            const userNumero = window.sessionData?.userNumero || null;
            
            if (!userNumero) {
                window.isRepresentante = false;
                return;
            }
            const inputRep = document.getElementById('filtroRepresentante');

            // força valor
            inputRep.value = userNumero;
            
                inputRep.readOnly = true;
                inputRep.style.backgroundColor = '#e9ecef';
                inputRep.style.cursor = 'not-allowed';
            


        } else {
            console.warn('Usuário não autenticado');
            window.location.href = '/login2'; // Redireciona para a página de login
        }
    } catch (error) {
        console.error('Erro ao carregar os dados da sessão:', error);
    }
};


function exportarExcel() {
    // usa os dados já filtrados (IMPORTANTE)
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const representante = document.getElementById('filtroRepresentante').value.toLowerCase();
    const nfOrigem = document.getElementById('filtroNfOrigem').value;
    const devolucao = document.getElementById('filtroDevolucao').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const finalizado = document.getElementById('filtroFinalizado').value;
    const nfVinculada = document.getElementById('filtroNfVinculada').value;

    const filtrados = listaOriginal.filter(dev => {

        const matchCliente =
            dev.razaosocial?.toLowerCase().includes(cliente) ||
            dev.cnpj?.includes(cliente);

        const matchRepresentante =
            !representante || extrairNumeroDoRepresentante(dev.representante) === representante;

        const matchNfOrigem =
            !nfOrigem ||
            dev.produtos?.some(p =>
                p.nforigem?.toLowerCase().includes(nfOrigem)
            );

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

        return matchCliente && matchRepresentante && matchDevolucao && matchStatus && matchFinalizado && matchNfVinculada && matchNfOrigem;
    });

    // transforma dados para excel
    const dadosExcel = filtrados.map(dev => {
        const totalItens = dev.produtos.reduce((acc, p) => acc + p.total, 0);

        return {
            Pedido: dev.pedidoId,
            Cliente: dev.razaosocial,
            CNPJ: formatarCNPJ(dev.cnpj),
            Representante: dev.representante,
            Data: formatarData(dev.data),
            Status: dev.status,
            Finalizado: dev.finalizado ? 'Sim' : 'Não',
            "NF Vinculada": dev.nfVinculada || '',
            Total: totalItens
        };
    });

    // cria planilha
    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Devoluções");

    // download
    XLSX.writeFile(wb, "devolucoes.xlsx");
}


async function carregarDevolucoes() {
    try {
        const res = await fetch('/api/devolucoes');

        console.log("STATUS:", res.status);

        const text = await res.text();
        console.log("RESPOSTA BRUTA: deu bom");

        const json = JSON.parse(text);

        if (!json.success || !Array.isArray(json.data)) {
            throw new Error("Resposta inválida da API");
        }

        listaOriginal = json.data;
        aplicarFiltros();

    } catch (err) {
        console.error("Erro ao carregar devoluções:", err);
        listaOriginal = [];
    }
}

function extrairNumeroRep(email) {
    const match = email.match(/^rep(\d+)@/i);
    return match ? match[1] : null;
}
function formatarMoeda(valor) {
    return valor?.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }) || 'R$ 0,00';
}
function renderizarTabela(lista) {
    const isRep = window.isRepresentante;

    const tbody = document.querySelector('#tabelaDevolucoes tbody');
    tbody.innerHTML = '';
    
    lista.forEach(dev => {
        const tr = document.createElement('tr');

        const status = (dev.status || '').toLowerCase();

        let finalizado = dev.finalizado === 1;
        if (status === 'pendente') {
            tr.style.backgroundColor = '#fff3cd'; // amarelo claro
        }

        if (status === 'aprovado' && finalizado) {
            tr.style.backgroundColor = '#98ecad'; // verde escuro
        }

        if (status === 'aprovado' && !finalizado) {
            tr.style.backgroundColor = '#c0e9ca'; //  verde claro
        }

        if (status === 'reprovado') {
            tr.style.backgroundColor = '#f8d7da'; // vermelho claro
        }

        const totalItens = dev.produtos.reduce((acc, p) => acc + p.total, 0);

        const isPendente = status === 'pendente';
        const isReprovado = status === 'reprovado';


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
        <button target="_blank" onclick="verDetalhes('${dev._id}')">Ver</button>
    </center>
    </td>
    <td>
        <input type="radio" name="status-${dev._id}" value="Pendente"
        ${status === 'pendente' ? 'checked' : '' }
        onchange="controlarFinalizado('${dev._id}', this)" ${isRep ? 'disabled' : ''}>
        Pendente<br>
        <input type="radio" name="status-${dev._id}" value="Aprovado" ${status === 'aprovado' ? 'checked' : ''} ${isRep ? 'disabled' : ''}> Aprovado<br>

        <input type="radio" name="status-${dev._id}" value="Reprovado" ${status === 'reprovado' ? 'checked' : ''} ${isRep ? 'disabled' : ''}> Reprovado
    </td>
    <td><center>
    <input type="checkbox" 
    ${finalizado ? 'checked' : ''} 
    ${(isPendente || isReprovado) ? 'disabled' : ''} ${isRep ? 'disabled' : ''}>
    <input type="number" name="nfVinculada" placeholder="inserir nota vinculada" size="5" value="${dev.nfVinculada}" ${(isPendente || isReprovado) ? 'disabled' : ''} ${isRep ? 'disabled' : ''}>
    </center></td>
    <td>
        <button onclick="salvar('${dev._id}', this)" ${isRep ? 'disabled' : ''}>Salvar</button>
    </td>
`;

        tbody.appendChild(tr);
    });
}

document.getElementById('filtroDevolucao').addEventListener('input', aplicarFiltros);
document.getElementById('filtroCliente').addEventListener('input', aplicarFiltros);
document.getElementById('filtroRepresentante').addEventListener('input', aplicarFiltros);
document.getElementById('filtroNfOrigem').addEventListener('input', aplicarFiltros);
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

function extrairNumeroDoRepresentante(rep) {
    if (!rep) return null;

    // pega tudo antes do " - "
    return rep.split('-')[0].trim();
}

function aplicarFiltros() {
    const cliente = document.getElementById('filtroCliente').value.toLowerCase();
    const representante = document.getElementById('filtroRepresentante').value.toLowerCase();
    const nfOrigem = document.getElementById('filtroNfOrigem').value;
    const devolucao = document.getElementById('filtroDevolucao').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const finalizado = document.getElementById('filtroFinalizado').value;
    const nfVinculada = document.getElementById('filtroNfVinculada').value;

    const filtrados = listaOriginal.filter(dev => {

        const matchCliente =
            dev.razaosocial?.toLowerCase().includes(cliente) ||
            dev.cnpj?.includes(cliente);

        const matchRepresentante =
            !representante || extrairNumeroDoRepresentante(dev.representante) === representante;

        const matchNfOrigem =
            !nfOrigem ||
            dev.produtos?.some(p =>
                p.nforigem?.toLowerCase().includes(nfOrigem)
            );

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


        return matchCliente && matchRepresentante && matchDevolucao && matchStatus && matchFinalizado && matchNfVinculada && matchNfOrigem;
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
    window.open( `/devolucaoDetalhe.html?id=${id}`, '_blank');
}

carregarDevolucoes();