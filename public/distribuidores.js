console.log('Distribuidores.js carregado');

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        await verificarPermissao();

        configurarEventos();

        carregarDistribuidores();

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
}

async function carregarDistribuidores(){

    const resposta =
        await fetch('/api/distribuidores');

    const distribuidores =
        await resposta.json();

    const tbody =
        document.getElementById('listaDistribuidores');

    tbody.innerHTML = '';

    distribuidores.forEach(d => {

        tbody.innerHTML += `
            <tr>
                <td>${d.CNPJ}</td>
                <td>${d.RazaoSocial}</td>
                <td>${d.Representante}</td>

                <td>
                    <button onclick="abrirSellIn(${d.CodigoDistribuidor})">
                        SellIn
                    </button>

                    <button onclick="abrirSellOut(${d.CodigoDistribuidor})">
                        SellOut
                    </button>

                    <button onclick="abrirDisplay(${d.CodigoDistribuidor})">
                        Display
                    </button>

                    <button onclick="abrirRedes(${d.CodigoDistribuidor})">
                        Redes
                    </button>

                    <button onclick="abrirPositivacao(${d.CodigoDistribuidor})">
                        Positivação
                    </button>

                    <button onclick="abrirInfo(${d.CodigoDistribuidor})">
                        Info
                    </button>

                    <button onclick="abrirEstoque(${d.CodigoDistribuidor})">
                        Estoque
                    </button>

                    <button onclick="abrirInvestimentos(${d.CodigoDistribuidor})">
                        Investimentos
                    </button>
                </td>
            </tr>
        `;
    });

}

async function controlarPermissoes(){

    const response =
        await fetch('/session-data');

    const session =
        await response.json();

    if(session.userNumero){

        document
            .getElementById('novoDistribuidor')
            .style.display = 'none';

        document
            .getElementById('novoItem')
            .style.display = 'none';
    }
}

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
                ).value,

            CNPJ:
                document.getElementById(
                    'cnpj'
                ).value,

            Cidade:
                document.getElementById(
                    'cidade'
                ).value,

            UF:
                document.getElementById(
                    'uf'
                ).value,

            Representante:
                document.getElementById(
                    'representante'
                ).value

        };

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

        }else{

            alert(
                'Erro ao cadastrar'
            );

        }

    }
);

function configurarEventos() {

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