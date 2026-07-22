const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();
console.log(
    'Distribuidor:',
    codigoDistribuidor
);

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
  investimentos,
    meses,
    distribuidor
){

    
console.log(
        'montarTabela executada'
    );

console.log(meses);
console.log(investimentos);


    let cabecalho = `

        <tr>

            <th>
                Investimento
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
        'cabecalhoInvestimento'
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
        investimentos.find(

            i=>

            i.MesAnoInvestimento
            ===
            mes

        );

        linha += `
            <td>

                <div class="campo-moeda">

                    <span>R$</span>

                    <input
                        type="number"
                        class="estoque"
                        step="0.01"
                        data-mes="${mes}"
                        value="${
                            registro
                            ?
                            registro.ValorInvestimento
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
    'corpoInvestimento'
)
.innerHTML =
linha;

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

    const registros = [];

    document
    .querySelectorAll(
        '.estoque'
    )
    .forEach(input=>{

        if(input.value !== ''){

            registros.push({

                MesAnoInvestimento:
                    input.dataset.mes,

                ValorInvestimento:
                    Number(
                        input.value
                    )

            });

        }

    });

    const response =
    await fetch(

        `/api/investimentoDistribuidor/${codigoDistribuidor}`,

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
            'Investimentos salvos com sucesso'
        );

    }

}

async function carregarTela(){

    const meses =
        gerarMeses();

    const responseInvestimento =
    await fetch(
        `/api/investimentoDistribuidor/${codigoDistribuidor}`
    );

    const investimentos =
    await responseInvestimento.json();

    const responseDistribuidor =
    await fetch(
        `/api/distribuidor/${codigoDistribuidor}`
    );

    const distribuidor =
    await responseDistribuidor.json();

    montarTabela(
        investimentos,
        meses,
        distribuidor
    );

}