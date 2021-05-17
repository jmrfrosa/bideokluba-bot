
const { MessageEmbed } = require('discord.js');
const { client } = require("../util/client");
const { fetchMessage, fetchChannel, fetchMember } = require("../util/common");
const { db } = require("../util/database");
const { toDate } = require('../util/datetime');
const { gCalUrl } = require('../util/events');
const { Week } = require('./Week');

class Event {
  static modelType = 'event';
  static embedColor = [243, 67, 64];
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
    const name = member.displayName;

    if(state === Event.options[Event.removalOption]) return await this.remove();

    for(const [list, attendees] of this.attendance) {
      list === state ?
        attendees.add(name) :
        attendees.delete(name);
    }

    await this.message.edit(this.render());

    await db.update(
      { model: Event.modelType, message: this.message.id },
      { $set: { attendance: this.#serializeAttendance() } }
    )
  }

  async remove() {
    client.events.delete(this.message.id);

    this.week.removeEvent(this);

    await db.remove({ model: Event.modelType, message: this.message.id });
    await this.message.delete();
  }

  render() {
    const calendarField = { name: 'Links', value: `[Adicionar ao Google Calendar](${gCalUrl(this)})`, inline: false };
    const attendance = Array.from(this.attendance.entries(), ([state, attendees]) => {
      const value = attendees.size > 0 ? this.#formatAttendees([...attendees]) : '> -';

      return { name: state, value, inline: true }
    });
    const fields = [calendarField, ...attendance]

    return new MessageEmbed()
      .setAuthor('⤴️ Ver semana', null, this.week.message.url)
      .setThumbnail('https://icons-for-free.com/iconfiles/png/512/calendar-131964752454737242.png')
      .setColor(Event.embedColor)
      .setTitle(this.title)
      .setDescription(this.date.format('dddd, DD/MM'))
      .addFields(...fields)
      .setFooter(`Adicionado por ${this.author}`);
  }

  serialize() {
    const attendance = this.#serializeAttendance();

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

  #serializeAttendance() {
    return Object.fromEntries(
      Array.from(this.attendance.entries(), ([state, attendees]) => (
        [state, [...attendees]]
      ))
    );
  }

  #formatAttendees(usernames) {
    return usernames.map(u => `> ${u}`).join('\n');
  }
}

module.exports = {
  Event
}
