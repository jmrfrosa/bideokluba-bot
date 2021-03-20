const { prefix } = require('../config.js');

const neededRole = 'Fundador';

module.exports = {
  name: 'mover',
  description: 'Mover uma mensagem para outro canal',
  args: true,
  usage: "<message_url> <channel_name>",
  guildOnly: true,
  execute(message, args) {
    const hasRole = message.member.roles.cache.some(role => role.name === neededRole);

    if (!hasRole) {
      message.reply(`O teu pedido foi recusado, ${message.member}, pára de me assediar.`);
      return;
    }

    if(args.length < 2) {
      message.reply(`Uso incorrecto, lê as instruções!\n\`${prefix}${this.name} ${this.usage}\``);
      return;
    }

    const messageId = parseMessageId(args[0]);
    const targetChannel = message.client.channels.cache.find(ch => ch.name === args[1])

    if (!targetChannel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    message.channel.messages.fetch(messageId)
      .then(msg => {
        const dateOpts = { dateStyle: 'full', timeStyle: 'long' };
        // const msgDate = msg.createdAt.toLocaleDateString('pt-PT', dateOpts);
        const msgDate = new Intl.DateTimeFormat('pt-PT', dateOpts).format(msg.createdAt)

        const header = `_Mensagem movida_ (${msg.channel})`;
        let movedMessage = `${header}\n${msg.member} | ${msgDate}\n\n${msg.content}`

        const files = msg.attachments.map(file => file.proxyURL);

        targetChannel.send(movedMessage, {
          files: files,
          embeds: msg.embeds
        });

        msg.delete();
        message.delete();
      }).catch((error) => {
        console.error(error);

        message.reply(`Ocorreu um erro com o teu comando! Verifica os argumentos e volta a tentar.`);
        return;
      });
  }
}

function parseMessageId(content) {
  if (content.search(/^(https:\/\/discord.com\/channels\/)/) >= 0)
    return content.substring(content.lastIndexOf('/') + 1)

  return content;
}
