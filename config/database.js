const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log('DATABASE_URL existe?', !!connectionString);

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;