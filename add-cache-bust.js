const fs = require('fs');
const path = require('path');

const folderPath = './views'; // Caminho para a pasta onde estão os arquivos HTML

function addCacheBust(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const timestamp = Date.now();

    // Atualiza links de CSS
    content = content.replace(/<link rel="stylesheet" href="([^"]+?)(\?v=\d+)?"/g, (match, p1) => {
        return `<link rel="stylesheet" href="${p1}?v=${timestamp}"`;
    });

    // Atualiza links de JS, ignorando URLs externas (começando com https)
    content = content.replace(/<script src="(?!https)([^"]+?)(\?v=\d+)?"/g, (match, p1) => {
        return `<script src="${p1}?v=${timestamp}"`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cache-busting aplicado em: ${filePath}`);
}

function processFolder(folder) {
    fs.readdirSync(folder).forEach(file => {
        const fullPath = path.join(folder, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            processFolder(fullPath); // Processa subpastas
        } else if (file.endsWith('.html')) {
            addCacheBust(fullPath);
        }
    });
}

processFolder(folderPath);

