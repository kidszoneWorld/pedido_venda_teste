async function listarItens() {
    const listarItens = await fetch('/api/listarItens')
    return listarItens
}

document.addEventListener(
    'DOMContentLoaded',
    () => {
        const lista = listarItens();
       console.log('itens', lista);
    }
);
