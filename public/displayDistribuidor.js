const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();

let itensDisplay = [];

function apenasNumeros(valor){

    return String(valor || '').replace(/\D/g, '');

}

function aplicarMascaraCNPJ(valor){

    let cnpj = apenasNumeros(valor);

    cnpj = cnpj.substring(0, 14);

    cnpj = cnpj.replace(
        /^(\d{2})(\d)/,
        '$1.$2'
    );

    cnpj = cnpj.replace(
        /^(\d{2})\.(\d{3})(\d)/,
        '$1.$2.$3'
    );

    cnpj = cnpj.replace(
        /\.(\d{3})(\d)/,
        '.$1/$2'
    );

    cnpj = cnpj.replace(
        /(\d{4})(\d)/,
        '$1-$2'
    );

    return cnpj;

}

function validarCNPJ(cnpj){

    cnpj = apenasNumeros(cnpj);

    if(cnpj.length !== 14){
        return false;
    }

    if(/^(\d)\1+$/.test(cnpj)){
        return false;
    }

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){

        soma += Number(numeros.charAt(tamanho - i)) * pos--;

        if(pos < 2){
            pos = 9;
        }

    }

    let resultado =
        soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(0))){
        return false;
    }

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for(let i = tamanho; i >= 1; i--){

        soma += Number(numeros.charAt(tamanho - i)) * pos--;

        if(pos < 2){
            pos = 9;
        }

    }

    resultado =
        soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(1))){
        return false;
    }

    return true;

}

function configurarMascaraCnpjDisplay(){

    const inputCnpjModal =
        document.getElementById(
            'cnpjDisplay'
        );

    if(inputCnpjModal){

        inputCnpjModal.addEventListener(
            'input',
            () => {

                inputCnpjModal.value =
                    aplicarMascaraCNPJ(
                        inputCnpjModal.value
                    );

            }
        );

    }

}

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        configurarMascaraCnpjDisplay();

        await carregarTela();

    }
);

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
        'nomeDistribuidorDisplay'
    )
    .textContent =
        nomeDistribuidor;

    const responseItens =
    await fetch(
        '/api/itens-display'
    );

    itensDisplay =
    await responseItens.json();

    preencherSelectDisplay();

    const response =
    await fetch(
        `/api/displayDistribuidor/${codigoDistribuidor}`
    );

    const displays =
    await response.json();

    montarTabela(
        displays
    );

}

function preencherSelectDisplay(){

    const select =
    document.getElementById(
        'codigoItemDisplay'
    );

    select.innerHTML = `
        <option value="">
            Selecione o Display
        </option>
    `;

    itensDisplay.forEach(item => {

        select.innerHTML += `
            <option value="${item.CodigoItem}">
                ${item.CodigoItem} - ${item.ItemDescricao}
            </option>
        `;

    });

}

function montarTabela(displays){

    const tbody =
    document.getElementById(
        'corpoDisplays'
    );

    tbody.innerHTML = '';

    displays.forEach(display => {

        tbody.innerHTML += `

            <tr
                class="linhaDisplay"
                data-id="${display.CodigoDisplay}"
            >

                <td>
                    <select class="codigoItem">
                        ${gerarOptionsDisplay(display.CodigoItem)}
                    </select>
                </td>

                <td>
                    <input
                        class="razaoSocialDisplay"
                        value="${display.RazaoSocialDisplay || ''}"
                    >
                </td>

                <td>
                    <input
                        class="cnpjDisplay"
                        maxlength="18"
                        value="${aplicarMascaraCNPJ(display.CnpjDisplay || '')}"
                    >
                </td>

                <td>
                    <input
                        class="enderecoDisplay"
                        value="${display.EnderecoDisplay || ''}"
                    >
                </td>

                <td>
                    <input
                        class="bairroDisplay"
                        value="${display.BairroDisplay || ''}"
                    >
                </td>

                <td>
                    <input
                        class="cidadeDisplay"
                        value="${display.CidadeDisplay || ''}"
                    >
                </td>

                <td>
                    <input
                        class="ufDisplay"
                        maxlength="2"
                        value="${display.UF || ''}"
                    >
                </td>

                <td>
                    <div class="campo-moeda">

                        <span>R$</span>

                        <input
                        type="number"
                        step="0.01"
                        class="estoque valorDisplay"
                        value="${display.ValorDisplay ||''}" 
                            >

                    </div>
                </td>

                <td>
                    <input
                        class="mesAnoDisplay"
                        value="${display.MesAnoDisplay || ''}"
                    >
                </td>

                <td>
                    <button
                        class="button"
                        onclick="excluirDisplay(${display.CodigoDisplay})"
                    >
                        X
                    </button>
                </td>

            </tr>

        `;

    });
configurarMascaraCnpjTabela();
}

function configurarMascaraCnpjTabela(){

    document
    .querySelectorAll(
        '.linhaDisplay .cnpjDisplay'
    )
    .forEach(input => {

        input.addEventListener(
            'input',
            () => {

                input.value =
                    aplicarMascaraCNPJ(
                        input.value
                    );

            }
        );

    });

}

function gerarOptionsDisplay(codigoSelecionado){

    let options = '';

    itensDisplay.forEach(item => {

        const selected =
            item.CodigoItem === codigoSelecionado
            ? 'selected'
            : '';

        options += `
            <option
                value="${item.CodigoItem}"
                ${selected}
            >
                ${item.CodigoItem} - ${item.ItemDescricao}
            </option>
        `;

    });

    return options;

}

