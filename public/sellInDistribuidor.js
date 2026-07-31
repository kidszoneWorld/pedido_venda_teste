const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();

let isOperador = false;

document.addEventListener(
    'DOMContentLoaded',
    carregarTela
);

function gerarMeses(){

    const meses = [];

    const data =
        new Date();

    const anoAtual =
        data.getFullYear();

    const anoAnterior =
        anoAtual - 1;

    // Últimos 3 meses do ano anterior: outubro, novembro e dezembro
    for(
        let mes = 10;
        mes <= 12;
        mes++
    ){

        const mesFormatado =
            String(mes)
            .padStart(
                2,
                '0'
            );

        meses.push(
            `${mesFormatado}/${anoAnterior}`
        );

    }

    // Todos os meses do ano atual: janeiro até dezembro
    for(
        let mes = 1;
        mes <= 12;
        mes++
    ){

        const mesFormatado =
            String(mes)
            .padStart(
                2,
                '0'
            );

        meses.push(
            `${mesFormatado}/${anoAtual}`
        );

    }

    return meses;

}

async function carregarTela(){

    const sessionResponse =
    await fetch(
        '/session-data'
    );

    const sessionData =
    await sessionResponse.json();

    isOperador =
        !sessionData.userNumero;

    const btnSalvarSellIn =
        document.getElementById(
            'salvarSellIn'
        );

    if(
        btnSalvarSellIn &&
        !isOperador
    ){

        btnSalvarSellIn.style.display =
            'none';

    }

    const meses =
        gerarMeses();

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

    document
    .getElementById(
        'nomeDistribuidorSellIn'
    )
    .textContent =
        nomeDistribuidor;

    const response =
    await fetch(
        `/api/sellInDistribuidor/${codigoDistribuidor}`
    );

    const dados =
    await response.json();

    montarTabela(
        dados.metas || [],
        dados.sellIn || [],
        meses
    );

}

function montarTabela(
    metas,
    sellIn,
    meses
){

    const thead =
    document.getElementById(
        'cabecalhoSellIn'
    );

    let cabecalho = `
        <tr>
            <th>Indicador</th>
    `;

    meses.forEach(mes => {

        cabecalho += `
            <th>${mes}</th>
        `;

    });

    cabecalho += `
        </tr>
    `;

    thead.innerHTML =
        cabecalho;

    const tbody =
    document.getElementById(
        'corpoSellIn'
    );

    tbody.innerHTML = '';

    let linhaMeta = `
        <tr>
            <td>
                Meta Sell In
            </td>
    `;

    meses.forEach(
        (
            mes,
            colunaIndex
        ) => {

            const registroMeta =
            metas.find(
                m =>
                m.MesAnoMetaSellIn === mes
            );

            linhaMeta += `
                <td>

                    <div class="campo-moeda">

                        <span>R$</span>

                        <input
                            type="number"
                            step="0.01"
                            class="estoque metaSellIn"
                            data-coluna="${colunaIndex}"
                            data-mes="${mes}"
                            value="${
                                registroMeta
                                ?
                                registroMeta.MetaSellIn
                                :
                                ''
                            }"
                            ${isOperador ? '' : 'readonly'}
                        >

                    </div>

                </td>
            `;

        }
    );

    linhaMeta += `
        </tr>
    `;

    let linhaSellIn = `
        <tr>
            <td>
                Valor Sell In
            </td>
    `;

    meses.forEach(
        (
            mes,
            colunaIndex
        ) => {

           const registroSellIn =
sellIn.find(
    s =>
    s.MesAnoSellIn === mes
);

const sellInJaExiste =
    registroSellIn
    ? true
    : false;

linhaSellIn += `
    <td>

        <div class="campo-moeda">

            <span>R$</span>

            <input
                type="number"
                step="0.01"
                class="estoque valorSellIn"
                data-coluna="${colunaIndex}"
                data-mes="${mes}"
                data-existe="${sellInJaExiste ? '1' : '0'}"
                value="${
                    registroSellIn
                    ?
                    registroSellIn.ValorSellIn
                    :
                    ''
                }"
                ${
                    !isOperador
                    ? 'readonly title="Representantes não podem editar Sell In"'
                    : ''
                }
            >

        </div>

    </td>
`;

        }
    );

    linhaSellIn += `
        </tr>
    `;

    let linhaPercentual = `
        <tr>
            <td>
                % Atingimento
            </td>
    `;

    meses.forEach(
        (
            mes,
            colunaIndex
        ) => {

            linhaPercentual += `
                <td>

                    <input
                        type="text"
                        class="estoque percentualSellIn"
                        data-coluna="${colunaIndex}"
                        data-mes="${mes}"
                        readonly
                    >

                </td>
            `;

        }
    );

    linhaPercentual += `
        </tr>
    `;

    tbody.innerHTML =
        linhaMeta +
        linhaSellIn +
        linhaPercentual;

    configurarCalculoPercentual();

    calcularTodosPercentuais();

    configurarNavegacao();

}

