let ordersData1 = [];
let filteredData1 = [];

// Mostrar Feedback
function showFeedback(message) {
    const feedback = document.getElementById('feedback1');
    feedback.style.display = 'block';
    feedback.textContent = message;


}

// Ocultar Feedback
function hideFeedback() {
    const feedback = document.getElementById('feedback1');
    feedback.style.display = 'none';
    feedback.textContent = '';
}

// Função para formatar a data atual no formato YYYY-MM-DD
function getCurrentDateFormatted() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // +1 porque os meses começam em 0
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Função para exportar os dados para Excel
function exportToExcel(data) {
    const addOneDay = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        return date.toLocaleDateString('pt-BR');
    };

    const exportData = data.map(order => ({
        "Data da emissão": addOneDay(order.EMISSÃO),
        "Núm notas": order.NF || "",
        "Cód Cliente": order.codCliente || "",
        "Cliente": order.NOME || "",
        "Cliente CNPJ": order.CNPJ?.replace(/[\.\-\/]/g, '') || "",
        "UF": order.UF || "",
        "Cód Rep": order.Rep || "",
        "Cod Trans": order.CodTransporte || "",
        "Transportadora": order.TRANSPORTES || "",
        "Saída": addOneDay(order.SAÍDA),
        "Previsão de Entrega": addOneDay(order.PrevisaoEntrega),
        "Data de Entrega": order.ENTREGUE ? addOneDay(order.ENTREGUE) : "",
        "Status Entrega": order.STATUS_ENTREGA || "",
        "Agenda": order.AGENDA || "",
        "Ocorrência": order.OCORRÊNCIA || ""
    }));

    // Criar uma nova planilha e worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    // Ajustar a largura das colunas (opcional)
    worksheet['!cols'] = [
        { wch: 15 }, // Data da emissão
        { wch: 10 }, // Núm notas
        { wch: 12 }, // Cód Cliente
        { wch: 30 }, // Cliente
        { wch: 20 }, // Cliente CNPJ
        { wch: 5 },  // UF
        { wch: 10 }, // Cód Rep
        { wch: 10 }, // Cod Trans
        { wch: 30 }, // Transportadora
        { wch: 15 }, // Saída
        { wch: 20 }, // Previsão de Entrega
        { wch: 15 }, // Data de Entrega
        { wch: 15 }, // Status Entrega
        { wch: 15 }, // Agenda
        { wch: 20 }  // Ocorrência
    ];

    // Definir o nome do arquivo com a data atual
    const currentDate = getCurrentDateFormatted();
    const fileName = `Entregas Norte_Nordeste_Centro_Oeste_${currentDate}.xlsx`;

    // Exportar o arquivo
    XLSX.writeFile(workbook, fileName);
}

// Carregar detalhes dos pedidos
async function loadOrderDetailsFromSharePoint() {
    showFeedback("Carregando dados, aguarde...");

    try {
        const response = await fetch('/api/logistica/logistica03');
        if (!response.ok) throw new Error("Erro ao buscar dados do SharePoint");
        ordersData1 = await response.json();
        filteredData1 = [...ordersData1]; // Inicialmente, os dados filtrados são os mesmos que os originais

        renderTable(ordersData1);
        hideFeedback();
    } catch (error) {
        console.error("Erro ao carregar dados do SharePoint:", error);
        showFeedback("Erro ao carregar dados do SharePoint. Recarregue a página.");
    }
}

// Renderizar tabela
function renderTable(data) {
    const orderTableBody1 = document.querySelector('#order-table1 tbody');
    orderTableBody1.innerHTML = ''; // Limpar tabela
    data.forEach(order => {
        const row = document.createElement('tr');

        // Função auxiliar para adicionar 1 dia à data
        const addOneDay = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            date.setDate(date.getDate() + 1); // Adiciona 1 dia
            return date.toLocaleDateString('pt-BR');
        };

        row.innerHTML = `
            <td class="dataEmissao">${addOneDay(order.EMISSÃO)}</td>
            <td class="numNotas">${order.NF || ''}</td>
            <td class="codCliente">${order.codCliente || ''}</td>
            <td class="cliente">${order.NOME || ''}</td>
            <td class="clienteCNPJ">${order.CNPJ?.replace(/[\.\-\/]/g, '') || ''}</td>
            <td class="uf">${order.UF || ''}</td>
            <td class="codRep">${order.Rep || ''}</td>
            <td class="codTrans">${order.CodTransporte || ''}</td>
            <td class="transportadora">${order.TRANSPORTES || ''}</td>
            <td class="saida">${addOneDay(order.SAÍDA)}</td>
            <td class="previsaoEntrega">${addOneDay(order.PrevisaoEntrega)}</td>
            <td class="dataEntrega">${addOneDay(order.ENTREGUE)}</td>
            <td class="statusEntrega">${order.STATUS_ENTREGA || ''}</td>
            <td class="agenda">${order.AGENDA || ''}</td>
            <td class="ocorrencia">${order.OCORRÊNCIA || ''}</td>
        `;
        orderTableBody1.appendChild(row);
    });
}

