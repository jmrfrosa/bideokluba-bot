const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { Event } = require('../models/Event.js');
const { now, toDate } = require('../util/datetime.js');
const { logger } = require('../util/logger.js');

class EventLoader {
  static async add(id) {
    const event = await Event.fetch({ _id: id });

    if(!event) {
      logger.warn(`Event ${id} could not be fetched!`)

      EventLoader.unload(id, true);
      return;
    }

    client.events.set(event.message.id, event);

    logger.info(`Event ${id} fetched and added to reaction listeners.`);
  }

  static async load() {
    client.events = new Collection();

    logger.info('Fetching existing events...');

    let dbEvents = await db.find({ model: Event.modelType, active: true });

    logger.info(`Found ${dbEvents.length} events running.`);

    for(const event of dbEvents) {
      const outdatedEvent = event.date && now().isAfter(toDate(event.date))

      if (!outdatedEvent) await EventLoader.add(event._id);
    }
  }

  static async unload(id, checkDb = false) {
    const inClient = client.events.has(id);
    const inDb = checkDb ? await db.findOne({ model: Event.modelType, _id: id }) : false;

    if(inClient || inDb) {
      logger.info(`Event ${id} has been deleted. Removing from records.`);

      client.events.delete(id);
      await db.remove({ model: Event.modelType, _id: id });
    }
  }

  static async archive(id) {
    logger.info(`Archiving event ${id}. This event can be unarchived at any time.`);

    client.events.delete(id);
    await db.update({ model: Event.modelType, _id: id }, { $set: { active: false } });
  }

  static async unarchive(id) {
    logger.info(`Unarchiving event ${id}. This event can be archived at any time.`);

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
