(require('dotenv')).config();

const pg = require('pg');
console.log(`Using ${process.env.DATABASE_URL} to connect to Postgres.`);

module.exports = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});
