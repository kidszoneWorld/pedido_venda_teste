let listaDistribuidoresCompleta = [];

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await verificarPermissao();

        configurarEventos();

        await carregarDistribuidores();

    }
);

async function verificarPermissao() {

    const response = await fetch('/session-data');
    const sessionData = await response.json();

    window.sessionData = sessionData;

    const userNumero = window.sessionData?.userNumero || null;

    if (!userNumero) {

        window.isRepresentante = false;

        return;
    }

    window.isRepresentante = true;

    const btnNovoDistribuidor =
        document.getElementById('novoDistribuidor');

    const btnNovoItem =
        document.getElementById('novoItem');

    if (btnNovoDistribuidor) {
        btnNovoDistribuidor.style.display = 'none';
    }

    if (btnNovoItem) {
        btnNovoItem.style.display = 'none';
    }

    const btnAdministrarItens =
            document.getElementById(
                'administrarItens'
            );

        if(btnAdministrarItens){

            btnAdministrarItens.style.display =
                'none';

        }
}


function montarTabelaDistribuidores(distribuidores){

    const tbody =
        document.getElementById('listaDistribuidores');

    tbody.innerHTML = '';

    distribuidores.forEach(d => {

        tbody.innerHTML += `
            <tr>
                <td>${d.CNPJ || ''}</td>
                <td>${d.RazaoSocial || ''}</td>
                <td>${d.Representante || ''}</td>

                <td>
                    <button class="button" onclick="abrirSellIn(${d.CodigoDistribuidor})">
                        SellIn
                    </button>

                    <button class="button" onclick="abrirSellOut(${d.CodigoDistribuidor})">
                        SellOut
                    </button>

                    <button class="button" onclick="abrirDisplay(${d.CodigoDistribuidor})">
                        Display
                    </button>

                    <button class="button" onclick="abrirRedes(${d.CodigoDistribuidor})">
                        Redes
                    </button>

                    <button class="button" onclick="abrirPositivacao(${d.CodigoDistribuidor})">
                        Positivação
                    </button>

                    <button class="button" onclick="abrirInfo(${d.CodigoDistribuidor})">
                        Info
                    </button>

                    <button class="button" onclick="abrirEstoque(${d.CodigoDistribuidor})">
                        Estoque
                    </button>

                    <button class="button" onclick="abrirInvestimentos(${d.CodigoDistribuidor})">
                        Investimentos
                    </button>
                </td>
            </tr>
        `;

    });

}

function abrirEstoque(codigoDistribuidor){

    window.location.href =
        `/estoqueDistribuidor/${codigoDistribuidor}`;

}

function abrirInvestimentos(codigoDistribuidor){

    window.location.href =
        `/investimentoDistribuidor/${codigoDistribuidor}`;

}

function abrirPositivacao(
    codigoDistribuidor
){

    window.location.href =
    `/positivacaoDistribuidor/${codigoDistribuidor}`;

}

function abrirRedes(
    codigoDistribuidor
){

    window.location.href =
    `/redesDistribuidor/${codigoDistribuidor}`;

}
function abrirDisplay(codigoDistribuidor){

    window.location.href =
        `/displayDistribuidor/${codigoDistribuidor}`;

}
function abrirSellOut(
    codigoDistribuidor
){

    window.location.href =
    `/sellOutDistribuidor/${codigoDistribuidor}`;

}

function normalizarTexto(valor){

    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

}

async function carregarDistribuidores(){

    const resposta =
        await fetch('/api/distribuidores');

    const distribuidores =
        await resposta.json();

    listaDistribuidoresCompleta =
        distribuidores;

    montarTabelaDistribuidores(
        listaDistribuidoresCompleta
    );

}

const modalItem =
    document.getElementById('modalItem');

document
.getElementById('novoItem')
.addEventListener(
    'click',
    () => {

        modalItem.style.display = 'block';

    }
);

document
.getElementById('fecharModalItem')
.addEventListener(
    'click',
    () => {

        modalItem.style.display = 'none';

    }
);

const modal =
    document.getElementById(
        'modalDistribuidor'
    );

document
.getElementById(
    'novoDistribuidor'
)
.addEventListener(
    'click',
    () => {

        modal.style.display = 'block';

    }
);

document
.getElementById(
    'fecharModal'
)
.addEventListener(
    'click',
    () => {

        modal.style.display = 'none';

    }
);

document
.getElementById(
    'salvarDistribuidor'
)
.addEventListener(
    'click',
    async () => {

        const dados = {

    RazaoSocial:
        document.getElementById(
            'razaoSocial'
        ).value.trim(),

    CNPJ:
        document.getElementById(
            'cnpj'
        ).value.trim(),

    Cidade:
        document.getElementById(
            'cidade'
        ).value.trim(),

    UF:
        document.getElementById(
            'uf'
        ).value.trim().toUpperCase(),

    Representante:
        document.getElementById(
            'representante'
        ).value.trim()

};

if (
    !dados.RazaoSocial ||
    !dados.CNPJ ||
    !dados.UF ||
    !dados.Cidade ||
    !dados.Representante
){

    alert(
        'Preencha todos os campos'
    );

    return;

}

if(!validarCNPJ(dados.CNPJ)){

    alert(
        'CNPJ inválido. Verifique o número informado.'
    );

    document
        .getElementById('cnpj')
        .focus();

    return;

}

        

        if (!dados.RazaoSocial|| !dados.CNPJ|| !dados.UF || !dados.Cidade ||!dados.Representante)
{
    alert(
                'preencha todos os campos'
            );
}
else{
    
        const resposta =
            await fetch(
                '/api/distribuidores',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                        'application/json'
                    },
                    body:
                        JSON.stringify(dados)
                }
            );

        const resultado =
            await resposta.json();

        if(resultado.sucesso){

            alert(
                'Distribuidor cadastrado'
            );
                        modal.style.display = 'none';

            carregarDistribuidores();
}


        }


    }
);

