const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();

let isOperador = false;


document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await verificarPermissao();

        await carregarTela();

    }
);

async function verificarPermissao(){

    const response =
    await fetch('/session-data');

    const sessionData =
    await response.json();

    const userNumero =
        sessionData?.userNumero || null;

    isOperador =
        !userNumero;

    const btnSalvarRedes =
        document.getElementById(
            'salvarRedes'
        );

    if(
        btnSalvarRedes &&
        !isOperador
    ){

        btnSalvarRedes.style.display =
            'none';

    }

}

async function carregarTela(){

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
        'nomeDistribuidorRedes'
    )
    .textContent =
        nomeDistribuidor;

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

function montarTabela(redes){

    const tbody =
    document.getElementById(
        'corpoRedes'
    );

    tbody.innerHTML = '';

    redes.forEach(rede => {

        tbody.innerHTML += `

        <tr
            class="linhaRede"
            data-id="${rede.CodigoRede}"
        >

            <td>
                <input
                    value="${rede.RedeRazaoSocial || ''}"
                    class="razao"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    value="${rede.NomeFantasia || ''}"
                    class="fantasia"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="number"
                    value="${rede.LojaQuantidade || ''}"
                    class="lojas"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    value="${rede.UF || ''}"
                    class="uf"
                    maxlength="2"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="number"
                    value="${rede.SkuQuantidade || ''}"
                    class="sku"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <div class="campo-moeda">

                    <span>R$</span>

                    <input
                        type="number"
                        step="0.01"
                        value="${rede.ValorPrimeiraCompra || ''}"
                        class="valor"
                        ${isOperador ? '' : 'readonly'}
                    >

                </div>
            </td>

            <td>
                <input
                    type="date"
                    value="${formatarDataInput(rede.DataInicioRede)}"
                    class="dataInicio"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    value="${rede.ObservacaoRede || ''}"
                    class="observacao"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                ${
                    isOperador
                    ? `
                        <button
                            class="button"
                            onclick="excluirRede(${rede.CodigoRede})"
                        >
                            X
                        </button>
                    `
                    : ''
                }
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

    if(!isOperador){

        alert(
            'Você não tem permissão para editar redes existentes.'
        );

        return;

    }

    const redes = [];

    document
    .querySelectorAll(
        '.linhaRede'
    )
    .forEach(linha => {

        redes.push({

            CodigoRede:
            linha.dataset.id,

            RedeRazaoSocial:
            linha
            .querySelector(
                '.razao'
            ).value,

            NomeFantasia:
            linha
            .querySelector(
                '.fantasia'
            ).value,

            LojaQuantidade:
            linha
            .querySelector(
                '.lojas'
            ).value,

            UF:
            linha
            .querySelector(
                '.uf'
            )
            .value
            .toUpperCase(),

            SkuQuantidade:
            linha
            .querySelector(
                '.sku'
            ).value,

            ValorPrimeiraCompra:
            linha
            .querySelector(
                '.valor'
            ).value,

            DataInicioRede:
            linha.querySelector(
                '.dataInicio'
            ).value,

            ObservacaoRede:
            linha
            .querySelector(
                '.observacao'
            ).value

        });

    });

    const response =
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

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert(
            'Redes salvas'
        );

        carregarTela();
        location.reload();
    }else{

        alert(
            resultado.erro ||
            'Erro ao salvar redes'
        );

    }

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


async function excluirRede(codigoRede){

    if(!isOperador){

        alert(
            'Você não tem permissão para excluir redes.'
        );

        return;

    }

    const confirmar =
    confirm(
        'Deseja realmente excluir esta rede?'
    );

    if(!confirmar){

        return;

    }

    const response =
    await fetch(

        `/api/redesDistribuidor/${codigoRede}`,

        {
            method:'DELETE'
        }

    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert(
            'Rede excluída com sucesso.'
        );

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao excluir rede.'
        );

    }

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
.getElementById('fecharModalRede')
.addEventListener(
    'click',
    () => {

        document
        .getElementById(
            'modalRede'
        )
        .style.display =
            'none';

    }
);

document
.getElementById(
    'adicionarRede'
)
.addEventListener(
    'click',
    adicionarRede
);

async function adicionarRede(){

    const dados = {

        RedeRazaoSocial:
        document
        .getElementById(
            'redeRazaoSocial'
        ).value.trim(),

        NomeFantasia:
        document
        .getElementById(
            'nomeFantasia'
        ).value.trim(),

        LojaQuantidade:
        document
        .getElementById(
            'lojaQuantidade'
        ).value,

        UF:
        document
        .getElementById(
            'uf'
        ).value.trim().toUpperCase(),

        SkuQuantidade:
        document
        .getElementById(
            'skuQuantidade'
        ).value,

        ValorPrimeiraCompra:
        document
        .getElementById(
            'valorPrimeiraCompra'
        ).value,

        DataInicioRede:
        document
        .getElementById(
            'dataInicioRede'
        ).value,

        ObservacaoRede:
        document
        .getElementById(
            'observacaoRede'
        ).value.trim()

    };

    console.log(
        'Dados nova rede:',
        dados
    );

    const response =
    await fetch(

        `/api/redesDistribuidor/${codigoDistribuidor}`,

        {
            method:'POST',

            headers:{
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

    console.log(
        'Resultado nova rede:',
        resultado
    );

    if(resultado.sucesso){

        alert(
            'Rede cadastrada com sucesso.'
        );

        document
        .getElementById(
            'modalRede'
        )
        .style.display =
            'none';

        carregarTela();

    }else{

        alert(
            resultado.detalhe ||
            resultado.erro ||
            'Erro ao cadastrar rede.'
        );

    }

}