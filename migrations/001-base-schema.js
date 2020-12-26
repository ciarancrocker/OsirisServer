'use strict';
// this migration contains all the tables designed for Osiris up to 2018-07-19 when
// migrations were added

const db = require('../lib/database');

module.exports.up = async function() {
  const c = await db.connect();
  await c.query('BEGIN TRANSACTION');
  await c.query('CREATE TABLE IF NOT EXISTS users (' +
    'user_id UUID NOT NULL, ' +
    'discord_id CHARACTER VARYING NOT NULL, ' +
    'access_token CHARACTER VARYING, ' +
    'refresh_token CHARACTER VARYING, ' +
    'expiry TIMESTAMP, ' +
    'tag CHARACTER VARYING NOT NULL, ' +
    'profile_url CHARACTER VARYING NOT NULL, ' +
    'PRIMARY KEY (user_id) ' +
    ')'
  );
  await c.query('CREATE TABLE IF NOT EXISTS events (' +
    'event_id UUID NOT NULL, ' +
    'name CHARACTER VARYING NOT NULL, ' +
    'read_only BOOLEAN NOT NULL DEFAULT FALSE, ' +
    'header_image CHARACTER VARYING, ' +
    'PRIMARY KEY (event_id)' +
    ')'
  );
  await c.query('CREATE TABLE IF NOT EXISTS layouts (' +
    'layout_id UUID NOT NULL, ' +
    'name CHARACTER VARYING NOT NULL, ' +
    'prefix CHARACTER VARYING NOT NULL, ' +
    'PRIMARY KEY (layout_id) ' +
    ')'
  );
  await c.query('CREATE TABLE IF NOT EXISTS seats (' +
    'seat_id UUID NOT NULL, ' +
    'layout_id UUID NOT NULL, ' +
    'tag CHARACTER VARYING NOT NULL, ' +
    'x_pos REAL NOT NULL, ' +
    'y_pos REAL NOT NULL, ' +
    'PRIMARY KEY (seat_id), ' +
    'FOREIGN KEY (layout_id) REFERENCES layouts(layout_id)' +
    ')'
  );
  await c.query('CREATE TABLE IF NOT EXISTS seat_reservations (' +
    'seat_id UUID NOT NULL, ' +
    'event_id UUID NOT NULL, ' +
    'user_id UUID NOT NULL, ' +
    'PRIMARY KEY (seat_id, event_id, user_id), ' +
    'UNIQUE (event_id, user_id), ' +
    'UNIQUE (seat_id, event_id),' +
    'FOREIGN KEY (seat_id) REFERENCES seats(seat_id), ' +
    'FOREIGN KEY (event_id) REFERENCES events(event_id), ' +
    'FOREIGN KEY (user_id) REFERENCES users(user_id)' +
    ')'
  );
  await c.query('COMMIT');
  await c.release();
  return;
};

module.exports.down = async function() {
  const c = await db.connect();
  await c.query('BEGIN TRANSACTION');
  await c.query('DROP TABLE IF EXISTS seat_reservations');
  await c.query('DROP TABLE IF EXISTS seats');
  await c.query('DROP TABLE IF EXISTS layouts');
  await c.query('DROP TABLE IF EXISTS events');
  await c.query('DROP TABLE IF EXISTS users');
  await c.query('COMMIT');
  await c.release();
  return;
};
