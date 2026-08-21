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

        return;

    }

    campoRepresentante.value =
        'Carregando representante...';

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

        if(
            !response.ok ||
            !resultado.sucesso
        ){

            throw new Error(
                resultado.mensagem ||
                'Não foi possível consultar a sessão.'
            );

        }

        const numero =
            resultado.userNumero;

        const nome =
            resultado.userNome;

        if(!numero || !nome){

            throw new Error(
                'Número ou nome do representante não encontrado na sessão.'
            );

        }

        campoRepresentante.value =
            `${numero} - ${nome}`;

        campoRepresentante.dataset.numero =
            String(numero);

        campoRepresentante.dataset.nome =
            String(nome);

        campoRepresentante.readOnly =
            true;

        representanteCarregado = true;
    }catch(error){

        console.error(
            'Erro ao carregar representante:',
            error
        );

        campoRepresentante.value =
            '';

        alert(
            'Não foi possível identificar o representante. Entre novamente no sistema.'
        );

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
        Number(normalizado);

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

function configurarLinhaParcela(linha){

    if(!linha){
        return;
    }

    const inputs =
        linha.querySelectorAll(
            'input'
        );

    const campoValorParcela =
        inputs[1];

    const campoValorPagamento =
        inputs[2];

    [
        campoValorParcela,
        campoValorPagamento
    ].forEach(campo => {

        if(!campo){
            return;
        }

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

    });

}

function configurarTabelaParcelas(){

    document
        .querySelectorAll(
            '#investment-table-body tr'
        )
        .forEach(
            configurarLinhaParcela
        );

    const botaoAdicionar =
        document.getElementById(
            'adicionarLinhaInvestimento'
        );

    if(botaoAdicionar){

        botaoAdicionar.addEventListener(
            'click',
            () => {

                setTimeout(
                    () => {

                        const linhas =
                            document.querySelectorAll(
                                '#investment-table-body tr'
                            );

                        configurarLinhaParcela(
                            linhas[
                                linhas.length - 1
                            ]
                        );

                    },
                    0
                );

            }
        );

    }

}

function montarParcelasInvestimento(){

    const parcelas =
        [];

    document
        .querySelectorAll(
            '#investment-table-body tr'
        )
        .forEach(linha => {

            const inputs =
                linha.querySelectorAll(
                    'input'
                );

            const parcela =
                inputs[0]?.value.trim() ||
                '';

            const valorParcela =
                moedaBRParaNumero(
                    inputs[1]?.value
                );

            const valorPagamento =
                moedaBRParaNumero(
                    inputs[2]?.value
                );

            const linhaPreenchida =
                parcela ||
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

        if(!dados.representanteInvestimento){

            alert(
                'Representante não identificado na sessão.'
            );

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