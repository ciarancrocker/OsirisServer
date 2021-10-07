const db = require('../lib/database');
const express = require('express');
const eventGuard = require('../middleware/eventGuard');
const jwtGuard = require('../middleware/jwtGuard');

const r = express.Router(); // eslint-disable-line new-cap

// Get event list
r.get('/', async function(req, res) {
  const events = await db.query('SELECT * FROM events ORDER BY sort_override DESC, name ASC');
  res.json(events.rows);
});

// Get event information
r.get('/:eventId', async function(req, res) {
  const event = await db.query('SELECT * FROM events WHERE event_id=$1 LIMIT 1', [req.params.eventId]);
  if (event.rowCount == 0) {
    res.status(404).json({status: 'err', msg: 'event_not_found'});
    return;
  }
  const eventLayouts = await db.query(
    'SELECT * FROM layouts WHERE layout_id IN (SELECT layout_id FROM event_layouts WHERE event_id=$1) ' +
      'ORDER BY name ASC',
    [req.params.eventId],
  );
  const returnedEvent = event.rows[0];
  returnedEvent.layouts = eventLayouts.rows || [];
  res.json(returnedEvent);
});

// Get layouts for event
r.get('/:eventId/layouts/:layoutId', async function(req, res) {
  // check that this event uses this layout
  const eventLayoutCheck = await db.query(
    'SELECT true FROM event_layouts WHERE event_id=$1 AND layout_id=$2',
    [req.params.eventId, req.params.layoutId],
  );
  if (eventLayoutCheck.rowCount != 1) {
    res.status(404).json({status: 'err', msg: 'event_has_no_such_layout'});
    return;
  }

  // get the seats from the layout
  const seats = await db.query(
    'SELECT a.seat_id,tag,x_pos,y_pos,user_id FROM seats a LEFT JOIN seat_reservations b ON ' +
      '(a.seat_id=b.seat_id AND b.event_id=$1) WHERE layout_id=$2 ORDER BY tag ASC',
    [req.params.eventId, req.params.layoutId],
  );
  res.json(seats.rows);
});

// Get seat information
r.get('/:eventId/seat/:seatId', async function(req, res) {
  const {eventId, seatId} = req.params;

  const seatQuery = await db.query(
    'SELECT a.seat_id, tag, user_id FROM seats a LEFT JOIN seat_reservations b ON ' +
      '(a.seat_id=b.seat_id AND b.event_id=$1) WHERE a.seat_id=$2 LIMIT 1',
    [eventId, seatId],
  );

  if (seatQuery.rowCount === 0) {
    res.status(404).json({status: 'err', msg: 'seat_not_found'});
    return;
  }

  res.json(seatQuery.rows[0]);
});

// Reserve seat
r.put('/:eventId/seat/:seatId', jwtGuard, eventGuard, async function(req, res) {
  const {eventId, seatId} = req.params;
  const userId = req.user.user_id;
  console.log({eventId, seatId, userId});
  try {
    const reservationQuery = await db.query(
      'INSERT INTO seat_reservations (event_id, seat_id, user_id) VALUES ($1,$2,$3) RETURNING *',
      [eventId, seatId, userId],
    );
    res.json(reservationQuery.rows[0]);
  } catch (e) {
    if (e.constraint) {
      switch (e.constraint) {
      case 'seat_reservations_event_id_user_id_key':
        res.status(400).json({status: 'err', msg: 'user_has_existing_reservation'});
        break;
      }
    } else {
      console.log(e);
      res.status(500).json({status: 'err', msg: 'unknown_error'});
    }
  }
});

r.delete('/:eventId/seat/:seatId', jwtGuard, eventGuard, async function(req, res) {
  const {eventId, seatId} = req.params;
  const userId = req.user.user_id;
  // get the reservation to validate ownership
  const reservationQuery = await db.query(
    'SELECT user_id FROM seat_reservations WHERE event_id=$1 AND seat_id=$2',
    [eventId, seatId],
  );
  if (reservationQuery.rows[0].user_id !== userId) {
    res.status(401).json({status: 'err', msg: 'not_your_reservation'});
    return;
  }
  // release the seat
  await db.query('DELETE FROM seat_reservations WHERE event_id=$1 AND seat_id=$2', [eventId, seatId]);
  res.status(204).json({status: 'ok'});
});


module.exports = r;
