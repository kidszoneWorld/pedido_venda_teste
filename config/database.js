const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POST_USER,
    host: process.env.POST_URL,
    database: process.env.POST_DB,
    password: process.env.POST_SENHA,
    port: Number(process.env.POST_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});
pool.connect()
    .then(() => console.log('Banco conectado'))
    .catch(err => console.error(err));
module.exports = pool;