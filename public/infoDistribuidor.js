let contatoEditando = null;
document.addEventListener(
    'DOMContentLoaded',
    async ()=>{

        await carregarDistribuidor();

        await carregarContatos();

    }
);

async function editarContato(codigoContato){

    contatoEditando =
        codigoContato;

    const response =
    await fetch(
        `/api/contatos/${codigoContato}`
    );

    const contato =
        await response.json();

    document.getElementById(
        'NomeContato'
    ).value =
        contato.NomeContato || '';

    document.getElementById(
        'FuncaoContato'
    ).value =
        contato.FuncaoContato || '';

    document.getElementById(
        'DataNascimentoContato'
    ).value =
        contato.DataNascimentoContato
        ? contato.DataNascimentoContato.split('T')[0]
        : '';

    document.getElementById(
        'HobbyContato'
    ).value =
        contato.HobbyContato || '';

    document.getElementById(
        'EmailContato'
    ).value =
        contato.EmailContato || '';

    document.getElementById(
        'TelefoneContato'
    ).value =
        contato.TelefoneContato || '';

    document.getElementById(
        'modalContato'
    ).style.display = 'block';

}

document
.getElementById('novoContato')
.addEventListener(
    'click',
    ()=>{

        contatoEditando = null;

        document.getElementById('NomeContato').value = '';
        document.getElementById('FuncaoContato').value = '';
        document.getElementById('DataNascimentoContato').value = '';
        document.getElementById('HobbyContato').value = '';
        document.getElementById('EmailContato').value = '';
        document.getElementById('TelefoneContato').value = '';

        document
        .getElementById(
            'modalContato'
        )
        .style.display = 'block';

    }
);


document
.getElementById('fecharModalContato')
.addEventListener(
    'click',
    ()=>{

        document
        .getElementById('modalContato')
        .style.display='none';

    }
);

document
.getElementById('salvarContato')
.addEventListener(
    'click',
    async ()=>{

        const dados = {

    NomeContato:
        document.getElementById(
            'NomeContato'
        ).value.trim(),

    FuncaoContato:
        document.getElementById(
            'FuncaoContato'
        ).value.trim(),

    DataNascimentoContato:
        document.getElementById(
            'DataNascimentoContato'
        ).value,

    HobbyContato:
        document.getElementById(
            'HobbyContato'
        ).value.trim(),

    EmailContato:
        document.getElementById(
            'EmailContato'
        ).value.trim(),

    TelefoneContato:
        document.getElementById(
            'TelefoneContato'
        ).value.trim()

};

        if (
                !dados.NomeContato.trim() ||
                !dados.FuncaoContato.trim() ||
                !dados.EmailContato.trim() ||
                !dados.TelefoneContato.trim()
            ){

                alert(
                    'Nome, Função, E-mail e Telefone são obrigatórios.'
                );

                return;

            }

        let url;
        let metodo;

        if(contatoEditando){

            url =
                `/api/contatos/${contatoEditando}`;

            metodo =
                'PUT';

        }else{

            url =
                `/api/distribuidor/${codigoDistribuidor}/contatos`;

            metodo =
                'POST';

        }

        const response =
        await fetch(
            url,
            {
                method:metodo,

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:
                JSON.stringify(dados)
            }
        );

        const resultado =
            await response.json();

        if(resultado.sucesso){

            alert(
                'Contato salvo'
            );

            contatoEditando =
                null;

            document.getElementById(
                'modalContato'
            ).style.display =
                'none';

            carregarContatos();

        }

    }
);

document
.getElementById('salvarDistribuidor')
.addEventListener(
    'click',
    async ()=>{

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

        const response =
        await fetch(

            `/api/distribuidor/${codigoDistribuidor}`,

            {
                method:'PUT',

                headers:{
                    'Content-Type':
                    'application/json'
                },

                body:JSON.stringify(dados)
            }
        );

        const resultado =
        await response.json();

        if(resultado.sucesso){

            alert(
                'Distribuidor atualizado'
            );

        }

    }
);

document
.getElementById('novoContato')
.addEventListener(
    'click',
    ()=>{

        document
        .getElementById(
            'modalContato'
        )
        .style.display='block';

    }
);

const codigoDistribuidor =
window.location.pathname
.split('/')
.pop();
console.log(codigoDistribuidor);
async function carregarDistribuidor(){

    const response =
    await fetch(
        `/api/distribuidor/${codigoDistribuidor}`
    );

    const d =
    await response.json();

    document.getElementById(
        'razaoSocial'
    ).value =
    d.RazaoSocial;

    document.getElementById(
        'cnpj'
    ).value =
    d.CNPJ;

    document.getElementById(
        'cidade'
    ).value =
    d.Cidade;

    document.getElementById(
        'uf'
    ).value =
    d.UF;

    document.getElementById(
        'representante'
    ).value =
    d.Representante;

}
async function carregarContatos(){

    const response =
    await fetch(
        `/api/distribuidor/${codigoDistribuidor}/contatos`
    );

    const contatos =
    await response.json();

    const tbody =
    document.getElementById(
        'listaContatos'
    );

    tbody.innerHTML='';

    contatos.forEach(c=>{

        tbody.innerHTML += `

        <tr>

            <td>
                ${c.NomeContato}
            </td>

            <td>
                ${c.FuncaoContato}
            </td>

            <td>
                ${c.EmailContato}
            </td>

            <td>
                ${c.TelefoneContato}
            </td>

            <td>


                    <button
                        class="button"
                        onclick="editarContato(${c.CodigoContato})"
                    >
                        Editar
                    </button>

                    <button
                        class="button"
                        onclick="excluirContato(${c.CodigoContato})"
                    >
                        Excluir
                    </button>
                </td>


        </tr>

        `;

    });

}

async function excluirContato(codigoContato){

    const confirmar = confirm(
        'Deseja realmente excluir este contato?'
    );

    if(!confirmar){

        return;

    }

    try{

        const response =
        await fetch(
            `/api/contatos/${codigoContato}`,
            {
                method: 'DELETE'
            }
        );

        const resultado =
        await response.json();

        if(resultado.sucesso){

            alert(
                'Contato excluído com sucesso.'
            );

            carregarContatos();

        }else{

            alert(
                resultado.erro ||
                'Erro ao excluir contato.'
            );

        }

    }
    catch(err){

        console.error(err);

        alert(
            'Erro ao excluir contato.'
        );

    }

}