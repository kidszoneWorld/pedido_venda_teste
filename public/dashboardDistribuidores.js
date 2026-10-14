document.addEventListener('DOMContentLoaded', () => {
    const estado = {
        distribuidores: [],
        selecionados: new Set(),
        graficos: {}
    };

    const listaDistribuidores = document.getElementById(
        'listaSelecaoDistribuidores'
    );

    const pesquisaDistribuidor = document.getElementById(
        'pesquisaDistribuidor'
    );

    const mensagemDashboard = document.getElementById(
        'mensagemDashboard'
    );

    const periodoInicial = document.getElementById(
        'periodoInicial'
    );

    const periodoFinal = document.getElementById(
        'periodoFinal'
    );

    const periodoSelecionado = document.getElementById(
        'periodoSelecionado'
    );

    const informar = (mensagem, tipo = '') => {
        mensagemDashboard.textContent = mensagem;
        mensagemDashboard.className =
            `mensagem-dashboard ${tipo}`.trim();
    };

    const formatarMoeda = (valor) =>
        Number(valor || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

    const formatarNumero = (valor) =>
        Number(valor || 0).toLocaleString('pt-BR');

    const formatarPercentual = (valor) =>
        `${Number(valor || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%`;

    function obterCodigo(distribuidor) {
        return Number(
            distribuidor.CodigoDistribuidor ??
            distribuidor.codigoDistribuidor
        );
    }

    function obterNome(distribuidor) {
        return (
            distribuidor.RazaoSocial ??
            distribuidor.razaoSocial ??
            'Distribuidor sem nome'
        );
    }

    

    function montarListaDistribuidores() {
        const pesquisa =
            pesquisaDistribuidor.value
                .trim()
                .toLowerCase();

        const distribuidoresFiltrados =
            estado.distribuidores.filter((distribuidor) =>
                obterNome(distribuidor)
                    .toLowerCase()
                    .includes(pesquisa)
            );

        listaDistribuidores.innerHTML = '';

        if (distribuidoresFiltrados.length === 0) {
            listaDistribuidores.innerHTML =
                '<p>Nenhum distribuidor encontrado.</p>';

            return;
        }

        distribuidoresFiltrados.forEach((distribuidor) => {
            const codigo = obterCodigo(distribuidor);
            const nome = obterNome(distribuidor);

            const label = document.createElement('label');
            label.className = 'distribuidor-checkbox';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = codigo;
            checkbox.checked =
                estado.selecionados.has(codigo);

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    estado.selecionados.add(codigo);
                } else {
                    estado.selecionados.delete(codigo);
                }

                salvarSelecaoLocal();
                carregarDadosDashboard();
            });

            const conteudo = document.createElement('span');

            const representante =
                distribuidor.Representante ||
                distribuidor.representante ||
                'Sem representante';

            conteudo.textContent =
                `${nome} | Representante: ${representante}`;

            label.appendChild(checkbox);
            label.appendChild(conteudo);

            listaDistribuidores.appendChild(label);
        });
    }

    function salvarSelecaoLocal() {
        localStorage.setItem(
            'dashboardDistribuidoresSelecionados',
            JSON.stringify(
                Array.from(estado.selecionados)
            )
        );
    }

    function recuperarSelecaoLocal() {
        try {
            const salvo = JSON.parse(
                localStorage.getItem(
                    'dashboardDistribuidoresSelecionados'
                ) || '[]'
            );

            if (!Array.isArray(salvo)) {
                return [];
            }

            return salvo
                .map(Number)
                .filter(Number.isInteger);
        } catch (error) {
            console.error(
                'Erro ao recuperar seleção:',
                error
            );

            return [];
        }
    }
    function obterMesAtual() {
        const hoje = new Date();

        const ano = hoje.getFullYear();

        const mes = String(
            hoje.getMonth() + 1
        ).padStart(2, '0');

        return `${ano}-${mes}`;
    }

    function obterPrimeiroMesDoAno() {
        const anoAtual = new Date().getFullYear();

        return `${anoAtual}-01`;
    }

    function converterMesParaBanco(valor) {
        if (!valor) {
            return '';
        }

        const partes = valor.split('-');

        if (partes.length !== 2) {
            return '';
        }

        const [ano, mes] = partes;

        return `${mes}/${ano}`;
    }

    function formatarPeriodoExibicao(valor) {
        if (!valor) {
            return '';
        }

        const [ano, mes] = valor.split('-');

        return `${mes}/${ano}`;
    }

    function periodoValido() {
        const inicio = periodoInicial.value;
        const fim = periodoFinal.value;

        if (!inicio && !fim) {
            return true;
        }

        if (!inicio || !fim) {
            informar(
                'Preencha o mês inicial e o mês final.',
                'aviso'
            );

            return false;
        }

        /*
        * O formato AAAA-MM pode ser comparado diretamente,
        * porque começa pelo ano e depois pelo mês.
        */
        if (inicio > fim) {
            informar(
                'O mês inicial não pode ser maior que o mês final.',
                'aviso'
            );

            return false;
        }

        return true;
    }

    function atualizarTextoPeriodo() {
        const inicio = periodoInicial.value;
        const fim = periodoFinal.value;

        if (!inicio || !fim) {
            periodoSelecionado.textContent =
                'Exibindo todos os períodos.';

            return;
        }

        periodoSelecionado.textContent =
            `Período selecionado: ` +
            `${formatarPeriodoExibicao(inicio)} até ` +
            `${formatarPeriodoExibicao(fim)}.`;
    }

    function salvarPeriodoLocal() {
        localStorage.setItem(
            'dashboardPeriodoInicial',
            periodoInicial.value
        );

        localStorage.setItem(
            'dashboardPeriodoFinal',
            periodoFinal.value
        );
    }

    function carregarPeriodoLocal() {
        const inicioSalvo = localStorage.getItem(
            'dashboardPeriodoInicial'
        );

        const fimSalvo = localStorage.getItem(
            'dashboardPeriodoFinal'
        );

        /*
        * Se ainda não houver filtro salvo, mostra o ano atual.
        * Exemplo: janeiro/2026 até o mês atual de 2026.
        */
        periodoInicial.value =
            inicioSalvo || obterPrimeiroMesDoAno();

        periodoFinal.value =
            fimSalvo || obterMesAtual();

        atualizarTextoPeriodo();
    }
    async function carregarDistribuidores() {
        informar('Carregando distribuidores...');

        try {
            const resposta = await fetch(
                '/api/dashboardDistribuidores/lista'
            );

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {
                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    'Erro ao carregar distribuidores.'
                );
            }

            estado.distribuidores =
                dados.distribuidores || [];

            const codigosPermitidos = new Set(
                estado.distribuidores.map(obterCodigo)
            );

            const selecaoSalva =
                recuperarSelecaoLocal().filter(
                    (codigo) =>
                        codigosPermitidos.has(codigo)
                );

            if (selecaoSalva.length > 0) {
                estado.selecionados =
                    new Set(selecaoSalva);
            } else {
                estado.selecionados = new Set(
                    estado.distribuidores.map(obterCodigo)
                );
            }

            const informacaoRepresentante =
                document.getElementById(
                    'informacaoRepresentante'
                );

            if (dados.representante) {
                informacaoRepresentante.textContent =
                    `Exibindo distribuidores do representante ${dados.representante}.`;
            } else {
                informacaoRepresentante.textContent =
                    'Usuário sem número de representante. Exibindo todos os distribuidores.';
            }

            montarListaDistribuidores();
            salvarSelecaoLocal();

            await carregarDadosDashboard();
        } catch (error) {
            console.error(error);

            informar(error.message, 'erro');

            listaDistribuidores.innerHTML =
                '<p>Não foi possível carregar os distribuidores.</p>';
        }
    }

    async function carregarDadosDashboard() {
        if (estado.selecionados.size === 0) {
            limparDashboard();

            informar(
                'Selecione pelo menos um distribuidor.',
                'aviso'
            );

            return;
        }

        informar('Atualizando indicadores...');

        const codigos = Array.from(
            estado.selecionados
        ).join(',');

        try {
                    if (!periodoValido()) {
            return;
        }

        const inicioBanco = converterMesParaBanco(
            periodoInicial.value
        );

        const fimBanco = converterMesParaBanco(
            periodoFinal.value
        );

        const parametros = new URLSearchParams();

        parametros.set('distribuidores', codigos);

        if (inicioBanco && fimBanco) {
            parametros.set('periodoInicial', inicioBanco);
            parametros.set('periodoFinal', fimBanco);
        }

        const resposta = await fetch(
            `/api/dashboardDistribuidores/dados?${parametros.toString()}`
        );

            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso) {
                throw new Error(
                    dados.mensagem ||
                    dados.erro ||
                    'Erro ao carregar dados.'
                );
            }

            atualizarCards(dados.resumo);
            atualizarGraficos(dados.graficos);
            atualizarTextoPeriodo();
            salvarPeriodoLocal();
            informar(
                `Dashboard atualizado com ${dados.distribuidores.length} distribuidor(es).`,
                'sucesso'
            );
        } catch (error) {
            console.error(error);
            informar(error.message, 'erro');
        }
    }

    function atualizarCards(resumo) {
        document.getElementById(
            'cardDistribuidores'
        ).textContent = formatarNumero(
            resumo.distribuidores
        );

        document.getElementById(
            'cardSellIn'
        ).textContent = formatarMoeda(
            resumo.sellIn
        );

        document.getElementById(
            'cardMetaSellIn'
        ).textContent = formatarMoeda(
            resumo.metaSellIn
        );

        document.getElementById(
            'cardAtingimento'
        ).textContent = formatarPercentual(
            resumo.atingimento
        );

        document.getElementById(
            'cardSellOut'
        ).textContent = formatarNumero(
            resumo.sellOut
        );

        document.getElementById(
            'cardPositivacao'
        ).textContent = formatarNumero(
            resumo.positivacao
        );

        document.getElementById(
            'cardDisplays'
        ).textContent = formatarNumero(
            resumo.displays
        );

        document.getElementById(
            'cardEstoque'
        ).textContent = formatarNumero(
            resumo.estoque
        );

        document.getElementById(
            'cardInvestimentos'
        ).textContent = formatarMoeda(
            resumo.investimentos
        );

        document.getElementById(
            'cardRedes'
        ).textContent = formatarNumero(
            resumo.redes
        );
    }

    function destruirGrafico(nome) {
        if (estado.graficos[nome]) {
            estado.graficos[nome].destroy();
            delete estado.graficos[nome];
        }
    }

    function criarGraficoBarras({
        chave,
        canvasId,
        dados,
        titulo,
        cor = '#2563eb',
        moeda = false
    }) {
        destruirGrafico(chave);

        const canvas = document.getElementById(canvasId);

        estado.graficos[chave] = new Chart(canvas, {
            type: 'bar',

            data: {
                labels: dados.map((item) => item.nome),

                datasets: [{
                    label: titulo,
                    data: dados.map((item) => item.total),
                    backgroundColor: cor,
                    borderColor: cor,
                    borderWidth: 1
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: true
                    },

                    tooltip: {
                        callbacks: {
                            label(contexto) {
                                const valor =
                                    contexto.parsed.y || 0;

                                return moeda
                                    ? formatarMoeda(valor)
                                    : formatarNumero(valor);
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true
                    },

                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    }

    function criarGraficoSellIn(sellIn, metas) {
        destruirGrafico('sellIn');

        const mapaMetas = new Map(
            metas.map((item) => [
                Number(item.codigo),
                Number(item.total) || 0
            ])
        );

        const canvas =
            document.getElementById('graficoSellIn');

        estado.graficos.sellIn = new Chart(canvas, {
            type: 'bar',

            data: {
                labels: sellIn.map((item) => item.nome),

                datasets: [
                    {
                        label: 'Sell In',
                        data: sellIn.map(
                            (item) => item.total
                        ),
                        backgroundColor: '#2563eb'
                    },
                    {
                        label: 'Meta',
                        data: sellIn.map(
                            (item) =>
                                mapaMetas.get(
                                    Number(item.codigo)
                                ) || 0
                        ),
                        backgroundColor: '#f59e0b'
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    tooltip: {
                        callbacks: {
                            label(contexto) {
                                return `${contexto.dataset.label}: ${formatarMoeda(contexto.parsed.y)}`;
                            }
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function atualizarGraficos(graficos) {
        criarGraficoSellIn(
            graficos.sellIn || [],
            graficos.metaSellIn || []
        );

        criarGraficoBarras({
            chave: 'sellOut',
            canvasId: 'graficoSellOut',
            dados: graficos.sellOut || [],
            titulo: 'Sell Out',
            cor: '#16a34a'
        });

        criarGraficoBarras({
            chave: 'positivacao',
            canvasId: 'graficoPositivacao',
            dados: graficos.positivacao || [],
            titulo: 'Positivação',
            cor: '#7c3aed'
        });

        criarGraficoBarras({
            chave: 'displays',
            canvasId: 'graficoDisplays',
            dados: graficos.displays || [],
            titulo: 'Displays',
            cor: '#ea580c'
        });

        criarGraficoBarras({
            chave: 'estoque',
            canvasId: 'graficoEstoque',
            dados: graficos.estoque || [],
            titulo: 'Estoque',
            cor: '#0891b2'
        });

        criarGraficoBarras({
            chave: 'investimentos',
            canvasId: 'graficoInvestimentos',
            dados: graficos.investimentos || [],
            titulo: 'Investimentos',
            cor: '#dc2626',
            moeda: true
        });

        criarGraficoBarras({
            chave: 'redes',
            canvasId: 'graficoRedes',
            dados: graficos.redes || [],
            titulo: 'Redes',
            cor: '#4f46e5'
        });
    }

    function limparDashboard() {
        atualizarCards({
            distribuidores: 0,
            sellIn: 0,
            metaSellIn: 0,
            atingimento: 0,
            sellOut: 0,
            positivacao: 0,
            displays: 0,
            estoque: 0,
            investimentos: 0,
            redes: 0
        });

        Object.keys(estado.graficos).forEach(
            destruirGrafico
        );
    }

    document
        .getElementById('selecionarTodos')
        .addEventListener('click', () => {
            estado.selecionados = new Set(
                estado.distribuidores.map(obterCodigo)
            );

            montarListaDistribuidores();
            salvarSelecaoLocal();
            carregarDadosDashboard();
        });

    document
        .getElementById('limparSelecao')
        .addEventListener('click', () => {
            estado.selecionados.clear();

            montarListaDistribuidores();
            salvarSelecaoLocal();
            limparDashboard();

            informar(
                'Selecione pelo menos um distribuidor.',
                'aviso'
            );
        });

        document
            .getElementById('aplicarPeriodo')
            .addEventListener('click', () => {
                if (!periodoValido()) {
                    return;
                }

                atualizarTextoPeriodo();
                salvarPeriodoLocal();
                carregarDadosDashboard();
            });

        document
            .getElementById('limparPeriodo')
            .addEventListener('click', () => {
                periodoInicial.value = '';
                periodoFinal.value = '';

                localStorage.removeItem(
                    'dashboardPeriodoInicial'
                );

                localStorage.removeItem(
                    'dashboardPeriodoFinal'
                );

                atualizarTextoPeriodo();
                carregarDadosDashboard();
            });

        periodoInicial.addEventListener('change', () => {
            if (
                periodoInicial.value &&
                periodoFinal.value &&
                periodoValido()
            ) {
                atualizarTextoPeriodo();
                salvarPeriodoLocal();
                carregarDadosDashboard();
            }
        });

        periodoFinal.addEventListener('change', () => {
            if (
                periodoInicial.value &&
                periodoFinal.value &&
                periodoValido()
            ) {
                atualizarTextoPeriodo();
                salvarPeriodoLocal();
                carregarDadosDashboard();
            }
        });

    document
        .getElementById('atualizarDashboard')
        .addEventListener(
            'click',
            carregarDadosDashboard
        );

    document
        .getElementById('voltarDistribuidores')
        .addEventListener('click', () => {
            window.location.href = '/distribuidores';
        });

    pesquisaDistribuidor.addEventListener(
        'input',
        montarListaDistribuidores
    );

    document
        .querySelectorAll('.aba-dashboard')
        .forEach((botao) => {
            botao.addEventListener('click', () => {
                const aba = botao.dataset.aba;

                document
                    .querySelectorAll('.aba-dashboard')
                    .forEach((item) =>
                        item.classList.remove('ativa')
                    );

                document
                    .querySelectorAll('.conteudo-aba')
                    .forEach((item) =>
                        item.classList.remove('ativo')
                    );

                botao.classList.add('ativa');

                document
                    .getElementById(`aba-${aba}`)
                    .classList.add('ativo');
            });
        });
    carregarPeriodoLocal();
    carregarDistribuidores();
});