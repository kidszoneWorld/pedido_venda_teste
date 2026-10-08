let investimentoAtual =
    null;

const el =
    id =>
        document.getElementById(
            id
        );

function obterIdInvestimentoUrl() {
    const parametros =
        new URLSearchParams(
            window.location.search
        );

    return parametros.get(
        'id'
    );
}

function formatarDataInput(
    valor
) {
    if (!valor) {
        return '';
    }

    const texto =
        String(
            valor
        ).trim();

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            texto
        )
    ) {
        return texto;
    }

    if (texto.includes('T')) {
        return texto.split('T')[0];
    }

    const data =
        new Date(
            texto
        );

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return '';
    }

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

function formatarNumeroCampo(
    valor
) {
    const numero =
        Number(
            valor || 0
        );

    return numero.toLocaleString(
        'pt-BR',
        {
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );
}

function converterNumero(
    valor
) {
    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 0;
    }

    if (
        typeof valor ===
        'number'
    ) {
        return Number.isFinite(
            valor
        )
            ? valor
            : 0;
    }

    let texto =
        String(
            valor
        )
            .replace(
                'R$',
                ''
            )
            .replace(
                /\s/g,
                ''
            )
            .trim();

    if (
        texto.includes('.') &&
        texto.includes(',')
    ) {
        texto =
            texto
                .replace(
                    /\./g,
                    ''
                )
                .replace(
                    ',',
                    '.'
                );
    } else {
        texto =
            texto.replace(
                ',',
                '.'
            );
    }

    const numero =
        Number(
            texto
        );

    return Number.isFinite(
        numero
    )
        ? numero
        : 0;
}

function mostrarMensagem(
    mensagem,
    tipo = 'informacao'
) {
    const campo =
        el(
            'mensagemEdicaoInvestimento'
        );

    if (!campo) {
        return;
    }

    campo.textContent =
        mensagem;

    campo.style.display =
        'block';

    campo.dataset.tipo =
        tipo;
}

function ocultarMensagem() {
    const campo =
        el(
            'mensagemEdicaoInvestimento'
        );

    if (!campo) {
        return;
    }

    campo.textContent =
        '';

    campo.style.display =
        'none';
}

function renumerarParcelas() {
    const linhas =
        Array.from(
            document.querySelectorAll(
                '#tabelaParcelasInvestimento tbody ' +
                '.linha-parcela-investimento'
            )
        );

    const quantidadeParcelas =
        linhas.length;

    linhas.forEach(
        (
            tr,
            indice
        ) => {
            const campoParcela =
                tr.querySelector(
                    '.campo-parcela-investimento'
                );

            if (campoParcela) {
                campoParcela.value =
                    `${indice + 1}/${quantidadeParcelas}`;
            }
        }
    );
}

function recalcularParcelasInvestimento() {
    const linhas =
        document.querySelectorAll(
            '#tabelaParcelasInvestimento tbody ' +
            '.linha-parcela-investimento'
        );

    let totalInvestimento =
        0;

    linhas.forEach(
        tr => {
            totalInvestimento +=
                converterNumero(
                    tr.querySelector(
                        '.campo-valor-parcela-investimento'
                    )?.value
                );
        }
    );

    const campoValorInvestimento =
        el(
            'valorInvestimento'
        );

    if (campoValorInvestimento) {
        campoValorInvestimento.value =
            formatarNumeroCampo(
                totalInvestimento
            );
    }

    recalcularPercentualInvestimento();
}

function recalcularPercentualInvestimento() {
    const valorInvestimento =
        converterNumero(
            el(
                'valorInvestimento'
            )?.value
        );

    const valorCompra =
        converterNumero(
            el(
                'valorCompraInvestimento'
            )?.value
        );

    const percentual =
        valorCompra > 0
            ? (
                valorInvestimento /
                valorCompra
            ) * 100
            : 0;

    const campoPercentual =
        el(
            'investimentoSobreCompra'
        );

    if (campoPercentual) {
        campoPercentual.value =
            formatarNumeroCampo(
                percentual
            );
    }
}

