let investimentosOriginais = [];

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        configurarEventosPainel();

        const sessaoValida =
            await aplicarRestricaoRepresentante();

        if(!sessaoValida){
            return;
        }

        await carregarInvestimentos();

    }
);

function configurarEventosPainel(){

    const configuracoes = [
        {
            id: 'filtroInvestimento',
            evento: 'input'
        },
        {
            id: 'filtroCliente',
            evento: 'input'
        },
        {
            id: 'filtroRepresentante',
            evento: 'input'
        },
        {
            id: 'filtroTipo',
            evento: 'change'
        },
        {
            id: 'filtroStatus',
            evento: 'change'
        },
        {
            id: 'filtroVigencia',
            evento: 'input'
        }
    ];

    configuracoes.forEach(configuracao => {

        const campo =
            document.getElementById(
                configuracao.id
            );

        campo?.addEventListener(
            configuracao.evento,
            aplicarFiltrosInvestimentos
        );

    });

    document
        .getElementById(
            'botaoExportarExcel'
        )
        ?.addEventListener(
            'click',
            exportarInvestimentosExcel
        );

    document
        .getElementById(
            'botaoAtualizar'
        )
        ?.addEventListener(
            'click',
            carregarInvestimentos
        );

}

async function aplicarRestricaoRepresentante(){

    const inputRep =
        document.getElementById(
            'filtroRepresentante'
        );

    try{

        const response =
            await fetch(
                '/session-data',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

        if(
            response.redirected &&
            response.url.includes('/login2')
        ){

            window.location.replace(
                '/login2'
            );

            return false;

        }

        if(response.status === 401){

            window.location.replace(
                '/login2'
            );

            return false;

        }

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if(
            !contentType.includes(
                'application/json'
            )
        ){

            throw new Error(
                'A rota de sessão não retornou JSON.'
            );

        }

        const sessionData =
            await response.json();

        if(!response.ok){

            throw new Error(
                sessionData.mensagem ||
                'Não foi possível consultar a sessão.'
            );

        }

        const autenticado =
            sessionData.isAuthenticated === true ||
            sessionData.sucesso === true ||
            Boolean(sessionData.user);

        if(!autenticado){

            window.location.replace(
                '/login2'
            );

            return false;

        }

        window.sessionData =
            sessionData;

        const userNumero =
            sessionData.userNumero ||
            sessionData.user?.numero ||
            '';

        if(userNumero){

            window.isRepresentante =
                true;

            if(inputRep){

                inputRep.value =
                    String(userNumero);

                inputRep.readOnly =
                    true;

                inputRep.disabled =
                    false;

                inputRep.style.backgroundColor =
                    '#e9ecef';

                inputRep.style.cursor =
                    'not-allowed';

            }

            return true;

        }

        window.isRepresentante =
            false;

        if(inputRep){

            inputRep.value =
                '';

            inputRep.readOnly =
                false;

            inputRep.disabled =
                false;

            inputRep.style.backgroundColor =
                '';

            inputRep.style.cursor =
                '';

            inputRep.placeholder =
                'Digite o código do representante';

        }

        return true;

    }catch(error){

        console.error(
            'Erro ao consultar sessão:',
            error
        );

        mostrarMensagem(
            'Não foi possível verificar os dados da sessão.',
            'erro'
        );

        return false;

    }

}

async function carregarInvestimentos(){

    mostrarMensagem(
        'Carregando investimentos...',
        'carregando'
    );

    try{

        const response =
            await fetch(
                '/api/investimentos-comerciais',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

        const resultado =
            await response.json();

        if(!response.ok){

            throw new Error(
                resultado.mensagem ||
                resultado.error ||
                'Erro ao carregar investimentos.'
            );

        }

        if(
            !resultado.success ||
            !Array.isArray(resultado.data)
        ){

            throw new Error(
                'A API retornou dados inválidos.'
            );

        }

        investimentosOriginais =
            resultado.data;

        aplicarFiltrosInvestimentos();

        ocultarMensagem();

    }catch(error){

        console.error(
            'Erro ao carregar investimentos:',
            error
        );

        investimentosOriginais =
            [];

        renderizarInvestimentos(
            []
        );

        mostrarMensagem(
            error.message,
            'erro'
        );

    }

}

function aplicarFiltrosInvestimentos(){

    const codigo =
        obterValorFiltro(
            'filtroInvestimento'
        );

    const cliente =
        obterValorFiltro(
            'filtroCliente'
        );

    const representante =
        obterValorFiltro(
            'filtroRepresentante'
        );

    const tipo =
        obterValorFiltro(
            'filtroTipo'
        );

    const status =
        obterValorFiltro(
            'filtroStatus'
        );

    const vigencia =
        obterValorFiltro(
            'filtroVigencia'
        );

    const filtrados =
        investimentosOriginais.filter(
            investimento => {

                const codigoInvestimento =
                    String(
                        investimento.codigoInvestimento ||
                        ''
                    )
                    .toLowerCase();

                const razaoSocial =
                    String(
                        investimento.razaoSocial ||
                        ''
                    )
                    .toLowerCase();

                const cnpj =
                    String(
                        investimento.cnpj ||
                        ''
                    )
                    .toLowerCase();

                const representanteRegistro =
                    String(
                        investimento.representante ||
                        ''
                    )
                    .toLowerCase();

                const tipoRegistro =
                    String(
                        investimento.tipoInvestimento ||
                        ''
                    )
                    .toLowerCase();

                const statusRegistro =
                    String(
                        investimento.status ||
                        ''
                    )
                    .toLowerCase();

                const vigenciaInicial =
                    String(
                        investimento.vigenciaInicial ||
                        ''
                    )
                    .toLowerCase();

                const vigenciaFinal =
                    String(
                        investimento.vigenciaFinal ||
                        ''
                    )
                    .toLowerCase();

                const matchCodigo =
                    !codigo ||
                    codigoInvestimento.includes(
                        codigo
                    );

                const matchCliente =
                    !cliente ||
                    razaoSocial.includes(
                        cliente
                    ) ||
                    cnpj.includes(
                        cliente
                    );

                const matchRepresentante =
                    !representante ||
                    representanteRegistro.includes(
                        representante
                    );

                const matchTipo =
                    !tipo ||
                    tipoRegistro === tipo;

                const matchStatus =
                    !status ||
                    statusRegistro === status;

                const matchVigencia =
                    !vigencia ||
                    vigenciaInicial.includes(
                        vigencia
                    ) ||
                    vigenciaFinal.includes(
                        vigencia
                    );

                return (
                    matchCodigo &&
                    matchCliente &&
                    matchRepresentante &&
                    matchTipo &&
                    matchStatus &&
                    matchVigencia
                );

            }
        );

    renderizarInvestimentos(
        filtrados
    );

}

function obterValorFiltro(id){

    return String(
        document
            .getElementById(id)
            ?.value || ''
    )
    .trim()
    .toLowerCase();

}

function renderizarInvestimentos(lista){

    const tbody =
        document.querySelector(
            '#tabelaInvestimentos tbody'
        );

    if(!tbody){
        return;
    }

    tbody.innerHTML =
        '';

    if(lista.length === 0){

        const linha =
            document.createElement(
                'tr'
            );

        linha.innerHTML = `
            <td colspan="14" style="text-align:center;">
                Nenhum investimento encontrado.
            </td>
        `;

        tbody.appendChild(
            linha
        );

        return;

    }

    lista.forEach(investimento => {

        const linha =
            document.createElement(
                'tr'
            );

        const status =
            String(
                investimento.status ||
                'pendente'
            )
            .toLowerCase();

        aplicarCorStatus(
            linha,
            status
        );

        const parcelasHtml =
            montarParcelasHtml(
                investimento.parcelas
            );

        const controlesDesabilitados =
            window.isRepresentante
                ? 'disabled'
                : '';

        linha.innerHTML = `
            <td>
                ${escaparHtml(investimento.codigoInvestimento)}
            </td>

            <td>
                ${escaparHtml(investimento.razaoSocial)}
            </td>

            <td>
                ${escaparHtml(formatarCNPJ(investimento.cnpj))}
            </td>

            <td>
                ${escaparHtml(investimento.representante)}
            </td>

            <td>
                ${escaparHtml(investimento.tipoInvestimento)}
            </td>

            <td>
                ${escaparHtml(investimento.descricaoInvestimento)}
            </td>

            <td>
                ${escaparHtml(investimento.vigenciaInicial)}
                até
                ${escaparHtml(investimento.vigenciaFinal)}
            </td>

            <td>
                ${formatarMoeda(investimento.valorInvestimento)}
            </td>

            <td>
                ${formatarMoeda(investimento.valorCompra)}
            </td>

            <td>
                ${formatarPercentual(investimento.investimentoSobreCompra)}
            </td>

            <td class="status-atual-investimento">
                ${escaparHtml(
                    formatarStatusInvestimento(
                        status
                    )
                )}
            </td>
            <td>
                <button
                    type="button"
                    class="button botao-detalhes-investimento"
                    data-id="${investimento.codigoInvestimento}"
                >
                    Ver
                </button>
            </td>

       <td class="coluna-status-investimento">

            <select
                class="select-status-investimento"
                data-id="${investimento.codigoInvestimento}"
                data-status-anterior="${status}"
                ${controlesDesabilitados}
            >

                <option
                    value="pendente"
                    ${status === 'pendente' ? 'selected' : ''}
                >
                    Pendente
                </option>

                <option
                    value="aprovacao_comercial"
                    ${status === 'aprovacao_comercial' ? 'selected' : ''}
                >
                    Aprovação Comercial
                </option>

                <option
                    value="aprovacao_diretoria"
                    ${status === 'aprovacao_diretoria' ? 'selected' : ''}
                >
                    Aprovação Diretoria
                </option>

                <option
                    value="finalizado"
                    ${status === 'finalizado' ? 'selected' : ''}
                >
                    Finalizado
                </option>

                <option
                    value="reprovado"
                    ${status === 'reprovado' ? 'selected' : ''}
                >
                    Reprovado
                </option>
            </select>

        </td>

            <td>
                <button
                    type="button"
                    class="button botao-salvar-investimento"
                    data-id="${investimento.codigoInvestimento}"
                    ${controlesDesabilitados}
                >
                    Salvar
                </button>
            </td>
        `;

        linha
            .querySelector(
                '.botao-detalhes-investimento'
            )
            ?.addEventListener(
                'click',
                () => {

                    abrirDetalhesInvestimento(
                        investimento.codigoInvestimento
                    );

                }
            );
        linha
            .querySelector(
                '.botao-salvar-investimento'
            )
            ?.addEventListener(
                'click',
                event => {

                    salvarStatusInvestimento(
                        investimento.codigoInvestimento,
                        event.currentTarget
                    );

                }
            );

        tbody.appendChild(
            linha
        );

    });

}

function formatarStatusInvestimento(status){

    const statusNormalizado =
        String(status || '')
            .trim()
            .toLowerCase();

    const nomesStatus = {
        pendente:
            'Pendente',

        aprovacao_comercial:
            'Aprovação Comercial',

        aprovacao_diretoria:
            'Aprovação Diretoria',

        finalizado:
            'Finalizado',

        reprovado:
            'Reprovado'
    };

    return nomesStatus[statusNormalizado] ||
        'Não informado';

}

function montarParcelasHtml(parcelas){

    if(
        !Array.isArray(parcelas) ||
        parcelas.length === 0
    ){

        return 'Sem parcelas';

    }

    return parcelas
        .map(parcela => {

            const numero =
                escaparHtml(
                    parcela.parcela
                );

            const valor =
                formatarMoeda(
                    parcela.valorParcela
                );

            const pagamento =
                formatarMoeda(
                    parcela.valorPagamento
                );

            return `
                <div class="parcela-resumo">
                    ${numero}: ${valor} / ${pagamento}
                </div>
            `;

        })
        .join('');

}

async function salvarStatusInvestimento(
    codigoInvestimento,
    botao
){

    const linha =
        botao.closest(
            'tr'
        );

    if(!linha){

        alert(
            'Não foi possível localizar a linha do investimento.'
        );

        return;

    }

    const selectStatus =
        linha.querySelector(
            '.select-status-investimento'
        );

    if(!selectStatus){

        alert(
            'Não foi possível localizar o campo de status.'
        );

        return;

    }

    const statusSelecionado =
        selectStatus.value;

    if(!statusSelecionado){

        alert(
            'Selecione um status.'
        );

        selectStatus.focus();

        return;

    }

    const statusAnterior =
        selectStatus.dataset.statusAnterior ||
        '';

    botao.disabled =
        true;

    selectStatus.disabled =
        true;

    try{

        const response =
            await fetch(
                `/api/investimentos-comerciais/${codigoInvestimento}/status`,
                {
                    method:
                        'PUT',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            status:
                                statusSelecionado
                        })
                }
            );

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        if(
            !contentType.includes(
                'application/json'
            )
        ){

            const respostaTexto =
                await response.text();

            throw new Error(
                respostaTexto ||
                'O servidor não retornou uma resposta JSON.'
            );

        }

        const resultado =
            await response.json();

        if(!response.ok){

            throw new Error(
                resultado.mensagem ||
                resultado.error ||
                'Erro ao atualizar o investimento.'
            );

        }

        selectStatus.dataset.statusAnterior =
            statusSelecionado;

        const statusAtual =
            linha.querySelector(
                '.status-atual-investimento'
            );

        if(statusAtual){

            statusAtual.textContent =
                formatarStatusInvestimento(
                    statusSelecionado
                );

        }

        aplicarCorStatus(
            linha,
            statusSelecionado
        );

        const investimentoLocal =
            investimentosOriginais.find(
                investimento => {

                    return (
                        Number(
                            investimento.codigoInvestimento
                        ) ===
                        Number(
                            codigoInvestimento
                        )
                    );

                }
            );

        if(investimentoLocal){

            investimentoLocal.status =
                statusSelecionado;

        }

        alert(
            'Status atualizado com sucesso.'
        );

    }catch(error){

        console.error(
            'Erro ao salvar investimento:',
            error
        );

        if(statusAnterior){

            selectStatus.value =
                statusAnterior;

        }

        alert(
            error.message ||
            'Erro ao atualizar o investimento.'
        );

    }finally{

        botao.disabled =
            false;

        if(!window.isRepresentante){

            selectStatus.disabled =
                false;

        }

    }

}


