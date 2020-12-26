const jwt = require('jsonwebtoken');
const db = require('../lib/database');

module.exports = async function(req, res, next) {
  const authorization = req.headers.Authorization ||
    req.headers.authorization ||
    undefined;
  if (!authorization) {
    res.status(401).json({err: 'no_authentication_provided'});
  } else {
    const authComponents = authorization.split(' ');
    if (authComponents.length !== 2 || authComponents[0] !== 'Bearer') {
      res.status(401).json({err: 'invalid_authentication'});
    } else {
      jwt.verify(authComponents[1], process.env.JWT_SECRET, async function(err, decoded) {
        if (err || !decoded) {
          return void res.status(500).json({err: 'authentication_error'});
        }
        const userQuery = await db.query('SELECT user_id, discord_id, tag, profile_url FROM users WHERE user_id=$1',
          [decoded.uid]);
        req.user = userQuery.rows[0];
        next();
      });
    }
  }
};
