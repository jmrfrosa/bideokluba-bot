const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { Week } = require('../models/Week.js');

class WeekLoader {
  static async add(id) {
    const week = await Week.fetch({ _id: id });

    if(!week) {
      console.error(`Week ${id} could not be fetched!`);

      WeekLoader.unload(id, true);
      return;
    }

    client.calendarWeeks.set(week.message.id, week);

    console.log(`Calendar week ${id} fetched.`);
  }

  static async load() {
    client.calendarWeeks = new Collection();

    console.log('Fetching calendar...');

    let weekIds = await db.find({ model: Week.modelType });
    weekIds = weekIds.map(w => w._id);

    console.log(`Found ${weekIds.length} weeks in calendar.`);

    for(const id of weekIds) {
      await WeekLoader.add(id);
    }

    WeekLoader.syncEvents();
  }

  static async unload(id, checkDb = false) {
    const inClient = client.calendarWeeks.has(id);
    const inDb = checkDb ? await db.findOne({ model: Week.modelType, _id: id }) : false;

    if(inClient || inDb) {
      console.log(`Week ${id} has been deleted. Removing from records.`);

      client.calendarWeeks.delete(id);
      await db.remove({ model: Week.modelType, _id: id });
    }
  }

  static syncEvents() {
    client.calendarWeeks.forEach(week => {
      week.events.forEach(event => {
        event.week = week;
      });
    });
  }
}

module.exports = {
  WeekLoader
}
