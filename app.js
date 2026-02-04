require('dotenv').config();
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');
const path = require('path');
const cookieParser = require('cookie-parser');
const viewsRouter = require('./router/viewsRouter');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= MIDDLEWARES ================= */

app.use(bodyParser.json());

// JSON + FORM
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Cookies
app.use(cookieParser());

// Proxy (Vercel)
app.set('trust proxy', 1);

/* ================= REDIS / SESSION ================= */
const redisClient = new Redis({
    host: 'decent-bulldog-44204.upstash.io', // Substitua pelo host fornecido pelo Upstash
    port: 6379, // Porta padrão do Redis
    password: 'AaysAAIjcDE5NzM3NTkyYzFiYzc0ZDZiYmRhNTJkNjIzMzNhMTk4MXAxMA', // Substitua pela senha fornecida pelo Upstash
    tls: {} // Necessário para conexões seguras
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'minha-chave-secreta',
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60
  }
}));

/* ================= ROTAS DO SITE ================= */

app.use('/', viewsRouter);

app.get('/teste', (req, res) => {
  res.send('Rota de teste funcionando!');
});

/* ================= SWAGGER (DEPOIS DAS ROTAS) ================= */

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

/* ================= MONGODB ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Conectado'))
  .catch(err => console.error('Erro ao conectar MongoDB', err));

/* ================= CORS ================= */

app.use((req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://pedido-de-venda-producao.vercel.app'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Swagger em http://localhost:${PORT}/docs`);
});
