const { db } = require('../util/database.js');

module.exports = {
  name: 'archive_polls',
  async execute() {
    const query = { model: 'poll' }
    const numRecords = await db.count(query);

    console.log(`Archiving ${numRecords} polls.`);

    await db.update(query, { $set: { active: false } });

    console.log('Done.');
  }
}
