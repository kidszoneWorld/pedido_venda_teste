const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();

document.addEventListener(
    'DOMContentLoaded',
    carregarTela
);

async function carregarTela(){

    const response =
    await fetch(
        `/api/redesDistribuidor/${codigoDistribuidor}`
    );

    const redes =
    await response.json();

    montarTabela(
        redes
    );

}


function montarTabela(
    redes
){

    const tbody =
    document.getElementById(
        'corpoRedes'
    );

    tbody.innerHTML = '';

    redes.forEach(rede=>{

        tbody.innerHTML += `

        <tr
            class="linhaRede"
            data-id="${rede.CodigoRede}"
        >

            <td>

                <input
                    value="${rede.RedeRazaoSocial}"
                    class="razao"
                >

            </td>

            <td>

                <input
                    value="${rede.NomeFantasia}"
                    class="fantasia"
                >

            </td>

            <td>

                <input
                    value="${rede.LojaQuantidade}"
                    class="lojas"
                >

            </td>

            <td>

                <input
                    value="${rede.UF}"
                    class="uf"
                >

            </td>

            <td>

                <input
                    value="${rede.SkuQuantidade}"
                    class="sku"
                >

            </td>

            <td>

                <input
                    value="${rede.ValorPrimeiraCompra}"
                    class="valor"
                >

            </td>

            <td>

                <input
                    value="${rede.RedeMesAno}"
                    class="mes"
                >

            </td>

            <td>

                <button

                    onclick="
                    excluirRede(
                    ${rede.CodigoRede}
                    )
                    "

                >

                    X

                </button>

            </td>

        </tr>

        `;

    });

}


document
.getElementById(
    'salvarRedes'
)
.addEventListener(
    'click',
    salvarRedes
);

async function salvarRedes(){

    const redes = [];

    document
    .querySelectorAll(
        '.linhaRede'
    )
    .forEach(linha=>{

        redes.push({

            CodigoRede:
            linha.dataset.id,

            RedeRazaoSocial:
            linha.querySelector(
                '.razao'
            ).value,

            NomeFantasia:
            linha.querySelector(
                '.fantasia'
            ).value,

            LojaQuantidade:
            linha.querySelector(
                '.lojas'
            ).value,

            UF:
            linha.querySelector(
                '.uf'
            ).value,

            SkuQuantidade:
            linha.querySelector(
                '.sku'
            ).value,

            ValorPrimeiraCompra:
            linha.querySelector(
                '.valor'
            ).value,

            RedeMesAno:
            linha.querySelector(
                '.mes'
            ).value

        });

    });

    await fetch(

        '/api/redesDistribuidor',

        {

            method:'PUT',

            headers:{
                'Content-Type':
                'application/json'
            },

            body:
            JSON.stringify(
                redes
            )

        }

    );

    alert(
        'Redes salvas'
    );

}

async function excluirRede(
    codigoRede
){

    await fetch(

        `/api/redesDistribuidor/${codigoRede}`,

        {
            method:'DELETE'
        }

    );

    carregarTela();

}

document
.getElementById(
    'novaRede'
)
.addEventListener(
    'click',
    ()=>{
        document
        .getElementById(
            'modalRede'
        )
        .style.display =
        'block';
    }
);

document
.getElementById(
    'adicionarRede'
)
.addEventListener(
    'click',
    async ()=>{

        await fetch(

            `/api/redesDistribuidor/${codigoDistribuidor}`,

            {

                method:'POST',

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:
                JSON.stringify({

                    RedeRazaoSocial:
                    document.getElementById(
                        'redeRazaoSocial'
                    ).value,

                    NomeFantasia:
                    document.getElementById(
                        'nomeFantasia'
                    ).value,

                    LojaQuantidade:
                    document.getElementById(
                        'lojaQuantidade'
                    ).value,

                    UF:
                    document.getElementById(
                        'uf'
                    ).value,

                    SkuQuantidade:
                    document.getElementById(
                        'skuQuantidade'
                    ).value,

                    ValorPrimeiraCompra:
                    document.getElementById(
                        'valorPrimeiraCompra'
                    ).value,

                    RedeMesAno:
                    document.getElementById(
                        'redeMesAno'
                    ).value

                })

            }

        );

        carregarTela();

    }
);