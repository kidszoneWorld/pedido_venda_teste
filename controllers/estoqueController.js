const ApplicationToken = process.env.APPLICATION_TOKEN;
const CompanyToken = process.env.COMPANY_TOKEN;
const ngLink = process.env.NG_LINK
const pcrLink = process.env.PCR_LINK
const usuarioDbCorp = process.env.USUARIO_DBCORP
const senhabCorp = process.env.SENHA_DBCORP

let authToken = null;
let tokenExpirationTime = null;
async function authenticate() {
  try {
    const response = await fetch(`${ngLink}/identidade-service/autenticar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kidszone-ng.dbcorp.com.br'
      },
      body: JSON.stringify({
        usuario: usuarioDbCorp,
        senha: senhabCorp,
        origin: "kidszone-ng"
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na autenticação: ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.tokenAcesso; // Atualizado para tokenAcesso
    tokenExpirationTime = Date.now() + 2 * 60 * 60 * 1000;
    console.log('Autenticado com sucesso, token obtido.');
  } catch (error) {
    console.error('Erro ao autenticar:', error);
  }
}

async function checkToken() {
  if (!authToken || Date.now() > tokenExpirationTime) {
    console.log('Token expirado ou inexistente. Autenticando...');
    await authenticate();
  }
}    

async function listarItens(){
    await checkToken();

    let listaItens;
      
        if (!authToken) {
          console.error('Erro: Token não obtido.');
          return null;
        }
        try {      
        for(let pageNumber = 1; pageNumber<=9; pageNumber++){
          const listaEndpoint = `/produto-service/item?EmpresaCodigo=2&PageNumber=${pageNumber}&PageSize=30`;
          const lista = await fetch(`${ngLink}${listaEndpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'Origin': 'https://kidszone-ng.dbcorp.com.br'
            }
          });
          const data = await lista.json();

          if (!lista.ok) {
                throw new Error(`Erro na autenticação: ${lista.statusText}`);
              }
              
          listaItens += data;
          
        }
        console.log('lista: '. listaItens)
          return {
            listaItens
          };
      
        } catch (error) {
          console.error('Erro ao buscar lista de itens', error);
          return null;
        }
}

 module.exports ={
    listarItens
}