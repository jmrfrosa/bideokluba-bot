const { db } = require('../util/database.js');

module.exports = {
  name: 'clear_db',
  async execute() {
    const numRecords = await db.count({});

    console.log(`Removing ${numRecords} from the database.`);

    await db.remove({}, { multi: true });

    console.log('Done.');
  }
}
