let ordersData = [];

let currentFilters = {
    representante: '',
    clienteCNPJ: '',
    ClienteCodigo: '',
    codigoPedido: '',
    numeroNota: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    statusSeparacao: ''
};

function formatarCNPJ(cnpj) {
  const numeros = String(cnpj ?? '').replace(/\D/g, '');

  if (numeros.length !== 14) {
    return cnpj ?? '';
  }

  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

// Função para formatar as datas no formato YYYY-MM-DD
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Retorna no formato YYYY-MM-DD
}


// Mostrar Feedback
function showFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'block';
    feedback.textContent = message;
}

// Ocultar Feedback
function hideFeedback() {
    const feedback = document.getElementById('feedback');
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

    const exportData = data.map(order => ({
        "Data do Pedido": order.dataPedido ? new Date(order.dataPedido).toLocaleDateString('pt-BR') : 'N/A',
        "Cód Pedido": order.codigo || "",
        "Status": mapStatus(order.status) || "",
        "Status Separação": mapStatusSeparacao(order.statusSeparacao) || "",
       "Nota Fiscal":
    obterNotasFiscaisPedido(
        order
    )
        .map(
            nota => nota.numero
        )
        .filter(
            Boolean
        )
        .join(
            ', '
        ) ||
    'Sem Nota',
        "Cliente": order.cliente.nomeAbreviado || "",
        "Cliente CNPJ": order.cliente.documento.numeroTexto?.replace(/[\.\-\/]/g, '') || "",
        "Cód Rep": order.representante?.codigo || "",
        "representante": order.representante?.nomeAbreviado || "",
        "valorTotal": order.detalhes?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "",
        "Transportadora": order.detalhes_transporte?.nomeAbreviado || "",

    }));

    // Criar uma nova planilha e worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    // Ajustar a largura das colunas (opcional)
    worksheet['!cols'] = [
        { wch: 15 }, // Data do Pedido
        { wch: 10 }, // Cód Pedido
        { wch: 12 }, // Status
        { wch: 30 }, // Status Separação
        { wch: 20 }, // Notas Fiscais
        { wch: 20 }, // Cód Cliente
        { wch: 5 },  // Cliente
        { wch: 10 }, // Cliente CNPJ
        { wch: 10 }, // Cód Rep
        { wch: 30 }, // Representante
        { wch: 15 }, // Valor Total
        { wch: 20 }, // Transportadora

    ];

    // Definir o nome do arquivo com a data atual
    const currentDate = getCurrentDateFormatted();
    const fileName = `Pedidos_Kids_Zone ${currentDate}.xlsx`;

    // Exportar o arquivo
    XLSX.writeFile(workbook, fileName);
}

function atualizarStatusPelaResposta(
    pedidos
) {
    const possuiBuscaDireta =
        Boolean(
            currentFilters.codigoPedido ||
            currentFilters.numeroNota
        );

    if (
        !possuiBuscaDireta ||
        !Array.isArray(
            pedidos
        ) ||
        pedidos.length !== 1
    ) {
        return;
    }

    const pedido =
        pedidos[0];

    const campoStatus =
        document.getElementById(
            'statusFilter'
        );

    const campoSeparacao =
        document.getElementById(
            'statusSeparacaoFilter'
        );

    const statusResposta =
        String(
            pedido.status ?? ''
        ).trim();

    const separacaoResposta =
        String(
            pedido.statusSeparacao ?? ''
        ).trim();

    if (
        campoStatus &&
        statusResposta !== ''
    ) {
        const possuiOpcaoStatus =
            Array.from(
                campoStatus.options
            ).some(opcao => {
                return (
                    opcao.value ===
                    statusResposta
                );
            });

        if (possuiOpcaoStatus) {
            campoStatus.value =
                statusResposta;

            currentFilters.status =
                statusResposta;
        } else {
            console.warn(
                'O status retornado não existe no filtro:',
                statusResposta
            );
        }
    }

    if (
        campoSeparacao &&
        separacaoResposta !== ''
    ) {
        const possuiOpcaoSeparacao =
            Array.from(
                campoSeparacao.options
            ).some(opcao => {
                return (
                    opcao.value ===
                    separacaoResposta
                );
            });

        if (possuiOpcaoSeparacao) {
            campoSeparacao.value =
                separacaoResposta;

            currentFilters.statusSeparacao =
                separacaoResposta;
        } else {
            console.warn(
                'O status de separação retornado não existe no filtro:',
                separacaoResposta
            );
        }
    }
}

