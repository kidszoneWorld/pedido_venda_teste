let representanteCarregado =
    false;

document.addEventListener(
    'DOMContentLoaded',
    async () => {
        fetch('/session-data')
            .then(response => response.json())
            .then(console.log);

        configurarValoresInvestimento();

        configurarTabelaParcelas();

        await carregarRepresentanteDaSessao();

    }
);

function obterValorCampo(id){

    const campo =
        document.getElementById(
            id
        );

    return campo
        ? campo.value.trim()
        : '';

}

async function carregarRepresentanteDaSessao(){

    const campoRepresentante =
        document.getElementById(
            'representante'
        );

    if(!campoRepresentante){

        console.error(
            'Campo #representante não encontrado.'
        );

        return false;

    }

    representanteCarregado =
        false;

    campoRepresentante.value =
        'Carregando representante...';

    campoRepresentante.readOnly =
        true;

    try{

        const response =
            await fetch(
                '/session-data',
                {
                    method:
                        'GET',

                    credentials:
                        'same-origin',

                    headers: {
                        Accept:
                            'application/json'
                    }
                }
            );

        const resultado =
            await response.json();

        if(!response.ok){

            throw new Error(
                resultado.mensagem ||
                'Não foi possível consultar a sessão.'
            );

        }

        const numero =
            resultado.userNumero ||
            resultado.user?.numero ||
            '';

        const nome =
            resultado.userNome ||
            resultado.user?.nome ||
            '';

        if(numero){

            campoRepresentante.value =
                nome
                    ? `${numero} - ${nome}`
                    : String(numero);

            campoRepresentante.dataset.numero =
                String(numero);

            campoRepresentante.dataset.nome =
                String(nome);

            campoRepresentante.dataset.origem =
                'sessao';

            campoRepresentante.readOnly =
                true;

            representanteCarregado =
                true;

            return true;

        }

        campoRepresentante.value =
            nome || '';

        campoRepresentante.dataset.numero =
            '';

        campoRepresentante.dataset.nome =
            String(nome);

        campoRepresentante.dataset.origem =
            'manual';

        campoRepresentante.readOnly =
            false;

        campoRepresentante.placeholder =
            'Digite o representante responsável';

        representanteCarregado =
            true;

        campoRepresentante.focus();

        return true;

    }catch(error){

        console.error(
            'Erro ao carregar representante:',
            error
        );

        campoRepresentante.value =
            '';

        campoRepresentante.dataset.numero =
            '';

        campoRepresentante.dataset.nome =
            '';

        campoRepresentante.dataset.origem =
            'manual';

        campoRepresentante.readOnly =
            false;

        campoRepresentante.placeholder =
            'Digite o representante responsável';

        representanteCarregado =
            true;

        campoRepresentante.focus();

        return true;

    }

}

function moedaBRParaNumero(valor){

    if(
        valor === null ||
        valor === undefined ||
        valor === ''
    ){
        return 0;
    }

    const normalizado =
        String(valor)
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(/\./g, '')
            .replace(',', '.');

    const numero =
        Number(
            normalizado
        );

    return Number.isFinite(numero)
        ? numero
        : 0;

}

function percentualBRParaNumero(valor){

    if(!valor){
        return 0;
    }

    const numero =
        Number(
            String(valor)
                .replace('%', '')
                .replace(/\./g, '')
                .replace(',', '.')
                .trim()
        );

    return Number.isFinite(numero)
        ? numero
        : 0;

}

function numeroParaMoedaBR(valor){

    const numero =
        Number(valor || 0);

    return numero.toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );

}

function formatarCampoMoeda(campo){

    if(
        !campo ||
        !campo.value.trim()
    ){
        return;
    }

    campo.value =
        numeroParaMoedaBR(
            moedaBRParaNumero(
                campo.value
            )
        );

}

function percentualBRParaNumero(valor){

    if(!valor){
        return 0;
    }

    const numero =
        Number(
            String(valor)
                .replace('%', '')
                .replace(/\./g, '')
                .replace(',', '.')
                .trim()
        );

    return Number.isFinite(numero)
        ? numero
        : 0;

}

