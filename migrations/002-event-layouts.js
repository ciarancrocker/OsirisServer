'use strict';
const db = require('../lib/database');

module.exports.up = async function() {
  const c = await db.connect();
  await c.query('CREATE TABLE event_layouts (' +
    'event_id UUID NOT NULL, ' +
    'layout_id UUID NOT NULL, ' +
    'PRIMARY KEY (event_id, layout_id), ' +
    'FOREIGN KEY (event_id) REFERENCES events(event_id), ' +
    'FOREIGN KEY (layout_id) REFERENCES layouts(layout_id)' +
    ')',
  );
  await c.release();
};

module.exports.down = async function() {
  await db.query('DROP TABLE IF EXISTS event_layouts');
};
