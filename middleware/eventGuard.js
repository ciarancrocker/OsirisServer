const db = require('../lib/database');

module.exports = async function(req, res, next) {
  if (!req.params.eventId) {
    return void res.status(401).json({status: 'err', msg: 'no_event_specified'});
  }
  const {eventId} = req.params;
  const dbQuery = await db.query('SELECT * FROM events WHERE event_id=$1', [eventId]);
  if (dbQuery.rowCount === 0) {
    return void res.status(404).json({err: 'event_not_found'});
  }
  const event = dbQuery.rows[0];
  if (event.read_only) {
    return void res.status(403).json({err: 'event_locked'});
  }
  next();
};
