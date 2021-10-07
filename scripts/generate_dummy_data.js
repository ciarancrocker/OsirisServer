const uuid = require('uuid');
const db = require('../lib/database');

(async function() {
    for(let eventCount = 0; eventCount < 5; eventCount++) {
        const eventId = uuid.v4();
        await db.query('INSERT INTO events (event_id, name) VALUES ($1, $2)', [eventId, `Dummy event ${eventCount + 1}`]);
    }
    for(let layoutCount = 0; layoutCount < 3; layoutCount++) {
        const layoutId = uuid.v4();
        console.log(`Generating layout ${layoutId}`);
        await db.query('INSERT INTO layouts (layout_id, name, prefix) VALUES ($1, $2, $3)', [layoutId, `Dummy layout ${layoutCount + 1}`, `DL${layoutCount + 1}`]);
        for(let x = 0; x < 10; x++) {
            for (let y = 0; y < 20; y++) {
                if (Math.random() < 0.6) {
                    const seatId = uuid.v4();
                    console.log(`Generating seat at ${x},${y}`);
                    await db.query('INSERT INTO seats (seat_id, layout_id, tag, x_pos, y_pos) VALUES ($1, $2, $3, $4, $5)', [seatId, layoutId, `${x}-${y}`, x, y]);
                }
            }
        }
    }
})();
