// Variáveis globais para armazenar os dados dos JSONs
let detalhesProdutosData;
let imgProdutosData;

//Função para atualizar os caches no navegador
const timestamp1 = new Date().getTime();

// Função para carregar os JSONs
function carregarDados() {
    fetch( `/data/detalhesProdutos.json?cacheBust=${timestamp1}` ) // Caminho do JSON de detalhes
        .then(response => response.json())
        .then(data => {
            detalhesProdutosData = data;
        });

    fetch(`/data/img_produtos.json?cacheBust=${timestamp1}`) // Caminho do JSON de imagens
        .then(response => response.json())
        .then(data => {
            imgProdutosData = data;
        });
}

// Função para carregar os JSONs 
fetch(`/data/item_ativos_detalhes.json?cacheBust=${timestamp1}`)
    .then(response => response.json())
    .then(data => {
        itemData = data;
    });


// Função para buscar os dados do produto pelo código
function buscarProduto(codigo) {
    if (!detalhesProdutosData || !imgProdutosData) return null;

    let produtoDetalhes = null;
    let produtoImagem = null;

    // Buscar detalhes do produto
    for (let i = 1; i < detalhesProdutosData.length; i++) {
        if (detalhesProdutosData[i][0].toString() === codigo) {
            produtoDetalhes = detalhesProdutosData[i];
            break;
        }
    }


     // Buscar imagem e link do produto
     for (let i = 0; i < imgProdutosData.length; i++) {
        if (imgProdutosData[i][0].toString() === codigo) {
            produtoImagem = imgProdutosData[i]; // Array completo para capturar imagem e link
            break;
        }
    }

    return { produtoDetalhes, produtoImagem };
}

// Função para preencher os campos ao digitar o código
document.getElementById('codigo').addEventListener('input', function () {
    const codigo = this.value.trim();

    // Limpar os campos se o código estiver vazio
    if (!codigo) {
        limparCamposProduto();
        return;
    }

    const produto = buscarProduto(codigo);

    if (produto && produto.produtoDetalhes) {
        preencherCamposProduto(produto.produtoDetalhes, produto.produtoImagem);
    } else {
        limparCamposProduto();
    }
});


// Evento para buscar pela descrição
document.getElementById('descricao').addEventListener('keyup', function (event) {
    const termoBusca = this.value.trim().toLowerCase();
    const resultadosContainer = document.getElementById('resultados-busca');
    const listaResultados = document.getElementById('lista-resultados');

    // Exibe apenas após três caracteres ou Enter
    if (termoBusca.length >= 3 || event.key === 'Enter') {
        listaResultados.innerHTML = ''; // Limpa a lista
        resultadosContainer.style.display = 'none';

        // Filtra produtos com base na descrição
        const resultados = detalhesProdutosData.filter((produto) =>
            produto[1].toLowerCase().includes(termoBusca)
        );

        // Se houver resultados, exibe na lista
        if (resultados.length > 0) {
            resultados.forEach((produto) => {
                const item = document.createElement('li');
                item.textContent = `Código: ${produto[0]} - Descrição: ${produto[1]}`;
                item.style.cursor = 'pointer';
                item.style.padding = '5px';
                item.style.borderBottom = '1px solid #ddd';

                // Evento ao clicar em um resultado
                item.addEventListener('click', () => {
                    document.getElementById('codigo').value = produto[0]; // Define o código no campo
                    document.getElementById('codigo').dispatchEvent(new Event('input')); // Dispara o evento 'input'
                    resultadosContainer.style.display = 'none'; // Oculta a lista de resultados
                });

                listaResultados.appendChild(item);
            });

            resultadosContainer.style.display = 'block';
        } else {
            listaResultados.innerHTML = '<li style="padding: 5px;">Nenhum resultado encontrado</li>';
            resultadosContainer.style.display = 'block';
        }
    } else {
        resultadosContainer.style.display = 'none'; // Oculta a lista
    }
});



