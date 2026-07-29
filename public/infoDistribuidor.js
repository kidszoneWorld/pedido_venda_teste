let contatoEditando = null;
let isOperador = false;

document.addEventListener(
    'DOMContentLoaded',
    async ()=>{

        await verificarPermissaoInfo();

        await carregarDistribuidor();

        await carregarContatos();

    }
);

async function verificarPermissaoInfo(){

    const response =
    await fetch(
        '/session-data'
    );

    const sessionData =
    await response.json();

    const userNumero =
        sessionData?.userNumero || null;

    isOperador =
        !userNumero;

    aplicarPermissaoCamposDistribuidor();

}

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
        
        document.getElementById('NomeContato').value = '';
        document.getElementById('FuncaoContato').value = '';
        document.getElementById('DataNascimentoContato').value = '';
        document.getElementById('HobbyContato').value = '';
        document.getElementById('EmailContato').value = '';
        document.getElementById('TelefoneContato').value = '';
        document.getElementById('ObservacaoContato').value = '';

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
        ).value.trim(),

    ObservacaoContato:
        document.getElementById(
            'ObservacaoContato'
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
    console.log(response)
    const d =
    await response.json();
    console.log(d)
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

    aplicarPermissaoCamposDistribuidor();
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

    tbody.innerHTML = '';

    contatos.forEach(c => {

        tbody.innerHTML += `

        <tr
            class="linhaContato"
            data-id="${c.CodigoContato}"
        >

            <td>
                <input
                    type="text"
                    class="campo-contato-bloqueavel nomeContatoTabela ${isOperador ? 'campo-liberado' : 'campo-bloqueado'}"4    value="${c.NomeContato || ''}"5    ${isOperador ? '' : 'readonly title="Campo bloqueado para representantes"'}
                    value="${c.NomeContato || ''}"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="text"
                    class="campo-contato-bloqueavel funcaoContatoTabela ${isOperador ? 'campo-liberado' : 'campo-bloqueado'}"4    value="${c.NomeContato || ''}"5    ${isOperador ? '' : 'readonly title="Campo bloqueado para representantes"'}
                    value="${c.FuncaoContato || ''}"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="date"
                    class="campo-contato-bloqueavel dataNascimentoContatoTabela ${isOperador ? 'campo-liberado' : 'campo-bloqueado'}"4    value="${c.NomeContato || ''}"5    ${isOperador ? '' : 'readonly title="Campo bloqueado para representantes"'}

                    value="${formatarDataInput(c.DataNascimentoContato)}"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="text"
                    class="campo-contato-bloqueavel hobbyContatoTabela ${isOperador ? 'campo-liberado' : 'campo-bloqueado'}"4    value="${c.NomeContato || ''}"5    ${isOperador ? '' : 'readonly title="Campo bloqueado para representantes"'}
                    value="${c.HobbyContato || ''}"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="text"
                    class="campo-contato-bloqueavel emailContatoTabela ${isOperador ? 'campo-liberado' : 'campo-bloqueado'}"4    value="${c.NomeContato || ''}"5    ${isOperador ? '' : 'readonly title="Campo bloqueado para representantes"'}                    
                    value="${c.EmailContato || ''}"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="text"
                    class="campo-contato-bloqueavel telefoneContatoTabela ${isOperador ? 'campo-liberado' : 'campo-bloqueado'}"4    value="${c.NomeContato || ''}"5    ${isOperador ? '' : 'readonly title="Campo bloqueado para representantes"'}                    
                    value="${c.TelefoneContato || ''}"
                    ${isOperador ? '' : 'readonly'}
                >
            </td>

            <td>
                <input
                    type="text"
                    class="observacaoContatoTabela"
                    value="${c.ObservacaoContato || ''}"
                >
            </td>

        </tr>

        `;

    });

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

function formatarTelefone(numero) {
  // Remove tudo que não for número
  const limpo = ('' + numero).replace(/\D/g, '');
  
  // Verifica se é celular (11 dígitos) ou fixo (10 dígitos)
  if (limpo.length === 11) {
    return limpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (limpo.length === 10) {
    return limpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  // Retorna o número original se não tiver 10 ou 11 dígitos
  return numero;
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
const btnSalvarContatosTabela =
    document.getElementById(
        'salvarContatosTabela'
    );

if(btnSalvarContatosTabela){

    btnSalvarContatosTabela.addEventListener(
        'click',
        salvarContatosTabela
    );

}
async function salvarContatosTabela(){

    const linhas =
        document.querySelectorAll(
            '.linhaContato'
        );

    for(const linha of linhas){

        const codigoContato =
            linha.dataset.id;

        let dados;

        if(isOperador){

            dados = {

                NomeContato:
                    linha.querySelector(
                        '.nomeContatoTabela'
                    ).value.trim(),

                FuncaoContato:
                    linha.querySelector(
                        '.funcaoContatoTabela'
                    ).value.trim(),

                DataNascimentoContato:
                    linha.querySelector(
                        '.dataNascimentoContatoTabela'
                    ).value,

                HobbyContato:
                    linha.querySelector(
                        '.hobbyContatoTabela'
                    ).value.trim(),

                EmailContato:
                    linha.querySelector(
                        '.emailContatoTabela'
                    ).value.trim(),

                TelefoneContato:
                    linha.querySelector(
                        '.telefoneContatoTabela'
                    ).value.trim(),

                ObservacaoContato:
                    linha.querySelector(
                        '.observacaoContatoTabela'
                    ).value.trim()

            };

            if(
                !dados.NomeContato ||
                !dados.FuncaoContato ||
                !dados.EmailContato ||
                !dados.TelefoneContato
            ){

                alert(
                    'Nome, Função, E-mail e Telefone são obrigatórios.'
                );

                return;

            }

        }else{

            dados = {

                ObservacaoContato:
                    linha.querySelector(
                        '.observacaoContatoTabela'
                    ).value.trim()

            };

        }

        const response =
        await fetch(
            `/api/contatos/${codigoContato}`,
            {
                method: 'PUT',

                headers: {
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

        if(!resultado.sucesso){

            alert(
                resultado.erro ||
                'Erro ao salvar contato.'
            );

            return;

        }

    }

    alert(
        'Contatos salvos com sucesso.'
    );

    carregarContatos();

}

function aplicarPermissaoCamposDistribuidor(){

    const camposDistribuidor = [
        'razaoSocial',
        'cnpj',
        'cidade',
        'uf',
        'representante'
    ];

    const botaoSalvarDistribuidor =
        document.getElementById(
            'salvarDistribuidor'
        );

    if(!isOperador){

        camposDistribuidor.forEach(id => {

            const campo =
                document.getElementById(id);

            if(campo){

                campo.readOnly = true;

                campo.classList.add(
                    'campo-distribuidor-bloqueado'
                );

                campo.title =
                    'Campo bloqueado para representantes';

            }

        });

        if(botaoSalvarDistribuidor){

            botaoSalvarDistribuidor.style.display =
                'none';

        }

    }else{

        camposDistribuidor.forEach(id => {

            const campo =
                document.getElementById(id);

            if(campo){

                campo.readOnly = false;

                campo.classList.remove(
                    'campo-distribuidor-bloqueado'
                );

                campo.classList.add(
                    'campo-distribuidor-liberado'
                );

            }

        });

        if(botaoSalvarDistribuidor){

            botaoSalvarDistribuidor.style.display =
                'inline-block';

        }

    }

}