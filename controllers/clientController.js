const apiForm = require('../utils/apiForm');

async function getClientDetails(req, res) {
    const { cnpj } = req.params;

    try {
        const clientCnpj = await apiForm.fetchcontat(cnpj);

        if (!clientCnpj) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        // Tratar os dados do clientCnpj para o formato desejado
        const treatedClient = treatClientData(clientCnpj);

        return res.status(200).json(treatedClient);
    } catch (error) {
        console.error('Erro ao obter detalhes dos clientes:', error);
        res.status(500).send('Erro ao obter detalhes dos clientes');
    }
}

// Função para tratar os dados do cliente
function treatClientData(clientData) {
    // Mapeamento de números para siglas de UF
    const ufMap = {
        0: "Nenhum",
        11: "RO",
        12: "AC",
        13: "AM",
        14: "RR",
        15: "PA",
        16: "AP",
        17: "TO",
        21: "MA",
        22: "PI",
        23: "CE",
        24: "RN",
        25: "PB",
        26: "PE",
        27: "AL",
        28: "SE",
        29: "BA",
        31: "MG",
        32: "ES",
        33: "RJ",
        35: "SP",
        41: "PR",
        42: "SC",
        43: "RS",
        50: "MS",
        51: "MT",
        52: "GO",
        53: "DF",
        99: "EX"
    };

    // Obtém o número da UF e converte para a sigla
    const ufNumber = clientData.enderecos?.[0]?.cidade?.uf || 0;
    const ufSigla = ufMap[ufNumber] || "Nenhum"; // Caso o número não exista no mapeamento, retorna "Nenhum"
    debugger;
    // Mapeamento dos campos
    const treatedData = {
        "COD CLIENTE": clientData.codigo || 0,
        "CNPJ": clientData.documento?.numero || 0,
        "INSC. ESTADUAL": clientData.documentoEstadual?.numero || "",
        "RAZÃO SOCIAL": clientData.razaoSocial || "",
        "TELEFONE": `${clientData.clienteDataOld?.Result?.TelefoneDDD || ""}${clientData.clienteDataOld?.Result?.TelefoneNumero || ""}`,
        "LISTA NOME": clientData.listaPreco?.[0]?.descricao || "",
        "EMAIL COMERCIAL": clientData.email?.[0]?.emailCompleto || "",
        "EMAIL FISCAL": clientData.emailFiscal?.[0]?.emailCompleto || "",
        "ENDEREÇO": `${clientData.enderecos?.[0]?.logradouro || ""}, ${clientData.enderecos?.[0]?.numero || ""} ${clientData.enderecos?.[0]?.complemento || ""}`.trim(),
        "BAIRRO": clientData.enderecos?.[0]?.bairro || "",
        "CIDADE": clientData.enderecos?.[0]?.cidade?.nome || "",
        "UF": ufSigla, // Usamos a sigla convertida aqui
        "CEP": clientData.enderecos?.[0]?.cep || "",
        "NOME CONTATO": clientData.contatoCliente?.dados?.[0]?.nomeAbreviado || "",
        "COND. DE PAGTO": clientData.condicaoPagamento?.Result?.Descricao || "",
        "REPRESENTANTE": clientData.representantes?.dados[0]?.codigo || 0,
        "REPRESENTANTE NOME": clientData.representantes?.dados[0]?.nomeAbreviado || "",
        "COD CLIENTE 2": clientData.representantes?.dados[0]?.clienteId || "",
        "LISTA": clientData.listaPreco?.[0]?.id || 0,
        "LISTA NOME1": clientData.listaPreco?.[0]?.descricao || "",
        "TRANSPORTADORA": clientData.transportadora?.nomeAbreviado || "",
        "CliDataHoraIncl": clientData.dataCriacao || "",
        "REPRESENTANTE E-MAIL": getRepresentativeEmail(clientData.representantes?.dados[0]?.codigo) || "",
        "REP COMISSAO ITEM": clientData.representantes?.dados[0]?.comissaoItem || 0,
        "REP COMISSAO SERVICO": clientData.representantes?.dados[0]?.comissaoServico || 0,
        "FORMA DE PAGAMENTO ID": clientData.formaPagamento?.dados?.[0]?.codigo || 0,
        "FORMA DE PAGAMENTO DESCRICAO": clientData.formaPagamento?.dados?.[0]?.descricao || "",
        "ID COND. DE PAGTO": clientData.condicaoPagamento?.Result?.Id || 0,
        "ID NOME CONTATO": clientData.contatoCliente?.dados?.[0]?.codigo || 0,
        "NOME GRUPO CLIENTE": clientData.nomeAbreviado || "",
        "GRUPO CLIENTE": (clientData.clienteDataOld?.Result?.GrupoEconomicoId === 0 || !clientData.clienteDataOld?.Result?.GrupoEconomicoId)
            ? clientData.codigo
            : clientData.clienteDataOld?.Result?.GrupoEconomicoId || "",
        "ATIVO": clientData.ativo || false,
        "SUSPENSO": clientData.suspenso || false
    };

    return treatedData;
}

// Função para pegar o e-mail do representante com base no ID
function getRepresentativeEmail(repId) {
    const representativesEmails = {
        "1": "rep01@kidszoneworld.com.br",
        "2": "rep02@kidszoneworld.com.br",
        "3": "rep03@kidszoneworld.com.br",
        "8": "rep08@kidszoneworld.com.br",
        "16": "rep16@kidszoneworld.com.br",
        "28": "rep28@kidszoneworld.com.br",
        "37": "rep37@kidszoneworld.com.br",
        "43": "rep43@kidszoneworld.com.br",
        "44": "rep44@kidszoneworld.com.br",
        "46": "rep46@kidszoneworld.com.br",
        "47": "rep47@kidszoneworld.com.br",
        "48": "rep48@kidszoneworld.com.br",
        "51": "rep51@kidszoneworld.com.br",
        "53": "rep53@kidszoneworld.com.br",
        "54": "rep54@kidszoneworld.com.br",
        "55": "rep55@kidszoneworld.com.br",
        "56": "rep56@kidszoneworld.com.br",
        "59": "rep59@kidszoneworld.com.br",
        "61": "rep61@kidszoneworld.com.br",
        "62": "rep62@kidszoneworld.com.br",
        "63": "rep63@kidszoneworld.com.br",
        "64": "rep64@kidszoneworld.com.br",
        "67": "rep67@kidszoneworld.com.br",
        "68": "rep68@kidszoneworld.com.br",
        "69": "rep69@kidszoneworld.com.br",
        "70": "rep70@kidszoneworld.com.br",
        "71": "rep71@kidszoneworld.com.br",
        "72": "rep72@kidszoneworld.com.br",
        "73": "rep73@kidszoneworld.com.br",
        "74": "rep74@kidszoneworld.com.br",
        "75": "rep75@kidszoneworld.com.br",
        "76": "rep76@kidszoneworld.com.br",
        "77": "rep77@kidszoneworld.com.br",
        "79": "rep79@kidszoneworld.com.br",
        "30": "rep30@kidszoneworld.com.br"
    };

    return representativesEmails[repId] || "";
}



async function getClientDetailsTest(req, res) {
    const { cnpj } = req.params;

    try {
        const clientCnpj = await apiForm.fetchcontat(cnpj);

        if (!clientCnpj) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }


        return res.status(200).json(clientCnpj);
    } catch (error) {
        console.error('Erro ao obter detalhes dos clientes:', error);
        res.status(500).send('Erro ao obter detalhes dos clientes');
    }

}
module.exports = {
    getClientDetails,
    getClientDetailsTest
};