const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();

let isOperador = false;

let tiposInvestimento = [];

document.addEventListener(
    'DOMContentLoaded',
    carregarTela
);

async function carregarTela(){

    const sessionResponse =
    await fetch(
        '/session-data'
    );

    const sessionData =
    await sessionResponse.json();

    isOperador =
        !sessionData.userNumero;

    aplicarPermissaoInvestimento();

    const responseDistribuidor =
    await fetch(
        `/api/distribuidor/${codigoDistribuidor}`
    );

    const distribuidor =
    await responseDistribuidor.json();

    const nomeDistribuidor =
        distribuidor.RazaoSocial ||
        distribuidor[0]?.RazaoSocial ||
        '';

    const tituloDistribuidor =
        document.getElementById(
            'nomeDistribuidorInvestimento'
        );

    if(tituloDistribuidor){

        tituloDistribuidor.textContent =
            nomeDistribuidor;

    }

    await carregarTiposInvestimento();

    const responseInvestimento =
    await fetch(
        `/api/investimentoDistribuidor/${codigoDistribuidor}`
    );

    const investimentos =
    await responseInvestimento.json();

    montarTabela(
        investimentos
    );

    configurarEventosInvestimento();

}

function aplicarPermissaoInvestimento(){

    const btnNovoInvestimento =
        document.getElementById(
            'novoInvestimento'
        );

    const btnCriarTipo =
        document.getElementById(
            'criarTipoInvestimento'
        );

    const btnSalvar =
        document.getElementById(
            'salvarInvestimento'
        );

    if(!isOperador){

        if(btnNovoInvestimento){
            btnNovoInvestimento.style.display = 'none';
        }

        if(btnCriarTipo){
            btnCriarTipo.style.display = 'none';
        }

        if(btnSalvar){
            btnSalvar.style.display = 'none';
        }

    }

}

async function carregarTiposInvestimento(){

    const response =
    await fetch(
        '/api/tiposInvestimento'
    );

    tiposInvestimento =
    await response.json();

    preencherSelectTipoInvestimento();

}

function preencherSelectTipoInvestimento(){

    const select =
        document.getElementById(
            'tipoInvestimento'
        );

    if(!select){
        return;
    }

    select.innerHTML = `
        <option value="">
            Selecione
        </option>
    `;

    tiposInvestimento.forEach(tipo => {

        select.innerHTML += `
            <option value="${tipo.TipoInvestimento}">
                ${tipo.TipoInvestimento}
            </option>
        `;

    });

    select.innerHTML += `
        <option value="Outros">
            Outros
        </option>
    `;

}

function numeroParaMoedaBR(valor){

    if(
        valor === null ||
        valor === undefined ||
        valor === ''
    ){
        return '';
    }

    const numero =
        Number(
            valor
        );

    if(isNaN(numero)){
        return '';
    }

    return numero.toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

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
            .replace(
                'R$',
                ''
            )
            .replace(
                /\./g,
                ''
            )
            .replace(
                ',',
                '.'
            )
            .trim();

    const numero =
        Number(
            normalizado
        );

    return isNaN(numero)
        ? 0
        : numero;

}

function formatarCampoMoedaBR(input){

    if(!input.value){

        input.value =
            '';

        return;

    }

    const numero =
        moedaBRParaNumero(
            input.value
        );

    input.value =
        numeroParaMoedaBR(
            numero
        );

}

function montarTabela(
    investimentos
){

    const tbody =
    document.getElementById(
        'corpoInvestimento'
    );

    tbody.innerHTML = '';

    investimentos.forEach(investimento => {

        tbody.innerHTML += `

            <tr
    class="linhaInvestimento"
    data-id="${investimento.CodigoInvestimento}"
>

    <td class="coluna-tipo-investimento">
        <input
            type="text"
            class="tipoInvestimentoTabela"
            value="${investimento.TipoInvestimento || ''}"
            ${isOperador ? '' : 'readonly'}
        >
    </td>

    <td class="coluna-data-investimento">
        <input
            type="date"
            class="dataInvestimentoTabela"
            value="${formatarDataInput(investimento.DataInvestimento)}"
            ${isOperador ? '' : 'readonly'}
        >
    </td>

    <td class="coluna-valor-investimento">
        <div class="campo-moeda">
            <span>R$</span>
            <input
                type="text"
                inputmode="decimal"
                class="estoque valorInvestimentoTabela"
                value="${
                    investimento.ValorInvestimento
                    ? numeroParaMoedaBR(
                        investimento.ValorInvestimento
                    )
                    : ''
                }"
                ${isOperador ? '' : 'readonly'}
            >
        </div>
    </td>

    <td class="coluna-observacao-investimento">
        <textarea
            class="observacaoInvestimentoTabela"
            ${isOperador ? '' : 'readonly'}
        >${investimento.ObservacaoInvestimento || ''}</textarea>
    </td>

</tr>
        `;

    });

    configurarCalculoTotalInvestimento();

    calcularTotalInvestimento();

}