// Função para preencher os campos do produto
function preencherCamposProduto(detalhes, imagem) {

    const imgContainer = document.querySelector('.imagem-produto');
    const imgElemento = document.getElementById('imagem');

     // Verificar se imagem está disponível
     if (imagem && imagem[1]) {
        imgElemento.src = imagem[1]; // Caminho da imagem
        imgElemento.alt = detalhes[1] || 'Imagem do Produto';

        // Capturar o link (último elemento do array da imagem)
        const linkProduto = imagem[imagem.length - 1];

        // Verificar se o link já existe
        let linkElement = imgContainer.querySelector('a');
        if (!linkElement) {
            // Criar o link apenas se ele ainda não existir
            linkElement = document.createElement('a');
            linkElement.appendChild(imgElemento);
            imgContainer.appendChild(linkElement);
        }

        // Configurar o link dinâmico
        linkElement.href = linkProduto;
        linkElement.target = '_blank'; // Abrir em nova aba

         // Criar tooltip personalizada
         linkElement.classList.add('tooltip-container'); // Classe para o link
         let tooltip = linkElement.querySelector('.tooltip');
         if (!tooltip) {
             tooltip = document.createElement('span');
             tooltip.classList.add('tooltip');
             tooltip.textContent = 'Clique aqui para mais imagens do produto';
             linkElement.appendChild(tooltip);
         }

        // Garantir que a imagem está dentro do link
        linkElement.innerHTML = '';
        linkElement.appendChild(imgElemento);
        linkElement.appendChild(tooltip);

    } else {
        // Caso a imagem não esteja disponível, exibir imagem padrão
        imgElemento.src = 'placeholder.jpg'; // Caminho da imagem padrão
        imgElemento.alt = 'Imagem não disponível';

        // Remover link caso exista
        const linkElement = imgContainer.querySelector('a');
        if (linkElement) {
            imgContainer.removeChild(linkElement);
            imgContainer.appendChild(imgElemento);
        }
    }


    
    document.getElementById('descricao').value = detalhes[1]; // Descrição
    document.getElementById('classificacao').value = detalhes[2]; // Classificação Fiscal
    document.getElementById('ipi').value =  detalhes[24] 
                                            ? `${detalhes[24].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                                            : '0%'; // IPI
    document.getElementById('preco-ref').value = `R$ ${detalhes[23].toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ',')}`; // Preço Referência
    document.getElementById('preco-ipi').value = `R$ ${((detalhes[23] * (1 + (detalhes[24] || 0) / 100))).toFixed(2).toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ',')}`; // Preço com IPI
    document.getElementById('codigo-master').value = `${detalhes[3]}`;
    document.getElementById('qtd-caixa').value = `${detalhes[4]}`;
    document.getElementById('peso-caixa').value = `${detalhes[5]}`;
    document.getElementById('comprimento-caixa').value = `${detalhes[6]}`;
    document.getElementById('largura-caixa').value = `${detalhes[7]}`;
    document.getElementById('altura-caixa').value = `${detalhes[8]}`;
    document.getElementById('codigo-display').value = `${detalhes[9]}`;
    document.getElementById('qtd-display').value = `${detalhes[10]}`;
    document.getElementById('peso-display').value = `${detalhes[11]}`;
    document.getElementById('comprimento-display').value = `${detalhes[12]}`;
    document.getElementById('largura-display').value = `${detalhes[13]}`;
    document.getElementById('altura-display').value = `${detalhes[14]}`;
    document.getElementById('codigo-unidade').value = `${detalhes[15]}`;
    document.getElementById('peso-unitario').value = `${detalhes[16]}`;
    document.getElementById('comprimento-unitario').value = `${detalhes[17]}`;
    document.getElementById('largura-unitario').value = `${detalhes[18]}`;
    document.getElementById('altura-unitario').value = `${detalhes[19]}`;
    document.getElementById('altura-max').value = 1.30;
    document.getElementById('altura-pallet').value = 0.15;


           // Tratamento dos campos para número float para fazer os calculos
           const alturaMax = parseFloat(document.getElementById('altura-max').value); // T4
           const alturaPallet = parseFloat(document.getElementById('altura-pallet').value); // X4
           const pesoCaixa = parseFloat(document.getElementById('peso-caixa').value); // E15
           const comprimentoCaixa = parseFloat(document.getElementById('comprimento-caixa').value); // E16
           const larguraCaixa = parseFloat(document.getElementById('largura-caixa').value); // E17
           const alturaCaixa = parseFloat(document.getElementById('altura-caixa').value); // E18


           //variáveis dos resultados
           let qtdLastro = '';
           let qtdAltura = '';
           let cxPorPallet = '';
           let altPallet = '';
           let pesoPallet = '';

           
           // Calculo campo QUANTIDADE LASTRO:------inicio--------------------------------------------------------------------------
           if (comprimentoCaixa > 0 && larguraCaixa > 0) {
           qtdLastro = Math.floor((1 * alturaMax) / (comprimentoCaixa * larguraCaixa)); // Cálculo arredondado para baixo
           }
           document.getElementById('qtd-lastro').value = qtdLastro || ''; // Exibe vazio se ocorrer erro
           // Calculo campo QUANTIDADE LASTRO:----fim ----------------------------------------------------------------------------

            
            // Calculo campo QUATIDADE ALTURA:------inicio--------------------------------------------------------------------------
            if (alturaCaixa > 0) { // Verificando se alturaCaixa é maior que 0 para evitar divisão por zero
                qtdAltura = Math.floor(alturaMax / alturaCaixa); // Realizando o cálculo e arredondando para baixo
            }
            document.getElementById('qtd-altura').value = qtdAltura || '';
            // Calculo campo QUATIDADE ALTURA:----fim ----------------------------------------------------------------------------



            // Calculo campo QUATIDADE DE CAIXA POR PALLET:------inicio--------------------------------------------------------------------------
            // Obtendo os valores de qtdLastro e qtdAltura
            const qtdLastro1 = parseInt(document.getElementById('qtd-lastro').value) || 0; // Convertendo para inteiro ou 0 se vazio
            const qtdAltura1 = parseInt(document.getElementById('qtd-altura').value) || 0; // Convertendo para inteiro ou 0 se vazio

            // Calculando o número de caixas por pallet
            if (qtdLastro1 > 0 && qtdAltura1 > 0) {
                cxPorPallet = qtdLastro1 * qtdAltura1; // Multiplicação
            }
            document.getElementById('cx-plt').value = cxPorPallet || '';
            // Calculo campo QUATIDADE DE CAIXA POR PALLET:------fim--------------------------------------------------------------------------


         
          
          // Calculo campo ALTURA PALLET:------inicio--------------------------------------------------------------------------
           const alturaCaixa1 = parseFloat(document.getElementById('altura-caixa').value) || 0; // E18
           const alturaPallet1 = parseFloat(document.getElementById('altura-pallet').value) || 0; // X4

           // Calculando ((E18 * T9) - X4)
          if (alturaCaixa > 0 && qtdAltura > 0) { // Verificando se os valores são válidos
              altPallet = (alturaCaixa1 * qtdAltura1) - alturaPallet1;
          }
          document.getElementById('alt-pallet').value = altPallet > 0 
                                                    ? altPallet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                                                    : '';
          // Calculo campo ALTURA PALLET:------fim--------------------------------------------------------------------------

           

           // Calculo campo PESO PALLET:------inicio--------------------------------------------------------------------------
           const cxPorPallet1 = parseInt(document.getElementById('cx-plt').value) || 0;

           if(cxPorPallet1 > 0 && pesoCaixa > 0){

              pesoPallet = cxPorPallet1 * pesoCaixa

              // Arredondar para duas casas decimais e formatar com vírgula
              pesoPallet = pesoPallet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
           }
           document.getElementById('peso-pallet').value = pesoPallet || '' ;
           // Calculo campo PESO PALLET:------fim--------------------------------------------------------------------------
   



}

// Função para limpar os campos do produto
function limparCamposProduto() {
    document.getElementById('descricao').value = '';
    document.getElementById('classificacao').value = '';
    document.getElementById('ipi').value = '';
    document.getElementById('preco-ref').value = '';
    document.getElementById('preco-ipi').value = '';
    document.getElementById('codigo-master').value = ``;
    document.getElementById('qtd-caixa').value = ``;
    document.getElementById('peso-caixa').value = ``;
    document.getElementById('comprimento-caixa').value = ``;
    document.getElementById('largura-caixa').value = ``;
    document.getElementById('altura-caixa').value = ``;
    document.getElementById('codigo-display').value = ``;
    document.getElementById('qtd-display').value = ``;
    document.getElementById('peso-display').value = ``;
    document.getElementById('comprimento-display').value = ``;
    document.getElementById('largura-display').value = ``;
    document.getElementById('altura-display').value = ``;
    document.getElementById('codigo-unidade').value = ``;
    document.getElementById('peso-unitario').value = ``;
    document.getElementById('comprimento-unitario').value = ``;
    document.getElementById('largura-unitario').value = ``;
    document.getElementById('altura-unitario').value = ``;
    document.getElementById('altura-max').value = ``;
    document.getElementById('altura-pallet').value = ``;
    document.getElementById('qtd-lastro').value = ``;
    document.getElementById('qtd-altura').value = ``;
    document.getElementById('cx-plt').value = ``;
    document.getElementById('alt-pallet').value = ``;
    document.getElementById('peso-pallet').value = ``;
  

   const imgElemento = document.getElementById('imagem');
    imgElemento.src = 'placeholder.jpg';
    imgElemento.alt = 'Imagem não disponível';

    const imgContainer = document.querySelector('.imagem-produto');
    const linkElement = imgContainer.querySelector('a');
    if (linkElement) {
        imgContainer.removeChild(linkElement);
        imgContainer.appendChild(imgElemento);
    }
    
}


// Inicializar os dados ao carregar a página
document.addEventListener('DOMContentLoaded', carregarDados);


// Evento para gerar PDF
document.getElementById("button_pdf1").addEventListener("click", async () => {

    const content1 = document.querySelector('.container');
    const cod_item = document.getElementById('codigo').value;
    const descricao = document.getElementById('descricao').value;
    const feedbackDiv = document.getElementById('feedback1'); // Div de feedback
    const imagemDiv = document.querySelector('.imagem-produto'); // Div da imagem
    const button_save= document.getElementById('button_pdf1'); // Botão de salvar PDF

    // Exibe a mensagem de feedback
    feedbackDiv.textContent = 'Aguarde, estamos salvando o PDF...';
    feedbackDiv.style.display = 'block';

    imagemDiv.style.display = 'none'; // Oculta a imagem no PDF
    button_save.style.display = 'none'; // Oculta o botão de salvar

    // Cria uma cópia do conteúdo para manipular sem afetar a página
    const contentClone = content1.cloneNode(true);
    const feedbackClone = contentClone.querySelector('#feedback1');
    if (feedbackClone) {
        feedbackClone.style.display = 'none'; // Oculta a mensagem no clone
    }

    const filename1 = `Codigo do item: ${cod_item} - Descrição: ${descricao}.pdf`;

    // Garante que a imagem seja pré-carregada no DOM
    const imgElement = contentClone.querySelector("#imagem");
    if (imgElement && imgElement.src) {
        console.log("Imagem a ser carregada:", imgElement.src); // Log para depuração
        try {
            // Pré-carregar a imagem
            const imgPreload = new Image();
            imgPreload.crossOrigin = "anonymous"; // Tenta carregar a imagem com CORS
            await new Promise((resolve, reject) => {
                imgPreload.onload = () => {
                    console.log("Imagem pré-carregada com sucesso");
                    imgElement.src = imgPreload.src; // Atualiza o src no clone
                    resolve();
                };
                imgPreload.onerror = () => {
                    console.error("Erro ao pré-carregar a imagem");
                    reject(new Error("Falha ao carregar a imagem"));
                };
                imgPreload.src = imgElement.src;
            });
        } catch (error) {
            console.error("Erro ao pré-carregar a imagem:", error);
            imgElement.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='; // Imagem placeholder em Base64 (1x1 pixel)
        }
    } else {
        console.warn("Nenhuma imagem encontrada para carregar");
    }

    const options1 = {
        margin: [0, 0, 0, 0],
        filename: filename1,
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: null // Garante fundo transparente
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "Portrait" },
        pagebreak: { mode: 'avoid-all' }
    };

    // Gera o PDF após garantir que a imagem está pronta
    html2pdf().set(options1).from(contentClone).save().then(() => {
        alert('PDF criado e baixado na pasta de downloads');
        feedbackDiv.style.display = 'none';
        imagemDiv.style.display = 'block'; // Exibe a imagem novamente
        button_save.style.display = 'block'; // Exibe o botão de salvar
    }).catch((error) => {
        console.error("Erro ao gerar o PDF:", error);
        feedbackDiv.textContent = 'Erro ao salvar o PDF.';
    });
});


// Função para formatar a data atual no formato YYYY-MM-DD
function getCurrentDateFormatted() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // +1 porque os meses começam em 0
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Função para exportar os dados para Excel
function exportToExcel(data) {
    // O primeiro array do JSON é o cabeçalho
    const headers = data[0];
    
    // Os arrays subsequentes são os dados dos produtos
    const exportData = data.slice(1).map(row => {
        let rowData = {};
        headers.forEach((header, index) => {
            rowData[header] = row[index] || ''; // Substitui null/undefined por string vazia
        });
        return rowData;
    });

    // Criar uma nova planilha e worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

    // Ajustar a largura das colunas (opcional)
    worksheet['!cols'] = headers.map(() => ({ wch: 20 })); // Define largura de 20 para todas as colunas

    // Definir o nome do arquivo com a data atual
    const currentDate = getCurrentDateFormatted();
    const fileName = `Produtos_Kids_Zone_${currentDate}.xlsx`;

    // Exportar o arquivo
    XLSX.writeFile(workbook, fileName);
}

// Evento para exportar para Excel
document.getElementById('exportExcel1').addEventListener('click', async () => {
    if (!itemData || itemData.length === 0) {
        const feedbackDiv = document.getElementById('feedback1');
        feedbackDiv.textContent = 'Nenhum dado disponível para exportar.';
        feedbackDiv.style.display = 'block';
        setTimeout(() => {
            feedbackDiv.style.display = 'none';
        }, 3000);
        return;
    }

    exportToExcel(itemData);
});

