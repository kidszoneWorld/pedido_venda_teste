const Cliente = require('../models/Cliente');
const Positivacao = require('../models/Positivacao');
const SellIn = require('../models/SellIn');
const SellOut = require('../models/SellOut');
const Investimentos = require('../models/Investimentos');
const Mercado = require('../models/Mercado');

exports.getEficienciaBycodgroup = async (req, res) => {
    try {
        const { codgroup } = req.params;
        const cliente = await Cliente.findOne({ codigo_cliente: codgroup });
        if (!cliente) return res.status(404).json({ message: "Cliente não encontrado." });
        
        const positivacao = await Positivacao.find({ codigo_cliente: codgroup });
        const sellIn = await SellIn.find({ codigo_cliente: codgroup });
        const sellOut = await SellOut.find({ codigo_cliente: codgroup });
        const investimentos = await Investimentos.find({ codigo_cliente: codgroup });
        const mercado = await Mercado.find({ codigo_cliente: codgroup });
        
        res.json({ cliente, positivacao, sellIn, sellOut, investimentos, mercado });
    } catch (error) {
        res.status(500).json({ message: "Erro no servidor", error });
    }
};

exports.salvarEficiencia = async (req, res) => {
    try {
        const {codigo_cliente, nome,representante, tabelas, overwrite } = req.body;
        
        let cliente = await Cliente.findOne({codigo_cliente});
        if (!cliente) {
            if (overwrite) {
                return res.status(400).json({ message: "Cliente não encontrado para sobrescrever." });
            }
            cliente = new Cliente({codigo_cliente, nome ,representante});
            await cliente.save();
        }

        const updateOptions = overwrite ? { new: true } : { upsert: true, new: true };

        await Promise.all([
            ...tabelas.positivacao.map(dado => {
                console.log("Dados recebidos para positivacao:", dado); // Log dos dados brutos
                // Converter apenas se necessário, evitando perda de valores
                const meta =  parseFloat(dado.Meta)
                const realizado =  parseFloat(dado.Realizado)
                const atingido = parseFloat(dado.Atingido)

                console.log("Valores convertidos para positivacao:", { meta, realizado, atingido }); // Log após conversão

                return Positivacao.findOneAndUpdate(
                    { codigo_cliente, nome, representante ,ano: dado.ano, mes: dado.mes },
                    { ...dado, meta, realizado, atingido}, // Usar valores convertidos diretamente
                    updateOptions
                ).then(result => {
                    console.log("Documento salvo em positivacao:", result); // Log do resultado salvo
                    return result;
                });
            }),
            ...tabelas.sellIn.map(dado => {
                console.log("Dados recebidos para sellIn:", dado);

                const meta =  parseFloat(dado.Meta)
                const realizado =  parseFloat(dado.Realizado)
                const atingido = parseFloat(dado.Atingido)

                console.log("Valores convertidos para sellIn:", { meta, realizado, atingido });

                return SellIn.findOneAndUpdate(
                    {codigo_cliente, nome, representante ,ano: dado.ano, mes: dado.mes },
                    { ...dado, meta, realizado, atingido },
                    updateOptions
                ).then(result => {
                    console.log("Documento salvo em sellIn:", result);
                    return result;
                });
            }),
            ...tabelas.sellOut.map(dado => {
                console.log("Dados recebidos para sellOut:", dado);

                const meta =  parseFloat(dado.Meta)
                const realizado =  parseFloat(dado.Realizado)
                const atingido = parseFloat(dado.Atingido)

                console.log("Valores convertidos para sellOut:", { meta, realizado, atingido });

                return SellOut.findOneAndUpdate(
                    { codigo_cliente, nome, representante, ano: dado.ano, mes: dado.mes },
                    { ...dado, meta, realizado, atingido },
                    updateOptions
                ).then(result => {
                    console.log("Documento salvo em sellOut:", result);
                    return result;
                });
            }),
            ...tabelas.investimentos.map(dado => {
                console.log("Dados recebidos para investimentos:", dado);

                const realizado =  parseFloat(dado.Realizado)
                const base_faturamento = parseFloat(dado.base_faturamento) 

                console.log("Valores convertidos para investimentos:", { realizado, base_faturamento });

                return Investimentos.findOneAndUpdate(
                    { codigo_cliente, nome, representante , ano: dado.ano, mes: dado.mes },
                    { ...dado, realizado, base_faturamento },
                    updateOptions
                ).then(result => {
                    console.log("Documento salvo em investimentos:", result);
                    return result;
                });
            }),
            ...tabelas.mercado.map(dado => {
                console.log("Dados recebidos para mercado:", dado);
                const KZ = parseFloat(dado.KZ) 
                const fatia_demais = parseFloat(dado.fatia_demais) 
                const fatia_KZ = parseFloat(dado.fatia_KZ) 

                console.log("Valores convertidos para mercado:", { KZ, fatia_demais, fatia_KZ });

                return Mercado.findOneAndUpdate(
                    { codigo_cliente, nome,representante , ano: dado.ano, mes: dado.mes },
                    { ...dado, KZ, fatia_demais, fatia_KZ },
                    updateOptions
                ).then(result => {
                    console.log("Documento salvo em mercado:", result);
                    return result;
                });
            })
        ]);

        res.json({ message: "Dados salvos com sucesso!" });
    } catch (error) {
        console.error("Erro ao salvar eficiência:", error);
        res.status(500).json({ message: "Erro ao salvar dados", error });
    }
};