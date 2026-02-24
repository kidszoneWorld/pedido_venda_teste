document.addEventListener("DOMContentLoaded", () => {
    // Elementos do modal de e-mail
    const emailModal = document.getElementById('emailModal');
    const buttonPdf = document.getElementById('button_pdf');
    const emailCloseButton = document.querySelector('.email-close-button');
    const sendEmailButton = document.getElementById('sendEmailButton');
    const cancelEmailButton = document.getElementById('cancelEmailButton');
    const emailToInput = document.getElementById('emailTo');
    const emailSubjectInput = document.getElementById('emailSubject');
    const emailBodyInput = document.getElementById('emailBody');
    const emailAttachmentInput = document.getElementById('emailAttachment');
    const attachmentList = document.getElementById('attachmentList');
    const totalSizeDisplay = document.getElementById('totalSizeDisplay');
    const selector = document.getElementById('seletor');
    
    // Elementos do modal de limite de tamanho
    const sizeLimitModal = document.getElementById('sizeLimitModal');
    const sizeLimitMessage = document.getElementById('sizeLimitMessage');
    const sizeLimitOkButton = document.getElementById('sizeLimitOkButton');
    const sizeLimitCloseButton = sizeLimitModal.querySelector('.close-button1');

    // E-mail fixo que não pode ser removido
    const FIXED_EMAIL = "pedidoskz@kidszoneworld.com.br";
    let generatedPdfFile = null;
    let additionalFiles = [];

    // Limite seguro em MB (18 MB para garantir que após codificação base64 não exceda 25 MB)
    const SAFE_SIZE_LIMIT_MB = 20;

    // Expressão regular para validar e-mails
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Função para validar um único e-mail
    function isValidEmail(email) {
        return emailRegex.test(email.trim());
    }

    // Função para validar uma lista de e-mails separados por ";"
    function validateEmailList(emailString) {
        if (!emailString) return true; // Campo vazio é válido (para "Cc")
        const emails = emailString.split(';').map(email => email.trim()).filter(email => email);
        return emails.every(email => isValidEmail(email));
    }

    // Função para formatar a data no padrão brasileiro (DD-MM-YYYY-hora-HH-MM)
    function formatarDataBrasileira() {
        const agora = new Date();
        const dia = String(agora.getDate()).padStart(2, '0');
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const ano = agora.getFullYear();
        const hora = String(agora.getHours()).padStart(2, '0');
        const minuto = String(agora.getMinutes()).padStart(2, '0');
        return `${dia}-${mes}-${ano}-hora-${hora}-${minuto}`;
    }

    // Mostrar Feedback
    function showFeedback(message) {
        const feedback1 = document.getElementById('feedback1');
        feedback1.style.display = 'block';
        feedback1.textContent = message;
    }

    // Ocultar Feedback
    function hideFeedback() {
        const feedback1 = document.getElementById('feedback1');
        feedback1.style.display = 'none';
        feedback1.textContent = '';
    }

    // Função para calcular o tamanho total dos anexos em MB
    function calcularTamanhoTotal() {
        let totalSize = generatedPdfFile ? generatedPdfFile.size : 0;
        additionalFiles.forEach(file => {
            totalSize += file.size;
        });
        return (totalSize / (1024 * 1024)).toFixed(2);
    }

    // Função para atualizar a exibição do tamanho total
    function atualizarTamanhoTotal() {
        const totalSizeMB = calcularTamanhoTotal();
        totalSizeDisplay.textContent = `Tamanho total: ${totalSizeMB} MB`;
    }
    

        // Função para verificar se todos os campos obrigatórios estão preenchidos
        function verificarCamposObrigatorios() {
            const campos = [
                'razao_social',
                'cod_cliente',
                'regime_especial',
                'agendamento',
                'dados_responsavel',
                'paletizada',
                'horario_entrega',
                'numero_nf'
            ];
    
            for (let campo of campos) {
                const input = document.getElementById(campo);
                if (!input.value.trim()) {
                    return false;
                }
            }
            return true;
        }
    
    // Função para gerar o PDF automaticamente
    async function gerarPDF() {
        const content = document.querySelector('.container');
        const razaoSocial = document.getElementById('razao_social').value || "Cliente";
        const timestamp = formatarDataBrasileira();
        const filename = `Cadastro_Cliente_${razaoSocial}_${timestamp}.pdf`;

        const options = {
            margin: [0, 0, 0, 0],
            filename: filename,
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
        };

        try {
            hideFeedback();
            buttonPdf.style.display = 'none';
            selector.style.display = 'none';

            const pdfBlob = await html2pdf().set(options).from(content).output('blob');
            generatedPdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
            return generatedPdfFile;
        } catch (error) {
            console.error('Erro ao gerar o PDF:', error);
            alert('Erro ao gerar o PDF: ' + error.message);
            return null;
        } finally {
            buttonPdf.style.display = 'block';
            selector.style.display = 'inline-block';
        }
    }

    // Função para converter um arquivo em base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Função para atualizar a lista de arquivos no tooltip
function atualizarListaAnexos() {
    attachmentList.innerHTML = '';

    // Exibe o PDF gerado (fixo, não removível)
    if (generatedPdfFile) {
        const li = document.createElement('li');
        li.textContent = generatedPdfFile.name;
        attachmentList.appendChild(li);
    }

    // Exibe os arquivos adicionais com botão de exclusão
    additionalFiles.forEach((file, index) => {
        const li = document.createElement('li');
        
        // Cria um contêiner para o nome do arquivo e o botão de exclusão
        const fileContainer = document.createElement('div');
        fileContainer.style.display = 'flex';
        fileContainer.style.alignItems = 'center';

        // Nome do arquivo
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = file.name;
        fileContainer.appendChild(fileNameSpan);

        // Botão de exclusão
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.style.marginLeft = '10px';
        deleteButton.style.color = 'red';
        deleteButton.style.border = 'none';
        deleteButton.style.background = 'none';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.fontWeight = 'bold';

        // Evento de clique para remover o arquivo
        deleteButton.addEventListener('click', () => {
            // Remove o arquivo da lista additionalFiles
            additionalFiles.splice(index, 1);
            // Atualiza os anexos no input de arquivo
            atualizarAnexos();
            // Atualiza a lista visual
            atualizarListaAnexos();
        });

        fileContainer.appendChild(deleteButton);
        li.appendChild(fileContainer);
        attachmentList.appendChild(li);
    });

    // Caso não haja arquivos (nem o PDF gerado, nem adicionais)
    if (!generatedPdfFile && additionalFiles.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum arquivo anexado';
        attachmentList.appendChild(li);
    }

    // Atualiza o tamanho total após atualizar a lista
    atualizarTamanhoTotal();
}

    // Função para preencher o modal de e-mail com valores fixos
    function preencherFormularioEmail() {
        const razaoSocial = document.getElementById('razao_social').value || "Cliente";

        emailToInput.value = FIXED_EMAIL;
        emailToInput.setAttribute('data-fixed', FIXED_EMAIL);

        const fixedSubject = `Solicitação Cadastro Cliente ${razaoSocial}`;
        emailSubjectInput.value = fixedSubject;
        emailSubjectInput.setAttribute('data-fixed', fixedSubject);

        const fixedMessage = `Segue os documentos solicitados para o cadastro do cliente ${razaoSocial}\n\n`;
        emailBodyInput.value = fixedMessage;
        emailBodyInput.setAttribute('data-fixed', fixedMessage);

        if (generatedPdfFile) {
            atualizarAnexos();
            atualizarListaAnexos();
        }
    }

    // Função para atualizar os anexos, mantendo o PDF fixo
    function atualizarAnexos() {
        const dataTransfer = new DataTransfer();

        if (generatedPdfFile) {
            dataTransfer.items.add(generatedPdfFile);
        }

        additionalFiles.forEach(file => {
            dataTransfer.items.add(file);
        });

        emailAttachmentInput.files = dataTransfer.files;
        atualizarListaAnexos();
    }

    // Impede a remoção do e-mail fixo no campo "Para"
    emailToInput.addEventListener('input', function(e) {
        const fixedPart = this.getAttribute('data-fixed');
        if (!this.value.includes(fixedPart)) {
            this.value = fixedPart + (this.value ? ';' + this.value : '');
        }
    });

    // Impede a remoção do texto fixo no campo "Assunto"
    emailSubjectInput.addEventListener('input', function(e) {
        const fixedPart = this.getAttribute('data-fixed');
        if (!this.value.startsWith(fixedPart)) {
            this.value = fixedPart + (this.value ? ' ' + this.value : '');
        }
    });

    // Impede a remoção do texto fixo no campo "Mensagem"
    emailBodyInput.addEventListener('input', function(e) {
        const fixedPart = this.getAttribute('data-fixed');
        if (!this.value.startsWith(fixedPart)) {
            this.value = fixedPart + this.value;
        }
    });

    // Gerencia os anexos para acumular arquivos
    emailAttachmentInput.addEventListener('change', function(e) {
        const newFiles = Array.from(this.files);
        const novosArquivosAdicionais = newFiles.filter(file => file.name !== generatedPdfFile?.name);
        novosArquivosAdicionais.forEach(newFile => {
            if (!additionalFiles.some(file => file.name === newFile.name)) {
                additionalFiles.push(newFile);
            }
        });
        atualizarAnexos();
    });

    // Ao clicar no botão "ENVIAR E-MAIL COM ANEXOS", verifica os campos obrigatórios antes de gerar o PDF e abrir o modal
    buttonPdf.addEventListener('click', async () => {
        if (!verificarCamposObrigatorios()) {
            alert('Por favor, preencha todos os campos obrigatórios na seção "INFORMAÇÕES NECESSÁRIAS"');
            return;
        }
        await gerarPDF();
        if (generatedPdfFile) {
            additionalFiles = [];
            preencherFormularioEmail();
            emailModal.style.display = 'block';
        }
    });

    // Fecha o modal ao clicar no botão de fechar
    emailCloseButton.addEventListener('click', () => {
        emailModal.style.display = 'none';
    });

    // Fecha o modal ao clicar no botão "Cancelar"
    cancelEmailButton.addEventListener('click', () => {
        emailModal.style.display = 'none';
    });

    // Fecha o modal de limite de tamanho ao clicar no botão "OK"
    sizeLimitOkButton.addEventListener('click', () => {
        sizeLimitModal.style.display = 'none';
    });

    // Fecha o modal de limite de tamanho ao clicar no botão de fechar
    sizeLimitCloseButton.addEventListener('click', () => {
        sizeLimitModal.style.display = 'none';
    });

    // Fecha o modal de limite de tamanho ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target == sizeLimitModal) {
            sizeLimitModal.style.display = 'none';
        }
        if (event.target == emailModal) {
            emailModal.style.display = 'none';
        }
    });

    // Envia o e-mail ao clicar no botão "Enviar"
    sendEmailButton.addEventListener('click', async () => {
        let emailTo = emailToInput.value;
        let emailCc = document.getElementById('emailCc').value;
        const emailSubject = emailSubjectInput.value;
        const emailBody = emailBodyInput.value;
        const emailAttachment = emailAttachmentInput.files;

        // Verifica se os campos obrigatórios estão preenchidos
        if (!emailTo || !emailSubject || !emailBody) {
            alert('Por favor, preencha os campos obrigatórios (Para, Assunto e Mensagem).');
            return;
        }

        // Valida os e-mails no campo "Para"
        if (!validateEmailList(emailTo)) {
            alert('Por favor, insira e-mails válidos no campo "Para". Use ";" para separar os e-mails.');
            return;
        }

        // Valida os e-mails no campo "Cc"
        if (emailCc && !validateEmailList(emailCc)) {
            alert('Por favor, insira e-mails válidos no campo "Cc". Use ";" para separar os e-mails.');
            return;
        }

        // Calcula o tamanho total dos anexos
        const totalSizeMB = parseFloat(calcularTamanhoTotal());

        // Verifica se o tamanho total excede o limite seguro
        if (totalSizeMB > SAFE_SIZE_LIMIT_MB) {
            sizeLimitMessage.textContent = `Os arquivos passam de ${totalSizeMB} MB. O limite do Gmail é de ${SAFE_SIZE_LIMIT_MB} MB. Por favor, envie uma quantidade menor neste e-mail e envie outro e-mail com os outros arquivos na sequência.`;
            sizeLimitModal.style.display = 'block';
            return;
        }

        try {
            // Fecha o modal imediatamente
            emailModal.style.display = 'none';

            // Mostra o feedback
            showFeedback('Estamos enviando o e-mail, aguarde...');

            // Converte o PDF gerado para base64
            const pdfBase64 = await fileToBase64(generatedPdfFile);

            // Converte todos os anexos adicionais para base64
            const additionalAttachments = await Promise.all(
                additionalFiles.map(async file => ({
                    filename: file.name,
                    base64: await fileToBase64(file)
                }))
            );

            // Faz a requisição para o servidor
            const response = await fetch('/send-client-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64,
                    razaoSocial: document.getElementById('razao_social').value || "Cliente",
                    emailTo,
                    emailCc,
                    subject: emailSubject,
                    message: emailBody,
                    additionalAttachments
                })
            });

            const result = await response.text();
            if (response.ok) {
                alert('E-mail enviado com sucesso!\nPara: ' + emailTo + '\nCc: ' + (emailCc || 'Nenhum') + '\nAssunto: ' + emailSubject);
                document.getElementById('emailForm').reset();
                generatedPdfFile = null;
                additionalFiles = [];
                atualizarListaAnexos();
            } else {
                throw new Error(result);
            }
        } catch (error) {
            console.error('Erro ao enviar o e-mail:', error);
            alert('Erro ao enviar o e-mail: ' + error.message);
        } finally {
            // Oculta o feedback após o término (sucesso ou erro)
            hideFeedback();
        }
    });
});