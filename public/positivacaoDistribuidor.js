

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

    for(
        let i = 12;
        i >= 0;
        i--
    ){

        const d =
            new Date(
                data.getFullYear(),
                data.getMonth() - i,
                1
            );

        const mes =
            String(
                d.getMonth()+1
            ).padStart(
                2,
                '0'
            );

        meses.push(
            `${mes}/${d.getFullYear()}`
        );

    }

    return meses;

}

function montarTabela(
    positivacao,
    meses,
    distribuidor
){

    console.log(
        'montarTabela executada'
    );

    const cabecalhoElemento =
        document.getElementById(
            'cabecalhoPositivacao'
        );

    let cabecalho = `
        <tr>
            <th>
                Positivação
            </th>
    `;

    meses.forEach(mes => {

        cabecalho += `
            <th>
                ${mes}
            </th>
        `;

    });

    cabecalho += `
        </tr>
    `;

    cabecalhoElemento.innerHTML =
        cabecalho;

    let linha = `
        <tr>

            <td>
                ${distribuidor.RazaoSocial}
            </td>
    `;

    meses.forEach(mes => {

        const registro =
            positivacao.find(
                p =>
                p.MesAnoPositivada === mes
            );

        const positivacaoJaExiste =
            registro
            ? true
            : false;

        linha += `
            <td>

                <div class="campo-moeda">

                    <input
                        type="number"
                        class="estoque"
                        data-mes="${mes}"
                        data-existe="${positivacaoJaExiste ? '1' : '0'}"
                        value="${
                            registro
                            ?
                            registro.QuantidadePositivada
                            :
                            ''
                        }"
                        ${
                            !isOperador && positivacaoJaExiste
                            ? 'readonly title="Representantes não podem editar positivação já cadastrada"'
                            : ''
                        }
                    >

                </div>

            </td>
        `;

    });

    linha += `
        </tr>
    `;

    document
    .getElementById(
        'corpoPositivacao'
    )
    .innerHTML =
        linha;

}

async function salvarPositivacao(){

    const registros = [];

    document
    .querySelectorAll(
        '.estoque'
    )
    .forEach(input => {

        const registroJaExiste =
            input.dataset.existe === '1';

        /*
            Representante só pode inserir.
            Se o registro já existe, não envia para o backend.
        */
        if(
            !isOperador &&
            registroJaExiste
        ){

            return;

        }

        if(input.value !== ''){

            registros.push({

                MesAnoPositivada:
                    input.dataset.mes,

                QuantidadePositivada:
                    Number(
                        input.value
                    )

            });

        }

    });

    const response =
    await fetch(
        `/api/positivacaoDistribuidor/${codigoDistribuidor}`,
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify(
                    registros
                )
        }
    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert(
            'Positivação salva com sucesso'
        );

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao salvar positivação'
        );

    }

}


document
.getElementById(
    'salvarPositivacao'
)
.addEventListener(
    'click',
    salvarPositivacao
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

    const meses =
        gerarMeses();

    const responsePositivacao =
    await fetch(
        `/api/positivacaoDistribuidor/${codigoDistribuidor}`
    );

    const positivacao =
    await responsePositivacao.json();

    const responseDistribuidor =
    await fetch(
        `/api/distribuidor/${codigoDistribuidor}`
    );

    const distribuidor =
    await responseDistribuidor.json();

    montarTabela(
        positivacao,
        meses,
        distribuidor
    );

}