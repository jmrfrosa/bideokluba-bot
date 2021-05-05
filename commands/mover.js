const { prefix } = require('../config.js');
const { fetchChannel, parseMessageId, fetchMessage } = require('../util/common.js');
const { roles } = require('../util/constants.js');

module.exports = {
  name: 'mover',
  description: 'Mover uma ou mais mensagens para outro canal',
  args: 2,
  roles: [roles.admin, roles.moderator],
  usage: "<channel_name> ...<message_url>",
  guildOnly: true,
  async execute(message, args) {
    const msgs = args.slice(1).map(mId => parseMessageId(mId));
    const channel = fetchChannel({ name: args[0] });

    if (!channel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    for (const id of msgs) {
      const msg = await fetchMessage({ id, channel: message.channel, fromCache: false });

      const dateOpts = { dateStyle: 'full', timeStyle: 'long' };
      const msgDate = new Intl.DateTimeFormat('pt-PT', dateOpts).format(msg.createdAt)

      const header = `_Mensagem movida_ (${msg.channel})`;
      let movedMessage = `${header}\n${msg.member} | ${msgDate}\n\n${msg.content}`

      const files = msg.attachments.map(file => file.proxyURL);

      await channel.send(movedMessage, {
        files: files,
        embeds: msg.embeds
      });

      await msg.delete();
    }
  }
}
