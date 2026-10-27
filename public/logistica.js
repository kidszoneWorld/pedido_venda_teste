let todosDadosLogistica = [];
let dadosFiltradosLogistica = [];
let numeroRepresentanteSessao = '';

const regioesLogistica = {
    'sul-sudeste': {
        nome:
            'Sul/Sudeste',

        endpoint:
            '/api/logistica/logistica02'
    },

    'norte-nordeste-centro-oeste': {
        nome:
            'Norte/Nordeste/Centro-Oeste',

        endpoint:
            '/api/logistica/logistica03'
    }
};

function obterElemento(
    id
) {
    return document.getElementById(
        id
    );
}

function mostrarFeedback(
    mensagem
) {
    const feedback =
        obterElemento(
            'feedback'
        );

    if (!feedback) {
        console.log(
            mensagem
        );

        return;
    }

    feedback.style.display =
        'block';

    feedback.textContent =
        mensagem;
}

function ocultarFeedback() {
    const feedback =
        obterElemento(
            'feedback'
        );

    if (!feedback) {
        return;
    }

    feedback.style.display =
        'none';

    feedback.textContent =
        '';
}

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

function formatarCnpj(
    valor
) {
    const cnpj =
        somenteDigitos(
            valor
        );

    if (!cnpj) {
        return '';
    }

    const cnpjCompleto =
        cnpj.padStart(
            14,
            '0'
        );

    if (cnpjCompleto.length !== 14) {
        return cnpj;
    }

    return cnpjCompleto.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}


function somenteDigitos(
    valor
) {
    return String(
        valor ?? ''
    ).replace(
        /\D/g,
        ''
    );
}

function formatarDataLogistica(
    valor
) {
    if (!valor) {
        return '';
    }

    const texto =
        String(
            valor
        );

    const dataSemHorario =
        texto.split(
            'T'
        )[0];

    const partes =
        dataSemHorario.split(
            '-'
        );

    if (partes.length !== 3) {
        return '';
    }

    const ano =
        partes[0];

    const mes =
        partes[1];

    const dia =
        partes[2];

    if (
        !ano ||
        !mes ||
        !dia
    ) {
        return '';
    }

    return `${dia}/${mes}/${ano}`;
}

function criarDataComparacao(
    valor
) {
    if (!valor) {
        return null;
    }

    const data =
        new Date(
            `${valor}T00:00:00`
        );

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return null;
    }

    return data;
}

function criarDataPedidoComparacao(
    valor
) {
    if (!valor) {
        return null;
    }

    const dataTexto =
        String(
            valor
        )
            .split(
                'T'
            )[0];

    return criarDataComparacao(
        dataTexto
    );
}

function obterDataAtualFormatada() {
    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            '0'
        );

    return `${ano}-${mes}-${dia}`;
}

function obterNomeRegiaoSelecionada() {
    const valor =
        obterElemento(
            'regiaoFilter'
        )?.value ||
        'todas';

    if (valor === 'todas') {
        return 'Todas as regiões';
    }

    return (
        regioesLogistica[valor]?.nome ||
        'Todas as regiões'
    );
}

