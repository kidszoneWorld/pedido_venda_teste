async function listarItens() {
    const listarItens = await fetch('/api/listarItens')
    return listarItens
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        const lista = JSON.parse(listarItens());
       console.log('itens'.lista());
    }
);
