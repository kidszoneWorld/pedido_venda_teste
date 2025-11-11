// app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const path = require('path');
const cookieParser = require('cookie-parser');
const viewsRouter = require('./router/viewsRouter');




const app = express();
const PORT = process.env.PORT || 3000;


// Configurar o tamanho máximo do corpo da requisição
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Middleware para parsing de JSON
app.use(express.json());

// Configurar a pasta 'public' para arquivos estáticos (CSS, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));




// Adicionar esta linha para configurar o proxy
app.set('trust proxy', 1); // Necessário para cookies seguros em proxies (como Vercel)

// Configuração do Redis
const redisClient = new Redis({
    host: 'decent-bulldog-44204.upstash.io', // Substitua pelo host fornecido pelo Upstash
    port: 6379, // Porta padrão do Redis
    password: 'AaysAAIjcDE5NzM3NTkyYzFiYzc0ZDZiYmRhNTJkNjIzMzNhMTk4MXAxMA', // Substitua pela senha fornecida pelo Upstash
    tls: {} // Necessário para conexões seguras
});

app.use(cookieParser());

// Configuração da sessão
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'minha-chave-secreta', // Altere para uma chave forte
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Garante HTTPS
        httpOnly: true,
        sameSite: 'strict', // None para cross-origin em produção
        maxAge: 1000 * 60 * 60 // 1 hora
    }
}));

// Usar o router para as views
app.use('/', viewsRouter);

app.get('/teste', (req, res) => {
    res.send('Rota de teste funcionando!');
});


//app.use((req, res, next) => {
// res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
// res.setHeader('Pragma', 'no-cache');
// res.setHeader('Expires', '0');
// res.setHeader('Surrogate-Control', 'no-store');
// next();
//});


/////banco de dados mogondb atlas
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB Conectado"))
    .catch(err => console.error("Erro ao conectar MongoDB", err));


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://pedido-de-venda-producao.vercel.app'); // Substitua pela URL do seu site
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});



// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
