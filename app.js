require('dotenv').config();

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const path = require('path');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');

const viewsRouter = require('./router/viewsRouter');
const clientePdfController = require('./controllers/clientePdfController');

const app = express();



connectDB();

const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({
    limit: '50mb',
    extended: true
}));

app.use(cookieParser());

app.use(express.static(
    path.join(__dirname, 'public')
));


const redisClient = new Redis({
    host: 'decent-bulldog-44204.upstash.io',
    port: 6379,
    password: 'AaysAAIjcDE5NzM3NTkyYzFiYzc0ZDZiYmRhNTJkNjIzMzNhMTk4MXAxMA',
    tls: {}
});



app.use(session({

    store: new RedisStore({
        client: redisClient
    }),

    secret: 'minha-chave-secreta',

    resave: false,

    saveUninitialized: false,

    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60
    }

}));



app.use((req, res, next) => {

    res.setHeader(
        'Access-Control-Allow-Origin',
        'https://pedido-de-venda-producao.vercel.app'
    );

    res.setHeader(
        'Access-Control-Allow-Credentials',
        'true'
    );

    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );

    res.setHeader('Pragma', 'no-cache');

    res.setHeader('Expires', '0');

    res.setHeader('Surrogate-Control', 'no-store');

    next();
});



app.use('/', viewsRouter);

app.get('/teste', (req, res) => {
    res.send('Rota de teste funcionando!');
});

app.post(
    '/generate-upload-url',
    clientePdfController.generateUploadUrl
);

app.post(
    '/send-client-pdf',
    clientePdfController.sendClientPdf
);



module.exports = app;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
