(require('dotenv')).config();

const pg = require('pg');

module.exports = new pg.Pool();
