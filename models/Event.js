
const { MessageEmbed } = require('discord.js');
const { client } = require("../util/client");
const { fetchMessage, fetchChannel, fetchMember } = require("../util/common");
const { db } = require("../util/database");
const { toDate } = require('../util/datetime');
const { Week } = require('./Week');

class Event {
  static modelType = 'event';
  static options = {
    '✅': '✅ vou',
    '❌': '❌ não vou',
    '🤷‍♂️': '🤷‍♂️ talvez',
    '🗑': 'remover'
  };
  static removalOption = '🗑';

  constructor({ channel, title, date, author, message = null, attendance = null, active = true, week = null }) {
    this.title = title;
    this.date = date;
    this.author = author;
    this.active = active;
    this.channel = channel;
    this.message = message;
    this.week = week;

    const { [Event.removalOption]: _, ...states } = Event.options;

    this.attendance = attendance ||
      new Map(Object.values(states).map(s => [s, new Set()]));
  }

  static async fetch(searchParams) {
    const query = Object.fromEntries(
      Object.entries(searchParams).filter(([_, v]) => !!v));

    if(!Object.keys(query).length) return;

    const event = await db.findOne({ model: Event.modelType, ...query });

    return Event.hydrate(event);
  }

  static async hydrate(dbObj) {
    const channel = await fetchChannel({ id: dbObj.channel, fromCache: false });
    const message = await fetchMessage({ id: dbObj.message, channel, fromCache: false });

    const { title, date, author, attendance, week, active } = Event.deserialize(dbObj);

    return new Event({
      message, channel, title, date, author, attendance, week, active
    });
  }

  async save(message) {
    this.message = message;

    await this.addToWeek();
    const event = await db.insert(this.serialize());
    client.events.set(message.id, this);

    return event;
  }

  async addToWeek() {
    const week =
      client.calendarWeeks.find(w => this.date.isBetween(w.weekStart, w.weekEnd, null, '[]')) ||
      await Week.create({ date: this.date });

    this.week = week;
    week.addEvent(this);
  }

  async archive() {
    this.active = false;
    const id = this.message.id;

    client.events.delete(id);

    return await db.update({ model: Event.modelType, message: id}, { $set: { active: false } });
  }

  async unarchive() {
    this.active = true;
    const id = this.message.id;

    client.events.set(id, this);

    return await db.update({ model: Event.modelType, message: id}, { $set: { active: true } });
  }

  async updateUser({ user, state }) {
    const member = await fetchMember({ guild: this.message.guild, username: user.username });
    const nickname = member.nickname;

    if(state === Event.options[Event.removalOption]) return await this.remove();

    for(const [list, attendees] of this.attendance) {
      list === state ?
        attendees.add(nickname) :
        attendees.delete(nickname);
    }

    await this.message.edit(this.render());
  }

  async remove() {
    client.events.delete(this.message.id);

    this.week.removeEvent(this);

    await db.remove({ model: Event.modelType, message: this.message.id });
    await this.message.delete();
  }

  render() {
    const fields = Array.from(this.attendance.entries(), ([state, attendees]) => {
      const value = attendees.size > 0 ? `> ${[...attendees].join('\n')}` : '> -';

      return { name: state, value, inline: true }
    });

    return new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(this.title)
      .setAuthor(this.author)
      .setDescription(this.date.format('ddd, DD/MM'))
      .addFields(...fields);
  }

  serialize() {
    const attendance = Object.fromEntries(
      Array.from(this.attendance.entries(), ([state, attendees]) => (
        [state, [...attendees]]
      ))
    );

    return {
      model: Event.modelType,
      message: this.message.id,
      channel: this.message.channel.id,
      title: this.title,
      date: this.date.format('DD/MM/YYYY'),
      author: this.author,
      attendance,
      week: this.week.message.id,
      active: this.active
    }
  }

  static deserialize(data) {
    const attendance = new Map(
      Object.entries(data.attendance).map(([k, v]) => ([k, new Set(v)]))
    );

    return {
      model: Event.modelType,
      message: data.message.id,
      channel: data.channel.id,
      title: data.title,
      date: toDate(data.date),
      author: data.author,
      attendance,
      week: data.week,
      active: data.active
    }
  }
}

module.exports = {
  Event
}