function atualizarTextoRegiao() {
    const elemento =
        obterElemento(
            'regiaoAtualTexto'
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        obterNomeRegiaoSelecionada();
}

async function buscarDadosRegiao(
    chaveRegiao
) {
    const configuracao =
        regioesLogistica[
            chaveRegiao
        ];

    if (!configuracao) {
        return [];
    }

    const response =
        await fetch(
            configuracao.endpoint,
            {
                method:
                    'GET',

                credentials:
                    'same-origin',

                cache:
                    'no-store',

                headers: {
                    Accept:
                        'application/json'
                }
            }
        );

    if (!response.ok) {
        let mensagem =
            `Erro HTTP ${response.status} ao carregar ${configuracao.nome}.`;

        try {
            const resultado =
                await response.json();

            mensagem =
                resultado.error ||
                resultado.mensagem ||
                mensagem;
        } catch {
            // Mantém a mensagem HTTP.
        }

        throw new Error(
            mensagem
        );
    }

    const resultado =
        await response.json();

    const dados =
        Array.isArray(
            resultado
        )
            ? resultado
            : [];

    return dados.map(
        item => {
            return {
                ...item,

                regiaoOrigem:
                    configuracao.nome,

                chaveRegiao:
                    chaveRegiao
            };
        }
    );
}

async function carregarDadosLogistica() {
    mostrarFeedback(
        'Carregando dados de logística, aguarde...'
    );

    const regiaoSelecionada =
        obterElemento(
            'regiaoFilter'
        )?.value ||
        'todas';

    try {
        let resultados;

        if (
            regiaoSelecionada ===
            'todas'
        ) {
            resultados =
                await Promise.allSettled([
                    buscarDadosRegiao(
                        'sul-sudeste'
                    ),

                    buscarDadosRegiao(
                        'norte-nordeste-centro-oeste'
                    )
                ]);

            const dadosCarregados =
                [];

            const erros =
                [];

            resultados.forEach(
                (
                    resultado,
                    indice
                ) => {
                    if (
                        resultado.status ===
                        'fulfilled'
                    ) {
                        dadosCarregados.push(
                            ...resultado.value
                        );

                        return;
                    }

                    const nomeRegiao =
                        indice === 0
                            ? 'Sul/Sudeste'
                            : 'Norte/Nordeste/Centro-Oeste';

                    erros.push(
                        `${nomeRegiao}: ${resultado.reason?.message || 'erro desconhecido'}`
                    );
                }
            );

            if (
                dadosCarregados.length === 0 &&
                erros.length > 0
            ) {
                throw new Error(
                    erros.join(
                        ' | '
                    )
                );
            }

            todosDadosLogistica =
                dadosCarregados;

            if (erros.length > 0) {
                mostrarFeedback(
                    'Algumas regiões não puderam ser carregadas. ' +
                    erros.join(
                        ' | '
                    )
                );
            } else {
                ocultarFeedback();
            }
        } else {
            todosDadosLogistica =
                await buscarDadosRegiao(
                    regiaoSelecionada
                );

            ocultarFeedback();
        }

        dadosFiltradosLogistica = [
            ...todosDadosLogistica
        ];

        aplicarFiltrosLogistica(
            false
        );

        atualizarTextoRegiao();
    } catch (error) {
        console.error(
            'Erro ao carregar dados de logística:',
            error
        );

        todosDadosLogistica =
            [];

        dadosFiltradosLogistica =
            [];

        renderizarTabela(
            []
        );

        mostrarFeedback(
            error.message ||
            'Erro ao carregar os dados de logística.'
        );
    }
}

function renderizarTabela(
    dados
) {
    const corpoTabela =
        document.querySelector(
            '#order-table tbody'
        );

    if (!corpoTabela) {
        console.error(
            'O corpo da tabela de logística não foi encontrado.'
        );

        return;
    }

    corpoTabela.innerHTML =
        '';

    const fragmento =
        document.createDocumentFragment();
                // <td class="regiao">
                //     ${escaparHtml(order.regiaoOrigem)}
                // </td>
    dados.forEach(
        order => {
            const linha =
                document.createElement(
                    'tr'
                );

            linha.innerHTML = `


                <td class="dataEmissao">
                    ${escaparHtml(formatarDataLogistica(order.EMISSÃO))}
                </td>

                <td class="numNotas">
                    ${escaparHtml(order.NF)}
                </td>

                <td class="codCliente">
                    ${escaparHtml(order.codCliente)}
                </td>

                <td class="cliente">
                    ${escaparHtml(order.NOME)}
                </td>

                <td class="clienteCNPJ">
                    ${escaparHtml(formatarCnpj(order.CNPJ) || 'Não informado')}
                </td>

                <td class="uf">
                    ${escaparHtml(order.UF)}
                </td>

                <td class="codRep">
                    ${escaparHtml(order.Rep)}
                </td>

                <td class="codTrans">
                    ${escaparHtml(order.CodTransporte)}
                </td>

                <td class="transportadora">
                    ${escaparHtml(order.TRANSPORTES)}
                </td>

                <td class="saida">
                    ${escaparHtml(formatarDataLogistica(order.SAÍDA))}
                </td>

                <td class="previsaoEntrega">
                    ${escaparHtml(formatarDataLogistica(order.PrevisaoEntrega))}
                </td>

                <td class="dataEntrega">
                    ${escaparHtml(formatarDataLogistica(order.ENTREGUE))}
                </td>

                <td class="statusEntrega">
                    ${escaparHtml(order.STATUS_ENTREGA)}
                </td>

                <td class="agenda">
                    ${escaparHtml(order.AGENDA)}
                </td>

                <td class="ocorrencia">
                    ${escaparHtml(order.OCORRÊNCIA)}
                </td>
            `;

            fragmento.appendChild(
                linha
            );
        }
    );

    corpoTabela.appendChild(
        fragmento
    );

    const totalRegistros =
        obterElemento(
            'totalRegistros'
        );

    if (totalRegistros) {
        totalRegistros.textContent =
            String(
                dados.length
            );
    }
}

function lerFiltros() {
    return {
        representante:
            obterElemento(
                'representanteFilter'
            )?.value.trim() ||
            '',

        nota:
            obterElemento(
                'notaFilter'
            )?.value.trim() ||
            '',

        cnpj:
            somenteDigitos(
                obterElemento(
                    'clienteCNPJFilter'
                )?.value
            ),

        dataInicio:
            obterElemento(
                'dataPedidoInicioFilter'
            )?.value ||
            '',

        dataFim:
            obterElemento(
                'dataPedidoFimFilter'
            )?.value ||
            '',

        status:
            obterElemento(
                'statusFilter'
            )?.value ||
            'todos'
    };
}

function aplicarFiltrosLogistica(
    exibirMensagem = true
) {
    if (exibirMensagem) {
        mostrarFeedback(
            'Aplicando filtros, aguarde...'
        );
    }

    try {
        const filtros =
            lerFiltros();

        const dataInicio =
            criarDataComparacao(
                filtros.dataInicio
            );

        const dataFim =
            criarDataComparacao(
                filtros.dataFim
            );

        if (
            dataInicio &&
            dataFim &&
            dataInicio > dataFim
        ) {
            mostrarFeedback(
                'A data inicial não pode ser maior que a data final.'
            );

            return;
        }

        dadosFiltradosLogistica =
            todosDadosLogistica.filter(
                order => {
                    const representante =
                        String(
                            order?.Rep ??
                            ''
                        ).trim();

                    const nota =
                        String(
                            order?.NF ??
                            ''
                        ).trim();

                    const cnpj =
                        somenteDigitos(
                            order?.CNPJ
                        );

                    const dataEmissao =
                        criarDataPedidoComparacao(
                            order?.EMISSÃO
                        );

                    const statusEntrega =
                        String(
                            order?.STATUS_ENTREGA ??
                            ''
                        )
                            .trim()
                            .toLowerCase();

                    const correspondeRepresentante =
                        !filtros.representante ||
                        representante ===
                            filtros.representante;

                    const correspondeNota =
                        !filtros.nota ||
                        nota ===
                            filtros.nota;

                    const correspondeCnpj =
                        !filtros.cnpj ||
                        cnpj ===
                            filtros.cnpj;

                    const correspondeDataInicio =
                        !dataInicio ||
                        (
                            dataEmissao &&
                            dataEmissao >=
                                dataInicio
                        );

                    const correspondeDataFim =
                        !dataFim ||
                        (
                            dataEmissao &&
                            dataEmissao <=
                                dataFim
                        );

                    let correspondeStatus =
                        true;

                    if (
                        filtros.status !==
                        'todos'
                    ) {
                        correspondeStatus =
                            statusEntrega ===
                            filtros.status;
                    }

                    return (
                        correspondeRepresentante &&
                        correspondeNota &&
                        correspondeCnpj &&
                        correspondeDataInicio &&
                        correspondeDataFim &&
                        correspondeStatus
                    );
                }
            );

        renderizarTabela(
            dadosFiltradosLogistica
        );

        if (
            dadosFiltradosLogistica.length ===
            0
        ) {
            mostrarFeedback(
                'Nenhum dado encontrado com os filtros aplicados.'
            );

            return;
        }

        ocultarFeedback();
    } catch (error) {
        console.error(
            'Erro ao aplicar filtros:',
            error
        );

        mostrarFeedback(
            'Erro ao aplicar os filtros. Tente novamente.'
        );
    }
}

function limparFiltros() {
    const regiao =
        obterElemento(
            'regiaoFilter'
        );

    const representante =
        obterElemento(
            'representanteFilter'
        );

    const nota =
        obterElemento(
            'notaFilter'
        );

    const cnpj =
        obterElemento(
            'clienteCNPJFilter'
        );

    const dataInicio =
        obterElemento(
            'dataPedidoInicioFilter'
        );

    const dataFim =
        obterElemento(
            'dataPedidoFimFilter'
        );

    const status =
        obterElemento(
            'statusFilter'
        );

    if (regiao) {
        regiao.value =
            'todas';
    }

    if (representante) {
        representante.value =
            numeroRepresentanteSessao ||
            '';
    }

    if (nota) {
        nota.value =
            '';
    }

    if (cnpj) {
        cnpj.value =
            '';
    }

    if (dataInicio) {
        dataInicio.value =
            '';
    }

    if (dataFim) {
        dataFim.value =
            '';
    }

    if (status) {
        status.value =
            'todos';
    }

    atualizarTextoRegiao();

    carregarDadosLogistica();
}

function existemFiltrosAplicados() {
    const filtros =
        lerFiltros();

    return Boolean(
        (
            filtros.representante &&
            filtros.representante !==
                numeroRepresentanteSessao
        ) ||
        filtros.nota ||
        filtros.cnpj ||
        filtros.dataInicio ||
        filtros.dataFim ||
        filtros.status !==
            'todos'
    );
}

function exportarParaExcel(
    dados
) {
    if (
        typeof XLSX ===
        'undefined'
    ) {
        mostrarFeedback(
            'A biblioteca de exportação para Excel não foi carregada.'
        );

        return;
    }

    const dadosExportacao =
        dados.map(
            order => {
                return {
                    // Região:
                    //     order.regiaoOrigem ||
                    //     '',

                    'Data da emissão':
                        formatarDataLogistica(
                            order.EMISSÃO
                        ),

                    'Núm notas':
                        order.NF ||
                        '',

                    'Cód Cliente':
                        order.codCliente ||
                        '',

                    Cliente:
                        order.NOME ||
                        '',

                    'Cliente CNPJ':
                        somenteDigitos(
                            order.CNPJ
                        ),

                    UF:
                        order.UF ||
                        '',

                    'Cód Rep':
                        order.Rep ||
                        '',

                    'Cód Trans':
                        order.CodTransporte ||
                        '',

                    Transportadora:
                        order.TRANSPORTES ||
                        '',

                    Saída:
                        formatarDataLogistica(
                            order.SAÍDA
                        ),

                    'Previsão de Entrega':
                        formatarDataLogistica(
                            order.PrevisaoEntrega
                        ),

                    'Data de Entrega':
                        formatarDataLogistica(
                            order.ENTREGUE
                        ),

                    'Status Entrega':
                        order.STATUS_ENTREGA ||
                        '',

                    Agenda:
                        order.AGENDA ||
                        '',

                    Ocorrência:
                        order.OCORRÊNCIA ||
                        ''
                };
            }
        );

    const worksheet =
        XLSX.utils.json_to_sheet(
            dadosExportacao
        );

    worksheet['!cols'] = [
        {
            wch:
                32
        },
        {
            wch:
                15
        },
        {
            wch:
                12
        },
        {
            wch:
                12
        },
        {
            wch:
                30
        },
        {
            wch:
                20
        },
        {
            wch:
                6
        },
        {
            wch:
                10
        },
        {
            wch:
                10
        },
        {
            wch:
                30
        },
        {
            wch:
                15
        },
        {
            wch:
                20
        },
        {
            wch:
                15
        },
        {
            wch:
                18
        },
        {
            wch:
                18
        },
        {
            wch:
                30
        }
    ];

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Entregas'
    );

    const dataAtual =
        obterDataAtualFormatada();

    const regiaoSelecionada =
        obterElemento(
            'regiaoFilter'
        )?.value ||
        'todas';

    const nomeRegiao =
        regiaoSelecionada ===
        'todas'
            ? 'Todas_Regioes'
            : obterNomeRegiaoSelecionada()
                .replace(
                    /[^A-Za-zÀ-ÿ0-9]+/g,
                    '_'
                );

    const nomeArquivo =
        `Entregas_${dataAtual}.xlsx`;

    XLSX.writeFile(
        workbook,
        nomeArquivo
    );
}

