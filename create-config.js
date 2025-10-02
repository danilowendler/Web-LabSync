// Este script Node.js será executado pela Netlify antes de publicar o site.
const fs = require('fs');

// Pegamos as variáveis de ambiente seguras configuradas na Netlify.
// Usamos o prefixo 'PUBLIC_' para indicar que elas podem ser lidas no front-end.
const apiUrl = process.env.PUBLIC_API_BASE_URL;
const apiKey = process.env.PUBLIC_API_KEY;

// Criamos o conteúdo do arquivo config.js dinamicamente.
const configContent = `
const API_CONFIG = {
  BASE_URL: '${apiUrl}',
  API_KEY: '${apiKey}'
};
`;

// Escrevemos o conteúdo no arquivo config.js, que será então publicado.
fs.writeFileSync('config.js', configContent.trim());

console.log('Arquivo config.js gerado com sucesso para o deploy!');