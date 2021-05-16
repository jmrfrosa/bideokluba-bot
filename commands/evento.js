const { Event } = require('../models/Event.js');
const { fetchChannel } = require('../util/common.js');
const { roles } = require('../util/constants.js');
const { toDate } = require('../util/datetime.js');

module.exports = {
  name: 'evento',
  description: 'Criar um evento.',
  args: 2,
  roles: [roles.active],
  usage: '<title> <date> [channel]',
  guildOnly: true,
  execute: async (message, args) => {
    const title = args[0].replaceAll('"', '');
    const date = toDate(args[1]);
    const channel = args[2] ? fetchChannel({ name: args[2] }) : message.channel;
    const author = message.member.nickname;

    if (!channel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    const event = new Event({ channel, title, date, author });
    const body = event.render();
    const sentMsg = await channel.send(body);

    const reactionPromises = Object.keys(Event.options).map((reaction) => sentMsg.react(reaction));
    await Promise.all(reactionPromises);

    event.save(sentMsg);
  }
}