function configurarCalculoPercentual(){

    document
    .querySelectorAll(
        '.metaSellIn, .valorSellIn'
    )
    .forEach(input => {

        input.addEventListener(
            'input',
            calcularTodosPercentuais
        );

    });

}

function calcularTodosPercentuais(){

    document
    .querySelectorAll(
        '.percentualSellIn'
    )
    .forEach(inputPercentual => {

        const coluna =
            inputPercentual.dataset.coluna;

        const meta =
            document.querySelector(
                `.metaSellIn[data-coluna="${coluna}"]`
            );

        const valor =
            document.querySelector(
                `.valorSellIn[data-coluna="${coluna}"]`
            );

        const metaNumero =
            Number(
                meta?.value || 0
            );

        const valorNumero =
            Number(
                valor?.value || 0
            );

        if(
            metaNumero > 0 &&
            valorNumero >= 0
        ){

            const percentual =
                (
                    valorNumero /
                    metaNumero
                ) * 100;

            inputPercentual.value =
                percentual.toFixed(2) + '%';

        }else{

            inputPercentual.value =
                '';

        }

    });

}

document
.getElementById(
    'salvarSellIn'
)
.addEventListener(
    'click',
    salvarSellIn
);

async function salvarSellIn(){

    if(!isOperador){

        alert(
            'Representantes não podem editar informações de Sell In.'
        );

        return;

    }

    const metas = [];

    const sellIn = [];

    document
    .querySelectorAll(
        '.metaSellIn'
    )
    .forEach(input => {

        if(input.value !== ''){

            metas.push({

                MesAnoMetaSellIn:
                    input.dataset.mes,

                MetaSellIn:
                    Number(
                        input.value
                    )

            });

        }

    });

    document
    .querySelectorAll(
        '.valorSellIn'
    )
    .forEach(input => {

        if(input.value !== ''){

            sellIn.push({

                MesAnoSellIn:
                    input.dataset.mes,

                ValorSellIn:
                    Number(
                        input.value
                    )

            });

        }

    });

    const response =
    await fetch(
        `/api/sellInDistribuidor/${codigoDistribuidor}`,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify({
                    metas,
                    sellIn
                })
        }
    );

    const resultado =
        await response.json();

    if(resultado.sucesso){

        alert(
            'Sell In salvo com sucesso.'
        );

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao salvar Sell In.'
        );

    }

}

function configurarNavegacao(){

    document
    .querySelectorAll(
        '.metaSellIn, .valorSellIn'
    )
    .forEach(input => {

        input.addEventListener(
            'keydown',
            e => {

                const coluna =
                    Number(
                        input.dataset.coluna
                    );

                const isMeta =
                    input.classList.contains(
                        'metaSellIn'
                    );

                let destino;

                switch(e.key){

                    case 'ArrowRight':

                        destino =
                        document.querySelector(
                            `.${isMeta ? 'metaSellIn' : 'valorSellIn'}[data-coluna="${coluna + 1}"]`
                        );

                        break;

                    case 'ArrowLeft':

                        destino =
                        document.querySelector(
                            `.${isMeta ? 'metaSellIn' : 'valorSellIn'}[data-coluna="${coluna - 1}"]`
                        );

                        break;

                    case 'ArrowDown':

                        destino =
                        isMeta
                        ? document.querySelector(
                            `.valorSellIn[data-coluna="${coluna}"]`
                        )
                        : null;

                        break;

                    case 'ArrowUp':

                        destino =
                        !isMeta
                        ? document.querySelector(
                            `.metaSellIn[data-coluna="${coluna}"]`
                        )
                        : null;

                        break;

                    case 'Enter':

                        destino =
                        isMeta
                        ? document.querySelector(
                            `.valorSellIn[data-coluna="${coluna}"]`
                        )
                        : document.querySelector(
                            `.valorSellIn[data-coluna="${coluna + 1}"]`
                        );

                        break;

                    default:

                        return;

                }

                if(destino){

                    e.preventDefault();

                    if(!destino.readOnly){

                        destino.focus();

                        destino.select?.();

                    }

                }

            }
        );

    });

}