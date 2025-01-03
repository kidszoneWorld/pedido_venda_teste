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


// Função para obter o pedidoId e o status da URL
function getParamsFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        pedidoId: params.get('pedidoId'),
        status: params.get('status') || 6 // Valor padrão para status
    };
}
// Carregar detalhes do pedido
async function loadPedidoDetails() {
   
    showFeedback("Carregando pedido, aguarde...");

    const { pedidoId, status } = getParamsFromURL(); // Agora captura pedidoId e status
    if (!pedidoId) {
        alert('ID do pedido não encontrado na URL!');
        return;
    }

    try {
        console.log(`Carregando detalhes do pedido com ID: ${pedidoId} e Status: ${status}`);
        
        const response = await fetch(`/api/pedidos/${pedidoId}?status=${status}`);
        if (!response.ok) throw new Error('Erro ao buscar detalhes do pedido');

        const pedido = await response.json();
        hideFeedback();

        // Preencher campos com os dados do pedido
        document.getElementById('cnpj').value = pedido.cliente?.documento?.numeroTexto || '';
        document.getElementById('representante').value = pedido.representante?.nomeAbreviado || '';
        document.getElementById('razao_social').value = pedido.cliente?.nomeAbreviado || '';
        document.getElementById('cod_cliente').value = pedido.cliente?.codigo || '';
        document.getElementById('endereco').value = pedido.cliente?.endereco.logradouro || '';
        document.getElementById('bairro').value = pedido.cliente?.bairro || '';
        document.getElementById('cidade').value = pedido.detalhes.cliente.endereco.cidade.nome || '';
        document.getElementById('uf').value = pedido.cliente?.uf || '';
        document.getElementById('cep').value = pedido.cliente?.cep || '';
        document.getElementById('volume').value = pedido.volumes || '';

        document.getElementById('total').value = pedido.detalhes.financeiro.item.valorTotal
         ? pedido.detalhes.financeiro.item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '';

        document.getElementById('total_imp').value = pedido.detalhes.financeiro.item.valorFinanceiro
         ? pedido.detalhes.financeiro.item.valorFinanceiro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          : '';  

        document.getElementById('observacoes').value = pedido.detalhes.cliente.observacao || '';
        document.getElementById('pay').value = pedido.detalhes.condicaoPagamento.descricao || '';
        document.getElementById('codgroup').value = pedido.detalhes.listaPreco.id || '';
        document.getElementById('group').value = pedido.detalhes.listaPreco.descricao || '';
        document.getElementById('transp').value = pedido.detalhes_transporte.nomeAbreviado || '';

        // Preencher tabela de itens do pedido
        const tbody = document.getElementById('dadosPedido').querySelector('tbody');
        tbody.innerHTML = ''; // Limpar tabela

        // Certifique-se de acessar os itens dentro de 'detalhes'
        const detalheItens = pedido.detalhes?.itens || [];

        detalheItens.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.itemEmpresaId || ''}</td>
                <td>${item.quantidade || ''}</td>
                <td>${item.unidadeMedidaAbreviado || ''}</td>
                <td>${item.pack || ''}</td>
                <td>${item.descricao || ''}</td>
                <td>${item.tributos?.ipi?.aliquota 
                  ? item.tributos.ipi.aliquota.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' 
                  : ''}</td>
                <td>${item.financeiro.valorUnitarioFinal 
                  ? item.financeiro.valorUnitarioFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                  : ''}</td>
                <td>${item.valorComIpi || ''}</td>
                <td>${item.financeiro.valorTotalFinal 
                  ? item.financeiro.valorTotalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                  : ''}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar os detalhes do pedido:', error);
        showFeedback("Erro ao carregar dados. Recarregue a página e tente novamente.");
    }
}

// Executar ao carregar a página
loadPedidoDetails();
