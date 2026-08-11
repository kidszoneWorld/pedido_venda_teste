// ======================================================================
// 🌍 VARIÁVEIS GLOBAIS
// ======================================================================

let devolucaoAtual = null;
let edicaoBloqueada = false;
let dataBaseDevolucao = null;

const el =
    id =>
    document.getElementById(
        id
    );

// ======================================================================
// 🔧 HELPERS
// ======================================================================

function getIdFromUrl(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(
        'id'
    );

}

function mostrarFeedback(mensagem){

    const feedback =
        el(
            'feedback1'
        );

    if(feedback){

        feedback.style.display =
            'block';

        feedback.textContent =
            mensagem;

    }

}

function ocultarFeedback(){

    const feedback =
        el(
            'feedback1'
        );

    if(feedback){

        feedback.style.display =
            'none';

        feedback.textContent =
            '';

    }

}

function formatarCNPJ(cnpj){

    if(!cnpj){
        return '';
    }

    const limpo =
        String(cnpj)
        .replace(
            /\D/g,
            ''
        )
        .padStart(
            14,
            '0'
        );

    return limpo.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );

}

function formatarCEP(cep){

    if(!cep){
        return '';
    }

    const limpo =
        String(cep)
        .replace(
            /\D/g,
            ''
        )
        .padStart(
            8,
            '0'
        );

    return limpo.replace(
        /^(\d{5})(\d{3})$/,
        '$1-$2'
    );

}

function formatarDataInput(data){

    if(!data){
        return '';
    }

    if(data instanceof Date){

        if(isNaN(data)){
            return '';
        }

        return formatarDataISO(
            data
        );

    }

    const valor =
        String(data)
        .trim();

    if(!valor){
        return '';
    }

    if(valor.includes('T')){

        return valor
            .split('T')[0];

    }

    if(/^\d{4}-\d{2}-\d{2}$/.test(valor)){

        return valor;

    }

    if(/^\d{2}\/\d{2}\/\d{4}$/.test(valor)){

        const partes =
            valor.split('/');

        const dia =
            partes[0];

        const mes =
            partes[1];

        const ano =
            partes[2];

        return `${ano}-${mes}-${dia}`;

    }

    const dataObj =
        new Date(valor);

    if(isNaN(dataObj)){
        return '';
    }

    return formatarDataISO(
        dataObj
    );

}

function formatarNumeroBR(valor){

    return Number(
        valor || 0
    ).toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}

function converterMoedaParaNumero(valor){

    return parseFloat(
        String(valor || '')
            .replace(
                'R$',
                ''
            )
            .replace(
                /\./g,
                ''
            )
            .replace(
                ',',
                '.'
            )
            .trim()
    ) || 0;

}

function converterQuantidadeParaInteiro(valor){

    if(
        valor === null ||
        valor === undefined ||
        valor === ''
    ){
        return 0;
    }

    const numero =
        Number(
            String(valor)
            .replace(
                'R$',
                ''
            )
            .replace(
                ',',
                '.'
            )
            .trim()
        );

    if(isNaN(numero)){
        return 0;
    }

    return Math.trunc(
        numero
    );

}

function formatarDataISO(data){

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const dia =
        String(
            data.getDate()
        ).padStart(
            2,
            '0'
        );

    return `${ano}-${mes}-${dia}`;

}

function obterDataBaseDevolucao(){

    if(!dataBaseDevolucao){

        console.error(
            'Data base da devolução não definida.'
        );

        return null;

    }

    return new Date(
        dataBaseDevolucao + 'T00:00:00'
    );

}

function obterDataBaseDevolucaoISO(){

    const dataBase =
        obterDataBaseDevolucao();

    if(!dataBase){
        return '';
    }

    return formatarDataISO(
        dataBase
    );

}

