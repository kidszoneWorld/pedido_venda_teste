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
    const rebaixa = document.getElementById('filtroRebaixa').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const finalizado = document.getElementById('filtroFinalizado').value;
    const nfVinculada = document.getElementById('filtroNfVinculada').value;

    const filtrados = listaOriginal.filter(reb => {

        const matchCliente =
            reb.razaosocial?.toLowerCase().includes(cliente) ||
            reb.cnpj?.includes(cliente);

        const matchRepresentante =
            !representante || extrairNumeroDoRepresentante(reb.representante) === representante;

        const matchNfOrigem =
            !nfOrigem ||
            reb.produtos?.some(p =>
                p.nforigem?.toLowerCase().includes(nfOrigem)
            );

        const matchRebaixa =
            !rebaixa || reb.pedidoId?.toString().includes(rebaixa);

        const matchStatus =
            !status || reb.status === status;

        const matchFinalizado =
            !finalizado ||
            (finalizado === "1" && reb.finalizado === 1) ||
            (finalizado === "0" && reb.finalizado !== 1);

        const matchNfVinculada = 
            !nfVinculada || reb.nfVinculada?.includes(nfVinculada);

        return matchCliente && matchRepresentante && matchRebaixa && matchStatus && matchFinalizado && matchNfVinculada && matchNfOrigem;
    });

    // transforma dados para excel
    const dadosExcel = filtrados.map(reb => {
        const totalItens = reb.produtos.reduce((acc, p) => acc + p.total, 0);

        return {
            Pedido: reb.pedidoId,
            Cliente: reb.razaosocial,
            CNPJ: formatarCNPJ(reb.cnpj),
            Representante: reb.representante,
            Data: formatarData(reb.data),
            Status: reb.status,
            Finalizado: reb.finalizado ? 'Sim' : 'Não',
            "NF Vinculada": reb.nfVinculada || '',
            Total: totalItens
        };
    });

    // cria planilha
    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Rebaixas");

    // download
    XLSX.writeFile(wb, "rebaixas.xlsx");
}


async function carregarRebaixas() {
    try {

        const res = await fetch('/api/rebaixas');

        console.log("STATUS:", res);

        const text = await res.text();
        console.log("RESPOSTA BRUTA: deu bom");

        const json = JSON.parse(text);
         setTimeout(() => {
  console.log("This runs after 0.5 seconds.");

        if (!json.success || !Array.isArray(json.data)) {
            throw new Error("Resposta inválida da API");
        }

        listaOriginal = json.data;
        aplicarFiltros();
}, 500);
    } catch (err) {
        console.error("Erro ao carregar rebaixas:", err);
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

    const tbody = document.querySelector('#tabelaRebaixas tbody');
    tbody.innerHTML = '';
    
    lista.forEach(reb => {
        const tr = document.createElement('tr');

        const status = (reb.status || '').toLowerCase();

        let finalizado = reb.finalizado === 1;
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

        const totalItens = reb.produtos.reduce((acc, p) => acc + p.total, 0);

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
    <td>${reb.pedidoId}</td>
    <td><font size="-5">${reb.razaosocial}</font></td>
    <td>${reb.status}</td>
    <td>${formatarCNPJ(reb.cnpj)}</td>
    <td>${reb.representante}</td>
    <td>${reb.data}</td>
    <td>${formatarMoeda(totalItens)}</td>
    <td>
    <center>
        <button target="_blank" onclick="verDetalhes('${reb._id}')">Ver</button>
    </center>
    </td>
    <td>
        <input type="radio" name="status-${reb._id}" value="Pendente"
        ${status === 'pendente' ? 'checked' : '' }
        onchange="controlarFinalizado('${reb._id}', this)" ${isRep ? 'disabled' : ''}>
        Pendente<br>
        <input type="radio" name="status-${reb._id}" value="Aprovado" ${status === 'aprovado' ? 'checked' : ''} ${isRep ? 'disabled' : ''}> Aprovado<br>

        <input type="radio" name="status-${reb._id}" value="Reprovado" ${status === 'reprovado' ? 'checked' : ''} ${isRep ? 'disabled' : ''}> Reprovado
    </td>
    <td><center>
    <input type="checkbox" 
    ${finalizado ? 'checked' : ''} 
    ${(isPendente || isReprovado) ? 'disabled' : ''} ${isRep ? 'disabled' : ''}>
    <input type="number" name="nfVinculada" placeholder="inserir nota vinculada" size="5" value="${reb.nfVinculada}" ${(isPendente || isReprovado) ? 'disabled' : ''} ${isRep ? 'disabled' : ''}>
    </center></td>
    <td>
        <button onclick="salvar('${reb._id}', this)" ${isRep ? 'disabled' : ''}>Salvar</button>
    </td>
`;

        tbody.appendChild(tr);
    });
}

document.getElementById('filtroRebaixa').addEventListener('input', aplicarFiltros);
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
    const rebaixa = document.getElementById('filtroRebaixa').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const finalizado = document.getElementById('filtroFinalizado').value;
    const nfVinculada = document.getElementById('filtroNfVinculada').value;

    const filtrados = listaOriginal.filter(reb => {

        const matchCliente =
            reb.razaosocial?.toLowerCase().includes(cliente) ||
            Rebaixa.cnpj?.includes(cliente);

        const matchRepresentante =
            !representante || extrairNumeroDoRepresentante(reb.representante) === representante;

        const matchNfOrigem =
            !nfOrigem ||
            reb.produtos?.some(p =>
                p.nforigem?.toLowerCase().includes(nfOrigem)
            );

        const matchRebaixa =
            !rebaixa || reb.pedidoId?.toString().includes(rebaixa);

        const matchStatus =
            !status || reb.status === status;

        const matchFinalizado =
            !finalizado ||
            (finalizado === "1" && reb.finalizado === 1) ||
            (finalizado === "0" && reb.finalizado !== 1);

        const matchNfVinculada = 
            !nfVinculada || reb.nfVinculada?.includes(nfVinculada);


        return matchCliente && matchRepresentante && matchRebaixa && matchStatus && matchFinalizado && matchNfVinculada && matchNfOrigem;
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
    fetch(`/rebaixa/${id}`, {
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
        carregarRebaixas(); // recarrega tabela
    })
    .catch(err => {
        console.error(err);
        alert("Erro ao salvar");
    });
}

// 🔎 botão detalhes
function verDetalhes(id) {
    window.open( `/rebaixaDetalhe.html?id=${id}`, '_blank');
}

carregarRebaixas();