function configurarEventosInvestimento(){

    const btnNovoInvestimento =
        document.getElementById(
            'novoInvestimento'
        );

    const btnCriarTipo =
        document.getElementById(
            'criarTipoInvestimento'
        );

    const btnFecharModalInvestimento =
        document.getElementById(
            'fecharModalInvestimento'
        );

    const btnFecharModalTipo =
        document.getElementById(
            'fecharModalTipoInvestimento'
        );

    const btnAdicionarInvestimento =
        document.getElementById(
            'adicionarInvestimento'
        );

    const btnSalvarTipo =
        document.getElementById(
            'salvarTipoInvestimento'
        );

    const selectTipo =
        document.getElementById(
            'tipoInvestimento'
        );

    if(btnNovoInvestimento){

        btnNovoInvestimento.onclick =
        () => {

            limparModalInvestimento();

            document
            .getElementById(
                'modalInvestimento'
            )
            .style.display =
                'block';

        };

    }

    if(btnCriarTipo){

        btnCriarTipo.onclick =
        () => {

            document
            .getElementById(
                'novoTipoInvestimento'
            )
            .value = '';

            document
            .getElementById(
                'modalTipoInvestimento'
            )
            .style.display =
                'block';

        };

    }

    if(btnFecharModalInvestimento){

        btnFecharModalInvestimento.onclick =
        () => {

            document
            .getElementById(
                'modalInvestimento'
            )
            .style.display =
                'none';

        };

    }

    if(btnFecharModalTipo){

        btnFecharModalTipo.onclick =
        () => {

            document
            .getElementById(
                'modalTipoInvestimento'
            )
            .style.display =
                'none';

        };

    }

    if(btnAdicionarInvestimento){

        btnAdicionarInvestimento.onclick =
            adicionarInvestimento;

    }

    if(btnSalvarTipo){

        btnSalvarTipo.onclick =
            salvarTipoInvestimento;

    }

    if(selectTipo){

        selectTipo.onchange =
        () => {

            const containerOutro =
                document.getElementById(
                    'containerOutroTipoInvestimento'
                );

            if(selectTipo.value === 'Outros'){

                containerOutro.style.display =
                    'block';

            }else{

                containerOutro.style.display =
                    'none';

            }

        };

    }
    const valorInvestimento =
    document.getElementById(
        'valorInvestimento'
    );

if(valorInvestimento){

    valorInvestimento.type =
        'text';

    valorInvestimento.inputMode =
        'decimal';

    valorInvestimento.addEventListener(
        'blur',
        () => {

            formatarCampoMoedaBR(
                valorInvestimento
            );

        }
    );

}


}

function limparModalInvestimento(){

    document.getElementById(
        'tipoInvestimento'
    ).value = '';

    document.getElementById(
        'outroTipoInvestimento'
    ).value = '';

    document.getElementById(
        'containerOutroTipoInvestimento'
    ).style.display = 'none';

    document.getElementById(
        'dataInvestimento'
    ).value = '';

    document.getElementById(
        'valorInvestimento'
    ).value = '';

    document.getElementById(
        'observacaoInvestimento'
    ).value = '';

}

