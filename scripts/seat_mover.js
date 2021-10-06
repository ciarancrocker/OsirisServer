(require('dotenv')).config();
const db = require('../database');

const SEAT_QUERY = 'SELECT * FROM seat_reservations WHERE seat_id=$1 AND event_id=$2';

async function moveSeat(eventId, oldSeat, newSeat) {
  if (!eventId) {
    throw new Error('Event ID must be specified');
  }
  if (oldSeat === newSeat) {
    return;
  }
  const oldSeatQuery = await db.query(SEAT_QUERY, [oldSeat, eventId]);
  const newSeatQuery = await db.query(SEAT_QUERY, [newSeat, eventId]);
  if (oldSeatQuery.rowCount == 1 && newSeatQuery.rowCount == 1) {
    return await swapSeats(eventId, oldSeat.rows[0], newSeat.rows[0]);
  } else if (oldSeatQuery.rowCount == 1 && newSeatQuery.rowCount == 0) {
    return await directMoveSeat(eventId, oldSeatQuery.rows[0].user_id, newSeat);
  } else if (oldSeatQuery.rowCount == 0 && newSeatQuery.rowCount == 1) {
    return await directMoveSeat(eventId, newSeatQuery.rows[0].user_id, oldSeat);
  } else {
    throw new Error('No seat reservation found at all');
  }
}

async function directMoveSeats(event, user, newSeat) {
  return await db.query('UPDATE seat_reservations SET seat_id=$1 WHERE event_id=$2 AND user_id=$3', [newSeat, event, user]);
}

async function swapSeats(event, seatA, seatB) {
  await db.query('BEGIN TRANSACTION');
  // delete both
  await db.query('DELETE FROM seat_reservations WHERE event_id=$1 AND (seat_id=$2 OR seat_id=$3)', [event, seatA.seat_id, seatB.seat_id]);

  // create new reservations
  await db.query('INSERT INTO seat_reservations (event_id,seat_id,user_id) VALUES ($1, $2, $3), ($1, $4, $5)', [event, seatA.seat_id, seatB.user_id, seatB.seat_id, seatA.user_id]);
  await db.query('COMMIT');
  return;
}
