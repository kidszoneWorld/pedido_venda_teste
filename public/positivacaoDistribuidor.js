const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();
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




    let cabecalho = `

        <tr>

            <th>
                Positivação
            </th>

    `;

    meses.forEach(mes=>{

        cabecalho += `
            <th>${mes}</th>
        `;

    });

    cabecalho += `
        </tr>
    `;

    document
    .getElementById(
        'cabecalhoPositivacao'
    )
    .innerHTML =
    cabecalho;

    let linha = `
            <tr>

                <td>

                    ${distribuidor.RazaoSocial}

                </td>
        `;
    meses.forEach(mes=>{

        const registro =
            positivacao.find(

                p =>

                p.MesAnoPositivada === mes

            );

        linha += `
            <td>

                <div class="campo-moeda">


                    <input

                        type="number"

                        class="estoque"

                        data-mes="${mes}"

                        value="${
                            registro
                            ?
                            registro.QuantidadePositivada
                            :
                            ''
                        }"

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
    .forEach(input=>{

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

            method:'POST',

            headers:{
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