function adicionarLinhaParcela(
    parcela = null
) {
    const tbody =
        document.querySelector(
            '#tabelaParcelasInvestimento tbody'
        );

    if (!tbody) {
        console.error(
            'O corpo da tabela de parcelas não foi encontrado.'
        );

        return null;
    }

    const tr =
        document.createElement(
            'tr'
        );

    tr.classList.add(
        'linha-parcela-investimento'
    );

    tr.innerHTML = `
        <td class="coluna-parcela">
            <input
                type="text"
                class="campo-parcela-investimento"
                autocomplete="off"
                readonly
                tabindex="-1"
            >
        </td>

        <td class="coluna-valor-parcela">
            <input
                type="text"
                class="campo-valor-parcela-investimento"
                inputmode="decimal"
                autocomplete="off"
                placeholder="0,00"
            >
        </td>

        <td class="coluna-excluir no-print">
            <button
                type="button"
                class="btn-remover-parcela-investimento"
            >
                Excluir
            </button>
        </td>
    `;

    tbody.appendChild(
        tr
    );

    const campoParcela =
        tr.querySelector(
            '.campo-parcela-investimento'
        );

    const campoValorParcela =
        tr.querySelector(
            '.campo-valor-parcela-investimento'
        );

    const botaoRemover =
        tr.querySelector(
            '.btn-remover-parcela-investimento'
        );

    if (
        !campoParcela ||
        !campoValorParcela
    ) {
        console.error(
            'Os campos da parcela não foram criados corretamente.'
        );

        tr.remove();

        return null;
    }

    campoParcela.value =
        parcela?.parcela ||
        '';

    campoValorParcela.value =
        parcela &&
        parcela.valorParcela !== null &&
        parcela.valorParcela !== undefined
            ? formatarNumeroCampo(
                parcela.valorParcela
            )
            : '';

    campoValorParcela.addEventListener(
        'focus',
        () => {
            campoValorParcela.select();
        }
    );

    campoValorParcela.addEventListener(
        'blur',
        () => {
            const valor =
                converterNumero(
                    campoValorParcela.value
                );

            campoValorParcela.value =
                valor > 0
                    ? formatarNumeroCampo(
                        valor
                    )
                    : '';

            recalcularParcelasInvestimento();
        }
    );

    campoValorParcela.addEventListener(
        'input',
        recalcularParcelasInvestimento
    );

    botaoRemover?.addEventListener(
        'click',
        () => {
            tr.remove();

            garantirLinhaParcela();

            renumerarParcelas();

            recalcularParcelasInvestimento();
        }
    );

    renumerarParcelas();

    return tr;
}

function garantirLinhaParcela() {
    const tbody =
        document.querySelector(
            '#tabelaParcelasInvestimento tbody'
        );

    if (!tbody) {
        return;
    }

    const possuiLinha =
        tbody.querySelector(
            '.linha-parcela-investimento'
        );

    if (!possuiLinha) {
        adicionarLinhaParcela();
    }

    renumerarParcelas();
}

function renderizarParcelas(
    parcelas
) {
    const tbody =
        document.querySelector(
            '#tabelaParcelasInvestimento tbody'
        );

    if (!tbody) {
        console.error(
            'Tabela de parcelas não encontrada.'
        );

        return;
    }

    tbody.innerHTML =
        '';

    const parcelasValidas =
        Array.isArray(
            parcelas
        )
            ? parcelas
            : [];

    parcelasValidas.forEach(
        parcela => {
            adicionarLinhaParcela({
                parcela:
                    parcela.parcela ||
                    '',

                valorParcela:
                    Number(
                        parcela.valorParcela ||
                        0
                    )
            });
        }
    );

    garantirLinhaParcela();

    renumerarParcelas();

    recalcularParcelasInvestimento();
}

