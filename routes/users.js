const express = require('express');
const db = require('../lib/database');
const jwtGuard = require('../middleware/jwtGuard');

const r = express.Router(); // eslint-disable-line new-cap

r.get('/@me', jwtGuard, async function(req, res) {
  res.json(req.user);
});

r.get('/:userId', async function(req, res) {
  const userQuery = await db.query('SELECT user_id, tag, profile_url FROM users WHERE user_id=$1', [req.params.userId]);
  if (userQuery.rowCount === 0) {
    res.status(404).json({status: 'err', msg: 'user_not_found'});
    return;
  }

  res.json(userQuery.rows[0]);
});

module.exports = r;