function exportarInvestimentosExcel(){

    const linhas =
        [];

    investimentosOriginais.forEach(
        investimento => {

            const parcelas =
                Array.isArray(
                    investimento.parcelas
                )
                    ? investimento.parcelas
                    : [];

            if(parcelas.length === 0){

                linhas.push(
                    montarLinhaExcel(
                        investimento,
                        null
                    )
                );

                return;

            }

            parcelas.forEach(parcela => {

                linhas.push(
                    montarLinhaExcel(
                        investimento,
                        parcela
                    )
                );

            });

        }
    );

    const planilha =
        XLSX.utils.json_to_sheet(
            linhas
        );

    const arquivo =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        arquivo,
        planilha,
        'Investimentos'
    );

    XLSX.writeFile(
        arquivo,
        'investimentos_comerciais.xlsx'
    );

}

function montarLinhaExcel(
    investimento,
    parcela
){

    return {
        Investimento:
            investimento.codigoInvestimento,

        Cliente:
            investimento.razaoSocial,

        CNPJ:
            formatarCNPJ(
                investimento.cnpj
            ),

        Representante:
            investimento.representante,

        Tipo:
            investimento.tipoInvestimento,

        Descrição:
            investimento.descricaoInvestimento,

        VigênciaInicial:
            investimento.vigenciaInicial,

        VigênciaFinal:
            investimento.vigenciaFinal,

        ValorInvestimento:
            Number(
                investimento.valorInvestimento ||
                0
            ),

        ValorCompra:
            Number(
                investimento.valorCompra ||
                0
            ),

        Percentual:
            Number(
                investimento.investimentoSobreCompra ||
                0
            ),

        Parcela:
            parcela?.parcela || '',

        ValorParcela:
            Number(
                parcela?.valorParcela ||
                0
            ),

        ValorPagamento:
            Number(
                parcela?.valorPagamento ||
                0
            ),

        Status:
            investimento.status
    };

}

