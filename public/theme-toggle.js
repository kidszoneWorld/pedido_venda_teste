// Aplica o tema salvo assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    // Aplica o tema salvo
    document.body.classList.add(savedTheme + '-theme');

    // Marca o toggle como checked se o tema for escuro
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
    }

    // Adiciona o evento de alternância
    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'dark' : 'light';
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(theme + '-theme');
        localStorage.setItem('theme', theme);
    });
});