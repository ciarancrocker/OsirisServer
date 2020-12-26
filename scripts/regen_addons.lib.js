const path = require('path');
(require('dotenv')).config({path: path.resolve(process.cwd(), '../.env')});
const db = require('../database');

module.exports.regenerateAddons = async function(layout, event) {
  console.log('Getting seats for layout');
  const seats = await db.query('select distinct substring(tag for 1) as block, min(y_pos) as miny, max(y_pos) as maxy, min(x_pos) as minx, max(x_pos) as maxx from seats where layout_id=$1 group by block order by block', [layout]);
  if (seats.rowCount == 0) {
    console.error('No blocks found, bailing.');
    process.exit(2);
  }
  console.log(`Got ${seats.rowCount} distinct blocks`);

  console.log('Getting event layout metadata');
  const eventMetadataQuery = await db.query('select metadata from event_layouts where layout_id=$1 and event_id=$2', [layout, event]);
  const eventMetadata = eventMetadataQuery.rows[0].metadata;
  const blocks = eventMetadata.blocks || [];
  const key = eventMetadata.key || [];
  console.log(`Got metadata with ${blocks.length} block information snippets and ${key.length} key elements`);

  console.log(`Removing {rectanlge,text} addons for this layout`);
  await db.query('delete from layout_addons where layout_id=$1 and event_id=$2', [layout, event]);

  console.log(`Generating addons for ${seats.rowCount} blocks`);
  for (const block of seats.rows) {
    console.log(`Generating addon for ${block.block}`);
    const meta = blocks.find((el) => el.block === block.block) || {};
    const rectAddon = {
      type: 'rectangle',
      xPos: block.minx - 0.25,
      yPos: block.miny - 0.25,
      xPos2: block.maxx + 0.25,
      yPos2: block.maxy + 0.25,
      rx: 2,
      ry: 2,
      fill: meta.fill || 'lightblue',
    };
    const textAddon = {
      type: 'text',
      xPos: block.minx - 1.25,
      yPos: ((block.maxy - block.miny) / 2 + block.miny) + 0.25,
      content: block.block,
    };
    if (block.minx == 0) {
      textAddon.xPos = block.maxx + 1.25;
    };
    console.log(block);
    await db.query('insert into layout_addons (layout_id,addon,event_id) values ($1,$2,$3)', [layout, rectAddon, event]);
    await db.query('insert into layout_addons (layout_id,addon,event_id) values ($1,$2,$3)', [layout, textAddon, event]);
  }

  return;
};