function obterDataLimite180DiasISO(){

    const dataBase =
        obterDataBaseDevolucao();

    if(!dataBase){
        return '';
    }

    const limite =
        new Date(
            dataBase
        );

    limite.setDate(
        limite.getDate() - 180
    );

    return formatarDataISO(
        limite
    );

}

function dataDentroDoLimite180Dias(dataValor){

    if(!dataValor){
        return false;
    }

    const dataBase =
        obterDataBaseDevolucao();

    if(!dataBase){
        return false;
    }

    const dataInformada =
        new Date(
            dataValor + 'T00:00:00'
        );

    dataBase.setHours(
        0,
        0,
        0,
        0
    );

    const limite =
        new Date(
            dataBase
        );

    limite.setDate(
        limite.getDate() - 180
    );

    limite.setHours(
        0,
        0,
        0,
        0
    );

    return (
        dataInformada >= limite &&
        dataInformada <= dataBase
    );

}

// ======================================================================
// 🚀 INICIALIZAÇÃO
// ======================================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        configurarEventos();
        await carregarDevolucao();

    }
);

// ======================================================================
// ⚙️ EVENTOS
// ======================================================================

function configurarEventos(){

    const btnVoltar =
        el(
            'voltarPainel'
        );

    if(btnVoltar){

        btnVoltar.addEventListener(
            'click',
            () => {

                window.location.href =
                    '/devolucaoPanel';

            }
        );

    }

    const btnSalvar =
        el(
            'salvarEdicaoDevolucao'
        );

    if(btnSalvar){

        btnSalvar.addEventListener(
            'click',
            salvarEdicaoDevolucao
        );

    }

    const btnAdicionar =
        el(
            'adicionarLinha'
        );

    if(btnAdicionar){

        btnAdicionar.addEventListener(
            'click',
            () => {

                if(edicaoBloqueada){

                    alert(
                        'Esta devolução não pode ser editada.'
                    );

                    return;

                }

                adicionarNovaLinhaEditavel();

            }
        );

    }

    const btnExcluirLinha =
        el(
            'excluirLinha'
        );

    if(btnExcluirLinha){

        btnExcluirLinha.addEventListener(
            'click',
            () => {

                const tbody =
                    document.querySelector(
                        '#dadosPedido tbody'
                    );

                if(
                    tbody &&
                    tbody.rows.length > 0 &&
                    !edicaoBloqueada
                ){

                    tbody.deleteRow(
                        tbody.rows.length - 1
                    );

                    atualizarTotais();
                    garantirLinhaInicial();

                }

            }
        );

    }

}

// ======================================================================
// 📥 CARREGAR DEVOLUÇÃO
// ======================================================================

async function carregarDevolucao(){

    const id =
        getIdFromUrl();

    if(!id){

        alert(
            'ID da devolução não informado.'
        );

        window.location.href =
            '/devolucaoPanel';

        return;

    }

    try{

        mostrarFeedback(
            'Carregando devolução...'
        );

        const response =
        await fetch(
            `/api/devolucao/${id}`
        );

        if(!response.ok){

            throw new Error(
                'Erro ao buscar a devolução.'
            );

        }

        const dev =
            await response.json();

        devolucaoAtual =
            dev;

        dataBaseDevolucao =
            formatarDataInput(
                dev.data ||
                dev.Data
            );

        console.log(
            'Data original da devolução:',
            dev.data || dev.Data
        );

        console.log(
            'Data base ISO usada no limite:',
            dataBaseDevolucao
        );

        if(!dataBaseDevolucao){

            alert(
                'Não foi possível identificar a data de criação da devolução. A edição será bloqueada.'
            );

            edicaoBloqueada =
                true;

        }

        preencherDadosDevolucao(
            dev
        );

        await preencherCodgroupPeloCliente(
            dev
        );

        renderizarProdutos(
            dev.produtos || []
        );

        renderizarProdutos(
            dev.produtos || []
        );

        verificarPermissaoEdicao(
            dev
        );
        

        atualizarTotais();

    }catch(err){

        console.error(err);

        alert(
            err.message ||
            'Erro ao carregar devolução.'
        );

    }finally{

        ocultarFeedback();

    }

}