function preencherInvestimento(
    investimento
) {
    el('codigoInvestimento').value =
        investimento
            .codigoInvestimento ||
        '';

    el('statusInvestimento').value =
        investimento
            .statusInvestimento ||
        '';

    el('cnpjInvestimento').value =
        investimento
            .cnpjInvestimento ||
        '';

    el('enderecoInvestimento').value =
        investimento
            .enderecoInvestimento ||
        '';

    el('razaoSocialInvestimento').value =
        investimento
            .razaoSocialInvestimento ||
        '';

    el('telefoneInvestimento').value =
        investimento
            .telefoneInvestimento ||
        '';

    el('responsavelInvestimento').value =
        investimento
            .responsavelInvestimento ||
        '';

    el('cargoInvestimento').value =
        investimento
            .cargoInvestimento ||
        '';

    el('resumoInvestimento').value =
        investimento
            .resumoInvestimento ||
        '';

    el('vigenciaInicialInvestimento').value =
        formatarDataInput(
            investimento
                .vigenciaInicialInvestimento
        );

    el('vigenciaFinalInvestimento').value =
        formatarDataInput(
            investimento
                .vigenciaFinalInvestimento
        );

    el('tipoInvestimento').value =
        investimento
            .tipoInvestimento ||
        '';

    el('descricaoInvestimento').value =
        investimento
            .descricaoInvestimento ||
        '';

    el(
        'observacaoDescricaoInvestimento'
    ).value =
        investimento
            .observacaoDescricaoInvestimento ||
        '';

    el('valorInvestimento').value =
        formatarNumeroCampo(
            investimento
                .valorInvestimento
        );

    el('valorCompraInvestimento').value =
        formatarNumeroCampo(
            investimento
                .valorCompraInvestimento
        );

    el('representanteInvestimento').value =
        investimento
            .representanteInvestimento ||
        '';

    el('observacaoInvestimento').value =
        investimento
            .observacaoInvestimento ||
        '';

    el('investimentoSobreCompra').value =
        formatarNumeroCampo(
            investimento
                .investimentoSobreCompra
        );

    atualizarContadorObservacao();

    renderizarParcelas(
        investimento.parcelas ||
        []
    );
}

function atualizarContadorObservacao() {
    const observacao =
        el(
            'observacaoInvestimento'
        );

    const contador =
        el(
            'contadorObservacaoInvestimento'
        );

    if (
        observacao &&
        contador
    ) {
        contador.textContent =
            String(
                observacao.value.length
            );
    }
}

function montarObjetoEdicao() {
    const parcelas =
        Array.from(
            document.querySelectorAll(
                '#tabelaParcelasInvestimento tbody ' +
                '.linha-parcela-investimento'
            )
        )
            .map(
                tr => {
                    const parcela =
                        String(
                            tr.querySelector(
                                '.campo-parcela-investimento'
                            )?.value || ''
                        ).trim();

                    const valorParcela =
                        converterNumero(
                            tr.querySelector(
                                '.campo-valor-parcela-investimento'
                            )?.value
                        );

                    return {
                        parcela:
                            parcela,

                        valorParcela:
                            valorParcela
                    };
                }
            )
            .filter(
                parcela => {
                    return (
                        parcela.parcela &&
                        parcela.valorParcela >
                            0
                    );
                }
            );

    return {
        cnpjInvestimento:
            el(
                'cnpjInvestimento'
            ).value.trim(),

        enderecoInvestimento:
            el(
                'enderecoInvestimento'
            ).value.trim(),

        razaoSocialInvestimento:
            el(
                'razaoSocialInvestimento'
            ).value.trim(),

        telefoneInvestimento:
            el(
                'telefoneInvestimento'
            ).value.trim(),

        responsavelInvestimento:
            el(
                'responsavelInvestimento'
            ).value.trim(),

        cargoInvestimento:
            el(
                'cargoInvestimento'
            ).value.trim(),

        resumoInvestimento:
            el(
                'resumoInvestimento'
            ).value.trim(),

        vigenciaInicialInvestimento:
            el(
                'vigenciaInicialInvestimento'
            ).value,

        vigenciaFinalInvestimento:
            el(
                'vigenciaFinalInvestimento'
            ).value,

        tipoInvestimento:
            el(
                'tipoInvestimento'
            ).value,

        descricaoInvestimento:
            el(
                'descricaoInvestimento'
            ).value.trim(),

        observacaoDescricaoInvestimento:
            el(
                'observacaoDescricaoInvestimento'
            ).value.trim(),

        valorInvestimento:
            converterNumero(
                el(
                    'valorInvestimento'
                ).value
            ),

        valorCompraInvestimento:
            converterNumero(
                el(
                    'valorCompraInvestimento'
                ).value
            ),

        representanteInvestimento:
            el(
                'representanteInvestimento'
            ).value.trim(),

        observacaoInvestimento:
            el(
                'observacaoInvestimento'
            )?.value.trim() ||
            '',

        investimentoSobreCompra:
            converterNumero(
                el(
                    'investimentoSobreCompra'
                ).value
            ),

        parcelas:
            parcelas
    };
}