// Configurar eventos do modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('downloadModal');
    const downloadXMLButton = document.getElementById('downloadXML');
    const downloadDANFEButton = document.getElementById('downloadDANFE');
    const closeModalButton = document.getElementById('closeModal');

    // Baixar XML
    downloadXMLButton.addEventListener('click', async () => {
        if (selectedOrder && selectedOrder.NF) {
            showFeedback("Aguarde, estamos gerando o arquivo XML...");
            try {
                // Faz a requisição para baixar o XML
                window.location.href = `/download-xml?nf=${selectedOrder.NF}`;
                // Aumenta o tempo de espera para garantir que o download comece
                setTimeout(() => {
                    hideFeedback();
                }, 15000); // 3 segundos, ajuste conforme necessário
            } catch (error) {
                console.error('Erro ao iniciar o download do XML:', error);
                showFeedback("Erro ao gerar o arquivo XML. Tente novamente.");
            }
        }
        modal.style.display = 'none';
    });

    // Baixar DANFE
    downloadDANFEButton.addEventListener('click', async () => {
        if (selectedOrder && selectedOrder.NF) {
            showFeedback("Aguarde, estamos gerando o arquivo DANFE...");
            try {
                // Faz a requisição para baixar o DANFE
                window.location.href = `/download-danfe?nf=${selectedOrder.NF}`;
                // Aumenta o tempo de espera para o DANFE, que pode ser mais demorado
                setTimeout(() => {
                    hideFeedback();
                }, 15000); // 5 segundos, ajuste conforme necessário
            } catch (error) {
                console.error('Erro ao iniciar o download do DANFE:', error);
                showFeedback("Erro ao gerar o arquivo DANFE. Tente novamente.");
            }
        }
        modal.style.display = 'none';
    });

    // Fechar o modal
    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
        hideFeedback(); // Oculta a mensagem ao fechar o modal manualmente
    });

    // Fechar o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            hideFeedback(); // Oculta a mensagem ao fechar o modal manualmente
        }
    });
});

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/session-data');
        if (!response.ok) throw new Error('Erro ao buscar dados da sessão');

        const sessionData = await response.json();

        if (sessionData.isAuthenticated) {
            window.sessionData = sessionData;

            const userNumero = window.sessionData?.userNumero || null;
            const representanteFilter = document.getElementById('representanteFilter1');

            if (userNumero) {
                representanteFilter.value = userNumero;
                representanteFilter.disabled = true; // Bloqueia o campo
            }

            loadOrderDetailsFromSharePoint();
        } else {
            console.warn('Usuário não autenticado');
            window.location.href = '/login2'; // Redireciona para a página de login
        }
    } catch (error) {
        console.error('Erro ao carregar os dados da sessão:', error);
    }
});