function obterListaPrecoId(){

    const campoCodgroup =
        document.getElementById(
            'codgroup'
        );

    return (
        campoCodgroup?.value ||
        devolucaoAtual?.codgroup ||
        devolucaoAtual?.codGroup ||
        devolucaoAtual?.listaId ||
        devolucaoAtual?.listaPrecoId ||
        devolucaoAtual?.ListaPrecoId ||
        devolucaoAtual?.ListaPrecoID ||
        ''
    );

}

function verificarPermissaoEdicao(dev){

    const status =
        String(
            dev.status || ''
        ).toLowerCase();

    const finalizado =
        Number(
            dev.finalizado || 0
        ) === 1;

    const podeEditar =
        status === 'pendente' &&
        !finalizado;

    edicaoBloqueada =
        !podeEditar;

    const aviso =
        el(
            'avisoEdicao'
        );

    const btnSalvar =
        el(
            'salvarEdicaoDevolucao'
        );

    const btnAdicionar =
        el(
            'adicionarLinha'
        );



}

// ======================================================================
// 🧾 PREENCHIMENTO DE DADOS GERAIS
// ======================================================================

function preencherDadosDevolucao(dev){

    el('devId').value =
        dev.id || '';

    el('statusDevolucao').value =
        dev.status || '';

    el('cnpj').value =
        formatarCNPJ(
            dev.cnpj
        );

    el('cod_cliente').value =
        dev.codCliente || '';

    el('razao_social').value =
        dev.razaoSocial || '';

    el('representante').value =
        dev.representante || '';

    el('endereco').value =
        dev.endereco || '';

    el('bairro').value =
        dev.bairro || '';

    el('cidade').value =
        dev.cidade || '';

    el('uf').value =
        dev.uf || '';

    el('cep').value =
        formatarCEP(
            dev.cep
        );

    el('telefone').value =
        dev.telefone || '';

    el('email').value =
        dev.email || '';

    el('email_fiscal').value =
        dev.emailFiscal || '';

    el('observation').value =
        dev.motivo || '';
    const campoCodgroup =
    el(
        'codgroup'
    );

    if(campoCodgroup){

        campoCodgroup.value =
            dev.codgroup ||
            dev.codGroup ||
            dev.listaId ||
            dev.listaPrecoId ||
            dev.ListaPrecoId ||
            dev.ListaPrecoID ||
            '';

    }
}

// ======================================================================
// 📦 TABELA DE PRODUTOS
// ======================================================================

function renderizarProdutos(produtos){

    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    tbody.innerHTML =
        '';

    produtos.forEach(
        produto => {

            adicionarNovaLinhaEditavel(
                produto
            );

        }
    );

    garantirLinhaInicial();

}

