const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { Poll } = require('../models/Poll.js');

class PollLoader {
  static async add(id) {
    const poll = await Poll.fetch(id);

    if(!poll) {
      console.error(`Poll ${id} could not be fetched!`);

      PollLoader.unload(id, true);
      return;
    }

    client.polls.set(id, poll);

    console.log(`Poll ${id} fetched and added to reaction listeners.`);
  }

  static async load() {
    client.polls = new Collection();

    console.log('Fetching existing polls...');

    let pollIds = await db.find({ model: 'poll', active: true });
    pollIds = pollIds.map(p => p._id);

    console.log(`Found ${pollIds.length} polls running.`);

    for(const id of pollIds) {
      await PollLoader.add(id);
    }
  }

  static async unload(id, checkDb = false) {
    const inClient = client.polls.has(id);
    const inDb = checkDb ? await db.findOne({ model: 'poll', _id: id }) : false;

    if(inClient || inDb) {
      console.log(`Poll ${id} has been deleted. Removing from records.`);

      client.polls.delete(id);
      await db.remove({ model: 'poll', _id: id });
    }
  }

  static async archive(id) {
    console.log(`Archiving poll ${id}. This poll can be unarchived at any time.`);

    client.polls.delete(id);
    await db.update({ model: 'poll', _id: id }, { $set: { active: false } });
  }

  static async unarchive(id) {
    console.log(`Unarchiving poll ${id}. This poll can be archived at any time.`);

    PollLoader.add(id);
  }
}

module.exports = {
  PollLoader
}
