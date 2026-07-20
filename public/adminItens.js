document.addEventListener(
    'DOMContentLoaded',
    carregarItens
);


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


async function salvarItem(codigo){

    const dados = {

        ItemDescricao:
            document.getElementById(
                `desc-${codigo}`
            ).value,

        Ativo:
            document.getElementById(
                `ativo-${codigo}`
            ).checked,

        Display:
            document.getElementById(
                `display-${codigo}`
            ).checked

    };

    const resposta =
        await fetch(
            `/api/itens/${codigo}`,
            {
                method: 'PUT',

                headers: {
                    'Content-Type':
                    'application/json'
                },

                body:
                    JSON.stringify(dados)
            }
        );

    if(resposta.ok){

        alert(
            'Item atualizado'
        );

    }
}

async function carregarItens(){

    const resposta =
        await fetch('/api/itens');

    const itens =
        await resposta.json();
    
    const tbody =
        document.getElementById(
            'listaItens'
        );

    tbody.innerHTML = '';

    itens.forEach(item => {

        tbody.innerHTML += `

            <tr>

                <td>
                    ${item.CodigoItem}
                </td>

                <td>
                    <input
                        type="text"
                        style="width:100%; box-sizing:border-box;"
                        value="${item.ItemDescricao}"
                        id="desc-${item.CodigoItem}"
                    >
                </td>

                <td>
                    <input
                        type="checkbox"
                        
                        id="ativo-${item.CodigoItem}"
                        ${item.Ativo ? 'checked' : ''}
                    >
                </td>

                <td>
                    <input
                        type="checkbox"
                        id="display-${item.CodigoItem}"
                        ${item.Display ? 'checked' : ''}
                    >
                </td>

                <td>

                    <button class="button"
                        onclick="salvarItem('${item.CodigoItem}')"
                    >

                        Salvar

                    </button>

                </td>

            </tr>

        `;

    });

}