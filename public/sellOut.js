// Lista de itens fixa 
const listaItensFixos = [
    { cod: "1024", sku: "KIDS ROCK SHOKS (CX-C/24)" },
    { cod: "1031", sku: "KIDS ZÓIO GOMA (CX-C/72)" },
    { cod: "1023", sku: "KIDS POP SHOKS (CX-C/60)" },
    { cod: "1028", sku: "KIDS PULA MASSA (CX-C/8)" },
    { cod: "1074", sku: "KIDS SLIME ECAO (CX-C/ 24)" },
    { cod: "1019", sku: "KIDS CHICLE TWIST (CX-C/24)" },
    { cod: "1001", sku: "KIDS AIAAI! GOMA DE MASCAR (CX-C/24)" },
    { cod: "1087", sku: "KIDS SOUR BUSTERS MEGA SLIME (CX C/32)" },
    { cod: "1137", sku: "KIDS SLIME ECÃO GLITTER (CX C/ 24)" },
    { cod: "1118", sku: "KIDS MASSA FLUFFY (CX-C/ 12)" },
    { cod: "1003", sku: "KIDS FITA GOMA DE MASCAR (CX-C/96)" },
    { cod: "1008", sku: "KIDS GIRA POP (CX-C/48)" },
    { cod: "1033", sku: "KIDS BUBBLE CLETE (CX-C/60)" },
    { cod: "1071", sku: "KIDS SURPRESA EGGS 3D PAW PATROL (CX-C/36)" },
    { cod: "1147", sku: "KIDS SPIN POPS PAW PATROL (CX C/ 24)" },
    { cod: "1150", sku: "KIDS AIAAI! H:A GOMA DE MASCAR SEM AÇÚCAR (CX C/ 24)" },
    { cod: "1125", sku: "KIDS WACKY SOUR (CX-C/48)" },
    { cod: "1079", sku: "KIDS KACO HIT 2.0 (CX-C/24)" },
    { cod: "1064", sku: "KIDS ANEL PAW PATROL (CX-C/64)" },
    { cod: "1066", sku: "KIDS ALIEN SHOT (CX-C/24)" },
    { cod: "1027", sku: "KIDS DINO EXPANDE OVO (CX-C/12)" },
    { cod: "1026", sku: "KIDS DRAGAO EXPANDE OVO (CX-C/12)" },
    { cod: "1025", sku: "KIDS UNICORNIO EXPANDE OVO (CX-C/12)" },
    { cod: "1065", sku: "KIDS FRUTI ROLL (CX-C/80)" },
    { cod: "1075", sku: "KIDS CROC SERIE 2 (CX-C/24)" },
    { cod: "1092", sku: "KIDS HAPPY HOPPERS (CX C/18)" },
    { cod: "1070", sku: "KIDS FITONA LOKA (CX-C/96)" },
    { cod: "1010", sku: "KIDS FLASH POP (CX-C/24)" },
    { cod: "1149", sku: "KIDS LAMPA SPRAY  (CX C/ 40)" },
    { cod: "1112", sku: "KIDS MINI POP SPORTS (CX-C/ 24)" },
    { cod: "1032", sku: "KIDS KACO HIT (CX-C/24)" },
    { cod: "1009", sku: "KIDS FAN CHOCOLIX (CX-C/24)" },
    { cod: "1012", sku: "KIDS SURPRESA EGGS UNICORNIO (CX-C/36)" },
    { cod: "1016", sku: "KIDS ANEL UNICORNIO (CX-C/64)" },
    { cod: "1093", sku: "KIDS FLASH POP MINI (CX C/ 96)" },
    { cod: "1002", sku: "KIDS BIG DINO (CX-C/48) - (FORA DE LINHA)" },
    { cod: "1080", sku: "KIDS KACO BATERA (CX-C/24)" },
    { cod: "1146", sku: "KIDS DINO CHOMP! (CX C/ 24)" },
    { cod: "1072", sku: "KIDS SURPRESA EGGS 3D GALINHA PINTADINHA (CX-C/36)" },
    { cod: "1044", sku: "KIDS ANEL HELLO KITTY (CX-C/64)" },
    { cod: "1038", sku: "KIDS SURPRESA EGGS PATATI PATATÁ (CX-C/36)" },
    { cod: "1040", sku: "KIDS SPIN PATATI PATATÁ (CX-C/24) (FORA DE LINHA)" },
    { cod: "1014", sku: "KIDS SURPRESA EGGS CHOCOLIX (CX-C/36)  - (FORA DE LINHA)" },
    { cod: "1061", sku: "KIDS SURPRESA EGGS HELLO KITTY  (CX-C/36)" },
    { cod: "1007", sku: "KIDS TWIST POP (CX-C/48)" },
    { cod: "1062", sku: "KIDS SURPRESA EGGS 3D DINO HUNT (CX-C/36)" },
    { cod: "1037", sku: "KIDS ANEL PATATI PATATÁ (CX-C/64)" },
    { cod: "1006", sku: "KIDS CROC (CX-C/24)" },
    { cod: "1086", sku: "KIDS POP SHOKS LOL SURPRISE (CX-C/60)" },
    { cod: "1015", sku: "KIDS ANEL CHOCOLIX (CX-C/64)" },
    { cod: "1082", sku: "KIDS SURPRESA EGGS 3D LOL SURPRISE (CX C/ 36)" },
    { cod: "1099", sku: "KIDS MASKAPUXA (CX C/ 144)" },
    { cod: "1033-A", sku: "KIDS BUBBLE CLETE (PT-C/40)  - (FORA DE LINHA)" },
    { cod: "1073", sku: "KIDS ANEL GALINHA PINTADINHA (CX-C/64)" },
    { cod: "1005", sku: "KIDS KACO (CX-C/24)  - (FORA DE LINHA)" },
    { cod: "1020", sku: "PULSEIRA KIDS FLASH CHOCOLIX (CX-C/24)   - (FORA DE LINHA)" },
    { cod: "1130", sku: "KIDS TWIST STRAW POP (CX C/20)" },
    { cod: "1139", sku: "KIDS DINO CAPS (CX C/30)" },
    { cod: "1083", sku: "KIDS CANDY MAKE LOL SURPRISE(CX C/ 36)" },
    { cod: "1110", sku: "KIDS BIG DINOVO (CX C/ 12)" },
    { cod: "1116", sku: "KIDS LONG GUM (CX C/ 48)" },
    { cod: "1081", sku: "KIDS ANEL LOL SURPRISE (CX-C/64)" },
    { cod: "1039", sku: "PULSEIRA KIDS PATATI PATATÁ (CX-C/24) - (FORA DE LINHA)" },
    { cod: "1084", sku: "KIDS ROCK SHOKS LOL SURPRISE (CX- C/24)" },
    { cod: "1129", sku: "KIDS CHICLE TUBO (CX-C/48)" },
    { cod: "1057", sku: "KIDS SURPRESA EGGS 44 GATOS (CX-C/36)  - (FORA DE LINHA)" },
    { cod: "1142", sku: "KIDS BIG SLIME ECAO (CX C/4)" },
    { cod: "1060", sku: "KIDS AQUA SHARK (CX-C/6)  - (FORA DE LINHA)" },
    { cod: "1103", sku: "KIDS CHICLE LÁPIS (CX C/ 96)" },
    { cod: "1136", sku: "KIDS SLIME ECAO METALIZADO (CX C/ 24)" },
    { cod: "1049", sku: "KIDS HIDRO SHOT (CX-C/24)  - (FORA DE LINHA)" },
    { cod: "1141", sku: "KIDS SOUR BUSTERS TRIPLO SLIME (CX C/ 36)" },
    { cod: "1021", sku: "KIDS SURPRESA EGGS LHAMA E FLAMINGO (CX-C/36)  - (FORA DE LINHA)" },
    { cod: "1013", sku: "KIDS SURPRESA EGGS DINO (CX-C/36)  - (FORA DE LINHA)" },
    { cod: "1148", sku: "KIDS SPIN POPS (CX C/ 24)" },
    { cod: "1022", sku: "KIDS BLASTER (CX-C/24)   - (FORA DE LINHA)" },
    { cod: "1034", sku: "KIDS FANTOCHE (CX-C/20)" },
    { cod: "1091", sku: "KIDS STRING POP (CX C/32)  - (FORA DE LINHA)" },
    { cod: "1034-A", sku: "KIDS FANTOCHE (CX-C/12)  - (FORA DE LINHA)" },
    { cod: "1029", sku: "DINO MASK (CX-C/24)   - (FORA DE LINHA)" },
    { cod: "1030", sku: "DINO MASK BLISTER (CX-C/24)" },
    { cod: "1117", sku: "KIDS LATÃO BUFA (CX-C/ 24)" },
    { cod: "1067", sku: "KIDS PULA POOP (CX-C/24)" },
    { cod: "1054", sku: "KIDS JATO SAURO (CX-C/6)  - (FORA DE LINHA)" },
    { cod: "1035", sku: "KIDS PEGA DINO (CX-C/12)  - (FORA DE LINHA)" },
    { cod: "1085", sku: "KIDS CANDY SPRAY LOL SURPRISE (CX C/ 48)" },
    { cod: "1036", sku: "KIDS PEGA DINO BLISTER (CX-C/12)  - (FORA DE LINHA)" },
    { cod: "1068", sku: "KIDS CHOCOPEDRA (CX-C/80)  - (FORA DE LINHA)" },
    { cod: "1042", sku: "KIDS PUMP PATATI PATATÁ (CX-C/24)  - (FORA DE LINHA)" },
    { cod: "1114", sku: "KIDS EMOJI FLASH POP (CX C/ 24)" },
    { cod: "1119", sku: "KIDS MISTURA MÁGICA (CX-C/12)" },
    { cod: "1144", sku: "KIDS BANANINHA TRADICIONAL LOL SURPRISE (CX C/128)" },
    { cod: "1132", sku: "KIDS BANANINHA TROPICÁLIA TRADICIONAL (CX C/128)" },
    { cod: "1069", sku: "KIDS FITA LOKA (CX-C/96)" },
    { cod: "1076", sku: "KIDS UNIGLOW (CX C/ 60)" },
    { cod: "1122", sku: "KIDS MYSTERY (CX-C/48)" },
    { cod: "1111", sku: "KIDS FONE (CX C/ 24)" },
    { cod: "1124", sku: "KIDS SOUR GUM CORD (CX-C/60)" },
    { cod: "1096", sku: "KIDS NEON POP PE DE MONSTRO (CX-C/ 60)" },
    { cod: "1102", sku: "KIDS DIP STICK (CX C/ 144)" },
    { cod: "1126", sku: "KIDS SOUR BOMBS (CX-C/48)" },
    { cod: "1104", sku: "KIDS HAMMER CANDY (CX C/ 60)" },
    { cod: "1146-A", sku: "KIDS DINO CHOMP! (CX C/ 27)" },
    { cod: "1019-A", sku: "KIDS CHICLE TWIST (CX-C/48)  - (FORA DE LINHA)" },
    { cod: "1097", sku: "KIDS NEON POP PATINHO (CX C/ 60)" },
    { cod: "1089", sku: "KIDS SOUR BUSTER BUBBLE ROCKS (CX-C/24)" },
    { cod: "1145", sku: "KIDS PIKO POP (CX C/ 24)" },
    { cod: "1113", sku: "KIDS POP & CATCH (CX C/ 24)" },
    { cod: "1100", sku: "KIDS HOT DOG! CHICLE (CX C/ 96)" },
    { cod: "1105", sku: "KIDS ZOOIO PETS MAXI (CX C/ 96)" },
    { cod: "1128", sku: "KIDS CRAZY BALLZ (CX-C/48)" },
    { cod: "1099-A", sku: "KIDS MASKAPUXA (CX C/48)" },
    { cod: "1098", sku: "KIDS NEON POP PINGUIM (CX C/ 60)" },
    { cod: "1077", sku: "KIDS SPACE ZONE (CX C/ 24) - FORA DE LINHA" },
    { cod: "1095", sku: "KIDS TEDDY POP (CX C/ 96)" },
    { cod: "1088", sku: "KIDS SPACLETTI (CX C/ 24)" },
    { cod: "1101", sku: "KIDS CHEW BAR (CX C/ 180)" },
    { cod: "1127", sku: "KIDS BURGER (CX-C/48)" },
    { cod: "1115", sku: "KIDS BRAIN POP (CX C/ 200)" },
    { cod: "1133", sku: "KIDS BANANINHA TROPICÁLIA SEM ADIÇÃO DE AÇUCAR (CX C/ 128)" },
    { cod: "1134", sku: "KIDS BANANINHA SEM AÇUCAR LOL SURPRISE (CX C/128)" },
    { cod: "1109", sku: "KIDS UNICORNIO EXPANDE OVO 2 (CX-C/12)" },
    { cod: "1108", sku: "KIDS DINO EXPANDE OVO 2 (CX-C/12)" },
    { cod: "1107", sku: "KIDS ALIEN EXPANDE OVO (CX-C/12)" },
    { cod: "1106", sku: "KIDS ANIMAIS AQUÁTICOS EXPANDE OVO (CX-C/ 12)" },
    { cod: "1090", sku: "KIDS SOUR BUSTER SOUR BALL (CX-C/24)  - (FORA DE LINHA)" },
    { cod: "1094", sku: "KIDS ANEL POP CLETE (CX C/ 96)" },
    { cod: "1151", sku: "KIDS BURGOMA (CX C/ 160)" }
];