// Aplicar Filtros
async function applyFilters1() {
    showFeedback("Aplicando filtros, aguarde...");

    try {
        const representanteFilter1 = document.getElementById('representanteFilter1').value.trim();
        const clienteCNPJFilter1 = document.getElementById('clienteCNPJFilter1').value.trim();
        const notaFilter1 = document.getElementById('notaFilter1').value.trim();
        const dataPedidoInicioFilter1 = document.getElementById('dataPedidoInicioFilter1').value;
        const dataPedidoFimFilter1 = document.getElementById('dataPedidoFimFilter1').value;
        const statusFilter1 = document.getElementById('statusFilter1').value;

        // Filtrando os dados
        filteredData1 = ordersData1.filter(order => {
            const matchRepresentante1 = !representanteFilter1 || order.Rep?.toString() === representanteFilter1;
            const matchClienteCNPJ1 = !clienteCNPJFilter1 || order.CNPJ?.replace(/[\.\-\/]/g, '') === clienteCNPJFilter1.replace(/[\.\-\/]/g, '');
            const matchNota1 = !notaFilter1 || order.NF?.toString() === notaFilter1;
            const matchDataPedidoInicio1 = !dataPedidoInicioFilter1 || new Date(order.EMISSÃO) >= new Date(dataPedidoInicioFilter1);
            const matchDataPedidoFim1 = !dataPedidoFimFilter1 || new Date(order.EMISSÃO) <= new Date(dataPedidoFimFilter1);

            // Ajuste no filtro de status
            let matchStatus1 = true;
            if (statusFilter1 && statusFilter1 !== "2") {
                const statusEntrega = order.STATUS_ENTREGA?.toLowerCase().trim();
                matchStatus1 = statusEntrega === (statusFilter1 === "1" ? "entregue" : "pendente");
            }

            return matchRepresentante1 && matchClienteCNPJ1 && matchNota1 && matchDataPedidoInicio1 && matchDataPedidoFim1 && matchStatus1;
        });

        if (filteredData1.length === 0) {
            showFeedback("Nenhum dado encontrado com os filtros aplicados.");
        } else {
            hideFeedback();
        }

        renderTable(filteredData1);
    } catch (error) {
        console.error('Erro ao aplicar filtros:', error);
        showFeedback("Erro ao aplicar os filtros. Tente novamente.");
    }
}

// Limpar Filtros
function clearFilters1() {
    document.getElementById('representanteFilter1').value = '';
    document.getElementById('clienteCNPJFilter1').value = '';
    document.getElementById('dataPedidoInicioFilter1').value = '';
    document.getElementById('dataPedidoFimFilter1').value = '';
    document.getElementById('notaFilter1').value = '';
    document.getElementById('statusFilter1').value = "2";
    filteredData1 = [...ordersData1]; // Redefine os dados filtrados para os dados originais
    renderTable(ordersData1);
    hideFeedback();
}

// Verificar se os filtros estão aplicados
function areFiltersApplied() {
    const representanteFilter1 = document.getElementById('representanteFilter1').value.trim();
    const clienteCNPJFilter1 = document.getElementById('clienteCNPJFilter1').value.trim();
    const notaFilter1 = document.getElementById('notaFilter1').value.trim();
    const dataPedidoInicioFilter1 = document.getElementById('dataPedidoInicioFilter1').value;
    const dataPedidoFimFilter1 = document.getElementById('dataPedidoFimFilter1').value;
    const statusFilter1 = document.getElementById('statusFilter1').value;

    return (
        representanteFilter1 !== '' ||
        clienteCNPJFilter1 !== '' ||
        notaFilter1 !== '' ||
        dataPedidoInicioFilter1 !== '' ||
        dataPedidoFimFilter1 !== '' ||
        statusFilter1 !== '2'
    );
}

// Exportar para Excel (com ou sem filtros)
document.getElementById('exportExcel1').addEventListener('click', () => {
    if (ordersData1.length === 0) {
        showFeedback("Nenhum dado disponível para exportar. Carregue os dados primeiro.");
        return;
    }

    // Verifica se os filtros estão aplicados
    const dataToExport = areFiltersApplied() ? filteredData1 : ordersData1;

    if (dataToExport.length === 0) {
        showFeedback("Nenhum dado para exportar com os filtros aplicados.");
        return;
    }

    exportToExcel(dataToExport);
});

// Eventos dos botões de filtro
document.getElementById('applyFilters1').addEventListener('click', applyFilters1);
document.getElementById('clearFilters1').addEventListener('click', clearFilters1);

// Função para limpar dados do usuário e redirecionar para a página de login
document.getElementById('logoutButton1').addEventListener('click', async () => {
    sessionStorage.clear();
    localStorage.clear();

    await fetch('/logout', { method: 'POST' });

    document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
    });

    window.location.href = '/login2';
});

// Função para alternar a visibilidade dos filtros
document.getElementById('menuToggle').addEventListener('click', () => {
    const filterContainer = document.getElementById('filterContainer');
    const menuButton = document.getElementById('menuToggle');
    const menuIcon = menuButton.querySelector('.menu-icon');

    // Alterna a classe 'active' para mostrar/esconder os filtros
    filterContainer.classList.toggle('active');

    // Muda o ícone e o texto do botão
    if (filterContainer.classList.contains('active')) {
        menuIcon.textContent = '✖'; // Ícone de fechar
        menuButton.innerHTML = `<span class="menu-icon">✖</span> Fechar Filtros`;
    } else {
        menuIcon.textContent = '☰'; // Ícone de menu
        menuButton.innerHTML = `<span class="menu-icon">☰</span> Filtros`;
    }
});