function abrirInfo(codigoDistribuidor){

    window.location.href =
        `/infoDistribuidor/${codigoDistribuidor}`;

}
function abrirSellIn(codigoDistribuidor){

    window.location.href =
        `/sellInDistribuidor/${codigoDistribuidor}`;

}


function configurarEventos() {

const filtroCnpj =
    document.getElementById('filtroCnpj');

const filtroRazao =
    document.getElementById('filtroRazao');

const filtroRepresentante =
    document.getElementById('filtroRepresentante');

if(filtroCnpj){

    filtroCnpj.addEventListener(
        'input',
        () => {

            filtroCnpj.value =
                aplicarMascaraCNPJ(
                    filtroCnpj.value
                );

            aplicarFiltrosDistribuidores();

        }
    );

}

if(filtroRazao){

    filtroRazao.addEventListener(
        'input',
        aplicarFiltrosDistribuidores
    );

}

if(filtroRepresentante){

    filtroRepresentante.addEventListener(
        'input',
        aplicarFiltrosDistribuidores
    );

}

const inputCnpj =
    document.getElementById('cnpj');

if(inputCnpj){

    inputCnpj.addEventListener(
        'input',
        () => {

            inputCnpj.value =
                aplicarMascaraCNPJ(
                    inputCnpj.value
                );

        }
    );

}

document
.getElementById('administrarItens')
.addEventListener(
    'click',
    () => {

        window.location.href =
            '/adminItens';

    }
);



document
.getElementById('salvarItem')
.addEventListener(
    'click',
    async () => {

        const dados = {

            CodigoItem:
                document.getElementById(
                    'codigoItem'
                ).value.trim(),

            ItemDescricao:
                document.getElementById(
                    'itemDescricao'
                ).value.trim(),

            Ativo:
                document.getElementById(
                    'ativo'
                ).checked,

            Display:
                document.getElementById(
                    'display'
                ).checked

        };

        if (!dados.CodigoItem) {

            alert('Informe o código do item');

            return;
        }

        if (!dados.ItemDescricao) {

            alert('Informe a descrição do item');

            return;
        }
        
        const resposta =
            await fetch('/api/itens', {

                method: 'POST',

                headers: {
                    'Content-Type':
                    'application/json'
                },

                body: JSON.stringify(dados)

            });

        const resultado =
            await resposta.json();

        if (resultado.sucesso) {

            alert(
                'Item cadastrado com sucesso'
            );

            document.getElementById(
                'modalItem'
            ).style.display = 'none';

        } else {

            alert(
                resultado.erro ||
                resultado.mensagem
            );

        }

    }
);

    const btnNovoDistribuidor =
        document.getElementById('novoDistribuidor');

    const modal =
        document.getElementById('modalDistribuidor');

    const fecharModal =
        document.getElementById('fecharModal');

    if (btnNovoDistribuidor) {

        btnNovoDistribuidor.addEventListener(
            'click',
            () => {

                modal.style.display = 'block';

            }
        );

    }

    if (fecharModal) {

        fecharModal.addEventListener(
            'click',
            () => {

                modal.style.display = 'none';

            }
        );

    }
}
function apenasNumeros(valor){

    return String(valor || '').replace(/\D/g, '');

}

function aplicarFiltrosDistribuidores(){

    const filtroCnpj =
        apenasNumeros(
            document.getElementById('filtroCnpj')?.value || ''
        );

    const filtroRazao =
        normalizarTexto(
            document.getElementById('filtroRazao')?.value || ''
        );

    const filtroRepresentante =
        normalizarTexto(
            document.getElementById('filtroRepresentante')?.value || ''
        );

    const filtrados =
        listaDistribuidoresCompleta.filter(d => {

            const cnpjDistribuidor =
                apenasNumeros(d.CNPJ || '');

            const razaoDistribuidor =
                normalizarTexto(d.RazaoSocial || '');

            const representanteDistribuidor =
                normalizarTexto(d.Representante || '');

            const passaCnpj =
                !filtroCnpj ||
                cnpjDistribuidor.includes(filtroCnpj);

            const passaRazao =
                !filtroRazao ||
                razaoDistribuidor.includes(filtroRazao);

            const passaRepresentante =
                !filtroRepresentante ||
                representanteDistribuidor.includes(filtroRepresentante);

            return (
                passaCnpj &&
                passaRazao &&
                passaRepresentante
            );

        });

    montarTabelaDistribuidores(
        filtrados
    );

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

    let resultado = soma % 11 < 2
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

    resultado = soma % 11 < 2
        ? 0
        : 11 - soma % 11;

    if(resultado !== Number(digitos.charAt(1))){
        return false;
    }

    return true;

}