// Variáveis globais
let clientesData;

// Função para atualizar o cache
const timestamp = new Date().getTime();

// Carregar dados do cliente.json
fetch(`/data/cliente.json?cacheBust=${timestamp}`)
    .then(response => response.json())
    .then(data => {
        clientesData = data;
    })
    .catch(error => console.error('Erro ao carregar cliente.json:', error));

// Funções auxiliares
function ajustarCNPJ(cnpj) {
    while (cnpj.length < 14) {
        cnpj = '0' + cnpj;
    }
    return cnpj;
}

function cnpjInvalido(cnpj) {
    return /^0+$/.test(cnpj);
}

function limparCamposCliente() {
    document.getElementById('cliente').value = '';
    document.getElementById('codgroup').value = '';
    document.getElementById("rep").value = '';
    document.getElementById('table-body').innerHTML = '';
}

// Buscar cliente pelo CNPJ
function buscarCliente(cnpj) {
    cnpj = ajustarCNPJ(cnpj);
    for (let i = 1; i < clientesData.length; i++) {
        let cnpjCliente = ajustarCNPJ(clientesData[i][1].toString());
        if (cnpjCliente === cnpj) return clientesData[i];
    }
    return null;
}

// Adicionar linha na tabela
function adicionarLinha(dados = {}, codItem = '', sku = '') {
    const tableBody = document.getElementById('table-body');
    const row = document.createElement('tr');
    const meses = ['jan25', 'fev25', 'mar25', 'abr25', 'mai25', 'jun25', 'jul25', 'ago25', 'set25', 'out25', 'nov25', 'dez25'];

    // Campo COD_item (fixo, não editável)
    const codCell = document.createElement('td');
    const codInput = document.createElement('input');
    codInput.type = 'text';
    codInput.value = codItem || dados.cod_item || '';
    codInput.className = 'main-input';
    codInput.readOnly = true; // Torna o campo não editável
    codCell.appendChild(codInput);
    row.appendChild(codCell);

    // Campo SKU (fixo, não editável)
    const skuCell = document.createElement('td');
    const skuInput = document.createElement('input');
    skuInput.type = 'text';
    skuInput.value = sku || dados.sku || '';
    skuInput.className = 'main-input';
    skuInput.readOnly = true; // Torna o campo não editável
    skuCell.appendChild(skuInput);
    row.appendChild(skuCell);

    // Campos dos meses
    meses.forEach(campo => {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = dados[campo] || '';
        input.className = 'main-input';
        cell.appendChild(input);
        row.appendChild(cell);
    });



    tableBody.appendChild(row);

    // Armazenar dados das subcolunas no elemento da linha para uso posterior
    row.dataset.subColumns = JSON.stringify({
        'jan25': {
            sellIn: dados['jan25-sellIn'] || '',
            sellOut: dados['jan25-sellOut'] || '',
            saldo: dados['jan25-saldo'] || '',
            sold: dados['jan25-sold'] || ''
        },
        'fev25': {
            sellIn: dados['fev25-sellIn'] || '',
            sellOut: dados['fev25-sellOut'] || '',
            saldo: dados['fev25-saldo'] || '',
            sold: dados['fev25-sold'] || ''
        },
        'mar25': {
            sellIn: dados['mar25-sellIn'] || '',
            sellOut: dados['mar25-sellOut'] || '',
            saldo: dados['mar25-saldo'] || '',
            sold: dados['mar25-sold'] || ''
        },
        'abr25': {
            sellIn: dados['abr25-sellIn'] || '',
            sellOut: dados['abr25-sellOut'] || '',
            saldo: dados['abr25-saldo'] || '',
            sold: dados['abr25-sold'] || ''
        },
        'mai25': {
            sellIn: dados['mai25-sellIn'] || '',
            sellOut: dados['mai25-sellOut'] || '',
            saldo: dados['mai25-saldo'] || '',
            sold: dados['mai25-sold'] || ''
        },
        'jun25': {
            sellIn: dados['jun25-sellIn'] || '',
            sellOut: dados['jun25-sellOut'] || '',
            saldo: dados['jun25-saldo'] || '',
            sold: dados['jun25-sold'] || ''
        },
        'jul25': {
            sellIn: dados['jul25-sellIn'] || '',
            sellOut: dados['jul25-sellOut'] || '',
            saldo: dados['jul25-saldo'] || '',
            sold: dados['jul25-sold'] || ''
        },
        'ago25': {
            sellIn: dados['ago25-sellIn'] || '',
            sellOut: dados['ago25-sellOut'] || '',
            saldo: dados['ago25-saldo'] || '',
            sold: dados['ago25-sold'] || ''
        },
        'set25': {
            sellIn: dados['set25-sellIn'] || '',
            sellOut: dados['set25-sellOut'] || '',
            saldo: dados['set25-saldo'] || '',
            sold: dados['set25-sold'] || ''
        },
        'out25': {
            sellIn: dados['out25-sellIn'] || '',
            sellOut: dados['out25-sellOut'] || '',
            saldo: dados['out25-saldo'] || '',
            sold: dados['out25-sold'] || ''
        },
        'nov25': {
            sellIn: dados['nov25-sellIn'] || '',
            sellOut: dados['nov25-sellOut'] || '',
            saldo: dados['nov25-saldo'] || '',
            sold: dados['nov25-sold'] || ''
        },
        'dez25': {
            sellIn: dados['dez25-sellIn'] || '',
            sellOut: dados['dez25-sellOut'] || '',
            saldo: dados['dez25-saldo'] || '',
            sold: dados['dez25-sold'] || ''
        }
    });

    return row; // Retorna a linha para referência
}