function calcularPercentualInvestimento(){

    const valorInvestimento =
        moedaBRParaNumero(
            obterValorCampo(
                'valor_investimento'
            )
        );

    const valorCompra =
        moedaBRParaNumero(
            obterValorCampo(
                'valor_total'
            )
        );

    const campoPercentual =
        document.getElementById(
            'percentual_investimento'
        );

    if(!campoPercentual){
        return;
    }

    if(valorCompra <= 0){

        campoPercentual.value =
            '';

        return;

    }

    const percentual =
        (
            valorInvestimento /
            valorCompra
        ) * 100;

    campoPercentual.value =
        percentual.toLocaleString(
            'pt-BR',
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ) + '%';

}

function configurarValoresInvestimento(){

    const idsCampos = [
        'valor_investimento',
        'valor_total'
    ];

    idsCampos.forEach(id => {

        const campo =
            document.getElementById(
                id
            );

        if(!campo){
            return;
        }

        campo.inputMode =
            'decimal';

        campo.addEventListener(
            'input',
            calcularPercentualInvestimento
        );

        campo.addEventListener(
            'blur',
            () => {

                formatarCampoMoeda(
                    campo
                );

                calcularPercentualInvestimento();

            }
        );

    });

}

function atualizarNumeracaoParcelas(){

    const linhas =
        Array.from(
            document.querySelectorAll(
                '#investment-table-body .linha-parcela'
            )
        );

    const totalLinhas =
        linhas.length;

    linhas.forEach(
        (linha, indice) => {

            const campoParcela =
                linha.querySelector(
                    '.numero-parcela'
                );

            if(!campoParcela){
                return;
            }

            campoParcela.value =
                `${indice + 1}/${totalLinhas}`;

        }
    );

}

function configurarCampoMoedaParcela(campo){

    if(!campo){
        return;
    }

    /*
     * Evita registrar os mesmos eventos
     * mais de uma vez no mesmo campo.
     */
    if(
        campo.dataset.moedaConfigurada ===
        'true'
    ){
        return;
    }

    campo.dataset.moedaConfigurada =
        'true';

    campo.inputMode =
        'decimal';

    campo.addEventListener(
        'blur',
        () => {

            formatarCampoMoeda(
                campo
            );

        }
    );

    campo.addEventListener(
        'focus',
        () => {

            campo.select();

        }
    );

}

function removerLinhaParcela(linha){

    const tbody =
        document.getElementById(
            'investment-table-body'
        );

    if(!tbody || !linha){
        return;
    }

    const linhas =
        tbody.querySelectorAll(
            '.linha-parcela'
        );

    /*
     * Sempre mantém pelo menos uma linha
     * de parcela na tabela.
     */
    if(linhas.length === 1){

        linha
            .querySelectorAll(
                'input'
            )
            .forEach(
                (campo, indice) => {

                    /*
                     * O primeiro campo é a numeração
                     * automática da parcela.
                     */
                    if(indice === 0){
                        return;
                    }

                    campo.value =
                        '';

                }
            );

        atualizarNumeracaoParcelas();

        return;

    }

    linha.remove();

    atualizarNumeracaoParcelas();

}

function configurarLinhaParcela(linha){

    if(!linha){
        return;
    }

    linha.classList.add(
        'linha-parcela'
    );

    const campoNumeroParcela =
        linha.querySelector(
            '.numero-parcela'
        );

    const campoValorParcela =
        linha.querySelector(
            '.valor-parcela'
        );

    const campoValorPagamento =
        linha.querySelector(
            '.valor-pagamento'
        );

    const botaoRemover =
        linha.querySelector(
            '.remover-parcela'
        );

    if(campoNumeroParcela){

        campoNumeroParcela.readOnly =
            true;

        campoNumeroParcela.tabIndex =
            -1;

    }

    configurarCampoMoedaParcela(
        campoValorParcela
    );

    configurarCampoMoedaParcela(
        campoValorPagamento
    );

    if(
        botaoRemover &&
        botaoRemover.dataset.configurado !==
            'true'
    ){

        botaoRemover.dataset.configurado =
            'true';

        botaoRemover.addEventListener(
            'click',
            () => {

                removerLinhaParcela(
                    linha
                );

            }
        );

    }

}

