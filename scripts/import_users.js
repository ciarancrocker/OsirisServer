require('dotenv').config();
const fs = require('fs');
const db = require('../lib/database');

const util = require('util');

const readFile = util.promisify(fs.readFile);

(async function() {
  // read our user data
  const userdataraw = fs.readFileSync('userInfo.json');
  const discordUsers = JSON.parse(userdataraw);

  // get the list of users
  const users = await db.query('SELECT * FROM users');
  for (const user of users.rows) {
    console.log(`Searching for user id ${user.user_id} (${user.tag})`);
    const dUser = discordUsers.find((el) => el.discord_id == user.discord_id);
    if (dUser) {
      if (user.tag != dUser.tag || user.profile_url != dUser.avatar) {
        await db.query('UPDATE users SET tag=$1, profile_url=$2 WHERE user_id=$3', [dUser.tag, dUser.avatar, user.user_id]);
        console.log('Updated');
      }
    }
  }
  await db.end();

  return;
})();