function validarEdicao(
    dados
) {
    if (
        !Array.isArray(
            dados.parcelas
        ) ||
        dados.parcelas.length === 0
    ) {
        alert(
            'Adicione pelo menos uma parcela ao investimento.'
        );

        return false;
    }

    for (
        let indice = 0;
        indice < dados.parcelas.length;
        indice += 1
    ) {
        const parcela =
            dados.parcelas[indice];

        if (
            !parcela.parcela ||
            parcela.valorParcela <= 0
        ) {
            alert(
                `Informe um valor válido para a parcela ${indice + 1}.`
            );

            document
                .querySelectorAll(
                    '.campo-valor-parcela-investimento'
                )[
                    indice
                ]
                ?.focus();

            return false;
        }
    }

    const totalParcelas =
        dados.parcelas.reduce(
            (
                acumulado,
                parcela
            ) => {
                return acumulado +
                    Number(
                        parcela.valorParcela ||
                        0
                    );
            },
            0
        );

    const diferenca =
        Math.abs(
            totalParcelas -
            dados.valorInvestimento
        );

    if (diferenca > 0.01) {
        alert(
            'A soma das parcelas deve ser igual ao valor do investimento.'
        );

        return false;
    }

    if (
        !dados.cnpjInvestimento
    ) {
        alert(
            'Informe o CNPJ.'
        );

        el(
            'cnpjInvestimento'
        ).focus();

        return false;
    }

    if (
        !dados.razaoSocialInvestimento
    ) {
        alert(
            'Informe a razão social.'
        );

        el(
            'razaoSocialInvestimento'
        ).focus();

        return false;
    }

    if (
        !dados.tipoInvestimento
    ) {
        alert(
            'Selecione o tipo de investimento.'
        );

        el(
            'tipoInvestimento'
        ).focus();

        return false;
    }

    if (
        dados.valorInvestimento <= 0
    ) {
        alert(
            'Informe um valor de investimento válido.'
        );

        el(
            'valorInvestimento'
        ).focus();

        return false;
    }

    if (
        dados.observacaoInvestimento
            .length > 600
    ) {
        alert(
            'A observação deve possuir no máximo 600 caracteres.'
        );

        el(
            'observacaoInvestimento'
        ).focus();

        return false;
    }

    return true;
}

async function salvarEdicaoInvestimento() {
    if (!investimentoAtual) {
        alert(
            'O investimento ainda não foi carregado.'
        );

        return;
    }

    const status =
        String(
            investimentoAtual
                .statusInvestimento ||
            ''
        )
            .trim()
            .toLowerCase();

    if (
        status !==
        'pendente'
    ) {
        alert(
            'Somente investimentos pendentes podem ser editados.'
        );

        return;
    }

    const dados =
        montarObjetoEdicao();

    if (
        !validarEdicao(
            dados
        )
    ) {
        return;
    }

    if (
        !confirm(
            'Deseja salvar as alterações deste investimento?'
        )
    ) {
        return;
    }

    const botao =
        el(
            'salvarEdicaoInvestimento'
        );

    try {
        botao.disabled =
            true;

        botao.textContent =
            'Salvando...';

        mostrarMensagem(
            'Salvando investimento...'
        );

        const response =
            await fetch(
                `/api/investimentos-comerciais/${encodeURIComponent(
                    investimentoAtual
                        .codigoInvestimento
                )}/editar`,
                {
                    method:
                        'PUT',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Accept:
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            dados
                        )
                }
            );

        const texto =
            await response.text();

        let resultado =
            null;

        if (texto) {
            try {
                resultado =
                    JSON.parse(
                        texto
                    );
            } catch {
                resultado = {
                    mensagem:
                        texto
                };
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.mensagem ||
                resultado?.error ||
                texto ||
                `Erro HTTP ${response.status}`
            );
        }

        alert(
            resultado?.mensagem ||
            'Investimento atualizado com sucesso.'
        );

        window.location.href =
            '/PainelInvestimento';
    } catch (error) {
        console.error(
            'Erro ao editar investimento:',
            error
        );

        alert(
            error.message ||
            'Erro ao editar investimento.'
        );
    } finally {
        botao.disabled =
            false;

        botao.textContent =
            'SALVAR ALTERAÇÕES';

        ocultarMensagem();
    }
}

