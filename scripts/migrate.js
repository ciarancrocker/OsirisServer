const database = require('../lib/database');
const Umzug = require('umzug');
const UmzugPgStorage = require('../lib/UmzugPgStorage');
const path = require('path');

const umzug = new Umzug({
  storage: new UmzugPgStorage({client: database}),
  migrations: {
    path: path.resolve(__dirname, '../migrations'),
  },
});

umzug.up().then(function(migrations) {
  console.log({
    message: 'ran_migrations',
    count: migrations.length,
    migrations: migrations.map((x) => x.file),
  });
  return database.end();
});