function adicionarNovaLinhaEditavel(produto = null){

    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    const tr =
        document.createElement(
            'tr'
        );

    for(
        let i = 0;
        i < 11;
        i++
    ){

        const td =
            document.createElement(
                'td'
            );

        if(i === 10){

            td.style.display =
                'none';

        }

        if(i === 7){

            const btn =
                document.createElement(
                    'button'
                );

            btn.type =
                'button';

            btn.classList.add(
                'btn-remover-linha'
            );

            btn.innerText =
                'Excluir';

            btn.addEventListener(
                'click',
                () => {

                    if(edicaoBloqueada){

                        alert(
                            'Esta devolução não pode ser editada.'
                        );

                        return;

                    }

                    tr.remove();
                    atualizarTotais();
                    garantirLinhaInicial();

                }
            );

            td.appendChild(
                btn
            );

            tr.appendChild(
                td
            );

            continue;

        }

        const input =
            document.createElement(
                'input'
            );

        if(i === 1){

            input.type =
                'date';

            input.min =
                obterDataLimite180DiasISO();

            input.max =
                obterDataBaseDevolucaoISO();

        }else if(i === 5){

            input.type =
                'number';

            input.step =
                '1';

            input.min =
                '1';

            input.inputMode =
                'numeric';

        }else{

            input.type =
                'text';

        }

        input.style.padding =
            '5px';

        input.style.width =
            '100%';

        input.style.boxSizing =
            'border-box';

        configurarClasseCampo(
            input,
            i
        );

        preencherInputProduto(
            input,
            i,
            produto
        );

        if(i === 5){

            input.value =
                String(input.value || '')
                .replace(
                    /\D/g,
                    ''
                );

            input.addEventListener(
                'input',
                () => {

                    input.value =
                        String(input.value || '')
                        .replace(
                            /\D/g,
                            ''
                        );

                    calcularLinha(
                        tr
                    );

                }
            );

        }

        if(
            i === 6 ||
            i === 9
        ){

            input.readOnly =
                true;

        }

        if(
            i === 8 ||
            i === 9
        ){

            const wrapperMoeda =
                document.createElement(
                    'div'
                );

            wrapperMoeda.classList.add(
                'campo-moeda'
            );

            const simboloMoeda =
                document.createElement(
                    'span'
                );

            simboloMoeda.textContent =
                'R$';

            wrapperMoeda.appendChild(
                simboloMoeda
            );

            wrapperMoeda.appendChild(
                input
            );

            td.appendChild(
                wrapperMoeda
            );

        }else{

            td.appendChild(
                input
            );

        }

        tr.appendChild(
            td
        );

        configurarEventosLinha(
            input,
            i,
            tr,
            tbody
        );

    }

    tbody.appendChild(
        tr
    );

    atualizarTotais();

    if(edicaoBloqueada){

        bloquearLinha(
            tr
        );

    }

}

function configurarClasseCampo(input, indiceColuna){

    const classesPorIndice = {
        0: 'nfOrigemInput',
        1: 'dataInput',
        2: 'codigoItemInput',
        3: 'descricaoInput',
        4: 'loteInput',
        5: 'quantidadeInput',
        6: 'uvInput',
        8: 'precoUnitarioInput',
        9: 'totalInput',
        10: 'itemIdInput'
    };

    if(classesPorIndice[indiceColuna]){

        input.classList.add(
            classesPorIndice[indiceColuna]
        );

    }

}

function preencherInputProduto(input, indiceColuna, produto){

    if(!produto){
        return;
    }

    switch(indiceColuna){

        case 0:

            input.value =
                produto.nfOrigem ||
                produto.nforigem ||
                '';

            break;

        case 1:

            input.value =
                formatarDataInput(
                    produto.ProdData ||
                    produto.data
                );

            break;

        case 2:

            input.value =
                produto.codigoItem ||
                '';

            break;

        case 4:

            input.value =
                produto.lote ||
                '';

            break;

        case 5:

            input.value =
                produto.quantidade
                ? converterQuantidadeParaInteiro(
                    produto.quantidade
                )
                : '';

            break;

        case 6:

            input.value =
                produto.uv ||
                produto.Uv ||
                'UN';

            break;

        case 3:

            input.value =
                produto.descricao ||
                '';

            break;

        case 8:

            input.value =
                formatarNumeroBR(
                    produto.precoUnitario ||
                    produto.precounitario ||
                    0
                );

            break;

        case 9:

            input.value =
                formatarNumeroBR(
                    produto.total ||
                    0
                );

            break;

        case 10:

            input.value =
                produto.devProdId ||
                '';

            break;

        default:
            break;

    }

}