function validarParcelasInvestimento(){

    const linhas =
        document.querySelectorAll(
            '#investment-table-body .linha-parcela'
        );

    for(
        let indice = 0;
        indice < linhas.length;
        indice++
    ){

        const linha =
            linhas[indice];

        const campoValorParcela =
            linha.querySelector(
                '.valor-parcela'
            );

        const campoValorPagamento =
            linha.querySelector(
                '.valor-pagamento'
            );

        const valorParcela =
            moedaBRParaNumero(
                campoValorParcela?.value
            );

        const valorPagamento =
            moedaBRParaNumero(
                campoValorPagamento?.value
            );

        if(
            valorParcela <= 0 ||
            valorPagamento <= 0
        ){

            alert(
                `Preencha o valor e o pagamento da parcela ${indice + 1}.`
            );

            if(valorParcela <= 0){

                campoValorParcela?.focus();

            }else{

                campoValorPagamento?.focus();

            }

            return false;

        }

    }

    return true;

}

function criarLinhaParcela(){

    const tbody =
        document.getElementById(
            'investment-table-body'
        );

    if(!tbody){

        console.error(
            'Tabela de parcelas não encontrada.'
        );

        return null;

    }

    const linha =
        document.createElement(
            'tr'
        );

    linha.classList.add(
        'linha-parcela'
    );

    linha.innerHTML = `
        <td class="parcela">
            <input
                type="text"
                class="numero-parcela"
                readonly
                tabindex="-1"
            >
        </td>

        <td class="valor">
            <input
                type="text"
                class="valor-parcela"
                placeholder="Valor"
                inputmode="decimal"
            >
        </td>

        <td class="valor-pago">
            <input
                type="text"
                class="valor-pagamento"
                placeholder="Pagamento"
                inputmode="decimal"
            >
        </td>

        <td class="coluna-remover-parcela no-print">
            <button
                type="button"
                class="remover-parcela"
            >
                Remover
            </button>
        </td>
    `;

    tbody.appendChild(
        linha
    );

    configurarLinhaParcela(
        linha
    );

    atualizarNumeracaoParcelas();

    const campoValor =
        linha.querySelector(
            '.valor-parcela'
        );

    campoValor?.focus();

    return linha;

}

function configurarTabelaParcelas(){

    const tbody =
        document.getElementById(
            'investment-table-body'
        );

    if(!tbody){

        console.error(
            'Elemento #investment-table-body não encontrado.'
        );

        return;

    }

    /*
     * Compatibilidade com a primeira linha existente
     * no HTML, mesmo que ainda não tenha as classes.
     */
    tbody
        .querySelectorAll(
            'tr'
        )
        .forEach(linha => {

            linha.classList.add(
                'linha-parcela'
            );

            const inputs =
                linha.querySelectorAll(
                    'input'
                );

            if(inputs[0]){

                inputs[0].classList.add(
                    'numero-parcela'
                );

                inputs[0].readOnly =
                    true;

                inputs[0].tabIndex =
                    -1;

            }

            if(inputs[1]){

                inputs[1].classList.add(
                    'valor-parcela'
                );

            }

            if(inputs[2]){

                inputs[2].classList.add(
                    'valor-pagamento'
                );

            }

            /*
             * Cria o botão da primeira linha caso
             * ainda não exista no HTML.
             */
            let botaoRemover =
                linha.querySelector(
                    '.remover-parcela'
                );

            if(!botaoRemover){

                const celulaRemover =
                    document.createElement(
                        'td'
                    );

                celulaRemover.classList.add(
                    'coluna-remover-parcela',
                    'no-print'
                );

                botaoRemover =
                    document.createElement(
                        'button'
                    );

                botaoRemover.type =
                    'button';

                botaoRemover.classList.add(
                    'remover-parcela'
                );

                botaoRemover.textContent =
                    'Remover';

                celulaRemover.appendChild(
                    botaoRemover
                );

                linha.appendChild(
                    celulaRemover
                );

            }

            configurarLinhaParcela(
                linha
            );

        });

    atualizarNumeracaoParcelas();

    const botaoAdicionar =
        document.getElementById(
            'adicionarLinhaInvestimento'
        );

    if(!botaoAdicionar){

        console.error(
            'Botão #adicionarLinhaInvestimento não encontrado.'
        );

        return;

    }

    if(
        botaoAdicionar.dataset.configurado ===
        'true'
    ){
        return;
    }

    botaoAdicionar.dataset.configurado =
        'true';

    botaoAdicionar.addEventListener(
        'click',
        criarLinhaParcela
    );

}

