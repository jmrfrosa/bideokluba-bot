const { Collection, MessageEmbed } = require("discord.js");
const { client } = require("../util/client");
const { fetchChannel, fetchMessage } = require("../util/common");
const { toDate } = require("../util/datetime");
const { db } = require("../util/database");

class Week {
  static modelType = 'week';
  static channelName = 'eventos';

  constructor({ channel, weekStart, weekEnd, events = null, message = null }) {
    this.message = message;
    this.channel = channel;
    this.weekStart = weekStart;
    this.weekEnd = weekEnd;
    this.events = events || new Collection();
  }

  static async create({ date }) {
    const weekStart = date.day(0);
    const weekEnd = date.day(6);
    const channel = await fetchChannel({ name: Week.channelName });

    const week = new Week({ channel, weekStart, weekEnd });
    const message = await channel.send(week.render());

    week.save(message);

    return week;
  }

  static async fetch(searchParams) {
    const query = Object.fromEntries(
      Object.entries(searchParams).filter(([_, v]) => !!v));

    if(!Object.keys(query).length) return;

    const week = await db.findOne({ model: Week.modelType, ...query });

    return Week.hydrate(week);
  }

  static async hydrate(dbObj) {
    const channel = await fetchChannel({ id: dbObj.channel, fromCache: false });
    const message = await fetchMessage({ id: dbObj.message, channel, fromCache: false });

    const { weekStart, weekEnd, events } = Week.deserialize(dbObj);

    const week = new Week({
      message, channel, weekStart, weekEnd, events
    });

    return week;
  }

  async save(message) {
    this.message = message;

    const week = await db.insert(this.serialize());
    client.calendarWeeks.set(week.message.id, this);

    return week;
  }

  async addEvent(event) {
    const eventId = event.message.id;
    this.events.set(eventId, event);
    this.message.edit(this.render());

    await db.update({ model: Week.modelType, message: this.message.id }, { $addToSet: { events: eventId } });
  }

  async removeEvent(event) {
    const eventId = event.message.id;
    this.events.delete(eventId);
    this.message.edit(this.render());

    await db.update({ model: Week.modelType, message: this.message.id }, { $pull: { events: eventId } });
  }

  render() {
    const sortedEvents = this.events.sort((first, last) => first.date.unix() - last.date.unix());

    const fields = sortedEvents.map(e => (
      { name: e.title, value: e.date.format('ddd, DD/MM'), inline: false  }
    ));

    const [startDate, endDate] = [this.weekStart, this.weekEnd].map(d => d.format('DD/MM/YYYY'));

    return new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Eventos na semana ${startDate} a ${endDate}`)
      .addFields(...fields);
  }

  serialize() {
    return {
      model: Week.modelType,
      message: this.message.id,
      channel: this.channel.id,
      weekStart: this.weekStart.format('DD/MM/YYYY'),
      weekEnd: this.weekEnd.format('DD/MM/YYYY'),
      events: [...this.events.keys()]
    }
  }

  static deserialize(data) {
    const eligibleEvents = client.events.filter(e => data.events.includes(e.message.id));

    const events = new Collection(
      Array.from(eligibleEvents), (event) => ([event.message.id, event])
    );

    return {
      message: data.message.id,
      channel: data.channel.id,
      weekStart: toDate(data.weekStart),
      weekEnd: toDate(data.weekEnd),
      events
    }
  }
}

module.exports = {
  Week
}
