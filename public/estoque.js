let todosItensEstoque = [];

async function listarItens() {
    const controller = new AbortController();

    const timeout = setTimeout(
        () => {
            controller.abort();
        },
        120000
    );

    try {
        const response = await fetch(
            '/api/listarItens',
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                signal: controller.signal
            }
        );

        const textoResposta = await response.text();

        let resultado = null;

        if (textoResposta) {
            try {
                resultado = JSON.parse(textoResposta);
            } catch (error) {
                throw new Error(
                    'O servidor retornou uma resposta inválida.'
                );
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.mensagem ||
                resultado?.message ||
                textoResposta ||
                `Erro HTTP ${response.status}`
            );
        }

        if (Array.isArray(resultado?.dados)) {
            return resultado.dados;
        }

        if (Array.isArray(resultado)) {
            return resultado;
        }

        throw new Error(
            'A resposta não contém uma lista de itens.'
        );
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(
                'O servidor demorou mais de 120 segundos para responder.'
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}



function obterPrimeiroValor(
    objeto,
    propriedades,
    valorPadrao = ''
) {
    for (const propriedade of propriedades) {
        const valor =
            objeto?.[propriedade];

        if (
            valor !== undefined &&
            valor !== null &&
            valor !== ''
        ) {
            return valor;
        }
    }

    return valorPadrao;
}

function obterCodigoItem(item) {
    return String(
        item?.codigo || ''
    ).trim();
}

function obterDescricaoItem(item) {
    return String(
        item?.descricao || 'Sem descrição'
    ).trim();
}

function obterFotoItem(item) {
    return String(
        item?.foto || ''
    ).trim();
}

function criarImagemItem(item) {
    const elementoImagem =
        document.createElement(
            'img'
        );

    elementoImagem.className =
        'foto-item-pedido';

    elementoImagem.alt =
        'Foto do produto';

    elementoImagem.loading =
        'lazy';

    const foto =
        obterFotoItem(
            item
        );

    if (!foto) {
        elementoImagem.classList.add(
            'sem-foto'
        );

        return elementoImagem;
    }

    if (
        foto.startsWith('http://') ||
        foto.startsWith('https://')
    ) {
        elementoImagem.src =
            '/api/imagem-item?url=' +
            encodeURIComponent(
                foto
            );
    } else if (
        foto.startsWith('/') ||
        foto.startsWith('data:image/')
    ) {
        elementoImagem.src =
            foto;
    } else if (
        foto.startsWith('iVBOR')
    ) {
        elementoImagem.src =
            'data:image/png;base64,' +
            foto;
    } else if (
        foto.startsWith('/9j/')
    ) {
        elementoImagem.src =
            'data:image/jpeg;base64,' +
            foto;
    } else {
        elementoImagem.classList.add(
            'sem-foto'
        );
    }

    let tentativasImagem = 0;

    elementoImagem.addEventListener(
        'error',
        () => {
            tentativasImagem += 1;

            if (tentativasImagem <= 2) {
                const separador =
                    elementoImagem.src.includes('?')
                        ? '&'
                        : '?';

                setTimeout(
                    () => {
                        elementoImagem.src =
                            elementoImagem.src +
                            separador +
                            'tentativa=' +
                            Date.now();
                    },
                    tentativasImagem * 1000
                );

                return;
            }

            console.warn(
                'Não foi possível carregar a foto do item:',
                obterCodigoItem(item)
            );

            elementoImagem.removeAttribute(
                'src'
            );

            elementoImagem.classList.add(
                'sem-foto'
            );
        }
    );

    return elementoImagem;
}

function criarLinhaItem(item) {
    const linha =
        document.createElement(
            'tr'
        );

    linha.className =
        'linha-item-estoque';

    const codigo =
        obterCodigoItem(
            item
        );

    const descricao =
        obterDescricaoItem(
            item
        );

    const celulaFoto =
        document.createElement(
            'td'
        );

    celulaFoto.className =
        'celula-foto-item';

    celulaFoto.appendChild(
        criarImagemItem(
            item
        )
    );

    const celulaCodigoDescricao =
        document.createElement(
            'td'
        );

    celulaCodigoDescricao.className =
        'codigo-descricao';

    const elementoCodigo =
        document.createElement(
            'strong'
        );

    elementoCodigo.className =
        'codigo-item';

    elementoCodigo.textContent =
        codigo ||
        'Sem código';

    const elementoSeparador =
        document.createTextNode(
            ' - '
        );

    const elementoDescricao =
        document.createElement(
            'span'
        );

    elementoDescricao.className =
        'descricao-item';

    elementoDescricao.textContent =
        descricao;

    celulaCodigoDescricao.appendChild(
        elementoCodigo
    );

    celulaCodigoDescricao.appendChild(
        elementoSeparador
    );

    celulaCodigoDescricao.appendChild(
        elementoDescricao
    );

    const celulaQuantidade =
        document.createElement(
            'td'
        );

    celulaQuantidade.className =
            'qtd';

        const saldo = Number(
        item?.qtd
    );

    celulaQuantidade.textContent = Number.isFinite(
        saldo
    )
        ? String(saldo)
        : '0';

    linha.appendChild(
        celulaFoto
    );

    linha.appendChild(
        celulaCodigoDescricao
    );

    linha.appendChild(
        celulaQuantidade
    );

    return linha;
}

function mostrarMensagemTabela(mensagem) {
    const corpoTabela =
        document.querySelector(
            '#dadosPedido tbody'
        );

    if (!corpoTabela) {
        return;
    }

    corpoTabela.innerHTML =
        '';

    const linha =
        document.createElement(
            'tr'
        );

    const celula =
        document.createElement(
            'td'
        );

    celula.colSpan =
        3;

    celula.className =
        'mensagem-lista-itens';

    celula.textContent =
        mensagem;

    linha.appendChild(
        celula
    );

    corpoTabela.appendChild(
        linha
    );
}

function renderizarItens(itens) {
    const corpoTabela =
        document.querySelector(
            '#dadosPedido tbody'
        );

    if (!corpoTabela) {
        throw new Error(
            'O corpo da tabela não foi encontrado.'
        );
    }

    corpoTabela.innerHTML =
        '';

    if (
        !Array.isArray(itens) ||
        itens.length === 0
    ) {
        mostrarMensagemTabela(
            'Nenhum item encontrado.'
        );

        return;
    }

    const fragmento =
        document.createDocumentFragment();

    for (const item of itens) {
        const linha =
            criarLinhaItem(
                item
            );

        fragmento.appendChild(
            linha
        );
    }

    corpoTabela.appendChild(
        fragmento
    );
}

function normalizarTexto(valor) {
    return String(
        valor || ''
    )
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .trim()
        .toUpperCase();
}

function filtrarItensEstoque() {
    const campoFiltro =
        document.getElementById(
            'filtroCodigoDescricao'
        );

    if (!campoFiltro) {
        return;
    }

    const pesquisa =
        normalizarTexto(
            campoFiltro.value
        );

    if (!pesquisa) {
        renderizarItens(
            todosItensEstoque
        );

        return;
    }

    const itensFiltrados =
        todosItensEstoque.filter((item) => {
            const codigo =
                normalizarTexto(
                    item?.codigo
                );

            const descricao =
                normalizarTexto(
                    item?.descricao
                );

            const codigoDescricao =
                `${codigo} ${descricao}`;

            return codigo.includes(
                pesquisa
            ) ||
                descricao.includes(
                    pesquisa
                ) ||
                codigoDescricao.includes(
                    pesquisa
                );
        });

    renderizarItens(
        itensFiltrados
    );
}

function configurarFiltroItens() {
    const campoFiltro =
        document.getElementById(
            'filtroCodigoDescricao'
        );

    if (!campoFiltro) {
        return;
    }

    campoFiltro.addEventListener(
        'input',
        filtrarItensEstoque
    );
}

async function carregarItensNaPagina() {
    mostrarMensagemTabela(
        'Carregando itens...'
    );

    try {
        const itens =
            await listarItens();

        console.log(
            'Itens recebidos:',
            itens
        );

        console.log(
            'Total de itens:',
            itens.length
        );
        todosItensEstoque = itens;
        renderizarItens(
            itens
        );
    } catch (error) {
        console.error(
            'Erro ao carregar os itens:',
            error
        );

        mostrarMensagemTabela(
            error.message ||
            'Não foi possível carregar os itens.'
        );
    }
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        configurarFiltroItens();
        carregarItensNaPagina();
    }
);