// Remover linha

// Buscar dados do MongoDB
async function buscarDadosSellOut(codgroup) {
    try {
        const response = await fetch(`/api/sellOut/${codgroup}`);
        if (!response.ok) {
            if (response.status === 404) {
                // Se não houver dados, preenche a tabela com a lista fixa
                document.getElementById('table-body').innerHTML = '';
                listaItensFixos.forEach(item => {
                    adicionarLinha({}, item.cod, item.sku);
                });
                return;
            }
            throw new Error('Erro na requisição');
        }
        const { cliente, sellOut } = await response.json();

        document.getElementById('cliente').value = cliente.nome;
        document.getElementById('codgroup').value = cliente.codigo_cliente;

        // Limpa a tabela antes de preenchê-la
        document.getElementById('table-body').innerHTML = '';

        // Cria um mapa dos dados salvos no MongoDB por COD_item
        const sellOutMap = new Map();
        sellOut.forEach(dados => {
            sellOutMap.set(dados.cod_item, {
                cod_item: dados.cod_item,
                sku: dados.sku,
                'jan25': dados.meses.jan25.sellIn || '',
                'fev25': dados.meses.fev25.sellIn || '',
                'mar25': dados.meses.mar25.sellIn || '',
                'abr25': dados.meses.abr25.sellIn || '',
                'mai25': dados.meses.mai25.sellIn || '',
                'jun25': dados.meses.jun25.sellIn || '',
                'jul25': dados.meses.jul25.sellIn || '',
                'ago25': dados.meses.ago25.sellIn || '',
                'set25': dados.meses.set25.sellIn || '',
                'out25': dados.meses.out25.sellIn || '',
                'nov25': dados.meses.nov25.sellIn || '',
                'dez25': dados.meses.dez25.sellIn || '',
                'jan25-sellIn': dados.meses.jan25.sellIn || '',
                'jan25-sellOut': dados.meses.jan25.sellOut || '',
                'jan25-saldo': dados.meses.jan25.saldo || '',
                'jan25-sold': dados.meses.jan25.sold || '',
                'fev25-sellIn': dados.meses.fev25.sellIn || '',
                'fev25-sellOut': dados.meses.fev25.sellOut || '',
                'fev25-saldo': dados.meses.fev25.saldo || '',
                'fev25-sold': dados.meses.fev25.sold || '',
                'mar25-sellIn': dados.meses.mar25.sellIn || '',
                'mar25-sellOut': dados.meses.mar25.sellOut || '',
                'mar25-saldo': dados.meses.mar25.saldo || '',
                'mar25-sold': dados.meses.mar25.sold || '',
                'abr25-sellIn': dados.meses.abr25.sellIn || '',
                'abr25-sellOut': dados.meses.abr25.sellOut || '',
                'abr25-saldo': dados.meses.abr25.saldo || '',
                'abr25-sold': dados.meses.abr25.sold || '',
                'mai25-sellIn': dados.meses.mai25.sellIn || '',
                'mai25-sellOut': dados.meses.mai25.sellOut || '',
                'mai25-saldo': dados.meses.mai25.saldo || '',
                'mai25-sold': dados.meses.mai25.sold || '',
                'jun25-sellIn': dados.meses.jun25.sellIn || '',
                'jun25-sellOut': dados.meses.jun25.sellOut || '',
                'jun25-saldo': dados.meses.jun25.saldo || '',
                'jun25-sold': dados.meses.jun25.sold || '',
                'jul25-sellIn': dados.meses.jul25.sellIn || '',
                'jul25-sellOut': dados.meses.jul25.sellOut || '',
                'jul25-saldo': dados.meses.jul25.saldo || '',
                'jul25-sold': dados.meses.jul25.sold || '',
                'ago25-sellIn': dados.meses.ago25.sellIn || '',
                'ago25-sellOut': dados.meses.ago25.sellOut || '',
                'ago25-saldo': dados.meses.ago25.saldo || '',
                'ago25-sold': dados.meses.ago25.sold || '',
                'set25-sellIn': dados.meses.set25.sellIn || '',
                'set25-sellOut': dados.meses.set25.sellOut || '',
                'set25-saldo': dados.meses.set25.saldo || '',
                'set25-sold': dados.meses.set25.sold || '',
                'out25-sellIn': dados.meses.out25.sellIn || '',
                'out25-sellOut': dados.meses.out25.sellOut || '',
                'out25-saldo': dados.meses.out25.saldo || '',
                'out25-sold': dados.meses.out25.sold || '',
                'nov25-sellIn': dados.meses.nov25.sellIn || '',
                'nov25-sellOut': dados.meses.nov25.sellOut || '',
                'nov25-saldo': dados.meses.nov25.saldo || '',
                'nov25-sold': dados.meses.nov25.sold || '',
                'dez25-sellIn': dados.meses.dez25.sellIn || '',
                'dez25-sellOut': dados.meses.dez25.sellOut || '',
                'dez25-saldo': dados.meses.dez25.saldo || '',
                'dez25-sold': dados.meses.dez25.sold || '',
                _id: dados._id
            });
        });

        // Preenche a tabela com todos os itens da lista fixa
        listaItensFixos.forEach(item => {
            const dadosSalvos = sellOutMap.get(item.cod) || {};
            adicionarLinha(dadosSalvos, item.cod, item.sku);
        });
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        // Em caso de erro, preenche a tabela com a lista fixa
        document.getElementById('table-body').innerHTML = '';
        listaItensFixos.forEach(item => {
            adicionarLinha({}, item.cod, item.sku);
        });
    }
}