function configurarEventosLinha(input, indiceColuna, tr, tbody){

    input.addEventListener(
        'keydown',
        e => {

            if(edicaoBloqueada){
                return;
            }

            const linhas =
                Array.from(
                    tbody.querySelectorAll(
                        'tr'
                    )
                );

            const linhaAtual =
                linhas.indexOf(
                    tr
                );

            if(
                e.key === 'ArrowUp' &&
                linhaAtual > 0
            ){

                e.preventDefault();

                linhas[linhaAtual - 1]
                ?.cells[indiceColuna]
                ?.querySelector(
                    'input'
                )
                ?.focus();

            }

            if(e.key === 'ArrowDown'){

                e.preventDefault();

                linhas[linhaAtual + 1]
                ?.cells[indiceColuna]
                ?.querySelector(
                    'input'
                )
                ?.focus();

            }

            if(
                e.key === 'Enter' ||
                e.key === 'Tab'
            ){

                e.preventDefault();

                navegarEnterTab(
                    indiceColuna,
                    linhaAtual,
                    linhas,
                    tr
                );

            }

        }
    );

    if(indiceColuna === 2){

        input.addEventListener(
            'blur',
            () => {

                tratarCodigoItem(
                    input,
                    tr
                );

            }
        );

    }

    if(indiceColuna === 8){

        input.addEventListener(
            'input',
            () => {

                calcularLinha(
                    tr
                );

            }
        );

    }

}

// ======================================================================
// ⌨️ NAVEGAÇÃO
// ======================================================================

function navegarEnterTab(indiceColuna, linhaAtual, linhas, tr){

    if(indiceColuna === 0){

        tr.cells[1]
        ?.querySelector(
            'input'
        )
        ?.focus();

        return;

    }

    if(indiceColuna === 1){

        tr.cells[2]
        ?.querySelector(
            'input'
        )
        ?.focus();

        return;

    }

    if(indiceColuna === 2){

        tr.cells[3]
        ?.querySelector(
            'input'
        )
        ?.focus();

        return;

    }

    if(indiceColuna === 3){

        tr.cells[4]
        ?.querySelector(
            'input'
        )
        ?.focus();

        return;

    }

    if(indiceColuna === 4){

        tr.cells[5]
        ?.querySelector(
            'input'
        )
        ?.focus();

        return;

    }
    if(indiceColuna === 5){

        tr.cells[8]
        ?.querySelector(
            'input'
        )
        ?.focus();

        return;

    }

    if(indiceColuna === 8){

        if(linhaAtual === linhas.length - 1){

            adicionarNovaLinhaEditavel();

            setTimeout(
                () => {

                    const tbody =
                        document.querySelector(
                            '#dadosPedido tbody'
                        );

                    tbody
                    .lastChild
                    ?.cells[0]
                    ?.querySelector(
                        'input'
                    )
                    ?.focus();

                },
                0
            );

        }else{

            linhas[linhaAtual + 1]
            ?.cells[0]
            ?.querySelector(
                'input'
            )
            ?.focus();

        }

    }

}

// ======================================================================
// 🔍 ITEM
// ======================================================================

