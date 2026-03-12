//const html2pdf = require('html2pdf.js'); não descomente essa linha, pois faz parar de enviar email

document.addEventListener("DOMContentLoaded", () => {
    const btPdfGeneration = document.getElementById('button_pdf');
    const modal1 = document.getElementById('customModal1');
    const closeButton1 = document.querySelector('.close-button1');
    const confirmButton1 = document.getElementById('confirmButton1');
    const cancelButton1 = document.getElementById('cancelButton1');
    const helpWhats = document.getElementById('helpContainer');
    const feedbackDiv = document.getElementById('feedback1');
    const cnpjInput = document.getElementById('cnpj');

    async function gerarEEnviarPDF() {
        console.log('Botão de PDF clicado');

        // Validação das linhas da tabela
        let itemsToCheck = [];
        const tableRows = document.querySelectorAll('#dadosPedido tbody tr');

        // Verifica cada linha da tabela
        for (const row of tableRows) {
            // Garante que a linha tenha células e pelo menos 9 colunas (índices 0 a 8)
            if (row.cells.length >= 9) {
                const cell0 = row.cells[0];
                const cell1 = row.cells[1];
                const cell8 = row.cells[8];

                // Verifica se os inputs existem antes de acessá-los
                const input0 = cell0.querySelector('input');
                const input1 = cell1.querySelector('input');
                const input8 = cell8.querySelector('input');

                if (input0 && input1 && input8) {
                    const code = parseInt(input0.value);
                    const quantity = input1.value;
                    const total = input8.value;

                    // Verifica se o código é maior que 0 e se a quantidade é 0 ou o total está vazio
                    if (!isNaN(code) && code > 0 && (quantity === '0' || total === '')) {
                        itemsToCheck.push(input0.value);
                    }
                }
            }
        }

        // Se houver itens problemáticos, exibe o alerta e interrompe o processo
        if (itemsToCheck.length > 0) {
            const message = "Por favor, digite a quantidade dos seguintes itens: " + itemsToCheck.join(', ');
            alert(message);
            return;
        }

        const elementsToHide = document.querySelectorAll('.no-print');
        const elementsToHide1 = document.querySelectorAll('.button-group');

        elementsToHide.forEach(el => el.style.display = 'none');
        elementsToHide1.forEach(el1 => el1.style.display = 'none');
        helpWhats.style.display = 'none';

        const content = document.querySelector('.container');
        const razaoSocial = document.getElementById('razao_social').value;
        const codCliente = document.getElementById('cod_cliente').value;
        const representante = document.getElementById('representante').value;
        const emailRep = document.getElementById('email_rep').value;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Pedido de Venda ${razaoSocial} - ${codCliente} e Rep ${representante} - ${timestamp}.pdf`;
        const options = {
            margin: [0, 0, 0, 0],
            filename: filename,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
            pagebreak: { mode: 'avoid-all' }
        };

        try {
            btPdfGeneration.disabled = true;
            console.log('Iniciando geração do PDF...');

            const pdfBlob = await html2pdf().set(options).from(content).output('blob');
            const pdfURL = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = pdfURL;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('PDF baixado com sucesso.');
            alert('PDF criado e salvo nos downloads.');

            if (!modal1) {
                throw new Error('Modal1 não encontrado no DOM.');
            }
            console.log('Exibindo modal de confirmação...');
            modal1.style.display = "block";

            function fecharModal() {
                console.log('Fechando modal...');
                modal1.style.display = "none";
                elementsToHide.forEach(el => el.style.display = 'block');
                elementsToHide1.forEach(el1 => el1.style.display = 'flex');
                helpWhats.style.display = 'block';
            }

            closeButton1.onclick = fecharModal;
            cancelButton1.onclick = fecharModal;

            const currentConfirmButton = document.getElementById('confirmButton1');
            currentConfirmButton.onclick = async () => {
                console.log('Confirmação de envio clicada.');
                modal1.style.display = "none";
                feedbackDiv.textContent = 'Aguarde, estamos enviando o e-mail...';
                feedbackDiv.style.display = 'block';
                helpWhats.style.display = 'none';
                elementsToHide.forEach(el => el.style.display = 'none');
                cnpjInput.readOnly = true;

                try {
                    // Oculta a mensagem de feedback antes de gerar o PDF para envio
                    feedbackDiv.style.display = 'none';
                    
                    // Reexibe os elementos antes de gerar o PDF para envio
                    elementsToHide1.forEach(el1 => el1.style.display = 'none');

                    const pdfBase64 = await html2pdf().set(options).from(content).outputPdf('datauristring');
                    console.log('PDF gerado para envio, iniciando requisição...');

                    const response = await fetch('/send-pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pdfBase64, razaoSocial, codCliente, representante, emailRep })
                    });

                    const result = await response.text();
                    console.log('Resposta do servidor:', result);
                    alert(result);
                } catch (error) {
                    console.error('Erro ao enviar o e-mail:', error);
                    alert('Erro ao enviar o e-mail.');
                } finally {
                    // Agora restauramos a visibilidade de todos os elementos, incluindo elementsToHide1 e feedbackDiv
                    feedbackDiv.style.display = 'none';
                    elementsToHide.forEach(el => el.style.display = 'block');
                    elementsToHide1.forEach(el1 => el1.style.display = 'flex');
                    helpWhats.style.display = 'block';
                }
            };
        } catch (error) {
            console.error('Erro ao salvar ou enviar o PDF:', error);
            alert('Erro no processo: ' + error.message);
        } finally {
            btPdfGeneration.disabled = false;
            elementsToHide.forEach(el => el.style.display = 'block');
            elementsToHide1.forEach(el1 => el1.style.display = 'flex');
            helpWhats.style.display = 'block';
        }
    }

    function resetForm(excludeCnpj = false) {
        if (cnpjInput.readOnly) {
            return; // Sai da função se o campo estiver readonly
        }
        console.log('Resetando formulário...');

        // Limpa todos os campos da seção "DADOS DO CLIENTE", incluindo readonly
        document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Evita limpar o CNPJ se excludeCnpj for true
                if (excludeCnpj && element.id === 'cnpj') {
                    return;
                }
                element.value = ''; // Limpa todos os campos, incluindo readonly
            } else if (element.tagName === 'SELECT') {
                element.value = 'Venda'; // Reseta o select para "Venda"
            }
        });

        // Limpa a tabela "DADOS PEDIDO"
        document.querySelector('#dadosPedido tbody').innerHTML = '<tr class="tr_td"></tr>';

        // Limpa os campos de totais ("VOLUMES", "TOTAL PRODUTOS", "TOTAL C/IMP")
        document.getElementById('volume').value = '';
        document.getElementById('total').value = '';
        document.getElementById('total_imp').value = '';

        // Limpa o campo de observações
        document.getElementById('observation').value = '';

        // Reseta o botão de confirmação para evitar duplicatas de eventos
        const confirmButton1 = document.getElementById('confirmButton1');
        const newConfirmButton = confirmButton1.cloneNode(true);
        confirmButton1.parentNode.replaceChild(newConfirmButton, confirmButton1);
    }

    // Listener para limpar os campos ao clicar no campo CNPJ (evento focus)
    cnpjInput.addEventListener('focus', () => {
        console.log('Campo CNPJ clicado, resetando formulário...');
        resetForm(true); // Reseta o formulário, mas preserva o CNPJ
    });

    btPdfGeneration.addEventListener("click", gerarEEnviarPDF);
});