
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

    const distribuidorResponse =
    await fetch(
        `/api/distribuidor/${codigoDistribuidor}`
    );

    const distribuidor =
    await distribuidorResponse.json();

    document
    .getElementById(
        'nomeDistribuidorEstoque'
    )
    .textContent =
        distribuidor.RazaoSocial
        ? distribuidor.RazaoSocial
        : '';

    const itensResponse =
    await fetch(
        '/api/itens-ativos'
    );

    const itens =
    await itensResponse.json();

    const estoqueResponse =
    await fetch(
        `/api/estoqueDistribuidor/${codigoDistribuidor}`
    );

    const estoque =
    await estoqueResponse.json();

    montarTabela(
        itens,
        estoque,
        meses
    );

}

function montarTabela(
    itens,
    estoque,
    meses
){

    const thead =
    document.getElementById(
        'cabecalhoEstoque'
    );

    let header = `
        <tr>
            <th>Código</th>
            <th>Descrição</th>
    `;

    meses.forEach(m => {

        header += `<th>${m}</th>`;

    });

    header += `</tr>`;

    thead.innerHTML = header;

    const tbody =
    document.getElementById(
        'corpoEstoque'
    );

    tbody.innerHTML = '';

    itens.forEach((item, linhaIndex) => {

        let linha = `
            <tr>

                <td>
                    ${item.CodigoItem}
                </td>

                <td>
                    ${item.ItemDescricao}
                </td>
        `;

        meses.forEach((mes, colunaIndex) => {


const registro =
estoque.find(
    e =>

    e.CodigoItem ==
    item.CodigoItem

    &&

    e.MesAnoEstoque ==
    mes
);

const estoqueJaExiste =
    registro
    ? true
    : false;

linha += `
    <td>

        <input
            type="number"
            class="estoque"

            data-linha="${linhaIndex}"

            data-coluna="${colunaIndex}"

            data-item="${item.CodigoItem}"

            data-mes="${mes}"

            data-existe="${estoqueJaExiste ? '1' : '0'}"

            value="${
                registro
                ?
                registro.Quantidade
                :
                ''
            }"

            ${
                !isOperador && estoqueJaExiste
                ? 'readonly title="Representantes não podem editar estoque já cadastrado"'
                : ''
            }
        >

    </td>
`;

        });

        linha += '</tr>';

        tbody.innerHTML += linha;

    });
configurarNavegacao();
}
document
.getElementById(
    'salvarEstoque'
)
.addEventListener(
    'click',
    salvarEstoque
);

async function salvarEstoque(){

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

                CodigoItem:
                    input.dataset.item,

                MesAnoEstoque:
                    input.dataset.mes,

                Quantidade:
                    Number(
                        input.value
                    )

            });

        }

    });

    const response =
    await fetch(
        `/api/estoqueDistribuidor/${codigoDistribuidor}`,
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
            'Estoque salvo com sucesso'
        );

        carregarTela();
        location.reload();
    }else{

        alert(
            resultado.erro ||
            'Erro ao salvar estoque'
        );

    }

}


function configurarNavegacao(){

    document
    .querySelectorAll('.estoque')
    .forEach(input => {

        input.addEventListener(
            'keydown',
            e => {

                const linha =
                    Number(
                        input.dataset.linha
                    );

                const coluna =
                    Number(
                        input.dataset.coluna
                    );

                let destino;

                switch(e.key){

                    case 'ArrowRight':

                        destino =
                        document.querySelector(
                            `[data-linha="${linha}"][data-coluna="${coluna+1}"]`
                        );

                        break;

                    case 'ArrowLeft':

                        destino =
                        document.querySelector(
                            `[data-linha="${linha}"][data-coluna="${coluna-1}"]`
                        );

                        break;

                    case 'ArrowDown':

                        destino =
                        document.querySelector(
                            `[data-linha="${linha+1}"][data-coluna="${coluna}"]`
                        );

                        break;

                    case 'ArrowUp':

                        destino =
                        document.querySelector(
                            `[data-linha="${linha-1}"][data-coluna="${coluna}"]`
                        );

                        break;

                    case 'Enter':

                        destino =
                        document.querySelector(
                            `[data-linha="${linha+1}"][data-coluna="${coluna}"]`
                        );

                        break;

                    default:

                        return;

                }

                if(destino){

                    e.preventDefault();

                    destino.focus();

                    destino.select?.();

                }

            }
        );

    });

}