const { Pool } = require('pg');

const pool = new Pool({
    user: 'cvg-db',
    host: 'app-1e7b33d3-1709-42f2-8d0f-743b41672cc5-do-user-15450681-0.c.db.ondigitalocean.com',
    database: 'cvg-db',
    password: 'AVNS_ElzadMYlrK0mSRgJHxh',
    port: 25060,
    ssl: {
        rejectUnauthorized: false
    }
});

