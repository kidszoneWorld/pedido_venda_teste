document.addEventListener("DOMContentLoaded", () => {
    const btPdfGeneration = document.getElementById('button_pdf');
    const clienteInput = document.getElementById('cliente');
    const cnpjInput = document.getElementById('cnpj');
    const responsavelInput = document.getElementById('responsavel');
    const valor = document.getElementById('valor');
    const representante = document.getElementById('representante');

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


    function prepararTelaParaPDF(){

        document.body.classList.add(
            'gerando-pdf'
        );

        window.scrollTo(
            0,
            0
        );

    }

    function restaurarTelaDepoisDoPDF(){

        document.body.classList.remove(
            'gerando-pdf'
        );

    }



    async function gerarEEnviarPDF() {
        console.log('Botão de PDF clicado');

       // Validação básica
        if(!clienteInput.value.trim()){

            alert(
                'Por favor, preencha o campo Cliente.'
            );

            clienteInput.focus();

            return;

        }

        if(!cnpjInput.value.trim()){

            alert(
                'Por favor, preencha o campo CNPJ.'
            );

            cnpjInput.focus();

            return;

        }

        if(!responsavelInput.value.trim()){

            alert(
                'Por favor, preencha o campo Responsável.'
            );

            responsavelInput.focus();

            return;

        }

        if(
            !representanteCarregado ||
            !representante?.value.trim()
        ){

            alert(
                'O representante ainda não foi identificado pela sessão. Aguarde o carregamento ou entre novamente no sistema.'
            );

            return;

        }

        // Ocultar elementos que não devem aparecer no PDF
        const elementsToHide = document.querySelectorAll('.no-print, .button-group');
        elementsToHide.forEach(el => el.style.display = 'none');

        const textareaObs = document.getElementById('observacoes');
        const observacoesPdf = document.getElementById('observacoesPdf');

        // Copia o texto do textarea para a div
        observacoesPdf.textContent = textareaObs.value;

        // Mostra a div e esconde o textarea
        observacoesPdf.style.display = 'block';
        textareaObs.style.display = 'none';

        const content = document.querySelector('.container');
        const cliente = clienteInput.value;
        const cnpj = cnpjInput.value;
        const responsavel = responsavelInput.value;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rep = representante.value
        const filename = `Solicitacao_Investimento_comercial_${cliente}_${cnpj}_${responsavel}_${timestamp}.pdf`;

        const options = {

            margin: [
                8,
                8,
                8,
                8
            ],

            filename:
                filename,

            image: {
                type:
                    'jpeg',

                quality:
                    0.98
            },

            html2canvas: {

                scale:
                    2,

                useCORS:
                    true,

                allowTaint:
                    false,

                logging:
                    false,

                backgroundColor:
                    '#ffffff',

                scrollX:
                    0,

                scrollY:
                    0,

                x:
                    0,

                y:
                    0,

                /*
                * Usa a largura real do conteúdo centralizado,
                * em vez da largura rolável da página.
                */
                windowWidth:
                    content.offsetWidth,

                onclone:
                    documentoClonado => {

                        documentoClonado
                            .body
                            .classList
                            .add(
                                'gerando-pdf'
                            );

                        const containerClonado =
                            documentoClonado
                                .querySelector(
                                    '.container'
                                );

                        if(containerClonado){

                            containerClonado.style.marginLeft =
                                'auto';

                            containerClonado.style.marginRight =
                                'auto';

                            containerClonado.style.left =
                                '0';

                            containerClonado.style.transform =
                                'none';

                        }

                    }

            },

            jsPDF: {

                unit:
                    'mm',

                format:
                    'a4',

                orientation:
                    'landscape',

                compress:
                    true

            },

            pagebreak: {

                mode: [
                    'avoid-all',
                    'css',
                    'legacy'
                ],

                avoid: [
                    '.form-grid',
                    '.payment-conditions',
                    '.action-table-container',
                    '.observations',
                    'tr',
                    'td',
                    'th'
                ]

            }

        };

        try {
            btPdfGeneration.disabled = true;
            console.log('Iniciando geração do PDF...');


            prepararTelaParaPDF();

            await new Promise(resolve => {

                requestAnimationFrame(() => {

                    requestAnimationFrame(
                        resolve
                    );

                });

            });

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

                    prepararTelaParaPDF();

                        await new Promise(resolve => {

                            requestAnimationFrame(() => {

                                requestAnimationFrame(
                                    resolve
                                );

                            });

                        });

                    // Gerar PDF para envio
                    const pdfBase64 = await html2pdf().set(options).from(content).outputPdf('datauristring');
                    console.log('PDF gerado para envio, iniciando requisição...');

const dadosInvestimento =
    window.montarDadosInvestimentoComercial();

if(
    !window.validarDadosInvestimentoComercial(
        dadosInvestimento
    )
){
    return;
}

const response =
    await fetch(
        '/send-pdf-investComercial',
        {
            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify({

                    pdfBase64:
                        pdfBase64,

                    razaoSocial:
                        cliente,

                    codCliente:
                        cnpj,

                    rep:
                        dadosInvestimento
                            .representanteInvestimento,

                    dadosInvestimento:
                        dadosInvestimento

                })
        }
    );

                    const result =
                        await response.json();

                    if(!response.ok){

    const detalhes = [
        result.mensagem,
        result.detalhe,
        result.codigoErro
            ? `Código PostgreSQL: ${result.codigoErro}`
            : '',
        result.coluna
            ? `Coluna: ${result.coluna}`
            : '',
        result.tabela
            ? `Tabela: ${result.tabela}`
            : '',
        result.restricao
            ? `Restrição: ${result.restricao}`
            : ''
    ]
    .filter(Boolean)
    .join('\n');

    throw new Error(
        detalhes ||
        'Erro ao salvar e enviar o investimento.'
    );

}

                    alert(
                        `${result.mensagem}\nNúmero do investimento: ${result.codigoInvestimento}`
                    );


                } catch (error) {
                    console.error('Erro ao enviar o e-mail:', error);
                    alert('Erro ao enviar o e-mail.');
                } 
                finally {

                    restaurarTelaDepoisDoPDF();

                    feedbackDiv.style.display =
                        'none';

                    textareaObs.style.display =
                        'block';

                    observacoesPdf.style.display =
                        'none';

                    elementsToHide.forEach(
                        elemento => {

                            elemento.style.display =
                                '';

                        }
                    );

                }
            };
        } catch (error) {
            console.error('Erro ao salvar ou enviar o PDF:', error);
            alert('Erro no processo: ' + error.message);
        }  finally {
    btPdfGeneration.disabled = false;
    elementsToHide.forEach(el => el.style.display = 'flex');
}
    }

    btPdfGeneration.addEventListener("click", gerarEEnviarPDF);
});