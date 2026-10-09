async function realizarLogout() {
    const botaoLogout =
        document.getElementById(
            'logoutButton2'
        );

    if (botaoLogout) {
        botaoLogout.disabled =
            true;

        botaoLogout.textContent =
            'Saindo...';
    }

    try {
        sessionStorage.clear();

        localStorage.removeItem(
            'dadosUsuario'
        );

        const response =
            await fetch(
                '/logout',
                {
                    method:
                        'POST',

                    credentials:
                        'include'
                }
            );

        if (!response.ok) {
            throw new Error(
                'Não foi possível encerrar a sessão.'
            );
        }

        document.cookie
            .split(';')
            .forEach(cookie => {
                const nome =
                    cookie
                        .split('=')[0]
                        .trim();

                document.cookie =
                    `${nome}=;` +
                    'expires=Thu, 01 Jan 1970 00:00:00 GMT;' +
                    'path=/';
            });

        window.location.href =
            '/login2';
    } catch (error) {
        console.error(
            'Erro ao realizar logout:',
            error
        );

        if (botaoLogout) {
            botaoLogout.disabled =
                false;

            botaoLogout.textContent =
                'Sair';
        }

        alert(
            error.message ||
            'Não foi possível sair do sistema.'
        );
    }
}

function destacarPaginaAtual() {
    const caminhoAtual =
        window.location.pathname;

    const links =
        document.querySelectorAll(
            '.link_sites a[data-rota]'
        );

    links.forEach(link => {
        const rota =
            link.dataset.rota;

        const estaAtivo =
            rota === '/'
                ? caminhoAtual === '/'
                : caminhoAtual === rota ||
                    caminhoAtual.startsWith(
                        rota + '/'
                    );

        link.classList.toggle(
            'link-ativo',
            estaAtivo
        );

        if (estaAtivo) {
            link.setAttribute(
                'aria-current',
                'page'
            );
        } else {
            link.removeAttribute(
                'aria-current'
            );
        }
    });
}

function configurarHeader() {
    const botaoLogout =
        document.getElementById(
            'logoutButton2'
        );

    if (botaoLogout) {
        botaoLogout.addEventListener(
            'click',
            realizarLogout
        );
    }

    destacarPaginaAtual();
}

async function configurarVisibilidadeEstoque() {
    try {
        const sessionResponse = await fetch(
            '/session-data',
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                credentials: 'same-origin',
                cache: 'no-store'
            }
        );

        if (!sessionResponse.ok) {
            throw new Error(
                'Não foi possível consultar a sessão.'
            );
        }

        const sessionData =
            await sessionResponse.json();

        const userNumero = String(
            sessionData.userNumero ||
            sessionData.user?.numero ||
            ''
        ).trim();

        const usuariosSemAcesso = new Set([
            '1',
            '2',
            '30',
            '79'
        ]);

        const linkEstoque =
            document.getElementById(
                'estoque'
            );

        console.log(
            'Usuário da sessão:',
            userNumero
        );

        console.log(
            'Link Estoque encontrado:',
            Boolean(linkEstoque)
        );

        if (
            linkEstoque &&
            usuariosSemAcesso.has(userNumero)
        ) {
            linkEstoque.remove();

            console.log(
                'Link Estoque removido.'
            );
        }
    } catch (error) {
        console.error(
            'Erro ao configurar o link Estoque:',
            error
        );
    }
}

async function configurarVisibilidadeRebaixa() {
    try {
        const sessionResponse = await fetch(
            '/session-data',
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                credentials: 'same-origin',
                cache: 'no-store'
            }
        );

        if (!sessionResponse.ok) {
            throw new Error(
                'Não foi possível consultar a sessão.'
            );
        }

        const sessionData =
            await sessionResponse.json();

        const userNumero = String(
            sessionData.userNumero ||
            sessionData.user?.numero ||
            ''
        ).trim();

        const usuariosSemAcesso = new Set([
            '1',
            '2',
            '30',
            '79'
        ]);

        const linkEstoque =
            document.getElementById(
                'estoque'
            );

        console.log(
            'Usuário da sessão:',
            userNumero
        );

        console.log(
            'Link Estoque encontrado:',
            Boolean(linkEstoque)
        );

        if (
            userNumero
        ) {
            linkEstoque.remove();

            console.log(
                'Link Estoque removido.'
            );
        }
    } catch (error) {
        console.error(
            'Erro ao configurar o link Estoque:',
            error
        );
    }
}


async function iniciarHeader() {
    configurarHeader();

    await configurarVisibilidadeEstoque();
    await configurarVisibilidadeRebaixa();
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        iniciarHeader
    );
} else {
    iniciarHeader();
}