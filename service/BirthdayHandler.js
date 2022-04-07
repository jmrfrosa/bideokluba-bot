const nodeCron = require('node-cron');
const { MessageEmbed } = require('discord.js');
const { client } = require('../util/client');
const { fetchChannel, fetchUser } = require('../util/common');
const { channels } = require('../util/constants');
const { db } = require('../util/database');
const { now, toDate } = require('../util/datetime');

class BirthdayHandler {
  static isToday(birthday) {
    return now().isSame(toDate(birthday.date), 'day');
  }

  static async checkBirthdays() {
    console.log('Checking birthdays...')
    const birthdays = await db.find({ model: 'birthday' });

    const validBirthdays = birthdays.filter(BirthdayHandler.isToday);

    if (validBirthdays.length === 0) {
      console.log('No birthdays found today.');
      return;
    }

    const message = await BirthdayHandler.render(validBirthdays);
    const channel = await fetchChannel({ name: channels.offtopic });

    if (!channel) return;

    await channel.send(message);
  }

  static async render(birthdays) {
    const users = await Promise.all(
      birthdays.map(({ userId }) => {
        return fetchUser({ id: userId });
      })
    );

    if (users.length === 0) return;

    const mentions = users.map(user => user.toString()).join(' ');

    // return `📨 Lembrete: PARABÉNS ${mentions}!`
    return new MessageEmbed()
      .setThumbnail('https://icons-for-free.com/iconfiles/png/512/gift+pink+ribbon+icon-1320165657145611265.png')
      .setTitle('📨 Lembretes de Aniversário')
      .setDescription(`PARABÉNS ${mentions}! 🎉 🎁`)
      .setTimestamp();
  }

  static scheduler() {
    return client.birthdayScheduler ??= nodeCron.schedule(
      '* * * * * *',
      BirthdayHandler.checkBirthdays,
      {
        scheduled: false,
        timezone: 'Europe/Lisbon'
      }
    );
  }

  static start() {
    console.log('Started birthday scheduler!');

    BirthdayHandler.scheduler().start();
  }

  static stop() {
    console.log('Stopped birthday scheduler!');

    BirthdayHandler.scheduler().stop();
  }
}

module.exports = {
  BirthdayHandler
}
