const { Pool } = require('pg');

const pool = new Pool({
    user: 'larrymotuzis',
    host: 'localhost',
    database: 'cvg_database',
    password: '',
    port: 5432,
});

module.exports = pool;