// Salvar dados
async function salvarDados() {
    const codgroup = document.getElementById('codgroup').value;
    const nome = document.getElementById('cliente').value;
    const cnpj = document.getElementById('cnpj').value.trim();
    const representante = document.getElementById("rep").value.trim();

    if (!cnpj || !codgroup) {
        alert('Preencha o CNPJ e o Código do Cliente.');
        return;
    }

    const linhas = Array.from(document.getElementById('table-body').rows);
    const dados = linhas.map(row => {
        const mainInputs = row.querySelectorAll('.main-input');
        const subColumnsData = JSON.parse(row.dataset.subColumns || '{}');

        return {
            codigo_cliente: codgroup,
            nome: nome,
            representante: representante,
            cod_item: mainInputs[0].value,
            sku: mainInputs[1].value,
            meses: {
                jan25: {
                    sellIn: parseFloat(subColumnsData.jan25?.sellIn || mainInputs[2].value) || 0,
                    sellOut: parseFloat(subColumnsData.jan25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.jan25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.jan25?.sold) || 0
                },
                fev25: {
                    sellIn: parseFloat(subColumnsData.fev25?.sellIn || mainInputs[3].value) || 0,
                    sellOut: parseFloat(subColumnsData.fev25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.fev25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.fev25?.sold) || 0
                },
                mar25: {
                    sellIn: parseFloat(subColumnsData.mar25?.sellIn || mainInputs[4].value) || 0,
                    sellOut: parseFloat(subColumnsData.mar25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.mar25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.mar25?.sold) || 0
                },
                abr25: {
                    sellIn: parseFloat(subColumnsData.abr25?.sellIn || mainInputs[5].value) || 0,
                    sellOut: parseFloat(subColumnsData.abr25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.abr25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.abr25?.sold) || 0
                },
                mai25: {
                    sellIn: parseFloat(subColumnsData.mai25?.sellIn || mainInputs[6].value) || 0,
                    sellOut: parseFloat(subColumnsData.mai25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.mai25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.mai25?.sold) || 0
                },
                jun25: {
                    sellIn: parseFloat(subColumnsData.jun25?.sellIn || mainInputs[7].value) || 0,
                    sellOut: parseFloat(subColumnsData.jun25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.jun25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.jun25?.sold) || 0
                },
                jul25: {
                    sellIn: parseFloat(subColumnsData.jul25?.sellIn || mainInputs[8].value) || 0,
                    sellOut: parseFloat(subColumnsData.jul25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.jul25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.jul25?.sold) || 0
                },
                ago25: {
                    sellIn: parseFloat(subColumnsData.ago25?.sellIn || mainInputs[9].value) || 0,
                    sellOut: parseFloat(subColumnsData.ago25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.ago25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.ago25?.sold) || 0
                },
                set25: {
                    sellIn: parseFloat(subColumnsData.set25?.sellIn || mainInputs[10].value) || 0,
                    sellOut: parseFloat(subColumnsData.set25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.set25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.set25?.sold) || 0
                },
                out25: {
                    sellIn: parseFloat(subColumnsData.out25?.sellIn || mainInputs[11].value) || 0,
                    sellOut: parseFloat(subColumnsData.out25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.out25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.out25?.sold) || 0
                },
                nov25: {
                    sellIn: parseFloat(subColumnsData.nov25?.sellIn || mainInputs[12].value) || 0,
                    sellOut: parseFloat(subColumnsData.nov25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.nov25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.nov25?.sold) || 0
                },
                dez25: {
                    sellIn: parseFloat(subColumnsData.dez25?.sellIn || mainInputs[13].value) || 0,
                    sellOut: parseFloat(subColumnsData.dez25?.sellOut) || 0,
                    saldo: parseFloat(subColumnsData.dez25?.saldo) || 0,
                    sold: parseFloat(subColumnsData.dez25?.sold) || 0
                }
            }
        };
    });

    try {
        const response = await fetch('/api/sellOut/salvar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo_cliente: codgroup, nome, representante: representante, sellOut: dados })
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar dados');
    }
}


// Função para alternar subcolunas
function toggleSubColumns(month) {
    console.log(`Toggling subcolumns for month: ${month}`); // Log para depuração
    const toggleBtn = document.getElementById(`toggle-${month}`);
    const table = document.querySelector('table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    const monthIndex = ['jan25', 'fev25', 'mar25', 'abr25', 'mai25', 'jun25', 'jul25', 'ago25', 'set25', 'out25', 'nov25', 'dez25'].indexOf(month);
    const activeMonth = table.getAttribute('data-active-month');

    if (!toggleBtn) {
        console.error(`Toggle button for ${month} not found!`);
        return;
    }

    if (activeMonth === month) {
        // Ocultar subcolunas
        console.log('Hiding subcolumns');
        table.querySelectorAll('.sub-column').forEach(cell => cell.remove());
        table.removeAttribute('data-active-month');
        toggleBtn.textContent = '+';
    } else {
        // Remover subcolunas existentes
        console.log('Removing existing subcolumns');
        table.querySelectorAll('.sub-column').forEach(cell => cell.remove());
        if (activeMonth) {
            document.getElementById(`toggle-${activeMonth}`).textContent = '+';
        }

        // Adicionar subcolunas no thead
        const headerRow = thead.querySelector('tr');
        if (!headerRow) {
            console.error('Header row not found!');
            return;
        }
        const monthHeaderCell = headerRow.children[monthIndex + 2]; // +2 para pular COD_item e SKU
        if (!monthHeaderCell) {
            console.error(`Month header cell for index ${monthIndex + 2} not found!`);
            return;
        }
        console.log('Adding subcolumns to thead');
        monthHeaderCell.insertAdjacentHTML('afterend', `
            <th class="sub-column active">Sell In</th>
            <th class="sub-column active">Sell Out</th>
            <th class="sub-column active">Saldo</th>
            <th class="sub-column active">% Sold</th>
        `);

        // Adicionar subcolunas no tbody
        console.log('Adding subcolumns to tbody');
        Array.from(tbody.children).forEach(row => {
            const subColumnsData = JSON.parse(row.dataset.subColumns || '{}');
            const monthData = subColumnsData[month] || {};
            const monthCell = row.children[monthIndex + 2]; // +2 para pular COD_item e SKU
            if (!monthCell) {
                console.error(`Month cell for index ${monthIndex + 2} not found in row!`);
                return;
            }
            monthCell.insertAdjacentHTML('afterend', `
                <td class="sub-column active"><input type="text" class="sub-input" value="${monthData.sellIn || ''}"></td>
                <td class="sub-column active"><input type="text" class="sub-input" value="${monthData.sellOut || ''}"></td>
                <td class="sub-column active"><input type="text" class="sub-input" value="${monthData.saldo || ''}"></td>
                <td class="sub-column active"><input type="text" class="sub-input" value="${monthData.sold || ''}"></td>
            `);

            // Atualizar dataset com valores dos inputs ao mudar
            row.querySelectorAll('.sub-input').forEach((input, index) => {
                input.addEventListener('input', () => {
                    const subColumns = JSON.parse(row.dataset.subColumns || '{}');
                    if (!subColumns[month]) subColumns[month] = {};
                    if (index === 0) subColumns[month].sellIn = input.value;
                    if (index === 1) subColumns[month].sellOut = input.value;
                    if (index === 2) subColumns[month].saldo = input.value;
                    if (index === 3) subColumns[month].sold = input.value;
                    row.dataset.subColumns = JSON.stringify(subColumns);
                });
            });
        });

        table.setAttribute('data-active-month', month);
        toggleBtn.textContent = '-';
    }
}


// Eventos
document.addEventListener('DOMContentLoaded', () => {
    // Certificar-se de que os elementos já existem no DOM antes de adicionar eventos
    document.getElementById('cnpj').addEventListener('focus', limparCamposCliente);

    document.getElementById('cnpj').addEventListener('blur', async function () {
        const cnpj = this.value.replace(/\D/g, '');
        if (!cnpj) {
            limparCamposCliente();
            return;
        }
        if (cnpjInvalido(cnpj)) {
            alert('CNPJ inválido.');
            this.value = '';
            limparCamposCliente();
            return;
        }

        const cliente = buscarCliente(cnpj);
        if (cliente) {
            document.getElementById('cliente').value = cliente[29];
            document.getElementById('codgroup').value = cliente[30];
            document.getElementById('rep').value = cliente[15];
            await buscarDadosSellOut(cliente[30]);
        } else {
            alert('Cliente não encontrado.');
            limparCamposCliente();
        }
    });

    document.getElementById('adicionaLinha').addEventListener('click', () => adicionarLinha());

    document.getElementById('btnSalvarDados1').addEventListener('click', salvarDados);

    // Adicionar eventos para os botões de alternância
    const meses = ['jan25', 'fev25', 'mar25', 'abr25', 'mai25', 'jun25', 'jul25', 'ago25', 'set25', 'out25', 'nov25', 'dez25'];
    meses.forEach(mes => {
        const toggleBtn = document.getElementById(`toggle-${mes}`);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => toggleSubColumns(mes));
        } else {
            console.error(`Toggle button for ${mes} not found!`);
        }
    });
});



document.getElementById('btnSalvarDados1').addEventListener('click', salvarDados);

// Adicionar eventos para os botões de alternância
const meses = ['jan25', 'fev25', 'mar25', 'abr25', 'mai25', 'jun25', 'jul25', 'ago25', 'set25', 'out25', 'nov25', 'dez25'];
meses.forEach(mes => {
    const toggleBtn = document.getElementById(`toggle-${mes}`);
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => toggleSubColumns(mes));
    } else {
        console.error(`Toggle button for ${mes} not found!`);
    }
});