function montarParcelasInvestimento(){

    const parcelas =
        [];

    document
        .querySelectorAll(
            '#investment-table-body .linha-parcela'
        )
        .forEach(linha => {

            const campoParcela =
                linha.querySelector(
                    '.numero-parcela'
                );

            const campoValorParcela =
                linha.querySelector(
                    '.valor-parcela'
                );

            const campoValorPagamento =
                linha.querySelector(
                    '.valor-pagamento'
                );

            const parcela =
                campoParcela
                    ?.value
                    .trim() || '';

            const valorParcela =
                moedaBRParaNumero(
                    campoValorParcela
                        ?.value
                );

            const valorPagamento =
                moedaBRParaNumero(
                    campoValorPagamento
                        ?.value
                );

            /*
             * A numeração 1/1, 1/2 etc. não deve
             * fazer uma linha vazia ser enviada.
             */
            const linhaPreenchida =
                valorParcela > 0 ||
                valorPagamento > 0;

            if(!linhaPreenchida){
                return;
            }

            parcelas.push({

                parcela:
                    parcela,

                valorParcela:
                    valorParcela,

                valorPagamento:
                    valorPagamento

            });

        });

    return parcelas;

}

window.montarDadosInvestimentoComercial =
    function(){

        return {

            cnpjInvestimento:
                obterValorCampo(
                    'cnpj'
                ),

            enderecoInvestimento:
                obterValorCampo(
                    'endereco'
                ),

            razaoSocialInvestimento:
                obterValorCampo(
                    'cliente'
                ),

            telefoneInvestimento:
                obterValorCampo(
                    'telefone'
                ),

            responsavelInvestimento:
                obterValorCampo(
                    'responsavel'
                ),

            cargoInvestimento:
                obterValorCampo(
                    'cargo'
                ),

            resumoInvestimento:
                obterValorCampo(
                    'acaoSolicita'
                ),

            vigenciaInicialInvestimento:
                obterValorCampo(
                    'vigencia_inicial'
                ),

            vigenciaFinalInvestimento:
                obterValorCampo(
                    'vigencia_final'
                ),

            tipoInvestimento:
                obterValorCampo(
                    'tipoInvestimento'
                ),

            descricaoInvestimento:
                obterValorCampo(
                    'descricaoInvestimento'
                ),

            observacaoDescricaoInvestimento:
                obterValorCampo(
                    'observacaoDescricaoInvestimento'
                ),

            valorInvestimento:
                moedaBRParaNumero(
                    obterValorCampo(
                        'valor_investimento'
                    )
                ),

            valorCompraInvestimento:
                moedaBRParaNumero(
                    obterValorCampo(
                        'valor_total'
                    )
                ),

            /*
             * O valor será exibido no HTML,
             * mas o backend usará a sessão.
             */
            representanteInvestimento:
                obterValorCampo(
                    'representante'
                ),

            statusInvestimento:
                'pendente',

            observacaoInvestimento:
                obterValorCampo(
                    'observacoes'
                ),

            investimentoSobreCompra:
                percentualBRParaNumero(
                    obterValorCampo(
                        'percentual_investimento'
                    )
                ),

            parcelas:
                montarParcelasInvestimento()

        };

    };

window.validarDadosInvestimentoComercial =
    function(dados){
        if(!validarParcelasInvestimento()){
            return false;
        }
        if(!dados.razaoSocialInvestimento){

            alert(
                'Informe o cliente.'
            );

            document
                .getElementById(
                    'cliente'
                )
                ?.focus();

            return false;

        }

        if(!dados.cnpjInvestimento){

            alert(
                'Informe o CNPJ.'
            );

            document
                .getElementById(
                    'cnpj'
                )
                ?.focus();

            return false;

        }

        if(!dados.responsavelInvestimento){

            alert(
                'Informe o responsável.'
            );

            document
                .getElementById(
                    'responsavel'
                )
                ?.focus();

            return false;

        }

        if(
            !dados.representanteInvestimento ||
            !dados.representanteInvestimento.trim()
        ){

            alert(
                'Informe o representante responsável.'
            );

            const campoRepresentante =
                document.getElementById(
                    'representante'
                );

            campoRepresentante.readOnly =
                false;

            campoRepresentante.focus();

            return false;

        }

        if(dados.valorInvestimento <= 0){

            alert(
                'Informe o valor do investimento.'
            );

            document
                .getElementById(
                    'valor_investimento'
                )
                ?.focus();

            return false;

        }
        if(!validarParcelasInvestimento()){
            return false;
        }
        return true;

    };