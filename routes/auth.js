const db = require('../lib/database');
const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const r = express.Router(); // eslint-disable-line new-cap

/**
  * Find and update, or create, a user with specified ID
  * @param {String} discordId User's Discord ID/Snowflake
  * @param {String} name User's name
  * @param {String} profileUrl User's profile picture URL
  */
async function findOrCreateUser(discordId, name, profileUrl) {
  // try find the user
  const userSearch = await db.query('SELECT * FROM users WHERE discord_id=$1', [discordId]);
  if (userSearch.rowCount === 0) { // there is no user, make one
    const createUserQuery = await db.query(
      'INSERT INTO users (user_id, discord_id, tag, profile_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [uuid.v4(), discordId, name, profileUrl]
    );
    return createUserQuery.rows[0];
  } else { // they exist, do we need to update them
    const foundUser = userSearch.rows[0];
    if (foundUser.tag !== name || foundUser.profile_url !== profileUrl) { // there are differences, update
      await db.query('UPDATE users SET tag=$1, profile_url=$2 WHERE user_id=$3', [name, profileUrl, foundUser.user_id]);
      foundUser.tag = name;
      foundUser.profile_url = profileUrl;
    }
    return foundUser;
  }
}

r.get('/login', function(req, res) {
  const {DISCORD_CLIENT_ID, API_URL} = process.env;
  const AUTHORIZE_URL = 'https://discordapp.com/api/oauth2/authorize';
  const params = {
    response_type: 'code',
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: `${API_URL}/api/auth/callback.discord`,
    scope: 'identify',
  };
  res.redirect(`${AUTHORIZE_URL}?${querystring.stringify(params)}`);
});

r.get('/callback.discord', async function(req, res) {
  const {DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, API_URL, APP_URL} = process.env;
  const DISCORD_TOKEN_URL = 'https://discordapp.com/api/oauth2/token';

  if (!req.query.code) {
    res.redirect(`${API_URL}/api/auth/failure?reason=noCode`);
    return;
  }

  try {
    const {code} = req.query;
    // make request to oauth for token
    const tokenRequest = new fetch.Request(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: querystring.stringify({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${API_URL}/api/auth/callback.discord`,
      }),
    });
    const tokenResponse = await fetch(tokenRequest);
    const token = await tokenResponse.json();

    if (!token.access_token) {
      return void res.status(401).json({status: 'err', msg: 'oauth_error'});
    }

    // now we get the users information
    const userRequest = new fetch.Request(
      'https://discordapp.com/api/users/@me',
      {headers: {'Authorization': `Bearer ${token.access_token}`}}
    );
    const userResponse = await fetch(userRequest);
    const user = await userResponse.json();
    let profileUrl = 'https://ciarancrocker.net/media/nigel_dickbutt.png';
    if (user.avatar) { // this can be null
      profileUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`;
    }
    const internalUser = await findOrCreateUser(user.id, `${user.username}#${user.discriminator}`, profileUrl);
    // build a jwt
    const jwtPayload = {
      iby: 'Osiris2',
      uid: internalUser.user_id,
    };
    const ourJwt = jwt.sign(jwtPayload, process.env.JWT_SECRET);
    res.redirect(`${APP_URL}/login?jwt=${ourJwt}`);
  } catch (e) {
    console.log(e);
    res.status(500);
  }
});

r.get('/success', function(req, res) {
  res.send('Authentication succeeded! Do not close this window...');
});

r.get('/failure', function(req, res) {
  res.send('Authentication failed! Do not close this window...');
});

module.exports = r;