async function tratarCodigoItem(inputCodigo, tr){

    const codigo =
        inputCodigo
        .value
        .trim()
        .toUpperCase();

    if(!codigo){
        return;
    }

    const descricaoInput =
        tr.querySelector(
            '.descricaoInput'
        );

    const uvInput =
        tr.querySelector(
            '.uvInput'
        );

    const itemIdInput =
        tr.querySelector(
            '.itemIdInput'
        );

    if(descricaoInput){

        descricaoInput.value =
            'Carregando item, por favor aguarde...';

    }

    inputCodigo.readOnly =
        true;

    try{

        const listaId =
            obterListaPrecoId();

        if(!listaId){

            throw new Error(
                'Lista de preço do cliente não encontrada. Verifique se o campo codgroup está sendo carregado na edição.'
            );

        }

        const response =
            await fetch(
                `/api/lista-preco-Sem-Verificar/${listaId}?codigo=${encodeURIComponent(codigo)}`
            );

        if(!response.ok){

            const erro =
                await response.json();

            throw new Error(
                erro.message ||
                'Item não disponível'
            );

        }

        const data =
            await response.json();

        if(!Array.isArray(data) || !data.length){

            throw new Error(
                'Item não encontrado'
            );

        }

        const item =
            data[0];

        if(descricaoInput){

            descricaoInput.value =
                item.ItemDescricao ||
                item.descricao ||
                '';

            descricaoInput.readOnly =
                true;

        }

        if(uvInput){

            uvInput.value =
                item.Uv ||
                item.uv ||
                'UN';

            uvInput.readOnly =
                true;

        }

        if(itemIdInput){

            itemIdInput.value =
                item.ItemId ||
                item.itemId ||
                '';

        }

        calcularLinha(
            tr
        );

    }catch(error){

        alert(
            error.message
        );

        inputCodigo.value =
            '';

        if(descricaoInput){

            descricaoInput.value =
                '';

        }

        if(uvInput){

            uvInput.value =
                '';

        }

        if(itemIdInput){

            itemIdInput.value =
                '';

        }

        inputCodigo.focus();

    }finally{

        inputCodigo.readOnly =
            false;

    }

}

// ======================================================================
// 🧮 TOTAIS
// ======================================================================

async function preencherCodgroupPeloCliente(dev){

    const campoCodgroup =
        document.getElementById(
            'codgroup'
        );

    if(!campoCodgroup){
        console.error(
            'Campo codgroup não encontrado no HTML.'
        );
        return;
    }

    if(campoCodgroup.value){
        return;
    }

    const codCliente =
        dev.codCliente ||
        dev.cod_cliente ||
        dev.ClienteId ||
        dev.clienteId;

    if(!codCliente){
        console.error(
            'Código do cliente não encontrado na devolução.'
        );
        return;
    }

    try{

        const response =
            await fetch(
                `/api/cliente/codigo/${codCliente}`
            );

        if(!response.ok){
            throw new Error(
                'Erro ao buscar cliente para obter lista de preço.'
            );
        }

        const cliente =
            await response.json();

        campoCodgroup.value =
            cliente.LISTA ||
            cliente.lista ||
            cliente.ListaPrecoId ||
            cliente.listaPrecoId ||
            '';

        console.log(
            'codgroup carregado na edição:',
            campoCodgroup.value
        );

    }catch(error){

        console.error(
            'Erro ao carregar codgroup pelo cliente:',
            error
        );

    }

}

function calcularLinha(tr){

    const quantidadeInput =
        tr.querySelector(
            '.quantidadeInput'
        );

    const precoInput =
        tr.querySelector(
            '.precoUnitarioInput'
        );

    const totalInput =
        tr.querySelector(
            '.totalInput'
        );

    const quantidade =
        converterQuantidadeParaInteiro(
            quantidadeInput?.value
        );

    const preco =
        converterMoedaParaNumero(
            precoInput?.value
        );

    const totalLinha =
        quantidade * preco;

    if(totalInput){

        totalInput.value =
            formatarNumeroBR(
                totalLinha
            );

    }

    atualizarTotais();

}

function atualizarTotais(){

    atualizarTotalVolumes();
    atualizarTotalProdutos();

}

function atualizarTotalVolumes(){

    let totalVolumes =
        0;

    document
    .querySelectorAll(
        '#dadosPedido tbody tr'
    )
    .forEach(tr => {

        const quantidadeInput =
            tr.querySelector(
                '.quantidadeInput'
            );

        const quantidade =
            converterQuantidadeParaInteiro(
                quantidadeInput?.value
            );

        totalVolumes +=
            quantidade;

    });

    const campoVolume =
        el(
            'volume'
        );

    if(campoVolume){

        campoVolume.value =
            totalVolumes;

    }

}

