let representanteCarregado =
    false;

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        configurarCampoCNPJ();

        configurarValoresInvestimento();

        configurarTabelaParcelas();

        await carregarRepresentanteDaSessao();
        
        configurarCampoTelefone();

    }
);
function validarCNPJBasico(valor){

    const numeros =
        String(valor || '')
            .replace(/\D/g, '');

    if(numeros.length !== 14){
        return false;
    }

    if(/^(\d)\1{13}$/.test(numeros)){
        return false;
    }

    return true;

}
function formatarCNPJInvestimento(valor){

    const numeros =
        String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 14);

    let formatado =
        numeros;

    if(numeros.length > 2){

        formatado =
            numeros.replace(
                /^(\d{2})(\d+)/,
                '$1.$2'
            );

    }

    if(numeros.length > 5){

        formatado =
            formatado.replace(
                /^(\d{2})\.(\d{3})(\d+)/,
                '$1.$2.$3'
            );

    }

    if(numeros.length > 8){

        formatado =
            formatado.replace(
                /^(\d{2})\.(\d{3})\.(\d{3})(\d+)/,
                '$1.$2.$3/$4'
            );

    }

    if(numeros.length > 12){

        formatado =
            formatado.replace(
                /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d+)/,
                '$1.$2.$3/$4-$5'
            );

    }

    return formatado;

}

function configurarCampoCNPJ(){

    const campoCNPJ =
        document.getElementById(
            'cnpj'
        );

    if(!campoCNPJ){
        return;
    }

    campoCNPJ.type =
        'text';

    campoCNPJ.inputMode =
        'numeric';

    campoCNPJ.maxLength =
        18;

    campoCNPJ.autocomplete =
        'off';

    campoCNPJ.addEventListener(
        'input',
        () => {

            campoCNPJ.value =
                formatarCNPJInvestimento(
                    campoCNPJ.value
                );

        }
    );

    campoCNPJ.addEventListener(
        'paste',
        evento => {

            evento.preventDefault();

            const textoColado =
                evento.clipboardData
                    ?.getData('text') || '';

            campoCNPJ.value =
                formatarCNPJInvestimento(
                    textoColado
                );

            campoCNPJ.dispatchEvent(
                new Event(
                    'input',
                    {
                        bubbles: true
                    }
                )
            );

        }
    );

}
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

        // campoRepresentante.focus();

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

    const campoValorInvestimento =
        document.getElementById(
            'valor_investimento'
        );

    const campoValorCompra =
        document.getElementById(
            'valor_total'
        );

    if(campoValorInvestimento){

        campoValorInvestimento.readOnly =
            true;

        campoValorInvestimento.tabIndex =
            -1;

        campoValorInvestimento.value =
            numeroParaMoedaBR(0);

    }

    if(campoValorCompra){

        campoValorCompra.inputMode =
            'decimal';

        campoValorCompra.addEventListener(
            'input',
            calcularPercentualInvestimento
        );

        campoValorCompra.addEventListener(
            'blur',
            () => {

                formatarCampoMoeda(
                    campoValorCompra
                );

                calcularPercentualInvestimento();

            }
        );

    }

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

function atualizarValorInvestimentoPelasParcelas(){

    const camposParcelas =
        document.querySelectorAll(
            '#investment-table-body .valor-parcela'
        );

    let valorTotalInvestimento =
        0;

    camposParcelas.forEach(campo => {

        valorTotalInvestimento +=
            moedaBRParaNumero(
                campo.value
            );

    });

    const campoValorInvestimento =
        document.getElementById(
            'valor_investimento'
        );

    if(!campoValorInvestimento){
        return;
    }

    campoValorInvestimento.value =
        numeroParaMoedaBR(
            valorTotalInvestimento
        );

    calcularPercentualInvestimento();

}

