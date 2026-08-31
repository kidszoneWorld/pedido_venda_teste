document.addEventListener(
    'DOMContentLoaded',
    async () => {

        document
            .getElementById(
                'botaoFechar'
            )
            ?.addEventListener(
                'click',
                () => {

                    window.close();

                }
            );

        const parametros =
            new URLSearchParams(
                window.location.search
            );

        const codigo =
            Number(
                parametros.get('id')
            );

        if(!Number.isInteger(codigo)){

            mostrarErroDetalhes(
                'Código do investimento inválido.'
            );

            return;

        }

        await carregarDetalhesInvestimento(
            codigo
        );

    }
);

async function carregarDetalhesInvestimento(
    codigo
){

    mostrarMensagemDetalhes(
        'Carregando investimento...'
    );

    try{

        const response =
            await fetch(
                `/api/investimentos-comerciais/${codigo}`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

        if(
            response.redirected &&
            response.url.includes('/login2')
        ){

            window.location.replace(
                '/login2'
            );

            return;

        }

        const resultado =
            await response.json();

        if(!response.ok){

            throw new Error(
                resultado.mensagem ||
                resultado.error ||
                'Erro ao carregar investimento.'
            );

        }

        if(
            !resultado.success ||
            !resultado.data
        ){

            throw new Error(
                'A API retornou dados inválidos.'
            );

        }

        preencherDetalhesInvestimento(
            resultado.data
        );

        document
            .getElementById(
                'mensagemDetalhes'
            )
            .style.display =
                'none';

        document
            .getElementById(
                'conteudoDetalhes'
            )
            .style.display =
                'block';

    }catch(error){

        console.error(
            'Erro ao carregar detalhes:',
            error
        );

        mostrarErroDetalhes(
            error.message
        );

    }

}

function preencherDetalhesInvestimento(
    investimento
){

    preencherTexto(
        'detalheCodigo',
        investimento.codigoInvestimento
    );

    preencherTexto(
        'detalheStatus',
        formatarNomeStatusEmail(investimento.status)
    );

    preencherTexto(
        'detalheRepresentante',
        investimento.representante
    );

    preencherTexto(
        'detalheCliente',
        investimento.razaoSocial
    );

    preencherTexto(
        'detalheCnpj',
        formatarCNPJDetalhes(
            investimento.cnpj
        )
    );

    preencherTexto(
        'detalheTelefone',
        investimento.telefone
    );

    preencherTexto(
        'detalheEndereco',
        investimento.endereco
    );

    preencherTexto(
        'detalheResponsavel',
        investimento.responsavel
    );

    preencherTexto(
        'detalheCargo',
        investimento.cargo
    );

    preencherTexto(
        'detalheTipo',
        investimento.tipoInvestimento
    );

    preencherTexto(
        'detalheDescricao',
        investimento.descricaoInvestimento
    );

    preencherTexto(
        'detalheVigenciaInicial',
        formatarData(investimento.vigenciaInicial)
    );

    preencherTexto(
        'detalheVigenciaFinal',
        formatarData(investimento.vigenciaFinal)
    );

    preencherTexto(
        'detalheValorInvestimento',
        formatarMoedaDetalhes(
            investimento.valorInvestimento
        )
    );

    preencherTexto(
        'detalheValorCompra',
        formatarMoedaDetalhes(
            investimento.valorCompra
        )
    );

    preencherTexto(
        'detalhePercentual',
        formatarPercentualDetalhes(
            investimento.investimentoSobreCompra
        )
    );

    preencherTexto(
        'detalheResumo',
        investimento.resumo
    );

    preencherTexto(
        'detalheObservacaoDescricao',
        investimento.observacaoDescricao
    );

    preencherTexto(
        'detalheObservacao',
        investimento.observacao
    );

    preencherParcelasDetalhes(
        investimento.parcelas
    );

}

function formatarNomeStatusEmail(status){

    if(status == 'aprovacao_comercial'){
        return 'Aprovado/Comercial';
    }
    else if(status == 'aprovacao_diretoria'){
        return 'Aprovado/Diretoria';
    }

    return status;

}

function preencherParcelasDetalhes(
    parcelas
){

    const tbody =
        document.querySelector(
            '#tabelaParcelasDetalhes tbody'
        );

    if(!tbody){
        return;
    }

    tbody.innerHTML =
        '';

    if(
        !Array.isArray(parcelas) ||
        parcelas.length === 0
    ){

        const linha =
            document.createElement(
                'tr'
            );

        linha.innerHTML = `
            <td
                colspan="3"
                style="text-align: center;"
            >
                Nenhuma parcela cadastrada.
            </td>
        `;

        tbody.appendChild(
            linha
        );

        return;

    }

    parcelas.forEach(parcela => {

        const linha =
            document.createElement(
                'tr'
            );

        const celulaNumero =
            document.createElement(
                'td'
            );

        const celulaValor =
            document.createElement(
                'td'
            );

  

        celulaNumero.textContent =
            parcela.parcela || '';

        celulaValor.textContent =
            formatarMoedaDetalhes(
                parcela.valorParcela
            );


        linha.appendChild(
            celulaNumero
        );

        linha.appendChild(
            celulaValor
        );

        tbody.appendChild(
            linha
        );

    });

}

function formatarData(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function preencherTexto(
    id,
    valor
){

    const elemento =
        document.getElementById(
            id
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ''
            ? 'Não informado'
            : String(valor);

}

function formatarCNPJDetalhes(cnpj){

    const numeros =
        String(cnpj || '')
            .replace(/\D/g, '');

    if(numeros.length !== 14){
        return numeros;
    }

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );

}

function formatarMoedaDetalhes(valor){

    return Number(
        valor || 0
    )
    .toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );

}

function formatarPercentualDetalhes(valor){

    return Number(
        valor || 0
    )
    .toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ) + '%';

}

function mostrarMensagemDetalhes(
    mensagem
){

    const elemento =
        document.getElementById(
            'mensagemDetalhes'
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        mensagem;

    elemento.style.display =
        'block';

    elemento.style.color =
        '#333333';

}

function mostrarErroDetalhes(
    mensagem
){

    const elemento =
        document.getElementById(
            'mensagemDetalhes'
        );

    if(!elemento){
        return;
    }

    elemento.textContent =
        mensagem;

    elemento.style.display =
        'block';

    elemento.style.color =
        '#b00020';

}