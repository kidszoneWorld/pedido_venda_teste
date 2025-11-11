
const { getSpreadsheetData } = require('../utils/apiLogisticaFernando');

// Função para converter data no formato Excel para JavaScript Date
function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) {
        return null; // Retorna nulo se o valor for inválido
    }
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    return new Date(utcValue * 1000);
}


async function fetchLogisticsData(req, res) {
    try {
        // IDs do OneDrive para a planilha específica
        const driveId = 'b!XH-eb-xz-E6X2UiiEteqUdmnlFRU0p5LmLmtxXKjZ0IQdp2f5MVEQqMjT7VUFk1Z'; // Substitua pelo ID correto do drive
        const itemId = '01DKYK72AHRQPTUYSMCRGJB4PLCCLSM7YO';   // Substitua pelo ID correto do arquivo
        const sheetName = 'ENTREGAS'; // Nome da aba na planilha


        const data = await getSpreadsheetData(driveId, itemId, sheetName);

         // Filtro pelo número do representante, se aplicável
         const userNumero = req.session?.userNumero || null;
         console.log('Número do Representante na Sessão:', userNumero);

        // Processar os dados para o formato necessário
        let formattedData = data.slice(0).map(row => ({
            NF: row[0],
            EMISSÃO: row[1] ? (excelDateToJSDate(row[1]) ? excelDateToJSDate(row[1]).toISOString(): null) : null,
            codCliente: row[2],
            Rep: row[4],
            NOME: row[5],
            UF: row[8],
            REGIÃO: row[7],
            VOL: row[9],
            CodTransporte: row[10],
            TRANSPORTES: row[11],
            SAÍDA: row[12] ? (excelDateToJSDate(row[12]) ? excelDateToJSDate(row[12]).toISOString() : null) : null,
            PrevisaoEntrega: row[13] ? (excelDateToJSDate(row[13]) ? excelDateToJSDate(row[13]).toISOString() : null) : null,
            ENTREGUE: row[14] ? (excelDateToJSDate(row[14]) ? excelDateToJSDate(row[14]).toISOString() : null) : null,
            AGENDA: row[16],
            OCORRÊNCIA: row[17],
            CNPJ: row[3],
            STATUS_ENTREGA: row[15]
     
        }));

        if (userNumero) {
            formattedData = formattedData.filter(order => order.Rep.toString() === userNumero.toString());
        }

        res.json(formattedData);
    } catch (error) {
        console.error('Erro ao buscar dados do OneDrive:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do OneDrive' });
    }
}


async function fetchLogisticsData1(req, res) {
    try {
        // IDs do OneDrive para a planilha específica
        const driveId = 'b!XH-eb-xz-E6X2UiiEteqUdmnlFRU0p5LmLmtxXKjZ0IQdp2f5MVEQqMjT7VUFk1Z'; // Substitua pelo ID correto do drive
        const itemId = '01DKYK72ENRPET44VS6NC2NCRAFFSQL2WJ';   // Substitua pelo ID correto do arquivo
        const sheetName = 'ENTREGAS'; // Nome da aba na planilha


        const data = await getSpreadsheetData(driveId, itemId, sheetName);

         // Filtro pelo número do representante, se aplicável
         const userNumero = req.session?.userNumero || null;
         console.log('Número do Representante na Sessão:', userNumero);

        // Processar os dados para o formato necessário
        let formattedData = data.slice(0).map(row => ({
            NF: row[0],
            EMISSÃO: row[1] ? (excelDateToJSDate(row[1]) ? excelDateToJSDate(row[1]).toISOString(): null) : null,
            codCliente: row[2],
            Rep: row[4],
            NOME: row[5],
            UF: row[7],
            REGIÃO: row[8],
            VOL: row[9],
            CodTransporte: row[10],
            TRANSPORTES: row[11],
            SAÍDA: row[12] ? (excelDateToJSDate(row[12]) ? excelDateToJSDate(row[12]).toISOString() : null) : null,
            PrevisaoEntrega: row[13] ? (excelDateToJSDate(row[13]) ? excelDateToJSDate(row[13]).toISOString() : null) : null,
            ENTREGUE: row[14] ? (excelDateToJSDate(row[14]) ? excelDateToJSDate(row[14]).toISOString() : null) : null,
            AGENDA: row[16],
            OCORRÊNCIA: row[17],
            CNPJ: row[3],
            STATUS_ENTREGA: row[15]
     
        }));

        if (userNumero) {
            formattedData = formattedData.filter(order => order.Rep.toString() === userNumero.toString());
        }

        res.json(formattedData);
    } catch (error) {
        console.error('Erro ao buscar dados do OneDrive:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do OneDrive' });
    }
}

module.exports = {
 fetchLogisticsData,
 fetchLogisticsData1
};