// Carregar detalhes dos pedidos
async function loadOrderDetails(
    status = currentFilters.status
) {
    currentFilters.status =
        status;

    const buscaPorCodigoPedido =
        Boolean(
            currentFilters.codigoPedido
        );

    const statusConsulta =
        buscaPorCodigoPedido
            ? ''
            : currentFilters.status;

    const separacaoConsulta =
        buscaPorCodigoPedido
            ? ''
            : currentFilters.statusSeparacao;

    const dataInicioConsulta =
        buscaPorCodigoPedido
            ? ''
            : formatDate(
                currentFilters.dataInicio
            );

    const dataFimConsulta =
        buscaPorCodigoPedido
            ? ''
            : formatDate(
                currentFilters.dataFim
            );

    const queryParams =
        new URLSearchParams({
            status:
                statusConsulta || '',

            codRep:
                currentFilters.representante || '',

            clienteCNPJ:
                currentFilters.clienteCNPJ || '',

            ClienteCodigo:
                currentFilters.ClienteCodigo || '',

            codigoPedido:
                currentFilters.codigoPedido || '',

            numeroNota:
                currentFilters.numeroNota || '',

            DataPedidoInicio:
                dataInicioConsulta || '',

            DataPedidoFim:
                dataFimConsulta || '',

            statusSeparacao:
                separacaoConsulta || ''
        });

    showFeedback(
        currentFilters.numeroNota
            ? 'Procurando o pedido vinculado à nota fiscal. Isso pode levar alguns instantes...'
            : 'Carregando pedidos, aguarde...'
    );

    try {
        const response =
            await fetch(
                `/api/pedidos?${queryParams.toString()}`
            );

        // Mantenha o restante da função atual.

        if (response.status === 404) {
            ordersData =
                [];

            renderTable(
                []
            );

            showFeedback(
                'Nenhum dado encontrado com os filtros aplicados.'
            );

            return;
        }

        if (!response.ok) {
            let mensagem =
                `Erro ao obter pedidos: ${response.statusText}`;

            try {
                const erro =
                    await response.json();

                mensagem =
                    erro.mensagem ||
                    mensagem;
            } catch (error) {
                console.error(
                    'Não foi possível ler a mensagem da API:',
                    error
                );
            }

            throw new Error(
                mensagem
            );
        }

        const resultado =
            await response.json();

        if (
            !Array.isArray(resultado) ||
            resultado.length === 0
        ) {
            ordersData =
                [];

            renderTable(
                []
            );

            showFeedback(
                'Nenhum dado encontrado com os filtros aplicados.'
            );

            return;
        }

        ordersData =
            resultado;

        atualizarStatusPelaResposta(
            ordersData
        );

        renderTable(
            ordersData
        );

        hideFeedback();
    } catch (error) {
        console.error(
            'Erro ao carregar os detalhes dos pedidos:',
            error
        );

        ordersData =
            [];

        renderTable(
            []
        );

        showFeedback(
            error.message ||
            'Não foi possível carregar os pedidos.'
        );
    }
}