async function carregarInvestimento() {
    const codigoInvestimento =
        obterIdInvestimentoUrl();

    if (!codigoInvestimento) {
        alert(
            'Código do investimento não informado.'
        );

        window.location.href =
            '/PainelInvestimento';

        return;
    }

    try {
        mostrarMensagem(
            'Carregando investimento...'
        );

        const response =
            await fetch(
                `/api/investimentos-comerciais/${encodeURIComponent(
                    codigoInvestimento
                )}/editar`,
                {
                    headers: {
                        Accept:
                            'application/json'
                    },

                    credentials:
                        'same-origin'
                }
            );

        const texto =
            await response.text();

        let resultado =
            null;

        if (texto) {
            try {
                resultado =
                    JSON.parse(
                        texto
                    );
            } catch {
                throw new Error(
                    'O servidor retornou uma resposta inválida.'
                );
            }
        }

        if (!response.ok) {
            throw new Error(
                resultado?.mensagem ||
                resultado?.error ||
                texto ||
                'Erro ao carregar investimento.'
            );
        }

        investimentoAtual =
            resultado.investimento;

        const status =
            String(
                investimentoAtual
                    .statusInvestimento ||
                ''
            )
                .trim()
                .toLowerCase();

        if (
            status !==
            'pendente'
        ) {
            alert(
                'Este investimento não está pendente e não pode ser editado.'
            );

            window.location.href =
                '/PainelInvestimento';

            return;
        }

        preencherInvestimento(
            investimentoAtual
        );
    } catch (error) {
        console.error(
            'Erro ao carregar investimento:',
            error
        );

        alert(
            error.message ||
            'Erro ao carregar investimento.'
        );

        window.location.href =
            '/PainelInvestimento';
    } finally {
        ocultarMensagem();
    }
}

document.addEventListener(
    'DOMContentLoaded',
    async () => {
        el(
            'voltarPainelInvestimentos'
        )?.addEventListener(
            'click',
            () => {
                window.location.href =
                    '/PainelInvestimento';
            }
        );

        el(
            'salvarEdicaoInvestimento'
        )?.addEventListener(
            'click',
            salvarEdicaoInvestimento
        );

        el(
            'observacaoInvestimento'
        )?.addEventListener(
            'input',
            atualizarContadorObservacao
        );

        el(
            'adicionarParcelaInvestimento'
        )?.addEventListener(
            'click',
            () => {
                adicionarLinhaParcela();
            }
        );
        el(
    'valorCompraInvestimento'
)?.addEventListener(
    'input',
    recalcularPercentualInvestimento
);

el(
    'valorCompraInvestimento'
)?.addEventListener(
    'blur',
    evento => {
        const valor =
            converterNumero(
                evento.currentTarget.value
            );

        evento.currentTarget.value =
            valor > 0
                ? formatarNumeroCampo(
                    valor
                )
                : '';

        recalcularPercentualInvestimento();
            }
        );

        el(
            'valorInvestimento'
        )?.addEventListener(
            'input',
            recalcularPercentualInvestimento
        );
        await carregarInvestimento();


    }
);

