const path = require('path');
const fs = require('fs/promises');
const apiForm = require('../utils/apiForm');

async function getProductsDetails(req, res) {
    try {
        const produtos = await apiForm.fetchItems();
        if (!produtos) {
            return res.status(404).json({ message: 'Produtos não encontrados' });
        }
        let formatedProducts = formatProducts(produtos.dados)

        return res.status(200).json({ data: formatedProducts });
    } catch (error) {
        console.error('Erro ao obter dados dos produtos:', error);
        res.status(500).send('Erro ao obter dados dos produtos');
    }
}

function formatProducts(products) {
    let formated = [[
        "LISTA ID - ITEM ID",
        "LISTA NOME",
        "ITEM COD",
        "DV",
        "ITEM DESCRIÇÃO",
        "PREVISÃO DE CHEGADA",
        "EAN",
        "CLASSIFIC. FISCAL",
        "MASTER",
        "UV",
        "EMB",
        "PRECO",
        "IPI",
        "ItemId"
    ]]
    products.forEach(product => {
        let item = []
        item.push(`${product.grupoEstoqueId}-${product.itemEmpresaId}`)
        item.push('')
        item.push(Number(product.itemEmpresaId))
        item.push('S')
        item.push(product.descricao)
        item.push(null)
        item.push(product.barrasTributavelId)
        item.push(product.classificacaoFiscal)
        item.push(product.embalagemMaster.regiaoDocumentolarguraImpressao)
        item.push(product.unidadeMedidaAbreviado)
        item.push(product.embalagemMaster.quantidadeCaixas)
        item.push(product.precoReferencia)
        item.push(0.0325)
        item.push(product.codigo)
        formated.push(item)
    });

    return formated
}

module.exports = {
    getProductsDetails,
};