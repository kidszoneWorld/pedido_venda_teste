     // Mostrar Feedback
     function showFeedback(message) {
        const feedback = document.getElementById('feedback');
        feedback.style.display = 'block';
        feedback.textContent = message;
   }

// Ocultar Feedback
function hideFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'none';
    feedback.textContent = '';
}


// Função para obter o pedidoId e o status da URL// Função para obter parâmetros da URL
function getParamsFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        pedidoId: params.get('pedidoId'),
        status: params.get('status') || 6, // Valor padrão para status
        codPedido: params.get('codPedido') // Novo parâmetro para código do pedido
    };
}

// Carregar detalhes do pedido
async function loadPedidoDetails() {
    showFeedback("Carregando pedido, aguarde...");

    const { pedidoId, status, codPedido } = getParamsFromURL();
    
    // Verificar qual parâmetro está disponível e fazer a requisição apropriada
    try {
        let response;
        let pedido;
        
        if (codPedido) {
            // Nova rota usando código do pedido
            console.log(`Carregando detalhes do pedido com código: ${codPedido}`);
            response = await fetch(`/api/pedidos1/${codPedido}`);
        } 
        else if (pedidoId) {
            // Rota antiga usando ID do pedido
            console.log(`Carregando detalhes do pedido com ID: ${pedidoId} e Status: ${status}`);
            response = await fetch(`/api/pedidos/${pedidoId}?status=${status}`);
        }
        else {
            alert('Identificador do pedido não encontrado na URL!');
            return;
        }
        
        if (!response.ok) throw new Error('Erro ao buscar detalhes do pedido');
        
        pedido = await response.json();
        console.log('Detalhes do pedido carregados:', pedido);
        hideFeedback();
        
        // Preencher campos com os dados do pedido
        document.getElementById('cnpj').value = pedido.dados[0].cliente?.documento?.numeroTexto || '';
        document.getElementById('representante').value = 
            `${pedido.detalhes.representante[0]?.id || ''} - ${pedido.detalhes.representante[0]?.nomeAbreviado || ''}`;
        document.getElementById('razao_social').value = pedido.dados[0].cliente?.razaoSocial || '';
        document.getElementById('cod_cliente').value = pedido.dados[0].cliente?.codigo || '';
        document.getElementById('endereco').value = pedido.dados[0].cliente?.endereco.logradouro || '';
        document.getElementById('cidade').value = pedido.detalhes.cliente.endereco.cidade.nome || '';

        document.getElementById('total').value = pedido.detalhes.financeiro.item.valorTotal
            ? pedido.detalhes.financeiro.item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '';

        document.getElementById('total_imp').value = pedido.detalhes.financeiro.item.valorFinanceiro
            ? pedido.detalhes.financeiro.item.valorFinanceiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '';  

        document.getElementById('observacoes').value = pedido.dados[0].observacao || '';
        document.getElementById('observacoes1').value = pedido.detalhes.cliente.observacao || '';
        document.getElementById('pay').value = pedido.detalhes.condicaoPagamento.descricao || '';
        document.getElementById('codgroup').value = pedido.detalhes.listaPreco.id || '';
        document.getElementById('group').value = pedido.detalhes.listaPreco.descricao || '';
        document.getElementById('transp').value = pedido.detalhes_transporte.nomeAbreviado || '';
        document.getElementById('ref').value = pedido.detalhes.numeroReferencia || '';
        document.getElementById('pedido').value = pedido.dados[0].codigo || '';

        // Preencher tabela de itens do pedido
        const tbody = document.getElementById('dadosPedido').querySelector('tbody');
        tbody.innerHTML = ''; // Limpar tabela

        // Certifique-se de acessar os itens dentro de 'detalhes'
        const detalheItens = pedido.detalhes?.itens || [];

        let totalVolumes = 0;

        detalheItens.forEach(item => {
            totalVolumes += item.quantidade || 0; // Soma a quantidade de cada item

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.itemEmpresaId || ''}</td>
                <td>${item.quantidade || ''}</td>
                <td>${item.unidadeMedidaAbreviado || ''}</td>
                <td>${item.descricao || ''}</td>
                <td>${item.tributos?.ipi?.aliquota 
                    ? item.tributos.ipi.aliquota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' 
                    : '0,00%'}</td>
                <td>${item.financeiro.valorUnitarioFinal 
                    ? item.financeiro.valorUnitarioFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                    : ''}</td>
                <td>${(item.financeiro.valorUnitarioFinal * (1 + (item.tributos?.ipi?.aliquota / 100))).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</td>
                <td>${((item.financeiro.valorUnitarioFinal * (1 + (item.tributos?.ipi?.aliquota / 100))) * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Preencher o campo de volumes com o total calculado
        document.getElementById('volume').value = totalVolumes.toLocaleString('pt-BR');
    } catch (error) {
        console.error('Erro ao carregar os detalhes do pedido:', error);
        showFeedback("Erro ao carregar dados. Recarregue a página e tente novamente.");
    }
}


    document.addEventListener('DOMContentLoaded', () => {
        // Fazer uma chamada à API para obter os dados da sessão
        fetch('/session-data')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao obter dados da sessão');
                }
                return response.json();
            })
            .then(data => {
                // Verificar se o atributo "numero" existe no objeto "user"
                const hasNumero = data.user?.numero;

                if (hasNumero) {
                    // Ocultar a div "sistema" se o atributo "numero" existir
                    const sistemaDiv = document.getElementById('sistema');
                    if (sistemaDiv) {
                        sistemaDiv.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao verificar o usuário:', error);
            });
    });

// Executar ao carregar a página
loadPedidoDetails();
