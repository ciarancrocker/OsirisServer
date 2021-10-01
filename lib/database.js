(require('dotenv')).config();

const pg = require('pg');

module.exports = new pg.Pool({
    connectionString: process.env.DATABSE_URL,
});