async function carregarSessao() {
    const response =
        await fetch(
            '/session-data',
            {
                credentials:
                    'same-origin',

                cache:
                    'no-store'
            }
        );

    if (!response.ok) {
        throw new Error(
            'Erro ao buscar dados da sessão.'
        );
    }

    const sessionData =
        await response.json();

    if (!sessionData.isAuthenticated) {
        window.location.href =
            '/login2';

        return false;
    }

    window.sessionData =
        sessionData;

    numeroRepresentanteSessao =
        String(
            sessionData?.userNumero ??
            ''
        ).trim();

    const representanteFilter =
        obterElemento(
            'representanteFilter'
        );

    if (
        representanteFilter &&
        numeroRepresentanteSessao
    ) {
        representanteFilter.value =
            numeroRepresentanteSessao;

        representanteFilter.disabled =
            true;
    }

    return true;
}

function configurarEventos() {
    obterElemento(
        'applyFilters'
    )?.addEventListener(
        'click',
        () => {
            aplicarFiltrosLogistica(
                true
            );
        }
    );

    obterElemento(
        'clearFilters'
    )?.addEventListener(
        'click',
        limparFiltros
    );

    obterElemento(
        'regiaoFilter'
    )?.addEventListener(
        'change',
        () => {
            atualizarTextoRegiao();
            carregarDadosLogistica();
        }
    );

    obterElemento(
        'exportExcel'
    )?.addEventListener(
        'click',
        () => {
            const dadosExportar =
                existemFiltrosAplicados()
                    ? dadosFiltradosLogistica
                    : todosDadosLogistica;

            if (
                dadosExportar.length ===
                0
            ) {
                mostrarFeedback(
                    'Nenhum dado disponível para exportar.'
                );

                return;
            }

            exportarParaExcel(
                dadosExportar
            );
        }
    );

    obterElemento(
        'exportExcel'
    )?.addEventListener(
        'keydown',
        evento => {
            if (
                evento.key !== 'Enter' &&
                evento.key !== ' '
            ) {
                return;
            }

            evento.preventDefault();

            obterElemento(
                'exportExcel'
            )?.click();
        }
    );

    obterElemento(
        'menuToggle'
    )?.addEventListener(
        'click',
        () => {
            const filterContainer =
                obterElemento(
                    'filterContainer'
                );

            const menuButton =
                obterElemento(
                    'menuToggle'
                );

            if (
                !filterContainer ||
                !menuButton
            ) {
                return;
            }

            filterContainer.classList.toggle(
                'active'
            );

            const ativo =
                filterContainer
                    .classList
                    .contains(
                        'active'
                    );

            menuButton.innerHTML =
                ativo
                    ? '<span class="menu-icon">✖</span> Fechar Filtros'
                    : '<span class="menu-icon">☰</span> Filtros';
        }
    );

    const camposFiltro = [
        'representanteFilter',
        'notaFilter',
        'clienteCNPJFilter',
        'dataPedidoInicioFilter',
        'dataPedidoFimFilter',
        'statusFilter'
    ];

    camposFiltro.forEach(
        id => {
            obterElemento(
                id
            )?.addEventListener(
                'keydown',
                evento => {
                    if (
                        evento.key ===
                        'Enter'
                    ) {
                        aplicarFiltrosLogistica(
                            true
                        );
                    }
                }
            );
        }
    );
}

document.addEventListener(
    'DOMContentLoaded',
    async () => {
        configurarEventos();
        atualizarTextoRegiao();

        try {
            const autenticado =
                await carregarSessao();

            if (!autenticado) {
                return;
            }

            await carregarDadosLogistica();
        } catch (error) {
            console.error(
                'Erro ao inicializar a página de logística:',
                error
            );

            mostrarFeedback(
                error.message ||
                'Erro ao inicializar a página.'
            );
        }
    }
);