async function baixarPdfNotaFiscal(
    chaveAcesso,
    numeroNota,
    botao
) {
    const chaveNormalizada =
        String(
            chaveAcesso ?? ''
        ).replace(
            /\D/g,
            ''
        );

    const numeroNormalizado =
        String(
            numeroNota ?? ''
        ).replace(
            /\D/g,
            ''
        );

    if (chaveNormalizada.length !== 44) {
        console.error(
            'Chave de acesso inválida:',
            chaveNormalizada
        );

        alert(
            'A chave de acesso da nota fiscal é inválida.'
        );

        return;
    }

    const textoOriginal =
        botao?.textContent?.trim() ||
        numeroNormalizado ||
        'Nota Fiscal';

    try {
        if (botao) {
            botao.disabled =
                true;

            botao.textContent =
                'Baixando PDF...';
        }

        showFeedback(
            `Baixando PDF da nota fiscal ${numeroNormalizado}...`
        );

        const url =
            '/api/notas-fiscais/' +
            'chave-de-acesso/' +
            encodeURIComponent(
                chaveNormalizada
            ) +
            '/pdf';

        console.log(
            'Solicitando PDF ao backend:',
            {
                numeroNota:
                    numeroNormalizado,

                chaveAcesso:
                    chaveNormalizada,

                url:
                    url
            }
        );

        const response =
            await fetch(
                `${url}?t=${Date.now()}`,
                {
                    method:
                        'GET',

                    credentials:
                        'same-origin',

                    cache:
                        'no-store',

                    headers: {
                        Accept:
                            'application/pdf, application/json',

                        'Cache-Control':
                            'no-cache'
                    }
                }
            );

        if (!response.ok) {
            const contentType =
                response.headers.get(
                    'content-type'
                ) || '';

            let mensagem =
                `Erro HTTP ${response.status} ao baixar o PDF.`;

            if (
                contentType.includes(
                    'application/json'
                )
            ) {
                const resultado =
                    await response.json();

                mensagem =
                    resultado.mensagem ||
                    resultado.error ||
                    mensagem;
            } else {
                const texto =
                    await response.text();

                mensagem =
                    texto ||
                    mensagem;
            }

            throw new Error(
                mensagem
            );
        }

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if (
            !contentType.includes(
                'application/pdf'
            )
        ) {
            throw new Error(
                'O servidor não retornou um arquivo PDF.'
            );
        }

        const blob =
            await response.blob();

        if (
            !blob ||
            blob.size === 0
        ) {
            throw new Error(
                'O arquivo PDF retornado está vazio.'
            );
        }

        const contentDisposition =
            response.headers.get(
                'content-disposition'
            ) || '';

        const nomeEncontrado =
            contentDisposition.match(
                /filename="?([^";]+)"?/i
            );

        const nomeArquivo =
            nomeEncontrado?.[1] ||
            (
                numeroNormalizado
                    ? `NFe-${numeroNormalizado}.pdf`
                    : `${chaveNormalizada}.pdf`
            );

        const urlTemporaria =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                'a'
            );

        link.href =
            urlTemporaria;

        link.download =
            nomeArquivo;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        setTimeout(
            () => {
                URL.revokeObjectURL(
                    urlTemporaria
                );
            },
            1000
        );

        hideFeedback();
    } catch (error) {
        console.error(
            'Erro ao baixar PDF da nota fiscal:',
            error
        );

        showFeedback(
            error.message ||
            'Não foi possível baixar o PDF da nota fiscal.'
        );

        alert(
            error.message ||
            'Não foi possível baixar o PDF da nota fiscal.'
        );
    } finally {
        if (botao) {
            botao.disabled =
                false;

            botao.textContent =
                textoOriginal;
        }
    }
}

