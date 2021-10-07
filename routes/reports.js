const db = require('../lib/database');
const express = require('express');

const r = module.exports = express.Router(); // eslint-disable-line new-cap

r.get('/seatCards/:eventId', async function(req, res) {
  if (!req.params.eventId) {
    return void res.status(401).json({status: 'err', msg: 'no_event_specified'});
  }
  const {eventId} = req.params;
  try {
    const event = await db.query('SELECT * FROM events WHERE event_id=$1', [eventId]);
    const seats = await db.query(
      'SELECT a.tag AS seat, c.tag AS user, c.profile_url AS profile, d.prefix AS prefix ' +
        'FROM seats a FULL JOIN seat_reservations b ON (a.seat_id=b.seat_id AND b.event_id=$1) ' +
        'FULL JOIN users c ON (b.user_id=c.user_id) JOIN layouts d ON (d.layout_id=a.layout_id) ' +
        'WHERE a.layout_id IN (SELECT layout_id FROM event_layouts WHERE event_id=$1) ORDER BY prefix ASC, seat ASC;',
      [eventId],
    );

    const viewInfo = {
      seats: seats.rows,
      API_URL: process.env.API_URL,
      eventBanner: event.rows[0].header_image,
    };
    res.render('seatCards.njk', viewInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

r.get('/seated/:eventId', async function(req, res) {
  if (!req.params.eventId) {
    return void res.status(401).json({status: 'err', msg: 'no_event_specified'});
  }
  const {eventId} = req.params;
  try {
    const event = await db.query('SELECT * FROM events WHERE event_id=$1', [eventId]);
    const seats = await db.query(
      'select a.tag as seat, c.tag as user, c.profile_url as profile, d.prefix as prefix from seats a ' +
        'full join seat_reservations b on (a.seat_id=b.seat_id and b.event_id=$1) ' +
        'full join users c on (b.user_id=c.user_id) join layouts d on (d.layout_id=a.layout_id) ' +
        'where a.layout_id in (select layout_id from event_layouts where event_id=$1) order by prefix asc, seat asc;',
      [eventId],
    );

    const viewInfo = {
      eventName: event.rows[0].name,
      seats: seats.rows,
      API_URL: process.env.API_URL,
    };
    res.render('seated.njk', viewInfo);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});
