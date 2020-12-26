const path = require('path');
(require('dotenv')).config({path: path.resolve(process.cwd(), '../.env')});
const db = require('../database');

const regenerateAddons = require('./regen_addons.lib').regenerateAddons;

const regenerateAllAddons = async function() {
  const eventLayouts = await db.query('SELECT event_id, layout_id FROM event_layouts');
  const promises = [];
  for (const eventLayout of eventLayouts.rows) {
    console.log(`Processing event ${eventLayout.event_id} layout ${eventLayout.layout_id}`);
    await regenerateAddons(eventLayout.layout_id, eventLayout.event_id);
  }
  await Promise.all(promises);
  console.log('Complete.');
  process.exit(0);
};

if (process.argv.length == 3 && process.argv[2] === '--all') {
  regenerateAllAddons();
} else if (process.argv.length == 4) {
  regenerateAddons(process.argv[2], process.argv[3]);
} else {
  console.log('Usage: node regen_addons.js [--all | <layout-id> <event-id>]');
}
