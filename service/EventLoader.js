const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { Event } = require('../models/Event.js');

class EventLoader {
  static async add(id) {
    const event = await Event.fetch({ _id: id });

    if(!event) {
      console.error(`Event ${id} could not be fetched!`);

      EventLoader.unload(id, true);
      return;
    }

    client.events.set(event.message.id, event);

    console.log(`Event ${id} fetched and added to reaction listeners.`);
  }

  static async load() {
    client.events = new Collection();

    console.log('Fetching existing events...');

    let eventIds = await db.find({ model: Event.modelType, active: true });
    eventIds = eventIds.map(p => p._id);

    console.log(`Found ${eventIds.length} events running.`);

    for(const id of eventIds) {
      await EventLoader.add(id);
    }
  }

  static async unload(id, checkDb = false) {
    const inClient = client.events.has(id);
    const inDb = checkDb ? await db.findOne({ model: Event.modelType, _id: id }) : false;

    if(inClient || inDb) {
      console.log(`Event ${id} has been deleted. Removing from records.`);

      client.events.delete(id);
      await db.remove({ model: Event.modelType, _id: id });
    }
  }

  static async archive(id) {
    console.log(`Archiving event ${id}. This event can be unarchived at any time.`);

    client.events.delete(id);
    await db.update({ model: Event.modelType, _id: id }, { $set: { active: false } });
  }

  static async unarchive(id) {
    console.log(`Unarchiving event ${id}. This event can be archived at any time.`);

    EventLoader.add(id);
  }

  static reactionHandler(reaction, user) {
    reaction.users.remove(user);

    return Event.options[reaction.emoji.name];
  }
}

module.exports = {
  EventLoader
}
