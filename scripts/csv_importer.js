// This script is used to import a CSV representing a layout into the database
// Create the layout and set the layout_id variable below accordingly

const layout_id = 'c72fb9f9-e3f8-41a2-bf2d-9cb02977b8b1';
const layout_file = 'layout.csv';

// no editerino from here

(require('dotenv')).config({path: path.resolve(process.cwd(), '../.env')});

const fs = require('fs');
const uuid = require('uuid');
const pg = require('pg');

const pool = new pg.Pool();

fs.readFile(layout_file, function(err, data) {
  if (err) throw err;
  const promises = [];
  const lines = data.toString().split('\n');
  console.log(`Processing ${lines.length} lines`);
  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    const y_pos = y;
    const columns = line.split(',');
    for (let x = 0; x < columns.length; x++) {
      const tag = columns[x].trim();
      if (tag) {
        const x_pos = x;
        promises.push(pool.query('INSERT INTO seats VALUES ($1, $2, $3, $4, $5)', [uuid.v4(), layout_id, tag, x_pos, y_pos]));
        console.log({
          x_pos,
          y_pos,
          tag: tag,
        });
      }
    }
  }
  Promise.all(promises).then(function() {
    console.log('done');
  });
});
