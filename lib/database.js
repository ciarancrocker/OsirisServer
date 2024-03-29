(require('dotenv')).config();

const pg = require('pg');

module.exports = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