function atualizarTotalProdutos(){

    let totalProdutos =
        0;

    document
    .querySelectorAll(
        '#dadosPedido tbody tr'
    )
    .forEach(tr => {

        const totalInput =
            tr.querySelector(
                '.totalInput'
            );

        const totalLinha =
            converterMoedaParaNumero(
                totalInput?.value
            );

        totalProdutos +=
            totalLinha;

    });

    const campoTotal =
        el(
            'total'
        );

    if(campoTotal){

        campoTotal.value =
            totalProdutos.toLocaleString(
                'pt-BR',
                {
                    style: 'currency',
                    currency: 'BRL'
                }
            );

    }

}

// ======================================================================
// ✅ VALIDAÇÃO E MONTAGEM DO OBJETO
// ======================================================================

function garantirLinhaInicial(){

    const tbody =
        document.querySelector(
            '#dadosPedido tbody'
        );

    tbody
    .querySelectorAll(
        'tr'
    )
    .forEach(tr => {

        const temInputPreenchido =
            Array
            .from(
                tr.querySelectorAll(
                    'input'
                )
            )
            .some(input => input.value);

        if(!temInputPreenchido){

            tr.remove();

        }

    });

    if(
        !tbody.querySelector(
            'tr'
        ) &&
        !edicaoBloqueada
    ){

        adicionarNovaLinhaEditavel();

    }

}

function validarTabelaPedido(){

    const linhas =
        document.querySelectorAll(
            '#dadosPedido tbody tr'
        );

    if(!linhas.length){

        alert(
            'Adicione pelo menos um item na devolução.'
        );

        return false;

    }

    for(
        let i = 0;
        i < linhas.length;
        i++
    ){

        const tr =
            linhas[i];

        const nf =
            tr.querySelector(
                '.nfOrigemInput'
            )
            ?.value
            .trim();

        const data =
            tr.querySelector(
                '.dataInput'
            )
            ?.value
            .trim();

        const codigo =
            tr.querySelector(
                '.codigoItemInput'
            )
            ?.value
            .trim();

        const lote =
            tr.querySelector(
                '.loteInput'
            )
            ?.value
            .trim();

        const quantidade =
            tr.querySelector(
                '.quantidadeInput'
            )
            ?.value
            .trim();

        const preco =
            tr.querySelector(
                '.precoUnitarioInput'
            )
            ?.value
            .trim();

        const total =
            tr.querySelector(
                '.totalInput'
            )
            ?.value
            .trim();

        if(
            !nf ||
            !data ||
            !codigo ||
            !lote ||
            !quantidade ||
            !preco ||
            !total
        ){

            alert(
                `Preencha todos os campos da linha ${i + 1}.`
            );

            tr.querySelector(
                'input'
            )
            ?.focus();

            return false;

        }

        const quantidadeNumero =
            converterQuantidadeParaInteiro(
                quantidade
            );

        if(
            quantidadeNumero <= 0 ||
            String(quantidade).includes('.') ||
            String(quantidade).includes(',')
        ){

            alert(
                `A quantidade da linha ${i + 1} deve ser um número inteiro maior que zero.`
            );

            tr.querySelector(
                '.quantidadeInput'
            )
            ?.focus();

            return false;

        }

        if(
            !dataDentroDoLimite180Dias(
                data
            )
        ){

            alert(
                `A data da NF na linha ${i + 1} deve estar entre ${obterDataLimite180DiasISO()} e ${obterDataBaseDevolucaoISO()}.`
            );

            tr.querySelector(
                '.dataInput'
            )
            ?.focus();

            return false;

        }

    }

    return true;

}