function configurarCampoMoedaParcela(campo){

    if(!campo){
        return;
    }

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
        'input',
        () => {

            atualizarValorInvestimentoPelasParcelas();

        }
    );

    campo.addEventListener(
        'blur',
        () => {

            formatarCampoMoeda(
                campo
            );

            atualizarValorInvestimentoPelasParcelas();

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

    if(linhas.length === 1){

        linha
            .querySelectorAll(
                'input'
            )
            .forEach(
                (campo, indice) => {

                    if(indice === 0){
                        return;
                    }

                    campo.value =
                        '';

                }
            );

        atualizarNumeracaoParcelas();

        atualizarValorInvestimentoPelasParcelas();

        return;

    }

    linha.remove();

    atualizarNumeracaoParcelas();

    atualizarValorInvestimentoPelasParcelas();

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

async function buscarDadosCliente() {
    const campoCnpj =
        document.getElementById('cnpj');

    const cnpj =
        campoCnpj.value.replace(/\D/g, '');

    if (cnpj.length !== 14) {
        return;
    }

    try {
        const response = await fetch(
            `/cliente/${cnpj}`
        );

        if (!response.ok) {
            throw new Error(
                'Erro ao consultar cliente'
            );
        }

        const cliente =
            await response.json();

        document.getElementById(
            'cliente'
        ).value =
            cliente.razaoSocial || '';

        document.getElementById(
            'endereco'
        ).value =
            cliente.endereco || '';

        document.getElementById(
            'telefone'
        ).value =
            cliente.telefone || '';
    } catch (error) {
        console.error(
            'Erro ao buscar cliente:',
            error
        );
    }
}

document
    .getElementById('cnpj')
    .addEventListener(
        'blur',
        buscarDadosCliente
    );


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


        const valorParcela =
            moedaBRParaNumero(
                campoValorParcela?.value
            );


        if(
            valorParcela <= 0
        ){

            alert(
                `Preencha o valor da parcela ${indice + 1}.`
            );

            if(valorParcela <= 0){

                campoValorParcela?.focus();

            }

            return false;

        }

    }

    return true;

}

function formatarTelefone(valor){

    const numeros =
        String(valor || '')
            .replace(/\D/g, '')
            .slice(0, 11);

    if(numeros.length === 0){
        return '';
    }

    if(numeros.length <= 2){

        return numeros.replace(
            /^(\d{0,2})$/,
            '($1'
        );

    }

    if(numeros.length <= 6){

        return numeros.replace(
            /^(\d{2})(\d{0,4})$/,
            '($1) $2'
        );

    }

    if(numeros.length <= 10){

        return numeros.replace(
            /^(\d{2})(\d{4})(\d{0,4})$/,
            '($1) $2-$3'
        );

    }

    return numeros.replace(
        /^(\d{2})(\d{5})(\d{0,4})$/,
        '($1) $2-$3'
    );

}

function configurarCampoTelefone(){

    const campoTelefone =
        document.getElementById(
            'telefone'
        );

    if(!campoTelefone){
        return;
    }

    campoTelefone.type =
        'text';

    campoTelefone.inputMode =
        'numeric';

    campoTelefone.maxLength =
        15;

    campoTelefone.autocomplete =
        'tel';

    campoTelefone.placeholder =
        '(00) 00000-0000';

    campoTelefone.readOnly =
        false;

    campoTelefone.disabled =
        false;

    campoTelefone.addEventListener(
        'input',
        () => {

            campoTelefone.value =
                formatarTelefone(
                    campoTelefone.value
                );

        }
    );

    campoTelefone.addEventListener(
        'paste',
        evento => {

            evento.preventDefault();

            const textoColado =
                evento.clipboardData
                    ?.getData('text') || '';

            campoTelefone.value =
                formatarTelefone(
                    textoColado
                );

        }
    );

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
    atualizarValorInvestimentoPelasParcelas();
    
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
atualizarValorInvestimentoPelasParcelas();
}

function somarValoresParcelas(){

    return Array
        .from(
            document.querySelectorAll(
                '#investment-table-body .valor-parcela'
            )
        )
        .reduce(
            (total, campo) => {

                return (
                    total +
                    moedaBRParaNumero(
                        campo.value
                    )
                );

            },
            0
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



            const parcela =
                campoParcela
                    ?.value
                    .trim() || '';

            const valorParcela =
                moedaBRParaNumero(
                    campoValorParcela
                        ?.value
                );



            /*
             * A numeração 1/1, 1/2 etc. não deve
             * fazer uma linha vazia ser enviada.
             */
            const linhaPreenchida =
                valorParcela > 0

            if(!linhaPreenchida){
                return;
            }

            parcelas.push({

                parcela:
                    parcela,

                valorParcela:
                    valorParcela,

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
                somarValoresParcelas(),

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

        if(
        !validarCNPJBasico(
                dados.cnpjInvestimento
            )
        ){

            alert(
                'Informe um CNPJ com 14 números.'
            );

            const campoCNPJ =
                document.getElementById(
                    'cnpj'
                );

            campoCNPJ?.focus();

            campoCNPJ?.select();

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
        return true;

    };