// Renderizar tabela
function renderTable(data) {
    const orderTableBody = document.querySelector('#order-table tbody');
    orderTableBody.innerHTML = ''; // Limpar tabela
    data.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="dataPedido">${order.dataPedido ? new Date(order.dataPedido).toLocaleDateString('pt-BR') : 'N/A'}</td>
            <td class="codPedido"><a href="detalhes?codPedido=${order.codigo}" target="_blank">${order.codigo}</a></td>
            <td class="statusPedido">${mapStatus(order.status)}</td>
            <td class="statusSeparacao">${mapStatusSeparacao(order.statusSeparacao)}</td>
            <td class="notaFiscal">${montarNotaFiscalHtml(order)}</td>
            <td class="codCliente">${order.cliente.codigo}</td>
            <td class="cliente">${order.cliente.nomeAbreviado}</td>
            <td class="clienteCNPJ">${formatarCNPJ(order.cliente.documento.numeroTexto)}</td>
            <td class="codRep">${order.representante?.codigo || 'Não informado'}</td>
            <td class="representante">${order.representante?.nomeAbreviado || 'Não informado'}</td>
            <td class="valorTotal">${order.detalhes?.valor?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</td>
            <td class="transportadora">${order.detalhes_transporte?.nomeAbreviado || 'Não informado'}</td>
        `;

        row
            .querySelectorAll(
                '.link-download-pdf'
            )
            .forEach(
                botao => {
                    botao.addEventListener(
                        'click',
                        async evento => {
                            const botaoClicado =
                                evento.currentTarget;

                            const chaveAcesso =
                                botaoClicado
                                    .dataset
                                    .chaveAcesso;

                            const numeroNota =
                                botaoClicado
                                    .dataset
                                    .numeroNota;

                            console.log(
                                'Clique no download do PDF:',
                                {
                                    numeroNota:
                                        numeroNota,

                                    chaveAcesso:
                                        chaveAcesso
                                }
                            );

                            await baixarPdfNotaFiscal(
                                chaveAcesso,
                                numeroNota,
                                botaoClicado
                            );
                        }
                    );
                }
            );

        orderTableBody.appendChild(row);
    });
}

// Mapear Status de Separação
function mapStatusSeparacao(status) {
    switch (status) {
        case 0: return 'Não Separado';
        case 1: return 'Separado Parcial';
        case 2: return 'Separado Total';
        default: return 'Desconhecido';
    }
}


// Mapear Status de Separação
function mapStatus(status) {
    switch (status) {
        case 6: return 'Pendente';
        case 1: return 'Cancelado Parcial';
        case 2: return 'Cancelado Total';
        case 3: return 'Em Aprovação';
        case 4: return 'Faturado Parcial';
        case 5: return 'Faturado Total';
        case 7: return 'Reprovado';

    }
}


// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        // Faz a requisição para obter os dados da sessão
        const response = await fetch('/session-data');
        if (!response.ok) throw new Error('Erro ao buscar dados da sessão');

        const sessionData = await response.json();

        // Define os dados no front-end
        if (sessionData.isAuthenticated) {
            window.sessionData = sessionData;

            const userNumero = window.sessionData?.userNumero || null;
            const representanteFilter = document.getElementById('representanteFilter');

            if (userNumero) {
                representanteFilter.value = userNumero;
                representanteFilter.disabled = true; // Bloqueia o campo
                currentFilters.representante = userNumero; // Atualiza o filtro global
            }

            sincronizarStatusSeparacao();


            // Simula o clique no botão "Aplicar Filtros" para carregar os dados filtrados automaticamente
            await applyFilters();
            //await loadOrderDetails(this.value);
        } else {
            console.warn('Usuário não autenticado');
            window.location.href = '/login2'; // Redireciona para a página de login
        }
    } catch (error) {
        console.error('Erro ao carregar os dados da sessão:', error);
    }
});

function normalizarTextoNota(
    valor
) {
    return String(
        valor ?? ''
    )
        .trim()
        .normalize(
            'NFD'
        )
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase();
}

function notaPodeAparecerNaLinha(
    nota
) {
    if (
        !nota ||
        typeof nota !== 'object'
    ) {
        return false;
    }

    const status =
        normalizarTextoNota(
            nota.status
        );

    if (status !== 'impresso') {
        return false;
    }

    const tipoDocumento =
        normalizarTextoNota(
            nota.tipo
        );

    if (tipoDocumento === 'devolucao') {
        return false;
    }

    const itens =
        Array.isArray(
            nota.itens
        )
            ? nota.itens
            : [];

    const possuiDevolucao =
        itens.some(
            item => {
                const tipo =
                    normalizarTextoNota(
                        item
                            ?.naturezaDaOperacao
                            ?.tipo
                    );

                return (
                    tipo ===
                    'devolucao'
                );
            }
        );

    return !possuiDevolucao;
}

function obterNotasFiscaisPedido(
    order
) {
    const notasLista =
        Array.isArray(
            order?.notas_fiscais?.dados
        )
            ? order.notas_fiscais.dados
            : [];

    const notaDireta =
        order?.notas_fiscais?.notaFiscal ??
        null;

    const candidatas = [
        ...notasLista
    ];

    if (notaDireta) {
        candidatas.push(
            notaDireta
        );
    }

    const notasUnicas =
        new Map();

    candidatas.forEach(
        nota => {
            if (
                !notaPodeAparecerNaLinha(
                    nota
                )
            ) {
                return;
            }

            const numero =
                String(
                    nota?.numero ??
                    ''
                ).trim();

            const chaveAcesso =
                String(
                    nota?.chaveAcesso ??
                    ''
                ).replace(
                    /\D/g,
                    ''
                );

            if (!numero) {
                return;
            }

            const chaveUnica =
                chaveAcesso ||
                numero;

            if (
                notasUnicas.has(
                    chaveUnica
                )
            ) {
                return;
            }

            notasUnicas.set(
                chaveUnica,
                {
                    numero:
                        numero,

                    serie:
                        nota?.serie ??
                        '',

                    chaveAcesso:
                        chaveAcesso,

                    status:
                        nota?.status ??
                        '',

                    itens:
                        Array.isArray(
                            nota?.itens
                        )
                            ? nota.itens
                            : []
                }
            );
        }
    );

    return Array.from(
        notasUnicas.values()
    );
}

async function applyFilters() {
    currentFilters.representante =
        document
            .getElementById(
                'representanteFilter'
            )
            .value
            .trim();

    currentFilters.clienteCNPJ =
        document
            .getElementById(
                'clienteCNPJFilter'
            )
            .value
            .trim();

    currentFilters.ClienteCodigo =
        document
            .getElementById(
                'codClientFilter'
            )
            .value
            .trim();

    currentFilters.codigoPedido =
        document
            .getElementById(
                'codigoPedidoFilter'
            )
            .value
            .trim();

    currentFilters.numeroNota =
        document
            .getElementById(
                'numeroNotaFilter'
            )
            .value
            .trim();

    currentFilters.status =
        document
            .getElementById(
                'statusFilter'
            )
            .value;

    currentFilters.dataInicio =
        document
            .getElementById(
                'dataPedidoInicioFilter'
            )
            .value;

    currentFilters.dataFim =
        document
            .getElementById(
                'dataPedidoFimFilter'
            )
            .value;

    const possuiNumeroNota =
        Boolean(
            currentFilters.numeroNota
        );

    if (
        possuiNumeroNota &&
        currentFilters.status === '6'
    ) {
        currentFilters.status =
            '5';

        document
            .getElementById(
                'statusFilter'
            )
            .value =
            '5';
    }

    const possuiBuscaPorCodigo =
        Boolean(
            currentFilters.codigoPedido
        );

    if (!possuiBuscaPorCodigo) {
        sincronizarStatusSeparacao();
    }

    currentFilters.statusSeparacao =
        document
            .getElementById(
                'statusSeparacaoFilter'
            )
            .value;

    await loadOrderDetails(
        currentFilters.status
    );
}

// Limpar Filtros
async function clearFilters() {

    showFeedback("Carregando dados padrão, aguarde...");

    // Verificar se o usuário é representante
    const isRep = window.sessionData?.userNumero !== null;


    // Limpar os campos do formulário
    document.getElementById('clienteCNPJFilter').value = '';
    document.getElementById('codClientFilter').value = '';
    document.getElementById('dataPedidoInicioFilter').value = '';
    document.getElementById('dataPedidoFimFilter').value = '';
    document.getElementById('statusFilter').value = '6';
    document.getElementById(
        'statusSeparacaoFilter'
    ).value = '0';
    document.getElementById(
        'codigoPedidoFilter'
    ).value = '';

    document.getElementById(
        'numeroNotaFilter'
    ).value = '';


    const campoSeparacao =
        document.getElementById(
            'statusSeparacaoFilter'
        );

    campoSeparacao.disabled =
        false;

    campoSeparacao.value =
        '0';

        
    // Limpar o estado global de filtros
    currentFilters = {
        representante:
            isRep
                ? document
                    .getElementById(
                        'representanteFilter'
                    )
                    .value
                    .trim()
                : '',

        clienteCNPJ:
            '',

        ClienteCodigo:
            '',

        codigoPedido:
            '',

        numeroNota:
            '',

        status:
            '6',

        dataInicio:
            '',

        dataFim:
            '',

        statusSeparacao:
            '0'
    };

    await loadOrderDetails(currentFilters.status);
}




// Verificar se os filtros estão aplicados
function areFiltersApplied(){

    return Boolean(
        currentFilters.representante ||
        currentFilters.clienteCNPJ ||
        currentFilters.ClienteCodigo ||
        currentFilters.codigoPedido ||
        currentFilters.numeroNota ||
        currentFilters.status ||
        currentFilters.dataInicio ||
        currentFilters.dataFim ||
        currentFilters.statusSeparacao
    );

}
// Verificar se os filtros estão aplicados and return the data to export

// Exportar para Excel (com ou sem filtros)
document.getElementById('exportExcel1').addEventListener('click', async () => {
    if (ordersData.length === 0) {
        showFeedback("Nenhum dado disponível para exportar. Carregue os dados primeiro.");
        return;
    }

    // Get the data to export
    const dataToExport =
        ordersData;

    if (dataToExport.length === 0) {
        showFeedback("Nenhum dado para exportar com os filtros aplicados.");
        return;
    }

    exportToExcel(dataToExport);
});

function escaparHtml(
    valor
) {
    const elemento =
        document.createElement(
            'div'
        );

    elemento.textContent =
        String(
            valor ?? ''
        );

    return elemento.innerHTML;
}

function montarNotaFiscalHtml(
    order
) {
    const notas =
        obterNotasFiscaisPedido(
            order
        );

    if (notas.length === 0) {
        return `
            <span class="nota-fiscal-indisponivel">
                Sem Nota
            </span>
        `;
    }

    return notas
        .map(
            nota => {
                const numeroNota =
                    String(
                        nota?.numero ??
                        ''
                    ).trim();

                const chaveAcesso =
                    String(
                        nota?.chaveAcesso ??
                        ''
                    ).replace(
                        /\D/g,
                        ''
                    );

                if (!numeroNota) {
                    return '';
                }

                // Sem uma chave válida, mostra o número sem link.
                if (chaveAcesso.length !== 44) {
                    return `
                        <span
                            class="nota-fiscal-sem-pdf"
                            title="Chave de acesso não disponível para esta nota"
                        >
                            ${escaparHtml(numeroNota)}
                        </span>
                    `;
                }

                return `
                    <button
                        type="button"
                        class="link-download-pdf"
                        data-chave-acesso="${escaparHtml(chaveAcesso)}"
                        data-numero-nota="${escaparHtml(numeroNota)}"
                        title="Baixar PDF da nota fiscal ${escaparHtml(numeroNota)}"
                        aria-label="Baixar PDF da nota fiscal ${escaparHtml(numeroNota)}"
                    >
                        ${escaparHtml(numeroNota)}
                    </button>
                `;
            }
        )
        .filter(
            Boolean
        )
        .join(
            '<br>'
        );
}

async function baixarXmlNotaFiscal(
    codigoPedido,
    numeroNota,
    botao
) {
    const codigoPedidoNormalizado =
        String(
            codigoPedido || ''
        )
            .replace(
                /\D/g,
                ''
            );

    const numeroNotaNormalizado =
        String(
            numeroNota || ''
        )
            .replace(
                /\D/g,
                ''
            );

    if (!codigoPedidoNormalizado) {
        alert(
            'O código do pedido não foi encontrado.'
        );

        return;
    }

    if (!numeroNotaNormalizado) {
        alert(
            'O número da nota fiscal não foi encontrado.'
        );

        return;
    }

    const textoOriginal =
        botao?.textContent?.trim() ||
        numeroNotaNormalizado;

    try {
        if (botao) {
            botao.disabled =
                true;

            botao.textContent =
                'Baixando...';
        }

        showFeedback(
            `Baixando XML da nota fiscal ${numeroNotaNormalizado}...`
        );

        const url =
            '/api/pedidos/' +
            encodeURIComponent(
                codigoPedidoNormalizado
            ) +
            '/notas-fiscais/' +
            encodeURIComponent(
                numeroNotaNormalizado
            ) +
            '/xml';

        console.log(
            'Solicitando download do XML:',
            {
                codigoPedido:
                    codigoPedidoNormalizado,

                numeroNota:
                    numeroNotaNormalizado,

                url:
                    url
            }
        );

        /*
         * O parâmetro impede cache de respostas antigas
         * durante os testes.
         */
        const urlSemCache =
            `${url}?t=${Date.now()}`;

        const response =
            await fetch(
                urlSemCache,
                {
                    method:
                        'GET',

                    credentials:
                        'same-origin',

                    cache:
                        'no-store',

                    headers: {
                        Accept:
                            'application/xml, text/xml, application/json',

                        'Cache-Control':
                            'no-cache'
                    }
                }
            );

        if (!response.ok) {
            const contentType =
                response.headers.get(
                    'content-type'
                ) || '';

            let mensagem =
                `Erro HTTP ${response.status} ao baixar o XML.`;

            if (
                contentType.includes(
                    'application/json'
                )
            ) {
                const resultado =
                    await response.json();

                mensagem =
                    resultado.mensagem ||
                    resultado.error ||
                    mensagem;
            } else {
                const texto =
                    await response.text();

                mensagem =
                    texto ||
                    mensagem;
            }

            throw new Error(
                mensagem
            );
        }

        const xml =
            await response.text();

        if (!xml.trim()) {
            throw new Error(
                'O arquivo XML retornado está vazio.'
            );
        }

        /*
         * Validação no navegador:
         * verifica se o XML contém <nNF>2499</nNF>.
         */
        const correspondencia =
            xml.match(
                /<(?:[A-Za-z0-9_-]+:)?nNF>\s*(\d+)\s*<\/(?:[A-Za-z0-9_-]+:)?nNF>/i
            );

        const numeroXml =
            correspondencia?.[1] ||
            '';

        if (
            numeroXml &&
            numeroXml !==
                numeroNotaNormalizado
        ) {
            throw new Error(
                `O XML retornado pertence à nota ${numeroXml}, ` +
                `mas a nota solicitada foi ${numeroNotaNormalizado}.`
            );
        }

        const blob =
            new Blob(
                [
                    xml
                ],
                {
                    type:
                        'application/xml;charset=utf-8'
                }
            );

        const contentDisposition =
            response.headers.get(
                'content-disposition'
            ) || '';

        const nomeEncontrado =
            contentDisposition.match(
                /filename="?([^";]+)"?/i
            );

        const nomeArquivo =
            nomeEncontrado?.[1] ||
            `NFe-${numeroNotaNormalizado}.xml`;

        const urlTemporaria =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                'a'
            );

        link.href =
            urlTemporaria;

        link.download =
            nomeArquivo;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        setTimeout(
            () => {
                URL.revokeObjectURL(
                    urlTemporaria
                );
            },
            1000
        );

        hideFeedback();
    } catch (error) {
        console.error(
            'Erro ao baixar XML da nota fiscal:',
            error
        );

        showFeedback(
            error.message ||
            'Não foi possível baixar o XML da nota fiscal.'
        );

        alert(
            error.message ||
            'Não foi possível baixar o XML da nota fiscal.'
        );
    } finally {
        if (botao) {
            botao.disabled =
                false;

            botao.textContent =
                textoOriginal;
        }
    }
}

function sincronizarStatusSeparacao() {
    const campoStatus =
        document.getElementById(
            'statusFilter'
        );

    const campoSeparacao =
        document.getElementById(
            'statusSeparacaoFilter'
        );

    if (
        !campoStatus ||
        !campoSeparacao
    ) {
        return;
    }

    const status =
        String(
            campoStatus.value
        );

    campoSeparacao.disabled =
        false;

    if (status === '5') {
        campoSeparacao.value =
            '2';
    } else if (
        status === '4' ||
        status === '1'
    ) {
        campoSeparacao.value =
            '1';
    } else if (
        status === '3'
    ) {
        campoSeparacao.value =
            '0';
    }

        console.log("separação "+ campoSeparacao.value)


    currentFilters.statusSeparacao =
        campoSeparacao.value;
}

const campoStatusPedido =
    document.getElementById(
        'statusFilter'
    );

if (campoStatusPedido) {
    campoStatusPedido.addEventListener(
        'change',
        sincronizarStatusSeparacao
    );
}

// Eventos dos botões de filtro
document.getElementById('applyFilters').addEventListener('click', applyFilters);
document.getElementById('clearFilters').addEventListener('click', clearFilters);
//document.getElementById('statusFilter').addEventListener('change', applyFilters);
//document.getElementById('statusSeparacaoFilter').addEventListener('change', applyFilters);



document
    .getElementById(
        'logoutButton'
    )
    ?.addEventListener('click', async () => {
    // Limpa os dados locais
    sessionStorage.clear();
    localStorage.clear();

    // Faz a requisição ao servidor para destruir a sessão
    await fetch('/logout', { method: 'POST' });

    // Limpa cookies manualmente (como precaução)
    document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie.split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
    });

    // Redireciona para a página de login
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


async function showOrderDetails(codPedido) {
    try {
      const response = await fetch(`/api/pedidos1/${codPedido}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do pedido');
      }
      
      const detalhes = await response.json();
     
      
      // Aqui você pode exibir os detalhes em um modal ou em uma div na página
      displayOrderDetails(detalhes);
      console.log(detalhes)
      
    } catch (error) {
      console.error('Erro:', error);
      alert('Não foi possível carregar os detalhes do pedido.');
    }
  }
  
  // Função para exibir os detalhes (exemplo)
  function displayOrderDetails(detalhes) {
    // Implemente como deseja exibir os detalhes
    // Por exemplo, em um modal:
    const modal = document.getElementById('detailsModal');
    const modalContent = document.getElementById('modalContent');
    
    // Preencha o conteúdo do modal com os detalhes
    modalContent.innerHTML = `
      <h3>Detalhes do Pedido: ${detalhes.dados[0].codigo}</h3>
      <p>Cliente: ${detalhes.dados[0].cliente.nomeAbreviado}</p>
      <p>Status: ${detalhes.dados[0].status}</p>
      <!-- Adicione mais detalhes conforme necessário -->
    `;
    
    // Exiba o modal
    modal.style.display = 'block';
  }

