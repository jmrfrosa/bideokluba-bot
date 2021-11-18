const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { Week } = require('../models/Week.js');
const { now, toDate } = require('../util/datetime.js');

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

    const dbWeeks = await db.find({ model: Week.modelType });

    console.log(`Found ${dbWeeks.length} weeks in calendar.`);

    for(const week of dbWeeks) {
      const outdatedWeek = week.weekEnd && now().isAfter(toDate(week.weekEnd))

      if (!outdatedWeek) await WeekLoader.add(week._id);
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
