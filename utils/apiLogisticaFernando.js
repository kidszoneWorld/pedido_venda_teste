const axios = require('axios');
const qs = require('qs');

// Configurações do Azure
const tenantId = process.env.TENANTID1;
const clientId = process.env.CLIENTID1;
const clientSecret = process.env.CLIENTSECRET1;
const scope = "https://graph.microsoft.com/.default";

// URL da API Graph
const graphBaseUrl = "https://graph.microsoft.com/v1.0";

// Função para converter data no formato Excel para JavaScript Date
function excelDateToJSDate(serial) {
    const utcDays = Math.floor(serial - 25569); // Ajuste para a data base do Excel
    const utcValue = utcDays * 86400; // Segundos em um dia
    return new Date(utcValue * 1000); // Converter para milissegundos
}

// Função para obter o token de acesso
async function getAccessToken() {
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = qs.stringify({
        client_id: clientId,
        scope,
        client_secret: clientSecret,
        grant_type: "client_credentials",
    });

    try {
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Erro ao obter token de acesso:", error.response?.data || error.message);
        throw new Error("Falha ao obter o token de acesso");
    }
}

// Função para buscar dados da planilha com filtro de últimos 4 meses
async function getSpreadsheetData(driveId, itemId, sheetName) {
    const token = await getAccessToken();
    const url = `${graphBaseUrl}/drives/${driveId}/items/${itemId}/workbook/worksheets('${sheetName}')/range(address='A1:R5000')`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Filtrar os últimos 4 meses
        const now = new Date();
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(now.getMonth() - 12);

        const filteredData = response.data.values.filter(row => {
            if (!row[1] || isNaN(row[1])) return false; // Ignorar datas inválidas
            const jsDate = excelDateToJSDate(row[1]);
            return jsDate && jsDate >= fourMonthsAgo;
        });

        return filteredData;
    } catch (error) {
        console.error("Erro ao buscar dados da planilha:", error.response?.data || error.message);
        throw new Error("Falha ao buscar dados da planilha");
    }
}

module.exports = {
    getSpreadsheetData,
};
