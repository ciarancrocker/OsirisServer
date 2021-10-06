const db = require('../lib/database');
const uuid = require('uuid');

// these are settings
const EVENT_ID = '2ddee3d7-3acb-48f2-86a3-bfd04ec662a2';
const LAYOUT_ID = 'fd47577c-da58-4fd8-be0f-aa1988df6740';
const BLOCK_PREFIX = 'B';
const USERNAME_TEMPLATE = 'Reserved';
const USERNAME_SEQUENTIAL = false;
const USER_PROFILE = 'https://ciarancrocker.net/media/sgslogo.png';

const seed = new Date().getTime();

(async function() {
  // get seats
  const {rows: seats} = await db.query('SELECT * FROM seats WHERE tag ~ $1 AND layout_id=$2 ORDER BY tag ASC', [BLOCK_PREFIX, LAYOUT_ID]);
  console.log(`Found ${seats.length} seats: ${seats.map((x) => x.tag).reduce((pre, cur) => `${pre},${cur}`)}`);
  const NUMBER_USERS = seats.length;

  const userIds = [];

  // generate user objects
  for (let i = 0; i < NUMBER_USERS; i++) {
    const userId = uuid.v4();
    const username = USERNAME_SEQUENTIAL ? `${USERNAME_TEMPLATE}${i + 1}` : USERNAME_TEMPLATE;
    console.log(`Creating user with name ${username} and ID ${userId}`);
    await db.query('INSERT INTO users (user_id, discord_id, tag, profile_url) VALUES ($1, $2, $3, $4)', [userId, `FAKE${seed + i}`, username, USER_PROFILE]);
    console.log(`Generating seat reservation for seat ${seats[i].tag} for above user`);
    await db.query('INSERT INTO seat_reservations (seat_id, user_id, event_id) VALUES ($1, $2, $3)', [seats[i].seat_id, userId, EVENT_ID]);
  }

  db.end();
})();