function aplicarCorStatus(
    linha,
    status
){

    const statusNormalizado =
        String(status || '')
            .trim()
            .toLowerCase();

    if(statusNormalizado === 'pendente'){

        linha.style.setProperty(
            'background-color',
            'var(--tr-bg-cor-pen)'
        );

        return;

    }

    if(
        statusNormalizado ===
        'aprovacao_comercial'
    ){

        linha.style.setProperty(
            'background-color',
            '#fff3cd'
        );

        return;

    }

    if(
        statusNormalizado ===
        'aprovacao_diretoria'
    ){

        linha.style.setProperty(
            'background-color',
            '#cfe2ff'
        );

        return;

    }

    if(statusNormalizado === 'finalizado'){

        linha.style.setProperty(
            'background-color',
            'var(--tr-bg-cor-fin)'
        );

        return;

    }

    if(statusNormalizado === 'reprovado'){

        linha.style.setProperty(
            'background-color',
            'var(--tr-bg-cor-rep)'
        );

    }

}

function formatarCNPJ(cnpj){

    const numeros =
        String(cnpj || '')
            .replace(/\D/g, '');

    if(numeros.length !== 14){
        return numeros;
    }

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );

}

function formatarMoeda(valor){

    const numero =
        Number(valor || 0);

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );

}

function formatarPercentual(valor){

    const numero =
        Number(valor || 0);

    return numero.toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + '%';

}

function escaparHtml(valor){

    const elemento =
        document.createElement(
            'div'
        );

    elemento.textContent =
        String(valor ?? '');

    return elemento.innerHTML;

}

function mostrarMensagem(
    mensagem,
    tipo
){

    const elemento =
        document.getElementById(
            'mensagemPainel'
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        mensagem;

    elemento.style.display =
        'block';

    elemento.style.color =
        tipo === 'erro'
            ? '#b00020'
            : '#333333';

}

function ocultarMensagem(){

    const elemento =
        document.getElementById(
            'mensagemPainel'
        );

    if(elemento){

        elemento.style.display =
            'none';

    }

}

function abrirDetalhesInvestimento(
    codigoInvestimento
){

    const codigo =
        Number(
            codigoInvestimento
        );

    if(!Number.isInteger(codigo)){

        alert(
            'Código de investimento inválido.'
        );

        return;

    }

    const url =
        `/investDetalhe.html?id=${encodeURIComponent(codigo)}`;

    window.open(
        url,
        '_blank',
        'noopener,noreferrer'
    );

}