async function adicionarInvestimento(){

    if(!isOperador){

        alert(
            'Representantes não podem cadastrar investimentos.'
        );

        return;

    }

    let tipoInvestimento =
        document
        .getElementById(
            'tipoInvestimento'
        )
        .value;

    if(tipoInvestimento === 'Outros'){

        tipoInvestimento =
            document
            .getElementById(
                'outroTipoInvestimento'
            )
            .value
            .trim();

    }

    const dados = {

        TipoInvestimento:
            tipoInvestimento,

        DataInvestimento:
            document
            .getElementById(
                'dataInvestimento'
            )
            .value,

            ValorInvestimento:
                moedaBRParaNumero(
                    document
                    .getElementById(
                        'valorInvestimento'
                    ).value
                ),

        ObservacaoInvestimento:
            document
            .getElementById(
                'observacaoInvestimento'
            )
            .value
            .trim()
    };

    if(!dados.TipoInvestimento){

        alert(
            'Informe o tipo de investimento.'
        );

        return;

    }

    if(!dados.DataInvestimento){

        alert(
            'Informe a data do investimento.'
        );

        return;

    }

    if(!dados.ValorInvestimento){

        alert(
            'Informe o valor do investimento.'
        );

        return;

    }

    const response =
    await fetch(
        `/api/investimentoDistribuidor/${codigoDistribuidor}`,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify(
                    dados
                )
        }
    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert(
            'Investimento cadastrado com sucesso.'
        );

        document
        .getElementById(
            'modalInvestimento'
        )
        .style.display =
            'none';

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao cadastrar investimento.'
        );

    }

}

async function salvarTipoInvestimento(){

    if(!isOperador){

        alert(
            'Representantes não podem criar tipos de investimento.'
        );

        return;

    }

    const tipoInvestimento =
        document
        .getElementById(
            'novoTipoInvestimento'
        )
        .value
        .trim();

    if(!tipoInvestimento){

        alert(
            'Informe o tipo de investimento.'
        );

        return;

    }

    const response =
    await fetch(
        '/api/tiposInvestimento',
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify({
                    TipoInvestimento:
                        tipoInvestimento
                })
        }
    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert(
            'Tipo de investimento cadastrado.'
        );

        document
        .getElementById(
            'modalTipoInvestimento'
        )
        .style.display =
            'none';

        await carregarTiposInvestimento();

    }else{

        alert(
            resultado.erro ||
            'Erro ao cadastrar tipo de investimento.'
        );

    }

}

document
.getElementById(
    'salvarInvestimento'
)
.addEventListener(
    'click',
    salvarInvestimentos
);

async function salvarInvestimentos(){

    const investimentos = [];

    document
    .querySelectorAll(
        '.linhaInvestimento'
    )
    .forEach(linha => {

        investimentos.push({

            CodigoInvestimento:
                linha.dataset.id,

            TipoInvestimento:
                linha
                .querySelector(
                    '.tipoInvestimentoTabela'
                )
                .value
                .trim(),

            DataInvestimento:
                linha
                .querySelector(
                    '.dataInvestimentoTabela'
                )
                .value,

            ValorInvestimento:
                moedaBRParaNumero(
                    linha
                    .querySelector(
                        '.valorInvestimentoTabela'
                    )
                    .value
                ),

            ObservacaoInvestimento:
                linha
                .querySelector(
                    '.observacaoInvestimentoTabela'
                )
                .value
                .trim()

        });

    });

    const response =
    await fetch(
        '/api/investimentoDistribuidor',
        {
            method: 'PUT',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify(
                    investimentos
                )
        }
    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert(
            'Investimentos salvos com sucesso.'
        );

        carregarTela();
        location.reload();
    }else{

        alert(
            resultado.erro ||
            'Erro ao salvar investimentos.'
        );

    }

}

function configurarCalculoTotalInvestimento(){

    document
    .querySelectorAll(
        '.valorInvestimentoTabela'
    )
    .forEach(input => {

        input.addEventListener(
            'input',
            calcularTotalInvestimento
        );

        input.addEventListener(
            'blur',
            () => {

                formatarCampoMoedaBR(
                    input
                );

                calcularTotalInvestimento();

            }
        );

        input.addEventListener(
            'focus',
            () => {

                input.select();

            }
        );

    });

}

function calcularTotalInvestimento(){

    let total = 0;

    document
    .querySelectorAll(
        '.valorInvestimentoTabela'
    )
    .forEach(input => {

        const valor =
            moedaBRParaNumero(
                input.value
            );

        if(!isNaN(valor)){

            total += valor;

        }

    });

    const campoTotal =
        document.getElementById(
            'totalInvestimento'
        );

    if(campoTotal){

        campoTotal.value =
            formatarMoeda(
                total
            );

    }

}

function formatarMoeda(valor){

    return Number(valor || 0).toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );

}

function formatarDataInput(data){

    if(!data){
        return '';
    }

    const dataObj =
        new Date(data);

    if(isNaN(dataObj)){
        return '';
    }

    return dataObj
        .toISOString()
        .split('T')[0];

}