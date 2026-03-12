document.addEventListener("DOMContentLoaded", () => {
    const btPdfGeneration = document.getElementById('button_pdf');
    const clienteInput = document.getElementById('cliente');
    const cnpjInput = document.getElementById('cnpj');
    const responsavelInput = document.getElementById('responsavel');

    // Criar modal dinamicamente
    const modal = document.createElement('div');
    modal.id = 'customModal1';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 5px; text-align: center;">
            <span class="close-button1" style="float: right; cursor: pointer;">×</span>
            <p>Deseja enviar o PDF por e-mail?</p>
            <button id="confirmButton1">Enviar</button>
            <button id="cancelButton1">Cancelar</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Div de feedback para status do envio de e-mail
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'feedback1';
    feedbackDiv.style.display = 'none';
    feedbackDiv.style.position = 'fixed';
    feedbackDiv.style.bottom = '10px';
    feedbackDiv.style.right = '10px';
    feedbackDiv.style.background = '#f0f0f0';
    feedbackDiv.style.padding = '10px';
    feedbackDiv.style.borderRadius = '5px';
    document.body.appendChild(feedbackDiv);

    async function gerarEEnviarPDF() {
        console.log('Botão de PDF clicado');

        // Validação básica
        if (!clienteInput.value || !cnpjInput.value || !responsavelInput.value) {
            alert('Por favor, preencha os campos Cliente, CNPJ e Responsável.');
            return;
        }

        // Ocultar elementos que não devem aparecer no PDF
        const elementsToHide = document.querySelectorAll('.no-print, .button-group');
        elementsToHide.forEach(el => el.style.display = 'none');

        const content = document.querySelector('.container');
        const cliente = clienteInput.value;
        const cnpj = cnpjInput.value;
        const responsavel = responsavelInput.value;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `Investimento_promotor_KZ_${cliente}_${cnpj}_${timestamp}.pdf`;

        const options = {
            margin: [10, 10, 10, 10],
            filename: filename,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
            pagebreak: { mode: 'avoid-all' }
        };

        try {
            btPdfGeneration.disabled = true;
            console.log('Iniciando geração do PDF...');

            // Gerar e baixar o PDF
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

            // Exibir modal de confirmação
            console.log('Exibindo modal de confirmação...');
            modal.style.display = "block";

            function fecharModal() {
                console.log('Fechando modal...');
                modal.style.display = "none";
                elementsToHide.forEach(el => el.style.display = 'flex');
            }

            document.querySelector('.close-button1').onclick = fecharModal;
            document.getElementById('cancelButton1').onclick = fecharModal;

            document.getElementById('confirmButton1').onclick = async () => {
                console.log('Confirmação de envio clicada.');
                modal.style.display = "none";
                feedbackDiv.textContent = 'Aguarde, estamos enviando o e-mail...';
                feedbackDiv.style.display = 'block';
                elementsToHide.forEach(el => el.style.display = 'none');

                try {
                    // Gerar PDF para envio
                    const pdfBase64 = await html2pdf().set(options).from(content).outputPdf('datauristring');
                    console.log('PDF gerado para envio, iniciando requisição...');

                    const response = await fetch('/send-pdf-investPromotor', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pdfBase64,
                            razaoSocial: cliente,
                            codCliente: cnpj,
                        })
                    });

                    const result = await response.text();
                    console.log('Resposta do servidor:', result);
                    alert(result);
                } catch (error) {
                    console.error('Erro ao enviar o e-mail:', error);
                    alert('Erro ao enviar o e-mail.');
                } finally {
                    feedbackDiv.style.display = 'none';
                    elementsToHide.forEach(el => el.style.display = 'flex');
                }
            };
        } catch (error) {
            console.error('Erro ao salvar ou enviar o PDF:', error);
            alert('Erro no processo: ' + error.message);
        } finally {
            btPdfGeneration.disabled = false;
            elementsToHide.forEach(el => el.style.display = 'flex');
        }
    }

    btPdfGeneration.addEventListener("click", gerarEEnviarPDF);
});