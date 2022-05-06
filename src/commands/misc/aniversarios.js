const { MessageEmbed } = require('discord.js');
const { BirthdayHandler } = require('../service/BirthdayHandler');
const { roles  } = require('../util/constants')

module.exports = {
  name: 'aniversários',
  description: 'Activar ou desactivar a funcionalidade de dar os parabéns a utilizadores',
  args: 1,
  roles: [roles.admin, roles.moderator],
  usage: "<lembrar | esquecer>",
  guildOnly: true,
  async execute(message, args) {
    const { channel } = message;
    let msg;

    if (args[0] != 'lembrar') {
      BirthdayHandler.stop();

      msg = new MessageEmbed()
        .setTitle('📨 Lembretes de Aniversário')
        .setDescription('❌ Os lembretes de aniversário foram desactivados.')
        .setTimestamp()

      await channel.send(msg);

      return;
    }

    BirthdayHandler.start();

    msg = new MessageEmbed()
    .setTitle('📨 Lembretes de Aniversário')
    .setDescription(
      '✅ Os lembretes de aniversário foram activados!\n\n' +
      'O bideobot garante que nunca mais nos esqueceremos destas datas importantes ao automatizar de forma fria e eficiente este processo moroso.'
    )
    .setTimestamp()

    await message.channel.send(msg)
  }
}