document
.getElementById(
    'novoDisplay'
)
.addEventListener(
    'click',
    () => {

        limparModalDisplay();

        document
        .getElementById(
            'modalDisplay'
        )
        .style.display =
            'block';

    }
);

document
.getElementById(
    'fecharModalDisplay'
)
.addEventListener(
    'click',
    () => {

        document
        .getElementById(
            'modalDisplay'
        )
        .style.display =
            'none';

    }
);

function limparModalDisplay(){

    document.getElementById('codigoItemDisplay').value = '';
    document.getElementById('razaoSocialDisplay').value = '';
    document.getElementById('cnpjDisplay').value = '';
    document.getElementById('enderecoDisplay').value = '';
    document.getElementById('bairroDisplay').value = '';
    document.getElementById('cidadeDisplay').value = '';
    document.getElementById('ufDisplay').value = '';
    document.getElementById('valorDisplay').value = '';
    document.getElementById('mesAnoDisplay').value = '';

}

document
.getElementById(
    'adicionarDisplay'
)
.addEventListener(
    'click',
    adicionarDisplay
);

async function adicionarDisplay(){

    const dados = {

        CodigoItem:
        document
        .getElementById(
            'codigoItemDisplay'
        ).value,

        RazaoSocialDisplay:
        document
        .getElementById(
            'razaoSocialDisplay'
        ).value,

        CnpjDisplay:
        document
        .getElementById(
            'cnpjDisplay'
        ).value,

        EnderecoDisplay:
        document
        .getElementById(
            'enderecoDisplay'
        ).value,

        BairroDisplay:
        document
        .getElementById(
            'bairroDisplay'
        ).value,

        CidadeDisplay:
        document
        .getElementById(
            'cidadeDisplay'
        ).value,

        UF:
        document
        .getElementById(
            'ufDisplay'
        ).value.toUpperCase(),

        ValorDisplay:
        document
        .getElementById(
            'valorDisplay'
        ).value,

        MesAnoDisplay:
        document
        .getElementById(
            'mesAnoDisplay'
        ).value

    };

    if(!dados.CodigoItem){

        alert('Selecione o display vendido.');

        return;

    }

    if(!dados.RazaoSocialDisplay){

        alert('Informe a razão social.');

        return;

    }

    const response =
    await fetch(
        `/api/displayDistribuidor/${codigoDistribuidor}`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
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

        alert('Venda de display adicionada.');

        document
        .getElementById(
            'modalDisplay'
        )
        .style.display =
            'none';

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao adicionar venda de display.'
        );

    }

}

document
.getElementById(
    'salvarDisplays'
)
.addEventListener(
    'click',
    salvarDisplays
);

async function salvarDisplays(){

    const displays = [];

    const linhas =
        document.querySelectorAll(
            '.linhaDisplay'
        );

    for(const linha of linhas){

        const cnpjInput =
            linha.querySelector(
                '.cnpjDisplay'
            );

        const cnpj =
            cnpjInput
            .value
            .trim();

        if(!cnpj){

            alert('Informe o CNPJ em todas as linhas.');

            cnpjInput.focus();

            return;

        }

        // if(!validarCNPJ(cnpj)){

        //     alert('Existe um CNPJ inválido na tabela.');

        //     cnpjInput.focus();

        //     return;

        // }

        displays.push({

            CodigoDisplay:
            linha.dataset.id,

            CodigoItem:
            linha
            .querySelector(
                '.codigoItem'
            ).value,

            RazaoSocialDisplay:
            linha
            .querySelector(
                '.razaoSocialDisplay'
            ).value,

            CnpjDisplay:
            aplicarMascaraCNPJ(cnpj),

            EnderecoDisplay:
            linha
            .querySelector(
                '.enderecoDisplay'
            ).value,

            BairroDisplay:
            linha
            .querySelector(
                '.bairroDisplay'
            ).value,

            CidadeDisplay:
            linha
            .querySelector(
                '.cidadeDisplay'
            ).value,

            UF:
            linha
            .querySelector(
                '.ufDisplay'
            )
            .value
            .toUpperCase(),

            ValorDisplay:
            linha
            .querySelector(
                '.valorDisplay'
            ).value,

            MesAnoDisplay:
            linha
            .querySelector(
                '.mesAnoDisplay'
            ).value

        });

    }

    const response =
    await fetch(
        '/api/displayDistribuidor',
        {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json'
            },

            body:
            JSON.stringify(
                displays
            )
        }
    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert('Displays salvos com sucesso.');

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao salvar displays.'
        );

    }

}

async function excluirDisplay(codigoDisplay){

    const confirmar =
    confirm(
        'Deseja realmente excluir esta venda de display?'
    );

    if(!confirmar){

        return;

    }

    const response =
    await fetch(
        `/api/displayDistribuidor/${codigoDisplay}`,
        {
            method: 'DELETE'
        }
    );

    const resultado =
    await response.json();

    if(resultado.sucesso){

        alert('Venda de display excluída.');

        carregarTela();

    }else{

        alert(
            resultado.erro ||
            'Erro ao excluir display.'
        );

    }

}