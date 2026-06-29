const pool = require('../config/database');

class DevolucaoRepository {

  async listar() {

    const { rows } = await pool.query(`
      SELECT *
      FROM public."TbDevolucoes" A
      INNER JOIN public."TbDevolucaoProdutos" B
        ON A."DevId" = B."DevId"
      ORDER BY A."DevId" ASC
    `);
console.log(this.agruparDevolucoes(rows))
    return this.agruparDevolucoes(rows);
  }

  async buscarPorId(devId) {

    const { rows } = await pool.query(`
      SELECT *
      FROM public."TbDevolucoes" A
      INNER JOIN public."TbDevolucaoProdutos" B
        ON A."DevId" = B."DevId"
      WHERE A."DevId" = $1
    `, [devId]);

    const devolucoes = this.agruparDevolucoes(rows);
        console.log(devolucoes[0])
    return devolucoes[0] || null;
  }


  async atualizar(devId, dados) {

  try {

    // console.log('DEV ID:', devId);
     console.log('DADOS:', dados);

     const { rows } = await pool.query(`
      UPDATE public."TbDevolucoes"
      SET
        "Status" = $1,
        "Finalizado" = $2,
        "NfVinculada" = $3
      WHERE "DevId" = $4
      RETURNING *
    `,
    [
      dados.status,
      dados.finalizado ? 1 : 0,
      dados.nfVinculada,
      devId
    ]);


    return rows[0];

  } catch (err) {

    console.error(err);
    throw err;

  }
}

  async inserirDevolucao(dados) {
    


      // console.log(dados)

    const { rows } = await pool.query(`
      INSERT INTO public."TbDevolucoes"
      (
        "Cnpj",
        "RazaoSocial",
        "Endereco",
        "Cidade",
        "Cep",
        "Email",
        "Representante",
        "CodCliente",
        "Bairro",
        "Uf",
        "Telefone",
        "EmailFiscal",
        "Data",
        "Motivo",
        "Status",
        "Finalizado",
        "NfVinculada"
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17
      )
      RETURNING *
    `,
    [
      dados.cnpj,
      dados.razaosocial,
      dados.endereco,
      dados.cidade,
      dados.Cep,
      dados.email,
      dados.representante,
      dados.codCliente,
      dados.bairro,
      dados.uf,
      dados.telefone,
      dados.emailFiscal,
      dados.data,
      dados.motivo,
      'pendente',
      0,
      ''
    ]);

    return rows[0];
  }

  async inserirProduto(devId, produto) {
// console.log(produto)
    await pool.query(`
      INSERT INTO public."TbDevolucaoProdutos"
      (
        "DevId",
        "NfOrigem",
        "ProdData",
        "CodigoItem",
        "Lote",
        "Quantidade",
        "Uv",
        "Descricao",
        "PrecoUnitario",
        "Total"
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
    `,
    [
      devId,
      produto.nforigem,
      produto.data,
      produto.codigoItem,
      produto.lote,
      produto.quantidade,
      produto.uv,
      produto.descricao,
      produto.precounitario,
      produto.total
    ]);
  }

  agruparDevolucoes(rows) {

    const mapa = {};

    rows.forEach(row => {

      if (!mapa[row.DevId]) {

        mapa[row.DevId] = {
          id: row.DevId,
          cnpj: row.Cnpj,
          razaoSocial: row.RazaoSocial,
          endereco: row.Endereco,
          cidade: row.Cidade,
          cep: row.Cep,
          email: row.Email,
          representante: row.Representante,
          codCliente: row.CodCliente,
          bairro: row.Bairro,
          uf: row.Uf,
          telefone: row.Telefone,
          emailFiscal: row.EmailFiscal,
          data: row.Data,
          motivo: row.Motivo,
          status: row.Status,
          finalizado: row.Finalizado,
          nfVinculada: row.NfVinculada,
          produtos: []
        };
      }

      mapa[row.DevId].produtos.push({
        devProdId: row.DevProdId,
        nfOrigem: row.NfOrigem,
        ProdData: row.ProdData,
        codigoItem: row.CodigoItem,
        lote: row.Lote,
        quantidade: row.Quantidade,
        uv: row.Uv,
        descricao: row.Descricao,
        precoUnitario: row.PrecoUnitario,
        total: row.Total
      });

    });

    return Object.values(mapa);
  }

}

module.exports = new DevolucaoRepository();