function montarObjetoEdicao(){

    const linhas =
        document.querySelectorAll(
            '#dadosPedido tbody tr'
        );

    const produtos =
        [];

    linhas.forEach(tr => {

        const codigoItem =
            tr.querySelector(
                '.codigoItemInput'
            )
            ?.value
            .trim();

        if(!codigoItem){
            return;
        }

        produtos.push({

            nforigem:
                tr.querySelector(
                    '.nfOrigemInput'
                )
                ?.value
                .trim(),

            data:
                tr.querySelector(
                    '.dataInput'
                )
                ?.value,

            codigoItem:
                codigoItem,

            lote:
                tr.querySelector(
                    '.loteInput'
                )
                ?.value
                .trim(),

            quantidade:
                converterQuantidadeParaInteiro(
                    tr.querySelector(
                        '.quantidadeInput'
                    )
                    ?.value
                ),

            uv:
                tr.querySelector(
                    '.uvInput'
                )
                ?.value
                .trim() ||
                'UN',

            descricao:
                tr.querySelector(
                    '.descricaoInput'
                )
                ?.value
                .trim(),

            precounitario:
                converterMoedaParaNumero(
                    tr.querySelector(
                        '.precoUnitarioInput'
                    )
                    ?.value
                ),

            total:
                converterMoedaParaNumero(
                    tr.querySelector(
                        '.totalInput'
                    )
                    ?.value
                )

        });

    });

    return {

        motivo:
            el(
                'observation'
            )
            .value
            .trim(),

        produtos:
            produtos

    };

}

// ======================================================================
// 💾 SALVAR EDIÇÃO
// ======================================================================

async function salvarEdicaoDevolucao(){

    if(edicaoBloqueada){

        alert(
            'Esta devolução não pode ser editada.'
        );

        return;

    }

    if(!devolucaoAtual){

        alert(
            'Devolução ainda não carregada.'
        );

        return;

    }

    const motivo =
        el(
            'observation'
        )
        .value
        .trim();

    if(!motivo){

        alert(
            'Informe o motivo da devolução.'
        );

        el(
            'observation'
        )
        .focus();

        return;

    }

    if(!validarTabelaPedido()){
        return;
    }

    const confirmar =
        confirm(
            'Deseja salvar as alterações desta devolução?'
        );

    if(!confirmar){
        return;
    }

    const dados =
        montarObjetoEdicao();

    try{

        mostrarFeedback(
            'Salvando devolução, aguarde...'
        );

        const response =
        await fetch(
            `/api/devolucao/${devolucaoAtual.id}/editar`,
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

        if(response.ok && resultado.success){

            alert(
                'Devolução atualizada com sucesso.'
            );

            window.location.href =
                `/devolucaoPanel`;

        }else{

            alert(
                resultado.error ||
                resultado.erro ||
                'Erro ao salvar devolução.'
            );

        }

    }catch(err){

        console.error(err);

        alert(
            err.message ||
            'Erro ao salvar devolução.'
        );

    }finally{

        ocultarFeedback();

    }

}

// ======================================================================
// 🔒 BLOQUEIO VISUAL
// ======================================================================

function bloquearCamposEdicao(){

    const campos =
        document.querySelectorAll(
            '#dadosPedido input, #observation'
        );

    campos.forEach(campo => {

        campo.readOnly =
            true;

        campo.style.backgroundColor =
            '#e9e9e9';

        campo.style.cursor =
            'not-allowed';

        campo.title =
            'Esta devolução não pode ser editada.';

    });

    document
    .querySelectorAll(
        '.btn-remover-linha'
    )
    .forEach(botao => {

        botao.disabled =
            true;

        botao.style.opacity =
            '0.5';

        botao.style.cursor =
            'not-allowed';

    });

}

function bloquearLinha(tr){

    tr
    .querySelectorAll(
        'input'
    )
    .forEach(input => {

        input.readOnly =
            true;

        input.style.backgroundColor =
            '#e9e9e9';

        input.style.cursor =
            'not-allowed';

    });

    tr
    .querySelectorAll(
        'button'
    )
    .forEach(button => {

        button.disabled =
            true;

        button.style.opacity =
            '0.5';

        button.style.cursor =
            'not-allowed';

    });

}
